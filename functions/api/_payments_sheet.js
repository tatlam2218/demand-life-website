// Helpers for the Payments spreadsheet: ensures the "All" tab + 12 monthly tabs exist.
// Mirrors the layout used by Bookings (see _sheets_monthly.js).

const ALL_TAB = 'All'

function monthTabName(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
function monthlyTabsForYear(year) {
  const y = year || new Date().getUTCFullYear()
  return Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`)
}

async function token(env) {
  const { sheetsAccessToken } = await import('./_google_internal.js')
  return sheetsAccessToken(env)
}

async function listTabs(env, sheetId) {
  const t = await token(env)
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties.title,sheets.properties.sheetId`, {
    headers: { authorization: `Bearer ${t}` }
  })
  if (!r.ok) throw new Error(`listTabs failed: ${r.status}`)
  const data = await r.json()
  return (data.sheets || []).map(s => ({ title: s.properties.title, sheetId: s.properties.sheetId }))
}

async function addTabWithHeader(env, sheetId, name, header) {
  const t = await token(env)
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: name, gridProperties: { rowCount: 500, columnCount: 30, frozenRowCount: 1 } } } }] })
  })
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(name)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: [header] })
  })
}

// Ensure: "All" tab + 12 monthly tabs for the current year. Rename Sheet1 -> All if applicable.
// Returns { all: 'All', monthTab: 'YYYY-MM', monthly: [...12] }
export async function ensurePaymentsTabs(env, sheetId, header) {
  const tabs = await listTabs(env, sheetId)
  const titles = new Set(tabs.map(t => t.title))
  const t = await token(env)

  // If there's only a generic Sheet1, rename it to "All" rather than orphaning it.
  if (!titles.has(ALL_TAB) && tabs.length === 1 && /^Sheet\d*$/i.test(tabs[0].title)) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        requests: [{ updateSheetProperties: { properties: { sheetId: tabs[0].sheetId, title: ALL_TAB }, fields: 'title' } }]
      })
    })
    titles.add(ALL_TAB)
    // Ensure the renamed tab has a header row.
    const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(ALL_TAB)}!A1:Z1`, {
      headers: { authorization: `Bearer ${t}` }
    })
    const dat = r.ok ? await r.json() : { values: [] }
    if (!(dat.values || []).length) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(ALL_TAB)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: 'POST',
        headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
        body: JSON.stringify({ values: [header] })
      })
    }
  }

  const monthly = monthlyTabsForYear()
  const wanted = [ALL_TAB, ...monthly]
  for (const name of wanted) {
    if (!titles.has(name)) {
      await addTabWithHeader(env, sheetId, name, header)
    }
  }

  return { all: ALL_TAB, monthTab: monthTabName(), monthly }
}
