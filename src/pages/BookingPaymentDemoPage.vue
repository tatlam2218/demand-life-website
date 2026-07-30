<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <section class="demo-hub">
    <div class="container">
      <p class="eyebrow">QFPay Compliance Review</p>
      <h1>Demo Pages</h1>
      <p class="lead">Click any link below to preview each page.</p>

      <div class="link-list">
        <a href="/book/payment-demo-checkout" class="link-item">
          <span class="link-label">Checkout page</span>
          <span class="link-arrow">→</span>
        </a>
        <a href="/book/payment-success?via=qfpay" class="link-item">
          <span class="link-label">Payment complete (QFPay paid)</span>
          <span class="link-arrow">→</span>
        </a>
        <a href="/book/payment-success" class="link-item">
          <span class="link-label">Screenshot received (FPS/bank)</span>
          <span class="link-arrow">→</span>
        </a>
        <a href="/book/payment-failed" class="link-item">
          <span class="link-label">Payment not completed</span>
          <span class="link-arrow">→</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.demo-hub {
  min-height: 100vh;
  padding: 4rem 1.5rem;
  background: var(--cream, #faf8f5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.container {
  max-width: 560px;
  width: 100%;
}
.eyebrow {
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--warm-gray-500, #8a8078);
  margin: 0 0 0.75rem;
}
h1 {
  font-size: 2rem;
  font-weight: 300;
  margin: 0 0 0.5rem;
  color: var(--ink, #1a1a1a);
}
.lead {
  font-size: 0.95rem;
  color: var(--warm-gray-500, #8a8078);
  margin: 0 0 2.5rem;
}
.link-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid var(--warm-gray-100, #e8e4df);
  border-radius: 8px;
  padding: 1.1rem 1.5rem;
  text-decoration: none;
  color: var(--ink, #1a1a1a);
  font-size: 0.95rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.link-item:hover {
  border-color: var(--ink, #1a1a1a);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.link-label { font-weight: 400; }
.link-arrow { font-size: 1.1rem; color: var(--warm-gray-500, #8a8078); }
</style>
