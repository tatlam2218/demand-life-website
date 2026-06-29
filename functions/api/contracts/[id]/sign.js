// POST /api/contracts/[id]/sign
// Body: { token, lang, signatureMethod: 'drawn'|'typed', signatureImage (data URL), signatureName, scrolledToBottom: true }
// Locks the contract: stores signature, computes hash, renders PDF (best effort), saves to Drive.
import { json, readJson } from '../../_utils.js'
import { buildContractHtml, sha256 } from '../../_contract.js'
import { driveUploadFile, dataUrlToBytes } from '../../_google.js'
import { htmlToPdf, isPdfConfigured } from '../../_pdf.js'
import { sendEmail } from '../../_email.js'

export async function onRequestPost({ request, env, params }) {
  const body = await readJson(request)
  if (!body) return json({ error: 'invalid_body' }, { status: 400 })

  const id = params.id
  const token = body.token
  if (!token) return json({ error: 'token_required' }, { status: 400 })

  const booking = await env.DEMAIN_DATA.get(`booking:${id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })
  if (!booking.detailsToken || booking.detailsToken !== token) {
    return json({ error: 'invalid_token' }, { status: 403 })
  }
  if (booking.detailsTokenExpiresAt && new Date(booking.detailsTokenExpiresAt).getTime() < Date.now()) {
    return json({ error: 'token_expired' }, { status: 403 })
  }
  if (!booking.details) {
    return json({ error: 'details_required' }, { status: 400 })
  }
  if (booking.contract?.contractHash) {
    return json({ error: 'already_signed', signedAt: booking.contract.signedAt }, { status: 409 })
  }

  const signatureMethod = body.signatureMethod === 'drawn' ? 'drawn' : 'typed'
  const signatureImage = typeof body.signatureImage === 'string' && body.signatureImage.startsWith('data:image/')
    ? body.signatureImage : ''
  const signatureName = (body.signatureName || '').toString().trim().slice(0, 120)
  if (!signatureName && !signatureImage) {
    return json({ error: 'signature_required' }, { status: 400 })
  }

  // Audit info
  const ipAddress = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || ''
  const userAgent = request.headers.get('user-agent') || ''
  const signedAt = new Date().toISOString()

  // Build a "locked" booking object snapshot for hashing
  const lang = body.lang === 'zh-CN' || body.lang === 'zh-HK' ? body.lang : (booking.sourceLang || 'en')

  // First render WITHOUT signature image (the canonical document text)
  const baseRender = await buildContractHtml(env, booking, lang)
  // Hash the canonical body (no signature) so signature can't alter the hash
  const contractHash = await sha256(baseRender.html)

  // Save contract metadata in booking
  booking.contract = {
    signedAt,
    signatureMethod,
    signatureImage,
    signatureName,
    contractHash,
    templateVersion: baseRender.templateVersion,
    contractNumber: baseRender.contractNumber,
    contractDate: baseRender.contractDate,
    moveOutDate: baseRender.moveOutDate,
    monthlyRent: baseRender.monthlyRent,
    depositMonths: baseRender.depositMonths,
    depositAmount: baseRender.depositAmount,
    firstMonthRent: baseRender.firstMonthRent,
    totalPrepayment: baseRender.totalPrepayment,
    language: lang,
    ipAddress,
    userAgent,
    scrolledToBottom: body.scrolledToBottom === true
  }

  // Now render signed version (with signature & audit footer)
  const signedRender = await buildContractHtml(env, booking, lang)
  booking.contract.signedHtml = signedRender.html

  // Status flow: any pre-signed state → signed.
  // The correct prior state in normal flow is 'contract-sent' (admin sent the contract).
  // We also accept earlier states ('profile-submitted', 'new', 'reviewing') as a safety net,
  // since the legally meaningful event is the signature itself, not the prior workflow state.
  if (['contract-sent', 'profile-submitted', 'reviewing', 'new', 'details-submitted'].includes(booking.status)) {
    booking.status = 'signed'
  }
  booking.history = booking.history || []
  booking.history.push({
    at: signedAt,
    action: 'contract_signed',
    method: signatureMethod,
    contractHash,
    by: 'guest'
  })

  // Save first (before slow operations)
  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))
  // Update index status
  try {
    const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
    const index = Array.isArray(indexRaw) ? indexRaw : []
    const idx = index.findIndex((b) => b.id === booking.id)
    if (idx !== -1) {
      index[idx].status = booking.status
      await env.DEMAIN_DATA.put('booking-index', JSON.stringify(index))
    }
  } catch (e) { /* */ }

  // Try to render PDF & upload to Drive
  const drive = { uploaded: false, htmlUploaded: false, pdfUploaded: false, errors: [] }

  // Always upload the HTML (works without PDF service)
  if (booking.driveFolderId && env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const htmlBytes = new TextEncoder().encode(signedRender.html)
      await driveUploadFile(env, booking.driveFolderId, 'contract-signed.html', 'text/html', htmlBytes, { replace: true })
      drive.htmlUploaded = true
    } catch (err) {
      drive.errors.push('html: ' + err.message)
    }

    // Also try PDF
    if (isPdfConfigured(env)) {
      try {
        const pdfBytes = await htmlToPdf(env, signedRender.html)
        await driveUploadFile(env, booking.driveFolderId, 'contract-signed.pdf', 'application/pdf', pdfBytes, { replace: true })
        drive.pdfUploaded = true
        drive.uploaded = true
      } catch (err) {
        drive.errors.push('pdf: ' + err.message)
      }
    } else {
      drive.errors.push('pdf: browser_rendering_not_configured')
    }
  }

  // Send notification to staff
  let emailResult = { sent: false, error: null }
  if (env.RESEND_API_KEY && env.BOOKING_NOTIFY_EMAIL) {
    try {
      const siteUrl = env.SITE_URL || 'https://demain-life.pages.dev'
      const html = `<!doctype html><html><body style="font-family:-apple-system,sans-serif; background:#fafaf7; padding:24px;">
<div style="max-width:560px; margin:0 auto; background:#fff; border:1px solid #e8e6e1; border-radius:6px; padding:32px;">
  <p style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#8a8780;">Demain Life · Contract signed</p>
  <h2 style="font-weight:300;">${booking.name} signed the contract</h2>
  <p style="background:#fafaf7; padding:8px 12px; border-radius:4px; font-family:'SF Mono',Menlo,monospace; display:inline-block;">${booking.id}</p>
  <ul style="font-size:14px; color:#4a4744; line-height:1.7;">
    <li>Contract no.: ${baseRender.contractNumber}</li>
    <li>Method: ${signatureMethod}</li>
    <li>Signed: ${signedAt}</li>
    <li>Monthly rent: HK$ ${baseRender.monthlyRent.toLocaleString()}</li>
    <li>Total prepayment: HK$ ${baseRender.totalPrepayment.toLocaleString()}</li>
    <li>Hash: <code style="font-size:11px;">${contractHash.slice(0, 32)}…</code></li>
  </ul>
  ${booking.driveFolder ? `<p><a href="${booking.driveFolder}">Drive folder ↗</a></p>` : ''}
  <p style="text-align:center; margin-top:24px;">
    <a href="${siteUrl}/admin" style="display:inline-block; background:#2a2826; color:#fff; padding:12px 24px; text-decoration:none; border-radius:4px;">Open admin →</a>
  </p>
</div></body></html>`
      await sendEmail(env, {
        to: env.BOOKING_NOTIFY_EMAIL,
        subject: `Contract signed · ${booking.name} · ${booking.id}`,
        html,
        replyTo: booking.email
      })
      emailResult.sent = true
    } catch (err) {
      emailResult.error = err.message
    }
  }

  // Also send confirmation to guest (with contract attached or link)
  // We can't easily attach PDF via Resend without re-uploading, so send a link
  if (env.RESEND_API_KEY && booking.email) {
    try {
      const siteUrl = env.SITE_URL || 'https://demain-life.pages.dev'
      const viewUrl = `${siteUrl}/api/contracts/${booking.id}/view?token=${booking.detailsToken}&lang=${lang}`
      const driveLink = booking.driveFolder || ''
      const COPY = {
        en: { subject: `Your signed tenancy agreement — ${booking.id}`, h1: 'Thank you. Your agreement is signed.', body: 'A signed copy has been added to your booking. You can view or print the agreement from the link below at any time.', cta: 'View agreement →' },
        'zh-CN': { subject: `您已签署的租约 — ${booking.id}`, h1: '感谢您，租约已签署。', body: '已签署版本已加入您的预订档案。您可随时通过下方链接查阅或打印此租约。', cta: '查看租约 →' },
        'zh-HK': { subject: `您已簽署的租約 — ${booking.id}`, h1: '感謝您，租約已簽署。', body: '已簽署版本已加入您的預訂檔案。您可隨時透過下方連結查閱或列印此租約。', cta: '查看租約 →' }
      }
      const c = COPY[lang] || COPY.en
      const html = `<!doctype html><html><body style="font-family:-apple-system,sans-serif; background:#fafaf7; padding:24px;">
<div style="max-width:560px; margin:0 auto; background:#fff; border:1px solid #e8e6e1; border-radius:6px; padding:36px;">
  <p style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#8a8780;">Demain Life · ${booking.id}</p>
  <h1 style="font-weight:300; margin: 12px 0;">${c.h1}</h1>
  <p style="color:#4a4744; line-height:1.6;">${c.body}</p>
  <p style="text-align:center; margin: 28px 0;">
    <a href="${viewUrl}" style="display:inline-block; background:#2a2826; color:#fff; padding:14px 28px; text-decoration:none; border-radius:4px;">${c.cta}</a>
  </p>
  <p style="color:#8a8780; font-size:12px; margin-top:24px;">Contract no.: ${baseRender.contractNumber}<br>Hash: ${contractHash.slice(0, 16)}…</p>
</div></body></html>`
      await sendEmail(env, {
        to: booking.email,
        subject: c.subject,
        html,
        replyTo: env.BOOKING_NOTIFY_EMAIL
      })
    } catch (err) {
      // best effort
    }
  }

  return json({
    success: true,
    bookingId: booking.id,
    contractNumber: baseRender.contractNumber,
    contractHash,
    signedAt,
    drive,
    email: emailResult
  })
}
