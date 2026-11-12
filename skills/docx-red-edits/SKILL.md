---
name: docx-red-edits
description: Edit someone else's Word (.docx) file with every change shown in red text, new words in red and removed lines in red strikethrough, while their own formatting, numbering, letterhead and layout stay exactly as they were. Use when the user says "update their Word file in red", "mark our changes in red", "changes in red text", "red strikethrough the deleted lines", "edit the quotation/contract/proposal they sent and show what we changed", or when a colleague or client marks their own revisions in red and expects yours the same way. Saves the result as the next version beside their file, never over it. NOT for Word's own Track Changes (insertions and deletions accepted or rejected in Word's Review pane): that is the `docx` skill's redlining. NOT for comparing two Word versions or making a text copy to diff: that is `doc-to-md`.
---

# Red edits in someone else's Word file

Some people mark revisions in red ink rather than with Track Changes: they read red as "what changed", accept or drop each red line themselves, and edit the same file in Word or Google Docs. Editing their file has one rule above the rest: **change only the bytes your edit needs.** Opening the file in a word processor and saving rewrites every part of it (WordCraft's save shrank a 22-page quotation's styles from 39 KB to 10 KB with the text intact), so the edit is made in `word/document.xml` directly, by a script that clones the owner's own runs and paragraphs and recolours them.

`scripts/redline.py` holds that machinery. A per-revision script imports it, names each change by a sentence it can find, and saves a new file. Needs `lxml`, which the system Python lacks: `python3 -m venv /tmp/redline-venv && /tmp/redline-venv/bin/pip install lxml`.

```python
import copy, os, sys
sys.path.insert(0, os.path.expanduser('~/.claude/plugins/syafiqkit/skills/docx-red-edits/scripts'))
from redline import Doc, ptext, runs

d = Doc(sys.argv[1])                                   # the owner's untouched file
p = d.one('Spelling mistakes are not corrected.')      # a paragraph found by unique text
d.replace(p, 'are not corrected', 'are corrected')     # old words out, new words in red
bullet = d.one('A neighbouring bullet in the same list')
d.insert_after(bullet, d.clone(bullet, [('A new bullet in red.', 0)]))
d.delete(d.one('A line to strike'))                    # red strikethrough, text kept
print('\n'.join(d.save(sys.argv[2])))                  # the next version, beside theirs
```

`clone(template, parts)` builds a paragraph with the template's paragraph and list formatting; each part is `(text, i)`, taking the look of the template's run `i` (so a bold label and plain body come from a paragraph that has both). `all_(text, n)` returns exactly `n` matches, for a sentence that legitimately appears twice. `red_runs()` lists text already coloured red.

## What decides whether the result is right

**Their red first.** Red runs already in the file are usually the owner's working notes. Run `d.red_runs()` before marking anything: if it lists real text, ask whether those notes stay, since your red would mix with theirs. And never recolour their red to black: that turns private notes into text the next reader takes as final.

**Their file, untouched, every time.** Build each revision from the owner's latest original, never from your own previous output, so a rerun produces the same file and a fix is one edit to the script. When their next version arrives, copy the script, drop the edits their file already contains, and point it at the new file.

**Every anchor unique, or nothing is written.** `one`, `all_` and `replace` assert their match counts, and `save` runs last, so a sentence that appears twice stops the script before the output exists. Choose anchors long enough to be unique and stable; a lookup only sees paragraphs present when the file was opened, so text the script inserts cannot be an anchor later in the same run.

**A new paragraph clones a sibling from the same list.** Bullets that look identical can belong to different list instances (`w:numId`); a bullet cloned from another module's list renders the same today but drops out when the owner renumbers or re-indents that list in Word. Clone the paragraph directly above or below the insertion point.

**Read the result as text, then as pages.** Diff a text copy of the original against the output (`doc-to-md`'s converter, or `pandoc -t gfm --wrap=none`): only the intended lines should change. Then look at the pages. No local app renders a .docx reliably on this Mac: Pages' and Keynote's AppleScript exports hang, there is no LibreOffice, and WordCraft is a layout check only. Uploading a copy as a Google Doc (gsheets `drive_file_upload` `convertTo: "doc"`, then `drive_file_export` pdf, then `pdftoppm`) shows the red faithfully but paginates differently from Word, so an owner who pads sections onto new pages still needs their own look in Word. Say which check was not run.

**Wording follows the reader.** The text goes to whoever the owner sends it to, usually a client: their terms, no em dashes, and nothing in red that the owner would not want forwarded.

## Worked example

beacon-mart's quotation revisions (`docs/proposals/quotation-v20b-edit.py`): 31 red changes to a 33-page Word quotation from a client meeting, built on the commercial owner's own file, saved as `-v20b` beside his `-v20a`, with a text copy diff and a Google Doc review copy. Its earlier sibling `quotation-v20-edit.py` predates this module and carries the same helpers inline.
