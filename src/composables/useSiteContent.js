import { reactive, computed } from 'vue'
import { currentLocale } from '../i18n'
import { cloneDefaultSiteData } from '../../shared/defaultContent.js'

const state = reactive({
  loading: false,
  loaded: false,
  data: cloneDefaultSiteData(),
  error: ''
})

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

export async function loadSiteContent(force = false) {
  if (state.loading) return
  if (state.loaded && !force) return
  state.loading = true
  state.error = ''
  try {
    const res = await fetch('/api/content', { headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error('Failed to load content')
    const json = await res.json()
    state.data = json?.data ? json.data : cloneDefaultSiteData()
    state.loaded = true
  } catch (error) {
    state.error = error?.message || 'Failed to load content'
    state.data = cloneDefaultSiteData()
    state.loaded = true
  } finally {
    state.loading = false
  }
}

export function useSiteContent() {
  const locale = currentLocale

  const getTranslations = (translations) => {
    if (!translations) return {}
    return translations[locale.value] || translations.en || translations['zh-HK'] || translations['zh-CN'] || {}
  }

  const navigation = computed(() => getTranslations(state.data.navigation?.translations))
  const swipe = computed(() => getTranslations(state.data.swipe?.translations))
  const hotel = computed(() => ({
    ...getTranslations(state.data.hotel?.translations),
    heroImages: state.data.hotel?.heroImages || []
  }))
  const shop = computed(() => ({
    ...getTranslations(state.data.shop?.translations),
    heroImages: state.data.shop?.heroImages || []
  }))
  const lifeHere = computed(() => ({
    ...getTranslations(state.data.lifeHere?.translations),
    heroImages: state.data.lifeHere?.heroImages || []
  }))
  const site = computed(() => ({
    ...getTranslations(state.data.site?.translations),
    heroImages: state.data.site?.heroImages || []
  }))
  const transport = computed(() => ({
    ...getTranslations(state.data.transport?.translations),
    heroImages: state.data.transport?.heroImages || []
  }))

  const rooms = computed(() =>
    (state.data.rooms || [])
      .slice()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((room) => ({
        id: room.id,
        primaryLanguage: room.primaryLanguage || 'en',
        images: room.images || [],
        ...getTranslations(room.translations)
      }))
  )

  const products = computed(() =>
    (state.data.products || [])
      .slice()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((product) => ({
        id: product.id,
        primaryLanguage: product.primaryLanguage || 'en',
        images: product.images || [],
        ...getTranslations(product.translations)
      }))
  )

  return {
    state,
    locale,
    navigation,
    swipe,
    hotel,
    shop,
    lifeHere,
    site,
    transport,
    rooms,
    products,
    loadSiteContent,
    resetContent() {
      state.data = cloneDefaultSiteData()
      state.loaded = true
      state.error = ''
    },
    rawData: computed(() => state.data),
    cloneRawData() {
      return deepClone(state.data)
    }
  }
}
