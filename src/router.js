import { createRouter, createWebHistory } from 'vue-router'
import PublicHomePage from './pages/PublicHomePage.vue'
import BookingPage from './pages/BookingPage.vue'
import BookingDetailsPage from './pages/BookingDetailsPage.vue'
import ContractSignPage from './pages/ContractSignPage.vue'
import BookingPaymentPage from './pages/BookingPaymentPage.vue'
import PaymentResultPage from './pages/PaymentResultPage.vue'
import LegalPage from './pages/LegalPage.vue'
import AdminLoginChoicePage from './pages/AdminLoginChoicePage.vue'
import AdminLoginPage from './pages/AdminLoginPage.vue'
import AdminDashboardPage from './pages/AdminDashboardPage.vue'
import AdminShopPage from './pages/AdminShopPage.vue'
import ShopProductPage from './pages/ShopProductPage.vue'
import ShopCheckoutPage from './pages/ShopCheckoutPage.vue'
import ShopOrderStatusPage from './pages/ShopOrderStatusPage.vue'

const routes = [
  // ============ Public ============
  { path: '/', name: 'home', component: PublicHomePage },

  // ============ Stay (酒店预订) ============
  { path: '/book', name: 'book', component: BookingPage },
  { path: '/book/details', name: 'book-details', component: BookingDetailsPage },
  { path: '/book/contract', name: 'book-contract', component: ContractSignPage },
  { path: '/book/payment', name: 'book-payment', component: BookingPaymentPage },
  { path: '/book/payment-success', name: 'payment-success', component: PaymentResultPage },
  { path: '/book/payment-failed', name: 'payment-failed', component: PaymentResultPage },

  // ============ Shop (文创商店) ============
  // /shop is consolidated into the home page's Shop tab (PublicHomePage with #shop hash)
  { path: '/shop', redirect: '/#shop' },
  { path: '/shop/product/:sku', name: 'shop-product', component: ShopProductPage },
  { path: '/shop/checkout', name: 'shop-checkout', component: ShopCheckoutPage },
  { path: '/shop/order/:orderId', name: 'shop-order-status', component: ShopOrderStatusPage },

  // ============ Legal ============
  { path: '/legal/:page(terms|privacy)', name: 'legal', component: LegalPage },

  // ============ Admin ============
  // Choice page with 2 buttons (Stay / Shop)
  { path: '/login', name: 'login-choice', component: AdminLoginChoicePage },
  { path: '/admin', name: 'admin-choice', component: AdminLoginChoicePage },
  // Stay admin: login + dashboard
  { path: '/admin/login', name: 'admin-login', component: AdminLoginPage, props: { defaultRole: 'stay' } },
  { path: '/admin/stay/login', name: 'admin-stay-login', component: AdminLoginPage, props: { defaultRole: 'stay' } },
  { path: '/admin/stay', name: 'admin-stay', component: AdminDashboardPage },
  // Shop admin: login + dashboard
  { path: '/admin/shop/login', name: 'admin-shop-login', component: AdminLoginPage, props: { defaultRole: 'shop' } },
  { path: '/admin/shop', name: 'admin-shop', component: AdminShopPage }
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})
