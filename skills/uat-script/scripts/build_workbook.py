from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

STATUSES = ['Not run', 'Pass', 'Fail', 'Waiting']
STATUS_FILL = {'Pass': 'C6EFCE', 'Fail': 'FFC7CE', 'Waiting': 'FFEB9C'}
SEVERITIES = ['Critical', 'High', 'Medium', 'Low']
DEFECT_STATUSES = ['Open', 'Fixed (please retest)', 'Retest passed', 'Closed']
SEVERITY_MEANINGS = [
    ('Critical', 'A role cannot finish a main job, or money, data or privacy is at risk.'),
    ('High', 'A main job works only with a workaround, or a figure or rule is wrong in some cases.'),
    ('Medium', 'Something is wrong but the job can still be done the normal way.'),
    ('Low', 'Wording, layout or appearance.'),
]
STATUS_MEANINGS = [
    ('Not run', 'Not tried yet.'),
    ('Pass', 'What you saw matches the expected result.'),
    ('Fail', 'It did not match. Add a Defects row.'),
    ('Waiting', 'Cannot be tried yet; "Waiting on" says what it needs. It is not a failure.'),
]

HEADER_FILL = PatternFill('solid', fgColor='1F4E78')
HEADER_FONT = Font(bold=True, color='FFFFFF')
TITLE_FONT = Font(bold=True, size=14)
BOLD = Font(bold=True)
WRAP = Alignment(wrap_text=True, vertical='top')
THIN = Side(style='thin', color='BFBFBF')
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

REQUIRED = ['id', 'tab', 'journey', 'login', 'before', 'steps', 'expected', 'manual', 'waiting']


def load_config(path: Path) -> dict:
    config = json.loads(path.read_text(encoding='utf-8'))
    base = path.parent
    for key in ('cases_dir', 'output'):
        config[key] = (base / config[key]).resolve()
    for section in ('requirements', 'quotation'):
        if config.get(section):
            config[section]['file'] = (base / config[section]['file']).resolve()
    return config


def columns(config: dict) -> list[tuple[str, str, int]]:
    cols = [('id', 'ID', 11)]
    if config.get('modules'):
        cols.append(('module', 'Module', 18))
    cols += [
        ('journey', 'What is checked', 28),
        ('login', 'Log in as', 16),
        ('before', 'Before you start', 30),
        ('steps', 'Steps', 50),
        ('expected', 'Expected result', 50),
        ('manual', 'Manual section', 22),
        ('status', 'Status', 11),
        ('waiting', 'Waiting on', 24),
        ('tester', 'Tester', 14),
        ('date', 'Date', 12),
        ('remarks', 'Remarks', 30),
    ]
    if config.get('requirements'):
        label = config['requirements'].get('label', 'Requirement')
        cols += [('req', label, 12), ('scenario', f'{label} scenario', 36)]
    if config.get('quotation'):
        cols.append(('quotation', config['quotation'].get('label', 'Quotation says'), 40))
    cols.append(('revised', 'Revised', 12))
    return cols


def requirement_scenarios(spec: dict) -> dict[str, str]:
    row = re.compile(spec.get('row_pattern', r'^\| \*\*((?:M\d+\.\d+)|(?:C\d{2}))[ *]'))
    marker = spec.get('scenario_marker', '**Scenario:**')
    found: dict[str, str] = {}
    for line in spec['file'].read_text(encoding='utf-8').splitlines():
        match = row.match(line)
        if not match or marker not in line:
            continue
        scenario = line.split(marker, 1)[1].split(' |', 1)[0]
        found.setdefault(match.group(1), scenario.replace('<br>', ' ').strip())
    return found


def read_cases(config: dict) -> list[dict]:
    required = list(REQUIRED)
    if config.get('modules'):
        required.append('module')
    if config.get('requirements'):
        required.append(config['requirements'].get('column', 'req'))
    if config.get('quotation'):
        required.append('quotation')
    cases: list[dict] = []
    for path in sorted(config['cases_dir'].glob('*.csv')):
        with path.open(newline='', encoding='utf-8') as handle:
            reader = csv.DictReader(handle)
            missing = [name for name in required if name not in (reader.fieldnames or [])]
            if missing:
                sys.exit(f'{path.name}: missing columns {missing}')
            cases.extend(reader)
    ids = [case['id'] for case in cases]
    duplicates = sorted({case_id for case_id in ids if ids.count(case_id) > 1})
    if duplicates:
        sys.exit(f'duplicate check IDs: {duplicates}')
    if config.get('modules'):
        unknown = sorted({case['module'] for case in cases} - set(config['modules']))
        if unknown:
            sys.exit(f'unknown modules: {unknown}')
    if config.get('quotation'):
        text = config['quotation']['file'].read_text(encoding='utf-8').replace('**', '')
        paraphrased = [c['id'] for c in cases if not c['quotation'].strip() or c['quotation'].replace('**', '') not in text]
        if paraphrased:
            sys.exit(f'"quotation" empty or not word for word from {config["quotation"]["file"].name}: {paraphrased}')
    return cases


def scenario_text(refs: str, scenarios: dict[str, str]) -> str:
    ids = [ref.strip() for ref in refs.split(',') if ref.strip()]
    unresolved = [ref for ref in ids if ref not in scenarios]
    if unresolved:
        sys.exit(f'requirement IDs with no scenario row: {unresolved}')
    return '\n'.join(f'{ref}: {scenarios[ref]}' for ref in ids)


def numbered_lines(steps: str) -> str:
    return re.sub(r'\s+(?=\d+\) )', '\n', steps.strip())


def set_widths(ws, widths: list[int]) -> None:
    for col, width in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(col)].width = width


def dropdown(values: list[str], allow_blank: bool) -> DataValidation:
    return DataValidation(type='list', formula1='"' + ','.join(values) + '"', allow_blank=allow_blank, showErrorMessage=True)


def header_row(ws, row: int, titles: list[str]) -> None:
    for col, title in enumerate(titles, start=1):
        cell = ws.cell(row=row, column=col, value=title)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = WRAP
        cell.border = BOX


def text_block(ws, row: int, label: str, value: str = '') -> int:
    ws.cell(row=row, column=1, value=label).font = BOLD
    ws.cell(row=row, column=1).alignment = WRAP
    ws.cell(row=row, column=2, value=value).alignment = WRAP
    return row + 1


def build_read_me(wb: Workbook, config: dict) -> None:
    ws = wb.active
    ws.title = 'Read me'
    set_widths(ws, [26, 110])
    ws.cell(row=1, column=1, value=config['title']).font = TITLE_FONT
    row = 3
    for label, value in config.get('read_me', []):
        row = text_block(ws, row, label, value)
    row = text_block(ws, row + 1, 'Status')
    for status, meaning in STATUS_MEANINGS:
        row = text_block(ws, row, status, meaning)
    row = text_block(ws, row + 1, 'Defect severity')
    for severity, meaning in SEVERITY_MEANINGS:
        row = text_block(ws, row, severity, meaning)
    if config.get('connections'):
        row = text_block(ws, row + 1, 'Connections on the test site')
        for name, state in config['connections']:
            row = text_block(ws, row, name, state)


def build_logins(wb: Workbook, config: dict) -> None:
    ws = wb.create_sheet('Logins')
    set_widths(ws, [26, 70])
    header_row(ws, 1, ['Log in as', 'Who this is'])
    for row, (login, notes) in enumerate(config.get('logins', []), start=2):
        ws.cell(row=row, column=1, value=login).alignment = WRAP
        ws.cell(row=row, column=2, value=notes).alignment = WRAP
    ws.cell(row=len(config.get('logins', [])) + 3, column=1, value='Email addresses and passwords are sent separately.').font = BOLD


def build_case_tab(wb: Workbook, title: str, cases: list[dict], cols: list[tuple[str, str, int]], config: dict, scenarios: dict[str, str]) -> None:
    ws = wb.create_sheet(title)
    set_widths(ws, [width for _, _, width in cols])
    header_row(ws, 1, [label for _, label, _ in cols])
    ws.freeze_panes = 'C2'
    req_column = config.get('requirements', {}).get('column', 'req') if config.get('requirements') else None
    for row, case in enumerate(cases, start=2):
        values = {
            **case,
            'steps': numbered_lines(case['steps']),
            'status': 'Waiting' if case['waiting'] else 'Not run',
            'tester': '', 'date': '', 'remarks': '', 'revised': '',
        }
        if req_column:
            values['req'] = case[req_column]
            values['scenario'] = scenario_text(case[req_column], scenarios)
        for col, (key, _, _) in enumerate(cols, start=1):
            cell = ws.cell(row=row, column=col, value=values.get(key, ''))
            cell.alignment = WRAP
            cell.border = BOX
    last = len(cases) + 1
    status_col = get_column_letter([key for key, _, _ in cols].index('status') + 1)
    validation = dropdown(STATUSES, allow_blank=False)
    validation.error = 'Choose Not run, Pass, Fail or Waiting.'
    ws.add_data_validation(validation)
    validation.add(f'{status_col}2:{status_col}{last}')
    for status, colour in STATUS_FILL.items():
        ws.conditional_formatting.add(
            f'A2:{get_column_letter(len(cols))}{last}',
            FormulaRule(formula=[f'${status_col}2="{status}"'], fill=PatternFill('solid', fgColor=colour)),
        )
    ws.auto_filter.ref = f'A1:{get_column_letter(len(cols))}{last}'


def totals_row(ws, row: int, first: int, width: int) -> None:
    ws.cell(row=row, column=1, value='Total').font = BOLD
    for col in range(2, width + 1):
        letter = get_column_letter(col)
        ws.cell(row=row, column=col, value=f'=SUM({letter}{first}:{letter}{row - 1})').font = BOLD


def build_counts(wb: Workbook, title: str, index: int, labels: list[str], formula) -> None:
    ws = wb.create_sheet(title, index=index)
    titles = [title if title != 'Summary' else 'Tab', 'Checks', *STATUSES]
    set_widths(ws, [40] + [11] * (len(titles) - 1))
    header_row(ws, 1, titles)
    ws.freeze_panes = 'A2'
    for row, label in enumerate(labels, start=2):
        ws.cell(row=row, column=1, value=label)
        ws.cell(row=row, column=2, value=formula(row, None))
        for col, status in enumerate(STATUSES, start=3):
            ws.cell(row=row, column=col, value=formula(row, status))
    totals_row(ws, len(labels) + 2, 2, len(titles))


def build_defects(wb: Workbook) -> None:
    ws = wb.create_sheet('Defects')
    cols = [('Defect', 9), ('Check ID', 11), ('Severity', 11), ('What happened', 50), ('Screenshot or file name', 24), ('Reported by', 16), ('Date', 12), ('Status', 18), ('Reply from the team', 40)]
    set_widths(ws, [width for _, width in cols])
    header_row(ws, 1, [name for name, _ in cols])
    ws.freeze_panes = 'A2'
    for row in range(2, 102):
        ws.cell(row=row, column=1, value=f'D{row - 1:03d}')
        for col in range(1, len(cols) + 1):
            ws.cell(row=row, column=col).alignment = WRAP
            ws.cell(row=row, column=col).border = BOX
    severity = dropdown(SEVERITIES, allow_blank=True)
    status = dropdown(DEFECT_STATUSES, allow_blank=True)
    ws.add_data_validation(severity)
    ws.add_data_validation(status)
    severity.add('C2:C101')
    status.add('H2:H101')


def build(config: dict) -> Path:
    cases = read_cases(config)
    cols = columns(config)
    keys = [key for key, _, _ in cols]
    status_col = get_column_letter(keys.index('status') + 1)
    scenarios = requirement_scenarios(config['requirements']) if config.get('requirements') else {}
    order = config.get('tabs') or list(dict.fromkeys(case['tab'] for case in cases))
    present = {case['tab'] for case in cases}
    unknown = sorted(present - set(order))
    if unknown:
        sys.exit(f'unknown tabs: {unknown}')
    tabs = [tab for tab in order if tab in present]

    wb = Workbook()
    build_read_me(wb, config)
    build_logins(wb, config)

    def per_tab(row: int, status: str | None) -> str:
        ref = f"'{tabs[row - 2]}'!{status_col}:{status_col}"
        return f'=COUNTA({ref})-1' if status is None else f'=COUNTIF({ref},"{status}")'

    build_counts(wb, 'Summary', 2, tabs, per_tab)

    if config.get('modules'):
        module_col = get_column_letter(keys.index('module') + 1)

        def per_module(row: int, status: str | None) -> str:
            parts = []
            for tab in tabs:
                modules = f"'{tab}'!{module_col}:{module_col}"
                if status is None:
                    parts.append(f'COUNTIF({modules},$A{row})')
                else:
                    parts.append(f'COUNTIFS({modules},$A{row},\'{tab}\'!{status_col}:{status_col},"{status}")')
            return '=' + '+'.join(parts)

        build_counts(wb, 'Modules', 3, config['modules'], per_module)

    for tab in tabs:
        build_case_tab(wb, tab, [case for case in cases if case['tab'] == tab], cols, config, scenarios)
    build_defects(wb)
    config['output'].parent.mkdir(parents=True, exist_ok=True)
    wb.save(config['output'])
    return config['output']


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Render a UAT workbook from CSV checks and a JSON config.')
    parser.add_argument('config', type=Path)
    print(build(load_config(parser.parse_args().config)))
