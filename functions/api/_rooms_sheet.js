// Sync the rooms registry to a "Rooms" tab in Google Sheet.
// One row per physical room (504 total). Updated whenever a room is assigned/released.

import { getActiveSheetId } from './_sheets_monthly.js'
import { getRoomsSheetId } from './_sheet_ids.js'

const ROOMS_TAB = 'Rooms'
const ROOMS_HEADER = [
  'Room ID', 'Block', 'Room', 'Status',
  'Current Booking ID', 'Current Guest', 'Room Config',
  'Move-in Date', 'Move-out Date', 'Duration', 'Assigned At',
  'History Count', 'Updated At'
]

async function getAccessToken(env) {
  const mod = await import('./_google_internal.js')
  return mod.sheetsAccessToken(env)
}

async function ensureRoomsTab(env, accessToken, spreadsheetId) {
  // Check whether the Rooms tab exists; create it if not.
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!metaRes.ok) throw new Error(`Sheet meta fetch: ${await metaRes.text()}`)
  const meta = await metaRes.json()
  const existing = (meta.sheets || []).find((s) => s.properties?.title === ROOMS_TAB)
  if (existing) return existing.properties.sheetId

  // Create the tab
  const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [{
        addSheet: {
          properties: { title: ROOMS_TAB, gridProperties: { rowCount: 600, columnCount: ROOMS_HEADER.length } }
        }
      }]
    })
  })
  if (!createRes.ok) throw new Error(`Create Rooms tab: ${await createRes.text()}`)

  // Write header
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${ROOMS_TAB}!A1:Z1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [ROOMS_HEADER] })
  })

  return null
}

function roomToRow(room) {
  const t = room.currentTenancy
  return [
    room.id,
    String(room.block),
    room.room,
    t ? (t.status || 'assigned') : 'vacant',
    t?.bookingId || '',
    t?.guestName || '',
    t?.roomConfig || '',
    t?.moveInDate || '',
    t?.moveOutDate || '',
    t?.duration || '',
    t?.assignedAt || '',
    String((room.history || []).length),
    new Date().toISOString()
  ]
}

// Find the row index for a given roomId, or return -1 if not found
async function findRoomRowIndex(env, accessToken, spreadsheetId, roomId, tabName = ROOMS_TAB) {
  const range = `${tabName}!A2:A700`
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) return -1
  const data = await res.json()
  const values = data.values || []
  for (let i = 0; i < values.length; i++) {
    if ((values[i][0] || '').trim() === roomId) return i + 2 // sheet rows are 1-based, header is row 1
  }
  return -1
}

// Public API: sync a single room to the Rooms tab.
// In new architecture: uses dedicated Rooms sheet. Falls back to legacy active sheet's 'Rooms' tab.
export async function syncRoomToSheet(env, room) {
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) return
  // Prefer the dedicated Rooms sheet
  let spreadsheetId = await getRoomsSheetId(env)
  let useFirstTab = true
  if (!spreadsheetId) {
    // Legacy: use 'Rooms' tab in active sheet
    spreadsheetId = await getActiveSheetId(env)
    useFirstTab = false
  }
  if (!spreadsheetId) return

  const accessToken = await getAccessToken(env)
  let tabName = ROOMS_TAB
  if (useFirstTab) {
    // Dedicated Rooms sheet — use its first tab (Sheet1)
    const meta = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(r => r.json())
    tabName = meta.sheets?.[0]?.properties?.title || 'Sheet1'
  } else {
    await ensureRoomsTab(env, accessToken, spreadsheetId)
  }

  const rowIndex = await findRoomRowIndex(env, accessToken, spreadsheetId, room.id, tabName)
  const row = roomToRow(room)

  if (rowIndex > 0) {
    // Update existing row
    const range = `${tabName}!A${rowIndex}:M${rowIndex}`
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [row] })
    })
  } else {
    // Append new row
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tabName}!A:M:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [row] })
    })
  }
}

// Public API: bulk seed all rooms to Sheet (one-time setup).
export async function seedAllRoomsToSheet(env) {
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) return { skipped: 'no google creds' }
  const spreadsheetId = await getActiveSheetId(env)
  if (!spreadsheetId) return { skipped: 'no sheet id' }

  const { loadAllRoomsWithState } = await import('./_rooms.js')
  const accessToken = await getAccessToken(env)
  await ensureRoomsTab(env, accessToken, spreadsheetId)

  const rooms = await loadAllRoomsWithState(env)
  const rows = rooms.map(roomToRow)

  // Clear then write
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${ROOMS_TAB}!A2:M700:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${ROOMS_TAB}!A2:M${rows.length + 1}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: rows })
  })

  return { success: true, count: rows.length }
}
