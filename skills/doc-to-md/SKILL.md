---
name: doc-to-md
description: Convert a Word (.docx), PDF or Excel (.xlsx) document into Markdown, so its text can be read, grepped, committed and diffed in git. Use when the user asks to "convert to md", "make a markdown copy", "turn this docx/pdf/excel into markdown", "so I can see the changes between versions", "what changed between these two versions", "compare/diff these Word files", or hands over two versions of a document that are hard to compare. The reverse direction (Markdown to PDF) is `md-to-pdf`.
---

# Document to Markdown

Turn a `.docx`, `.pdf` or `.xlsx` into one Markdown file whose text matches the source, so each new version of the document becomes a readable `git diff`.

The copy is for reading and diffing, never for sending: colour, page layout, headers and footers, and images do not survive. Say so when you hand it over, because a reviewer who edits the Markdown loses the edit at the next regenerate.

## Pick the converter

| Source | Command | What survives |
|---|---|---|
| `.docx` | `python3 -I ${CLAUDE_SKILL_DIR}/scripts/docx_to_md.py <file.docx> > <out.md>` | Body text in order, headings (Heading 1 to 6, Title), bold, bullet and numbered lists (letters and roman numerals kept as labels), tables as pipe tables (a full-width one-cell row breaks the table so its contents read as normal text), images as `[Image: alt text]` |
| `.xlsx` | `python3 -I ${CLAUDE_SKILL_DIR}/scripts/xlsx_to_md.py <file.xlsx> [--formulas] > <out.md>` | One `## Sheet` section per sheet, a pipe table each, the first row as the header. Cached values by default; `--formulas` shows `=FORMULA` instead where a cell has one |
| `.pdf` | `pdftotext -layout <file.pdf> <out.md>` (poppler) | Text with its column layout kept by spaces. A PDF has no structure to recover, so expect no headings or tables. Prefer the `.docx` the PDF was made from when one exists |

Both scripts use only the Python standard library, so any `python3` from 3.9 works. `pandoc -t gfm` is not the better choice for `.docx`: a list or second paragraph inside a table cell turns the whole table into raw HTML, which diffs badly.

⚠️ **The Markdown copy is unverified until you compare its words with the source.** A converter that skips a run type, a text box or a nested table drops text without any error, and the copy still reads complete. Before handing it over, tokenise both sides and diff them: `pandoc <file.docx> -t plain --wrap=none` against the Markdown with `|`, `*`, `#` and `-` stripped. Only punctuation, list numbers and table borders should differ. For a PDF, compare page counts against `pdfinfo`. Where `pdftotext` or `pandoc` is not installed, say which check was skipped rather than calling the copy verified.

## Keeping versions as a git history

1. Put the copy where the work is tracked. In a repo that keeps task docs, that is the feature's folder (`tasks/<domain>/<feature>/decisions/<name>.md`, with its `current.md` saying how to regenerate it), not a `docs/` folder.
2. Convert the **previous** version first and commit it alone, by path (`git commit -m "<name> vN" -- <path>`), so other staged work stays out.
3. Convert the new version over the same file. `git diff HEAD -- <path>` now shows exactly what changed. Commit it as the next version once reviewed.

One file per document, regenerated in place, is what makes the history readable. A new file per version gives no diff.

With no repo to track them (two files in Downloads, a one-off comparison), convert both versions into a scratch folder and run `diff -u old.md new.md`. Where only the new file is given and an earlier conversion is already committed, regenerate over it and diff against `HEAD`.

## Gotchas

| Symptom | Cause | Fix |
|---|---|---|
| Company name or letterhead missing from a `.docx` copy | Headers and footers live in separate parts the script does not read | Expected; check them in Word |
| Two lines of a list item render as separate bullets | Word stored them as separate paragraphs | Matches the source; leave it |
| `.xlsx` shows numbers like `45930` where a date was shown | Excel stores dates as serial numbers; the cell's format is not applied | Read the column as days since 1899-12-30, or note it in the copy's `current.md` |
| `BrokenPipeError` when piping to `head` | `head` closed the pipe early | Harmless; redirect to a file instead |
