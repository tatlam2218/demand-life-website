<script setup>
import { ref, computed } from 'vue'
import { currentLocale, useI18n } from '../i18n'
import { useRoute } from 'vue-router'

const route = useRoute()
useI18n()

const urlLang = route.query.lang
if (urlLang === 'en' || urlLang === 'zh-CN' || urlLang === 'zh-HK') {
  currentLocale.value = urlLang
}

const COPY = {
  en: {
    eyebrow:     'Demain App',
    title:       'Be first in.',
    lead:        'The Demain app is coming — manage your stay, book amenities, join community events, and more, all from your phone. Leave your name and email and we\'ll notify you the moment it launches.',
    namePlaceholder:  'Your name',
    emailPlaceholder: 'Your email address',
    submitBtn:   'Join the list →',
    submitting:  'Joining…',
    successTitle: 'You\'re on the list! 🎉',
    successBody:  'We\'ll email you as soon as the app is ready. Stay tuned.',
    errorDupe:    'This email is already registered.',
    errorGeneric: 'Something went wrong. Please try again.',
    nameRequired: 'Please enter your name.',
    emailInvalid: 'Please enter a valid email address.',
    backHome:     '← Back to homepage'
  },
  'zh-HK': {
    eyebrow:     'Demain App',
    title:       '率先體驗。',
    lead:        'Demain App 即將推出——管理入住、預訂設施、加入社區活動，一切盡在掌中。留下姓名和電郵，我們將在 App 上線時第一時間通知您。',
    namePlaceholder:  '您的姓名',
    emailPlaceholder: '您的電郵地址',
    submitBtn:   '加入名單 →',
    submitting:  '提交中…',
    successTitle: '您已成功加入！🎉',
    successBody:  'App 準備就緒後，我們將立即發送電郵通知。',
    errorDupe:    '此電郵已登記。',
    errorGeneric: '出現問題，請重試。',
    nameRequired: '請輸入您的姓名。',
    emailInvalid: '請輸入有效的電郵地址。',
    backHome:     '← 返回首頁'
  },
  'zh-CN': {
    eyebrow:     'Demain App',
    title:       '率先体验。',
    lead:        'Demain App 即将推出——管理入住、预订设施、加入社区活动，一切尽在掌中。留下姓名和邮箱，我们将在 App 上线时第一时间通知您。',
    namePlaceholder:  '您的姓名',
    emailPlaceholder: '您的邮箱地址',
    submitBtn:   '加入名单 →',
    submitting:  '提交中…',
    successTitle: '您已成功加入！🎉',
    successBody:  'App 准备就绪后，我们将立即发送邮件通知。',
    errorDupe:    '此邮箱已登记。',
    errorGeneric: '出现问题，请重试。',
    nameRequired: '请输入您的姓名。',
    emailInvalid: '请输入有效的邮箱地址。',
    backHome:     '← 返回首页'
  }
}

const copy = computed(() => COPY[currentLocale.value] || COPY.en)

const name  = ref('')
const email = ref('')
const state = ref('idle') // idle | submitting | success | error
const errorMsg = ref('')

async function submit() {
  if (state.value === 'submitting') return

  // Client-side validation
  if (!name.value.trim()) { errorMsg.value = copy.value.nameRequired; return }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(email.value.trim())) { errorMsg.value = copy.value.emailInvalid; return }

  state.value = 'submitting'
  errorMsg.value = ''

  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name:   name.value.trim(),
        email:  email.value.trim().toLowerCase(),
        locale: currentLocale.value || 'en'
      })
    })
    const r = await res.json()
    if (res.ok && r.success) {
      state.value = 'success'
    } else if (r.error === 'already_registered') {
      errorMsg.value = copy.value.errorDupe
      state.value = 'error'
    } else {
      errorMsg.value = r.message || copy.value.errorGeneric
      state.value = 'error'
    }
  } catch {
    errorMsg.value = copy.value.errorGeneric
    state.value = 'error'
  }
}
</script>

<template>
  <section class="waitlist-page">
    <div class="container">

      <!-- Back link -->
      <a href="/" class="back-link">{{ copy.backHome }}</a>

      <!-- Success state -->
      <div v-if="state === 'success'" class="card success-card">
        <div class="success-icon">✓</div>
        <h1>{{ copy.successTitle }}</h1>
        <p class="lead">{{ copy.successBody }}</p>
        <a href="/" class="btn-primary">{{ copy.backHome }}</a>
      </div>

      <!-- Form state -->
      <div v-else class="card form-card">
        <p class="eyebrow">{{ copy.eyebrow }}</p>
        <h1>{{ copy.title }}</h1>
        <p class="lead">{{ copy.lead }}</p>

        <form class="form" @submit.prevent="submit">
          <div class="field">
            <input
              v-model="name"
              type="text"
              :placeholder="copy.namePlaceholder"
              autocomplete="name"
              class="input"
              :disabled="state === 'submitting'"
            />
          </div>
          <div class="field">
            <input
              v-model="email"
              type="email"
              :placeholder="copy.emailPlaceholder"
              autocomplete="email"
              class="input"
              :disabled="state === 'submitting'"
            />
          </div>

          <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>

          <button type="submit" class="btn-primary" :disabled="state === 'submitting'">
            {{ state === 'submitting' ? copy.submitting : copy.submitBtn }}
          </button>
        </form>

        <!-- Decorative neon dot strip -->
        <div class="dot-strip" aria-hidden="true">
          <span v-for="n in 5" :key="n" class="dot"></span>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
.waitlist-page {
  min-height: 100vh;
  background: #0d0d0d;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 3rem 1.5rem 6rem;
}
.container {
  max-width: 520px;
  width: 100%;
}
.back-link {
  display: inline-block;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  text-decoration: none;
  margin-bottom: 2.5rem;
  transition: color 0.15s;
}
.back-link:hover { color: rgba(255,255,255,0.8); }

.card {
  background: #161616;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: clamp(2rem, 5vw, 3rem);
  position: relative;
  overflow: hidden;
}

/* Neon top-border glow */
.card::before {
  content: '';
  position: absolute;
  top: 0; left: 10%; right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #39ff14 50%, transparent);
  opacity: 0.7;
}

.eyebrow {
  font-size: 0.68rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #39ff14;
  margin: 0 0 1rem;
  font-weight: 600;
}
h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 300;
  color: #fff;
  line-height: 1.05;
  letter-spacing: -0.025em;
  margin: 0 0 1.25rem;
}
.lead {
  font-size: 0.92rem;
  color: rgba(255,255,255,0.55);
  line-height: 1.75;
  margin: 0 0 2rem;
}

.form { display: flex; flex-direction: column; gap: 0.85rem; }
.field { display: flex; flex-direction: column; }
.input {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  padding: 0.9rem 1.1rem;
  font: inherit;
  font-size: 0.95rem;
  color: #fff;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}
.input::placeholder { color: rgba(255,255,255,0.3); }
.input:focus {
  border-color: #39ff14;
  background: rgba(57,255,20,0.04);
  box-shadow: 0 0 0 3px rgba(57,255,20,0.08);
}
.input:disabled { opacity: 0.5; cursor: not-allowed; }

.form-error {
  background: rgba(255,80,80,0.1);
  border: 1px solid rgba(255,80,80,0.3);
  border-radius: 6px;
  padding: 0.7rem 1rem;
  font-size: 0.85rem;
  color: #ff8080;
}

.btn-primary {
  display: inline-block;
  background: #39ff14;
  color: #0d0d0d;
  border: none;
  border-radius: 999px;
  padding: 0.9rem 2rem;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 0 0 1px rgba(57,255,20,0.5), 0 4px 18px rgba(57,255,20,0.35);
  margin-top: 0.4rem;
}
.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 0 0 1px rgba(57,255,20,0.8), 0 8px 26px rgba(57,255,20,0.5);
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Success card */
.success-card { text-align: center; padding: 3.5rem 2.5rem; }
.success-icon {
  width: 56px; height: 56px;
  background: rgba(57,255,20,0.12);
  border: 1.5px solid #39ff14;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem;
  color: #39ff14;
  margin: 0 auto 1.5rem;
  box-shadow: 0 0 18px rgba(57,255,20,0.3);
}

/* Decorative dot strip */
.dot-strip {
  display: flex;
  gap: 6px;
  margin-top: 2rem;
  justify-content: flex-end;
}
.dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #39ff14;
  opacity: 0.25;
}
.dot:last-child { opacity: 0.6; box-shadow: 0 0 6px rgba(57,255,20,0.8); }
</style>
