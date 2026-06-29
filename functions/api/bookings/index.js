// POST /api/bookings  —  public form submission
// Writes to KV (source of truth) + Google Sheet (staff workspace) + creates Drive folder
import { json, readJson } from '../_utils.js'
import { driveCreateFolder } from '../_google.js'
import { appendBookingRow } from '../_sheets_monthly.js'
import { sendEmail, renderGuestConfirmation, renderStaffNotification } from '../_email.js'

// Header is defined in _sheets_monthly.js (BOOKING_HEADER)

function generateBookingId() {
  const d = new Date()
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `DL-${ymd}-${rnd}`
}

function generateToken() {
  // 32 character URL-safe token
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function sanitize(str, max = 500) {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, max)
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '')
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request)
  if (!body) return json({ error: 'invalid_body' }, { status: 400 })

  // Validate required fields
  const name = sanitize(body.name, 120)
  const email = sanitize(body.email, 200)
  const phone = sanitize(body.phone, 60)
  const roomType = sanitize(body.roomType, 60)
  const moveInDate = sanitize(body.moveInDate, 20)
  const duration = sanitize(body.duration, 40)
  const occupancy = sanitize(body.occupancy, 20)
  const nationality = sanitize(body.nationality, 60)
  const message = sanitize(body.message, 2000)
  const sourceLang = sanitize(body.lang, 10) || 'en'

  // New: preferred contact method
  const contactMethod = sanitize(body.contactMethod, 20).toLowerCase()  // 'email' | 'phone' | 'whatsapp' | 'wechat'
  const whatsappNumber = sanitize(body.whatsappNumber, 60)
  const wechatId = sanitize(body.wechatId, 80)

  if (!name) return json({ error: 'name_required' }, { status: 400 })
  if (!isValidEmail(email)) return json({ error: 'email_invalid' }, { status: 400 })
  if (!phone) return json({ error: 'phone_required' }, { status: 400 })
  if (!roomType) return json({ error: 'room_required' }, { status: 400 })
  if (!moveInDate) return json({ error: 'movein_required' }, { status: 400 })
  if (!['email','phone','whatsapp','wechat'].includes(contactMethod)) {
    return json({ error: 'contact_method_invalid' }, { status: 400 })
  }
  if (contactMethod === 'whatsapp' && !whatsappNumber) {
    return json({ error: 'whatsapp_number_required' }, { status: 400 })
  }
  if (contactMethod === 'wechat' && !wechatId) {
    return json({ error: 'wechat_id_required' }, { status: 400 })
  }

  const bookingId = generateBookingId()
  const createdAt = new Date().toISOString()
  const detailsToken = generateToken()
  // Token valid 30 days from creation
  const detailsTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const booking = {
    id: bookingId,
    createdAt,
    // Status machine (gated workflow):
    //  new -> reviewing -> profile-sent -> profile-submitted ->
    //  contract-sent -> signed -> invoice-sent -> payment-uploaded ->
    //  paid -> checked-in   (or 'cancelled' at any step)
    status: 'new',
    // Unread flags for admin dashboard badge
    unreadByAdmin: true,
    name, email, phone, nationality,
    contactMethod, whatsappNumber, wechatId,
    roomType, moveInDate, duration, occupancy,
    message, sourceLang,
    driveFolder: null,
    driveFolderId: null,
    documents: {},
    details: null,
    detailsToken,
    detailsTokenExpiresAt,
    detailsSubmittedAt: null,
    contract: null,
    payments: [],
    history: [
      { at: createdAt, action: 'submitted', by: 'guest' }
    ]
  }

  // 1) Save to KV (source of truth) — this is fastest and safest
  try {
    await env.DEMAIN_DATA.put(`booking:${bookingId}`, JSON.stringify(booking))
    const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
    const index = Array.isArray(indexRaw) ? indexRaw : []
    index.unshift({
      id: bookingId, createdAt, status: 'new',
      name, email, phone, roomType, moveInDate,
      contactMethod, unreadByAdmin: true
    })
    if (index.length > 500) index.length = 500
    await env.DEMAIN_DATA.put('booking-index', JSON.stringify(index))
  } catch (err) {
    return json({ error: 'storage_failed', message: err.message }, { status: 500 })
  }

  // 2) Best-effort: Google integration
  const googleResult = { sheetAppended: false, driveCreated: false, monthTab: null, errors: [] }

  // Create Drive folder — prefer Stay Materials subfolder if configured
  if (env.GOOGLE_SERVICE_ACCOUNT_JSON && env.GOOGLE_DRIVE_FOLDER_ID) {
    try {
      const folderName = `${bookingId} — ${name}`
      const parentFolderId = (await env.DEMAIN_DATA.get('folder-id:stay-materials')) || env.GOOGLE_DRIVE_FOLDER_ID
      const folderId = await driveCreateFolder(env, parentFolderId, folderName)
      booking.driveFolderId = folderId
      booking.driveFolder = `https://drive.google.com/drive/folders/${folderId}`
      googleResult.driveCreated = true
      await env.DEMAIN_DATA.put(`booking:${bookingId}`, JSON.stringify(booking))
    } catch (err) {
      googleResult.errors.push('drive: ' + err.message)
    }
  }

  // Append to month-tabbed Sheet
  if (env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const result = await appendBookingRow(env, booking, [
        bookingId, createdAt, 'new',
        name, email, phone, nationality,
        roomType, moveInDate, duration, occupancy,
        message, sourceLang,
        booking.driveFolder || '', booking.driveFolderId || '',
        contactMethod, whatsappNumber, wechatId
      ])
      googleResult.sheetAppended = true
      googleResult.monthTab = result.tab
      // Store the tab name for future fast lookups
      booking.sheetMonthTab = result.tab
      await env.DEMAIN_DATA.put(`booking:${bookingId}`, JSON.stringify(booking))
    } catch (err) {
      googleResult.errors.push('sheet: ' + err.message)
    }
  }

  // 3) Send notification emails (best-effort)
  const emailResult = { guestSent: false, staffSent: false, errors: [] }

  if (env.RESEND_API_KEY) {
    // Email to the guest
    try {
      const { subject, html } = renderGuestConfirmation(booking, env)
      await sendEmail(env, {
        to: booking.email,
        subject,
        html,
        replyTo: env.BOOKING_NOTIFY_EMAIL
      })
      emailResult.guestSent = true
    } catch (err) {
      emailResult.errors.push('guest_email: ' + err.message)
    }

    // Email to the staff (notification)
    if (env.BOOKING_NOTIFY_EMAIL) {
      try {
        const { subject, html } = renderStaffNotification(booking, env)
        await sendEmail(env, {
          to: env.BOOKING_NOTIFY_EMAIL,
          subject,
          html,
          replyTo: booking.email
        })
        emailResult.staffSent = true
      } catch (err) {
        emailResult.errors.push('staff_email: ' + err.message)
      }
    }
  } else {
    emailResult.errors.push('RESEND_API_KEY not configured')
  }

  // Record email status in booking history
  if (emailResult.guestSent || emailResult.staffSent) {
    booking.history.push({
      at: new Date().toISOString(),
      action: 'email_sent',
      guest: emailResult.guestSent,
      staff: emailResult.staffSent,
      by: 'system'
    })
    await env.DEMAIN_DATA.put(`booking:${bookingId}`, JSON.stringify(booking))
  }

  return json({
    success: true,
    bookingId,
    google: googleResult,
    email: emailResult
  })
}
