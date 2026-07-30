// POST /api/admin/init-headers
// One-shot: write header row (row 1) to all 5 dev sheets that are currently blank.
// Safe to call multiple times — only overwrites row 1, never deletes data rows.
//
// For the Bookings sheet: also provisions the full tab layout (All + 12 monthly tabs for current year).
// For the other 4 sheets: writes headers to the first tab only (usually "Sheet1").
//
// Returns per-sheet results so the caller can verify each outcome.

import { json, requireAuth } from '../_utils.js'
import {
  getBookingsSheetId,
  getRoomsSheetId,
  getPaymentsSheetId,
  getShopOrdersSheetId,
  getShopInventorySheetId
} from '../_sheet_ids.js'
import { ensureAllTabs } from '../_sheets_monthly.js'

// ── Header definitions ───────────────────────────────────────────────────────
// Must match exactly what the app writes/reads from each sheet.

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

const ROOMS_HEADER = [
  'Room ID', 'Block', 'Room', 'Status',
  'Current Booking ID', 'Current Guest', 'Room Config',
  'Move-in Date', 'Move-out Date', 'Duration', 'Assigned At',
  'History Count', 'Updated At'
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
  'Shipped At', 'Delivered At', 'Notes'
]

const SHOP_INVENTORY_HEADER = [
  'SKU', 'Product Name (EN)', 'Product Name (中)', 'Category',
  'Stock', 'Price HKD', 'Cost HKD',
  'Supplier', 'Variant', 'Last Restocked',
  'Status', 'Notes', 'Image URL', 'Updated At',
  'Description (EN)', 'Description (中)', 'Gallery URLs', 'Materials', 'Dimensions', 'Care Instructions'
]

// ── Helpers ──────────────────────────────────────────────────────────────────

async function sheetsToken(env) {
  const { sheetsAccessToken } = await import('../_google_internal.js')
  return sheetsAccessToken(env)
}

function colLetter(n) {
  let s = ''
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26) }
  return s
}

// Write header to the first tab of a simple (non-booking) sheet.
// Also bolds row 1 and freezes it for readability.
async function initSimpleSheet(env, sheetId, header, label) {
  const token = await sheetsToken(env)

  // 1. Discover first tab name
  const metaResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties`,
    { headers: { authorization: `Bearer ${token}` } }
  )
  if (!metaResp.ok) throw new Error(`${label} meta fetch failed: ${metaResp.status} ${await metaResp.text()}`)
  const meta = await metaResp.json()
  const firstTab = meta.sheets?.[0]?.properties?.title || 'Sheet1'
  const firstTabId = meta.sheets?.[0]?.properties?.sheetId ?? 0

  // 2. Write header row (PUT to row 1; safe even if row already has content)
  const lastCol = colLetter(header.length)
  const writeResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(firstTab)}!A1:${lastCol}1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values: [header] })
    }
  )
  if (!writeResp.ok) throw new Error(`${label} header write failed: ${writeResp.status} ${await writeResp.text()}`)

  // 3. Bold + freeze header row
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`,
    {
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
    }
  )

  return { ok: true, tab: firstTab, columns: header.length }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function onRequestPost({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ error: 'unauthorized' }, 401)
  }

  const results = {}
  const errors = []

  // 1. BOOKINGS — use ensureAllTabs to set up "All" + 12 monthly tabs, each with BOOKINGS_HEADER
  try {
    const sid = await getBookingsSheetId(env)
    if (!sid) throw new Error('sheet-id:bookings not set in KV')
    const tabLayout = await ensureAllTabs(env, sid, new Date().getUTCFullYear())
    results.bookings = {
      ok: true,
      sheetId: sid,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sid}/edit`,
      tabs: tabLayout,
      columns: BOOKINGS_HEADER.length
    }
  } catch (err) {
    results.bookings = { ok: false, error: err.message }
    errors.push('bookings: ' + err.message)
  }

  // 2. ROOMS
  try {
    const sid = await getRoomsSheetId(env)
    if (!sid) throw new Error('sheet-id:rooms not set in KV')
    const r = await initSimpleSheet(env, sid, ROOMS_HEADER, 'rooms')
    results.rooms = { ...r, sheetId: sid, sheetUrl: `https://docs.google.com/spreadsheets/d/${sid}/edit` }
  } catch (err) {
    results.rooms = { ok: false, error: err.message }
    errors.push('rooms: ' + err.message)
  }

  // 3. PAYMENTS
  try {
    const sid = await getPaymentsSheetId(env)
    if (!sid) throw new Error('sheet-id:payments not set in KV')
    const r = await initSimpleSheet(env, sid, PAYMENTS_HEADER, 'payments')
    results.payments = { ...r, sheetId: sid, sheetUrl: `https://docs.google.com/spreadsheets/d/${sid}/edit` }
  } catch (err) {
    results.payments = { ok: false, error: err.message }
    errors.push('payments: ' + err.message)
  }

  // 4. SHOP ORDERS
  try {
    const sid = await getShopOrdersSheetId(env)
    if (!sid) throw new Error('sheet-id:shop-orders not set in KV')
    const r = await initSimpleSheet(env, sid, SHOP_ORDERS_HEADER, 'shop-orders')
    results.shopOrders = { ...r, sheetId: sid, sheetUrl: `https://docs.google.com/spreadsheets/d/${sid}/edit` }
  } catch (err) {
    results.shopOrders = { ok: false, error: err.message }
    errors.push('shop-orders: ' + err.message)
  }

  // 5. SHOP INVENTORY
  try {
    const sid = await getShopInventorySheetId(env)
    if (!sid) throw new Error('sheet-id:shop-inventory not set in KV')
    const r = await initSimpleSheet(env, sid, SHOP_INVENTORY_HEADER, 'shop-inventory')
    results.shopInventory = { ...r, sheetId: sid, sheetUrl: `https://docs.google.com/spreadsheets/d/${sid}/edit` }
  } catch (err) {
    results.shopInventory = { ok: false, error: err.message }
    errors.push('shop-inventory: ' + err.message)
  }

  const allOk = errors.length === 0
  return json({ success: allOk, errors, results }, allOk ? 200 : 207)
}
