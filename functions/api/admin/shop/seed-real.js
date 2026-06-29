// POST /api/admin/shop/seed-real
// Replace inventory with 4 real products (Linen Tote, Ceramic Mug, Cotton Throw, Hand Soap)

import { requireShopAuth, json } from '../../_utils.js'
import { getShopInventorySheetId } from '../../_sheet_ids.js'

const REAL_PRODUCTS = [
  // SKU, Name EN, Name 中, Category, Stock, Price, Cost, Supplier, Variant, LastRestocked, Status, Notes, Image URL
  ['DLS-TOTE', 'Linen Tote', '亚麻托特包', 'Everyday', '20', '280', '90', 'Demain Workshop', 'Natural', new Date().toISOString().slice(0, 10), 'active', 'Soft linen tote for daily carry.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80', new Date().toISOString()],
  ['DLS-MUG',  'Ceramic Mug', '陶瓷杯', 'Tableware', '30', '180', '60', 'HK ceramicist', 'Warm white', new Date().toISOString().slice(0, 10), 'active', 'Simple ceramic mug with warm texture.', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80', new Date().toISOString()],
  ['DLS-THROW','Cotton Throw', '棉质盖毯', 'Home', '15', '520', '180', 'Demain Workshop', 'Oat', new Date().toISOString().slice(0, 10), 'active', 'Soft cotton throw for bed or lounge.', 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80', new Date().toISOString()],
  ['DLS-SOAP', 'Hand Soap', '洗手液', 'Bath', '50', '120', '40', 'Local artisan', 'Citrus & herbs', new Date().toISOString().slice(0, 10), 'active', 'Plant-based hand wash with a subtle scent.', 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800&q=80', new Date().toISOString()]
]

export async function onRequestPost({ request, env }) {
  const check = await requireShopAuth(request, env)
  if (!check.ok) return check.response

  const sheetId = await getShopInventorySheetId(env)
  if (!sheetId) return json({ error: 'no_inventory_sheet' }, 500)

  const { sheetsAccessToken } = await import('../../_google_internal.js')
  const token = await sheetsAccessToken(env)
  const meta = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`, {
    headers: { authorization: `Bearer ${token}` }
  }).then(r => r.json())
  const tab = meta.sheets?.[0]?.properties?.title || 'Sheet1'

  // Clear all rows (keep header)
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}!A2:N500:clear`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` }
  })

  // Write the 4 real products
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}!A2:N${REAL_PRODUCTS.length + 1}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: REAL_PRODUCTS })
  })

  return json({ success: true, count: REAL_PRODUCTS.length, products: REAL_PRODUCTS.map(p => ({ sku: p[0], name: p[1] })) })
}
