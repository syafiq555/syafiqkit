"""Local stand-in for looking at a board, and a text dump for reading one back.

  python3 preview_board.py board.excalidraw out.png   draw a PNG and report overlaps / text overflow
  python3 preview_board.py board.excalidraw --text    print every text element as "x,y<TAB>text"

The PNG proves layout only, not Excalidraw's own font metrics.
"""
import json
import sys


def load(path):
    d = json.load(open(path))
    return [e for e in d["elements"] if not e.get("isDeleted")]


def dump_text(els):
    for e in sorted(els, key=lambda e: (round(e["y"] / 50), e["x"])):
        if e["type"] == "text":
            print(f"{int(e['x'])},{int(e['y'])}\t{e['text'].replace(chr(10), ' | ')}")


def font_loader():
    from PIL import ImageFont
    for path in ("/System/Library/Fonts/Helvetica.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "C:/Windows/Fonts/arial.ttf"):
        try:
            ImageFont.truetype(path, 16)
            return lambda size, p=path: ImageFont.truetype(p, int(size))
        except OSError:
            continue
    return lambda size: ImageFont.load_default()


def preview(els, out):
    from PIL import Image, ImageDraw
    font = font_loader()
    minx = min(e["x"] for e in els) - 20
    miny = min(e["y"] for e in els) - 20
    maxx = max(e["x"] + e.get("width", 0) for e in els) + 20
    maxy = max(e["y"] + e.get("height", 0) for e in els) + 20
    im = Image.new("RGB", (int(maxx - minx), int(maxy - miny)), "white")
    dr = ImageDraw.Draw(im)
    P = lambda x, y: (x - minx, y - miny)
    by_id = {e["id"]: e for e in els}
    for e in els:
        if e["type"] == "rectangle":
            dr.rounded_rectangle([P(e["x"], e["y"]), P(e["x"] + e["width"], e["y"] + e["height"])],
                                 radius=8, outline="black", width=int(e.get("strokeWidth", 1)))
        elif e["type"] in ("arrow", "line"):
            dr.line([P(e["x"] + p[0], e["y"] + p[1]) for p in e["points"]], fill="black", width=1)
    problems = []
    for e in els:
        if e["type"] != "text":
            continue
        fs = e.get("fontSize", 16)
        lines = e["text"].split("\n")
        if e.get("containerId"):
            c = by_id[e["containerId"]]
            lh = fs * 1.25
            y = c["y"] + (c["height"] - lh * len(lines)) / 2
            for i, line in enumerate(lines):
                w = dr.textlength(line, font=font(fs))
                dr.text(P(c["x"] + (c["width"] - w) / 2, y + i * lh), line, fill="black", font=font(fs))
            if len(lines) * lh > c["height"] + 1 or max(dr.textlength(l, font=font(fs)) for l in lines) > c["width"]:
                problems.append(("overflow", c["id"], e["text"][:40]))
        else:
            dr.multiline_text(P(e["x"], e["y"]), e["text"], fill="black", font=font(fs), spacing=4)
    rects = [e for e in els if e["type"] == "rectangle"]
    for i, a in enumerate(rects):
        for b in rects[i + 1:]:
            if a["x"] < b["x"] + b["width"] and b["x"] < a["x"] + a["width"] and a["y"] < b["y"] + b["height"] and b["y"] < a["y"] + a["height"]:
                problems.append(("overlap", a["id"], b["id"]))
    im.save(out)
    print(problems or "no overlaps, no overflow", "->", out)


if __name__ == "__main__":
    elements = load(sys.argv[1])
    if "--text" in sys.argv:
        dump_text(elements)
    else:
        preview(elements, sys.argv[2])
