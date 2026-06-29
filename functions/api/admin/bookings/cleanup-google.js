// POST /api/admin/bookings/cleanup-google
import { json, requireStayAuth, readJson } from '../../_utils.js'
import { sheetsClearRows, driveDeleteAllSubfolders } from '../../_google.js'
import { getBookingsSheetId } from '../../_sheet_ids.js'

export async function onRequestPost({ request, env }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const body = await readJson(request) || {}
  if (body.confirm !== 'CLEANUP_GOOGLE') {
    return json({ error: 'confirmation_required', hint: 'POST {"confirm":"CLEANUP_GOOGLE"}' }, { status: 400 })
  }

  const results = { sheet: null, drive: null, errors: [] }

  if ((await getBookingsSheetId(env))) {
    try {
      const cleared = await sheetsClearRows(env, (await getBookingsSheetId(env)))
      results.sheet = { rowsCleared: cleared }
    } catch (err) {
      results.errors.push('sheet: ' + err.message)
    }
  }

  if (env.GOOGLE_DRIVE_FOLDER_ID) {
    try {
      const deleted = await driveDeleteAllSubfolders(env, env.GOOGLE_DRIVE_FOLDER_ID)
      results.drive = { foldersDeleted: deleted }
    } catch (err) {
      results.errors.push('drive: ' + err.message)
    }
  }

  return json(results)
}
