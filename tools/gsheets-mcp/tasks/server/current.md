<!--LLM-CONTEXT
Status: ✅ Live in beacon-mart, autorentic, dourr (local scope); uncommitted
Domain: tools / gsheets-mcp
Gotchas: Google normalises colour runs on write, so read-back checks compare the colour shown at each position, not run lists (../../CLAUDE.md)
Related: ../../README.md, ../../CLAUDE.md, ~/.claude/references/google-sheets-access.md
Last updated: 2026-11-10: `cells_awaiting_reply` (which tracker rows wait for a reply, with a status filter), checked live; 2026-11-05
-->

# gsheets-mcp: the server

## Quick Start (read this first in next session)

**Next action**: commit when Syafiq asks. The tool is untracked under `tools/gsheets-mcp/`, plus the plugin README row, CHANGELOG 1.419.0 and the manifest bump. Another session's uncommitted `setup-tracker` and `understanding-guide` work sits in the same tree, so commit by path.
**Current state**: signed in as `syafiq.shamsuddin@techstrongbox.com` (`~/.config/syafiqkit/google/`). Registered at local scope in the three projects. The old user-scope `gsheets` server was removed on 05/11/2026. Run `cd tools/gsheets-mcp && bun test` (47 pass on 10/11) and `bunx tsc --noEmit`.
**Success looks like**: a session in one of the three projects replies on a client tracker with `cell_append_line`, and the client's blue lines stay blue.

## Overview

A Sheets and Drive MCP server, switched on per project. Setup and tools are in `../../README.md`; why it is built this way is in `../../CLAUDE.md`.

### Checked live (05/11/2026, on throwaway sheets, since deleted)

| Behaviour | Result |
|---|---|
| Reply after a blue run, in a whole-cell blue cell, and after an emoji | Blue kept, the new line black, offsets right |
| Hidden cell in a merged block F6:F11 | `cell_append_line` on F8 refused and named F6; the reply in F6 worked |
| `validation_clear`, whole-column read `F:F` | Worked |
| `cell_replace_text` (10/11/2026): a two-line reply between two blue lines rewritten as a longer lettered list; text that occurs twice | Blue lines kept, the replacement black, the following blue line shifted correctly; the repeated text refused with nothing written |
| `cells_awaiting_reply` (10/11/2026) on beacon-mart's CRP45 tracker, F2:F80 | 18 cells where a blue line follows our last black one, the same set a by-hand colour read found; with `statusColumn` E, 9 Closed skipped and 9 open left |
| `drive_file_download` (12/11/2026), through a fresh stdio server: an uploaded .docx (a beacon-mart quotation, `rtpof=true` link) and a Google Doc | The .docx saved byte-identical to a local copy (`cmp`); the Google Doc refused with a pointer to `drive_file_export` |
| Expired token, and a forced 401 | Refreshed, and retried once |
| Credential file upload, `enable` from a subfolder | Refused; registered the repo root |

## Next Steps

### Waiting on Syafiq's call
- [ ] 🟠 **Drive chip cells on files the tool didn't make.** Built 10/11/2026 (1.421.14): both reply tools keep a chip, which worked live on a throwaway sheet chipping a file the tool created (blue line kept, chip in place, new line black). A client's attachment still fails with "Permission denied", the account's own access aside, because `drive.file` can't open it. Re-consented 10/11 with `drive.readonly` added (Syafiq's call; previous token at `refresh.json.bak-20261110`). The beacon-mart tracker's two chip files still answer 404 to this account's Drive API, since it has no access to either, so the chip write is still refused there. Next: once the files are shared with the account, retry one chip cell. That settles whether `drive.readonly` is enough for Google's chip fetch.

### Waiting on another session
- [ ] 🟠 **Version bump and CHANGELOG for `drive_file_download`** (built 12/11/2026, Syafiq's yes in a beacon-mart `/done`; committed without a bump). The tree held another session's unreleased 1.422.0 (`claude-server-token`, plus `plugin.json`, `marketplace.json`, `CHANGELOG.md` uncommitted), so a bump then would have shipped its work. Once 1.422.0 is committed, add 1.422.1 covering both pieces built that day: "`drive_file_download` saves an uploaded .docx, .xlsx, .pptx or .pdf from Drive byte for byte; `drive_file_export` only handles Google files" and "new skill `docx-red-edits`: edit someone else's Word file with changes in red and deletions in red strikethrough, through `scripts/redline.py`" (skill folder committed; its rows in `CLAUDE.md` both tables and `README.md` were added uncommitted on top of 1.422.0's edits, so commit them with the bump). Running sessions need `/mcp reconnect gsheets` and `/reload-skills` to see them.

### Approved, not built
- [ ] 🟠 **A read-only tool for Office files on Drive** (Syafiq said yes 10/11/2026). `sheets_list` answers 400 "The document must not be an Office file" for an .xlsx, .pptx or .docx a client attached, and `drive_file_export` only exports Google files, so a session reading one hand-rolls a token refresh and a download. Wanted: one tool (suggested name `drive_office_read`) that takes a file id, downloads with `GET /drive/v3/files/<id>?alt=media` on the existing `drive.readonly` scope, parses in memory and returns text, never writing the file to disk (client files are often under NDA). For .xlsx: per sheet, each non-empty cell's address, value and formula, plus the cached formula results and the text inside SmartArt (`xl/diagrams/drawing*.xml`), which no cell carries. For .pptx: per slide, the text and speaker notes. For .docx: paragraphs and tables. Cap the output and say when it was cut. The by-hand steps that worked on 10/11 are in `~/.claude/references/google-sheets-access.md` § Reading and writing safely. After building, reconnect the server in `/mcp`.

### Deferred / accepted
- [ ] 🟡 **A second Google account** (Syafiq's personal one, asked 05/11): a second config dir plus a second server name, roughly 15 minutes. Waits until he needs it.
- [ ] 🟡 **Delete `~/mcps/google-sheets-mcp` and `~/mcps/gsheets-config/run.sh`** after a week of use. Syafiq's call; the old mint scripts stay, since `publish-google.py` uses them.
- [ ] 🟡 **Doc lines left for their owners.** `skills/setup-tracker/references/sheets-api-gotchas.md` (another session's uncommitted skill) does not mention the new tools. beacon-mart's `tasks/crp45/delivery/decisions/client-questions-30-oct.md` still says replies go "through the REST updateCells route"; its owning session was told on 05/11.
- [ ] 🟡 `cell_append_line` reads and then writes, so an edit someone makes in between is overwritten. Accepted at tracker scale.
