# Demain Life

A minimal hotel + shop website with horizontal swipe navigation between two worlds.

## Tech Stack

- **Vue 3** + **Vite** + JavaScript
- Pure CSS design system (Muji-inspired, white background)
- Cloudflare Pages ready

## Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:5173

## Build for Production

```bash
npm run build
```

Output is in `dist/`.

## Deploy to Cloudflare Pages

### One-time setup
```bash
npx wrangler login
```
This opens your browser to authenticate with Cloudflare.

### Deploy
```bash
npm run build
npx wrangler pages deploy dist --project-name=demain-life
```

You'll get a URL like `https://demain-life.pages.dev`.

### Subsequent deploys
Just run the deploy command again — Cloudflare creates a preview URL per deploy.

## Project Structure

```
src/
├── App.vue                    # Main shell with swipe logic
├── main.js                    # Entry
├── style.css                  # Global design system
├── components/
│   ├── TopBar.vue            # Sticky top bar
│   └── SwipeNavigator.vue    # Bottom swipe control (key UX)
└── pages/
    ├── HotelPage.vue         # Stay world — 2 room types
    └── ShopPage.vue          # Shop world — product grid
```

## Design Tokens

Defined as CSS variables in `src/style.css`:

- `--color-white` `#ffffff`
- `--color-cream` `#fafaf7`
- `--color-ink` `#2a2826`
- `--color-warm-gray-*` palette
- `--font-en` Inter
- `--font-zh` Noto Sans HK

## Next Steps

1. Replace placeholder images with real photography
2. Replace placeholder copy with real content
3. Wire booking form → Google Sheet via Apps Script
4. Add product detail pages
5. Connect Grok API for AI contract generation
6. Connect Gmail API for email notifications
