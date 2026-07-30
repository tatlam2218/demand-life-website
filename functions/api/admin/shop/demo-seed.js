// POST /api/admin/shop/demo-seed
// Writes one demo product directly into KV (no Google Sheet required).
// Used to show QFPay reviewers a complete end-to-end checkout flow.
// DELETE /api/admin/shop/demo-seed — removes the KV override so the real
//   Sheet inventory takes over again.
//
// No auth required (demo-only endpoint, product data is harmless).

import { json } from '../../_utils.js'

const DEMO_PRODUCTS = [
  {
    sku: 'DLS-DEMO-001',
    nameEn: 'Demain Life Scented Candle',
    nameZh: 'Demain Life 香薰蠟燭',
    category: 'Home',
    stock: 99,
    price: 380,
    cost: 120,
    supplier: 'Local artisan',
    variant: 'Cedarwood & Bergamot',
    lastRestocked: new Date().toISOString().slice(0, 10),
    status: 'active',
    notes: 'Demo product for QFPay compliance review',
    imageUrl: '/shop-products/candle-demo.jpg',
    descriptionEn: 'Hand-poured soy wax candle with cedarwood and bergamot essential oils. Burns for approximately 40 hours. Made in Hong Kong by independent artisans.',
    descriptionZh: '手工倒入大豆蠟，含雪松和佛手柑精油。燃燒時間約 40 小時。由香港獨立工匠製作。',
    gallery: [
      '/shop-products/candle-demo.jpg'
    ],
    materials: '100% soy wax, cotton wick, cedarwood & bergamot essential oils',
    dimensions: '8cm × 8cm × 10cm · 280g',
    careInstructions: 'Trim wick to 6mm before each use. Do not burn for more than 4 hours at a time.',
    updatedAt: new Date().toISOString()
  }
]

export async function onRequestPost({ env }) {
  try {
    await env.DEMAIN_DATA.put('shop:kv-inventory', JSON.stringify(DEMO_PRODUCTS))
    return json({
      success: true,
      message: 'Demo product seeded to KV. Shop will now show the candle product.',
      products: DEMO_PRODUCTS.map(p => ({ sku: p.sku, name: p.nameEn, price: p.price }))
    })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}

export async function onRequestDelete({ env }) {
  try {
    await env.DEMAIN_DATA.delete('shop:kv-inventory')
    return json({
      success: true,
      message: 'KV inventory override removed. Shop now reads from Google Sheet.'
    })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}

export async function onRequestGet({ env }) {
  try {
    const kv = await env.DEMAIN_DATA.get('shop:kv-inventory', 'json')
    return json({
      kvInventoryActive: Array.isArray(kv) && kv.length > 0,
      products: kv || [],
      demoProducts: DEMO_PRODUCTS.map(p => ({ sku: p.sku, name: p.nameEn, price: p.price }))
    })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}
