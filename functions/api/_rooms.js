// Physical room registry
// 18 blocks × 28 rooms = 504 rooms
// Block numbers are skipped/non-sequential (matches the campus map exactly).

export const BLOCK_NUMBERS = [
  1, 2, 3, 4, 5, 6,         // Between 第一街 and 第二街
  11, 12, 13, 14, 15, 16,   // Between 第二街 and 第三街
  19, 20, 21, 22, 23, 24    // Between 第三街 and 第四街
]

export const ROOM_NUMBERS = [
  'G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07',
  '101', '102', '103', '104', '105', '106', '107',
  '201', '202', '203', '204', '205', '206', '207',
  '301', '302', '303', '304', '305', '306', '307'
]

export function roomId(block, room) {
  return `block-${block}-room-${room}`
}

export function listAllRooms() {
  const rooms = []
  for (const b of BLOCK_NUMBERS) {
    for (const r of ROOM_NUMBERS) {
      rooms.push({ id: roomId(b, r), block: b, room: r })
    }
  }
  return rooms
}

// =========== Room state in KV ===========
//
// KV key:   room:<roomId>
// KV value: {
//   id: 'block-1-room-101',
//   block: 1, room: '101',
//   currentTenancy: null | { bookingId, guestName, moveInDate, moveOutDate, roomConfig, status, assignedAt },
//   history: [ {bookingId, ...} ]    // past tenancies (capped at 50)
// }

export async function getRoom(env, id) {
  const stored = await env.DEMAIN_DATA.get(`room:${id}`, 'json')
  if (stored) return stored
  // Lazy init: parse block/room from id
  const m = id.match(/^block-(\d+)-room-(.+)$/)
  if (!m) return null
  return {
    id,
    block: parseInt(m[1], 10),
    room: m[2],
    currentTenancy: null,
    history: []
  }
}

export async function saveRoom(env, room) {
  await env.DEMAIN_DATA.put(`room:${room.id}`, JSON.stringify(room))
}

// Load all 504 rooms (with their current state).
// Heavy operation — call once per dashboard render, not per booking.
export async function loadAllRoomsWithState(env) {
  const all = listAllRooms()
  const results = []
  // Parallelize in batches of 50 (KV limit ~1000 concurrent OK but safer)
  for (let i = 0; i < all.length; i += 50) {
    const batch = all.slice(i, i + 50)
    const fetched = await Promise.all(batch.map((r) => getRoom(env, r.id)))
    results.push(...fetched.map((r, idx) => r || batch[idx]))
  }
  return results
}

// Find which booking has this room currently assigned (search bookings index).
// Used for cross-check / repair scenarios.
export async function findActiveTenancyByRoomId(env, id) {
  const indexRaw = await env.DEMAIN_DATA.get('booking-index', 'json')
  const index = Array.isArray(indexRaw) ? indexRaw : []
  for (const idx of index) {
    const b = await env.DEMAIN_DATA.get(`booking:${idx.id}`, 'json')
    if (!b) continue
    if (b.assignedRoom && b.assignedRoom.id === id && ['ready-for-checkin','checked-in'].includes(b.status)) {
      return b
    }
  }
  return null
}
