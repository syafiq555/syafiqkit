<!--LLM-CONTEXT
Status: 28 numbered builds, each with its status and what has been seen live; ⏳ marks what no real session has shown yet.
Domain: plugin-maintenance/mod (builds)
Gotchas (critical): ✅ means built and kit-tested, not seen live; read the ⏳ parts before saying a build works in a real session.
Related: `../current.md` (index), `live-checks.md`
Last updated: 2026-11-04
-->

# The Mod: Builds by row

What each numbered build does and what has been seen live. Routed from `../current.md` § Task Status.

## Key Technical Decisions {#decisions}

Builds 1 to 28, in build order: what shipped and what has been seen live. A build is not a choice between options, so there are no MADR fields.

### 1. Menu and band: one-press Commit and Done (confirm and hand-off form removed in 1.414.0) · ✅

### 2. Task-doc browser: filter, recents, size badges, open items pickable, decisions on their own page; list layout is task 11 · ✅

### 3. Mermaid as pictures · ✅

Needs `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` in iTerm2.

### 4. Session handoff (haiku summary), Resume starts with `/syafiqkit:read-summary` · ❌ removed in 1.414.0

Removed on the user's call (2026-10-27).

### 5. Done confirm with optional hand-off afterwards · ❌ removed in 1.414.0

Done sends in one press.

### 6. README front door and `/commit push` wording (1.374.0) · ✅

### 7. Source split into `hooks/src/` and bundled; Wrap up renamed Done · ✅

### 8. Diagrams without `mkdir`/`mv`/`openssl` (Windows; handoffs removed in 1.414.0) · ✅

Built, untested on Windows.

### 9. Real-session soak, older-client check, `SYAFIQKIT_MOD=0` via shell and via settings.json · ⏳

### 10. Decisions file over 40 KB (`DECISION_MAX_BYTES`) makes its task doc heavy · ✅

- Whatever `current.md`'s size, a decisions file over 40 KB flags its task doc heavy.
- The row shows `⚠ decisions <size>`, or `⚠ N decisions, max <size>` (no file name since 1.382.0).
- Decisions pages have Condense (`dec-condense`, `k`) and Split (`dec-split`, `t`; `s` is Send). Both run on haiku and both ask first.
- Cancel returns to the calling view (`confirm.back`); Send sets `reopen`. A shrink request asks for a split with `current.md` as router.
- Doc Shrink asks task-summary to judge (1.376.0).

### 11. Docs list: folder headers, recents, over-limit flags, one `heavyOnly` view · ✅

- Task docs sit under folder headers (`▾ tenant (9)  ⚠ 4`), press to collapse, rows indented, no per-row folder column.
- The five most recent are on top with folder and status. They stay in their folder too (1.389.0), so a recent doc does not vanish from its folder.
- Over-limit docs are flagged inline. The old NEEDS SHRINKING list is one `⚠ N over the size limit · show` button that opens the `heavyOnly` view.
- Blank line and bold header per section (1.382.0).

Seen live on an 8-doc repo only.

### 12. `/changes`: tree, stacked diffs, stage and discard · ✅

- A tree plus stacked diffs with line numbers, red/green rows and changed words marked.
- Stage, unstage per file, folder, section and all. Discard asks first.
- Opens on Changes when anything is unstaged, otherwise on both.
- A doc and a decisions page have a Changes button (diff against HEAD) (1.384.0).

Seen live except the last fix round.

### 13. `show_image` gallery: PNGs Claude names appear under a band button · ✅ ⏳

- The band shows an `Images (N)` button for PNGs Claude names; the pane never opens itself (1.384.0).
- One scrollable stack, newest first, replacing one-at-a-time Prev/Next, with Open in viewer per image and Clear and Close on top.
- Desktop draws through `Svg` with numbered chips; big pictures use a `sips` copy.

- ✅ Terminal pictures drew in the user's iTerm2 once build 3's variable was in `~/.claude/settings.json`. The Desktop `Svg` picture drew for the user on 2026-10-11 ("now image looks no issue").
- ⏳ The `sips` copy is built and checked offline (a 2000-px screenshot came out at 59k characters at 720 px) but unseen in Desktop. The terminal stack with 12 tall pictures is unseen.

### 14. `/changes` on big and multi-repo change sets · ✅ ⏳

- Diffs are read only for the focused files and kept per file.
- Nested repos are listed as stacked groups, each with its own stage, unstage and discard. `Add repo` adds a path and `✕` hides a repo, both for the session only (1.386.0).

- ⏳ Not seen live.

### 15. `/changes` says what it hides · ✅ ⏳

- Under `Changes only`, a line `Staged Changes (N) hidden · show` (section, folder or file focus).
- A changed doc-type file (task doc, decisions file, `CLAUDE.md`, `docs/*.md`, `.claude/rules/*.md`) has a `Doc` button (`Open doc`, `o`, on its file page) that opens the task-docs reader.
- `< Back to changes` returns to the same list or file page (1.386.0).

- ⏳ Not seen live.

### 16. `/changes` in Claude Desktop (narrow layout) · ✅

- Narrow layout (about 700px): file rows are label buttons with a separate coloured status letter.
- Each section and folder has a `view` button beside its name (the name still folds) that opens a page of just that group's diffs. Each folder row has a `+`/`−` button that stages or unstages the folder.
- The stacked page reads diffs one at a time, untracked files last and through `git diff --no-index`, with a `Diffs: N of M read` line and `Reading diff…` placeholders.
- Desktop draws dark hex red/green rows (`DESKTOP_DIFF`).
- The 150-row cap and the collapsed rows are replaced by build 18.

Seen in Desktop: tree, `view`, diffs and Back.

### 17. Desktop redesign, all behind `isDesktop(e)` so the terminal is unchanged · ✅ ⏳

- Native primary and dismiss buttons; tinted section strips with count chips.
- A clickable change map (log-weighted blocks; hover lights the file row).
- Doc rows with a size gauge.
- `/sk` grouped under SHIP WORK / DOCS / SESSION (renamed REVIEW in 1.414.0), with an "asks first" chip.
- Confirm pages with primary Send.
- Gallery picture chips; `view ›` buttons; the folder path shortened to its last two parts.

- ✅ The user saw `/changes`, the menu, the docs list and the gallery in Desktop on 2026-10-11.
- ⏳ Light theme, doc reader and confirm pages unseen.

### 18. Long pages draw only the rows near the scroll position, Desktop and terminal · ✅ ⏳

Covers the `/changes` overview list, All diffs and the file page.

- Every file is open and read: no "N files collapsed" and no 40- or 100-file caps. Hide/Show diff (Desktop) or `▾` (terminal) folds one; showing a file with no diff reads it.
- Desktop rows are one line high in the lists. Diff lines wrap with a height estimated from length (`DESKTOP_WRAP_CHARS` = 140, biased low: too low only jumps, too high can blank the bottom).
- Terminal diff lines are hard-wrapped into one-row pieces, so heights are exact.
- The window covers half a screen above the scroll position and a screen and a half below. The scroll hook redraws after a third of a screen.

- ✅ Desktop seen working on the user's 68-file beacon-mart (scroll, file page, long markdown).
- ⏳ Not run in a real terminal.

### 19. Debug log and tree checks · ✅

- `modLog` writes `~/.claude/doc-pane-cache/mod.log` (last 300 lines, re-read before each append so two sessions do not overwrite each other; consecutive repeats skipped).
- It logs oversized Desktop pages, failed or timed-out git calls, `sips` failures and `ui.fault`.
- A tree with a repeated sibling key, or a hover scope over 64 characters, shows "This page could not be drawn here" on Desktop, with Close and Changes.

### 20. Main-doc tag in `/task-docs` (1.389.0) · ✅ ⏳

- A task doc whose first `Domain:` line contains `(hub` (`isHubText`) sorts first in its folder with a `main doc` tag, at the start of the row's tail in the terminal and as a muted chip on Desktop. The folder line reads `main: <name>`.
- In a folder of repos it marks `beacon-mart`'s `crp45/delivery` and `marketplace/core`. A "detail hub" Domain line does not match.

- ⏳ Not seen in a real session.

### 21. Desktop diff page gets stage-all buttons, and every pane page a floating ↑ Top · ✅ ⏳

- Desktop diff page (`desktopChangeAllView`) gets `Stage all N` (`a`) and `Unstage all N` (`u`), scoped to the page. A plane or folder focus stages only that scope (an empty path means the whole plane), and the page follows its files to the other plane. "All changes" shows one button per plane; a single-file page shows none.
- The terminal already had these on its section headers (`a`/`u`), so a copy in the diff column was removed after review for a hotkey clash.
- Every pane page gets a floating ↑ Top (`withFloats` in `views/pane.js` since 1.392.0). It shows past 3 rows and scrolls to the start; the scroll hook redraws on every scroll while it shows (1.390.0).

- ✅ Built. Desktop drew the button, but its press blanked a long page on 2026-10-12: the jump sends no `ui.scroll`, so `windowedRows` kept the old offset. `windowedRows` now reads the render's `e.props.scroll`, except on the first render after a page change, which still draws from the top.
- Review flagged, unmeasured: whether keyboard Home/End fire `ui.scroll`. If not, Home deep in a page could blank the same way until the next redraw.
- ⏳ The press after that fix is unseen.

### 22. Syntax colours in `/changes` diffs, Desktop and terminal (1.391.0) · ✅ ⏳

- `git/syntax.js` tokenizes each line (keyword, string, number, call, type, comment; `SYNTAX_TONE`), with separate block-comment state for the old and new side. Rows stay flat with the red/green tint and the changed-word mark.
- Languages by extension: PHP; C-style (JS, TS, Vue, Dart, JSON, SCSS…); CSS; `#`-comment (Python, Ruby, shell, YAML); markdown (heading, fence, list marker, `code`, link target).
- `.blade.php`, unknown types, and lines over 400 characters (`SYNTAX_MAX_CHARS`) stay plain.
- On Desktop, uncoloured stretches are bare strings rather than `Text` elements, to keep the page small.

- ✅ Built.
- ⏳ Not seen in Desktop or a terminal.

### 23. Pinned bars on Desktop (1.392.0) · ✅ ⏳

- Once scrolled, `withFloats` (`views/pane.js`) draws an absolute Box at the scroll offset on `DESKTOP_TONE.page`, holding the page's top row and the current section.
- Pages register the top row with `stickyTop` (`pageBar` does it for every Changes page and the gallery; list, doc and decision pages call it directly). Windowed items marked `sticky` set the section. An item counts as passed `STICKY_COVER_ROWS` rows early, so the swap happens as it slides under the bar.
- Pinned: All changes file strips and group titles, overview STAGED/CHANGES strips, the single-file header, and the `/task-docs` Menu row, Filter and folder headers.
- Copies use the `stk-` key prefix, drop hotkeys and `autoFocus` (`liveOnly`), and skip actions marked `unpinned` (Add repo).
- The terminal pins nothing: the host theme has no page background colour.

- ✅ Built.
- ⏳ Not seen in Desktop.

### 24. Copy (`y`) and Open in editor (`o`) on the `/task-docs` doc and decision pages (1.395.0-1.395.1) · ✅ ⏳

- Desktop does not let a pane's text be highlighted, and no element prop makes it selectable, so the page needs these two keys.
- `copyDocFile` (`docs/export.js`) reads the file from disk at press time, never the reshaped text (which turns tables into bullets and cuts at 90,000 characters). It tries `$.ui.copy`, then falls back to `pbcopy`, `xclip` or `clip` with the text on stdin, unless the copy was refused.
- Open runs `viewerCommand` (`open`, `xdg-open` or `start`).

- ✅ Built.
- ⏳ Not pressed in Desktop.

### 25. Close crash fix (1.395.2) and non-text diffs (1.396.0) · ✅ ⏳

- A pane that is not open draws nothing: `paneView` and `ui.scroll` return `next` while `state.isOpen` is false. `ui.close` resets only after the host accepts the close, so a refused close keeps the pane and is logged to `mod.log`.
- `openChanges` sets `state.isOpen` before `$.ui.open`: the new guard would otherwise blank its first render.
- 1.396.2 redraws the band once, 400 ms after close (`redrawBandAfterClose`). The cause of the expanded-mode crash was not reproduced, so the fix is defensive; the blank expanded frame is still unexplained (`live-checks.md` item 000).
- `readDiff` attaches `diff.media` (`git/media.js`) for binary or over-256 KB files. On Desktop, `sips` makes before and after previews; PDFs use `qlmanage` (page 1, `sips` fallback). Previews are memoised by path, mtime and size.
- The open file's poll also compares the picture's media stamp, so a picture edited again refreshes.
- `diffBodyItems` (`views/changes.js`) picks media, Rendered/Raw markdown (new `.md` only) or plain lines. Gallery single-pick cuts a picture into `SLICE_HEIGHT` parts (`ensureSlice`), re-running for the current part after a cut finishes.

- ✅ Built. A real `sips` crop and PDF-to-PNG were checked by hand.
- ⏳ Nothing seen in Desktop; expanded-mode close not retried; row height estimate for pictures (`MEDIA_ROW_PX`) unmeasured.
- Known and unfixed: the All diffs signature ignores a re-edited tracked picture (numstat is `-/-`), and `~/.claude/doc-pane-cache/m-*` files are never swept.

### 26. Terminal `/task-docs` OPEN items (1.396.3 to 1.397.3) · ✅ ⏳

- A long item is word-wrapped (`wrapWords`, emoji count as two cells) to `bodyColumns - 10`, since the host clipped one long label.
- A multi-row item draws as a keyed `Box`: the first row a `Button`, each further row a one-line `Button` that picks the item too. Every row shares one hover scope (`hoverScope`), so pointing at any row lights all of them.
- Items over `ITEM_CAP_ROWS` (3) show 3 rows and a dim `… N more line(s)` row. The `e` button (`Expand N long` / `Collapse long`, `state.expandItems`) expands all of them and shows only when some item exceeds the cap.
- A picked item gets `┃` and `╹` (cyan) down its rows, next to `▶N`; a picked capped item reads `(included)`.
- `/task-docs` list rows get a `textMeter` gauge (`█░`) with `N/limit`, in place of the size figure.
- `bandView` returns `next(e)` while `e.props.hasSurvey`, so the band stops covering a "Heads up" notice.
- Desktop keeps its single wrapping label.

- ✅ Hover group seen live in 1.397.1.
- ⏳ Not seen live: the click on continuation rows, the `(included)` marker, the survey yield, and Tab/Enter on continuation rows.

### 27. Narrow panes (1.398.2) · ✅ ⏳

- `flexWrap: 'wrap'` on the doc reader toolbar (top and bottom), decision top row, docs list header, `/changes` Close row, single-file diff toolbar (`cf-back` row), terminal image header, and the band's launch and "N selected" rows.
- Terminal confirm shows the whole `Effect:` line (no truncate); Desktop file-page name truncates from the start.
- Left alone on purpose: rows inside `windowedRows` items (fixed `height`) and two-button rows.
- Found at about 40 columns in Desktop, where the band clipped its later buttons.

- ✅ Shipped in 1.399.0.
- ⏳ Unseen live.

### 28. Narrow lists (1.398.3) · ✅ ⏳

Terminal, under `NARROW_COLUMNS` (60):

- The docs list row shows only the name (at most 45% of the width) and the tail. It drops age and gauge, and the scope moves into the tail so CLAUDE.md chain rows stay distinguishable.
- `/changes` tree floor is 24 (was 40). The narrow section caption pads to `min(26, treeWidth - 18)` so `view` and `+ all` stay on screen. The All-changes file header's path floor is 8 (was 16), with counts unpadded below 16.
- The caption is clipped to its pad width (`clip`), since `padEnd` never shortens it and "▾ Staged Changes (120)" overran at 40 columns.

Desktop gets no width switch: it may not send `bodyColumns` (unmeasured), and its list rows are windowed at height 1, so `desktopDocRow` stays one line.

- Name, gauge and label boxes shrink (gauge and label first, `flexShrink: 4`, `overflow: 'hidden'`); the age box shrinks too; the tail keeps `minWidth: 20`.
- Desktop open items are a Button with a wrapping Text child, because Desktop cut a `label` off with "…".

- ✅ Shipped in 1.399.0.
- ⏳ Unseen live.
