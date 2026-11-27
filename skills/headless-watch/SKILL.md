---
name: headless-watch
description: >
  Run a read-only check on a schedule on this Mac with every Claude window closed, using this Mac's files, MCP
  servers and login, and alert the user's phone (Telegram or ntfy) only when something needs them: a shared
  sheet, a tracker, a ClickUp list, a log, any check a skill or a prompt can do that ends in "alert or stay
  quiet". Fires on stopping or changing a watcher ("stop the watcher", "stop the alerts", "turn off the CRP45
  watcher", "can we stop it any time", "check every hour instead", "run it on haiku", "is the watcher still
  running"), and on "check X every 10 minutes during work hours", "even when Claude is closed", "crontab claude -p",
  "run this skill on a cron", "launchd job for claude", "alert me on Telegram if anything needs attention,
  otherwise stay quiet", "background watcher", or a pasted crontab line that calls `claude -p`. Sets up one job per check (state kept
  between runs, a cheap change gate, an alert when the watcher itself breaks, a daily "still watching" line),
  tests it end to end, and shows how to stop it. NOT for a check that only needs to run while this session is
  open (`/loop` or `watch-sheets`' own session job), NOT for a cloud agent on Anthropic's servers that cannot
  reach this Mac (`schedule`), NOT for scheduled work that writes or ships (deploys, replies, reports), and NOT
  for what the check itself looks for (that is the skill the job runs, such as `watch-sheets`).
---

# Headless Watch

A scheduled `claude -p` looks like one crontab line, and that line fails in ways that stay silent. Cron has no shell profile, so `claude` and the MCP servers' runtimes aren't on PATH. A run that can't log in still exits 0. Every run starts with an empty conversation, so a skill that remembers "last seen" in the conversation treats everything as new and alerts every time. And a watcher that speaks only when something needs the user sounds the same broken as healthy. `scripts/watcher.sh` handles all of that; this skill decides what goes into a job, installs it and proves it works.

## How a job runs

Each job is a folder `~/.claude/watchers/<name>/` holding:

- `job.env`: the project folder, models, allowed tools, days and hours, interval, alert route.
- `prompt.md`: the full check.
- `gate.md` (optional): a cheap "did anything move?" check run first on `GATE_MODEL`.

launchd runs `watcher.sh run <name>` on the interval, and the script skips times outside `DAYS`/`HOURS`. It calls `claude -p` with `--json-schema`: the gate returns `{changed, state}`, the full check `{alert, message, state}`. The script saves `state` to `state.json` (the next run's memory), sends the message itself and keeps a held copy if the send fails.

Read the script before changing behaviour. The parts that aren't obvious:

- **Alerts are sent with plain HTTP, never `--channels`.** The Telegram plugin lets one session read from a bot and kills the existing reader when it starts (`server.ts`, "replacing stale poller"). A `--channels` job every 10 minutes would knock the user's interactive Telegram session offline each time, and its `-p` session exits, so replies would go nowhere. Bot API `sendMessage` doesn't read updates, so it disturbs nothing. The token is read at send time from `~/.claude/channels/telegram/.env` and passed to curl on stdin, never on the command line. ntfy works the same way with a topic.
- **The model never holds the token or a send tool**, so the allowed tools stay reads only and a confused run can't message anyone.
- **The schedule uses calendar minutes (`StartCalendarInterval`) when the interval divides 60.** launchd runs a missed calendar job once after the Mac wakes. A plain `StartInterval` drops runs that fell during sleep (launchd.plist(5)). Days and hours are checked by the script, since launchd has no step syntax.
- **`install` copies the script to `~/.claude/watchers/bin/`.** The plugin cache folder for a version can be pruned a day after the next update, which would kill a plist that pointed into it.
- **Flags:** `--permission-mode default --permission-prompts none` with an explicit `--allowedTools`, because an unattended run otherwise inherits the user's default mode, which can be bypass. Every run also passes `--disallowedTools` for Skill, Agent, Edit, Write, NotebookEdit and git `--output`, since an allow list alone leaks: a skill pre-approves its own `allowed-tools`, and a skill's `Bash(touch *)` created a file the allow list never named (measured 27/11/2026). So a job never uses the Skill tool: `SKILL=<name>` makes the watcher find that skill's `SKILL.md` each run (project `.claude/skills`, then `~/.claude/skills`, then installed plugins) and tells the run to Read it. Also `--max-budget-usd` per run and `--no-session-persistence`, so 60 runs a day don't fill the resume list.

## Setting up a job

0. **Decide this is the right home.** It fits a check that needs this Mac (local files, MCP servers, a login) and should keep going with Claude closed. If the user only wants it while this session is open, use the session's own repeat (`/loop`, or `watch-sheets`' `CronCreate` job). If the work writes or ships something, decline: the runner forbids writes by design.
1. **Read the check's own skill first.** A job usually runs an existing skill (e.g. `watch-sheets`), and its unattended rules decide what the state may hold and what an alert may say. A skill with no unattended mode needs one first, or it will ask questions nobody answers and keep its memory in a conversation that ends. The mode is a short paragraph in that skill (model it on `watch-sheets`' "Unattended run"). It says:
   - the baseline comes from the handed-in state and goes back as returned state;
   - what that state may hold (ids, statuses, counts, dates; never copied text or names when the content is someone else's);
   - which interactive steps to skip (questions, scheduling, peer messages, channel replies);
   - that nothing is written anywhere;
   - what an alert message may say.

   A check with no skill behind it, or one run from a skill you can't edit (a marketplace install), carries those five points in its own `prompt.md` instead.
2. **Find the facts in the project, not from the user.** Look for sheet ids, folders and names in the project's CLAUDE.md, CLAUDE.local.md and config files. Check which MCP servers are connected in that folder (`claude mcp list` run there), since project-scoped servers exist only there.
3. **Write the job folder.** Use a short name. Write `job.env` from `${CLAUDE_SKILL_DIR}/references/job.env.example`, which shows every key; values are shell-sourced, so quote anything with spaces or brackets. Set `SKILL=<name>` in `job.env` for the skill the check runs, and write a `prompt.md` that says "one unattended check" of what (the watcher adds the instruction to Read the skill's file, so `prompt.md` never says to invoke or use the Skill tool), and a `gate.md` when a cheap signal exists (a file's `modifiedTime`, a count, a last-updated field). The full run's returned state replaces the file, so `prompt.md` must name the keys the gate compares (e.g. "update `state.modifiedTime`"). Otherwise the full run drops them and every gate after it reads "changed". The tools the check may use go in `ALLOWED_TOOLS`, comma-separated:
   - read tools by full name, always `Read` when `SKILL` is set, and never `Skill` (`install` moves an old job off it, see below);
   - never a wildcard over a server that also has write tools;
   - Bash only as scoped patterns (`Bash(tail *)`), never bare.

   For Telegram, `TELEGRAM_CHAT_ID` is the user's id when `allowFrom` in `~/.claude/channels/telegram/access.json` holds exactly one person and no group; otherwise ask. With no Telegram bot set up, use `ALERT=ntfy` with a long random `NTFY_TOPIC`, since an ntfy.sh topic is readable by anyone who guesses it, and have the user subscribe to it in the ntfy app. Make the folder `0700`: the state can describe client work.
   - **From a pasted crontab line:** map its fields to `DAYS`, `HOURS` and `INTERVAL_MIN`. A schedule those can't express (`0 9,13,17`) is said plainly, not approximated. Check that its prompt is a read-only check, and once the new job works, have the user remove the old line (`crontab -e`) or remove it with their yes. Left in place, it runs beside the new job with no state and no failure alert, and `uninstall` won't stop it.
4. **Prove it before installing.** Until `install` has run, the script is only in the plugin: `bash ${CLAUDE_SKILL_DIR}/scripts/watcher.sh`. Run `test-alert <name>` and confirm the message arrived. Then `run <name> --now` twice. `--now` skips the days and hours window, which otherwise makes a run outside work hours exit without a word. The first run is a full check that records the baseline, and it can send a real alert for whatever needs the user today, so say that first. The second should be a quiet gate run when `gate.md` exists; a second full run means the gate's keys are missing from the returned state. Read `run.log`, the cost per run, and `state.json`. The state must hold no copied text or names when the skill's rules forbid it. A deny in `.main.json`'s `permission_denials` means a tool is missing from `ALLOWED_TOOLS`, or the run tried one every run blocks (Skill, Agent, a file edit), which the gate run obeys too.
5. **Install, then test the real launchd context.** Run `install <name>` from the plugin copy, then `kick <name>`, which runs once now under launchd's environment, ignoring the window, where PATH and login problems show up. A kick is a real run, so it can alert. Wait for its `run.log` line (a gate run takes about 20 seconds, a full one a few minutes).
6. **Tell the user** what alerts look like and what quiet costs (the gate run's cost × runs a day, plus a full run each time something moves). Give them three things:
   - the stop line, verbatim: `bash ~/.claude/watchers/bin/watcher.sh uninstall <name>` (the morning message also says to ask Claude to stop the `<name>` watcher, so the phone carries the way out);
   - that a missing morning "still watching" message means the watcher or the alert route is broken, since a dead route can't report itself;
   - that after a plugin update, or an edit to `job.env`, running `install <name>` from the plugin copy (`bash ${CLAUDE_SKILL_DIR}/scripts/watcher.sh install <name>`) refreshes the installed script and schedule. A job set up before 1.494.0 that lists `Skill` in `ALLOWED_TOOLS` is migrated by `install` (since 1.496.0): it keeps the old `job.env` as `job.env.pre-migrate` and appends an `ALLOWED_TOOLS` without `Skill` (with `Read` added) and a `SKILL=<name>` taken from a `Skill(<name>)` entry (refused if that skill isn't installed), else from the one installed hyphenated or `plugin:name` skill `prompt.md` names on a line that asks to use, run or invoke it (a line saying never, avoid or do not use is skipped). Plain words are never taken as a skill name. `scripts/test-migrate.sh` checks these rules on eighteen job shapes in a throwaway HOME; run it after any change to the migration. With none, or several, it refuses and says what to set. `prompt.md` is left as it is (each run is told the Skill tool is off) and the lines still naming it are printed. Show the user the printed `Migrated` line and check the chosen skill.

## Managing jobs

Day to day, run the installed copy, `bash ~/.claude/watchers/bin/watcher.sh`. Only `install` runs from the plugin copy, since that is how a fixed script reaches the job. `status` lists every job: whether it's scheduled, failures in a row, last log line. `status <name>`, `run <name> --now`, `kick <name>`, `test-alert <name>` and `uninstall <name>` act on one job. `report <name>` answers "send me the status": it reads no source, only the saved `state.json`, has `GATE_MODEL` turn it into a short summary with the time of the last full check, and sends it on the alert route (about one cent, and it works with the job uninstalled). State keys a model would misread go in an optional `report.md` in the job folder, one line each (column order of a count array, a cell-to-row offset), since without it haiku guessed a `[Total, Not run, Pass, …]` array as passes (measured 27/11/2026). If the script is gone, `launchctl bootout gui/$(id -u)/syafiqkit.watcher.<name>` stops a job. `uninstall` removes the schedule and keeps the folder, so "stop for now" is `uninstall` and "start it again" is `install`. Delete the folder only when the user wants the history gone. A change ("check every hour instead", "run it on haiku") is an edit to `job.env` (`INTERVAL_MIN`, `MODEL`) followed by `install` from the plugin copy.

The morning message's stop line ("ask Claude to stop the <name> watcher, or run ... uninstall <name>") carries the shell command because a reply to the alert reaches Claude only where a Telegram Channels session is running; ntfy is one-way. A job with `HEARTBEAT=off` never sends it.

A failure alert names the reason. The usual ones:

- **Login:** run `claude` once interactively. A server-style long-lived token is the `claude-server-token` skill.
- **A missing runtime for an MCP server:** add `PATH="<its folder>:$PATH"` to the job's `job.env`, which is read after the script sets its own PATH and survives plugin updates.
- **"claude ran longer than N seconds":** an MCP server or the network hung. `RUN_TIMEOUT_MIN` (default 15) in `job.env` sets the limit.
- **The project folder moved.**

The alert fires once, at the second failure in a row (`FAIL_ALERT_AFTER`), and a "working again" line follows on recovery.

## Limits

- **macOS only.** It uses launchd and `/usr/bin/jq`. On Linux, the same script runs from a systemd timer or cron. Only `install` and `uninstall` are launchd-specific.
- **The Mac must be on and logged in.** A Mac asleep through the window catches up only the most recent missed slot after waking.
- **Each run costs real tokens.** Measured 18/11/2026 on three Google Sheets: gate $0.017, full `watch-sheets` check $0.52 on sonnet. A gate is the difference between cents and dollars a day.
