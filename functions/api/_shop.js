// Shared Shop module: product loading, order creation, sheet sync.
//
// Inventory is stored in Google Sheet "Demain Life - Shop Inventory" (managed by staff).
// Orders are stored in KV + synced to "Demain Life - Shop Orders 2026".

import { getShopInventorySheetId, getShopOrdersSheetId } from './_sheet_ids.js'

const INVENTORY_HEADER = [
  'SKU', 'Product Name (EN)', 'Product Name (中)', 'Category',
  'Stock', 'Price HKD', 'Cost HKD',
  'Supplier', 'Variant', 'Last Restocked',
  'Status', 'Notes', 'Image URL', 'Updated At',
  'Description (EN)', 'Description (中)', 'Gallery URLs', 'Materials', 'Dimensions', 'Care Instructions'
]

const ORDERS_HEADER = [
  'Order ID', 'Created At', 'Status',
  'Customer Name', 'Email', 'Phone',
  'Items (JSON)', 'Item Count', 'Subtotal HKD', 'Shipping HKD', 'Total HKD',
  'Payment Method', 'Payment Status', 'Paid At',
  'Shipping Address', 'Country', 'Tracking Number',
  'Shipped At', 'Delivered At',
  'Notes'
]

async function sheetsToken(env) {
  const { sheetsAccessToken } = await import('./_google_internal.js')
  return sheetsAccessToken(env)
}

// Read all products from Shop Inventory Sheet
export async function loadInventory(env) {
  const sheetId = await getShopInventorySheetId(env)
  if (!sheetId) return []
  const token = await sheetsToken(env)
  // Get first tab name
  const meta = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`, {
    headers: { authorization: `Bearer ${token}` }
  }).then(r => r.json())
  const tab = meta.sheets?.[0]?.properties?.title || 'Sheet1'

  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}!A1:T500`, {
    headers: { authorization: `Bearer ${token}` }
  })
  if (!resp.ok) return []
  const data = await resp.json()
  const rows = data.values || []
  if (rows.length < 2) return []

  const headers = rows[0]
  const idx = (name) => headers.indexOf(name)
  const products = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r[idx('SKU')] || !r[idx('Product Name (EN)')]) continue
    const galleryRaw = idx('Gallery URLs') >= 0 ? (r[idx('Gallery URLs')] || '') : ''
    const gallery = galleryRaw
      ? galleryRaw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      : []
    products.push({
      sku: r[idx('SKU')] || '',
      nameEn: r[idx('Product Name (EN)')] || '',
      nameZh: r[idx('Product Name (中)')] || '',
      category: r[idx('Category')] || '',
      stock: parseInt(r[idx('Stock')] || '0', 10),
      price: parseFloat(r[idx('Price HKD')] || '0'),
      cost: parseFloat(r[idx('Cost HKD')] || '0'),
      supplier: r[idx('Supplier')] || '',
      variant: r[idx('Variant')] || '',
      lastRestocked: r[idx('Last Restocked')] || '',
      status: r[idx('Status')] || 'active',
      notes: r[idx('Notes')] || '',
      imageUrl: r[idx('Image URL')] || '',
      updatedAt: r[idx('Updated At')] || '',
      descriptionEn: idx('Description (EN)') >= 0 ? (r[idx('Description (EN)')] || '') : '',
      descriptionZh: idx('Description (中)') >= 0 ? (r[idx('Description (中)')] || '') : '',
      gallery,
      materials: idx('Materials') >= 0 ? (r[idx('Materials')] || '') : '',
      dimensions: idx('Dimensions') >= 0 ? (r[idx('Dimensions')] || '') : '',
      careInstructions: idx('Care Instructions') >= 0 ? (r[idx('Care Instructions')] || '') : ''
    })
  }
  return products
}

export function generateOrderId() {
  const now = new Date()
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(2)))
    .map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('')
  return `DLS-${date}-${rand}`
}

export function generateInvoiceNumber() {
  // Sequential invoice numbers stored in KV: invoice-counter
  // For now: timestamp-based
  const t = Date.now()
  return `INV-${t.toString(36).toUpperCase().slice(-6)}`
}

// Save order to KV + Sheet
export async function saveOrder(env, order) {
  await env.DEMAIN_DATA.put(`order:${order.id}`, JSON.stringify(order))
  // Maintain order index for listing
  const indexRaw = await env.DEMAIN_DATA.get('order-index', 'json')
  const index = Array.isArray(indexRaw) ? indexRaw : []
  const existingIdx = index.findIndex(o => o.id === order.id)
  const indexEntry = {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    customer: order.customer?.name || '',
    total: order.totals?.total || 0
  }
  if (existingIdx === -1) index.unshift(indexEntry)
  else index[existingIdx] = indexEntry
  // Cap to 5000 most recent
  await env.DEMAIN_DATA.put('order-index', JSON.stringify(index.slice(0, 5000)))

  // Sync to Sheet
  await syncOrderToSheet(env, order).catch(e => console.warn('Sheet sync (order):', e.message))
}

export async function getOrder(env, id) {
  return env.DEMAIN_DATA.get(`order:${id}`, 'json')
}

// Sync order row to Shop Orders Sheet
export async function syncOrderToSheet(env, order) {
  const sheetId = await getShopOrdersSheetId(env)
  if (!sheetId) return
  const token = await sheetsToken(env)
  const meta = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`, {
    headers: { authorization: `Bearer ${token}` }
  }).then(r => r.json())
  const tab = meta.sheets?.[0]?.properties?.title || 'Sheet1'

  const row = [
    order.id,
    order.createdAt || '',
    order.status || 'new',
    order.customer?.name || '',
    order.customer?.email || '',
    order.customer?.phone || '',
    JSON.stringify(order.items || []),
    String((order.items || []).reduce((s, i) => s + (i.qty || 1), 0)),
    String(order.totals?.subtotal || 0),
    String(order.totals?.shipping || 0),
    String(order.totals?.total || 0),
    order.payment?.method || '',
    order.payment?.status || 'pending',
    order.payment?.paidAt || '',
    order.delivery?.address || '',
    order.delivery?.country || '',
    order.delivery?.trackingNumber || '',
    order.delivery?.shippedAt || '',
    order.delivery?.deliveredAt || '',
    order.notes || ''
  ]

  // Find existing row by Order ID (col A)
  const colsResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}!A2:A2000`, {
    headers: { authorization: `Bearer ${token}` }
  })
  const colsData = await colsResp.json().catch(() => ({ values: [] }))
  const values = colsData.values || []
  let rowIndex = -1
  for (let i = 0; i < values.length; i++) {
    if ((values[i][0] || '').trim() === order.id) { rowIndex = i + 2; break }
  }

  if (rowIndex > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}!A${rowIndex}:T${rowIndex}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    })
  } else {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}!A:T:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    })
  }
}

export { INVENTORY_HEADER, ORDERS_HEADER }
