// Simple reactive cart store (persists in localStorage)
import { reactive, watch } from 'vue'

const STORAGE_KEY = 'demain_shop_cart_v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return { items: [], showFloating: false }
}

export const cart = reactive(load())

// Persist on change
watch(() => cart.items, () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: cart.items, showFloating: false }))
  } catch (e) {}
}, { deep: true })

export function addToCart(product, qty = 1) {
  const existing = cart.items.find(i => i.sku === product.sku)
  if (existing) {
    existing.qty += qty
  } else {
    cart.items.push({
      sku: product.sku,
      name: product.nameEn,
      nameZh: product.nameZh,
      price: product.price,
      qty,
      imageUrl: product.imageUrl
    })
  }
  cart.showFloating = true
  // Auto-hide after 4s
  setTimeout(() => { cart.showFloating = false }, 4000)
}

export function removeFromCart(sku) {
  const idx = cart.items.findIndex(i => i.sku === sku)
  if (idx !== -1) cart.items.splice(idx, 1)
}

export function updateQty(sku, qty) {
  const item = cart.items.find(i => i.sku === sku)
  if (item) {
    if (qty <= 0) removeFromCart(sku)
    else item.qty = qty
  }
}

export function clearCart() {
  cart.items.splice(0, cart.items.length)
}

export function cartSubtotal() {
  return cart.items.reduce((s, i) => s + i.price * i.qty, 0)
}

export function cartItemCount() {
  return cart.items.reduce((s, i) => s + i.qty, 0)
}
