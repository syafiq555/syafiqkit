#!/usr/bin/env python3
"""Secret-survival checker for refreshing files that hold credentials.

  seccheck.py save  <file> <cands.json>   record every secret-shaped token, write <cands.json>.masked.md
  seccheck.py mask  <file> <out.md>       write a masked copy to read instead of <file>
  seccheck.py check <cands.json> <file>...  report how many recorded tokens are missing from the files

Never prints a token. A missing token is shown by its line number and the words before it;
one of 12+ characters also shows its first three characters and its length.
Over-matching is intended: a mask only hides words from the reader.
"""
import json
import re
import sys

MIXED = re.compile(
    r"(?<![\w/.-])(?=[\w!@#$%^&*+=/.-]*[A-Za-z])(?=[\w!@#$%^&*+=/.-]*\d)[\w!@#$%^&*+=/.-]{8,}"
)
AFTER_KEYWORD = re.compile(
    r"(?i)(password|passwd|pw|key|secret|token)\b[^\n`|]{0,12}?[`:=|]\s*`?([^\s`|]{4,})"
)
TABLE_CELL = re.compile(r"\|\s*`([^`|]{4,})`\s*(?=\|)")


def candidates(text):
    found = []
    for number, line in enumerate(text.splitlines(), 1):
        for match in MIXED.finditer(line):
            found.append((number, match.group(0)))
        for match in AFTER_KEYWORD.finditer(line):
            found.append((number, match.group(2)))
        if line.lstrip().startswith("|"):
            for match in TABLE_CELL.finditer(line):
                found.append((number, match.group(1)))
    return list(dict.fromkeys(found))


def mask(text):
    text = AFTER_KEYWORD.sub(lambda m: m.group(0).replace(m.group(2), "[MASK]"), text)
    text = "\n".join(
        TABLE_CELL.sub("| `[MASK]` ", line) if line.lstrip().startswith("|") else line
        for line in text.split("\n")
    )
    return MIXED.sub("[MASK]", text)


def read(path):
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def main(argv):
    if len(argv) < 3:
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
        now = "".join(read(path) for path in argv[3:])
        missing = [(n, v) for n, v in saved["tokens"] if v not in now]
        print(f"missing {len(missing)} of {len(saved['tokens'])}")
        for number, value in missing:
            line = saved["lines"][number - 1]
            before = line[max(0, line.find(value) - 50):line.find(value)]
            shown = f"{value[:3]}… len {len(value)}" if len(value) >= 12 else "short token"
            print(f"  line {number}: after {before!r} <{shown}>")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv)
