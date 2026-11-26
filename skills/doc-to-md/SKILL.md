---
name: doc-to-md
description: Convert a Word (.docx), PDF, Excel (.xlsx), scanned document, photo or screenshot of a document into Markdown, so its text can be read, grepped, committed and diffed in git. Scanned and image-only pages are read by OCR on the machine (Apple Vision on a Mac; tesseract elsewhere), with table rows rebuilt as tables and each scanned page saved as a picture beside the text for diagrams. Use when the user asks to "convert to md", "make a markdown copy", "turn this docx/pdf/excel into markdown", "OCR this", "read this scan", "extract the text from this image/photo", "so I can see the changes between versions", "what changed between these two versions", "compare/diff these Word files", hands over two versions of a document that are hard to compare, or hands over a scanned contract, invoice, form or photo of a page whose words the work depends on. The reverse direction (Markdown to PDF) is `md-to-pdf`.
---

# Document to Markdown

Turn a `.docx`, `.pdf`, `.xlsx`, scan or photo of a document into one Markdown file whose text matches the source, so each new version of the document becomes a readable `git diff`.

The copy is for reading and diffing, never for sending: colour, page layout and (for Word) headers and footers do not survive, and images survive only on the OCR path, as a picture of each scanned page beside the text. Say so when you hand it over, because a reviewer who edits the Markdown loses the edit at the next regenerate.

## Pick the converter

| Source | Command | What survives |
|---|---|---|
| `.docx` | `python3 -I ${CLAUDE_SKILL_DIR}/scripts/docx_to_md.py <file.docx> > <out.md>` | Body text in order, headings (Heading 1 to 6, Title), bold, bullet and numbered lists (letters and roman numerals kept as labels), tables as pipe tables (a full-width one-cell row breaks the table so its contents read as normal text), images as `[Image: alt text]` |
| `.xlsx` | `python3 -I ${CLAUDE_SKILL_DIR}/scripts/xlsx_to_md.py <file.xlsx> [--formulas] > <out.md>` | One `## Sheet` section per sheet, a pipe table each, the first row as the header. Cached values by default; `--formulas` shows `=FORMULA` instead where a cell has one |
| `.pdf` | `python3 -I ${CLAUDE_SKILL_DIR}/scripts/ocr_to_md.py <file.pdf> <out.md>` | Pages with a text layer go through `pdftotext -layout` (column layout kept by spaces, no headings or tables). Pages with no text layer (a scan) go through OCR, see below. Prefer the `.docx` the PDF was made from when one exists |
| Scan, photo or screenshot (`.png`, `.jpg`, `.heic`, `.tif`, `.webp`) | `python3 -I ${CLAUDE_SKILL_DIR}/scripts/ocr_to_md.py <image> <out.md>` | OCR of the whole image, see below |

All three scripts use only the Python standard library, so any `python3` from 3.9 works. `pandoc -t gfm` is not the better choice for `.docx`: a list or second paragraph inside a table cell turns the whole table into raw HTML, which diffs badly.

## Scans, photos and screenshots (OCR) {#ocr}

A copy is worth making when the words will be quoted, searched, compared or kept: a contract, invoice, spec, signed form, or a scan too long to read page by page. One clean screenshot you only need to glance at is read by looking at it; converting it adds nothing. For a read-only look, write the copy to a scratch folder (`/tmp/<name>.md`), not the repo, since page pictures land beside it; use the repo path only when the copy is being kept as a version.

`ocr_to_md.py` decides per page: a page whose `pdftotext` output has fewer than 25 non-space characters is read by OCR (its scanned picture is pulled straight out of the PDF, or the page is rendered at 200 dpi when it is rotated or layered), every other page keeps its text layer. It prints one line per page naming the engine and the characters read. Every OCR'd page, and an image you pass in, gets a picture saved as `pages/<copy name>-p<N>.jpg` and linked in the copy; a multi-page copy also marks each page with `<!-- page N -->` once any page was OCR'd. An all-typed PDF comes out byte for byte as `pdftotext -layout` gave it, so a copy already kept in git shows no false diff.

| Engine | When it runs | What survives |
|---|---|---|
| **Apple Vision** (built into macOS, called through `osascript`; runs on the machine, nothing uploaded, no page limit) | Any Mac | Text in reading order; sideways, upside-down and tilted pages straightened (the saved picture is turned upright too); rows with several cells rebuilt as pipe tables from the words' positions. English and Malay by default (`--vision-lang en-US,ms-MY,zh-Hans` adds Chinese). About 90 MB of memory. Measured on an Apple M4: under a second for a photo or screenshot, 1 to 3 s for a scanned PDF page, about 7 s for a sideways PDF page (it is read twice), and up to 30 s extra for the first call after a restart |
| **tesseract** | Linux, or `--engine tesseract` | Plain text only: table rows run together. English by default; `--lang eng+msa` adds Malay where its language pack is installed |

Images need nothing installed on a Mac. PDFs need poppler for `pdftotext`, `pdfimages` and `pdftoppm` (`brew install poppler`, or `apt install poppler-utils`); the script names it when it is missing.

Say which engine produced the copy you hand over. Neither engine knows headings, formulas or charts: a heading comes out as an ordinary line, and a chart as its stray labels.

**Pictures need you, not OCR.** When the question turns on what a diagram, chart, stamp or photo shows (which service calls which, the value of a bar, whose chop is on the form), open the page picture and describe it; don't guess from the labels OCR picked up. The script flags the cases that would otherwise pass silently: `LITTLE TEXT on pages ...` (a page that is probably a diagram, photo or handwriting), `EMPTY pages ...` (no words at all; exit code 2), and `page N: K embedded picture(s) not read` (a typed PDF page carrying a diagram or a pasted scan, which its text layer skips; rerun with `--ocr-all` to OCR it and save its picture). A Word file's images are not read by `docx_to_md.py` (they show as `[Image: ...]`); when one holds text that matters, unzip the `.docx`, and run `ocr_to_md.py` on each file in `word/media/`.

Two OCR runs of the same scan can differ by a word, so a diff between two scanned versions carries some noise: check a changed line against both page images before reporting it as a real change.

⚠️ **The Markdown copy is unverified until you compare its words with the source.** A converter that skips a run type, a text box or a nested table drops text without any error, and the copy still reads complete. Before handing it over, tokenise both sides and diff them: `pandoc <file.docx> -t plain --wrap=none` against the Markdown with `|`, `*`, `#` and `-` stripped. Only punctuation, list numbers and table borders should differ. For a PDF or image, a page-count match proves nothing, since a scan converted without OCR has every page and no words: read `ocr_to_md.py`'s per-page lines, which end with `EMPTY pages ...` and exit code 2 when a page came back with no words, and open those pages before calling the copy complete. OCR text is a reading, not the source: names, IC numbers and amounts are where it slips on a poor scan, and Apple Vision can drop a lone single character, such as a quantity of `1` alone in a table cell, so check every figure you quote against the page picture. Where `pdftotext` or `pandoc` is not installed, say which check was skipped rather than calling the copy verified.

## Keeping versions as a git history

1. Put the copy where the work is tracked. In a repo that keeps task docs, that is the feature's folder (`tasks/<domain>/<feature>/decisions/<name>.md`, with its `current.md` saying how to regenerate it), not a `docs/` folder.
2. Convert the **previous** version first and commit it alone, by path (`git commit -m "<name> vN" -- <path>`), so other staged work stays out.
3. Convert the new version over the same file. `git diff HEAD -- <path>` now shows exactly what changed. Commit it as the next version once reviewed.

A scanned document's copy links its `pages/` pictures. Commit them with the copy when teammates will read it in the repo (each picture is 150 to 350 KB); for a long scan kept only for its words, convert with `--no-pages` and keep the source PDF beside the copy instead.

One file per document, regenerated in place, is what makes the history readable. A new file per version gives no diff. That holds past the usual ~40 KB decisions-file size too, and for a signed client spec the team maps its documents against as much as for a contract: don't split the copy, and convert one hand-split earlier back into one file from the source.

Give readers a map instead with `python3 -I ${CLAUDE_SKILL_DIR}/../condense-task-doc/scripts/doc_outline.py <copy>` (unless the owning doc already names its own outline generator), which writes `<copy>-outline.md` beside it with each section's line range. Regenerate it in the same commit as each version, and point `current.md` at it. To keep it current, copy the script into the repo (for example `scripts/doc_outline.py`) and run `--check` from that copy, with the same flags, in whatever check already runs on commits; never gate on this plugin path, which is a versioned cache folder that gets pruned and that teammates may not have. A Word conversion usually has its sections as bold lines rather than `#` headings, so pass `--group`/`--label` prefixes as that script's help describes.

With no repo to track them (two files in Downloads, a one-off comparison), convert both versions into a scratch folder and run `diff -u old.md new.md`. Where only the new file is given and an earlier conversion is already committed, regenerate over it and diff against `HEAD`.

## Gotchas

| Symptom | Cause | Fix |
|---|---|---|
| Company name or letterhead missing from a `.docx` copy | Headers and footers live in separate parts the script does not read | Expected; check them in Word |
| Two lines of a list item render as separate bullets | Word stored them as separate paragraphs | Matches the source; leave it |
| `.xlsx` shows numbers like `45930` where a date was shown | Excel stores dates as serial numbers; the cell's format is not applied | Read the column as days since 1899-12-30, or note it in the copy's `current.md` |
| `BrokenPipeError` when piping to `head` | `head` closed the pipe early | Harmless; redirect to a file instead |
| First OCR call takes about 30 s | macOS loads Vision's models on first use after a restart | Expected; later calls are quicker |
| A PDF of typed text over a full-page scan has no page pictures | It has a text layer (a searchable scan), so its pages are not OCR'd; the script prints `full-page picture under the text on pages ...` | Rerun with `--ocr-all` to OCR it and save its pictures, for instance when a diagram on it matters |
| A scanned page is missing from the copy, but the PDF has a typed line on it | The typed line gave the page a text layer over 25 characters, so OCR skipped it | The `embedded picture(s) not read` line names the page; rerun with `--ocr-all` |
| A table cell is empty where the page shows `1` | Vision sometimes drops a lone single character | Read the value off the page picture |
| A two-column page of prose comes out as a two-column table | Rows are rebuilt from word positions, so lines side by side become cells of one row | Read each column down; the words are all there, in their own column |
