// GET /api/admin/bookings/:id/file?side=front|back|payment&name=<filename>
// Returns the raw image (or PDF) for a booking-attached file stored in KV.
// Admin only.

import { requireStayAuth } from '../../../_utils.js'

export async function onRequestGet({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return new Response('Unauthorized', { status: 401 })

  const url = new URL(request.url)
  const side = url.searchParams.get('side')
  const name = url.searchParams.get('name')
  const bookingId = params.id

  const booking = await env.DEMAIN_DATA.get(`booking:${bookingId}`, 'json')
  if (!booking) return new Response('Booking not found', { status: 404 })

  // Resolve the file name
  let fileName = name
  if (!fileName && side) {
    if (side === 'front' || side === 'back') {
      const docKey = side === 'front' ? 'idFront' : 'idBack'
      fileName = booking.documents?.[docKey]?.fileName
    }
  }
  if (!fileName) return new Response('File not specified', { status: 400 })

  const kvKey = `booking-file:${bookingId}:${fileName}`
  const dataUrl = await env.DEMAIN_DATA.get(kvKey)
  if (!dataUrl) return new Response('File not found in KV', { status: 404 })

  // Parse data URL
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return new Response('Invalid stored data', { status: 500 })
  const mime = match[1]
  const b64 = match[2]
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

  return new Response(bytes, {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'private, no-cache'
    }
  })
}
