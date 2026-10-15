import posixpath
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PKG_REL = "{http://schemas.openxmlformats.org/package/2006/relationships}"


def column_index(ref):
    letters = re.match(r"[A-Z]+", ref).group(0)
    n = 0
    for ch in letters:
        n = n * 26 + ord(ch) - 64
    return n - 1


def text_of(el):
    return "".join(t.text or "" for t in el.iter(NS + "t"))


def shared_strings(z):
    try:
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return [text_of(si) for si in root.findall(NS + "si")]


def sheets(z):
    book = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    targets = {r.get("Id"): r.get("Target") for r in rels.findall(PKG_REL + "Relationship")}
    for sheet in book.iter(NS + "sheet"):
        target = targets[sheet.get(REL + "id")]
        path = target.lstrip("/") if target.startswith("/") else posixpath.normpath(posixpath.join("xl", target))
        yield sheet.get("name"), path


def cell_value(c, strings, formulas):
    kind = c.get("t")
    formula = c.find(NS + "f")
    if formulas and formula is not None and formula.text:
        return "=" + formula.text
    if kind == "inlineStr":
        return text_of(c)
    v = c.find(NS + "v")
    if v is None or v.text is None:
        return ""
    if kind == "s":
        return strings[int(v.text)]
    if kind == "b":
        return "TRUE" if v.text == "1" else "FALSE"
    return v.text


def sheet_rows(z, path, strings, formulas):
    root = ET.fromstring(z.read(path))
    rows = []
    for r in root.iter(NS + "row"):
        row = {}
        for i, c in enumerate(r.findall(NS + "c")):
            col = column_index(c.get("r")) if c.get("r") else i
            value = cell_value(c, strings, formulas)
            if value != "":
                row[col] = re.sub(r"\s+", " ", value).strip().replace("|", "\\|")
        rows.append(row)
    while rows and not rows[-1]:
        rows.pop()
    return rows


def to_markdown(rows):
    if not rows:
        return "_(empty sheet)_"
    width = max((max(r) + 1 for r in rows if r), default=1)
    grid = [[r.get(i, "") for i in range(width)] for r in rows]
    lines = ["| " + " | ".join(grid[0]) + " |", "|" + "---|" * width]
    lines += ["| " + " | ".join(r) + " |" for r in grid[1:]]
    return "\n".join(lines)


def main(argv):
    formulas = "--formulas" in argv
    paths = [a for a in argv if not a.startswith("--")]
    if len(paths) != 1:
        sys.exit("usage: xlsx_to_md.py <file.xlsx> [--formulas]")
    z = zipfile.ZipFile(paths[0])
    strings = shared_strings(z)
    parts = [f"## {name}\n\n{to_markdown(sheet_rows(z, path, strings, formulas))}" for name, path in sheets(z)]
    sys.stdout.write("\n\n".join(parts) + "\n")


if __name__ == "__main__":
    main(sys.argv[1:])
