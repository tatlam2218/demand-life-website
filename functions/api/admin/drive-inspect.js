// GET /api/admin/drive-inspect?folderId=...
// Lists all files/folders in a Drive folder (for debugging / setup)

import { requireAuth, json } from '../_utils.js'

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: 'unauthorized' }, 401)

  const url = new URL(request.url)
  const folderId = url.searchParams.get('folderId') || env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) return json({ error: 'folderId required' }, 400)

  const { driveAccessToken } = await import('../_google_internal.js')
  const token = await driveAccessToken(env)

  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`)
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,createdTime,owners,size)&pageSize=200`,
    { headers: { authorization: `Bearer ${token}` } }
  )
  if (!resp.ok) return json({ error: await resp.text() }, resp.status)
  const data = await resp.json()
  const items = (data.files || []).map(f => ({
    id: f.id,
    name: f.name,
    type: f.mimeType.includes('folder') ? 'folder' : (f.mimeType.includes('spreadsheet') ? 'sheet' : 'file'),
    mimeType: f.mimeType,
    createdTime: f.createdTime,
    owner: f.owners?.[0]?.emailAddress,
    size: f.size,
    url: f.mimeType.includes('folder')
      ? `https://drive.google.com/drive/folders/${f.id}`
      : (f.mimeType.includes('spreadsheet')
          ? `https://docs.google.com/spreadsheets/d/${f.id}/edit`
          : `https://drive.google.com/file/d/${f.id}/view`)
  }))
  return json({ folderId, count: items.length, items })
}
