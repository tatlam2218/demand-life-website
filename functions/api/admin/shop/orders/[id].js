// GET /api/admin/shop/orders/:id — single order detail
// PATCH /api/admin/shop/orders/:id — update fields (mark paid, ship, picked up, etc.)
//   Body: { status?, paymentStatus?, paidAt?, trackingNumber?, shippedAt?, deliveredAt?, notes?, action? }
//   action: 'mark-paid' | 'mark-shipped' | 'mark-picked-up' | 'cancel'

import { json, requireShopAuth, readJson, getCurrentUser } from '../../../_utils.js'
import { getOrder, saveOrder } from '../../../_shop.js'
import { sendEmail } from '../../../_email.js'

export async function onRequestGet({ request, env, params }) {
  const check = await requireShopAuth(request, env)
  if (!check.ok) return check.response
  const order = await getOrder(env, params.id)
  if (!order) return json({ error: 'not_found' }, 404)
  // Mark as read
  if (order.unread) {
    order.unread = false
    await saveOrder(env, order)
  }
  return json({ success: true, order })
}

export async function onRequestPatch({ request, env, params }) {
  const check = await requireShopAuth(request, env)
  if (!check.ok) return check.response
  const user = check.user

  const order = await getOrder(env, params.id)
  if (!order) return json({ error: 'not_found' }, 404)

  const body = await readJson(request) || {}
  const now = new Date().toISOString()
  let emailSent = false

  // Quick actions
  if (body.action === 'mark-paid') {
    order.payment.status = 'paid'
    order.payment.paidAt = now
    order.status = 'paid'
    order.history.push({ at: now, action: 'payment_confirmed', by: user.username })
    // Notify customer
    if (env.RESEND_API_KEY) {
      try {
        await sendEmail(env, {
          to: order.customer.email,
          context: 'shop',
          subject: `Payment received · ${order.id}`,
          html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;">
<h2>Thank you, ${order.customer.name}!</h2>
<p>We've received your payment of HK$${order.totals.total} for order <code>${order.id}</code>.</p>
<p>${order.delivery.method === 'pickup'
  ? 'Your items will be ready for pickup at <strong>1331 文创空间</strong>. We will contact you when ready.'
  : 'Your items will be shipped shortly. You will receive tracking information once available.'}</p>
</div>`
        })
        emailSent = true
      } catch (e) { /* ignore */ }
    }
  } else if (body.action === 'mark-shipped') {
    order.delivery.trackingNumber = body.trackingNumber || order.delivery.trackingNumber || ''
    order.delivery.shippedAt = now
    order.status = 'shipped'
    order.history.push({ at: now, action: 'shipped', tracking: order.delivery.trackingNumber, by: user.username })
    if (env.RESEND_API_KEY) {
      try {
        await sendEmail(env, {
          to: order.customer.email,
          context: 'shop',
          subject: `Your order has shipped · ${order.id}`,
          html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;">
<h2>On its way!</h2>
<p>Your order <code>${order.id}</code> has been shipped.</p>
${order.delivery.trackingNumber ? `<p>Tracking number: <strong>${order.delivery.trackingNumber}</strong></p>` : ''}
</div>`
        })
        emailSent = true
      } catch (e) { /* */ }
    }
  } else if (body.action === 'mark-picked-up') {
    order.delivery.deliveredAt = now
    order.status = 'completed'
    order.history.push({ at: now, action: 'picked_up', by: user.username })
  } else if (body.action === 'mark-delivered') {
    order.delivery.deliveredAt = now
    order.status = 'completed'
    order.history.push({ at: now, action: 'delivered', by: user.username })
  } else if (body.action === 'cancel') {
    order.status = 'cancelled'
    order.history.push({ at: now, action: 'cancelled', reason: body.reason || '', by: user.username })
  }

  // Generic field updates
  if (body.notes !== undefined) order.notes = body.notes
  if (body.trackingNumber !== undefined && body.action !== 'mark-shipped') {
    order.delivery.trackingNumber = body.trackingNumber
  }
  if (body.status && !body.action) order.status = body.status

  await saveOrder(env, order)
  return json({ success: true, order, emailSent })
}
