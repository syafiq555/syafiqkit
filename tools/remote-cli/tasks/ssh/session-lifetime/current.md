<!--LLM-CONTEXT
Status: ✅ Keepalive shipped on all four SSH paths; severed-link case unverified
Domain: ssh
Gotchas (critical — full list in ## Critical Gotchas below):
  - Two SSH mechanisms in this repo — an ssh2 option reaches only half the tool
  - Backgrounding a job does not return the wrapper; only the subshell form works
Related: tasks/scp-upload/current.md, tasks/stdin-forwarding/current.md, tasks/refactoring-session.md
Last updated: 2026-07-30
-->

# remote-cli — SSH Session Lifetime

## Quick Start (read this first in next session)

**Where we are**: Keepalive is live on all four SSH call sites; a dropped link now fails at ~75s instead of hanging forever.

**Immediate next actions (in order)**:
1. Nothing is blocking. Open items are the error-message gaps in Next Steps — all need a user decision first.
2. If touching any SSH option, change `src/utils/ssh-keepalive.ts` and confirm it reaches **both** mechanisms (see D2).

**Key facts for cold start**:
- Verify flag changes with `remote --scp <srv> ./package.json --dry-run` — prints without connecting, on either command.
- Detection window is `interval × (countMax + 1)` ≈ 75s, not 60s (see D1).
- Success = a severed link prints `SSH Error: Keepalive timeout` and exits within ~75s.

**Gotchas that will trip you**:
- An ssh2 option does nothing for `--sync`/`--scp` transfers — they spawn OpenSSH binaries.
- `readyTimeout` bounds the handshake only; it never covered an established session.

---

## Overview

A `remote` invocation hung ~15 minutes on a job that had already finished. Once the SSH handshake completed there was no idle timeout and no keepalive, so a silently dropped TCP link left the promise pending forever — no error, no output, no exit. This adds SSH-level keepalive to every path so a dead link surfaces as a bounded, named failure.

---

## Architecture / Data Model

Two mechanisms, one call site each. A change to one does not affect the other.

| Mechanism | Call site | Option | Unit |
|-----------|-----------|--------|------|
| ssh2 library | `ssh/executor.ts` `executeCommand()` | `keepaliveInterval` / `keepaliveCountMax` | milliseconds |
| Spawned OpenSSH binary | `sync/executor.ts` `buildSSHCommand()` (rsync `-e` string) | `-o ServerAliveInterval` / `-o ServerAliveCountMax` / `-o ConnectTimeout` | seconds |

⚠️ rsync word-splits its `-e` string, so any interpolated path must be quoted inside `hostKeyOptionsString()`. The argv-shaped `hostKeyOptions()` was deleted with `src/scp/` — reintroducing a second shape means keeping two escaping disciplines in step; see `tasks/scp-upload/current.md` D5.

---

## Files

- `src/utils/ssh-keepalive.ts` — the constants; `_SEC` values are derived from `_MS`, never re-typed
- `src/utils/index.ts` — barrel re-export
- `src/ssh/executor.ts` — `executeCommand()` connect config (the only ssh2 call site)
- `src/sync/executor.ts` — `buildSSHCommand()` builds a space-joined string, not argv

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Keepalive on all four call sites + shared constants | ✅ |
| 2 | Type check, short-command, and 180s false-positive test | ✅ |
| 3 | Severed-link behaviour end-to-end | ⬜ mechanism verified in ssh2 source only |

---

## Key Technical Decisions

### D1 — Detection window of 15s × 4 committed — 2026-07-30

**Problem**
ssh2 ships with `keepaliveInterval` defaulting to `0`, which disables keepalive entirely, so no value was in effect.

**Decision**
Chosen: `keepaliveInterval: 15000`, `keepaliveCountMax: 4` ≈ 75s to notice a dead link.
- 15s is ssh2's own documented convention
- countMax 4 absorbs a lost probe or two on a flaky link without a false disconnect

**Rejected**
- 10s × 3: justified only by matching the existing `readyTimeout: 30000`, which measures an unrelated quantity — a handshake that should take under a second, versus how long a dead link may go unnoticed. Also adds steady traffic to every session for no gain.

**Consequences**
The real window is `interval × (countMax + 1)`, not `× countMax` — ssh2's `sendKA` increments before comparing. `keepaliveCountMax` already defaulted to 3; only the interval was strictly required, but both are set so the behaviour does not rest on an invisible library default.

**Status**: committed · **Reversible**: yes

### D2 — Constants shared, hardcoded, in both units committed — 2026-07-30

**Problem**
Four call sites across two mechanisms need the same window, but ssh2 takes milliseconds and OpenSSH takes seconds.

**Decision**
Chosen: one `src/utils/ssh-keepalive.ts` exporting `_MS`, `_COUNT_MAX`, and a derived `_SEC`.
- No call site performs its own unit arithmetic
- Matches the existing flat-file-per-concern layout in `src/utils/`

**Rejected**
- Per-server tuning via `servers.json` `defaults`: every server wants the same dead-link detection, and threading a field through `DefaultsSchema`, `ConnectionInfo`, and both arg builders is disproportionate. Additive later if a real need appears.
- A shared helper wrapping the two `-o` pushes: one consumer takes a space-joined string, the other an argv array; a helper would need a shape parameter and would hide the distinction that makes each correct. Recorded as a preserve-rule in `.claude/agents/code-simplifier.md`.

**Consequences**
A future SSH option must be added to both mechanisms deliberately — the type system cannot catch a half-applied change.

**Status**: committed · **Reversible**: yes

### D3 — No new error plumbing committed — 2026-07-30

**Problem**
A keepalive failure needs to reach the caller as a resolved exit code.

**Decision**
Chosen: rely on the existing handlers.
- ssh2 emits `Error('Keepalive timeout')` (`level: 'client-timeout'`) on the Client, which lands in the pre-existing `conn.on("error")` → `cleanup()` → `resolve(1)` path

**Rejected**
- A custom timer or new error class: duplicates a mechanism the library already implements and the codebase already handles.

**Consequences**
The fix converts an unreachable code path into a reachable one. The user-visible message is therefore ssh2's bare string with no hint — see Next Steps.

**Status**: committed · **Reversible**: yes

---

## Critical Gotchas

### Library (ssh2)
| Issue | Rule |
|-------|------|
| `readyTimeout` looks like a session timeout | It bounds the handshake only. An established session has no idle timeout unless keepalive is set. |
| Keepalive appears configured but never fires | `keepaliveInterval` defaults to `0`, which disables it. `keepaliveCountMax` defaults to `3`, so the interval is the load-bearing setting. |
| A long quiet command is not killed by keepalive | Probes are transport-level; a live sshd answers them regardless of what the command is doing, and each answer zeroes the counter. |
| Keepalive does not bound every hang | It only catches a *dead link*. A hang on a healthy link — an unread channel stream that never emits `close` — is invisible to it; that needs a settle-guard and an explicit deadline. See `tasks/scp-upload/current.md` G1. |

### Spawned binaries (rsync)
| Issue | Rule |
|-------|------|
| An ssh2 option has no effect on an upload | `--sync`/`--scp` `spawn()` the system `rsync` and never touch ssh2 — use `-o` flags in seconds. |
| ⚠️ Keepalive does **not** bound connection establishment | `ServerAliveInterval` governs an already-established session, and a spawned `ssh` inherits no `readyTimeout` — so only `-o ConnectTimeout` stops an unreachable host stalling indefinitely. All three timeouts are separate; none substitutes for another. |
| Verifying flag construction needs no server | `--dry-run` echoes the real command line and returns before spawning, on both commands. rsync's own `-n` is server-side, but the echo is built client-side, so no connection is needed. |

### Process lifetime
| Issue | Rule |
|-------|------|
| Backgrounding a job does not return the wrapper | `executeCommand()` resolves on ssh2's stream `close`, which waits for every fd-holder in the exec channel. Use `( setsid <cmd> </dev/null >/tmp/x.log 2>&1 & )` — the fd redirection is load-bearing, not `setsid`. Measured table: `~/.claude/.claude-companions/shared/CLAUDE-remote-cli.md`. |

---

## Last Session

- Added keepalive to all four SSH call sites behind shared constants in `src/utils/ssh-keepalive.ts`.
- Confirmed against ssh2's source that `keepaliveInterval` defaults to `0` and that exhaustion routes into the existing `conn.on("error")` handler.
- 180s quiet session on prod returned exit 0 at 180s — the false-positive check, 2.4× the detection window.
- Corrected the stale "30-second SSH timeout prevents hanging connections" claim in `CLAUDE.md` and in `executeCommand()`'s docblock.

---

## Next Steps

### Missing failure signals
- [ ] 🟠 `SSH Error: Keepalive timeout` carries no hint and exits 1, indistinguishable from a remote command that legitimately exited 1. Every other error class in `src/errors.ts` attaches a hint.

### Blocking full confidence
- [ ] 🟠 The severed-link case is unverified end-to-end — it needs the network killed mid-command. Mechanism confirmed in ssh2's source only.

### Deferred / accepted
- [ ] 🟡 ~75s of silence before the error appears, with no progress signal. Accepted as the cost of a window wide enough to absorb packet loss.
- [ ] 🟡 A max-execution-time cap still does not exist — idle detection is not a runtime cap. Tracked in `tasks/refactoring-session.md`.
