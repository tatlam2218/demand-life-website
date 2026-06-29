// GET /api/bookings/[id]/contract?token=xxx&lang=en
// Returns rendered HTML contract (for the guest contract page)
import { json } from '../../_utils.js'
import { getLegalTemplates, renderContractHTML, buildContractData } from '../../_contracts.js'

export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token') || ''
  const lang = url.searchParams.get('lang') || null

  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })
  if (!booking.detailsToken || booking.detailsToken !== token) {
    return json({ error: 'invalid_token' }, { status: 403 })
  }
  // Phase 2 must be submitted before a contract can be generated
  if (!booking.details) {
    return json({ error: 'details_not_submitted' }, { status: 400 })
  }

  // Load room info
  const content = await env.DEMAIN_DATA?.get('site-content', 'json')
  const rooms = content?.rooms || []
  const room = rooms.find((r) => r.id === booking.roomType)
  // Translate room name in target language
  const targetLang = lang || booking.sourceLang || 'en'
  let roomLocalized = room
  if (room) {
    const tr = room.translations?.[targetLang] || room.translations?.en || {}
    roomLocalized = { ...room, title: tr.title || room.id, price: tr.price || '' }
  }

  const legal = await getLegalTemplates(env)
  const html = renderContractHTML(booking, roomLocalized, legal, { lang: targetLang })
  const data = buildContractData(booking, roomLocalized, legal, { lang: targetLang })

  return json({
    html,
    booking: {
      id: booking.id,
      name: booking.name,
      contractSignedAt: booking.contractSignedAt || null,
      contractHash: booking.contractHash || null
    },
    contractData: {
      roomType: data.roomType,
      moveInDate: data.moveInDate,
      moveOutDate: data.moveOutDate,
      duration: data.duration,
      roomPrice: data.roomPrice,
      depositAmount: data.depositAmount,
      monthlyRent: data.monthlyRent
    },
    landlord: legal.landlord
  })
}
