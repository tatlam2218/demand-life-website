// POST /api/payments/[id]/start
// Body: { token, lang }
// Returns: { checkoutUrl, orderId } if QFPay configured, else { error: 'not_configured' }
import { json, readJson } from '../../_utils.js'
import { buildCheckoutUrl, isQfpayConfigured } from '../../_qfpay.js'

export async function onRequestPost({ request, env, params }) {
  const body = await readJson(request) || {}
  const id = params.id
  const token = body.token
  if (!token) return json({ error: 'token_required' }, { status: 400 })

  const booking = await env.DEMAIN_DATA.get(`booking:${id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })
  if (!booking.detailsToken || booking.detailsToken !== token) {
    return json({ error: 'invalid_token' }, { status: 403 })
  }
  if (!booking.contract?.contractHash) {
    return json({ error: 'contract_not_signed' }, { status: 400 })
  }

  if (!isQfpayConfigured(env)) {
    return json({ error: 'payment_not_configured', message: 'QFPay credentials are not yet set up. Staff will contact you with payment instructions.' }, { status: 503 })
  }

  // Amount in HKD cents
  const amount = Math.round((booking.contract.totalPrepayment || 0) * 100)
  if (amount <= 0) {
    return json({ error: 'invalid_amount' }, { status: 400 })
  }

  const orderId = `${booking.id}-${Date.now().toString(36).toUpperCase()}`
  const siteUrl = env.SITE_URL || new URL(request.url).origin
  const langMap = { 'zh-CN': 'zh-cn', 'zh-HK': 'zh-hk', en: 'en' }
  const lang = langMap[body.lang] || 'en'

  let checkoutUrl
  try {
    checkoutUrl = await buildCheckoutUrl(env, {
      amount,
      currency: 'HKD',
      orderId,
      returnUrl: `${siteUrl}/book/payment-success?id=${booking.id}&token=${token}&via=qfpay`,
      failedUrl: `${siteUrl}/book/payment-failed?id=${booking.id}&token=${token}`,
      notifyUrl: `${siteUrl}/api/payments/notify`,
      cancelUrl: `${siteUrl}/book/payment-failed?id=${booking.id}&token=${token}`,
      goodsName: `Demain Life ${booking.roomType}`,
      lang
    })
  } catch (err) {
    return json({ error: 'checkout_url_failed', message: err.message }, { status: 500 })
  }

  // Record pending payment
  booking.payments = booking.payments || []
  booking.payments.push({
    orderId,
    amount: amount / 100,
    currency: 'HKD',
    status: 'pending',
    createdAt: new Date().toISOString(),
    method: 'qfpay_checkout'
  })
  booking.history = booking.history || []
  booking.history.push({
    at: new Date().toISOString(),
    action: 'payment_started',
    orderId,
    amount: amount / 100,
    by: 'guest'
  })
  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))

  return json({ success: true, checkoutUrl, orderId })
}
