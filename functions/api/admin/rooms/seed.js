// POST /api/admin/rooms/seed
// One-time: writes all 504 rooms to the Rooms tab of the Sheet.

import { requireStayAuth, json, requireAuth } from '../../_utils.js'
import { seedAllRoomsToSheet } from '../../_rooms_sheet.js'

export async function onRequestPost({ request, env }) {
  if (!(await requireStayAuth(request, env))) {
    return json({ error: 'unauthorized' }, 401)
  }
  try {
    const result = await seedAllRoomsToSheet(env)
    return json(result)
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}
