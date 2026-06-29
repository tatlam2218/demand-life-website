// POST /api/bookings/[id]/upload-id
// Body: { token, side: 'front'|'back', dataUrl, mimeType, runOCR: boolean }
// Returns: { uploaded: { fileId|kvKey, url, fileName, uploadedAt }, ocr: {...} | null }
//
// Storage strategy:
//   1) ALWAYS save to Cloudflare KV (sensitive ID data stays inside CF trust boundary)
//   2) ATTEMPT Drive upload as a backup copy (gracefully ignores Service Account quota errors)
//   3) Grok OCR runs regardless of storage outcome
//
// Why KV-first: free-tier Service Accounts can't upload to personal Drive folders (storage quota = 0).
// Sensitive ID images deserve a single trust boundary anyway. Admin views via /api/admin/bookings/<id>/file?side=front

import { json, readJson } from '../../_utils.js'
import { driveUploadFile, driveCreateFolder, dataUrlToBytes } from '../../_google.js'
import { extractDocumentInfo } from '../../_grok_vision.js'

export async function onRequestPost({ request, env, params }) {
  const body = await readJson(request)
  if (!body) return json({ error: 'invalid_body' }, 400)

  const id = params.id
  const token = body.token
  if (!token) return json({ error: 'token_required' }, 400)

  const booking = await env.DEMAIN_DATA.get(`booking:${id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, 404)
  if (!booking.detailsToken || booking.detailsToken !== token) {
    return json({ error: 'invalid_token' }, 403)
  }
  if (booking.detailsTokenExpiresAt && new Date(booking.detailsTokenExpiresAt).getTime() < Date.now()) {
    return json({ error: 'token_expired' }, 403)
  }

  const side = body.side === 'back' ? 'back' : 'front'
  const dataUrl = body.dataUrl
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return json({ error: 'data_url_required' }, 400)
  }
  const parsed = dataUrlToBytes(dataUrl)
  if (!parsed) return json({ error: 'invalid_data_url' }, 400)
  // Size guard: 1MB max (after compression should be ~200KB; allow margin)
  if (parsed.bytes.length > 1024 * 1024) {
    return json({ error: 'file_too_large', message: 'Image must be < 1MB after compression' }, 413)
  }

  const ext = parsed.mime.includes('png') ? 'png' : 'jpg'
  const fileName = `id-${side}.${ext}`
  const uploadedAt = new Date().toISOString()

  // ---------- 1) ALWAYS: Store in KV (primary storage) ----------
  const kvKey = `booking-file:${booking.id}:${fileName}`
  await env.DEMAIN_DATA.put(kvKey, dataUrl, {
    metadata: { mime: parsed.mime, size: parsed.bytes.length, uploadedAt }
  })

  const uploadInfo = {
    kvKey,
    fileName,
    mime: parsed.mime,
    size: parsed.bytes.length,
    uploadedAt,
    url: `/api/admin/bookings/${booking.id}/file?side=${side}`,  // admin-only retrieval URL
    driveUrl: null,
    driveFileId: null
  }

  // ---------- 2) BEST-EFFORT: Also push to Drive ----------
  if (env.GOOGLE_DRIVE_FOLDER_ID) {
    try {
      let folderId = booking.driveFolderId
      if (!folderId) {
        const parentFolderId = (await env.DEMAIN_DATA.get('folder-id:stay-materials')) || env.GOOGLE_DRIVE_FOLDER_ID
        folderId = await driveCreateFolder(env, parentFolderId, `${booking.id} — ${booking.name}`)
        booking.driveFolderId = folderId
        booking.driveFolder = `https://drive.google.com/drive/folders/${folderId}`
      }
      const uploaded = await driveUploadFile(env, folderId, fileName, parsed.mime, parsed.bytes, { replace: true })
      uploadInfo.driveFileId = uploaded.id
      uploadInfo.driveUrl = uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`
    } catch (err) {
      // Service Account quota errors are expected on free-tier Gmail; not fatal.
      console.warn(`Drive upload skipped (${side}):`, err.message?.slice(0, 200))
      uploadInfo.driveError = err.message?.slice(0, 200) || 'drive_upload_failed'
    }
  }

  // ---------- 3) Grok OCR (independent of storage) ----------
  let ocr = null
  if (body.runOCR !== false) {
    try {
      ocr = await extractDocumentInfo(env, dataUrl, { side })
    } catch (err) {
      ocr = { error: 'ocr_failed', message: err.message }
    }
  }

  // ---------- 4) Save booking record ----------
  booking.documents = booking.documents || {}
  const docKey = side === 'front' ? 'idFront' : 'idBack'
  booking.documents[docKey] = uploadInfo
  if (side === 'front' && ocr && !ocr.error && !ocr.skipped) {
    booking.documents.ocrFront = ocr
  }
  if (side === 'back' && ocr && !ocr.error && !ocr.skipped) {
    booking.documents.ocrBack = ocr
  }
  booking.history = booking.history || []
  booking.history.push({
    at: uploadedAt,
    action: 'id_uploaded',
    side,
    by: 'guest',
    storedIn: uploadInfo.driveFileId ? 'kv+drive' : 'kv'
  })
  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))

  return json({ uploaded: uploadInfo, ocr })
}
