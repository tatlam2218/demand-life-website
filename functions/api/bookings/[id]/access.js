// GET /api/bookings/[id]/access?token=xxx
// Validates token and returns booking info needed by the details form (no sensitive data)
import { json } from '../../_utils.js'

export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token') || ''
  const id = params.id

  if (!token) return json({ error: 'token_required' }, { status: 400 })

  const booking = await env.DEMAIN_DATA.get(`booking:${id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })

  if (!booking.detailsToken || booking.detailsToken !== token) {
    return json({ error: 'invalid_token' }, { status: 403 })
  }
  // Check expiry
  if (booking.detailsTokenExpiresAt && new Date(booking.detailsTokenExpiresAt).getTime() < Date.now()) {
    return json({ error: 'token_expired' }, { status: 403 })
  }

  // Return a stripped public view (no token, no admin-only fields)
  return json({
    booking: {
      id: booking.id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      nationality: booking.nationality,
      roomType: booking.roomType,
      moveInDate: booking.moveInDate,
      duration: booking.duration,
      occupancy: booking.occupancy,
      sourceLang: booking.sourceLang,
      // Already-submitted details (so guests can re-edit)
      details: booking.details || null,
      documents: booking.documents
        ? Object.fromEntries(
            Object.entries(booking.documents).map(([k, v]) => [
              k,
              v ? { uploadedAt: v.uploadedAt, fileName: v.fileName, url: v.url } : null
            ])
          )
        : {},
      detailsSubmittedAt: booking.detailsSubmittedAt
    }
  })
}
