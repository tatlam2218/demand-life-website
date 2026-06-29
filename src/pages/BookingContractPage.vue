<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
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

const state = ref({ loading: true, error: '', submitting: false, success: false })
const contract = ref({ html: '', booking: null, contractData: null, landlord: {} })

const scrolledToBottom = ref(false)
const signatureMethod = ref('drawn')  // 'drawn' | 'typed'
const signatureText = ref('')
const showConfirmModal = ref(false)

// Canvas refs
const canvas = ref(null)
const drawing = ref(false)
let lastX = 0, lastY = 0
let hasDrawn = false
const canvasDataUrl = ref('')

const COPY = {
  en: {
    eyebrow: 'Tenancy agreement',
    titleAwaiting: 'Please read your tenancy agreement.',
    leadAwaiting: 'Scroll through the whole document. Once you reach the end, you will be able to sign.',
    titleSigned: 'Your contract has been signed.',
    leadSigned: 'Thank you. We have your signed agreement on file. Our team will contact you with payment details.',
    sectionRead: 'The agreement',
    sectionSign: 'Sign here',
    sectionSummary: 'Summary',
    scrollHint: 'Scroll to the end of the document to enable signing.',
    methodDrawn: 'Draw your signature',
    methodTyped: 'Type your signature',
    drawnHelp: 'Use your finger or mouse to sign in the box below.',
    typedHelp: 'Type your full name. We will render it in a handwritten style.',
    fullName: 'Full name',
    clearCanvas: 'Clear',
    submit: 'Sign and submit →',
    submitting: 'Submitting…',
    drawRequired: 'Please draw your signature before submitting.',
    typeRequired: 'Please type your full name as signature.',
    scrollRequired: 'Please scroll to the end of the agreement first.',
    confirmTitle: 'Confirm signature',
    confirmBody: 'By confirming, you legally agree to the tenancy terms above. This action cannot be undone.',
    confirmYes: 'Yes, sign now',
    confirmNo: 'Cancel',
    backHome: 'Back to homepage',
    detailsMissing: 'You need to complete your profile before signing the contract.',
    completeProfile: 'Complete profile →',
    invalidLink: 'This link is invalid or has expired.',
    summaryRoom: 'Room',
    summaryMoveIn: 'Move-in',
    summaryDuration: 'Duration',
    summaryRent: 'Monthly rent',
    summaryDeposit: 'Security deposit',
    auditHash: 'Document hash',
    auditTime: 'Signed at'
  },
  'zh-CN': {
    eyebrow: '租赁协议',
    titleAwaiting: '请阅读您的租赁协议。',
    leadAwaiting: '请完整滚动阅读全文。读完后即可签名。',
    titleSigned: '您的合同已签署。',
    leadSigned: '感谢您。我们已收到您签署的协议。团队将向您发送付款详情。',
    sectionRead: '合同正文',
    sectionSign: '签名',
    sectionSummary: '摘要',
    scrollHint: '请滚动至文末，签名按钮即会启用。',
    methodDrawn: '手绘签名',
    methodTyped: '输入签名',
    drawnHelp: '请用手指或鼠标在下方框内签名。',
    typedHelp: '输入您的全名，我们将以手写字体呈现。',
    fullName: '全名',
    clearCanvas: '清除',
    submit: '签署并提交 →',
    submitting: '提交中…',
    drawRequired: '请先签名后再提交。',
    typeRequired: '请输入您的全名作为签名。',
    scrollRequired: '请先滚动阅读完合同全文。',
    confirmTitle: '确认签名',
    confirmBody: '确认即表示您于法律上同意上述租赁条款。此操作不可撤销。',
    confirmYes: '是的，立即签署',
    confirmNo: '取消',
    backHome: '返回首页',
    detailsMissing: '签署合同前需先完成个人资料。',
    completeProfile: '补充资料 →',
    invalidLink: '此链接无效或已过期。',
    summaryRoom: '房型',
    summaryMoveIn: '入住日期',
    summaryDuration: '租期',
    summaryRent: '月租金',
    summaryDeposit: '押金',
    auditHash: '文件哈希',
    auditTime: '签署时间'
  },
  'zh-HK': {
    eyebrow: '租賃協議',
    titleAwaiting: '請閱讀您的租賃協議。',
    leadAwaiting: '請完整滾動閱讀全文。讀完後即可簽名。',
    titleSigned: '您的合約已簽署。',
    leadSigned: '感謝您。我們已收到您簽署的協議。團隊將向您發送付款詳情。',
    sectionRead: '合約正文',
    sectionSign: '簽名',
    sectionSummary: '摘要',
    scrollHint: '請滾動至文末，簽名按鈕即會啟用。',
    methodDrawn: '手繪簽名',
    methodTyped: '輸入簽名',
    drawnHelp: '請用手指或滑鼠在下方框內簽名。',
    typedHelp: '輸入您的全名，我們將以手寫字體呈現。',
    fullName: '全名',
    clearCanvas: '清除',
    submit: '簽署並提交 →',
    submitting: '提交中…',
    drawRequired: '請先簽名後再提交。',
    typeRequired: '請輸入您的全名作為簽名。',
    scrollRequired: '請先滾動閱讀完合約全文。',
    confirmTitle: '確認簽名',
    confirmBody: '確認即表示您於法律上同意上述租賃條款。此操作不可撤銷。',
    confirmYes: '是的，立即簽署',
    confirmNo: '取消',
    backHome: '返回首頁',
    detailsMissing: '簽署合約前需先完成個人資料。',
    completeProfile: '補充資料 →',
    invalidLink: '此連結無效或已過期。',
    summaryRoom: '房型',
    summaryMoveIn: '入住日期',
    summaryDuration: '租期',
    summaryRent: '月租金',
    summaryDeposit: '按金',
    auditHash: '文件雜湊',
    auditTime: '簽署時間'
  }
}
const copy = computed(() => COPY[currentLocale.value] || COPY.en)
const signed = computed(() => !!contract.value.booking?.contractSignedAt)

// ============== Scroll detection ==============
const docContainer = ref(null)
function onDocScroll(e) {
  const el = e.target
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
    scrolledToBottom.value = true
  }
}

// ============== Canvas drawing ==============
function setupCanvas() {
  const c = canvas.value
  if (!c) return
  const dpr = window.devicePixelRatio || 1
  const rect = c.getBoundingClientRect()
  c.width = rect.width * dpr
  c.height = rect.height * dpr
  const ctx = c.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#2a2826'
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, rect.width, rect.height)
}
function getPos(e) {
  const c = canvas.value
  const rect = c.getBoundingClientRect()
  const t = e.touches ? e.touches[0] : e
  return { x: t.clientX - rect.left, y: t.clientY - rect.top }
}
function startDraw(e) {
  e.preventDefault()
  const p = getPos(e)
  drawing.value = true
  lastX = p.x; lastY = p.y
}
function moveDraw(e) {
  if (!drawing.value) return
  e.preventDefault()
  const p = getPos(e)
  const ctx = canvas.value.getContext('2d')
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(p.x, p.y)
  ctx.stroke()
  lastX = p.x; lastY = p.y
  hasDrawn = true
}
function endDraw(e) {
  if (drawing.value && e) e.preventDefault()
  drawing.value = false
}
function clearCanvas() {
  setupCanvas()
  hasDrawn = false
  canvasDataUrl.value = ''
}
function getCanvasDataUrl() {
  if (!canvas.value || !hasDrawn) return ''
  return canvas.value.toDataURL('image/png')
}

// ============== Typed signature → render to canvas ==============
function renderTypedSignature() {
  // Create offscreen canvas for typed signature
  const c = document.createElement('canvas')
  c.width = 480; c.height = 120
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 480, 120)
  ctx.fillStyle = '#2a2826'
  ctx.font = "italic 600 48px 'Brush Script MT', 'Caveat', cursive"
  ctx.textBaseline = 'middle'
  const text = signatureText.value.trim()
  ctx.fillText(text, 20, 60)
  return c.toDataURL('image/png')
}

// ============== Submit ==============
function attemptSubmit() {
  state.value.error = ''
  if (!scrolledToBottom.value) {
    state.value.error = copy.value.scrollRequired
    return
  }
  if (signatureMethod.value === 'drawn') {
    if (!hasDrawn) { state.value.error = copy.value.drawRequired; return }
  } else {
    if (!signatureText.value.trim()) { state.value.error = copy.value.typeRequired; return }
  }
  showConfirmModal.value = true
}

async function doSubmit() {
  showConfirmModal.value = false
  state.value.submitting = true
  state.value.error = ''
  try {
    const sigImage = signatureMethod.value === 'drawn' ? getCanvasDataUrl() : renderTypedSignature()
    const sigText = signatureMethod.value === 'typed' ? signatureText.value.trim() : (contract.value.booking?.name || 'Tenant')
    const resp = await fetch(`/api/bookings/${bookingId.value}/sign-contract`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: token.value,
        signatureMethod: signatureMethod.value,
        signatureImage: sigImage,
        signatureText: sigText,
        scrolledToBottom: true,
        lang: currentLocale.value
      })
    })
    const data = await resp.json()
    if (resp.ok && data.success) {
      state.value.success = true
      await loadContract()  // refresh to show signed state
    } else {
      state.value.error = data.message || data.error || 'Submission failed'
    }
  } catch (err) {
    state.value.error = err.message
  } finally {
    state.value.submitting = false
  }
}

// ============== Load ==============
async function loadContract() {
  state.value.loading = true
  try {
    const resp = await fetch(`/api/bookings/${bookingId.value}/contract?token=${encodeURIComponent(token.value)}&lang=${currentLocale.value}`)
    const data = await resp.json()
    if (!resp.ok) {
      state.value.error = data.error || 'load_failed'
      return
    }
    contract.value = data
  } catch (err) {
    state.value.error = err.message
  } finally {
    state.value.loading = false
  }
}

watch(signatureMethod, async (m) => {
  if (m === 'drawn') {
    await nextTick()
    setupCanvas()
  }
})

onMounted(async () => {
  if (!bookingId.value || !token.value) {
    state.value.loading = false
    state.value.error = 'invalid_link'
    return
  }
  await loadContract()
  if (signatureMethod.value === 'drawn') {
    await nextTick()
    setupCanvas()
  }
})

function goHome() { router.push('/') }
function goDetails() {
  router.push({ path: '/book/details', query: { id: bookingId.value, token: token.value, lang: currentLocale.value } })
}
</script>

<template>
  <section class="contract-page">
    <div class="container">
      <div v-if="state.loading" class="card centered">Loading…</div>

      <div v-else-if="state.error === 'invalid_link' || state.error === 'invalid_token' || state.error === 'token_expired' || state.error === 'not_found'" class="card centered">
        <p class="eyebrow">{{ copy.eyebrow }}</p>
        <h1>{{ copy.invalidLink }}</h1>
        <button class="btn-primary" @click="goHome">{{ copy.backHome }} →</button>
      </div>

      <div v-else-if="state.error === 'details_not_submitted'" class="card centered">
        <p class="eyebrow">{{ copy.eyebrow }}</p>
        <h1>{{ copy.detailsMissing }}</h1>
        <button class="btn-primary" @click="goDetails">{{ copy.completeProfile }}</button>
      </div>

      <div v-else-if="signed" class="card">
        <p class="eyebrow">{{ copy.eyebrow }} · {{ contract.booking.id }}</p>
        <h1>{{ copy.titleSigned }}</h1>
        <p class="lead">{{ copy.leadSigned }}</p>
        <div class="audit-card">
          <div class="audit-row"><span class="audit-k">{{ copy.auditTime }}:</span><span>{{ contract.booking.contractSignedAt }}</span></div>
          <div class="audit-row"><span class="audit-k">{{ copy.auditHash }}:</span><code>{{ contract.booking.contractHash?.slice(0, 32) }}…</code></div>
        </div>
        <button class="btn-primary" @click="goHome">{{ copy.backHome }} →</button>
      </div>

      <template v-else>
        <header class="page-header">
          <p class="eyebrow">{{ copy.eyebrow }} · {{ contract.booking?.id }}</p>
          <h1>{{ copy.titleAwaiting }}</h1>
          <p class="lead">{{ copy.leadAwaiting }}</p>
        </header>

        <!-- Summary card -->
        <div class="summary-card">
          <h3>{{ copy.sectionSummary }}</h3>
          <div class="summary-grid">
            <div><span class="k">{{ copy.summaryRoom }}</span><span>{{ contract.contractData?.roomType }}</span></div>
            <div><span class="k">{{ copy.summaryMoveIn }}</span><span>{{ contract.contractData?.moveInDate }}</span></div>
            <div><span class="k">{{ copy.summaryDuration }}</span><span>{{ contract.contractData?.duration }}</span></div>
            <div><span class="k">{{ copy.summaryRent }}</span><span>HK$ {{ contract.contractData?.roomPrice }}</span></div>
            <div><span class="k">{{ copy.summaryDeposit }}</span><span>HK$ {{ contract.contractData?.depositAmount }}</span></div>
          </div>
        </div>

        <!-- Contract body -->
        <h2 class="section-h">{{ copy.sectionRead }}</h2>
        <div class="doc-container" ref="docContainer" @scroll="onDocScroll">
          <iframe :srcdoc="contract.html" class="doc-iframe" @load="(e) => {
            // Attach scroll listener to iframe content
            try {
              const iw = e.target.contentWindow;
              const checkBottom = () => {
                const doc = iw.document.documentElement;
                if (doc.scrollTop + iw.innerHeight >= doc.scrollHeight - 20) {
                  scrolledToBottom = true;
                }
              };
              iw.addEventListener('scroll', checkBottom, { passive: true });
              // Trigger once on load too — short docs may already be 'at bottom'
              setTimeout(checkBottom, 200);
            } catch (err) { /* cross-origin not applicable for srcdoc, but safe */ }
          }"></iframe>
        </div>
        <p v-if="!scrolledToBottom" class="muted scroll-hint">↓ {{ copy.scrollHint }}</p>
        <p v-else class="muted scroll-hint ok">✓ Read</p>

        <!-- Signature -->
        <h2 class="section-h">{{ copy.sectionSign }}</h2>
        <div class="sig-tabs">
          <button class="sig-tab" :class="{ active: signatureMethod === 'drawn' }" @click="signatureMethod = 'drawn'">{{ copy.methodDrawn }}</button>
          <button class="sig-tab" :class="{ active: signatureMethod === 'typed' }" @click="signatureMethod = 'typed'">{{ copy.methodTyped }}</button>
        </div>

        <div v-if="signatureMethod === 'drawn'" class="sig-block">
          <p class="muted">{{ copy.drawnHelp }}</p>
          <div class="canvas-wrap">
            <canvas
              ref="canvas"
              @mousedown="startDraw" @mousemove="moveDraw" @mouseup="endDraw" @mouseleave="endDraw"
              @touchstart="startDraw" @touchmove="moveDraw" @touchend="endDraw"
            ></canvas>
            <button class="clear-btn" @click="clearCanvas">{{ copy.clearCanvas }}</button>
          </div>
        </div>

        <div v-else class="sig-block">
          <p class="muted">{{ copy.typedHelp }}</p>
          <label>
            <span class="label-text">{{ copy.fullName }}</span>
            <input v-model="signatureText" class="signature-input" placeholder="Type your full name" />
          </label>
          <div v-if="signatureText" class="typed-preview">{{ signatureText }}</div>
        </div>

        <div v-if="state.error" class="form-error">{{ state.error }}</div>

        <div class="form-footer">
          <button class="btn-primary large" :disabled="!scrolledToBottom || state.submitting" @click="attemptSubmit">
            {{ state.submitting ? copy.submitting : copy.submit }}
          </button>
        </div>

        <!-- Confirm modal -->
        <div v-if="showConfirmModal" class="modal-overlay" @click="showConfirmModal = false">
          <div class="modal" @click.stop>
            <h3>{{ copy.confirmTitle }}</h3>
            <p>{{ copy.confirmBody }}</p>
            <div class="modal-buttons">
              <button class="btn-ghost" @click="showConfirmModal = false">{{ copy.confirmNo }}</button>
              <button class="btn-primary" @click="doSubmit">{{ copy.confirmYes }} →</button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.contract-page { min-height: 100vh; padding: var(--space-lg) 0 var(--space-xl); background: var(--cream); }
.container { max-width: 820px; }
.card, .summary-card { background: var(--white); border: 1px solid var(--warm-gray-100); border-radius: 8px; padding: clamp(1.5rem, 3vw, 2.5rem); }
.centered { text-align: center; padding: 4rem 2rem; }
.centered h1 { margin: 1rem 0; font-weight: 300; }
.page-header { margin-bottom: 1.5rem; }
.page-header h1 { font-weight: 300; margin: 0.5rem 0 1rem; }
.lead { color: var(--warm-gray-700); }
.eyebrow { color: var(--warm-gray-500); font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; margin: 0; }
.section-h { font-size: 1.1rem; font-weight: 400; margin: 2.5rem 0 1rem; padding-top: 1.5rem; border-top: 1px solid var(--warm-gray-100); }

.summary-card { margin-bottom: 1.5rem; }
.summary-card h3 { margin: 0 0 1rem; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--warm-gray-500); font-weight: 500; }
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.summary-grid > div { display: flex; gap: 1rem; font-size: 0.9rem; align-items: center; }
.summary-grid .k { color: var(--warm-gray-500); min-width: 100px; }

.doc-container {
  background: #fff;
  border: 1px solid var(--warm-gray-100);
  border-radius: 8px;
  padding: 0;
  height: 520px;
  overflow: hidden;
}
.doc-iframe {
  width: 100%; height: 100%; border: none; background: #fff;
}
.scroll-hint { font-size: 0.85rem; color: var(--warm-gray-500); margin-top: 0.5rem; }
.scroll-hint.ok { color: #2a6a4a; }

.sig-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.sig-tab {
  font: inherit; padding: 0.6rem 1.25rem; cursor: pointer;
  background: transparent; border: 1px solid var(--warm-gray-300); border-radius: 99px;
  color: var(--warm-gray-700); font-size: 0.85rem;
}
.sig-tab.active { background: var(--ink); color: var(--white); border-color: var(--ink); }

.sig-block { display: flex; flex-direction: column; gap: 0.75rem; }
.canvas-wrap { position: relative; background: #fff; border: 1px solid var(--warm-gray-300); border-radius: 6px; }
.canvas-wrap canvas { width: 100%; height: 180px; touch-action: none; display: block; border-radius: 6px; }
.clear-btn {
  position: absolute; top: 8px; right: 8px;
  font: inherit; font-size: 0.75rem;
  padding: 4px 10px; background: var(--paper); border: 1px solid var(--warm-gray-300);
  border-radius: 4px; cursor: pointer;
}
.signature-input {
  font-family: 'Brush Script MT', cursive; font-size: 1.8rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--warm-gray-300); border-radius: 4px;
}
.typed-preview {
  font-family: 'Brush Script MT', cursive; font-size: 2.4rem;
  padding: 1.25rem 1.5rem; background: #fff;
  border: 1px solid var(--warm-gray-100); border-radius: 6px; min-height: 80px;
}
.label-text { font-size: 0.85rem; color: var(--ink); display: block; margin-bottom: 0.5rem; }
.muted { color: var(--warm-gray-500); font-size: 0.85rem; }
.audit-card {
  background: var(--paper); border-radius: 6px; padding: 1rem 1.25rem;
  margin: 1.5rem 0;
  display: flex; flex-direction: column; gap: 0.5rem;
}
.audit-row { display: flex; gap: 0.75rem; font-size: 0.85rem; flex-wrap: wrap; }
.audit-k { color: var(--warm-gray-500); min-width: 110px; }
.audit-row code { font-family: 'SF Mono', Menlo, monospace; font-size: 0.78rem; }

.form-error { background: #fdf3f3; border: 1px solid #e0c8c8; padding: 1rem 1.25rem; border-radius: 4px; color: #6b4444; margin-top: 1.5rem; }
.form-footer { display: flex; justify-content: flex-end; margin-top: 2rem; }
.btn-primary { background: var(--ink); color: var(--white); padding: 0.85rem 2rem; border-radius: 4px; border: none; cursor: pointer; font: inherit; letter-spacing: 0.04em; }
.btn-primary.large { padding: 1.1rem 2.5rem; font-size: 1rem; }
.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-ghost { background: transparent; color: var(--ink); padding: 0.85rem 2rem; border: 1px solid var(--warm-gray-300); border-radius: 4px; cursor: pointer; font: inherit; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; }
.modal { background: var(--white); border-radius: 8px; padding: 2rem; max-width: 480px; width: 100%; }
.modal h3 { margin: 0 0 1rem; font-weight: 400; }
.modal p { color: var(--warm-gray-700); }
.modal-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }

@media (max-width: 640px) {
  .summary-grid { grid-template-columns: 1fr; }
  .doc-container { height: 400px; }
}
</style>
