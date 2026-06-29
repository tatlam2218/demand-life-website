// POST /api/admin/bookings/[id]/mark-paid
// Manual payment recording (for cash / bank transfer / pre-QFPay testing)
// Body: { amount, method, notes }
import { json, requireStayAuth, readJson } from '../../../_utils.js'

export async function onRequestPost({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const body = await readJson(request) || {}
  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })

  const amount = parseFloat(body.amount) || (booking.contract?.totalPrepayment || 0)
  const method = body.method || 'manual'
  const notes = (body.notes || '').slice(0, 500)

  booking.payments = booking.payments || []
  const orderId = `manual-${booking.id}-${Date.now().toString(36).toUpperCase()}`
  booking.payments.push({
    orderId,
    amount,
    currency: 'HKD',
    status: 'paid',
    method,
    paidAt: new Date().toISOString(),
    confirmedAt: new Date().toISOString(),
    notes,
    recordedBy: 'admin'
  })

  booking.status = 'paid'
  booking.history = booking.history || []
  booking.history.push({
    at: new Date().toISOString(),
    action: 'payment_marked_manually',
    amount,
    method,
    notes,
    by: 'admin'
  })

  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))

  try {
    const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
    const index = Array.isArray(indexRaw) ? indexRaw : []
    const idx = index.findIndex((b) => b.id === booking.id)
    if (idx !== -1) {
      index[idx].status = booking.status
      await env.DEMAIN_DATA.put('booking-index', JSON.stringify(index))
    }
  } catch (e) { /* */ }

  return json({ success: true, booking })
}
