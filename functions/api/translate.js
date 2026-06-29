import { json, readJson, requireAuth } from './_utils.js'

function buildPrompt(kind, sourceLanguage, data) {
  return `You are editing website CMS content for Demain Life.\n\nTask:\n1) Improve the source language copy lightly without changing meaning.\n2) Translate the content into English (en), Traditional Chinese for Hong Kong (zh-HK), and Simplified Chinese (zh-CN).\n3) Keep the same JSON structure and field names as the source input.\n4) Preserve arrays as arrays.\n5) Keep prices and numbers exactly as provided.\n6) Keep tone minimal, warm, precise, premium, and hospitality-oriented.\n\nContent type: ${kind}\nSource language: ${sourceLanguage}\n\nReturn ONLY valid JSON in this exact shape:\n{\n  "en": { ... },\n  "zh-HK": { ... },\n  "zh-CN": { ... }\n}\n\nSource JSON:\n${JSON.stringify(data, null, 2)}`
}

function extractJson(text) {
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first === -1 || last === -1) return null
  return text.slice(first, last + 1)
}

export async function onRequestPost(context) {
  if (!(await requireAuth(context.request, context.env))) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await readJson(context.request)
  if (!body?.data || !body?.sourceLanguage) {
    return json({ success: false, error: 'Missing sourceLanguage or data' }, { status: 400 })
  }
  if (!context.env.XAI_API_KEY) {
    return json({ success: false, error: 'Missing XAI API key' }, { status: 500 })
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${context.env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'grok-4.3',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'Return only valid JSON. No markdown. No extra commentary.' },
        { role: 'user', content: buildPrompt(body.kind || 'website content', body.sourceLanguage, body.data) }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    return json({ success: false, error: `xAI request failed: ${errorText.slice(0, 240)}` }, { status: 500 })
  }

  const result = await response.json()
  const text = result?.choices?.[0]?.message?.content || ''
  const extracted = extractJson(text)
  if (!extracted) {
    return json({ success: false, error: 'AI did not return valid JSON' }, { status: 500 })
  }

  try {
    const translations = JSON.parse(extracted)
    return json({ success: true, translations })
  } catch {
    return json({ success: false, error: 'Failed to parse AI JSON response' }, { status: 500 })
  }
}
