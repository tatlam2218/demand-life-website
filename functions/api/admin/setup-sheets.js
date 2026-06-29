// POST /api/admin/setup-sheets
// One-time migration: create 5 new Sheets in 2 sub-folders, delete old one.
// Body: { confirm: "MIGRATE_SHEETS" }
//
// Result stored in KV:
//   active-sheet-id           → Bookings 2026 (for current legacy compatibility)
//   sheet-id:bookings         → Bookings 2026
//   sheet-id:rooms            → Rooms (永久)
//   sheet-id:payments         → Payments 2026
//   sheet-id:shop-orders      → Shop Orders 2026
//   sheet-id:shop-inventory   → Shop Inventory (永久)
//   folder-id:stay            → Demain Life - Stay folder
//   folder-id:shop            → Demain Life - Shop folder

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

async function sheetsCreate(env, title, headers, parentFolderId, templateSheetId) {
  const { sheetsAccessToken, driveAccessToken } = await import('../_google_internal.js')
  const sheetsToken = await sheetsAccessToken(env)
  const driveToken = await driveAccessToken(env)

  let sheetId
  if (templateSheetId) {
    // Copy the user-owned template Sheet (works around Service Account storage quota)
    const copyResp = await fetch(`https://www.googleapis.com/drive/v3/files/${templateSheetId}/copy?supportsAllDrives=true`, {
      method: 'POST',
      headers: { authorization: `Bearer ${driveToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: title, parents: parentFolderId ? [parentFolderId] : undefined })
    })
    if (!copyResp.ok) throw new Error(`Sheet copy: ${copyResp.status} ${await copyResp.text()}`)
    const copied = await copyResp.json()
    sheetId = copied.id
  } else {
    // Fallback: direct create (won't work without storage quota)
    const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: { authorization: `Bearer ${sheetsToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        properties: { title },
        sheets: [{ properties: { title: 'Data' } }]
      })
    })
    if (!createResp.ok) throw new Error(`Sheet create: ${createResp.status} ${await createResp.text()}`)
    const created = await createResp.json()
    sheetId = created.spreadsheetId

    if (parentFolderId) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${sheetId}?addParents=${parentFolderId}&removeParents=root&supportsAllDrives=true`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${driveToken}` }
      })
    }
  }

  // Clear any existing data and set new headers
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z:clear`, {
    method: 'POST',
    headers: { authorization: `Bearer ${sheetsToken}` }
  })

  // 3. Write headers
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data!A1:Z1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${sheetsToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: [headers] })
  })

  // 4. Bold header row
  const meta = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`, {
    headers: { authorization: `Bearer ${sheetsToken}` }
  }).then(r => r.json())
  const firstTabId = meta.sheets?.[0]?.properties?.sheetId

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
      hint: 'POST with {"confirm":"MIGRATE_SHEETS"}'
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

    // Step 3: Create 5 Sheets by COPYING the user-owned template (so they belong to the user)
    const year = new Date().getUTCFullYear()
    const templateId = env.GOOGLE_SHEET_ID  // The original user-owned Sheet acts as template
    if (!templateId) throw new Error('GOOGLE_SHEET_ID not configured (needed as template for copy)')

    // Run sequentially to avoid Drive API rate limits
    const bookings = await sheetsCreate(env, `Demain Life - Bookings ${year}`, BOOKINGS_HEADER, stayFolderId, templateId)
    result.log.push(`Created: ${bookings.sheetId}`)
    const rooms = await sheetsCreate(env, 'Demain Life - Rooms', ROOMS_HEADER, stayFolderId, templateId)
    result.log.push(`Created: ${rooms.sheetId}`)
    const payments = await sheetsCreate(env, `Demain Life - Payments ${year}`, PAYMENTS_HEADER, stayFolderId, templateId)
    result.log.push(`Created: ${payments.sheetId}`)
    const shopOrders = await sheetsCreate(env, `Demain Life - Shop Orders ${year}`, SHOP_ORDERS_HEADER, shopFolderId, templateId)
    result.log.push(`Created: ${shopOrders.sheetId}`)
    const shopInventory = await sheetsCreate(env, 'Demain Life - Shop Inventory', SHOP_INVENTORY_HEADER, shopFolderId, templateId)
    result.log.push(`Created: ${shopInventory.sheetId}`)

    result.sheets = {
      bookings,
      rooms,
      payments,
      shopOrders,
      shopInventory
    }
    result.log.push('Created 5 sheets in parallel')

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
    return json({ error: err.message, partial: result }, 500)
  }
}
