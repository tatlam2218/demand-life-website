# Demand Life Website — AI Developer Workspace

## Project Overview
- **Project**: Demand Life Website (Demain Life / 德门生活)
- **Live Site**: https://life.demainculture.com
- **Cloudflare Pages**: demain-life.pages.dev
- **Stack**: Vue 3 + Vite + Cloudflare Pages Functions
- **GitHub**: https://github.com/tatlam2218/demand-life-website

## Tech Stack
- **Frontend**: Vue 3 (SPA), Vue Router 4, Vite 5
- **Backend**: Cloudflare Pages Functions (serverless, `/functions/api/`)
- **Database**: Cloudflare KV (`DEMAIN_DATA` binding)
- **Email**: Resend API
- **Payments**: QFPay Hosted Checkout (HKD)
- **Storage**: Google Drive (booking documents, contracts, payment proofs)
- **Sheets**: Google Sheets (booking records, room management)
- **AI**: xAI Grok Vision (payment slip OCR)
- **Translation**: Cloudflare AI (content translation endpoint)

## Project Structure
```
/
├── src/                    # Vue 3 frontend
│   ├── pages/              # Route-level page components
│   ├── components/         # Shared UI components
│   ├── composables/        # Vue composables (useSiteContent.js)
│   ├── stores/             # Pinia/reactive stores (cart.js)
│   ├── i18n/               # Internationalisation (en / zh-CN / zh-HK)
│   ├── router.js           # Vue Router routes
│   ├── App.vue             # Root app component
│   ├── main.js             # App entry point
│   └── style.css           # Global styles
├── functions/api/          # Cloudflare Pages Functions (serverless API)
│   ├── _utils.js           # Shared utilities (auth, JSON helpers)
│   ├── _email.js           # Resend email helpers + templates
│   ├── _google.js          # Google Drive + Sheets API helpers
│   ├── _google_internal.js # Internal Google helpers
│   ├── _qfpay.js           # QFPay payment integration
│   ├── _contract.js        # Contract generation
│   ├── _contracts.js       # Contract helpers
│   ├── _contracts_default.js # Default contract templates
│   ├── _pdf.js             # PDF generation helpers
│   ├── _grok_vision.js     # xAI Grok Vision (OCR)
│   ├── _rooms.js           # Room management helpers
│   ├── _rooms_sheet.js     # Rooms <-> Sheets sync
│   ├── _payments_sheet.js  # Payments <-> Sheets sync
│   ├── _shop.js            # Shop helpers
│   ├── _sheet_ids.js       # Google Sheet ID constants
│   ├── _sheets_monthly.js  # Monthly sheet management
│   ├── auth/               # Login / logout / session check
│   ├── bookings/           # Guest booking flow endpoints
│   ├── contracts/          # Contract view / sign endpoints
│   ├── payments/           # Payment start + QFPay notify
│   ├── shop/               # Shop products + orders
│   ├── admin/              # Admin-only endpoints
│   │   ├── bookings/       # Admin booking management
│   │   ├── rooms/          # Admin room management
│   │   └── shop/           # Admin shop inventory + orders
│   ├── content.js          # CMS content endpoint
│   ├── legal.js            # Legal pages endpoint
│   └── translate.js        # Translation endpoint
├── public/                 # Static assets
│   ├── brand/              # Logos
│   ├── hero/               # Hero images (standard)
│   ├── hero-opt/           # Hero images (optimised)
│   ├── hero-hd/            # Hero images (high-res)
│   ├── hero-punk/          # Hero images (punk variant)
│   ├── rooms/              # Room photography
│   ├── rooms-opt/          # Room photography (optimised)
│   ├── feature-cards/      # Feature section cards
│   ├── shop-cards/         # Shop section cards
│   ├── payment/            # FPS QR code
│   └── site/               # Misc site images
├── shared/
│   └── defaultContent.js   # Default CMS content (shared frontend/backend)
├── scripts/
│   ├── optimize-hero.py    # Hero image optimisation script
│   └── seed-images.js      # Image seeding script
├── index.html              # Vite HTML entry
├── vite.config.js          # Vite configuration
├── wrangler.toml           # Cloudflare Workers/Pages configuration
├── package.json            # NPM dependencies and scripts
├── .env.example            # Environment variable template
└── AI_DEVELOPER_IMPORT_README.md  # Original migration notes
```

## Routes (Vue Router)
| Path | Component | Notes |
|------|-----------|-------|
| `/` | PublicHomePage | Main public page (hotel + shop tabs) |
| `/book` | BookingPage | Step 1: room selection + guest details |
| `/book/details` | BookingDetailsPage | Step 2: booking confirmation |
| `/book/contract` | ContractSignPage | Step 3: contract review + signature |
| `/book/payment` | BookingPaymentPage | Step 4: payment |
| `/book/payment-success` | PaymentResultPage | Payment success |
| `/book/payment-failed` | PaymentResultPage | Payment failure |
| `/shop/product/:sku` | ShopProductPage | Individual product page |
| `/shop/checkout` | ShopCheckoutPage | Cart checkout |
| `/shop/order/:orderId` | ShopOrderStatusPage | Order status |
| `/legal/:page` | LegalPage | Terms / Privacy |
| `/admin` | AdminLoginChoicePage | Admin entry (Stay or Shop) |
| `/admin/login` | AdminLoginPage | Admin login (super) |
| `/admin/stay` | AdminDashboardPage | Stay admin dashboard |
| `/admin/shop` | AdminShopPage | Shop admin dashboard |

## API Endpoints (Cloudflare Pages Functions)
### Auth
- `POST /api/auth/login` — Login (username/password → session cookie)
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Check session

### Bookings (Guest)
- `POST /api/bookings` — Create booking
- `GET /api/bookings/[id]/details` — Booking details
- `GET /api/bookings/[id]/access` — Booking access token check
- `POST /api/bookings/[id]/upload-id` — Upload guest ID
- `POST /api/bookings/[id]/upload-payment` — Upload payment proof
- `GET/POST /api/bookings/[id]/contract` — Contract endpoint

### Contracts
- `GET /api/contracts/[id]/view` — View contract
- `GET /api/contracts/[id]/data` — Contract data
- `POST /api/contracts/[id]/sign` — Sign contract

### Payments
- `POST /api/payments/[id]/start` — Start QFPay checkout
- `POST /api/payments/notify` — QFPay payment notification webhook

### Shop (Public)
- `GET /api/shop/products` — Product list
- `GET /api/shop/products/[sku]` — Product detail
- `POST /api/shop/orders` — Create order
- `GET /api/shop/orders/[id]` — Order status

### Admin (Protected)
- `GET/POST /api/admin/bookings` — List / manage bookings
- `GET/PUT/DELETE /api/admin/bookings/[id]` — Booking CRUD
- `POST /api/admin/bookings/[id]/approve-payment` — Approve payment
- `POST /api/admin/bookings/[id]/assign-room` — Assign room
- `POST /api/admin/bookings/[id]/checkin` — Check in guest
- `POST /api/admin/bookings/[id]/contract-draft` — Draft contract
- `POST /api/admin/bookings/[id]/mark-paid` — Mark as paid
- `POST /api/admin/bookings/[id]/payment-request` — Send payment request
- `POST /api/admin/bookings/[id]/resend-email` — Resend emails
- `GET/POST /api/admin/bookings/[id]/signed-contract` — Signed contract
- `POST /api/admin/bookings/[id]/workflow` — Workflow state transitions
- `GET/PUT /api/admin/rooms` — Room management
- `GET/PUT /api/admin/shop/inventory` — Shop inventory
- `GET/PUT /api/admin/shop/orders/[id]` — Shop order management
- `GET/PUT /api/admin/content` — CMS content management
- `GET/PUT /api/admin/legal` — Legal content management
- `POST /api/admin/payments` — Payment management
- Various admin utilities: `migrate-all`, `setup-sheets`, `archive-year`, etc.

### CMS / Content
- `GET /api/content` — Public CMS content
- `GET /api/legal` — Legal content
- `GET /api/translate` — Translation endpoint

## Development Commands
```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables (ALL REQUIRED IN PRODUCTION)

### Set in `.env` locally / Cloudflare Pages Secrets in production:

| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUDFLARE_API_TOKEN` | CF API token for deployments | Deploy only |
| `ADMIN_USERNAME` | Super-admin username | Yes |
| `ADMIN_PASSWORD` | Super-admin password | Yes |
| `ADMIN_STAY_USERNAME` | Stay-admin username | Optional |
| `ADMIN_STAY_PASSWORD` | Stay-admin password | Optional |
| `ADMIN_SHOP_USERNAME` | Shop-admin username | Optional |
| `ADMIN_SHOP_PASSWORD` | Shop-admin password | Optional |
| `SESSION_SECRET` | Cookie signing secret (random 32+ chars) | Yes |
| `RESEND_API_KEY` | Resend.com API key for emails | Yes |
| `EMAIL_FROM` | Default sender (e.g. `Demain Life <hello@demainculture.com>`) | Yes |
| `EMAIL_FROM_STAY` | Stay-specific sender | Optional |
| `EMAIL_FROM_SHOP` | Shop-specific sender | Optional |
| `BOOKING_NOTIFY_EMAIL` | Staff notification email address | Yes |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full Google service account JSON (stringified) | Yes |
| `GOOGLE_SHEET_ID` | Google Sheets spreadsheet ID for bookings | Yes |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive folder ID for booking documents | Yes |
| `QFPAY_APP_CODE` | QFPay merchant app code | Yes (payments) |
| `QFPAY_CLIENT_KEY` | QFPay client key / shared secret | Yes (payments) |
| `QFPAY_BASE_URL` | QFPay API base URL (sandbox or prod) | Yes (payments) |
| `QFPAY_MCHNT_ID` | QFPay merchant ID (agent mode) | Optional |
| `XAI_API_KEY` | xAI Grok Vision API key (payment OCR) | Optional |
| `CF_ACCOUNT_ID` | Cloudflare account ID | Optional |
| `CF_BROWSER_RENDERING_TOKEN` | CF Browser Rendering token | Optional |
| `SITE_URL` | Public site URL (e.g. `https://life.demainculture.com`) | Yes |

## Cloudflare Configuration (wrangler.toml)
```toml
name = "demain-life"
compatibility_date = "2025-01-01"
pages_build_output_dir = "dist"

[[kv_namespaces]]
binding = "DEMAIN_DATA"
id = "ade44846a5854044b09cb180675efd55"
```

### KV Namespace
- **Binding name**: `DEMAIN_DATA`
- **KV Namespace ID**: `ade44846a5854044b09cb180675efd55`
- **Purpose**: Primary data store — bookings, rooms, shop inventory, orders, CMS content, legal pages, sessions

## Admin Roles
| Role | Username Env Var | Access |
|------|-----------------|--------|
| `admin` (super) | `ADMIN_USERNAME` | Full access (Stay + Shop) |
| `stay` | `ADMIN_STAY_USERNAME` | Hotel stay admin only |
| `shop` | `ADMIN_SHOP_USERNAME` | Shop admin only |

## Internationalisation
- Supported locales: `en`, `zh-CN`, `zh-HK`
- Translation files: `src/i18n/index.js`
- Guest emails are sent in the guest's selected language

## Deployment Checklist (before going live)
- [ ] Set all Cloudflare Pages Secrets (env vars listed above)
- [ ] Confirm KV namespace binding `DEMAIN_DATA` is attached in CF Pages settings
- [ ] Confirm `wrangler.toml` KV namespace ID matches live KV namespace
- [ ] Confirm custom domain `life.demainculture.com` is wired to CF Pages
- [ ] Test admin login with `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- [ ] Test booking flow end-to-end
- [ ] Test QFPay payment (sandbox first, then production)
- [ ] Verify Google Sheets integration (booking records)
- [ ] Verify Google Drive integration (document uploads)
- [ ] Verify Resend email sending (guest + staff notifications)
- [ ] Verify xAI Grok Vision OCR (payment slip analysis)

## Notes for AI Developer
- Do NOT commit `.env`, `.cf-env`, or `secrets/` directories
- `node_modules/` and `dist/` are excluded from git
- The `shared/defaultContent.js` is imported by both frontend and backend
- All Cloudflare Pages Functions use ES module syntax (`export async function onRequestGet...`)
- The KV binding `DEMAIN_DATA` is available as `context.env.DEMAIN_DATA` in all functions
- Session auth uses a signed cookie (`demain_session`) — see `_utils.js`
- When deploying, use `npm run build` first, then Cloudflare Pages picks up `dist/`
