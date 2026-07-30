#!/usr/bin/env python3
"""
init_sheet_headers.py
Write column headers to all 5 dev Google Sheets using the service account key directly.
Also provisions the Bookings sheet with All + 12 monthly tabs (2026-01..2026-12).
"""

import json
import time
import math
import base64
import hashlib
import hmac
import struct
import urllib.request
import urllib.parse
import urllib.error

SA_KEY_PATH = '/home/user/uploaded_files/theta-style-477105-p5-79a1ced87e7c.json.txt'

# Sheet IDs (from KV — verified)
SHEETS = {
    'bookings':       '1asTyVU1Vx0Kwt7g9Fpe_cokku_XcAq6VdllG66iuFcU',
    'rooms':          '1hJFUYD5tEkXzyNF1Aeb71M8PvOOKVjM1qNXIkVjUszo',
    'payments':       '1HMFJItlYFBAPe6QiVs4h5N1WT5Pkdh6Q7YykplZCVzY',
    'shop-orders':    '1ZNnvAJKA5FyGsrnHlrRJu5TonJ7MFoWLZE5AV-Kxih8',
    'shop-inventory': '1w5B7KQlQCc9iADMGbLLf7X9ZtY7ySgHtHW2Wrvqbg_M',
}

HEADERS = {
    'bookings': [
        'Booking ID', 'Created At', 'Status',
        'Name', 'Email', 'Phone', 'Nationality',
        'Room Type', 'Move-in Date', 'Duration', 'Occupancy',
        'Message', 'Source Language',
        'Drive Folder', 'Drive Folder ID',
        'Contact Method', 'WhatsApp Number', 'WeChat ID',
        'Total Outstanding', 'Total Paid', 'Latest Payment Request', 'Latest Payment Status',
        'Contract Signed At', 'Contract Hash', 'Signature Method',
        'Doc Type', 'Doc Number', 'Name (Romanized)', 'Name (Chinese)',
        'Date of Birth', 'Gender', 'Occupation', 'Current Address',
        'Emergency Name', 'Emergency Relation', 'Emergency Phone', 'Emergency Email',
        'Special Requests', 'Signature', 'Details Submitted At', 'AI Assisted',
        'Assigned Block', 'Assigned Room', 'Room Config', 'Assigned At', 'Move-out Date'
    ],
    'rooms': [
        'Room ID', 'Block', 'Room', 'Status',
        'Current Booking ID', 'Current Guest', 'Room Config',
        'Move-in Date', 'Move-out Date', 'Duration', 'Assigned At',
        'History Count', 'Updated At'
    ],
    'payments': [
        'Payment ID', 'Invoice Number', 'Booking ID', 'Guest Name', 'Amount HKD',
        'Status', 'Type', 'Method',
        'Created At', 'Approved At', 'Approved By',
        'Description', 'Screenshot URL', 'Notes'
    ],
    'shop-orders': [
        'Order ID', 'Created At', 'Status',
        'Customer Name', 'Email', 'Phone',
        'Items (JSON)', 'Item Count', 'Subtotal HKD', 'Shipping HKD', 'Total HKD',
        'Payment Method', 'Payment Status', 'Paid At',
        'Shipping Address', 'Country', 'Tracking Number',
        'Shipped At', 'Delivered At', 'Notes'
    ],
    'shop-inventory': [
        'SKU', 'Product Name (EN)', 'Product Name (中)', 'Category',
        'Stock', 'Price HKD', 'Cost HKD',
        'Supplier', 'Variant', 'Last Restocked',
        'Status', 'Notes', 'Image URL', 'Updated At',
        'Description (EN)', 'Description (中)', 'Gallery URLs', 'Materials', 'Dimensions', 'Care Instructions'
    ],
}

# Bookings tabs: "All" + 12 monthly tabs for 2026
BOOKINGS_TABS = ['All'] + [f'2026-{str(m).zfill(2)}' for m in range(1, 13)]


# ── JWT / OAuth2 helpers ──────────────────────────────────────────────────────

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

def make_jwt(sa: dict, scope: str) -> str:
    """Build a signed JWT for Google OAuth2 using the SA private key."""
    import subprocess, tempfile, os

    now = int(time.time())
    header = b64url(json.dumps({'alg': 'RS256', 'typ': 'JWT'}).encode())
    claim = b64url(json.dumps({
        'iss': sa['client_email'],
        'scope': scope,
        'aud': 'https://oauth2.googleapis.com/token',
        'iat': now,
        'exp': now + 3600,
    }).encode())
    signing_input = f'{header}.{claim}'

    # Write private key to temp file for openssl
    with tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False) as f:
        f.write(sa['private_key'])
        keyfile = f.name

    try:
        result = subprocess.run(
            ['openssl', 'dgst', '-sha256', '-sign', keyfile],
            input=signing_input.encode(),
            capture_output=True
        )
        if result.returncode != 0:
            raise RuntimeError(f'openssl failed: {result.stderr.decode()}')
        sig = b64url(result.stdout)
    finally:
        os.unlink(keyfile)

    return f'{signing_input}.{sig}'


def get_access_token(sa: dict, scope: str) -> str:
    jwt = make_jwt(sa, scope)
    data = urllib.parse.urlencode({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': jwt,
    }).encode()
    req = urllib.request.Request(
        'https://oauth2.googleapis.com/token',
        data=data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())['access_token']


def sheets_request(method: str, url: str, token: str, body=None):
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read()), resp.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code


def col_letter(n: int) -> str:
    s = ''
    while n > 0:
        r = (n - 1) % 26
        s = chr(65 + r) + s
        n = (n - 1) // 26
    return s


# ── Sheet operations ──────────────────────────────────────────────────────────

def list_tabs(sheet_id: str, token: str):
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}?fields=sheets.properties'
    data, status = sheets_request('GET', url, token)
    return [(s['properties']['title'], s['properties']['sheetId']) for s in data.get('sheets', [])]


def write_header(sheet_id: str, tab: str, header: list, token: str):
    last_col = col_letter(len(header))
    url = (f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/'
           f'{urllib.parse.quote(tab)}!A1:{last_col}1?valueInputOption=USER_ENTERED')
    body = {'values': [header]}
    _, status = sheets_request('PUT', url, token, body)
    return status


def add_tab(sheet_id: str, tab_name: str, token: str):
    """Add a new tab. If already exists, skip."""
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}:batchUpdate'
    body = {'requests': [{'addSheet': {'properties': {
        'title': tab_name,
        'gridProperties': {'rowCount': 200, 'columnCount': 60, 'frozenRowCount': 1}
    }}}]}
    data, status = sheets_request('POST', url, token, body)
    if status not in (200, 400):  # 400 often means "already exists"
        print(f'    addTab {tab_name}: HTTP {status}')
    return status


def rename_tab(sheet_id: str, tab_gid: int, new_name: str, token: str):
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}:batchUpdate'
    body = {'requests': [{'updateSheetProperties': {
        'properties': {'sheetId': tab_gid, 'title': new_name},
        'fields': 'title'
    }}]}
    _, status = sheets_request('POST', url, token, body)
    return status


def bold_freeze_header(sheet_id: str, tab_gid: int, token: str):
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}:batchUpdate'
    body = {'requests': [
        {'repeatCell': {
            'range': {'sheetId': tab_gid, 'startRowIndex': 0, 'endRowIndex': 1},
            'cell': {'userEnteredFormat': {
                'textFormat': {'bold': True},
                'backgroundColor': {'red': 0.96, 'green': 0.94, 'blue': 0.89}
            }},
            'fields': 'userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColor'
        }},
        {'updateSheetProperties': {
            'properties': {'sheetId': tab_gid, 'gridProperties': {'frozenRowCount': 1}},
            'fields': 'gridProperties.frozenRowCount'
        }}
    ]}
    _, status = sheets_request('POST', url, token, body)
    return status


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    with open(SA_KEY_PATH) as f:
        sa = json.load(f)

    print(f'Service account: {sa["client_email"]}')
    print('Obtaining access token...')
    token = get_access_token(sa, 'https://www.googleapis.com/auth/spreadsheets')
    print('Token obtained.\n')

    results = {}

    for sheet_type, sheet_id in SHEETS.items():
        header = HEADERS[sheet_type]
        print(f'── {sheet_type} ({sheet_id}) ──')

        tabs = list_tabs(sheet_id, token)
        tab_titles = [t[0] for t in tabs]
        tab_map = {t[0]: t[1] for t in tabs}
        print(f'  Current tabs: {tab_titles}')

        if sheet_type == 'bookings':
            # Special: ensure All + 12 monthly tabs
            # If only "Sheet1" exists, rename it to "All"
            if 'All' not in tab_titles and len(tabs) == 1 and tabs[0][0].startswith('Sheet'):
                print(f'  Renaming "{tabs[0][0]}" → "All"')
                rename_tab(sheet_id, tabs[0][1], 'All', token)
                tab_map['All'] = tabs[0][1]
                tab_titles = ['All']

            # Create any missing tabs
            for want in BOOKINGS_TABS:
                if want not in tab_titles:
                    print(f'  Creating tab: {want}')
                    add_tab(sheet_id, want, token)
                    time.sleep(0.3)  # avoid rate limits

            # Re-read tabs after creation
            tabs = list_tabs(sheet_id, token)
            tab_map = {t[0]: t[1] for t in tabs}

            # Write header to every tab
            ok_tabs = []
            for tab_name in BOOKINGS_TABS:
                if tab_name in tab_map:
                    status = write_header(sheet_id, tab_name, header, token)
                    bold_freeze_header(sheet_id, tab_map[tab_name], token)
                    ok_tabs.append(tab_name)
                    time.sleep(0.2)

            print(f'  ✅ Headers written to {len(ok_tabs)} tabs: {ok_tabs}')
            results[sheet_type] = {'ok': True, 'tabs': ok_tabs, 'columns': len(header)}

        else:
            # Simple sheet: write header to first tab
            if not tabs:
                print(f'  ⚠️  No tabs found — skipping')
                results[sheet_type] = {'ok': False, 'error': 'no tabs'}
                continue

            first_tab, first_gid = tabs[0]
            # If only "Sheet1" exists, leave the name; just write the header
            status = write_header(sheet_id, first_tab, header, token)
            bold_freeze_header(sheet_id, first_gid, token)
            print(f'  ✅ Header written to "{first_tab}" (HTTP {status}), {len(header)} columns')
            results[sheet_type] = {'ok': True, 'tab': first_tab, 'columns': len(header)}

        print()

    print('\n══ Summary ══')
    all_ok = True
    for k, v in results.items():
        status = '✅' if v.get('ok') else '❌'
        print(f'  {status} {k}: {v}')
        if not v.get('ok'):
            all_ok = False

    print(f'\nAll OK: {all_ok}')
    return 0 if all_ok else 1


if __name__ == '__main__':
    import sys
    sys.exit(main())
