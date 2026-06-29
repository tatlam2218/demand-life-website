// POST /api/admin/fix-headers
// One-shot maintenance: rewrites the header row (row 1) of every tab in the Bookings + Payments sheets,
// fixing any corruption (e.g. accidental data written to A1) and ensuring header consistency.
import { json, getCurrentUser } from '../_utils.js'
import { getBookingsSheetId, getPaymentsSheetId } from '../_sheet_ids.js'

const BOOKINGS_HEADER = [
  'Booking ID','Created At','Status','Name','Email','Phone','Nationality',
  'Room Type','Move-in Date','Duration','Occupancy','Message','Source Language',
  'Drive Folder','Drive Folder ID','Contact Method','WhatsApp Number','WeChat ID',
  'Total Outstanding','Total Paid','Latest Payment Request','Latest Payment Status',
  'Contract Signed At','Contract Hash','Signature Method',
  'Doc Type','Doc Number','Name (Romanized)','Name (Chinese)','Date of Birth','Gender',
  'Occupation','Current Address','Emergency Name','Emergency Relation','Emergency Phone','Emergency Email',
  'Special Requests','Signature','Details Submitted At','AI Assisted',
  'Assigned Block','Assigned Room','Room Config','Assigned At','Move-out Date'
]
const PAYMENTS_HEADER = [
  'Payment ID','Invoice Number','Booking ID','Guest Name','Amount HKD','Status','Type',
  'Method','Created At','Approved At','Approved By','Description','Screenshot URL','Notes'
]

async function token(env) {
  const { sheetsAccessToken } = await import('../_google_internal.js')
  return sheetsAccessToken(env)
}

async function listTabs(env, sheetId) {
  const t = await token(env)
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties.title`, {
    headers: { authorization: `Bearer ${t}` }
  })
  if (!r.ok) throw new Error(`listTabs failed: ${r.status}`)
  const data = await r.json()
  return (data.sheets || []).map(s => s.properties.title)
}

function colLetter(n) {
  let s = ''
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26) }
  return s
}

async function rewriteHeaderOnAllTabs(env, sheetId, header) {
  const t = await token(env)
  const tabs = await listTabs(env, sheetId)
  const lastCol = colLetter(header.length)
  let count = 0
  for (const tab of tabs) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(tab)}!A1:${lastCol}1?valueInputOption=USER_ENTERED`
    const r = await fetch(url, {
      method: 'PUT',
      headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values: [header] })
    })
    if (r.ok) count++
  }
  return { tabsFixed: count, tabs }
}

export async function onRequestPost({ request, env }) {
  const user = await getCurrentUser(request, env)
  if (!user) return json({ error: 'unauthorized' }, 401)
  if (user.username !== 'admin') return json({ error: 'forbidden' }, 403)

  const results = {}
  try {
    const sid = await getBookingsSheetId(env)
    if (sid) results.bookings = await rewriteHeaderOnAllTabs(env, sid, BOOKINGS_HEADER)
  } catch (err) { results.bookings = { error: err.message } }
  try {
    const sid = await getPaymentsSheetId(env)
    if (sid) results.payments = await rewriteHeaderOnAllTabs(env, sid, PAYMENTS_HEADER)
  } catch (err) { results.payments = { error: err.message } }

  return json({ success: true, results })
}
