---
name: setup-tools
description: Set up syafiqkit's own tools on this machine for the person running it - the Google Sheets and Drive tool (gsheets), the Google Chat tool (gchat), the Gmail tool (gmail) and the `remote` SSH command - each with their own Google Cloud project and sign-in, step by step until a real read works. Fires on "set up the Google Sheets tool", "set up gchat / Google Chat for me", "set up the Gmail tool", "I want Claude to send email", "how do I get the Chat tools", "gsheets tools are missing", "I want the remote command", "set up the plugin's tools", "the gchat server won't connect", "the Sheets or Chat tool stopped working" (repair: check its sign-in first), or a colleague asking how to use the Sheets, Chat or remote tools named in the syafiqkit README. Not for building a tracker sheet (`setup-tracker`), using the tools once they work, or a server's Claude login (`claude-server-token`).
---

# Set Up syafiqkit's Tools

Four tools ship inside syafiqkit, all off until each person sets them up:

| Tool | Gives Claude | Needs |
|---|---|---|
| gsheets | Read and write Google Sheets, find and fetch Drive files, reply in shared tracker cells without wiping others' colours | Any Google account (Workspace or personal Gmail) and their own Google Cloud project |
| gchat | Read, search, send and edit Google Chat messages as them, every send behind a permission prompt | A **Google Workspace** (Business or Enterprise) account. Google's Chat API guide lists that as a prerequisite, so a personal Gmail cannot use it |
| gmail | Search and read their mail, download attachments, and send or reply in a thread as them, every send behind a permission prompt | The Gmail API in the same Cloud project. Its read scope is one Google calls restricted: fine for a Workspace (Internal) client; a personal Gmail must get past the unverified-app screen |
| remote | `remote <server> "command"`, uploads and downloads over SSH | SSH access to their servers, `rsync` for uploads |

Each person uses **their own** Google Cloud project and sign-in; nothing is shared through the plugin. Borrowing someone else's project shows that project's Chat app name beside every message they send, and ties their access to someone else's console.

The reader is usually a colleague setting this up for the first time, often not a developer. Give one console step at a time, say what they should see when it worked, and wait for them before the next. Plain words over Google's jargon.

**A tool that worked and stopped** (revoked or expired sign-in, a server that won't connect): skip to step 5's `check --read` for that tool, then the table at the end. Most repairs are one `auth` again.

## 1. Find the tools

The tools live in the plugin's install folder: read `~/.claude/plugins/known_marketplaces.json`, take `syafiqkit.installLocation`, and the tools are `<installLocation>/tools/gsheets-mcp`, `tools/gchat-mcp`, `tools/gmail-mcp` and `tools/remote-cli`. For a GitHub install that is `~/.claude/plugins/marketplaces/syafiqkit`, and it stays put across plugin updates.

⚠️ **Never register a tool from `~/.claude/plugins/cache/...`**, even though this skill's own folder is there. Cache folders are per version and old ones are deleted as soon as a day after an update, so a server registered from one stops starting with no message beyond "failed to connect". If `known_marketplaces.json` has no `syafiqkit` entry, ask how they installed the plugin before guessing a path.

Then check the basics once: `bun` (the launchers also look in `~/.bun/bin`, `/opt/homebrew/bin`, `/usr/local/bin`; if absent, the install command is on bun.sh) and the `claude` command on PATH (the enable scripts call `claude mcp add`).

## 2. Ask what they want

One `AskUserQuestion` with two questions: which tools (multi-select: Sheets, Chat, Gmail, remote), and which Google account they will sign in with (company Workspace, or personal Gmail). Skip the account question when only remote was picked.

Gmail plus Chat: say plainly that Google Chat's API is for Workspace accounts only, and carry on with the rest. If Chat was all they wanted, stop here, before any console steps: nothing else would be of use to them. Should a Workspace account still be refused at Chat sign-in, capture Google's exact message rather than guessing.

Chat and Gmail reuse the Sheets tool's OAuth client file, so the Google Cloud steps enable every API they picked in one pass even if they skipped Sheets. Sheets itself is only switched on if they asked for it. A second Google account (a personal Gmail beside work) is its own sign-in under its own name: `<tools>/gmail-mcp/bin/enable gmail-personal` uses its own config folder and prints the exact `auth` command (with a client from a project that account can use) when it isn't signed in yet. If that account already has a Sheets sign-in under its own folder (a `GSHEETS_CONFIG_DIR` beside the work one), its published External client serves Gmail too: pass that folder's `client.json` as `--client` and the only console step left is enabling the Gmail API in its project.

## 3. Google Cloud project and OAuth client (gsheets, gchat)

📖 `references/google-cloud-console.md` has every click, the direct console links and the Workspace/Gmail branch. Read it now and walk them through it a step at a time. It ends with a downloaded `client_secret_….json`; ask for its path.

Before you start, offer to drive the console in their Chrome through the `claude-in-chrome` tools if those are connected. They still sign in themselves; never type a password.

What decides the branch, inline because it is the step people get wrong:
- **Workspace account**: Audience **Internal**. Sign-ins last until revoked, no verification screens.
- **Personal Gmail**: Audience **External**, then **Publish app** (In production). A client left in Testing issues sign-ins that expire after 7 days, so the tools would break weekly. Google then shows "Google hasn't verified this app" at sign-in; it is their own app, so Advanced → Go to (app) is expected.

## 4. Chat app page (gchat only)

Google refuses every Chat API call, sign-ins included, until the Chat API's **Configuration** page is saved ("Google Chat app not found"). The reference file has the fields. Say this before they type the name: **Google shows this app name as a label beside every message they send through the tool**, so they should use their own name, not "Claude" or a test name.

## 5. Sign in

Use the paths from step 1. macOS and Linux only; on Windows the tools need WSL.

Have them run each `auth` themselves by typing it with a `!` in front (`! <tools>/gchat-mcp/bin/gchat-mcp auth …`). It prints a Google link and waits for the browser; inside your own Bash call that link stays hidden until the command ends, and on a machine where the browser doesn't open by itself they need to see it. They must tick **every** permission box, since a sign-in missing one is refused ("Google granted … Nothing was stored."). If they can't type `!` commands (some Claude apps have no `!`), or it gives up before they finish in the browser, run `auth` yourself in the background, read the Google link from its output file, give it to them, and say they have about 5 minutes to finish.

- **gsheets**: `<tools>/gsheets-mcp/bin/gsheets-mcp auth --client <their client_secret json>`
- **gchat**: after a Sheets sign-in, `<tools>/gchat-mcp/bin/gchat-mcp auth` reuses that client file. **Chat without Sheets: pass `--client <their client_secret json>`**, or it finds no client.
- **gmail**: `<tools>/gmail-mcp/bin/gmail-mcp auth`, reusing the Sheets client file the same way (or `--client …`).

Once signed in, the downloaded `client_secret_….json` has been copied into the tool's private folder, so suggest deleting it from Downloads.

Then prove each sign-in reads real data, which you can run yourself: `<tools>/gsheets-mcp/bin/gsheets-mcp check --read` (Drive and the Sheets API answer) and `<tools>/gchat-mcp/bin/gchat-mcp check --read` (Chat answers and says how many spaces it saw; 0 is fine for a new account), and `<tools>/gmail-mcp/bin/gmail-mcp check --read` (prints the signed-in address and a count of the last day's mail). A "has not been used in project" error here means an API from step 2 of the console steps is still off.

**Personal Gmail and Sheets**: the Drive read scope the tool asks for is one Google treats as restricted. An unverified app used by its own owner should still sign in past the warning screen, but this path is not yet tried on a real Gmail account. If Google blocks the sign-in outright, tell them it is a known gap and capture the exact message.

## 6. Switch on

- **gchat**: `<tools>/gchat-mcp/bin/enable` once. It registers for every folder (user scope).
- **gmail**: `<tools>/gmail-mcp/bin/enable` once, also user scope.
- **gsheets**: registers per folder (local scope), so first ask which folders they start Claude in. `<tools>/gsheets-mcp/bin/enable` from inside each one (from a git repo's subfolder it takes the repo root). A colleague who isn't a developer and wants Sheets everywhere: `claude mcp add gsheets --scope user -- <tools>/gsheets-mcp/bin/gsheets-mcp` instead, after `claude mcp get gsheets` shows no existing one (this skips `enable`'s own checks). Say which they got: with `enable`, Sheets only appears in sessions started in those folders.
- **remote**: follow `<tools>/remote-cli/README.md` § Setup (bun install, a link in `~/.local/bin`, `~/.config/remote-cli/servers.json`), using the step 1 path wherever it writes `~/.claude/plugins/marketplaces/syafiqkit`. Build `servers.json` with them from their `~/.ssh/config` hosts where they have some: ask which hosts, and write `sshAlias` entries. A password goes in `secrets.json`, which **they** write; never ask for a password in chat, since the transcript keeps it. A password-only server also needs `sshpass` for uploads (`brew install sshpass` on a Mac with Homebrew). Prove it with `~/.local/bin/remote --list`, then `~/.local/bin/remote <id> "hostname"`: the full path, because your shell won't see a PATH change made now. If `command -v remote` is empty in their own terminal, add `export PATH="$HOME/.local/bin:$PATH"` to their shell profile (`~/.zshrc` on a Mac); plain `remote` then works in a new terminal.

## 7. Hand over

A server registered during this session does not load its tools here. Tell them to start a new Claude session, then ask. `/mcp reconnect <name>` only reaches a server the session already knew at start: for one added now it answers `MCP server "<name>" not found` (19/11/2026, `gmail-personal`), so offer it only after a re-registration of a name the session started with. Then ask something real: "list my Chat spaces", or "read the tabs of <a sheet link>". Their DMs should show the other person's name.

Report what works in their words ("Claude can now read your Chat spaces"), what `check --read` already proved, and that one sentence to try next.

## When it fails

| They see | Cause | Fix |
|---|---|---|
| `Error 403: org_internal` | An Internal client and an account outside that Workspace | Sign in with the Workspace account, or make an External client in their own project |
| "has not been used in project … or it is disabled" | That API is not enabled in the client's project | Enable the API named in the message, wait a minute, retry |
| "Google Chat app not found" | The Chat API Configuration page was never saved | Step 4 |
| A sign-in that worked stops after about a week | External client still in Testing | Publish the app, then `auth` again |
| "Google granted … Nothing was stored." | A permission box was left unticked | Run `auth` again and tick every box |
| `enable`: "A server named gsheets is already visible" or "A server named gchat is already registered" | An older registration | `claude mcp remove <name> -s <scope>` as printed, then `enable` again |
| "bun not found" from a launcher | bun outside the three places the launcher looks | Install bun to `~/.bun` with its installer |
| Project creation or consent blocked by the organisation | A Workspace admin restricts Cloud projects or third-party apps | Only their Workspace admin can allow it; tell them what to ask for |
| Times shown in the wrong zone | The tools use this machine's time zone | Re-register with the zone: `claude mcp remove <name> -s <scope>` (gsheets is `local`, run inside that project; gchat is `user`), then `claude mcp add <name> --scope <scope> --env SYAFIQKIT_TZ=<zone, e.g. Europe/London> -- <tools>/<tool>/bin/<launcher>`, adding `--env GSHEETS_CONFIG_DIR=…` / `GCHAT_CONFIG_DIR=…` again if the old one had it (`claude mcp get <name>` shows it) |

Each tool's own `README.md` beside it has the full tool list, scopes and limits.
