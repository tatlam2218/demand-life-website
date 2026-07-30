#!/usr/bin/env python3
"""
seed_rooms_sheet.py
Write 504 room rows to the Rooms Google Sheet (Sheet1 tab).
Rooms: 18 blocks × 28 rooms = 504 total.
Mirrors BLOCK_NUMBERS + ROOM_NUMBERS from _rooms.js.
Safe to re-run: clears and rewrites from row 2 onward.
"""

import json, time, subprocess, tempfile, os, urllib.request, urllib.parse, base64

SA_KEY_PATH = '/home/user/uploaded_files/theta-style-477105-p5-79a1ced87e7c.json.txt'

# KV sheet-id:rooms → this sheet ID (confirmed in D1)
ROOMS_SHEET_ID = '1hJFUYD5tEkXzyNF1Aeb71M8PvOOKVjM1qNXIkVjUszo'

# Must match _rooms.js exactly
BLOCK_NUMBERS = [1, 2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24]
ROOM_NUMBERS  = [
    'G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07',
    '101', '102', '103', '104', '105', '106', '107',
    '201', '202', '203', '204', '205', '206', '207',
    '301', '302', '303', '304', '305', '306', '307',
]

# Must match ROOMS_HEADER in _rooms_sheet.js (13 cols)
ROOMS_HEADER = [
    'Room ID', 'Block', 'Room Number', 'Type', 'Status',
    'Floor', 'Capacity', 'Price HKD', 'Amenities',
    'Notes', 'Created At', 'Updated At', 'Active',
]

# ── JWT / token ───────────────────────────────────────────────────────────────

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def get_token(sa: dict) -> str:
    now = int(time.time())
    header = b64url(json.dumps({'alg': 'RS256', 'typ': 'JWT'}).encode())
    claim  = b64url(json.dumps({
        'iss': sa['client_email'],
        'scope': 'https://www.googleapis.com/auth/spreadsheets',
        'aud': 'https://oauth2.googleapis.com/token',
        'iat': now, 'exp': now + 3600,
    }).encode())
    si = f'{header}.{claim}'
    with tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False) as kf:
        kf.write(sa['private_key']); kfn = kf.name
    r = subprocess.run(['openssl', 'dgst', '-sha256', '-sign', kfn],
                       input=si.encode(), capture_output=True)
    os.unlink(kfn)
    jwt = f'{si}.{b64url(r.stdout)}'
    data = urllib.parse.urlencode({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': jwt,
    }).encode()
    req = urllib.request.Request(
        'https://oauth2.googleapis.com/token', data=data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())['access_token']


# ── HTTP helper ───────────────────────────────────────────────────────────────

def api(method, url, token, body=None):
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read()), resp.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code


# ── Sheet helpers ─────────────────────────────────────────────────────────────

def col_letter(n):
    s = ''
    while n > 0:
        r = (n - 1) % 26; s = chr(65 + r) + s; n = (n - 1) // 26
    return s


def get_tab_name(sheet_id, token):
    """Return the title of the first tab."""
    d, _ = api('GET',
        f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}?fields=sheets.properties',
        token)
    sheets = d.get('sheets', [])
    if sheets:
        return sheets[0]['properties']['title'], sheets[0]['properties']['sheetId']
    return 'Sheet1', 0


def clear_range(sheet_id, tab, start_row, token):
    """Clear from start_row onward (keep header)."""
    url = (f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/'
           f'{urllib.parse.quote(tab)}!A{start_row}:Z10000:clear')
    api('POST', url, token)


def write_values(sheet_id, tab, start_row, rows, token):
    last_col = col_letter(len(rows[0]) if rows else 1)
    end_row = start_row + len(rows) - 1
    url = (f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/'
           f'{urllib.parse.quote(tab)}!A{start_row}:{last_col}{end_row}'
           f'?valueInputOption=USER_ENTERED')
    _, status = api('PUT', url, token, {'values': rows})
    return status


def bold_freeze(sheet_id, tab_gid, token):
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}:batchUpdate'
    api('POST', url, token, {'requests': [
        {'repeatCell': {
            'range': {'sheetId': tab_gid, 'startRowIndex': 0, 'endRowIndex': 1},
            'cell': {'userEnteredFormat': {
                'textFormat': {'bold': True},
                'backgroundColor': {'red': 0.88, 'green': 0.93, 'blue': 0.98},
            }},
            'fields': 'userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColor',
        }},
        {'updateSheetProperties': {
            'properties': {'sheetId': tab_gid, 'gridProperties': {'frozenRowCount': 1}},
            'fields': 'gridProperties.frozenRowCount',
        }},
    ]})


# ── Room data builder ─────────────────────────────────────────────────────────

def room_id(block, room):
    return f'{block}-{room}'


def infer_type(room_number):
    """Simple type inference — ground floor vs. upper floors."""
    if room_number.startswith('G'):
        return 'Ground Floor'
    floor = room_number[0]
    return f'Floor {floor}'


def build_rows():
    now = '2026-06-29'
    rows = []
    for block in BLOCK_NUMBERS:
        for room in ROOM_NUMBERS:
            rid = room_id(block, room)
            floor = '0' if room.startswith('G') else room[0]
            rows.append([
                rid,           # Room ID
                str(block),    # Block
                room,          # Room Number
                infer_type(room),  # Type
                'available',   # Status
                floor,         # Floor
                '2',           # Capacity (default)
                '',            # Price HKD (TBD)
                '',            # Amenities
                '',            # Notes
                now,           # Created At
                now,           # Updated At
                'TRUE',        # Active
            ])
    return rows


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    with open(SA_KEY_PATH) as f:
        sa = json.load(f)
    print(f'SA: {sa["client_email"]}')
    print('Getting token...')
    token = get_token(sa)
    print('Token OK\n')

    sheet_id = ROOMS_SHEET_ID
    tab_name, tab_gid = get_tab_name(sheet_id, token)
    print(f'Target tab: "{tab_name}" (gid={tab_gid})')

    # Write header to row 1
    print('Writing header...')
    last_col = col_letter(len(ROOMS_HEADER))
    url = (f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/'
           f'{urllib.parse.quote(tab_name)}!A1:{last_col}1?valueInputOption=USER_ENTERED')
    api('PUT', url, token, {'values': [ROOMS_HEADER]})
    bold_freeze(sheet_id, tab_gid, token)

    # Clear old data rows
    print('Clearing old data rows (A2:Z10000)...')
    clear_range(sheet_id, tab_name, 2, token)
    time.sleep(0.5)

    # Build 504 rows
    rows = build_rows()
    print(f'Seeding {len(rows)} rooms...')

    # Write in batches of 100 to stay within API limits
    BATCH = 100
    for i in range(0, len(rows), BATCH):
        batch = rows[i:i + BATCH]
        start = i + 2  # row 1 = header
        status = write_values(sheet_id, tab_name, start, batch, token)
        print(f'  Rows {start}–{start + len(batch) - 1}: HTTP {status}')
        time.sleep(0.3)

    print(f'\n✅ {len(rows)} rooms written to "{tab_name}" tab')
    print(f'Sheet URL: https://docs.google.com/spreadsheets/d/{sheet_id}/edit')
    return 0


if __name__ == '__main__':
    import sys; sys.exit(main())
