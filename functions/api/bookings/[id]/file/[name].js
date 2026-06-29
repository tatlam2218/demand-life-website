// GET /api/bookings/[id]/file/[name]?token=xxx
// Serves a stored booking file (ID image) to the token holder
export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token') || ''
  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return new Response('Not found', { status: 404 })
  if (!booking.detailsToken || booking.detailsToken !== token) {
    return new Response('Forbidden', { status: 403 })
  }
  const kvKey = `booking-file:${params.id}:${params.name}`
  const dataUrl = await env.DEMAIN_DATA.get(kvKey)
  if (!dataUrl) return new Response('File not found', { status: 404 })

  // Parse data URL
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
