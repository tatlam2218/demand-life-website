// POST /api/bookings/[id]/details
// Body: { token, details: {...} }
import { json, readJson } from '../../_utils.js'
import { sheetsUpdateRowByBookingId } from '../../_google.js'
import { sendEmail } from '../../_email.js'
import { getBookingsSheetId } from '../../_sheet_ids.js'
import { buildContractHtml } from '../../_contract.js'

function sanitize(s, max = 500) {
  if (typeof s !== 'string') return ''
  return s.trim().slice(0, max)
}

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

  const d = body.details || {}

  // Validate required fields (signature + agreements removed — moved to contract step)
  const required = ['documentType', 'documentNumber', 'name', 'dateOfBirth', 'gender',
    'occupation', 'currentAddress',
    'emergencyName', 'emergencyRelation', 'emergencyPhone']
  const missing = []
  for (const k of required) {
    if (!sanitize(d[k] || '')) missing.push(k)
  }
  if (missing.length) {
    return json({ error: 'missing_fields', missing }, { status: 400 })
  }

  // Must have ID front uploaded (check kvKey OR driveFileId OR url — any storage proof)
  const idFront = booking.documents?.idFront
  if (!idFront || (!idFront.kvKey && !idFront.driveFileId && !idFront.fileId && !idFront.url)) {
    return json({ error: 'id_front_required' }, { status: 400 })
  }

  const details = {
    documentType: sanitize(d.documentType, 30),
    documentNumber: sanitize(d.documentNumber, 60),
    name: sanitize(d.name, 120),
    nameChinese: sanitize(d.nameChinese, 60),
    nationality: sanitize(d.nationality, 60),
    dateOfBirth: sanitize(d.dateOfBirth, 20),
    gender: sanitize(d.gender, 5),
    issueDate: sanitize(d.issueDate, 20),
    expiryDate: sanitize(d.expiryDate, 20),
    occupation: sanitize(d.occupation, 120),
    currentAddress: sanitize(d.currentAddress, 500),
    // Preferred contact method (re-confirmed at profile step; may differ from booking-step choice)
    contactMethod: ['email','phone','whatsapp','wechat'].includes(d.contactMethod) ? d.contactMethod : (booking.contactMethod || 'email'),
    whatsappNumber: sanitize(d.whatsappNumber, 60),
    wechatId: sanitize(d.wechatId, 60),
    emergencyName: sanitize(d.emergencyName, 120),
    emergencyRelation: sanitize(d.emergencyRelation, 60),
    emergencyPhone: sanitize(d.emergencyPhone, 60),
    emergencyEmail: sanitize(d.emergencyEmail, 200),
    preferredCheckIn: sanitize(d.preferredCheckIn, 60),
    specialRequests: sanitize(d.specialRequests, 1000),
    // Privacy notice acknowledged by act of submission (no explicit checkbox).
    // Tenancy agreement + signature happen at the contract step.
    privacyAcknowledged: true,
    aiAssisted: d.aiAssisted === true,
    signedAt: new Date().toISOString()
  }

  // Update booking
  booking.details = details
  booking.detailsSubmittedAt = new Date().toISOString()

  // Propagate preferred contact method to top-level booking so future emails/SMS use it.
  if (details.contactMethod) {
    booking.contactMethod = details.contactMethod
    if (details.contactMethod === 'whatsapp' && details.whatsappNumber) booking.whatsappNumber = details.whatsappNumber
    if (details.contactMethod === 'wechat' && details.wechatId) booking.wechatId = details.wechatId
  }

  // Gated workflow: only advance to profile-submitted (NOT auto-send contract)
  if (booking.status === 'profile-sent') {
    booking.status = 'profile-submitted'
  }

  // Auto-generate contract draft so admin sees it immediately on opening this booking.
  // Stored as HTML body only (no <doctype> wrapper). Editable until contract is sent.
  if (!booking.contractDraft || !booking.contractDraft.frozen) {
    try {
      const lang = booking.sourceLang || 'en'
      const built = await buildContractHtml(env, booking, lang)
      booking.contractDraft = {
        html: built.bodyHtml || built.html,        // body-only HTML for the rich-text editor
        lang,
        generatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
        source: 'auto-template',
        monthlyRent: built.monthlyRent,
        depositMonths: built.depositMonths,
        depositAmount: built.depositAmount,
        firstMonthRent: built.firstMonthRent,
        totalPrepayment: built.totalPrepayment,
        moveOutDate: built.moveOutDate,
        contractNumber: built.contractNumber,
        frozen: false
      }
    } catch (err) {
      // Draft generation failure is non-fatal — admin can still generate manually later.
      booking.contractDraftError = err.message?.slice(0, 200) || 'draft_generation_failed'
    }
  }
  // Mark unread so admin sees the red dot
  booking.unreadByAdmin = true
  booking.history = booking.history || []
  booking.history.push({
    at: new Date().toISOString(),
    action: 'details_submitted',
    by: 'guest'
  })
  // Update index entry's status
  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))
  try {
    const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
    const index = Array.isArray(indexRaw) ? indexRaw : []
    const idx = index.findIndex((b) => b.id === booking.id)
    if (idx !== -1) {
      index[idx].status = booking.status
      index[idx].unreadByAdmin = true
      await env.DEMAIN_DATA.put('booking-index', JSON.stringify(index))
    }
  } catch (err) { /* ignore index error */ }

  // Sync to Google Sheet (best effort)
  const sheetResult = { updated: false, error: null }
  if ((await getBookingsSheetId(env)) && env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const updates = {
        'Status': booking.status,
        'Nationality': details.nationality || booking.nationality || '',
        'Doc Type': details.documentType,
        'Doc Number': details.documentNumber,
        'Name (Romanized)': details.name,
        'Name (Chinese)': details.nameChinese,
        'Date of Birth': details.dateOfBirth,
        'Gender': details.gender,
        'Occupation': details.occupation,
        'Current Address': details.currentAddress,
        'Emergency Name': details.emergencyName,
        'Emergency Relation': details.emergencyRelation,
        'Emergency Phone': details.emergencyPhone,
        'Emergency Email': details.emergencyEmail,
        'Special Requests': details.specialRequests,
        'Signature': details.signature,
        'Details Submitted At': booking.detailsSubmittedAt,
        'AI Assisted': details.aiAssisted ? 'Yes' : 'No'
      }
      const ok = await sheetsUpdateRowByBookingId(env, (await getBookingsSheetId(env)), booking.id, updates)
      sheetResult.updated = ok
    } catch (err) {
      sheetResult.error = err.message
    }
  }

  // Send guest a "we received your profile" confirmation email.
  // The contract email is sent SEPARATELY by admin via send-contract workflow, so the client only
  // receives one contract email — the one the admin actually confirms after reviewing the draft.
  if (env.RESEND_API_KEY && booking.email) {
    try {
      const lang = booking.sourceLang || 'en'
      const COPY = {
        en: {
          subject: `Profile received — ${booking.id}`,
          h1: 'Thank you — we\'ve received your details',
          body: 'Our team is now reviewing your application. We\'ll send your tenancy agreement to this email shortly.'
        },
        'zh-CN': {
          subject: `资料已收到 — ${booking.id}`,
          h1: '谢谢—我们已收到您的资料',
          body: '我们的团队正在审核您的申请。租赁合同将会到这个邮箱。'
        },
        'zh-HK': {
          subject: `資料已收到 — ${booking.id}`,
          h1: '謝謝—我們已收到您的資料',
          body: '我們的團隊正在審核您的申請。租賃合約將會寄到這個電郵。'
        }
      }
      const c = COPY[lang] || COPY.en
      const html = `<!doctype html><html><body style="font-family:-apple-system,sans-serif; background:#fafaf7; padding:24px;">
<div style="max-width:560px; margin:0 auto; background:#fff; border:1px solid #e8e6e1; border-radius:6px; padding:36px;">
<p style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#8a8780;">Demain Life · ${booking.id}</p>
<h1 style="font-weight:300;">${c.h1}</h1>
<p style="color:#4a4744; line-height:1.6;">${c.body}</p>
</div></body></html>`
      await sendEmail(env, { to: booking.email, subject: c.subject, html, replyTo: env.BOOKING_NOTIFY_EMAIL })
    } catch (err) { /* best effort */ }
  }

  // Notify staff via email (best effort)
  const emailResult = { sent: false, error: null }
  if (env.RESEND_API_KEY && env.BOOKING_NOTIFY_EMAIL) {
    try {
      const siteUrl = env.SITE_URL || 'https://demain-life.pages.dev'
      const adminUrl = `${siteUrl}/admin`
      const driveLink = booking.driveFolder ? `<p style="margin:8px 0;"><a href="${booking.driveFolder}">Open Drive folder ↗</a></p>` : ''
      const html = `<!doctype html><html><body style="font-family:-apple-system,'Segoe UI',sans-serif; background:#fafaf7; padding:24px;">
<div style="max-width:560px; margin:0 auto; background:#fff; border:1px solid #e8e6e1; border-radius:6px; padding:32px;">
  <p style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#8a8780;">Demain Life · Details received</p>
  <h2 style="font-weight:300; margin:8px 0 16px;">${booking.name} completed Phase 2</h2>
  <p style="background:#fafaf7; padding:8px 12px; border-radius:4px; font-family:'SF Mono',Menlo,monospace; display:inline-block;">${booking.id}</p>
  <ul style="font-size:14px; color:#4a4744; line-height:1.8; padding-left:18px;">
    <li>ID document: ${details.documentType} (${details.documentNumber})</li>
    <li>Name (romanized): ${details.name}</li>
    ${details.nameChinese ? `<li>中文姓名: ${details.nameChinese}</li>` : ''}
    <li>DOB: ${details.dateOfBirth} · Gender: ${details.gender}</li>
    <li>Occupation: ${details.occupation}</li>
    <li>Emergency: ${details.emergencyName} (${details.emergencyRelation}) · ${details.emergencyPhone}</li>
    <li>AI assisted: ${details.aiAssisted ? 'Yes' : 'No'}</li>
    <li>Signed by: ${details.signature}</li>
  </ul>
  ${driveLink}
  <p style="text-align:center; margin-top:24px;">
    <a href="${adminUrl}" style="display:inline-block; background:#2a2826; color:#fff; padding:12px 24px; text-decoration:none; border-radius:4px;">Review in admin →</a>
  </p>
</div></body></html>`
      await sendEmail(env, {
        to: env.BOOKING_NOTIFY_EMAIL,
        subject: `Phase 2 completed · ${booking.name} · ${booking.id}`,
        html,
        replyTo: booking.email
      })
      emailResult.sent = true
    } catch (err) {
      emailResult.error = err.message
    }
  }

  return json({
    success: true,
    bookingId: booking.id,
    sheet: sheetResult,
    email: emailResult
  })
}
