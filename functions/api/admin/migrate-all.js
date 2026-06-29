// POST /api/admin/migrate-all
// Master migration: cleanup old Sheet/Drive, organize folders, configure new 5-sheet structure.
//
// Body: { confirm: "MIGRATE_ALL", sheetIds: { bookings, rooms, payments, shopOrders, shopInventory } }

import { requireAuth, json, readJson } from '../_utils.js'
import { BLOCK_NUMBERS, ROOM_NUMBERS, roomId } from '../_rooms.js'

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

async function setSheetHeader(env, sheetId, headers) {
  const { sheetsAccessToken } = await import('../_google_internal.js')
  const token = await sheetsAccessToken(env)

  // Get the first sheet tab name (usually "Sheet1")
  const meta = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`, {
    headers: { authorization: `Bearer ${token}` }
  }).then(r => r.json())
  const firstTab = meta.sheets?.[0]?.properties
  const tabName = firstTab?.title || 'Sheet1'
  const firstTabId = firstTab?.sheetId

  // Clear and write headers
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A:Z:clear`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` }
  })
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A1:${String.fromCharCode(64 + headers.length)}1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: [headers] })
  })

  // Format: bold header + frozen first row + light background
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
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

  return tabName
}

async function driveListFolder(env, folderId) {
  const { driveAccessToken } = await import('../_google_internal.js')
  const token = await driveAccessToken(env)
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`)
  const resp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType)&pageSize=200`, {
    headers: { authorization: `Bearer ${token}` }
  })
  if (!resp.ok) return []
  const data = await resp.json()
  return data.files || []
}

async function driveCreateFolder(env, parentId, name) {
  const { driveAccessToken } = await import('../_google_internal.js')
  const token = await driveAccessToken(env)
  const resp = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    })
  })
  if (!resp.ok) throw new Error(`folder create: ${await resp.text()}`)
  const data = await resp.json()
  return data.id
}

async function driveMove(env, fileId, fromParent, toParent) {
  const { driveAccessToken } = await import('../_google_internal.js')
  const token = await driveAccessToken(env)
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${toParent}&removeParents=${fromParent}&supportsAllDrives=true`,
    { method: 'PATCH', headers: { authorization: `Bearer ${token}` } }
  )
  return resp.ok
}

async function driveTrash(env, fileId) {
  const { driveAccessToken } = await import('../_google_internal.js')
  const token = await driveAccessToken(env)
  const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ trashed: true })
  })
  return resp.ok
}

async function writeRoomsSheet(env, sheetId) {
  const { sheetsAccessToken } = await import('../_google_internal.js')
  const token = await sheetsAccessToken(env)

  // Get tab name
  const meta = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`, {
    headers: { authorization: `Bearer ${token}` }
  }).then(r => r.json())
  const tabName = meta.sheets?.[0]?.properties?.title || 'Sheet1'

  // Build 504 rows
  const rows = []
  for (const b of BLOCK_NUMBERS) {
    for (const r of ROOM_NUMBERS) {
      const id = roomId(b, r)
      const stored = await env.DEMAIN_DATA.get(`room:${id}`, 'json')
      const t = stored?.currentTenancy
      rows.push([
        id, String(b), r,
        t ? (t.status || 'assigned') : 'vacant',
        t?.bookingId || '', t?.guestName || '', t?.roomConfig || '',
        t?.moveInDate || '', t?.moveOutDate || '', t?.duration || '',
        t?.assignedAt || '',
        String((stored?.history || []).length),
        new Date().toISOString()
      ])
    }
  }

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A2:M${rows.length + 1}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: rows })
  })

  return rows.length
}

export async function onRequestPost({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: 'unauthorized' }, 401)

  const body = await readJson(request).catch(() => ({}))
  if (body.confirm !== 'MIGRATE_ALL') {
    return json({ error: 'confirmation_required', hint: 'POST {"confirm":"MIGRATE_ALL","sheetIds":{...}}' }, 400)
  }
  const ids = body.sheetIds || {}
  const required = ['bookings', 'rooms', 'payments', 'shopOrders', 'shopInventory']
  for (const k of required) {
    if (!ids[k]) return json({ error: `Missing sheetIds.${k}` }, 400)
  }

  const log = []
  const result = {}

  try {
    const root = env.GOOGLE_DRIVE_FOLDER_ID
    const stayFolderId = await env.DEMAIN_DATA.get('folder-id:stay') || '1400D4jyczXbW6Uhl8E6KMYq96jxMEej_'
    const shopFolderId = await env.DEMAIN_DATA.get('folder-id:shop') || '1vSyisffWFOGlUGoQE5KkYHnskc1Xz0Wg'

    // Step 1: Create "Stay Materials" subfolder inside Stay
    let stayMaterialsId = await env.DEMAIN_DATA.get('folder-id:stay-materials')
    if (!stayMaterialsId) {
      // Check if exists
      const stayContents = await driveListFolder(env, stayFolderId)
      const existing = stayContents.find(f => f.name === 'Stay Materials' && f.mimeType.includes('folder'))
      if (existing) {
        stayMaterialsId = existing.id
        log.push(`Reusing existing Stay Materials folder: ${stayMaterialsId}`)
      } else {
        stayMaterialsId = await driveCreateFolder(env, stayFolderId, 'Stay Materials')
        log.push(`Created Stay Materials folder: ${stayMaterialsId}`)
      }
    }
    result.stayMaterialsFolder = { id: stayMaterialsId, url: `https://drive.google.com/drive/folders/${stayMaterialsId}` }

    // Step 2: Move customer folders + delete connectivity test folders
    const rootItems = await driveListFolder(env, root)
    let moved = 0, deleted = 0
    for (const item of rootItems) {
      const name = item.name
      // Skip the two top-level folders we want to keep
      if (name === 'Demain Life - Stay' || name === 'Demain Life - Shop') continue
      // Delete connectivity test folders
      if (name.startsWith('__connectivity_test_')) {
        if (await driveTrash(env, item.id)) {
          deleted++
          log.push(`Trashed: ${name}`)
        }
        continue
      }
      // Move customer folders (DL-* pattern or anything else) into Stay Materials
      if (name.startsWith('DL-')) {
        if (await driveMove(env, item.id, root, stayMaterialsId)) {
          moved++
          log.push(`Moved to Stay Materials: ${name}`)
        }
        continue
      }
      log.push(`Skipped (unknown): ${name}`)
    }
    result.movedCustomerFolders = moved
    result.deletedTestFolders = deleted

    // Step 3: Write headers to all 5 Sheets
    log.push('Writing headers to all 5 sheets...')
    const tabs = {}
    tabs.bookings = await setSheetHeader(env, ids.bookings, BOOKINGS_HEADER)
    tabs.rooms = await setSheetHeader(env, ids.rooms, ROOMS_HEADER)
    tabs.payments = await setSheetHeader(env, ids.payments, PAYMENTS_HEADER)
    tabs.shopOrders = await setSheetHeader(env, ids.shopOrders, SHOP_ORDERS_HEADER)
    tabs.shopInventory = await setSheetHeader(env, ids.shopInventory, SHOP_INVENTORY_HEADER)
    log.push('All 5 sheet headers written')

    // Step 4: Write 504 rooms into Rooms sheet
    const roomCount = await writeRoomsSheet(env, ids.rooms)
    log.push(`Wrote ${roomCount} rooms to Rooms sheet`)
    result.roomsWritten = roomCount

    // Step 5: Save IDs to KV (also keep old key for backward compat)
    await env.DEMAIN_DATA.put('sheet-id:bookings', ids.bookings)
    await env.DEMAIN_DATA.put('sheet-id:rooms', ids.rooms)
    await env.DEMAIN_DATA.put('sheet-id:payments', ids.payments)
    await env.DEMAIN_DATA.put('sheet-id:shop-orders', ids.shopOrders)
    await env.DEMAIN_DATA.put('sheet-id:shop-inventory', ids.shopInventory)
    await env.DEMAIN_DATA.put('folder-id:stay', stayFolderId)
    await env.DEMAIN_DATA.put('folder-id:shop', shopFolderId)
    await env.DEMAIN_DATA.put('folder-id:stay-materials', stayMaterialsId)
    // Set "active-sheet-id" to Bookings (legacy compat)
    await env.DEMAIN_DATA.put('active-sheet-id', ids.bookings)
    log.push('All IDs persisted to KV')

    // Step 6: Trash the old Sheet (the one with 1sHcYAI...)
    const oldSheetId = env.GOOGLE_SHEET_ID
    if (oldSheetId && oldSheetId !== ids.bookings) {
      if (await driveTrash(env, oldSheetId)) {
        log.push(`Trashed old Sheet: ${oldSheetId}`)
        result.oldSheetTrashed = true
      } else {
        log.push(`Could not trash old Sheet: ${oldSheetId} (skipping)`)
        result.oldSheetTrashed = false
      }
    }

    result.tabs = tabs
    result.log = log
    return json({ success: true, ...result })
  } catch (err) {
    log.push('ERROR: ' + err.message)
    return json({ error: err.message, log }, 500)
  }
}
