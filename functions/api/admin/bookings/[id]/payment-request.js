// POST /api/admin/bookings/[id]/payment-request
// Body: { amount: number, currency: 'HKD', description, dueDate, notes }
// Creates a payment request for this booking and emails the guest with the payment link + QR.
import { json, requireStayAuth, readJson } from '../../../_utils.js'
import { sendEmail } from '../../../_email.js'
import { getLegalTemplates } from '../../../_contracts.js'
import { sheetsUpdateRowByBookingId, sheetsAppendRow } from '../../../_google.js'
import { getBookingsSheetId, getPaymentsSheetId } from '../../../_sheet_ids.js'

function generateRequestId() {
  const d = new Date()
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PR-${ymd}-${rnd}`
}

export async function onRequestPost({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const body = await readJson(request)
  if (!body) return json({ error: 'invalid_body' }, { status: 400 })

  const amount = parseFloat(body.amount)
  if (!amount || amount <= 0) return json({ error: 'amount_invalid' }, { status: 400 })
  const currency = (body.currency || 'HKD').toUpperCase()
  const description = (body.description || '').trim().slice(0, 200)
  const dueDate = (body.dueDate || '').trim().slice(0, 20)
  const notes = (body.notes || '').trim().slice(0, 1000)

  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })

  // Append payment request
  booking.payments = booking.payments || []
  const requestId = generateRequestId()
  const created = new Date().toISOString()
  const paymentRequest = {
    requestId,
    createdAt: created,
    amount,
    currency,
    description,
    dueDate,
    notes,
    status: 'awaiting', // awaiting | screenshot-uploaded | approved | rejected
    screenshots: [],
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null
  }
  booking.payments.push(paymentRequest)

  // Update overall booking status
  if (['signed','profile-submitted','details-submitted','contract-sent'].includes(booking.status)) {
    booking.status = 'invoice-sent'
  }
  booking.unreadByAdmin = false  // staff just acted
  booking.history = booking.history || []
  booking.history.push({ at: created, action: 'payment_request_created', requestId, amount, by: 'admin' })

  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))
  try {
    const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
    const index = Array.isArray(indexRaw) ? indexRaw : []
    const idx = index.findIndex((b) => b.id === booking.id)
    if (idx !== -1) {
      index[idx].status = booking.status
      await env.DEMAIN_DATA.put('booking-index', JSON.stringify(index))
    }
  } catch (err) { /* ignore */ }

  // Update Bookings Sheet (booking-level payment summary)
  if ((await getBookingsSheetId(env))) {
    try {
      const totalOutstanding = booking.payments.filter(p => p.status !== 'approved').reduce((sum, p) => sum + p.amount, 0)
      const totalPaid = booking.payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0)
      await sheetsUpdateRowByBookingId(env, (await getBookingsSheetId(env)), booking.id, {
        'Status': booking.status,
        'Latest Payment Request': `${requestId} · HK$${amount.toLocaleString()}`,
        'Total Outstanding': `HK$${totalOutstanding.toLocaleString()}`,
        'Total Paid': `HK$${totalPaid.toLocaleString()}`
      })
    } catch (err) { /* */ }
  }

  // Append to Payments Sheet — written to BOTH the All tab AND the current-month tab.
  const paymentsSheetId = await getPaymentsSheetId(env)
  if (paymentsSheetId) {
    try {
      const PAYMENTS_HEADER = ['Payment ID','Invoice Number','Booking ID','Guest Name','Amount HKD','Status','Type','Method','Created At','Approved At','Approved By','Description','Screenshot URL','Notes']
      const { ensurePaymentsTabs } = await import('../../../_payments_sheet.js')
      const { all, monthTab } = await ensurePaymentsTabs(env, paymentsSheetId, PAYMENTS_HEADER)
      const row = [
        requestId, body.invoiceNumber || '', booking.id, booking.name || '', amount,
        'awaiting', body.type || 'deposit-and-first-month', 'FPS / Bank transfer',
        new Date().toISOString(), '', '', body.description || '', '', body.notes || ''
      ]
      for (const tab of [all, monthTab]) {
        try { await sheetsAppendRow(env, paymentsSheetId, `${tab}!A1`, row) } catch (e) { if (tab === all) throw e }
      }
    } catch (err) { /* non-fatal */ }
  }

  // Build payment URL for guest
  const siteUrl = env.SITE_URL || 'https://demain-life.pages.dev'
  const lang = booking.sourceLang || 'en'
  const paymentUrl = `${siteUrl}/book/payment?id=${encodeURIComponent(booking.id)}&token=${booking.detailsToken}&request=${requestId}&lang=${lang}`

  // Email guest
  if (env.RESEND_API_KEY) {
    const legal = await getLegalTemplates(env)
    const landlord = legal.landlord || {}
    const labels = {
      en: { title: 'Payment request', greeting: 'Dear', body: 'Your payment request is ready. Please follow the link below to view the amount and pay via FPS.', cta: 'View payment details →', amountLabel: 'Amount due', dueLabel: 'Due by', desc: 'Description', signoff: 'With warm regards,', team: 'The Demain Life team' },
      'zh-CN': { title: '付款请求', greeting: '亲爱的', body: '您的付款请求已就绪。请点击下方链接查看金额并通过 FPS 付款。', cta: '查看付款详情 →', amountLabel: '应付金额', dueLabel: '截止日期', desc: '说明', signoff: '诚挚问候，', team: 'Demain Life 团队' },
      'zh-HK': { title: '付款請求', greeting: '親愛的', body: '您的付款請求已就緒。請點擊下方連結查看金額並透過 FPS 付款。', cta: '查看付款詳情 →', amountLabel: '應付金額', dueLabel: '截止日期', desc: '說明', signoff: '誠摯問候，', team: 'Demain Life 團隊' }
    }
    const t = labels[lang] || labels.en
    try {
      await sendEmail(env, {
        to: booking.email,
        subject: `${t.title} — ${booking.id} — HK$${amount.toLocaleString()}`,
        replyTo: env.BOOKING_NOTIFY_EMAIL,
        html: `<!doctype html><html><body style="font-family:-apple-system,'Segoe UI',sans-serif;background:#fafaf7;margin:0;padding:0;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
<div style="background:#fff;border:1px solid #e8e6e1;border-radius:6px;padding:36px 32px;">
<p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8780;margin:0 0 16px;">Demain Life · ${t.title}</p>
<p>${t.greeting} ${booking.name},</p>
<p style="color:#4a4744;line-height:1.6;">${t.body}</p>
<div style="background:#fafaf7;border-left:3px solid #c4c1ba;padding:18px 22px;margin:24px 0;">
<p style="margin:4px 0;"><span style="color:#8a8780;display:inline-block;min-width:120px;">${t.amountLabel}:</span><strong style="font-size:18px;">HK$ ${amount.toLocaleString()}</strong></p>
${dueDate ? `<p style="margin:4px 0;"><span style="color:#8a8780;display:inline-block;min-width:120px;">${t.dueLabel}:</span>${dueDate}</p>` : ''}
${description ? `<p style="margin:4px 0;"><span style="color:#8a8780;display:inline-block;min-width:120px;">${t.desc}:</span>${description}</p>` : ''}
</div>
<p style="text-align:center;margin:28px 0;">
<a href="${paymentUrl}" style="display:inline-block;background:#2a2826;color:#fff;text-decoration:none;padding:14px 28px;border-radius:4px;font-size:14px;letter-spacing:0.04em;">${t.cta}</a>
</p>
<p style="margin-top:32px;color:#4a4744;">${t.signoff}<br>${t.team}</p>
</div>
<p style="font-size:12px;color:#8a8780;text-align:center;margin-top:24px;">${landlord.name || 'Demain Culture Limited'}</p>
</div></body></html>`
      })
    } catch (err) { /* */ }

    // Also notify staff
    if (env.BOOKING_NOTIFY_EMAIL) {
      try {
        await sendEmail(env, {
          to: env.BOOKING_NOTIFY_EMAIL,
          subject: `Payment requested · ${booking.name} · HK$${amount.toLocaleString()}`,
          html: `<!doctype html><html><body style="font-family:sans-serif;background:#fafaf7;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e6e1;border-radius:6px;padding:32px;">
<h2 style="font-weight:300;">Payment request sent</h2>
<p><code style="background:#fafaf7;padding:4px 8px;border-radius:3px;">${booking.id}</code> · ${booking.name}</p>
<p><strong>HK$ ${amount.toLocaleString()}</strong> ${description ? `· ${description}` : ''}</p>
<p>Request ID: ${requestId}</p>
</div></body></html>`
        })
      } catch (err) { /* */ }
    }
  }

  return json({
    success: true,
    requestId,
    paymentUrl,
    paymentRequest
  })
}
