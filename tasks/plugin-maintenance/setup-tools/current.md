<!--LLM-CONTEXT
Status: 🚀 Built and reviewed (1.442.0); no colleague has run it yet
Domain: plugin-maintenance / setup-tools
Gotchas: register tools from the plugin's installLocation, never plugins/cache (old versions are deleted about a week after an update)
Related: ../../../tools/gchat-mcp/tasks/server/current.md, ../../../tools/gsheets-mcp/tasks/server/current.md, ../../../skills/setup-tools/SKILL.md
Last updated: 2026-11-17
-->

# plugin-maintenance: setup-tools

## Quick Start (read this first in next session)

**Next action**: have one colleague run it cold ("set up the Google Chat tool for me") in a session started after updating, and note where they stall.
**Current state**: `skills/setup-tools/` (SKILL.md plus `references/google-cloud-console.md`) and the supporting tool changes ship in 1.442.0. Both tools' `check --read` passed live on Syafiq's sign-ins 17/11/2026.
**Success looks like**: a colleague with no Google Cloud project ends with `check --read` passing and, in a new session, "list my Chat spaces" answering from real data.

## Overview

Lets anyone who installs syafiqkit set up the gsheets, gchat and `remote` tools for themselves: their own Google Cloud project and OAuth client, sign-in, registration, then a real read. Decided with Syafiq on 17/11/2026: open to anyone (not only TSB), each person in their own project, started through a skill rather than a README alone; `remote` added as an optional third tool the same day.

## Key decisions

| Decision | Why |
|---|---|
| Each person makes their own Google Cloud project | Google shows a project's Chat app name beside every message sent through it, so a shared project would label colleagues' messages with someone else's name; it also ties their access to another person's console |
| Chat is offered only to Google Workspace accounts | Google's Chat user-auth guide (developers.google.com/workspace/chat/authenticate-authorize-chat-user, read 17/11/2026) lists "A Business or Enterprise Google Workspace account with access to Google Chat" as a prerequisite |
| Workspace → Internal audience; Gmail → External, published to production | An External client left in Testing issues sign-ins that expire after 7 days |
| Tool paths come from `installLocation` in `~/.claude/plugins/known_marketplaces.json` | The skill's own folder is the versioned cache, which the prune hook deletes after an update |
| `gsheets-mcp check --read` / `gchat-mcp check --read` prove a read in the same session | A server registered mid-session doesn't load its tools until a new session or `/mcp reconnect`, so without a CLI read the setup session could only prove a token. The Sheets probe asks for a nonexistent spreadsheet and treats Google's `404: Requested entity was not found.` (measured) as "API on" |
| The user runs `auth` as `! <command>` | Inside Claude's Bash call the printed sign-in link stays hidden until the command ends; fallback is a background run whose output file Claude reads |

## Gotchas

| Symptom | Cause | Fix |
|---|---|---|
| Headless trigger test answered correctly but never invoked the skill | One `claude -p` run (plan mode, 17/11/2026) found `skills/setup-tools/SKILL.md` by grep and answered from the file | One run proves nothing about auto-firing; test in a normal session started after the update |
| Sign-in on Linux crashed before printing anything | `Bun.spawn(['open', …])` throws "Executable not found" synchronously | Fixed: `xdg-open` off macOS, inside try/catch with a "open the link above" line |

## Next Steps

### Blocking a confident rollout
- [ ] A colleague's first cold run, Workspace account (where do they stall?)
- [ ] A personal Gmail run of the Sheets path: `drive.readonly` is a restricted scope, and an unverified External app signing in past the warning screen is assumed, not seen

### Deferred / accepted
- [ ] A Workspace admin who blocks Cloud projects or third-party apps: only named as an ask to the admin, untested
