// POST /api/admin/bookings/:id/assign-room
// Body: { block: 1, room: '101', roomConfig: 'one-bed-studio' | 'twin-studio', moveOutDate?: 'YYYY-MM-DD' }
//
// Assigns a physical room to a paid booking. Updates:
//   - booking.assignedRoom
//   - booking.status -> 'room-assigned'
//   - room record (room:<id>) with currentTenancy
//   - Google Sheet row (assigned columns)
//   - Rooms Sheet (separate tab)

import { requireStayAuth, json, readJson } from '../../../_utils.js'
import { BLOCK_NUMBERS, ROOM_NUMBERS, roomId, getRoom, saveRoom } from '../../../_rooms.js'
import { updateBookingFields } from '../../../_sheets_monthly.js'
import { syncRoomToSheet } from '../../../_rooms_sheet.js'

export async function onRequestPost({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const bookingId = params.id
  const body = await readJson(request)
  const block = Number(body.block)
  const room = String(body.room || '')
  const roomConfig = body.roomConfig === 'twin-studio' ? 'twin-studio' : 'one-bed-studio'
  const moveOutDate = body.moveOutDate || null

  if (!BLOCK_NUMBERS.includes(block)) {
    return json({ error: `Invalid block: ${block}` }, 400)
  }
  if (!ROOM_NUMBERS.includes(room)) {
    return json({ error: `Invalid room: ${room}` }, 400)
  }

  const booking = await env.DEMAIN_DATA.get(`booking:${bookingId}`, 'json')
  if (!booking) return json({ error: 'booking_not_found' }, 404)

  // Allow assignment after payment (status: paid) or to re-assign existing
  const allowedStatuses = ['paid', 'room-assigned', 'checked-in']
  if (!allowedStatuses.includes(booking.status)) {
    return json({
      error: 'invalid_status',
      message: `Cannot assign room for status "${booking.status}". Booking must be paid first.`
    }, 400)
  }

  const targetRoomId = roomId(block, room)
  const targetRoom = await getRoom(env, targetRoomId)
  if (targetRoom.currentTenancy && targetRoom.currentTenancy.bookingId !== bookingId) {
    return json({
      error: 'room_occupied',
      message: `Room ${block}-${room} is currently occupied by ${targetRoom.currentTenancy.guestName} (booking ${targetRoom.currentTenancy.bookingId}).`
    }, 409)
  }

  // ---- Overlap check against this room's history + currentTenancy ----
  // A conflict exists if any existing tenancy overlaps with [moveInDate .. moveOutDate].
  if (booking.moveInDate) {
    const newStart = new Date(booking.moveInDate).getTime()
    const newEnd = moveOutDate ? new Date(moveOutDate).getTime() : Number.MAX_SAFE_INTEGER
    const tenancies = [
      ...(targetRoom.history || []),
      ...(targetRoom.currentTenancy ? [targetRoom.currentTenancy] : [])
    ].filter(t => t.bookingId !== bookingId)
    for (const t of tenancies) {
      if (!t.moveInDate) continue
      const tStart = new Date(t.moveInDate).getTime()
      const tEnd = t.moveOutDate ? new Date(t.moveOutDate).getTime() : Number.MAX_SAFE_INTEGER
      if (tStart < newEnd && tEnd > newStart) {
        return json({
          error: 'date_conflict',
          message: `Room ${block}-${room} is already booked from ${t.moveInDate} to ${t.moveOutDate || 'open-ended'} by ${t.guestName} (booking ${t.bookingId}).`
        }, 409)
      }
    }
  }

  // If reassigning, free old room first
  if (booking.assignedRoom && booking.assignedRoom.id !== targetRoomId) {
    const oldRoom = await getRoom(env, booking.assignedRoom.id)
    if (oldRoom.currentTenancy && oldRoom.currentTenancy.bookingId === bookingId) {
      // Move current to history
      oldRoom.history = oldRoom.history || []
      oldRoom.history.unshift({ ...oldRoom.currentTenancy, releasedAt: new Date().toISOString() })
      oldRoom.history = oldRoom.history.slice(0, 50)
      oldRoom.currentTenancy = null
      await saveRoom(env, oldRoom)
      await syncRoomToSheet(env, oldRoom).catch((e) => console.warn('room-sheet sync (old):', e.message))
    }
  }

  const now = new Date().toISOString()
  const tenancy = {
    bookingId,
    guestName: booking.name || '',
    nameChinese: booking.details?.nameChinese || '',
    moveInDate: booking.moveInDate || null,
    moveOutDate,
    duration: booking.duration || '',
    roomConfig,
    status: booking.status === 'checked-in' ? 'checked-in' : 'assigned',
    assignedAt: now
  }
  targetRoom.currentTenancy = tenancy
  await saveRoom(env, targetRoom)

  booking.assignedRoom = {
    id: targetRoomId,
    block,
    room,
    roomConfig,
    assignedAt: now,
    moveOutDate
  }
  if (booking.status === 'paid') booking.status = 'room-assigned'
  booking.history = booking.history || []
  booking.history.push({
    at: now,
    by: 'staff',
    action: 'room_assigned',
    detail: `Block ${block} Room ${room} · ${roomConfig}`
  })
  booking.unread = true
  await env.DEMAIN_DATA.put(`booking:${bookingId}`, JSON.stringify(booking))

  // Update Google Sheet (booking row)
  try {
    await updateBookingFields(env, bookingId, {
      'Assigned Block': String(block),
      'Assigned Room': room,
      'Room Config': roomConfig,
      'Assigned At': now,
      'Move-out Date': moveOutDate || '',
      'Status': booking.status
    })
  } catch (e) {
    console.warn('Sheet update (booking row) failed:', e.message)
  }

  // Update separate Rooms Sheet
  try {
    await syncRoomToSheet(env, targetRoom)
  } catch (e) {
    console.warn('Sheet update (rooms tab) failed:', e.message)
  }

  return json({ success: true, room: targetRoom, booking })
}
