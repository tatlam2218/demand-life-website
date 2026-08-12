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
    paidTitle:  'Accommodation payment received',
    paidBody:   'Your accommodation payment has been successfully processed via QFPay. Your room at Demain Life @ 1331 is secured. A confirmation email with your booking details will be sent to you shortly.',
    paidBadge:  'Paid via QFPay',

    // FPS / bank transfer screenshot uploaded
    successTitle: 'Payment screenshot received',
    successBody:  'Thank you for your accommodation payment. We have received your transfer screenshot and will verify the payment within 1 business day. Once confirmed, we will email you with your booking confirmation.',

    // Failed
    failTitle: 'Accommodation payment not completed',
    failBody:  'Your accommodation payment was not completed and no charge has been made. Please retry using the payment link in your booking email, or contact our team at hello@demainculture.com for assistance.',

    backHome: 'Back to homepage',
  },
  'zh-CN': {
    paidTitle:  '住宿付款已完成',
    paidBody:   '您的住宿费用已通过 QFPay 成功支付。您在 Demain Life @ 1331 的房间已确认预订。预订确认邮件将于稍后发送至您的邮箱。',
    paidBadge:  '已通过 QFPay 付款',

    successTitle: '付款截图已收到',
    successBody:  '感谢您完成住宿付款。我们已收到您的转账截图，团队将于 1 个工作日内核对款项。确认后，我们将以电邮发送您的预订确认函。',

    failTitle: '住宿付款未完成',
    failBody:  '您的住宿付款未能完成，且未产生任何扣款。请通过预订邮件中的付款链接重试，或发送邮件至 hello@demainculture.com 联系我们的团队。',

    backHome: '返回首页',
  },
  'zh-HK': {
    paidTitle:  '住宿付款已完成',
    paidBody:   '您的住宿費用已透過 QFPay 成功支付。您在 Demain Life @ 1331 的房間已確認預訂。預訂確認電郵將於稍後發送至您的郵箱。',
    paidBadge:  '已透過 QFPay 付款',

    successTitle: '付款截圖已收到',
    successBody:  '感謝您完成住宿付款。我們已收到您的轉賬截圖，團隊將於 1 個工作日內核對款項。確認後，我們將以電郵發送您的預訂確認函。',

    failTitle: '住宿付款未完成',
    failBody:  '您的住宿付款未能完成，且未產生任何扣款。請透過預訂電郵中的付款連結重試，或發送電郵至 hello@demainculture.com 聯絡我們的團隊。',

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
