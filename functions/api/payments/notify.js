// POST /api/payments/notify
// QFPay async callback. Accepts both form-encoded and JSON.
import { json } from '../_utils.js'
import { verifyNotification } from '../_qfpay.js'
import { sendEmail } from '../_email.js'

async function parseBody(request) {
  const ct = (request.headers.get('content-type') || '').toLowerCase()
  if (ct.includes('application/json')) {
    try { return await request.json() } catch { return null }
  }
  // form-encoded
  const text = await request.text()
  const params = {}
  for (const part of text.split('&')) {
    const [k, v] = part.split('=')
    if (k) params[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '))
  }
  return params
}

export async function onRequestPost({ request, env }) {
  const params = await parseBody(request)
  if (!params) return json({ error: 'invalid_body' }, { status: 400 })

  const valid = await verifyNotification(env, params)
  if (!valid) {
    return json({ error: 'invalid_signature' }, { status: 401 })
  }

  // Find the booking via out_trade_no (orderId starts with "DL-...-...")
  const orderId = params.out_trade_no || params.orderid || params.order_id
  if (!orderId) return json({ error: 'missing_order' }, { status: 400 })
  const bookingId = orderId.split('-').slice(0, 3).join('-')  // "DL-20260627-XXXX-..."  (DL prefix + YYYYMMDD + suffix)

  const booking = await env.DEMAIN_DATA.get(`booking:${bookingId}`, 'json')
  if (!booking) return json({ error: 'booking_not_found' }, { status: 404 })

  // Update payment record
  booking.payments = booking.payments || []
  const idx = booking.payments.findIndex((p) => p.orderId === orderId)
  const respCode = params.respcd || params.respCode || ''
  const paid = respCode === '0000' || params.pay_status === 'SUCCESS' || params.status === 'success'
  const status = paid ? 'paid' : 'failed'
  const update = {
    orderId,
    amount: parseFloat(params.txamt || '0') / 100,
    currency: params.txcurrcd || 'HKD',
    status,
    method: 'qfpay_checkout',
    paidAt: paid ? new Date().toISOString() : null,
    raw: params,
    confirmedAt: new Date().toISOString()
  }
  if (idx === -1) booking.payments.push(update)
  else booking.payments[idx] = { ...booking.payments[idx], ...update }

  if (paid) {
    if (booking.status === 'signed' || booking.status === 'contract-sent' || booking.status === 'details-submitted') {
      booking.status = 'paid'
    }
    booking.history = booking.history || []
    booking.history.push({
      at: new Date().toISOString(),
      action: 'payment_succeeded',
      orderId,
      amount: update.amount,
      by: 'system'
    })

    // Update index
    try {
      const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
      const index = Array.isArray(indexRaw) ? indexRaw : []
      const ii = index.findIndex((b) => b.id === booking.id)
      if (ii !== -1) {
        index[ii].status = booking.status
        await env.DEMAIN_DATA.put('booking-index', JSON.stringify(index))
      }
    } catch (e) { /* */ }

    // Email staff
    if (env.RESEND_API_KEY && env.BOOKING_NOTIFY_EMAIL) {
      try {
        const siteUrl = env.SITE_URL || 'https://demain-life.pages.dev'
        await sendEmail(env, {
          to: env.BOOKING_NOTIFY_EMAIL,
          subject: `Payment received · ${booking.name} · ${booking.id}`,
          html: `<p>Payment received for booking <strong>${booking.id}</strong></p>
                 <p>Amount: HK$ ${update.amount.toLocaleString()}</p>
                 <p>Order ID: ${orderId}</p>
                 <p><a href="${siteUrl}/admin">Open admin →</a></p>`
        })
      } catch (e) { /* */ }
    }
  }

  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))

  // QFPay expects a specific response on success. We send a generic OK.
  return new Response('SUCCESS', { headers: { 'content-type': 'text/plain' } })
}
