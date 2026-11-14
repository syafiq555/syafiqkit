#!/usr/bin/env python3
"""Copy a live tracker's rows back into its JSON config, so a --replace rebuild keeps what people typed.

Usage: python3 -I pull_tracker.py config.json <spreadsheetId> [--dry-run]
Reads the main tab (data from the row under the headings) into sample_rows and each extra tab (data from row 2)
into extra_tabs[].sample_rows, as the sheet displays them. Keeps the config's own JSON indent.
The token comes from SHEETS_TOKEN if set, else from the gsheets-mcp sign-in (~/.config/syafiqkit/google).
"""
import json, os, re, sys, urllib.parse, urllib.request, urllib.error
from pathlib import Path

API = 'https://sheets.googleapis.com/v4/spreadsheets'
FIRST_DATA_ROW = 4
EXTRA_FIRST_DATA_ROW = 2


def fail(msg):
    sys.exit(f'pull_tracker: {msg}')


def token_from_gsheets_signin():
    folder = Path(os.environ.get('GSHEETS_CONFIG_DIR') or Path.home() / '.config' / 'syafiqkit' / 'google')
    try:
        client = json.loads((folder / 'client.json').read_text())
        client = client.get('installed') or client.get('web') or client
        refresh = json.loads((folder / 'refresh.json').read_text())['refresh_token']
        body = urllib.parse.urlencode({'client_id': client['client_id'], 'client_secret': client['client_secret'],
                                       'refresh_token': refresh, 'grant_type': 'refresh_token'}).encode()
    except (OSError, ValueError, KeyError, TypeError, AttributeError):
        return ''
    try:
        with urllib.request.urlopen('https://oauth2.googleapis.com/token', body, timeout=30) as r:
            return json.load(r).get('access_token', '')
    except (urllib.error.URLError, TimeoutError) as e:
        fail(f'could not refresh the gsheets-mcp sign-in in {folder} ({e}); run "gsheets-mcp auth" again, or set SHEETS_TOKEN')


def column_letter(n):
    s = ''
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def read(token, sid, rng):
    url = f'{API}/{sid}/values/{urllib.parse.quote(rng)}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r).get('values', [])
    except urllib.error.HTTPError as e:
        fail(f'reading {rng} failed: {e.code} {e.read().decode()[:300]}')


def rows_from(values, width, old):
    numeric_first = any(isinstance(r[0], int) for r in old if r)
    out = []
    for r in values:
        if not any(str(c).strip() for c in r):
            continue
        r = (r + [''] * width)[:width]
        if numeric_first and re.fullmatch(r'\d+', str(r[0])):
            r[0] = int(r[0])
        out.append(r)
    return out


def indent_of(text):
    m = re.search(r'\n( +)"', text)
    return len(m.group(1)) if m else 2


args = sys.argv[1:]
if len(args) < 2 or args[0].startswith('--'):
    fail('usage: pull_tracker.py config.json <spreadsheetId> [--dry-run]')
cfg_path, sid = Path(args[0]), args[1]
text = cfg_path.read_text()
cfg = json.loads(text)
token = os.environ.get('SHEETS_TOKEN', '').strip() or token_from_gsheets_signin() or fail(
    'no token: set SHEETS_TOKEN, or sign in once with "gsheets-mcp auth"')

width = len(cfg['columns'])
tab = cfg.get('tab') or 'Tracker'
main = rows_from(read(token, sid, f"'{tab}'!A{FIRST_DATA_ROW}:{column_letter(width)}"), width, cfg.get('sample_rows', []))
blank_no = [i + FIRST_DATA_ROW for i, r in enumerate(main) if not str(r[0]).strip()]
report = [f'{tab}: {len(cfg.get("sample_rows", []))} -> {len(main)} rows']
cfg['sample_rows'] = main
for extra in cfg.get('extra_tabs', []):
    w = len(extra['header'])
    rows = rows_from(read(token, sid, f"'{extra['title']}'!A{EXTRA_FIRST_DATA_ROW}:{column_letter(w)}"), w, extra.get('sample_rows', []))
    report.append(f"{extra['title']}: {len(extra.get('sample_rows', []))} -> {len(rows)} rows")
    extra['sample_rows'] = rows

print('\n'.join(report))
if blank_no:
    print(f'warning: rows with no number at sheet rows {blank_no}; number them in the sheet before rebuilding')
if '--dry-run' in args:
    sys.exit(0)
cfg_path.write_text(json.dumps(cfg, indent=indent_of(text), ensure_ascii=False) + '\n')
print(f'wrote {cfg_path}')
