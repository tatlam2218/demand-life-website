# Demand Life Website

Prepared for migration into a new Genspark AI Developer workspace named **Demand Life Website**.

## Stack
- Vue 3
- Vite
- Cloudflare Pages Functions
- Cloudflare KV binding: `DEMAIN_DATA`

## Included
- `src/`
- `functions/`
- `public/`
- `package.json` + `package-lock.json`
- `vite.config.js`
- `wrangler.toml`
- `.env.example`

## Excluded intentionally
- `.cf-env`
- `node_modules/`
- `dist/`
- `.wrangler/`

## After import into AI Developer
1. Open the project as **Demand Life Website**.
2. Run `npm install`.
3. Add the real secret values using `.env.example` as the key list.
4. Confirm Cloudflare settings from `wrangler.toml`.
5. Run `npm run build`.
6. Reconnect external credentials used by `functions/api/` if needed.
7. Test admin login, booking, shop inventory, and deployment.

## Runtime dependencies to reconnect
- Cloudflare Pages deployment target
- KV namespace binding `DEMAIN_DATA`
- Admin credentials / session secret
- External API / payment credentials referenced by `functions/api/`

## Current live site
- https://life.demainculture.com
