<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { currentLocale } from '../i18n'
import { addToCart as cartAdd, cart, cartItemCount, cartSubtotal } from '../stores/cart.js'
import ImageSlideshow from '../components/ImageSlideshow.vue'
import LangSwitch from '../components/LangSwitch.vue'

const COPY = {
  'en': {
    back: 'Back to Shop', loading: 'Loading product…', browseAll: 'Browse all products', noImage: 'No image',
    soldOut: 'Sold out', onlyLeft: 'Only {n} left', inStock: 'In stock',
    added: '✓ Added to cart', addToCart: 'Add to cart', buyNow: 'Buy now →',
    variant: 'Variant', materials: 'Materials', dimensions: 'Dimensions', care: 'Care', maker: 'Maker', sku: 'SKU',
    freePickup: 'Free pickup', hkShipping: 'HK shipping', international: 'International',
    pickupNote: '1331 文创空间 · Hong Kong', shippingNote: 'HK$50 · 3-5 business days', quoteNote: 'Quote on request',
    productNotFound: 'Product not found'
  },
  'zh-CN': {
    back: '返回商店', loading: '加载中…', browseAll: '浏览所有商品', noImage: '无图片',
    soldOut: '售罄', onlyLeft: '仅剩 {n} 件', inStock: '有货',
    added: '✓ 已加入购物车', addToCart: '加入购物车', buyNow: '立即购买 →',
    variant: '款式', materials: '材质', dimensions: '尺寸', care: '护理', maker: '制作者', sku: '货号',
    freePickup: '免费自取', hkShipping: '香港运费', international: '国际配送',
    pickupNote: '1331 文创空间 · 香港', shippingNote: 'HK$50 · 3-5 个工作日', quoteNote: '另行报价',
    productNotFound: '未找到商品'
  },
  'zh-HK': {
    back: '返回商店', loading: '加載中…', browseAll: '瀏覽所有產品', noImage: '無圖片',
    soldOut: '售罄', onlyLeft: '僅餘 {n} 件', inStock: '有貨',
    added: '✓ 已加入購物車', addToCart: '加入購物車', buyNow: '立即購買 →',
    variant: '款式', materials: '材質', dimensions: '尺寸', care: '護理', maker: '製作者', sku: '貨號',
    freePickup: '免費自取', hkShipping: '香港運費', international: '國際配送',
    pickupNote: '1331 文創空間 · 香港', shippingNote: 'HK$50 · 3-5 個工作日', quoteNote: '另行報價',
    productNotFound: '未找到產品'
  }
}
const copy = computed(() => COPY[currentLocale.value] || COPY.en)

const router = useRouter()
const route = useRoute()
const cartCount = cartItemCount
const cartTotal = cartSubtotal

const product = ref(null)
const loading = ref(true)
const error = ref('')
const justAdded = ref(false)
const qty = ref(1)
const activeImageIndex = ref(0)

async function load(sku) {
  loading.value = true
  error.value = ''
  product.value = null
  try {
    const r = await fetch(`/api/shop/products/${encodeURIComponent(sku)}`)
    const data = await r.json()
    if (!r.ok || !data.success) {
      error.value = data.error || 'Product not found'
    } else {
      product.value = data.product
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const allImages = computed(() => {
  if (!product.value) return []
  const imgs = []
  if (product.value.imageUrl) imgs.push(product.value.imageUrl)
  if (Array.isArray(product.value.gallery)) {
    for (const g of product.value.gallery) {
      if (g && !imgs.includes(g)) imgs.push(g)
    }
  }
  return imgs
})

const heroImage = computed(() => allImages.value[activeImageIndex.value] || allImages.value[0] || '')

const lang = computed(() => {
  if (typeof navigator === 'undefined') return 'en'
  const l = (navigator.language || 'en').toLowerCase()
  if (l.startsWith('zh-cn') || l === 'zh') return 'zh-CN'
  if (l.startsWith('zh')) return 'zh-HK'
  return 'en'
})

const displayName = computed(() => product.value?.nameEn || '')
const displayNameZh = computed(() => product.value?.nameZh || '')
const displayDescription = computed(() => {
  if (!product.value) return ''
  if (lang.value !== 'en' && product.value.descriptionZh) return product.value.descriptionZh
  return product.value.descriptionEn || product.value.notes || ''
})

function handleAdd() {
  if (!product.value || product.value.stock <= 0) return
  cartAdd({
    sku: product.value.sku,
    nameEn: product.value.nameEn,
    nameZh: product.value.nameZh,
    price: product.value.price,
    imageUrl: product.value.imageUrl
  }, qty.value)
  cart.showFloating = true
  justAdded.value = true
  setTimeout(() => { justAdded.value = false }, 1800)
}

function goCheckout() {
  handleAdd()
  router.push('/shop/checkout')
}

onMounted(() => {
  if (route.params.sku) load(route.params.sku)
})
watch(() => route.params.sku, (newSku) => {
  if (newSku) {
    activeImageIndex.value = 0
    qty.value = 1
    load(newSku)
  }
})
</script>

<template>
  <div class="product-page-shell">
    <div class="back-bar container">
      <button class="back-btn" @click="router.push('/#shop')">
        ← <span>{{ copy.back }}</span>
      </button>
      <LangSwitch />
      <button v-if="cartCount() > 0" class="cart-link" @click="router.push('/shop/checkout')">
        🛍️ {{ cartCount() }} · HK${{ cartTotal() }}
      </button>
    </div>

    <div v-if="loading" class="loading container">{{ copy.loading }}</div>
    <div v-else-if="error" class="error-state container">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="router.push('/#shop')">{{ copy.browseAll }}</button>
    </div>

    <article v-else-if="product" class="product-detail container">
      <!-- Image gallery -->
      <div class="gallery">
        <div class="gallery-main">
          <img
            v-if="heroImage"
            :src="heroImage"
            :alt="displayName"
            class="hero-image"
          />
          <div v-else class="hero-placeholder">{{ copy.noImage }}</div>
        </div>
        <div v-if="allImages.length > 1" class="gallery-thumbs">
          <button
            v-for="(img, i) in allImages"
            :key="i"
            class="thumb"
            :class="{ active: i === activeImageIndex }"
            @click="activeImageIndex = i"
          >
            <img :src="img" :alt="`thumb ${i+1}`" />
          </button>
        </div>
      </div>

      <!-- Product info -->
      <div class="info">
        <p class="category">{{ product.category }}</p>
        <h1 class="product-name">{{ displayName }}</h1>
        <p v-if="displayNameZh" class="zh-name">{{ displayNameZh }}</p>

        <p class="price">HK${{ product.price }}</p>

        <p v-if="displayDescription" class="description">{{ displayDescription }}</p>

        <!-- Stock badge -->
        <p class="stock" :class="{ low: product.stock > 0 && product.stock < 5, out: product.stock <= 0 }">
          <span v-if="product.stock <= 0">{{ copy.soldOut }}</span>
          <span v-else-if="product.stock < 5">{{ copy.onlyLeft.replace('{n}', product.stock) }}</span>
          <span v-else>{{ copy.inStock }}</span>
        </p>

        <!-- Quantity + Add to cart -->
        <div v-if="product.stock > 0" class="purchase-bar">
          <div class="qty-picker">
            <button class="qty-btn" @click="qty = Math.max(1, qty - 1)" :disabled="qty <= 1">−</button>
            <span class="qty-value">{{ qty }}</span>
            <button class="qty-btn" @click="qty = Math.min(product.stock, qty + 1)" :disabled="qty >= product.stock">+</button>
          </div>
          <button
            class="btn-primary add-btn"
            :class="{ added: justAdded }"
            @click="handleAdd"
          >
            {{ justAdded ? copy.added : copy.addToCart }}
          </button>
          <button class="btn-secondary checkout-btn" @click="goCheckout">
            {{ copy.buyNow }}
          </button>
        </div>

        <!-- Extended detail fields -->
        <dl class="spec-list">
          <template v-if="product.variant">
            <dt>{{ copy.variant }}</dt>
            <dd>{{ product.variant }}</dd>
          </template>
          <template v-if="product.materials">
            <dt>{{ copy.materials }}</dt>
            <dd>{{ product.materials }}</dd>
          </template>
          <template v-if="product.dimensions">
            <dt>{{ copy.dimensions }}</dt>
            <dd>{{ product.dimensions }}</dd>
          </template>
          <template v-if="product.careInstructions">
            <dt>{{ copy.care }}</dt>
            <dd>{{ product.careInstructions }}</dd>
          </template>
          <template v-if="product.supplier">
            <dt>{{ copy.maker }}</dt>
            <dd>{{ product.supplier }}</dd>
          </template>
          <dt>{{ copy.sku }}</dt>
          <dd>{{ product.sku }}</dd>
        </dl>

        <!-- Shipping / pickup blurb -->
        <div class="shipping-info">
          <p><strong>{{ copy.freePickup }}</strong> · {{ copy.pickupNote }}</p>
          <p><strong>{{ copy.hkShipping }}</strong> · {{ copy.shippingNote }}</p>
          <p><strong>{{ copy.international }}</strong> · {{ copy.quoteNote }}</p>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.product-page-shell {
  min-height: 100vh;
  background: #0d0d0d;
  color: #f5f5f5;
  padding-bottom: 6rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.back-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  padding-bottom: 1rem;
}

.back-btn {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.7);
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  transition: all 0.2s;
}
.back-btn:hover {
  background: rgba(255,255,255,0.08);
  color: var(--color-neon);
}

.cart-link {
  background: var(--color-neon);
  color: #0d0d0d;
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1.1rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 0 0 1px rgba(57,255,20,0.5), 0 4px 14px rgba(57,255,20,0.3);
}

.loading, .error-state {
  padding: 5rem 2rem;
  text-align: center;
  color: rgba(255,255,255,0.6);
}

.product-detail {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 4rem;
  padding-top: 2rem;
}

.gallery {
  position: sticky;
  top: 2rem;
  align-self: start;
}
.gallery-main {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}
.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.hero-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255,255,255,0.3);
  font-size: 0.85rem;
}
.gallery-thumbs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.thumb {
  width: 72px;
  height: 72px;
  border: 2px solid transparent;
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  background: #1a1a1a;
  transition: all 0.2s;
}
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb:hover { border-color: rgba(57,255,20,0.5); }
.thumb.active { border-color: var(--color-neon); box-shadow: 0 0 12px rgba(57,255,20,0.4); }

.info { padding-top: 1rem; }

.category {
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
  margin-bottom: 0.6rem;
}

.product-name {
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  font-weight: 300;
  letter-spacing: -0.02em;
  color: #fafafa;
  margin-bottom: 0.2rem;
  line-height: 1.15;
}

.zh-name {
  color: rgba(255,255,255,0.5);
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.price {
  font-size: 1.75rem;
  font-weight: 400;
  color: var(--color-neon);
  margin-bottom: 1.5rem;
  letter-spacing: 0.01em;
}

.description {
  color: rgba(255,255,255,0.75);
  line-height: 1.7;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  white-space: pre-wrap;
}

.stock {
  display: inline-block;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  background: rgba(57,255,20,0.12);
  color: var(--color-neon);
  border: 1px solid rgba(57,255,20,0.3);
  margin-bottom: 2rem;
}
.stock.low { background: rgba(255,180,40,0.15); color: #ffb828; border-color: rgba(255,180,40,0.4); }
.stock.out { background: rgba(255,80,80,0.15); color: #ff6060; border-color: rgba(255,80,80,0.4); }

.purchase-bar {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.qty-picker {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 999px;
  padding: 0.3rem;
  background: rgba(255,255,255,0.03);
}
.qty-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: all 0.2s;
}
.qty-btn:hover:not(:disabled) {
  background: rgba(57,255,20,0.15);
  color: var(--color-neon);
}
.qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.qty-value {
  min-width: 28px;
  text-align: center;
  font-weight: 500;
}

.btn-primary.add-btn {
  background: var(--color-neon);
  color: #0d0d0d;
  border: none;
  padding: 0.85rem 1.6rem;
  border-radius: 999px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.25s;
  box-shadow: 0 0 0 1px rgba(57,255,20,0.5), 0 4px 14px rgba(57,255,20,0.3);
}
.btn-primary.add-btn:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(57,255,20,0.8), 0 8px 22px rgba(57,255,20,0.5); }
.btn-primary.add-btn.added { background: #fff; color: #0d0d0d; }

.btn-secondary.checkout-btn {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.3);
  padding: 0.85rem 1.6rem;
  border-radius: 999px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.25s;
}
.btn-secondary.checkout-btn:hover {
  border-color: var(--color-neon);
  color: var(--color-neon);
}

.spec-list {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.6rem 1.4rem;
  padding: 1.5rem 0;
  border-top: 1px solid rgba(255,255,255,0.08);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 1.5rem;
}
.spec-list dt {
  color: rgba(255,255,255,0.45);
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.spec-list dd {
  color: rgba(255,255,255,0.85);
  font-size: 0.92rem;
  margin: 0;
}

.shipping-info {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.65);
}
.shipping-info p { margin: 0.4rem 0; }
.shipping-info strong { color: var(--color-neon); font-weight: 600; }

@media (max-width: 900px) {
  .product-detail {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .gallery { position: static; }
  .purchase-bar { flex-direction: column; align-items: stretch; }
  .purchase-bar > * { width: 100%; }
}
</style>
