<script setup>
import { ref, computed, onMounted } from 'vue'
import HotelPage from './HotelPage.vue'
import ShopPage from './ShopPage.vue'
import SwipeNavigator from '../components/SwipeNavigator.vue'
import TopBar from '../components/TopBar.vue'
import { loadSiteContent } from '../composables/useSiteContent'

const pages = ['hotel', 'shop']
const initialIndex = (typeof window !== 'undefined' && window.location.hash === '#shop') ? 1 : 0
const currentIndex = ref(initialIndex)
const direction = ref('right')

const currentPage = computed(() => pages[currentIndex.value])
const transitionName = computed(() =>
  direction.value === 'right' ? 'curl-forward' : 'curl-back'
)

function goTo(index) {
  if (index === currentIndex.value) return
  direction.value = index > currentIndex.value ? 'right' : 'left'
  currentIndex.value = index
  if (typeof window !== 'undefined') {
    const newHash = pages[index] === 'shop' ? '#shop' : ''
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', window.location.pathname + window.location.search + newHash)
    }
  }
}

function next() {
  if (currentIndex.value < pages.length - 1) goTo(currentIndex.value + 1)
}
function prev() {
  if (currentIndex.value > 0) goTo(currentIndex.value - 1)
}

let touchStartX = 0
function onTouchStart(e) {
  touchStartX = e.touches[0].clientX
}
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 60) {
    if (dx < 0) next()
    else prev()
  }
}

// Sync currentIndex with URL hash (so navigating to /#shop or /#hotel switches tabs)
function syncFromHash() {
  if (typeof window === 'undefined') return
  const target = window.location.hash === '#shop' ? 1 : 0
  if (target !== currentIndex.value) {
    direction.value = target > currentIndex.value ? 'right' : 'left'
    currentIndex.value = target
  }
}

onMounted(() => {
  loadSiteContent()
  syncFromHash()
  window.addEventListener('hashchange', syncFromHash)
})
</script>

<template>
  <div
    class="app-shell"
    :class="`shell-${currentPage}`"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <TopBar :current="currentPage" />

    <main class="page-area">
      <transition :name="transitionName" mode="out-in">
        <HotelPage v-if="currentPage === 'hotel'" key="hotel" />
        <ShopPage v-else key="shop" />
      </transition>
    </main>

    <SwipeNavigator
      :pages="pages"
      :current-index="currentIndex"
      @prev="prev"
      @next="next"
      @select="goTo"
    />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.5s ease;
}
.shell-hotel { background-color: var(--color-white); }
.shell-shop  { background-color: #0d0d0d; }

.page-area {
  flex: 1;
  padding-bottom: 6rem;
  position: relative;
  perspective: 1500px;
}

/* =====================================
   Page-curl transition (forward / back)
   ===================================== */
.curl-forward-enter-active,
.curl-forward-leave-active,
.curl-back-enter-active,
.curl-back-leave-active {
  transition: transform 0.55s cubic-bezier(0.6, 0.02, 0.3, 0.96),
              opacity 0.4s ease;
  transform-origin: right center;
  backface-visibility: hidden;
}

/* Forward (Stay → Shop): page peels to the left, like turning a page right-to-left */
.curl-forward-leave-from {
  transform: rotateY(0deg) translateX(0);
  opacity: 1;
}
.curl-forward-leave-to {
  transform: rotateY(-95deg) translateX(-8%);
  opacity: 0;
}
.curl-forward-enter-from {
  transform: rotateY(95deg) translateX(8%);
  opacity: 0;
  transform-origin: left center;
}
.curl-forward-enter-to {
  transform: rotateY(0deg) translateX(0);
  opacity: 1;
  transform-origin: left center;
}

/* Back (Shop → Stay): mirror */
.curl-back-leave-from {
  transform: rotateY(0deg) translateX(0);
  opacity: 1;
  transform-origin: left center;
}
.curl-back-leave-to {
  transform: rotateY(95deg) translateX(8%);
  opacity: 0;
  transform-origin: left center;
}
.curl-back-enter-from {
  transform: rotateY(-95deg) translateX(-8%);
  opacity: 0;
}
.curl-back-enter-to {
  transform: rotateY(0deg) translateX(0);
  opacity: 1;
}

/* Mobile: simpler slide, no 3D */
@media (max-width: 768px) {
  .curl-forward-leave-active,
  .curl-forward-enter-active,
  .curl-back-leave-active,
  .curl-back-enter-active {
    transition: transform 0.4s ease, opacity 0.3s ease;
  }
  .curl-forward-leave-to {
    transform: translateX(-100%);
    opacity: 0;
  }
  .curl-forward-enter-from {
    transform: translateX(100%);
    opacity: 0;
  }
  .curl-back-leave-to {
    transform: translateX(100%);
    opacity: 0;
  }
  .curl-back-enter-from {
    transform: translateX(-100%);
    opacity: 0;
  }
}
</style>
