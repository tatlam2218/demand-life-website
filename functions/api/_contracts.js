// Contract template management + rendering
import { DEFAULT_LEGAL } from './_contracts_default.js'

const KV_KEY = 'legal-templates'

export async function getLegalTemplates(env) {
  const saved = await env.DEMAIN_DATA?.get(KV_KEY, 'json')
  if (saved) {
    // Merge defaults for any missing keys
    return mergeDeep(JSON.parse(JSON.stringify(DEFAULT_LEGAL)), saved)
  }
  return JSON.parse(JSON.stringify(DEFAULT_LEGAL))
}

export async function saveLegalTemplates(env, data) {
  const payload = JSON.parse(JSON.stringify(data))
  payload.updatedAt = new Date().toISOString()
  await env.DEMAIN_DATA.put(KV_KEY, JSON.stringify(payload))
  return payload
}

function mergeDeep(target, source) {
  for (const k of Object.keys(source || {})) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
      target[k] = mergeDeep(target[k] || {}, source[k])
    } else {
      target[k] = source[k]
    }
  }
  return target
}

// Fill placeholders {{key}} with values from data
export function fillTemplate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = data[key]
    if (v == null) return ''
    return String(v).replace(/[<>]/g, (c) => c === '<' ? '&lt;' : '&gt;')
  })
}

// Calculate move-out date given move-in date and a duration like "6 months" / "12 months" / "1 month"
export function calcMoveOutDate(moveInDate, duration) {
  if (!moveInDate || !duration) return ''
  const months = parseDurationToMonths(duration)
  if (!months) return ''
  const d = new Date(moveInDate)
  if (Number.isNaN(d.getTime())) return ''
  d.setMonth(d.getMonth() + months)
  // Subtract one day so the period ends on the day before the next anniversary
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function parseDurationToMonths(duration) {
  if (!duration) return 0
  const s = String(duration)
  const m = s.match(/(\d+)/)
  if (!m) return 0
  return parseInt(m[1], 10)
}

// Build the data dictionary used to fill contract / email placeholders
export function buildContractData(booking, room, legal, options = {}) {
  const details = booking.details || {}
  const landlord = legal.landlord || {}
  const lang = options.lang || booking.sourceLang || 'en'

  // Determine room price — prefer admin-defined number, else parse from string
  let roomPrice = ''
  let monthlyRent = 0
  if (room) {
    const m = String(room.price || '').replace(/[^\d.]/g, '')
    if (m) {
      monthlyRent = parseFloat(m)
      roomPrice = monthlyRent.toLocaleString('en-US')
    }
  }
  const depositMonths = 2
  const depositAmount = (monthlyRent * depositMonths).toLocaleString('en-US')

  const idTypeMap = {
    en: { hk_id: 'HK ID', passport: 'Passport', cn_id: 'China ID', other: 'Identity document' },
    'zh-HK': { hk_id: '香港身份證', passport: '護照', cn_id: '中國居民身份證', other: '身份證件' },
    'zh-CN': { hk_id: '香港身份证', passport: '护照', cn_id: '中国居民身份证', other: '身份证件' }
  }
  const idType = (idTypeMap[lang] || idTypeMap.en)[details.documentType] || details.documentType || ''

  // Room type name in the right language
  const roomName = room ? (room.title || booking.roomType) : booking.roomType

  return {
    // Booking identity
    bookingId: booking.id,
    contractDate: new Date().toISOString().slice(0, 10),
    contractNumber: `${booking.id}-V${legal.contract?.version || 1}`,

    // Tenant
    name: details.name || booking.name || '',
    nameChinese: details.nameChinese ? `(${details.nameChinese})` : '',
    idType,
    idNumber: details.documentNumber || '',
    nationality: details.nationality || booking.nationality || '',
    dateOfBirth: details.dateOfBirth || '',
    currentAddress: details.currentAddress || '',
    phone: booking.phone || '',
    email: booking.email || '',
    occupation: details.occupation || '',

    // Emergency contact
    emergencyName: details.emergencyName || '',
    emergencyPhone: details.emergencyPhone || '',
    emergencyRelation: details.emergencyRelation || '',
    emergencyEmail: details.emergencyEmail || '',

    // Tenancy
    roomType: roomName,
    occupancy: booking.occupancy || '1',
    moveInDate: booking.moveInDate || '',
    moveOutDate: calcMoveOutDate(booking.moveInDate, booking.duration),
    duration: booking.duration || '',
    roomPrice,
    depositAmount,
    monthlyRent,

    // Landlord
    landlordName: landlord.name || 'Demain Culture Limited',
    landlordAddress: landlord.address || '',
    landlordRep: landlord.representative || '',

    // Signature (filled at signing time)
    signatureDate: options.signatureDate || new Date().toISOString().slice(0, 10),
    signatureName: options.signatureName || details.name || booking.name || '',
    signaturePlaceholder: options.signatureImageHtml || '&nbsp;'
  }
}

// Render full contract HTML
export function renderContractHTML(booking, room, legal, options = {}) {
  const lang = options.lang || booking.sourceLang || 'en'
  const template = legal.contract?.[lang] || legal.contract?.en || ''
  const data = buildContractData(booking, room, legal, options)
  const body = fillTemplate(template, data)

  const printBanner = {
    en: { title: '📄 Save this contract as PDF', body: 'Press <kbd>Ctrl+P</kbd> (Windows) or <kbd>⌘+P</kbd> (Mac), then choose "Save as PDF" as the destination.', button: 'Print / Save as PDF' },
    'zh-CN': { title: '📄 保存合同为 PDF', body: '按 <kbd>Ctrl+P</kbd>（Windows）或 <kbd>⌘+P</kbd>（Mac），目标位置选择「另存为 PDF」。', button: '打印 / 另存为 PDF' },
    'zh-HK': { title: '📄 將合約儲存為 PDF', body: '按 <kbd>Ctrl+P</kbd>（Windows）或 <kbd>⌘+P</kbd>（Mac），目的地選擇「儲存為 PDF」。', button: '列印 / 另存為 PDF' }
  }
  const bnr = printBanner[lang] || printBanner.en

  return `<!doctype html><html lang="${lang}"><head>
<meta charset="utf-8">
<title>Tenancy Agreement — ${data.bookingId}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: 'Inter', 'Noto Sans HK', -apple-system, 'Segoe UI', sans-serif; max-width: 760px; margin: 0 auto; padding: 48px 32px; color: #2a2826; line-height: 1.7; font-size: 14px; background: #f7f5f0; }
  .contract-paper { background: #fff; padding: 56px 60px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 4px; }
  h1 { font-size: 24px; font-weight: 500; margin: 0 0 24px; border-bottom: 2px solid #2a2826; padding-bottom: 12px; }
  h2 { font-size: 16px; font-weight: 500; margin: 28px 0 12px; color: #2a2826; page-break-after: avoid; }
  h3 { font-size: 14px; font-weight: 600; margin: 20px 0 10px; }
  p, ul, ol { margin: 8px 0; }
  ul, ol { padding-left: 22px; }
  strong { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  td, th { vertical-align: top; padding: 6px 10px; }
  th { background: #f4f1ea; font-weight: 500; text-align: left; }
  table.bordered td, table.bordered th { border: 1px solid #d8d4ca; }
  .signature-block { margin-top: 40px; padding-top: 24px; border-top: 1px dashed #999; page-break-inside: avoid; }
  .signature-block img { max-height: 80px; max-width: 280px; }
  kbd { background: #efe7d6; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 12px; border: 1px solid #d4c8a8; }

  /* Print-only banner shown in browser, hidden when printing */
  .pdf-banner { position: sticky; top: 0; background: linear-gradient(135deg, #2a2826 0%, #4a463c 100%); color: #fff; padding: 16px 24px; border-radius: 6px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; z-index: 100; }
  .pdf-banner-text { flex: 1; min-width: 200px; }
  .pdf-banner h3 { margin: 0 0 4px; color: #fff; font-size: 14px; font-weight: 500; }
  .pdf-banner p { margin: 0; font-size: 12px; color: #d8d4ca; }
  .pdf-banner button { background: #fff; color: #2a2826; border: none; padding: 10px 20px; border-radius: 4px; font-weight: 500; cursor: pointer; font-size: 13px; }
  .pdf-banner button:hover { background: #f4f1ea; }
  .pdf-banner kbd { background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.3); }

  @media print {
    body { padding: 0; background: #fff; }
    .contract-paper { padding: 0; box-shadow: none; border-radius: 0; }
    .pdf-banner { display: none !important; }
  }
</style>
</head><body>
<div class="pdf-banner" id="pdfBanner">
  <div class="pdf-banner-text">
    <h3>${bnr.title}</h3>
    <p>${bnr.body}</p>
  </div>
  <button onclick="window.print()">${bnr.button}</button>
</div>
<div class="contract-paper">${body}</div>
</body></html>`
}

// Compute SHA-256 hash of a string
export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
