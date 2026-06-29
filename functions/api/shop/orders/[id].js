// GET /api/shop/orders/:id — Public read for status page
import { json } from '../../_utils.js'
import { getOrder } from '../../_shop.js'

export async function onRequestGet({ env, params }) {
  const order = await getOrder(env, params.id)
  if (!order) return json({ error: 'order_not_found' }, 404)
  // Strip sensitive internal data
  return json({
    id: order.id,
    invoiceNumber: order.invoiceNumber,
    createdAt: order.createdAt,
    status: order.status,
    customer: { name: order.customer.name },
    items: order.items,
    totals: order.totals,
    delivery: { method: order.delivery.method, pickupLocation: order.delivery.pickupLocation, trackingNumber: order.delivery.trackingNumber },
    payment: { method: order.payment.method, status: order.payment.status }
  })
}
