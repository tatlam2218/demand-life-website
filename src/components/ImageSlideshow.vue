<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

const props = defineProps({
  images: { type: Array, default: () => [] },
  fallback: { type: String, default: '' },
  alt: { type: String, default: '' },
  ratio: { type: String, default: '16 / 10' },
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 4500 },
  rounded: { type: Boolean, default: false }
})

// Auto-detect portrait images and switch fit mode so floorplans render fully
const orientation = reactive({})
function onImageLoad(src, event) {
  const img = event.target
  if (!img?.naturalWidth || !img?.naturalHeight) return
  orientation[src] = img.naturalHeight > img.naturalWidth * 1.05 ? 'portrait' : 'landscape'
}
function fitForSrc(src) {
  return orientation[src] === 'portrait' ? 'contain' : 'cover'
}

const slides = computed(() => {
  const list = (props.images || []).filter(Boolean)
  if (list.length) return list
  return props.fallback ? [props.fallback] : []
})

const index = ref(0)
const isHover = ref(false)
let timer = null

function start() {
  stop()
  if (!props.autoplay || slides.value.length <= 1) return
  timer = setInterval(() => {
    if (!isHover.value) next()
  }, props.interval)
}
function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function next() {
  if (!slides.value.length) return
  index.value = (index.value + 1) % slides.value.length
}
function prev() {
  if (!slides.value.length) return
  index.value = (index.value - 1 + slides.value.length) % slides.value.length
}
function goTo(i) {
  index.value = i
}

let touchStartX = 0
function onTouchStart(e) {
  touchStartX = e.touches[0].clientX
}
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 40) {
    dx < 0 ? next() : prev()
  }
}

watch(() => slides.value.length, () => {
  index.value = 0
  start()
}, { immediate: true })

onBeforeUnmount(stop)
</script>

<template>
  <div
    class="slideshow"
    :class="{ 'is-rounded': rounded }"
    :style="{ aspectRatio: ratio }"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <transition name="fade" mode="out-in">
      <img
        v-if="slides.length"
        :key="index"
        :src="slides[index]"
        :alt="alt"
        loading="lazy"
        :style="{ objectFit: fitForSrc(slides[index]) }"
        @load="onImageLoad(slides[index], $event)"
      />
      <div v-else class="empty">No images</div>
    </transition>

    <template v-if="slides.length > 1">
      <button class="slide-arrow left" type="button" @click.stop="prev" aria-label="Previous">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="slide-arrow right" type="button" @click.stop="next" aria-label="Next">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="slide-dots">
        <button
          v-for="(_, i) in slides"
          :key="i"
          class="slide-dot"
          :class="{ active: index === i }"
          type="button"
          @click.stop="goTo(i)"
          :aria-label="`Slide ${i + 1}`"
        ></button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.slideshow {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--color-warm-gray-100);
}
.slideshow.is-rounded {
  border-radius: 12px;
}
.slideshow img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: var(--color-cream);
}
.empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: 0.85rem;
  color: var(--color-warm-gray-500);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.45s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: var(--color-ink);
  display: grid;
  place-items: center;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.slideshow:hover .slide-arrow {
  opacity: 1;
}
.slide-arrow:hover {
  transform: translateY(-50%) scale(1.05);
}
.slide-arrow.left { left: 0.8rem; }
.slide-arrow.right { right: 0.8rem; }
.slide-dots {
  position: absolute;
  bottom: 0.85rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.4rem;
}
.slide-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
  border: none;
  padding: 0;
}
.slide-dot.active {
  width: 18px;
  border-radius: 999px;
  background: var(--color-white);
}
@media (max-width: 640px) {
  .slide-arrow { opacity: 1; width: 32px; height: 32px; }
}
</style>
