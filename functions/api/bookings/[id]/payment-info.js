// GET /api/bookings/[id]/payment-info?token=xxx&request=PR-xxx
// Returns the payment request details + landlord bank info
import { json } from '../../_utils.js'
import { getLegalTemplates } from '../../_contracts.js'

export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token') || ''
  const requestId = url.searchParams.get('request') || ''

  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })
  if (!booking.detailsToken || booking.detailsToken !== token) {
    return json({ error: 'invalid_token' }, { status: 403 })
  }

  const payments = booking.payments || []
  let pr = null
  if (requestId) {
    pr = payments.find((p) => p.requestId === requestId)
  } else if (payments.length) {
    // Default to latest awaiting
    pr = payments.filter((p) => p.status !== 'approved').slice(-1)[0] || payments.slice(-1)[0]
  }
  if (!pr) return json({ error: 'no_payment_request' }, { status: 404 })

  const legal = await getLegalTemplates(env)
  return json({
    booking: { id: booking.id, name: booking.name, email: booking.email, sourceLang: booking.sourceLang },
    paymentRequest: {
      requestId: pr.requestId,
      amount: pr.amount,
      currency: pr.currency,
      description: pr.description,
      dueDate: pr.dueDate,
      status: pr.status,
      screenshots: (pr.screenshots || []).map((s) => ({ uploadedAt: s.uploadedAt, fileName: s.fileName }))
    },
    landlord: legal.landlord || {}
  })
}
