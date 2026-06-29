// POST /api/admin/drive-cleanup
// Body: { confirm: "CLEANUP_DRIVE" }
// Trashes:
//   - Any DL-* folder in root (should be in Stay Materials)
//   - Any DL-* folder in Stay Materials (test data)
//   - Any __connectivity_test_* folder anywhere

import { requireAuth, json, readJson } from '../_utils.js'

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

export async function onRequestPost({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: 'unauthorized' }, 401)
  const body = await readJson(request).catch(() => ({}))
  if (body.confirm !== 'CLEANUP_DRIVE') {
    return json({ error: 'confirmation_required', hint: 'POST {"confirm":"CLEANUP_DRIVE"}' }, 400)
  }

  const log = []
  const trashed = []
  const errors = []

  const root = env.GOOGLE_DRIVE_FOLDER_ID
  const stayMatsId = await env.DEMAIN_DATA.get('folder-id:stay-materials')

  // Helper to scan a folder
  async function scanAndClean(folderId, folderLabel, namePredicate) {
    const items = await driveListFolder(env, folderId)
    for (const item of items) {
      if (!namePredicate(item)) continue
      const ok = await driveTrash(env, item.id)
      if (ok) {
        trashed.push(`${folderLabel}/${item.name}`)
        log.push(`Trashed: ${folderLabel}/${item.name}`)
      } else {
        errors.push(`Failed to trash: ${folderLabel}/${item.name}`)
      }
    }
  }

  // 1. Clean root: DL-* and __connectivity_test_*
  await scanAndClean(root, 'root', (item) => {
    return item.name.startsWith('DL-') || item.name.startsWith('__connectivity_test_')
  })

  // 2. Clean Stay Materials of test data
  if (stayMatsId) {
    await scanAndClean(stayMatsId, 'Stay Materials', (item) => {
      return item.name.startsWith('DL-') || item.name.startsWith('__connectivity_test_')
    })
  }

  return json({
    success: true,
    trashedCount: trashed.length,
    trashed,
    errors,
    log
  })
}
