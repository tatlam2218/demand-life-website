// Seed all real images into the deployed site via the admin API.
// Run: node scripts/seed-images.js
import fs from 'node:fs/promises'
import path from 'node:path'
import { cloneDefaultSiteData } from '../shared/defaultContent.js'

const BASE = process.env.BASE_URL || 'https://demain-life.pages.dev'
const USERNAME = process.env.ADMIN_USERNAME || 'admin'
const PASSWORD = process.env.ADMIN_PASSWORD || 'demainlife123'

const PUBLIC_ROOMS = path.join(process.cwd(), 'public', 'rooms-opt')
const PUBLIC_HERO = path.join(process.cwd(), 'public', 'hero')
const PUBLIC_HD = path.join(process.cwd(), 'public', 'hero-hd')
const PUBLIC_OPT = path.join(process.cwd(), 'public', 'hero-opt')

const ROOM_IMAGES = {
  'one-bed-studio': [
    ['rooms', 'one-bed-studio-1.jpg'],
    ['rooms', 'one-bed-studio-2.jpg'],
    ['rooms', 'one-bed-studio-3.jpg']
  ],
  'twin-studio': [
    ['rooms', 'twin-studio-1.jpg'],
    ['rooms', 'twin-studio-2.jpg'],
    ['rooms', 'twin-studio-3.jpg']
  ]
}

// Hero cinematic — top of homepage (uses optimized JPEGs)
const HERO_IMAGES = [
  ['opt', 'kai-tak-dusk-aerial-hd.jpg'],
  ['opt', 'hostel-at-night-hd.jpg'],
  ['opt', 'night-life-hd.jpg']
]

// Life Here is disabled — clear its images to save bandwidth
const LIFE_IMAGES = []

// The Site — masterplan with green-highlighted nine blocks
const SITE_IMAGES = [
  ['opt', 'site-masterplan-hd.jpg']
]

// Transport — CTS shuttle bus
const TRANSPORT_IMAGES = [
  ['opt', 'cts-bus.jpg']
]

async function fileToDataUrl([folder, file]) {
  const roots = { rooms: PUBLIC_ROOMS, hero: PUBLIC_HERO, hd: PUBLIC_HD, opt: PUBLIC_OPT }
  const root = roots[folder]
  const buf = await fs.readFile(path.join(root, file))
  const mime = file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/png'
  return `data:${mime};base64,${buf.toString('base64')}`
}

async function main() {
  const cookieJar = new Map()
  const setCookies = (res) => {
    const raw = res.headers.getSetCookie?.() ?? []
    for (const c of raw) {
      const [pair] = c.split(';')
      const eq = pair.indexOf('=')
      cookieJar.set(pair.slice(0, eq), pair.slice(eq + 1))
    }
  }
  const cookieHeader = () =>
    [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')

  // 1. Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  })
  setCookies(loginRes)
  if (!loginRes.ok) throw new Error(`login failed: ${loginRes.status}`)
  console.log('✓ logged in')

  // 2. Fetch current KV
  const contentRes = await fetch(`${BASE}/api/admin/content`, {
    headers: { cookie: cookieHeader() }
  })
  const contentJson = await contentRes.json()
  if (!contentJson.success) throw new Error('failed to fetch content')
  const remote = contentJson.data
  console.log('✓ fetched remote content')

  // 3. Merge with latest defaults so new sections (lifeHere, transport) exist
  const defaults = cloneDefaultSiteData()
  const data = {
    ...defaults,
    ...remote,
    navigation: remote.navigation || defaults.navigation,
    swipe: remote.swipe || defaults.swipe,
    hotel: remote.hotel || defaults.hotel,
    shop: remote.shop || defaults.shop,
    lifeHere: remote.lifeHere || defaults.lifeHere,
    site: remote.site || defaults.site,
    transport: remote.transport || defaults.transport,
    rooms: remote.rooms?.length ? remote.rooms : defaults.rooms,
    products: remote.products?.length ? remote.products : defaults.products
  }

  // 4. Replace room images
  for (const room of data.rooms) {
    const files = ROOM_IMAGES[room.id]
    if (!files) continue
    room.images = []
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file)
      room.images.push(dataUrl)
      console.log(`  + ${room.id} <- ${file[1]} (${(dataUrl.length / 1024).toFixed(0)} KB)`)
    }
  }

  // 4b. Replace Hero (cinematic) images
  data.hotel.heroImages = []
  for (const file of HERO_IMAGES) {
    const dataUrl = await fileToDataUrl(file)
    data.hotel.heroImages.push(dataUrl)
    console.log(`  + hotel.hero <- ${file[1]} (${(dataUrl.length / 1024).toFixed(0)} KB)`)
  }

  // 5. Clear Life Here images (section is hidden)
  data.lifeHere.heroImages = []
  console.log('  - lifeHere images cleared (section hidden)')

  // 5b. Replace Site (masterplan) images
  if (!data.site) data.site = defaults.site
  data.site.heroImages = []
  for (const file of SITE_IMAGES) {
    const dataUrl = await fileToDataUrl(file)
    data.site.heroImages.push(dataUrl)
    console.log(`  + site      <- ${file[1]} (${(dataUrl.length / 1024).toFixed(0)} KB)`)
  }

  // 6. Replace Transport images
  data.transport.heroImages = []
  for (const file of TRANSPORT_IMAGES) {
    const dataUrl = await fileToDataUrl(file)
    data.transport.heroImages.push(dataUrl)
    console.log(`  + transport <- ${file[1]} (${(dataUrl.length / 1024).toFixed(0)} KB)`)
  }

  // 7. Save
  const putRes = await fetch(`${BASE}/api/admin/content`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', cookie: cookieHeader() },
    body: JSON.stringify(data)
  })
  const putJson = await putRes.json()
  if (!putJson.success) throw new Error('save failed: ' + JSON.stringify(putJson))
  console.log('✓ saved & published')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
