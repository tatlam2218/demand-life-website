// POST /api/admin/setup-sheets
// One-time provisioner: creates Drive sub-folders + 5 Google Sheets and writes their IDs to KV.
//
// ⚠️  IMPORTANT — SERVICE ACCOUNT QUOTA LIMITATION
// ──────────────────────────────────────────────────
// Google Drive imposes a storage-quota check on the *authenticated user* (the service account)
// when it creates ANY Google Workspace file (Sheets, Docs, Slides), even via the Drive API
// with `supportsAllDrives=true`.  Because the service account's own Drive quota is fixed and
// very small, automated sheet creation will fail with `storageQuotaExceeded` unless the SA's
// quota has been cleared.
//
// RECOMMENDED (MANUAL) REGISTRATION APPROACH — POST /api/admin/setup-sheets-register
// 1. Open Google Drive as the *workspace owner* (not the SA).
// 2. Create 5 blank Google Sheets (in any folder you like):
//      • Demain Life - Bookings YYYY
//      • Demain Life - Rooms
//      • Demain Life - Payments YYYY
//      • Demain Life - Shop Orders YYYY
//      • Demain Life - Shop Inventory
// 3. Share each sheet with the service account email (Editor access).
// 4. POST each sheet ID to /api/admin/register-sheet  — or use gsk hosted d1_execute
//    to write the KV keys directly:
//      sheet-id:bookings, sheet-id:rooms, sheet-id:payments,
//      sheet-id:shop-orders, sheet-id:shop-inventory
// 5. After registering, call POST /api/admin/init-headers to write column headers
//    to all 5 sheets in one request.
//
// This endpoint still attempts automated creation for environments where the SA quota
// is not exhausted (e.g. a freshly provisioned SA).  Body: { confirm: "MIGRATE_SHEETS" }
//
// KV keys written on success:
//   active-sheet-id           → Bookings sheet ID (legacy compat alias)
//   sheet-id:bookings         → Bookings sheet ID
//   sheet-id:rooms            → Rooms sheet ID
//   sheet-id:payments         → Payments sheet ID
//   sheet-id:shop-orders      → Shop Orders sheet ID
//   sheet-id:shop-inventory   → Shop Inventory sheet ID
//   folder-id:stay            → Demain Life - Stay Drive folder ID
//   folder-id:shop            → Demain Life - Shop Drive folder ID

import { requireAuth, json, readJson } from '../_utils.js'

const ROOMS_HEADER = [
  'Room ID', 'Block', 'Room', 'Status',
  'Current Booking ID', 'Current Guest', 'Room Config',
  'Move-in Date', 'Move-out Date', 'Duration', 'Assigned At',
  'History Count', 'Updated At'
]

const BOOKINGS_HEADER = [
  'Booking ID', 'Created At', 'Status',
  'Name', 'Email', 'Phone', 'Nationality',
  'Room Type', 'Move-in Date', 'Duration', 'Occupancy',
  'Message', 'Source Language',
  'Drive Folder', 'Drive Folder ID',
  'Contact Method', 'WhatsApp Number', 'WeChat ID',
  'Total Outstanding', 'Total Paid', 'Latest Payment Request', 'Latest Payment Status',
  'Contract Signed At', 'Contract Hash', 'Signature Method',
  'Doc Type', 'Doc Number', 'Name (Romanized)', 'Name (Chinese)',
  'Date of Birth', 'Gender', 'Occupation', 'Current Address',
  'Emergency Name', 'Emergency Relation', 'Emergency Phone', 'Emergency Email',
  'Special Requests', 'Signature', 'Details Submitted At', 'AI Assisted',
  'Assigned Block', 'Assigned Room', 'Room Config', 'Assigned At', 'Move-out Date'
]

const PAYMENTS_HEADER = [
  'Payment ID', 'Invoice Number', 'Booking ID', 'Guest Name', 'Amount HKD',
  'Status', 'Type', 'Method',
  'Created At', 'Approved At', 'Approved By',
  'Description', 'Screenshot URL', 'Notes'
]

const SHOP_ORDERS_HEADER = [
  'Order ID', 'Created At', 'Status',
  'Customer Name', 'Email', 'Phone',
  'Items (JSON)', 'Item Count', 'Subtotal HKD', 'Shipping HKD', 'Total HKD',
  'Payment Method', 'Payment Status', 'Paid At',
  'Shipping Address', 'Country', 'Tracking Number',
  'Shipped At', 'Delivered At',
  'Notes'
]

const SHOP_INVENTORY_HEADER = [
  'SKU', 'Product Name (EN)', 'Product Name (中)', 'Category',
  'Stock', 'Price HKD', 'Cost HKD',
  'Supplier', 'Variant', 'Last Restocked',
  'Status', 'Notes', 'Image URL', 'Updated At'
]

async function driveCreateFolder(env, parentId, name) {
  const { driveAccessToken } = await import('../_google_internal.js')
  const token = await driveAccessToken(env)
  const resp = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    })
  })
  if (!resp.ok) throw new Error(`Folder create failed: ${resp.status} ${await resp.text()}`)
  const data = await resp.json()
  return data.id
}

async function driveFindFolder(env, parentId, name) {
  const { driveAccessToken } = await import('../_google_internal.js')
  const token = await driveAccessToken(env)
  const q = encodeURIComponent(`name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`)
  const resp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
    headers: { authorization: `Bearer ${token}` }
  })
  if (!resp.ok) return null
  const data = await resp.json()
  return data.files?.[0]?.id || null
}

// Create a Google Sheet via Drive API with mimeType application/vnd.google-apps.spreadsheet.
// ⚠️  Will fail with storageQuotaExceeded if the service account's Drive quota is exhausted.
// In that case use the manual registration approach described in the file header comment.
async function sheetsCreate(env, title, headers, parentFolderId) {
  const { sheetsAccessToken, driveAccessToken } = await import('../_google_internal.js')
  const sheetsToken = await sheetsAccessToken(env)
  const driveToken = await driveAccessToken(env)

  // Drive API creates a Sheets file directly in the specified folder.
  // This may fail with storageQuotaExceeded — see file header for manual workaround.
  const createResp = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
    method: 'POST',
    headers: { authorization: `Bearer ${driveToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      name: title,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: parentFolderId ? [parentFolderId] : []
    })
  })
  if (!createResp.ok) {
    const errText = await createResp.text()
    if (errText.includes('storageQuotaExceeded')) {
      throw new Error(
        `Service account Drive quota exceeded. Cannot auto-create "${title}". ` +
        'Use the manual registration approach: create the sheet as a workspace user, ' +
        'share it with the SA, then register the ID via d1_execute or /api/admin/register-sheet. ' +
        'After registering all 5 sheets, call POST /api/admin/init-headers to write column headers.'
      )
    }
    throw new Error(`Sheet create via Drive: ${createResp.status} ${errText}`)
  }
  const created = await createResp.json()
  const sheetId = created.id

  // Discover actual first tab name (Drive-created sheets default to "Sheet1")
  const metaInit = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`, {
    headers: { authorization: `Bearer ${sheetsToken}` }
  }).then(r => r.json())
  const firstTabName = metaInit.sheets?.[0]?.properties?.title || 'Sheet1'
  const firstTabId = metaInit.sheets?.[0]?.properties?.sheetId ?? 0

  // Write headers to row 1
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(firstTabName)}!A1:Z1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${sheetsToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: [headers] })
  })

  // Bold + freeze header row
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${sheetsToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          repeatCell: {
            range: { sheetId: firstTabId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.96, green: 0.94, blue: 0.89 } } },
            fields: 'userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColor'
          }
        },
        {
          updateSheetProperties: {
            properties: { sheetId: firstTabId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount'
          }
        }
      ]
    })
  })

  return { sheetId, url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit` }
}

export async function onRequestPost({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ error: 'unauthorized' }, 401)
  }
  const body = await readJson(request).catch(() => ({}))
  if (body.confirm !== 'MIGRATE_SHEETS') {
    return json({
      error: 'confirmation_required',
      hint: 'POST with {"confirm":"MIGRATE_SHEETS"}',
      manualAlternative: (
        'If automated creation fails due to SA Drive quota: ' +
        '(1) Create 5 blank sheets as a workspace user, share each with the SA as Editor. ' +
        '(2) Register IDs via gsk hosted d1_execute into KV keys: ' +
        'sheet-id:bookings, sheet-id:rooms, sheet-id:payments, sheet-id:shop-orders, sheet-id:shop-inventory. ' +
        '(3) Call POST /api/admin/init-headers to write all column headers.'
      )
    }, 400)
  }

  const root = env.GOOGLE_DRIVE_FOLDER_ID
  if (!root) return json({ error: 'GOOGLE_DRIVE_FOLDER_ID not configured' }, 500)

  const result = { folders: {}, sheets: {}, log: [] }

  try {
    // Step 1: Find or create Stay folder
    let stayFolderId = await driveFindFolder(env, root, 'Demain Life - Stay')
    if (!stayFolderId) {
      stayFolderId = await driveCreateFolder(env, root, 'Demain Life - Stay')
      result.log.push('Created folder: Demain Life - Stay')
    } else {
      result.log.push('Reusing existing folder: Demain Life - Stay')
    }
    result.folders.stay = { id: stayFolderId, url: `https://drive.google.com/drive/folders/${stayFolderId}` }

    // Step 2: Find or create Shop folder
    let shopFolderId = await driveFindFolder(env, root, 'Demain Life - Shop')
    if (!shopFolderId) {
      shopFolderId = await driveCreateFolder(env, root, 'Demain Life - Shop')
      result.log.push('Created folder: Demain Life - Shop')
    } else {
      result.log.push('Reusing existing folder: Demain Life - Shop')
    }
    result.folders.shop = { id: shopFolderId, url: `https://drive.google.com/drive/folders/${shopFolderId}` }

    // Step 3: Create 5 Sheets (sequential to avoid rate limits)
    // ⚠️  May fail with storageQuotaExceeded — see file header comment for manual fallback.
    const year = new Date().getUTCFullYear()

    const bookings = await sheetsCreate(env, `Demain Life - Bookings ${year}`, BOOKINGS_HEADER, stayFolderId)
    result.log.push(`Created bookings sheet: ${bookings.sheetId}`)
    const rooms = await sheetsCreate(env, 'Demain Life - Rooms', ROOMS_HEADER, stayFolderId)
    result.log.push(`Created rooms sheet: ${rooms.sheetId}`)
    const payments = await sheetsCreate(env, `Demain Life - Payments ${year}`, PAYMENTS_HEADER, stayFolderId)
    result.log.push(`Created payments sheet: ${payments.sheetId}`)
    const shopOrders = await sheetsCreate(env, `Demain Life - Shop Orders ${year}`, SHOP_ORDERS_HEADER, shopFolderId)
    result.log.push(`Created shop-orders sheet: ${shopOrders.sheetId}`)
    const shopInventory = await sheetsCreate(env, 'Demain Life - Shop Inventory', SHOP_INVENTORY_HEADER, shopFolderId)
    result.log.push(`Created shop-inventory sheet: ${shopInventory.sheetId}`)

    result.sheets = { bookings, rooms, payments, shopOrders, shopInventory }

    // Step 4: Persist Sheet IDs to KV
    await env.DEMAIN_DATA.put('active-sheet-id', bookings.sheetId)
    await env.DEMAIN_DATA.put('sheet-id:bookings', bookings.sheetId)
    await env.DEMAIN_DATA.put('sheet-id:rooms', rooms.sheetId)
    await env.DEMAIN_DATA.put('sheet-id:payments', payments.sheetId)
    await env.DEMAIN_DATA.put('sheet-id:shop-orders', shopOrders.sheetId)
    await env.DEMAIN_DATA.put('sheet-id:shop-inventory', shopInventory.sheetId)
    await env.DEMAIN_DATA.put('folder-id:stay', stayFolderId)
    await env.DEMAIN_DATA.put('folder-id:shop', shopFolderId)
    result.log.push('Saved Sheet & Folder IDs to KV')

    return json({ success: true, ...result })
  } catch (err) {
    result.log.push('ERROR: ' + err.message)
    return json({
      error: err.message,
      partial: result,
      manualFallback: (
        'Automated creation failed. Follow the manual registration approach: ' +
        '(1) Create 5 blank Google Sheets as a workspace user. ' +
        '(2) Share each sheet with the SA email (from /api/admin/sa-info) as Editor. ' +
        '(3) Register the 5 sheet IDs in KV via gsk hosted d1_execute. ' +
        '(4) Call POST /api/admin/init-headers to initialize all column headers.'
      )
    }, 500)
  }
}
