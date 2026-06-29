// GET /api/admin/bookings/[id]/file/[name]
// Admin-authenticated file access
import { requireStayAuth } from '../../../../_utils.js'

export async function onRequestGet({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return new Response('Unauthorized', { status: 401 })

  const kvKey = `booking-file:${params.id}:${params.name}`
  const dataUrl = await env.DEMAIN_DATA.get(kvKey)
  if (!dataUrl) return new Response('File not found', { status: 404 })

  const m = /^data:([^;,]+);base64,(.*)$/.exec(dataUrl)
  if (!m) return new Response('Bad file', { status: 500 })
  const mime = m[1]
  const bin = atob(m[2])
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Response(bytes, {
    headers: {
      'content-type': mime,
      'cache-control': 'private, max-age=300'
    }
  })
}
