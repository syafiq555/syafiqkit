# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!--LLM-CONTEXT
[Scope]: CLI tool for executing commands on remote servers via SSH + file sync (rsync/scp)
[Stack]: Bun, TypeScript, ssh2, zod
[Architecture]: Modular with src/ directory structure
[Key modules]: ssh/ (command exec), sync/ (all uploads — both --sync and --scp), get/ (SFTP download, --get), cli/ (parsing)
-->

---

## Essential Commands {#commands}

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Run CLI | `bun run index.ts` or `remote` (if aliased) |
| Type check | `bun run typecheck` |
| Test | `bun test` |

> **No build/deploy step.** This tool lives in the syafiqkit plugin at `tools/remote-cli/`; `~/.local/bin/remote` is a symlink to `tools/remote-cli/bin/remote`, a POSIX `sh` wrapper that follows its own symlinks to find `../index.ts` and looks for `bun` on PATH, then in `~/.bun/bin`, `/opt/homebrew/bin` and `/usr/local/bin`, so it runs from hooks and cron, which lack the shell profile. Editing source here takes effect on the next `remote` invocation. Setup on a new machine: `bun install` here, then `ln -sfn "$PWD/bin/remote" ~/.local/bin/remote`.
>
> **Config never lives here.** `servers.json` and `secrets.json` stay in `~/.config/remote-cli/` (override with `REMOTE_CLI_CONFIG_DIR`), because the plugin repo is public and `servers.json` holds hosts, users and paths.

---

## CLI Usage {#usage}

```bash
remote                          # Interactive server selection
remote <server> "command"       # Direct execution
remote <server> "php" < x.php   # Pipe a local script to a remote interpreter (stdin)
remote --sync <server> <path>   # Upload files/dirs via rsync
remote --scp <server> <file>    # Upload single file via scp
remote --get <server> <path>    # Download one file via SFTP (--to <local>, -n)
remote --list                   # List all servers
remote --edit                   # Open config in editor
```

### Capturing output (clean stdout) {#stdout-capture}

For `remote <server> "command"`, stdout carries **only the remote command's bytes** — the banner, `Sent`, progress and errors all go to stderr. So capturing, redirecting and piping are all safe, binary included:

```bash
VAL=$(remote <server> "cat /etc/hostname")     # exactly the file, no ANSI
remote <server> "gzip -c dump.sql" | gunzip     # binary survives the pipe
remote <server> "cmd" > out.txt                 # banner still shown on the terminal
remote <server> "cmd" 2>/dev/null               # suppress decoration entirely
```

Before 2026-08-14 the banner went to stdout and silently corrupted every capture — a credential read back as `Access denied`, a dump as `not in gzip format`. Two carve-outs: `--dry-run`'s `Would run:` line and the `--help`/`--list` screens are on stdout because they are those commands' own output. A **real** `--sync`/`--scp` transfer is a third: rsync runs with `stdio: "inherit"` and `--progress`, so its own chatter reaches stdout directly and is not covered by this guarantee. Rationale in {#principles}.

### Piping scripts over stdin (mangle-free) {#stdin-pipe}

When stdin is redirected/piped (not an interactive TTY), `executeCommand()` forwards
it to the remote command. This lets you feed a multi-line script to a remote
interpreter **without any shell escaping**:

```bash
remote "Production" "php" < /tmp/diag.php          # whole PHP file over stdin
remote "Production" "cd /var/www/app && php" < x.php
```

The script bytes travel on stdin, so neither the local zsh nor the remote shell
ever parses them — `$`, `??`, `{}`, quotes, `%` all stay intact. **This replaces the
old base64-bootstrap workaround** (`base64 -i x.php | remote <srv> "base64 -d > /tmp/x && php /tmp/x"`)
for complex scripts. Use base64 only if you must support a stdin-deaf channel.
Interactive commands (TTY stdin, no redirect) are unaffected — stdin is not piped,
so they don't block waiting on EOF.

**Upload options** (both `--sync` and `--scp`): `--dry-run`/`-n`, `--exclude <pattern>`, `--flags "<rsync-flags>"`, `--to <remote-path>`

**`--scp` is an alias of `--sync`** — one rsync-backed executor, one flag set. It differs only in printing the byte count for a single-file source (`Sent <path> (<size>) -> …`); a directory omits it, since `statSync` would report the inode size. Both accept directories.

**`--to` (both commands)**: destination relative to `appPath`, or absolute used as-is. It overrides the mirrored path rather than appending to it, and is **required when the local path is absolute** (an absolute source has no cwd-relative segment to mirror). Unknown flags and missing flag values are rejected, so a typo errors instead of being silently ignored.

Server matching: exact ID, number from list, partial name, or tag.

**`--get` downloads over SFTP on the same ssh2 login**, so password-only servers need no `sshpass`. The remote path is relative to `appPath`, `~/...`, or absolute; SFTP has no `~`, so home paths are sent home-relative. It writes `<target>.part`, compares the byte count with the remote `stat`, and only then renames; stdout carries just the local path. One file per call; there is no directory download.

**`--dry-run` echoes the real command line and never connects** — on both commands, the fastest way to verify a change to rsync flag construction. `executeSync` prints `Would run: …` and returns before spawning; rsync's own `-n` is server-side and would require a connection, so the echo (built client-side) is the assertion target instead.

---

## Architecture {#architecture}

```
index.ts              # Entry point - orchestration only
src/
├── types.ts          # All interfaces + Zod schemas
├── errors.ts         # Custom error classes with hints
├── config/
│   ├── paths.ts      # CONFIG_DIR, CONFIG_PATH, SECRETS_PATH
│   ├── loader.ts     # loadConfig(), loadSecrets() with validation
│   └── index.ts      # Re-exports
├── ssh/
│   ├── parser.ts     # parseSSHConfig() from ~/.ssh/config
│   ├── connection.ts # buildConnection() with auth resolution
│   ├── executor.ts   # executeCommand() with cleanup
│   └── index.ts      # Re-exports
├── sync/
│   ├── executor.ts   # executeSync() — the only upload path (--sync and --scp)
│   └── index.ts      # Re-exports
├── get/
│   ├── executor.ts   # executeGet(), resolveSource(), resolveTarget(): SFTP download
│   └── index.ts      # Re-exports
├── cli/
│   ├── parser.ts     # parseArgs() → CLICommand union type
│   ├── commands.ts   # showHelp(), showList(), openEditor()
│   ├── interactive.ts# selectServer(), promptCommand()
│   └── index.ts      # Re-exports
├── server/
│   ├── matcher.ts    # findServerMatch() fuzzy matching
│   └── index.ts      # Re-exports
└── utils/
    ├── colors.ts     # ANSI color constants
    ├── path.ts       # expandPath(), validatePath(), toPosixPath(), hasUnsafeShellChars()
    ├── permissions.ts# ensureSecurePermissions()
    ├── ssh-keepalive.ts # keepalive constants (ms for ssh2, sec for spawned ssh) + SSH_CONNECT_TIMEOUT_SEC + hostKeyOptionsString()
    ├── scp-dest.ts   # resolveDestination() --to/absolute rules, formatBytes(), sentSize()
    └── index.ts      # Re-exports
tests/
├── helpers.ts       # writeFixtureConfig(), writeLiveFixtureConfig(), runCli(), runCliLive(), CliCase
├── live-sshd.ts     # startLiveSshd()/stopLiveSshd()/sshdAvailable() throwaway loopback sshd
├── live-upload.spec.ts # Real-transfer cases against that sshd
└── upload.spec.ts   # Table-driven feature tests
```

### Key Design Patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Zod validation** | `src/types.ts` | Runtime config validation with XOR constraint |
| **Custom errors** | `src/errors.ts` | Structured errors with hints for user guidance |
| **Discriminated unions** | `CLICommand` type | Type-safe command handling |
| **Resource cleanup** | `src/ssh/executor.ts` | Prevents SSH connection leaks |
| **stdin forwarding** | `src/ssh/executor.ts` | Pipes local stdin → remote command when `!process.stdin.isTTY` (script-over-stdin); skipped for interactive TTY to avoid blocking |
| **rsync `.` marker** | `src/sync/executor.ts` | Preserves relative path structure with `--relative` flag |
| **Remote mkdir via `--rsync-path`** | `src/sync/executor.ts` | `buildMkdirChain()` prefixes rsync's own remote command with `mkdir -p "<dir>"`, so one connection creates the destination and transfers. Replaced a separate ssh2 `mkdir` stage, deleting a two-auth-stack seam |
| **Alias via one option flag** | `src/cli/parser.ts` | `--scp` calls `parseSyncArgs(args, i, true)`, emitting `type: "sync"` + `singleFile`. One executor, one flag set; no second near-identical path to keep in step |
| **Destination resolution** | `src/utils/scp-dest.ts` | Single owner of the `--to`/absolute/relative rules |
| **Shared path utils** | `src/utils/path.ts` | `toPosixPath()`, `hasUnsafeShellChars()` |
| **Shared keepalive constants** | `src/utils/ssh-keepalive.ts` | One source for both units — ssh2 takes ms, a spawned `ssh` takes seconds via `_SEC` |

---

## Testing {#testing}

Two suites, both driving the real CLI as a subprocess and asserting on its output. Nothing is exported for testing; internals are covered through the public surface.

| Suite | Covers |
|-------|--------|
| `tests/upload.spec.ts` | Offline: arg construction and destination resolution via `--dry-run` against unroutable hosts (`runCli()`), plus stdout/stderr stream separation |
| `tests/live-upload.spec.ts` | Real transfers against a throwaway loopback `sshd` from `tests/live-sshd.ts` (`runCliLive()`) — bytes landing, the `Sent` line, nested remote `mkdir`, loud failure on an unwritable destination, and that captured stdout carries no ANSI and survives a gzip round-trip |

| Fact | Detail |
|------|--------|
| Config isolation | `REMOTE_CLI_CONFIG_DIR` overrides `CONFIG_DIR` (and so `SECRETS_PATH`). `tests/helpers.ts` generates a fixture `servers.json` + dummy key at runtime; both are gitignored |
| Fixture hosts | `192.0.2.0/24` (RFC 5737 TEST-NET-1) — guaranteed unroutable, so no test can reach a real server |
| Adding a case | One row in the `CliCase[]` table: `name`, `args`, optional `expect`/`reject` substrings, optional `fails: true` |
| `--dry-run` is offline on both commands | `executeSync` returns after echoing, so every dry-run case is fast and deterministic. A case needing a real connection must omit `--dry-run` and expect the 4s `runCli` timeout |
| ⚠️ A `reject:` needle that can never appear passes while asserting **nothing** | `reject: ["-P "]` survived the move to rsync because rsync spells the port `-p`; a needle naming deleted code (`"only transfers single files"`) does the same. Before adding a `reject:`, `grep -rn "<needle>" src/` — zero hits means the assertion is vacuous. Prefer a positive `expect:` on the correct output |
| ⚠️ `CliResult.output` merges stdout and stderr | A case asserting on `output` passes whichever stream the text used, which is how the banner sat on stdout undetected. Anything about stream routing must assert on `.stdout`/`.stderr` separately |
| Raw bytes need `spawnSync` directly | `runCli`/`runCliLive` strip ANSI from both streams, so a case testing for escape bytes must capture with `encoding: "buffer"` itself — see `capture()` in `tests/live-upload.spec.ts` |
| `runCli` caches by argv | A case whose result depends on state changing mid-suite must not reuse another case's argv |
| `runCliLive` is uncached | A real transfer has side effects, so its result must not be replayed |
| ⚠️ `REMOTE_CLI_KNOWN_HOSTS` is mandatory for any live case | Without it the CLI's `StrictHostKeyChecking=accept-new` writes the per-run fixture host key into the developer's real `~/.ssh/known_hosts`, and the next run fails host-key verification. `runCliLive` sets it |
| Live suite skips, never fails, where `sshd` is unavailable | `sshdAvailable()` is checked at registration so cases report `skip`; a suite that reported `pass` while doing nothing is the failure this prevents |

`"types": ["bun"]` in `tsconfig.json` is required for `bun:test` to resolve — without it `bun run typecheck` still passes while the IDE reports `Cannot find module 'bun:test'`.

---

## Config Files {#config}

| File | Purpose | Git |
|------|---------|-----|
| `servers.json` | Server definitions (hosts, users, paths) | No |
| `secrets.json` | Passwords (mode 0600) | No |

Both live in `CONFIG_DIR` (`~/.config/remote-cli` by default). **`REMOTE_CLI_CONFIG_DIR` overrides it** — used by the tests, and available for running against an alternate profile.

### Validation Rules

- Server must have either `sshAlias` OR `host`, not both
- `appPath` is required and validated for safe characters
- All secrets values must be strings

### Jump hosts (`ProxyJump`) {#proxy-jump}

**`remote` does not run OpenSSH for commands or `--get`; it reads `~/.ssh/config` itself (`src/ssh/parser.ts`) and dials with ssh2.** So an alias setting works only if the parser reads it: `HostName`, `User`, `Port`, `IdentityFile` and `ProxyJump`, matched case-sensitively, with `Host *`, `Match` and `Include` ignored. An alias block with no `HostName` uses its own name as the host, as OpenSSH does. Anything else is dropped without a warning, which is how `ProxyJump` was ignored until 1.406.4: plain `ssh <alias>` went through the hop while `remote` dialled the whitelisted server directly and timed out.

With `ProxyJump`, `src/ssh/dial.ts` connects to the jump host and opens a `forwardOut` channel to the target, which becomes the target connection's `sock`; `--sync`/`--scp` get the same route as an `ssh -W` `ProxyCommand`. A hop that drops mid-session is reported as an error on the target connection, so a cut-off command exits 1 instead of 0. The value is an alias or `[user@]host[:port]`, one hop only, and the jump host needs an `IdentityFile` (passwords in `secrets.json` belong to the final server). `tests/live-jump.spec.ts` points a fixture `HOME` at a throwaway `.ssh/config` and proves the hop with a dead jump in front of a reachable target.

---

## Security Patterns {#security}

Guards against injection and credential exposure operate in **layers**, never relying on a single gate:

- **Path validation layers**: User input passes `validatePath()` (whitelist regex + `..` rejection) upstream, then `hasUnsafeShellChars()` at interpolation time in `buildMkdirChain()`. A remote dir reaching `--rsync-path`'s shell string is checked twice.

- **Secret isolation**: Credentials live in `secrets.json` with enforced 0600 permissions, not hardcoded or passed on the command line. `sshpass -e` with `SSHPASS` env var avoids exposing passwords in `ps aux`.

- **Timing defenses**: A spawned `ssh` for rsync never receives ssh2's keepalive timeouts — it needs `-o ConnectTimeout` in seconds (not milliseconds, and not inherited). Three separate timeout bounds mean connection establishment, handshake, and session liveness each have their own gate; a rule that handles one doesn't blind you to failure in another.

- **Config validation upfront**: Zod schema validates at load time, catching malformed config before any connection attempt. User input is validated **before** checking whether a file exists, preventing TOCTOU injection.

- **Host-key management**: `REMOTE_CLI_KNOWN_HOSTS` redirects `UserKnownHostsFile` for the spawned `rsync` only; the underlying `StrictHostKeyChecking=accept-new` is not weakened, and the path value is validated before interpolation into the rsync `-e` flag. ⚠️ The ssh2 paths (`remote <server> "cmd"` and `--get`) set no `hostVerifier`, so they accept any host key: only the rsync upload checks `known_hosts`.

---

## Architectural Principles {#principles}

**Separation of concerns prevents cascading failures.**

Config and credentials are not co-located: `servers.json` holds hosts and paths and lives outside the repo; `secrets.json` is private (0600 mode), gitignored, and isolated. Mixing them means exposing one to the same attack surface as the other.

Server definitions should have exactly one authority: use either `sshAlias` (delegating to `~/.ssh/config`) OR direct `host`/`user`, never both. The Zod schema enforces this XOR. When a server can be specified two ways, later code must guess which one is real, and that ambiguity is where inconsistency hides.

**stdout is the remote command's data channel; everything this CLI says goes to stderr.**

`src/ssh/executor.ts` forwards the remote stream straight to `process.stdout`, so any `console.log` in an execute path lands inside the caller's `$(remote …)` and corrupts it. The corruption is silent at the point of capture and surfaces far away — a captured credential as `Access denied`, a captured `mysqldump` as `not in gzip format` — which is why this was live for a long time (per POSIX, stdout is "conventional output" and stderr "diagnostic output"). Banners, progress, `Sent`, errors and their hints all use `console.error`.

Two deliberate exceptions, both being the command's own primary output rather than decoration: `--dry-run`'s `Would run:` line (`src/sync/executor.ts`) and the `--help`/`--list` screens (`src/cli/commands.ts`). Before adding a `console.log` anywhere else, ask whether a caller piping the command would want that text in their variable.

The rule governs what *this CLI* prints, not what it spawns. A real `--sync`/`--scp` runs rsync with `stdio: "inherit"` and `--progress`, so rsync's own file list and percentages go straight to stdout — deliberate, since that inheritance is also what carries its permission errors to the user. Upload output was never a data channel the way `remote <server> "command"` is; if that changes, the fix is rsync's own flags, not another `console.error`.

**Single-source-of-truth for mechanisms prevents fork-and-drift.**

`--scp` is not a separate upload path; it's `--sync` with a flag (`singleFile`), calling the same executor (`executeSync`). One executor means one place to fix keepalive, one place to harden error handling, one place to understand the timeout model. Two near-identical paths drift — the original `scp` executor had the stream-not-drained hang; `sync` fixed it; the merged codebase never has that divergence again because there is no divergence possible.

Flag validation tests membership against `ALL_FLAGS`, not a per-command set. A per-command set reads `--to --exclude` as a destination value if they're absent from its list, silently misparsing arguments as values. This is invisible until a second command adds them, reopening the bug.

When an event stream needs cleanup (ssh2 `conn.exec()` emits on both `data` and `close`), every terminal state settles the promise — not just success. Wrapping an emitter in `new Promise` with only success-path `resolve()` calls hangs forever with no error, and `readyTimeout` cannot catch it because the handshake succeeded. The shape that holds: a `settled` guard, a `SSH_STAGE_TIMEOUT_MS` deadline (`src/utils/ssh-keepalive.ts`), and a settle call on every terminal event — the deadline is what bounds the paths you did not foresee.

`validatePath()` is for **Unix remote paths only**. Applied to a Windows local path it rejects legitimate input, since its whitelist excludes `\` and `:`; local paths need a char-specific check for quotes and `$` instead. Reaching for the stricter-sounding guard is the wrong instinct here — it is not stricter, it is aimed at a different surface.

---

## Failure Symptoms & Fixes {#gotchas}

When a `remote` invocation fails, look the error or symptom up in 📖 `.claude-companions/shared/CLAUDE-remote-cli-gotchas.md` before reading code — it is indexed by the message you are staring at, and covers rsync/sshpass/openrsync quirks, timeout and keepalive misconfigurations, cross-platform path handling, and test isolation.

---

## Error Handling {#errors}

```
RemoteCliError (base)
├── ConfigError
│   ├── ConfigNotFoundError
│   └── ConfigValidationError
├── SSHError
│   ├── SSHAliasNotFoundError
│   ├── SSHConnectionError
│   └── AuthenticationError
├── RsyncError
│   └── LocalPathError
├── ScpError          # defined, ZERO throw sites since --scp moved to rsync
├── ServerNotFoundError
└── PathValidationError
```

All errors include hints to help users resolve issues. An upload failure now surfaces as `RsyncError`, `LocalPathError` or `PathValidationError` — grepping `ScpError` to trace one is a dead end.

---

## Adding Features {#extending}

1. **New CLI command**: Add to `src/cli/parser.ts` CLICommand type, handle in `index.ts`
2. **New server property**: Update schema in `src/types.ts`, handle in relevant module
3. **New error type**: Add class in `src/errors.ts`, throw where needed
4. **New execution module**: Create `src/<module>/executor.ts` + `index.ts`, follow ssh/sync patterns

---

## Task Tracking {#tasks}

For multi-step feature work, use `tasks/` convention:

```
tasks/
└── <feature>/
    └── current.md    # Active task context
```

Session start reads `tasks/<feature>/current.md` if referenced.
