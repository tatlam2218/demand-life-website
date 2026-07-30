<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentLocale } from '../i18n'

const route = useRoute()
const router = useRouter()

const success = computed(() => route.path.endsWith('/payment-success'))
// QFPay returns here with ?via=qfpay — show the "payment complete" card instead of "awaiting review"
const viaQfpay = computed(() => route.query.via === 'qfpay')

const urlLang = route.query.lang
if (urlLang === 'en' || urlLang === 'zh-CN' || urlLang === 'zh-HK') {
  currentLocale.value = urlLang
}

const COPY = {
  en: {
    // QFPay paid — instant confirmation
    paidTitle:  'Payment complete',
    paidBody:   'Your payment was processed successfully via QFPay. You will receive a confirmation email shortly. Thank you for booking with Demain Life.',
    paidBadge:  'Paid via QFPay',

    // FPS / bank transfer screenshot uploaded
    successTitle: 'Screenshot received',
    successBody:  'Thank you. We have received your payment screenshot. Our team will verify the transfer within 1 business day and email you once confirmed.',

    // Failed
    failTitle: 'Payment was not completed.',
    failBody:  'No charge was made. You can retry the payment from the link in your confirmation email, or contact us if you need help.',

    backHome: 'Back to homepage',
  },
  'zh-CN': {
    paidTitle:  '付款完成',
    paidBody:   '您的付款已通过 QFPay 成功处理。确认邮件将会发送到您的邮箱。感谢您选择 Demain Life。',
    paidBadge:  '已通过 QFPay 付款',

    successTitle: '截图已收到',
    successBody:  '感谢您。我们已收到付款截图，团队将在 1 个工作日内核对汇款，确认后会电邮通知您。',

    failTitle: '付款未完成。',
    failBody:  '未产生任何扣款。您可以从确认邮件中的链接重试付款，或联系我们获取帮助。',

    backHome: '返回首页',
  },
  'zh-HK': {
    paidTitle:  '付款完成',
    paidBody:   '您的付款已透過 QFPay 成功處理。確認電郵將會發送到您的郵箱。感謝您選擇 Demain Life。',
    paidBadge:  '已透過 QFPay 付款',

    successTitle: '截圖已收到',
    successBody:  '感謝您。我們已收到付款截圖，團隊將於 1 個工作日內核對匯款，確認後會電郵通知您。',

    failTitle: '付款未完成。',
    failBody:  '未產生任何扣款。您可以從確認電郵中的連結重試付款，或聯絡我們獲取協助。',

    backHome: '返回首頁',
  }
}
const c = computed(() => COPY[currentLocale.value] || COPY.en)

function goHome() { router.push('/') }
</script>

<template>
  <section class="result-page">
    <div class="container">

      <!-- ── QFPay PAID (success + via=qfpay) ──────────────────────── -->
      <div v-if="success && viaQfpay" class="card paid">
        <div class="icon-wrap paid-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <p class="badge">{{ c.paidBadge }}</p>
        <h1>{{ c.paidTitle }}</h1>
        <p class="lead">{{ c.paidBody }}</p>
        <button class="btn-primary" @click="goHome">{{ c.backHome }} →</button>
      </div>

      <!-- ── FPS SCREENSHOT RECEIVED ────────────────────────────────── -->
      <div v-else-if="success" class="card ok">
        <div class="icon-wrap ok-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h1>{{ c.successTitle }}</h1>
        <p class="lead">{{ c.successBody }}</p>
        <button class="btn-primary" @click="goHome">{{ c.backHome }} →</button>
      </div>

      <!-- ── PAYMENT FAILED ─────────────────────────────────────────── -->
      <div v-else class="card fail">
        <div class="icon-wrap fail-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <h1>{{ c.failTitle }}</h1>
        <p class="lead">{{ c.failBody }}</p>
        <button class="btn-primary" @click="goHome">{{ c.backHome }} →</button>
      </div>

    </div>
  </section>
</template>

<style scoped>
.result-page {
  min-height: 100vh;
  padding: 4rem 1.5rem;
  background: var(--cream, #faf8f5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.container { max-width: 520px; width: 100%; }

.card {
  background: var(--white, #fff);
  border: 1px solid var(--warm-gray-100, #e8e4df);
  border-radius: 12px;
  padding: 3.5rem 2.5rem;
  text-align: center;
}

/* icon circle */
.icon-wrap {
  width: 72px; height: 72px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.5rem;
}
.icon-wrap svg { width: 32px; height: 32px; }

.paid-icon  { background: #e8f5e9; color: #2e7d32; }
.ok-icon    { background: #e3f0ff; color: #1565c0; }
.fail-icon  { background: #fdf3f3; color: #b06b6b; }

/* QFPay paid — green accent border */
.card.paid  { border-color: #a5d6a7; }
.card.ok    { border-color: var(--warm-gray-100, #e8e4df); }
.card.fail  { border-color: #f5c6c6; }

.badge {
  display: inline-block;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 12px;
  border-radius: 20px;
  margin-bottom: 0.75rem;
}

h1 { font-weight: 300; font-size: 1.7rem; margin: 0.4rem 0 1rem; color: var(--ink, #1a1a1a); }
.lead { color: var(--warm-gray-700, #4a4540); line-height: 1.65; margin-bottom: 2rem; font-size: 0.95rem; }

.btn-primary {
  background: var(--ink, #1a1a1a);
  color: var(--white, #fff);
  padding: 0.85rem 2rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font: inherit;
  font-size: 0.95rem;
  transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.82; }
</style>
