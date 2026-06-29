<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { currentLocale } from '../i18n'
import { cart, cartSubtotal, cartItemCount, removeFromCart, updateQty, clearCart } from '../stores/cart.js'
import LangSwitch from '../components/LangSwitch.vue'

const router = useRouter()
const submitting = ref(false)
const error = ref('')

const COPY = {
  'en': {
    back: '← Back to Shop',
    pageTitle: 'Checkout',
    emptyCart: 'Your cart is empty.',
    browseProducts: 'Browse products',
    yourItems: 'Your items',
    each: 'each',
    remove: 'Remove',
    yourDetails: 'Your details',
    fullName: 'Full name *',
    email: 'Email *',
    phone: 'Phone',
    delivery: 'Delivery',
    pickup: '📦 Pickup at 1331',
    pickupNote: "Free · We'll notify you when ready",
    ship: '🚚 Ship to address',
    shipNote: 'HK: HK$50 · International: TBD',
    shippingAddress: 'Shipping address *',
    country: 'Country',
    countries: {
      HK: 'Hong Kong', CN: 'China (Mainland)', TW: 'Taiwan', JP: 'Japan',
      SG: 'Singapore', US: 'United States', GB: 'United Kingdom',
      other: "Other (we'll contact you)"
    },
    paymentMethod: 'Payment method',
    bankTransfer: '🏦 Bank transfer / FPS',
    bankNote: "We'll email payment details",
    qfpay: '💳 QFPay (Card / Alipay / WeChat Pay)',
    qfpayNote: 'Available soon — staff will send link',
    notes: 'Notes (optional)',
    notesPh: 'Gift wrapping, etc.',
    subtotal: 'Subtotal',
    items: 'items',
    shipping: 'Shipping',
    total: 'Total',
    placing: 'Placing order…',
    placeOrder: 'Place order →',
    disclaimer: 'No payment is collected on this page. After placing the order, our team will contact you with payment instructions.',
    errEmpty: 'Your cart is empty.',
    errName: 'Please enter your name.',
    errEmail: 'Please enter a valid email.',
    errAddress: 'Please enter shipping address.'
  },
  'zh-CN': {
    back: '← 返回商店',
    pageTitle: '结账',
    emptyCart: '购物车是空的。',
    browseProducts: '浏览商品',
    yourItems: '您的商品',
    each: '件',
    remove: '移除',
    yourDetails: '您的资料',
    fullName: '姓名 *',
    email: '邮箱 *',
    phone: '电话',
    delivery: '配送',
    pickup: '📦 在 1331 自取',
    pickupNote: '免费 · 准备就绪后通知您',
    ship: '🚚 寄送到地址',
    shipNote: '香港：HK$50 · 国际：另行报价',
    shippingAddress: '寄送地址 *',
    country: '国家地区',
    countries: {
      HK: '香港', CN: '中国内地', TW: '台湾', JP: '日本',
      SG: '新加坡', US: '美国', GB: '英国',
      other: '其他（我们会联系您）'
    },
    paymentMethod: '付款方式',
    bankTransfer: '🏦 银行转账 / FPS',
    bankNote: '我们会发送付款详情到您的邮箱',
    qfpay: '💳 QFPay（信用卡 / 支付宝 / 微信支付）',
    qfpayNote: '即将推出 — 工作人员会发送链接',
    notes: '备注（可选）',
    notesPh: '礼物包装等',
    subtotal: '小计',
    items: '件',
    shipping: '运费',
    total: '总计',
    placing: '提交中…',
    placeOrder: '提交订单 →',
    disclaimer: '本页不会收取任何费用。提交订单后，我们的团队会联系您提供付款详情。',
    errEmpty: '购物车是空的。',
    errName: '请输入姓名。',
    errEmail: '请输入有效的邮箱。',
    errAddress: '请输入寄送地址。'
  },
  'zh-HK': {
    back: '← 返回商店',
    pageTitle: '結賬',
    emptyCart: '購物車是空的。',
    browseProducts: '瀏覽產品',
    yourItems: '您的產品',
    each: '件',
    remove: '移除',
    yourDetails: '您的資料',
    fullName: '姓名 *',
    email: '電郵 *',
    phone: '電話',
    delivery: '送貨',
    pickup: '📦 於 1331 自取',
    pickupNote: '免費 · 準備就緒後通知您',
    ship: '🚚 寄送到地址',
    shipNote: '香港：HK$50 · 國際：另行報價',
    shippingAddress: '寄送地址 *',
    country: '國家地區',
    countries: {
      HK: '香港', CN: '中國內地', TW: '台灣', JP: '日本',
      SG: '新加坡', US: '美國', GB: '英國',
      other: '其他（我們會聯絡您）'
    },
    paymentMethod: '付款方式',
    bankTransfer: '🏦 銀行轉賬 / FPS',
    bankNote: '我們會發送付款詳情到您的電郵',
    qfpay: '💳 QFPay（信用卡 / 支付寶 / 微信支付）',
    qfpayNote: '即將推出 — 職員會發送連結',
    notes: '備註（可選）',
    notesPh: '禮物包裝等',
    subtotal: '小計',
    items: '件',
    shipping: '運費',
    total: '總計',
    placing: '提交中…',
    placeOrder: '提交訂單 →',
    disclaimer: '本頁不會收取任何費用。提交訂單後，我們的團隊會聯絡您提供付款詳情。',
    errEmpty: '購物車是空的。',
    errName: '請輸入姓名。',
    errEmail: '請輸入有效的電郵。',
    errAddress: '請輸入寄送地址。'
  }
}
const copy = computed(() => COPY[currentLocale.value] || COPY.en)

const form = reactive({
  name: '',
  email: '',
  phone: '',
  deliveryMethod: 'pickup', // pickup | ship
  address: '',
  country: 'HK',
  paymentMethod: 'bank-transfer', // bank-transfer | qfpay
  notes: ''
})

const shippingFee = computed(() => {
  if (form.deliveryMethod === 'pickup') return 0
  if (form.country === 'HK' || form.country === 'Hong Kong') return 50
  return 0 // international: staff will quote
})

const total = computed(() => cartSubtotal() + shippingFee.value)

async function placeOrder() {
  error.value = ''
  if (cart.items.length === 0) { error.value = copy.value.errEmpty; return }
  if (!form.name.trim()) { error.value = copy.value.errName; return }
  if (!form.email.trim() || !form.email.includes('@')) { error.value = copy.value.errEmail; return }
  if (form.deliveryMethod === 'ship' && !form.address.trim()) { error.value = copy.value.errAddress; return }

  submitting.value = true
  try {
    const res = await fetch('/api/shop/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customer: { name: form.name, email: form.email, phone: form.phone },
        items: cart.items.map(i => ({ sku: i.sku, qty: i.qty })),
        delivery: {
          method: form.deliveryMethod,
          address: form.deliveryMethod === 'ship' ? form.address : '',
          country: form.deliveryMethod === 'ship' ? form.country : ''
        },
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        lang: 'en'
      })
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Order failed')
    const orderId = data.orderId
    clearCart()
    router.push(`/shop/order/${orderId}`)
  } catch (e) { error.value = e.message }
  finally { submitting.value = false }
}
</script>

<template>
  <div class="checkout-page dl-form-dark">
    <header class="shop-header">
      <router-link to="/shop" class="brand">{{ copy.back }}</router-link>
      <h1>{{ copy.pageTitle }}</h1>
      <LangSwitch />
    </header>

    <div v-if="cart.items.length === 0" class="empty">
      <p>{{ copy.emptyCart }}</p>
      <button @click="router.push('/#shop')" class="btn-primary">{{ copy.browseProducts }}</button>
    </div>

    <div v-else class="checkout-layout">
      <!-- Left: Cart Items -->
      <section class="cart-section">
        <h2>{{ copy.yourItems }}</h2>
        <div v-for="item in cart.items" :key="item.sku" class="cart-row">
          <div class="cart-row-img">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
            <div v-else class="img-placeholder">🎁</div>
          </div>
          <div class="cart-row-info">
            <div class="cart-name">{{ item.name }}<span v-if="item.nameZh"> · {{ item.nameZh }}</span></div>
            <div class="cart-price">HK${{ item.price }} {{ copy.each }}</div>
            <div class="qty-row">
              <button @click="updateQty(item.sku, item.qty - 1)" class="qty-btn">−</button>
              <span class="qty-display">{{ item.qty }}</span>
              <button @click="updateQty(item.sku, item.qty + 1)" class="qty-btn">+</button>
              <button @click="removeFromCart(item.sku)" class="remove-btn">{{ copy.remove }}</button>
            </div>
          </div>
          <div class="cart-row-total">HK${{ item.price * item.qty }}</div>
        </div>
      </section>

      <!-- Right: Order Form + Summary -->
      <aside class="checkout-form">
        <h2>{{ copy.yourDetails }}</h2>
        <label>{{ copy.fullName }}<input v-model="form.name" /></label>
        <label>{{ copy.email }}<input v-model="form.email" type="email" /></label>
        <label>{{ copy.phone }}<input v-model="form.phone" /></label>

        <h3>{{ copy.delivery }}</h3>
        <div class="delivery-options">
          <label class="delivery-card" :class="{ selected: form.deliveryMethod === 'pickup' }">
            <input type="radio" v-model="form.deliveryMethod" value="pickup" />
            <div>
              <strong>{{ copy.pickup }}</strong>
              <p>{{ copy.pickupNote }}</p>
            </div>
          </label>
          <label class="delivery-card" :class="{ selected: form.deliveryMethod === 'ship' }">
            <input type="radio" v-model="form.deliveryMethod" value="ship" />
            <div>
              <strong>{{ copy.ship }}</strong>
              <p>{{ copy.shipNote }}</p>
            </div>
          </label>
        </div>

        <template v-if="form.deliveryMethod === 'ship'">
          <label>{{ copy.shippingAddress }}<textarea v-model="form.address" rows="2"></textarea></label>
          <label>{{ copy.country }}
            <select v-model="form.country">
              <option value="HK">{{ copy.countries.HK }}</option>
              <option value="CN">{{ copy.countries.CN }}</option>
              <option value="TW">{{ copy.countries.TW }}</option>
              <option value="JP">{{ copy.countries.JP }}</option>
              <option value="SG">{{ copy.countries.SG }}</option>
              <option value="US">{{ copy.countries.US }}</option>
              <option value="GB">{{ copy.countries.GB }}</option>
              <option value="other">{{ copy.countries.other }}</option>
            </select>
          </label>
        </template>

        <h3>{{ copy.paymentMethod }}</h3>
        <div class="delivery-options">
          <label class="delivery-card" :class="{ selected: form.paymentMethod === 'bank-transfer' }">
            <input type="radio" v-model="form.paymentMethod" value="bank-transfer" />
            <div>
              <strong>{{ copy.bankTransfer }}</strong>
              <p>{{ copy.bankNote }}</p>
            </div>
          </label>
          <label class="delivery-card" :class="{ selected: form.paymentMethod === 'qfpay' }">
            <input type="radio" v-model="form.paymentMethod" value="qfpay" />
            <div>
              <strong>{{ copy.qfpay }}</strong>
              <p>{{ copy.qfpayNote }}</p>
            </div>
          </label>
        </div>

        <label>{{ copy.notes }}<textarea v-model="form.notes" rows="2" :placeholder="copy.notesPh"></textarea></label>

        <div class="summary">
          <div class="line"><span>{{ copy.subtotal }} ({{ cartItemCount() }} {{ copy.items }})</span><span>HK${{ cartSubtotal() }}</span></div>
          <div class="line"><span>{{ copy.shipping }}</span><span>HK${{ shippingFee }}</span></div>
          <div class="line total"><strong>{{ copy.total }}</strong><strong>HK${{ total }}</strong></div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <button class="submit-btn" :disabled="submitting" @click="placeOrder">
          {{ submitting ? copy.placing : copy.placeOrder }}
        </button>
        <p class="disclaimer">{{ copy.disclaimer }}</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.checkout-page { min-height: 100vh; background: #0d0d0d; color: #ffffff; font-family: 'Inter', -apple-system, sans-serif; }
.shop-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(20,20,20,0.85); backdrop-filter: blur(10px); }
.shop-header .brand { color: var(--color-neon, #39ff14); text-decoration: none; font-weight: 500; }
.shop-header h1 { color: #ffffff; }
.brand { color: #6b665e; text-decoration: none; font-size: 0.92rem; }
.shop-header h1 { margin: 0; font-size: 1.2rem; font-weight: 500; }

.empty { text-align: center; padding: 4rem 2rem; }
.btn-primary { background: #2a2826; color: #fff; border: none; padding: 0.7rem 1.4rem; border-radius: 6px; cursor: pointer; }

.checkout-layout { max-width: 1100px; margin: 2rem auto; padding: 0 2rem; display: grid; grid-template-columns: 1fr 420px; gap: 2rem; align-items: start; }

.cart-section, .checkout-form { background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%); padding: 1.5rem; border: 1px solid rgba(255,255,255,0.10); border-radius: 12px; }
.cart-section h2, .checkout-form h2 { margin: 0 0 1.2rem; font-size: 1.1rem; font-weight: 600; color: #ffffff; letter-spacing: 0.02em; }
.checkout-form h3 { margin: 1.3rem 0 0.6rem; font-size: 0.78rem; font-weight: 700; color: var(--color-neon, #39ff14); letter-spacing: 0.16em; text-transform: uppercase; }

.cart-row { display: grid; grid-template-columns: 70px 1fr auto; gap: 1rem; padding: 1rem 0; border-bottom: 1px dashed rgba(255,255,255,0.10); }
.cart-row:last-child { border-bottom: none; }
.cart-row-img { width: 70px; height: 70px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.cart-row-img img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { font-size: 2rem; opacity: 0.4; }
.cart-name { font-weight: 500; color: #ffffff; }
.cart-price { font-size: 0.85rem; color: #8a8780; margin: 0.2rem 0 0.6rem; }
.qty-row { display: flex; align-items: center; gap: 0.4rem; }
.qty-btn { background: #f4f1ea; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 1rem; }
.qty-display { min-width: 24px; text-align: center; font-weight: 500; }
.remove-btn { background: none; border: none; color: #b03030; cursor: pointer; font-size: 0.82rem; margin-left: 0.8rem; }
.cart-row-total { font-weight: 600; align-self: center; color: var(--color-neon, #39ff14); }

.checkout-form label { display: block; margin: 0.7rem 0; }
.checkout-form label span { display: block; font-size: 0.82rem; color: rgba(255,255,255,0.6); margin-bottom: 0.25rem; }
/* form inputs styled by global .dl-form-dark on parent */

.delivery-options { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 0.5rem; }
.delivery-card { display: flex; gap: 0.7rem; padding: 0.9rem 1.1rem; border: 1.5px solid rgba(255,255,255,0.15); border-radius: 10px; cursor: pointer; transition: all 0.18s; background: rgba(255,255,255,0.025); color: rgba(255,255,255,0.85); }
.delivery-card:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.045); }
.delivery-card.selected { border-color: var(--color-neon, #39ff14); background: rgba(57,255,20,0.08); box-shadow: 0 0 0 1px rgba(57,255,20,0.30), 0 4px 14px rgba(57,255,20,0.10); }
.delivery-card input { width: auto; margin-top: 0.2rem; accent-color: var(--color-neon, #39ff14); }
.delivery-card strong { display: block; color: #ffffff; font-weight: 600; }
.delivery-card p { margin: 0.2rem 0 0; font-size: 0.82rem; color: rgba(255,255,255,0.6); }

.summary { margin: 1.5rem 0 0.8rem; padding-top: 1rem; border-top: 1px dashed rgba(255,255,255,0.15); }
.summary .line { display: flex; justify-content: space-between; padding: 0.3rem 0; font-size: 0.92rem; color: rgba(255,255,255,0.85); }
.summary .line.total { font-size: 1.2rem; margin-top: 0.5rem; padding-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.12); color: var(--color-neon, #39ff14); text-shadow: 0 0 12px rgba(57,255,20,0.35); }

.error { background: rgba(255, 95, 162, 0.12); color: #ff5fa2; border: 1px solid rgba(255,95,162,0.30); padding: 0.7rem 1rem; border-radius: 8px; margin: 0.5rem 0; font-size: 0.88rem; }
.submit-btn { width: 100%; padding: 1rem; background: var(--color-neon, #39ff14); color: #0d0d0d; border: none; border-radius: 100px; cursor: pointer; font-weight: 700; font-size: 1rem; margin-top: 1rem; letter-spacing: 0.03em; box-shadow: 0 0 0 1px rgba(57,255,20,0.5), 0 8px 22px rgba(57,255,20,0.30); transition: transform 0.2s, box-shadow 0.2s; }
.submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(57,255,20,0.8), 0 12px 28px rgba(57,255,20,0.50); }
.submit-btn:disabled { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.4); box-shadow: none; cursor: not-allowed; }
.disclaimer { font-size: 0.78rem; color: rgba(255,255,255,0.45); margin: 0.8rem 0 0; text-align: center; line-height: 1.5; }

@media (max-width: 800px) {
  .checkout-layout { grid-template-columns: 1fr; padding: 0 1rem; gap: 1.2rem; }
  .shop-header { padding: 1rem; }
  .shop-header h1 { font-size: 1.4rem; }
  .cart-section, .checkout-form { padding: 1.2rem; border-radius: 8px; }
  .cart-row { grid-template-columns: 60px 1fr; gap: 0.8rem; }
  .cart-row-total { grid-column: 1 / -1; text-align: right; margin-top: 0.4rem; }
  .delivery-card { padding: 0.7rem 0.8rem; }
  .submit-btn { font-size: 0.95rem; padding: 1rem; }
}
@media (max-width: 480px) {
  .checkout-layout { padding: 0 0.8rem; }
  .cart-row { grid-template-columns: 50px 1fr; }
  .cart-row-img { width: 50px; height: 50px; }
  .cart-name { font-size: 0.92rem; }
  .qty-row { flex-wrap: wrap; }
}
</style>
