<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { currentLocale } from '../i18n'
import { cart, cartSubtotal, cartItemCount, removeFromCart, updateQty, clearCart } from '../stores/cart.js'
import LangSwitch from '../components/LangSwitch.vue'

const router = useRouter()
const submitting = ref(false)
const error = ref('')
const agreedToTerms = ref(false)

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
    pickup: '📦 Pickup at Demain Life @ 1331',
    pickupNote: "Free · We'll notify you when ready",
    ship: '🚚 Ship to address',
    shipNote: 'HK: HK$50 · International: quoted separately',
    shippingAddress: 'Shipping address *',
    country: 'Country',
    countries: {
      HK: 'Hong Kong', CN: 'China (Mainland)', TW: 'Taiwan', JP: 'Japan',
      SG: 'Singapore', US: 'United States', GB: 'United Kingdom',
      other: "Other (we'll contact you)"
    },
    paymentMethod: 'Payment method',
    qfpay: '💳 QFPay — Card / Alipay / WeChat Pay',
    qfpayNote: 'Pay securely via QFPay. You will be redirected to complete payment.',
    bankTransfer: '🏦 Bank transfer / FPS',
    bankNote: "We'll email you payment instructions",
    notes: 'Notes (optional)',
    notesPh: 'Gift wrapping, special requests…',
    subtotal: 'Subtotal',
    items: 'items',
    shipping: 'Shipping',
    shippingTbd: 'TBD',
    total: 'Total',
    placing: 'Processing…',
    placeOrder: 'Confirm order →',
    proceedQfpay: 'Pay with QFPay →',
    termsLabel: 'I have read and agree to the',
    termsLink: 'Terms & Conditions',
    and: ', ',
    refundLink: 'Refund Policy',
    shippingLink: 'Shipping Policy',
    privacyLink: 'Privacy Policy',
    termsError: 'Please agree to the Terms & Conditions to continue.',
    errEmpty: 'Your cart is empty.',
    errName: 'Please enter your name.',
    errEmail: 'Please enter a valid email.',
    errAddress: 'Please enter your shipping address.',
    disclaimer: 'For bank transfer / FPS orders, payment details will be sent by email after confirmation.',
    secure: '🔒 Secure checkout',
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
    delivery: '送貨方式',
    pickup: '📦 於 Demain Life @ 1331 自取',
    pickupNote: '免費 · 準備就緒後通知您',
    ship: '🚚 寄送到地址',
    shipNote: '香港：HK$50 · 海外：另行報價',
    shippingAddress: '寄送地址 *',
    country: '國家地區',
    countries: {
      HK: '香港', CN: '中國內地', TW: '台灣', JP: '日本',
      SG: '新加坡', US: '美國', GB: '英國',
      other: '其他（我們會聯絡您）'
    },
    paymentMethod: '付款方式',
    qfpay: '💳 QFPay — 信用卡 / 支付寶 / 微信支付',
    qfpayNote: '透過 QFPay 安全付款，您將跳轉至付款頁面完成付款。',
    bankTransfer: '🏦 銀行轉賬 / 轉數快',
    bankNote: '確認後我們會以電郵發送付款詳情',
    notes: '備註（可選）',
    notesPh: '禮物包裝、特別要求…',
    subtotal: '小計',
    items: '件',
    shipping: '運費',
    shippingTbd: '另行報價',
    total: '總計',
    placing: '處理中…',
    placeOrder: '確認訂單 →',
    proceedQfpay: '以 QFPay 付款 →',
    termsLabel: '本人已閱讀並同意',
    termsLink: '購物條款及細則',
    and: '、',
    refundLink: '退款政策',
    shippingLink: '送貨政策',
    privacyLink: '私隱政策',
    termsError: '請同意條款及細則方可繼續。',
    errEmpty: '購物車是空的。',
    errName: '請輸入姓名。',
    errEmail: '請輸入有效的電郵。',
    errAddress: '請輸入寄送地址。',
    disclaimer: '銀行轉賬 / 轉數快訂單於確認後以電郵發送付款詳情。',
    secure: '🔒 安全結賬',
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
    delivery: '配送方式',
    pickup: '📦 于 Demain Life @ 1331 自取',
    pickupNote: '免费 · 准备就绪后通知您',
    ship: '🚚 寄送到地址',
    shipNote: '香港：HK$50 · 海外：另行报价',
    shippingAddress: '寄送地址 *',
    country: '国家地区',
    countries: {
      HK: '香港', CN: '中国内地', TW: '台湾', JP: '日本',
      SG: '新加坡', US: '美国', GB: '英国',
      other: '其他（我们会联系您）'
    },
    paymentMethod: '付款方式',
    qfpay: '💳 QFPay — 信用卡 / 支付宝 / 微信支付',
    qfpayNote: '通过 QFPay 安全付款，您将跳转至付款页面完成付款。',
    bankTransfer: '🏦 银行转账 / FPS',
    bankNote: '确认后我们会以邮件发送付款详情',
    notes: '备注（可选）',
    notesPh: '礼物包装、特别要求…',
    subtotal: '小计',
    items: '件',
    shipping: '运费',
    shippingTbd: '另行报价',
    total: '总计',
    placing: '处理中…',
    placeOrder: '确认订单 →',
    proceedQfpay: '以 QFPay 付款 →',
    termsLabel: '本人已阅读并同意',
    termsLink: '购物条款及细则',
    and: '、',
    refundLink: '退款政策',
    shippingLink: '配送政策',
    privacyLink: '隐私政策',
    termsError: '请同意条款及细则方可继续。',
    errEmpty: '购物车是空的。',
    errName: '请输入姓名。',
    errEmail: '请输入有效的邮箱。',
    errAddress: '请输入寄送地址。',
    disclaimer: '银行转账 / FPS 订单于确认后以邮件发送付款详情。',
    secure: '🔒 安全结账',
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
  paymentMethod: 'qfpay', // qfpay | bank-transfer
  notes: ''
})

const shippingFee = computed(() => {
  if (form.deliveryMethod === 'pickup') return 0
  if (form.country === 'HK') return 50
  return null // international: TBD
})

const total = computed(() => {
  const fee = shippingFee.value ?? 0
  return cartSubtotal() + fee
})

const shippingDisplay = computed(() => {
  if (form.deliveryMethod === 'pickup') return 'HK$0'
  if (shippingFee.value === null) return copy.value.shippingTbd
  return `HK$${shippingFee.value}`
})

function validate() {
  if (cart.items.length === 0) { error.value = copy.value.errEmpty; return false }
  if (!form.name.trim()) { error.value = copy.value.errName; return false }
  if (!form.email.trim() || !form.email.includes('@')) { error.value = copy.value.errEmail; return false }
  if (form.deliveryMethod === 'ship' && !form.address.trim()) { error.value = copy.value.errAddress; return false }
  if (!agreedToTerms.value) { error.value = copy.value.termsError; return false }
  return true
}

async function placeOrder() {
  error.value = ''
  if (!validate()) return

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
        lang: currentLocale.value
      })
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Order failed')

    const orderId = data.orderId

    // If QFPay selected and checkout URL returned → redirect
    if (form.paymentMethod === 'qfpay' && data.checkoutUrl) {
      clearCart()
      window.location.href = data.checkoutUrl
      return
    }

    // Bank transfer or QFPay fallback
    clearCart()
    router.push(`/shop/order/${orderId}`)
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="checkout-page dl-form-dark">
    <header class="shop-header">
      <router-link to="/#shop" class="brand">{{ copy.back }}</router-link>
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
        <label>{{ copy.fullName }}<input v-model="form.name" autocomplete="name" /></label>
        <label>{{ copy.email }}<input v-model="form.email" type="email" autocomplete="email" /></label>
        <label>{{ copy.phone }}<input v-model="form.phone" type="tel" autocomplete="tel" /></label>

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
          <label>{{ copy.shippingAddress }}<textarea v-model="form.address" rows="2" autocomplete="street-address"></textarea></label>
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
          <label class="delivery-card" :class="{ selected: form.paymentMethod === 'qfpay' }">
            <input type="radio" v-model="form.paymentMethod" value="qfpay" />
            <div>
              <strong>{{ copy.qfpay }}</strong>
              <p>{{ copy.qfpayNote }}</p>
            </div>
          </label>
          <label class="delivery-card" :class="{ selected: form.paymentMethod === 'bank-transfer' }">
            <input type="radio" v-model="form.paymentMethod" value="bank-transfer" />
            <div>
              <strong>{{ copy.bankTransfer }}</strong>
              <p>{{ copy.bankNote }}</p>
            </div>
          </label>
        </div>

        <label>{{ copy.notes }}<textarea v-model="form.notes" rows="2" :placeholder="copy.notesPh"></textarea></label>

        <!-- Order Summary -->
        <div class="summary">
          <div class="line"><span>{{ copy.subtotal }} ({{ cartItemCount() }} {{ copy.items }})</span><span>HK${{ cartSubtotal() }}</span></div>
          <div class="line"><span>{{ copy.shipping }}</span><span>{{ shippingDisplay }}</span></div>
          <div class="line total">
            <strong>{{ copy.total }}</strong>
            <strong>{{ shippingFee === null ? '—' : `HK$${total}` }}</strong>
          </div>
        </div>

        <!-- T&C Checkbox -->
        <div class="terms-block">
          <label class="terms-check">
            <input type="checkbox" v-model="agreedToTerms" />
            <span>
              {{ copy.termsLabel }}
              <router-link to="/legal/shop-terms" target="_blank">{{ copy.termsLink }}</router-link>{{ copy.and }}
              <router-link to="/legal/refund" target="_blank">{{ copy.refundLink }}</router-link>{{ copy.and }}
              <router-link to="/legal/shipping" target="_blank">{{ copy.shippingLink }}</router-link>{{ copy.and }}
              <router-link to="/legal/privacy" target="_blank">{{ copy.privacyLink }}</router-link>
            </span>
          </label>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button
          class="submit-btn"
          :class="{ 'btn-qfpay': form.paymentMethod === 'qfpay' }"
          :disabled="submitting"
          @click="placeOrder"
        >
          {{ submitting ? copy.placing : (form.paymentMethod === 'qfpay' ? copy.proceedQfpay : copy.placeOrder) }}
        </button>

        <p v-if="form.paymentMethod === 'bank-transfer'" class="disclaimer">{{ copy.disclaimer }}</p>
        <p class="secure-badge">{{ copy.secure }}</p>

        <!-- Legal Footer Links -->
        <div class="legal-footer">
          <router-link to="/legal/shop-terms" target="_blank">{{ copy.termsLink }}</router-link>
          <span>·</span>
          <router-link to="/legal/refund" target="_blank">{{ copy.refundLink }}</router-link>
          <span>·</span>
          <router-link to="/legal/shipping" target="_blank">{{ copy.shippingLink }}</router-link>
          <span>·</span>
          <router-link to="/legal/privacy" target="_blank">{{ copy.privacyLink }}</router-link>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.checkout-page { min-height: 100vh; background: #0d0d0d; color: #ffffff; font-family: 'Inter', -apple-system, sans-serif; }
.shop-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(20,20,20,0.85); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 10; }
.shop-header .brand { color: rgba(255,255,255,0.55); text-decoration: none; font-size: 0.88rem; }
.shop-header .brand:hover { color: #fff; }
.shop-header h1 { margin: 0; font-size: 1.1rem; font-weight: 500; color: #fff; }

.empty { text-align: center; padding: 4rem 2rem; }
.btn-primary { background: #2a2826; color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 0.7rem 1.4rem; border-radius: 6px; cursor: pointer; }

.checkout-layout { max-width: 1100px; margin: 2rem auto; padding: 0 2rem; display: grid; grid-template-columns: 1fr 420px; gap: 2rem; align-items: start; }

.cart-section, .checkout-form {
  background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%);
  padding: 1.5rem; border: 1px solid rgba(255,255,255,0.10); border-radius: 12px;
}
.cart-section h2, .checkout-form h2 { margin: 0 0 1.2rem; font-size: 1.1rem; font-weight: 600; color: #fff; }
.checkout-form h3 { margin: 1.3rem 0 0.6rem; font-size: 0.76rem; font-weight: 700; color: var(--color-neon, #39ff14); letter-spacing: 0.16em; text-transform: uppercase; }

.cart-row { display: grid; grid-template-columns: 70px 1fr auto; gap: 1rem; padding: 1rem 0; border-bottom: 1px dashed rgba(255,255,255,0.10); }
.cart-row:last-child { border-bottom: none; }
.cart-row-img { width: 70px; height: 70px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.cart-row-img img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { font-size: 2rem; opacity: 0.4; }
.cart-name { font-weight: 500; color: #fff; }
.cart-price { font-size: 0.85rem; color: #8a8780; margin: 0.2rem 0 0.5rem; }
.qty-row { display: flex; align-items: center; gap: 0.4rem; }
.qty-btn { background: rgba(255,255,255,0.12); border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 1rem; color: #fff; }
.qty-display { min-width: 24px; text-align: center; font-weight: 500; }
.remove-btn { background: none; border: none; color: #ff5f5f; cursor: pointer; font-size: 0.8rem; margin-left: 0.6rem; }
.cart-row-total { font-weight: 600; align-self: center; color: var(--color-neon, #39ff14); }

.checkout-form label { display: block; margin: 0.6rem 0; font-size: 0.85rem; color: rgba(255,255,255,0.65); }
.checkout-form label input, .checkout-form label textarea, .checkout-form label select {
  display: block; width: 100%; margin-top: 0.25rem;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px; padding: 0.6rem 0.85rem; color: #fff; font: inherit; font-size: 0.92rem;
  box-sizing: border-box; transition: border-color 0.2s;
}
.checkout-form label input:focus, .checkout-form label textarea:focus, .checkout-form label select:focus {
  outline: none; border-color: var(--color-neon, #39ff14);
}
.checkout-form label select option { background: #1a1a1a; color: #fff; }

.delivery-options { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.3rem; }
.delivery-card { display: flex; gap: 0.7rem; padding: 0.85rem 1rem; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; cursor: pointer; transition: all 0.15s; background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.8); }
.delivery-card:hover { border-color: rgba(255,255,255,0.25); }
.delivery-card.selected { border-color: var(--color-neon, #39ff14); background: rgba(57,255,20,0.07); box-shadow: 0 0 0 1px rgba(57,255,20,0.25); }
.delivery-card input { width: auto; margin-top: 0.2rem; accent-color: var(--color-neon, #39ff14); flex-shrink: 0; }
.delivery-card strong { display: block; color: #fff; font-size: 0.9rem; }
.delivery-card p { margin: 0.2rem 0 0; font-size: 0.8rem; color: rgba(255,255,255,0.5); }

.summary { margin: 1.5rem 0 1rem; padding-top: 1rem; border-top: 1px dashed rgba(255,255,255,0.12); }
.summary .line { display: flex; justify-content: space-between; padding: 0.28rem 0; font-size: 0.9rem; color: rgba(255,255,255,0.8); }
.summary .line.total { font-size: 1.15rem; margin-top: 0.5rem; padding-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.10); color: var(--color-neon, #39ff14); }

/* T&C checkbox */
.terms-block { margin: 0.8rem 0 1rem; }
.terms-check { display: flex !important; align-items: flex-start; gap: 0.55rem; cursor: pointer; margin: 0 !important; font-size: 0.82rem !important; color: rgba(255,255,255,0.6) !important; }
.terms-check input[type="checkbox"] { display: inline !important; width: 16px !important; height: 16px !important; flex-shrink: 0; margin-top: 2px; accent-color: var(--color-neon, #39ff14); border: none; background: none; padding: 0; }
.terms-check span { line-height: 1.5; }
.terms-check a { color: var(--color-neon, #39ff14); text-decoration: underline; text-decoration-color: rgba(57,255,20,0.4); }
.terms-check a:hover { text-decoration-color: var(--color-neon, #39ff14); }

.error-msg { background: rgba(255,60,60,0.12); color: #ff6b6b; border: 1px solid rgba(255,60,60,0.25); padding: 0.65rem 1rem; border-radius: 8px; margin: 0.5rem 0; font-size: 0.86rem; }

.submit-btn { width: 100%; padding: 1rem; background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 100px; cursor: pointer; font-weight: 700; font-size: 1rem; margin-top: 0.5rem; letter-spacing: 0.02em; transition: all 0.2s; }
.submit-btn.btn-qfpay { background: var(--color-neon, #39ff14); color: #0d0d0d; border-color: transparent; box-shadow: 0 0 0 1px rgba(57,255,20,0.5), 0 8px 22px rgba(57,255,20,0.25); }
.submit-btn.btn-qfpay:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(57,255,20,0.8), 0 12px 28px rgba(57,255,20,0.40); }
.submit-btn:hover:not(:disabled):not(.btn-qfpay) { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.18); }
.submit-btn:disabled { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); box-shadow: none; cursor: not-allowed; border-color: rgba(255,255,255,0.08); }

.disclaimer { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin: 0.6rem 0 0; text-align: center; line-height: 1.5; }
.secure-badge { font-size: 0.78rem; color: rgba(57,255,20,0.6); margin: 0.5rem 0 0; text-align: center; }

.legal-footer { display: flex; flex-wrap: wrap; gap: 0.4rem 0.5rem; justify-content: center; margin-top: 1.2rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.07); font-size: 0.76rem; }
.legal-footer a { color: rgba(255,255,255,0.4); text-decoration: none; }
.legal-footer a:hover { color: rgba(255,255,255,0.7); }
.legal-footer span { color: rgba(255,255,255,0.2); }

@media (max-width: 820px) {
  .checkout-layout { grid-template-columns: 1fr; padding: 0 1rem; gap: 1.2rem; margin: 1.2rem auto; }
  .shop-header { padding: 0.8rem 1rem; }
  .cart-section, .checkout-form { padding: 1.2rem; }
  .cart-row { grid-template-columns: 60px 1fr; gap: 0.7rem; }
  .cart-row-total { grid-column: 1 / -1; text-align: right; margin-top: 0.3rem; }
}
@media (max-width: 480px) {
  .checkout-layout { padding: 0 0.75rem; }
  .cart-row { grid-template-columns: 50px 1fr; }
  .cart-row-img { width: 50px; height: 50px; }
}
</style>
