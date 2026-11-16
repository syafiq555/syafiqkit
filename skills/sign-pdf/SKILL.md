---
name: sign-pdf
description: Sign a PDF form with the user's own signature image, initial its pages and fill the date, as a signed copy ready to send. Use when the user says "sign this form", "put my signature", "sign it for me", "tandatangan borang ni", "initial every page", "sign here and here", "use my signature from somewhere in my laptop", "sign and date the application", "e-sign this PDF", or hands over a bank, loan, tenancy, insurance or campaign form that needs their signature. Finds their signature (their notes, or an earlier signed document), confirms it is theirs and which boxes to sign, stamps a copy, checks the rendered page, and never overwrites the original or sends anything. NOT for a cryptographic digital signature (PAdES/certificate) or a DocuSign-style signing request. Filling a form's other fields is the `pdf` skill: it fills, this one signs the result. A Word form is exported to PDF first.
---

# Sign a PDF with the user's signature

The output is a picture of the user's signature placed on a copy of their form. That is an electronic signature, which Malaysia's Electronic Commerce Act 2006 gives the effect of a handwritten one for most commercial documents. Some institutions still want wet ink on particular papers: where the form or the person collecting it asks for an "original signature", tell the user and stamp only if they still want it.

A signature commits the user to the document, so two things are theirs to confirm before anything is stamped: that the image is their signature, and which boxes get signed.

## 1. Find the signature image

Look in this order, and stop at the first that works:

1. **The user's notes.** Grep their CLAUDE.md files (global, the project's, a finance or documents archive) for "signature image". A recorded source has already been confirmed, so it skips the identity check below.
2. **An earlier signed document.** A PDF they signed digitally often embeds the signature as an image with a transparency mask: a clean ink line on a see-through background, the best source there is. Search for likely files (`*SIGNED*`, `*offer*`, `*contract*`, signed agreements), list each one's images with `pdfimages -list -f N -l N file.pdf`, and look for a small image paired with an `smask` row. Extract and combine:
   ```bash
   pdfimages -png -f N -l N contract.pdf emb    # numbers from emb-000 on each run: ls emb-*.png, the image then its mask
   magick emb-000.png emb-001.png -alpha off -compose CopyOpacity -composite sig.png
   magick sig.png -background white -flatten -resize 400% preview.png
   ```
   A signed agreement usually carries more than one signature (the employer's, the landlord's, a witness's). Pick by the signatory block it sits above ("I, <user's name> ... hereby"), not by size.
3. **A scanned signature.** A scan of a page they signed by hand gives a signature on white. Crop it at 300 dpi (`pdftoppm -r 300`) and make the white transparent (`magick crop.png -fuzz 15% -transparent white sig.png`). Open the result, since scanner grey survives as a box.
4. **Ask for one.** Tell the user exactly what works: their signature in black or blue ink on plain white paper, photographed flat in daylight with nothing else in frame, saved where you can read it (iCloud Drive works from a phone). It then goes through step 3.

**Show the user the preview and get a yes before the first stamp**, naming the file it came from. The wrong person's signature on a bank form is the one mistake here that can't be laughed off. Once confirmed, record the source path and extraction command in the user's notes beside where their personal documents are described, preferring a private, uncommitted notes file, so the next form skips this step.

A small source image stamped wide prints soft. If the image's width in pixels divided by its stamped width in inches comes to under about 150, say so and offer a better source.

## 2. Locate the boxes and agree them

`pdftotext -bbox form.pdf out.html` lists every word with its coordinates in PDF points from the page's top-left; each `<page>` tag starts a page. Find the "Signature", "Initials" and "Date" labels, then render those pages (`pdftoppm -r 70 -f N -l N`) and look: the label says where the box is, the picture says whether the mark goes above a line, inside a table cell or beside the label.

A scanned form has no text layer, so the bbox file comes back empty. Render the page instead and read positions off the picture: a pixel position times `72 / dpi` is the point coordinate. (`tesseract page.png - tsv` gives word positions in pixels if the labels need finding.)

Then **list the boxes for the user and wait for a yes**: page, label, and what goes in each. Leave any box meant for someone else (joint applicant, guarantor, witness, bank officer) empty and say so. On tick boxes, judge by what the tick commits them to:

- A declaration that belongs to the signature itself ("I confirm the information above is true", "I have read the terms") goes in the list as part of signing.
- A choice the user hasn't made (marketing consent, an add-on product, a credit card offer, insurance) is theirs to answer. Ask, and never tick it by default.
- When it isn't clear which kind a box is, treat it as the second and ask.

**Initials** use the same signature, scaled down to the initials box. Most forms put the box in the same place on every page, so one run covers them all (`--page all`). Check one page's render before trusting it for the rest.

A date already printed from an earlier fill is stale. Cover it in the field's own background colour (`magick page.png -format "%[pixel:p{x,y}]" info:`) and write today's date in the user's time zone (`TZ=Asia/Kuala_Lumpur date +%d/%m/%Y` for a Malaysian user), in the form's own format. A "DD / MM / YYYY" grid with one digit per box means one `--text` per digit.

## 3. Stamp a copy

`${CLAUDE_SKILL_DIR}/scripts/stamp.py` writes a new file and refuses to write over its source, however the path is spelled. It needs Python 3.10 or newer with `pypdf` and `reportlab`. macOS's system Python 3.9 is too old for reportlab, so make a throwaway venv from a newer interpreter, outside any project and outside the folder holding the documents:

```bash
python3.12 -m venv /tmp/sign-venv && /tmp/sign-venv/bin/pip -q install pypdf reportlab
/tmp/sign-venv/bin/python "${CLAUDE_SKILL_DIR}/scripts/stamp.py" form.pdf "form - signed.pdf" \
  --page <N> --sig sig.png --box <x> <y> <width> <height> \
  --cover <x> <y> <w> <h> <r> <g> <b> --text <x> <baseline-y> <size> "<date>"
```

All coordinates are from the top-left, like the bbox output. `--box` is the image's top-left corner plus width and height: keep the signature's own aspect ratio, about 60 to 80 points wide above a signature line, or the cell's height minus a few points inside a table row. A tick is `--text` with "X" at the box. `--page` takes one page, a list or range (`2,5,7`, `1-8`, `all`) for the same placement on each. Placements that differ between pages are separate runs: write the in-between files to a temp directory and only the last one beside the user's documents.

The script stops with a plain message on a rotated page, a missing image, a malformed or out-of-range `--page`, a source and destination that are the same file, or a password-protected PDF (decrypt a copy with `qpdf --decrypt` first). A MediaBox that doesn't start at 0,0 is handled. Coordinates are in the MediaBox frame that `pdftotext -bbox` and `pdftoppm` use by default, so don't pass their `-cropbox`; on a form whose CropBox is smaller, a viewer shows less than the render does, so check the render for a box near the edge.

## 4. Check the rendered page

Render each stamped page at about 140 dpi, crop around each box, and open it. A signature that crosses a ruled line, overlaps the label or floats outside its cell happens on most first attempts; a table row is usually taller or lower than its label suggests, so measure the row's lines in the render and move the box. If you can't view images in this session, say the check wasn't done rather than reporting the copy as ready.

Hand the signed copy over under a readable name beside the user's other documents for the same purpose. Sending it, by email, WhatsApp or upload, is the user's act.
