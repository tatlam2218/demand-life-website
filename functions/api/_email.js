// Email sending via Resend (https://resend.com)
// Free tier: 3,000 emails/month, 100/day
// Set RESEND_API_KEY in Cloudflare secrets

const RESEND_API = 'https://api.resend.com/emails'

// Pick sender based on context. 'stay' (default) for booking/hotel flow, 'shop' for product/shop flow.
export function senderFor(env, context = 'stay') {
  if (context === 'shop') {
    return env.EMAIL_FROM_SHOP || env.EMAIL_FROM || 'Demain Life Shop <onboarding@resend.dev>'
  }
  // default: stay / booking
  return env.EMAIL_FROM_STAY || env.EMAIL_FROM || 'Demain Life Stay <onboarding@resend.dev>'
}

export async function sendEmail(env, { to, subject, html, replyTo, from, context }) {
  if (!env.RESEND_API_KEY) {
    return { skipped: true, reason: 'RESEND_API_KEY not configured' }
  }
  const sender = from || senderFor(env, context)
  const body = {
    from: sender,
    to: Array.isArray(to) ? to : [to],
    subject,
    html
  }
  if (replyTo) body.reply_to = replyTo

  const resp = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Resend send failed: ${resp.status} ${text}`)
  }
  return await resp.json()
}

// ============== Email templates ==============

function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const styles = {
  body: 'font-family: -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif; background:#fafaf7; color:#2a2826; margin:0; padding:0;',
  wrap: 'max-width:560px; margin:0 auto; padding:40px 24px;',
  card: 'background:#ffffff; border:1px solid #e8e6e1; border-radius:6px; padding:36px 32px;',
  brand: 'font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#8a8780; margin:0 0 24px;',
  h1: 'font-size:24px; font-weight:300; margin:0 0 16px; color:#2a2826; line-height:1.3;',
  p: 'font-size:14px; line-height:1.6; color:#4a4744; margin:0 0 16px;',
  meta: 'background:#fafaf7; border-left:3px solid #c4c1ba; padding:14px 18px; margin:20px 0; font-size:13px; line-height:1.6; color:#4a4744;',
  metaRow: 'display:flex; gap:12px; margin:4px 0;',
  metaKey: 'color:#8a8780; min-width:90px; display:inline-block;',
  bookingId: 'font-family: "SF Mono", Menlo, monospace; font-size:18px; letter-spacing:0.05em; background:#fafaf7; padding:10px 16px; border-radius:4px; display:inline-block; margin:8px 0 16px;',
  footer: 'font-size:12px; color:#8a8780; text-align:center; margin-top:32px; line-height:1.6;',
  btn: 'display:inline-block; background:#2a2826; color:#ffffff !important; text-decoration:none; padding:12px 24px; border-radius:4px; font-size:14px; letter-spacing:0.04em; margin:12px 0;'
}

// ---------- Email for the GUEST (confirmation) ----------

const CONTACT_METHOD_COPY = {
  en: { email: 'Email', phone: 'Phone', whatsapp: 'WhatsApp', wechat: 'WeChat' },
  'zh-CN': { email: '邮箱', phone: '电话', whatsapp: 'WhatsApp', wechat: '微信' },
  'zh-HK': { email: '電郵', phone: '電話', whatsapp: 'WhatsApp', wechat: '微信' }
}

const GUEST_COPY = {
  en: {
    subject: (id) => `Reservation enquiry received — ${id}`,
    brand: 'Demain Life · Hong Kong',
    h1: (name) => `Thank you, ${name}.`,
    intro: 'We have received your reservation enquiry. Our team will personally follow up within one business day.',
    refLabel: 'Your reference number',
    fields: { roomType: 'Room', moveInDate: 'Move-in', duration: 'Duration', occupancy: 'Occupants' },
    contactNote: (method, value) => method === 'email' ? 'We will reach out to you by email.' : `You chose ${method.charAt(0).toUpperCase() + method.slice(1)} as your preferred contact method — our team will reach you at ${value} shortly.`,
    keepRef: 'Please keep this reference number handy when our team contacts you.',
    closing: 'If anything changes in the meantime, simply reply to this email.',
    sign: 'With warm regards,',
    signName: 'The Demain Life team',
    footer: 'Demain Life · Kowloon, Hong Kong'
  },
  'zh-CN': {
    subject: (id) => `已收到您的预订咨询 — ${id}`,
    brand: 'Demain Life · 香港',
    h1: (name) => `感谢您，${name}。`,
    intro: '我们已收到您的预订咨询。团队将于一个工作日内亲自与您联系。',
    refLabel: '您的参考编号',
    fields: { roomType: '房型', moveInDate: '入住日期', duration: '入住时长', occupancy: '入住人数' },
    contactNote: (method, value) => method === 'email' ? '我们将通过邮箱联系您。' : `您选择了 ${({whatsapp:'WhatsApp',wechat:'微信',phone:'电话'})[method] || method} 作为首要联系方式，团队将尽快通过 ${value} 与您联系。`,
    keepRef: '当我们团队联系您时，请准备好上面的参考编号。',
    closing: '如有任何变更，请直接回复此邮件。',
    sign: '诚挚问候，',
    signName: 'Demain Life 团队',
    footer: 'Demain Life · 香港九龙'
  },
  'zh-HK': {
    subject: (id) => `已收到您的預訂查詢 — ${id}`,
    brand: 'Demain Life · 香港',
    h1: (name) => `感謝您，${name}。`,
    intro: '我們已收到您的預訂查詢。團隊將於一個工作天內親自與您聯絡。',
    refLabel: '您的參考編號',
    fields: { roomType: '房型', moveInDate: '入住日期', duration: '入住時長', occupancy: '入住人數' },
    contactNote: (method, value) => method === 'email' ? '我們將透過電郵聯絡您。' : `您選擇了 ${({whatsapp:'WhatsApp',wechat:'微信',phone:'電話'})[method] || method} 作為首要聯絡方式，團隊將盡快透過 ${value} 與您聯絡。`,
    keepRef: '當我們團隊聯絡您時，請準備好上面的參考編號。',
    closing: '如有任何變更，請直接回覆此電郵。',
    sign: '誠摯問候，',
    signName: 'Demain Life 團隊',
    footer: 'Demain Life · 香港九龍'
  }
}

export function renderGuestConfirmation(booking, env) {
  const lang = booking.sourceLang in GUEST_COPY ? booking.sourceLang : 'en'
  const c = GUEST_COPY[lang]

  // Determine contact-method-specific value to display in the email
  let contactValue = booking.email
  if (booking.contactMethod === 'whatsapp') contactValue = booking.whatsappNumber || booking.phone
  else if (booking.contactMethod === 'wechat') contactValue = booking.wechatId
  else if (booking.contactMethod === 'phone') contactValue = booking.phone

  const html = `<!doctype html>
<html><body style="${styles.body}">
  <div style="${styles.wrap}">
    <div style="${styles.card}">
      <p style="${styles.brand}">${escapeHtml(c.brand)}</p>
      <h1 style="${styles.h1}">${escapeHtml(c.h1(booking.name))}</h1>
      <p style="${styles.p}">${escapeHtml(c.intro)}</p>

      <p style="${styles.p}; margin-top:24px;">${escapeHtml(c.refLabel)}</p>
      <div style="${styles.bookingId}">${escapeHtml(booking.id)}</div>

      <div style="${styles.meta}">
        <div style="${styles.metaRow}"><span style="${styles.metaKey}">${escapeHtml(c.fields.roomType)}:</span><span>${escapeHtml(booking.roomType)}</span></div>
        <div style="${styles.metaRow}"><span style="${styles.metaKey}">${escapeHtml(c.fields.moveInDate)}:</span><span>${escapeHtml(booking.moveInDate)}</span></div>
        ${booking.duration ? `<div style="${styles.metaRow}"><span style="${styles.metaKey}">${escapeHtml(c.fields.duration)}:</span><span>${escapeHtml(booking.duration)}</span></div>` : ''}
        ${booking.occupancy ? `<div style="${styles.metaRow}"><span style="${styles.metaKey}">${escapeHtml(c.fields.occupancy)}:</span><span>${escapeHtml(booking.occupancy)}</span></div>` : ''}
      </div>

      <p style="${styles.p}; margin-top:20px;">${escapeHtml(c.contactNote(booking.contactMethod || 'email', contactValue))}</p>
      <p style="${styles.p}">${escapeHtml(c.keepRef)}</p>
      <p style="${styles.p}; margin-top:24px;">${escapeHtml(c.closing)}</p>
      <p style="${styles.p}; margin-top:32px;">${escapeHtml(c.sign)}<br>${escapeHtml(c.signName)}</p>
    </div>
    <p style="${styles.footer}">${escapeHtml(c.footer)}</p>
  </div>
</body></html>`
  return { subject: c.subject(booking.id), html }
}

// ---------- Email for STAFF (new booking notification) ----------

export function renderStaffNotification(booking, env) {
  const dashboardUrl = `${env.SITE_URL || 'https://demain-life.pages.dev'}/admin`
  const html = `<!doctype html>
<html><body style="${styles.body}">
  <div style="${styles.wrap}">
    <div style="${styles.card}">
      <p style="${styles.brand}">Demain Life · New booking</p>
      <h1 style="${styles.h1}">New reservation from ${escapeHtml(booking.name)}</h1>

      <div style="${styles.bookingId}">${escapeHtml(booking.id)}</div>

      <div style="${styles.meta}">
        <div style="${styles.metaRow}"><span style="${styles.metaKey}">Name:</span><span>${escapeHtml(booking.name)}</span></div>
        <div style="${styles.metaRow}"><span style="${styles.metaKey}">Email:</span><span><a href="mailto:${escapeHtml(booking.email)}">${escapeHtml(booking.email)}</a></span></div>
        <div style="${styles.metaRow}"><span style="${styles.metaKey}">Phone:</span><span>${escapeHtml(booking.phone)}</span></div>
        ${booking.nationality ? `<div style="${styles.metaRow}"><span style="${styles.metaKey}">Nationality:</span><span>${escapeHtml(booking.nationality)}</span></div>` : ''}
        ${booking.contactMethod ? `<div style="${styles.metaRow}"><span style="${styles.metaKey}">Prefers:</span><span><strong>${escapeHtml(booking.contactMethod.toUpperCase())}</strong>${booking.whatsappNumber ? ` · WhatsApp: ${escapeHtml(booking.whatsappNumber)}` : ''}${booking.wechatId ? ` · WeChat: ${escapeHtml(booking.wechatId)}` : ''}</span></div>` : ''}
      </div>

      <div style="${styles.meta}">
        <div style="${styles.metaRow}"><span style="${styles.metaKey}">Room:</span><span>${escapeHtml(booking.roomType)}</span></div>
        <div style="${styles.metaRow}"><span style="${styles.metaKey}">Move-in:</span><span>${escapeHtml(booking.moveInDate)}</span></div>
        ${booking.duration ? `<div style="${styles.metaRow}"><span style="${styles.metaKey}">Duration:</span><span>${escapeHtml(booking.duration)}</span></div>` : ''}
        ${booking.occupancy ? `<div style="${styles.metaRow}"><span style="${styles.metaKey}">Occupants:</span><span>${escapeHtml(booking.occupancy)}</span></div>` : ''}
        <div style="${styles.metaRow}"><span style="${styles.metaKey}">Language:</span><span>${escapeHtml(booking.sourceLang)}</span></div>
      </div>

      ${booking.message ? `<p style="${styles.p}"><strong>Message:</strong></p><div style="${styles.meta}">${escapeHtml(booking.message).replace(/\n/g, '<br>')}</div>` : ''}

      <p style="text-align:center; margin-top:28px;">
        <a href="${dashboardUrl}" style="${styles.btn}">Open in admin →</a>
      </p>

      ${booking.driveFolder ? `<p style="${styles.p}; text-align:center; font-size:13px;"><a href="${escapeHtml(booking.driveFolder)}">Drive folder ↗</a></p>` : ''}
    </div>
    <p style="${styles.footer}">Sent automatically by demain-life.pages.dev</p>
  </div>
</body></html>`
  return {
    subject: `New booking · ${booking.name} · ${booking.roomType} · ${booking.id}`,
    html
  }
}
