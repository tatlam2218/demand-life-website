// worker.js — Unified Cloudflare Worker entry point for Workers for Platform deployment.
//
// This single file acts as both:
//   1. Static asset server (SPA frontend via env.ASSETS)
//   2. API router (delegates /api/* routes to functions/api/ modules)
//
// The _kv_adapter middleware patches env.DEMAIN_DATA -> D1 adapter for all API handlers.

import { patchEnv } from './functions/api/_kv_adapter.js'

// ─── Import all API route handlers ───────────────────────────────────────────
// Auth
import * as authLogin from './functions/api/auth/login.js'
import * as authLogout from './functions/api/auth/logout.js'
import * as authMe from './functions/api/auth/me.js'

// Public content
import * as apiContent from './functions/api/content.js'
import * as apiLegal from './functions/api/legal.js'
import * as apiTranslate from './functions/api/translate.js'

// Bookings (public/guest)
import * as bookingsIndex from './functions/api/bookings/index.js'
import * as bookingAccess from './functions/api/bookings/[id]/access.js'
import * as bookingContract from './functions/api/bookings/[id]/contract.js'
import * as bookingDetails from './functions/api/bookings/[id]/details.js'
import * as bookingFile from './functions/api/bookings/[id]/file/[name].js'
import * as bookingPaymentInfo from './functions/api/bookings/[id]/payment-info.js'
import * as bookingSignContract from './functions/api/bookings/[id]/sign-contract.js'
import * as bookingUploadId from './functions/api/bookings/[id]/upload-id.js'
import * as bookingUploadPayment from './functions/api/bookings/[id]/upload-payment.js'

// Contracts (public)
import * as contractData from './functions/api/contracts/[id]/data.js'
import * as contractSign from './functions/api/contracts/[id]/sign.js'
import * as contractView from './functions/api/contracts/[id]/view.js'

// Payments (public)
import * as paymentStart from './functions/api/payments/[id]/start.js'
import * as paymentNotify from './functions/api/payments/notify.js'

// App waitlist (public)
import * as apiWaitlist from './functions/api/waitlist/index.js'

// Shop (public)
import * as shopProducts from './functions/api/shop/products.js'
import * as shopProductSku from './functions/api/shop/products/[sku].js'
import * as shopOrders from './functions/api/shop/orders.js'
import * as shopOrderId from './functions/api/shop/orders/[id].js'

// Admin - bookings
import * as adminBookings from './functions/api/admin/bookings/index.js'
import * as adminBookingId from './functions/api/admin/bookings/[id].js'
import * as adminBookingApprovePay from './functions/api/admin/bookings/[id]/approve-payment.js'
import * as adminBookingAssignRoom from './functions/api/admin/bookings/[id]/assign-room.js'
import * as adminBookingCheckin from './functions/api/admin/bookings/[id]/checkin.js'
import * as adminBookingContractDraft from './functions/api/admin/bookings/[id]/contract-draft.js'
import * as adminBookingFile from './functions/api/admin/bookings/[id]/file.js'
import * as adminBookingFileName from './functions/api/admin/bookings/[id]/file/[name].js'
import * as adminBookingMarkPaid from './functions/api/admin/bookings/[id]/mark-paid.js'
import * as adminBookingPayRequest from './functions/api/admin/bookings/[id]/payment-request.js'
import * as adminBookingReleaseRoom from './functions/api/admin/bookings/[id]/release-room.js'
import * as adminBookingResendEmail from './functions/api/admin/bookings/[id]/resend-email.js'
import * as adminBookingSignedContract from './functions/api/admin/bookings/[id]/signed-contract.js'
import * as adminBookingWorkflow from './functions/api/admin/bookings/[id]/workflow.js'
import * as adminBookingCleanupTest from './functions/api/admin/bookings/cleanup-test.js'
import * as adminBookingCleanupGoogle from './functions/api/admin/bookings/cleanup-google.js'

// Admin - rooms
import * as adminRooms from './functions/api/admin/rooms/index.js'
import * as adminRoomsReset from './functions/api/admin/rooms/reset.js'
import * as adminRoomsSeed from './functions/api/admin/rooms/seed.js'

// Admin - shop
import * as adminShopInventory from './functions/api/admin/shop/inventory.js'
import * as adminShopInventorySku from './functions/api/admin/shop/inventory/[sku].js'
import * as adminShopOrders from './functions/api/admin/shop/orders.js'
import * as adminShopOrderId from './functions/api/admin/shop/orders/[id].js'
import * as adminShopSeedReal from './functions/api/admin/shop/seed-real.js'
import * as adminShopDemoSeed from './functions/api/admin/shop/demo-seed.js'

// Admin - misc
import * as adminContent from './functions/api/admin/content.js'
import * as adminLegal from './functions/api/admin/legal.js'
import * as adminPayments from './functions/api/admin/payments.js'
import * as adminMigrateAll from './functions/api/admin/migrate-all.js'
import * as adminSetupSheets from './functions/api/admin/setup-sheets.js'
import * as adminArchiveYear from './functions/api/admin/archive-year.js'
import * as adminDriveCleanup from './functions/api/admin/drive-cleanup.js'
import * as adminDriveInspect from './functions/api/admin/drive-inspect.js'
import * as adminFixHeaders from './functions/api/admin/fix-headers.js'
import * as adminInitHeaders from './functions/api/admin/init-headers.js'
import * as adminFullReset from './functions/api/admin/full-reset.js'
import * as adminSaInfo from './functions/api/admin/sa-info.js'
import * as adminSheetCleanup from './functions/api/admin/sheet-cleanup.js'
import * as adminSheetTabs from './functions/api/admin/sheet-tabs.js'
import * as adminTestGoogle from './functions/api/admin/test-google.js'

// ─── Route table ─────────────────────────────────────────────────────────────
// Each entry: { pattern: RegExp, params: string[], module }
// Order matters — more specific patterns first.

const ROUTES = [
  // Auth
  { pattern: /^\/api\/auth\/login$/, params: [], module: authLogin },
  { pattern: /^\/api\/auth\/logout$/, params: [], module: authLogout },
  { pattern: /^\/api\/auth\/me$/, params: [], module: authMe },

  // Public content
  { pattern: /^\/api\/content$/, params: [], module: apiContent },
  { pattern: /^\/api\/legal$/, params: [], module: apiLegal },
  { pattern: /^\/api\/translate$/, params: [], module: apiTranslate },

  // App waitlist
  { pattern: /^\/api\/waitlist$/, params: [], module: apiWaitlist },

  // Admin - shop (specific before generic)
  { pattern: /^\/api\/admin\/shop\/inventory\/([^/]+)$/, params: ['sku'], module: adminShopInventorySku },
  { pattern: /^\/api\/admin\/shop\/inventory$/, params: [], module: adminShopInventory },
  { pattern: /^\/api\/admin\/shop\/orders\/([^/]+)$/, params: ['id'], module: adminShopOrderId },
  { pattern: /^\/api\/admin\/shop\/orders$/, params: [], module: adminShopOrders },
  { pattern: /^\/api\/admin\/shop\/seed-real$/, params: [], module: adminShopSeedReal },
  { pattern: /^\/api\/admin\/shop\/demo-seed$/, params: [], module: adminShopDemoSeed },

  // Admin - bookings (specific before generic)
  { pattern: /^\/api\/admin\/bookings\/cleanup-test$/, params: [], module: adminBookingCleanupTest },
  { pattern: /^\/api\/admin\/bookings\/cleanup-google$/, params: [], module: adminBookingCleanupGoogle },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/approve-payment$/, params: ['id'], module: adminBookingApprovePay },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/assign-room$/, params: ['id'], module: adminBookingAssignRoom },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/checkin$/, params: ['id'], module: adminBookingCheckin },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/contract-draft$/, params: ['id'], module: adminBookingContractDraft },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/file\/([^/]+)$/, params: ['id', 'name'], module: adminBookingFileName },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/file$/, params: ['id'], module: adminBookingFile },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/mark-paid$/, params: ['id'], module: adminBookingMarkPaid },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/payment-request$/, params: ['id'], module: adminBookingPayRequest },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/release-room$/, params: ['id'], module: adminBookingReleaseRoom },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/resend-email$/, params: ['id'], module: adminBookingResendEmail },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/signed-contract$/, params: ['id'], module: adminBookingSignedContract },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)\/workflow$/, params: ['id'], module: adminBookingWorkflow },
  { pattern: /^\/api\/admin\/bookings\/([^/]+)$/, params: ['id'], module: adminBookingId },
  { pattern: /^\/api\/admin\/bookings$/, params: [], module: adminBookings },

  // Admin - rooms
  { pattern: /^\/api\/admin\/rooms\/reset$/, params: [], module: adminRoomsReset },
  { pattern: /^\/api\/admin\/rooms\/seed$/, params: [], module: adminRoomsSeed },
  { pattern: /^\/api\/admin\/rooms$/, params: [], module: adminRooms },

  // Admin - misc
  { pattern: /^\/api\/admin\/content$/, params: [], module: adminContent },
  { pattern: /^\/api\/admin\/legal$/, params: [], module: adminLegal },
  { pattern: /^\/api\/admin\/payments$/, params: [], module: adminPayments },
  { pattern: /^\/api\/admin\/migrate-all$/, params: [], module: adminMigrateAll },
  { pattern: /^\/api\/admin\/setup-sheets$/, params: [], module: adminSetupSheets },
  { pattern: /^\/api\/admin\/archive-year$/, params: [], module: adminArchiveYear },
  { pattern: /^\/api\/admin\/drive-cleanup$/, params: [], module: adminDriveCleanup },
  { pattern: /^\/api\/admin\/drive-inspect$/, params: [], module: adminDriveInspect },
  { pattern: /^\/api\/admin\/fix-headers$/, params: [], module: adminFixHeaders },
  { pattern: /^\/api\/admin\/init-headers$/, params: [], module: adminInitHeaders },
  { pattern: /^\/api\/admin\/full-reset$/, params: [], module: adminFullReset },
  { pattern: /^\/api\/admin\/sa-info$/, params: [], module: adminSaInfo },
  { pattern: /^\/api\/admin\/sheet-cleanup$/, params: [], module: adminSheetCleanup },
  { pattern: /^\/api\/admin\/sheet-tabs$/, params: [], module: adminSheetTabs },
  { pattern: /^\/api\/admin\/test-google$/, params: [], module: adminTestGoogle },

  // Bookings (guest)
  { pattern: /^\/api\/bookings\/([^/]+)\/file\/([^/]+)$/, params: ['id', 'name'], module: bookingFile },
  { pattern: /^\/api\/bookings\/([^/]+)\/access$/, params: ['id'], module: bookingAccess },
  { pattern: /^\/api\/bookings\/([^/]+)\/contract$/, params: ['id'], module: bookingContract },
  { pattern: /^\/api\/bookings\/([^/]+)\/details$/, params: ['id'], module: bookingDetails },
  { pattern: /^\/api\/bookings\/([^/]+)\/payment-info$/, params: ['id'], module: bookingPaymentInfo },
  { pattern: /^\/api\/bookings\/([^/]+)\/sign-contract$/, params: ['id'], module: bookingSignContract },
  { pattern: /^\/api\/bookings\/([^/]+)\/upload-id$/, params: ['id'], module: bookingUploadId },
  { pattern: /^\/api\/bookings\/([^/]+)\/upload-payment$/, params: ['id'], module: bookingUploadPayment },
  { pattern: /^\/api\/bookings$/, params: [], module: bookingsIndex },

  // Contracts (public)
  { pattern: /^\/api\/contracts\/([^/]+)\/data$/, params: ['id'], module: contractData },
  { pattern: /^\/api\/contracts\/([^/]+)\/sign$/, params: ['id'], module: contractSign },
  { pattern: /^\/api\/contracts\/([^/]+)\/view$/, params: ['id'], module: contractView },

  // Payments
  { pattern: /^\/api\/payments\/([^/]+)\/start$/, params: ['id'], module: paymentStart },
  { pattern: /^\/api\/payments\/notify$/, params: [], module: paymentNotify },

  // Shop (public)
  { pattern: /^\/api\/shop\/products\/([^/]+)$/, params: ['sku'], module: shopProductSku },
  { pattern: /^\/api\/shop\/products$/, params: [], module: shopProducts },
  { pattern: /^\/api\/shop\/orders\/([^/]+)$/, params: ['id'], module: shopOrderId },
  { pattern: /^\/api\/shop\/orders$/, params: [], module: shopOrders },
]

// ─── Route matching helper ────────────────────────────────────────────────────
function matchRoute(pathname) {
  for (const route of ROUTES) {
    const m = pathname.match(route.pattern)
    if (m) {
      const params = {}
      route.params.forEach((name, i) => { params[name] = m[i + 1] })
      return { module: route.module, params }
    }
  }
  return null
}

// ─── Build a Pages Function context object ────────────────────────────────────
function makeContext(request, env, params) {
  return {
    request,
    env,
    params,
    next: () => new Response('Not Found', { status: 404 }),
    data: {},
    waitUntil: (p) => { /* no-op in worker mode */ },
    passThroughOnException: () => {}
  }
}

// ─── Dispatch to the right handler on a module ───────────────────────────────
function dispatchHandler(mod, method, context) {
  const handlerName = `onRequest${method.charAt(0) + method.slice(1).toLowerCase()}`
  const fn = mod[handlerName] || mod.onRequest
  if (!fn) return new Response('Method Not Allowed', { status: 405 })
  return fn(context)
}

// ─── Main fetch handler ───────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // Patch env: DEMAIN_DATA → D1 adapter
    patchEnv(env)

    // ── API routing ──
    if (url.pathname.startsWith('/api/')) {
      const match = matchRoute(url.pathname)
      if (!match) {
        return new Response(JSON.stringify({ error: 'not_found', path: url.pathname }), {
          status: 404,
          headers: { 'content-type': 'application/json' }
        })
      }
      const context = makeContext(request, env, match.params)
      try {
        return await dispatchHandler(match.module, request.method, context)
      } catch (err) {
        console.error('API error:', err)
        return new Response(JSON.stringify({ error: 'internal_error', message: err.message }), {
          status: 500,
          headers: { 'content-type': 'application/json' }
        })
      }
    }

    // ── Static asset serving ──
    try {
      const assetResponse = await env.ASSETS.fetch(request)
      if (assetResponse.status !== 404) return assetResponse
    } catch { /* fall through */ }

    // ── SPA fallback: all unknown paths serve index.html ──
    try {
      const indexReq = new Request(new URL('/index.html', url.origin).toString(), {
        method: 'GET',
        headers: request.headers
      })
      const indexRes = await env.ASSETS.fetch(indexReq)
      if (indexRes.ok) {
        return new Response(indexRes.body, {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-cache, no-store, must-revalidate'
          }
        })
      }
    } catch { /* fall through */ }

    return new Response('Not Found', { status: 404 })
  }
}
// cache-bust: 20260629T054450Z
