// GET /api/shop/products
// Public endpoint: returns all active inventory products.

import { json } from '../_utils.js'
import { loadInventory } from '../_shop.js'

export async function onRequestGet({ env }) {
  try {
    const products = await loadInventory(env)
    // Only return active products to public
    const visible = products.filter(p => p.status === 'active' || p.status === '')
    return json({ success: true, products: visible })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}
