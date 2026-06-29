// GET /api/contracts/[id]/view?token=xxx&lang=xx
// Returns the rendered contract HTML (for in-browser viewing & printing)
import { buildContractHtml } from '../../_contract.js'

export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token') || ''
  const lang = url.searchParams.get('lang') || 'en'

  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) {
    return new Response('Booking not found', { status: 404, headers: { 'content-type': 'text/plain' } })
  }
  if (!booking.detailsToken || booking.detailsToken !== token) {
    return new Response('Invalid token', { status: 403, headers: { 'content-type': 'text/plain' } })
  }

  // Booking must have details submitted before contract can be viewed
  if (!booking.details) {
    return new Response('Please complete the profile form first.', { status: 400, headers: { 'content-type': 'text/plain' } })
  }

  const { html } = await buildContractHtml(env, booking, lang)
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store'
    }
  })
}
