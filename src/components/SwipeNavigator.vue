<script setup>
import { computed } from 'vue'
import { useSiteContent } from '../composables/useSiteContent'

const props = defineProps({
  pages: { type: Array, required: true },
  currentIndex: { type: Number, required: true }
})
const emit = defineEmits(['prev', 'next', 'select'])

const { swipe } = useSiteContent()

const currentPage = computed(() => props.pages[props.currentIndex])
const otherPage = computed(() => {
  const i = (props.currentIndex + 1) % props.pages.length
  return props.pages[i]
})

const labels = computed(() => ({
  hotel: swipe.value.stay || 'Stay',
  shop: swipe.value.shop || 'Shop'
}))

// On Stay (white) the peek strip shows Shop (black); on Shop (black) it shows Stay (white).
const peekClass = computed(() => `peek-${otherPage.value}`)
const onPeekClick = () => {
  const i = (props.currentIndex + 1) % props.pages.length
  emit('select', i)
}
</script>

<template>
  <!-- Floating navigator with fluorescent green active state -->
  <div class="swipe-nav" :class="`nav-${currentPage}`">
    <div class="swipe-nav-inner">
      <button
        class="arrow"
        :disabled="currentIndex === 0"
        @click="emit('prev')"
        aria-label="Previous"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div class="dots">
        <button
          v-for="(page, i) in pages"
          :key="page"
          class="dot"
          :class="{ active: i === currentIndex }"
          @click="emit('select', i)"
        >
          <span class="dot-circle"></span>
          <span class="dot-label">{{ labels[page] }}</span>
        </button>
      </div>

      <button
        class="arrow"
        :disabled="currentIndex === pages.length - 1"
        @click="emit('next')"
        aria-label="Next"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* =====================================
   "Peek" strip — torn paper edge teaser
   ===================================== */
.peek-strip {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 38px;
  cursor: pointer;
  z-index: 90;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 0.3s ease;
  overflow: hidden;
  user-select: none;
}

.peek-strip:hover {
  height: 56px;
  padding-bottom: 12px;
}

/* On Stay (white page) peek shows Shop side: black bg, white text */
.peek-strip.peek-shop {
  background: #0d0d0d;
  color: #fafafa;
  border-top: 2px solid var(--color-neon);
  box-shadow: 0 -2px 24px rgba(57, 255, 20, 0.25), 0 -1px 0 rgba(57, 255, 20, 0.4);
}
.peek-strip.peek-shop .peek-dot {
  background: var(--color-neon);
  box-shadow: 0 0 8px var(--color-neon);
}
.peek-strip.peek-shop .peek-arrow { color: var(--color-neon); }

/* On Shop (black page) peek shows Stay side: white bg, black text */
.peek-strip.peek-hotel {
  background: #fafaf7;
  color: #1a1a1a;
  border-top: 2px solid var(--color-neon);
  box-shadow: 0 -2px 24px rgba(57, 255, 20, 0.3), 0 -1px 0 rgba(57, 255, 20, 0.5);
}
.peek-strip.peek-hotel .peek-dot {
  background: var(--color-neon);
  box-shadow: 0 0 8px var(--color-neon);
}
.peek-strip.peek-hotel .peek-arrow { color: #1a1a1a; }

.peek-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 400;
}

.peek-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: peekPulse 2s ease-in-out infinite;
}

.peek-arrow {
  font-size: 0.85rem;
  transition: transform 0.25s ease;
}
.peek-strip:hover .peek-arrow {
  transform: translateX(4px);
}

.torn-edge {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8px;
  pointer-events: none;
}
.peek-shop .torn-edge { fill: #0d0d0d; }
.peek-hotel .torn-edge { fill: #fafaf7; }

@keyframes peekPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.4); }
}

/* =====================================
   Floating navigator pill
   ===================================== */
.swipe-nav {
  position: fixed;
  bottom: 4rem;   /* lifted above peek strip */
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  transition: bottom 0.3s ease;
}

.swipe-nav-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 999px;
  backdrop-filter: blur(16px);
  transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
}

/* Stay = light theme */
.nav-hotel .swipe-nav-inner {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--color-warm-gray-100);
  box-shadow: 0 4px 24px rgba(42, 40, 38, 0.06);
}

/* Shop = dark theme */
.nav-shop .swipe-nav-inner {
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.arrow {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-hotel .arrow { color: var(--color-warm-gray-700); }
.nav-shop .arrow { color: rgba(255, 255, 255, 0.7); }

.nav-hotel .arrow:hover:not(:disabled) {
  background: var(--color-cream);
  color: var(--color-ink);
}
.nav-shop .arrow:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.arrow:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.dots {
  display: flex;
  gap: 0.25rem;
}

.dot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  font-weight: 500;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}
.nav-hotel .dot { color: var(--color-warm-gray-500); }
.nav-shop .dot { color: rgba(255, 255, 255, 0.55); }

.dot-circle {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-warm-gray-300);
  transition: all 0.3s ease;
}
.nav-shop .dot-circle { background: rgba(255, 255, 255, 0.35); }

/* Active dot — fluorescent green, glowing */
.dot.active {
  color: #0d0d0d;
  background: var(--color-neon);
  box-shadow:
    0 0 0 1px rgba(57, 255, 20, 0.6),
    0 0 16px rgba(57, 255, 20, 0.5),
    0 0 32px rgba(57, 255, 20, 0.25);
  font-weight: 600;
}

.dot.active .dot-circle {
  background: #0d0d0d;
  transform: scale(1.3);
}

.dot:hover:not(.active) {
  background: rgba(57, 255, 20, 0.08);
  color: var(--color-neon);
}

@media (max-width: 480px) {
  .dot {
    padding: 0.5rem 0.7rem;
  }
  .peek-strip {
    height: 32px;
  }
}
</style>
