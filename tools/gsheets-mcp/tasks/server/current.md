<!--LLM-CONTEXT
Status: ✅ Live in beacon-mart, autorentic, dourr (local scope); uncommitted
Domain: tools / gsheets-mcp
Gotchas: Google normalises colour runs on write, so read-back checks compare the colour shown at each position, not run lists (../../CLAUDE.md)
Related: ../../README.md, ../../CLAUDE.md, ~/.claude/references/google-sheets-access.md
Last updated: 2026-11-05
-->

# gsheets-mcp: the server

## Quick Start (read this first in next session)

**Next action**: commit when Syafiq asks. The tool is untracked under `tools/gsheets-mcp/`, plus the plugin README row, CHANGELOG 1.419.0 and the manifest bump. Another session's uncommitted `setup-tracker` and `understanding-guide` work sits in the same tree, so commit by path.
**Current state**: signed in as `syafiq.shamsuddin@techstrongbox.com` (`~/.config/syafiqkit/google/`). Registered at local scope in the three projects. The old user-scope `gsheets` server was removed on 05/11/2026. Run `cd tools/gsheets-mcp && bun test` (22 pass) and `bunx tsc --noEmit`.
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
| Expired token, and a forced 401 | Refreshed, and retried once |
| Credential file upload, `enable` from a subfolder | Refused; registered the repo root |

## Next Steps

### Blocked on a test cell from Syafiq
- [ ] 🟠 **Drive chip cells.** `cell_append_line` refuses them. To learn whether the `drive.file` scope can write one back, Syafiq pastes a Drive file chip into a throwaway sheet, and the `@`-placeholder write is tried through `batch_update`.

### Deferred / accepted
- [ ] 🟡 **A second Google account** (Syafiq's personal one, asked 05/11): a second config dir plus a second server name, roughly 15 minutes. Waits until he needs it.
- [ ] 🟡 **Delete `~/mcps/google-sheets-mcp` and `~/mcps/gsheets-config/run.sh`** after a week of use. Syafiq's call; the old mint scripts stay, since `publish-google.py` uses them.
- [ ] 🟡 **Doc lines left for their owners.** `skills/setup-tracker/references/sheets-api-gotchas.md` (another session's uncommitted skill) does not mention the new tools. beacon-mart's `tasks/crp45/delivery/decisions/client-questions-30-oct.md` still says replies go "through the REST updateCells route"; its owning session was told on 05/11.
- [ ] 🟡 `cell_append_line` reads and then writes, so an edit someone makes in between is overwritten. Accepted at tracker scale.
