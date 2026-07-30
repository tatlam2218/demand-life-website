<script setup>
/**
 * /book/payment-demo
 * QFPay compliance review page — shows the full Stay payment checkout
 * with hardcoded demo data. No token required. Publicly accessible.
 */
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { currentLocale, useI18n } from '../i18n'

const route = useRoute()
useI18n()

const urlLang = route.query.lang
if (urlLang === 'en' || urlLang === 'zh-CN' || urlLang === 'zh-HK') {
  currentLocale.value = urlLang
}

// ── Demo / mock data (no real booking needed) ──────────────────────────────
const DEMO = {
  booking: { id: 'DL-STAY-DEMO001', name: 'Chan Tai Man', email: 'demo@demainlife.com' },
  paymentRequest: {
    requestId:   'PR-DEMO001',
    amount:      13600,
    currency:    'HKD',
    description: 'Security deposit (2 months) + 1st month rent — One-Bed Studio',
    status:      'awaiting',
    screenshots: []
  },
  landlord: {
    fpsId:             '115403669',
    bankName:          'ZA Bank',
    bankAccountNumber: '882002273557',
    bankAccountName:   'Demain Culture Limited'
  }
}

const COPY = {
  en: {
    demoBanner:      '🔍 Demo preview — QFPay compliance review. No real transaction will occur.',
    eyebrow:         'Payment',
    title:           'Complete your payment',
    leadAwaiting:    'Please pay the amount below via FPS (Faster Payment System) or bank transfer, then upload a screenshot of the confirmation.',
    amount:          'Amount due',
    method:          'How to pay',
    methodQfpay:     'Pay online with QFPay',
    methodQfpayNote: 'Credit / debit card, Alipay HK, WeChat Pay, UnionPay — secure redirect to QFPay checkout.',
    payWithQfpay:    'Pay HK$13,600 with QFPay →',
    orDivider:       'or pay by bank transfer / FPS',
    methodFPS:       'FPS (recommended)',
    methodBank:      'Bank transfer',
    scanQR:          'Scan the QR code below in any HK bank app, or send to the FPS ID directly.',
    bank:            'Bank',
    account:         'Account number',
    accountName:     'Account name',
    fpsId:           'FPS ID',
    referenceLabel:  'Important — include this reference in your transfer note',
    uploadTitle:     'Upload payment screenshot',
    uploadHelp:      'Please upload the screenshot showing the successful transfer.',
    chooseFile:      'Choose file',
    takePhoto:       'Take photo',
    paymentNoteTitle: 'About this payment',
    paymentNoteBody:  'This payment is collected by Demain Culture Limited (operator of Demain Life @ 1331) for accommodation fees. All payments are in HKD via FPS or bank transfer. Please include your booking reference in the transfer note.',
    legalFooter:      'By making this payment you confirm you have read the <a href="/legal/stay-terms" target="_blank">Stay Terms &amp; Conditions</a>, <a href="/legal/stay-refund" target="_blank">Cancellation &amp; Refund Policy</a>, and <a href="/legal/stay-payment" target="_blank">Payment Scenario</a>.'
  },
  'zh-HK': {
    demoBanner:      '🔍 示範預覽 — QFPay 合規審查用途。不會產生真實交易。',
    eyebrow:         '付款',
    title:           '完成您的付款',
    leadAwaiting:    '請透過 FPS（轉數快）或銀行轉賬支付以下金額，然後上載付款截圖。',
    amount:          '應付金額',
    method:          '付款方式',
    methodQfpay:     '使用 QFPay 網上付款',
    methodQfpayNote: '信用卡 / 扣賬卡、支付寶 HK、微信支付、銀聯 — 安全跳轉至 QFPay 付款頁面。',
    payWithQfpay:    '以 QFPay 支付 HK$13,600 →',
    orDivider:       '或使用銀行轉賬 / 轉數快',
    methodFPS:       'FPS 轉數快（建議）',
    methodBank:      '銀行轉賬',
    scanQR:          '請用任何香港銀行 App 掃描下方二維碼，或直接轉賬至 FPS ID。',
    bank:            '銀行',
    account:         '賬號',
    accountName:     '賬戶名',
    fpsId:           'FPS ID',
    referenceLabel:  '重要 — 請於轉賬備註中包含此參考編號',
    uploadTitle:     '上載付款截圖',
    uploadHelp:      '請上載顯示成功轉賬的截圖。',
    chooseFile:      '選擇檔案',
    takePhoto:       '拍照',
    paymentNoteTitle: '關於本次付款',
    paymentNoteBody:  '本次付款由 Demain Culture Limited（Demain Life @ 1331 營運方）收取，用於住宿費用。所有付款均以港幣（HKD）透過 FPS 或銀行轉賬進行。請於轉賬備註中註明您的預訂參考編號。',
    legalFooter:      '提交此款即表示您已閱讀<a href="/legal/stay-terms" target="_blank">入住條款及細則</a>、<a href="/legal/stay-refund" target="_blank">取消及退款政策</a>及<a href="/legal/stay-payment" target="_blank">付款場景</a>。'
  },
  'zh-CN': {
    demoBanner:      '🔍 示范预览 — QFPay 合规审查用途。不会产生真实交易。',
    eyebrow:         '付款',
    title:           '完成您的付款',
    leadAwaiting:    '请通过 FPS（转数快）或银行转账支付以下金额，然后上传付款截图。',
    amount:          '应付金额',
    method:          '付款方式',
    methodQfpay:     '使用 QFPay 网上付款',
    methodQfpayNote: '信用卡 / 借记卡、支付宝 HK、微信支付、银联 — 安全跳转至 QFPay 付款页面。',
    payWithQfpay:    '以 QFPay 支付 HK$13,600 →',
    orDivider:       '或使用银行转账 / FPS',
    methodFPS:       'FPS 转数快（推荐）',
    methodBank:      '银行转账',
    scanQR:          '请用任何香港银行 App 扫描下方二维码，或直接转账至 FPS ID。',
    bank:            '银行',
    account:         '账号',
    accountName:     '账户名',
    fpsId:           'FPS ID',
    referenceLabel:  '重要 — 请在转账备注中包含此参考编号',
    uploadTitle:     '上传付款截图',
    uploadHelp:      '请上传显示成功转账的截图。',
    chooseFile:      '选择文件',
    takePhoto:       '拍照',
    paymentNoteTitle: '关于本次付款',
    paymentNoteBody:  '本次付款由 Demain Culture Limited（Demain Life @ 1331 运营方）收取，用于住宿费用。所有付款均以港币（HKD）通过 FPS 或银行转账进行。请在转账备注中注明您的预订参考编号。',
    legalFooter:      '提交此款即表示您已阅读<a href="/legal/stay-terms" target="_blank">入住条款及细则</a>、<a href="/legal/stay-refund" target="_blank">取消及退款政策</a>及<a href="/legal/stay-payment" target="_blank">付款场景</a>。'
  }
}

const copy = computed(() => COPY[currentLocale.value] || COPY.en)
const d = DEMO

// QFPay demo — link to the success page with ?via=qfpay so QFPay can see the "Payment Complete" screen
const qfpayDemoUrl = computed(() => {
  const lang = currentLocale.value || 'en'
  return `/book/payment-success?via=qfpay&lang=${lang}`
})
</script>

<template>
  <section class="payment-page dl-form">
    <div class="container">

      <!-- Demo banner -->
      <div class="demo-banner">{{ copy.demoBanner }}</div>

      <!-- Page header -->
      <header class="page-header">
        <p class="eyebrow">{{ copy.eyebrow }} · {{ d.booking.id }}</p>
        <h1>{{ copy.title }}</h1>
        <p class="lead">{{ copy.leadAwaiting }}</p>
      </header>

      <!-- Amount card -->
      <div class="amount-card">
        <p class="amount-label">{{ copy.amount }}</p>
        <p class="amount-value">HK$ {{ d.paymentRequest.amount.toLocaleString() }}</p>
        <p class="amount-desc">{{ d.paymentRequest.description }}</p>
      </div>

      <!-- QFPay option -->
      <div class="card qfpay-card">
        <div class="qfpay-header">
          <span class="qfpay-logo">QF</span>
          <div>
            <p class="method-title">{{ copy.methodQfpay }}</p>
            <p class="muted">{{ copy.methodQfpayNote }}</p>
          </div>
        </div>
        <a :href="qfpayDemoUrl" class="qfpay-btn">
          {{ copy.payWithQfpay }}
        </a>
        <p class="qfpay-brands">Visa · Mastercard · Alipay · WeChat Pay · UnionPay</p>
      </div>

      <!-- Divider -->
      <div class="or-divider"><span>{{ copy.orDivider }}</span></div>

      <!-- FPS / bank instructions -->
      <div class="card">
        <h3 class="section-title">{{ copy.methodFPS }} &amp; {{ copy.methodBank }}</h3>

        <div class="method-block">
          <p class="method-title">{{ copy.methodFPS }}</p>
          <p class="muted">{{ copy.scanQR }}</p>
          <div class="qr-row">
            <img src="/payment/fps-qr.jpg" alt="FPS QR" class="fps-qr" />
            <div class="qr-info">
              <div class="info-row">
                <span class="k">{{ copy.fpsId }}</span>
                <span class="v"><strong>{{ d.landlord.fpsId }}</strong></span>
              </div>
              <div class="info-row">
                <span class="k">{{ copy.accountName }}</span>
                <span class="v">{{ d.landlord.bankAccountName }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="method-block">
          <p class="method-title">{{ copy.methodBank }}</p>
          <div class="info-row">
            <span class="k">{{ copy.bank }}</span>
            <span class="v">{{ d.landlord.bankName }}</span>
          </div>
          <div class="info-row">
            <span class="k">{{ copy.account }}</span>
            <span class="v"><strong>{{ d.landlord.bankAccountNumber }}</strong></span>
          </div>
          <div class="info-row">
            <span class="k">{{ copy.accountName }}</span>
            <span class="v">{{ d.landlord.bankAccountName }}</span>
          </div>
        </div>

        <div class="ref-card">
          <p class="ref-label">{{ copy.referenceLabel }}</p>
          <p class="ref-value">{{ d.booking.id }}</p>
        </div>
      </div>

      <!-- Upload section -->
      <div class="card">
        <h3 class="section-title">{{ copy.uploadTitle }}</h3>
        <p class="muted">{{ copy.uploadHelp }}</p>
        <div class="upload-buttons">
          <label class="upload-btn">
            <input type="file" accept="image/*" capture="environment" hidden disabled />
            <span>{{ copy.takePhoto }}</span>
          </label>
          <label class="upload-btn ghost">
            <input type="file" accept="image/*" hidden disabled />
            <span>{{ copy.chooseFile }}</span>
          </label>
        </div>
      </div>

      <!-- Legal footer card -->
      <div class="legal-footer-card">
        <p class="payment-note-title">{{ copy.paymentNoteTitle }}</p>
        <p class="payment-note-body">{{ copy.paymentNoteBody }}</p>
        <p class="legal-footer-text" v-html="copy.legalFooter"></p>
      </div>

    </div>
  </section>
</template>

<style scoped>
.payment-page { min-height: 100vh; padding: var(--space-lg, 2rem) 0 var(--space-xl, 4rem); background: var(--cream, #faf8f5); }
.container { max-width: 720px; margin: 0 auto; padding: 0 1.5rem; }

.demo-banner {
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 6px;
  color: #7a5c00;
  font-size: 0.82rem;
  font-weight: 500;
  padding: 0.65rem 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.card { background: var(--white, #fff); border: 1px solid var(--warm-gray-100, #e8e4df); border-radius: 8px; padding: clamp(1.5rem, 3vw, 2.5rem); margin-bottom: 1.25rem; }
.page-header { margin-bottom: 1.5rem; padding: 0 0.5rem; }
.page-header h1 { font-weight: 300; margin: 0.5rem 0 1rem; }
.lead { color: var(--warm-gray-700, #4a4540); }
.eyebrow { color: var(--warm-gray-500, #8a8078); font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; margin: 0; }
.section-title { font-size: 1.1rem; font-weight: 400; margin: 0 0 1rem; }

.amount-card { background: var(--ink, #1a1a1a); color: var(--white, #fff); border-radius: 8px; padding: 2rem; text-align: center; margin-bottom: 1.25rem; }
.amount-label { font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin: 0 0 0.5rem; }
.amount-value { font-size: 2.6rem; font-weight: 300; margin: 0; }
.amount-desc { color: rgba(255,255,255,0.7); margin-top: 0.5rem; font-size: 0.9rem; }

.method-block { margin: 1.5rem 0; padding-bottom: 1.5rem; border-bottom: 1px solid var(--warm-gray-100, #e8e4df); }
.method-block:last-of-type { border-bottom: none; }
.method-title { font-weight: 500; margin: 0 0 0.5rem; }

.qr-row { display: flex; gap: 1.5rem; align-items: center; margin-top: 1rem; flex-wrap: wrap; }
.fps-qr { width: 180px; height: 180px; border-radius: 8px; }
.qr-info { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 200px; }

.info-row { display: flex; gap: 1rem; font-size: 0.9rem; padding: 0.4rem 0; align-items: center; }
.info-row .k { color: var(--warm-gray-500, #8a8078); min-width: 110px; font-size: 0.85rem; }
.info-row .v { font-family: 'SF Mono', Menlo, monospace; font-size: 0.95rem; word-break: break-all; }
.info-row .v strong { font-family: inherit; font-weight: 500; font-size: 1.1rem; }

.ref-card { background: #fdf6e3; border: 1px solid #d4cfb8; border-radius: 6px; padding: 1rem 1.25rem; margin-top: 1rem; }
.ref-label { font-size: 0.78rem; color: #6b5a2a; margin: 0 0 0.3rem; font-weight: 500; }
.ref-value { font-family: 'SF Mono', Menlo, monospace; font-size: 1.1rem; color: #2a2826; margin: 0; }

.muted { color: var(--warm-gray-500, #8a8078); font-size: 0.85rem; }
.upload-buttons { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
.upload-btn { display: inline-block; cursor: pointer; background: var(--ink, #1a1a1a); color: var(--white, #fff); padding: 0.85rem 1.5rem; border-radius: 4px; font-size: 0.9rem; border: none; font: inherit; opacity: 0.7; }
.upload-btn.ghost { background: transparent; color: var(--ink, #1a1a1a); border: 1px solid var(--warm-gray-300, #c8c4bf); }

/* QFPay card */
.qfpay-card { border-color: #1a56db; }
.qfpay-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; }
.qfpay-logo {
  display: flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; flex-shrink: 0;
  background: #1a56db; color: #fff;
  border-radius: 8px; font-weight: 800; font-size: 0.85rem; letter-spacing: -0.02em;
}
.qfpay-btn {
  display: block; width: 100%;
  background: #1a56db; color: #fff;
  text-align: center; text-decoration: none;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 600; font-size: 1rem;
  transition: background 0.15s;
  box-sizing: border-box;
}
.qfpay-btn:hover { background: #1446b8; }
.qfpay-brands { margin: 0.65rem 0 0; font-size: 0.75rem; color: var(--warm-gray-500, #8a8078); text-align: center; }

/* Or divider */
.or-divider {
  display: flex; align-items: center; gap: 0.75rem;
  margin: 0.25rem 0 1rem;
  color: var(--warm-gray-500, #8a8078); font-size: 0.82rem;
}
.or-divider::before, .or-divider::after {
  content: ''; flex: 1;
  border-top: 1px solid var(--warm-gray-100, #e8e4df);
}
.or-divider span { white-space: nowrap; }

.legal-footer-card { background: var(--paper, #fdf9f5); border: 1px solid var(--warm-gray-100, #e8e4df); border-radius: 8px; padding: 1.25rem 1.5rem; margin-top: 0.5rem; }
.payment-note-title { font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--warm-gray-500, #8a8078); margin: 0 0 0.4rem; }
.payment-note-body { font-size: 0.88rem; color: var(--warm-gray-700, #4a4540); margin: 0 0 0.75rem; line-height: 1.6; }
.legal-footer-text { font-size: 0.82rem; color: var(--warm-gray-500, #8a8078); margin: 0; line-height: 1.6; border-top: 1px solid var(--warm-gray-100, #e8e4df); padding-top: 0.75rem; }
.legal-footer-text a { color: var(--warm-gray-700, #4a4540); text-decoration: underline; }
.legal-footer-text a:hover { color: var(--ink, #1a1a1a); }

@media (max-width: 640px) {
  .qr-row { flex-direction: column; align-items: stretch; }
  .fps-qr { width: 100%; max-width: 280px; height: auto; aspect-ratio: 1; align-self: center; }
}
</style>
