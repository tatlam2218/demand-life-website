<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">

      <!-- ── Brand + Contact ── -->
      <div class="footer-brand">
        <div class="footer-logo">
          Demain Life <span class="footer-logo-at">@</span> 1331
        </div>
        <p class="footer-tagline">Premium co-living · Hong Kong</p>
        <address class="footer-address">
          <strong>Demain Culture Entertainment Limited</strong><br>
          Suites 1218-19, 12/F, Chevalier Commercial Centre,<br>
          8 Wang Hoi Road, Kowloon Bay, Hong Kong<br>
          <a href="tel:+85221290190">+852 2129 0190</a><br>
          <a href="mailto:hello@demainculture.com">hello@demainculture.com</a>
        </address>
      </div>

      <!-- ── Navigation ── -->
      <div class="footer-col">
        <h4 class="footer-heading">住宿 Stay</h4>
        <ul class="footer-links">
          <li><router-link to="/">首頁 Home</router-link></li>
          <li><router-link to="/hotel">房型 Rooms</router-link></li>
          <li><router-link to="/book">預訂 Book</router-link></li>
          <li><router-link to="/app-waitlist">早期用戶名單</router-link></li>
        </ul>
      </div>

      <!-- ── Legal ── -->
      <div class="footer-col">
        <h4 class="footer-heading">法律資訊 Legal</h4>
        <ul class="footer-links">
          <li><router-link to="/legal/privacy">私隱政策</router-link></li>
          <li><router-link to="/legal/stay-refund">退款與取消政策</router-link></li>
          <li><router-link to="/legal/stay-terms">服務條款</router-link></li>
          <li><router-link to="/legal/stay-payment">付款政策</router-link></li>
          <li><router-link to="/legal/disclaimer">免責聲明</router-link></li>
        </ul>
      </div>

      <!-- ── Payment ── -->
      <div class="footer-col">
        <h4 class="footer-heading">支付方式 Payment</h4>
        <div class="footer-brands">
          <span class="brand-pill">Visa</span>
          <span class="brand-pill">Mastercard</span>
          <span class="brand-pill">Alipay HK</span>
          <span class="brand-pill">WeChat Pay</span>
          <span class="brand-pill">UnionPay</span>
          <span class="brand-pill">FPS 轉數快</span>
        </div>
        <p class="footer-currency">所有交易以 <strong>HKD 港元</strong>結算<br>支付服務由 QFPay 提供</p>
      </div>

    </div>

    <!-- ── Bottom bar ── -->
    <div class="footer-bottom">
      <span>© {{ new Date().getFullYear() }} Demain Culture Entertainment Limited. 版權所有。</span>
      <span class="footer-bottom-links">
        <router-link to="/legal/privacy">私隱政策</router-link>
        <router-link to="/legal/stay-terms">條款</router-link>
        <router-link to="/legal/disclaimer">免責聲明</router-link>
      </span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #0d0d0d;
  color: rgba(255, 255, 255, 0.6);
  padding: 4rem 2rem 0;
  font-family: var(--font-stack);
  font-size: 0.85rem;
  line-height: 1.75;
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.2fr;
  gap: 3rem;
  padding-bottom: 3rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* Brand */
.footer-logo {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
  margin-bottom: 0.25rem;
}
.footer-logo-at { color: var(--color-neon, #39ff14); }
.footer-tagline {
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 1.2rem;
}
.footer-address {
  font-style: normal;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.8;
}
.footer-address strong { color: rgba(255, 255, 255, 0.85); }
.footer-address a {
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  transition: color 0.15s;
}
.footer-address a:hover { color: var(--color-neon, #39ff14); }

/* Columns */
.footer-heading {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 0.9rem;
}
.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.footer-links a {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 0.83rem;
  transition: color 0.15s;
}
.footer-links a:hover { color: var(--color-neon, #39ff14); }

/* Payment brands */
.footer-brands {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 1rem;
}
.brand-pill {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 3px 9px;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
}
.footer-currency {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1.6;
}
.footer-currency strong { color: rgba(255, 255, 255, 0.55); }

/* Bottom bar */
.footer-bottom {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.25rem 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.25);
  flex-wrap: wrap;
  gap: 0.5rem;
}
.footer-bottom-links {
  display: flex;
  gap: 1.2rem;
}
.footer-bottom-links a {
  color: rgba(255, 255, 255, 0.25);
  text-decoration: none;
  transition: color 0.15s;
}
.footer-bottom-links a:hover { color: rgba(255, 255, 255, 0.55); }

/* Responsive */
@media (max-width: 900px) {
  .footer-inner { grid-template-columns: 1fr 1fr; gap: 2rem; }
}
@media (max-width: 560px) {
  .footer-inner { grid-template-columns: 1fr; gap: 1.5rem; }
  .site-footer { padding: 3rem 1.25rem 0; }
  .footer-bottom { flex-direction: column; align-items: flex-start; gap: 0.4rem; }
}
</style>
