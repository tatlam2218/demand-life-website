// GET    /api/admin/bookings/:id  —  fetch one booking with full details
// PATCH  /api/admin/bookings/:id  —  update status / add note
// DELETE /api/admin/bookings/:id  —  remove (use sparingly)
import { json, requireStayAuth, readJson } from '../../_utils.js'

async function loadBooking(env, id) {
  return await env.DEMAIN_DATA.get(`booking:${id}`, 'json')
}

async function saveBooking(env, booking) {
  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))
  // Update the index entry too
  const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
  const index = Array.isArray(indexRaw) ? indexRaw : []
  const idx = index.findIndex((b) => b.id === booking.id)
  if (idx !== -1) {
    index[idx] = {
      id: booking.id, createdAt: booking.createdAt, status: booking.status,
      name: booking.name, email: booking.email, phone: booking.phone,
      roomType: booking.roomType, moveInDate: booking.moveInDate
    }
    await env.DEMAIN_DATA.put('booking-index', JSON.stringify(index))
  }
}

export async function onRequestGet({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const booking = await loadBooking(env, params.id)
  if (!booking) return json({ error: 'not_found' }, { status: 404 })
  return json({ booking })
}

export async function onRequestPatch({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const body = await readJson(request)
  if (!body) return json({ error: 'invalid_body' }, { status: 400 })

  const booking = await loadBooking(env, params.id)
  if (!booking) return json({ error: 'not_found' }, { status: 404 })

  const allowedStatuses = ['new', 'reviewing', 'contract-sent', 'signed', 'paid', 'checked-in', 'cancelled']
  if (body.status && allowedStatuses.includes(body.status) && body.status !== booking.status) {
    booking.history = booking.history || []
    booking.history.push({
      at: new Date().toISOString(),
      action: 'status_change',
      from: booking.status,
      to: body.status,
      by: 'admin'
    })
    booking.status = body.status
  }
  if (typeof body.note === 'string' && body.note.trim()) {
    booking.history = booking.history || []
    booking.history.push({
      at: new Date().toISOString(),
      action: 'note',
      note: body.note.trim().slice(0, 2000),
      by: 'admin'
    })
  }

  await saveBooking(env, booking)
  return json({ booking })
}

export async function onRequestDelete({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  await env.DEMAIN_DATA.delete(`booking:${params.id}`)
  const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
  const index = Array.isArray(indexRaw) ? indexRaw : []
  const next = index.filter((b) => b.id !== params.id)
  await env.DEMAIN_DATA.put('booking-index', JSON.stringify(next))
  return json({ success: true })
}
