// POST /api/admin/full-reset
// Wipes all test data so the system is ready for production use.
// REQUIRES: super admin role + explicit confirmation token in body.
//
// Cleans:
//   - All bookings (KV: booking:*, booking-file:*, booking-index)
//   - All orders   (KV: order:*, order-index)
//   - All booking subfolders inside the Stay Materials Drive folder
//   - Bookings 2026 sheet rows  (keeps header)
//   - Shop Orders 2026 sheet rows (keeps header)
//
// PRESERVES:
//   - Rooms sheet (504 rows of room data)
//   - Shop Inventory sheet (product catalogue)
//   - Payments 2026 sheet
//   - site-content (logo, copy, contract template, etc.)
//   - admin accounts
//   - sheet IDs / folder IDs in KV
import { json, readJson, getCurrentUser } from '../_utils.js'
import { sheetsClearRows, driveDeleteAllSubfolders } from '../_google.js'
import { getBookingsSheetId, getShopOrdersSheetId, getPaymentsSheetId } from '../_sheet_ids.js'

export async function onRequestPost({ request, env }) {
  // Only the super-admin ("admin") can do this — not stay/shop sub-admins.
  const user = await getCurrentUser(request, env)
  if (!user) return json({ error: 'unauthorized' }, 401)
  if (user.username !== 'admin') {
    return json({ error: 'forbidden', message: 'Only super-admin can reset.' }, 403)
  }

  const body = await readJson(request) || {}
  if (body.confirm !== 'RESET_FOR_GO_LIVE') {
    return json({
      error: 'confirmation_required',
      hint: 'POST with {"confirm":"RESET_FOR_GO_LIVE"} to proceed.'
    }, 400)
  }

  const result = {
    bookings: { deleted: 0, files: 0, ids: [] },
    orders: { deleted: 0, ids: [] },
    drive: { subfoldersDeleted: 0, error: null },
    sheets: { bookings: null, orders: null },
    errors: []
  }

  // ---------- 1. Bookings ----------
  try {
    const idxRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
    const idx = Array.isArray(idxRaw) ? idxRaw : []
    for (const b of idx) {
      // Delete booking record
      await env.DEMAIN_DATA.delete(`booking:${b.id}`)
      // Delete any booking files in KV (id-front, id-back, payment screenshots, etc.)
      // Cloudflare KV doesn't support prefix-delete, so we list and iterate.
      let cursor = undefined
      do {
        const list = await env.DEMAIN_DATA.list({ prefix: `booking-file:${b.id}:`, cursor })
        for (const key of list.keys) {
          await env.DEMAIN_DATA.delete(key.name)
          result.bookings.files++
        }
        cursor = list.list_complete ? undefined : list.cursor
      } while (cursor)

      result.bookings.deleted++
      result.bookings.ids.push(b.id)
    }
    await env.DEMAIN_DATA.put('booking-index', JSON.stringify([]))
  } catch (err) {
    result.errors.push({ where: 'bookings', message: err.message })
  }

  // ---------- 2. Orders ----------
  try {
    const idxRaw = await env.DEMAIN_DATA.get('order-index', 'json')
    const idx = Array.isArray(idxRaw) ? idxRaw : []
    for (const o of idx) {
      await env.DEMAIN_DATA.delete(`order:${o.id}`)
      result.orders.deleted++
      result.orders.ids.push(o.id)
    }
    await env.DEMAIN_DATA.put('order-index', JSON.stringify([]))
  } catch (err) {
    result.errors.push({ where: 'orders', message: err.message })
  }

  // ---------- 3. Drive subfolders (Stay Materials > each booking) ----------
  try {
    const parentFolderId =
      (await env.DEMAIN_DATA.get('folder-id:stay-materials')) ||
      env.GOOGLE_DRIVE_FOLDER_ID
    if (parentFolderId && env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const n = await driveDeleteAllSubfolders(env, parentFolderId)
      result.drive.subfoldersDeleted = (typeof n === 'number') ? n : 0
    } else {
      result.drive.error = 'no-drive-config'
    }
  } catch (err) {
    result.drive.error = err.message
  }

  // ---------- 4. Google Sheets (clear rows, keep header) ----------
  try {
    const sid = await getBookingsSheetId(env)
    if (sid && env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const n = await sheetsClearRows(env, sid)
      result.sheets.bookings = `cleared ${n} row(s)`
    }
  } catch (err) {
    result.errors.push({ where: 'sheets-bookings', message: err.message })
  }
  try {
    const sid = await getShopOrdersSheetId(env)
    if (sid && env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const n = await sheetsClearRows(env, sid)
      result.sheets.orders = `cleared ${n} row(s)`
    }
  } catch (err) {
    result.errors.push({ where: 'sheets-orders', message: err.message })
  }
  try {
    const sid = await getPaymentsSheetId(env)
    if (sid && env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const n = await sheetsClearRows(env, sid)
      result.sheets.payments = `cleared ${n} row(s)`
    }
  } catch (err) {
    result.errors.push({ where: 'sheets-payments', message: err.message })
  }

  return json({ success: true, result })
}
