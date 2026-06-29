// GET /api/contracts/[id]/data?token=xxx&lang=xx
// Returns the contract preview data (HTML + amounts) as JSON, for the contract signing page
import { json } from '../../_utils.js'
import { buildContractHtml } from '../../_contract.js'

export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token') || ''
  const lang = url.searchParams.get('lang') || 'en'

  if (!token) return json({ error: 'token_required' }, { status: 400 })

  const booking = await env.DEMAIN_DATA.get(`booking:${params.id}`, 'json')
  if (!booking) return json({ error: 'not_found' }, { status: 404 })
  if (!booking.detailsToken || booking.detailsToken !== token) {
    return json({ error: 'invalid_token' }, { status: 403 })
  }
  if (booking.detailsTokenExpiresAt && new Date(booking.detailsTokenExpiresAt).getTime() < Date.now()) {
    return json({ error: 'token_expired' }, { status: 403 })
  }
  if (!booking.details) {
    return json({ error: 'details_required' }, { status: 400 })
  }

  // If the contract has been withdrawn by admin (and not yet re-sent), tell the client to wait.
  // Link stays valid; client UI shows a friendly "contract recalled" notice.
  if (booking.contractWithdrawn) {
    return json({
      withdrawn: true,
      id: booking.id,
      name: booking.details?.name || booking.name,
      message: 'The contract has been recalled by Demain Life staff. A new version will be sent to you shortly.'
    })
  }

  const rendered = await buildContractHtml(env, booking, lang)

  // If admin has saved a draft IN THE SAME LANGUAGE the user is viewing, prefer that body.
  // Otherwise fall back to the auto-rendered template in the requested language — this keeps
  // multilingual viewing working even after the admin has edited only one language.
  const draft = booking.contractDraft
  const useDraft = draft && draft.html && draft.html.trim().length > 0
    && (!draft.lang || draft.lang === lang)

  return json({
    id: booking.id,
    name: booking.details.name || booking.name,
    nameChinese: booking.details.nameChinese || '',
    html: rendered.html,                                            // legacy full-doc HTML (template)
    bodyHtml: useDraft ? draft.html : rendered.bodyHtml,            // what the client renders
    isFromAdminDraft: useDraft,
    contractNumber: (useDraft && draft.contractNumber) || rendered.contractNumber,
    contractDate: rendered.contractDate,
    monthlyRent: (useDraft && typeof draft.monthlyRent === 'number') ? draft.monthlyRent : rendered.monthlyRent,
    depositMonths: (useDraft && typeof draft.depositMonths === 'number') ? draft.depositMonths : rendered.depositMonths,
    depositAmount: (useDraft && typeof draft.depositAmount === 'number') ? draft.depositAmount : rendered.depositAmount,
    firstMonthRent: (useDraft && typeof draft.firstMonthRent === 'number') ? draft.firstMonthRent : rendered.firstMonthRent,
    totalPrepayment: (useDraft && typeof draft.totalPrepayment === 'number') ? draft.totalPrepayment : rendered.totalPrepayment,
    moveOutDate: (useDraft && draft.moveOutDate) || rendered.moveOutDate,
    alreadySigned: !!booking.contract?.contractHash,
    signedAt: booking.contract?.signedAt || null,
    contractHash: booking.contract?.contractHash || null
  })
}
