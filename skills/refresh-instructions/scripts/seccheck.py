#!/usr/bin/env python3
"""Secret-survival checker for refreshing files that hold credentials.

  seccheck.py save  <file> <cands.json>
      record every secret-shaped token and write <cands.json>.masked.md
  seccheck.py mask  <file> <out.md>
      write a masked copy to read instead of <file>
  seccheck.py check <cands.json> <file>... [--tracked <file>...]
      every recorded token must still appear in the files before --tracked,
      and none may appear in a --tracked file (one git would publish)

Never prints a token or its neighbours: a finding is reported by line number
and the masked text of that line. <cands.json> holds the original lines in
plain text, so keep it in a private folder and delete it with the snapshots.
Over-masking is intended: a mask only hides words from the reader.
"""
import json
import re
import sys

KEYWORD = r"\w*(?:pass|secret|token|key|pin)\w*"
WORDISH = re.compile(r"[\w!@#$%^&*+=/.-]{8,}")
AFTER_KEYWORD = re.compile(
    rf"(?i)\b{KEYWORD}\b\s*(?:[:=]|is\b)?\s*`?([^`|\n]{{4,}})"
)
BACKTICK_CELL = re.compile(r"\|\s*`([^`|]{4,})`\s*(?=\|)")
ANY_CELL = re.compile(r"(?<=\|)([^|\n]+)(?=\|)")
SEPARATOR_ROW = re.compile(r"^\s*\|[\s:|-]+\|\s*$")


def mixed_tokens(line):
    for match in WORDISH.finditer(line):
        token = match.group(0).strip(".")
        if len(token) >= 8 and re.search(r"[A-Za-z]", token) and re.search(r"\d", token):
            yield token
            for part in re.split(r"[/:@]", token):
                if len(part) >= 6 and part != token and re.search(r"\d", part):
                    yield part


def secret_tables(lines):
    """Line numbers of table rows whose table header names a credential."""
    rows, header_hit = set(), False
    for number, line in enumerate(lines, 1):
        if not line.lstrip().startswith("|"):
            header_hit = False
            continue
        if number == 1 or not lines[number - 2].lstrip().startswith("|"):
            header_hit = bool(re.search(KEYWORD, line, re.I))
            continue
        if header_hit and not SEPARATOR_ROW.match(line):
            rows.add(number)
    return rows


def candidates(text):
    lines = text.splitlines()
    table_rows = secret_tables(lines)
    found = []
    for number, line in enumerate(lines, 1):
        found += [(number, token) for token in mixed_tokens(line)]
        found += [(number, m.group(1).strip()) for m in AFTER_KEYWORD.finditer(line)]
        if line.lstrip().startswith("|"):
            found += [(number, m.group(1)) for m in BACKTICK_CELL.finditer(line)]
        if number in table_rows:
            for m in ANY_CELL.finditer(line):
                cell = m.group(1).strip().strip("`")
                if len(cell) >= 4:
                    found.append((number, cell))
    return [pair for pair in dict.fromkeys(found) if len(pair[1].strip()) >= 4]


def mask_line(line, number, table_rows):
    line = AFTER_KEYWORD.sub(lambda m: m.group(0).replace(m.group(1), "[MASK]"), line)
    if number in table_rows:
        line = ANY_CELL.sub(" [MASK] ", line)
    elif line.lstrip().startswith("|"):
        line = BACKTICK_CELL.sub("| `[MASK]` ", line)
    for token in sorted(set(mixed_tokens(line)), key=len, reverse=True):
        line = line.replace(token, "[MASK]")
    return line


def mask(text):
    lines = text.split("\n")
    table_rows = secret_tables(lines)
    return "\n".join(mask_line(line, n, table_rows) for n, line in enumerate(lines, 1))


def present(token, text):
    return re.search(rf"(?<![\w-]){re.escape(token)}(?![\w-])", text) is not None


def read(path):
    with open(path, encoding="utf-8", errors="replace") as handle:
        return handle.read()


def main(argv):
    if len(argv) < 4:
        sys.exit(__doc__)
    mode = argv[1]
    if mode == "save":
        source, out = argv[2], argv[3]
        text = read(source)
        found = candidates(text)
        with open(out, "w", encoding="utf-8") as handle:
            json.dump({"source": source, "lines": text.splitlines(), "tokens": found}, handle)
        with open(out + ".masked.md", "w", encoding="utf-8") as handle:
            handle.write(mask(text))
        print(f"{source}: {len(found)} candidates saved")
    elif mode == "mask":
        with open(argv[3], "w", encoding="utf-8") as handle:
            handle.write(mask(read(argv[2])))
    elif mode == "check":
        saved = json.load(open(argv[2], encoding="utf-8"))
        rest = argv[3:]
        split = rest.index("--tracked") if "--tracked" in rest else len(rest)
        holders, tracked = rest[:split], rest[split + 1:]
        kept = "\n".join(read(path) for path in holders)
        public = {path: read(path) for path in tracked}
        lines = saved["lines"]
        table_rows = secret_tables(lines)
        missing = [(n, v) for n, v in saved["tokens"] if not present(v, kept)]
        leaked = [(n, v, p) for n, v in saved["tokens"] for p, t in public.items() if present(v, t)]
        print(f"missing {len(missing)} of {len(saved['tokens'])}; in tracked files {len(leaked)}")
        for number, value in missing:
            shown = f"{value[:3]}… len {len(value)}" if len(value) >= 12 else "short token"
            print(f"  missing, line {number} <{shown}>: {mask_line(lines[number - 1], number, table_rows)[:160]}")
        for number, _value, path in leaked:
            print(f"  LEAKED into {path}, from line {number}: {mask_line(lines[number - 1], number, table_rows)[:160]}")
        sys.exit(1 if leaked else 0)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv)
