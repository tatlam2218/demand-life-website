// /api/waitlist
//
// POST  { name, email, locale? }  — register for the early-adopter list
// GET   ?secret=<ADMIN_PASSWORD>  — download the full list as JSON (admin only)

import { json, readJson } from '../_utils.js'

/* ── helpers ──────────────────────────────────────────────────────────────── */

function isValidEmail(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
}

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  return response
}

/* ── POST /api/waitlist ───────────────────────────────────────────────────── */

export async function onRequestPost({ request, env }) {
  const body = await readJson(request) || {}
  const name  = (body.name  || '').trim()
  const email = (body.email || '').trim().toLowerCase()
  const locale = body.locale || 'en'

  if (!name)              return cors(json({ error: 'name_required',  message: 'Please enter your name.' },  400))
  if (!isValidEmail(email)) return cors(json({ error: 'email_invalid', message: 'Please enter a valid email address.' }, 400))

  try {
    await env.DB.prepare(
      `INSERT INTO app_waitlist (name, email, locale) VALUES (?, ?, ?)`
    ).bind(name, email, locale).run()

    return cors(json({ success: true, message: 'You\'re on the list!' }))
  } catch (err) {
    // SQLite UNIQUE constraint fires when the email already exists
    if (err.message?.includes('UNIQUE') || err.cause?.message?.includes('UNIQUE')) {
      return cors(json({ error: 'already_registered', message: 'This email is already registered.' }, 409))
    }
    console.error('waitlist insert error', err)
    return cors(json({ error: 'server_error', message: 'Something went wrong. Please try again.' }, 500))
  }
}

/* ── GET /api/waitlist ────────────────────────────────────────────────────── */
// Simple secret-key gate — pass ?secret=<ADMIN_PASSWORD>
// Returns JSON array of { id, name, email, locale, created_at }

export async function onRequestGet({ request, env }) {
  const url    = new URL(request.url)
  const secret = url.searchParams.get('secret') || ''
  const adminPw = env.ADMIN_PASSWORD || env.SESSION_SECRET || ''

  if (!adminPw || secret !== adminPw) {
    return cors(json({ error: 'unauthorized' }, 401))
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, name, email, locale, created_at FROM app_waitlist ORDER BY created_at DESC`
    ).all()

    return cors(json({ success: true, count: results.length, rows: results }))
  } catch (err) {
    console.error('waitlist fetch error', err)
    return cors(json({ error: 'server_error' }, 500))
  }
}

/* ── OPTIONS preflight ────────────────────────────────────────────────────── */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
