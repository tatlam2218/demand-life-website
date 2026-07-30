<script setup>
// /shop/clear-cart
// Immediately clears the cart from localStorage and redirects to the shop tab.
// Share this URL with QFPay reviewers to reset the basket between demo runs.
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { clearCart } from '../stores/cart.js'

const router = useRouter()

onMounted(() => {
  // 1. Wipe localStorage directly — this is what persists across sessions
  try {
    localStorage.removeItem('demain_shop_cart_v1')
  } catch (e) {}

  // 2. Also clear the reactive store in case it was loaded before this page
  clearCart()

  // 3. Hard-reload to /?cleardone=1#shop
  //    Using location.replace (not href) so the /shop/clear-cart URL is NOT
  //    added to history. The ?cleardone=1 query param ensures a FULL page
  //    reload (the browser treats it as a different URL, not just a hash change),
  //    which forces cart.js to re-run load() and read the now-empty localStorage.
  setTimeout(() => {
    window.location.replace('/?cleardone=1#shop')
  }, 700)
})
</script>

<template>
  <div class="clear-page">
    <div class="clear-box">
      <p class="icon">🛍️</p>
      <p class="msg">Cart cleared</p>
      <p class="sub">Redirecting to shop…</p>
    </div>
  </div>
</template>

<style scoped>
.clear-page {
  min-height: 100vh;
  background: #0d0d0d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Inter, -apple-system, sans-serif;
}
.clear-box {
  text-align: center;
  padding: 2rem;
}
.icon {
  font-size: 3rem;
  margin: 0 0 0.75rem;
}
.msg {
  color: #39ff14;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.35rem;
}
.sub {
  color: rgba(255,255,255,0.4);
  font-size: 0.9rem;
  margin: 0;
}
</style>
