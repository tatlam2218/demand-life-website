<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
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

const state = ref({
  loading: true,
  error: '',
  contract: null,        // server-rendered data
  withdrawn: false,      // admin recalled the contract; show "please wait" notice
  withdrawnMessage: '',
  scrolledToBottom: false,
  signatureMode: 'typed', // 'typed' | 'drawn'
  typedName: '',
  drawnDataUrl: '',
  submitting: false,
  signed: false
})

const COPY = {
  en: {
    eyebrow: 'Sign your tenancy agreement',
    title: 'Please read the agreement below.',
    sub: 'Scroll all the way to the bottom to enable the signature.',
    scrollHint: 'Scroll to the bottom to continue',
    summary: 'Quick summary',
    monthly: 'Monthly rent',
    deposit: 'Deposit',
    firstMonth: 'First month',
    total: 'Total prepayment',
    moveIn: 'Move-in',
    moveOut: 'Move-out',
    signMethod: 'How would you like to sign?',
    typed: 'Type my name',
    drawn: 'Draw signature',
    typedPlaceholder: 'Type your full legal name',
    drawnHint: 'Use your finger or mouse to sign in the box',
    clear: 'Clear',
    consent: 'By signing below I confirm I have read, understood and agree to all terms of this Agreement, and that the personal information I have submitted is accurate.',
    submit: 'Sign and submit',
    submitting: 'Submitting…',
    alreadySigned: 'This agreement has already been signed.',
    successTitle: 'Thank you. The agreement is signed.',
    successBody: 'A copy has been emailed to you and saved to your booking. We will be in touch shortly about payment and check-in.',
    viewContract: 'View signed contract →',
    backHome: 'Back to homepage',
    invalidLink: 'This link is invalid or has expired.',
    needDetails: 'Please complete your profile form first.',
    signLabel: 'Signature',
    contractNumber: 'Contract no.',
    contractDate: 'Date',
    hkd: 'HK$ ',
    months: 'months'
  },
  'zh-CN': {
    eyebrow: '签署租约',
    title: '请阅读以下租约。',
    sub: '请滑动到页面底部以启用签名功能。',
    scrollHint: '请滑动到底部以继续',
    summary: '快速摘要',
    monthly: '月租金',
    deposit: '保证金',
    firstMonth: '首月房租',
    total: '入住前需付总额',
    moveIn: '入住日期',
    moveOut: '退租日期',
    signMethod: '您希望如何签署？',
    typed: '输入姓名',
    drawn: '手绘签名',
    typedPlaceholder: '请输入您的法定全名',
    drawnHint: '请用手指或鼠标在框内签名',
    clear: '清除',
    consent: '签署即确认已阅读、理解并同意本协议全部条款，且所提交之个人资料属实。',
    submit: '签署并提交',
    submitting: '提交中…',
    alreadySigned: '此协议已签署。',
    successTitle: '感谢您，协议已签署。',
    successBody: '我们已将一份副本发送到您的邮箱并保存至您的预订档案。团队将很快就付款与入住事宜与您联系。',
    viewContract: '查看已签署合同 →',
    backHome: '返回首页',
    invalidLink: '此链接无效或已过期。',
    needDetails: '请先完成您的入住资料表单。',
    signLabel: '签名',
    contractNumber: '合同编号',
    contractDate: '日期',
    hkd: '港币 ',
    months: '个月'
  },
  'zh-HK': {
    eyebrow: '簽署租約',
    title: '請閱讀以下租約。',
    sub: '請滑動至頁面底部以啟用簽名功能。',
    scrollHint: '請滑動至底部以繼續',
    summary: '快速摘要',
    monthly: '月租金',
    deposit: '按金',
    firstMonth: '首月租金',
    total: '入住前需付總額',
    moveIn: '入住日期',
    moveOut: '退租日期',
    signMethod: '您希望如何簽署？',
    typed: '輸入姓名',
    drawn: '手繪簽名',
    typedPlaceholder: '請輸入您的法定全名',
    drawnHint: '請用手指或滑鼠在框內簽名',
    clear: '清除',
    consent: '簽署即確認已閱讀、理解並同意本協議全部條款，且所提交之個人資料屬實。',
    submit: '簽署並提交',
    submitting: '提交中…',
    alreadySigned: '此協議已簽署。',
    successTitle: '感謝您，協議已簽署。',
    successBody: '我們已將一份副本傳送至您的電郵並儲存至您的預訂檔案。團隊將很快就付款與入住事宜與您聯絡。',
    viewContract: '查看已簽署合約 →',
    backHome: '返回首頁',
    invalidLink: '此連結無效或已過期。',
    needDetails: '請先完成您的入住資料表單。',
    signLabel: '簽名',
    contractNumber: '合約編號',
    contractDate: '日期',
    hkd: '港幣 ',
    months: '個月'
  }
}

const copy = computed(() => COPY[currentLocale.value] || COPY.en)

// Format HK currency
function fmt(n) {
  if (n == null) return ''
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// ============== Canvas signature ==============
const canvasRef = ref(null)
let ctx = null
let isDrawing = false
let lastPos = null
let drawnAny = false

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  // Set actual pixel size for crisp lines
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.strokeStyle = '#2a2826'
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function canvasPos(ev) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  let clientX, clientY
  if (ev.touches && ev.touches[0]) {
    clientX = ev.touches[0].clientX
    clientY = ev.touches[0].clientY
  } else {
    clientX = ev.clientX
    clientY = ev.clientY
  }
  return { x: clientX - rect.left, y: clientY - rect.top }
}

function startDraw(ev) {
  ev.preventDefault()
  if (!ctx) initCanvas()
  isDrawing = true
  lastPos = canvasPos(ev)
}
function moveDraw(ev) {
  if (!isDrawing) return
  ev.preventDefault()
  const p = canvasPos(ev)
  ctx.beginPath()
  ctx.moveTo(lastPos.x, lastPos.y)
  ctx.lineTo(p.x, p.y)
  ctx.stroke()
  lastPos = p
  drawnAny = true
}
function endDraw() {
  isDrawing = false
  if (drawnAny) {
    state.value.drawnDataUrl = canvasRef.value.toDataURL('image/png')
  }
}
function clearCanvas() {
  if (!ctx || !canvasRef.value) return
  const canvas = canvasRef.value
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawnAny = false
  state.value.drawnDataUrl = ''
}

// ============== Scroll-to-bottom detection ==============
// Two paths to enable signing (whichever fires first):
//   A) IntersectionObserver on a sentinel after the contract body
//   B) Window scroll listener: when user is within 80px of page bottom
//   C) If the contract content is short enough to fit the viewport, enable immediately on load
const contractIframeRef = ref(null)
const scrollDoneRef = ref(null)

function onIntersect(entries) {
  for (const e of entries) {
    if (e.isIntersecting) {
      state.value.scrolledToBottom = true
    }
  }
}

function onWindowScroll() {
  // If user is near the bottom (within 80px), consider them "scrolled to bottom".
  const scrolled = window.innerHeight + window.scrollY
  const total = document.documentElement.scrollHeight
  if (total - scrolled < 80) {
    state.value.scrolledToBottom = true
  }
}

let observer = null
function setupScrollObserver() {
  if (!scrollDoneRef.value) {
    // If sentinel isn't even in the DOM, content is short — just enable.
    state.value.scrolledToBottom = true
    return
  }
  // 1. Check immediately: if sentinel is already in viewport (short contract), enable now.
  const rect = scrollDoneRef.value.getBoundingClientRect()
  if (rect.top < window.innerHeight) {
    state.value.scrolledToBottom = true
  }
  // 2. Set up observer for the scroll-into-view case.
  observer = new IntersectionObserver(onIntersect, { threshold: 0, rootMargin: '0px 0px 200px 0px' })
  observer.observe(scrollDoneRef.value)
  // 3. Belt-and-suspenders: also a plain scroll listener on window.
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  // 4. Final fallback: check again after a tick in case layout hadn't settled.
  setTimeout(onWindowScroll, 300)
}

// ============== Load ==============
onMounted(async () => {
  if (!bookingId.value || !token.value) {
    state.value.loading = false
    state.value.error = 'invalid_link'
    return
  }
  try {
    const resp = await fetch(`/api/contracts/${bookingId.value}/data?token=${encodeURIComponent(token.value)}&lang=${currentLocale.value}`)
    const data = await resp.json()
    if (!resp.ok) {
      state.value.error = data.error || 'invalid_link'
      return
    }
    // Contract has been withdrawn by admin — link still valid, but no contract to sign right now.
    if (data.withdrawn) {
      state.value.withdrawn = true
      state.value.withdrawnMessage = data.message || 'The contract has been recalled by staff. A new version will be sent to you shortly.'
      return
    }
    state.value.contract = data
    if (data.alreadySigned) {
      state.value.signed = true
    }
    // Pre-fill typed signature with the name from the contract
    state.value.typedName = data.name || ''
    // Wait until DOM renders contract body (via v-html), then attach observer
    await nextTick()
    setupScrollObserver()
  } catch (err) {
    state.value.error = err.message
  } finally {
    state.value.loading = false
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  window.removeEventListener('scroll', onWindowScroll)
})

// ============== Language switch ==============
async function switchLang(newLang) {
  if (newLang === currentLocale.value) return
  currentLocale.value = newLang
  // Reload contract content in the new language
  state.value.loading = true
  state.value.scrolledToBottom = false
  try {
    const resp = await fetch(`/api/contracts/${bookingId.value}/data?token=${encodeURIComponent(token.value)}&lang=${newLang}`)
    const data = await resp.json()
    if (!resp.ok) {
      state.value.error = data.error || 'invalid_link'
      return
    }
    if (data.withdrawn) {
      state.value.withdrawn = true
      state.value.withdrawnMessage = data.message || ''
      return
    }
    state.value.contract = data
    // Update URL query without reload
    const url = new URL(window.location.href)
    url.searchParams.set('lang', newLang)
    window.history.replaceState({}, '', url.toString())
    await nextTick()
    setupScrollObserver()
  } catch (err) {
    state.value.error = err.message
  } finally {
    state.value.loading = false
  }
}

const canSign = computed(() => {
  if (!state.value.scrolledToBottom) return false
  if (state.value.signatureMode === 'typed') return !!state.value.typedName.trim()
  return !!state.value.drawnDataUrl
})

// ============== Submit ==============
async function submit() {
  if (!canSign.value) return
  state.value.submitting = true
  state.value.error = ''
  try {
    const body = {
      token: token.value,
      lang: currentLocale.value,
      signatureMethod: state.value.signatureMode,
      signatureName: state.value.typedName.trim(),
      signatureImage: state.value.signatureMode === 'drawn' ? state.value.drawnDataUrl : '',
      scrolledToBottom: state.value.scrolledToBottom
    }
    const resp = await fetch(`/api/contracts/${bookingId.value}/sign`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await resp.json()
    if (resp.ok && data.success) {
      state.value.signed = true
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      state.value.error = data.error || 'sign_failed'
    }
  } catch (err) {
    state.value.error = err.message
  } finally {
    state.value.submitting = false
  }
}

function viewSigned() {
  const url = `/api/contracts/${bookingId.value}/view?token=${encodeURIComponent(token.value)}&lang=${currentLocale.value}`
  window.open(url, '_blank')
}

function goHome() { router.push('/') }

// Watch mode change to init canvas when needed
function switchMode(m) {
  state.value.signatureMode = m
  if (m === 'drawn') {
    nextTick(() => initCanvas())
  }
}
</script>

<template>
  <section class="sign-page dl-form">
    <div class="container">
      <!-- Loading -->
      <div v-if="state.loading" class="loading-card">Loading…</div>

      <!-- Error -->
      <div v-else-if="state.error && !state.signed" class="card error-card">
        <p class="eyebrow">{{ copy.eyebrow }}</p>
        <h1>{{ state.error === 'details_required' ? copy.needDetails : copy.invalidLink }}</h1>
        <button class="btn-primary" @click="goHome">{{ copy.backHome }} →</button>
      </div>

      <!-- Contract withdrawn by admin — link still valid, just paused -->
      <div v-else-if="state.withdrawn" class="card withdrawn-card">
        <p class="eyebrow">{{ copy.eyebrow }} · {{ bookingId }}</p>
        <div class="withdrawn-icon">⏸</div>
        <h1>Contract paused</h1>
        <p class="lead">{{ state.withdrawnMessage }}</p>
        <p class="muted" style="font-size: 0.9rem; margin-top: 1.5rem;">
          You'll receive an email or message from Demain Life staff once the new version is ready. You can keep this link — it will start working again automatically.
        </p>
      </div>

      <!-- Success -->
      <div v-else-if="state.signed" class="card success-card">
        <p class="eyebrow">{{ copy.eyebrow }} · {{ bookingId }}</p>
        <h1>{{ copy.successTitle }}</h1>
        <p class="lead">{{ copy.successBody }}</p>
        <div class="success-buttons">
          <button class="btn-primary" @click="viewSigned">{{ copy.viewContract }}</button>
          <button class="btn-secondary" @click="goHome">{{ copy.backHome }} →</button>
        </div>
      </div>

      <!-- Main -->
      <div v-else class="card">
        <header class="form-header">
          <div class="lang-switch">
            <button :class="{ active: currentLocale === 'en' }" @click="switchLang('en')">English</button>
            <button :class="{ active: currentLocale === 'zh-HK' }" @click="switchLang('zh-HK')">繁體中文</button>
          </div>
          <p class="eyebrow">{{ copy.eyebrow }} · {{ state.contract?.id }}</p>
          <h1>{{ copy.title }}</h1>
          <p class="lead">{{ copy.sub }}</p>
        </header>

        <!-- Money summary -->
        <!-- Quick Summary removed — contract body itself contains all amounts and dates. -->

        <!-- Contract body — rendered inline (no iframe) -->
        <div class="contract-frame-wrap">
          <div class="contract-body" v-html="state.contract && (state.contract.bodyHtml || state.contract.html)"></div>
          <div ref="scrollDoneRef" class="scroll-sentinel"></div>
        </div>

        <div v-if="!state.scrolledToBottom" class="scroll-hint">↓ {{ copy.scrollHint }}</div>

        <!-- Signature section, only enabled after scroll -->
        <div class="signature-section" :class="{ disabled: !state.scrolledToBottom }">
          <h3>{{ copy.signMethod }}</h3>

          <div class="mode-tabs">
            <button :class="{ active: state.signatureMode === 'typed' }" @click="switchMode('typed')">{{ copy.typed }}</button>
            <button :class="{ active: state.signatureMode === 'drawn' }" @click="switchMode('drawn')">{{ copy.drawn }}</button>
          </div>

          <div v-if="state.signatureMode === 'typed'" class="typed-box">
            <input v-model="state.typedName" :placeholder="copy.typedPlaceholder" class="signature-input" :disabled="!state.scrolledToBottom" />
            <div class="typed-preview">{{ state.typedName }}</div>
          </div>

          <div v-else class="drawn-box">
            <p class="muted">{{ copy.drawnHint }}</p>
            <canvas
              ref="canvasRef"
              class="signature-canvas"
              :class="{ disabled: !state.scrolledToBottom }"
              @mousedown="startDraw" @mousemove="moveDraw" @mouseup="endDraw" @mouseleave="endDraw"
              @touchstart="startDraw" @touchmove="moveDraw" @touchend="endDraw"
            ></canvas>
            <div class="canvas-actions">
              <button class="mini-btn" @click="clearCanvas">{{ copy.clear }}</button>
            </div>
            <!-- Also need a typed name even for drawn (for the contract text) -->
            <input v-model="state.typedName" :placeholder="copy.typedPlaceholder" class="signature-name-input" :disabled="!state.scrolledToBottom" />
          </div>

          <p class="consent muted">{{ copy.consent }}</p>

          <div v-if="state.error" class="form-error">{{ state.error }}</div>

          <button class="btn-primary large" :disabled="!canSign || state.submitting" @click="submit">
            {{ state.submitting ? copy.submitting : (copy.submit + ' →') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sign-page { min-height: 100vh; padding: var(--space-lg) 0 var(--space-xl); background: var(--cream); }
.container { max-width: 880px; }
.card { background: var(--white); border: 1px solid var(--warm-gray-100); border-radius: 8px; padding: clamp(2rem, 5vw, 4rem); }
.loading-card, .error-card, .success-card, .withdrawn-card { text-align: center; padding: 4rem 2rem; background: var(--white); border-radius: 8px; }
.withdrawn-card .withdrawn-icon { font-size: 3rem; color: var(--warm-gray-500, #8a8780); margin-bottom: 1rem; }
.withdrawn-card h1 { margin: 1rem 0; font-weight: 300; }
.success-card h1, .error-card h1 { margin: 1rem 0; font-weight: 300; }
.success-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem; }
.btn-secondary { background: transparent; border: 1px solid var(--ink); color: var(--ink); padding: 0.85rem 2rem; border-radius: 4px; cursor: pointer; font: inherit; }

.form-header { margin-bottom: 2rem; }
.form-header h1 { margin: 0.5rem 0 1rem; font-weight: 300; }
.lead { color: var(--warm-gray-700); }
.eyebrow { color: var(--warm-gray-500); font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; margin: 0; }

.money-summary { background: var(--paper); padding: 1.5rem; border-radius: 6px; margin-bottom: 2rem; }
.summary-title { margin: 0 0 1rem; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--warm-gray-700); }
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem 2rem; }
.summary-grid > div { display: flex; justify-content: space-between; font-size: 0.95rem; }
.summary-grid .k { color: var(--warm-gray-700); }
.summary-grid .v { font-weight: 500; }
.summary-grid .total { grid-column: 1 / -1; padding-top: 0.75rem; border-top: 1px solid var(--warm-gray-100); margin-top: 0.5rem; font-size: 1.05rem; }
.summary-grid .total .v { font-size: 1.2rem; }

.contract-frame-wrap { position: relative; }
.contract-body {
  background: #fff;
  border: 1px solid var(--warm-gray-300);
  border-radius: 4px;
  padding: 2.5rem 2.5rem;
  margin: 0;
  font-family: -apple-system, "Segoe UI", "PingFang HK", "Microsoft YaHei", "Helvetica Neue", sans-serif;
  color: #2a2826;
  line-height: 1.7;
  font-size: 0.95rem;
}
/* Style the contract HTML inside */
.contract-body :deep(h1) { font-size: 1.4rem; font-weight: 400; text-align: center; margin: 0 0 0.5rem; letter-spacing: -0.01em; }
.contract-body :deep(h2) { font-size: 1.05rem; font-weight: 500; margin: 1.4rem 0 0.5rem; color: #2a2826; }
.contract-body :deep(h3) { font-size: 0.95rem; font-weight: 500; margin: 1rem 0 0.4rem; }
.contract-body :deep(p) { margin: 0.5rem 0; }
.contract-body :deep(.contract-meta) { text-align: center; color: #8a8780; font-size: 0.78rem; letter-spacing: 0.05em; margin: 0 0 1.5rem; }
.contract-body :deep(table) { width: 100%; border-collapse: collapse; margin: 0.8rem 0 1.2rem; font-size: 0.9rem; }
.contract-body :deep(td), .contract-body :deep(th) {
  padding: 0.5rem 0.7rem;
  border-bottom: 1px solid #f0eee8;
  text-align: left;
}
.contract-body :deep(th) { background: #fafaf7; font-weight: 500; }
.contract-body :deep(ol), .contract-body :deep(ul) { padding-left: 1.4rem; margin: 0.5rem 0; }
.contract-body :deep(li) { margin: 0.35rem 0; }
.contract-body :deep(.signature-block) { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e8e6e1; }
.contract-body :deep(.fineprint) { font-size: 0.8rem; color: #6a6862; line-height: 1.6; }
.scroll-sentinel { height: 1px; visibility: hidden; }
.lang-switch { display: flex; gap: 0.4rem; justify-content: flex-end; margin-bottom: 1rem; }
.lang-switch button { font-size: 0.8rem; padding: 0.35rem 0.9rem; background: transparent; border: 1px solid var(--warm-gray-300, #c4c1ba); border-radius: 999px; color: var(--warm-gray-700, #4a4744); cursor: pointer; }
.lang-switch button.active { background: var(--ink, #2a2826); color: #fff; border-color: var(--ink, #2a2826); }

.scroll-hint { text-align: center; padding: 1rem; color: #b06b6b; font-size: 0.9rem; animation: bounce 1.2s infinite; }
@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(4px); } }

.signature-section { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--warm-gray-100); }
.signature-section.disabled { opacity: 0.4; pointer-events: none; }
.signature-section h3 { font-size: 1.1rem; font-weight: 400; margin: 0 0 1rem; }

.mode-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.mode-tabs button {
  font: inherit; padding: 0.6rem 1.2rem;
  background: transparent; border: 1px solid var(--warm-gray-300);
  border-radius: 99px; cursor: pointer; color: var(--warm-gray-700);
}
.mode-tabs button.active { background: var(--ink); color: var(--white); border-color: var(--ink); }

.typed-box, .drawn-box { display: flex; flex-direction: column; gap: 0.75rem; }
.signature-input {
  font-family: 'Brush Script MT', 'Snell Roundhand', cursive;
  font-size: 2rem; padding: 1rem 1.2rem;
  border: 1px solid var(--warm-gray-300); border-radius: 4px;
}
.signature-name-input {
  font: inherit; padding: 0.6rem 0.85rem;
  border: 1px solid var(--warm-gray-300); border-radius: 4px;
}
.typed-preview {
  font-family: 'Brush Script MT', 'Snell Roundhand', cursive;
  font-size: 2.5rem; padding: 1.2rem;
  border-bottom: 2px solid var(--ink); min-height: 70px;
  color: var(--ink);
}

.signature-canvas {
  width: 100%; height: 200px;
  border: 1px solid var(--warm-gray-300); border-radius: 4px;
  background: #fff; touch-action: none; cursor: crosshair;
}
.canvas-actions { display: flex; justify-content: flex-end; }
.mini-btn { font: inherit; font-size: 0.85rem; padding: 0.4rem 0.9rem; background: transparent; border: 1px solid var(--warm-gray-300); border-radius: 4px; cursor: pointer; }

.muted { color: var(--warm-gray-500); font-size: 0.85rem; }
.consent { margin: 1.5rem 0; line-height: 1.5; font-size: 0.85rem; }

.form-error { background: #fdf3f3; padding: 0.85rem; border-radius: 4px; color: #6b4444; margin: 1rem 0; }

.btn-primary { background: var(--ink); color: var(--white); padding: 0.85rem 2rem; border-radius: 4px; border: none; cursor: pointer; font: inherit; letter-spacing: 0.04em; }
.btn-primary.large { padding: 1.1rem 2.5rem; font-size: 1rem; width: 100%; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary:hover:not(:disabled) { opacity: 0.85; }

@media (max-width: 640px) {
  .card { padding: 1.5rem; }
  .summary-grid { grid-template-columns: 1fr; gap: 0.5rem; }
}
</style>
