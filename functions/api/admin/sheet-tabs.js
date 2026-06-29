// GET /api/admin/sheet-tabs?which=bookings|payments|orders|rooms|inventory
// Returns all tab names + first-row preview of each. Admin debug tool.

import { json, getCurrentUser } from '../_utils.js'
import { getBookingsSheetId, getShopOrdersSheetId, getShopInventorySheetId, getPaymentsSheetId, getRoomsSheetId } from '../_sheet_ids.js'

export async function onRequestGet({ request, env }) {
  const user = await getCurrentUser(request, env)
  if (!user) return json({ error: 'unauthorized' }, 401)

  const url = new URL(request.url)
  const which = url.searchParams.get('which') || 'bookings'

  let sheetId
  if (which === 'bookings') sheetId = await getBookingsSheetId(env)
  else if (which === 'payments') sheetId = await getPaymentsSheetId(env)
  else if (which === 'orders') sheetId = await getShopOrdersSheetId(env)
  else if (which === 'inventory') sheetId = await getShopInventorySheetId(env)
  else if (which === 'rooms') sheetId = await getRoomsSheetId(env)
  else return json({ error: 'unknown sheet' }, 400)

  if (!sheetId) return json({ error: 'sheet_not_configured', which }, 404)

  const { sheetsAccessToken } = await import('../_google_internal.js')
  const token = await sheetsAccessToken(env)

  // Metadata: get all tabs
  const metaResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties.title,sheets.properties.gridProperties`, {
    headers: { authorization: `Bearer ${token}` }
  })
  if (!metaResp.ok) return json({ error: 'sheet_meta_failed', status: metaResp.status, body: await metaResp.text() }, 500)
  const meta = await metaResp.json()
  const tabs = (meta.sheets || []).map(s => ({
    title: s.properties.title,
    rows: s.properties.gridProperties?.rowCount || 0,
    cols: s.properties.gridProperties?.columnCount || 0
  }))

  // For each tab, fetch A1:Z5 to show preview
  const previews = {}
  for (const t of tabs) {
    try {
      const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(t.title)}!A1:Z10`, {
        headers: { authorization: `Bearer ${token}` }
      })
      if (r.ok) {
        const data = await r.json()
        previews[t.title] = data.values || []
      } else {
        previews[t.title] = { error: `${r.status}` }
      }
    } catch (err) {
      previews[t.title] = { error: err.message }
    }
  }

  return json({
    which,
    sheetId,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
    tabs,
    previews
  })
}
