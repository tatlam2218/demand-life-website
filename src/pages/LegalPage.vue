<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentLocale, useI18n } from '../i18n'

const route = useRoute()
const router = useRouter()
useI18n()

const type = ref('terms')
const html = ref('')
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  // Determine type from path
  type.value = route.path.includes('/privacy') ? 'privacy' : 'terms'
  try {
    const resp = await fetch(`/api/legal?type=${type.value}&lang=${currentLocale.value}`)
    const data = await resp.json()
    if (resp.ok) html.value = data.html
    else error.value = data.error
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

watch(currentLocale, load)
watch(() => route.path, load)
onMounted(load)
</script>

<template>
  <section class="legal-page">
    <div class="container">
      <button class="back-btn" @click="router.back()">← Back</button>
      <div v-if="loading" class="muted">Loading…</div>
      <div v-else-if="error" class="muted">{{ error }}</div>
      <article v-else class="legal-content" v-html="html"></article>
    </div>
  </section>
</template>

<style scoped>
.legal-page { min-height: 100vh; padding: var(--space-lg) 0 var(--space-xl); background: var(--white); }
.container { max-width: 740px; }
.back-btn {
  background: transparent; border: none; cursor: pointer;
  color: var(--warm-gray-700); font: inherit;
  padding: 0.5rem 0; margin-bottom: 1rem;
}
.back-btn:hover { color: var(--ink); }
.muted { color: var(--warm-gray-500); }
.legal-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--ink);
}
.legal-content :deep(h1) { font-size: 1.8rem; font-weight: 300; margin: 0 0 1.5rem; border-bottom: 1px solid var(--warm-gray-100); padding-bottom: 1rem; }
.legal-content :deep(h2) { font-size: 1.1rem; font-weight: 500; margin: 2rem 0 0.75rem; }
.legal-content :deep(p) { margin: 0.75rem 0; color: var(--warm-gray-700); }
.legal-content :deep(ul) { margin: 0.75rem 0; padding-left: 1.5rem; }
.legal-content :deep(li) { margin: 0.3rem 0; color: var(--warm-gray-700); }
.legal-content :deep(a) { color: var(--accent); text-decoration: underline; }
.legal-content :deep(em) { color: var(--warm-gray-500); }
</style>
