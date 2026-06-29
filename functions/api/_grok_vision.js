// Grok Vision — identity document extraction
// Uses XAI_API_KEY (same as translate). No new credentials needed.

const GROK_API = 'https://api.x.ai/v1/chat/completions'

const SYSTEM_PROMPT = `You are an identity document information extractor.
Carefully look at the document image and extract the visible fields.
The image may be rotated; mentally rotate it to read correctly before extracting.
Return ONLY a strict JSON object, no commentary, no markdown fences.

Schema:
{
  "documentType": "hk_id" | "passport" | "cn_id" | "other",
  "documentNumber": "string or null",
  "name": "string (romanized full name, e.g. LAM, Tat) or null",
  "nameChinese": "string (Chinese characters, e.g. 林達) or null",
  "nationality": "ISO 3166-1 alpha-3 code (e.g. HKG, CHN, USA) or null",
  "dateOfBirth": "YYYY-MM-DD or null",
  "gender": "M" | "F" | "X" | null,
  "issueDate": "YYYY-MM-DD or null (most recent issue date)",
  "expiryDate": "YYYY-MM-DD or null (passports only)",
  "confidence": number between 0 and 1
}

Rules:
- If a field is unreadable or absent, set it to null. Do NOT guess.
- If the image is NOT an identity document (e.g. the back of a chip card, blank surface), return: {"error": "not_a_document", "hint": "<what you saw>"}
- If the image is too blurry to read confidently, return: {"error": "image_too_blurry"}

HK ID specific:
- A Hong Kong Permanent ID Card (香港永久性居民身份诉) typically has:
  - Bilingual title "HONG KONG PERMANENT IDENTITY CARD" / "香港永久性居民身份诉"
  - Romanized name (last, first), e.g. "LAM, Tat"
  - Chinese name (2-4 characters)
  - 8-digit ID number formatted as "XXXX XXXX" near the top (this is the documentNumber)
  - Date of Birth labeled "出生日期 Date of Birth" in DD-MM-YYYY format
  - Gender labeled with "男 M" or "女 F"
  - Date of issue labeled "簽發日期 Date of Issue" in DD-MM-YY format (last 2 digits of year)
  - A small code under the name like (10-91) which is the FIRST issue date and (***AX) symbols
  - A secondary number like "P128433(2)" near the bottom — this is the permanent-resident reference, NOT the documentNumber
- documentNumber for HK ID = the 8-digit number at the TOP ("XXXX XXXX"), formatted as "XXXXXXXX" without space
- For HKG nationality, use "HKG"
- Convert DD-MM-YYYY (or DD-MM-YY where YY is 2 digits) to YYYY-MM-DD. For 2-digit years: 00-30 → 20YY, 31-99 → 19YY.

Passport specific:
- expiryDate is required if visible
- documentNumber is the passport number (alphanumeric)

CN ID specific (居民身份证):
- documentNumber is the 18-digit ID number

Return raw JSON only — your entire response must be valid JSON.`

export async function extractDocumentInfo(env, imageBase64DataUrl, options = {}) {
  if (!env.XAI_API_KEY) {
    return { skipped: true, reason: 'XAI_API_KEY not configured' }
  }

  const side = options.side || 'front'
  const userPrompt = side === 'back'
    ? 'This is the BACK of an identity document. Extract any readable fields (most card backs have minimal data — if so return {"error": "not_a_document", "hint": "card back, no readable fields"}). Return JSON only.'
    : 'Extract the identity document information from this image. The image may be rotated — mentally rotate it to read correctly. Return JSON only.'

  // grok-4.3 is the current flagship with vision support
  const body = {
    model: 'grok-4.3',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: imageBase64DataUrl, detail: 'high' } }
        ]
      }
    ],
    temperature: 0,
    max_tokens: 600
  }

  const resp = await fetch(GROK_API, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.XAI_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Grok vision failed: ${resp.status} ${text}`)
  }
  const data = await resp.json()
  const raw = data?.choices?.[0]?.message?.content || ''
  // Try to extract JSON from possible markdown fences
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    // attempt: find first '{' ... last '}'
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      try { parsed = JSON.parse(cleaned.slice(start, end + 1)) } catch (e) { /* */ }
    }
    if (!parsed) {
      throw new Error('Grok returned non-JSON: ' + cleaned.slice(0, 200))
    }
  }
  return parsed
}
