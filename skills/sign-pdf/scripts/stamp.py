"""Stamp a signature image (and optional text) onto pages of a PDF, writing a new file.

Coordinates are PDF points measured from the TOP-LEFT of the page's MediaBox, the
same frame `pdftotext -bbox` and `pdftoppm` use by default (do not pass their -cropbox),
so a field's xMin/yMin can be used directly.

Usage:
  python stamp.py SRC DST --page 5 --sig sig.png --box X Y W H
                  [--text X Y SIZE "16/11/2026"]...
                  [--cover X Y W H R G B]...

  --page   1-based; a list or range applies the same placement to each page
           ("5", "2,5,7", "1-8", "all"), which is how initials go on every page
  --box    signature placement: X,Y is the image's top-left corner
  --text   draws a string with its baseline at Y (Helvetica); also ticks a box with "X"
  --cover  paints a rectangle first (0-255 colour), to hide a stale value

Placements that differ between pages are separate runs, each run's DST feeding the next.
"""

import argparse
import io
import os
import re

from pypdf import PdfReader, PdfWriter
from pypdf.errors import DependencyError, FileNotDecryptedError, PdfReadError
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def parse_pages(spec, count):
    if spec == "all":
        return list(range(1, count + 1))
    pages = []
    for part in spec.split(","):
        found = re.fullmatch(r"\s*(\d+)\s*(?:-\s*(\d+)\s*)?", part)
        if not found:
            raise SystemExit(f'--page "{spec}" is not understood: use 5, 2,5,7, 1-8 or all.')
        start = int(found.group(1))
        end = int(found.group(2) or start)
        if end < start:
            raise SystemExit(f'--page range "{part.strip()}" runs backwards.')
        pages.extend(range(start, end + 1))
    bad = [p for p in pages if not 1 <= p <= count]
    if bad:
        raise SystemExit(f"--page {bad[0]} is outside the document (1 to {count}).")
    return list(dict.fromkeys(pages))


def build_overlay(width, height, args):
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(width, height))
    for x, y, w, h, r, g, b in args.cover or []:
        c.setFillColorRGB(r / 255, g / 255, b / 255)
        c.rect(x, height - y - h, w, h, stroke=0, fill=1)
    if args.sig:
        x, y, w, h = args.box
        c.drawImage(ImageReader(args.sig), x, height - y - h, width=w, height=h, mask="auto")
    c.setFillColorRGB(0, 0, 0)
    for x, y, size, value in args.text or []:
        c.setFont("Helvetica", float(size))
        c.drawString(float(x), height - float(y), value)
    c.save()
    buf.seek(0)
    return PdfReader(buf).pages[0]


def check_inputs(args):
    same_path = os.path.realpath(args.src) == os.path.realpath(args.dst)
    same_file = os.path.exists(args.dst) and os.path.exists(args.src) and os.path.samefile(args.src, args.dst)
    if same_path or same_file:
        raise SystemExit("Refusing to overwrite the source: write a signed copy instead.")
    if bool(args.sig) != bool(args.box):
        raise SystemExit("--sig and --box go together.")
    if args.sig and not os.path.isfile(args.sig):
        raise SystemExit(f"Signature image not found: {args.sig}")
    if not (args.sig or args.text or args.cover):
        raise SystemExit("Nothing to stamp: give --sig/--box, --text or --cover.")


def open_writer(src):
    try:
        return PdfWriter(clone_from=src)
    except (DependencyError, FileNotDecryptedError, PdfReadError) as e:
        raise SystemExit(
            f"Could not open {src} ({e}). If it is password protected, decrypt a copy first: "
            "qpdf --decrypt in.pdf unlocked.pdf"
        )


def main():
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("dst")
    p.add_argument("--page", required=True)
    p.add_argument("--sig")
    p.add_argument("--box", type=float, nargs=4)
    p.add_argument("--text", nargs=4, action="append", metavar=("X", "Y", "SIZE", "TEXT"))
    p.add_argument("--cover", type=float, nargs=7, action="append")
    args = p.parse_args()
    check_inputs(args)

    writer = open_writer(args.src)
    for number in parse_pages(args.page, len(writer.pages)):
        page = writer.pages[number - 1]
        if page.rotation % 360:
            raise SystemExit(
                f"Page {number} is rotated {page.rotation} degrees; the stamp would land "
                "sideways. Not supported yet."
            )
        box = page.mediabox
        overlay = build_overlay(float(box.width), float(box.height), args)
        page.merge_translated_page(overlay, float(box.left), float(box.bottom))
    with open(args.dst, "wb") as f:
        writer.write(f)


if __name__ == "__main__":
    main()
