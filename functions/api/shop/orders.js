// POST /api/shop/orders
// Public endpoint: create a new order (no auth required).
//
// Body: {
//   customer: { name, email, phone },
//   items: [{ sku, qty, price, name }],
//   delivery: { method: 'ship'|'pickup', address?, country? },
//   paymentMethod: 'bank-transfer' | 'qfpay',
//   notes?,
//   lang
// }

import { json, readJson } from '../_utils.js'
import { generateOrderId, generateInvoiceNumber, saveOrder, loadInventory } from '../_shop.js'
import { sendEmail, senderFor } from '../_email.js'

export async function onRequestPost({ request, env }) {
  const body = await readJson(request)
  if (!body) return json({ error: 'invalid_body' }, 400)

  // Validation
  const { customer, items, delivery, paymentMethod, lang } = body
  if (!customer?.name || !customer?.email) {
    return json({ error: 'missing_customer_info' }, 400)
  }
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: 'no_items' }, 400)
  }
  if (!delivery?.method || !['ship', 'pickup'].includes(delivery.method)) {
    return json({ error: 'invalid_delivery_method' }, 400)
  }
  if (delivery.method === 'ship' && !delivery.address) {
    return json({ error: 'shipping_address_required' }, 400)
  }
  if (!['bank-transfer', 'qfpay'].includes(paymentMethod)) {
    return json({ error: 'invalid_payment_method' }, 400)
  }

  // Re-verify prices from current inventory
  const inventory = await loadInventory(env)
  const verified = []
  for (const it of items) {
    const product = inventory.find(p => p.sku === it.sku)
    if (!product) return json({ error: `product_not_found: ${it.sku}` }, 400)
    if (product.stock < (it.qty || 1)) return json({ error: `out_of_stock: ${product.nameEn}` }, 400)
    verified.push({
      sku: product.sku,
      name: product.nameEn,
      nameZh: product.nameZh,
      qty: parseInt(it.qty || 1, 10),
      price: product.price,
      lineTotal: product.price * parseInt(it.qty || 1, 10)
    })
  }

  const subtotal = verified.reduce((s, i) => s + i.lineTotal, 0)
  // Shipping fee: HK$50 flat for HK ship, free for pickup; international TBD by staff
  let shipping = 0
  if (delivery.method === 'ship') {
    const country = (delivery.country || 'HK').toUpperCase()
    if (country === 'HK' || country === 'HONG KONG') shipping = 50
    else shipping = 0 // International: staff will quote later
  }
  const total = subtotal + shipping

  const order = {
    id: generateOrderId(),
    invoiceNumber: generateInvoiceNumber(),
    createdAt: new Date().toISOString(),
    status: 'new', // new -> awaiting-payment -> paid -> preparing -> shipped/ready-pickup -> delivered/picked-up -> completed
    customer: {
      name: String(customer.name).trim(),
      email: String(customer.email).trim(),
      phone: String(customer.phone || '').trim()
    },
    items: verified,
    totals: { subtotal, shipping, total, currency: 'HKD' },
    delivery: {
      method: delivery.method, // 'ship' | 'pickup'
      address: delivery.address || '',
      country: delivery.country || '',
      trackingNumber: '',
      shippedAt: null,
      deliveredAt: null,
      pickupLocation: delivery.method === 'pickup' ? '1331 文创空间' : null
    },
    payment: {
      method: paymentMethod, // 'bank-transfer' | 'qfpay'
      status: 'pending',
      paidAt: null,
      screenshotKvKey: null
    },
    notes: body.notes || '',
    sourceLang: lang || 'en',
    history: [
      { at: new Date().toISOString(), action: 'order_created', by: 'guest' }
    ],
    unread: true
  }

  await saveOrder(env, order)

  // Send confirmation email to customer (uses shop@ sender)
  if (env.RESEND_API_KEY) {
    try {
      const itemRows = verified.map(it =>
        `<tr><td>${it.name}${it.nameZh ? ' / ' + it.nameZh : ''}</td><td style="text-align:right">×${it.qty}</td><td style="text-align:right">HK$${it.lineTotal}</td></tr>`
      ).join('')
      const deliveryText = delivery.method === 'pickup'
        ? `Pickup at <strong>1331 文创空间</strong>`
        : `Ship to: ${delivery.address}`
      const paymentText = paymentMethod === 'bank-transfer'
        ? 'Bank transfer (we will email you payment instructions shortly)'
        : 'QFPay (payment link will be provided)'

      await sendEmail(env, {
        to: order.customer.email,
        context: 'shop',
        subject: `Order received · ${order.id}`,
        html: `<!doctype html><html><body style="font-family:Inter,sans-serif;background:#fafaf7;padding:24px;color:#2a2826;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e6e1;border-radius:6px;padding:32px;">
<p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8780;margin:0 0 16px;">Demain Life · Shop</p>
<h2 style="font-weight:300;margin:0 0 16px;">Thank you for your order, ${order.customer.name}!</h2>
<p>Order reference: <code style="background:#f4f1ea;padding:4px 8px;border-radius:3px;">${order.id}</code></p>
<p>Invoice: <code style="background:#f4f1ea;padding:4px 8px;border-radius:3px;">${order.invoiceNumber}</code></p>

<table style="width:100%;margin:20px 0;border-collapse:collapse;font-size:14px;">
<thead><tr style="border-bottom:1px solid #e8e6e1;"><th style="text-align:left;padding:8px 0;">Item</th><th style="text-align:right;padding:8px 0;">Qty</th><th style="text-align:right;padding:8px 0;">Subtotal</th></tr></thead>
<tbody>${itemRows}</tbody>
<tfoot>
<tr><td colspan="2" style="padding-top:12px;text-align:right;">Subtotal:</td><td style="padding-top:12px;text-align:right;">HK$${subtotal}</td></tr>
<tr><td colspan="2" style="text-align:right;">Shipping:</td><td style="text-align:right;">HK$${shipping}</td></tr>
<tr style="font-weight:600;font-size:16px;"><td colspan="2" style="padding-top:12px;text-align:right;">Total:</td><td style="padding-top:12px;text-align:right;">HK$${total}</td></tr>
</tfoot>
</table>

<p><strong>Delivery:</strong> ${deliveryText}</p>
<p><strong>Payment:</strong> ${paymentText}</p>

<p style="margin-top:24px;color:#6b665e;font-size:13px;">Our team will follow up with payment instructions shortly. Reply to this email if you have any questions.</p>
</div></body></html>`,
        replyTo: env.BOOKING_NOTIFY_EMAIL || env.EMAIL_FROM_SHOP
      })

      // Staff notification
      if (env.BOOKING_NOTIFY_EMAIL) {
        await sendEmail(env, {
          to: env.BOOKING_NOTIFY_EMAIL,
          context: 'shop',
          subject: `🛍️ New order · ${order.customer.name} · HK$${total}`,
          html: `<!doctype html><html><body style="font-family:Inter,sans-serif;background:#fafaf7;padding:24px;color:#2a2826;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e6e1;border-radius:6px;padding:32px;">
<h2 style="font-weight:300;">New shop order</h2>
<p><strong>${order.customer.name}</strong> placed an order: <code>${order.id}</code></p>
<ul>
<li>Total: HK$${total}</li>
<li>Items: ${verified.length} (${verified.reduce((s, i) => s + i.qty, 0)} units)</li>
<li>Delivery: ${delivery.method === 'pickup' ? 'Pickup at 1331' : 'Ship to ' + (delivery.country || 'HK')}</li>
<li>Payment: ${paymentMethod}</li>
<li>Email: ${order.customer.email}</li>
<li>Phone: ${order.customer.phone || '—'}</li>
</ul>
<p style="margin-top:24px;text-align:center;">
<a href="${env.SITE_URL || 'https://life.demainculture.com'}/admin/shop" style="background:#2a2826;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;display:inline-block;">Open admin →</a>
</p>
</div></body></html>`
        })
      }
    } catch (err) {
      console.warn('Order email error:', err.message)
    }
  }

  return json({
    success: true,
    orderId: order.id,
    invoiceNumber: order.invoiceNumber,
    totals: order.totals,
    statusUrl: `/shop/order/${order.id}`
  })
}
