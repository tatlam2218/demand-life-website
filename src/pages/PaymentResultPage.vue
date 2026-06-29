<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentLocale } from '../i18n'

const route = useRoute()
const router = useRouter()
const success = computed(() => route.path.endsWith('/payment-success'))

const urlLang = route.query.lang
if (urlLang === 'en' || urlLang === 'zh-CN' || urlLang === 'zh-HK') {
  currentLocale.value = urlLang
}

const COPY = {
  en: {
    successTitle: 'Submitted · awaiting review',
    successBody: 'Thank you. We have received your payment screenshot. Our team will verify the transfer within 1 business day and email you once confirmed. You can close this page.',
    failTitle: 'Payment was not completed.',
    failBody: 'No charge was made. You can retry the payment from the link in your confirmation email, or contact us if you need help.',
    retry: 'Retry payment',
    backHome: 'Back to homepage'
  },
  'zh-CN': {
    successTitle: '已提交 · 等待审核',
    successBody: '感谢您。我们已收到您的付款截图，团队将在 1 个工作日内核对汇款，确认后会电邮通知您。您可以关闭本页面。',
    failTitle: '付款未完成。',
    failBody: '未产生任何扣款。您可以从确认邮件中的链接重试付款，或联系我们获取帮助。',
    retry: '重试付款',
    backHome: '返回首页'
  },
  'zh-HK': {
    successTitle: '已提交 · 等待審核',
    successBody: '感謝您。我們已收到您的付款截圖，團隊將於 1 個工作日內核對匯款，確認後會電郵通知您。您可以關閉本頁面。',
    failTitle: '付款未完成。',
    failBody: '未產生任何扣款。您可以從確認電郵中的連結重試付款，或聯絡我們獲取協助。',
    retry: '重試付款',
    backHome: '返回首頁'
  }
}
const c = computed(() => COPY[currentLocale.value] || COPY.en)

function goHome() { router.push('/') }
</script>

<template>
  <section class="result-page">
    <div class="container">
      <div class="card" :class="{ ok: success, fail: !success }">
        <div class="icon">{{ success ? '✓' : '✕' }}</div>
        <h1>{{ success ? c.successTitle : c.failTitle }}</h1>
        <p class="lead">{{ success ? c.successBody : c.failBody }}</p>
        <button class="btn-primary" @click="goHome">{{ c.backHome }} →</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.result-page { min-height: 100vh; padding: 6rem 1.5rem; background: var(--cream); display: flex; align-items: center; }
.container { max-width: 560px; }
.card { background: var(--white); border: 1px solid var(--warm-gray-100); border-radius: 8px; padding: 4rem 2rem; text-align: center; }
.icon { font-size: 4rem; line-height: 1; margin-bottom: 1.5rem; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
.card.ok .icon { background: #d8f0d8; color: #2a6a4a; }
.card.fail .icon { background: #fdf3f3; color: #b06b6b; }
h1 { font-weight: 300; margin: 0.5rem 0 1rem; }
.lead { color: var(--warm-gray-700); line-height: 1.6; margin-bottom: 2rem; }
.btn-primary { background: var(--ink); color: var(--white); padding: 0.85rem 2rem; border-radius: 4px; border: none; cursor: pointer; font: inherit; }
</style>
