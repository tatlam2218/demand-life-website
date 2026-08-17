<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteFooter from './components/SiteFooter.vue'

const route = useRoute()

// Hide footer on admin pages and on the contract sign page (embedded / kiosk)
const showFooter = computed(() => {
  const p = route.path || ''
  return !p.startsWith('/admin') && !p.startsWith('/login') && p !== '/book/contract'
})
</script>

<template>
  <RouterView />
  <SiteFooter v-if="showFooter" />
</template>
