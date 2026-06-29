// POST /api/admin/bookings/cleanup-test
// Wipes all current bookings (KV + index). Does NOT clean Google Drive / Sheet
// (those are easier to clean manually & we keep history). Use sparingly.
import { json, requireStayAuth, readJson } from '../../_utils.js'

export async function onRequestPost({ request, env }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const body = await readJson(request) || {}
  if (body.confirm !== 'DELETE_ALL_BOOKINGS') {
    return json({ error: 'confirmation_required', hint: 'POST with {"confirm":"DELETE_ALL_BOOKINGS"}' }, { status: 400 })
  }

  const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
  const index = Array.isArray(indexRaw) ? indexRaw : []
  const deleted = []
  for (const b of index) {
    await env.DEMAIN_DATA.delete(`booking:${b.id}`)
    deleted.push(b.id)
  }
  await env.DEMAIN_DATA.put('booking-index', JSON.stringify([]))

  return json({ success: true, deletedCount: deleted.length, deleted })
}
