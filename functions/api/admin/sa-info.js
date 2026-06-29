// GET /api/admin/sa-info — show Service Account email (for sharing Sheets)
import { requireAuth, json } from '../_utils.js'

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: 'unauthorized' }, 401)
  try {
    const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON)
    return json({
      email: sa.client_email,
      project_id: sa.project_id,
      instructions: `Share each new Google Sheet with ${sa.client_email} (Editor permission)`
    })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}
