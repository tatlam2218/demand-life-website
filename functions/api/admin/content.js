import { getContent, json, readJson, requireAuth, saveContent } from '../_utils.js'

export async function onRequestGet(context) {
  if (!(await requireAuth(context.request, context.env))) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const data = await getContent(context.env)
  return json({ success: true, data })
}

export async function onRequestPut(context) {
  if (!(await requireAuth(context.request, context.env))) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const body = await readJson(context.request)
  if (!body) return json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  const data = await saveContent(context.env, body)
  return json({ success: true, data })
}
