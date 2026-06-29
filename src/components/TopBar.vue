<script setup>
import { ref } from 'vue'
import { useI18n } from '../i18n'
import { useSiteContent } from '../composables/useSiteContent'

const props = defineProps({
  current: { type: String, default: 'hotel' }
})

const { locale, setLocale, languages, t } = useI18n()
const { navigation } = useSiteContent()

const langOpen = ref(false)
function toggleLang() {
  langOpen.value = !langOpen.value
}
function pickLang(code) {
  setLocale(code)
  langOpen.value = false
}

// About / Contact modals
const aboutOpen = ref(false)
const contactOpen = ref(false)
const appOpen = ref(false)
function openAbout() {
  aboutOpen.value = true
  contactOpen.value = false
  appOpen.value = false
}
function openContact() {
  contactOpen.value = true
  aboutOpen.value = false
  appOpen.value = false
}
function openApp() {
  appOpen.value = true
  aboutOpen.value = false
  contactOpen.value = false
}
function closeModals() {
  aboutOpen.value = false
  contactOpen.value = false
  appOpen.value = false
}
</script>

<template>
  <header class="topbar" :class="{ 'topbar-dark': current === 'shop' }">
    <div class="topbar-inner container">
      <a href="https://www.demainculture.com" target="_blank" rel="noopener" class="brand" aria-label="Demain Culture">
        <img
          src="/brand/demain-culture-logo.webp?v=20260628"
          alt="未來文化 Demain Culture"
          class="brand-logo"
        />
      </a>

      <nav class="topbar-nav">
        <button type="button" class="nav-link nav-link-btn" @click="openAbout">{{ navigation.about || 'About' }}</button>
        <button type="button" class="nav-link nav-link-btn" @click="openContact">{{ navigation.contact || 'Contact' }}</button>
        <button type="button" class="nav-link nav-link-btn nav-link-app" @click="openApp">{{ t('nav.domainClubApp') || 'Demain Club App' }}</button>

        <!-- Language switcher -->
        <div class="lang-switch" :class="{ open: langOpen }">
          <button class="lang-current" @click="toggleLang" :aria-expanded="langOpen">
            <span>{{ languages.find(l => l.code === locale)?.label }}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div v-if="langOpen" class="lang-dropdown">
            <button
              v-for="lang in languages"
              :key="lang.code"
              class="lang-option"
              :class="{ active: lang.code === locale }"
              @click="pickLang(lang.code)"
            >
              <span class="lang-mark">{{ lang.label }}</span>
              <span class="lang-name">{{ lang.name }}</span>
            </button>
          </div>
        </div>
      </nav>
    </div>

    <!-- Click-away backdrop -->
    <div v-if="langOpen" class="lang-backdrop" @click="langOpen = false"></div>
  </header>

  <!-- About modal -->
  <transition name="modal-fade">
    <div v-if="aboutOpen" class="info-modal-backdrop" @click.self="closeModals">
      <div class="info-modal">
        <button class="info-modal-close" @click="closeModals" aria-label="Close">×</button>
        <p class="info-modal-eyebrow"><span class="info-modal-dot"></span>{{ t('about.eyebrow') }}</p>
        <h2 class="info-modal-title">{{ t('about.title') }}</h2>
        <p class="info-modal-body">{{ t('about.body') }}</p>
        <a href="https://www.demainculture.com" target="_blank" rel="noopener" class="info-modal-cta">
          {{ t('about.visit') }}
        </a>
      </div>
    </div>
  </transition>

  <!-- Contact modal -->
  <transition name="modal-fade">
    <div v-if="contactOpen" class="info-modal-backdrop" @click.self="closeModals">
      <div class="info-modal">
        <button class="info-modal-close" @click="closeModals" aria-label="Close">×</button>
        <p class="info-modal-eyebrow"><span class="info-modal-dot"></span>{{ t('contact.title') }}</p>
        <h2 class="info-modal-title">Demain Life</h2>
        <div class="info-modal-row">
          <span class="info-row-icon">📍</span>
          <span class="info-row-text">{{ t('contact.address') }}</span>
        </div>
        <div class="info-modal-row">
          <span class="info-row-icon">▸</span>
          <a href="https://instagram.com/demain_culture_group" target="_blank" rel="noopener" class="info-row-link">
            {{ t('contact.instagram') }}
          </a>
        </div>
        <div class="info-modal-row">
          <span class="info-row-icon">▸</span>
          <a href="https://www.demain.hk" target="_blank" rel="noopener" class="info-row-link">
            {{ t('contact.web') }}
          </a>
        </div>
        <p class="info-modal-foot">{{ t('contact.parent') }}</p>
      </div>
    </div>
  </transition>

  <!-- Demain Club App modal -->
  <transition name="modal-fade">
    <div v-if="appOpen" class="info-modal-backdrop" @click.self="closeModals">
      <div class="info-modal info-modal-app">
        <button class="info-modal-close" @click="closeModals" aria-label="Close">×</button>
        <div class="app-modal-media">
          <img
            src="/site/domain-club-app-coming-soon.webp?v=20260628a"
            alt="Demain Club App coming soon artwork"
            class="app-modal-image"
          />
          <div class="app-modal-badge">{{ t('domainClub.comingSoon') }}</div>
        </div>
        <p class="info-modal-eyebrow"><span class="info-modal-dot"></span>{{ t('domainClub.eyebrow') }}</p>
        <h2 class="info-modal-title app-modal-title">{{ t('domainClub.title') }}</h2>
        <p class="info-modal-body">{{ t('domainClub.body1') }}</p>
        <p class="info-modal-body info-modal-body-tight">{{ t('domainClub.body2') }}</p>
        <div class="app-feature-list">
          <span class="app-feature-pill">{{ t('domainClub.featureStay') }}</span>
          <span class="app-feature-pill">{{ t('domainClub.featureShop') }}</span>
          <span class="app-feature-pill">{{ t('domainClub.featureMembership') }}</span>
          <span class="app-feature-pill">{{ t('domainClub.featureExperiences') }}</span>
        </div>
        <p class="info-modal-foot">{{ t('domainClub.foot') }}</p>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  /* Always-dark TopBar so the neon-green Demain Culture logo glows on every page */
  background: rgba(13, 13, 13, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.4s ease;
}

/* Nav links default — light text on dark background */
.nav-link { color: rgba(255,255,255,0.65); }
.nav-link:hover { color: #ffffff; }

/* Lang switcher — dark variant by default */
.lang-current {
  color: #ffffff;
  border-color: rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.04);
}
.lang-current:hover { border-color: rgba(255,255,255,0.4); }
.lang-switch.open .lang-current {
  background: var(--color-neon, #39ff14);
  color: #0d0d0d;
  border-color: var(--color-neon, #39ff14);
}

/* When Shop tab active — slightly stronger blur + extra neon glow on logo */
.topbar.topbar-dark {
  background: rgba(13, 13, 13, 0.90);
}

.topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  /* Subtle hover lift */
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.brand:hover { opacity: 0.85; }

/* Neon-green Demain Culture logo (未來文化).
   Native aspect is 1181x250 = ~4.72:1. We constrain by height so it scales
   cleanly in both light (Stay) and dark (Shop) topbar variants. */
.brand-logo {
  display: block;
  height: 38px;
  width: auto;
  max-width: 220px;
  /* Neon-green glow always-on now that the TopBar is dark */
  filter: drop-shadow(0 0 8px rgba(57,255,20,0.45)) drop-shadow(0 0 16px rgba(57,255,20,0.20));
  transition: filter 0.4s ease;
}
.topbar.topbar-dark .brand-logo {
  filter: drop-shadow(0 0 12px rgba(57,255,20,0.65)) drop-shadow(0 0 22px rgba(57,255,20,0.30));
}

.topbar-nav {
  display: flex;
  gap: 1.8rem;
  align-items: center;
}

.nav-link {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.72);
  font-weight: 400;
  transition: color 0.2s, opacity 0.2s;
}

.nav-link:hover {
  color: #ffffff;
}

/* Language switcher */
.lang-switch {
  position: relative;
  z-index: 60;
}

.lang-current {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.42rem 0.78rem;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  color: #ffffff;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.30);
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
  transition: all 0.2s;
}

.lang-current:hover {
  border-color: rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.06);
}

.lang-switch.open .lang-current {
  background: var(--color-neon, #39ff14);
  color: #0d0d0d;
  border-color: var(--color-neon, #39ff14);
  box-shadow: 0 0 0 1px rgba(57,255,20,0.45), 0 0 14px rgba(57,255,20,0.22);
}

.lang-dropdown {
  position: absolute;
  top: calc(100% + 0.4rem);
  right: 0;
  min-width: 180px;
  background: rgba(18,18,18,0.96);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px;
  padding: 0.4rem;
  box-shadow: 0 12px 36px rgba(0,0,0,0.42);
  z-index: 70;
  animation: dropdownIn 0.18s ease;
}

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.lang-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.7rem;
  font-size: 0.85rem;
  text-align: left;
  border-radius: 6px;
  color: rgba(255,255,255,0.78);
  transition: all 0.15s;
}

.lang-option:hover {
  background: rgba(255,255,255,0.06);
  color: #ffffff;
}

.lang-option.active {
  background: rgba(57,255,20,0.10);
  color: #39ff14;
}

.lang-mark {
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: rgba(255,255,255,0.07);
  font-size: 0.75rem;
  font-weight: 500;
  color: #ffffff;
}

.lang-option.active .lang-mark {
  background: #39ff14;
  color: #0d0d0d;
}

.lang-name {
  flex: 1;
  letter-spacing: 0.02em;
}

/* Backdrop */
.lang-backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
}

/* Make nav-link work the same whether it's an <a> or <button> */
.nav-link.nav-link-btn {
  background: transparent;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  letter-spacing: 0.02em;
}

.nav-link.nav-link-btn.nav-link-app {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.48rem 0.88rem;
  min-height: 34px;
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 0.74rem;
  line-height: 1;
  border: 1px solid rgba(255, 95, 162, 0.45) !important;
  border-radius: 999px;
  color: #ff8bc0;
  background: rgba(255, 95, 162, 0.08) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 95, 162, 0.08), 0 0 18px rgba(255, 95, 162, 0.08);
  transition: transform 0.2s ease, color 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.nav-link-app:hover {
  color: #ffffff;
  border-color: rgba(255, 95, 162, 0.8) !important;
  background: rgba(255, 95, 162, 0.14) !important;
  box-shadow: 0 0 0 1px rgba(255, 95, 162, 0.22), 0 0 24px rgba(255, 95, 162, 0.2);
  transform: translateY(-1px);
}

/* About / Contact modals */
.info-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(13, 13, 13, 0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.info-modal {
  position: relative;
  max-width: 540px;
  width: 100%;
  background: linear-gradient(180deg, #181816 0%, #0d0d0d 100%);
  border: 1px solid rgba(57, 255, 20, 0.30);
  border-radius: 14px;
  padding: 2.4rem 2rem 2rem;
  color: #ffffff;
  box-shadow: 0 0 0 1px rgba(57,255,20,0.10), 0 30px 70px rgba(0,0,0,0.55);
}
.info-modal-close {
  position: absolute;
  top: 0.8rem; right: 1rem;
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 50%;
  color: rgba(255,255,255,0.7);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s;
}
.info-modal-close:hover {
  background: rgba(57, 255, 20, 0.15);
  border-color: var(--color-neon, #39ff14);
  color: var(--color-neon, #39ff14);
}
.info-modal-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
  font-weight: 600;
  margin: 0 0 1rem;
}
.info-modal-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-neon, #39ff14);
  box-shadow: 0 0 10px rgba(57,255,20,0.7);
}
.info-modal-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-neon, #39ff14);
  text-shadow: 0 0 18px rgba(57,255,20,0.40);
  margin: 0 0 1.2rem;
  letter-spacing: -0.01em;
}
.info-modal-body {
  font-size: 0.92rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.82);
  margin: 0 0 1.6rem;
}
.info-modal-cta {
  display: inline-block;
  background: var(--color-neon, #39ff14);
  color: #0d0d0d;
  padding: 0.7rem 1.2rem;
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-decoration: none;
  box-shadow: 0 0 0 1px rgba(57,255,20,0.6), 0 6px 18px rgba(57,255,20,0.35);
  transition: transform 0.2s, box-shadow 0.2s;
}
.info-modal-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 0 1px rgba(57,255,20,0.8), 0 12px 28px rgba(57,255,20,0.5);
}
.info-modal-row {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 0.7rem 0;
  border-bottom: 1px dashed rgba(255,255,255,0.10);
  font-size: 0.92rem;
  color: rgba(255,255,255,0.82);
}
.info-modal-row:last-of-type { border-bottom: none; }

.info-modal-app {
  max-width: 720px;
  padding-top: 1.2rem;
}

.app-modal-media {
  position: relative;
  margin: 0 0 1.4rem;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 18px 42px rgba(0,0,0,0.35);
}

.app-modal-image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: #0d0d0d;
}

.app-modal-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: inline-flex;
  align-items: center;
  padding: 0.42rem 0.78rem;
  border-radius: 999px;
  background: rgba(13, 13, 13, 0.8);
  color: #39ff14;
  border: 1px solid rgba(57,255,20,0.28);
  box-shadow: 0 0 18px rgba(57,255,20,0.12);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.app-modal-title {
  max-width: 14ch;
}

.info-modal-body-tight {
  margin-top: -0.5rem;
  margin-bottom: 0;
}

.app-feature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.3rem;
}

.app-feature-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.78rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.88);
  font-size: 0.76rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.info-row-icon {
  flex-shrink: 0;
  color: var(--color-neon, #39ff14);
  width: 20px;
  text-align: center;
}
.info-row-text { line-height: 1.5; }
.info-row-link {
  color: var(--color-neon, #39ff14);
  text-decoration: none;
  border-bottom: 1px dotted rgba(57,255,20,0.35);
  transition: color 0.15s;
}
.info-row-link:hover { color: #ffffff; border-bottom-color: #ffffff; }
.info-modal-foot {
  margin: 1.2rem 0 0;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
  font-weight: 500;
  text-align: center;
}
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.22s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .info-modal,
.modal-fade-leave-active .info-modal {
  transition: transform 0.28s cubic-bezier(0.4, 1.4, 0.6, 1), opacity 0.22s;
}
.modal-fade-enter-from .info-modal { opacity: 0; transform: translateY(20px) scale(0.96); }
.modal-fade-leave-to .info-modal { opacity: 0; transform: translateY(10px) scale(0.98); }

/* Responsive */
@media (max-width: 640px) {
  .topbar-nav .nav-link {
    display: none;
  }
  .topbar-nav .nav-link-app {
    display: inline-flex;
    max-width: 122px;
    justify-content: center;
    text-align: center;
    line-height: 1.1;
    white-space: normal;
    font-size: 0.66rem;
    padding: 0.42rem 0.58rem;
  }
  .topbar-nav {
    gap: 0.5rem;
  }
  .brand-logo {
    height: 24px;
  }
  .info-modal-app {
    padding: 1rem 1rem 1.4rem;
  }
  .app-modal-badge {
    top: 0.8rem;
    left: 0.8rem;
  }
}
@media (max-width: 380px) {
  /* On very narrow phones, swap to the symbol-only mark to leave room for nav */
  .brand-logo {
    height: 26px;
    content: url('/brand/demain-culture-mark.webp?v=20260628');
  }
}
</style>
