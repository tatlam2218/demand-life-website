// GET /api/legal?type=terms|privacy&lang=en
// Public endpoint to fetch terms or privacy policy text
import { json } from './_utils.js'
import { getLegalTemplates } from './_contracts.js'

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const type = url.searchParams.get('type') || 'terms'
  const lang = url.searchParams.get('lang') || 'en'
  const VALID_TYPES = ['terms', 'shop-terms', 'refund', 'shipping', 'privacy', 'stay-terms', 'stay-refund', 'stay-payment']
  if (!VALID_TYPES.includes(type)) {
    return json({ error: 'invalid_type' }, { status: 400 })
  }
  const templates = await getLegalTemplates(env)
  const html = templates[type]?.[lang] || templates[type]?.en || ''
  return json({ html, type, lang })
}
