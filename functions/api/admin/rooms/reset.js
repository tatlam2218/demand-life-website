// POST /api/admin/rooms/reset
// Body: { confirm: "RESET_ALL_ROOMS" }
// Wipes all room:* keys from KV so the entire grid returns to "vacant" state.
// Useful for demo cleanup or when bookings have been bulk-deleted.

import { requireStayAuth, json, readJson, requireAuth } from '../../_utils.js'
import { BLOCK_NUMBERS, ROOM_NUMBERS, roomId } from '../../_rooms.js'

export async function onRequestPost({ request, env }) {
  if (!(await requireStayAuth(request, env))) {
    return json({ error: 'unauthorized' }, 401)
  }
  const body = await readJson(request).catch(() => ({}))
  if (body.confirm !== 'RESET_ALL_ROOMS') {
    return json({
      error: 'confirmation_required',
      hint: 'POST with {"confirm":"RESET_ALL_ROOMS"}'
    }, 400)
  }

  let deleted = 0
  for (const b of BLOCK_NUMBERS) {
    for (const r of ROOM_NUMBERS) {
      const id = roomId(b, r)
      const existing = await env.DEMAIN_DATA.get(`room:${id}`)
      if (existing) {
        await env.DEMAIN_DATA.delete(`room:${id}`)
        deleted++
      }
    }
  }

  return json({ success: true, deletedCount: deleted, totalRooms: BLOCK_NUMBERS.length * ROOM_NUMBERS.length })
}
