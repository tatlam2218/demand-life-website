<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { addToCart, cart, cartItemCount, cartSubtotal } from '../stores/cart.js'

const router = useRouter()
const products = ref([])
const loading = ref(true)
const error = ref('')
const lang = ref('en')

onMounted(async () => {
  try {
    const res = await fetch('/api/shop/products')
    const data = await res.json()
    if (data.success) products.value = data.products
    else error.value = data.error || 'Failed to load products'
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
})

const grouped = computed(() => {
  const cats = {}
  products.value.forEach(p => {
    const cat = p.category || 'Other'
    if (!cats[cat]) cats[cat] = []
    cats[cat].push(p)
  })
  return cats
})

function productName(p) {
  if (lang.value === 'zh-CN' || lang.value === 'zh-HK') return p.nameZh || p.nameEn
  return p.nameEn
}

function goCheckout() { router.push('/shop/checkout') }
</script>

<template>
  <div class="shop-page">
    <!-- Top bar -->
    <header class="shop-header">
      <router-link to="/" class="brand">Demain Life</router-link>
      <nav>
        <select v-model="lang" class="lang-select">
          <option value="en">EN</option>
          <option value="zh-HK">繁</option>
          <option value="zh-CN">简</option>
        </select>
        <button class="cart-btn" @click="goCheckout" v-if="cartItemCount() > 0">
          🛍️ {{ cartItemCount() }} · HK${{ cartSubtotal() }}
        </button>
      </nav>
    </header>

    <!-- Hero -->
    <section class="shop-hero">
      <p class="eyebrow">Demain Life · Shop</p>
      <h1>Curated objects for everyday rituals</h1>
      <p class="lead">A small collection of cultural goods, hand-picked from local makers.</p>
    </section>

    <!-- Loading / Error -->
    <div v-if="loading" class="empty">Loading products…</div>
    <div v-else-if="error" class="empty error">{{ error }}</div>
    <div v-else-if="products.length === 0" class="empty">
      <p>No products yet.</p>
      <p style="font-size:0.85rem;color:#8a8780;">Staff can add products via the Inventory sheet.</p>
    </div>

    <!-- Product Grid -->
    <main v-else>
      <section v-for="(items, cat) in grouped" :key="cat" class="category-section">
        <h2>{{ cat }}</h2>
        <div class="product-grid">
          <article v-for="p in items" :key="p.sku" class="product-card">
            <div class="product-img">
              <img v-if="p.imageUrl" :src="p.imageUrl" :alt="productName(p)" />
              <div v-else class="img-placeholder">🎁</div>
            </div>
            <h3>{{ productName(p) }}</h3>
            <p v-if="p.variant" class="variant">{{ p.variant }}</p>
            <p class="price">HK${{ p.price }}</p>
            <p v-if="p.stock === 0" class="out-of-stock">Out of stock</p>
            <p v-else-if="p.stock < 5" class="low-stock">Only {{ p.stock }} left</p>
            <button
              class="add-btn"
              :disabled="p.stock === 0"
              @click="addToCart(p, 1)"
            >
              {{ p.stock === 0 ? 'Sold out' : 'Add to cart' }}
            </button>
          </article>
        </div>
      </section>
    </main>

    <!-- Floating cart toast -->
    <transition name="fade">
      <div v-if="cart.showFloating && cart.items.length > 0" class="cart-floating">
        <div class="cart-floating-header">
          <strong>🛍️ Cart ({{ cartItemCount() }})</strong>
          <button class="close-btn" @click="cart.showFloating = false">×</button>
        </div>
        <div class="cart-items-mini">
          <div v-for="item in cart.items" :key="item.sku" class="mini-item">
            <span>{{ item.name }} ×{{ item.qty }}</span>
            <span>HK${{ item.price * item.qty }}</span>
          </div>
        </div>
        <div class="cart-floating-footer">
          <strong>HK${{ cartSubtotal() }}</strong>
          <button class="checkout-btn" @click="goCheckout">Checkout →</button>
        </div>
      </div>
    </transition>

    <!-- Persistent cart button (bottom-right) when items exist -->
    <button
      v-if="cart.items.length > 0 && !cart.showFloating"
      class="cart-floating-btn"
      @click="cart.showFloating = true"
    >
      🛍️ {{ cartItemCount() }}
    </button>
  </div>
</template>

<style scoped>
.shop-page {
  min-height: 100vh;
  background: #fafaf7;
  color: #2a2826;
  font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif;
}
.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e8e6e1;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}
.brand {
  font-weight: 500;
  text-decoration: none;
  color: inherit;
  font-size: 1.05rem;
}
.shop-header nav { display: flex; gap: 0.6rem; align-items: center; }
.lang-select { padding: 0.4rem 0.6rem; border: 1px solid #ddd; border-radius: 6px; }
.cart-btn { padding: 0.5rem 1rem; background: #2a2826; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }

.shop-hero { text-align: center; padding: 3rem 2rem 1.5rem; max-width: 720px; margin: 0 auto; }
.eyebrow { font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8780; margin: 0 0 0.6rem; }
.shop-hero h1 { font-size: 2.2rem; font-weight: 300; margin: 0 0 0.6rem; }
.lead { color: #6b665e; }

.empty { text-align: center; padding: 4rem 2rem; color: #8a8780; }
.empty.error { color: #b03030; }

.category-section { max-width: 1100px; margin: 2rem auto; padding: 0 2rem; }
.category-section h2 { font-size: 1.2rem; font-weight: 500; margin: 0 0 1rem; color: #2a2826; }

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}
.product-card {
  background: #fff;
  border: 1px solid #e8e6e1;
  border-radius: 10px;
  padding: 1rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 22px rgba(0,0,0,0.06);
}
.product-img {
  width: 100%;
  aspect-ratio: 1;
  background: #f4f1ea;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { font-size: 3rem; opacity: 0.4; }
.product-card h3 { font-size: 1rem; font-weight: 500; margin: 0 0 0.3rem; }
.variant { font-size: 0.82rem; color: #8a8780; margin: 0 0 0.4rem; }
.price { font-size: 1.05rem; font-weight: 500; margin: 0 0 0.5rem; }
.out-of-stock { font-size: 0.8rem; color: #b03030; margin: 0 0 0.5rem; }
.low-stock { font-size: 0.8rem; color: #b48a3a; margin: 0 0 0.5rem; }

.add-btn {
  width: 100%;
  padding: 0.6rem 0.8rem;
  background: #2a2826;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: background 0.15s;
}
.add-btn:hover:not(:disabled) { background: #444038; }
.add-btn:disabled { background: #ccc; cursor: not-allowed; }

/* Floating cart */
.cart-floating {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  width: 320px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 14px 38px rgba(0,0,0,0.18);
  padding: 1rem 1.2rem;
  z-index: 100;
}
.cart-floating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
}
.close-btn { background: transparent; border: none; font-size: 1.3rem; cursor: pointer; color: #888; }
.cart-items-mini { max-height: 200px; overflow-y: auto; }
.mini-item { display: flex; justify-content: space-between; padding: 0.35rem 0; font-size: 0.88rem; border-bottom: 1px dashed #efefef; }
.cart-floating-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid #eee; }
.checkout-btn { background: #2a2826; color: #fff; border: none; padding: 0.55rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500; }

.cart-floating-btn {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  background: #2a2826;
  color: #fff;
  border: none;
  border-radius: 100px;
  padding: 0.9rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(0,0,0,0.18);
  z-index: 100;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 600px) {
  .shop-hero h1 { font-size: 1.6rem; }
  .product-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
  .cart-floating { width: calc(100vw - 2rem); right: 1rem; bottom: 1rem; }
}
</style>
