// GET /api/admin/shop/orders — list all orders (paged)
import { json, requireShopAuth } from '../../_utils.js'

export async function onRequestGet({ request, env }) {
  const check = await requireShopAuth(request, env)
  if (!check.ok) return check.response

  const indexRaw = await env.DEMAIN_DATA.get('order-index', 'json')
  const index = Array.isArray(indexRaw) ? indexRaw : []
  // Fetch full data for each (capped at 200 most recent)
  const slice = index.slice(0, 200)
  const orders = []
  for (const entry of slice) {
    const o = await env.DEMAIN_DATA.get(`order:${entry.id}`, 'json')
    if (o) orders.push(o)
  }

  // Compute summary
  const summary = {
    totalOrders: index.length,
    newOrders: orders.filter(o => o.status === 'new').length,
    awaitingPayment: orders.filter(o => o.payment?.status === 'pending').length,
    awaitingShipment: orders.filter(o => o.status === 'paid' && o.delivery?.method === 'ship').length,
    awaitingPickup: orders.filter(o => o.status === 'paid' && o.delivery?.method === 'pickup').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenueThisMonth: orders.filter(o => {
      const d = new Date(o.createdAt)
      const now = new Date()
      return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()
    }).reduce((s, o) => s + (o.totals?.total || 0), 0)
  }

  return json({ success: true, orders, summary })
}
