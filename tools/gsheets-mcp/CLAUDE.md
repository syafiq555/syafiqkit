# gsheets-mcp: decisions and traps

Setup and the tool list are in `README.md`. This file records why it is built this way.

| Decision | Why |
|---|---|
| Our own server rather than `domdomegg/google-sheets-mcp` (05/11/2026) | That server takes one access token from an env var at start, so every call after an hour answers 401. Its `spreadsheet_get` output schema also strips `sheets[].data`, so colours, runs, chips and validation never come back. Sessions kept writing REST scripts around both |
| bun + `@modelcontextprotocol/sdk`, same shape as `tools/remote-cli` | One runtime for the plugin's tools. The launcher resolves bun from fixed paths because MCP servers start without the shell profile's PATH |
| Switched on per project at `--scope local`, never user scope or a repo `.mcp.json` | Only the projects that use Sheets load it. A shared repo's `.mcp.json` would hand teammates an entry pointing at a sign-in they don't have |
| One token with `spreadsheets` + `drive.file`, stored apart from `~/mcps/gsheets-config` | A Sheets write touching a Drive chip needs both scopes on the same token. The old spreadsheets-only and drive-only tokens stay for scripts that use them (beacon-mart's `publish-google.py`) |
| `cell_append_line` compares the colour shown at each position, not run lists | Google normalises runs on write: a run at index 0 becomes the cell's own text format, and a default-black run at 0 in an empty cell is dropped. Comparing run lists raised false alarms on live sheets (05/11/2026) |
| Run indices are JS string offsets | Google counts runs in UTF-16 units, which is what JS `length` gives. Checked live with an emoji before the appended line |
| `cell_replace_text` takes the exact text, not "my line" or a prefix (10/11/2026) | Any reply shape works (a multi-line list included), and a single-match rule means it can never hit someone else's line. After the replaced span it re-states the colour in force there, since Google applies a run until the next one |
| After changing `src/`, reconnect `gsheets` in `/mcp` before testing through the tools | `bin/enable` registers it with `claude mcp add`, so `/reload-plugins` ("0 plugin MCP servers") leaves the old process serving the old tool list. Missed on 09/11 and again on 10/11, both times with the fact sitting in a reference nobody opened while editing here |
| A Drive chip cell is refused, not attempted | A chip must be sent back as an `@` placeholder with chip-only runs, which the append cannot do safely. Whether `drive.file` would even allow the write is untested |

**Not built yet: a second account.** A personal Google account would be a second config dir (`GSHEETS_CONFIG_DIR`) with its own `auth`, registered as a second server name (e.g. `gsheets-personal`) with that env var set.
