// GET /api/admin/rooms
// Returns all 504 rooms with their current occupancy state.

import { requireStayAuth, json } from '../../_utils.js'
import { BLOCK_NUMBERS, ROOM_NUMBERS, loadAllRoomsWithState } from '../../_rooms.js'

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ error: 'unauthorized' }, 401)
  }

  const rooms = await loadAllRoomsWithState(env)
  return json({
    success: true,
    blocks: BLOCK_NUMBERS,
    roomNumbers: ROOM_NUMBERS,
    rooms,
    summary: {
      total: rooms.length,
      occupied: rooms.filter((r) => r.currentTenancy).length,
      vacant: rooms.filter((r) => !r.currentTenancy).length
    }
  })
}
