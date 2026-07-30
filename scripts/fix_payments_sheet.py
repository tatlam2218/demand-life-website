#!/usr/bin/env python3
"""
fix_payments_sheet.py
Provision the Payments sheet with the same tab layout as Bookings:
  - Rename Sheet1 → "All"
  - Create 2026-01 … 2026-12 monthly tabs
  - Write PAYMENTS_HEADER to every tab (bold + frozen row 1)
Safe to re-run: existing tabs are left intact, header is overwritten.
"""

import json, time, subprocess, tempfile, os, urllib.request, urllib.parse, base64

SA_KEY_PATH = '/home/user/uploaded_files/theta-style-477105-p5-79a1ced87e7c.json.txt'
PAYMENTS_SHEET_ID = '1HMFJItlYFBAPe6QiVs4h5N1WT5Pkdh6Q7YykplZCVzY'

PAYMENTS_HEADER = [
    'Payment ID', 'Invoice Number', 'Booking ID', 'Guest Name', 'Amount HKD',
    'Status', 'Type', 'Method',
    'Created At', 'Approved At', 'Approved By',
    'Description', 'Screenshot URL', 'Notes'
]

WANTED_TABS = ['All'] + [f'2026-{str(m).zfill(2)}' for m in range(1, 13)]


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def get_token(sa: dict) -> str:
    now = int(time.time())
    header = b64url(json.dumps({'alg': 'RS256', 'typ': 'JWT'}).encode())
    claim  = b64url(json.dumps({
        'iss': sa['client_email'],
        'scope': 'https://www.googleapis.com/auth/spreadsheets',
        'aud': 'https://oauth2.googleapis.com/token',
        'iat': now, 'exp': now + 3600
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
        'assertion': jwt
    }).encode()
    req = urllib.request.Request(
        'https://oauth2.googleapis.com/token', data=data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())['access_token']


def api(method, url, token, body=None):
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read()), resp.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code


def col_letter(n):
    s = ''
    while n > 0:
        r = (n - 1) % 26; s = chr(65 + r) + s; n = (n - 1) // 26
    return s


def list_tabs(sheet_id, token):
    d, _ = api('GET',
        f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}?fields=sheets.properties',
        token)
    return [(s['properties']['title'], s['properties']['sheetId'])
            for s in d.get('sheets', [])]


def write_header(sheet_id, tab, header, token):
    last = col_letter(len(header))
    url = (f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/'
           f'{urllib.parse.quote(tab)}!A1:{last}1?valueInputOption=USER_ENTERED')
    _, status = api('PUT', url, token, {'values': [header]})
    return status


def bold_freeze(sheet_id, tab_gid, token):
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}:batchUpdate'
    api('POST', url, token, {'requests': [
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
    ]})


def rename_tab(sheet_id, gid, new_name, token):
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}:batchUpdate'
    api('POST', url, token, {'requests': [{'updateSheetProperties': {
        'properties': {'sheetId': gid, 'title': new_name}, 'fields': 'title'
    }}]})


def add_tab(sheet_id, name, token):
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}:batchUpdate'
    d, status = api('POST', url, token, {'requests': [{'addSheet': {'properties': {
        'title': name,
        'gridProperties': {'rowCount': 500, 'columnCount': 20, 'frozenRowCount': 1}
    }}}]})
    if status == 200:
        return d['replies'][0]['addSheet']['properties']['sheetId']
    return None  # already exists


def main():
    with open(SA_KEY_PATH) as f:
        sa = json.load(f)
    print(f'SA: {sa["client_email"]}')
    print('Getting token...')
    token = get_token(sa)
    print('Token OK\n')

    sheet_id = PAYMENTS_SHEET_ID
    tabs = list_tabs(sheet_id, token)
    tab_map = {t[0]: t[1] for t in tabs}
    print(f'Current tabs: {list(tab_map.keys())}')

    # Step 1: rename Sheet1 → All if needed
    if 'All' not in tab_map:
        # find any Sheet* tab
        sheet1 = next((t for t in tabs if t[0].startswith('Sheet')), None)
        if sheet1:
            print(f'Renaming "{sheet1[0]}" → "All"')
            rename_tab(sheet_id, sheet1[1], 'All', token)
            tab_map['All'] = sheet1[1]
            del tab_map[sheet1[0]]
        else:
            # create All from scratch
            gid = add_tab(sheet_id, 'All', token)
            if gid: tab_map['All'] = gid

    # Step 2: create missing monthly tabs
    for tab_name in WANTED_TABS[1:]:  # skip 'All', already handled
        if tab_name not in tab_map:
            print(f'  Creating tab: {tab_name}')
            gid = add_tab(sheet_id, tab_name, token)
            if gid:
                tab_map[tab_name] = gid
            time.sleep(0.25)

    # Step 3: re-read tabs (get fresh gids after creation)
    tabs = list_tabs(sheet_id, token)
    tab_map = {t[0]: t[1] for t in tabs}
    print(f'\nFinal tabs ({len(tabs)}): {list(tab_map.keys())}')

    # Step 4: write headers to every wanted tab
    ok = []
    for tab_name in WANTED_TABS:
        if tab_name in tab_map:
            write_header(sheet_id, tab_name, PAYMENTS_HEADER, token)
            bold_freeze(sheet_id, tab_map[tab_name], token)
            ok.append(tab_name)
            time.sleep(0.15)

    print(f'\n✅ Headers written to {len(ok)} tabs')
    print(f'Sheet URL: https://docs.google.com/spreadsheets/d/{sheet_id}/edit')
    return 0


if __name__ == '__main__':
    import sys; sys.exit(main())
