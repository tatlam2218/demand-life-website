// POST /api/admin/bookings/:id/resend-email
// body: { target: 'guest' | 'staff' | 'both' }
import { json, requireStayAuth, readJson } from '../../../_utils.js'
import { sendEmail, renderGuestConfirmation, renderStaffNotification } from '../../../_email.js'

export async function onRequestPost({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const body = await readJson(request) || {}
  const target = body.target || 'guest'

  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })

  if (!env.RESEND_API_KEY) {
    return json({ error: 'email_not_configured' }, { status: 503 })
  }

  const results = { guestSent: false, staffSent: false, errors: [] }

  if (target === 'guest' || target === 'both') {
    try {
      const { subject, html } = renderGuestConfirmation(booking, env)
      await sendEmail(env, {
        to: booking.email,
        subject,
        html,
        replyTo: env.BOOKING_NOTIFY_EMAIL
      })
      results.guestSent = true
    } catch (err) {
      results.errors.push('guest: ' + err.message)
    }
  }

  if ((target === 'staff' || target === 'both') && env.BOOKING_NOTIFY_EMAIL) {
    try {
      const { subject, html } = renderStaffNotification(booking, env)
      await sendEmail(env, {
        to: env.BOOKING_NOTIFY_EMAIL,
        subject,
        html,
        replyTo: booking.email
      })
      results.staffSent = true
    } catch (err) {
      results.errors.push('staff: ' + err.message)
    }
  }

  // Record in history
  booking.history = booking.history || []
  booking.history.push({
    at: new Date().toISOString(),
    action: 'email_resent',
    target,
    guest: results.guestSent,
    staff: results.staffSent,
    by: 'admin'
  })
  await env.DEMAIN_DATA.put(`booking:${params.id}`, JSON.stringify(booking))

  return json(results)
}
