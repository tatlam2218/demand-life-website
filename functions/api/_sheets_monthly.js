// Monthly-tabbed Google Sheets helpers
// - Each booking goes into a tab named YYYY-MM based on its created month
// - Booking updates always go back to the original row in the original month tab
// - Year-end archive creates a new spreadsheet, copies active bookings, swaps SHEET_ID via KV
//
// SHEET_ID is read from KV first (key: active-sheet-id), falling back to env.GOOGLE_SHEET_ID

const BOOKING_HEADER = [
  'Booking ID', 'Created At', 'Status',
  'Name', 'Email', 'Phone', 'Nationality',
  'Room Type', 'Move-in Date', 'Duration', 'Occupancy',
  'Message', 'Source Language',
  'Drive Folder', 'Drive Folder ID',
  'Contact Method', 'WhatsApp Number', 'WeChat ID',
  // Workflow extensions (set later by updates)
  'Total Outstanding', 'Total Paid', 'Latest Payment Request', 'Latest Payment Status',
  'Contract Signed At', 'Contract Hash', 'Signature Method',
  'Doc Type', 'Doc Number', 'Name (Romanized)', 'Name (Chinese)',
  'Date of Birth', 'Gender', 'Occupation', 'Current Address',
  'Emergency Name', 'Emergency Relation', 'Emergency Phone', 'Emergency Email',
  'Special Requests', 'Signature', 'Details Submitted At', 'AI Assisted',
  // Room assignment
  'Assigned Block', 'Assigned Room', 'Room Config', 'Assigned At', 'Move-out Date'
]

// Get the currently-active Bookings Sheet ID.
// Priority: sheet-id:bookings (new structured) → active-sheet-id (legacy) → env.GOOGLE_SHEET_ID (oldest legacy)
export async function getActiveSheetId(env) {
  const newId = await env.DEMAIN_DATA.get('sheet-id:bookings')
  if (newId) return newId
  const kvId = await env.DEMAIN_DATA.get('active-sheet-id')
  return kvId || env.GOOGLE_SHEET_ID
}

async function setActiveSheetId(env, id) {
  await env.DEMAIN_DATA.put('active-sheet-id', id)
}

// Tab layout per spreadsheet:
//   - "All"     : aggregates every booking across all months (default landing tab)
//   - "YYYY-01" … "YYYY-12" : 12 monthly tabs for the active year
const ALL_TAB = 'All'
// Legacy name; aliased to ALL_TAB for backwards compatibility with older callers.
const BOOKINGS_TAB = ALL_TAB

function monthTabName(isoDate) {
  const d = isoDate ? new Date(isoDate) : new Date()
  const safe = Number.isNaN(d.getTime()) ? new Date() : d
  return `${safe.getUTCFullYear()}-${String(safe.getUTCMonth() + 1).padStart(2, '0')}`
}

// Returns the 12 monthly tab names for a given year (defaults to current UTC year).
function monthlyTabsForYear(year) {
  const y = year || new Date().getUTCFullYear()
  return Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`)
}

async function getAccessToken(env) {
  const mod = await import('./_google_internal.js')
  return mod.sheetsAccessToken(env)
}

// =========== Sheet tab management ===========

async function getAccess(env) {
  const { sheetsAccessToken } = await import('./_google_internal.js')
  return sheetsAccessToken(env)
}

// List existing tabs in a spreadsheet
async function listTabs(env, sheetId) {
  const { sheetsAccessToken } = await import('./_google_internal.js')
  const token = await sheetsAccessToken(env)
  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties.title,sheets.properties.sheetId`, {
    headers: { authorization: `Bearer ${token}` }
  })
  if (!resp.ok) throw new Error(`listTabs failed: ${resp.status} ${await resp.text()}`)
  const data = await resp.json()
  return (data.sheets || []).map((s) => ({ title: s.properties.title, sheetId: s.properties.sheetId }))
}

// Add a new tab with given title, and write the header row.
async function addTabWithHeader(env, sheetId, tabName) {
  const { sheetsAccessToken } = await import('./_google_internal.js')
  const token = await sheetsAccessToken(env)
  // batchUpdate to add sheet
  const addResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: tabName, gridProperties: { rowCount: 200, columnCount: 60, frozenRowCount: 1 } } } }]
    })
  })
  if (!addResp.ok) {
    const text = await addResp.text()
    // If "already exists" — that's fine
    if (text.includes('already exists')) return
    throw new Error(`addTab failed: ${addResp.status} ${text}`)
  }
  // Write header
  const colLetter = (n) => {
    let s = ''
    while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26) }
    return s
  }
  const lastCol = colLetter(BOOKING_HEADER.length)
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(tabName)}!A1:${lastCol}1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: [BOOKING_HEADER] })
  })
}

// Ensure the full tab layout exists for a Bookings-style sheet:
//   - "All" tab (existing or created)
//   - 12 monthly tabs for the given year (or current year if not specified)
// Idempotent: existing tabs are left alone. Returns { all, monthly: [...] }.
export async function ensureAllTabs(env, sheetId, year) {
  const tabs = await listTabs(env, sheetId)
  const titles = new Set(tabs.map(t => t.title))
  const { sheetsAccessToken } = await import('./_google_internal.js')
  const token = await sheetsAccessToken(env)

  const wanted = [ALL_TAB, ...monthlyTabsForYear(year)]

  // Special case: if only Sheet1 exists, rename it to "All" instead of leaving an orphan tab.
  if (!titles.has(ALL_TAB) && tabs.length === 1 && /^Sheet\d*$/i.test(tabs[0].title)) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        requests: [{ updateSheetProperties: { properties: { sheetId: tabs[0].sheetId, title: ALL_TAB }, fields: 'title' } }]
      })
    })
    titles.add(ALL_TAB)
    // Write header row to the renamed (empty) tab.
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(ALL_TAB)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values: [BOOKING_HEADER] })
    })
  }

  // Create any missing tabs (All if still missing, plus monthly tabs).
  const missing = wanted.filter(t => !titles.has(t))
  for (const name of missing) {
    await addTabWithHeader(env, sheetId, name)
  }

  return { all: ALL_TAB, monthly: monthlyTabsForYear(year) }
}

// Backwards-compat: callers used to expect a single "Bookings" tab string.
export async function ensureBookingsTab(env, sheetId) {
  await ensureAllTabs(env, sheetId)
  return ALL_TAB
}

// Backwards-compat shim.
export async function ensureMonthlyTab(env, sheetId, _createdAtIso) {
  return ensureBookingsTab(env, sheetId)
}

// Append a booking row to BOTH the All tab AND the booking's month tab.
// Idempotent w.r.t. tab existence (creates monthly tab if missing).
export async function appendBookingRow(env, booking, row) {
  const sheetId = await getActiveSheetId(env)
  const year = booking.createdAt ? new Date(booking.createdAt).getUTCFullYear() : new Date().getUTCFullYear()
  await ensureAllTabs(env, sheetId, year)
  const monthTab = monthTabName(booking.createdAt)
  // Ensure the specific month tab exists (e.g. if booking createdAt year != active year)
  const tabs = await listTabs(env, sheetId)
  if (!tabs.find(t => t.title === monthTab)) {
    await addTabWithHeader(env, sheetId, monthTab)
  }

  const { sheetsAccessToken } = await import('./_google_internal.js')
  const token = await sheetsAccessToken(env)
  while (row.length < BOOKING_HEADER.length) row.push('')

  // Write to BOTH tabs. Failures on the monthly tab are non-fatal — All is the source of truth.
  for (const tab of [ALL_TAB, monthTab]) {
    try {
      const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(tab)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      })
      if (!resp.ok && tab === ALL_TAB) throw new Error(`appendBookingRow All failed: ${resp.status} ${await resp.text()}`)
    } catch (err) {
      if (tab === ALL_TAB) throw err  // monthly tab failures are tolerated
    }
  }
  return { sheetId, tab: ALL_TAB, monthTab }
}

// Find a booking by id across all monthly tabs.
// Returns { tab, rowIndex (1-based), existingRow, headers }
export async function findBookingRow(env, bookingId, hintTab = null) {
  const sheetId = await getActiveSheetId(env)
  const { sheetsAccessToken } = await import('./_google_internal.js')
  const token = await sheetsAccessToken(env)
  const tabs = await listTabs(env, sheetId)
  // Try hint tab first (almost always the booking's createdAt month)
  const orderedTabs = hintTab && tabs.find((t) => t.title === hintTab)
    ? [tabs.find((t) => t.title === hintTab), ...tabs.filter((t) => t.title !== hintTab)]
    : tabs
  for (const t of orderedTabs) {
    const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(t.title)}!A1:Z2000`, {
      headers: { authorization: `Bearer ${token}` }
    })
    if (!resp.ok) continue
    const data = await resp.json()
    const rows = data.values || []
    if (rows.length === 0) continue
    const headers = rows[0]
    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][0] || '') === bookingId) {
        return { sheetId, tab: t.title, rowIndex: i + 1, existingRow: rows[i], headers }
      }
    }
  }
  return null
}

// Update specific fields of a booking row by id ACROSS ALL TABS.
// Updates the row in every tab where the booking ID appears (e.g. both "All" and "2026-06").
// `updates` is { 'Status': 'paid', ... } keyed by header name.
export async function updateBookingFields(env, bookingId, updates, hintTab = null) {
  // Delegate to the cross-tab updater in _google.js, which scans every tab and updates each match.
  const sheetId = await getActiveSheetId(env)
  const { sheetsUpdateRowByBookingId } = await import('./_google.js')
  try {
    return await sheetsUpdateRowByBookingId(env, sheetId, bookingId, updates)
  } catch (e) {
    // Fall back to legacy single-tab update if the cross-tab path fails
  }
  const found = await findBookingRow(env, bookingId, hintTab)
  if (!found) return false
  const { sheetId: foundSheetId, tab, rowIndex, existingRow, headers } = found
  const { sheetsAccessToken } = await import('./_google_internal.js')
  const token = await sheetsAccessToken(env)

  // Extend headers if updates contain new keys
  const fullHeaders = headers.slice()
  let headersChanged = false
  for (const k of Object.keys(updates)) {
    if (!fullHeaders.includes(k)) { fullHeaders.push(k); headersChanged = true }
  }
  if (headersChanged) {
    const colLetter = (n) => { let s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26) } return s }
    const lastCol = colLetter(fullHeaders.length)
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(foundSheetId)}/values/${encodeURIComponent(tab)}!A1:${lastCol}1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values: [fullHeaders] })
    })
  }

  // Build new row
  const newRow = fullHeaders.map((h, i) => {
    if (h in updates) return updates[h]
    return existingRow[i] !== undefined ? existingRow[i] : ''
  })
  const colLetter = (n) => { let s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26) } return s }
  const lastCol = colLetter(fullHeaders.length)
  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(foundSheetId)}/values/${encodeURIComponent(tab)}!A${rowIndex}:${lastCol}${rowIndex}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: [newRow] })
  })
  if (!resp.ok) throw new Error(`updateBookingFields failed: ${resp.status} ${await resp.text()}`)
  return true
}

// =========== Year-end archive ===========

async function driveCopyFile(env, fileId, newName) {
  const mod = await import('./_google_internal.js')
  const token = await mod.driveAccessToken(env)
  // First rename original to "(archived)" but DON'T copy — we want a NEW empty sheet instead.
  // Simpler approach: rename existing to "...(archived YYYY)" and create a new spreadsheet
  return { token }
}

// Create a new empty spreadsheet for the new year.
async function createNewSpreadsheet(env, title) {
  const mod = await import('./_google_internal.js')
  const token = await mod.driveAccessToken(env)
  // Use Sheets API to create
  const resp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ properties: { title } })
  })
  if (!resp.ok) throw new Error(`createSheet failed: ${resp.status} ${await resp.text()}`)
  const data = await resp.json()
  return data.spreadsheetId
}

// Rename a spreadsheet
async function renameSpreadsheet(env, sheetId, newTitle) {
  const mod = await import('./_google_internal.js')
  const token = await mod.sheetsAccessToken(env)
  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      requests: [{ updateSpreadsheetProperties: { properties: { title: newTitle }, fields: 'title' } }]
    })
  })
  if (!resp.ok) throw new Error(`rename failed: ${resp.status} ${await resp.text()}`)
}

// Move a file to a folder (Drive)
async function moveFileToFolder(env, fileId, folderId) {
  const mod = await import('./_google_internal.js')
  const token = await mod.driveAccessToken(env)
  // Get current parents
  const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents&supportsAllDrives=true`, {
    headers: { authorization: `Bearer ${token}` }
  })
  if (resp.ok) {
    const data = await resp.json()
    const prev = (data.parents || []).join(',')
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${encodeURIComponent(folderId)}&removeParents=${encodeURIComponent(prev)}&supportsAllDrives=true`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}` }
    })
  }
}

// Read all rows from all tabs of a spreadsheet
async function readAllRows(env, sheetId) {
  const mod = await import('./_google_internal.js')
  const token = await mod.sheetsAccessToken(env)
  const tabs = await listTabs(env, sheetId)
  const out = {}
  for (const t of tabs) {
    const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(t.title)}!A1:BZ5000`, {
      headers: { authorization: `Bearer ${token}` }
    })
    if (r.ok) {
      const d = await r.json()
      out[t.title] = d.values || []
    }
  }
  return out
}

// Perform year-end archive:
// 1. Rename current sheet to "... (YYYY archived)"
// 2. Create new sheet "Demain Life Bookings YYYY+1"
// 3. Share with same service account
// 4. Copy active (non-checked-in, non-cancelled) bookings to new sheet, in their original month tabs
// 5. Update KV active-sheet-id to new sheet
export async function archiveYear(env, year) {
  const oldSheetId = await getActiveSheetId(env)
  const newYear = year + 1
  const newTitle = `Demain Life Bookings ${newYear}`
  const oldRenameTo = `Demain Life Bookings ${year} (archived)`

  // Step 1: rename old
  await renameSpreadsheet(env, oldSheetId, oldRenameTo)

  // Step 2: create new
  const newSheetId = await createNewSpreadsheet(env, newTitle)

  // Step 3: move new sheet to same Drive folder as old (if possible)
  if (env.GOOGLE_DRIVE_FOLDER_ID) {
    try { await moveFileToFolder(env, newSheetId, env.GOOGLE_DRIVE_FOLDER_ID) } catch (e) {}
  }

  // Step 4: Find active bookings from KV (not Sheet, KV is source of truth)
  const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
  const index = Array.isArray(indexRaw) ? indexRaw : []
  const activeStatuses = ['new','reviewing','profile-sent','profile-submitted','contract-sent','signed','invoice-sent','awaiting-payment','payment-uploaded','paid','ready-for-checkin']

  let copiedCount = 0
  for (const idxEntry of index) {
    if (!activeStatuses.includes(idxEntry.status)) continue
    const booking = await env.DEMAIN_DATA.get(`booking:${idxEntry.id}`, 'json')
    if (!booking) continue
    // Append to new sheet's month tab (month is based on booking createdAt)
    try {
      // Temporarily switch sheet ID for the append call
      const tab = await ensureMonthlyTab(env, newSheetId, booking.createdAt)
      const { sheetsAccessToken } = await import('./_google_internal.js')
      const token = await sheetsAccessToken(env)
      const row = buildFullRowFromBooking(booking)
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(newSheetId)}/values/${encodeURIComponent(tab)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      })
      copiedCount++
    } catch (err) { /* continue on error */ }
  }

  // Step 5: switch active sheet
  await setActiveSheetId(env, newSheetId)

  return {
    archivedSheetId: oldSheetId,
    archivedSheetTitle: oldRenameTo,
    newSheetId,
    newSheetTitle: newTitle,
    newSheetUrl: `https://docs.google.com/spreadsheets/d/${newSheetId}/edit`,
    copiedActiveBookings: copiedCount
  }
}

// Build a full row from a booking record (used for fresh archive copies)
export function buildFullRowFromBooking(booking) {
  const d = booking.details || {}
  const totalPaid = (booking.payments || []).filter(p => p.status === 'approved').reduce((s, p) => s + p.amount, 0)
  const totalOut = (booking.payments || []).filter(p => p.status !== 'approved' && p.status !== 'rejected').reduce((s, p) => s + p.amount, 0)
  const ar = booking.assignedRoom || null
  return [
    booking.id, booking.createdAt, booking.status,
    booking.name, booking.email, booking.phone, booking.nationality || '',
    booking.roomType, booking.moveInDate, booking.duration || '', booking.occupancy || '',
    booking.message || '', booking.sourceLang || 'en',
    booking.driveFolder || '', booking.driveFolderId || '',
    booking.contactMethod || '', booking.whatsappNumber || '', booking.wechatId || '',
    totalOut ? `HK$${totalOut.toLocaleString()}` : '',
    totalPaid ? `HK$${totalPaid.toLocaleString()}` : '',
    '', '',
    booking.contract?.signedAt || '',
    booking.contract?.contractHash ? booking.contract.contractHash.slice(0, 16) + '…' : '',
    booking.contract?.signatureMethod || '',
    d.documentType || '', d.documentNumber || '', d.name || '', d.nameChinese || '',
    d.dateOfBirth || '', d.gender || '', d.occupation || '', d.currentAddress || '',
    d.emergencyName || '', d.emergencyRelation || '', d.emergencyPhone || '', d.emergencyEmail || '',
    d.specialRequests || '', d.signature || '', booking.detailsSubmittedAt || '', d.aiAssisted ? 'Yes' : '',
    ar?.block ?? '', ar?.room || '', ar?.roomConfig || '', ar?.assignedAt || '', ar?.moveOutDate || ''
  ]
}

export { BOOKING_HEADER, monthTabName, listTabs }
