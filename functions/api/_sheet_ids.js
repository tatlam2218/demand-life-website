// Helper: resolve which Sheet ID to use for each data type.
// Returns the new structured Sheet IDs from KV, with fallback to legacy GOOGLE_SHEET_ID.

export async function getSheetIdFor(env, type) {
  // type: 'bookings' | 'rooms' | 'payments' | 'shop-orders' | 'shop-inventory'
  const fromKv = await env.DEMAIN_DATA.get(`sheet-id:${type}`)
  if (fromKv) return fromKv
  // Legacy fallback
  return env.GOOGLE_SHEET_ID
}

export async function getBookingsSheetId(env) {
  return getSheetIdFor(env, 'bookings')
}
export async function getRoomsSheetId(env) {
  return getSheetIdFor(env, 'rooms')
}
export async function getPaymentsSheetId(env) {
  return getSheetIdFor(env, 'payments')
}
export async function getShopOrdersSheetId(env) {
  return getSheetIdFor(env, 'shop-orders')
}
export async function getShopInventorySheetId(env) {
  return getSheetIdFor(env, 'shop-inventory')
}
