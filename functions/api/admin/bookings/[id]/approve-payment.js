// POST /api/admin/bookings/[id]/approve-payment
// Body: { requestId, action: 'approve'|'reject', note?: string }
import { json, requireStayAuth, readJson } from '../../../_utils.js'
import { sheetsUpdateRowByBookingId } from '../../../_google.js'
import { sendEmail } from '../../../_email.js'
import { getBookingsSheetId, getPaymentsSheetId } from '../../../_sheet_ids.js'

export async function onRequestPost({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const body = await readJson(request)
  if (!body) return json({ error: 'invalid_body' }, { status: 400 })

  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })

  const pr = (booking.payments || []).find((p) => p.requestId === body.requestId)
  if (!pr) return json({ error: 'request_not_found' }, { status: 404 })

  const action = body.action === 'reject' ? 'reject' : 'approve'
  const now = new Date().toISOString()
  if (action === 'approve') {
    pr.status = 'approved'
    pr.approvedAt = now
    pr.approvedBy = 'admin'
  } else {
    pr.status = 'rejected'
    pr.rejectionReason = (body.note || '').trim().slice(0, 500)
  }

  // Determine overall booking status
  const allApproved = (booking.payments || []).every((p) => p.status === 'approved')
  if (allApproved && booking.payments.length > 0) {
    booking.status = 'paid'
  }
  booking.history = booking.history || []
  booking.history.push({
    at: now,
    action: action === 'approve' ? 'payment_approved' : 'payment_rejected',
    requestId: pr.requestId,
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
  } catch (err) { /* */ }

  // Bookings sheet: update payment summary on booking row
  if ((await getBookingsSheetId(env))) {
    try {
      const totalPaid = booking.payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0)
      const totalOutstanding = booking.payments.filter(p => p.status !== 'approved' && p.status !== 'rejected').reduce((sum, p) => sum + p.amount, 0)
      await sheetsUpdateRowByBookingId(env, (await getBookingsSheetId(env)), booking.id, {
        'Status': booking.status,
        'Total Paid': `HK$${totalPaid.toLocaleString()}`,
        'Total Outstanding': `HK$${totalOutstanding.toLocaleString()}`,
        'Latest Payment Status': `${pr.requestId}: ${pr.status}`
      })
    } catch (err) { /* */ }
  }

  // Payments sheet: update the row for this payment request (Status / Approved At / Approved By)
  const paymentsSheetId = await getPaymentsSheetId(env)
  if (paymentsSheetId) {
    try {
      await sheetsUpdateRowByBookingId(env, paymentsSheetId, pr.requestId, {
        'Status': pr.status,
        'Approved At': new Date().toISOString(),
        'Approved By': auth.user?.username || 'admin'
      })
    } catch (err) { /* non-fatal */ }
  }

  // Email guest
  if (env.RESEND_API_KEY) {
    try {
      const subject = action === 'approve'
        ? `Payment received — ${booking.id}`
        : `Payment needs attention — ${booking.id}`
      const msg = action === 'approve'
        ? `<p>We have received and confirmed your payment of <strong>HK$ ${pr.amount.toLocaleString()}</strong>. Thank you!</p>${booking.status === 'paid' ? '<p>All payments for this booking are now complete. Our team will be in touch with check-in details.</p>' : ''}`
        : `<p>There was an issue verifying your payment of HK$ ${pr.amount.toLocaleString()}.</p>${pr.rejectionReason ? `<p><strong>Reason:</strong> ${pr.rejectionReason}</p>` : ''}<p>Please reply to this email or contact us.</p>`
      await sendEmail(env, {
        to: booking.email,
        subject,
        replyTo: env.BOOKING_NOTIFY_EMAIL,
        html: `<!doctype html><html><body style="font-family:sans-serif;background:#fafaf7;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e6e1;border-radius:6px;padding:32px;">
<p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8780;">Demain Life</p>
<h2 style="font-weight:300;margin:8px 0 16px;">${action === 'approve' ? 'Payment received' : 'Payment needs attention'}</h2>
<p>${booking.id}</p>
${msg}
</div></body></html>`
      })
    } catch (err) { /* */ }
  }

  return json({ success: true, payment: pr, bookingStatus: booking.status })
}
