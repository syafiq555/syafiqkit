import argparse
import os
import shutil
import statistics
import subprocess
import sys
import tempfile

MIN_TEXT_CHARS = 25
MIN_IMAGE_PX = 150
COLUMN_TOLERANCE = 0.04
VISION_READABLE_EXTS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"}
IMAGE_EXTS = VISION_READABLE_EXTS | {".gif", ".heic", ".heif", ".webp"}
DEFAULT_VISION_LANGS = "en-US,ms-MY"
HERE = os.path.dirname(os.path.abspath(__file__))
LOOKALIKE_FROM = "АВЕКМНОРСТХУІЈЅаесорхуіјѕΑΒΕΗΙΚΜΝΟΡΤΧΥΖ"
LOOKALIKES = str.maketrans(LOOKALIKE_FROM, "ABEKMHOPCTXYIJSaecopxyijsABEHIKMNOPTXYZ")


def run(cmd, timeout=600, hint=""):
    try:
        proc = subprocess.run(cmd, capture_output=True, timeout=timeout)
    except FileNotFoundError:
        sys.exit(f"{cmd[0]} is not installed")
    except subprocess.TimeoutExpired:
        sys.exit(f"{cmd[0]} took longer than {timeout} s and was stopped")
    if proc.returncode != 0:
        err = proc.stderr.decode("utf-8", errors="replace").strip()[-1500:]
        sys.exit(f"{cmd[0]} failed (exit {proc.returncode}): {err}{hint}")
    return proc.stdout.decode("utf-8", errors="replace")


def need(tool, hint):
    if not shutil.which(tool):
        sys.exit(f"needs {tool}: {hint}")


def vision_available():
    return sys.platform == "darwin" and shutil.which("osascript") is not None


def lookalike_token(token):
    letters = [c for c in token if c.isalpha()]
    return any(c in LOOKALIKE_FROM for c in letters) and all(c.isascii() or c in LOOKALIKE_FROM for c in letters)


def latin_lookalikes_fixed(text):
    latin = sum(c.isascii() and c.isalpha() for c in text)
    other = sum("Ͱ" <= c <= "ӿ" for c in text)
    if not other or latin <= 3 * other:
        return text
    return "\n".join(
        " ".join(t.translate(LOOKALIKES) if lookalike_token(t) else t for t in line.split(" "))
        for line in text.split("\n")
    )


def group_rows(boxes):
    if not boxes:
        return []
    tolerance = 0.6 * statistics.median(b["h"] for b in boxes)
    rows = []
    for b in sorted(boxes, key=lambda b: -b["cy"]):
        if rows and abs(statistics.mean(c["cy"] for c in rows[-1]) - b["cy"]) <= tolerance:
            rows[-1].append(b)
        else:
            rows.append([b])
    return [sorted(r, key=lambda b: b["x"]) for r in rows]


def table_md(rows):
    starts = sorted(c["x"] for row in rows for c in row)
    columns = []
    for x in starts:
        if not columns or x - columns[-1][-1] > COLUMN_TOLERANCE:
            columns.append([x])
        else:
            columns[-1].append(x)
    anchors = [statistics.mean(c) for c in columns]
    grid = []
    for row in rows:
        line = [""] * len(anchors)
        for c in row:
            i = min(range(len(anchors)), key=lambda k: abs(anchors[k] - c["x"]))
            line[i] = (line[i] + " " + c["text"]).strip()
        grid.append([v.replace("|", "\\|") for v in line])
    out = ["| " + " | ".join(grid[0]) + " |", "|" + " --- |" * len(anchors)]
    return "\n".join(out + ["| " + " | ".join(r) + " |" for r in grid[1:]])


def boxes_to_md(boxes):
    rows = group_rows(boxes)
    parts, run_rows = [], []

    def flush():
        if len(run_rows) >= 2:
            parts.append("\n" + table_md(run_rows) + "\n")
        else:
            parts.extend("  ".join(c["text"] for c in r) for r in run_rows)
        run_rows.clear()

    for row in rows:
        if len(row) > 1:
            run_rows.append(row)
        else:
            flush()
            parts.append(row[0]["text"])
    flush()
    return latin_lookalikes_fixed("\n".join(parts))


def vision_boxes(pngs, langs):
    out = run(
        ["osascript", "-l", "JavaScript", os.path.join(HERE, "vision_ocr.js"), f"--langs={langs}"] + pngs,
        hint=f"\nApple Vision stopped while reading {', '.join(os.path.basename(p) for p in pngs)}; a damaged image is the usual cause. Try --engine tesseract, or open the picture to check it.",
    )
    pages, current = {}, None
    for line in out.split("\n"):
        cols = line.split("\t")
        if cols[0] == "#PAGE":
            current = cols[1]
            pages[current] = []
        elif cols[0] == "#ERROR":
            sys.exit(f"Apple Vision could not read {cols[1]}: {cols[2] if len(cols) > 2 else ''}")
        elif current is not None and len(cols) == 7:
            x, y, w, h, dx, dy = (float(v) for v in cols[1:])
            pages[current].append({"text": cols[0], "x": x, "y": y, "w": w, "h": h, "dx": dx, "dy": dy})
    return pages


def turn_needed(boxes):
    sx = sum(b["dx"] for b in boxes)
    sy = sum(b["dy"] for b in boxes)
    if abs(sx) >= abs(sy):
        return 0 if sx >= 0 else 180
    return 270 if sy < 0 else 90


def upright(boxes, turn=None):
    turn = turn_needed(boxes) if turn is None else turn
    placed = []
    for b in boxes:
        x, y, w, h, dx, dy = b["x"], b["y"], b["w"], b["h"], b["dx"], b["dy"]
        if turn == 0:
            along, up, size, length, d_along, d_up = x, y + h / 2, h, w, dx, dy
        elif turn == 180:
            along, up, size, length, d_along, d_up = 1 - (x + w), 1 - (y + h / 2), h, w, -dx, -dy
        elif turn == 270:
            along, up, size, length, d_along, d_up = 1 - (y + h), x + w / 2, w, h, -dy, dx
        else:
            along, up, size, length, d_along, d_up = y, 1 - (x + w / 2), w, h, dy, -dx
        placed.append({"text": b["text"], "x": along, "cy": up, "h": size, "length": length, "d_along": d_along, "d_up": d_up})
    slopes = [p["d_up"] / p["d_along"] for p in placed if p["d_along"] > 0.02 and len(p["text"]) >= 4]
    slope = statistics.median(slopes) if slopes else 0.0
    for p in placed:
        p["cy"] -= slope * (p["x"] + p["length"] / 2)
        p["h"] = max(p["h"] - abs(slope) * p["length"], p["h"] * 0.3)
    return placed


def vision_pages(pngs, langs, tmp):
    found = vision_boxes(pngs, langs)
    turned = {}
    for png, boxes in found.items():
        turn = turn_needed(boxes) if boxes else 0
        if turn and shutil.which("sips"):
            copy = os.path.join(tmp, f"upright-{turn}-{os.path.basename(png)}")
            run(["sips", "-r", str(turn), png, "--out", copy])
            turned[png] = copy
    if turned:
        again = vision_boxes(list(turned.values()), langs)
        for original, copy in turned.items():
            found[original] = again.get(copy, found[original])
    return {
        png: (boxes_to_md(upright(boxes, 0 if png in turned else None)), turned.get(png, png))
        for png, boxes in found.items()
    }


def tesseract_page(png, lang):
    need("tesseract", "on macOS 'brew install tesseract', on Debian or Ubuntu 'apt install tesseract-ocr'")
    return latin_lookalikes_fixed(run(["tesseract", png, "-", "-l", lang, "--psm", "3"]).strip())


def pdf_pages(pdf):
    for line in run(["pdfinfo", pdf], hint="\nA password-protected PDF stops here: save an unlocked copy first.").split("\n"):
        if line.startswith("Pages:"):
            return int(line.split()[1])
    sys.exit(f"pdfinfo could not read a page count from {pdf}")


def page_info(pdf, page):
    width, rotation = 612.0, 0
    for line in run(["pdfinfo", "-f", str(page), "-l", str(page), pdf]).split("\n"):
        if line.startswith("Page") and " size:" in line:
            width = float(line.split("size:")[1].split()[0])
        elif line.startswith("Page") and "rot:" in line:
            rotation = int(line.split("rot:")[1].split()[0])
    return width, rotation


def image_list(pdf, page):
    if not shutil.which("pdfimages"):
        return []
    rows = []
    for i, line in enumerate(run(["pdfimages", "-list", "-f", str(page), "-l", str(page), pdf]).split("\n")[2:]):
        cols = line.split()
        if len(cols) > 12:
            ppi = float(cols[12]) if cols[12].replace(".", "", 1).isdigit() else 0.0
            rows.append({"index": i, "type": cols[2], "w": int(cols[3]), "h": int(cols[4]), "ppi": ppi})
    return rows


def full_page(picture, page_width):
    return picture["ppi"] > 0 and picture["w"] / picture["ppi"] * 72 >= 0.9 * page_width


def unread_pictures(pdf, page):
    width, _ = page_info(pdf, page)
    sized = [r for r in image_list(pdf, page) if r["type"] == "image" and r["w"] >= MIN_IMAGE_PX and r["h"] >= MIN_IMAGE_PX]
    whole = sum(1 for r in sized if full_page(r, width))
    return len(sized) - whole, whole


def scanned_page_png(pdf, page, tmp):
    images = image_list(pdf, page)
    pictures = [r for r in images if r["type"] == "image"]
    others_are_soft_masks = all(r["type"] in ("image", "smask") for r in images)
    _, rotation = page_info(pdf, page)
    if len(pictures) == 1 and others_are_soft_masks and pictures[0]["w"] >= 1000 and rotation == 0:
        prefix = os.path.join(tmp, f"img-{page}")
        run(["pdfimages", "-f", str(page), "-l", str(page), "-png", pdf, prefix])
        candidate = f"{prefix}-{pictures[0]['index']:03d}.png"
        if os.path.isfile(candidate):
            return candidate
    stem_path = os.path.join(tmp, f"page-{page}")
    run(["pdftoppm", "-f", str(page), "-l", str(page), "-r", "200", "-png", "-singlefile", pdf, stem_path])
    return f"{stem_path}.png"


def to_png(src, tmp):
    png = os.path.join(tmp, "image.png")
    if shutil.which("sips"):
        run(["sips", "-s", "format", "png", src, "--out", png])
    elif shutil.which("magick"):
        run(["magick", src + "[0]", png])
    else:
        sys.exit("needs sips (macOS) or ImageMagick 'magick' to read this image; or convert it to PNG first")
    return png


def save_picture(png, dest):
    if shutil.which("sips"):
        run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "70", png, "--out", dest])
    elif shutil.which("magick"):
        run(["magick", png, "-quality", "70", dest])
    else:
        dest = dest[:-4] + ".png"
        shutil.copyfile(png, dest)
    return dest


def main():
    ap = argparse.ArgumentParser(description="PDF, scan or image to Markdown, OCR on pages with no text layer")
    ap.add_argument("source")
    ap.add_argument("out", help="Markdown file to write; page pictures go in a pages/ folder beside it")
    ap.add_argument("--ocr-all", action="store_true", help="OCR every page, even ones with a text layer")
    ap.add_argument("--engine", choices=["auto", "vision", "tesseract"], default="auto")
    ap.add_argument("--no-pages", action="store_true", help="skip saving and linking page pictures")
    ap.add_argument("--vision-lang", default=DEFAULT_VISION_LANGS, help="Apple Vision languages, e.g. en-US,ms-MY,zh-Hans")
    ap.add_argument("--lang", default="eng", help="tesseract language codes, e.g. eng+msa")
    args = ap.parse_args()

    src = os.path.abspath(args.source)
    if not os.path.isfile(src):
        sys.exit(f"no such file: {args.source}")
    out = os.path.abspath(args.out)
    out_dir = os.path.dirname(out)
    try:
        os.makedirs(out_dir, exist_ok=True)
    except OSError as e:
        sys.exit(f"cannot write to {out_dir}: {e.strerror}")
    if not os.access(out_dir, os.W_OK):
        sys.exit(f"cannot write to {out_dir}")
    stem = os.path.splitext(os.path.basename(out))[0]
    pages_dir = os.path.join(out_dir, "pages")
    ext = os.path.splitext(src)[1].lower()

    engine = args.engine
    if engine == "auto":
        engine = "vision" if vision_available() else "tesseract"
    if engine == "vision" and not vision_available():
        sys.exit("Apple Vision needs macOS; pass --engine tesseract")
    label = "Apple Vision" if engine == "vision" else "tesseract"

    notes, full_page_pictures = [], []
    with tempfile.TemporaryDirectory() as tmp:
        pages = []
        if ext == ".pdf":
            need("pdftotext", "install poppler: on macOS 'brew install poppler', on Debian or Ubuntu 'apt install poppler-utils'")
            for n in range(1, pdf_pages(src) + 1):
                text = run(["pdftotext", "-layout", "-f", str(n), "-l", str(n), src, "-"]).rstrip()
                if args.ocr_all or len("".join(text.split())) < MIN_TEXT_CHARS:
                    pages.append({"n": n, "png": scanned_page_png(src, n, tmp), "text": None})
                else:
                    pages.append({"n": n, "png": None, "text": text, "engine": "text layer"})
                    pictures, whole = unread_pictures(src, n)
                    if pictures:
                        notes.append(f"page {n}: {pictures} embedded picture(s) not read (diagram, photo or pasted scan); rerun with --ocr-all to OCR the page and save its picture")
                    if whole:
                        full_page_pictures.append(n)
        elif ext in IMAGE_EXTS:
            png = src if ext in VISION_READABLE_EXTS else to_png(src, tmp)
            pages.append({"n": 1, "png": png, "text": None})
        else:
            sys.exit(f"unsupported file type {ext or '(no extension)'}: use docx_to_md.py or xlsx_to_md.py for Office files")

        todo = [p for p in pages if p["text"] is None]
        if engine == "vision" and todo:
            done = vision_pages([p["png"] for p in todo], args.vision_lang, tmp)
            for p in todo:
                p["text"], p["png"] = done.get(p["png"], ("", p["png"]))
        else:
            for p in todo:
                p["text"] = tesseract_page(p["png"], args.lang)
        for p in todo:
            p["engine"] = label

        if todo and not args.no_pages:
            os.makedirs(pages_dir, exist_ok=True)
            for p in todo:
                pic = save_picture(p["png"], os.path.join(pages_dir, f"{stem}-p{p['n']}.jpg"))
                p["picture"] = os.path.relpath(pic, out_dir)

    with open(out, "w", encoding="utf-8") as fh:
        if ext == ".pdf" and not todo:
            fh.write(run(["pdftotext", "-layout", src, "-"]))
        else:
            chunks = []
            for p in pages:
                head = f"<!-- page {p['n']} -->\n\n" if len(pages) > 1 else ""
                if p.get("picture"):
                    head += f"![Page {p['n']}]({p['picture']})\n\n"
                chunks.append(head + p["text"].strip("\n"))
            fh.write("\n\n".join(chunks).rstrip() + "\n")

    empty, sparse = [], []
    for p in pages:
        chars = len("".join(p["text"].split()))
        print(f"page {p['n']}: {p['engine']}, {chars} characters", file=sys.stderr)
        if chars == 0:
            empty.append(p["n"])
        elif p["engine"] != "text layer" and chars < MIN_TEXT_CHARS:
            sparse.append(p["n"])
    for note in notes:
        print(note, file=sys.stderr)
    if full_page_pictures:
        print(f"full-page picture under the text on pages {', '.join(map(str, full_page_pictures))}: a searchable scan (fine) or a pasted screenshot whose words the text layer lacks; if a page's text looks short, rerun with --ocr-all", file=sys.stderr)
    if sparse:
        print(f"LITTLE TEXT on pages {', '.join(map(str, sparse))}: probably a diagram, photo or handwriting; open the page picture and describe it", file=sys.stderr)
    if empty:
        print(f"EMPTY pages {', '.join(map(str, empty))}: no text was read; open the page picture before calling the copy complete", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
