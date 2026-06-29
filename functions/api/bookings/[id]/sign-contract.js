// POST /api/bookings/[id]/sign-contract
// Body: { token, signatureMethod: 'drawn'|'typed', signatureImage: data:image/png..., signatureText, scrolledToBottom: true, lang }
import { json, readJson } from '../../_utils.js'
import { getLegalTemplates, renderContractHTML, buildContractData, sha256Hex } from '../../_contracts.js'
import { driveUploadFile, driveCreateFolder, dataUrlToBytes, sheetsUpdateRowByBookingId } from '../../_google.js'
import { sendEmail } from '../../_email.js'
import { getBookingsSheetId } from '../../_sheet_ids.js'

export async function onRequestPost({ request, env, params }) {
  const body = await readJson(request)
  if (!body) return json({ error: 'invalid_body' }, { status: 400 })

  const token = body.token
  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })
  if (!booking.detailsToken || booking.detailsToken !== token) {
    return json({ error: 'invalid_token' }, { status: 403 })
  }
  if (!booking.details) {
    return json({ error: 'details_not_submitted' }, { status: 400 })
  }
  if (body.scrolledToBottom !== true) {
    return json({ error: 'must_read_full_contract' }, { status: 400 })
  }
  if (!body.signatureImage || !body.signatureImage.startsWith('data:image/')) {
    return json({ error: 'signature_image_required' }, { status: 400 })
  }
  const signatureText = (body.signatureText || '').trim().slice(0, 120)
  if (!signatureText) {
    return json({ error: 'signature_text_required' }, { status: 400 })
  }
  const signatureMethod = body.signatureMethod === 'drawn' ? 'drawn' : 'typed'

  // Load room
  const content = await env.DEMAIN_DATA?.get('site-content', 'json')
  const rooms = content?.rooms || []
  const room = rooms.find((r) => r.id === booking.roomType)
  const lang = body.lang || booking.sourceLang || 'en'
  let roomLocalized = room
  if (room) {
    const tr = room.translations?.[lang] || room.translations?.en || {}
    roomLocalized = { ...room, title: tr.title || room.id, price: tr.price || '' }
  }

  const legal = await getLegalTemplates(env)

  // Build signature HTML to embed in contract
  const signatureImageHtml = `<img src="${body.signatureImage}" alt="Signature" style="max-height:60px; max-width:240px;" />`
  const signedAt = new Date().toISOString()

  // Final contract HTML (with embedded signature image)
  const finalHtml = renderContractHTML(booking, roomLocalized, legal, {
    lang,
    signatureImageHtml,
    signatureDate: signedAt.slice(0, 10),
    signatureName: signatureText
  })

  // Compute hash of the final HTML
  const contractHash = await sha256Hex(finalHtml)

  // --- Upload to Drive: 1) HTML 2) signature PNG ---
  let folderId = booking.driveFolderId
  if (!folderId && env.GOOGLE_DRIVE_FOLDER_ID) {
    try {
      const parentFolderId = (await env.DEMAIN_DATA.get('folder-id:stay-materials')) || env.GOOGLE_DRIVE_FOLDER_ID
      folderId = await driveCreateFolder(env, parentFolderId, `${booking.id} — ${booking.name}`)
      booking.driveFolderId = folderId
      booking.driveFolder = `https://drive.google.com/drive/folders/${folderId}`
    } catch (err) {
      // continue
    }
  }

  const uploaded = { contractHtml: null, signaturePng: null, contractPdf: null }
  if (folderId) {
    // Upload HTML
    try {
      const htmlBytes = new TextEncoder().encode(finalHtml)
      const f = await driveUploadFile(env, folderId, 'contract-signed.html', 'text/html', htmlBytes, { replace: true })
      uploaded.contractHtml = { fileId: f.id, url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view` }
    } catch (err) { /* ignore */ }
    // Upload signature PNG
    try {
      const parsed = dataUrlToBytes(body.signatureImage)
      if (parsed) {
        const f = await driveUploadFile(env, folderId, 'signature.png', parsed.mime, parsed.bytes, { replace: true })
        uploaded.signaturePng = { fileId: f.id, url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view` }
      }
    } catch (err) { /* ignore */ }
    // Try to render PDF via Cloudflare Browser Rendering (REST). If not bound, skip.
    if (env.CF_ACCOUNT_ID && env.CF_BROWSER_TOKEN) {
      try {
        const pdfResp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/browser-rendering/pdf`, {
          method: 'POST',
          headers: { authorization: `Bearer ${env.CF_BROWSER_TOKEN}`, 'content-type': 'application/json' },
          body: JSON.stringify({ html: finalHtml, viewport: { width: 1024, height: 1450 } })
        })
        if (pdfResp.ok) {
          const buf = new Uint8Array(await pdfResp.arrayBuffer())
          const f = await driveUploadFile(env, folderId, 'contract-signed.pdf', 'application/pdf', buf, { replace: true })
          uploaded.contractPdf = { fileId: f.id, url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view` }
        }
      } catch (err) { /* ignore */ }
    }
  }

  // Save signature record to booking
  booking.contract = {
    signedAt,
    signatureMethod,
    signatureText,
    signatureImageDriveFileId: uploaded.signaturePng?.fileId || null,
    contractHtmlDriveFileId: uploaded.contractHtml?.fileId || null,
    contractPdfDriveFileId: uploaded.contractPdf?.fileId || null,
    contractPdfUrl: uploaded.contractPdf?.url || null,
    contractHtmlUrl: uploaded.contractHtml?.url || null,
    contractHash,
    contractTemplateVersion: legal.contract?.version || 1,
    signerIp: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown',
    signerUserAgent: (request.headers.get('user-agent') || '').slice(0, 200),
    aiAssisted: booking.details?.aiAssisted || false
  }
  booking.contractSignedAt = signedAt
  booking.contractHash = contractHash
  if (['contract-sent','profile-submitted','details-submitted','new'].includes(booking.status)) {
    booking.status = 'signed'
  }
  booking.unreadByAdmin = true
  booking.history = booking.history || []
  booking.history.push({ at: signedAt, action: 'contract_signed', method: signatureMethod, by: 'guest' })

  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))
  // Update index
  try {
    const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
    const index = Array.isArray(indexRaw) ? indexRaw : []
    const idx = index.findIndex((b) => b.id === booking.id)
    if (idx !== -1) {
      index[idx].status = booking.status
      await env.DEMAIN_DATA.put('booking-index', JSON.stringify(index))
    }
  } catch (err) { /* ignore */ }

  // Update Sheet (best effort)
  if ((await getBookingsSheetId(env)) && env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      await sheetsUpdateRowByBookingId(env, (await getBookingsSheetId(env)), booking.id, {
        'Status': booking.status,
        'Contract Signed At': signedAt,
        'Contract Hash': contractHash.slice(0, 16) + '…',
        'Signature Method': signatureMethod
      })
    } catch (err) { /* ignore */ }
  }

  // Send notifications
  if (env.RESEND_API_KEY) {
    try {
      // Guest
      await sendEmail(env, {
        to: booking.email,
        subject: `Contract signed — ${booking.id}`,
        html: `<!doctype html><html><body style="font-family:sans-serif;background:#fafaf7;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e6e1;border-radius:6px;padding:32px;">
<p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8780;">Demain Life · Contract</p>
<h2 style="font-weight:300;margin:8px 0 16px;">Thank you, ${booking.name}.</h2>
<p>We have received your signed tenancy agreement. Reference: <code style="background:#fafaf7;padding:4px 8px;border-radius:3px;">${booking.id}</code></p>
<p>Our team will contact you shortly to confirm the payment details for your stay. Once payment is received and verified, your booking will be fully confirmed.</p>
<p style="margin-top:24px;font-size:13px;color:#8a8780;">Audit:<br>Signed at ${signedAt}<br>Document hash: ${contractHash.slice(0, 32)}…<br>Template version: ${legal.contract?.version || 1}</p>
</div></body></html>`,
        replyTo: env.BOOKING_NOTIFY_EMAIL
      })
    } catch (err) { /* */ }
    try {
      // Staff
      if (env.BOOKING_NOTIFY_EMAIL) {
        await sendEmail(env, {
          to: env.BOOKING_NOTIFY_EMAIL,
          subject: `Contract signed · ${booking.name} · ${booking.id}`,
          html: `<!doctype html><html><body style="font-family:sans-serif;background:#fafaf7;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e6e1;border-radius:6px;padding:32px;">
<h2 style="font-weight:300;">Contract signed: ${booking.name}</h2>
<p><code style="background:#fafaf7;padding:4px 8px;border-radius:3px;">${booking.id}</code></p>
<ul>
<li>Method: ${signatureMethod}</li>
<li>Signed by: ${signatureText}</li>
<li>Hash: ${contractHash.slice(0, 32)}…</li>
${uploaded.contractPdf ? `<li><a href="${uploaded.contractPdf.url}">Contract PDF ↗</a></li>` : (uploaded.contractHtml ? `<li><a href="${uploaded.contractHtml.url}">Contract HTML ↗</a></li>` : '')}
${booking.driveFolder ? `<li><a href="${booking.driveFolder}">Drive folder ↗</a></li>` : ''}
</ul>
<p style="margin-top:24px;text-align:center;">
<a href="${env.SITE_URL || 'https://demain-life.pages.dev'}/admin" style="background:#2a2826;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;display:inline-block;">Review in admin →</a>
</p>
</div></body></html>`,
          replyTo: booking.email
        })
      }
    } catch (err) { /* */ }
  }

  return json({
    success: true,
    bookingId: booking.id,
    contractHash,
    pdfUrl: uploaded.contractPdf?.url || null,
    htmlUrl: uploaded.contractHtml?.url || null
  })
}
