// POST /api/admin/bookings/:id/release-room
// Releases the room currently assigned to this booking (e.g., guest checked out, or correction).

import { requireStayAuth, json } from '../../../_utils.js'
import { getRoom, saveRoom } from '../../../_rooms.js'
import { updateBookingFields } from '../../../_sheets_monthly.js'
import { syncRoomToSheet } from '../../../_rooms_sheet.js'

export async function onRequestPost({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const bookingId = params.id
  const booking = await env.DEMAIN_DATA.get(`booking:${bookingId}`, 'json')
  if (!booking) return json({ error: 'booking_not_found' }, 404)
  if (!booking.assignedRoom) return json({ error: 'no_room_assigned' }, 400)

  const room = await getRoom(env, booking.assignedRoom.id)
  if (room.currentTenancy && room.currentTenancy.bookingId === bookingId) {
    room.history = room.history || []
    room.history.unshift({ ...room.currentTenancy, releasedAt: new Date().toISOString() })
    room.history = room.history.slice(0, 50)
    room.currentTenancy = null
    await saveRoom(env, room)
    await syncRoomToSheet(env, room).catch(() => {})
  }

  const releasedAt = new Date().toISOString()
  booking.assignedRoom = null
  booking.status = 'paid' // revert so staff can reassign
  booking.history = booking.history || []
  booking.history.push({
    at: releasedAt,
    by: 'staff',
    action: 'room_released',
    detail: `Released ${room.id}`
  })
  await env.DEMAIN_DATA.put(`booking:${bookingId}`, JSON.stringify(booking))

  try {
    await updateBookingFields(env, bookingId, {
      'Assigned Block': '',
      'Assigned Room': '',
      'Room Config': '',
      'Assigned At': '',
      'Status': 'paid'
    })
  } catch (e) {
    console.warn('Sheet update failed:', e.message)
  }

  return json({ success: true })
}
