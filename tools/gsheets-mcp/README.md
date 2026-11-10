# gsheets-mcp

A Google Sheets and Drive MCP server for Claude Code, switched on per project.

## What it adds over a plain Sheets server

- **It renews its own sign-in.** It refreshes its access token before it expires, and retries once on a 401. A server that is handed one token at start-up stops working after an hour.
- **It replies in shared trackers without changing anyone's colours.** `cells_read_rich` shows each cell's coloured runs, its cell-wide colour, any Drive file chip and its dropdown rule. `cell_append_line` adds a line in an explicit colour (black by default) and keeps every existing run. It then reads the cell back and reports an error if the result is wrong. `cell_replace_text` changes your own earlier text in the same way: give the exact text (it must occur once in the cell) and its replacement, which gets an explicit colour while the text after it keeps its own. Both refuse a hidden cell inside a merged block, where a reply would never show, and names the block's top-left cell to use instead; `cells_read_rich` marks those cells `hiddenByMerge`. A plain value write (`values_update`) replaces the whole cell and turns coloured comments plain. `cells_awaiting_reply` answers "what is waiting for us?" in one call: over a reply column it lists only the cells where text in another colour follows your last line (who wrote what comes from colour, not from names), `alsoRead` puts each row's other columns beside it, and `statusColumn` leaves out rows whose status is in `skipStatuses` (Closed by default).
- **It clears stray dropdowns.** `validation_clear` removes a dropdown or validation rule. Without that, text written into such a cell shows as an invalid chip, and picking from the dropdown overwrites the cell.
- **It reaches Drive.** `drive_file_upload`, `drive_file_update` and `drive_file_get` handle files this sign-in created, including files inside a folder shared with the account.
- **It shows what Google drew.** `drive_file_export` saves a Google Doc, Sheet or Slides file as Google renders it (pdf by default), and `slides_thumbnails` saves one PNG per slide. A .pptx or .docx converted on upload is laid out by Google, not by the app that wrote it (Google ignores PowerPoint's shrink-to-fit, for one), so check these rather than the local file. `slides_thumbnails` needs the Google Slides API enabled in the OAuth client's Cloud project; until then it answers 403 "has not been used in project … or it is disabled", and `drive_file_export` to pdf covers the same check.

It also has the usual tools: `values_get` (including formulas), `values_batch_get`, `values_update`, `values_batch_update`, `values_append`, `values_clear`, `spreadsheet_get` (any field mask, grid data included), `sheets_list`, `sheet_add`, `sheet_delete`, `spreadsheet_create` and `batch_update`.

## Sign-in

You need bun and a Google OAuth client of the Desktop-app type, saved as `client.json`.

```sh
tools/gsheets-mcp/bin/gsheets-mcp auth --client /path/to/client.json   # once; opens the browser
tools/gsheets-mcp/bin/gsheets-mcp check                                # confirms the sign-in works
```

- **What it asks for:** exactly three scopes: `spreadsheets`, `drive.file` and `drive.readonly` (since 10/11/2026, so a reply can keep a Drive file chip linking a file the account can see). If Google grants anything else, it stores nothing. A token from before then has to sign in again with `auth`.
- **Why one token carries both:** a Sheets call that touches a Drive file chip needs both scopes on the same token.
- **Where the files go:** both are written with mode `0600` to `~/.config/syafiqkit/google/` (override with `GSHEETS_CONFIG_DIR`).
- **No token is ever printed.**
- **Revoked sign-in:** a call then says so. Run `auth` again.

Writes reach only files this sign-in created or was handed (`drive.file`). `drive.readonly` lets it read any file the account can open, and a file the account has no access to answers 404. The upload tools refuse files holding credentials (this sign-in's own folder, `~/.ssh`, `.env` files).

Each person signs in with their own Google account and OAuth client; nothing is shared through the repo. An OAuth client created as Internal inside a Google Workspace signs in only that Workspace's accounts. Any other account (a personal Gmail) gets `Error 403: org_internal`, so it needs an External client of its own, or a `SHEETS_TOKEN` from the OAuth Playground for a one-off build. Publish that client's consent screen (Audience, In production) before signing in, because a client still in Testing issues sign-ins that expire after 7 days. Publishing asks for a homepage and a privacy-policy link on the Branding page. Keep each account in its own folder and run `GSHEETS_CONFIG_DIR=<folder> bin/enable` in the repo that should use it. The registration carries the folder, so one repo can use a personal account while the others keep the work one.

## Switching it on for a project

From inside the project (a subfolder works too: it registers the repo root):

```sh
<plugin>/tools/gsheets-mcp/bin/enable    # claude mcp add --scope local gsheets -- <launcher>
<plugin>/tools/gsheets-mcp/bin/disable   # removes it again
```

- **Why local scope:** the entry lives in this machine's Claude config for this project only. Nothing is written into the repo, so teammates who don't have the sign-in get no broken server.
- **When it takes effect:** run `/reload-plugins` in a Claude Code session in that project (or start a new one).
- **An existing `gsheets` server blocks it:** `enable` refuses while another server named `gsheets` is visible from the project (a user-scope one, for example). Remove that one first.

The launcher finds bun on its own (`~/.bun/bin`, `/opt/homebrew/bin`, `/usr/local/bin`), because Claude Code starts MCP servers without your shell's PATH. On first start it installs the dependencies if they are missing.

## Known limits

- **Drive file chips:** a reply in a cell holding one keeps the chip, but Google allows it only when the signed-in account can open the linked file (Google re-fetches it on every rewrite). A file a client attached without sharing it with the account is refused: nothing is written, and the error names the file. Ask for access, or paste that reply into the sheet by hand.
- **Apps Script triggers:** writes through the API never fire an `onEdit` trigger.
- **Concurrent edits:** `cell_append_line` reads, then writes. An edit someone makes to the same cell in between is overwritten. If a read-back fails after the write, don't retry: the line is already in.

## Development

```sh
bun install
bun test
bunx tsc --noEmit
```
