// GET /api/admin/shop/inventory — list all products (including unlisted)
// POST /api/admin/shop/inventory/seed — seed 3 sample products for demo

import { json, requireShopAuth, readJson } from '../../_utils.js'
import { loadInventory } from '../../_shop.js'
import { getShopInventorySheetId } from '../../_sheet_ids.js'

export async function onRequestGet({ request, env }) {
  const check = await requireShopAuth(request, env)
  if (!check.ok) return check.response
  const products = await loadInventory(env)
  return json({
    success: true,
    products,
    sheetId: await getShopInventorySheetId(env),
    sheetUrl: `https://docs.google.com/spreadsheets/d/${await getShopInventorySheetId(env)}/edit`,
    summary: {
      total: products.length,
      active: products.filter(p => p.status === 'active' || !p.status).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      lowStock: products.filter(p => p.stock > 0 && p.stock < 5).length,
      totalStockValue: products.reduce((s, p) => s + (p.stock * p.price), 0)
    }
  })
}

export async function onRequestPost({ request, env }) {
  const check = await requireShopAuth(request, env)
  if (!check.ok) return check.response
  const body = await readJson(request) || {}
  if (body.action !== 'seed-demo') {
    return json({ error: 'unknown_action' }, 400)
  }

  // Seed 3 demo products to the Inventory Sheet
  const sheetId = await getShopInventorySheetId(env)
  if (!sheetId) return json({ error: 'no_inventory_sheet' }, 500)

  const { sheetsAccessToken } = await import('../../_google_internal.js')
  const token = await sheetsAccessToken(env)
  const meta = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`, {
    headers: { authorization: `Bearer ${token}` }
  }).then(r => r.json())
  const tab = meta.sheets?.[0]?.properties?.title || 'Sheet1'

  const now = new Date().toISOString()
  const demoRows = [
    ['DLS-001', 'Demain Life Scented Candle', 'Demain Life 香薰蜡烛', 'Home', '20', '380', '120', 'Local artisan', 'Cedarwood', now.slice(0, 10), 'active', 'Hand-poured soy wax', '', now],
    ['DLS-002', 'Linen Tote Bag', '亚麻托特包', 'Accessories', '15', '280', '90', 'Demain Workshop', 'Natural', now.slice(0, 10), 'active', '100% natural linen', '', now],
    ['DLS-003', 'Ceramic Tea Set (2 cups)', '陶瓷茶具（双杯）', 'Tableware', '8', '680', '250', 'HK ceramicist', 'Off-white', now.slice(0, 10), 'active', 'Handmade in Hong Kong', '', now]
  ]

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}!A2:N4?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: demoRows })
  })

  return json({ success: true, seeded: demoRows.length })
}
