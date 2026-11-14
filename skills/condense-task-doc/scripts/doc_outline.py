import argparse
import re
import sys
from collections import Counter
from pathlib import Path

HEADING = re.compile(r'^(#{1,6}) (.+?)(?:\s+#+)?\s*$')
SETEXT = re.compile(r'^(=+|-+)\s*$')
NOT_PARAGRAPH = ('|', '-', '*', '+', '>', '#')
ORDERED_ITEM = re.compile(r'^\d+[.)] ')
NUMBERED = re.compile(r'^\*\*((\d+(?:\.\d+)*)\.? [^*]+)\*\*')
BOLD_LINE = re.compile(r'^\*\*([^*]+?)\*\*\s*$')
FENCE = re.compile(r'^\s*(```|~~~)')
LEAF = 9


def is_label(text, label_counts, labels):
    lowered = text.lower()
    if lowered.startswith(tuple(p.lower() for p in labels)):
        return True
    return text.endswith(':') and label_counts[text] > 1


def landmarks(lines, groups, labels):
    in_fence = False
    candidates = []
    first_body_line = 1
    if lines and lines[0].strip() == '---':
        closing = next((i for i, line in enumerate(lines[1:], 2) if line.strip() in ('---', '...')), None)
        first_body_line = closing + 1 if closing else 1
    for number, line in enumerate(lines, 1):
        if number < first_body_line:
            continue
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if not in_fence:
            candidates.append((number, line))
    label_counts = Counter(m.group(1).strip() for _, line in candidates if (m := BOLD_LINE.match(line)))
    setext = {}
    for (prev_number, prev), (number, line) in zip(candidates, candidates[1:]):
        underline = SETEXT.match(line)
        paragraph = prev.strip() and not prev.lstrip().startswith(NOT_PARAGRAPH) and not ORDERED_ITEM.match(prev.lstrip())
        if underline and prev_number == number - 1 and paragraph:
            setext[prev_number] = 1 if underline.group(1).startswith('=') else 2
    has_headings = bool(setext) or any(HEADING.match(line) for _, line in candidates)
    numbered_base = 7 if has_headings else (2 if groups else 1)
    found = []
    for number, line in candidates:
        if number in setext:
            found.append((number, line.strip(), setext[number]))
            continue
        if number - 1 in setext:
            continue
        heading = HEADING.match(line)
        if heading:
            found.append((number, heading.group(2).strip(), len(heading.group(1))))
            continue
        numbered = NUMBERED.match(line)
        bare = numbered or BOLD_LINE.match(line)
        if not bare:
            continue
        text = bare.group(1).strip()
        if is_label(text, label_counts, labels):
            continue
        if text.startswith(tuple(groups)):
            found.append((number, text.rstrip(':'), 1))
        elif numbered:
            found.append((number, text, numbered_base + numbered.group(2).count('.')))
        else:
            found.append((number, text.rstrip(':'), LEAF))
    return found


def kilobytes(lines, start, end):
    return f'{sum(len(line.encode()) + 1 for line in lines[start - 1:end]) / 1000:.1f}'


def render(lines, source, command, groups, labels):
    marks = landmarks(lines, groups, labels)
    total = len(lines)
    top = min((level for _, _, level in marks), default=LEAF)
    rows = []
    if marks and marks[0][0] > 1:
        rows.append(f'| 1-{marks[0][0] - 1} | {kilobytes(lines, 1, marks[0][0] - 1)} | (before the first section) |')
    for index, (start, title, level) in enumerate(marks):
        later = [m[0] for m in marks[index + 1:] if m[2] <= level]
        end = later[0] - 1 if later else total
        cells = (f'{start}-{end}', kilobytes(lines, start, end), title)
        if level == top and top < LEAF:
            cells = tuple(f'**{c}**' for c in cells)
        rows.append('| ' + ' | '.join(cells) + ' |')
    return '\n'.join([
        f'# Outline of {source.name}',
        '',
        f'Generated from `{source.name}` ({total} lines, {kilobytes(lines, 1, total)} KB); never hand-edit. Regenerate with `{command}`. Bold rows are the top-level parts and span every row under them. Read one part with `sed -n \'START,ENDp\' {source.name}`.',
        '',
        '| Lines | KB | Section |',
        '|---|---|---|',
        *rows,
        '',
    ])


def main(argv):
    parser = argparse.ArgumentParser(description='Write a line-range outline beside a large markdown file that must stay whole.')
    parser.add_argument('source', type=Path)
    parser.add_argument('--out', type=Path, help='default: <source stem>-outline.md beside the source')
    parser.add_argument('--group', action='append', default=[], help='bold line prefix that starts a top-level part (repeatable)')
    parser.add_argument('--label', action='append', default=[], help='bold line prefix that is a sub-label, not a section (repeatable)')
    parser.add_argument('--check', action='store_true', help='exit 1 when the saved outline no longer matches the source')
    args = parser.parse_args(argv)
    out = args.out or args.source.with_name(args.source.stem + '-outline.md')
    flags = ''.join(f' --group "{g}"' for g in args.group) + ''.join(f' --label "{l}"' for l in args.label)
    command = f'doc_outline.py {args.source.name}{flags}'
    lines = args.source.read_text(encoding='utf-8').split('\n')
    if lines and lines[-1] == '':
        lines.pop()
    outline = render(lines, args.source, command, args.group, args.label)
    if args.check:
        current = out.read_text(encoding='utf-8') if out.exists() else ''
        if current != outline:
            print(f'STALE {out}: regenerate with {command}')
            sys.exit(1)
        return
    out.write_text(outline, encoding='utf-8')
    print(f'wrote {out}')


if __name__ == '__main__':
    main(sys.argv[1:])
