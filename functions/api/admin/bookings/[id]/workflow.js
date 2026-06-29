// POST /api/admin/bookings/[id]/workflow
// Body: { action: 'start-reviewing' | 'send-profile' | 'send-contract' | 'send-checkin' | 'cancel',
//         customMessage?: string, sendEmail?: boolean, sendWhatsapp?: boolean }
//
// This is the central gated-workflow endpoint. Each action advances the booking
// to the next state AND optionally sends an email (default true).
import { json, requireStayAuth, readJson } from '../../../_utils.js'
import { sendEmail } from '../../../_email.js'
import { sheetsUpdateRowByBookingId } from '../../../_google.js'
import { getBookingsSheetId } from '../../../_sheet_ids.js'

const SITE_FALLBACK = 'https://demain-life.pages.dev'

// Build the customer-facing link for each action
function buildLink(env, booking, action) {
  const siteUrl = env.SITE_URL || SITE_FALLBACK
  const lang = booking.sourceLang || 'en'
  const base = `${siteUrl}/book`
  const t = booking.detailsToken
  switch (action) {
    case 'send-profile':
      return `${base}/details?id=${encodeURIComponent(booking.id)}&token=${t}&lang=${lang}`
    case 'send-contract':
      return `${base}/contract?id=${encodeURIComponent(booking.id)}&token=${t}&lang=${lang}`
    default:
      return null
  }
}

// Email templates (3 languages × 4 actions)
const TEMPLATES = {
  'send-profile': {
    en: {
      subject: (id) => `Next step: complete your profile — ${id}`,
      h1: 'Please complete your profile',
      body: (link) => `Thank you for your interest in Demain Life. To move forward, please use the secure link below to upload your ID and complete a short profile.\n\nIt takes about 2 minutes — our AI will pre-fill most fields from your ID photo.`,
      cta: 'Complete profile →'
    },
    'zh-CN': {
      subject: (id) => `下一步：补充入住资料 — ${id}`,
      h1: '请补充您的入住资料',
      body: () => `感谢您对 Demain Life 的关注。为了继续办理，请通过以下安全链接上传您的身份证件并完成个人资料。\n\n大约只需 2 分钟 — AI 将自动从证件照片识别大部分信息。`,
      cta: '补充资料 →'
    },
    'zh-HK': {
      subject: (id) => `下一步：補充入住資料 — ${id}`,
      h1: '請補充您的入住資料',
      body: () => `感謝您對 Demain Life 的關注。為了繼續辦理，請透過以下安全連結上載您的身份證件並完成個人資料。\n\n大約只需 2 分鐘 — AI 將自動從證件照片識別大部分資料。`,
      cta: '補充資料 →'
    }
  },
  'send-contract': {
    en: {
      subject: (id) => `Your tenancy agreement is ready — ${id}`,
      h1: 'Sign your tenancy agreement',
      body: () => `Good news — our team has reviewed your application. Please read your tenancy agreement carefully and sign it using the secure link below.`,
      cta: 'Review & sign →'
    },
    'zh-CN': {
      subject: (id) => `您的租赁协议已就绪 — ${id}`,
      h1: '请签署您的租赁协议',
      body: () => `好消息 — 我们的团队已审核了您的申请。请仔细阅读您的租赁协议，并通过以下安全链接进行签署。`,
      cta: '查阅并签署 →'
    },
    'zh-HK': {
      subject: (id) => `您的租賃協議已就緒 — ${id}`,
      h1: '請簽署您的租賃協議',
      body: () => `好消息 — 我們的團隊已審核了您的申請。請仔細閱讀您的租賃協議，並透過以下安全連結進行簽署。`,
      cta: '查閱並簽署 →'
    }
  },
  'send-checkin': {
    en: {
      subject: (id) => `Welcome to Demain Life — ${id}`,
      h1: 'Your booking is fully confirmed',
      body: () => `Thank you for completing your booking and payment. We're delighted to welcome you to Demain Life.\n\nPlease find your final confirmation details below — keep this email handy for check-in day.`,
      cta: null,
      checkinBlock: true   // signals the renderer to inject the check-in details panel
    },
    'zh-CN': {
      subject: (id) => `欢迎来到 Demain Life — ${id}`,
      h1: '您的预订已完全确认',
      body: () => `感谢您完成预订与付款。我们非常高兴欢迎您来到 Demain Life。\n\n以下是您的最终确认资料 — 请妥善保存本邮件以备入住当日查阅。`,
      cta: null,
      checkinBlock: true
    },
    'zh-HK': {
      subject: (id) => `歡迎來到 Demain Life — ${id}`,
      h1: '您的預訂已完全確認',
      body: () => `感謝您完成預訂與付款。我們非常高興歡迎您來到 Demain Life。\n\n以下是您的最終確認資料 — 請妥善保存本電郵以備入住當日查閱。`,
      cta: null,
      checkinBlock: true
    }
  }
}

function escapeHtml(s) {
  if (s == null) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildCheckinBlock(booking, lang) {
  const LBL = {
    en: { heading: 'Your check-in details', moveIn: 'Move-in date', addr: 'Property address', contact: 'Contact (24h)', amountPaid: 'Total paid', paidOn: 'Paid on', contractRef: 'Tenancy contract', viewContract: 'A signed copy of your tenancy agreement is attached / available on request.' },
    'zh-CN': { heading: '入住资料', moveIn: '入住日期', addr: '公寓地址', contact: '联络电话（24小时）', amountPaid: '付款总额', paidOn: '付款日期', contractRef: '租赁合同', viewContract: '已签署的租赁合同副本随邮附件发送，或根据要求提供。' },
    'zh-HK': { heading: '入住資料', moveIn: '入住日期', addr: '公寓地址', contact: '聯絡電話（24小時）', amountPaid: '付款總額', paidOn: '付款日期', contractRef: '租賃合約', viewContract: '已簽署的租賃合約副本隨電郵附件發送，或根據要求提供。' }
  }
  const L = LBL[lang] || LBL.en
  const paid = (booking.payments || []).filter(p => p.status === 'approved')
  const totalPaid = paid.reduce((s, p) => s + (p.amount || 0), 0)
  const lastPaidAt = paid.length ? (paid[paid.length - 1].approvedAt || paid[paid.length - 1].uploadedAt || '').slice(0, 10) : ''
  const contractNo = booking.contract?.contractNumber || ''
  const cell = (k, v) => v ? `<tr><td style="padding:8px 0;color:#8a8780;font-size:13px;width:42%;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:8px 0;color:#2a2826;font-size:14px;vertical-align:top;">${v}</td></tr>` : ''
  return `
  <div style="background:#fafaf7;border:1px solid #e8e6e1;border-radius:6px;padding:20px 22px;margin:20px 0;">
    <p style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b7355;margin:0 0 12px;font-weight:600;">✱ ${escapeHtml(L.heading)}</p>
    <table style="width:100%;border-collapse:collapse;">
      ${cell(L.moveIn, escapeHtml(booking.moveInDate || ''))}
      ${cell(L.addr, 'Demain@1331, Kai Tak, Kowloon, Hong Kong')}
      ${cell(L.contact, '<a href="tel:+85257408010" style="color:#2a2826;">+852 5740 8010</a>')}
      ${cell(L.amountPaid, totalPaid ? `<strong>HK$ ${totalPaid.toLocaleString()}</strong>` : '')}
      ${cell(L.paidOn, escapeHtml(lastPaidAt))}
      ${cell(L.contractRef, contractNo ? `<code style="background:#fff;padding:2px 6px;border-radius:3px;font-size:12px;">${escapeHtml(contractNo)}</code>` : '')}
    </table>
    <p style="font-size:12px;color:#8a8780;margin:12px 0 0;line-height:1.6;">${escapeHtml(L.viewContract)}</p>
  </div>`
}

function renderActionEmail(template, booking, link, customMessage, lang) {
  const greetingName = booking.name || ''
  const bodyText = customMessage && customMessage.trim() ? customMessage.trim() : template.body(link)
  const lines = bodyText.split('\n').map((l) => `<p style="font-size:14px;line-height:1.7;color:#4a4744;margin:0 0 12px;">${escapeHtml(l)}</p>`).join('')
  const checkinBlock = template.checkinBlock ? buildCheckinBlock(booking, lang) : ''
  return `<!doctype html><html><body style="font-family:-apple-system,'Segoe UI',sans-serif;background:#fafaf7;margin:0;padding:0;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="background:#fff;border:1px solid #e8e6e1;border-radius:6px;padding:36px 32px;">
    <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8780;margin:0 0 16px;">Demain Life · Hong Kong</p>
    <h2 style="font-size:22px;font-weight:300;margin:0 0 16px;color:#2a2826;">${escapeHtml(template.h1)}</h2>
    <p style="font-size:14px;color:#4a4744;margin:0 0 16px;">Dear ${escapeHtml(greetingName)},</p>
    ${lines}
    ${checkinBlock}
    ${link && template.cta ? `<p style="text-align:center;margin:28px 0;">
      <a href="${link}" style="display:inline-block;background:#2a2826;color:#fff;text-decoration:none;padding:14px 28px;border-radius:4px;font-size:14px;letter-spacing:0.04em;">${escapeHtml(template.cta)}</a>
    </p>` : ''}
    <p style="font-size:13px;color:#8a8780;margin-top:24px;border-top:1px solid #e8e6e1;padding-top:16px;">Reference: <code style="background:#fafaf7;padding:2px 6px;border-radius:3px;">${booking.id}</code></p>
  </div>
</div></body></html>`
}

export async function onRequestPost({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const body = await readJson(request)
  if (!body || !body.action) return json({ error: 'action_required' }, { status: 400 })

  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })

  const lang = booking.sourceLang in TEMPLATES['send-profile'] ? booking.sourceLang : 'en'
  const action = body.action
  const customMessage = (body.customMessage || '').trim()
  const shouldSendEmail = body.sendEmail !== false  // default true
  const now = new Date().toISOString()

  let newStatus = booking.status
  let emailTemplate = null
  let link = null
  let historyEntry = null

  switch (action) {
    case 'start-reviewing':
      if (booking.status !== 'new') {
        return json({ error: 'invalid_transition', from: booking.status, to: 'reviewing' }, { status: 400 })
      }
      newStatus = 'reviewing'
      historyEntry = { at: now, action: 'started_reviewing', by: 'admin' }
      break

    case 'send-profile':
      if (!['new', 'reviewing'].includes(booking.status)) {
        return json({ error: 'invalid_transition', from: booking.status, to: 'profile-sent' }, { status: 400 })
      }
      newStatus = 'profile-sent'
      emailTemplate = TEMPLATES['send-profile'][lang]
      link = buildLink(env, booking, 'send-profile')
      historyEntry = { at: now, action: 'profile_sent', emailSent: shouldSendEmail, by: 'admin' }
      break

    case 'send-contract':
      if (!['profile-submitted', 'reviewing'].includes(booking.status)) {
        return json({ error: 'invalid_transition', from: booking.status, to: 'contract-sent' }, { status: 400 })
      }
      // Freeze the contract draft so the client always sees exactly what the admin sent.
      if (booking.contractDraft) {
        booking.contractDraft.frozen = true
        booking.contractDraft.frozenAt = now
        booking.contractDraft.frozenBy = 'admin'
      }
      // Clear withdrawn flag if this is a re-send after withdrawal.
      if (booking.contractWithdrawn) {
        booking.contractWithdrawn = false
        booking.contractResentAt = now
      }
      newStatus = 'contract-sent'
      emailTemplate = TEMPLATES['send-contract'][lang]
      link = buildLink(env, booking, 'send-contract')
      historyEntry = { at: now, action: 'contract_sent', emailSent: shouldSendEmail, by: 'admin' }
      break

    case 'send-checkin':
      // Allowed once payment has been approved (with or without a room assigned).
      if (!['paid', 'room-assigned'].includes(booking.status)) {
        return json({ error: 'invalid_transition', from: booking.status, to: 'checked-in' }, { status: 400 })
      }
      newStatus = 'checked-in'
      emailTemplate = TEMPLATES['send-checkin'][lang]
      historyEntry = { at: now, action: 'checkin_sent', emailSent: shouldSendEmail, by: 'admin' }
      break

    case 'cancel':
      newStatus = 'cancelled'
      historyEntry = { at: now, action: 'cancelled', reason: body.reason || '', by: 'admin' }
      break

    case 'mark-read':
      // Just clear the unread flag, no state transition
      booking.unreadByAdmin = false
      booking.history = booking.history || []
      await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))
      try {
        const idx = await env.DEMAIN_DATA.get('booking-index', 'json')
        if (Array.isArray(idx)) {
          const i = idx.findIndex((b) => b.id === booking.id)
          if (i !== -1) { idx[i].unreadByAdmin = false; await env.DEMAIN_DATA.put('booking-index', JSON.stringify(idx)) }
        }
      } catch (e) {}
      return json({ success: true, bookingId: booking.id, status: booking.status })

    default:
      return json({ error: 'unknown_action', action }, { status: 400 })
  }

  // Apply state change
  booking.status = newStatus
  booking.unreadByAdmin = false  // clear unread flag after admin acts
  booking.history = booking.history || []
  booking.history.push(historyEntry)
  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))

  // Update index
  try {
    const idx = await env.DEMAIN_DATA.get('booking-index', 'json')
    if (Array.isArray(idx)) {
      const i = idx.findIndex((b) => b.id === booking.id)
      if (i !== -1) {
        idx[i].status = newStatus
        idx[i].unreadByAdmin = false
        await env.DEMAIN_DATA.put('booking-index', JSON.stringify(idx))
      }
    }
  } catch (e) {}

  // Sheet sync
  if ((await getBookingsSheetId(env))) {
    try {
      await sheetsUpdateRowByBookingId(env, (await getBookingsSheetId(env)), booking.id, { 'Status': newStatus })
    } catch (e) {}
  }

  // Send email
  let emailResult = { sent: false }
  if (shouldSendEmail && emailTemplate && env.RESEND_API_KEY) {
    try {
      const html = renderActionEmail(emailTemplate, booking, link, customMessage, lang)
      await sendEmail(env, {
        to: booking.email,
        subject: emailTemplate.subject(booking.id),
        html,
        replyTo: env.BOOKING_NOTIFY_EMAIL
      })
      emailResult.sent = true
    } catch (err) {
      emailResult.error = err.message
    }
  }

  return json({
    success: true,
    bookingId: booking.id,
    status: newStatus,
    link,
    email: emailResult
  })
}

// GET /api/admin/bookings/[id]/workflow?preview=send-profile
// Returns a preview of the email that would be sent (subject + html + link)
export async function onRequestGet({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const action = url.searchParams.get('preview') || 'send-profile'
  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })

  const lang = booking.sourceLang in TEMPLATES['send-profile'] ? booking.sourceLang : 'en'
  const template = TEMPLATES[action]?.[lang]
  if (!template) return json({ error: 'no_template' }, { status: 404 })

  const link = buildLink(env, booking, action)
  const html = renderActionEmail(template, booking, link, '', lang)
  return json({
    subject: template.subject(booking.id),
    bodyText: template.body(link),
    html,
    link,
    contactMethod: booking.contactMethod,
    contactValue: booking.contactMethod === 'whatsapp' ? booking.whatsappNumber
      : booking.contactMethod === 'wechat' ? booking.wechatId
      : booking.contactMethod === 'phone' ? booking.phone
      : booking.email
  })
}
