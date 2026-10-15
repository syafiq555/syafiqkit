<!--LLM-CONTEXT
Status: 🚀 Shipping to colleagues in syafiqkit 1.399.0 (first release inside the plugin)
Domain: remote-cli / distribution to colleagues
Gotchas (critical; full list in ## Gotchas below):
  - `claude plugin test .` loads every *.test.ts in the plugin, so this tool's suites are *.spec.ts
  - Commands and --get accept any host key (ssh2 has no hostVerifier); only uploads check known_hosts
Related: ../stdout-capture/current.md, ../scp-upload/current.md
Last updated: 2026-10-15
-->

# remote-cli: Distribution

## Quick Start (read this first in next session)

**Where we are**: `remote` moved into the public syafiqkit repo at `tools/remote-cli` and ships to colleagues in 1.399.0, with a README carrying the setup and a CHANGELOG entry. Colleagues link from the plugin's git clone at `~/.claude/plugins/marketplaces/syafiqkit/tools/remote-cli`, which keeps its path across plugin updates (the per-version cache copy does not).

**Immediate next actions (in order)**:
1. Decide whether to add host-key checking to the ssh2 paths (Next Steps), now that the tool is public and documented for others.
2. Have one colleague follow `README.md` § Setup from scratch and note where it breaks.

---

## Overview

The tool was Syafiq's own; moving it into the plugin made it public and reachable by colleagues. This doc holds what that move required and what is still open for other users.

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| `bin/remote` is a POSIX `sh` wrapper, not a `#!/usr/bin/env bun` trampoline | Under a minimal PATH (hooks, cron) `env` could not find bun. The wrapper follows its own symlinks and probes PATH, `~/.bun/bin`, `/opt/homebrew/bin`, `/usr/local/bin`; checked with `env -i PATH=/usr/bin:/bin` |
| Colleagues link from the marketplace clone, not the cache | The cache folder is per version, so a link into it dangles after an update. A GitHub marketplace is a git clone of the whole repo (`source: "./"`), so `tools/` is there |
| Suites renamed `*.test.ts` to `*.spec.ts` | `claude plugin test .` ran them as mod tests and failed on `bun:test` imports; bun still picks up `.spec.ts` (57 pass) |
| Config stays in `~/.config/remote-cli` | The repo is public; `servers.json` holds hosts, users and paths |

---

## Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| Upload with `appPath: "~/app"` and `--to` creates a literal `~` folder | `mkdir -p "~/app/sub"` inside double quotes does not expand `~` | `buildMkdirChain` swaps a leading `~` for `$HOME` after validation (dry run now shows `mkdir -p "$HOME/app/sub"`) |
| `remote --edit` fails without VS Code, or with `EDITOR="code -w"` | Defaulted to `code` and spawned without a shell | `VISUAL`, then `EDITOR`, then `vi`, through a shell, after creating the config folder |

---

## Next Steps

- [ ] 🟠 Host-key checking for `remote <server> "cmd"` and `--get`: ssh2 `connect()` sets no `hostVerifier`, so a network attacker could read a password login and the output. Trust-on-first-use against `known_hosts` would match the rsync path. Documented as a gap in README and CHANGELOG meanwhile
- [ ] 🟡 `~/.ssh/config` parsing ignores `Host a b` aliases after the first, `Host *` defaults, `Include`, and an alias without `HostName`
- [ ] 🟡 `secrets.json` chmod failure is swallowed; the config folder is not created 0700; `servers.json` is not mode-checked
- [ ] 🟡 `CONFIG_PATH` is double-quoted into the `--edit` shell command, so a `REMOTE_CLI_CONFIG_DIR` containing `"` or `$` breaks it
- [ ] 🟡 Windows is unsupported (sh wrapper, `~/.local/bin`); stated as macOS and Linux

---

## Last Session (2026-10-15)

A `/done` review before the 1.399.0 ship found the minimal-PATH failure, the `~` mkdir bug, the `--edit` default, the plugin-test collision and docs calling `servers.json` "checked in"; all were fixed and the README was rewritten from the `bun init` stub.
