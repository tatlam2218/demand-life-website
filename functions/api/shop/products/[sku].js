// GET /api/shop/products/:sku — public single product detail
import { json } from '../../_utils.js'
import { loadInventory } from '../../_shop.js'

export async function onRequestGet({ env, params }) {
  try {
    const products = await loadInventory(env)
    const product = products.find(p => p.sku === params.sku)
    if (!product) {
      return json({ error: 'not_found', sku: params.sku }, 404)
    }
    // Only show active products to public
    if (product.status && product.status !== 'active') {
      return json({ error: 'not_available' }, 404)
    }
    return json({ success: true, product })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}
