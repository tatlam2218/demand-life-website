import { cloneDefaultSiteData } from '../../shared/defaultContent.js'

const encoder = new TextEncoder()

function json(data, init = {}) {
  // Allow shorthand: json(data, 403) -> treats number as status
  if (typeof init === 'number') {
    init = { status: init }
  }
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
    ...init
  })
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function parseCookies(request) {
  const cookie = request.headers.get('cookie') || ''
  return Object.fromEntries(cookie.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const idx = part.indexOf('=')
    return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))]
  }))
}

function getSessionSecret(env) {
  return env.SESSION_SECRET || env.ADMIN_PASSWORD || 'demain-life-session'
}

export async function createAuthCookie(username, env) {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 7
  const payload = `${username}.${expires}`
  const signature = await sign(payload, getSessionSecret(env))
  return `demain_auth=${encodeURIComponent(`${payload}.${signature}`)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
}

export function clearAuthCookie() {
  return 'demain_auth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
}

// Returns boolean (for legacy callers).
// All authenticated users (admin, admin_stay, admin_shop) pass this.
export async function requireAuth(request, env) {
  const user = await getCurrentUser(request, env)
  return !!user
}

// Returns { username, role: 'admin' | 'stay' | 'shop' } or null.
export async function getCurrentUser(request, env) {
  const cookies = parseCookies(request)
  const token = cookies.demain_auth
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 3) return null
  const username = parts[0]
  const expires = Number(parts[1])
  const signature = parts.slice(2).join('.')
  if (!username || !expires || Date.now() > expires) return null
  const payload = `${username}.${expires}`
  const expected = await sign(payload, getSessionSecret(env))
  if (signature !== expected) return null
  return { username, role: roleForUser(username) }
}

function roleForUser(username) {
  if (username === 'admin_stay') return 'stay'
  if (username === 'admin_shop') return 'shop'
  // 'admin' (legacy super-admin) sees everything
  return 'admin'
}

// Authentication check + role requirement.
// Returns { ok: true, user } or { ok: false, response }.
export async function requireRole(request, env, requiredRole) {
  const user = await getCurrentUser(request, env)
  if (!user) {
    return { ok: false, response: json({ error: 'unauthorized' }, 401) }
  }
  // 'admin' (super) can access any role
  if (user.role === 'admin') return { ok: true, user }
  if (user.role !== requiredRole) {
    return { ok: false, response: json({ error: 'forbidden', message: `Requires ${requiredRole} role` }, 403) }
  }
  return { ok: true, user }
}

export async function requireStayAuth(request, env) {
  return requireRole(request, env, 'stay')
}

export async function requireShopAuth(request, env) {
  return requireRole(request, env, 'shop')
}

// Deep-merge saved content over defaults — ensures newly added fields (like contract templates)
// are present even when an older saved version is in KV.
function deepMerge(target, source) {
  if (!source) return target
  for (const key of Object.keys(source)) {
    const sv = source[key]
    const tv = target[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      deepMerge(tv, sv)
    } else if (sv !== undefined && sv !== null && sv !== '') {
      target[key] = sv
    }
  }
  return target
}

export async function getContent(env) {
  const saved = await env.DEMAIN_DATA?.get('site-content', 'json')
  const defaults = cloneDefaultSiteData()
  if (!saved) return defaults
  // Merge saved overrides on top of defaults (defaults provide any new fields)
  return deepMerge(defaults, saved)
}

export async function saveContent(env, data) {
  const payload = JSON.parse(JSON.stringify(data))
  payload.updatedAt = new Date().toISOString()
  await env.DEMAIN_DATA.put('site-content', JSON.stringify(payload))
  return payload
}

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export { json }
