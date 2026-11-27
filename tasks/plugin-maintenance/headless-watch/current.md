<!--LLM-CONTEXT
Status: 🚀 Built; 1.494.0 watchers read their skill instead of loading it; crp45-sheets live again hourly since 27/11
Domain: plugin-maintenance / headless-watch
Gotchas (critical; full list in ## Critical Gotchas below):
  - Never `--channels` on a scheduled run: the Telegram plugin kills the existing poller on load
  - The installed copy at ~/.claude/watchers/bin/watcher.sh only changes on `install`
Related: skills/watch-sheets/SKILL.md (its "Unattended run" paragraph), ~/.claude/.claude-companions/shared/CLAUDE-headless.md#phone-channel
Last updated: 2026-11-27
-->

# syafiqkit: headless-watch Summary

## Quick Start (read this first in next session)

**Where we are**: `headless-watch` runs read-only checks from launchd with Claude closed. Since 1.494.0 a run can't use the Skill tool: the job names its skill with `SKILL=<name>` and the run reads that skill's file (Key Technical Decisions table). The one job, `crp45-sheets`, was uninstalled after 18/11; it was migrated to `SKILL=` on 27/11 and reinstalled hourly (owner: "Every 1hr for now"), weekdays 9 to 19; its launchd kick ran a quiet gate (US$0.014).

**Immediate next actions (in order)**:
0. Full checks run on haiku since 27/11 (owner's call; test full run on unchanged sheets: 8 turns, US$0.019, quiet, baseline kept). Eyeball the first real haiku alert for accuracy; if it misreads a row, go back to `MODEL=sonnet`.
1. Read `~/.claude/watchers/crp45-sheets/run.log` after a working day: count full runs against gate runs, and check that alerts matched rows that really were our turn.
2. If full runs fire on edits that never need us (many `quiet ($0.5…)` lines), make `gate.md` compare something narrower than `modifiedTime`.

**Key facts for cold start**:
- Live job: `bash ~/.claude/watchers/bin/watcher.sh status crp45-sheets`; stop with `... uninstall crp45-sheets`.
- Test without waiting for the schedule: `run <name> --now` (shell) or `kick <name>` (launchd context).
- Success looks like: one "Watching today" Telegram message each work-day morning, `quiet (gate, $0.017)` lines, and an `ALERT sent` line only for rows that are our turn.

**Gotchas that will trip you**:
- A fix to `scripts/watcher.sh` reaches a running job only after `install` copies it again.
- A `run` outside `DAYS`/`HOURS` exits silently from launchd (prints a hint only on a terminal).

---

## Overview

A scheduled `claude -p` from cron fails silently in four ways: no PATH to `claude` or MCP runtimes, exit 0 on a failed login, no memory between runs (so a conversation-baseline skill alerts every time), and silence that can't tell healthy from broken. `headless-watch` is one script plus a skill that sets up a job per check and proves it end to end. Built 18/11/2026 from Syafiq's crontab idea for the CRP45 sheets, generalised at his request ("make it as general").

```mermaid
flowchart TD
  L[launchd: minute slots] --> W{in DAYS/HOURS?}
  W -- no --> X[exit, no log]
  W -- yes --> G[gate.md on haiku: drive_file_get modifiedTime]
  G -- unchanged --> S1[merge state, log quiet]
  G -- changed --> M[prompt.md on sonnet: watch-sheets unattended]
  M --> V{alert?}
  V -- no --> S2[save state, log quiet]
  V -- yes --> T[curl Bot API sendMessage]
  T -- fails --> U[hold in unsent.txt, retry next run]
  G & M -- error/timeout --> F[fails += 1; alert at 2; 'working again' on recovery]
```

---

## Architecture / Data Model

| Field | Value | Notes |
|-------|-------|-------|
| Job folder | `~/.claude/watchers/<name>/` (0700) | `job.env`, `prompt.md`, optional `gate.md`, `state.json`, `run.log`, `fails`, `heartbeat`, `unsent.txt` |
| Verdict | `--json-schema` → `structured_output` | gate `{changed, state}`, main `{alert, message, state}`; `structured_output` field verified 18/11 on 2.1.327 |
| Flags | `--permission-mode default --permission-prompts none --allowedTools=… --max-budget-usd --no-session-persistence` | prompt piped on stdin (avoids the variadic `--allowedTools` swallowing args) |
| Schedule | `StartCalendarInterval` minute dicts when interval divides 60, else `StartInterval` | calendar jobs run once on wake (launchd.plist(5)); StartInterval drops sleep-time runs |
| Run limit | `RUN_TIMEOUT_MIN` (15) watchdog kills claude | marks `.timedout`, counts as a failure |
| Gate state | `jq -s '.[0] * .[1].structured_output.state'` | merged, so a gate can't drop keys only the full run writes |

---

## Files

- `skills/headless-watch/SKILL.md`: when to use, setup steps 0 to 6, managing jobs, limits.
- `skills/headless-watch/scripts/watcher.sh`: `run [--now]`, `install`, `uninstall`, `kick`, `test-alert`, `status`.
- `skills/watch-sheets/SKILL.md`: "Unattended run" paragraph (state holds ids, statuses, counts, dates; never text or names) and the session-vs-closed fork in Setup.

---

## Key Technical Decisions

### D-send-not-channels: alert by Bot API sendMessage, not `--channels` [committed] · 2026-11-18

**Problem**
Syafiq's crontab line expected `--channels` for Telegram.

**Decision**
Chosen: the script sends with curl `sendMessage`, token read at send time from `~/.claude/channels/telegram/.env` and passed on stdin.
- The plugin kills the existing getUpdates poller when a session loads it (`server.ts:58-73`), so a 10-minute job would knock the `claudetelegram` session off each run, and the `-p` session exits so replies go nowhere.
- `sendMessage` doesn't poll, so it disturbs nothing.

**Rejected**
- `--channels` per run. Why not: steals the bot, and is one-way anyway.

**Consequences**
Alerts are one-way. Answering happens in an interactive session.

**Status**: committed · **Reversible**: yes

| Decision | Rationale |
|----------|-----------|
| Model returns a verdict; script sends | The model never holds the token or a send tool, so allowed tools stay read-only |
| Every run passes `--disallowedTools` (Skill, Agent, Edit, Write, NotebookEdit, git `--output`); a job's skill is `SKILL=<name>`, read as a file; `install` refuses `Skill` and a `SKILL` without plain `Read` (1.494.0) | an allow list alone leaks: in a watcher-shaped run a skill's own `allowed-tools: Bash(touch *)` wrote a file, while with Skill denied and the file read instead the touch was refused; `git diff --output` was refused too (all measured 27/11/2026; rubric and rounds: `decisions/score-loop-1494.md`) |
| launchd, not cron | cron skips runs during sleep and has no profile PATH |
| `install` copies the script to `~/.claude/watchers/bin/` | the plugin cache version folder can be pruned a day after the next update |
| Failure alert at the 2nd failure in a row, plus a daily heartbeat | one transient blip stays quiet; a missing heartbeat catches a dead alert route, which can't report itself |
| No text dedup in the script | the skill's state already keeps a raised row quiet until it moves; a text match swallowed a client's second reply worded the same (review 18/11) |
| Failure alerts carry a short reason, details stay in `run.log` | a claude error result can quote sheet text, and the alert goes to a third-party chat |
| `install` refreshes the copy only when run from the plugin copy, and says so | the installed copy can't know where the plugin lives; it prints "not refreshed" instead of silently keeping old code |

---

## Critical Gotchas

### Running and testing
| Issue | Rule |
|-------|------|
| `run` outside the window does nothing | use `run <name> --now`; `kick` writes `.force` so the launchd run ignores the window too |
| First full run with empty state can alert | `watch-sheets` raises what is our turn as it stands; say so before the first run |
| `permission_denials` in `.main.json` | a tool is missing from `ALLOWED_TOOLS`; a prompt that invokes a skill needs `Skill` |
| A pasted crontab line left installed | runs beside the job with no state or failure alert; `uninstall` won't stop it |

---

## Last Session

- 27/11/2026: a peer session's review of the mod's Enhance fork found that an allowed Skill lets other skills load and pre-approve their tools; measured the same leak in a watcher-shaped run, fixed it in 1.494.0 (score loop 20/20 from both judges, `decisions/score-loop-1494.md`), and migrated `crp45-sheets` (`SKILL=syafiqkit:watch-sheets`, `Skill` dropped, prompt no longer says to invoke the Skill tool). Its `run --now` from the plugin copy read the skill file, hit no denials, and sent a real alert (US$0.59). Then reinstalled at INTERVAL_MIN=60 on the owner's call; the launchd kick logged `quiet (gate, $0.014)`.
- Earlier measurements still hold: gate run about $0.017, full sonnet `watch-sheets` run $0.41 to $0.59.

---

## Next Steps

### Missing failure signals
- [ ] 🟠 Keychain login under launchd with the screen locked is unverified; if a locked-screen run fails, move the job to a `claude setup-token` token (`claude-server-token`).

### Deferred / accepted
- [ ] 🟡 First full run did not alert on Tracker row 60 (Pending TSB), recorded as parked until after go-live; confirm with Syafiq whether parked Pending TSB rows should alert.
- [ ] 🟡 Linux support (systemd timer) only if a colleague asks; only `install`/`uninstall` are launchd-specific.
