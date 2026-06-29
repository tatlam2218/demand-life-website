// Thin internal layer to expose Google auth tokens to other modules
// without circular imports.
import * as G from './_google.js'

// We can't access G's private getAccessToken directly, but we can wrap it.
// Solution: call sheetsAppendRow with a no-op to force token fetch is too costly.
// Better: duplicate the minimal token logic here.

function base64urlEncode(bytes) {
  let bin = ''
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function pemToArrayBuffer(pem) {
  const cleaned = pem.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s+/g, '')
  const binary = atob(cleaned)
  const buf = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)
  return buf.buffer
}
function getServiceAccount(env) {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured')
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

const _cache = {}

async function getAccessToken(env, scope) {
  const now = Math.floor(Date.now() / 1000)
  if (_cache[scope] && _cache[scope].expiresAt > now + 60) return _cache[scope].token
  const sa = getServiceAccount(env)
  const header = { alg: 'RS256', typ: 'JWT', kid: sa.private_key_id }
  const claim = { iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }
  const signingInput = `${base64urlEncode(new TextEncoder().encode(JSON.stringify(header)))}.${base64urlEncode(new TextEncoder().encode(JSON.stringify(claim)))}`
  const keyData = pemToArrayBuffer(sa.private_key)
  const cryptoKey = await crypto.subtle.importKey('pkcs8', keyData, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput))
  const jwt = `${signingInput}.${base64urlEncode(new Uint8Array(signature))}`
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`
  })
  if (!resp.ok) throw new Error(`OAuth: ${resp.status} ${await resp.text()}`)
  const data = await resp.json()
  _cache[scope] = { token: data.access_token, expiresAt: now + data.expires_in }
  return data.access_token
}

export async function sheetsAccessToken(env) {
  return getAccessToken(env, 'https://www.googleapis.com/auth/spreadsheets')
}
export async function driveAccessToken(env) {
  return getAccessToken(env, 'https://www.googleapis.com/auth/drive')
}
