#!/usr/bin/env python3
"""Build a tracker Google Sheet from a JSON config.

Usage: python3 -I build_tracker.py config.json [--into <spreadsheetId> [--replace]] [--no-samples]
The token comes from SHEETS_TOKEN if set, else from the gsheets-mcp sign-in (~/.config/syafiqkit/google).
Prints the sheet URL and, when the config has an updated or history column, writes onEdit-<tab>.gs next to the config.
"""
import json, os, re, sys, urllib.parse, urllib.request, urllib.error
from pathlib import Path

API = 'https://sheets.googleapis.com/v4/spreadsheets'
HEADER_ROW = 2
FIRST = HEADER_ROW + 1
MAX_COLUMNS = 26
COLOUR = re.compile(r'^#?[0-9A-Fa-f]{6}$')
KNOWN_KEYS = {'title', 'tab', 'locale', 'timezone', 'date_pattern', 'closed_status', 'statuses', 'counts', 'stale_rule', 'columns',
              'sample_rows', 'extra_tabs', 'new_status', 'history_date_pattern', 'unknown_editor_label', 'status_change_line',
              'domain_names', 'table', 'table_name', 'rows'}
KNOWN_COLUMN_KEYS = {'role', 'header', 'kind', 'width', 'values', 'muted'}
KNOWN_COUNT_KEYS = {'label', 'statuses', 'colour', 'overdue', 'span'}


def fail(message):
    sys.exit(f'setup-tracker: {message}')


def call(method, url, body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{method} {url} -> {e.code}: {e.read().decode()[:1500]}')


def rgb(h):
    h = h.lstrip('#')
    return {'red': int(h[0:2], 16) / 255, 'green': int(h[2:4], 16) / 255, 'blue': int(h[4:6], 16) / 255}


def letter(i):
    s = ''
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s


def sheet_ref(title):
    return "'" + title.replace("'", "''") + "'!"


def text(value):
    return '"' + str(value).replace('"', '""') + '"'


def any_of(cell, values):
    return 'OR(' + ','.join(f'{cell}={text(v)}' for v in values) + ')'


def validate(cfg, args):
    if '--into' in args and (args.index('--into') + 1 >= len(args) or args[args.index('--into') + 1].startswith('--')):
        fail('--into needs a spreadsheet id')
    if '--replace' in args and '--into' not in args:
        fail('--replace only works with --into <spreadsheetId>')
    unknown = sorted(set(cfg) - KNOWN_KEYS)
    unknown += sorted({f'columns[].{k}' for c in cfg.get('columns', []) for k in c} - {f'columns[].{k}' for k in KNOWN_COLUMN_KEYS})
    unknown += sorted({f'counts[].{k}' for c in cfg.get('counts', []) for k in c} - {f'counts[].{k}' for k in KNOWN_COUNT_KEYS})
    if unknown:
        print(f'warning: the script does not read {", ".join(unknown)}; build that part by hand or drop the key')
    cols = cfg.get('columns') or fail('config needs "columns"')
    roles = [c.get('role') for c in cols if c.get('role')]
    for needed in ('no', 'ask', 'status'):
        if needed not in roles:
            fail(f'config needs a column with role "{needed}"')
    if len(set(roles)) != len(roles):
        fail('each role may be used by one column only')
    if len(cols) > MAX_COLUMNS:
        fail(f'at most {MAX_COLUMNS} columns')
    for c in cols:
        if 'header' not in c:
            fail(f'every column needs a "header" ({c})')
        if c.get('kind') == 'dropdown' and c.get('role') != 'status' and not c.get('values'):
            fail(f'dropdown column "{c["header"]}" needs "values"')
    statuses = cfg.get('statuses') or fail('config needs "statuses"')
    names = []
    for s in statuses:
        if 'name' not in s or not COLOUR.match(str(s.get('colour', ''))):
            fail(f'every status needs "name" and a six-digit hex "colour" ({s})')
        names.append(s['name'])
    closed = cfg.get('closed_status') or fail('config needs "closed_status" (a status name, or a list of them)')
    closed = [closed] if isinstance(closed, str) else closed
    for name in closed:
        if name not in names:
            fail(f'closed status "{name}" is not in "statuses"')
    if cfg.get('new_status') and cfg['new_status'] not in names:
        fail(f'new_status "{cfg["new_status"]}" is not in "statuses"')
    span = 0
    for c in cfg.get('counts', []):
        if 'label' not in c:
            fail(f'every count needs a "label" ({c})')
        if 'colour' in c and not COLOUR.match(str(c['colour'])):
            fail(f'count "{c["label"]}" colour must be six-digit hex')
        if c.get('overdue'):
            if 'needed' not in roles:
                fail(f'count "{c["label"]}" is an overdue count but no column has role "needed"')
        else:
            for name in c.get('statuses') or fail(f'count "{c["label"]}" needs "statuses" or "overdue": true'):
                if name not in names:
                    fail(f'count "{c["label"]}" names unknown status "{name}"')
        span += c.get('span', 1)
    if span >= MAX_COLUMNS:
        fail('the counts strip is wider than the sheet')
    stale = cfg.get('stale_rule') or []
    for rule in [stale] if isinstance(stale, dict) else stale:
        if not isinstance(rule.get('days'), int):
            fail(f'stale_rule needs a whole number of "days" ({rule})')
        if rule.get('status') not in names:
            fail(f'stale_rule names unknown status "{rule["status"]}"')
        if 'updated' not in roles:
            fail('stale_rule needs a column with role "updated"')
    for t in cfg.get('extra_tabs', []):
        if not t.get('title') or not t.get('header'):
            fail(f'every extra tab needs "title" and "header" ({t})')
    return closed, ([stale] if isinstance(stale, dict) else stale)


def repeat_cell(range_, fmt, fields=None):
    return {'repeatCell': {'range': range_, 'cell': {'userEnteredFormat': fmt},
                           'fields': ','.join(f'userEnteredFormat.{f}' for f in (fields or fmt))}}


def set_size(sh, dimension, index, pixels):
    return {'updateDimensionProperties': {'range': {'sheetId': sh, 'dimension': dimension, 'startIndex': index, 'endIndex': index + 1},
                                          'properties': {'pixelSize': pixels}, 'fields': 'pixelSize'}}


def freeze_rows(sh, count):
    return {'updateSheetProperties': {'properties': {'sheetId': sh, 'gridProperties': {'frozenRowCount': count}}, 'fields': 'gridProperties.frozenRowCount'}}


def format_rule(index, range_, condition, fmt):
    return {'addConditionalFormatRule': {'index': index, 'rule': {'ranges': [range_], 'booleanRule': {'condition': condition, 'format': fmt}}}}


args = sys.argv[1:]
if not args or args[0].startswith('--'):
    fail('usage: build_tracker.py config.json [--into <spreadsheetId> [--replace]] [--no-samples]')
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
    except urllib.error.HTTPError as e:
        fail(f'the gsheets-mcp sign-in in {folder} was refused ({e}); run "gsheets-mcp auth" again, or set SHEETS_TOKEN')
    except (urllib.error.URLError, TimeoutError) as e:
        fail(f'could not reach Google to refresh the sign-in ({e}); check the network and run again')


TOKEN = os.environ.get('SHEETS_TOKEN', '').strip() or token_from_gsheets_signin() or fail(
    'no token: set SHEETS_TOKEN to an OAuth access token with the spreadsheets scope, or sign in once with "gsheets-mcp auth"')
cfg_path = Path(args[0])
cfg = json.loads(cfg_path.read_text())
closed, stale_rules = validate(cfg, args)
into = args[args.index('--into') + 1] if '--into' in args else None
samples = [] if '--no-samples' in args else cfg.get('sample_rows', [])

cols = cfg['columns']
role = {c['role']: i for i, c in enumerate(cols) if c.get('role')}
statuses = cfg['statuses']
tab = cfg.get('tab', 'Tracker')
last_col = len(cols)
timezone = cfg.get('timezone', 'UTC')
created_file = None
added_tab = None
replace_old = None
final_tab = tab
use_table = cfg.get('table', True)
rows_cap = int(cfg.get('rows', 300))
table_end = HEADER_ROW + rows_cap + 1 if use_table else None

try:
    if into:
        sid = into
        meta = call('GET', f'{API}/{sid}?fields=properties(timeZone,locale),sheets.properties(sheetId,title)')
        existing = {s['properties']['title']: s['properties']['sheetId'] for s in meta['sheets']}
        if tab in existing:
            if '--replace' not in args:
                fail(f'tab "{tab}" already exists in {sid}; pick another "tab" name, or add --replace to rebuild it in place (rows typed since the config was written are lost)')
            replace_old, final_tab, tab = existing[tab], tab, f'{tab} (new)'
            if tab in existing:
                fail(f'a leftover tab "{tab}" is in the way; delete it first')
        timezone = meta['properties']['timeZone']
        if samples and meta['properties']['locale'] != cfg.get('locale', 'en_GB'):
            print(f'warning: the sheet\'s locale is {meta["properties"]["locale"]}, so sample dates may be read differently; check them or use --no-samples')
        if cfg.get('extra_tabs'):
            print('warning: extra_tabs are only created with a new spreadsheet; add them by hand')
        sheet_id = call('POST', f'{API}/{sid}:batchUpdate', {'requests': [{'addSheet': {'properties': {'title': tab, 'index': 0}}}]})['replies'][0]['addSheet']['properties']['sheetId']
        added_tab = sheet_id
        extra_tabs, extra_ids = [], {}
    else:
        extra_tabs = cfg.get('extra_tabs', [])
        tabs = [tab] + [t['title'] for t in extra_tabs]
        created = call('POST', API, {'properties': {'title': cfg.get('title', tab), 'locale': cfg.get('locale', 'en_GB'), 'timeZone': timezone},
                                     'sheets': [{'properties': {'title': t, 'index': i}} for i, t in enumerate(tabs)]})
        sid = created_file = created['spreadsheetId']
        ids = {s['properties']['title']: s['properties']['sheetId'] for s in created['sheets']}
        sheet_id = ids[tab]
        extra_ids = {t: ids[t] for t in tabs[1:]}

    q = sheet_ref(tab)

    def column(r):
        L = letter(role[r])
        return f'{q}{L}{FIRST + 1}:{L}'

    S, NO = column('status'), column('no')
    counts = []
    for c in cfg.get('counts', []):
        if c.get('overdue'):
            due = f'{column("needed")},"<"&TODAY(),{NO},"<>"'
            expr = f'COUNTIFS({due})' + ''.join(f'-COUNTIFS({S},{text(name)},{due})' for name in closed)
        else:
            expr = '+'.join(f'COUNTIF({S},{text(s)})' for s in c['statuses'])
        counts.append((c, f'={text(c["label"] + ":  ")}&({expr})'))

    data = [{'range': f'{q}A{FIRST}', 'values': [[c['header'] for c in cols]] + samples}]
    strip_cells, col_cursor = [], 1
    for c, f in counts:
        span = c.get('span', 1)
        data.append({'range': f'{q}{letter(col_cursor)}1', 'values': [[f]]})
        strip_cells.append((col_cursor, col_cursor + span, c.get('colour', 'EFEFEF'), c))
        col_cursor += span
    for t in extra_tabs:
        data.append({'range': f"{sheet_ref(t['title'])}A1", 'values': [t['header']] + ([] if '--no-samples' in args else t.get('sample_rows', []))})
    call('POST', f'{API}/{sid}/values:batchUpdate', {'valueInputOption': 'USER_ENTERED', 'data': data})

    def rng(r0, r1, c0, c1, sh=sheet_id):
        g = {'sheetId': sh, 'startRowIndex': r0, 'startColumnIndex': c0, 'endColumnIndex': c1}
        if r1 is not None:
            g['endRowIndex'] = r1
        return g

    for c in cols:
        if c.get('role') == 'status':
            c['kind'] = 'dropdown'

    body = (FIRST, None)
    reqs = [freeze_rows(sheet_id, FIRST),
            repeat_cell(rng(*body, 0, last_col), {'wrapStrategy': 'WRAP', 'verticalAlignment': 'TOP'}),
            set_size(sheet_id, 'ROWS', 0, 40),
            set_size(sheet_id, 'ROWS', 1, 10),
            set_size(sheet_id, 'ROWS', HEADER_ROW, 30),
            repeat_cell(rng(0, 1, 0, last_col), {'textFormat': {'bold': True, 'fontSize': 12}, 'verticalAlignment': 'MIDDLE'}),
            repeat_cell(rng(HEADER_ROW, FIRST, 0, last_col), {'textFormat': {'bold': True, 'foregroundColor': rgb('222222')}, 'backgroundColor': rgb('F3F3F3'),
                        'verticalAlignment': 'MIDDLE', 'borders': {'bottom': {'style': 'SOLID', 'color': rgb('BBBBBB')}}})]
    for i, c in enumerate(cols):
        reqs.append(set_size(sheet_id, 'COLUMNS', i, c.get('width', 120)))
        if c.get('kind') == 'dropdown':
            values = [s['name'] for s in statuses] if c.get('role') == 'status' else c['values']
            reqs.append({'setDataValidation': {'range': rng(*body, i, i + 1), 'rule': {
                'condition': {'type': 'ONE_OF_LIST', 'values': [{'userEnteredValue': v} for v in values]}, 'strict': True, 'showCustomUi': True}}})
        if c.get('kind') == 'date':
            reqs.append(repeat_cell(rng(*body, i, i + 1), {'numberFormat': {'type': 'DATE', 'pattern': cfg.get('date_pattern', 'dd/mm/yyyy')}}))
        if c.get('muted'):
            reqs.append(repeat_cell(rng(*body, i, i + 1), {'textFormat': {'foregroundColor': rgb('444444')}}, ['textFormat.foregroundColor']))
    for c0, c1, colour, _ in strip_cells:
        if c1 - c0 > 1:
            reqs.append({'mergeCells': {'range': rng(0, 1, c0, c1), 'mergeType': 'MERGE_ALL'}})
        reqs.append(repeat_cell(rng(0, 1, c0, c1), {'backgroundColor': rgb(colour), 'padding': {'left': 10, 'right': 10, 'top': 4, 'bottom': 4}}))

    si = role['status']
    SL = letter(si)
    r = FIRST + 1
    rules = [(rng(*body, si, si + 1), {'type': 'TEXT_EQ', 'values': [{'userEnteredValue': s['name']}]}, {'backgroundColor': rgb(s['colour']), 'textFormat': {'bold': True}}) for s in statuses]
    row_rules = []
    if 'needed' in role:
        NL = letter(role['needed'])
        row_rules.append((f'=AND(${NL}{r}<>"",${NL}{r}<TODAY(),NOT({any_of(f"${SL}{r}", closed)}))', {'backgroundColor': rgb('F4CCCC')}))
    for rule in stale_rules:
        UL = letter(role['updated'])
        row_rules.append((f'=AND(${SL}{r}={text(rule["status"])},${UL}{r}<>"",TODAY()-${UL}{r}>{int(rule["days"])})', {'backgroundColor': rgb('FFE599')}))
    row_rules.append((f'={any_of(f"${SL}{r}", closed)}', {'textFormat': {'foregroundColor': rgb('6B6B6B')}}))
    rules += [(rng(*body, 0, last_col), {'type': 'CUSTOM_FORMULA', 'values': [{'userEnteredValue': formula}]}, fmt) for formula, fmt in row_rules]
    reqs += [format_rule(index, *rule) for index, rule in enumerate(rules)]
    reqs.append({'addProtectedRange': {'protectedRange': {'range': rng(0, FIRST, 0, last_col), 'description': 'Counts and column headings', 'warningOnly': True}}})
    for _, _, _, c in strip_cells:
        if c.get('overdue'):
            continue
        reqs.append({'addFilterView': {'filter': {'title': c['label'], 'range': rng(HEADER_ROW, table_end, 0, last_col),
            'filterSpecs': [{'columnIndex': si, 'filterCriteria': {'hiddenValues': [s['name'] for s in statuses if s['name'] not in c['statuses']] + ['']}}],
            'sortSpecs': [{'dimensionIndex': role.get('needed', role['no']), 'sortOrder': 'ASCENDING'}]}}})
    for t in extra_tabs:
        sh = extra_ids[t['title']]
        reqs.append(freeze_rows(sh, 1))
        reqs.append(repeat_cell(rng(0, 1, 0, len(t['header']), sh), {'textFormat': {'bold': True}}, ['textFormat.bold']))
        reqs += [set_size(sh, 'COLUMNS', i, px) for i, px in enumerate(t.get('widths', []))]
    call('POST', f'{API}/{sid}:batchUpdate', {'requests': reqs})

    table_name = cfg.get('table_name') or re.sub(r'\W+', '_', final_tab).strip('_') or 'Tracker'
    if use_table:
        table_range = rng(HEADER_ROW, table_end, 0, last_col)

        def table_type(c):
            if c.get('kind') == 'dropdown':
                values = [s['name'] for s in statuses] if c.get('role') == 'status' else c['values']
                return {'columnType': 'DROPDOWN', 'dataValidationRule': {'condition': {'type': 'ONE_OF_LIST', 'values': [{'userEnteredValue': v} for v in values]}}}
            if c.get('kind') == 'number':
                return {'columnType': 'DOUBLE'}
            if c.get('kind') == 'date':
                return {'columnType': 'COLUMN_TYPE_UNSPECIFIED'}
            return {'columnType': 'TEXT'}

        white = {'rgbColor': {'red': 1, 'green': 1, 'blue': 1}}
        call('POST', f'{API}/{sid}:batchUpdate', {'requests': [
            {'setDataValidation': {'range': rng(FIRST, HEADER_ROW + rows_cap + 1, 0, last_col)}},
            {'addTable': {'table': {'name': table_name + ('_new' if replace_old is not None else ''), 'range': table_range,
                'rowsProperties': {'headerColorStyle': {'rgbColor': {'red': .953, 'green': .953, 'blue': .953}}, 'firstBandColorStyle': white, 'secondBandColorStyle': white},
                'columnProperties': [dict(columnIndex=i, columnName=c['header'], **table_type(c)) for i, c in enumerate(cols)]}}}]})
        call('POST', f'{API}/{sid}/values:batchUpdate', {'valueInputOption': 'RAW', 'data': [{'range': f'{q}A{FIRST}', 'values': [[c['header'] for c in cols]]}]})
        call('POST', f'{API}/{sid}:batchUpdate', {'requests': [
            {'repeatCell': {'range': rng(HEADER_ROW, FIRST, last_col, last_col + 4), 'cell': {}, 'fields': 'userEnteredValue,userEnteredFormat'}},
            repeat_cell(rng(HEADER_ROW, FIRST, 0, last_col), {'textFormat': {'bold': True, 'foregroundColor': rgb('222222')}}, ['textFormat']),
            set_size(sheet_id, 'ROWS', 1, 34)] + [set_size(sheet_id, 'COLUMNS', i, c.get('width', 120)) for i, c in enumerate(cols)]})

    if replace_old is not None:
        tables = call('GET', f'{API}/{sid}?fields=sheets(properties.sheetId,tables(tableId))')
        swap = [{'deleteSheet': {'sheetId': replace_old}},
                {'updateSheetProperties': {'properties': {'sheetId': sheet_id, 'title': final_tab, 'index': 0}, 'fields': 'title,index'}}]
        for s in tables['sheets']:
            if s['properties']['sheetId'] == sheet_id and s.get('tables'):
                swap.append({'updateTable': {'table': {'tableId': s['tables'][0]['tableId'], 'name': table_name}, 'fields': 'name'}})
        call('POST', f'{API}/{sid}:batchUpdate', {'requests': swap})
        added_tab = None
        tab = final_tab
except Exception as error:
    if added_tab is not None:
        try:
            call('POST', f'{API}/{into}:batchUpdate', {'requests': [{'deleteSheet': {'sheetId': added_tab}}]})
            fail(f'{error}\nThe half-built tab was removed.')
        except RuntimeError as cleanup:
            fail(f'{error}\nRemoving the half-built tab also failed ({cleanup}); delete the "{tab}" tab by hand.')
    if created_file:
        fail(f'{error}\nA half-built spreadsheet was left at https://docs.google.com/spreadsheets/d/{created_file}/edit; delete it from Drive.')
    fail(str(error))

placeholders = {
    '__TAB__': json.dumps(tab), '__FIRST_DATA_ROW__': str(FIRST + 1),
    '__COLUMNS__': json.dumps({k: v + 1 for k, v in role.items()}), '__CLOSED__': json.dumps(closed),
    '__NEW_STATUS__': json.dumps(cfg.get('new_status', '')), '__TZ__': json.dumps(timezone),
    '__HISTORY_DATE__': json.dumps(cfg.get('history_date_pattern', 'dd/MM/yy')),
    '__UNKNOWN_EDITOR__': json.dumps(cfg.get('unknown_editor_label', 'Update')),
    '__DOMAIN_NAMES__': json.dumps(cfg.get('domain_names', {})),
    '__STATUS_LINE__': json.dumps(cfg.get('status_change_line', 'status set to')),
}
gs = Path(__file__).with_name('onEdit.template.gs').read_text()
for key, value in placeholders.items():
    gs = gs.replace(key, value)
print(f'https://docs.google.com/spreadsheets/d/{sid}/edit')
if 'updated' in role or 'history' in role:
    out = cfg_path.parent / f'onEdit-{re.sub(r"[^A-Za-z0-9]+", "-", tab).strip("-") or "tracker"}.gs'
    out.write_text(gs)
    print(f'Apps Script written to {out}')
else:
    print('No Apps Script written: the config has no updated or history column for it to keep')
