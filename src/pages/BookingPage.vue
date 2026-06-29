<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../i18n'
import { useSiteContent, loadSiteContent } from '../composables/useSiteContent'

const route = useRoute()
const router = useRouter()
useI18n()
const { locale, rooms } = useSiteContent()

onMounted(() => {
  loadSiteContent()
})

const form = ref({
  name: '',
  email: '',
  phone: '',
  nationality: '',
  roomType: route.query.room || '',
  moveInDate: '',
  duration: '',
  occupancy: '',
  message: '',
  contactMethod: 'email',
  whatsappNumber: '',
  whatsappSameAsPhone: true,
  wechatId: ''
})

const submitting = ref(false)
const result = ref(null)  // { success: true, bookingId } or { error: '...' }



const COPY = {
  en: {
    eyebrow: 'Reservation enquiry',
    title1: 'Tell us about',
    title2: 'your stay.',
    lead: 'Our team will follow up within one business day to confirm availability, pricing and next steps.',
    name: 'Full name',
    email: 'Email',
    phone: 'Phone',
    nationality: 'Nationality (optional)',
    contactMethod: 'Preferred contact method',
    contactMethods: { email: 'Email', phone: 'Phone', whatsapp: 'WhatsApp', wechat: 'WeChat' },
    whatsappLabel: 'WhatsApp number',
    whatsappSameAsPhone: 'Same as phone number',
    wechatLabel: 'WeChat ID',
    roomType: 'Room type',
    roomTypePick: 'Please pick a room',
    moveInDate: 'Preferred move-in date',
    duration: 'Length of stay',
    durations: ['1 month', '3 months', '6 months', '12 months', 'Other / unsure'],
    occupancy: 'Number of occupants',
    occupancies: ['1', '2'],
    message: 'Anything else we should know? (optional)',
    submit: 'Send enquiry',
    submitting: 'Sending…',
    required: 'Required',
    successTitle: 'Enquiry received.',
    successLead: 'Thank you — your reference number is',
    successBody: 'We will reach out to you within one business day. Please keep your reference number above when our team contacts you.',
    successContactNote: (m) => m === 'email' ? 'We will contact you by email.' : m === 'phone' ? 'We will call you.' : m === 'whatsapp' ? 'Our team will add you on WhatsApp.' : 'Our team will add you on WeChat.',
    backHome: 'Back to homepage',
    errorTitle: 'Something went wrong.',
    errorBody: 'Please check the fields and try again, or contact us directly.'
  },
  'zh-CN': {
    eyebrow: '预订咨询',
    title1: '告诉我们',
    title2: '您的入住计划。',
    lead: '我们的团队将于一个工作日内联系您，确认房型供应、价格与后续流程。',
    name: '姓名',
    email: '邮箱',
    phone: '电话',
    nationality: '国籍（选填）',
    contactMethod: '首选联系方式',
    contactMethods: { email: '邮箱', phone: '电话', whatsapp: 'WhatsApp', wechat: '微信' },
    whatsappLabel: 'WhatsApp 号码',
    whatsappSameAsPhone: '与电话号码相同',
    wechatLabel: '微信号',
    roomType: '房型',
    roomTypePick: '请选择房型',
    moveInDate: '预计入住日期',
    duration: '入住时长',
    durations: ['1 个月', '3 个月', '6 个月', '12 个月', '其他 / 待定'],
    occupancy: '入住人数',
    occupancies: ['1', '2'],
    message: '还有什么需要我们了解的？(选填)',
    submit: '提交咨询',
    submitting: '提交中…',
    required: '必填',
    successTitle: '已收到您的咨询。',
    successLead: '感谢您 — 您的参考编号是',
    successBody: '我们将于一个工作日内与您联系。请在我们联系您时准备好上面的参考编号。',
    successContactNote: (m) => m === 'email' ? '我们将通过邮箱与您联系。' : m === 'phone' ? '我们会给您打电话。' : m === 'whatsapp' ? '我们的团队会在 WhatsApp 上添加您。' : '我们的团队会在微信上添加您。',
    backHome: '返回首页',
    errorTitle: '出了点小问题。',
    errorBody: '请检查表单后重试，或直接与我们联系。'
  },
  'zh-HK': {
    eyebrow: '預訂查詢',
    title1: '告訴我們',
    title2: '您的入住計劃。',
    lead: '我們的團隊將於一個工作天內聯絡您，確認房型供應、價格與後續流程。',
    name: '姓名',
    email: '電郵',
    phone: '電話',
    nationality: '國籍（選填）',
    contactMethod: '首選聯絡方式',
    contactMethods: { email: '電郵', phone: '電話', whatsapp: 'WhatsApp', wechat: '微信' },
    whatsappLabel: 'WhatsApp 號碼',
    whatsappSameAsPhone: '與電話號碼相同',
    wechatLabel: '微信號',
    roomType: '房型',
    roomTypePick: '請選擇房型',
    moveInDate: '預計入住日期',
    duration: '入住時長',
    durations: ['1 個月', '3 個月', '6 個月', '12 個月', '其他 / 待定'],
    occupancy: '入住人數',
    occupancies: ['1', '2'],
    message: '還有甚麼需要我們了解？(選填)',
    submit: '提交查詢',
    submitting: '提交中…',
    required: '必填',
    successTitle: '已收到您的查詢。',
    successLead: '感謝您 — 您的參考編號為',
    successBody: '我們將於一個工作天內與您聯絡。請在我們聯絡您時準備好上面的參考編號。',
    successContactNote: (m) => m === 'email' ? '我們將透過電郵與您聯絡。' : m === 'phone' ? '我們會給您打電話。' : m === 'whatsapp' ? '我們的團隊會在 WhatsApp 上添加您。' : '我們的團隊會在微信上添加您。',
    backHome: '返回首頁',
    errorTitle: '出了點小問題。',
    errorBody: '請檢查表單後重試，或直接與我們聯絡。'
  }
}

const copy = computed(() => COPY[locale.value] || COPY.en)
const roomOptions = computed(() => rooms.value || [])

const errors = ref({})
function validate() {
  const e = {}
  if (!form.value.name.trim()) e.name = true
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())) e.email = true
  if (!form.value.phone.trim()) e.phone = true
  if (!form.value.roomType.trim()) e.roomType = true
  if (!form.value.moveInDate.trim()) e.moveInDate = true
  if (form.value.contactMethod === 'whatsapp' && !form.value.whatsappSameAsPhone && !form.value.whatsappNumber.trim()) e.whatsappNumber = true
  if (form.value.contactMethod === 'wechat' && !form.value.wechatId.trim()) e.wechatId = true
  errors.value = e
  return Object.keys(e).length === 0
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  result.value = null
  try {
    // Derive whatsappNumber from phone if checkbox is on
    const payload = {
      ...form.value,
      whatsappNumber: form.value.contactMethod === 'whatsapp'
        ? (form.value.whatsappSameAsPhone ? form.value.phone : form.value.whatsappNumber)
        : '',
      wechatId: form.value.contactMethod === 'wechat' ? form.value.wechatId : '',
      lang: locale.value
    }
    delete payload.whatsappSameAsPhone
    const resp = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await resp.json()
    if (resp.ok && data.success) {
      result.value = { success: true, bookingId: data.bookingId }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      result.value = { error: data.error || 'unknown' }
    }
  } catch (err) {
    result.value = { error: err.message }
  } finally {
    submitting.value = false
  }
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <section class="booking-page">
    <div class="container">
      <!-- Success state -->
      <div v-if="result?.success" class="success-card">
        <p class="eyebrow">{{ copy.eyebrow }}</p>
        <h1>{{ copy.successTitle }}</h1>
        <p class="success-lead">{{ copy.successLead }}</p>
        <p class="booking-id">{{ result.bookingId }}</p>
        <p class="contact-note">{{ copy.successContactNote(form.contactMethod) }}</p>
        <p class="success-body">{{ copy.successBody }}</p>
        <button class="btn-primary" @click="goHome">{{ copy.backHome }} →</button>
      </div>

      <!-- Form -->
      <div v-else class="form-card">
        <header class="form-header">
          <p class="eyebrow">{{ copy.eyebrow }}</p>
          <h1>{{ copy.title1 }}<br>{{ copy.title2 }}</h1>
          <p class="lead">{{ copy.lead }}</p>
        </header>

        <form @submit.prevent="submit" novalidate class="dl-form">
          <div class="field-row">
            <label>
              <span class="label-text">{{ copy.name }} <em>*</em></span>
              <input v-model="form.name" type="text" :class="{ error: errors.name }" autocomplete="name" />
            </label>
            <label>
              <span class="label-text">{{ copy.email }} <em>*</em></span>
              <input v-model="form.email" type="email" :class="{ error: errors.email }" autocomplete="email" />
            </label>
          </div>

          <div class="field-row">
            <label>
              <span class="label-text">{{ copy.phone }} <em>*</em></span>
              <input v-model="form.phone" type="tel" :class="{ error: errors.phone }" autocomplete="tel" />
            </label>
            <label>
              <span class="label-text">{{ copy.nationality }}</span>
              <input v-model="form.nationality" type="text" />
            </label>
          </div>

          <div class="field-row">
            <label>
              <span class="label-text">{{ copy.roomType }} <em>*</em></span>
              <select v-model="form.roomType" :class="{ error: errors.roomType }">
                <option value="">{{ copy.roomTypePick }}</option>
                <option v-for="r in roomOptions" :key="r.id" :value="r.id">
                  {{ r.title }} — {{ r.price }} {{ r.period }}
                </option>
              </select>
            </label>
            <label>
              <span class="label-text">{{ copy.occupancy }}</span>
              <select v-model="form.occupancy">
                <option value="">—</option>
                <option v-for="o in copy.occupancies" :key="o" :value="o">{{ o }}</option>
              </select>
            </label>
          </div>

          <div class="field-row">
            <label>
              <span class="label-text">{{ copy.moveInDate }} <em>*</em></span>
              <input v-model="form.moveInDate" type="date" :class="{ error: errors.moveInDate }" />
            </label>
            <label>
              <span class="label-text">{{ copy.duration }}</span>
              <select v-model="form.duration">
                <option value="">—</option>
                <option v-for="d in copy.durations" :key="d" :value="d">{{ d }}</option>
              </select>
            </label>
          </div>

          <label class="full">
            <span class="label-text">{{ copy.message }}</span>
            <textarea v-model="form.message" rows="4"></textarea>
          </label>

          <div class="contact-section">
            <label class="full">
              <span class="label-text">{{ copy.contactMethod }} <em>*</em></span>
              <div class="contact-options">
                <label v-for="(label, key) in copy.contactMethods" :key="key" class="contact-option" :class="{ active: form.contactMethod === key }">
                  <input type="radio" v-model="form.contactMethod" :value="key" />
                  <span>{{ label }}</span>
                </label>
              </div>
            </label>
            <div v-if="form.contactMethod === 'whatsapp'" class="contact-extra">
              <label class="check-row">
                <input type="checkbox" v-model="form.whatsappSameAsPhone" />
                <span>{{ copy.whatsappSameAsPhone }}</span>
              </label>
              <label v-if="!form.whatsappSameAsPhone">
                <span class="label-text">{{ copy.whatsappLabel }}</span>
                <input v-model="form.whatsappNumber" type="tel" placeholder="+852 9123 4567" />
              </label>
            </div>
            <div v-else-if="form.contactMethod === 'wechat'" class="contact-extra">
              <label>
                <span class="label-text">{{ copy.wechatLabel }} <em>*</em></span>
                <input v-model="form.wechatId" placeholder="WeChat ID" />
              </label>
            </div>
          </div>

          <div v-if="result?.error" class="form-error">
            <strong>{{ copy.errorTitle }}</strong>
            <span>{{ copy.errorBody }}</span>
          </div>

          <div class="form-footer">
            <button type="submit" class="btn-primary large" :disabled="submitting">
              {{ submitting ? copy.submitting : (copy.submit + ' →') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.booking-page {
  min-height: 100vh;
  padding: var(--space-lg) 0 var(--space-xl);
  background: var(--cream);
}
.container { max-width: 780px; }
.contact-section { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; background: var(--paper); border-radius: 6px; }
.contact-options { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; }
.contact-option { display: flex; align-items: center; gap: 0.4rem; padding: 0.65rem 0.85rem; background: var(--white); border: 1px solid var(--warm-gray-300); border-radius: 4px; cursor: pointer; font-size: 0.85rem; transition: all 0.15s; }
.contact-option input { width: auto; margin: 0; }
.contact-option.active { border-color: var(--ink); background: #fafaf2; }
.contact-extra { display: flex; flex-direction: column; gap: 0.6rem; padding-top: 0.5rem; }
.contact-extra label { display: flex; flex-direction: column; gap: 0.3rem; }
.check-row { display: flex; gap: 0.5rem; align-items: center; cursor: pointer; font-size: 0.85rem; }
.check-row input { width: auto; }
@media (max-width: 640px) {
  .contact-options { grid-template-columns: repeat(2, 1fr); }
}
.form-card, .success-card {
  background: var(--white);
  border: 1px solid var(--warm-gray-100);
  border-radius: 8px;
  padding: clamp(2rem, 5vw, 4rem);
}
.form-header { margin-bottom: var(--space-md); }
.form-header h1 { margin: 0.4rem 0 1rem; }
.lead { color: var(--warm-gray-700); font-size: 1.05rem; }
.eyebrow { color: var(--warm-gray-500); font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; }

form { display: flex; flex-direction: column; gap: var(--space-md); }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.field-row > label, label.full { display: flex; flex-direction: column; gap: 0.5rem; }
.label-text { font-size: 0.85rem; color: var(--ink); font-weight: 400; }
.label-text em { color: #b06b6b; font-style: normal; }

/* Inputs styled by global .dl-form (cream bg, 1.5px border, neon focus). Only keep error state here. */
.error { border-color: #d62828 !important; box-shadow: 0 0 0 3px rgba(214,40,40,0.12) !important; }

textarea { resize: vertical; min-height: 100px; }

.form-error {
  background: #fdf3f3;
  border: 1px solid #e0c8c8;
  border-radius: 4px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #6b4444;
}
.form-error strong { font-weight: 500; }

.form-footer { display: flex; justify-content: flex-end; margin-top: var(--space-sm); }
.btn-primary {
  background: var(--ink);
  color: var(--white);
  padding: 0.85rem 2rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font: inherit;
  letter-spacing: 0.04em;
  transition: opacity 0.2s;
}
.btn-primary.large { padding: 1.1rem 2.5rem; font-size: 1rem; }
.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.success-card { text-align: center; }
.success-card h1 { margin: 0.5rem 0 var(--space-md); }
.success-lead { color: var(--warm-gray-700); margin-bottom: 0.5rem; }
.booking-id {
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 1.5rem;
  letter-spacing: 0.05em;
  color: var(--ink);
  background: var(--paper);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: var(--space-md);
}
.success-body { color: var(--warm-gray-700); margin-bottom: var(--space-md); }
.contact-note { color: var(--ink); margin: 0 0 0.5rem; font-weight: 500; }

@media (max-width: 640px) {
  .field-row { grid-template-columns: 1fr; }
  .form-card, .success-card { padding: 1.5rem; }
}
</style>
