<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentLocale, useI18n } from '../i18n'

const route = useRoute()
const router = useRouter()
useI18n()

const urlLang = route.query.lang
if (urlLang === 'en' || urlLang === 'zh-CN' || urlLang === 'zh-HK') {
  currentLocale.value = urlLang
}

const bookingId = ref(route.query.id || '')
const token = ref(route.query.token || '')
const requestId = ref(route.query.request || '')

const state = ref({
  loading: true, error: '', uploading: false, success: false,
  // Local-only state: holds the picked file & preview before user hits Submit
  pickedFile: null, previewUrl: '', submitting: false
})
const data = ref({ booking: null, paymentRequest: null, landlord: {} })

const COPY = {
  en: {
    eyebrow: 'Payment',
    title: 'Complete your payment',
    leadAwaiting: 'Please pay the amount below via FPS (Faster Payment System) or bank transfer, then upload a screenshot of the confirmation.',
    leadSubmitted: 'Thank you. We have received your screenshot. Our team will verify the payment shortly.',
    leadApproved: 'This payment has been confirmed. Thank you!',
    amount: 'Amount due',
    method: 'How to pay',
    methodFPS: 'FPS (recommended)',
    methodBank: 'Bank transfer',
    scanQR: 'Scan the QR code below in any HK bank app, or send to the FPS ID directly.',
    bank: 'Bank',
    account: 'Account number',
    accountName: 'Account name',
    fpsId: 'FPS ID',
    referenceLabel: 'Important — include this reference in your transfer note',
    uploadTitle: 'Upload payment screenshot',
    uploadHelp: 'Please upload the screenshot showing the successful transfer.',
    submitBtn: 'Submit →',
    submittingBtn: 'Submitting…',
    retake: 'Choose another',
    chooseFile: 'Choose file',
    takePhoto: 'Take photo',
    uploading: 'Uploading…',
    invalidLink: 'This payment link is invalid or has expired.',
    submitted: 'Screenshot uploaded',
    submittedBody: 'Our team will review and confirm within one business day. You will receive an email once verified.',
    approved: 'Payment confirmed',
    approvedBody: 'Thank you. Your payment has been verified.',
    backHome: 'Back to homepage'
  },
  'zh-CN': {
    eyebrow: '付款',
    title: '完成您的付款',
    leadAwaiting: '请通过 FPS（转数快）或银行转账支付以下金额，然后上传付款截图。',
    leadSubmitted: '感谢您。我们已收到付款截图，团队会尽快核对。',
    leadApproved: '此笔付款已确认，谢谢！',
    amount: '应付金额',
    method: '付款方式',
    methodFPS: 'FPS 转数快（推荐）',
    methodBank: '银行转账',
    scanQR: '请用任何香港银行 App 扫描下方二维码，或直接转账至 FPS ID。',
    bank: '银行',
    account: '账号',
    accountName: '账户名',
    fpsId: 'FPS ID',
    referenceLabel: '重要 — 请在转账备注中包含此参考编号',
    uploadTitle: '上传付款截图',
    uploadHelp: '请上传显示成功转账的截图。',
    submitBtn: '提交 →',
    submittingBtn: '提交中…',
    retake: '重新选择',
    chooseFile: '选择文件',
    takePhoto: '拍照',
    uploading: '上传中…',
    invalidLink: '此付款链接无效或已过期。',
    submitted: '截图已上传',
    submittedBody: '团队将于一个工作日内核对并确认。核对完成后您会收到邮件通知。',
    approved: '付款已确认',
    approvedBody: '感谢您，付款已确认。',
    backHome: '返回首页'
  },
  'zh-HK': {
    eyebrow: '付款',
    title: '完成您的付款',
    leadAwaiting: '請透過 FPS（轉數快）或銀行轉賬支付以下金額，然後上載付款截圖。',
    leadSubmitted: '感謝您。我們已收到付款截圖，團隊會盡快核對。',
    leadApproved: '此筆付款已確認，謝謝！',
    amount: '應付金額',
    method: '付款方式',
    methodFPS: 'FPS 轉數快（建議）',
    methodBank: '銀行轉賬',
    scanQR: '請用任何香港銀行 App 掃描下方二維碼，或直接轉賬至 FPS ID。',
    bank: '銀行',
    account: '賬號',
    accountName: '賬戶名',
    fpsId: 'FPS ID',
    referenceLabel: '重要 — 請於轉賬備註中包含此參考編號',
    uploadTitle: '上載付款截圖',
    uploadHelp: '請上載顯示成功轉賬的截圖。',
    submitBtn: '提交 →',
    submittingBtn: '提交中…',
    retake: '重新選擇',
    chooseFile: '選擇檔案',
    takePhoto: '拍照',
    uploading: '上載中…',
    invalidLink: '此付款連結無效或已過期。',
    submitted: '截圖已上載',
    submittedBody: '團隊將於一個工作天內核對並確認。核對完成後您會收到電郵通知。',
    approved: '付款已確認',
    approvedBody: '感謝您，付款已確認。',
    backHome: '返回首頁'
  }
}
const copy = computed(() => COPY[currentLocale.value] || COPY.en)
const status = computed(() => data.value.paymentRequest?.status || 'awaiting')

async function compressImage(file, maxDim = 1600, targetBytes = 250 * 1024) {
  const imgUrl = URL.createObjectURL(file)
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = imgUrl })
  const long = Math.max(img.width, img.height)
  const scale = long > maxDim ? maxDim / long : 1
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  c.getContext('2d').drawImage(img, 0, 0, w, h)
  URL.revokeObjectURL(imgUrl)
  let q = 0.82
  let blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', q))
  while (blob && blob.size > targetBytes && q > 0.5) { q -= 0.1; blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', q)) }
  return blob
}
async function blobToDataUrl(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob) })
}

// User picks a file — we don't upload yet, just compress + preview locally.
async function handleUpload(file) {
  if (!file) return
  state.value.uploading = true
  state.value.error = ''
  try {
    const blob = await compressImage(file)
    const dataUrl = await blobToDataUrl(blob)
    state.value.pickedFile = dataUrl
    state.value.previewUrl = dataUrl
  } catch (err) {
    state.value.error = err.message
  } finally {
    state.value.uploading = false
  }
}

function clearPicked() {
  state.value.pickedFile = null
  state.value.previewUrl = ''
  state.value.error = ''
}

// User confirms by clicking the Submit button — NOW we POST to the server.
async function submitPayment() {
  if (!state.value.pickedFile || state.value.submitting) return
  state.value.submitting = true
  state.value.error = ''
  try {
    const resp = await fetch(`/api/bookings/${bookingId.value}/upload-payment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: token.value, request: requestId.value, dataUrl: state.value.pickedFile })
    })
    const r = await resp.json()
    if (resp.ok && r.success) {
      // Hand-off to the dedicated success page.
      router.push({
        path: '/book/payment-success',
        query: { id: bookingId.value, lang: currentLocale.value, request: requestId.value }
      })
    } else {
      state.value.error = r.message || r.error || 'Upload failed'
    }
  } catch (err) {
    state.value.error = err.message
  } finally {
    state.value.submitting = false
  }
}

async function load() {
  state.value.loading = true
  try {
    let url = `/api/bookings/${bookingId.value}/payment-info?token=${encodeURIComponent(token.value)}`
    if (requestId.value) url += `&request=${requestId.value}`
    const resp = await fetch(url)
    const r = await resp.json()
    if (!resp.ok) {
      state.value.error = r.error || 'load_failed'
      return
    }
    data.value = r
    if (!requestId.value) requestId.value = r.paymentRequest.requestId
  } catch (err) {
    state.value.error = err.message
  } finally {
    state.value.loading = false
  }
}

onMounted(load)
function goHome() { router.push('/') }
</script>

<template>
  <section class="payment-page dl-form">
    <div class="container">
      <div v-if="state.loading" class="card centered">Loading…</div>

      <div v-else-if="state.error === 'invalid_token' || state.error === 'not_found' || state.error === 'no_payment_request'" class="card centered">
        <p class="eyebrow">{{ copy.eyebrow }}</p>
        <h1>{{ copy.invalidLink }}</h1>
        <button class="btn-primary" @click="goHome">{{ copy.backHome }} →</button>
      </div>

      <div v-else-if="status === 'approved'" class="card centered">
        <p class="eyebrow">{{ copy.eyebrow }} · {{ data.booking?.id }}</p>
        <h1>{{ copy.approved }}</h1>
        <p class="lead">{{ copy.approvedBody }}</p>
        <button class="btn-primary" @click="goHome">{{ copy.backHome }} →</button>
      </div>

      <template v-else>
        <header class="page-header">
          <p class="eyebrow">{{ copy.eyebrow }} · {{ data.booking?.id }}</p>
          <h1>{{ copy.title }}</h1>
          <p class="lead">
            <template v-if="status === 'awaiting'">{{ copy.leadAwaiting }}</template>
            <template v-else>{{ copy.leadSubmitted }}</template>
          </p>
        </header>

        <!-- Amount -->
        <div class="amount-card">
          <p class="amount-label">{{ copy.amount }}</p>
          <p class="amount-value">HK$ {{ data.paymentRequest?.amount?.toLocaleString() }}</p>
          <p v-if="data.paymentRequest?.description" class="amount-desc">{{ data.paymentRequest.description }}</p>
        </div>

        <!-- Payment instructions -->
        <div class="card">
          <h3 class="section-title">{{ copy.method }}</h3>

          <div class="method-block">
            <p class="method-title">{{ copy.methodFPS }}</p>
            <p class="muted">{{ copy.scanQR }}</p>
            <div class="qr-row">
              <img src="/payment/fps-qr.jpg" alt="FPS QR" class="fps-qr" />
              <div class="qr-info">
                <div class="info-row"><span class="k">{{ copy.fpsId }}</span><span class="v"><strong>{{ data.landlord.fpsId || '115403669' }}</strong></span></div>
                <div class="info-row"><span class="k">{{ copy.accountName }}</span><span class="v">{{ data.landlord.bankAccountName || 'Demain Culture Limited' }}</span></div>
              </div>
            </div>
          </div>

          <div class="method-block">
            <p class="method-title">{{ copy.methodBank }}</p>
            <div class="info-row"><span class="k">{{ copy.bank }}</span><span class="v">{{ data.landlord.bankName || 'ZA Bank' }}</span></div>
            <div class="info-row"><span class="k">{{ copy.account }}</span><span class="v"><strong>{{ data.landlord.bankAccountNumber || '882002273557' }}</strong></span></div>
            <div class="info-row"><span class="k">{{ copy.accountName }}</span><span class="v">{{ data.landlord.bankAccountName || 'Demain Culture Limited' }}</span></div>
          </div>

          <div class="ref-card">
            <p class="ref-label">{{ copy.referenceLabel }}</p>
            <p class="ref-value">{{ data.booking?.id }}</p>
          </div>
        </div>

        <!-- Upload -->
        <div class="card">
          <h3 class="section-title">{{ copy.uploadTitle }}</h3>
          <p class="muted">{{ copy.uploadHelp }}</p>

          <div v-if="(data.paymentRequest?.screenshots || []).length" class="screenshots">
            <div v-for="(s, i) in data.paymentRequest.screenshots" :key="i" class="screenshot-item">
              ✓ {{ s.fileName }}
            </div>
          </div>

          <!-- If user has picked a file: show preview + Submit button. Otherwise: show pickers. -->
          <template v-if="state.pickedFile">
            <div class="preview-wrap">
              <img :src="state.previewUrl" alt="Payment screenshot preview" class="preview-img" />
            </div>
            <div class="upload-buttons">
              <button class="upload-btn ghost" :disabled="state.submitting" @click="clearPicked">{{ copy.retake }}</button>
              <button class="upload-btn primary" :disabled="state.submitting" @click="submitPayment">
                {{ state.submitting ? copy.submittingBtn : copy.submitBtn }}
              </button>
            </div>
          </template>
          <template v-else>
            <div class="upload-buttons">
              <label class="upload-btn">
                <input type="file" accept="image/*" capture="environment" @change="(e) => handleUpload(e.target.files[0])" hidden />
                <span>{{ state.uploading ? copy.uploading : copy.takePhoto }}</span>
              </label>
              <label class="upload-btn ghost">
                <input type="file" accept="image/*" @change="(e) => handleUpload(e.target.files[0])" hidden />
                <span>{{ copy.chooseFile }}</span>
              </label>
            </div>
          </template>

          <div v-if="state.error" class="form-error">{{ state.error }}</div>
        </div>

        <div v-if="status !== 'awaiting'" class="info-banner ok">
          ✓ {{ copy.submitted }} — {{ copy.submittedBody }}
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.payment-page { min-height: 100vh; padding: var(--space-lg) 0 var(--space-xl); background: var(--cream); }
.container { max-width: 720px; }
.card { background: var(--white); border: 1px solid var(--warm-gray-100); border-radius: 8px; padding: clamp(1.5rem, 3vw, 2.5rem); margin-bottom: 1.25rem; }
.centered { text-align: center; padding: 4rem 2rem; }
.centered h1 { margin: 1rem 0; font-weight: 300; }
.page-header { margin-bottom: 1.5rem; padding: 0 0.5rem; }
.page-header h1 { font-weight: 300; margin: 0.5rem 0 1rem; }
.lead { color: var(--warm-gray-700); }
.eyebrow { color: var(--warm-gray-500); font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; margin: 0; }
.section-title { font-size: 1.1rem; font-weight: 400; margin: 0 0 1rem; }

.amount-card {
  background: var(--ink); color: var(--white); border-radius: 8px;
  padding: 2rem; text-align: center; margin-bottom: 1.25rem;
}
.amount-label { font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin: 0 0 0.5rem; }
.amount-value { font-size: 2.6rem; font-weight: 300; margin: 0; }
.amount-desc { color: rgba(255,255,255,0.7); margin-top: 0.5rem; font-size: 0.9rem; }

.method-block { margin: 1.5rem 0; padding-bottom: 1.5rem; border-bottom: 1px solid var(--warm-gray-100); }
.method-block:last-of-type { border-bottom: none; }
.method-title { font-weight: 500; margin: 0 0 0.5rem; }

.qr-row { display: flex; gap: 1.5rem; align-items: center; margin-top: 1rem; flex-wrap: wrap; }
.fps-qr { width: 180px; height: 180px; border-radius: 8px; }
.qr-info { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 200px; }

.info-row { display: flex; gap: 1rem; font-size: 0.9rem; padding: 0.4rem 0; align-items: center; }
.info-row .k { color: var(--warm-gray-500); min-width: 110px; font-size: 0.85rem; }
.info-row .v { font-family: 'SF Mono', Menlo, monospace; font-size: 0.95rem; word-break: break-all; }
.info-row .v strong { font-family: inherit; font-weight: 500; font-size: 1.1rem; }

.ref-card {
  background: #fdf6e3; border: 1px solid #d4cfb8; border-radius: 6px;
  padding: 1rem 1.25rem; margin-top: 1rem;
}
.ref-label { font-size: 0.78rem; color: #6b5a2a; margin: 0 0 0.3rem; font-weight: 500; }
.ref-value { font-family: 'SF Mono', Menlo, monospace; font-size: 1.1rem; color: #2a2826; margin: 0; }

.muted { color: var(--warm-gray-500); font-size: 0.85rem; }
.upload-buttons { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
.upload-btn { display: inline-block; cursor: pointer; background: var(--ink); color: var(--white); padding: 0.85rem 1.5rem; border-radius: 4px; font-size: 0.9rem; border: none; font: inherit; }
.upload-btn.primary { background: var(--ink); color: var(--white); }
.upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.preview-wrap { margin: 1rem 0 1.25rem; padding: 0.75rem; background: #fafaf7; border: 1px solid #e8e6e1; border-radius: 6px; text-align: center; }
.preview-img { max-width: 100%; max-height: 360px; object-fit: contain; border-radius: 4px; }
.upload-btn.ghost { background: transparent; color: var(--ink); border: 1px solid var(--warm-gray-300); }
.upload-btn:hover { opacity: 0.85; }
.screenshots { background: var(--paper); border-radius: 6px; padding: 0.85rem 1rem; margin: 1rem 0; }
.screenshot-item { font-size: 0.85rem; color: #2a6a4a; padding: 0.25rem 0; }

.info-banner { padding: 1rem 1.25rem; border-radius: 6px; font-size: 0.9rem; }
.info-banner.ok { background: #ecf5ec; color: #2a6a4a; }
.form-error { background: #fdf3f3; border: 1px solid #e0c8c8; padding: 1rem 1.25rem; border-radius: 4px; color: #6b4444; margin-top: 1rem; }
.btn-primary { background: var(--ink); color: var(--white); padding: 0.85rem 2rem; border-radius: 4px; border: none; cursor: pointer; font: inherit; }
.btn-primary:hover { opacity: 0.85; }

@media (max-width: 640px) {
  .qr-row { flex-direction: column; align-items: stretch; }
  .fps-qr { width: 100%; max-width: 280px; height: auto; aspect-ratio: 1; align-self: center; }
}
</style>
