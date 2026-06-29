// GET /api/admin/legal — fetch all legal templates (contract / terms / privacy + landlord info)
// PUT /api/admin/legal — replace templates
import { json, requireAuth, readJson } from '../_utils.js'
import { getLegalTemplates, saveLegalTemplates } from '../_contracts.js'

export async function onRequestGet({ request, env }) {
  const ok = await requireAuth(request, env)
  if (!ok) return json({ error: 'unauthorized' }, { status: 401 })
  const templates = await getLegalTemplates(env)
  return json({ templates })
}

export async function onRequestPut({ request, env }) {
  const ok = await requireAuth(request, env)
  if (!ok) return json({ error: 'unauthorized' }, { status: 401 })
  const body = await readJson(request)
  if (!body || typeof body !== 'object') return json({ error: 'invalid_body' }, { status: 400 })
  // Increment contract version when contract content changes
  const current = await getLegalTemplates(env)
  if (body.contract && JSON.stringify(body.contract) !== JSON.stringify(current.contract)) {
    body.contract.version = (current.contract?.version || 1) + 1
  }
  const saved = await saveLegalTemplates(env, body)
  return json({ success: true, templates: saved })
}
