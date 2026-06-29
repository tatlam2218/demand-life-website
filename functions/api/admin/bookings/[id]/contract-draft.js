// /api/admin/bookings/:id/contract-draft
//   GET    -> return current draft (html + meta). Auto-generate from template if none exists.
//   PUT    -> save draft html (admin edits, may be pasted-from-Word). Body: { html, lang? }
//   POST { action: 'regenerate' } -> overwrite draft with a fresh build from the template
//   POST { action: 'freeze' }     -> mark frozen (called internally on send-contract; safe no-op if already)
//
// Draft is stored as body-only HTML (no <!doctype>) so it can be rendered with v-html.

import { json, readJson, requireStayAuth } from '../../../_utils.js'
import { buildContractHtml } from '../../../_contract.js'

const MAX_HTML_BYTES = 200 * 1024 // 200 KB sanity cap

function clamp(s, max) {
  return typeof s === 'string' ? s.slice(0, max) : ''
}

// Very light HTML scrub: strip <script>/<iframe>/on*= handlers to avoid XSS when admin pastes from Word.
function sanitizeHtml(html) {
  if (!html) return ''
  let out = String(html)
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '')
  out = out.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  out = out.replace(/<style[\s\S]*?<\/style>/gi, '')   // Word pastes <style> blocks — strip them; inline styles preserved
  out = out.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
  out = out.replace(/\son\w+\s*=\s*'[^']*'/gi, '')
  out = out.replace(/javascript:/gi, '')
  return out
}

async function loadBooking(env, id) {
  return env.DEMAIN_DATA.get(`booking:${id}`, 'json')
}
async function saveBooking(env, booking) {
  await env.DEMAIN_DATA.put(`booking:${booking.id}`, JSON.stringify(booking))
}

export async function onRequestGet({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const booking = await loadBooking(env, params.id)
  if (!booking) return json({ error: 'not_found' }, 404)

  // Auto-generate on first read if missing (covers bookings created before this feature shipped)
  if (!booking.contractDraft) {
    try {
      const lang = booking.sourceLang || 'en'
      const built = await buildContractHtml(env, booking, lang)
      booking.contractDraft = {
        html: built.bodyHtml || built.html,
        lang,
        generatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'auto-on-first-open',
        source: 'auto-template',
        monthlyRent: built.monthlyRent,
        depositMonths: built.depositMonths,
        depositAmount: built.depositAmount,
        firstMonthRent: built.firstMonthRent,
        totalPrepayment: built.totalPrepayment,
        moveOutDate: built.moveOutDate,
        contractNumber: built.contractNumber,
        frozen: false
      }
      await saveBooking(env, booking)
    } catch (err) {
      return json({ error: 'draft_generation_failed', message: err.message }, 500)
    }
  }

  return json({
    success: true,
    draft: booking.contractDraft,
    bookingStatus: booking.status,
    canEdit: !booking.contractDraft.frozen
  })
}

export async function onRequestPut({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const body = await readJson(request)
  if (!body || typeof body.html !== 'string') return json({ error: 'invalid_body' }, 400)

  const booking = await loadBooking(env, params.id)
  if (!booking) return json({ error: 'not_found' }, 404)

  if (booking.contractDraft?.frozen) {
    return json({ error: 'contract_frozen', message: 'Contract already sent — cannot edit.' }, 409)
  }

  const html = clamp(sanitizeHtml(body.html), MAX_HTML_BYTES)
  const now = new Date().toISOString()

  booking.contractDraft = {
    ...(booking.contractDraft || {}),
    html,
    lang: clamp(body.lang || booking.contractDraft?.lang || 'en', 10),
    updatedAt: now,
    updatedBy: auth.user?.username || 'admin',
    source: 'manual-edit',
    frozen: false
  }
  booking.history = booking.history || []
  booking.history.push({ at: now, action: 'contract_draft_saved', by: auth.user?.username || 'admin' })

  await saveBooking(env, booking)
  return json({ success: true, draft: booking.contractDraft })
}

export async function onRequestPost({ request, env, params }) {
  const auth = await requireStayAuth(request, env)
  if (!auth.ok) return auth.response

  const body = await readJson(request)
  const action = body?.action

  const booking = await loadBooking(env, params.id)
  if (!booking) return json({ error: 'not_found' }, 404)

  if (action === 'regenerate') {
    if (booking.contractDraft?.frozen) {
      return json({ error: 'contract_frozen' }, 409)
    }
    try {
      const lang = body.lang || booking.contractDraft?.lang || booking.sourceLang || 'en'
      const built = await buildContractHtml(env, booking, lang)
      const now = new Date().toISOString()
      booking.contractDraft = {
        html: built.bodyHtml || built.html,
        lang,
        generatedAt: now,
        updatedAt: now,
        updatedBy: auth.user?.username || 'admin',
        source: 'regenerated-from-template',
        monthlyRent: built.monthlyRent,
        depositMonths: built.depositMonths,
        depositAmount: built.depositAmount,
        firstMonthRent: built.firstMonthRent,
        totalPrepayment: built.totalPrepayment,
        moveOutDate: built.moveOutDate,
        contractNumber: built.contractNumber,
        frozen: false
      }
      booking.history = booking.history || []
      booking.history.push({ at: now, action: 'contract_draft_regenerated', by: auth.user?.username || 'admin' })
      await saveBooking(env, booking)
      return json({ success: true, draft: booking.contractDraft })
    } catch (err) {
      return json({ error: 'regenerate_failed', message: err.message }, 500)
    }
  }

  if (action === 'freeze') {
    if (booking.contractDraft) {
      booking.contractDraft.frozen = true
      booking.contractDraft.frozenAt = new Date().toISOString()
      await saveBooking(env, booking)
    }
    return json({ success: true, draft: booking.contractDraft })
  }

  if (action === 'withdraw') {
    // Withdraw a sent contract: unfreeze the draft so admin can edit + resend,
    // and roll booking status back to 'profile-submitted' so the workflow allows send-contract again.
    if (!booking.contractDraft || !booking.contractDraft.frozen) {
      return json({ error: 'nothing_to_withdraw' }, 400)
    }
    if (booking.contract?.contractHash) {
      // Already signed by client — don't allow silent withdraw.
      return json({ error: 'already_signed', message: 'Tenant has already signed. Cannot withdraw.' }, 409)
    }
    const now = new Date().toISOString()
    booking.contractDraft.frozen = false
    booking.contractDraft.withdrawnAt = now
    booking.contractDraft.withdrawnBy = auth.user?.username || 'admin'
    // Mark booking as "contract withdrawn" — the client page reads this flag and shows the
    // "contract has been recalled by admin, please wait for a new one" notice while admin edits.
    booking.contractWithdrawn = true
    booking.contractWithdrawnAt = now
    if (booking.status === 'contract-sent') {
      booking.status = 'profile-submitted'
    }
    booking.history = booking.history || []
    booking.history.push({ at: now, action: 'contract_withdrawn', by: auth.user?.username || 'admin', reason: body.reason || '' })
    await saveBooking(env, booking)

    // Also reflect status in the index
    try {
      const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
      const index = Array.isArray(indexRaw) ? indexRaw : []
      const idx = index.findIndex((b) => b.id === booking.id)
      if (idx !== -1) {
        index[idx].status = booking.status
        await env.DEMAIN_DATA.put('booking-index', JSON.stringify(index))
      }
    } catch { /* non-fatal */ }

    return json({ success: true, draft: booking.contractDraft })
  }

  return json({ error: 'unknown_action' }, 400)
}
