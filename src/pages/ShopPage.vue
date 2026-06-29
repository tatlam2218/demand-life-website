<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteContent } from '../composables/useSiteContent'
import ImageSlideshow from '../components/ImageSlideshow.vue'
import LangSwitch from '../components/LangSwitch.vue'
import { useI18n } from '../i18n'
import { addToCart, cart, cartSubtotal, cartItemCount } from '../stores/cart.js'

const { t } = useI18n()

const DC_PALETTE = {
  green:  '#39ff14',
  yellow: '#f4c518',
  orange: '#ff7a18',
  red:    '#ff4d4d',
  blue:   '#4dc6ff',
  purple: '#b78bff',
  pink:   '#ff5fa2'
}

const router = useRouter()
const { shop } = useSiteContent()

const products = ref([])
const loading = ref(true)
const loadError = ref('')
const activeCategory = ref('all')
const lastAdded = ref(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/shop/products')
    const data = await res.json()
    if (data.success) products.value = data.products
    else loadError.value = data.error || 'Failed to load products'
  } catch (e) { loadError.value = e.message }
  finally { loading.value = false }
})

const heroImages = computed(() => shop.value.heroImages || [])

const categories = computed(() => {
  const unique = Array.from(new Set(products.value.map((p) => p.category).filter(Boolean)))
  return [shop.value.all || 'All', ...unique]
})

const filteredProducts = computed(() => {
  const allLabel = shop.value.all || 'All'
  if (activeCategory.value === 'all' || activeCategory.value === allLabel) return products.value
  return products.value.filter((product) => product.category === activeCategory.value)
})

const placeholderImages = [
  'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80',
  'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80',
  'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80',
  'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800&q=80'
]

function handleAdd(product) {
  if (product.stock <= 0) return
  addToCart(product, 1)
  lastAdded.value = product.sku
  setTimeout(() => { if (lastAdded.value === product.sku) lastAdded.value = null }, 1500)
}

function goCheckout() { router.push('/shop/checkout') }
function goShopHome() { router.push('/shop') }
</script>

<template>
  <section class="shop-page">
    <div v-if="heroImages.length" class="hero-strip">
      <ImageSlideshow
        :images="heroImages"
        :alt="shop.eyebrow || 'Demain Life objects'"
        ratio="16 / 7"
        rounded
      />
    </div>

    <!-- Punk-zine hero band: punk collage background tinted dark for legibility -->
    <div class="shop-hero-band">
      <div class="shop-hero-bg" aria-hidden="true"></div>
      <div class="shop-hero-overlay" aria-hidden="true"></div>
      <div class="shop-header container">
        <p class="eyebrow">{{ shop.eyebrow }}</p>
        <h1 class="shop-title-dc">
          <span class="line line-thin">{{ shop.title1 }}</span>
          <span class="line line-neon">{{ shop.title2 }}</span>
        </h1>
        <p class="shop-intro">{{ shop.intro }}</p>
      </div>
    </div>

    <!-- Shop feature grid — 1980s punk zine risograph cards with story-driven labels -->
    <div class="shop-features-wrap container">
      <div class="shop-features-grid">
        <div class="shop-feature-card" :style="{ backgroundImage: 'url(/shop-cards/makers.webp?v=20260628a)' }">
          <div class="sf-label-wrap">
            <p class="sf-title">{{ t('shopCards.makers.title') }}</p>
            <p class="sf-sub">{{ t('shopCards.makers.sub') }}</p>
          </div>
        </div>
        <div class="shop-feature-card" :style="{ backgroundImage: 'url(/shop-cards/craft.webp?v=20260628a)' }">
          <div class="sf-label-wrap">
            <p class="sf-title">{{ t('shopCards.craft.title') }}</p>
            <p class="sf-sub">{{ t('shopCards.craft.sub') }}</p>
          </div>
        </div>
        <div class="shop-feature-card" :style="{ backgroundImage: 'url(/shop-cards/lasting.webp?v=20260628a)' }">
          <div class="sf-label-wrap">
            <p class="sf-title">{{ t('shopCards.lasting.title') }}</p>
            <p class="sf-sub">{{ t('shopCards.lasting.sub') }}</p>
          </div>
        </div>
        <div class="shop-feature-card" :style="{ backgroundImage: 'url(/shop-cards/sourcing.webp?v=20260628a)' }">
          <div class="sf-label-wrap">
            <p class="sf-title">{{ t('shopCards.sourcing.title') }}</p>
            <p class="sf-sub">{{ t('shopCards.sourcing.sub') }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="empty container">Loading products…</div>
    <div v-else-if="loadError" class="empty container error">{{ loadError }}</div>
    <div v-else-if="products.length === 0" class="empty container">
      <p>No products listed yet.</p>
      <p class="hint">Staff: add products in the <a href="https://docs.google.com/spreadsheets/d/1Irmd3M1lDjywt8FfxV58aFKHYkZvjzOZW8v7UPmFQf8/edit" target="_blank">Inventory Sheet</a>.</p>
    </div>

    <template v-else>
      <div class="filter-bar container">
        <button
          v-for="cat in categories"
          :key="cat"
          class="filter-btn"
          :class="{ active: (cat === (shop.all || 'All') && activeCategory === 'all') || activeCategory === cat }"
          @click="activeCategory = cat === (shop.all || 'All') ? 'all' : cat"
        >
          {{ cat }}
        </button>
      </div>

      <div class="product-grid container">
        <article v-for="(product, index) in filteredProducts" :key="product.sku" class="product-card">
          <div class="product-image-wrap" @click="router.push(`/shop/product/${product.sku}`)">
            <ImageSlideshow
              :images="product.imageUrl ? [product.imageUrl] : []"
              :fallback="placeholderImages[index % placeholderImages.length]"
              :alt="product.nameEn"
              ratio="1 / 1"
              rounded
            />
            <button
              class="quick-add"
              :class="{ added: lastAdded === product.sku, disabled: product.stock <= 0 }"
              :disabled="product.stock <= 0"
              @click.stop="handleAdd(product)"
              :aria-label="shop.addToCart || 'Add to cart'"
            >
              <span v-if="lastAdded === product.sku">✓</span>
              <span v-else-if="product.stock <= 0">×</span>
              <span v-else>+</span>
            </button>
            <div v-if="product.stock <= 0" class="overlay-sold-out">Sold out</div>
            <div v-else-if="product.stock < 5" class="overlay-low">Only {{ product.stock }} left</div>
          </div>
          <div class="product-info" @click="router.push(`/shop/product/${product.sku}`)" style="cursor:pointer;">
            <div>
              <p class="product-category">{{ product.category }}</p>
              <h3 class="product-name">{{ product.nameEn }}<span v-if="product.nameZh" class="zh-name"> · {{ product.nameZh }}</span></h3>
              <p class="product-description">{{ product.notes }}</p>
            </div>
            <p class="product-price">HK$ {{ product.price }}</p>
          </div>
        </article>
      </div>

      <div class="shop-note container">
        <p>{{ shop.note }}</p>
        <button class="view-all-btn" @click="goShopHome">View full catalogue →</button>
      </div>
    </template>

    <!-- Floating Cart Toast (right side) -->
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

    <!-- Persistent cart pill (bottom-right) -->
    <button
      v-if="cart.items.length > 0 && !cart.showFloating"
      class="cart-floating-btn"
      @click="cart.showFloating = true"
      :aria-label="'Open cart'"
    >
      🛍️ {{ cartItemCount() }} · HK${{ cartSubtotal() }}
    </button>
  </section>
</template>

<style scoped>
/* Dark Shop theme — echoes demainculture.com main site palette */
.shop-lang-float {
  position: absolute; top: 1.2rem; right: 1.5rem; z-index: 50;
}
.shop-page {
  position: relative;
  padding-top: 4rem;
  padding-bottom: 4rem;
  background: #0d0d0d;
  color: #ffffff;
  min-height: 100vh;
}
.shop-page :deep(.eyebrow),
.shop-page :deep(h1),
.shop-page :deep(h2),
.shop-page :deep(h3) {
  color: #ffffff;
}
.hero-strip { padding: 0 1rem; margin-bottom: 2rem; max-width: 1280px; margin-left: auto; margin-right: auto; }
.shop-header { text-align: center; padding: 2rem 0 3rem; max-width: 820px; margin: 0 auto; }
.shop-header .eyebrow { display: block; margin-bottom: 1.5rem; }
.shop-header h1 { margin-bottom: 1.5rem; }
.shop-intro { font-size: 1.05rem; line-height: 1.7; color: rgba(255,255,255,0.7); }

/* Dramatic two-line Shop title — demainculture style */
.shop-title-dc {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.05em;
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: clamp(2.2rem, 5.5vw, 4.4rem);
  line-height: 1.0;
  letter-spacing: -0.025em;
  margin: 0 auto 1.5rem;
}
.shop-title-dc .line { display: block; }
.shop-title-dc .line-thin { font-weight: 300; color: #ffffff; }
.shop-title-dc .line-neon {
  font-weight: 800; color: var(--color-neon, #39ff14);
  text-shadow: 0 0 20px rgba(57,255,20,0.55), 0 0 44px rgba(57,255,20,0.22);
  letter-spacing: -0.02em;
}

/* Shop feature grid — dark cards + neon glow icons */
.shop-features-wrap {
  max-width: 1100px;
  margin: 0 auto 4rem;
  padding: 0 1rem;
  position: relative;
}
.shop-features-wrap::before {
  content: '';
  position: absolute;
  inset: -1rem;
  background-image:
    repeating-linear-gradient(135deg,
      rgba(255,255,255,0.025) 0px,
      rgba(255,255,255,0.025) 1px,
      transparent 1px,
      transparent 26px);
  pointer-events: none;
  z-index: 0;
  border-radius: 24px;
}
.shop-features-grid {
  position: relative; z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.shop-feature-card {
  position: relative;
  aspect-ratio: 1 / 1;
  background-color: #0d0d0d;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
/* Dark gradient at the bottom so the label stays legible over any image */
.shop-feature-card::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 58%;
  background: linear-gradient(180deg,
                rgba(13,13,13,0) 0%,
                rgba(13,13,13,0.55) 45%,
                rgba(13,13,13,0.92) 100%);
  pointer-events: none;
  z-index: 1;
}
.shop-feature-card:hover {
  transform: translateY(-3px);
  border-color: rgba(57,255,20,0.45);
  box-shadow: 0 0 0 1px rgba(57,255,20,0.20), 0 14px 32px rgba(0,0,0,0.5);
}
.sf-label-wrap {
  position: relative;
  z-index: 2;
  padding: 1rem 1.1rem 1rem;
}
.sf-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-neon, #39ff14);
  text-shadow: 0 0 12px rgba(57,255,20,0.45);
  line-height: 1.2;
}
.sf-sub {
  margin: 0.3rem 0 0;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 500;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.72);
}
@media (max-width: 900px) {
  .shop-features-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .shop-features-grid { grid-template-columns: repeat(2, 1fr); gap: 0.7rem; }
  .sf-label-wrap { padding: 0.7rem 0.85rem; }
  .sf-title { font-size: 0.85rem; }
  .sf-sub { font-size: 0.65rem; }
}

/* ============================================================
   Punk-zine hero band — wraps shop title/intro with risograph backdrop
   ============================================================ */
.shop-hero-band {
  position: relative;
  overflow: hidden;
  padding: 4rem 0 3rem;
  margin-bottom: 0.5rem;
}
.shop-hero-bg {
  position: absolute;
  inset: 0;
  background: url('/shop-cards/hero.webp?v=20260628b') center/cover no-repeat;
  opacity: 0.65;
  z-index: 0;
  /* Subtle slow drift so the punk collage feels alive */
  animation: heroDrift 24s ease-in-out infinite alternate;
}
@keyframes heroDrift {
  0%   { transform: scale(1.02) translateX(-1%); }
  100% { transform: scale(1.05) translateX(2%); }
}
.shop-hero-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center,
                    rgba(13,13,13,0.30) 0%,
                    rgba(13,13,13,0.62) 55%,
                    rgba(13,13,13,0.90) 100%);
  z-index: 1;
}
.shop-hero-band > .shop-header {
  position: relative;
  z-index: 2;
}
@media (max-width: 640px) {
  .shop-hero-band { padding: 3rem 0 2rem; }
}

.empty { text-align: center; padding: 4rem 1rem; color: var(--color-warm-gray-500); }
.empty.error { color: #b03030; }
.empty .hint { font-size: 0.85rem; margin-top: 1rem; }
.empty a { color: var(--color-ink); }

.filter-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; margin-bottom: 4rem; padding-bottom: 2rem; border-bottom: 1px solid var(--color-warm-gray-100); }
.filter-btn { font-size: 0.8rem; padding: 0.5rem 1.2rem; border-radius: 999px; color: rgba(255,255,255,0.55); transition: all 0.2s; background: transparent; border: 1px solid rgba(255,255,255,0.15); cursor: pointer; font-family: inherit; }
.filter-btn:hover { color: #ffffff; border-color: rgba(255,255,255,0.4); }
.filter-btn.active { background: var(--color-neon); color: #0d0d0d; border-color: var(--color-neon); box-shadow: 0 0 18px rgba(57,255,20,0.45); }

.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem 2.5rem; margin-bottom: 5rem; }
.product-card { display: flex; flex-direction: column; gap: 1.25rem; }

.product-image-wrap {
  background: #1a1a1a;
  overflow: hidden;
  position: relative;
  border-radius: 8px;
  cursor: pointer;
  transition: box-shadow 0.3s, transform 0.3s;
  border: 1px solid rgba(255,255,255,0.08);
}
.product-image-wrap:hover {
  border-color: var(--color-neon);
  box-shadow: 0 0 0 1px var(--color-neon), 0 0 28px rgba(57,255,20,0.25);
  transform: translateY(-2px);
}

.quick-add {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-white);
  color: var(--color-ink);
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(42, 40, 38, 0.08);
  border: none;
  cursor: pointer;
  z-index: 2;
}
.product-image-wrap:hover .quick-add { opacity: 1; transform: translateY(0); }
.quick-add.added {
  background: #3a8a5e;
  color: #fff;
  opacity: 1;
  transform: scale(1.15) translateY(0);
}
.quick-add.disabled { background: #ccc; color: #fff; cursor: not-allowed; }

.overlay-sold-out, .overlay-low {
  position: absolute;
  top: 0.7rem;
  left: 0.7rem;
  background: rgba(42, 40, 38, 0.85);
  color: #fff;
  font-size: 0.72rem;
  padding: 4px 10px;
  border-radius: 100px;
  letter-spacing: 0.04em;
}
.overlay-low { background: rgba(180, 138, 58, 0.92); }

.product-info { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.product-category {
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-neon);
  margin-bottom: 0.4rem;
  text-shadow: 0 0 12px rgba(57,255,20,0.4);
}
.product-name {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.4rem;
}
.zh-name { font-weight: 400; color: var(--color-warm-gray-500); font-size: 0.9rem; }
.product-description {
  font-size: 0.85rem;
  color: var(--color-warm-gray-700);
  line-height: 1.5;
  margin: 0;
}
.product-price {
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
  margin: 0;
}

.shop-note {
  text-align: center;
  margin-top: 2rem;
  color: var(--color-warm-gray-500);
  font-size: 0.88rem;
}
.view-all-btn {
  display: inline-block;
  margin-top: 1.5rem;
  background: transparent;
  border: 1px solid var(--color-ink);
  color: var(--color-ink);
  padding: 0.7rem 1.6rem;
  border-radius: 100px;
  font-family: inherit;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.view-all-btn:hover { background: var(--color-ink); color: #fff; }

/* Floating Cart */
.cart-floating {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  width: 320px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 14px 38px rgba(0,0,0,0.18);
  padding: 1rem 1.2rem;
  z-index: 200;
}
.cart-floating-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.7rem; }
.close-btn { background: transparent; border: none; font-size: 1.3rem; cursor: pointer; color: #888; }
.cart-items-mini { max-height: 200px; overflow-y: auto; }
.mini-item { display: flex; justify-content: space-between; padding: 0.35rem 0; font-size: 0.88rem; border-bottom: 1px dashed #efefef; }
.cart-floating-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid #eee; }
.checkout-btn { background: #2a2826; color: #fff; border: none; padding: 0.55rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-family: inherit; }

.cart-floating-btn {
  position: fixed;
  right: 2rem;
  bottom: 5.5rem;
  background: var(--color-neon);
  color: #0d0d0d;
  border: none;
  border-radius: 100px;
  padding: 0.9rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(57,255,20,0.5), 0 8px 22px rgba(57,255,20,0.35);
  z-index: 200;
  font-family: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.cart-floating-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 0 1px rgba(57,255,20,0.7), 0 12px 28px rgba(57,255,20,0.5);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 900px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); gap: 2rem 1.5rem; }
}
@media (max-width: 600px) {
  .product-grid { grid-template-columns: 1fr; }
  .cart-floating { width: calc(100vw - 2rem); right: 1rem; bottom: 5rem; }
  .cart-floating-btn { right: 1rem; bottom: 4.5rem; }
}

/* =====================================
   SHOP DARK THEME — black bg, white text
   Applied when ShopPage is rendered inside .shell-shop
   ===================================== */
:global(.shell-shop) .shop-page {
  background: #0d0d0d;
  color: #f5f5f5;
}
:global(.shell-shop) .shop-intro,
:global(.shell-shop) .eyebrow { color: rgba(255,255,255,0.6); }

:global(.shell-shop) .shop-page h1 { color: #fafafa; }

:global(.shell-shop) .filter-btn {
  background: transparent;
  color: rgba(255,255,255,0.55);
  border-color: rgba(255,255,255,0.18);
}
:global(.shell-shop) .filter-btn:hover {
  border-color: var(--color-neon);
  color: var(--color-neon);
}
:global(.shell-shop) .filter-btn.active {
  background: var(--color-neon);
  color: #0d0d0d;
  border-color: var(--color-neon);
  box-shadow: 0 0 16px rgba(57,255,20,0.35);
  font-weight: 600;
}

:global(.shell-shop) .product-card {
  background: transparent;
}
:global(.shell-shop) .product-image-wrap {
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.06);
}
:global(.shell-shop) .quick-add {
  background: var(--color-neon);
  color: #0d0d0d;
  box-shadow: 0 0 16px rgba(57,255,20,0.4);
  font-weight: 700;
}
:global(.shell-shop) .quick-add.added {
  background: #fff;
  color: #0d0d0d;
}

:global(.shell-shop) .product-info .price { color: #fff; font-weight: 500; }
:global(.shell-shop) .product-info .category { color: rgba(255,255,255,0.45); }
:global(.shell-shop) .product-info .zh-name { color: rgba(255,255,255,0.5); }
:global(.shell-shop) .product-info .description { color: rgba(255,255,255,0.65); }
:global(.shell-shop) .product-info h3 { color: #fafafa; }

:global(.shell-shop) .overlay-low { background: rgba(255,200,40,0.92); color: #1a1a1a; }
:global(.shell-shop) .empty { color: rgba(255,255,255,0.45); }
:global(.shell-shop) .empty a { color: var(--color-neon); }

:global(.shell-shop) .view-all-btn {
  border-color: rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.85);
}
:global(.shell-shop) .view-all-btn:hover {
  background: var(--color-neon);
  color: #0d0d0d;
  border-color: var(--color-neon);
}

:global(.shell-shop) .cart-floating {
  background: #1a1a1a;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.08);
}
:global(.shell-shop) .checkout-btn {
  background: var(--color-neon);
  color: #0d0d0d;
  font-weight: 600;
}
:global(.shell-shop) .close-btn { color: rgba(255,255,255,0.5); }
</style>
