// Contract template renderer + helpers
import { getContent } from './_utils.js'

// Parse a price string like "HK$ 6,800" → 6800
export function parsePrice(s) {
  if (typeof s !== 'string') return 0
  const digits = s.replace(/[^0-9.]/g, '')
  return Math.round(parseFloat(digits) || 0)
}

// Format number with thousand separator
export function fmt(n) {
  if (n == null) return ''
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Compute move-out date given move-in (YYYY-MM-DD) and duration string
// Returns YYYY-MM-DD string. Best-effort parse of "6 months", "12 months", "1 month" etc.
export function computeMoveOutDate(moveInDate, durationStr) {
  if (!moveInDate) return ''
  let months = 6
  if (durationStr) {
    const m = String(durationStr).match(/(\d+)/)
    if (m) months = parseInt(m[1], 10)
  }
  try {
    const d = new Date(moveInDate + 'T00:00:00Z')
    if (isNaN(d.getTime())) return ''
    d.setUTCMonth(d.getUTCMonth() + months)
    return d.toISOString().slice(0, 10)
  } catch (e) {
    return ''
  }
}

// Generate human-readable contract number
export function generateContractNumber(bookingId) {
  // Use part of booking id + checksum
  const t = Date.now().toString(36).toUpperCase()
  return `DL-CT-${bookingId.replace(/^DL-/, '')}-${t.slice(-4)}`
}

const DOC_TYPE_LABELS = {
  hk_id: { en: 'HK Identity Card', 'zh-CN': '香港身份证', 'zh-HK': '香港身份證' },
  passport: { en: 'Passport', 'zh-CN': '护照', 'zh-HK': '護照' },
  cn_id: { en: 'China Resident ID', 'zh-CN': '中国居民身份证', 'zh-HK': '中國居民身份證' },
  other: { en: 'Other ID', 'zh-CN': '其他证件', 'zh-HK': '其他證件' }
}

const ROOM_TYPE_LABELS = {
  'one-bed-studio': { en: 'One-Bed Studio', 'zh-CN': '单床工作间', 'zh-HK': '單床工作間' },
  'twin-studio': { en: 'Twin Studio', 'zh-CN': '双床工作间', 'zh-HK': '雙床工作間' }
}

// Replace {{placeholders}} in template string with values from data
function renderTemplate(tpl, data) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    const v = data[key]
    if (v == null || v === '') return ''
    return String(v)
  })
}

// Build the "Landlord — Electronically executed" box that replaces a manual signature.
// Cites Hong Kong Electronic Transactions Ordinance (Cap. 553) so the e-execution is
// legally meaningful, mirrors what banks/SaaS contracts do.
function buildLandlordExecutedBox(lang, data, booking) {
  const company = data.landlordName  // "Demain Culture Entertainment Limited"
  const contractDate = data.contractDate || ''
  const contractNumber = data.contractNumber || ''

  const COPY = {
    en: {
      label: 'Landlord (Demain Life)',
      stampTitle: 'Electronically executed',
      jurisdiction: 'Hong Kong Special Administrative Region',
      legal: 'This contract is automatically generated and electronically executed by the Landlord upon the Tenant\'s signature. No manual signature from the Landlord is required under Section 6 of the Electronic Transactions Ordinance (Cap. 553) of Hong Kong.',
      executedOn: 'Executed on',
      reference: 'Contract reference'
    },
    'zh-HK': {
      label: '出租人（Demain Life）',
      stampTitle: '電子簽署',
      jurisdiction: '香港特別行政區',
      legal: '本合約為電腦自動生成，並於承租人簽署同時由出租人以電子方式簽署。根據香港《電子交易條例》（第553章）第6條，出租人無需手動簽名。',
      executedOn: '簽署日期',
      reference: '合約編號'
    },
    'zh-CN': {
      label: '出租人（Demain Life）',
      stampTitle: '电子签署',
      jurisdiction: '中国香港特别行政区',
      legal: '本合同为计算机自动生成，并于承租人签署同时由出租人以电子方式签署。根据香港《电子交易条例》（第553章）第6条，出租人无需手动签名。',
      executedOn: '签署日期',
      reference: '合同编号'
    }
  }
  const c = COPY[lang] || COPY.en
  return `
    <p class="signature-label">${c.label}</p>
    <div class="e-executed-box" style="border: 1.5pt solid #2a2826; border-radius: 4pt; padding: 10pt 12pt; margin: 4pt 0 6pt; background: #fafaf7;">
      <p style="margin: 0 0 4pt; font-size: 9pt; letter-spacing: 0.12em; text-transform: uppercase; color: #4a4744; font-weight: 600;">[ ${c.stampTitle} ]</p>
      <p style="margin: 0; font-size: 10pt; font-weight: 500; color: #2a2826;">${company}</p>
      <p style="margin: 0; font-size: 9pt; color: #8a8780;">${c.jurisdiction}</p>
    </div>
    <p style="margin: 6pt 0 2pt; font-size: 8.5pt; color: #4a4744; line-height: 1.55; text-align: justify;">${c.legal}</p>
    <p style="margin: 6pt 0 0; font-size: 9pt; color: #8a8780;">
      ${c.executedOn}: ${contractDate}<br>
      ${c.reference}: ${contractNumber}
    </p>
  `
}

// Build the full rendered HTML contract for a booking, in a given language
export async function buildContractHtml(env, booking, lang, options = {}) {
  const content = await getContent(env)
  const tpl = content?.contracts?.templates?.[lang]
    || content?.contracts?.templates?.en
    || { subject: 'Tenancy Agreement', body: '<p>Contract template not configured.</p>' }

  const depositMonths = options.depositMonths
    || content?.contracts?.depositMonthsDefault
    || 2

  const details = booking.details || {}
  const roomTypeLabel = ROOM_TYPE_LABELS[booking.roomType]?.[lang] || booking.roomType
  const docTypeLabel = DOC_TYPE_LABELS[details.documentType]?.[lang] || details.documentType || ''

  // Find room price from site content — match by id OR by name in any language
  const bookingRoomType = (booking.roomType || '').trim().toLowerCase()
  const roomData = (content?.rooms || []).find((r) => {
    if (r.id === booking.roomType) return true
    if ((r.id || '').toLowerCase() === bookingRoomType) return true
    for (const t of Object.values(r.translations || {})) {
      if ((t?.name || '').trim().toLowerCase() === bookingRoomType) return true
    }
    return false
  })
  const roomPriceNum = roomData ? parsePrice(roomData.translations?.en?.price || roomData.translations?.['zh-HK']?.price || '') : 0
  // For twin studio price might be "per person" -- keep as-is
  const roomPriceDisplay = roomData ? (roomData.translations?.[lang]?.price || roomData.translations?.en?.price || `HK$ ${roomPriceNum}`) : ''

  const monthlyRent = options.monthlyRent || roomPriceNum
  const depositAmount = monthlyRent * depositMonths
  const firstMonthRent = monthlyRent
  const totalPrepayment = depositAmount + firstMonthRent

  const moveOutDate = computeMoveOutDate(booking.moveInDate, booking.duration)
  const contractNumber = booking.contractNumber || generateContractNumber(booking.id)
  const contractDate = new Date().toISOString().slice(0, 10)

  const data = {
    contractNumber,
    contractDate,
    bookingId: booking.id,

    // Landlord
    landlordName: 'Demain Culture Entertainment Limited',
    landlordAddress: 'Demain@1331, Kai Tak, Kowloon, Hong Kong',
    landlordRep: 'Authorised Representative',

    // Tenant
    name: details.name || booking.name || '',
    nameChinese: details.nameChinese || '',
    idType: docTypeLabel,
    idNumber: details.documentNumber || '',
    nationality: details.nationality || booking.nationality || '',
    dateOfBirth: details.dateOfBirth || '',
    currentAddress: details.currentAddress || '',
    phone: booking.phone || '',
    email: booking.email || '',

    // Room
    roomType: roomTypeLabel,
    roomPrice: fmt(monthlyRent),
    roomPriceDisplay,
    occupancy: booking.occupancy || '1',

    // Term
    moveInDate: booking.moveInDate || '',
    moveOutDate,
    duration: booking.duration || '',

    // Money
    depositMonths,
    depositAmount: fmt(depositAmount),
    firstMonthRent: fmt(firstMonthRent),
    totalPrepayment: fmt(totalPrepayment),

    // Emergency
    emergencyName: details.emergencyName || '',
    emergencyRelation: details.emergencyRelation || '',
    emergencyPhone: details.emergencyPhone || '',

    // Signature (will be empty until signed; we re-render after signing)
    signatureDate: booking.contract?.signedAt ? new Date(booking.contract.signedAt).toISOString().slice(0, 10) : '',
    signatureName: booking.contract?.signatureName || ''
  }

  const renderedBody = renderTemplate(tpl.body, data)
  const subject = tpl.subject || 'Tenancy Agreement'

  const css = `
    @page { size: A4; margin: 20mm; }
    body { font-family: -apple-system, "Segoe UI", "PingFang HK", "Microsoft YaHei", "Helvetica Neue", sans-serif; color: #2a2826; line-height: 1.7; font-size: 12pt; }
    h1 { font-size: 22pt; font-weight: 300; text-align: center; margin: 0 0 8pt; }
    .contract-meta { text-align: center; color: #8a8780; font-size: 10pt; letter-spacing: 0.05em; margin: 0 0 24pt; }
    h2 { font-size: 13pt; font-weight: 500; margin: 18pt 0 6pt; color: #2a2826; }
    p { margin: 6pt 0; text-align: justify; }
    strong { font-weight: 500; }
    .contract-closing { margin-top: 24pt; font-style: italic; color: #4a4744; }
    .signature-block { margin-top: 36pt; padding-top: 18pt; border-top: 1px solid #c4c1ba; }
    .signature-row { display: flex; gap: 24pt; align-items: flex-end; }
    .signature-col { flex: 1; }
    .signature-label { color: #8a8780; font-size: 10pt; margin: 0 0 4pt; }
    .signature-line { border-bottom: 1px solid #2a2826; min-height: 60pt; display: flex; align-items: flex-end; padding-bottom: 4pt; }
    .signature-image { max-height: 60pt; max-width: 220pt; }
    .signature-name { font-style: italic; }
    .contract-hash { margin-top: 30pt; padding: 8pt 12pt; background: #fafaf7; font-family: "SF Mono", Menlo, monospace; font-size: 8pt; color: #8a8780; word-break: break-all; }
    a { color: #4a5a8a; }
  `

  // Optional signature block
  let signatureHtml = ''
  if (booking.contract?.signatureImage || booking.contract?.signatureName) {
    const sigImage = booking.contract.signatureImage
      ? `<img class="signature-image" src="${booking.contract.signatureImage}" alt="signature">`
      : ''
    const sigName = booking.contract.signatureName
      ? `<div class="signature-name">${booking.contract.signatureName}</div>`
      : ''
    // Landlord side: "Electronically executed" statement under HK ETO Cap. 553
    // (no manual signature needed for the landlord on auto-generated e-contracts)
    const landlordExecutedBox = buildLandlordExecutedBox(lang, data, booking)
    signatureHtml = `
      <div class="signature-block">
        <div class="signature-row">
          <div class="signature-col">
            <p class="signature-label">${lang === 'en' ? 'Tenant signature' : (lang === 'zh-HK' ? '承租人簽名' : '承租人签名')}</p>
            <div class="signature-line">${sigImage || sigName}</div>
            <p style="margin: 4pt 0; font-size: 10pt;">${data.name}${data.nameChinese ? ' / ' + data.nameChinese : ''}</p>
            <p style="margin: 0; font-size: 10pt; color: #8a8780;">${lang === 'en' ? 'Signed on' : (lang === 'zh-HK' ? '簽署日期' : '签署日期')} ${data.signatureDate || ''}</p>
          </div>
          <div class="signature-col">
            ${landlordExecutedBox}
          </div>
        </div>
      </div>
    `
  } else {
    const landlordExecutedBox = buildLandlordExecutedBox(lang, data, booking)
    signatureHtml = `
      <div class="signature-block">
        <div class="signature-row">
          <div class="signature-col">
            <p class="signature-label">${lang === 'en' ? 'Tenant signature' : (lang === 'zh-HK' ? '承租人簽名' : '承租人签名')}</p>
            <div class="signature-line" style="color: #c4c1ba; font-style: italic; font-size: 10pt; padding-bottom: 8pt;">${lang === 'en' ? '(awaiting signature)' : (lang === 'zh-HK' ? '（待簽署）' : '（待签署）')}</div>
            <p style="margin: 4pt 0; font-size: 10pt;">${data.name}</p>
          </div>
          <div class="signature-col">
            ${landlordExecutedBox}
          </div>
        </div>
      </div>
    `
  }

  // Audit footer (only included if signed)
  let auditHtml = ''
  if (booking.contract?.contractHash) {
    auditHtml = `
      <div class="contract-hash">
        Document hash (SHA-256): ${booking.contract.contractHash}<br>
        Signed at: ${booking.contract.signedAt || ''}<br>
        Template version: ${booking.contract.templateVersion || content?.contracts?.version || ''}
      </div>
    `
  }

  const fullHtml = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${subject} · ${booking.id}</title>
  <style>${css}</style>
</head>
<body>
  ${renderedBody}
  ${signatureHtml}
  ${auditHtml}
</body>
</html>`

  // bodyHtml = just the content (no <!doctype>), safe for inline rendering on a Vue page
  const bodyHtml = `${renderedBody}${signatureHtml}${auditHtml}`

  return {
    html: fullHtml,
    bodyHtml,
    subject,
    contractNumber,
    contractDate,
    moveOutDate,
    monthlyRent,
    depositMonths,
    depositAmount,
    firstMonthRent,
    totalPrepayment,
    templateVersion: content?.contracts?.version || 'v1'
  }
}

// SHA-256 hash of a string (used to lock contract content at sign time)
export async function sha256(s) {
  const buf = new TextEncoder().encode(s)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
