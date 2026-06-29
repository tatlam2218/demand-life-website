// PUT  /api/admin/shop/inventory/:sku — update a single product (in Sheet)
// POST same path                       — alias for PUT (browser-friendly)
// DELETE /api/admin/shop/inventory/:sku — set status to 'inactive'
//
// All edits are mirrored back to the Shop Inventory Sheet.
// Extended columns (Description EN/中, Gallery URLs, Materials, Dimensions, Care Instructions)
// are auto-created if the sheet only has the legacy 14-column header.

import { json, requireShopAuth, readJson } from '../../../_utils.js'
import { getShopInventorySheetId } from '../../../_sheet_ids.js'

const FULL_HEADER = [
  'SKU', 'Product Name (EN)', 'Product Name (中)', 'Category',
  'Stock', 'Price HKD', 'Cost HKD',
  'Supplier', 'Variant', 'Last Restocked',
  'Status', 'Notes', 'Image URL', 'Updated At',
  'Description (EN)', 'Description (中)', 'Gallery URLs', 'Materials', 'Dimensions', 'Care Instructions'
]

async function sheetsToken(env) {
  const { sheetsAccessToken } = await import('../../../_google_internal.js')
  return sheetsAccessToken(env)
}

async function loadSheet(env) {
  const sheetId = await getShopInventorySheetId(env)
  if (!sheetId) throw new Error('no_inventory_sheet')
  const token = await sheetsToken(env)
  const meta = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`, {
    headers: { authorization: `Bearer ${token}` }
  }).then(r => r.json())
  const tab = meta.sheets?.[0]?.properties?.title || 'Sheet1'

  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}!A1:T500`,
    { headers: { authorization: `Bearer ${token}` } }
  )
  const data = await resp.json()
  const rows = data.values || []
  return { sheetId, tab, token, rows }
}

async function ensureFullHeader(env, { sheetId, tab, token, rows }) {
  const currentHeader = rows[0] || []
  if (currentHeader.length >= FULL_HEADER.length) return currentHeader
  // Extend header to include detail columns
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}!A1:T1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values: [FULL_HEADER] })
    }
  )
  return FULL_HEADER
}

function productToRow(p) {
  const galleryStr = Array.isArray(p.gallery) ? p.gallery.join('\n') : (p.gallery || '')
  return [
    p.sku || '',
    p.nameEn || '',
    p.nameZh || '',
    p.category || '',
    String(p.stock ?? ''),
    String(p.price ?? ''),
    String(p.cost ?? ''),
    p.supplier || '',
    p.variant || '',
    p.lastRestocked || '',
    p.status || 'active',
    p.notes || '',
    p.imageUrl || '',
    new Date().toISOString(),
    p.descriptionEn || '',
    p.descriptionZh || '',
    galleryStr,
    p.materials || '',
    p.dimensions || '',
    p.careInstructions || ''
  ]
}

// PUT/POST — update existing product
async function updateProduct({ request, env, params }) {
  const check = await requireShopAuth(request, env)
  if (!check.ok) return check.response

  const body = await readJson(request) || {}
  const sku = params.sku
  if (!sku) return json({ error: 'sku_required' }, 400)

  const sheet = await loadSheet(env)
  await ensureFullHeader(env, sheet)
  // Reload after header extension
  const fresh = await loadSheet(env)
  const headers = fresh.rows[0] || []
  const skuCol = headers.indexOf('SKU')
  if (skuCol < 0) return json({ error: 'sheet_format_error' }, 500)

  let rowIdx = -1
  for (let i = 1; i < fresh.rows.length; i++) {
    if (fresh.rows[i][skuCol] === sku) {
      rowIdx = i
      break
    }
  }

  // Build merged record
  const existing = rowIdx >= 0
    ? Object.fromEntries(headers.map((h, j) => [h, fresh.rows[rowIdx][j] || '']))
    : {}

  const merged = {
    sku,
    nameEn: body.nameEn ?? existing['Product Name (EN)'] ?? '',
    nameZh: body.nameZh ?? existing['Product Name (中)'] ?? '',
    category: body.category ?? existing['Category'] ?? '',
    stock: body.stock !== undefined ? body.stock : (existing['Stock'] || '0'),
    price: body.price !== undefined ? body.price : (existing['Price HKD'] || '0'),
    cost: body.cost !== undefined ? body.cost : (existing['Cost HKD'] || '0'),
    supplier: body.supplier ?? existing['Supplier'] ?? '',
    variant: body.variant ?? existing['Variant'] ?? '',
    lastRestocked: body.lastRestocked ?? existing['Last Restocked'] ?? '',
    status: body.status ?? existing['Status'] ?? 'active',
    notes: body.notes ?? existing['Notes'] ?? '',
    imageUrl: body.imageUrl ?? existing['Image URL'] ?? '',
    descriptionEn: body.descriptionEn ?? existing['Description (EN)'] ?? '',
    descriptionZh: body.descriptionZh ?? existing['Description (中)'] ?? '',
    gallery: body.gallery ?? (existing['Gallery URLs'] || ''),
    materials: body.materials ?? existing['Materials'] ?? '',
    dimensions: body.dimensions ?? existing['Dimensions'] ?? '',
    careInstructions: body.careInstructions ?? existing['Care Instructions'] ?? ''
  }

  const row = productToRow(merged)

  if (rowIdx >= 0) {
    // Update existing row
    const sheetRow = rowIdx + 1  // 1-indexed
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${fresh.sheetId}/values/${encodeURIComponent(fresh.tab)}!A${sheetRow}:T${sheetRow}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: { authorization: `Bearer ${fresh.token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      }
    )
    return json({ success: true, action: 'updated', sku })
  } else {
    // Append new row
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${fresh.sheetId}/values/${encodeURIComponent(fresh.tab)}!A:T:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${fresh.token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      }
    )
    return json({ success: true, action: 'created', sku })
  }
}

export const onRequestPut = updateProduct
export const onRequestPost = updateProduct

// DELETE — soft delete (set status=inactive)
export async function onRequestDelete({ request, env, params }) {
  const check = await requireShopAuth(request, env)
  if (!check.ok) return check.response

  const sku = params.sku
  const sheet = await loadSheet(env)
  await ensureFullHeader(env, sheet)
  const fresh = await loadSheet(env)
  const headers = fresh.rows[0] || []
  const skuCol = headers.indexOf('SKU')
  const statusCol = headers.indexOf('Status')

  let rowIdx = -1
  for (let i = 1; i < fresh.rows.length; i++) {
    if (fresh.rows[i][skuCol] === sku) {
      rowIdx = i
      break
    }
  }
  if (rowIdx < 0) return json({ error: 'not_found' }, 404)

  const sheetRow = rowIdx + 1
  const colLetter = String.fromCharCode(65 + statusCol)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${fresh.sheetId}/values/${encodeURIComponent(fresh.tab)}!${colLetter}${sheetRow}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { authorization: `Bearer ${fresh.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values: [['inactive']] })
    }
  )

  return json({ success: true, action: 'deactivated', sku })
}

// GET — fetch single product for admin (includes inactive)
export async function onRequestGet({ request, env, params }) {
  const check = await requireShopAuth(request, env)
  if (!check.ok) return check.response

  const sheet = await loadSheet(env)
  const headers = sheet.rows[0] || []
  const skuCol = headers.indexOf('SKU')
  for (let i = 1; i < sheet.rows.length; i++) {
    if (sheet.rows[i][skuCol] === params.sku) {
      const product = Object.fromEntries(headers.map((h, j) => [h, sheet.rows[i][j] || '']))
      return json({ success: true, product })
    }
  }
  return json({ error: 'not_found' }, 404)
}
