// POST /api/admin/bookings/:id/checkin
// Marks the booking as checked-in (guest has arrived and received keys).

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
  if (!booking.assignedRoom) {
    return json({ error: 'no_room', message: 'Assign a room before checking in.' }, 400)
  }

  const now = new Date().toISOString()
  booking.status = 'checked-in'
  booking.checkedInAt = now
  booking.history = booking.history || []
  booking.history.push({ at: now, by: 'staff', action: 'checked_in' })
  await env.DEMAIN_DATA.put(`booking:${bookingId}`, JSON.stringify(booking))

  // Update room tenancy status
  try {
    const room = await getRoom(env, booking.assignedRoom.id)
    if (room.currentTenancy) {
      room.currentTenancy.status = 'checked-in'
      room.currentTenancy.checkedInAt = now
      await saveRoom(env, room)
      await syncRoomToSheet(env, room).catch(() => {})
    }
  } catch (e) {
    console.warn('Room sync failed:', e.message)
  }

  try {
    await updateBookingFields(env, bookingId, { 'Status': 'checked-in' })
  } catch (e) {
    console.warn('Sheet update failed:', e.message)
  }

  return json({ success: true, booking })
}
