// QFPay Hosted Checkout integration
// Docs: https://sdk.qfapi.com/integration/online-shop/checkout-integration/checkout
//
// Required env vars (set as Cloudflare secrets when ready):
//   QFPAY_APP_CODE        — merchant store identifier
//   QFPAY_CLIENT_KEY      — shared secret for signature
//   QFPAY_BASE_URL        — e.g. https://test-openapi-hk.qfapi.com (sandbox) or production URL
//   QFPAY_MCHNT_ID        — optional, for agent scenarios

async function sha256Hex(s) {
  const buf = new TextEncoder().encode(s)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function pad2(n) { return String(n).padStart(2, '0') }
function tsFormat(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`
}

export function isQfpayConfigured(env) {
  return !!(env.QFPAY_APP_CODE && env.QFPAY_CLIENT_KEY && env.QFPAY_BASE_URL)
}

export async function buildCheckoutUrl(env, opts) {
  if (!isQfpayConfigured(env)) {
    throw new Error('QFPay not configured')
  }
  const params = {
    appcode: env.QFPAY_APP_CODE,
    sign_type: 'SHA256',
    paysource: 'remotepay_checkout',
    txamt: String(opts.amount),
    txcurrcd: opts.currency || 'HKD',
    out_trade_no: opts.orderId,
    txdtm: tsFormat(new Date()),
    return_url: opts.returnUrl,
    failed_url: opts.failedUrl,
    notify_url: opts.notifyUrl,
    goods_name: (opts.goodsName || 'Demain Life booking').slice(0, 64),
    lang: opts.lang || 'en'
  }
  if (env.QFPAY_MCHNT_ID) params.mchntid = env.QFPAY_MCHNT_ID
  if (opts.cancelUrl) params.cancel_url = opts.cancelUrl

  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&')
  const sign = await sha256Hex(sorted + env.QFPAY_CLIENT_KEY)
  const queryString = sorted + `&sign=${sign}`
  return `${env.QFPAY_BASE_URL.replace(/\/+$/, '')}/checkstand/#/?${queryString}`
}

export async function verifyNotification(env, params) {
  if (!params || !params.sign) return false
  const { sign, ...rest } = params
  const sorted = Object.keys(rest).sort().map((k) => `${k}=${rest[k]}`).join('&')
  const expected = await sha256Hex(sorted + env.QFPAY_CLIENT_KEY)
  return expected.toLowerCase() === String(sign).toLowerCase()
}
