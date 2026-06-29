// GET /api/admin/bookings/[id]/signed-contract?format=html|json
// Returns the fully-signed contract HTML (with audit footer + signature) for admin viewing.
// HTML mode: opens the contract in the browser, user can "print to PDF" to save.
// JSON mode: returns metadata only.

import { json, requireStayAuth } from '../../../_utils.js'

export async function onRequestGet({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return new Response('Booking not found', { status: 404 })

  const url = new URL(request.url)
  const format = url.searchParams.get('format') || 'html'

  const signedHtml = booking.contract?.signedHtml
  if (!signedHtml) {
    if (format === 'json') {
      return json({ error: 'not_signed_yet', status: booking.status }, 404)
    }
    return new Response('Contract has not been signed yet.', { status: 404 })
  }

  if (format === 'json') {
    return json({
      bookingId: booking.id,
      contractNumber: booking.contract?.contractNumber,
      contractHash: booking.contract?.contractHash,
      signedAt: booking.contract?.signedAt,
      signatureName: booking.contract?.signatureName,
      method: booking.contract?.method,
      language: booking.contract?.language,
      ipAddress: booking.contract?.ipAddress,
      htmlSize: signedHtml.length
    })
  }

  // Return the signed HTML directly so it renders in the browser.
  // Admin can hit Ctrl+P / Cmd+P to print or "Save as PDF".
  return new Response(signedHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="contract-${booking.id}.html"`,
      'Cache-Control': 'private, no-cache'
    }
  })
}
