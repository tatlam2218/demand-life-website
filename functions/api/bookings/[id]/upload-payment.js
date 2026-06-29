// POST /api/bookings/[id]/upload-payment
// Body: { token, request, dataUrl, mimeType }
// Storage strategy (mirrors ID upload):
//   1) Primary  : Cloudflare KV  (always succeeds)
//   2) Backup   : Google Drive   (best-effort; Service Account quota errors are swallowed)
// Then marks the payment request as 'screenshot-uploaded'.
import { json, readJson } from '../../_utils.js'
import { driveCreateFolder, driveUploadFile, dataUrlToBytes, sheetsUpdateRowByBookingId } from '../../_google.js'
import { sendEmail } from '../../_email.js'
import { getBookingsSheetId, getPaymentsSheetId } from '../../_sheet_ids.js'

export async function onRequestPost({ request, env, params }) {
  const body = await readJson(request)
  if (!body) return json({ error: 'invalid_body' }, { status: 400 })

  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })
  if (!booking.detailsToken || booking.detailsToken !== body.token) {
    return json({ error: 'invalid_token' }, { status: 403 })
  }
  if (!body.dataUrl?.startsWith('data:')) {
    return json({ error: 'data_url_required' }, { status: 400 })
  }
  const parsed = dataUrlToBytes(body.dataUrl)
  if (!parsed) return json({ error: 'invalid_data_url' }, { status: 400 })
  if (parsed.bytes.length > 2 * 1024 * 1024) {
    return json({ error: 'file_too_large' }, { status: 413 })
  }

  const payments = booking.payments || []
  const pr = payments.find((p) => p.requestId === body.request)
  if (!pr) return json({ error: 'request_not_found' }, { status: 404 })

  // ---------- 1) ALWAYS: Store in KV (primary storage) ----------
  const ext = parsed.mime.includes('png') ? 'png' : 'jpg'
  const fileName = `payment-${pr.requestId}-${Date.now()}.${ext}`
  const uploadedAt = new Date().toISOString()
  const kvKey = `booking-file:${booking.id}:${fileName}`
  await env.DEMAIN_DATA.put(kvKey, body.dataUrl, {
    metadata: { mime: parsed.mime, size: parsed.bytes.length, uploadedAt }
  })

  const uploaded = {
    kvKey,
    fileName,
    mime: parsed.mime,
    size: parsed.bytes.length,
    uploadedAt,
    url: `/api/admin/bookings/${booking.id}/file?name=${encodeURIComponent(fileName)}`,  // admin-only retrieval
    driveFileId: null,
    driveUrl: null
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
      const f = await driveUploadFile(env, folderId, fileName, parsed.mime, parsed.bytes)
      uploaded.driveFileId = f.id
      uploaded.driveUrl = f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`
    } catch (err) {
      // Service Account quota / no shared drive — expected on free Gmail; not fatal.
      uploaded.driveError = err.message?.slice(0, 200) || 'drive_upload_failed'
    }
  }

  // Update payment request
  pr.screenshots = pr.screenshots || []
  pr.screenshots.push(uploaded)
  if (pr.status === 'awaiting') pr.status = 'screenshot-uploaded'
  booking.unreadByAdmin = true
  booking.history = booking.history || []
  booking.history.push({ at: new Date().toISOString(), action: 'payment_screenshot_uploaded', requestId: pr.requestId, by: 'guest' })

  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))

  // Bookings sheet — update payment status summary
  if ((await getBookingsSheetId(env))) {
    try {
      await sheetsUpdateRowByBookingId(env, (await getBookingsSheetId(env)), booking.id, {
        'Latest Payment Status': `${pr.requestId}: screenshot uploaded`
      })
    } catch (err) { /* */ }
  }

  // Payments sheet — update the row for this requestId
  const paymentsSheetId = await getPaymentsSheetId(env)
  if (paymentsSheetId) {
    try {
      await sheetsUpdateRowByBookingId(env, paymentsSheetId, pr.requestId, {
        'Status': 'screenshot-uploaded',
        'Screenshot URL': uploaded.driveUrl || uploaded.url
      })
    } catch (err) { /* non-fatal */ }
  }

  // Notify staff
  if (env.RESEND_API_KEY && env.BOOKING_NOTIFY_EMAIL) {
    try {
      await sendEmail(env, {
        to: env.BOOKING_NOTIFY_EMAIL,
        subject: `Payment screenshot uploaded · ${booking.name} · ${pr.requestId}`,
        html: `<!doctype html><html><body style="font-family:sans-serif;background:#fafaf7;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e6e1;border-radius:6px;padding:32px;">
<h2 style="font-weight:300;">Payment screenshot received</h2>
<p><code style="background:#fafaf7;padding:4px 8px;border-radius:3px;">${booking.id}</code> · ${booking.name}</p>
<p>Request: ${pr.requestId} · <strong>HK$ ${pr.amount.toLocaleString()}</strong></p>
${uploaded ? `<p><a href="${uploaded.url}">View screenshot ↗</a></p>` : ''}
<p style="margin-top:24px;text-align:center;">
<a href="${env.SITE_URL || 'https://demain-life.pages.dev'}/admin" style="background:#2a2826;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;display:inline-block;">Review &amp; approve in admin →</a>
</p>
</div></body></html>`,
        replyTo: booking.email
      })
    } catch (err) { /* */ }
  }

  return json({ success: true, uploaded })
}
