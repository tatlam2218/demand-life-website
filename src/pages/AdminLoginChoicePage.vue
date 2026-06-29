<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="choice-page">
    <!-- Animated halftone backdrop -->
    <div class="bg-halftone" aria-hidden="true"></div>
    <div class="bg-grid" aria-hidden="true"></div>

    <div class="choice-wrap">
      <a href="https://www.demainculture.com" target="_blank" rel="noopener" class="brand-logo-wrap">
        <img src="/brand/demain-culture-logo.webp?v=20260628" alt="未來文化 Demain Culture" />
      </a>

      <p class="eyebrow"><span class="eyebrow-dot"></span>DEMAIN LIFE · ADMIN</p>
      <h1>
        <span class="thin">Choose your</span>
        <span class="neon">portal.</span>
      </h1>
      <p class="lead">Select the system you want to manage.</p>

      <div class="cards">
        <!-- STAY card — neon-green building icon (CSS only) -->
        <button class="card card-stay" @click="router.push('/admin/stay/login')">
          <div class="icon-wrap">
            <svg class="neon-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <!-- Apartment building -->
              <path d="M12 54 V20 L32 8 L52 20 V54 Z"/>
              <rect x="20" y="28" width="6" height="6"/>
              <rect x="38" y="28" width="6" height="6"/>
              <rect x="20" y="38" width="6" height="6"/>
              <rect x="38" y="38" width="6" height="6"/>
              <rect x="28" y="46" width="8" height="10"/>
            </svg>
          </div>
          <h2>Stay</h2>
          <p>Reservations, customer profiles, contracts, payments, room assignments.</p>
          <span class="cta">Sign in →</span>
        </button>

        <!-- SHOP card — neon-pink shopping bag icon (CSS only) -->
        <button class="card card-shop" @click="router.push('/admin/shop/login')">
          <div class="icon-wrap">
            <svg class="neon-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <!-- Shopping bag -->
              <path d="M14 22 H50 L46 56 H18 Z"/>
              <path d="M22 22 Q22 10 32 10 Q42 10 42 22"/>
              <circle cx="26" cy="34" r="1.5" fill="currentColor"/>
              <circle cx="38" cy="34" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <h2>Shop</h2>
          <p>Product orders, inventory, fulfillment, pickup confirmation.</p>
          <span class="cta">Sign in →</span>
        </button>
      </div>

      <p class="footer">
        <router-link to="/">← Back to homepage</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.choice-page {
  position: relative;
  min-height: 100vh;
  background: radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif;
  overflow: hidden;
}

/* Background — halftone dot pattern, very subtle */
.bg-halftone {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at center, rgba(57, 255, 20, 0.12) 1px, transparent 1.5px);
  background-size: 18px 18px;
  opacity: 0.5;
  pointer-events: none;
}
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(135deg,
      rgba(255, 255, 255, 0.025) 0px,
      rgba(255, 255, 255, 0.025) 1px,
      transparent 1px, transparent 28px);
  pointer-events: none;
}

.choice-wrap {
  position: relative;
  z-index: 1;
  max-width: 820px;
  width: 100%;
  text-align: center;
}

/* Logo on top */
.brand-logo-wrap {
  display: inline-block;
  margin-bottom: 2.2rem;
}
.brand-logo-wrap img {
  height: 48px;
  width: auto;
  filter: drop-shadow(0 0 14px rgba(57, 255, 20, 0.55))
          drop-shadow(0 0 28px rgba(57, 255, 20, 0.25));
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 600;
  margin: 0 0 1.2rem;
}
.eyebrow-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-neon, #39ff14);
  box-shadow: 0 0 12px rgba(57, 255, 20, 0.8);
  animation: dotPulse 2s ease-in-out infinite;
}
@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 12px rgba(57, 255, 20, 0.5); }
  50%      { box-shadow: 0 0 20px rgba(57, 255, 20, 1); }
}

h1 {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  align-items: center;
  font-size: clamp(2rem, 4.2vw, 3.4rem);
  line-height: 1.0;
  letter-spacing: -0.025em;
  margin: 0 0 1rem;
}
h1 .thin {
  font-weight: 300;
  color: rgba(255, 255, 255, 0.92);
}
h1 .neon {
  font-weight: 800;
  color: var(--color-neon, #39ff14);
  text-shadow: 0 0 22px rgba(57, 255, 20, 0.55), 0 0 44px rgba(57, 255, 20, 0.22);
}

.lead {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 3rem;
  line-height: 1.6;
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.4rem;
  margin-bottom: 2.4rem;
}

.card {
  position: relative;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.015) 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  padding: 2.4rem 1.6rem 1.8rem;
  cursor: pointer;
  text-align: left;
  color: #ffffff;
  font-family: inherit;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  overflow: hidden;
}

/* Subtle halftone bg inside each card */
.card::before {
  content: '';
  position: absolute;
  top: -20%; right: -20%;
  width: 140%; height: 140%;
  background-image: radial-gradient(circle, currentColor 1px, transparent 1.5px);
  background-size: 14px 14px;
  opacity: 0.06;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.45);
  border: 1.5px solid;
  margin-bottom: 1.4rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.neon-icon {
  width: 44px;
  height: 44px;
  filter: drop-shadow(0 0 6px currentColor) drop-shadow(0 0 14px currentColor);
}

.card h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 0.6rem;
  letter-spacing: -0.01em;
}
.card p {
  font-size: 0.88rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.62);
  margin: 0 0 1.4rem;
  min-height: 4.4em;
}
.cta {
  display: inline-block;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.55rem 1rem;
  border-radius: 100px;
  border: 1.5px solid;
  transition: all 0.25s ease;
}

/* === STAY card — neon green === */
.card-stay { color: var(--color-neon, #39ff14); }
.card-stay .icon-wrap {
  color: var(--color-neon, #39ff14);
  border-color: rgba(57, 255, 20, 0.45);
  box-shadow: inset 0 0 18px rgba(57, 255, 20, 0.18);
}
.card-stay h2 { color: var(--color-neon, #39ff14); text-shadow: 0 0 18px rgba(57, 255, 20, 0.40); }
.card-stay .cta {
  color: var(--color-neon, #39ff14);
  border-color: rgba(57, 255, 20, 0.45);
}
.card-stay:hover {
  transform: translateY(-4px);
  border-color: rgba(57, 255, 20, 0.55);
  background: linear-gradient(180deg, rgba(57, 255, 20, 0.10) 0%, rgba(57, 255, 20, 0.02) 100%);
  box-shadow: 0 0 0 1px rgba(57, 255, 20, 0.30), 0 16px 38px rgba(57, 255, 20, 0.20);
}
.card-stay:hover::before { opacity: 0.14; }
.card-stay:hover .icon-wrap { transform: scale(1.06) rotate(-3deg); }
.card-stay:hover .cta { background: var(--color-neon, #39ff14); color: #0d0d0d; border-color: var(--color-neon, #39ff14); }

/* === SHOP card — hot pink === */
.card-shop { color: #ff5fa2; }
.card-shop .icon-wrap {
  color: #ff5fa2;
  border-color: rgba(255, 95, 162, 0.45);
  box-shadow: inset 0 0 18px rgba(255, 95, 162, 0.18);
}
.card-shop h2 { color: #ff5fa2; text-shadow: 0 0 18px rgba(255, 95, 162, 0.40); }
.card-shop .cta {
  color: #ff5fa2;
  border-color: rgba(255, 95, 162, 0.45);
}
.card-shop:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 95, 162, 0.55);
  background: linear-gradient(180deg, rgba(255, 95, 162, 0.10) 0%, rgba(255, 95, 162, 0.02) 100%);
  box-shadow: 0 0 0 1px rgba(255, 95, 162, 0.30), 0 16px 38px rgba(255, 95, 162, 0.20);
}
.card-shop:hover::before { opacity: 0.14; }
.card-shop:hover .icon-wrap { transform: scale(1.06) rotate(3deg); }
.card-shop:hover .cta { background: #ff5fa2; color: #0d0d0d; border-color: #ff5fa2; }

.footer {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.45);
}
.footer a {
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  transition: color 0.15s;
}
.footer a:hover { color: var(--color-neon, #39ff14); }

@media (max-width: 640px) {
  .cards { grid-template-columns: 1fr; }
  h1 { font-size: 1.8rem; }
  .card { padding: 2rem 1.4rem 1.6rem; }
  .icon-wrap { width: 64px; height: 64px; }
  .neon-icon { width: 38px; height: 38px; }
  .brand-logo-wrap img { height: 36px; }
}
</style>
