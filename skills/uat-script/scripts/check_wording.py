from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import sys
from pathlib import Path

QUOTE = re.compile(r'"([^"]{3,})"')
PLACEHOLDER = re.compile(r'(:[a-z_]+|\{[a-zA-Z_.]+\}|%[sd])')


def source_files(sources: list[Path], suffixes: set[str]) -> list[Path]:
    files: set[Path] = set()
    for base in sources:
        listed = subprocess.run(
            ['git', 'ls-files', '--cached', '--others', '--exclude-standard', '--', '.'],
            cwd=base, capture_output=True, text=True,
        )
        paths = (base / name for name in listed.stdout.splitlines()) if listed.returncode == 0 else base.rglob('*')
        files.update(path for path in paths if path.is_file() and path.suffix in suffixes)
    return sorted(files)


def corpus(sources: list[Path], suffixes: set[str]) -> tuple[str, list[re.Pattern]]:
    texts = [path.read_text(encoding='utf-8', errors='ignore') for path in source_files(sources, suffixes)]
    joined = '\n'.join(texts).replace("\\'", "'")
    templates = []
    for literal in set(re.findall(r"""['"]([^'"\n]*(?::[a-z_]+|\{[a-zA-Z_.]+\}|%[sd])[^'"\n]*)['"]""", joined)):
        parts = PLACEHOLDER.split(literal)
        if sum(len(part) for part in parts if not PLACEHOLDER.fullmatch(part)) < 8:
            continue
        templates.append(re.compile(''.join('.+?' if PLACEHOLDER.fullmatch(part) else re.escape(part) for part in parts)))
    return joined, templates


def main() -> int:
    parser = argparse.ArgumentParser(description='List quoted screen text in UAT checks that the app source no longer contains.')
    parser.add_argument('config', type=Path)
    config_path = parser.parse_args().config
    config = json.loads(config_path.read_text(encoding='utf-8'))
    base = config_path.parent
    wording = config['wording']
    sources = [(base / source).resolve() for source in wording['sources']]
    joined, templates = corpus(sources, set(wording.get('suffixes', ['.php', '.tsx', '.ts', '.js', '.vue', '.html', '.json'])))
    fields = wording.get('fields', ['expected', 'steps'])
    misses = []
    for path in sorted((base / config['cases_dir']).glob('*.csv')):
        with path.open(newline='', encoding='utf-8') as handle:
            for case in csv.DictReader(handle):
                for field in fields:
                    for quote in QUOTE.findall(case.get(field, '')):
                        if quote in joined or any(t.fullmatch(quote) for t in templates):
                            continue
                        misses.append(f'{path.name} {case["id"]} {field}: "{quote}"')
    for miss in misses:
        print(miss)
    print(f'{len(misses)} quoted strings not found in the app source')
    return 1 if misses else 0


if __name__ == '__main__':
    sys.exit(main())
