import re
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
LIST_ITEM = re.compile(r"^\s*(- |\d+\. )")


def q(tag):
    return W + tag


def load_numbering(z):
    try:
        root = ET.fromstring(z.read("word/numbering.xml"))
    except KeyError:
        return {}
    abstract = {}
    for a in root.findall(q("abstractNum")):
        levels = {}
        for lvl in a.findall(q("lvl")):
            fmt = lvl.find(q("numFmt"))
            levels[int(lvl.get(q("ilvl")))] = fmt.get(q("val")) if fmt is not None else "bullet"
        abstract[a.get(q("abstractNumId"))] = levels
    nums = {}
    for n in root.findall(q("num")):
        nums[n.get(q("numId"))] = abstract.get(n.find(q("abstractNumId")).get(q("val")), {})
    return nums


def roman(n):
    out = ""
    for value, letters in [(10, "x"), (9, "ix"), (5, "v"), (4, "iv"), (1, "i")]:
        while n >= value:
            out += letters
            n -= value
    return out


class Converter:
    def __init__(self, path):
        z = zipfile.ZipFile(path)
        self.body = ET.fromstring(z.read("word/document.xml")).find(q("body"))
        self.numbering = load_numbering(z)
        self.counters = {}

    def run_text(self, run):
        parts = []
        for node in run:
            if node.tag == q("t"):
                parts.append(node.text or "")
            elif node.tag in (q("tab"), q("br"), q("cr")):
                parts.append(" ")
            elif node.tag == q("drawing"):
                for el in node.iter():
                    if el.tag.endswith("}docPr"):
                        parts.append(f" [Image: {el.get('descr') or el.get('name')}] ")
                        break
        return "".join(parts)

    def is_bold(self, run):
        rpr = run.find(q("rPr"))
        if rpr is None:
            return False
        b = rpr.find(q("b"))
        return b is not None and b.get(q("val")) not in ("0", "false")

    def inline(self, p):
        pieces = []
        for run in p.iter(q("r")):
            text = self.run_text(run)
            if not text:
                continue
            bold = self.is_bold(run)
            if pieces and pieces[-1][0] == bold:
                pieces[-1][1] += text
            else:
                pieces.append([bold, text])
        out = ""
        for bold, text in pieces:
            if bold and text.strip():
                lead = text[: len(text) - len(text.lstrip())]
                trail = text[len(text.rstrip()):]
                out += f"{lead}**{text.strip()}**{trail}"
            else:
                out += text
        return re.sub(r"\s+", " ", out).strip()

    def list_marker(self, p):
        ppr = p.find(q("pPr"))
        if ppr is None:
            return None
        num = ppr.find(q("numPr"))
        style = ppr.find(q("pStyle"))
        if num is None:
            if style is not None and style.get(q("val")) == "ListBullet":
                return "", "- "
            return None
        ilvl_el = num.find(q("ilvl"))
        ilvl = int(ilvl_el.get(q("val"))) if ilvl_el is not None else 0
        num_id = num.find(q("numId")).get(q("val"))
        if num_id == "0":
            return None
        fmt = self.numbering.get(num_id, {}).get(ilvl, "bullet")
        indent = "  " * ilvl
        if fmt == "bullet":
            return indent, "- "
        key = (num_id, ilvl)
        self.counters[key] = self.counters.get(key, 0) + 1
        for (other_id, other_lvl) in list(self.counters):
            if other_id == num_id and other_lvl > ilvl:
                del self.counters[(other_id, other_lvl)]
        n = self.counters[key]
        if fmt == "decimal":
            return indent, f"{n}. "
        if fmt == "lowerLetter":
            label = chr(ord("a") + n - 1)
        elif fmt == "lowerRoman":
            label = roman(n)
        else:
            label = str(n)
        return indent, f"- {label}. "

    def paragraph(self, p):
        text = self.inline(p)
        if not text:
            return None
        ppr = p.find(q("pPr"))
        style_el = ppr.find(q("pStyle")) if ppr is not None else None
        style = style_el.get(q("val")) if style_el is not None else ""
        if style == "Title":
            return "# " + text.replace("**", "")
        if style.lower().startswith("heading"):
            level = int(style[-1]) if style[-1].isdigit() else 2
            return "#" * min(level, 6) + " " + text.replace("**", "")
        marker = self.list_marker(p)
        if marker:
            indent, bullet = marker
            return indent + bullet + text
        return text

    def cell_blocks(self, cell):
        blocks = []
        for child in cell:
            if child.tag == q("p"):
                b = self.paragraph(child)
                if b:
                    blocks.append(b)
            elif child.tag == q("tbl"):
                blocks.extend(self.table(child))
        return blocks

    def table(self, tbl):
        out = []
        segment = []

        def flush():
            if not segment:
                return
            width = max(len(r) for r in segment)
            rows = [r + [""] * (width - len(r)) for r in segment]
            lines = ["| " + " | ".join(rows[0]) + " |", "|" + "---|" * width]
            lines += ["| " + " | ".join(r) + " |" for r in rows[1:]]
            out.append("\n".join(lines))
            segment.clear()

        for tr in tbl.findall(q("tr")):
            cells = tr.findall(q("tc"))
            if len(cells) == 1:
                flush()
                out.extend(self.cell_blocks(cells[0]))
                continue
            row = []
            for tc in cells:
                blocks = [b.strip().replace("|", "\\|") for b in self.cell_blocks(tc)]
                row.append("<br>".join(blocks))
            segment.append(row)
        flush()
        return out

    def convert(self):
        blocks = self.cell_blocks(self.body)
        text = blocks[0] if blocks else ""
        for prev, block in zip(blocks, blocks[1:]):
            tight = LIST_ITEM.match(prev) and LIST_ITEM.match(block)
            text += ("\n" if tight else "\n\n") + block
        return text + "\n"


if __name__ == "__main__":
    sys.stdout.write(Converter(sys.argv[1]).convert())
