// GET /api/admin/payments — aggregate payment overview across all bookings
import { json, requireAuth } from '../_utils.js'

export async function onRequestGet({ request, env }) {
  const ok = await requireAuth(request, env)
  if (!ok) return json({ error: 'unauthorized' }, { status: 401 })

  const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
  const index = Array.isArray(indexRaw) ? indexRaw : []

  let totalOutstanding = 0
  let totalPaid = 0
  let totalPaidThisMonth = 0
  const now = new Date()
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const allPayments = []

  for (const idx of index) {
    const b = await env.DEMAIN_DATA.get(`booking:${idx.id}`, 'json')
    if (!b) continue
    for (const p of (b.payments || [])) {
      const item = {
        bookingId: b.id,
        bookingName: b.name,
        bookingEmail: b.email,
        requestId: p.requestId,
        createdAt: p.createdAt,
        amount: p.amount,
        currency: p.currency,
        description: p.description,
        status: p.status,
        dueDate: p.dueDate,
        approvedAt: p.approvedAt,
        screenshots: (p.screenshots || []).length,
        screenshotUrls: (p.screenshots || []).map((s) => s.url).filter(Boolean)
      }
      allPayments.push(item)
      if (p.status === 'approved') {
        totalPaid += p.amount
        if (p.approvedAt && p.approvedAt.startsWith(currentMonth)) {
          totalPaidThisMonth += p.amount
        }
      } else if (p.status !== 'rejected') {
        totalOutstanding += p.amount
      }
    }
  }

  // Sort by createdAt descending
  allPayments.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

  return json({
    summary: {
      totalOutstanding,
      totalPaid,
      totalPaidThisMonth,
      paymentCount: allPayments.length
    },
    payments: allPayments
  })
}
