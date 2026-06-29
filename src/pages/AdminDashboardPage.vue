<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { cloneDefaultSiteData } from '../../shared/defaultContent.js'

const router = useRouter()
const tabs = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'payments', label: 'Payments' },
  { key: 'roomgrid', label: 'Room Grid' },
  { key: 'rooms', label: 'Room Types' },
  // Products tab is managed by the shop team — hidden from Stay admin.
  // Use /admin/shop (admin_shop account) to manage products.
  // { key: 'products', label: 'Products' },
  { key: 'legal', label: 'Legal' },
  { key: 'site', label: 'Site' }
]
const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh-HK', name: '繁體中文' },
  { code: 'zh-CN', name: '简体中文' }
]

const state = reactive({
  checking: true,
  loading: false,
  saving: false,
  translating: false,
  activeTab: 'bookings',
  data: cloneDefaultSiteData(),
  selectedRoomIndex: 0,
  selectedProductIndex: 0,
  error: '',
  success: '',
  // Bookings state
  bookings: [],
  bookingsLoaded: false,
  bookingsLoading: false,
  selectedBooking: null,
  selectedBookingDetail: null,
  bookingDetailLoading: false,
  bookingStatusUpdating: false,
  bookingNote: ''
})

const statusOptions = [
  { key: 'new', label: 'New' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'profile-sent', label: 'Profile sent' },
  { key: 'profile-submitted', label: 'Profile submitted' },
  { key: 'contract-sent', label: 'Contract sent' },
  { key: 'signed', label: 'Signed' },
  { key: 'invoice-sent', label: 'Invoice sent' },
  { key: 'awaiting-payment', label: 'Awaiting payment' },
  { key: 'payment-uploaded', label: 'Payment uploaded' },
  { key: 'paid', label: 'Paid' },
  { key: 'room-assigned', label: 'Room assigned' },
  { key: 'checked-in', label: 'Checked in' },
  { key: 'cancelled', label: 'Cancelled' }
]

// ============== Payments state ==============
const paymentsState = reactive({
  loading: false,
  loaded: false,
  summary: { totalOutstanding: 0, totalPaid: 0, totalPaidThisMonth: 0, paymentCount: 0 },
  payments: [],
  filter: 'all'
})

async function loadPayments() {
  paymentsState.loading = true
  try {
    const resp = await fetch('/api/admin/payments', { credentials: 'include' })
    if (resp.ok) {
      const data = await resp.json()
      paymentsState.summary = data.summary
      paymentsState.payments = data.payments
      paymentsState.loaded = true
    }
  } catch (err) {
    state.error = 'Failed to load payments: ' + err.message
  } finally {
    paymentsState.loading = false
  }
}

const unreadBookingsCount = computed(() => (state.bookings || []).filter((b) => b.unreadByAdmin).length)
const pendingApprovalsCount = computed(() => (paymentsState.payments || []).filter((p) => p.status === 'screenshot-uploaded').length)

const filteredPayments = computed(() => {
  if (paymentsState.filter === 'all') return paymentsState.payments
  return paymentsState.payments.filter((p) => p.status === paymentsState.filter)
})

function exportPaymentsCSV() {
  const rows = [['Booking ID', 'Guest', 'Email', 'Request ID', 'Created', 'Amount HKD', 'Status', 'Approved At', 'Description']]
  for (const p of paymentsState.payments) {
    rows.push([p.bookingId, p.bookingName, p.bookingEmail || '', p.requestId, p.createdAt, p.amount, p.status, p.approvedAt || '', (p.description || '').replace(/,/g, ';')])
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `demain-payments-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function approvePaymentFromTab(p, action) {
  if (action === 'approve' && !confirm(`Approve HK$${p.amount.toLocaleString()} for ${p.bookingName}?`)) return
  let note = ''
  if (action === 'reject') { note = prompt('Reason for rejection?') || ''; if (!note) return }
  try {
    const resp = await fetch(`/api/admin/bookings/${p.bookingId}/approve-payment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ requestId: p.requestId, action, note })
    })
    if (resp.ok) {
      await loadPayments(); await loadBookings()
      state.success = `Payment ${action}d`
      setTimeout(() => state.success = '', 3000)
    }
  } catch (err) { state.error = err.message }
}

// ============== Payment request creator ==============
const paymentRequestForm = reactive({ amount: '', description: '', dueDate: '', notes: '', sending: false })

async function createPaymentRequest() {
  if (!state.selectedBookingDetail) return
  const amount = parseFloat(paymentRequestForm.amount)
  if (!amount || amount <= 0) { state.error = 'Please enter a valid amount.'; return }
  paymentRequestForm.sending = true
  try {
    const resp = await fetch(`/api/admin/bookings/${state.selectedBookingDetail.id}/payment-request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        amount, description: paymentRequestForm.description,
        dueDate: paymentRequestForm.dueDate, notes: paymentRequestForm.notes
      })
    })
    const data = await resp.json()
    if (resp.ok && data.success) {
      state.success = `Payment request sent: ${data.requestId}`
      setTimeout(() => state.success = '', 4000)
      paymentRequestForm.amount = ''
      paymentRequestForm.description = ''
      paymentRequestForm.dueDate = ''
      paymentRequestForm.notes = ''
      await openBooking(state.selectedBookingDetail.id)
    } else state.error = data.message || data.error || 'Failed'
  } catch (err) { state.error = err.message } finally { paymentRequestForm.sending = false }
}

async function approvePaymentInline(requestId, action) {
  if (!state.selectedBookingDetail) return
  if (action === 'approve' && !confirm('Approve this payment?')) return
  let note = ''
  if (action === 'reject') { note = prompt('Reason for rejection?') || ''; if (!note) return }
  try {
    const resp = await fetch(`/api/admin/bookings/${state.selectedBookingDetail.id}/approve-payment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ requestId, action, note })
    })
    if (resp.ok) {
      await openBooking(state.selectedBookingDetail.id)
      state.success = `Payment ${action}d`
      setTimeout(() => state.success = '', 3000)
    }
  } catch (err) { state.error = err.message }
}

// ============== Room Grid state ==============
const roomGridState = reactive({
  loading: false,
  loaded: false,
  blocks: [],
  roomNumbers: [],
  rooms: [],
  summary: { total: 0, occupied: 0, vacant: 0 },
  selectedRoom: null,
  viewMode: 'grid', // 'grid' or 'timeline'
  filterBlock: 'all',
  showAssignModal: false,
  assignTargetBookingId: '',
  assignSelectedBlock: null,
  assignSelectedRoom: null,
  assignRoomConfig: 'one-bed-studio',
  assignMoveOutDate: '',
  assigning: false,
  assignError: ''
})

async function loadRoomGrid() {
  roomGridState.loading = true
  try {
    const resp = await fetch('/api/admin/rooms', { credentials: 'include' })
    if (resp.ok) {
      const data = await resp.json()
      roomGridState.blocks = data.blocks
      roomGridState.roomNumbers = data.roomNumbers
      roomGridState.rooms = data.rooms
      roomGridState.summary = data.summary
      roomGridState.loaded = true
    }
  } catch (err) { state.error = 'Failed to load rooms: ' + err.message }
  finally { roomGridState.loading = false }
}

function roomStateOf(block, roomNum) {
  const id = `block-${block}-room-${roomNum}`
  return roomGridState.rooms.find((r) => r.id === id) || null
}

function roomCellClass(block, roomNum) {
  const room = roomStateOf(block, roomNum)
  if (!room || !room.currentTenancy) return 'cell-vacant'
  const s = room.currentTenancy.status
  if (s === 'checked-in') return 'cell-checked-in'
  if (s === 'assigned') return 'cell-assigned'
  return 'cell-occupied'
}

function openRoomDetail(block, roomNum) {
  roomGridState.selectedRoom = { block, room: roomNum, data: roomStateOf(block, roomNum) }
}

function closeRoomDetail() { roomGridState.selectedRoom = null }

function openAssignModal(bookingId) {
  roomGridState.assignTargetBookingId = bookingId
  roomGridState.assignSelectedBlock = null
  roomGridState.assignSelectedRoom = null
  roomGridState.assignError = ''

  // Pre-fill room config from the booking's roomType and a sensible default move-out date.
  const bd = state.selectedBookingDetail
  if (bd && bd.id === bookingId) {
    const rt = (bd.roomType || '').toLowerCase()
    roomGridState.assignRoomConfig = rt.includes('twin') ? 'twin-studio' : 'one-bed-studio'
    // Default move-out = move-in + duration months (parse '3 months' / '6个月' style strings)
    if (bd.moveInDate) {
      const monthMatch = String(bd.duration || '').match(/(\d+)/)
      const months = monthMatch ? parseInt(monthMatch[1], 10) : 3
      const d = new Date(bd.moveInDate)
      if (!Number.isNaN(d.getTime())) {
        d.setUTCMonth(d.getUTCMonth() + months)
        roomGridState.assignMoveOutDate = d.toISOString().slice(0, 10)
      } else {
        roomGridState.assignMoveOutDate = ''
      }
    } else {
      roomGridState.assignMoveOutDate = ''
    }
  } else {
    roomGridState.assignRoomConfig = 'one-bed-studio'
    roomGridState.assignMoveOutDate = ''
  }

  roomGridState.showAssignModal = true
  if (!roomGridState.loaded) loadRoomGrid()
}

function closeAssignModal() { roomGridState.showAssignModal = false }

function selectAssignCell(block, roomNum) {
  const room = roomStateOf(block, roomNum)
  if (room && room.currentTenancy && room.currentTenancy.bookingId !== roomGridState.assignTargetBookingId) {
    state.error = `Room ${block}-${roomNum} is occupied by ${room.currentTenancy.guestName}.`
    setTimeout(() => state.error = '', 3000)
    return
  }
  roomGridState.assignSelectedBlock = block
  roomGridState.assignSelectedRoom = roomNum
}

async function confirmAssignRoom() {
  roomGridState.assignError = ''
  if (!roomGridState.assignSelectedBlock || !roomGridState.assignSelectedRoom) {
    roomGridState.assignError = 'Please select a room cell first.'
    return
  }
  roomGridState.assigning = true
  try {
    const resp = await fetch(`/api/admin/bookings/${roomGridState.assignTargetBookingId}/assign-room`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        block: roomGridState.assignSelectedBlock,
        room: roomGridState.assignSelectedRoom,
        roomConfig: roomGridState.assignRoomConfig,
        moveOutDate: roomGridState.assignMoveOutDate || null
      })
    })
    const data = await resp.json()
    if (resp.ok && data.success) {
      state.success = `Room ${roomGridState.assignSelectedBlock}-${roomGridState.assignSelectedRoom} assigned.`
      setTimeout(() => state.success = '', 3000)
      closeAssignModal()
      await loadRoomGrid()
      if (state.selectedBookingDetail?.id === roomGridState.assignTargetBookingId) {
        await openBooking(roomGridState.assignTargetBookingId)
      }
    } else {
      roomGridState.assignError = data.message || data.error || 'Assignment failed'
    }
  } catch (err) { roomGridState.assignError = err.message }
  finally { roomGridState.assigning = false }
}

async function releaseRoom(bookingId) {
  if (!confirm('Release this room? The booking will revert to status "paid" so you can reassign.')) return
  try {
    const resp = await fetch(`/api/admin/bookings/${bookingId}/release-room`, {
      method: 'POST', credentials: 'include'
    })
    if (resp.ok) {
      state.success = 'Room released.'
      setTimeout(() => state.success = '', 3000)
      await loadRoomGrid()
      if (state.selectedBookingDetail?.id === bookingId) await openBooking(bookingId)
    }
  } catch (err) { state.error = err.message }
}

async function confirmCheckIn(bookingId) {
  if (!confirm('Mark this guest as checked in?')) return
  try {
    const resp = await fetch(`/api/admin/bookings/${bookingId}/checkin`, {
      method: 'POST', credentials: 'include'
    })
    const data = await resp.json()
    if (resp.ok && data.success) {
      state.success = 'Guest checked in.'
      setTimeout(() => state.success = '', 3000)
      await openBooking(bookingId)
      if (roomGridState.loaded) loadRoomGrid()
    } else {
      state.error = data.message || data.error || 'Check-in failed'
    }
  } catch (err) { state.error = err.message }
}

async function seedRoomsSheet() {
  if (!confirm('Initialize the Rooms tab in Google Sheet with all 504 rooms?')) return
  try {
    const resp = await fetch('/api/admin/rooms/seed', { method: 'POST', credentials: 'include' })
    const data = await resp.json()
    if (data.success) {
      state.success = `Seeded ${data.count} rooms to Google Sheet.`
      setTimeout(() => state.success = '', 4000)
    } else {
      state.error = data.error || data.skipped || 'Seed failed'
    }
  } catch (err) { state.error = err.message }
}

// ============== Year Archive state ==============
const archiveState = reactive({ checking: false, info: null, archiving: false })

async function checkArchiveStatus() {
  archiveState.checking = true
  try {
    const resp = await fetch('/api/admin/archive-year', { credentials: 'include' })
    if (resp.ok) archiveState.info = await resp.json()
  } catch (err) {}
  finally { archiveState.checking = false }
}

async function runArchiveYear() {
  const year = archiveState.info?.currentYear || new Date().getFullYear()
  if (!confirm(`Archive year ${year}? This will:\n• Rename current sheet to "(archived)"\n• Create a new sheet for ${year + 1}\n• Copy active bookings into the new sheet\n• Switch the active sheet pointer.\n\nProceed?`)) return
  archiveState.archiving = true
  try {
    const resp = await fetch('/api/admin/archive-year', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year })
    })
    const data = await resp.json()
    if (data.success) {
      state.success = `Archived ${year}. New sheet: ${data.newSheetTitle}. ${data.copiedActiveBookings} active bookings copied.`
      setTimeout(() => state.success = '', 8000)
      archiveState.info = null
      await checkArchiveStatus()
    } else {
      state.error = data.error || 'Archive failed'
    }
  } catch (err) { state.error = err.message }
  finally { archiveState.archiving = false }
}

// ============== Legal tab state ==============
const legalState = reactive({
  loading: false, loaded: false, templates: null, saving: false,
  selectedTab: 'contract', selectedLang: 'en'
})

async function loadLegal() {
  legalState.loading = true
  try {
    const resp = await fetch('/api/admin/legal', { credentials: 'include' })
    if (resp.ok) {
      const data = await resp.json()
      legalState.templates = data.templates
      legalState.loaded = true
    }
  } catch (err) { state.error = 'Failed to load legal: ' + err.message }
  finally { legalState.loading = false }
}

async function saveLegal() {
  if (!legalState.templates) return
  legalState.saving = true
  try {
    const resp = await fetch('/api/admin/legal', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(legalState.templates)
    })
    if (resp.ok) {
      const data = await resp.json()
      legalState.templates = data.templates
      state.success = 'Legal templates saved'
      setTimeout(() => state.success = '', 3000)
    }
  } catch (err) { state.error = err.message } finally { legalState.saving = false }
}

function handleLegalUpload(type, lang, file) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    let content = e.target.result
    if (typeof content === 'string') {
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch) content = bodyMatch[1].trim()
      legalState.templates[type][lang] = content
      state.success = `Loaded ${file.name}`
      setTimeout(() => state.success = '', 3000)
    }
  }
  reader.readAsText(file)
}

const placeholders = [
  'bookingId','contractDate','name','nameChinese','idType','idNumber','nationality','dateOfBirth',
  'currentAddress','phone','email','occupation',
  'emergencyName','emergencyPhone','emergencyRelation','emergencyEmail',
  'roomType','occupancy','moveInDate','moveOutDate','duration',
  'roomPrice','depositAmount',
  'landlordName','landlordAddress','landlordRep',
  'signatureDate','signatureName','signaturePlaceholder'
]

function insertPlaceholder(p) {
  const lang = legalState.selectedLang
  const type = legalState.selectedTab
  if (legalState.templates && legalState.templates[type] && lang in legalState.templates[type]) {
    legalState.templates[type][lang] = (legalState.templates[type][lang] || '') + ` {{${p}}}`
  }
}

async function generateContractWithGrok() {
  if (!confirm('Use Grok to regenerate tenancy contract in 3 languages? Current draft will be replaced.')) return
  state.translating = true
  try {
    const seed = `Please generate a professional residential tenancy agreement template for Demain Life co-living in clean HTML (no <html>/<body> tags). Use these placeholders verbatim: {{bookingId}}, {{contractDate}}, {{name}}, {{nameChinese}}, {{idType}}, {{idNumber}}, {{nationality}}, {{dateOfBirth}}, {{currentAddress}}, {{phone}}, {{email}}, {{roomType}}, {{occupancy}}, {{moveInDate}}, {{moveOutDate}}, {{duration}}, {{roomPrice}}, {{depositAmount}}, {{landlordName}}, {{landlordAddress}}, {{landlordRep}}, {{emergencyName}}, {{emergencyRelation}}, {{emergencyPhone}}, {{emergencyEmail}}, {{signatureDate}}, {{signaturePlaceholder}}. Sections: parties, premises, term, rent, security deposit (2 months), payment, use, house rules, maintenance, termination, personal data (PDPO Hong Kong), governing law (Hong Kong), emergency contact, signatures.`
    const r = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text: seed, sourceLang: 'en' })
    })
    const d = await r.json()
    if (r.ok && d.translations) {
      legalState.templates.contract = {
        en: d.translations.en || legalState.templates.contract.en,
        'zh-HK': d.translations['zh-HK'] || legalState.templates.contract['zh-HK'],
        'zh-CN': d.translations['zh-CN'] || legalState.templates.contract['zh-CN'],
        version: legalState.templates.contract.version || 1
      }
      state.success = 'Generated by Grok — review and save.'
      setTimeout(() => state.success = '', 4000)
    } else state.error = d.error || 'Grok failed'
  } catch (err) { state.error = err.message } finally { state.translating = false }
}

// ============== Cleanup test data ==============
async function cleanupTestData() {
  const a = prompt('Type DELETE to wipe ALL bookings (KV only — Sheet/Drive unaffected):')
  if (a !== 'DELETE') return
  try {
    const resp = await fetch('/api/admin/bookings/cleanup-test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ confirm: 'DELETE_ALL_BOOKINGS' })
    })
    const data = await resp.json()
    if (resp.ok) {
      state.success = `Deleted ${data.deletedCount} bookings`
      setTimeout(() => state.success = '', 5000)
      await loadBookings()
      state.selectedBooking = null
      state.selectedBookingDetail = null
    } else state.error = data.error
  } catch (err) { state.error = err.message }
}

async function loadBookings() {
  state.bookingsLoading = true
  try {
    const resp = await fetch('/api/admin/bookings', { credentials: 'include' })
    if (resp.ok) {
      const data = await resp.json()
      state.bookings = data.bookings || []
      state.bookingsLoaded = true
    }
  } catch (err) {
    state.error = 'Failed to load bookings: ' + err.message
  } finally {
    state.bookingsLoading = false
  }
}

async function openBooking(id) {
  state.bookingDetailLoading = true
  state.selectedBooking = id
  state.selectedBookingDetail = null
  state.bookingNote = ''
  try {
    const resp = await fetch(`/api/admin/bookings/${id}`, { credentials: 'include' })
    if (resp.ok) {
      const data = await resp.json()
      state.selectedBookingDetail = data.booking
    }
  } catch (err) {
    state.error = 'Failed to load booking: ' + err.message
  } finally {
    state.bookingDetailLoading = false
  }
  // Load contract draft in parallel (non-blocking)
  loadContractDraft(id)
}

// ============== Contract draft editor ==============
const contractEditor = reactive({
  loading: false, saving: false, error: '',
  initialHtml: '',     // used to seed v-html on first render
  frozen: false,
  dirty: false,
  savedAt: '',
  lang: 'en'
})
const contractEditorEl = ref(null)

// ============== Document preview ==============
const docPreview = reactive({ open: false, url: '', alt: '' })
const docCacheBuster = ref(Date.now())
function openDocPreview(side) {
  const bid = state.selectedBookingDetail?.id
  if (!bid) return
  docPreview.url = `/api/admin/bookings/${bid}/file?side=${side}&t=${docCacheBuster.value}`
  docPreview.alt = `ID ${side}`
  docPreview.open = true
}

async function loadContractDraft(bookingId) {
  contractEditor.loading = true
  contractEditor.error = ''
  contractEditor.dirty = false
  try {
    const resp = await fetch(`/api/admin/bookings/${bookingId}/contract-draft`, { credentials: 'include' })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'load_failed')
    contractEditor.initialHtml = data.draft?.html || ''
    contractEditor.frozen = !!data.draft?.frozen
    contractEditor.savedAt = data.draft?.updatedAt || ''
    contractEditor.lang = data.draft?.lang || 'en'
  } catch (err) {
    contractEditor.error = 'Could not load contract draft: ' + err.message
  } finally {
    contractEditor.loading = false
  }
}

function contractEditorCmd(cmd, arg) {
  if (contractEditor.frozen) return
  document.execCommand(cmd, false, arg || null)
  contractEditor.dirty = true
  if (contractEditorEl.value) contractEditorEl.value.focus()
}

function onContractPaste(e) {
  if (contractEditor.frozen) return
  // Prefer HTML (preserves bold/lists/tables from Word); fall back to plain text.
  const html = e.clipboardData?.getData('text/html')
  const text = e.clipboardData?.getData('text/plain')
  if (html) {
    e.preventDefault()
    // Light scrub on the client side too (server scrubs again)
    const clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    document.execCommand('insertHTML', false, clean)
    contractEditor.dirty = true
  } else if (text) {
    e.preventDefault()
    document.execCommand('insertText', false, text)
    contractEditor.dirty = true
  }
}

async function contractEditorSave() {
  if (!state.selectedBookingDetail || contractEditor.frozen) return
  const html = contractEditorEl.value ? contractEditorEl.value.innerHTML : ''
  contractEditor.saving = true
  try {
    const resp = await fetch(`/api/admin/bookings/${state.selectedBookingDetail.id}/contract-draft`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html })
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'save_failed')
    contractEditor.savedAt = data.draft?.updatedAt || new Date().toISOString()
    contractEditor.dirty = false
  } catch (err) {
    contractEditor.error = 'Save failed: ' + err.message
  } finally {
    contractEditor.saving = false
  }
}

async function contractEditorWithdraw() {
  if (!state.selectedBookingDetail || !contractEditor.frozen) return
  const reason = prompt('Why are you withdrawing this contract? (Optional — shown in history)')
  if (reason === null) return // user cancelled
  contractEditor.saving = true
  try {
    const resp = await fetch(`/api/admin/bookings/${state.selectedBookingDetail.id}/contract-draft`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'withdraw', reason })
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'withdraw_failed')
    // Refresh booking + draft state
    await openBooking(state.selectedBookingDetail.id)
  } catch (err) {
    contractEditor.error = 'Withdraw failed: ' + err.message
  } finally {
    contractEditor.saving = false
  }
}

async function contractEditorRegenerate() {
  if (!state.selectedBookingDetail || contractEditor.frozen) return
  if (!confirm('Reset the contract to the original template? Your edits will be lost.')) return
  contractEditor.saving = true
  try {
    const resp = await fetch(`/api/admin/bookings/${state.selectedBookingDetail.id}/contract-draft`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'regenerate' })
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'regenerate_failed')
    contractEditor.initialHtml = data.draft?.html || ''
    contractEditor.savedAt = data.draft?.updatedAt || ''
    contractEditor.dirty = false
  } catch (err) {
    contractEditor.error = 'Regenerate failed: ' + err.message
  } finally {
    contractEditor.saving = false
  }
}

async function updateBookingStatus(newStatus) {
  if (!state.selectedBookingDetail) return
  state.bookingStatusUpdating = true
  try {
    const resp = await fetch(`/api/admin/bookings/${state.selectedBookingDetail.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus })
    })
    if (resp.ok) {
      const data = await resp.json()
      state.selectedBookingDetail = data.booking
      // Update in list
      const idx = state.bookings.findIndex((b) => b.id === data.booking.id)
      if (idx !== -1) state.bookings[idx].status = data.booking.status
    }
  } finally {
    state.bookingStatusUpdating = false
  }
}

const showQR = ref(false)
const qrDataUrl = ref('')

function detailsUrl() {
  if (!state.selectedBookingDetail) return ''
  const b = state.selectedBookingDetail
  if (!b.detailsToken) return ''
  const origin = window.location.origin
  const lang = b.sourceLang || 'en'
  return `${origin}/book/details?id=${encodeURIComponent(b.id)}&token=${b.detailsToken}&lang=${lang}`
}

// =========== Preferred contact helpers ===========
function preferredContactValue(b) {
  if (b.contactMethod === 'whatsapp') return b.whatsappNumber || b.phone
  if (b.contactMethod === 'wechat') return b.wechatId
  if (b.contactMethod === 'phone') return b.phone
  return b.email
}

function whatsappUrl(b) {
  const num = (b.whatsappNumber || b.phone || '').replace(/[^\d]/g, '')
  const text = `Hi ${b.name || ''}, this is Demain Life regarding your booking ${b.id}. `
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`
}

async function copyContactInfo() {
  const b = state.selectedBookingDetail
  if (!b) return
  const lines = [
    `Booking: ${b.id}`,
    `Name: ${b.name}`,
    `Preferred: ${b.contactMethod}`,
    `Contact: ${preferredContactValue(b)}`,
    `Email: ${b.email}`,
    `Phone: ${b.phone}`
  ]
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    state.success = 'Contact info copied'
    setTimeout(() => state.success = '', 2500)
  } catch {}
}

function contractLink() {
  const b = state.selectedBookingDetail
  if (!b?.detailsToken) return ''
  const lang = b.sourceLang || 'en'
  return `${window.location.origin}/book/contract?id=${encodeURIComponent(b.id)}&token=${b.detailsToken}&lang=${lang}`
}

async function copyContractLink() {
  const url = contractLink()
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    state.success = 'Contract link copied'
    setTimeout(() => state.success = '', 2500)
  } catch {}
}

// =========== Workflow ===========
const workflowModal = reactive({
  open: false,
  action: '',  // 'send-profile' | 'send-contract'
  subject: '',
  bodyText: '',
  link: '',
  contactMethod: '',
  contactValue: '',
  customMessage: '',
  sendEmail: true,
  loading: false,
  sending: false
})

async function openWorkflowModal(action) {
  if (!state.selectedBookingDetail) return
  workflowModal.open = true
  workflowModal.action = action
  workflowModal.loading = true
  workflowModal.customMessage = ''
  workflowModal.sendEmail = true
  try {
    const resp = await fetch(`/api/admin/bookings/${state.selectedBookingDetail.id}/workflow?preview=${action}`, { credentials: 'include' })
    const data = await resp.json()
    if (resp.ok) {
      workflowModal.subject = data.subject
      workflowModal.bodyText = data.bodyText
      workflowModal.link = data.link
      workflowModal.contactMethod = data.contactMethod
      workflowModal.contactValue = data.contactValue
    } else {
      state.error = data.error || 'Preview failed'
      workflowModal.open = false
    }
  } catch (err) {
    state.error = err.message
    workflowModal.open = false
  } finally {
    workflowModal.loading = false
  }
}

async function runWorkflow(action, sendEmail = true, customMessage = '') {
  if (!state.selectedBookingDetail) return
  if (action === 'send-checkin' && !confirm('Send the final check-in confirmation email to the guest?')) return
  try {
    const resp = await fetch(`/api/admin/bookings/${state.selectedBookingDetail.id}/workflow`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, sendEmail, customMessage })
    })
    const data = await resp.json()
    if (resp.ok && data.success) {
      state.success = `Action complete: ${action}` + (data.email?.sent ? ' (email sent)' : '')
      setTimeout(() => state.success = '', 3500)
      workflowModal.open = false
      await openBooking(state.selectedBookingDetail.id)
      await loadBookings()
    } else {
      state.error = data.message || data.error || 'Action failed'
    }
  } catch (err) {
    state.error = err.message
  }
}

async function sendWorkflowFromModal() {
  workflowModal.sending = true
  await runWorkflow(workflowModal.action, workflowModal.sendEmail, workflowModal.customMessage)
  workflowModal.sending = false
}

async function copyWorkflowLink() {
  if (!workflowModal.link) return
  try {
    await navigator.clipboard.writeText(workflowModal.link)
    state.success = 'Link copied'
    setTimeout(() => state.success = '', 2500)
  } catch {}
}

function openWorkflowWhatsApp() {
  const b = state.selectedBookingDetail
  if (!b || !workflowModal.link) return
  const num = (b.whatsappNumber || b.phone || '').replace(/[^\d]/g, '')
  const text = workflowModal.action === 'send-profile'
    ? `Hi ${b.name}, this is Demain Life. Please complete your profile here: ${workflowModal.link} (ref: ${b.id})`
    : `Hi ${b.name}, please review and sign your tenancy agreement: ${workflowModal.link} (ref: ${b.id})`
  const url = `https://wa.me/${num}?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener')
}

async function cancelBooking() {
  if (!state.selectedBookingDetail) return
  const reason = prompt('Cancellation reason? (optional)') || ''
  if (reason === null) return
  await runWorkflow('cancel', false, reason)
}

async function copyDetailsLink() {
  const url = detailsUrl()
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    state.success = 'Link copied'
    setTimeout(() => state.success = '', 2500)
  } catch (err) {
    state.error = 'Copy failed: ' + err.message
  }
}

async function generateQR() {
  const url = detailsUrl()
  if (!url) return
  // Use a public QR API (no library needed)
  const encoded = encodeURIComponent(url)
  qrDataUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encoded}`
  showQR.value = true
}

async function markPaid() {
  if (!state.selectedBookingDetail) return
  const amt = state.selectedBookingDetail.contract?.totalPrepayment || 0
  const method = window.prompt('Payment method (e.g. bank transfer, cash, FPS)?', 'bank transfer')
  if (!method) return
  if (!confirm(`Mark booking ${state.selectedBookingDetail.id} as paid (HK$ ${amt.toLocaleString()} via ${method})?`)) return
  try {
    const resp = await fetch(`/api/admin/bookings/${state.selectedBookingDetail.id}/mark-paid`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount: amt, method, notes: '' })
    })
    const data = await resp.json()
    if (resp.ok) {
      await openBooking(state.selectedBookingDetail.id)
      state.success = 'Marked as paid'
      setTimeout(() => state.success = '', 2500)
    } else {
      state.error = data.error || 'Failed'
    }
  } catch (err) { state.error = err.message }
}

async function deleteBooking() {
  if (!state.selectedBookingDetail) return
  const id = state.selectedBookingDetail.id
  if (!confirm(`Permanently delete booking ${id}? This cannot be undone.`)) return
  try {
    const resp = await fetch(`/api/admin/bookings/${id}`, {
      method: 'DELETE', credentials: 'include'
    })
    if (resp.ok) {
      state.selectedBooking = null
      state.selectedBookingDetail = null
      await loadBookings()
      state.success = 'Deleted'
      setTimeout(() => state.success = '', 2500)
    }
  } catch (err) { state.error = err.message }
}

async function resendEmail(target) {
  if (!state.selectedBookingDetail) return
  if (!confirm(`Resend ${target} email for ${state.selectedBookingDetail.id}?`)) return
  try {
    const resp = await fetch(`/api/admin/bookings/${state.selectedBookingDetail.id}/resend-email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ target })
    })
    const data = await resp.json()
    if (resp.ok) {
      // Reload the booking
      await openBooking(state.selectedBookingDetail.id)
      state.success = `Email re-sent (guest: ${data.guestSent ? '✓' : '-'}, staff: ${data.staffSent ? '✓' : '-'})`
      setTimeout(() => state.success = '', 4000)
    } else {
      state.error = data.error || 'Failed to resend'
    }
  } catch (err) {
    state.error = 'Resend failed: ' + err.message
  }
}

async function addBookingNote() {
  const note = state.bookingNote.trim()
  if (!note || !state.selectedBookingDetail) return
  try {
    const resp = await fetch(`/api/admin/bookings/${state.selectedBookingDetail.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ note })
    })
    if (resp.ok) {
      const data = await resp.json()
      state.selectedBookingDetail = data.booking
      state.bookingNote = ''
    }
  } catch (err) {
    state.error = 'Failed to add note: ' + err.message
  }
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
  } catch { return iso }
}

function statusLabel(key) {
  return statusOptions.find((s) => s.key === key)?.label || key
}

// ============== Contracts tab ==============
const showContractPlaceholders = ref(false)
const contractRefName = ref('')
const contractPlaceholders = [
  { key: 'name', label: 'Romanized name' },
  { key: 'nameChinese', label: 'Chinese name' },
  { key: 'idType', label: 'ID document type' },
  { key: 'idNumber', label: 'ID number' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'dateOfBirth', label: 'Date of birth' },
  { key: 'currentAddress', label: 'Current address' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'roomType', label: 'Room type' },
  { key: 'roomPrice', label: 'Monthly rent (number)' },
  { key: 'roomPriceDisplay', label: 'Monthly rent (display)' },
  { key: 'occupancy', label: 'Occupants' },
  { key: 'moveInDate', label: 'Move-in date' },
  { key: 'moveOutDate', label: 'Move-out date' },
  { key: 'duration', label: 'Duration' },
  { key: 'depositMonths', label: 'Deposit months' },
  { key: 'depositAmount', label: 'Deposit amount' },
  { key: 'firstMonthRent', label: 'First month rent' },
  { key: 'totalPrepayment', label: 'Total prepayment' },
  { key: 'emergencyName', label: 'Emergency contact name' },
  { key: 'emergencyRelation', label: 'Emergency relation' },
  { key: 'emergencyPhone', label: 'Emergency phone' },
  { key: 'contractNumber', label: 'Contract number' },
  { key: 'contractDate', label: 'Contract date' },
  { key: 'bookingId', label: 'Booking ID' },
  { key: 'landlordName', label: 'Landlord name' },
  { key: 'landlordAddress', label: 'Landlord address' },
  { key: 'landlordRep', label: 'Landlord representative' }
]

function ensureContracts() {
  if (!state.data.contracts) {
    state.data.contracts = {
      version: 'v1-2026-06',
      depositMonthsDefault: 2,
      prepayOptions: ['standard', '6_months', '12_months'],
      templates: {
        en: { subject: 'Tenancy Agreement', body: '' },
        'zh-CN': { subject: '租赁合同', body: '' },
        'zh-HK': { subject: '租賃合約', body: '' }
      }
    }
  }
  if (!state.data.contracts.templates) state.data.contracts.templates = {}
  for (const lang of ['en', 'zh-CN', 'zh-HK']) {
    if (!state.data.contracts.templates[lang]) {
      state.data.contracts.templates[lang] = { subject: '', body: '' }
    }
  }
}

function contractTemplate(lang) {
  ensureContracts()
  return state.data.contracts.templates[lang]
}

const contractsSettings = computed({
  get() {
    ensureContracts()
    return state.data.contracts
  },
  set(v) { state.data.contracts = v }
})

function placeholderToken(key) {
  return '{' + '{' + key + '}' + '}'
}

async function copyPlaceholder(key) {
  try {
    await navigator.clipboard.writeText(placeholderToken(key))
    state.success = 'Copied ' + key
    setTimeout(() => state.success = '', 1500)
  } catch (err) { /* */ }
}

function handleContractRefUpload(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  contractRefName.value = file.name
  // We don't upload to server; reference only for legal team.
}

async function translateContractTemplate() {
  ensureContracts()
  const sourceLang = 'en'
  const sourceTpl = state.data.contracts.templates[sourceLang]
  if (!sourceTpl?.body) {
    state.error = 'Please write the English template first.'
    return
  }
  state.translating = true
  try {
    const resp = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        kind: 'tenancy agreement template (HTML, keep {{placeholders}} unchanged)',
        sourceLanguage: sourceLang,
        data: { subject: sourceTpl.subject, body: sourceTpl.body }
      })
    })
    const data = await resp.json()
    if (resp.ok && data.success && data.translations) {
      for (const targetLang of ['zh-CN', 'zh-HK']) {
        if (data.translations[targetLang]) {
          state.data.contracts.templates[targetLang] = {
            subject: data.translations[targetLang].subject || state.data.contracts.templates[targetLang].subject,
            body: data.translations[targetLang].body || state.data.contracts.templates[targetLang].body
          }
        }
      }
      state.success = 'Translated to zh-CN and zh-HK'
      setTimeout(() => state.success = '', 3000)
    } else {
      state.error = data.error || 'Translation failed'
    }
  } catch (err) {
    state.error = 'Translation failed: ' + err.message
  } finally {
    state.translating = false
  }
}

// ============== Legal tab ==============
function ensureLegal() {
  if (!state.data.legal) {
    state.data.legal = { terms: {}, privacy: {} }
  }
  for (const k of ['terms', 'privacy']) {
    if (!state.data.legal[k]) state.data.legal[k] = {}
    for (const lang of ['en', 'zh-CN', 'zh-HK']) {
      if (!state.data.legal[k][lang]) state.data.legal[k][lang] = { title: '', body: '' }
    }
  }
}
function legalBlock(page, lang) {
  ensureLegal()
  return state.data.legal[page][lang]
}
async function translateLegal(page) {
  ensureLegal()
  const sourceLang = 'en'
  const source = state.data.legal[page][sourceLang]
  if (!source?.body) {
    state.error = 'Please write the English text first.'
    return
  }
  state.translating = true
  try {
    const resp = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        kind: `${page === 'terms' ? 'house rules and tenancy terms' : 'privacy policy'} (HTML)`,
        sourceLanguage: sourceLang,
        data: { title: source.title, body: source.body }
      })
    })
    const data = await resp.json()
    if (resp.ok && data.success && data.translations) {
      for (const targetLang of ['zh-CN', 'zh-HK']) {
        if (data.translations[targetLang]) {
          state.data.legal[page][targetLang] = {
            title: data.translations[targetLang].title || state.data.legal[page][targetLang].title,
            body: data.translations[targetLang].body || state.data.legal[page][targetLang].body
          }
        }
      }
      state.success = `Translated ${page} to other languages`
      setTimeout(() => state.success = '', 3000)
    } else {
      state.error = data.error || 'Translation failed'
    }
  } catch (err) {
    state.error = 'Translation failed: ' + err.message
  } finally {
    state.translating = false
  }
}

const selectedRoom = computed(() => state.data.rooms[state.selectedRoomIndex] || null)
const selectedProduct = computed(() => state.data.products[state.selectedProductIndex] || null)

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me')
    if (!res.ok) {
      router.replace('/admin/stay/login')
      return
    }
    const json = await res.json()
    if (!json.authenticated) {
      router.replace('/admin/stay/login')
      return
    }
    // Block shop-only users from Stay admin
    if (json.role === 'shop') {
      router.replace('/admin/shop')
      return
    }
  } catch {
    router.replace('/admin/stay/login')
  } finally {
    state.checking = false
  }
}

async function loadContent() {
  state.loading = true
  state.error = ''
  try {
    const res = await fetch('/api/admin/content')
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load content')
    state.data = json.data
    if (!state.data.rooms?.length) state.data.rooms = []
    if (!state.data.products?.length) state.data.products = []
  } catch (error) {
    state.error = error?.message || 'Failed to load content'
  } finally {
    state.loading = false
  }
}

async function saveAll() {
  state.saving = true
  state.error = ''
  state.success = ''
  try {
    const payload = deepClone(state.data)
    payload.updatedAt = new Date().toISOString()
    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save')
    state.data = json.data
    state.success = 'Published successfully.'
  } catch (error) {
    state.error = error?.message || 'Failed to save'
  } finally {
    state.saving = false
    setTimeout(() => { state.success = '' }, 2500)
  }
}

function makeBlankTranslations(base = {}) {
  return {
    en: { ...base },
    'zh-HK': { ...base },
    'zh-CN': { ...base }
  }
}

function addRoom() {
  const id = `room-${Date.now()}`
  state.data.rooms.push({
    id,
    primaryLanguage: 'en',
    sortOrder: state.data.rooms.length + 1,
    images: [],
    translations: makeBlankTranslations({
      name: 'New room',
      occupancy: '',
      size: '',
      price: '',
      period: '',
      tagline: '',
      description: '',
      highlight: '',
      features: []
    })
  })
  state.selectedRoomIndex = state.data.rooms.length - 1
}

function deleteRoom(index) {
  if (!confirm('Delete this room type?')) return
  state.data.rooms.splice(index, 1)
  state.selectedRoomIndex = Math.max(0, state.selectedRoomIndex - 1)
}

function addProduct() {
  const id = `product-${Date.now()}`
  state.data.products.push({
    id,
    primaryLanguage: 'en',
    sortOrder: state.data.products.length + 1,
    images: [],
    translations: makeBlankTranslations({
      name: 'New product',
      category: '',
      price: '',
      description: ''
    })
  })
  state.selectedProductIndex = state.data.products.length - 1
}

function deleteProduct(index) {
  if (!confirm('Delete this product?')) return
  state.data.products.splice(index, 1)
  state.selectedProductIndex = Math.max(0, state.selectedProductIndex - 1)
}

function normalizeFeatures(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function featuresAsText(item, lang) {
  return (item?.translations?.[lang]?.features || []).join('\n')
}

function setFeaturesFromText(item, lang, value) {
  item.translations[lang].features = normalizeFeatures(value)
}

async function filesToDataUrls(files) {
  const list = Array.from(files || [])
  return await Promise.all(list.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })))
}

function getImageList(target) {
  if (Array.isArray(target.images)) return target.images
  if (Array.isArray(target.heroImages)) return target.heroImages
  target.images = []
  return target.images
}

async function handleImageUpload(target, event) {
  const results = await filesToDataUrls(event.target.files)
  getImageList(target).push(...results)
  event.target.value = ''
}

function removeImage(target, index) {
  getImageList(target).splice(index, 1)
}

function moveImage(target, index, direction) {
  const list = getImageList(target)
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(newIndex, 0, item)
}

function setCoverImage(target, index) {
  const list = getImageList(target)
  if (index === 0 || index >= list.length) return
  const [item] = list.splice(index, 1)
  list.unshift(item)
}

async function translateBlock(kind, item) {
  state.translating = true
  state.error = ''
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind, sourceLanguage: item.primaryLanguage, data: item.translations[item.primaryLanguage] })
    })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.error || 'Translation failed')
    item.translations = json.translations
  } catch (error) {
    state.error = error?.message || 'Translation failed'
  } finally {
    state.translating = false
  }
}

async function translateSiteSection(sectionKey) {
  const section = state.data[sectionKey]
  await translateBlock(sectionKey, section)
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' })
  router.replace('/admin/login')
}

onMounted(async () => {
  await checkAuth()
  if (!state.checking) {
    await loadContent()
    if (state.activeTab === 'bookings') loadBookings()
  }
})
</script>

<template>
  <section v-if="state.checking" class="admin-loading">Checking access…</section>
  <section v-else class="admin-shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <a href="https://www.demainculture.com" target="_blank" rel="noopener" class="sidebar-logo-link">
          <img src="/brand/demain-culture-logo.webp?v=20260628" alt="未來文化 Demain Culture" class="sidebar-logo" />
        </a>
        <p class="eyebrow"><span class="eyebrow-dot"></span>DEMAIN LIFE · ADMIN</p>
        <h1>Content <span class="neon-word">Console</span></h1>
      </div>
      <div class="tab-list">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: state.activeTab === tab.key }"
          @click="state.activeTab = tab.key;
            if (tab.key === 'bookings' && !state.bookingsLoaded) loadBookings();
            else if (tab.key === 'payments' && !paymentsState.loaded) loadPayments();
            else if (tab.key === 'roomgrid' && !roomGridState.loaded) { loadRoomGrid(); checkArchiveStatus(); }
            else if (tab.key === 'legal' && !legalState.loaded) loadLegal();"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'bookings' && unreadBookingsCount > 0" class="tab-badge">{{ unreadBookingsCount }}</span>
          <span v-else-if="tab.key === 'payments' && pendingApprovalsCount > 0" class="tab-badge">{{ pendingApprovalsCount }}</span>
        </button>
      </div>
      <button class="logout-btn" @click="logout">Sign out</button>
    </aside>

    <main class="main-panel">
      <div class="main-header">
        <div>
          <h2>{{ tabs.find(t => t.key === state.activeTab)?.label }}</h2>
          <p class="muted">Edit once, then polish + translate to three languages with Grok AI.</p>
        </div>
        <div class="header-actions">
          <span v-if="state.error" class="error">{{ state.error }}</span>
          <span v-if="state.success" class="success">{{ state.success }}</span>
          <button class="publish-btn" :disabled="state.saving" @click="saveAll">
            {{ state.saving ? 'Publishing…' : 'Publish site updates' }}
          </button>
        </div>
      </div>

      <div v-if="state.loading" class="admin-loading">Loading content…</div>

      <template v-else>
        <!-- ============ BOOKINGS TAB ============ -->
        <div v-if="state.activeTab === 'bookings'" class="bookings-layout">
          <div class="bookings-list-panel">
            <div class="panel-header">
              <h3>All reservations</h3>
              <div style="display: flex; gap: 0.4rem;">
                <button class="mini-btn" :disabled="state.bookingsLoading" @click="loadBookings">
                  {{ state.bookingsLoading ? 'Loading…' : 'Refresh' }}
                </button>
                <button class="mini-btn danger" @click="cleanupTestData" title="Wipe all bookings">🗑 Clean</button>
              </div>
            </div>
            <div v-if="state.bookings.length === 0 && !state.bookingsLoading" class="empty-state">
              No bookings yet. Submissions from <code>/book</code> will appear here.
            </div>
            <div v-else class="bookings-table">
              <div class="bookings-table-header">
                <span>ID</span>
                <span>Name</span>
                <span>Room</span>
                <span>Move-in</span>
                <span>Status</span>
              </div>
              <button
                v-for="b in state.bookings"
                :key="b.id"
                class="booking-row"
                :class="{ active: state.selectedBooking === b.id, unread: b.unreadByAdmin }"
                @click="openBooking(b.id)"
              >
                <span class="booking-id">{{ b.id }}</span>
                <span>{{ b.name }}</span>
                <span>{{ b.roomType }}</span>
                <span>{{ b.moveInDate }}</span>
                <span class="status-badge" :class="`status-${b.status}`">{{ statusLabel(b.status) }}</span>
              </button>
            </div>
          </div>

          <div class="booking-detail-panel">
            <div v-if="!state.selectedBooking" class="empty-state">
              Select a booking to see details.
            </div>
            <div v-else-if="state.bookingDetailLoading" class="empty-state">Loading…</div>
            <div v-else-if="state.selectedBookingDetail" class="booking-detail">
              <div class="detail-header">
                <p class="muted">{{ state.selectedBookingDetail.id }}</p>
                <h3>
                  {{ state.selectedBookingDetail.name }}
                  <span class="status-badge" :class="`status-${state.selectedBookingDetail.status}`" style="font-size: 0.7rem; margin-left: 0.5rem; vertical-align: middle;">{{ statusLabel(state.selectedBookingDetail.status) }}</span>
                </h3>
                <p class="muted">Submitted {{ formatDate(state.selectedBookingDetail.createdAt) }}</p>
              </div>

              <!-- Preferred contact method (highly visible) -->
              <div v-if="state.selectedBookingDetail.contactMethod" class="contact-pref-card">
                <div class="pref-icon">{{ ({email:'📧',phone:'📞',whatsapp:'💬',wechat:'💬'})[state.selectedBookingDetail.contactMethod] || '📧' }}</div>
                <div class="pref-info">
                  <p class="pref-label">Preferred contact</p>
                  <p class="pref-value"><strong>{{ state.selectedBookingDetail.contactMethod.toUpperCase() }}</strong> · {{ preferredContactValue(state.selectedBookingDetail) }}</p>
                </div>
                <div class="pref-actions">
                  <button class="mini-btn" @click="copyContactInfo">📋 Copy</button>
                  <a v-if="state.selectedBookingDetail.contactMethod === 'whatsapp'" :href="whatsappUrl(state.selectedBookingDetail)" target="_blank" rel="noopener" class="mini-btn primary-mini">Open WhatsApp ↗</a>
                  <a v-else-if="state.selectedBookingDetail.contactMethod === 'phone'" :href="`tel:${state.selectedBookingDetail.phone}`" class="mini-btn primary-mini">Call ↗</a>
                  <a v-else-if="state.selectedBookingDetail.contactMethod === 'email'" :href="`mailto:${state.selectedBookingDetail.email}?subject=Re%3A%20${encodeURIComponent(state.selectedBookingDetail.id)}`" class="mini-btn primary-mini">Compose email ↗</a>
                </div>
              </div>

              <!-- Workflow action card — shows the next step button based on current status -->
              <div class="workflow-card">
                <p class="workflow-label">Next step</p>
                <div class="workflow-actions">
                  <template v-if="state.selectedBookingDetail.status === 'new'">
                    <button class="workflow-btn primary" @click="runWorkflow('start-reviewing', false)">✍️ Start reviewing</button>
                    <button class="workflow-btn" @click="openWorkflowModal('send-profile')">📤 Send profile request</button>
                  </template>
                  <template v-else-if="state.selectedBookingDetail.status === 'reviewing'">
                    <button class="workflow-btn primary" @click="openWorkflowModal('send-profile')">📤 Send profile request</button>
                  </template>
                  <template v-else-if="state.selectedBookingDetail.status === 'profile-sent'">
                    <span class="muted">Waiting for guest to complete profile…</span>
                    <button class="workflow-btn ghost" @click="copyDetailsLink">🔗 Copy profile link again</button>
                  </template>
                  <template v-else-if="state.selectedBookingDetail.status === 'profile-submitted'">
                    <button class="workflow-btn primary" @click="openWorkflowModal('send-contract')">✍️ Send contract</button>
                  </template>
                  <template v-else-if="state.selectedBookingDetail.status === 'contract-sent'">
                    <span class="muted">Waiting for guest to sign contract…</span>
                    <button class="workflow-btn ghost" @click="copyContractLink">🔗 Copy contract link again</button>
                  </template>
                  <template v-else-if="state.selectedBookingDetail.status === 'signed'">
                    <span class="muted">Contract signed. Create a payment request below.</span>
                  </template>
                  <template v-else-if="state.selectedBookingDetail.status === 'invoice-sent' || state.selectedBookingDetail.status === 'awaiting-payment'">
                    <span class="muted">Waiting for guest to pay…</span>
                  </template>
                  <template v-else-if="state.selectedBookingDetail.status === 'paid'">
                    <button class="workflow-btn primary" @click="openAssignModal(state.selectedBookingDetail.id)">🏠 Assign room</button>
                    <button class="workflow-btn ghost" @click="runWorkflow('send-checkin', true)">Send check-in info (no room)</button>
                  </template>
                  <template v-else-if="state.selectedBookingDetail.status === 'room-assigned'">
                    <button class="workflow-btn primary" @click="runWorkflow('send-checkin', true)">📧 Send check-in info to guest</button>
                    <button class="workflow-btn ghost" @click="openAssignModal(state.selectedBookingDetail.id)">Change room</button>
                    <button class="workflow-btn ghost" @click="confirmCheckIn(state.selectedBookingDetail.id)">Mark as checked in</button>
                  </template>
                  <template v-else-if="state.selectedBookingDetail.status === 'checked-in'">
                    <span class="muted">✓ Checked in. All done.</span>
                    <button class="workflow-btn ghost" @click="releaseRoom(state.selectedBookingDetail.id)">Release room</button>
                  </template>
                  <button v-if="state.selectedBookingDetail.status !== 'cancelled' && state.selectedBookingDetail.status !== 'checked-in'" class="workflow-btn danger" @click="cancelBooking">Cancel</button>
                </div>
              </div>

              <div class="detail-section">
                <h4>Contact</h4>
                <div class="detail-grid">
                  <div><span class="k">Email</span><span class="v"><a :href="`mailto:${state.selectedBookingDetail.email}`">{{ state.selectedBookingDetail.email }}</a></span></div>
                  <div><span class="k">Phone</span><span class="v">{{ state.selectedBookingDetail.phone }}</span></div>
                  <div><span class="k">Nationality</span><span class="v">{{ state.selectedBookingDetail.nationality || '—' }}</span></div>
                </div>
              </div>

              <div class="detail-section">
                <h4>Stay</h4>
                <div class="detail-grid">
                  <div><span class="k">Room type</span><span class="v">{{ state.selectedBookingDetail.roomType }}</span></div>
                  <div><span class="k">Move-in</span><span class="v">{{ state.selectedBookingDetail.moveInDate }}</span></div>
                  <div><span class="k">Duration</span><span class="v">{{ state.selectedBookingDetail.duration || '—' }}</span></div>
                  <div><span class="k">Occupants</span><span class="v">{{ state.selectedBookingDetail.occupancy || '—' }}</span></div>
                </div>
              </div>

              <div v-if="state.selectedBookingDetail.assignedRoom" class="detail-section assigned-room-section">
                <h4>🏠 Assigned room</h4>
                <div class="detail-grid">
                  <div><span class="k">Block / Room</span><span class="v"><strong>Block {{ state.selectedBookingDetail.assignedRoom.block }} &middot; Room {{ state.selectedBookingDetail.assignedRoom.room }}</strong></span></div>
                  <div><span class="k">Furniture</span><span class="v">{{ state.selectedBookingDetail.assignedRoom.roomConfig }}</span></div>
                  <div><span class="k">Assigned at</span><span class="v">{{ formatDate(state.selectedBookingDetail.assignedRoom.assignedAt) }}</span></div>
                  <div v-if="state.selectedBookingDetail.assignedRoom.moveOutDate"><span class="k">Move-out</span><span class="v">{{ state.selectedBookingDetail.assignedRoom.moveOutDate }}</span></div>
                </div>
              </div>

              <div v-if="state.selectedBookingDetail.message" class="detail-section">
                <h4>Message</h4>
                <p class="message-block">{{ state.selectedBookingDetail.message }}</p>
              </div>

              <div class="detail-section">
                <h4>Status</h4>
                <div class="status-buttons">
                  <button
                    v-for="s in statusOptions"
                    :key="s.key"
                    class="status-btn"
                    :class="{ active: state.selectedBookingDetail.status === s.key }"
                    :disabled="state.bookingStatusUpdating"
                    @click="updateBookingStatus(s.key)"
                  >{{ s.label }}</button>
                </div>
              </div>

              <div class="detail-section">
                <h4>Documents</h4>

                <!-- ID front -->
                <div v-if="state.selectedBookingDetail.documents?.idFront" class="doc-row">
                  <div class="doc-thumb" @click="openDocPreview('front')">
                    <img :src="`/api/admin/bookings/${state.selectedBookingDetail.id}/file?side=front&t=${docCacheBuster}`" alt="ID front" />
                  </div>
                  <div class="doc-meta">
                    <div class="doc-title">ID · Front side</div>
                    <div class="doc-sub muted">
                      {{ (state.selectedBookingDetail.documents.idFront.size / 1024).toFixed(1) }} KB ·
                      {{ state.selectedBookingDetail.documents.idFront.mime }} ·
                      Uploaded {{ formatDate(state.selectedBookingDetail.documents.idFront.uploadedAt) }}
                    </div>
                    <div class="doc-actions">
                      <a class="mini-btn" :href="`/api/admin/bookings/${state.selectedBookingDetail.id}/file?side=front`" target="_blank" rel="noopener">👁 Open</a>
                      <a class="mini-btn" :href="`/api/admin/bookings/${state.selectedBookingDetail.id}/file?side=front`" :download="`${state.selectedBookingDetail.id}-id-front.jpg`">↓ Download</a>
                    </div>
                  </div>
                </div>

                <!-- ID back -->
                <div v-if="state.selectedBookingDetail.documents?.idBack" class="doc-row">
                  <div class="doc-thumb" @click="openDocPreview('back')">
                    <img :src="`/api/admin/bookings/${state.selectedBookingDetail.id}/file?side=back&t=${docCacheBuster}`" alt="ID back" />
                  </div>
                  <div class="doc-meta">
                    <div class="doc-title">ID · Back side</div>
                    <div class="doc-sub muted">
                      {{ (state.selectedBookingDetail.documents.idBack.size / 1024).toFixed(1) }} KB ·
                      {{ state.selectedBookingDetail.documents.idBack.mime }} ·
                      Uploaded {{ formatDate(state.selectedBookingDetail.documents.idBack.uploadedAt) }}
                    </div>
                    <div class="doc-actions">
                      <a class="mini-btn" :href="`/api/admin/bookings/${state.selectedBookingDetail.id}/file?side=back`" target="_blank" rel="noopener">👁 Open</a>
                      <a class="mini-btn" :href="`/api/admin/bookings/${state.selectedBookingDetail.id}/file?side=back`" :download="`${state.selectedBookingDetail.id}-id-back.jpg`">↓ Download</a>
                    </div>
                  </div>
                </div>

                <!-- Signed contract -->
                <div v-if="state.selectedBookingDetail.contract?.contractHash" class="doc-row">
                  <div class="doc-thumb doc-thumb-contract">📄</div>
                  <div class="doc-meta">
                    <div class="doc-title">Signed contract</div>
                    <div class="doc-sub muted">
                      {{ state.selectedBookingDetail.contract.contractNumber }} ·
                      Signed by {{ state.selectedBookingDetail.contract.signatureName }} ·
                      {{ formatDate(state.selectedBookingDetail.contract.signedAt) }}
                    </div>
                    <div class="doc-sub muted" style="font-family: 'SF Mono', monospace; font-size: 0.7rem; word-break: break-all;">
                      SHA-256: {{ state.selectedBookingDetail.contract.contractHash }}
                    </div>
                    <div class="doc-actions">
                      <a class="mini-btn" :href="`/api/admin/bookings/${state.selectedBookingDetail.id}/signed-contract`" target="_blank" rel="noopener">👁 Open (then Ctrl+P to save as PDF)</a>
                      <a class="mini-btn" :href="`/api/admin/bookings/${state.selectedBookingDetail.id}/signed-contract`" :download="`contract-${state.selectedBookingDetail.id}.html`">↓ Download HTML</a>
                    </div>
                  </div>
                </div>

                <!-- Empty state -->
                <div v-if="!state.selectedBookingDetail.documents?.idFront && !state.selectedBookingDetail.documents?.idBack && !state.selectedBookingDetail.contract?.contractHash" class="empty-state" style="padding: 1rem 0;">
                  No documents uploaded yet.
                </div>

                <!-- Drive folder link (kept for future when Drive sync works) -->
                <a v-if="state.selectedBookingDetail.driveFolder" class="drive-link" :href="state.selectedBookingDetail.driveFolder" target="_blank" rel="noopener" style="display:block; margin-top: 0.75rem; font-size: 0.8rem;">
                  Open Google Drive folder ↗ <span class="muted">(empty until shared-drive sync is set up)</span>
                </a>
              </div>

              <!-- Image lightbox -->
              <div v-if="docPreview.open" class="doc-lightbox" @click.self="docPreview.open = false">
                <button class="doc-lightbox-close" @click="docPreview.open = false">✕</button>
                <img :src="docPreview.url" :alt="docPreview.alt" />
              </div>

              <div class="detail-section">
                <h4>Email</h4>
                <div class="email-buttons">
                  <button class="mini-btn" @click="resendEmail('guest')">Resend to guest</button>
                  <button class="mini-btn" @click="resendEmail('staff')">Resend to staff</button>
                  <button class="mini-btn" @click="resendEmail('both')">Resend both</button>
                </div>
              </div>

              <div v-if="state.selectedBookingDetail.detailsToken" class="detail-section">
                <h4>Profile completion link</h4>
                <p class="muted" style="font-size: 0.8rem; margin: 0 0 0.5rem;">
                  <span v-if="state.selectedBookingDetail.detailsSubmittedAt">✓ Completed {{ formatDate(state.selectedBookingDetail.detailsSubmittedAt) }}</span>
                  <span v-else>Awaiting guest · valid 30 days from booking creation</span>
                </p>
                <div class="email-buttons">
                  <button class="mini-btn" @click="copyDetailsLink">Copy link</button>
                  <button class="mini-btn" @click="generateQR">Show QR</button>
                  <a class="mini-btn" :href="detailsUrl()" target="_blank" rel="noopener">Open</a>
                </div>
                <div v-if="showQR && qrDataUrl" class="qr-display">
                  <img :src="qrDataUrl" alt="QR code" />
                  <button class="mini-btn" @click="showQR = false">Close</button>
                </div>
              </div>

              <div v-if="state.selectedBookingDetail.contract" class="detail-section">
                <h4>Contract</h4>
                <div class="detail-grid">
                  <div><span class="k">Signed at</span><span class="v">{{ formatDate(state.selectedBookingDetail.contract.signedAt) }}</span></div>
                  <div><span class="k">Method</span><span class="v">{{ state.selectedBookingDetail.contract.signatureMethod }}</span></div>
                  <div><span class="k">Template ver.</span><span class="v">v{{ state.selectedBookingDetail.contract.contractTemplateVersion }}</span></div>
                  <div><span class="k">Signer IP</span><span class="v" style="font-size: 0.78rem;">{{ state.selectedBookingDetail.contract.signerIp }}</span></div>
                  <div><span class="k">Hash</span><span class="v" style="font-family: monospace; font-size: 0.7rem;">{{ state.selectedBookingDetail.contract.contractHash?.slice(0, 24) }}…</span></div>
                </div>
                <div class="email-buttons" style="margin-top: 0.75rem;">
                  <a v-if="state.selectedBookingDetail.contract.contractPdfUrl" class="mini-btn" :href="state.selectedBookingDetail.contract.contractPdfUrl" target="_blank" rel="noopener">View signed PDF ↗</a>
                  <a v-else-if="state.selectedBookingDetail.contract.contractHtmlUrl" class="mini-btn" :href="state.selectedBookingDetail.contract.contractHtmlUrl" target="_blank" rel="noopener">View signed HTML ↗</a>
                </div>
              </div>

              <div class="detail-section" style="border-top: 1px solid #f0eee9; padding-top: 1rem; margin-top: 1.5rem;">
                <h4 style="color: #b06b6b;">Danger zone</h4>
                <div class="email-buttons">
                  <button class="mini-btn" style="color: #b06b6b; border-color: #e0c8c8;" @click="deleteBooking">Delete booking</button>
                </div>
              </div>

              <div v-if="state.selectedBookingDetail.details" class="detail-section">
                <h4>Submitted details</h4>
                <div class="detail-grid">
                  <div><span class="k">Doc type</span><span class="v">{{ state.selectedBookingDetail.details.documentType }}</span></div>
                  <div><span class="k">Doc number</span><span class="v">{{ state.selectedBookingDetail.details.documentNumber }}</span></div>
                  <div><span class="k">Name (roman)</span><span class="v">{{ state.selectedBookingDetail.details.name }}</span></div>
                  <div v-if="state.selectedBookingDetail.details.nameChinese"><span class="k">Name (中文)</span><span class="v">{{ state.selectedBookingDetail.details.nameChinese }}</span></div>
                  <div><span class="k">DOB</span><span class="v">{{ state.selectedBookingDetail.details.dateOfBirth }}</span></div>
                  <div><span class="k">Gender</span><span class="v">{{ state.selectedBookingDetail.details.gender }}</span></div>
                  <div><span class="k">Occupation</span><span class="v">{{ state.selectedBookingDetail.details.occupation }}</span></div>
                  <div><span class="k">Address</span><span class="v">{{ state.selectedBookingDetail.details.currentAddress }}</span></div>
                  <div><span class="k">Emergency</span><span class="v">{{ state.selectedBookingDetail.details.emergencyName }} ({{ state.selectedBookingDetail.details.emergencyRelation }}) · {{ state.selectedBookingDetail.details.emergencyPhone }}</span></div>
                  <div><span class="k">Signed by</span><span class="v">{{ state.selectedBookingDetail.details.signature }} · {{ formatDate(state.selectedBookingDetail.details.signedAt) }}</span></div>
                  <div><span class="k">AI assisted</span><span class="v">{{ state.selectedBookingDetail.details.aiAssisted ? 'Yes' : 'No' }}</span></div>
                </div>
              </div>

              <!-- Contract editor -->
              <div class="detail-section">
                <div class="contract-editor-head">
                  <h4>Contract</h4>
                  <span class="lang-badge">Editing: {{ contractEditor.lang === 'zh-HK' ? '繁體中文' : 'English' }}</span>
                  <span v-if="contractEditor.frozen" class="contract-frozen-badge">🔒 Sent · frozen</span>
                  <span v-else-if="contractEditor.savedAt" class="muted" style="font-size:0.75rem;">Saved {{ formatDate(contractEditor.savedAt) }}</span>
                </div>
                <p class="muted" style="font-size:0.85rem; margin: 0 0 0.75rem;">
                  The body below is what the tenant will see and sign in <strong>{{ contractEditor.lang === 'zh-HK' ? 'Traditional Chinese' : 'English' }}</strong>. Edit any text, or paste a new version from Word. The tenant can switch languages on the contract page — the other language uses the auto-generated template until you edit it too. Once you send the contract, this is frozen.
                </p>

                <div v-if="contractEditor.loading" class="empty-state" style="padding: 1rem 0;">Loading contract…</div>
                <div v-else-if="contractEditor.error" class="empty-state" style="padding: 1rem 0; color:#b03030;">{{ contractEditor.error }}</div>
                <div v-else>
                  <div class="contract-editor-toolbar">
                    <button class="mini-btn" :disabled="contractEditor.frozen" @click="contractEditorCmd('bold')"><b>B</b></button>
                    <button class="mini-btn" :disabled="contractEditor.frozen" @click="contractEditorCmd('italic')"><i>I</i></button>
                    <button class="mini-btn" :disabled="contractEditor.frozen" @click="contractEditorCmd('underline')"><u>U</u></button>
                    <button class="mini-btn" :disabled="contractEditor.frozen" @click="contractEditorCmd('insertUnorderedList')">• List</button>
                    <button class="mini-btn" :disabled="contractEditor.frozen" @click="contractEditorCmd('insertOrderedList')">1. List</button>
                    <button class="mini-btn" :disabled="contractEditor.frozen" @click="contractEditorCmd('formatBlock','H2')">H2</button>
                    <button class="mini-btn" :disabled="contractEditor.frozen" @click="contractEditorCmd('formatBlock','H3')">H3</button>
                    <button class="mini-btn" :disabled="contractEditor.frozen" @click="contractEditorCmd('formatBlock','P')">¶</button>
                    <span style="flex:1"></span>
                    <button class="mini-btn" :disabled="contractEditor.frozen || contractEditor.saving" @click="contractEditorRegenerate">↻ Reset from template</button>
                    <button v-if="contractEditor.frozen" class="mini-btn warning" :disabled="contractEditor.saving" @click="contractEditorWithdraw">↩ Withdraw & re-edit</button>
                  </div>
                  <div
                    ref="contractEditorEl"
                    class="contract-editor-body"
                    :class="{ frozen: contractEditor.frozen }"
                    :contenteditable="!contractEditor.frozen"
                    @input="contractEditor.dirty = true"
                    @paste="onContractPaste"
                    v-html="contractEditor.initialHtml"
                  ></div>
                  <div class="contract-editor-foot">
                    <span v-if="contractEditor.dirty && !contractEditor.frozen" class="muted" style="font-size:0.8rem;">• Unsaved changes</span>
                    <span style="flex:1"></span>
                    <button class="mini-btn" :disabled="contractEditor.frozen || contractEditor.saving || !contractEditor.dirty" @click="contractEditorSave">
                      {{ contractEditor.saving ? 'Saving…' : 'Save draft' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Payment requests -->
              <div class="detail-section">
                <h4>Payments</h4>
                <div v-if="!(state.selectedBookingDetail.payments && state.selectedBookingDetail.payments.length)" class="empty-state" style="padding: 1rem 0;">
                  No payment requests yet.
                </div>
                <div v-else class="payments-inline">
                  <div v-for="p in state.selectedBookingDetail.payments" :key="p.requestId" class="payment-inline-row">
                    <div class="pir-head">
                      <strong>HK$ {{ p.amount.toLocaleString() }}</strong>
                      <span class="status-badge" :class="`pstat-${p.status}`">{{ p.status }}</span>
                      <span class="muted" style="font-size: 0.75rem;">{{ p.requestId }}</span>
                    </div>
                    <div v-if="p.description" class="muted" style="font-size: 0.8rem;">{{ p.description }}</div>
                    <div v-if="(p.screenshots || []).length" class="muted" style="font-size: 0.8rem;">
                      📎 {{ p.screenshots.length }} screenshot(s):
                      <a v-for="(s, i) in p.screenshots" :key="i" :href="s.url" target="_blank" rel="noopener" style="margin: 0 4px;">view {{ i + 1 }} ↗</a>
                    </div>
                    <div v-if="p.status === 'screenshot-uploaded'" class="payment-actions">
                      <button class="mini-btn" @click="approvePaymentInline(p.requestId, 'approve')">✓ Approve</button>
                      <button class="mini-btn danger" @click="approvePaymentInline(p.requestId, 'reject')">Reject</button>
                    </div>
                  </div>
                </div>

                <!-- New payment request form -->
                <div class="payment-request-form">
                  <p class="muted" style="margin: 1rem 0 0.5rem; font-size: 0.85rem;">Create new payment request:</p>
                  <div class="prf-grid">
                    <label>
                      <span class="label-text">Amount (HKD)</span>
                      <input v-model="paymentRequestForm.amount" type="number" min="1" placeholder="20400" />
                    </label>
                    <label>
                      <span class="label-text">Due date</span>
                      <input v-model="paymentRequestForm.dueDate" type="date" />
                    </label>
                  </div>
                  <label>
                    <span class="label-text">Description</span>
                    <input v-model="paymentRequestForm.description" placeholder="Deposit (2 months) + first month rent" />
                  </label>
                  <button class="mini-btn primary-mini" :disabled="paymentRequestForm.sending" @click="createPaymentRequest">
                    {{ paymentRequestForm.sending ? 'Sending…' : 'Send payment request →' }}
                  </button>
                </div>
              </div>

              <div class="detail-section">
                <h4>Notes &amp; history</h4>
                <div class="history-list">
                  <div v-for="(h, i) in (state.selectedBookingDetail.history || [])" :key="i" class="history-item">
                    <span class="muted">{{ formatDate(h.at) }} · {{ h.by }}</span>
                    <div v-if="h.action === 'status_change'">Status: {{ statusLabel(h.from) }} → {{ statusLabel(h.to) }}</div>
                    <div v-else-if="h.action === 'note'">{{ h.note }}</div>
                    <div v-else>{{ h.action }}</div>
                  </div>
                </div>
                <div class="note-input">
                  <textarea v-model="state.bookingNote" rows="2" placeholder="Add a note…"></textarea>
                  <button class="mini-btn" @click="addBookingNote">Add note</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- =========== PAYMENTS TAB =========== -->
        <div v-else-if="state.activeTab === 'payments'" class="payments-tab">
          <div class="payments-summary">
            <div class="summary-tile outstanding">
              <p class="sum-label">Outstanding</p>
              <p class="sum-value">HK$ {{ paymentsState.summary.totalOutstanding.toLocaleString() }}</p>
            </div>
            <div class="summary-tile paid">
              <p class="sum-label">Paid this month</p>
              <p class="sum-value">HK$ {{ paymentsState.summary.totalPaidThisMonth.toLocaleString() }}</p>
            </div>
            <div class="summary-tile total">
              <p class="sum-label">Total paid (all time)</p>
              <p class="sum-value">HK$ {{ paymentsState.summary.totalPaid.toLocaleString() }}</p>
            </div>
            <div class="summary-tile count">
              <p class="sum-label">Payment requests</p>
              <p class="sum-value">{{ paymentsState.summary.paymentCount }}</p>
            </div>
          </div>

          <div class="payments-controls">
            <div class="filter-pills">
              <button class="sub-tab" :class="{ active: paymentsState.filter === 'all' }" @click="paymentsState.filter = 'all'">All ({{ paymentsState.payments.length }})</button>
              <button class="sub-tab" :class="{ active: paymentsState.filter === 'awaiting' }" @click="paymentsState.filter = 'awaiting'">Awaiting</button>
              <button class="sub-tab" :class="{ active: paymentsState.filter === 'screenshot-uploaded' }" @click="paymentsState.filter = 'screenshot-uploaded'">To verify 🔍</button>
              <button class="sub-tab" :class="{ active: paymentsState.filter === 'approved' }" @click="paymentsState.filter = 'approved'">Approved</button>
              <button class="sub-tab" :class="{ active: paymentsState.filter === 'rejected' }" @click="paymentsState.filter = 'rejected'">Rejected</button>
            </div>
            <div class="flex-spacer"></div>
            <button class="mini-btn" :disabled="paymentsState.loading" @click="loadPayments">{{ paymentsState.loading ? 'Loading…' : 'Refresh' }}</button>
            <button class="mini-btn" @click="exportPaymentsCSV">Export CSV</button>
            <a class="mini-btn" href="https://docs.google.com/spreadsheets/d/1sHcYAIpNfwlFql7n0zYnLhIvsOJH-r8MQBrMjjlTkh8/edit" target="_blank" rel="noopener">Open Sheet ↗</a>
          </div>

          <div v-if="filteredPayments.length === 0" class="empty-state">No payments in this view.</div>
          <div v-else class="payments-table">
            <div class="payments-table-header">
              <span>Booking</span><span>Guest</span><span>Amount</span><span>Created</span><span>Status</span><span>Actions</span>
            </div>
            <div v-for="p in filteredPayments" :key="p.requestId + '-' + p.bookingId" class="payment-row" :class="{ urgent: p.status === 'screenshot-uploaded' }">
              <span class="booking-id">{{ p.bookingId }}</span>
              <span>{{ p.bookingName }}</span>
              <span><strong>HK$ {{ p.amount.toLocaleString() }}</strong></span>
              <span class="muted" style="font-size: 0.8rem;">{{ formatDate(p.createdAt) }}</span>
              <span class="status-badge" :class="`pstat-${p.status}`">{{ p.status }}</span>
              <span class="row-actions">
                <a v-for="(url, i) in p.screenshotUrls" :key="i" :href="url" target="_blank" rel="noopener" class="mini-btn ghost">✍ {{ i + 1 }}</a>
                <button v-if="p.status === 'screenshot-uploaded'" class="mini-btn primary-mini" @click="approvePaymentFromTab(p, 'approve')">✓</button>
                <button v-if="p.status === 'screenshot-uploaded'" class="mini-btn danger" @click="approvePaymentFromTab(p, 'reject')">✕</button>
              </span>
            </div>
          </div>
        </div>

        <!-- =================== ROOM GRID =================== -->
        <div v-else-if="state.activeTab === 'roomgrid'" class="roomgrid-tab">
          <div class="panel-header">
            <h3>Room Grid &middot; 18 blocks &times; 28 rooms = 504</h3>
            <div class="actions">
              <select v-model="roomGridState.filterBlock" class="filter-select">
                <option value="all">All blocks</option>
                <option v-for="b in roomGridState.blocks" :key="b" :value="b">Block {{ b }}</option>
              </select>
              <button class="mini-btn" @click="loadRoomGrid" :disabled="roomGridState.loading">
                {{ roomGridState.loading ? 'Loading…' : 'Refresh' }}
              </button>
              <button class="mini-btn" @click="seedRoomsSheet">Seed Sheet</button>
            </div>
          </div>

          <!-- Summary cards -->
          <div class="summary-row">
            <div class="summary-card">
              <div class="summary-label">Total rooms</div>
              <div class="summary-value">{{ roomGridState.summary.total }}</div>
            </div>
            <div class="summary-card summary-occupied">
              <div class="summary-label">Occupied</div>
              <div class="summary-value">{{ roomGridState.summary.occupied }}</div>
            </div>
            <div class="summary-card summary-vacant">
              <div class="summary-label">Vacant</div>
              <div class="summary-value">{{ roomGridState.summary.vacant }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Occupancy rate</div>
              <div class="summary-value">{{ roomGridState.summary.total ? Math.round(roomGridState.summary.occupied / roomGridState.summary.total * 100) : 0 }}%</div>
            </div>
          </div>

          <!-- Year archive bar -->
          <div v-if="archiveState.info && archiveState.info.showReminder" class="archive-bar">
            <span>⚠️ {{ archiveState.info.suggestion }} ({{ archiveState.info.activeBookingsCount }} active bookings will carry over)</span>
            <button class="mini-btn" @click="runArchiveYear" :disabled="archiveState.archiving">
              {{ archiveState.archiving ? 'Archiving…' : `Archive ${archiveState.info.currentYear}` }}
            </button>
          </div>
          <div v-else-if="archiveState.info" class="archive-bar archive-bar-quiet">
            <span>📅 Year {{ archiveState.info.currentYear }} · {{ archiveState.info.activeBookingsCount }} active / {{ archiveState.info.totalBookingsCount }} total</span>
            <button class="mini-btn-ghost" @click="runArchiveYear" :disabled="archiveState.archiving">Archive now</button>
          </div>

          <!-- Legend -->
          <div class="legend-row">
            <span class="legend-item"><span class="legend-swatch cell-vacant"></span>Vacant</span>
            <span class="legend-item"><span class="legend-swatch cell-assigned"></span>Assigned</span>
            <span class="legend-item"><span class="legend-swatch cell-checked-in"></span>Checked in</span>
          </div>

          <!-- Grid -->
          <div class="room-grid-wrapper" v-if="!roomGridState.loading">
            <table class="room-grid">
              <thead>
                <tr>
                  <th class="grid-corner">Block / Room</th>
                  <th v-for="rn in roomGridState.roomNumbers" :key="rn">{{ rn }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in roomGridState.blocks" :key="b" v-show="roomGridState.filterBlock === 'all' || roomGridState.filterBlock === b">
                  <th class="grid-block-label">{{ b }}</th>
                  <td
                    v-for="rn in roomGridState.roomNumbers"
                    :key="rn"
                    :class="['grid-cell', roomCellClass(b, rn)]"
                    @click="openRoomDetail(b, rn)"
                    :title="`Block ${b} · Room ${rn}`"
                  >
                    <span v-if="roomStateOf(b, rn)?.currentTenancy" class="cell-content">
                      {{ (roomStateOf(b, rn).currentTenancy.guestName || '').slice(0, 3) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">Loading room data…</div>

          <!-- Room detail side panel -->
          <div v-if="roomGridState.selectedRoom" class="room-detail-panel" @click.self="closeRoomDetail">
            <div class="room-detail-card">
              <div class="panel-header">
                <h4>Block {{ roomGridState.selectedRoom.block }} &middot; Room {{ roomGridState.selectedRoom.room }}</h4>
                <button class="mini-btn-ghost" @click="closeRoomDetail">Close</button>
              </div>
              <div v-if="roomGridState.selectedRoom.data && roomGridState.selectedRoom.data.currentTenancy" class="detail-section">
                <h5>Current tenant</h5>
                <p><strong>{{ roomGridState.selectedRoom.data.currentTenancy.guestName }}</strong>
                  <span v-if="roomGridState.selectedRoom.data.currentTenancy.nameChinese"> ({{ roomGridState.selectedRoom.data.currentTenancy.nameChinese }})</span></p>
                <p>Status: <strong>{{ roomGridState.selectedRoom.data.currentTenancy.status }}</strong></p>
                <p>Config: {{ roomGridState.selectedRoom.data.currentTenancy.roomConfig }}</p>
                <p>Move-in: {{ roomGridState.selectedRoom.data.currentTenancy.moveInDate }}</p>
                <p v-if="roomGridState.selectedRoom.data.currentTenancy.moveOutDate">Move-out: {{ roomGridState.selectedRoom.data.currentTenancy.moveOutDate }}</p>
                <p>Booking: <a href="#" @click.prevent="state.activeTab='bookings'; openBooking(roomGridState.selectedRoom.data.currentTenancy.bookingId); closeRoomDetail()">{{ roomGridState.selectedRoom.data.currentTenancy.bookingId }}</a></p>
              </div>
              <div v-else class="detail-section">
                <p class="empty-note">Vacant room. Assign through a paid booking.</p>
              </div>
              <div v-if="roomGridState.selectedRoom.data?.history?.length" class="detail-section">
                <h5>Past tenancies ({{ roomGridState.selectedRoom.data.history.length }})</h5>
                <ul class="history-list">
                  <li v-for="(h, i) in roomGridState.selectedRoom.data.history.slice(0, 5)" :key="i">
                    {{ h.guestName }} · {{ h.moveInDate }} → {{ h.releasedAt ? h.releasedAt.slice(0,10) : '—' }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        <div v-else-if="state.activeTab === 'rooms'" class="editor-layout">
          <div class="list-panel">
            <div class="panel-header">
              <h3>Room types</h3>
              <button class="mini-btn" @click="addRoom">+ Add room</button>
            </div>
            <button
              v-for="(room, index) in state.data.rooms"
              :key="room.id"
              class="list-item"
              :class="{ active: state.selectedRoomIndex === index }"
              @click="state.selectedRoomIndex = index"
            >
              <span>{{ room.translations.en.name || room.id }}</span>
              <small>#{{ room.sortOrder }}</small>
            </button>
          </div>

          <div v-if="selectedRoom" class="form-panel">
            <div class="item-toolbar">
              <label>
                <span>Primary language</span>
                <select v-model="selectedRoom.primaryLanguage">
                  <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
                </select>
              </label>
              <label>
                <span>Sort order</span>
                <input v-model.number="selectedRoom.sortOrder" type="number" min="1" />
              </label>
              <button class="mini-btn" :disabled="state.translating" @click="translateBlock('room', selectedRoom)">
                {{ state.translating ? 'Translating…' : 'Polish + translate' }}
              </button>
              <button class="danger-btn" @click="deleteRoom(state.selectedRoomIndex)">Delete</button>
            </div>

            <div class="images-box">
              <div class="panel-header">
                <h3>Images</h3>
                <label class="upload-btn">
                  <input type="file" multiple accept="image/*" @change="handleImageUpload(selectedRoom, $event)" />
                  Upload images
                </label>
              </div>
              <p class="image-hint">First image is the cover. Drag handles or use the buttons below to reorder.</p>
              <div class="image-grid">
                <div v-for="(image, idx) in selectedRoom.images" :key="idx" class="image-tile">
                  <span v-if="idx === 0" class="cover-pill">Cover</span>
                  <img :src="image" alt="room image" />
                  <div class="image-actions">
                    <button :disabled="idx === 0" @click="moveImage(selectedRoom, idx, -1)" aria-label="Move left">←</button>
                    <button :disabled="idx === 0" @click="setCoverImage(selectedRoom, idx)">Cover</button>
                    <button :disabled="idx === selectedRoom.images.length - 1" @click="moveImage(selectedRoom, idx, 1)" aria-label="Move right">→</button>
                    <button class="danger" @click="removeImage(selectedRoom, idx)">Remove</button>
                  </div>
                </div>
              </div>
            </div>

            <div v-for="lang in languages" :key="lang.code" class="lang-card">
              <div class="lang-card-head">
                <h3>{{ lang.name }}</h3>
                <span v-if="selectedRoom.primaryLanguage === lang.code" class="pill">Source</span>
              </div>
              <div class="form-grid">
                <label><span>Name</span><input v-model="selectedRoom.translations[lang.code].name" /></label>
                <label><span>Occupancy</span><input v-model="selectedRoom.translations[lang.code].occupancy" /></label>
                <label><span>Size</span><input v-model="selectedRoom.translations[lang.code].size" /></label>
                <label><span>Price</span><input v-model="selectedRoom.translations[lang.code].price" /></label>
                <label><span>Price period</span><input v-model="selectedRoom.translations[lang.code].period" /></label>
                <label class="full"><span>Tagline</span><input v-model="selectedRoom.translations[lang.code].tagline" /></label>
                <label class="full"><span>Description</span><textarea v-model="selectedRoom.translations[lang.code].description" rows="4" /></label>
                <label class="full"><span>Highlight</span><textarea v-model="selectedRoom.translations[lang.code].highlight" rows="3" /></label>
                <label class="full"><span>Features (one per line)</span><textarea :value="featuresAsText(selectedRoom, lang.code)" rows="6" @input="setFeaturesFromText(selectedRoom, lang.code, $event.target.value)" /></label>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="state.activeTab === 'products'" class="editor-layout">
          <div class="list-panel">
            <div class="panel-header">
              <h3>Products</h3>
              <button class="mini-btn" @click="addProduct">+ Add product</button>
            </div>
            <button
              v-for="(product, index) in state.data.products"
              :key="product.id"
              class="list-item"
              :class="{ active: state.selectedProductIndex === index }"
              @click="state.selectedProductIndex = index"
            >
              <span>{{ product.translations.en.name || product.id }}</span>
              <small>#{{ product.sortOrder }}</small>
            </button>
          </div>

          <div v-if="selectedProduct" class="form-panel">
            <div class="item-toolbar">
              <label>
                <span>Primary language</span>
                <select v-model="selectedProduct.primaryLanguage">
                  <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
                </select>
              </label>
              <label>
                <span>Sort order</span>
                <input v-model.number="selectedProduct.sortOrder" type="number" min="1" />
              </label>
              <button class="mini-btn" :disabled="state.translating" @click="translateBlock('product', selectedProduct)">
                {{ state.translating ? 'Translating…' : 'Polish + translate' }}
              </button>
              <button class="danger-btn" @click="deleteProduct(state.selectedProductIndex)">Delete</button>
            </div>

            <div class="images-box">
              <div class="panel-header">
                <h3>Images</h3>
                <label class="upload-btn">
                  <input type="file" multiple accept="image/*" @change="handleImageUpload(selectedProduct, $event)" />
                  Upload images
                </label>
              </div>
              <p class="image-hint">First image is the cover. Use the buttons below to reorder.</p>
              <div class="image-grid">
                <div v-for="(image, idx) in selectedProduct.images" :key="idx" class="image-tile">
                  <span v-if="idx === 0" class="cover-pill">Cover</span>
                  <img :src="image" alt="product image" />
                  <div class="image-actions">
                    <button :disabled="idx === 0" @click="moveImage(selectedProduct, idx, -1)" aria-label="Move left">←</button>
                    <button :disabled="idx === 0" @click="setCoverImage(selectedProduct, idx)">Cover</button>
                    <button :disabled="idx === selectedProduct.images.length - 1" @click="moveImage(selectedProduct, idx, 1)" aria-label="Move right">→</button>
                    <button class="danger" @click="removeImage(selectedProduct, idx)">Remove</button>
                  </div>
                </div>
              </div>
            </div>

            <div v-for="lang in languages" :key="lang.code" class="lang-card">
              <div class="lang-card-head">
                <h3>{{ lang.name }}</h3>
                <span v-if="selectedProduct.primaryLanguage === lang.code" class="pill">Source</span>
              </div>
              <div class="form-grid">
                <label><span>Name</span><input v-model="selectedProduct.translations[lang.code].name" /></label>
                <label><span>Category</span><input v-model="selectedProduct.translations[lang.code].category" /></label>
                <label><span>Price</span><input v-model="selectedProduct.translations[lang.code].price" /></label>
                <label class="full"><span>Description</span><textarea v-model="selectedProduct.translations[lang.code].description" rows="4" /></label>
              </div>
            </div>
          </div>
        </div>

        <!-- =========== LEGAL TAB (Contract + Terms + Privacy + Landlord) =========== -->
        <div v-else-if="state.activeTab === 'legal'" class="legal-tab">
          <div v-if="legalState.loading" class="admin-loading">Loading templates…</div>
          <template v-else-if="legalState.templates">
            <div class="legal-subtabs">
              <button class="sub-tab" :class="{ active: legalState.selectedTab === 'contract' }" @click="legalState.selectedTab = 'contract'">Tenancy contract</button>
              <button class="sub-tab" :class="{ active: legalState.selectedTab === 'terms' }" @click="legalState.selectedTab = 'terms'">House rules &amp; terms</button>
              <button class="sub-tab" :class="{ active: legalState.selectedTab === 'privacy' }" @click="legalState.selectedTab = 'privacy'">Privacy policy (PIPO)</button>
              <button class="sub-tab" :class="{ active: legalState.selectedTab === 'landlord' }" @click="legalState.selectedTab = 'landlord'">Landlord &amp; banking</button>
              <div class="flex-spacer"></div>
              <button class="publish-btn" :disabled="legalState.saving" @click="saveLegal">
                {{ legalState.saving ? 'Saving…' : 'Save changes' }}
              </button>
            </div>

            <!-- Landlord -->
            <div v-if="legalState.selectedTab === 'landlord'" class="site-section">
              <h3>Landlord &amp; banking details</h3>
              <p class="muted">These values are auto-filled into contracts and shown on the payment page.</p>
              <div class="form-grid">
                <label><span>Landlord name</span><input v-model="legalState.templates.landlord.name" /></label>
                <label><span>Landlord address</span><input v-model="legalState.templates.landlord.address" /></label>
                <label><span>Representative</span><input v-model="legalState.templates.landlord.representative" /></label>
                <label><span>Bank</span><input v-model="legalState.templates.landlord.bankName" /></label>
                <label><span>Bank account number</span><input v-model="legalState.templates.landlord.bankAccountNumber" /></label>
                <label><span>Account name</span><input v-model="legalState.templates.landlord.bankAccountName" /></label>
                <label><span>FPS ID</span><input v-model="legalState.templates.landlord.fpsId" /></label>
                <label><span>FPS QR image URL</span><input v-model="legalState.templates.landlord.fpsQrUrl" /></label>
              </div>
            </div>

            <!-- Contract / Terms / Privacy editor -->
            <div v-else class="site-section">
              <div class="site-head">
                <div>
                  <h3>
                    <span v-if="legalState.selectedTab === 'contract'">Tenancy contract template</span>
                    <span v-else-if="legalState.selectedTab === 'terms'">House rules &amp; tenancy terms</span>
                    <span v-else>Privacy policy (PIPO)</span>
                    <span v-if="legalState.selectedTab === 'contract'" class="pill">v{{ legalState.templates.contract?.version || 1 }}</span>
                  </h3>
                  <p class="muted" v-if="legalState.selectedTab === 'contract'">Edit per language. Use placeholders like <code>&#123;&#123;name&#125;&#125;</code> for dynamic fields. Saved templates are versioned automatically; signed contracts record the version used.</p>
                  <p class="muted" v-else-if="legalState.selectedTab === 'terms'">Public page at <code>/legal/terms</code>.</p>
                  <p class="muted" v-else>Public page at <code>/legal/privacy</code>.</p>
                </div>
                <div class="site-actions">
                  <button v-if="legalState.selectedTab === 'contract'" class="mini-btn" :disabled="state.translating" @click="generateContractWithGrok">✨ Generate with Grok</button>
                </div>
              </div>

              <!-- Placeholder chips for contract editor -->
              <div v-if="legalState.selectedTab === 'contract'" class="placeholder-list">
                <p class="muted" style="margin:0 0 0.5rem;">Click to insert placeholder into the editor below:</p>
                <div class="placeholder-chips">
                  <button v-for="p in placeholders" :key="p" class="chip" @click="insertPlaceholder(p)">&#123;&#123;{{ p }}&#125;&#125;</button>
                </div>
              </div>

              <!-- Language tabs -->
              <div class="lang-tabs">
                <button v-for="lang in languages" :key="lang.code" class="sub-tab" :class="{ active: legalState.selectedLang === lang.code }" @click="legalState.selectedLang = lang.code">{{ lang.name }}</button>
                <div class="flex-spacer"></div>
                <label class="upload-btn small">
                  <input type="file" accept=".html,.htm,.txt" @change="(e) => handleLegalUpload(legalState.selectedTab, legalState.selectedLang, e.target.files[0])" />
                  Upload .html/.txt
                </label>
              </div>

              <textarea
                v-model="legalState.templates[legalState.selectedTab][legalState.selectedLang]"
                rows="24"
                class="contract-textarea"
                spellcheck="false"
              ></textarea>

              <details class="preview-block">
                <summary>Preview (rendered HTML)</summary>
                <div class="preview-content" v-html="legalState.templates[legalState.selectedTab][legalState.selectedLang]"></div>
              </details>
            </div>
          </template>
        </div>

        <div v-else class="site-editor">
          <div class="site-section">
            <div class="site-head">
              <div>
                <h3>Hotel hero</h3>
                <p class="muted">Optional hero images + public text.</p>
              </div>
              <div class="site-actions">
                <button class="mini-btn" :disabled="state.translating" @click="translateSiteSection('hotel')">Polish + translate</button>
                <label class="upload-btn">
                  <input type="file" multiple accept="image/*" @change="handleImageUpload(state.data.hotel, $event)" />
                  Upload hero images
                </label>
              </div>
            </div>
            <p class="image-hint">Hero images cycle as a slideshow. First image shows first.</p>
            <div class="image-grid">
              <div v-for="(image, idx) in state.data.hotel.heroImages" :key="`hotel-${idx}`" class="image-tile">
                <span v-if="idx === 0" class="cover-pill">First</span>
                <img :src="image" alt="hotel hero image" />
                <div class="image-actions">
                  <button :disabled="idx === 0" @click="moveImage(state.data.hotel, idx, -1)" aria-label="Move left">←</button>
                  <button :disabled="idx === state.data.hotel.heroImages.length - 1" @click="moveImage(state.data.hotel, idx, 1)" aria-label="Move right">→</button>
                  <button class="danger" @click="removeImage(state.data.hotel, idx)">Remove</button>
                </div>
              </div>
            </div>
            <div v-for="lang in languages" :key="`hotel-${lang.code}`" class="lang-card">
              <div class="lang-card-head">
                <h3>{{ lang.name }}</h3>
                <span v-if="state.data.hotel.primaryLanguage === lang.code" class="pill">Source</span>
              </div>
              <div class="form-grid">
                <label><span>Eyebrow</span><input v-model="state.data.hotel.translations[lang.code].eyebrow" /></label>
                <label><span>Meta location name</span><input v-model="state.data.hotel.translations[lang.code].locationName" /></label>
                <label><span>Hero title line 1</span><input v-model="state.data.hotel.translations[lang.code].heroTitle1" /></label>
                <label><span>Hero title line 2</span><input v-model="state.data.hotel.translations[lang.code].heroTitle2" /></label>
                <label><span>Hero title line 3</span><input v-model="state.data.hotel.translations[lang.code].heroTitle3" /></label>
                <label><span>Section eyebrow</span><input v-model="state.data.hotel.translations[lang.code].spacesEyebrow" /></label>
                <label class="full"><span>Hero sub line 1</span><input v-model="state.data.hotel.translations[lang.code].heroSub1" /></label>
                <label class="full"><span>Hero sub line 2</span><input v-model="state.data.hotel.translations[lang.code].heroSub2" /></label>
                <label><span>Rooms label</span><input v-model="state.data.hotel.translations[lang.code].metaRooms" /></label>
                <label><span>Room types label</span><input v-model="state.data.hotel.translations[lang.code].metaTypes" /></label>
                <label><span>Location label</span><input v-model="state.data.hotel.translations[lang.code].metaLocation" /></label>
                <label><span>Book now</span><input v-model="state.data.hotel.translations[lang.code].bookNow" /></label>
                <label class="full"><span>Spaces title line 1</span><input v-model="state.data.hotel.translations[lang.code].spacesTitle1" /></label>
                <label class="full"><span>Spaces title line 2</span><input v-model="state.data.hotel.translations[lang.code].spacesTitle2" /></label>
                <label class="full"><span>Price note</span><textarea v-model="state.data.hotel.translations[lang.code].priceNote" rows="2" /></label>
                <label><span>CTA eyebrow</span><input v-model="state.data.hotel.translations[lang.code].ctaEyebrow" /></label>
                <label><span>CTA title</span><input v-model="state.data.hotel.translations[lang.code].ctaTitle" /></label>
                <label><span>CTA button</span><input v-model="state.data.hotel.translations[lang.code].ctaButton" /></label>
                <label class="full"><span>CTA subtext</span><textarea v-model="state.data.hotel.translations[lang.code].ctaSub" rows="3" /></label>
              </div>
            </div>
          </div>

          <div class="site-section">
            <div class="site-head">
              <div>
                <h3>Life Here</h3>
                <p class="muted">Activity slideshow (aerial / night / skater / etc).</p>
              </div>
              <div class="site-actions">
                <button class="mini-btn" :disabled="state.translating" @click="translateSiteSection('lifeHere')">Polish + translate</button>
                <label class="upload-btn">
                  <input type="file" multiple accept="image/*" @change="handleImageUpload(state.data.lifeHere, $event)" />
                  Upload images
                </label>
              </div>
            </div>
            <p class="image-hint">First image is shown first. Reorder using the buttons.</p>
            <div class="image-grid">
              <div v-for="(image, idx) in state.data.lifeHere.heroImages" :key="`life-${idx}`" class="image-tile">
                <span v-if="idx === 0" class="cover-pill">First</span>
                <img :src="image" alt="life image" />
                <div class="image-actions">
                  <button :disabled="idx === 0" @click="moveImage(state.data.lifeHere, idx, -1)">←</button>
                  <button :disabled="idx === state.data.lifeHere.heroImages.length - 1" @click="moveImage(state.data.lifeHere, idx, 1)">→</button>
                  <button class="danger" @click="removeImage(state.data.lifeHere, idx)">Remove</button>
                </div>
              </div>
            </div>
            <div v-for="lang in languages" :key="`life-${lang.code}`" class="lang-card">
              <div class="lang-card-head"><h3>{{ lang.name }}</h3></div>
              <div class="form-grid">
                <label><span>Eyebrow</span><input v-model="state.data.lifeHere.translations[lang.code].eyebrow" /></label>
                <label><span>Title line 1</span><input v-model="state.data.lifeHere.translations[lang.code].title1" /></label>
                <label><span>Title line 2</span><input v-model="state.data.lifeHere.translations[lang.code].title2" /></label>
                <label class="full"><span>Description</span><textarea v-model="state.data.lifeHere.translations[lang.code].description" rows="3" /></label>
              </div>
            </div>
          </div>

          <div class="site-section">
            <div class="site-head">
              <div>
                <h3>The Site</h3>
                <p class="muted">Site masterplan map (highlighted nine blocks).</p>
              </div>
              <div class="site-actions">
                <button class="mini-btn" :disabled="state.translating" @click="translateSiteSection('site')">Polish + translate</button>
                <label class="upload-btn">
                  <input type="file" multiple accept="image/*" @change="handleImageUpload(state.data.site, $event)" />
                  Upload images
                </label>
              </div>
            </div>
            <div class="image-grid">
              <div v-for="(image, idx) in (state.data.site?.heroImages || [])" :key="`site-${idx}`" class="image-tile">
                <span v-if="idx === 0" class="cover-pill">First</span>
                <img :src="image" alt="site image" />
                <div class="image-actions">
                  <button :disabled="idx === 0" @click="moveImage(state.data.site, idx, -1)">←</button>
                  <button :disabled="idx === state.data.site.heroImages.length - 1" @click="moveImage(state.data.site, idx, 1)">→</button>
                  <button class="danger" @click="removeImage(state.data.site, idx)">Remove</button>
                </div>
              </div>
            </div>
            <div v-for="lang in languages" :key="`site-${lang.code}`" class="lang-card">
              <div class="lang-card-head"><h3>{{ lang.name }}</h3></div>
              <div class="form-grid">
                <label><span>Eyebrow</span><input v-model="state.data.site.translations[lang.code].eyebrow" /></label>
                <label><span>Title line 1</span><input v-model="state.data.site.translations[lang.code].title1" /></label>
                <label><span>Title line 2</span><input v-model="state.data.site.translations[lang.code].title2" /></label>
                <label class="full"><span>Description</span><textarea v-model="state.data.site.translations[lang.code].description" rows="3" /></label>
              </div>
            </div>
          </div>

          <div class="site-section">
            <div class="site-head">
              <div>
                <h3>Transport</h3>
                <p class="muted">Shuttle bus and public transport. Upload 1–2 images (e.g. CTS bus).</p>
              </div>
              <div class="site-actions">
                <button class="mini-btn" :disabled="state.translating" @click="translateSiteSection('transport')">Polish + translate</button>
                <label class="upload-btn">
                  <input type="file" multiple accept="image/*" @change="handleImageUpload(state.data.transport, $event)" />
                  Upload images
                </label>
              </div>
            </div>
            <div class="image-grid">
              <div v-for="(image, idx) in state.data.transport.heroImages" :key="`transport-${idx}`" class="image-tile">
                <span v-if="idx === 0" class="cover-pill">First</span>
                <img :src="image" alt="transport image" />
                <div class="image-actions">
                  <button :disabled="idx === 0" @click="moveImage(state.data.transport, idx, -1)">←</button>
                  <button :disabled="idx === state.data.transport.heroImages.length - 1" @click="moveImage(state.data.transport, idx, 1)">→</button>
                  <button class="danger" @click="removeImage(state.data.transport, idx)">Remove</button>
                </div>
              </div>
            </div>
            <div v-for="lang in languages" :key="`transport-${lang.code}`" class="lang-card">
              <div class="lang-card-head"><h3>{{ lang.name }}</h3></div>
              <div class="form-grid">
                <label><span>Eyebrow</span><input v-model="state.data.transport.translations[lang.code].eyebrow" /></label>
                <label><span>Title line 1</span><input v-model="state.data.transport.translations[lang.code].title1" /></label>
                <label><span>Title line 2</span><input v-model="state.data.transport.translations[lang.code].title2" /></label>
                <label><span>Shuttle title</span><input v-model="state.data.transport.translations[lang.code].shuttleTitle" /></label>
                <label><span>Public transport title</span><input v-model="state.data.transport.translations[lang.code].publicTitle" /></label>
                <label class="full"><span>Shuttle description</span><textarea v-model="state.data.transport.translations[lang.code].shuttleDescription" rows="2" /></label>
                <label class="full"><span>Public transport description</span><textarea v-model="state.data.transport.translations[lang.code].publicDescription" rows="2" /></label>
              </div>
            </div>
          </div>

          <div class="site-section">
            <div class="site-head">
              <div>
                <h3>Shop hero</h3>
                <p class="muted">Shop titles, intro, note and optional hero images.</p>
              </div>
              <div class="site-actions">
                <button class="mini-btn" :disabled="state.translating" @click="translateSiteSection('shop')">Polish + translate</button>
                <label class="upload-btn">
                  <input type="file" multiple accept="image/*" @change="handleImageUpload(state.data.shop, $event)" />
                  Upload hero images
                </label>
              </div>
            </div>
            <p class="image-hint">Hero images cycle as a slideshow. First image shows first.</p>
            <div class="image-grid">
              <div v-for="(image, idx) in state.data.shop.heroImages" :key="`shop-${idx}`" class="image-tile">
                <span v-if="idx === 0" class="cover-pill">First</span>
                <img :src="image" alt="shop hero image" />
                <div class="image-actions">
                  <button :disabled="idx === 0" @click="moveImage(state.data.shop, idx, -1)" aria-label="Move left">←</button>
                  <button :disabled="idx === state.data.shop.heroImages.length - 1" @click="moveImage(state.data.shop, idx, 1)" aria-label="Move right">→</button>
                  <button class="danger" @click="removeImage(state.data.shop, idx)">Remove</button>
                </div>
              </div>
            </div>
            <div v-for="lang in languages" :key="`shop-${lang.code}`" class="lang-card">
              <div class="lang-card-head"><h3>{{ lang.name }}</h3></div>
              <div class="form-grid">
                <label><span>Eyebrow</span><input v-model="state.data.shop.translations[lang.code].eyebrow" /></label>
                <label><span>All filter</span><input v-model="state.data.shop.translations[lang.code].all" /></label>
                <label><span>Title line 1</span><input v-model="state.data.shop.translations[lang.code].title1" /></label>
                <label><span>Title line 2</span><input v-model="state.data.shop.translations[lang.code].title2" /></label>
                <label><span>Add button</span><input v-model="state.data.shop.translations[lang.code].addToCart" /></label>
                <label class="full"><span>Intro</span><textarea v-model="state.data.shop.translations[lang.code].intro" rows="3" /></label>
                <label class="full"><span>Footer note</span><textarea v-model="state.data.shop.translations[lang.code].note" rows="2" /></label>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Assign room modal — hoisted out of tab-specific renderers so it works from the Bookings tab too -->
      <div v-if="roomGridState.showAssignModal" class="modal-overlay" @click.self="closeAssignModal">
        <div class="modal-card modal-large">
          <div class="panel-header">
            <h4>Assign room to {{ roomGridState.assignTargetBookingId }}</h4>
            <button class="mini-btn-ghost" @click="closeAssignModal">Cancel</button>
          </div>
          <p class="helper">Click a vacant cell. Cells in orange/red are already occupied.</p>

          <div v-if="roomGridState.loading" class="empty-state" style="padding: 2rem;">Loading rooms…</div>
          <div v-else class="room-grid-wrapper assign-grid">
            <table class="room-grid">
              <thead>
                <tr>
                  <th class="grid-corner">Block</th>
                  <th v-for="rn in roomGridState.roomNumbers" :key="rn">{{ rn }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in roomGridState.blocks" :key="b">
                  <th class="grid-block-label">{{ b }}</th>
                  <td
                    v-for="rn in roomGridState.roomNumbers"
                    :key="rn"
                    :class="['grid-cell', roomCellClass(b, rn), { 'cell-selected': roomGridState.assignSelectedBlock === b && roomGridState.assignSelectedRoom === rn }]"
                    @click="selectAssignCell(b, rn)"
                  >
                    <span v-if="roomStateOf(b, rn)?.currentTenancy" class="cell-content">
                      {{ (roomStateOf(b, rn).currentTenancy.guestName || '').slice(0, 2) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="assign-form">
            <div class="form-row">
              <label>Selected</label>
              <strong v-if="roomGridState.assignSelectedBlock">Block {{ roomGridState.assignSelectedBlock }} &middot; Room {{ roomGridState.assignSelectedRoom }}</strong>
              <em v-else>None</em>
            </div>
            <div class="form-row">
              <label>Furniture configuration</label>
              <select v-model="roomGridState.assignRoomConfig">
                <option value="one-bed-studio">One-Bed Studio</option>
                <option value="twin-studio">Twin Studio</option>
              </select>
            </div>
            <div class="form-row">
              <label>Move-out date (optional)</label>
              <input type="date" v-model="roomGridState.assignMoveOutDate" />
            </div>
            <div v-if="roomGridState.assignError" class="form-error" style="margin: 0.75rem 0;">{{ roomGridState.assignError }}</div>
            <div class="form-actions">
              <button class="mini-btn-ghost" @click="closeAssignModal">Cancel</button>
              <button class="mini-btn" :disabled="roomGridState.assigning || !roomGridState.assignSelectedBlock" @click="confirmAssignRoom">
                {{ roomGridState.assigning ? 'Assigning…' : 'Confirm assignment' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Workflow action modal -->
    <div v-if="workflowModal.open" class="modal-overlay" @click="workflowModal.open = false">
      <div class="modal large" @click.stop>
        <h3>
          <template v-if="workflowModal.action === 'send-profile'">Send profile request</template>
          <template v-else-if="workflowModal.action === 'send-contract'">Send tenancy contract</template>
        </h3>
        <div v-if="workflowModal.loading" class="muted">Loading preview…</div>
        <template v-else>
          <p class="muted" style="font-size: 0.85rem;">Subject (auto): <strong>{{ workflowModal.subject }}</strong></p>
          <div class="workflow-link-box">
            <span class="muted">Secure link:</span>
            <code>{{ workflowModal.link }}</code>
          </div>
          <div class="workflow-channel-buttons">
            <button class="mini-btn" @click="copyWorkflowLink">📋 Copy link</button>
            <a v-if="workflowModal.contactMethod === 'whatsapp' || (state.selectedBookingDetail?.whatsappNumber || state.selectedBookingDetail?.phone)" href="#" @click.prevent="openWorkflowWhatsApp" class="mini-btn">💬 Send via WhatsApp ↗</a>
          </div>
          <details class="workflow-custom">
            <summary>Add a personal note (optional)</summary>
            <textarea v-model="workflowModal.customMessage" rows="3" placeholder="Optional note to add to the email body…"></textarea>
          </details>
          <label class="workflow-check">
            <input type="checkbox" v-model="workflowModal.sendEmail" />
            <span>Also send email to <code>{{ state.selectedBookingDetail?.email }}</code></span>
          </label>
          <div class="modal-buttons">
            <button class="btn-ghost" @click="workflowModal.open = false">Cancel</button>
            <button class="workflow-btn primary" :disabled="workflowModal.sending" @click="sendWorkflowFromModal">
              {{ workflowModal.sending ? 'Sending…' : (workflowModal.sendEmail ? 'Confirm &amp; send email →' : 'Confirm (no email) →') }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-shell { min-height: 100vh; display: grid; grid-template-columns: 280px 1fr; background: var(--color-cream); }

/* === Sidebar: dark with neon accents === */
.sidebar {
  padding: 1.8rem 1.4rem;
  background: radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 100%);
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  color: #ffffff;
  position: relative;
}
.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1.5px);
  background-size: 16px 16px;
  pointer-events: none;
}
.sidebar > * { position: relative; z-index: 1; }
.sidebar-brand { display: flex; flex-direction: column; gap: 0.7rem; }
.sidebar-logo-link { display: inline-block; transition: opacity 0.2s ease; }
.sidebar-logo-link:hover { opacity: 0.85; }
.sidebar-logo {
  height: 36px;
  width: auto;
  max-width: 200px;
  filter: drop-shadow(0 0 10px rgba(57,255,20,0.55)) drop-shadow(0 0 18px rgba(57,255,20,0.28));
}
.sidebar .eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.65rem;
  letter-spacing: 0.16em;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  margin: 0;
}
.sidebar .eyebrow-dot {
  width: 7px;
  height: 7px;
  background: #39ff14;
  border-radius: 50%;
  box-shadow: 0 0 8px #39ff14;
}
.sidebar h1 {
  font-size: 1.5rem;
  font-weight: 200;
  color: rgba(255,255,255,0.95);
  margin: 0;
  line-height: 1.15;
}
.sidebar h1 .neon-word {
  color: #39ff14;
  font-weight: 500;
  text-shadow: 0 0 12px rgba(57,255,20,0.55);
}

.tab-list { display: grid; gap: 0.35rem; }
.tab-btn, .logout-btn {
  text-align: left;
  padding: 0.75rem 0.95rem;
  border-radius: 10px;
  color: rgba(255,255,255,0.70);
  background: transparent;
  border: 1px solid transparent;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  transition: all 0.2s ease;
  position: relative;
}
.tab-btn:hover {
  color: #ffffff;
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.08);
}
.tab-btn.active {
  background: rgba(57,255,20,0.10);
  color: #39ff14;
  border-color: rgba(57,255,20,0.40);
  box-shadow: inset 0 0 0 1px rgba(57,255,20,0.10), 0 0 16px rgba(57,255,20,0.12);
  text-shadow: 0 0 8px rgba(57,255,20,0.30);
}
.logout-btn {
  margin-top: auto;
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.6);
  text-align: center;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.logout-btn:hover { color: #ff5fa2; border-color: rgba(255,95,162,0.45); box-shadow: 0 0 14px rgba(255,95,162,0.18); }

.main-panel { padding: 2rem; }
.main-header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1.5rem; }
.header-actions { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; }
.publish-btn, .mini-btn, .danger-btn, .upload-btn { border-radius: 999px; padding: 0.7rem 1rem; font-size: 0.85rem; }
.publish-btn {
  background: #39ff14;
  color: #0d0d0d;
  font-weight: 600;
  border: none;
  box-shadow: 0 0 0 1px rgba(57,255,20,0.4), 0 6px 18px rgba(57,255,20,0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.publish-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 0 1px #39ff14, 0 8px 22px rgba(57,255,20,0.40); }
.publish-btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
.mini-btn, .upload-btn { border: 1px solid var(--color-warm-gray-100); background: var(--color-white); color: var(--color-ink); }
.danger-btn { background: #fff1f0; color: #b42318; }
.editor-layout { display: grid; grid-template-columns: 260px 1fr; gap: 1rem; }
.list-panel, .form-panel, .site-section { background: var(--color-white); border: 1px solid var(--color-warm-gray-100); border-radius: 18px; }
.list-panel { padding: 1rem; height: fit-content; }
.form-panel { padding: 1rem; }
.panel-header, .site-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.list-item { width: 100%; margin-top: 0.6rem; text-align: left; padding: 0.85rem 0.95rem; border-radius: 12px; background: var(--color-cream); display: flex; justify-content: space-between; gap: 1rem; }
.list-item.active { background: var(--color-paper); outline: 1px solid var(--color-warm-gray-300); }
.item-toolbar { display: flex; flex-wrap: wrap; gap: 1rem; align-items: end; margin-bottom: 1rem; }
.item-toolbar label, .form-grid label { display: grid; gap: 0.35rem; }
.item-toolbar span, .form-grid span { font-size: 0.8rem; color: var(--color-warm-gray-700); }
input, select, textarea { width: 100%; padding: 0.8rem 0.9rem; border-radius: 10px; border: 1px solid var(--color-warm-gray-100); background: var(--color-white); color: var(--color-ink); }
textarea { resize: vertical; }
.images-box { margin: 1rem 0 1.2rem; padding: 1rem; background: var(--color-cream); border-radius: 14px; }
.image-hint { font-size: 0.75rem; color: var(--color-warm-gray-500); margin-top: 0.8rem; }
.image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.8rem; margin-top: 0.6rem; }
.image-tile { position: relative; background: var(--color-white); border: 1px solid var(--color-warm-gray-100); border-radius: 12px; overflow: hidden; }
.image-tile img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; }
.image-actions { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--color-warm-gray-100); }
.image-actions button { padding: 0.55rem 0; font-size: 0.75rem; color: var(--color-ink); background: var(--color-white); border-right: 1px solid var(--color-warm-gray-100); }
.image-actions button:last-child { border-right: none; }
.image-actions button:disabled { color: var(--color-warm-gray-300); cursor: not-allowed; }
.image-actions button.danger { color: #b42318; }
.cover-pill { position: absolute; top: 0.5rem; left: 0.5rem; padding: 0.2rem 0.55rem; background: var(--color-ink); color: var(--color-white); font-size: 0.65rem; letter-spacing: 0.08em; border-radius: 999px; text-transform: uppercase; z-index: 1; }
.lang-card { margin-top: 1rem; padding: 1rem; border: 1px solid var(--color-warm-gray-100); border-radius: 16px; }
.lang-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem; }
.form-grid .full { grid-column: 1 / -1; }
.pill { padding: 0.35rem 0.6rem; border-radius: 999px; background: var(--color-paper); font-size: 0.75rem; }
.site-editor { display: grid; gap: 1rem; }
.site-section { padding: 1rem; }
.site-actions { display: flex; gap: 0.8rem; align-items: center; }
.muted { color: var(--color-warm-gray-500); }
.success { color: #067647; }
.error { color: #b42318; }
.admin-loading { min-height: 50vh; display: grid; place-items: center; color: var(--color-warm-gray-700); }
.upload-btn input { display: none; }
@media (max-width: 1100px) {
  .admin-shell, .editor-layout { grid-template-columns: 1fr; }
  .sidebar { border-right: none; border-bottom: 1px solid var(--color-warm-gray-100); }
}
@media (max-width: 700px) {
  .form-grid { grid-template-columns: 1fr; }
  .main-header, .panel-header, .site-head { flex-direction: column; align-items: flex-start; }
}

/* ============== Bookings tab ============== */
.bookings-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 1.5rem;
}
.bookings-list-panel, .booking-detail-panel {
  background: #fff;
  border: 1px solid #e8e6e1;
  border-radius: 6px;
  padding: 1.25rem;
  min-height: 400px;
}
.empty-state { color: #8a8780; padding: 2rem 0; text-align: center; }
.empty-state code { background: #f5f3ee; padding: 2px 6px; border-radius: 3px; }

.bookings-table { display: flex; flex-direction: column; gap: 2px; }
.bookings-table-header, .booking-row {
  display: grid;
  grid-template-columns: minmax(120px, 1.2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr);
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  align-items: center;
  font-size: 0.85rem;
}
.bookings-table-header {
  font-weight: 500;
  color: #8a8780;
  border-bottom: 1px solid #e8e6e1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.7rem;
}
.booking-row {
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  font: inherit;
  color: #2a2826;
}
.booking-row:hover { background: #fafaf7; }
.booking-row.active { background: #f5f3ee; }
.booking-id { font-family: 'SF Mono', Menlo, monospace; font-size: 0.78rem; }

.status-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 99px;
  background: #f0eee9;
  color: #4a4744;
  text-align: center;
  display: inline-block;
  width: fit-content;
}
.status-new { background: #e8f0ff; color: #3a5a8a; }
.status-reviewing { background: #fff4e0; color: #8a6a3a; }
.status-contract-sent { background: #f0e8ff; color: #5a3a8a; }
.status-signed { background: #d8f0d8; color: #3a6a3a; }
.status-paid { background: #d8f0e0; color: #2a6a4a; }
.status-checked-in { background: #c8e8d0; color: #1a5a3a; }
.status-cancelled { background: #f0e0e0; color: #6a3a3a; }

.booking-detail .detail-header { margin-bottom: 1.5rem; }
.booking-detail .detail-header h3 { margin: 0.25rem 0; font-size: 1.5rem; }
.detail-section { margin-bottom: 1.5rem; }
.detail-section h4 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #8a8780;
  margin: 0 0 0.75rem;
  font-weight: 500;
}
.detail-grid { display: flex; flex-direction: column; gap: 0.5rem; }
.detail-grid > div { display: flex; gap: 1rem; font-size: 0.9rem; }
.detail-grid .k { color: #8a8780; min-width: 100px; }
.detail-grid .v { color: #2a2826; flex: 1; }
.detail-grid .v a { color: #4a5a8a; text-decoration: none; }
.detail-grid .v a:hover { text-decoration: underline; }
.message-block {
  background: #fafaf7;
  border-left: 3px solid #c4c1ba;
  padding: 0.75rem 1rem;
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.9rem;
  color: #4a4744;
}
.status-buttons { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.status-btn {
  font: inherit;
  font-size: 0.8rem;
  padding: 0.4rem 0.9rem;
  border: 1px solid #e8e6e1;
  background: #fff;
  border-radius: 99px;
  cursor: pointer;
  color: #4a4744;
}
.status-btn:hover { background: #fafaf7; }
.status-btn.active { background: #2a2826; color: #fff; border-color: #2a2826; }
.status-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.drive-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #fafaf7;
  border: 1px solid #e8e6e1;
  border-radius: 4px;
  color: #2a2826;
  text-decoration: none;
  font-size: 0.85rem;
}
.drive-link:hover { background: #f5f3ee; }
.history-list { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 0.75rem; }
.history-item {
  padding: 0.6rem 0.85rem;
  background: #fafaf7;
  border-radius: 4px;
  font-size: 0.85rem;
}
.history-item .muted { font-size: 0.7rem; display: block; margin-bottom: 0.2rem; }
.note-input { display: flex; flex-direction: column; gap: 0.5rem; }
.note-input textarea {
  font: inherit;
  padding: 0.6rem 0.85rem;
  border: 1px solid #e8e6e1;
  border-radius: 4px;
  resize: vertical;
}
.note-input .mini-btn { align-self: flex-end; }
.email-buttons { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.email-buttons a.mini-btn { text-decoration: none; }
.qr-display { margin-top: 1rem; padding: 1rem; background: #fafaf7; border-radius: 6px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.qr-display img { width: 220px; height: 220px; border: 1px solid #e8e6e1; border-radius: 4px; background: #fff; }

.placeholder-list { background: #fafaf7; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
.placeholder-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.chip { font: inherit; font-size: 0.75rem; padding: 3px 8px; border: 1px solid #c4c1ba; background: #fff; border-radius: 99px; cursor: pointer; font-family: 'SF Mono', Menlo, monospace; }
.chip:hover { background: #f0eee9; }
.full-cols { grid-template-columns: 1fr !important; }
.contract-lang-card { background: #fff; border: 1px solid #e8e6e1; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
.contract-lang-card h4 { margin: 0 0 0.6rem; font-weight: 500; }
.contract-textarea { font-family: 'SF Mono', Menlo, monospace; font-size: 0.78rem; line-height: 1.5; }

@media (max-width: 900px) {
  .bookings-layout { grid-template-columns: 1fr; }
  .bookings-table-header, .booking-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
  }
  .bookings-table-header span:nth-child(n+3),
  .booking-row > span:nth-child(n+3) { font-size: 0.75rem; color: #8a8780; }
}

/* ============== Preferred contact card ============== */
.contact-pref-card {
  display: flex; gap: 0.75rem; align-items: center;
  background: #fafaf2; border: 1px solid #d4cfb8; border-radius: 6px;
  padding: 0.85rem 1rem; margin-bottom: 1rem;
}
.pref-icon { font-size: 1.6rem; }
.pref-info { flex: 1; min-width: 0; }
.pref-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #8a8780; margin: 0 0 0.25rem; }
.pref-value { font-size: 0.95rem; margin: 0; color: #2a2826; word-break: break-all; }
.pref-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.pref-actions a.mini-btn { text-decoration: none; }

/* Workflow card */
.workflow-card {
  background: #2a2826; color: #fff; border-radius: 6px;
  padding: 1rem 1.25rem; margin-bottom: 1.5rem;
}
.workflow-label {
  font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.15em;
  color: rgba(255,255,255,0.6); margin: 0 0 0.6rem;
}
.workflow-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
.workflow-actions .muted { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
.workflow-btn {
  font: inherit; font-size: 0.85rem; padding: 0.6rem 1.1rem;
  background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.3);
  border-radius: 4px; cursor: pointer;
}
.workflow-btn:hover { background: rgba(255,255,255,0.1); }
.workflow-btn.primary { background: #fff; color: #2a2826; border-color: #fff; font-weight: 500; }
.workflow-btn.primary:hover { background: #f5f3ee; }
.workflow-btn.ghost { background: transparent; }
.workflow-btn.danger { color: #ffb0b0; border-color: rgba(255,176,176,0.3); margin-left: auto; }

/* Workflow modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; }
.modal { background: #fff; border-radius: 8px; padding: 2rem; max-width: 480px; width: 100%; }
.modal.large { max-width: 640px; }
.modal h3 { margin: 0 0 1rem; font-weight: 400; }
.modal-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }
.btn-ghost { background: transparent; color: #2a2826; padding: 0.7rem 1.5rem; border: 1px solid #c4c1ba; border-radius: 4px; cursor: pointer; font: inherit; }
.workflow-link-box {
  background: #fafaf7; padding: 0.85rem 1rem; border-radius: 4px;
  margin: 1rem 0; display: flex; flex-direction: column; gap: 0.3rem;
}
.workflow-link-box code { font-size: 0.75rem; word-break: break-all; color: #4a4744; }
.workflow-channel-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.workflow-channel-buttons a.mini-btn { text-decoration: none; }
.workflow-custom { margin: 1rem 0; }
.workflow-custom summary { cursor: pointer; font-size: 0.85rem; color: #4a4744; }
.workflow-custom textarea { width: 100%; margin-top: 0.5rem; padding: 0.6rem; border: 1px solid #e8e6e1; border-radius: 4px; font: inherit; font-size: 0.85rem; }
.workflow-check { display: flex; gap: 0.5rem; align-items: center; font-size: 0.85rem; margin: 1rem 0; cursor: pointer; }
.workflow-check input { width: auto; }
.workflow-check code { background: #fafaf7; padding: 2px 6px; border-radius: 3px; font-size: 0.78rem; }

/* Status badges — new statuses */
.status-profile-sent { background: #e0e8f0; color: #3a5a8a; }
.status-profile-submitted { background: #fff4e0; color: #8a6a3a; }
.status-contract-sent { background: #f0e8ff; color: #5a3a8a; }
.status-signed { background: #d8f0d8; color: #3a6a3a; }
.status-invoice-sent { background: #fdf3e7; color: #8a6a3a; }
.status-awaiting-payment { background: #fdf3e7; color: #8a6a3a; }
.status-paid { background: #c8e8d0; color: #1a5a3a; }
.status-checked-in { background: #a8d8b0; color: #0a3a1a; }

/* Booking row — unread badge */
.booking-row.unread { background: #fdf3e7; }
.booking-row.unread::before { content: '⚡'; margin-right: 4px; color: #d4a76b; }
.tab-badge {
  display: inline-block;
  background: #ff5fa2;
  color: #0d0d0d;
  border-radius: 99px;
  padding: 1px 7px;
  font-size: 0.62rem;
  font-weight: 700;
  margin-left: 6px;
  vertical-align: middle;
  box-shadow: 0 0 10px rgba(255,95,162,0.50);
}

/* ============== Payments tab ============== */
.payments-tab { display: flex; flex-direction: column; gap: 1.5rem; }
.payments-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.summary-tile { background: #fff; border: 1px solid #e8e6e1; border-radius: 6px; padding: 1.25rem; }
.summary-tile.outstanding { border-left: 3px solid #d4a76b; }
.summary-tile.paid { border-left: 3px solid #6ba76b; }
.summary-tile.total { border-left: 3px solid #6b8aa7; }
.summary-tile.count { border-left: 3px solid #c4c1ba; }
.sum-label { margin: 0 0 0.4rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #8a8780; }
.sum-value { margin: 0; font-size: 1.5rem; font-weight: 300; color: #2a2826; }

.payments-controls { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.filter-pills { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.flex-spacer { flex: 1; }
.sub-tab { font: inherit; padding: 0.4rem 0.9rem; cursor: pointer; background: #fff; border: 1px solid #e8e6e1; border-radius: 99px; color: #4a4744; font-size: 0.8rem; }
.sub-tab.active { background: #2a2826; color: #fff; border-color: #2a2826; }
.sub-tab:hover { background: #fafaf7; }
.sub-tab.active:hover { background: #2a2826; }

.payments-table { background: #fff; border: 1px solid #e8e6e1; border-radius: 6px; overflow: hidden; }
.payments-table-header, .payment-row {
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 0.9fr 1fr 1.2fr 1.6fr;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  align-items: center;
  font-size: 0.85rem;
}
.payments-table-header {
  background: #fafaf7; border-bottom: 1px solid #e8e6e1;
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #8a8780;
}
.payment-row { border-bottom: 1px solid #f5f3ee; }
.payment-row:last-child { border-bottom: none; }
.payment-row.urgent { background: #fdf6e3; }
.row-actions { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.mini-btn.danger { color: #b06b6b; }
.mini-btn.danger:hover { background: #fdf3f3; }
.mini-btn.primary-mini { background: #2a2826; color: #fff; border-color: #2a2826; }
.mini-btn.primary-mini:hover { background: #4a4744; }
.mini-btn.ghost { background: transparent; }

.pstat-awaiting { background: #e8f0ff; color: #3a5a8a; }
.pstat-screenshot-uploaded { background: #fff4e0; color: #8a6a3a; }
.pstat-approved { background: #d8f0d8; color: #2a6a3a; }
.pstat-rejected { background: #f0e0e0; color: #6a3a3a; }

/* Payment request creator inside booking detail */
.payment-request-form { margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #e8e6e1; }
.prf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem; }
.payment-request-form label { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.75rem; }
.payment-request-form input { padding: 0.55rem 0.75rem; border: 1px solid #e8e6e1; border-radius: 4px; font: inherit; font-size: 0.9rem; }
.payment-request-form .label-text { font-size: 0.78rem; color: #4a4744; }

.payments-inline { display: flex; flex-direction: column; gap: 0.6rem; }
.payment-inline-row { background: #fafaf7; border-radius: 4px; padding: 0.7rem 0.85rem; font-size: 0.85rem; }
.pir-head { display: flex; gap: 0.6rem; align-items: center; }
.payment-actions { display: flex; gap: 0.4rem; margin-top: 0.5rem; }

/* ============== Legal tab ============== */
.legal-tab { display: flex; flex-direction: column; gap: 1rem; }
.legal-subtabs { display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; }
.lang-tabs { display: flex; gap: 0.4rem; margin: 1rem 0; align-items: center; }
.upload-btn.small { padding: 0.4rem 0.85rem; font-size: 0.8rem; }
.preview-block { background: #fafaf7; border-radius: 4px; padding: 0.75rem 1rem; margin-top: 1rem; }
.preview-block summary { cursor: pointer; font-size: 0.85rem; color: #4a4744; }
.preview-content {
  background: #fff; border: 1px solid #e8e6e1; border-radius: 4px;
  padding: 1.5rem; margin-top: 0.75rem;
  font-size: 0.9rem; line-height: 1.6;
  max-height: 500px; overflow-y: auto;
}
.contract-textarea { width: 100%; font-family: 'SF Mono', Menlo, monospace; font-size: 0.82rem; padding: 1rem; }
.placeholder-list { background: #fafaf7; padding: 0.75rem 1rem; border-radius: 4px; margin: 1rem 0; }
.placeholder-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.chip { font: inherit; font-family: 'SF Mono', Menlo, monospace; font-size: 0.72rem; padding: 0.25rem 0.55rem; background: #fff; border: 1px solid #e8e6e1; border-radius: 4px; cursor: pointer; color: #4a4744; }
.chip:hover { background: #f5f3ee; }
.pill { display: inline-block; background: #e8e6e1; color: #4a4744; font-size: 0.7rem; padding: 2px 8px; border-radius: 99px; margin-left: 0.5rem; }

@media (max-width: 900px) {
  .payments-summary { grid-template-columns: repeat(2, 1fr); }
  .payments-table-header, .payment-row { grid-template-columns: 1fr 1fr; gap: 0.25rem; }
  .payments-table-header span:nth-child(n+3), .payment-row > span:nth-child(n+3) { font-size: 0.75rem; }
  .prf-grid { grid-template-columns: 1fr; }
}
/* =================== Room Grid =================== */
.roomgrid-tab { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1.2rem; overflow-x: auto; }
.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.summary-card { background: #fff; padding: 1rem 1.2rem; border-radius: 12px; border: 1px solid #eee; }
.summary-card .summary-label { font-size: 0.78rem; color: #888; text-transform: uppercase; letter-spacing: 0.04em; }
.summary-card .summary-value { font-size: 1.7rem; font-weight: 600; margin-top: 0.3rem; color: #222; }
.summary-occupied .summary-value { color: #b45309; }
.summary-vacant .summary-value { color: #14743a; }

.archive-bar { background: #fff7e6; border: 1px solid #f0c46a; padding: 0.7rem 1.1rem; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: #6b4500; }
.archive-bar-quiet { background: #f5f5f5; border-color: #ddd; color: #555; }

.legend-row { display: flex; gap: 1.5rem; font-size: 0.85rem; color: #555; }
.legend-item { display: inline-flex; align-items: center; gap: 0.5rem; }
.legend-swatch { width: 18px; height: 18px; border-radius: 4px; display: inline-block; border: 1px solid rgba(0,0,0,0.15); }

.room-grid-wrapper { overflow-x: auto; background: #fff; padding: 0.5rem; border-radius: 12px; border: 1px solid #eee; }
.room-grid { border-collapse: separate; border-spacing: 2px; font-size: 0.7rem; }
.room-grid th { background: #f5efe6; padding: 0.4rem 0.5rem; font-weight: 600; color: #5b4a2e; position: sticky; top: 0; z-index: 1; min-width: 38px; }
.room-grid .grid-corner { background: #e8dcc4; }
.room-grid .grid-block-label { background: #efe5d2; position: sticky; left: 0; z-index: 2; min-width: 50px; text-align: center; }
.grid-cell { width: 38px; height: 30px; cursor: pointer; border-radius: 4px; text-align: center; font-size: 0.65rem; padding: 0 2px; transition: transform 0.1s ease; }
.grid-cell:hover { transform: scale(1.15); box-shadow: 0 2px 6px rgba(0,0,0,0.18); position: relative; z-index: 3; }
.cell-vacant { background: #f4f4f4; color: #aaa; }
.cell-assigned { background: #fde9a8; color: #6b4500; font-weight: 600; }
.cell-checked-in { background: #93d2a4; color: #1d4d2b; font-weight: 700; }
.cell-occupied { background: #f0a878; color: #fff; }
.cell-selected { outline: 3px solid #1f6feb; outline-offset: -1px; }
.cell-content { display: block; line-height: 30px; overflow: hidden; text-overflow: ellipsis; }

.room-detail-panel { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.contract-editor-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem; }
.contract-editor-head h4 { margin: 0; }
.contract-frozen-badge { font-size: 0.75rem; background: #e8e6e1; color: #4a4744; padding: 0.2rem 0.6rem; border-radius: 999px; }
.lang-badge { font-size: 0.7rem; background: #fafaf7; color: #8a8780; padding: 0.2rem 0.6rem; border-radius: 999px; border: 1px solid #e8e6e1; }
.contract-editor-toolbar { display: flex; flex-wrap: wrap; gap: 0.3rem; padding: 0.4rem; background: #f5f3ee; border: 1px solid #e8e6e1; border-bottom: none; border-radius: 4px 4px 0 0; }
.contract-editor-toolbar .mini-btn { padding: 0.3rem 0.7rem; font-size: 0.8rem; }
.contract-editor-toolbar .mini-btn.warning { background: #fff4e6; border-color: #f0c080; color: #8a5a00; }
.contract-editor-toolbar .mini-btn.warning:hover { background: #ffe9c8; }
.contract-editor-body { min-height: 300px; max-height: 600px; overflow-y: auto; padding: 1.25rem 1.5rem; background: #fff; border: 1px solid #e8e6e1; border-radius: 0 0 4px 4px; font-size: 0.9rem; line-height: 1.65; color: #2a2826; }
.contract-editor-body:focus { outline: 2px solid #6b7355; outline-offset: -2px; }
.contract-editor-body.frozen { background: #fafaf7; color: #4a4744; cursor: not-allowed; }
.contract-editor-body h1, .contract-editor-body h2, .contract-editor-body h3 { margin: 1.2rem 0 0.6rem; font-weight: 600; }
.contract-editor-body h1 { font-size: 1.4rem; }
.contract-editor-body h2 { font-size: 1.15rem; }
.contract-editor-body h3 { font-size: 1rem; }
.contract-editor-body p { margin: 0.6rem 0; }
.contract-editor-body ul, .contract-editor-body ol { padding-left: 1.5rem; }
.contract-editor-foot { display: flex; align-items: center; gap: 0.75rem; padding-top: 0.75rem; }
.doc-row { display: flex; gap: 1rem; padding: 0.85rem; background: #fafaf7; border: 1px solid #e8e6e1; border-radius: 6px; margin-bottom: 0.6rem; }
.doc-thumb { width: 80px; height: 80px; background: #fff; border: 1px solid #e8e6e1; border-radius: 4px; overflow: hidden; flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.doc-thumb img { width: 100%; height: 100%; object-fit: cover; }
.doc-thumb:hover { border-color: #8a8780; }
.doc-thumb-contract { font-size: 2rem; cursor: default; background: #fff; color: #4a4744; }
.doc-thumb-contract:hover { border-color: #e8e6e1; }
.doc-meta { flex: 1; min-width: 0; }
.doc-title { font-weight: 500; font-size: 0.9rem; margin-bottom: 0.2rem; }
.doc-sub { font-size: 0.78rem; margin-bottom: 0.15rem; }
.doc-actions { display: flex; gap: 0.4rem; margin-top: 0.5rem; flex-wrap: wrap; }
.doc-actions .mini-btn { font-size: 0.78rem; padding: 0.3rem 0.7rem; text-decoration: none; display: inline-block; }
.doc-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; cursor: zoom-out; }
.doc-lightbox img { max-width: 100%; max-height: 90vh; object-fit: contain; cursor: default; }
.doc-lightbox-close { position: absolute; top: 1.5rem; right: 1.5rem; background: #fff; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 1.3rem; cursor: pointer; }
.room-detail-card { background: #fff; padding: 1.5rem; border-radius: 14px; max-width: 460px; width: 92%; max-height: 80vh; overflow-y: auto; }
.history-list { list-style: none; padding: 0; font-size: 0.85rem; color: #555; }
.history-list li { padding: 0.3rem 0; border-bottom: 1px solid #f0f0f0; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 1rem; }
.modal-card { background: #fff; border-radius: 14px; padding: 1.4rem; max-width: 520px; width: 100%; }
.modal-large { max-width: 1080px; max-height: 90vh; overflow-y: auto; }
.assign-grid { margin: 1rem 0; max-height: 50vh; overflow: auto; }
.assign-form { display: flex; flex-direction: column; gap: 0.7rem; padding-top: 0.5rem; border-top: 1px solid #eee; }
.assign-form .form-row { display: flex; align-items: center; gap: 1rem; }
.assign-form .form-row label { flex: 0 0 180px; font-size: 0.85rem; color: #555; }
.assign-form .form-row select, .assign-form .form-row input { flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem; }
.assign-form .form-actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.5rem; }
.helper { font-size: 0.85rem; color: #777; margin: 0 0 0.5rem; }

.assigned-room-section { background: linear-gradient(135deg, #fef8e7 0%, #fff 100%); border-left: 4px solid #f0c46a; padding-left: 1rem; }
.filter-select { padding: 0.35rem 0.6rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.85rem; }
.workflow-btn.ghost { background: transparent; color: #555; border: 1px solid #ddd; }
.workflow-btn.ghost:hover { background: #f7f7f7; }

@media (max-width: 800px) {
  .summary-row { grid-template-columns: repeat(2, 1fr); }
  .grid-cell { width: 32px; height: 26px; font-size: 0.6rem; }
}
</style>
