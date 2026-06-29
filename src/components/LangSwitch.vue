<script setup>
import { ref } from 'vue'
import { useI18n } from '../i18n'

const { locale, setLocale, languages } = useI18n()
const open = ref(false)

function pick(code) {
  setLocale(code)
  open.value = false
}
</script>

<template>
  <div class="lang-switch" :class="{ open }">
    <button class="lang-btn" @click="open = !open" type="button" :aria-label="'Language'">
      <span>🌐</span>
      <span class="label">{{ languages.find(l => l.code === locale)?.label }}</span>
      <span class="caret">▾</span>
    </button>
    <div v-if="open" class="lang-menu" @click.self="open = false">
      <button
        v-for="lang in languages"
        :key="lang.code"
        class="lang-option"
        :class="{ active: lang.code === locale }"
        @click="pick(lang.code)"
        type="button"
      >
        {{ lang.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.lang-switch { position: relative; display: inline-block; }
.lang-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: rgba(255,255,255,0.7); border: 1px solid rgba(0,0,0,0.08);
  padding: 0.35rem 0.75rem; border-radius: 100px;
  font-size: 0.85rem; font-family: inherit; cursor: pointer;
  color: #2a2826; transition: background 0.15s;
}
.lang-btn:hover { background: rgba(255,255,255,0.95); }
.label { font-weight: 500; letter-spacing: 0.04em; }
.caret { font-size: 0.7rem; opacity: 0.6; }
.lang-menu {
  position: absolute; top: calc(100% + 6px); right: 0;
  background: #fff; border: 1px solid rgba(0,0,0,0.08);
  border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 0.3rem; min-width: 140px; z-index: 1000;
  display: flex; flex-direction: column; gap: 0.1rem;
}
.lang-option {
  background: transparent; border: none; padding: 0.55rem 0.8rem;
  text-align: left; font-family: inherit; font-size: 0.88rem;
  border-radius: 5px; cursor: pointer; color: #2a2826;
}
.lang-option:hover { background: #f5f3ee; }
.lang-option.active { background: #2a2826; color: #fff; }

/* Dark theme variant (auto-detected via parent class) */
:global(.dark-bg) .lang-btn { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); color: #fff; }
:global(.dark-bg) .lang-btn:hover { background: rgba(255,255,255,0.15); }
</style>
