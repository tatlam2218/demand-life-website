// Admin-only smoke test for Google integration
// GET /api/admin/test-google
import { json, requireAuth } from '../_utils.js'
import { sheetsEnsureHeader, sheetsAppendRow, driveCreateFolder } from '../_google.js'

export async function onRequestGet({ request, env }) {
  const ok = await requireAuth(request, env)
  if (!ok) return json({ error: 'unauthorized' }, { status: 401 })

  const results = {
    serviceAccountConfigured: !!env.GOOGLE_SERVICE_ACCOUNT_JSON,
    sheetIdConfigured: !!env.GOOGLE_SHEET_ID,
    folderIdConfigured: !!env.GOOGLE_DRIVE_FOLDER_ID,
    notifyEmailConfigured: !!env.BOOKING_NOTIFY_EMAIL,
    sheetsHeader: null,
    sheetsAppend: null,
    driveCreateFolder: null,
    errors: []
  }

  // Test Sheets header
  try {
    const header = ['Booking ID', 'Created At', 'Status', 'Name', 'Email', 'Phone', 'Room Type', 'Move-in Date', 'Duration', 'Message', 'ID Folder']
    await sheetsEnsureHeader(env, env.GOOGLE_SHEET_ID, header)
    results.sheetsHeader = 'ok'
  } catch (err) {
    results.errors.push('sheetsHeader: ' + err.message)
  }

  // Test Sheets append
  try {
    const testRow = ['TEST-' + Date.now(), new Date().toISOString(), 'test', '__connectivity_test__', 'test@example.com', '', '', '', '', 'Smoke test row — please delete', '']
    await sheetsAppendRow(env, env.GOOGLE_SHEET_ID, 'A1', testRow)
    results.sheetsAppend = 'ok'
  } catch (err) {
    results.errors.push('sheetsAppend: ' + err.message)
  }

  // Test Drive folder create
  try {
    const folderName = '__connectivity_test_' + Date.now() + '__'
    const id = await driveCreateFolder(env, env.GOOGLE_DRIVE_FOLDER_ID, folderName)
    results.driveCreateFolder = 'ok (' + id + ')'
  } catch (err) {
    results.errors.push('driveCreateFolder: ' + err.message)
  }

  return json(results)
}
