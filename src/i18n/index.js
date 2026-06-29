import { ref, computed } from 'vue'
import en from './locales/en.js'
import zhCN from './locales/zh-CN.js'
import zhHK from './locales/zh-HK.js'

const messages = {
  'en': en,
  'zh-CN': zhCN,
  'zh-HK': zhHK
}

// Available languages
export const languages = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'zh-HK', label: '繁', name: '繁體中文' },
  { code: 'zh-CN', label: '简', name: '简体中文' }
]

function getInitialLocale() {
  if (typeof window === 'undefined') return 'en'
  const saved = localStorage.getItem('demain-locale')
  if (saved && messages[saved]) return saved
  const browser = navigator.language || 'en'
  if (browser.startsWith('zh-HK') || browser.startsWith('zh-TW') || browser.startsWith('zh-Hant')) return 'zh-HK'
  if (browser.startsWith('zh')) return 'zh-CN'
  return 'en'
}

// Singleton reactive locale state
export const currentLocale = ref(getInitialLocale())

function resolveKey(obj, key) {
  const parts = key.split('.')
  let v = obj
  for (const p of parts) {
    if (v == null) return undefined
    v = v[p]
  }
  return v
}

export function useI18n() {
  // t() must be reactive — wrap in computed
  const t = (key) => {
    const value = resolveKey(messages[currentLocale.value], key)
    return value !== undefined ? value : key
  }

  const tArr = (key) => {
    const value = resolveKey(messages[currentLocale.value], key)
    return Array.isArray(value) ? value : []
  }

  const setLocale = (code) => {
    if (messages[code]) {
      currentLocale.value = code
      if (typeof window !== 'undefined') {
        localStorage.setItem('demain-locale', code)
        document.documentElement.lang = code
      }
    }
  }

  return {
    locale: currentLocale,
    t,
    tArr,
    setLocale,
    languages
  }
}
