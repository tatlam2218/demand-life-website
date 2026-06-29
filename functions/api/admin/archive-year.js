// POST /api/admin/archive-year
// Body: { year: 2026 }
// Renames current year's sheet to "(archived)", creates new sheet for next year,
// copies active bookings, and switches the active sheet pointer in KV.

import { requireAuth, json, readJson } from '../_utils.js'
import { archiveYear } from '../_sheets_monthly.js'

export async function onRequestPost({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ error: 'unauthorized' }, 401)
  }
  const body = await readJson(request).catch(() => ({}))
  const year = Number(body.year) || new Date().getUTCFullYear()

  try {
    const result = await archiveYear(env, year)
    return json({ success: true, ...result })
  } catch (e) {
    return json({ error: e.message || 'archive_failed' }, 500)
  }
}

// GET /api/admin/archive-year — show what would be archived (preview only)
export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ error: 'unauthorized' }, 401)
  }

  const year = new Date().getUTCFullYear()
  const month = new Date().getUTCMonth() + 1
  const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
  const index = Array.isArray(indexRaw) ? indexRaw : []

  const activeStatuses = ['new','reviewing','profile-sent','profile-submitted','contract-sent','signed','invoice-sent','awaiting-payment','payment-uploaded','paid','ready-for-checkin']
  let activeCount = 0
  for (const idx of index) {
    if (activeStatuses.includes(idx.status)) activeCount++
  }

  const shouldRemind = month === 12 // December

  return json({
    currentYear: year,
    activeBookingsCount: activeCount,
    totalBookingsCount: index.length,
    showReminder: shouldRemind,
    suggestion: shouldRemind
      ? `${year} is ending. Consider archiving and starting fresh for ${year + 1}.`
      : `No archive needed yet. Run this from December onward.`
  })
}
