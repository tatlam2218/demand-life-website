<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentLocale, useI18n } from '../i18n'

const route = useRoute()
const router = useRouter()
useI18n()

// Sync URL ?lang= to currentLocale on first load
const urlLang = route.query.lang
if (urlLang === 'en' || urlLang === 'zh-CN' || urlLang === 'zh-HK') {
  currentLocale.value = urlLang
}

const bookingId = ref(route.query.id || '')
const token = ref(route.query.token || '')

const state = ref({
  loading: true,
  error: '',
  booking: null,
  submitting: false,
  success: false
})

const form = ref({
  documentType: '',
  documentNumber: '',
  name: '',
  nameChinese: '',
  nationality: '',
  dateOfBirth: '',
  gender: '',
  issueDate: '',
  expiryDate: '',
  occupation: '',
  currentAddress: '',
  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: '',
  emergencyEmail: '',
  preferredCheckIn: '',
  specialRequests: '',
  aiAssisted: true,
  // Preferred contact method — defaulted from booking-step choice, editable here.
  contactMethod: 'email',
  whatsappNumber: '',
  wechatId: ''
})

const agreements = ref({ terms1: false, terms2: false, terms3: false, terms4: false })
const agreementsError = ref('')

const idFrontPreview = ref('')
const idBackPreview = ref('')
const idFrontUploaded = ref(false)
const idBackUploaded = ref(false)
const ocrRunning = ref(false)
const ocrResult = ref(null)
const aiExtractedFields = ref(new Set())  // track which fields were filled by AI
const nameMismatchWarning = ref('')

const COPY = {
  en: {
    eyebrow: 'Complete your profile',
    title1: 'A few details',
    title2: 'to prepare your stay.',
    lead: 'Please upload your ID and complete the form below. Our AI will help pre-fill most fields from your ID photo.',
    sectionId: 'Identity document',
    sectionPerson: 'Personal information',
    sectionEmergency: 'Emergency contact',
    sectionPrefs: 'Preferences (optional)',
    sectionTerms: 'Terms & signature',
    docType: 'Document type',
    docTypes: { hk_id: 'HK ID', passport: 'Passport', cn_id: 'China ID (居民身份证)', other: 'Other' },
    aiAssist: 'Use AI to read my document and pre-fill fields (recommended)',
    aiAssistNote: 'Image is sent to xAI Grok once for OCR. xAI does not retain images for training.',
    uploadFront: 'Upload front side',
    uploadBack: 'Upload back side',
    takePhoto: 'Take photo',
    chooseFile: 'Choose file',
    compressing: 'Compressing…',
    uploading: 'Uploading…',
    readingDoc: 'AI is reading your document…',
    aiSuccess: '✨ Fields pre-filled from your ID. Please review and correct as needed.',
    aiFailed: 'AI couldn\'t read this image. Please fill the fields manually.',
    notDoc: 'This image doesn\'t look like an identity document. Please upload a clear photo of your ID.',
    tooBlurry: 'The image is too blurry. Please re-take a clearer photo.',
    aiFilledBadge: '✨ AI',
    docNumber: 'Document number',
    name: 'Full name (romanized)',
    nameChinese: 'Chinese name (if any)',
    nationality: 'Nationality',
    dob: 'Date of birth',
    gender: 'Gender',
    genders: { M: 'Male', F: 'Female', X: 'Other' },
    issueDate: 'Issue date',
    expiryDate: 'Expiry date',
    occupation: 'Occupation / school',
    currentAddress: 'Current address',
    emergencyName: 'Emergency contact name',
    emergencyRelation: 'Relationship',
    emergencyPhone: 'Emergency contact phone',
    emergencyEmail: 'Emergency contact email (optional)',
    preferredCheckIn: 'Preferred check-in time',
    checkInTimes: ['Morning', 'Afternoon', 'Evening', 'Late evening'],
    specialRequests: 'Special requests (optional)',
    terms1Html: 'I have read and agree to the <a href="/legal/stay-terms" target="_blank" class="legal-link">Demain Life Stay Terms &amp; Conditions</a>.',
    terms2: 'I agree to pay the security deposit and first month\'s rent on confirmation.',
    terms3Html: 'I consent to Demain Life processing my personal information for the purpose of this booking, in accordance with the <a href="/legal/privacy" target="_blank" class="legal-link">Privacy Policy</a> (PIPO).',
    terms4Html: 'I have read and understood the <a href="/legal/stay-refund" target="_blank" class="legal-link">Cancellation &amp; Refund Policy</a> and the <a href="/legal/stay-payment" target="_blank" class="legal-link">Payment Scenario</a>.',
    paymentScenarioTitle: 'Payment summary',
    paymentScenarioBody: 'Upon signing, you will be asked to pay a <strong>security deposit (2 months\' rent)</strong> and <strong>first month\u2019s rent</strong> by FPS or bank transfer to Demain Culture Limited. Monthly rent is due on the 1st of each month thereafter. A payment screenshot must be submitted via the payment page. See <a href="/legal/stay-payment" target="_blank" class="legal-link">Payment Scenario</a> and <a href="/legal/stay-refund" target="_blank" class="legal-link">Cancellation &amp; Refund Policy</a> for full details.',
    signature: 'Type your full name as signature',
    signatureNote: 'By signing here you confirm everything above is accurate.',
    submit: 'Submit details',
    submitting: 'Submitting…',
    nameMismatchTitle: 'A note about the name',
    nameMismatch: 'The name on your ID looks different from the name you used when booking. Please confirm which one to use.',
    requiredHint: 'Required',
    successTitle: 'Thank you. Your details are saved.',
    successBody: 'We have received your profile. Our team will review your information and reach out with the next step shortly.',
    nextStep: 'Review & sign agreement →',
    invalidLink: 'This link is invalid or has expired. Please contact us if you need a new link.',
    backHome: 'Back to homepage'
  },
  'zh-CN': {
    eyebrow: '补充入住资料',
    title1: '一些资料',
    title2: '为您的入住做好准备。',
    lead: '请上传您的身份证件并填写下方表单。AI 会从证件照片自动识别大部分信息。',
    sectionId: '身份证件',
    sectionPerson: '个人信息',
    sectionEmergency: '紧急联系人',
    sectionPrefs: '入住偏好（选填）',
    sectionTerms: '条款与签名',
    docType: '证件类型',
    docTypes: { hk_id: '香港身份证', passport: '护照', cn_id: '中国居民身份证', other: '其他' },
    aiAssist: '使用 AI 自动识别证件并预填资料（推荐)',
    aiAssistNote: '图片会发送到 xAI Grok 进行一次识别。xAI 不会保留图片用于训练。',
    uploadFront: '上传正面',
    uploadBack: '上传反面',
    takePhoto: '拍照',
    chooseFile: '选择文件',
    compressing: '压缩中…',
    uploading: '上传中…',
    readingDoc: 'AI 正在识别证件…',
    aiSuccess: '✨ 已根据证件预填资料，请核对并补充。',
    aiFailed: 'AI 未能识别此图片，请手动填写。',
    notDoc: '这张图片看起来不像身份证件，请上传清晰的证件照片。',
    tooBlurry: '图片太模糊，请重新拍摄清晰的照片。',
    aiFilledBadge: '✨ AI',
    docNumber: '证件号码',
    name: '罗马字姓名',
    nameChinese: '中文姓名（如有）',
    nationality: '国籍',
    dob: '出生日期',
    gender: '性别',
    genders: { M: '男', F: '女', X: '其他' },
    issueDate: '签发日期',
    expiryDate: '有效期（仅护照）',
    occupation: '职业 / 学校',
    currentAddress: '现居地址',
    emergencyName: '紧急联系人姓名',
    emergencyRelation: '关系',
    emergencyPhone: '紧急联系人电话',
    emergencyEmail: '紧急联系人邮箱（选填）',
    preferredCheckIn: '入住时间偏好',
    checkInTimes: ['上午', '下午', '傍晚', '夜间'],
    specialRequests: '特殊要求（选填）',
    terms1Html: '我已阅读并同意 Demain Life <a href="/legal/stay-terms" target="_blank" class="legal-link">入住条款及细则</a>。',
    terms2: '我同意于确认后支付押金及首月租金。',
    terms3Html: '我同意 Demain Life 依据<a href="/legal/privacy" target="_blank" class="legal-link">隐私政策</a>出于本次预订之目的处理我的个人信息（PIPO）。',
    terms4Html: '我已阅读并了解<a href="/legal/stay-refund" target="_blank" class="legal-link">取消及退款政策</a>与<a href="/legal/stay-payment" target="_blank" class="legal-link">付款场景</a>。',
    paymentScenarioTitle: '付款摘要',
    paymentScenarioBody: '签约时，您需透过 FPS 或银行转账向 Demain Culture Limited 支付<strong>押金（两个月租金）</strong>及<strong>首月租金</strong>。此后每月租金于每月 1 日到期。付款截图须透过付款页面提交。详情请参阅<a href="/legal/stay-payment" target="_blank" class="legal-link">付款场景</a>及<a href="/legal/stay-refund" target="_blank" class="legal-link">取消及退款政策</a>。',
    signature: '在此输入您的全名作为签名',
    signatureNote: '签名即确认以上所有资料属实。',
    submit: '提交资料',
    submitting: '提交中…',
    nameMismatchTitle: '关于姓名',
    nameMismatch: '证件上的姓名与您预订时填写的不同，请确认采用哪一个。',
    requiredHint: '必填',
    successTitle: '感谢您，资料已保存。',
    successBody: '我们已收到您的资料。团队将审核您的信息，随后会与您联系进行下一步。',
    nextStep: '审阅并签署合同 →',
    invalidLink: '此链接无效或已过期。如需新链接，请联系我们。',
    backHome: '返回首页'
  },
  'zh-HK': {
    eyebrow: '補充入住資料',
    title1: '一些資料',
    title2: '為您的入住做好準備。',
    lead: '請上載您的身份證件並填寫下方表單。AI 會從證件照片自動識別大部分資料。',
    sectionId: '身份證件',
    sectionPerson: '個人資料',
    sectionEmergency: '緊急聯絡人',
    sectionPrefs: '入住偏好（選填）',
    sectionTerms: '條款與簽名',
    docType: '證件類型',
    docTypes: { hk_id: '香港身份證', passport: '護照', cn_id: '中國居民身份證', other: '其他' },
    aiAssist: '使用 AI 自動識別證件並預填資料（建議）',
    aiAssistNote: '圖片會傳送至 xAI Grok 進行一次識別。xAI 不會保留圖片用於訓練。',
    uploadFront: '上載正面',
    uploadBack: '上載反面',
    takePhoto: '拍照',
    chooseFile: '選擇檔案',
    compressing: '壓縮中…',
    uploading: '上載中…',
    readingDoc: 'AI 正在識別證件…',
    aiSuccess: '✨ 已根據證件預填資料，請核對並補充。',
    aiFailed: 'AI 未能識別此圖片，請手動填寫。',
    notDoc: '此圖片不像身份證件，請上載清晰的證件照片。',
    tooBlurry: '圖片太模糊，請重新拍攝清晰的照片。',
    aiFilledBadge: '✨ AI',
    docNumber: '證件號碼',
    name: '羅馬字姓名',
    nameChinese: '中文姓名（如有）',
    nationality: '國籍',
    dob: '出生日期',
    gender: '性別',
    genders: { M: '男', F: '女', X: '其他' },
    issueDate: '簽發日期',
    expiryDate: '有效期（僅護照）',
    occupation: '職業 / 學校',
    currentAddress: '現居地址',
    emergencyName: '緊急聯絡人姓名',
    emergencyRelation: '關係',
    emergencyPhone: '緊急聯絡人電話',
    emergencyEmail: '緊急聯絡人電郵（選填）',
    preferredCheckIn: '入住時間偏好',
    checkInTimes: ['上午', '下午', '傍晚', '夜間'],
    specialRequests: '特殊要求（選填）',
    terms1Html: '我已閱讀並同意 Demain Life <a href="/legal/stay-terms" target="_blank" class="legal-link">入住條款及細則</a>。',
    terms2: '我同意於確認後支付按金及首月租金。',
    terms3Html: '我同意 Demain Life 依據<a href="/legal/privacy" target="_blank" class="legal-link">私隱政策</a>出於本次預訂之目的處理我的個人資料（PIPO）。',
    terms4Html: '我已閱讀並了解<a href="/legal/stay-refund" target="_blank" class="legal-link">取消及退款政策</a>與<a href="/legal/stay-payment" target="_blank" class="legal-link">付款場景</a>。',
    paymentScenarioTitle: '付款摘要',
    paymentScenarioBody: '簽約時，您需透過 FPS 或銀行轉賬向 Demain Culture Limited 支付<strong>按金（兩個月租金）</strong>及<strong>首月租金</strong>。此後每月租金於每月 1 日到期。付款截圖須透過付款頁面提交。詳情請參閱<a href="/legal/stay-payment" target="_blank" class="legal-link">付款場景</a>及<a href="/legal/stay-refund" target="_blank" class="legal-link">取消及退款政策</a>。',
    signature: '在此輸入您的全名作為簽名',
    signatureNote: '簽名即確認以上所有資料屬實。',
    submit: '提交資料',
    submitting: '提交中…',
    nameMismatchTitle: '關於姓名',
    nameMismatch: '證件上的姓名與您預訂時填寫的不同，請確認採用哪一個。',
    requiredHint: '必填',
    successTitle: '感謝您，資料已儲存。',
    successBody: '我們已收到您的資料。團隊將審核您的資料，隨後會與您聯絡進行下一步。',
    nextStep: '審閱並簽署合約 →',
    invalidLink: '此連結無效或已過期。如需新連結請聯絡我們。',
    backHome: '返回首頁'
  }
}
const copy = computed(() => COPY[currentLocale.value] || COPY.en)

// ============== Image compression ==============
async function compressImage(file, maxDim = 1600, quality = 0.78, targetBytes = 200 * 1024) {
  // Read file into image
  const imgUrl = URL.createObjectURL(file)
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = imgUrl
  })
  // Compute target dimensions
  const longSide = Math.max(img.width, img.height)
  const scale = longSide > maxDim ? maxDim / longSide : 1
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  URL.revokeObjectURL(imgUrl)

  // Iteratively reduce quality until size fits
  let q = quality
  let blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', q))
  while (blob && blob.size > targetBytes && q > 0.4) {
    q -= 0.1
    blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', q))
  }
  // If still too big, downsize further
  if (blob && blob.size > targetBytes * 1.5) {
    canvas.width = Math.round(w * 0.85)
    canvas.height = Math.round(h * 0.85)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.7))
  }
  return blob
}

async function blobToDataUrl(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(blob)
  })
}

// ============== Upload + OCR ==============
const uploadingFront = ref(false)
const uploadingBack = ref(false)

async function handleIdUpload(side, file) {
  if (!file) return
  // Guard: 15MB max input (uncompressed)
  if (file.size > 15 * 1024 * 1024) {
    state.value.error = 'File too large. Please choose an image under 15MB.'
    return
  }
  const isFront = side === 'front'
  if (isFront) uploadingFront.value = true
  else uploadingBack.value = true
  state.value.error = ''
  ocrResult.value = null

  try {
    const blob = await compressImage(file)
    const dataUrl = await blobToDataUrl(blob)

    if (isFront) idFrontPreview.value = dataUrl
    else idBackPreview.value = dataUrl

    // Show OCR running indicator (for front)
    if (isFront && form.value.aiAssisted) {
      ocrRunning.value = true
    }

    const resp = await fetch(`/api/bookings/${bookingId.value}/upload-id`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: token.value,
        side,
        dataUrl,
        mimeType: 'image/jpeg',
        runOCR: isFront && form.value.aiAssisted
      })
    })
    const data = await resp.json()
    if (!resp.ok) {
      state.value.error = data.message || data.error || 'Upload failed'
      return
    }

    if (isFront) idFrontUploaded.value = true
    else idBackUploaded.value = true

    // Apply OCR result if available (front only)
    if (isFront && data.ocr) {
      applyOcr(data.ocr)
    }
  } catch (err) {
    state.value.error = err.message || 'Upload failed'
  } finally {
    if (isFront) uploadingFront.value = false
    else uploadingBack.value = false
    ocrRunning.value = false
  }
}

function applyOcr(ocr) {
  ocrResult.value = ocr
  if (ocr.error) return
  if (ocr.skipped) return

  // Map OCR fields to form, but only fill empty fields (don't override user input)
  const mappings = {
    documentType: 'documentType',
    documentNumber: 'documentNumber',
    name: 'name',
    nameChinese: 'nameChinese',
    nationality: 'nationality',
    dateOfBirth: 'dateOfBirth',
    gender: 'gender',
    issueDate: 'issueDate',
    expiryDate: 'expiryDate'
  }
  const filled = new Set()
  for (const [ocrKey, formKey] of Object.entries(mappings)) {
    const val = ocr[ocrKey]
    if (val != null && val !== '' && !form.value[formKey]) {
      form.value[formKey] = String(val)
      filled.add(formKey)
    }
  }
  aiExtractedFields.value = filled

  // Name mismatch check
  if (ocr.name && state.value.booking?.name) {
    const ocrName = ocr.name.toUpperCase().replace(/[^A-Z]/g, '')
    const bookedName = state.value.booking.name.toUpperCase().replace(/[^A-Z]/g, '')
    if (ocrName && bookedName && ocrName !== bookedName && !ocrName.includes(bookedName) && !bookedName.includes(ocrName)) {
      nameMismatchWarning.value = `${copy.value.nameMismatch} (Booking: "${state.value.booking.name}" · ID: "${ocr.name}")`
    }
  }
}

function isAiField(key) {
  return aiExtractedFields.value.has(key)
}

// When user edits an AI-filled field, remove the badge
function onFieldEdit(key) {
  aiExtractedFields.value.delete(key)
}

// ============== Submit ==============
async function submit() {
  // Validate agreements
  const { terms1, terms2, terms3, terms4 } = agreements.value
  if (!terms1 || !terms2 || !terms3 || !terms4) {
    agreementsError.value = currentLocale.value === 'zh-CN'
      ? '請先同意所有條款後繼續。'
      : currentLocale.value === 'zh-HK'
        ? '請先同意所有條款後繼續。'
        : 'Please accept all terms to continue.'
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    return
  }
  agreementsError.value = ''
  const required = ['documentType', 'documentNumber', 'name', 'dateOfBirth', 'gender',
    'occupation', 'currentAddress',
    'emergencyName', 'emergencyRelation', 'emergencyPhone']
  for (const k of required) {
    if (!form.value[k]) {
      state.value.error = `Missing: ${k}`
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
  }
  if (!idFrontUploaded.value) {
    state.value.error = 'Please upload the front side of your ID.'
    return
  }
  if (form.value.contactMethod === 'whatsapp' && !form.value.whatsappNumber) {
    state.value.error = 'Please enter your WhatsApp number.'
    return
  }
  if (form.value.contactMethod === 'wechat' && !form.value.wechatId) {
    state.value.error = 'Please enter your WeChat ID.'
    return
  }

  state.value.submitting = true
  state.value.error = ''
  try {
    const resp = await fetch(`/api/bookings/${bookingId.value}/details`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: token.value,
        details: { ...form.value }
      })
    })
    const data = await resp.json()
    if (resp.ok && data.success) {
      state.value.success = true
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      state.value.error = data.message || data.error || 'Submission failed'
    }
  } catch (err) {
    state.value.error = err.message
  } finally {
    state.value.submitting = false
  }
}

// ============== Load on mount ==============
onMounted(async () => {
  if (!bookingId.value || !token.value) {
    state.value.loading = false
    state.value.error = 'invalid_link'
    return
  }
  try {
    const resp = await fetch(`/api/bookings/${bookingId.value}/access?token=${encodeURIComponent(token.value)}`)
    const data = await resp.json()
    if (!resp.ok) {
      state.value.error = data.error || 'invalid_link'
      return
    }
    state.value.booking = data.booking
    // If previously uploaded, mark as uploaded (without preview blob — they can re-upload to change)
    if (data.booking.documents?.idFront) idFrontUploaded.value = true
    if (data.booking.documents?.idBack) idBackUploaded.value = true
    // Pre-fill nationality from Phase 1 if available
    if (data.booking.nationality) form.value.nationality = data.booking.nationality
    // Pre-fill preferred contact method from booking-step choice (editable here)
    if (data.booking.contactMethod) form.value.contactMethod = data.booking.contactMethod
    if (data.booking.whatsappNumber) form.value.whatsappNumber = data.booking.whatsappNumber
    if (data.booking.wechatId) form.value.wechatId = data.booking.wechatId
    // Restore details if previously submitted (for re-edit)
    if (data.booking.details) {
      Object.assign(form.value, data.booking.details)
    }
  } catch (err) {
    state.value.error = err.message
  } finally {
    state.value.loading = false
  }
})

function goHome() { router.push('/') }
function goToContract() {
  router.push({
    path: '/book/contract',
    query: { id: bookingId.value, token: token.value, lang: currentLocale.value }
  })
}
</script>

<template>
  <section class="details-page dl-form">
    <div class="container">
      <!-- Loading -->
      <div v-if="state.loading" class="loading-card">Loading…</div>

      <!-- Invalid link -->
      <div v-else-if="state.error === 'invalid_link' || state.error === 'invalid_token' || state.error === 'token_expired' || state.error === 'not_found'" class="card error-card">
        <p class="eyebrow">{{ copy.eyebrow }}</p>
        <h1>{{ copy.invalidLink }}</h1>
        <button class="btn-primary" @click="goHome">{{ copy.backHome }} →</button>
      </div>

      <!-- Success: gated workflow — admin sends contract link separately -->
      <div v-else-if="state.success" class="card success-card">
        <p class="eyebrow">{{ copy.eyebrow }}</p>
        <h1>{{ copy.successTitle }}</h1>
        <p class="lead">{{ copy.successBody }}</p>
        <button class="btn-primary" @click="goHome">{{ copy.backHome }} →</button>
      </div>

      <!-- Main form -->
      <div v-else class="card">
        <header class="form-header">
          <p class="eyebrow">{{ copy.eyebrow }} · {{ state.booking?.id }}</p>
          <h1>{{ copy.title1 }}<br>{{ copy.title2 }}</h1>
          <p class="lead">{{ copy.lead }}</p>
        </header>

        <!-- Privacy notice (top of page, opening statement) -->
        <aside class="privacy-notice">
          <p v-if="currentLocale === 'zh-CN'">
            <strong>关于您的资料 ·</strong>
            我们只为了此次预订登记、身份验证与合同准备而收集这些信息。身份证图像加密存储，仅 Demain Life 入住审核人员可查阅。若本次预订未能成交，我们会在 30 天内删除您的所有资料；若成功入住，我们会依法保留至租约结束后 12 个月。我们不会将您的信息分享给任何第三方。
          </p>
          <p v-else-if="currentLocale === 'zh-HK'">
            <strong>關於您的資料 ·</strong>
            我們只為了今次預訂登記、身份驗證與合約準備而收集這些資料。身份證影像加密儲存，僅 Demain Life 入住審核同事可查閱。若本次預訂未能成交，我們會於 30 日內刪除您所有資料；若成功入住，我們會依法保留至租約結束後 12 個月。我們不會將您的資料分享給任何第三方。
          </p>
          <p v-else>
            <strong>About your information ·</strong>
            We collect this only to register your booking, verify your identity, and prepare your tenancy agreement. ID images are encrypted at rest and only viewable by Demain Life check-in staff. If this booking does not go through, all of your information will be deleted within 30 days. If you do move in, we keep it until 12 months after your lease ends, as required by law. We never share your information with any third party.
          </p>
        </aside>

        <!-- Section: ID -->
        <section class="form-section">
          <h2 class="section-title">{{ copy.sectionId }}</h2>

          <label class="ai-toggle">
            <input type="checkbox" v-model="form.aiAssisted" />
            <span>
              <strong>{{ copy.aiAssist }}</strong>
              <small>{{ copy.aiAssistNote }}</small>
            </span>
          </label>

          <div class="field-row">
            <label>
              <span class="label-text">{{ copy.docType }} <em>*</em></span>
              <select v-model="form.documentType" :class="{ 'ai-filled': isAiField('documentType') }" @change="onFieldEdit('documentType')">
                <option value="">—</option>
                <option v-for="(label, key) in copy.docTypes" :key="key" :value="key">{{ label }}</option>
              </select>
              <span v-if="isAiField('documentType')" class="ai-badge">{{ copy.aiFilledBadge }}</span>
            </label>
            <label>
              <span class="label-text">{{ copy.docNumber }} <em>*</em></span>
              <input v-model="form.documentNumber" :class="{ 'ai-filled': isAiField('documentNumber') }" @input="onFieldEdit('documentNumber')" />
              <span v-if="isAiField('documentNumber')" class="ai-badge">{{ copy.aiFilledBadge }}</span>
            </label>
          </div>

          <!-- Upload ID front -->
          <div class="id-upload-row">
            <div class="id-upload-block">
              <div class="id-preview">
                <img v-if="idFrontPreview" :src="idFrontPreview" alt="ID front" />
                <div v-else-if="idFrontUploaded" class="id-uploaded-mark">✓ Uploaded</div>
                <div v-else class="id-placeholder">📷</div>
              </div>
              <p class="upload-label">{{ copy.uploadFront }} <em>*</em></p>
              <label class="upload-btn">
                <input type="file" accept="image/*" capture="environment" @change="(e) => handleIdUpload('front', e.target.files[0])" hidden />
                <span>{{ uploadingFront ? (ocrRunning ? copy.readingDoc : copy.uploading) : copy.takePhoto }}</span>
              </label>
              <label class="upload-btn ghost">
                <input type="file" accept="image/*" @change="(e) => handleIdUpload('front', e.target.files[0])" hidden />
                <span>{{ copy.chooseFile }}</span>
              </label>
            </div>

            <div class="id-upload-block">
              <div class="id-preview">
                <img v-if="idBackPreview" :src="idBackPreview" alt="ID back" />
                <div v-else-if="idBackUploaded" class="id-uploaded-mark">✓ Uploaded</div>
                <div v-else class="id-placeholder">📷</div>
              </div>
              <p class="upload-label">{{ copy.uploadBack }}</p>
              <label class="upload-btn">
                <input type="file" accept="image/*" capture="environment" @change="(e) => handleIdUpload('back', e.target.files[0])" hidden />
                <span>{{ uploadingBack ? copy.uploading : copy.takePhoto }}</span>
              </label>
              <label class="upload-btn ghost">
                <input type="file" accept="image/*" @change="(e) => handleIdUpload('back', e.target.files[0])" hidden />
                <span>{{ copy.chooseFile }}</span>
              </label>
            </div>
          </div>

          <!-- OCR status messages -->
          <div v-if="ocrResult?.error === 'not_a_document'" class="info-banner warn">{{ copy.notDoc }}</div>
          <div v-else-if="ocrResult?.error === 'image_too_blurry'" class="info-banner warn">{{ copy.tooBlurry }}</div>
          <div v-else-if="ocrResult && !ocrResult.error && !ocrResult.skipped" class="info-banner ok">{{ copy.aiSuccess }}</div>
          <div v-else-if="ocrResult?.error" class="info-banner">{{ copy.aiFailed }}</div>
          <div v-if="nameMismatchWarning" class="info-banner warn"><strong>{{ copy.nameMismatchTitle }}.</strong> {{ nameMismatchWarning }}</div>

          <!-- AI-extractable fields -->
          <div class="field-row">
            <label>
              <span class="label-text">{{ copy.name }} <em>*</em></span>
              <input v-model="form.name" :class="{ 'ai-filled': isAiField('name') }" @input="onFieldEdit('name')" />
              <span v-if="isAiField('name')" class="ai-badge">{{ copy.aiFilledBadge }}</span>
            </label>
            <label>
              <span class="label-text">{{ copy.nameChinese }}</span>
              <input v-model="form.nameChinese" :class="{ 'ai-filled': isAiField('nameChinese') }" @input="onFieldEdit('nameChinese')" />
              <span v-if="isAiField('nameChinese')" class="ai-badge">{{ copy.aiFilledBadge }}</span>
            </label>
          </div>

          <div class="field-row">
            <label>
              <span class="label-text">{{ copy.dob }} <em>*</em></span>
              <input v-model="form.dateOfBirth" type="date" :class="{ 'ai-filled': isAiField('dateOfBirth') }" @input="onFieldEdit('dateOfBirth')" />
              <span v-if="isAiField('dateOfBirth')" class="ai-badge">{{ copy.aiFilledBadge }}</span>
            </label>
            <label>
              <span class="label-text">{{ copy.gender }} <em>*</em></span>
              <select v-model="form.gender" :class="{ 'ai-filled': isAiField('gender') }" @change="onFieldEdit('gender')">
                <option value="">—</option>
                <option v-for="(label, key) in copy.genders" :key="key" :value="key">{{ label }}</option>
              </select>
              <span v-if="isAiField('gender')" class="ai-badge">{{ copy.aiFilledBadge }}</span>
            </label>
          </div>

          <div class="field-row">
            <label>
              <span class="label-text">{{ copy.nationality }}</span>
              <input v-model="form.nationality" :class="{ 'ai-filled': isAiField('nationality') }" @input="onFieldEdit('nationality')" />
              <span v-if="isAiField('nationality')" class="ai-badge">{{ copy.aiFilledBadge }}</span>
            </label>
            <label v-if="form.documentType === 'passport'">
              <span class="label-text">{{ copy.expiryDate }}</span>
              <input v-model="form.expiryDate" type="date" :class="{ 'ai-filled': isAiField('expiryDate') }" @input="onFieldEdit('expiryDate')" />
              <span v-if="isAiField('expiryDate')" class="ai-badge">{{ copy.aiFilledBadge }}</span>
            </label>
          </div>
        </section>

        <!-- Section: Personal info -->
        <section class="form-section">
          <h2 class="section-title">{{ copy.sectionPerson }}</h2>
          <label>
            <span class="label-text">{{ copy.occupation }} <em>*</em></span>
            <input v-model="form.occupation" />
          </label>
          <label>
            <span class="label-text">{{ copy.currentAddress }} <em>*</em></span>
            <textarea v-model="form.currentAddress" rows="2"></textarea>
          </label>
        </section>

        <!-- Section: Preferred contact method -->
        <section class="form-section">
          <h2 class="section-title">{{ copy.sectionContact || 'Preferred contact method' }}</h2>
          <p class="section-hint muted">{{ copy.contactHint || 'How would you like us to reach you for booking updates?' }}</p>
          <div class="contact-method-row">
            <label class="contact-pill" :class="{ active: form.contactMethod === 'email' }">
              <input type="radio" v-model="form.contactMethod" value="email" />
              <span>Email</span>
            </label>
            <label class="contact-pill" :class="{ active: form.contactMethod === 'phone' }">
              <input type="radio" v-model="form.contactMethod" value="phone" />
              <span>Phone</span>
            </label>
            <label class="contact-pill" :class="{ active: form.contactMethod === 'whatsapp' }">
              <input type="radio" v-model="form.contactMethod" value="whatsapp" />
              <span>WhatsApp</span>
            </label>
            <label class="contact-pill" :class="{ active: form.contactMethod === 'wechat' }">
              <input type="radio" v-model="form.contactMethod" value="wechat" />
              <span>WeChat</span>
            </label>
          </div>
          <div v-if="form.contactMethod === 'whatsapp'" class="field-row contact-extra">
            <label>
              <span class="label-text">WhatsApp number <em>*</em></span>
              <input v-model="form.whatsappNumber" type="tel" placeholder="+852 9123 4567" />
            </label>
          </div>
          <div v-if="form.contactMethod === 'wechat'" class="field-row contact-extra">
            <label>
              <span class="label-text">WeChat ID <em>*</em></span>
              <input v-model="form.wechatId" placeholder="your-wechat-id" />
            </label>
          </div>
        </section>

        <!-- Section: Emergency -->
        <section class="form-section">
          <h2 class="section-title">{{ copy.sectionEmergency }}</h2>
          <div class="field-row">
            <label>
              <span class="label-text">{{ copy.emergencyName }} <em>*</em></span>
              <input v-model="form.emergencyName" />
            </label>
            <label>
              <span class="label-text">{{ copy.emergencyRelation }} <em>*</em></span>
              <input v-model="form.emergencyRelation" />
            </label>
          </div>
          <div class="field-row">
            <label>
              <span class="label-text">{{ copy.emergencyPhone }} <em>*</em></span>
              <input v-model="form.emergencyPhone" type="tel" />
            </label>
            <label>
              <span class="label-text">{{ copy.emergencyEmail }}</span>
              <input v-model="form.emergencyEmail" type="email" />
            </label>
          </div>
        </section>

        <!-- Section: Preferences -->
        <section class="form-section">
          <h2 class="section-title">{{ copy.sectionPrefs }}</h2>
          <div class="field-row">
            <label>
              <span class="label-text">{{ copy.preferredCheckIn }}</span>
              <select v-model="form.preferredCheckIn">
                <option value="">—</option>
                <option v-for="t in copy.checkInTimes" :key="t" :value="t">{{ t }}</option>
              </select>
            </label>
          </div>
          <label>
            <span class="label-text">{{ copy.specialRequests }}</span>
            <textarea v-model="form.specialRequests" rows="3"></textarea>
          </label>
        </section>

        <!-- Terms & agreements section -->
        <section class="form-section">
          <h2 class="section-title">{{ copy.sectionTerms }}</h2>

          <!-- Payment scenario summary -->
          <div class="payment-scenario-box">
            <p class="scenario-title">{{ copy.paymentScenarioTitle }}</p>
            <p class="scenario-body" v-html="copy.paymentScenarioBody"></p>
          </div>

          <!-- Terms checkboxes -->
          <label class="check-row">
            <input type="checkbox" v-model="agreements.terms1" />
            <span v-html="copy.terms1Html"></span>
          </label>
          <label class="check-row">
            <input type="checkbox" v-model="agreements.terms2" />
            <span>{{ copy.terms2 }}</span>
          </label>
          <label class="check-row">
            <input type="checkbox" v-model="agreements.terms3" />
            <span v-html="copy.terms3Html"></span>
          </label>
          <label class="check-row">
            <input type="checkbox" v-model="agreements.terms4" />
            <span v-html="copy.terms4Html"></span>
          </label>
          <p v-if="agreementsError" class="terms-error-msg">{{ agreementsError }}</p>
        </section>

        <div v-if="state.error" class="form-error">{{ state.error }}</div>

        <div class="form-footer">
          <button class="btn-primary large" :disabled="state.submitting" @click="submit">
            {{ state.submitting ? copy.submitting : 'Submit →' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.details-page { min-height: 100vh; padding: var(--space-lg) 0 var(--space-xl); background: var(--cream); }
.container { max-width: 820px; }
.card { background: var(--white); border: 1px solid var(--warm-gray-100); border-radius: 8px; padding: clamp(2rem, 5vw, 4rem); }
.loading-card, .error-card, .success-card { text-align: center; padding: 4rem 2rem; background: var(--white); border-radius: 8px; }
.success-card h1, .error-card h1 { margin: 1rem 0; font-weight: 300; }

.form-header h1 { margin: 0.5rem 0 1rem; font-weight: 300; }
.lead { color: var(--warm-gray-700); margin: 0 0 2rem; }
.eyebrow { color: var(--warm-gray-500); font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; margin: 0; }

.form-section { margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid var(--warm-gray-100); display: flex; flex-direction: column; gap: 1.25rem; }
.section-title { font-size: 1.1rem; font-weight: 400; margin: 0 0 0.5rem; }

.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.field-row > label, .form-section > label { display: flex; flex-direction: column; gap: 0.5rem; position: relative; }
.label-text { font-size: 0.85rem; color: var(--ink); font-weight: 400; }
.label-text em { color: #b06b6b; font-style: normal; }
.muted { color: var(--warm-gray-500); font-size: 0.78rem; }

/* Inputs styled by global .dl-form. textarea min-height tuned for this page. */
textarea { min-height: 70px; }

.ai-filled { background: #fafaf2; border-color: #d4cfb8 !important; }
.ai-badge { position: absolute; top: 0; right: 0; font-size: 0.65rem; background: #d4cfb8; color: #5a4f2a; padding: 1px 6px; border-radius: 99px; letter-spacing: 0.04em; }

.ai-toggle { display: flex; gap: 0.75rem; align-items: flex-start; background: var(--paper); padding: 1rem 1.25rem; border-radius: 4px; cursor: pointer; }
.ai-toggle input { width: auto; margin-top: 4px; }
.ai-toggle span { display: flex; flex-direction: column; gap: 4px; }
.ai-toggle strong { font-weight: 500; font-size: 0.9rem; }
.ai-toggle small { color: var(--warm-gray-500); font-size: 0.75rem; }

.id-upload-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.id-upload-block { display: flex; flex-direction: column; gap: 0.5rem; }
.id-preview {
  aspect-ratio: 1.6 / 1; background: var(--paper); border-radius: 6px;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  border: 1px dashed var(--warm-gray-300);
}
.id-preview img { width: 100%; height: 100%; object-fit: cover; }
.id-placeholder { font-size: 2.5rem; opacity: 0.3; }
.id-uploaded-mark { color: #2a6a4a; font-weight: 500; }
.upload-label { margin: 0.25rem 0; font-size: 0.85rem; }
.upload-label em { color: #b06b6b; font-style: normal; }
.upload-btn {
  display: inline-block; cursor: pointer; background: var(--ink); color: var(--white);
  padding: 0.6rem 1rem; border-radius: 4px; text-align: center; font-size: 0.85rem;
}
.upload-btn.ghost { background: transparent; color: var(--ink); border: 1px solid var(--warm-gray-300); }
.upload-btn:hover { opacity: 0.85; }

.info-banner { padding: 0.85rem 1rem; border-radius: 4px; font-size: 0.85rem; background: #f0f5f0; color: #2a6a4a; }
.info-banner.warn { background: #fdf3e7; color: #8a5a2a; }
.info-banner.ok { background: #ecf5ec; color: #2a6a4a; }

.check-row { display: flex; gap: 0.75rem; align-items: flex-start; font-size: 0.9rem; cursor: pointer; line-height: 1.5; }
.check-row input { width: auto; margin-top: 4px; }

.signature-input { font-family: 'Brush Script MT', cursive, var(--font-stack); font-size: 1.6rem; padding: 0.8rem 1rem; letter-spacing: 0.03em; }
.privacy-notice { background: var(--color-paper, #f5f3ee); border-left: 3px solid var(--color-accent, #6b7355); padding: 1rem 1.25rem; margin: 1.5rem 0 2rem; border-radius: 4px; }
.privacy-notice p { margin: 0; font-size: 0.9rem; line-height: 1.6; color: var(--color-warm-gray-700, #4a4744); }
.section-hint { margin: 0 0 1rem; font-size: 0.85rem; }
.contact-method-row { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 1rem; }
.contact-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1.1rem; border: 1px solid var(--color-warm-gray-100, #e8e6e1); border-radius: 999px; cursor: pointer; font-size: 0.9rem; transition: all 0.18s; }
.contact-pill input { display: none; }
.contact-pill.active { background: var(--color-ink, #2a2826); color: #fff; border-color: var(--color-ink, #2a2826); }
.contact-pill:hover:not(.active) { border-color: var(--color-warm-gray-300, #c4c1ba); }
.contact-extra { margin-top: 0.5rem; }
.legal-link { color: var(--ink); text-decoration: underline; font-weight: 500; }
.legal-link:hover { opacity: 0.75; }

.payment-scenario-box { background: #fdf6e3; border: 1px solid #d4cfb8; border-radius: 6px; padding: 1rem 1.25rem; }
.scenario-title { font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: #6b5a2a; margin: 0 0 0.5rem; font-weight: 500; }
.scenario-body { margin: 0; font-size: 0.9rem; line-height: 1.65; color: #3a3020; }
.terms-error-msg { color: #d62828; font-size: 0.82rem; margin: 0.25rem 0 0 1.75rem; }

.form-error { background: #fdf3f3; border: 1px solid #e0c8c8; padding: 1rem 1.25rem; border-radius: 4px; color: #6b4444; margin-top: 2rem; }
.form-footer { display: flex; justify-content: flex-end; margin-top: 2rem; }
.btn-primary { background: var(--ink); color: var(--white); padding: 0.85rem 2rem; border-radius: 4px; border: none; cursor: pointer; font: inherit; letter-spacing: 0.04em; transition: opacity 0.2s; }
.btn-primary.large { padding: 1.1rem 2.5rem; font-size: 1rem; }
.btn-primary:hover { opacity: 0.85; }
.btn-secondary { background: transparent; border: 1px solid var(--warm-gray-300); color: var(--warm-gray-700); padding: 0.7rem 1.5rem; border-radius: 4px; cursor: pointer; font: inherit; font-size: 0.85rem; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 640px) {
  .field-row { grid-template-columns: 1fr; }
  .id-upload-row { grid-template-columns: 1fr; }
  .card { padding: 1.5rem; }
}
</style>
