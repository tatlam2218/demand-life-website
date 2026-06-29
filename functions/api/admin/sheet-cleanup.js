// POST /api/admin/sheet-cleanup
// Ensures the Bookings + Payments spreadsheets have the canonical tab layout:
//   - "All" tab
//   - 12 monthly tabs (2026-01 … 2026-12) for the current year
// Also removes empty legacy tabs (Sheet1 / Sheet2 / the old "Bookings" tab) so admins see a clean layout.
// Super-admin only.

import { json, getCurrentUser } from '../_utils.js'
import { getBookingsSheetId, getPaymentsSheetId, getShopOrdersSheetId, getShopInventorySheetId } from '../_sheet_ids.js'
import { ensureAllTabs } from '../_sheets_monthly.js'
import { ensurePaymentsTabs } from '../_payments_sheet.js'

const PAYMENTS_HEADER = ['Payment ID','Invoice Number','Booking ID','Guest Name','Amount HKD','Status','Type','Method','Created At','Approved At','Approved By','Description','Screenshot URL','Notes']

async function token(env) {
  const { sheetsAccessToken } = await import('../_google_internal.js')
  return sheetsAccessToken(env)
}

// Delete empty legacy tabs (Sheet1 / Sheet2 / the old "Bookings" tab).
// Will NOT delete a tab if it has any data rows.
async function deleteEmptyLegacyTabs(env, sheetId) {
  const t = await token(env)
  const metaResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties.title,sheets.properties.sheetId`, {
    headers: { authorization: `Bearer ${t}` }
  })
  if (!metaResp.ok) return { error: `meta ${metaResp.status}` }
  const meta = await metaResp.json()
  const tabs = (meta.sheets || []).map(s => ({ title: s.properties.title, sheetId: s.properties.sheetId }))
  if (tabs.length <= 1) return { skipped: 'only one tab' }

  const LEGACY_NAMES = /^(Sheet\d*|Bookings|Orders|Payments|Inventory)$/i
  const candidates = tabs.filter(x => LEGACY_NAMES.test(x.title))
  const requests = []
  for (const c of candidates) {
    const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(c.title)}!A2:Z10`, {
      headers: { authorization: `Bearer ${t}` }
    })
    if (!r.ok) continue
    const data = await r.json()
    const dataRows = data.values || []
    if (dataRows.length === 0) {
      requests.push({ deleteSheet: { sheetId: c.sheetId } })
    }
  }
  if (requests.length === 0) return { deleted: 0 }

  const delResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
    body: JSON.stringify({ requests })
  })
  if (!delResp.ok) return { error: `delete ${delResp.status}` }
  return { deleted: requests.length, names: candidates.map(c => c.title) }
}

export async function onRequestPost({ request, env }) {
  const user = await getCurrentUser(request, env)
  if (!user) return json({ error: 'unauthorized' }, 401)
  if (user.username !== 'admin') return json({ error: 'forbidden' }, 403)

  const results = {}

  // 1. Bookings: ensure All + 12 monthly tabs, then delete empty legacy tabs.
  try {
    const sid = await getBookingsSheetId(env)
    if (sid) {
      await ensureAllTabs(env, sid)
      const del = await deleteEmptyLegacyTabs(env, sid)
      results.bookings = { tabsEnsured: true, ...del }
    }
  } catch (err) { results.bookings = { error: err.message } }

  // 2. Payments: ensure All + 12 monthly tabs, then delete empty legacy tabs.
  try {
    const sid = await getPaymentsSheetId(env)
    if (sid) {
      await ensurePaymentsTabs(env, sid, PAYMENTS_HEADER)
      const del = await deleteEmptyLegacyTabs(env, sid)
      results.payments = { tabsEnsured: true, ...del }
    }
  } catch (err) { results.payments = { error: err.message } }

  return json({ success: true, results })
}
