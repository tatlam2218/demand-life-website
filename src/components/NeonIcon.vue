<script setup>
/**
 * NeonIcon — Demain-Culture-style line-art icon library.
 *
 * Props:
 *   name  : one of the keys in ICONS below (e.g. 'cleaning', 'wifi', 'cafe', ...)
 *   color : icon stroke / fill color (CSS color). Default uses the parent's currentColor.
 *   size  : px size of the icon. Default 48.
 *   filled: boolean. true → soft filled style (used on the LIGHT Stay theme).
 *           false → outlined neon-stroke style (used on the DARK Shop theme).
 *   glow  : boolean. true → adds a drop-shadow halo in the icon's color.
 *           Default true on dark, false on light (controlled by parent CSS).
 *
 * All icons are 64×64 viewBox, drawn with a single stroke + occasional fill
 * to keep the visual language consistent with demainculture.com glyphs.
 */
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  color: { type: String, default: 'currentColor' },
  size: { type: [Number, String], default: 48 },
  filled: { type: Boolean, default: false },
  glow: { type: Boolean, default: false }
})

const style = computed(() => {
  const s = {}
  if (props.glow) {
    s.filter = `drop-shadow(0 0 6px ${props.color}) drop-shadow(0 0 14px ${props.color}66)`
  }
  return s
})

const strokeWidth = computed(() => (props.filled ? 2.6 : 2.2))
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    :style="style"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- ===== STAY ICONS (light-theme, filled-style) ===== -->

    <!-- cleaning: broom -->
    <g v-if="name === 'cleaning'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round">
      <line x1="42" y1="14" x2="22" y2="34" />
      <path d="M16 40 L10 56 L26 50 Z" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.18 : 0" />
      <line x1="14" y1="44" x2="20" y2="50" />
      <line x1="18" y1="40" x2="24" y2="46" />
      <circle cx="46" cy="10" r="3" :fill="color" />
    </g>

    <!-- wifi: signal waves -->
    <g v-else-if="name === 'wifi'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" fill="none">
      <path d="M10 28 Q32 8 54 28" />
      <path d="M16 36 Q32 20 48 36" />
      <path d="M22 44 Q32 34 42 44" />
      <circle cx="32" cy="52" r="3" :fill="color" />
    </g>

    <!-- cafe: coffee cup with steam -->
    <g v-else-if="name === 'cafe'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M14 26 H46 V42 Q46 50 38 50 H22 Q14 50 14 42 Z" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.15 : 0" />
      <path d="M46 30 H52 Q56 30 56 34 V38 Q56 42 52 42 H46" />
      <path d="M22 18 Q24 14 22 10" />
      <path d="M30 18 Q32 14 30 10" />
      <path d="M38 18 Q40 14 38 10" />
    </g>

    <!-- events: calendar with star -->
    <g v-else-if="name === 'events'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <rect x="10" y="14" width="44" height="40" rx="3" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.12 : 0" />
      <line x1="10" y1="24" x2="54" y2="24" />
      <line x1="20" y1="10" x2="20" y2="18" />
      <line x1="44" y1="10" x2="44" y2="18" />
      <path d="M32 32 L34 38 L40 38 L35 42 L37 48 L32 44 L27 48 L29 42 L24 38 L30 38 Z" :fill="color" />
    </g>

    <!-- fitness: dumbbell -->
    <g v-else-if="name === 'fitness'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <rect x="6"  y="22" width="6"  height="20" rx="1.5" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.2 : 0" />
      <rect x="52" y="22" width="6"  height="20" rx="1.5" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.2 : 0" />
      <rect x="12" y="26" width="6"  height="12" rx="1" :fill="color" />
      <rect x="46" y="26" width="6"  height="12" rx="1" :fill="color" />
      <line x1="18" y1="32" x2="46" y2="32" :stroke-width="strokeWidth + 1.5" />
    </g>

    <!-- coworking: laptop -->
    <g v-else-if="name === 'coworking'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <rect x="12" y="14" width="40" height="28" rx="2" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.15 : 0" />
      <rect x="16" y="18" width="32" height="20" rx="1" />
      <path d="M6 46 L58 46 Q58 52 52 52 H12 Q6 52 6 46 Z" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.2 : 0" />
      <line x1="28" y1="46" x2="36" y2="46" :stroke-width="strokeWidth + 0.5" />
    </g>

    <!-- concierge: headset -->
    <g v-else-if="name === 'concierge'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M12 34 Q12 14 32 14 Q52 14 52 34" />
      <rect x="8"  y="32" width="10" height="18" rx="3" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.2 : 0" />
      <rect x="46" y="32" width="10" height="18" rx="3" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.2 : 0" />
      <path d="M46 50 V54 Q46 58 42 58 H34" />
      <circle cx="30" cy="58" r="2.5" :fill="color" />
    </g>

    <!-- building: Demain@1331 -->
    <g v-else-if="name === 'building'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M12 54 V20 L32 8 L52 20 V54 Z" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.12 : 0" />
      <rect x="20" y="28" width="6" height="6" :fill="color" />
      <rect x="38" y="28" width="6" height="6" :fill="color" />
      <rect x="20" y="38" width="6" height="6" :fill="color" />
      <rect x="38" y="38" width="6" height="6" :fill="color" />
      <rect x="28" y="46" width="8" height="10" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.3 : 0" />
    </g>

    <!-- ===== SHOP ICONS (dark-theme, outlined neon-glow style) ===== -->

    <!-- pickup: package box -->
    <g v-else-if="name === 'pickup'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M10 22 L32 12 L54 22 V46 L32 56 L10 46 Z" />
      <line x1="10" y1="22" x2="32" y2="32" />
      <line x1="54" y1="22" x2="32" y2="32" />
      <line x1="32" y1="32" x2="32" y2="56" />
      <line x1="20" y1="17" x2="42" y2="27" />
    </g>

    <!-- shipping: truck -->
    <g v-else-if="name === 'shipping'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <rect x="6"  y="22" width="30" height="22" rx="1" />
      <path d="M36 28 H50 L58 36 V44 H36 Z" />
      <circle cx="18" cy="48" r="4" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.4 : 0" />
      <circle cx="46" cy="48" r="4" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.4 : 0" />
    </g>

    <!-- makers: hand-craft / hammer + leaf -->
    <g v-else-if="name === 'makers'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M14 50 L40 24" />
      <path d="M36 16 L48 28 L44 32 L32 20 Z" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.25 : 0" />
      <path d="M14 50 Q8 50 8 56 Q14 56 14 50" :fill="color" />
      <path d="M50 38 Q56 38 58 44 Q52 50 46 44 Q46 38 50 38" />
    </g>

    <!-- drops: bottle / limited edition -->
    <g v-else-if="name === 'drops'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M32 8 Q40 24 40 36 Q40 50 32 50 Q24 50 24 36 Q24 24 32 8 Z" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.25 : 0" />
      <circle cx="29" cy="38" r="2" :fill="color" />
    </g>

    <!-- gift: gift box -->
    <g v-else-if="name === 'gift'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <rect x="10" y="24" width="44" height="28" rx="1" :fill="filled ? color : 'none'" :fill-opacity="filled ? 0.15 : 0" />
      <rect x="6"  y="18" width="52" height="10" rx="1" />
      <line x1="32" y1="18" x2="32" y2="52" />
      <path d="M32 18 Q22 12 22 8 Q22 4 28 4 Q34 8 32 18" />
      <path d="M32 18 Q42 12 42 8 Q42 4 36 4 Q30 8 32 18" />
    </g>

    <!-- exchange: arrows in loop -->
    <g v-else-if="name === 'exchange'" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M14 22 H46 L40 16" />
      <path d="M46 22 L40 28" />
      <path d="M50 42 H18 L24 36" />
      <path d="M18 42 L24 48" />
    </g>

    <!-- fallback: small dot if name unknown -->
    <circle v-else cx="32" cy="32" r="6" :fill="color" />
  </svg>
</template>
