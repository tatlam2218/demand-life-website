import { getContent, json } from './_utils.js'

export async function onRequestGet(context) {
  const data = await getContent(context.env)
  return json({ success: true, data })
}
