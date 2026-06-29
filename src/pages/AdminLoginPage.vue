<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  defaultRole: { type: String, default: 'stay' } // 'stay' | 'shop'
})

const router = useRouter()
const loading = ref(false)
const error = ref('')
const form = reactive({
  username: props.defaultRole === 'shop' ? 'admin_shop' : 'admin_stay',
  password: ''
})

const portal = computed(() => props.defaultRole === 'shop'
  ? { key: 'shop', title: 'Shop Admin', subtitle: 'Manage orders, inventory and fulfillment.', accent: '#ff5fa2' }
  : { key: 'stay', title: 'Stay Admin', subtitle: 'Manage reservations, contracts and rooms.', accent: '#39ff14' }
)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form)
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Login failed')
    }
    const target = json.redirect || (json.role === 'shop' ? '/admin/shop' : '/admin/stay')
    router.push(target)
  } catch (err) {
    error.value = err?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="admin-login-wrap" :class="`portal-${portal.key}`">
    <div class="bg-halftone" aria-hidden="true"></div>
    <div class="bg-grid" aria-hidden="true"></div>

    <div class="admin-login-card">
      <a href="https://www.demainculture.com" target="_blank" rel="noopener" class="brand-logo-wrap">
        <img src="/brand/demain-culture-logo.webp?v=20260628" alt="未來文化 Demain Culture" />
      </a>

      <p class="eyebrow"><span class="eyebrow-dot"></span>DEMAIN LIFE · ADMIN</p>

      <!-- CSS-only neon icon matching portal -->
      <div class="icon-wrap">
        <svg v-if="portal.key === 'stay'" class="neon-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 54 V20 L32 8 L52 20 V54 Z"/>
          <rect x="20" y="28" width="6" height="6"/>
          <rect x="38" y="28" width="6" height="6"/>
          <rect x="20" y="38" width="6" height="6"/>
          <rect x="38" y="38" width="6" height="6"/>
          <rect x="28" y="46" width="8" height="10"/>
        </svg>
        <svg v-else class="neon-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 22 H50 L46 56 H18 Z"/>
          <path d="M22 22 Q22 10 32 10 Q42 10 42 22"/>
          <circle cx="26" cy="34" r="1.5" fill="currentColor"/>
          <circle cx="38" cy="34" r="1.5" fill="currentColor"/>
        </svg>
      </div>

      <h1>
        <span class="thin">{{ portal.title.split(' ')[0] }}</span>
        <span class="neon">{{ portal.title.split(' ').slice(1).join(' ') }}.</span>
      </h1>
      <p class="lead">{{ portal.subtitle }}</p>

      <form class="login-form dl-form-dark" @submit.prevent="submit">
        <label>
          <span class="label-text">Username</span>
          <input v-model="form.username" autocomplete="username" />
        </label>
        <label>
          <span class="label-text">Password</span>
          <input v-model="form.password" type="password" autocomplete="current-password" />
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <button class="submit-btn" :disabled="loading">
          <span>{{ loading ? 'Signing in…' : 'Sign in →' }}</span>
        </button>
      </form>

      <p class="back-link">
        <router-link to="/login">← Choose a different portal</router-link>
      </p>
    </div>
  </section>
</template>

<style scoped>
.admin-login-wrap {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1.5rem;
  background: radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 100%);
  color: #ffffff;
  font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif;
  overflow: hidden;
}

/* Halftone background dots */
.bg-halftone {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1.5px);
  background-size: 16px 16px;
  pointer-events: none;
  z-index: 0;
}
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(57,255,20,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(57,255,20,0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

.admin-login-card {
  position: relative;
  z-index: 1;
  width: min(440px, 100%);
  background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%);
  border: 1.5px solid rgba(255,255,255,0.10);
  border-radius: 18px;
  padding: 2.2rem 2rem 1.8rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.45);
  text-align: center;
}

.brand-logo-wrap {
  display: inline-block;
  margin-bottom: 1.4rem;
}
.brand-logo-wrap img {
  height: 40px;
  width: auto;
  filter: drop-shadow(0 0 12px rgba(57,255,20,0.55)) drop-shadow(0 0 22px rgba(57,255,20,0.30));
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  margin: 0 0 1rem;
}
.eyebrow-dot {
  width: 8px;
  height: 8px;
  background: var(--portal-accent, #39ff14);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--portal-accent, #39ff14);
}

.portal-stay { --portal-accent: #39ff14; }
.portal-shop { --portal-accent: #ff5fa2; }

.icon-wrap {
  width: 84px;
  height: 84px;
  margin: 0 auto 1rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.02);
  border: 1.5px solid var(--portal-accent);
  box-shadow: 0 0 0 1px var(--portal-accent), 0 0 24px rgba(57,255,20,0.18);
  color: var(--portal-accent);
}
.portal-shop .icon-wrap { box-shadow: 0 0 0 1px var(--portal-accent), 0 0 24px rgba(255,95,162,0.20); }
.neon-icon {
  width: 44px;
  height: 44px;
  filter: drop-shadow(0 0 6px currentColor);
}

h1 {
  margin: 0.4rem 0 0.4rem;
  font-size: 1.9rem;
  font-weight: 200;
  letter-spacing: -0.01em;
  line-height: 1.15;
}
h1 .thin { color: rgba(255,255,255,0.85); margin-right: 0.4rem; }
h1 .neon {
  color: var(--portal-accent);
  font-weight: 500;
  text-shadow: 0 0 14px currentColor;
}

.lead {
  margin: 0 0 1.4rem;
  color: rgba(255,255,255,0.55);
  font-size: 0.92rem;
}

.login-form { display: grid; gap: 0.9rem; text-align: left; }
.login-form label { display: grid; gap: 0.4rem; }
.label-text {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.65);
  text-transform: uppercase;
}

.submit-btn {
  margin-top: 0.6rem;
  width: 100%;
  padding: 0.95rem 1rem;
  background: var(--portal-accent, #39ff14);
  color: #0d0d0d;
  border: none;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(57,255,20,0.45), 0 10px 26px rgba(57,255,20,0.30);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.portal-shop .submit-btn {
  box-shadow: 0 0 0 1px rgba(255,95,162,0.45), 0 10px 26px rgba(255,95,162,0.30);
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 0 1px var(--portal-accent), 0 14px 32px rgba(57,255,20,0.50);
}
.portal-shop .submit-btn:hover:not(:disabled) {
  box-shadow: 0 0 0 1px var(--portal-accent), 0 14px 32px rgba(255,95,162,0.50);
}
.submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.error {
  background: rgba(255, 95, 162, 0.10);
  color: #ff8db8;
  border: 1px solid rgba(255,95,162,0.35);
  padding: 0.65rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin: 0;
}

.back-link {
  margin: 1.4rem 0 0;
  font-size: 0.78rem;
  text-align: center;
  color: rgba(255,255,255,0.50);
}
.back-link a {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
}
.back-link a:hover { color: var(--portal-accent, #39ff14); }
</style>
