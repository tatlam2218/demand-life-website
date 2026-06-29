<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteContent } from '../composables/useSiteContent'
import { useI18n } from '../i18n'
import ImageSlideshow from '../components/ImageSlideshow.vue'
import NeonIcon from '../components/NeonIcon.vue'

const { t } = useI18n()

// Demain-Culture-style brand palette for feature icons
const DC_PALETTE = {
  green:  '#39ff14',
  yellow: '#f4c518',
  orange: '#ff7a18',
  red:    '#ff4d4d',
  blue:   '#4dc6ff',
  purple: '#b78bff',
  pink:   '#ff5fa2',
  mint:   '#3fe0c5'
}

const router = useRouter()
const { hotel, rooms, site, transport } = useSiteContent()

function goBook(roomId) {
  if (roomId) {
    router.push({ path: '/book', query: { room: roomId } })
  } else {
    router.push('/book')
  }
}

const roomCards = computed(() =>
  rooms.value.map((room) => ({
    ...room,
    fallback: `https://images.unsplash.com/photo-${room.id === 'one-bed-studio' ? '1631049307264-da0ec9d70304' : '1522708323590-d24dbb6b0267'}?w=1400&q=85`
  }))
)

// Front-end override: use the punk-zine print photos as the cinematic hero,
// regardless of what's in the CMS. Three rotating images matching the
// demain-culture risograph aesthetic.
const PUNK_HERO_IMAGES = [
  '/hero-punk/hero1.webp',
  '/hero-punk/hero2.webp',
  '/hero-punk/hero3.webp'
]
const heroImages = computed(() => PUNK_HERO_IMAGES)
</script>

<template>
  <section class="hotel-page">
    <!-- Cinematic full-width Hero -->
    <div v-if="heroImages.length" class="hero-cinematic">
      <ImageSlideshow
        :images="heroImages"
        :alt="hotel.eyebrow || 'Demain Life'"
        ratio="21 / 9"
        :interval="5500"
      />
      <div class="hero-overlay">
        <p class="eyebrow light">{{ hotel.eyebrow }}</p>
        <h1 class="hero-cinematic-title dc-style">
          <span class="line line-thin">{{ hotel.heroTitle1 }}</span>
          <span class="line line-neon">{{ hotel.heroTitle2 }}</span>
          <span class="line line-outline">{{ hotel.heroTitle3 }}</span>
        </h1>
      </div>
    </div>

    <div class="hero container" :class="{ 'has-cinematic': heroImages.length }">
      <div class="hero-text">
        <p v-if="!heroImages.length" class="eyebrow">{{ hotel.eyebrow }}</p>
        <h1 v-if="!heroImages.length">
          {{ hotel.heroTitle1 }}<br>
          {{ hotel.heroTitle2 }}<br>
          <em>{{ hotel.heroTitle3 }}</em>
        </h1>
        <p class="hero-sub">
          {{ hotel.heroSub1 }}<br>
          {{ hotel.heroSub2 }}
        </p>
      </div>
      <!-- 506 Rooms · Room Types · Location stats block removed per design feedback. -->
    </div>

    <div class="divider container"></div>

    <!-- Feature icon grid — demainculture.com style, light theme -->
    <div class="features-grid-wrap container">
      <p class="features-eyebrow"><span class="features-eyebrow-dot"></span>Life included</p>
      <div class="features-grid">
        <div class="feature-card" :style="{ backgroundImage: 'url(/feature-cards/cleaning.webp?v=20260628b)' }">
          <NeonIcon name="cleaning"  :color="DC_PALETTE.green"  :size="40" filled />
          <p class="feature-label">Daily<br>Cleaning</p>
        </div>
        <div class="feature-card" :style="{ backgroundImage: 'url(/feature-cards/wifi.webp?v=20260628b)' }">
          <NeonIcon name="wifi"      :color="DC_PALETTE.yellow" :size="40" filled />
          <p class="feature-label">Wi-Fi<br>Included</p>
        </div>
        <div class="feature-card" :style="{ backgroundImage: 'url(/feature-cards/cafe.webp?v=20260628b)' }">
          <NeonIcon name="cafe"      :color="DC_PALETTE.orange" :size="40" filled />
          <p class="feature-label">Lobby<br>Café</p>
        </div>
        <div class="feature-card" :style="{ backgroundImage: 'url(/feature-cards/events.webp?v=20260628b)' }">
          <NeonIcon name="events"    :color="DC_PALETTE.red"    :size="40" filled />
          <p class="feature-label">Community<br>Events</p>
        </div>
        <div class="feature-card" :style="{ backgroundImage: 'url(/feature-cards/fitness.webp?v=20260628b)' }">
          <NeonIcon name="fitness"   :color="DC_PALETTE.blue"   :size="40" filled />
          <p class="feature-label">Fitness<br>Studio</p>
        </div>
        <div class="feature-card" :style="{ backgroundImage: 'url(/feature-cards/coworking.webp?v=20260628b)' }">
          <NeonIcon name="coworking" :color="DC_PALETTE.purple" :size="40" filled />
          <p class="feature-label">Co-Working<br>Space</p>
        </div>
        <div class="feature-card" :style="{ backgroundImage: 'url(/feature-cards/concierge.webp?v=20260628c)' }">
          <NeonIcon name="concierge" :color="DC_PALETTE.pink"   :size="40" filled />
          <p class="feature-label">24h<br>Concierge</p>
        </div>
        <div class="feature-card" :style="{ backgroundImage: 'url(/feature-cards/building.webp?v=20260628b)' }">
          <NeonIcon name="building"  :color="DC_PALETTE.mint"   :size="40" filled />
          <p class="feature-label">Demain@1331<br>Kai Tak</p>
        </div>
      </div>
    </div>

    <div class="divider container"></div>

    <div class="rooms-section container">
      <div class="section-header">
        <p class="eyebrow">{{ hotel.spacesEyebrow }}</p>
        <h2>{{ hotel.spacesTitle1 }}<br>{{ hotel.spacesTitle2 }}</h2>
      </div>

      <div class="rooms-grid">
        <article v-for="room in roomCards" :key="room.id" class="room-card">
          <div class="room-image-wrap">
            <ImageSlideshow
              :images="room.images"
              :fallback="room.fallback"
              :alt="room.name"
              ratio="16 / 10"
            />
            <div class="room-badge">{{ room.size }}</div>
          </div>

          <div class="room-body">
            <div class="room-header">
              <h3>{{ room.name }}</h3>
              <p class="room-meta">{{ room.occupancy }}</p>
            </div>

            <p class="room-tagline">{{ room.tagline }}</p>
            <p class="room-description">{{ room.description }}</p>

            <div class="room-highlight">
              <p>{{ room.highlight }}</p>
            </div>

            <div class="room-features">
              <p class="features-title">{{ hotel.facilities }}</p>
              <ul>
                <li v-for="(f, i) in room.features || []" :key="i">{{ f }}</li>
              </ul>
            </div>

            <div class="room-footer">
              <div class="room-price">
                <span class="price-amount">{{ room.price }}</span>
                <span class="price-period">{{ room.period }}</span>
              </div>
              <button class="btn-primary" @click="goBook(room.id)">{{ hotel.bookNow }} →</button>
            </div>
          </div>
        </article>
      </div>

      <div class="price-note">
        <p><span class="note-icon">✦</span>{{ hotel.priceNote }}</p>
      </div>
    </div>

    <!-- Kai Tak Location Map: highlights the 18 yellow blocks operated by Demain Life. 
         Old satellite-map "Site" CMS section was removed in favor of this dedicated section. -->
    <div class="location-map-section container">
      <div class="location-map-header">
        <p class="eyebrow"><span class="eyebrow-dot"></span>{{ t('locationMap.eyebrow') }}</p>
        <h2 class="location-map-title">
          <span class="line-thin">{{ t('locationMap.titleThin') }}</span>
          <span class="line-neon">{{ t('locationMap.titleNeon') }}</span>
        </h2>
        <p class="location-map-lead">{{ t('locationMap.lead') }}</p>
      </div>
      <div class="location-map-wrap">
        <img
          src="/site/kaitak-map.webp?v=20260628c"
          :alt="t('locationMap.titleThin') + ' ' + t('locationMap.titleNeon')"
          class="location-map-img"
          loading="lazy"
        />
        <!-- CSS overlay: neon-green rounded rectangle + glow + label badge.
             Positions are percentage-based against the underlying 1024x637 map,
             so they stay anchored to the same buildings on any screen size. -->
        <div class="map-highlight-frame" aria-hidden="true"></div>
        <div class="map-highlight-leader" aria-hidden="true"></div>
        <div class="map-highlight-badge">
          <span class="badge-title">{{ t('locationMap.badgeTitle') }}</span>
          <span class="badge-sub">{{ t('locationMap.badgeSub') }}</span>
        </div>
      </div>
    </div>

    <!-- Transport -->
    <div v-if="transport.heroImages?.length || transport.shuttleTitle" class="transport-section container">
      <div class="transport-grid">
        <div class="transport-image">
          <ImageSlideshow
            :images="transport.heroImages"
            :alt="transport.eyebrow || 'Getting here'"
            ratio="4 / 3"
            rounded
          />
        </div>
        <div class="transport-text">
          <p class="eyebrow">{{ transport.eyebrow }}</p>
          <h2>{{ transport.title1 }}<br>{{ transport.title2 }}</h2>
          <div class="transport-block">
            <h4>{{ transport.shuttleTitle }}</h4>
            <p>{{ transport.shuttleDescription }}</p>
          </div>
          <div class="transport-block">
            <h4>{{ transport.publicTitle }}</h4>
            <p>{{ transport.publicDescription }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="cta-section container">
      <p class="eyebrow">{{ hotel.ctaEyebrow }}</p>
      <h2>{{ hotel.ctaTitle }}</h2>
      <p class="cta-sub">{{ hotel.ctaSub }}</p>
      <button class="btn-primary large" @click="goBook()">{{ hotel.ctaButton }} →</button>
    </div>
  </section>
</template>

<style scoped>
.hotel-page { padding-top: 0; }
.hero-cinematic {
  position: relative;
  width: 100%;
  margin-bottom: 5rem;
}
/* Faint diagonal-line grid — demainculture.com signature backdrop. 
   Sits below the hero photo, peeks out at the bottom edge. */
.hero-cinematic::before {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -3rem; height: 6rem;
  background-image:
    repeating-linear-gradient(135deg,
      rgba(42,40,38,0.04) 0px,
      rgba(42,40,38,0.04) 1px,
      transparent 1px,
      transparent 22px);
  pointer-events: none;
  z-index: -1;
}
.features-grid-wrap::before {
  content: '';
  position: absolute;
  inset: -1rem -1rem auto -1rem;
  height: 220px;
  background-image:
    repeating-linear-gradient(135deg,
      rgba(42,40,38,0.035) 0px,
      rgba(42,40,38,0.035) 1px,
      transparent 1px,
      transparent 26px);
  pointer-events: none;
  z-index: 0;
  border-radius: 24px;
}
.features-grid-wrap > * { position: relative; z-index: 1; }
.hero-cinematic .slideshow { width: 100%; }
.hero-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; padding: clamp(2rem, 6vw, 5rem); pointer-events: none; background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%); z-index: 2; }
.hero-cinematic-title { color: #fff; font-weight: 300; letter-spacing: -0.02em; line-height: 1.1; font-size: clamp(2.2rem, 5.5vw, 5rem); max-width: 900px; text-shadow: 0 2px 24px rgba(0,0,0,0.35); }
.hero-cinematic-title em { font-style: normal; opacity: 0.85; }

/* Demain-Culture dramatic hero — mixed weights */
.hero-cinematic-title.dc-style {
  display: flex; flex-direction: column; gap: 0.1em;
  font-family: 'Inter', -apple-system, sans-serif;
  line-height: 1.0;
  font-size: clamp(2.6rem, 7vw, 6rem);
  letter-spacing: -0.025em;
  max-width: 1100px;
}
.hero-cinematic-title .line { display: block; }
.hero-cinematic-title .line-thin {
  font-weight: 300; color: #fff;
}
.hero-cinematic-title .line-neon {
  font-weight: 800; color: var(--color-neon, #39ff14);
  text-shadow: 0 0 24px rgba(57,255,20,0.55), 0 0 48px rgba(57,255,20,0.25);
  letter-spacing: -0.02em;
}
.hero-cinematic-title .line-outline {
  font-weight: 800;
  color: transparent;
  -webkit-text-stroke: 1.5px #ffffff;
  text-stroke: 1.5px #ffffff;
  letter-spacing: -0.01em;
}
.eyebrow.light { color: rgba(255,255,255,0.85); margin-bottom: 1rem; }
.hero.has-cinematic { padding-top: 0; padding-bottom: 5rem; align-items: start; }
.hero.has-cinematic .hero-text h1 { display: none; }
.hero { display: grid; grid-template-columns: 1.5fr 1fr; gap: 4rem; align-items: end; padding-bottom: 6rem; padding-top: 2rem; }
.hero-text h1 { margin: 1.5rem 0 2rem; }
.hero-text h1 em { font-style: normal; color: var(--color-warm-gray-500); }
.hero-sub { font-size: 1.05rem; color: var(--color-warm-gray-700); line-height: 1.7; }
.hero-meta { display: flex; flex-direction: column; gap: 1.5rem; padding-left: 2rem; border-left: 1px solid var(--color-warm-gray-100); }
.meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
.meta-num { font-size: 2rem; font-weight: 300; color: var(--color-ink); letter-spacing: -0.02em; }
.meta-label { font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--color-warm-gray-500); }
.divider { height: 1px; background: var(--color-warm-gray-100); margin-bottom: 6rem; }
.section-header { margin-bottom: 4rem; text-align: center; }
.section-header .eyebrow { display: block; margin-bottom: 1rem; }
.rooms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 3rem; }
.room-card { display: flex; flex-direction: column; background: var(--color-cream); border-radius: 4px; overflow: hidden; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.room-card:hover { transform: translateY(-4px); }
.room-image-wrap { overflow: hidden; background: var(--color-warm-gray-100); position: relative; }
.room-badge { position: absolute; top: 1rem; right: 1rem; background: rgba(255, 255, 255, 0.95); font-size: 0.75rem; padding: 0.4rem 0.8rem; border-radius: 999px; }
.room-body { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
.room-header h3 { font-size: 1.4rem; }
.room-meta { font-size: 0.85rem; color: var(--color-warm-gray-500); margin-top: 0.4rem; }
.room-tagline { font-size: 0.95rem; color: var(--color-ink); font-style: italic; padding: 0.8rem 0; border-top: 1px solid var(--color-warm-gray-100); border-bottom: 1px solid var(--color-warm-gray-100); }
.room-description { font-size: 0.9rem; line-height: 1.7; color: var(--color-warm-gray-700); }
.room-highlight { padding: 1rem 1.2rem; background: var(--color-white); border-left: 2px solid var(--color-accent); }
.room-highlight p { font-size: 0.88rem; line-height: 1.7; }
.features-title { font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--color-warm-gray-500); margin-bottom: 0.8rem; }
.room-features ul { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
.room-features li { font-size: 0.85rem; color: var(--color-ink); padding-bottom: 0.5rem; border-bottom: 1px dashed var(--color-warm-gray-100); }
.room-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid var(--color-warm-gray-100); }
.price-amount { font-size: 1.4rem; font-weight: 400; color: var(--color-ink); }
.price-period { font-size: 0.8rem; color: var(--color-warm-gray-500); margin-left: 0.4rem; }
.price-note { text-align: center; padding: 1.8rem 2rem; margin-bottom: 6rem; background: var(--color-paper); border-radius: 4px; }
.price-note p { font-size: 0.85rem; line-height: 1.7; }
.note-icon { color: var(--color-accent); margin-right: 0.5rem; }
.btn-primary {
  font-size: 0.85rem;
  padding: 0.7rem 1.4rem;
  background: var(--color-neon);
  color: #0d0d0d;
  border: none;
  border-radius: 999px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  box-shadow: 0 0 0 1px rgba(57,255,20,0.5), 0 4px 14px rgba(57,255,20,0.3);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 0 1px rgba(57,255,20,0.8), 0 8px 22px rgba(57,255,20,0.5);
}
.btn-primary.large { padding: 1rem 2.4rem; font-size: 0.95rem; }
.life-section { padding-bottom: 6rem; }
.site-section-block { padding-bottom: 6rem; }
.life-header { max-width: 720px; margin-left: auto; margin-right: auto; }
.section-lead { max-width: 560px; margin: 1.25rem auto 0; font-size: 0.95rem; line-height: 1.7; color: var(--color-warm-gray-700); }
.transport-section { padding-bottom: 6rem; }
.transport-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 4rem; align-items: center; }
.transport-text { display: flex; flex-direction: column; gap: 1.5rem; }
.transport-text h2 { margin: 0.75rem 0 0.5rem; }
.transport-block h4 { font-size: 0.95rem; font-weight: 500; margin-bottom: 0.4rem; color: var(--color-ink); letter-spacing: 0.02em; }
.transport-block p { font-size: 0.9rem; line-height: 1.7; color: var(--color-warm-gray-700); }
.cta-section { padding: 5rem 2rem; text-align: center; margin-bottom: 4rem; background: var(--color-cream); border-radius: 8px; }
.cta-section .eyebrow { display: block; margin-bottom: 1rem; }
.cta-section h2 { margin-bottom: 1.5rem; }
.cta-sub { max-width: 540px; margin: 0 auto 2rem; font-size: 0.95rem; }
@media (max-width: 900px) { .rooms-grid { grid-template-columns: 1fr; gap: 2rem; } }
@media (max-width: 900px) {
  .transport-grid { grid-template-columns: 1fr; gap: 2rem; }
}
/* ===== Feature icon grid — demainculture.com style, LIGHT theme ===== */
.features-grid-wrap {
  margin: 3rem auto 6rem;
  position: relative;
}
.features-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-warm-gray-700, #4a4744);
  font-weight: 600;
  margin: 0 0 1.6rem 0;
}
.features-eyebrow-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-neon, #39ff14);
  box-shadow: 0 0 10px rgba(57,255,20,0.7);
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.2rem;
}
.feature-card {
  position: relative;
  aspect-ratio: 1 / 1;
  background-color: #ffffff;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.1rem 1.2rem 1.1rem;
  cursor: default;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 8px 22px rgba(42,40,38,0.07);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  overflow: hidden;
}
/* Soft white-fade overlay at the bottom for label legibility */
.feature-card::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 55%;
  background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.72) 55%, rgba(255,255,255,0.95) 100%);
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 14px 36px rgba(42,40,38,0.12);
  border-color: rgba(0,0,0,0.10);
}
/* The icon sits inside a small white pill in the top-left corner */
.feature-card > svg {
  position: relative;
  z-index: 2;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 0.4rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(42,40,38,0.10);
  transition: transform 0.3s ease;
}
.feature-card:hover > svg { transform: scale(1.06); }

.feature-label {
  position: relative;
  z-index: 2;
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  line-height: 1.4;
  color: var(--color-ink, #2a2826);
}

@media (max-width: 768px) {
  .hero { grid-template-columns: 1fr; gap: 2.5rem; padding-bottom: 4rem; }
  .hero-meta { flex-direction: row; padding-left: 0; padding-top: 2rem; border-left: none; border-top: 1px solid var(--color-warm-gray-100); justify-content: space-between; }
  .divider { margin-bottom: 4rem; }
  .room-footer { flex-direction: column; gap: 1rem; align-items: flex-start; }
  .features-grid { grid-template-columns: repeat(2, 1fr); gap: 0.8rem; }
  .feature-card { padding: 1.1rem 1.1rem 1rem; border-radius: 14px; }
  .feature-card svg { width: 44px !important; height: 44px !important; }
  .feature-label { font-size: 0.66rem; }
}
@media (max-width: 480px) {
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}

/* ===== Kai Tak location map section ===== */
.location-map-section {
  padding: 4rem 1rem 5rem;
  text-align: center;
}
.location-map-header {
  max-width: 760px;
  margin: 0 auto 2.2rem;
}
.location-map-header .eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-warm-gray-700, #4a4744);
  font-weight: 600;
  margin: 0 0 1.4rem 0;
}
.location-map-header .eyebrow-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-neon, #39ff14);
  box-shadow: 0 0 10px rgba(57,255,20,0.7);
}
.location-map-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: clamp(1.8rem, 4vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 0 1.4rem;
  display: flex; flex-direction: column; gap: 0.1em;
  align-items: center;
}
.location-map-title .line-thin {
  font-weight: 300;
  color: var(--color-ink, #2a2826);
}
.location-map-title .line-neon {
  font-weight: 800;
  color: var(--color-neon, #39ff14);
  text-shadow: 0 0 18px rgba(57,255,20,0.45), 0 0 38px rgba(57,255,20,0.18);
  letter-spacing: -0.015em;
}
.location-map-lead {
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--color-warm-gray-700, #4a4744);
  max-width: 560px;
  margin: 0 auto;
}
.location-map-wrap {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 18px 44px rgba(42,40,38,0.10);
  border: 1px solid rgba(0,0,0,0.06);
  background: #fff;
}
.location-map-img {
  display: block;
  width: 100%;
  height: auto;
}

/* Neon-green highlight frame anchored to the 18 yellow blocks.
   Coordinates are % of the underlying 1024x637 map image. */
.map-highlight-frame {
  position: absolute;
  left: 10.25%;
  top: 41.29%;
  width: 16.60%;
  height: 18.05%;
  border: 2.5px solid var(--color-neon, #39ff14);
  border-radius: 6px;
  box-shadow:
    0 0 0 1px rgba(57,255,20,0.35),
    0 0 14px 4px rgba(57,255,20,0.45),
    inset 0 0 12px rgba(57,255,20,0.18);
  pointer-events: none;
  animation: mapPulse 2.8s ease-in-out infinite;
}
@keyframes mapPulse {
  0%, 100% { box-shadow: 0 0 0 1px rgba(57,255,20,0.35), 0 0 14px 4px rgba(57,255,20,0.45), inset 0 0 12px rgba(57,255,20,0.18); }
  50%      { box-shadow: 0 0 0 1px rgba(57,255,20,0.55), 0 0 22px 7px rgba(57,255,20,0.6),  inset 0 0 16px rgba(57,255,20,0.25); }
}

/* Leader line going from the bottom of the highlight frame down to the badge */
.map-highlight-leader {
  position: absolute;
  left: 18.55%;            /* horizontal center of the frame */
  top: 59.34%;             /* just below the frame */
  width: 2px;
  height: 8.5%;
  background: var(--color-neon, #39ff14);
  box-shadow: 0 0 8px rgba(57,255,20,0.7);
  pointer-events: none;
}
.map-highlight-leader::before {
  content: '';
  position: absolute;
  top: -3px; left: -3px;
  width: 8px; height: 8px;
  background: var(--color-neon, #39ff14);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(57,255,20,0.9);
}

/* Pill badge with "18 BLOCKS / OUR RANGE" — text comes from i18n */
.map-highlight-badge {
  position: absolute;
  left: 5.5%;
  top: 70%;
  display: inline-flex;
  flex-direction: column;
  gap: 0.18rem;
  background: rgba(13, 13, 13, 0.92);
  color: #fff;
  border: 1.5px solid var(--color-neon, #39ff14);
  border-radius: 8px;
  padding: 0.55rem 0.95rem;
  box-shadow: 0 0 0 1px rgba(57,255,20,0.25), 0 4px 14px rgba(0,0,0,0.35);
  pointer-events: none;
}
.map-highlight-badge .badge-title {
  color: var(--color-neon, #39ff14);
  font-weight: 700;
  font-size: clamp(0.78rem, 1.1vw, 1rem);
  letter-spacing: 0.05em;
  line-height: 1.1;
}
.map-highlight-badge .badge-sub {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  font-size: clamp(0.6rem, 0.85vw, 0.75rem);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1.2;
}
@media (max-width: 640px) {
  .location-map-section { padding: 3rem 1rem 4rem; }
  .location-map-wrap { border-radius: 12px; }
}
</style>
