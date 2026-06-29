// GET /api/admin/bookings  —  list all bookings (from KV index)
import { json, requireStayAuth } from '../../_utils.js'

export async function onRequestGet({ request, env }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
  const index = Array.isArray(indexRaw) ? indexRaw : []
  return json({ bookings: index })
}
