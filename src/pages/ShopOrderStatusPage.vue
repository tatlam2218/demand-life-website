<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentLocale } from '../i18n'
import LangSwitch from '../components/LangSwitch.vue'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)
const error = ref('')

const COPY = {
  'en': {
    continueShopping: '← Continue shopping', loadingOrder: 'Loading order…',
    orderConfirmation: 'Order confirmation', thankYou: 'Thank you, {name}!',
    received: "Your order has been received. We'll be in touch shortly.",
    orderNo: 'Order #', invoice: 'Invoice', status: 'Status',
    items: 'Items', subtotal: 'Subtotal', shipping: 'Shipping', total: 'Total',
    delivery: 'Delivery', pickupAt: '📦 Pickup at {loc}', pickupNotify: "We'll notify you once your order is ready.",
    shipped: '🚚 Shipped to your address', tracking: 'Tracking:',
    payment: 'Payment', method: 'Method:', statusLine: 'Status:',
    bankTransfer: 'Bank transfer / FPS', qfpay: 'QFPay',
    paid: 'Paid', awaiting: 'Awaiting',
    bankInstr: 'Pay by FPS or bank transfer:', reference: 'Reference:',
    afterPayment: 'After payment, please reply to the confirmation email with a screenshot.',
    footerNote: 'Reference your order ID {id} in any correspondence.',
    statusMap: {
      new: 'Order placed · Awaiting payment instructions',
      'awaiting-payment': 'Awaiting payment', paid: 'Payment received',
      preparing: 'Preparing your order', shipped: 'Shipped',
      'ready-pickup': 'Ready for pickup at 1331', completed: 'Completed', cancelled: 'Cancelled'
    }
  },
  'zh-CN': {
    continueShopping: '← 继续购物', loadingOrder: '加载订单…',
    orderConfirmation: '订单确认', thankYou: '谢谢您，{name}！',
    received: '我们已收到您的订单，将尽快与您联系。',
    orderNo: '订单号', invoice: '发票', status: '状态',
    items: '商品', subtotal: '小计', shipping: '运费', total: '总计',
    delivery: '配送', pickupAt: '📦 在 {loc} 自取', pickupNotify: '准备就绪后我们会通知您。',
    shipped: '🚚 已发货到您的地址', tracking: '跟踪号：',
    payment: '付款', method: '方式：', statusLine: '状态：',
    bankTransfer: '银行转账 / FPS', qfpay: 'QFPay',
    paid: '已付款', awaiting: '待付款',
    bankInstr: '请使用 FPS 或银行转账付款：', reference: '参考编号：',
    afterPayment: '付款后，请回复确认邮件并附上截图。',
    footerNote: '任何联系请提供订单号 {id}。',
    statusMap: {
      new: '订单已提交 · 等待付款说明',
      'awaiting-payment': '待付款', paid: '已收到付款',
      preparing: '商品准备中', shipped: '已发货',
      'ready-pickup': '1331 可自取', completed: '已完成', cancelled: '已取消'
    }
  },
  'zh-HK': {
    continueShopping: '← 繼續購物', loadingOrder: '加載訂單…',
    orderConfirmation: '訂單確認', thankYou: '多謝您，{name}！',
    received: '我們已收到您的訂單，會盡快與您聯絡。',
    orderNo: '訂單號', invoice: '發票', status: '狀態',
    items: '產品', subtotal: '小計', shipping: '運費', total: '總計',
    delivery: '送貨', pickupAt: '📦 於 {loc} 自取', pickupNotify: '準備就緒後我們會通知您。',
    shipped: '🚚 已發貨到您的地址', tracking: '追蹤號：',
    payment: '付款', method: '方式：', statusLine: '狀態：',
    bankTransfer: '銀行轉賬 / FPS', qfpay: 'QFPay',
    paid: '已付款', awaiting: '待付款',
    bankInstr: '請使用 FPS 或銀行轉賬付款：', reference: '參考編號：',
    afterPayment: '付款後，請回覆確認電郵並附上截圖。',
    footerNote: '任何聯絡請提供訂單號 {id}。',
    statusMap: {
      new: '訂單已提交 · 等待付款說明',
      'awaiting-payment': '待付款', paid: '已收到付款',
      preparing: '產品準備中', shipped: '已發貨',
      'ready-pickup': '1331 可自取', completed: '已完成', cancelled: '已取消'
    }
  }
}
const copy = computed(() => COPY[currentLocale.value] || COPY.en)

onMounted(async () => {
  try {
    const res = await fetch(`/api/shop/orders/${route.params.orderId}`)
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error || 'Order not found')
    order.value = data
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
})

const STATUS_COLORS = {
  new: '#b48a3a', 'awaiting-payment': '#b48a3a', paid: '#3a8a5e',
  preparing: '#5a7a9e', shipped: '#3a8a5e', 'ready-pickup': '#3a8a5e',
  completed: '#3a8a5e', cancelled: '#b03030'
}
const statusInfo = computed(() => {
  if (!order.value) return { label: '—', color: '#888' }
  const s = order.value.status
  return { label: copy.value.statusMap[s] || s, color: STATUS_COLORS[s] || '#888' }
})
</script>

<template>
  <div class="status-page">
    <header class="shop-header">
      <router-link to="/shop" class="brand">{{ copy.continueShopping }}</router-link>
      <LangSwitch />
    </header>

    <main v-if="loading" class="empty">{{ copy.loadingOrder }}</main>
    <main v-else-if="error" class="empty error">{{ error }}</main>
    <main v-else class="container">
      <div class="hero-card">
        <p class="eyebrow">{{ copy.orderConfirmation }}</p>
        <h1>{{ copy.thankYou.replace('{name}', order.customer.name) }}</h1>
        <p class="lead">{{ copy.received }}</p>

        <div class="order-meta">
          <div><span>{{ copy.orderNo }}</span><strong>{{ order.id }}</strong></div>
          <div><span>{{ copy.invoice }}</span><strong>{{ order.invoiceNumber }}</strong></div>
          <div><span>{{ copy.status }}</span><strong :style="{ color: statusInfo.color }">{{ statusInfo.label }}</strong></div>
        </div>
      </div>

      <div class="card">
        <h2>{{ copy.items }}</h2>
        <div v-for="it in order.items" :key="it.sku" class="item-row">
          <div>{{ it.name }}<span v-if="it.nameZh"> · {{ it.nameZh }}</span> × {{ it.qty }}</div>
          <div>HK${{ it.lineTotal }}</div>
        </div>
        <div class="totals">
          <div class="line"><span>{{ copy.subtotal }}</span><span>HK${{ order.totals.subtotal }}</span></div>
          <div class="line"><span>{{ copy.shipping }}</span><span>HK${{ order.totals.shipping }}</span></div>
          <div class="line total"><strong>{{ copy.total }}</strong><strong>HK${{ order.totals.total }}</strong></div>
        </div>
      </div>

      <div class="card">
        <h2>{{ copy.delivery }}</h2>
        <p v-if="order.delivery.method === 'pickup'">
          <strong>{{ copy.pickupAt.replace('{loc}', order.delivery.pickupLocation) }}</strong><br>
          {{ copy.pickupNotify }}
        </p>
        <p v-else>
          <strong>{{ copy.shipped }}</strong>
          <span v-if="order.delivery.trackingNumber"><br>{{ copy.tracking }} {{ order.delivery.trackingNumber }}</span>
        </p>
      </div>

      <div class="card payment-card">
        <h2>{{ copy.payment }}</h2>
        <p>
          {{ copy.method }} <strong>{{ order.payment.method === 'bank-transfer' ? copy.bankTransfer : copy.qfpay }}</strong><br>
          {{ copy.statusLine }} <strong :style="{ color: order.payment.status === 'paid' ? '#3a8a5e' : '#b48a3a' }">
            {{ order.payment.status === 'paid' ? copy.paid : copy.awaiting }}
          </strong>
        </p>
        <p v-if="order.payment.method === 'bank-transfer' && order.payment.status !== 'paid'" class="bank-info">
          <strong>{{ copy.bankInstr }}</strong><br>
          ZA Bank · 882002273557 · Demain Culture Limited<br>
          {{ copy.reference }} <code>{{ order.id }}</code><br>
          <em style="font-size:0.85rem;color:#8a8780;">{{ copy.afterPayment }}</em>
        </p>
      </div>

      <p class="footer-note">
        {{ copy.footerNote.replace('{id}', '') }}<code>{{ order.id }}</code>
      </p>
    </main>
  </div>
</template>

<style scoped>
.status-page { min-height: 100vh; background: #fafaf7; color: #2a2826; font-family: 'Inter', -apple-system, sans-serif; }
.shop-header { padding: 1rem 2rem; border-bottom: 1px solid #e8e6e1; background: #fff; display: flex; justify-content: space-between; align-items: center; }
.brand { color: #6b665e; text-decoration: none; }
.empty { text-align: center; padding: 4rem 2rem; }
.error { color: #b03030; }
.container { max-width: 680px; margin: 2rem auto; padding: 0 1.5rem; }
.hero-card { background: linear-gradient(135deg, #fdfcf9 0%, #efe7d6 100%); padding: 2.5rem 2rem; border-radius: 14px; margin-bottom: 1rem; text-align: center; }
.eyebrow { font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8780; margin: 0 0 0.6rem; }
.hero-card h1 { font-size: 1.8rem; font-weight: 300; margin: 0 0 0.6rem; }
.lead { color: #6b665e; margin: 0 0 1.5rem; }
.order-meta { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; font-size: 0.88rem; }
.order-meta > div { display: flex; flex-direction: column; gap: 0.2rem; }
.order-meta span { color: #8a8780; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; }

.card { background: #fff; border: 1px solid #e8e6e1; border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem; }
.card h2 { margin: 0 0 1rem; font-size: 1.05rem; font-weight: 500; }
.item-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dashed #f0eee9; }
.item-row:last-child { border-bottom: none; }
.totals { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; }
.line { display: flex; justify-content: space-between; padding: 0.25rem 0; }
.line.total { font-size: 1.1rem; padding-top: 0.6rem; border-top: 1px solid #eee; margin-top: 0.5rem; }

.payment-card .bank-info { background: #fdfcf9; border: 1px dashed #d4c8a8; padding: 0.8rem 1rem; border-radius: 6px; margin-top: 0.7rem; font-size: 0.92rem; }
.payment-card code { background: #f4f1ea; padding: 2px 6px; border-radius: 3px; }

.footer-note { text-align: center; color: #8a8780; font-size: 0.85rem; margin-top: 2rem; }
.footer-note code { background: #fff; padding: 2px 6px; border-radius: 3px; border: 1px solid #e8e6e1; }
</style>
