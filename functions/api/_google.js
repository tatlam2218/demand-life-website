// Google Service Account helpers for Cloudflare Workers / Pages Functions
// Uses Web Crypto API (RS256) to sign JWTs — no Node deps.

function base64urlEncode(bytes) {
  let bin = ''
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlEncodeString(str) {
  return base64urlEncode(new TextEncoder().encode(str))
}

function pemToArrayBuffer(pem) {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
  const binary = atob(cleaned)
  const buf = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)
  return buf.buffer
}

function getServiceAccount(env) {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured')
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (err) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON: ' + err.message)
  }
}

// Cache the access token in module memory for its lifetime
let cachedToken = null

async function getAccessToken(env, scopes) {
  const scope = scopes.join(' ')
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.scope === scope && cachedToken.expiresAt > now + 60) {
    return cachedToken.token
  }

  const sa = getServiceAccount(env)
  const header = { alg: 'RS256', typ: 'JWT', kid: sa.private_key_id }
  const claim = {
    iss: sa.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }
  const signingInput = `${base64urlEncodeString(JSON.stringify(header))}.${base64urlEncodeString(JSON.stringify(claim))}`

  const keyData = pemToArrayBuffer(sa.private_key)
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput))
  const jwt = `${signingInput}.${base64urlEncode(new Uint8Array(signature))}`

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Google OAuth failed: ${resp.status} ${text}`)
  }
  const data = await resp.json()
  cachedToken = { token: data.access_token, scope, expiresAt: now + data.expires_in }
  return data.access_token
}

// ============== Sheets ==============

export async function sheetsAppendRow(env, sheetId, range, row) {
  const token = await getAccessToken(env, ['https://www.googleapis.com/auth/spreadsheets'])
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: [row] })
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Sheets append failed: ${resp.status} ${text}`)
  }
  return await resp.json()
}

export async function sheetsEnsureHeader(env, sheetId, headerRow) {
  const token = await getAccessToken(env, ['https://www.googleapis.com/auth/spreadsheets'])
  // Read first row
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/A1:Z1`
  const r = await fetch(getUrl, { headers: { authorization: `Bearer ${token}` } })
  if (!r.ok) throw new Error(`Sheets read header failed: ${r.status} ${await r.text()}`)
  const data = await r.json()
  const existing = (data.values && data.values[0]) || []
  const same = existing.length === headerRow.length && existing.every((v, i) => v === headerRow[i])
  if (same) return
  // Write header
  const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/A1:${String.fromCharCode(64 + headerRow.length)}1?valueInputOption=USER_ENTERED`
  const w = await fetch(putUrl, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: [headerRow] })
  })
  if (!w.ok) throw new Error(`Sheets write header failed: ${w.status} ${await w.text()}`)
}

// ============== Drive ==============

// Create a sub-folder inside the parent folder. Returns folder id.
export async function driveCreateFolder(env, parentId, name) {
  const token = await getAccessToken(env, ['https://www.googleapis.com/auth/drive'])
  const resp = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    })
  })
  if (!resp.ok) throw new Error(`Drive folder create failed: ${resp.status} ${await resp.text()}`)
  const data = await resp.json()
  return data.id
}

// Upload binary file (from base64 data URL or raw bytes) to a Drive folder.
// Optionally pass `replaceName` to first delete any existing file with that name in the same folder.
export async function driveUploadFile(env, folderId, name, mimeType, bytes, opts = {}) {
  const token = await getAccessToken(env, ['https://www.googleapis.com/auth/drive'])

  // If a file with same name exists in the folder, delete it first (treat as replace)
  if (opts.replace) {
    try {
      const q = encodeURIComponent(`'${folderId}' in parents and name='${name.replace(/'/g, "\\'")}' and trashed=false`)
      const listResp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
        headers: { authorization: `Bearer ${token}` }
      })
      if (listResp.ok) {
        const list = await listResp.json()
        for (const f of (list.files || [])) {
          await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?supportsAllDrives=true`, {
            method: 'DELETE',
            headers: { authorization: `Bearer ${token}` }
          })
        }
      }
    } catch (err) {
      // best-effort, don't fail upload
    }
  }

  const boundary = '-------demain' + Math.random().toString(36).slice(2)
  const metadata = { name, parents: [folderId] }
  const pre = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`
  const post = `\r\n--${boundary}--`
  const preBytes = new TextEncoder().encode(pre)
  const postBytes = new TextEncoder().encode(post)
  const body = new Uint8Array(preBytes.length + bytes.length + postBytes.length)
  body.set(preBytes, 0)
  body.set(bytes, preBytes.length)
  body.set(postBytes, preBytes.length + bytes.length)
  const resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': `multipart/related; boundary=${boundary}` },
    body
  })
  if (!resp.ok) throw new Error(`Drive upload failed: ${resp.status} ${await resp.text()}`)
  return await resp.json()
}

// Clear all rows except the header (row 1) on ALL tabs of a spreadsheet.
// Also deletes empty/transient tabs (e.g. legacy YYYY-MM monthly tabs) leaving only the canonical ones.
export async function sheetsClearRows(env, sheetId) {
  const token = await getAccessToken(env, ['https://www.googleapis.com/auth/spreadsheets'])

  // 1. Discover all tabs
  const metaResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties.title,sheets.properties.sheetId,sheets.properties.gridProperties`, {
    headers: { authorization: `Bearer ${token}` }
  })
  if (!metaResp.ok) throw new Error(`Sheets meta failed: ${metaResp.status}`)
  const meta = await metaResp.json()
  const tabs = (meta.sheets || []).map(s => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId,
    rows: s.properties.gridProperties?.rowCount || 0
  }))

  let totalCleared = 0
  const deleteRequests = []

  // 2. For each tab: clear rows 2 onward; mark legacy monthly tabs (YYYY-MM) for deletion
  for (const t of tabs) {
    const isLegacyMonthly = /^\d{4}-\d{2}$/.test(t.title)
    if (isLegacyMonthly) {
      // Delete the whole legacy tab — we don't use monthly tabs anymore
      deleteRequests.push({ deleteSheet: { sheetId: t.sheetId } })
      continue
    }
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(t.title)}!A1:Z1000`
    const r = await fetch(readUrl, { headers: { authorization: `Bearer ${token}` } })
    if (!r.ok) continue
    const data = await r.json()
    const rows = data.values || []
    if (rows.length <= 1) continue
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(t.title)}!A2:Z${rows.length}:clear`
    const c = await fetch(clearUrl, { method: 'POST', headers: { authorization: `Bearer ${token}` } })
    if (c.ok) totalCleared += rows.length - 1
  }

  // 3. Bulk-delete legacy monthly tabs (must do this in one batchUpdate so sheetIds stay valid)
  if (deleteRequests.length) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ requests: deleteRequests })
    })
  }

  return totalCleared
}

// Delete all sub-folders (and their files) inside a parent folder.
export async function driveDeleteAllSubfolders(env, parentId) {
  const token = await getAccessToken(env, ['https://www.googleapis.com/auth/drive'])
  const q = encodeURIComponent(`'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`)
  const listResp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
    headers: { authorization: `Bearer ${token}` }
  })
  if (!listResp.ok) throw new Error(`Drive list failed: ${listResp.status}`)
  const list = await listResp.json()
  let count = 0
  for (const f of (list.files || [])) {
    const del = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?supportsAllDrives=true`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` }
    })
    if (del.ok || del.status === 204) count++
  }
  return count
}

// Get public preview / download URL for a Drive file
export async function driveMakeFilePublic(env, fileId) {
  const token = await getAccessToken(env, ['https://www.googleapis.com/auth/drive'])
  // Set permission to anyone with link can view
  const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  })
  return resp.ok
}

// Update an existing row in a Sheet by booking id (column A). Returns true if updated.
// Update a row in a spreadsheet by matching its first-column ID.
// CROSSES ALL TABS: scans every tab in the spreadsheet, updates the matching row in each one
// where it appears (so the same booking shows updated data in both the "All" tab and its monthly tab).
export async function sheetsUpdateRowByBookingId(env, sheetId, bookingId, headerToValue) {
  const token = await getAccessToken(env, ['https://www.googleapis.com/auth/spreadsheets'])
  const colLetter = (n) => {
    let s = ''
    while (n > 0) { const r2 = (n - 1) % 26; s = String.fromCharCode(65 + r2) + s; n = Math.floor((n - 1) / 26) }
    return s
  }

  // 1. List all tabs
  const metaResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties.title`, {
    headers: { authorization: `Bearer ${token}` }
  })
  if (!metaResp.ok) throw new Error(`Sheets meta failed: ${metaResp.status}`)
  const meta = await metaResp.json()
  const tabs = (meta.sheets || []).map(s => s.properties.title)

  let updatedAnywhere = false
  for (const tabName of tabs) {
    // 2. Read this tab
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(tabName)}!A1:Z1000`
    const r = await fetch(readUrl, { headers: { authorization: `Bearer ${token}` } })
    if (!r.ok) continue
    const data = await r.json()
    const rows = data.values || []
    if (rows.length === 0) continue
    const header = rows[0]
    let rowIdx = -1
    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][0] || '') === bookingId) { rowIdx = i; break }
    }
    if (rowIdx === -1) continue

    // 3. Extend header if needed
    let extendedHeader = false
    for (const k of Object.keys(headerToValue)) {
      if (!header.includes(k)) { header.push(k); extendedHeader = true }
    }
    if (extendedHeader) {
      const lastCol = colLetter(header.length)
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(tabName)}!A1:${lastCol}1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ values: [header] })
      })
    }

    // 4. Build + write updated row
    const existingRow = rows[rowIdx]
    const newRow = header.map((h, i) => {
      if (h in headerToValue) return headerToValue[h]
      return existingRow[i] !== undefined ? existingRow[i] : ''
    })
    const lastCol = colLetter(header.length)
    const rowNum = rowIdx + 1
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(tabName)}!A${rowNum}:${lastCol}${rowNum}?valueInputOption=USER_ENTERED`
    const w = await fetch(updateUrl, {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values: [newRow] })
    })
    if (w.ok) updatedAnywhere = true
  }
  return updatedAnywhere
}

export function dataUrlToBytes(dataUrl) {
  const m = /^data:([^;,]+)(?:;base64)?,(.*)$/.exec(dataUrl || '')
  if (!m) return null
  const mime = m[1]
  const isBase64 = /;base64/.test(dataUrl)
  const data = m[2]
  let bytes
  if (isBase64) {
    const bin = atob(data)
    bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  } else {
    bytes = new TextEncoder().encode(decodeURIComponent(data))
  }
  return { mime, bytes }
}
