# Common Gotchas & Failure Symptoms

Indexed by error or symptom. Use when a `remote` invocation fails.

---

## Timeout & Keepalive Issues

| Error/Symptom | Issue | Fix |
|---------------|-------|-----|
| A `remote` call hangs with no output and never exits | Missing keepalive — `readyTimeout` covers the handshake only | Constants in `src/utils/ssh-keepalive.ts` must reach every call site |
| ⚠️ An upload to an unreachable host stalls with no output, where a `remote <srv> "cmd"` to the same host fails in ~1s | A spawned `ssh` inherits **neither** ssh2's `readyTimeout` nor its keepalive, and `ServerAliveInterval` governs only an already-**established** session — so nothing bounded TCP connect | `-o ConnectTimeout=${SSH_CONNECT_TIMEOUT_SEC}` in `hostKeyOptionsString()`. Verify by timing an upload to `192.0.2.1`: expect ~30s and `ssh: connect to host … port 22: Operation timed out`, not an indefinite hang |
| A hang AFTER the header prints, on a healthy link | An ssh2 `conn.exec()` stream that is never read stays paused and never emits `close`, so the wrapping promise never settles. Keepalive and `readyTimeout` cannot catch it — the handshake succeeded and the link is fine | Drain both channels in `ssh/executor.ts`: `stream.on("data", …)` + `stream.stderr.on("data", …)`. Those handlers are load-bearing, not dead code |

---

## SSH Connection & Auth

| Error/Symptom | Issue | Fix |
|---------------|-------|-----|
| `Unexpected error:` + a raw ssh2 stack trace instead of the CLI's error UX | `conn.connect()` **throws synchronously** on an unparseable key rather than emitting `error`, so an event-only promise executor lets it escape | Wrap `conn.connect()` in try/catch and settle from the catch |
| Tests append to the developer's real `~/.ssh/known_hosts` | OpenSSH resolves `~` via `getpwuid()`, so redirecting `HOME` cannot move it — only `-o UserKnownHostsFile` can | Set `REMOTE_CLI_KNOWN_HOSTS`. Symptom of the leak: `REMOTE HOST IDENTIFICATION HAS CHANGED` on the second run, and tests that pass together but fail individually |
| An SSH option set in code has no effect on an upload | `--sync`/`--scp` `spawn()` the system `rsync` and never touch ssh2 | ssh2 options (`keepaliveInterval`, ms) reach only `ssh/executor.ts`; the spawned `ssh` needs `-o` flags in **seconds** via `buildSSHCommand()` |

---

## Path & File Handling

| Error/Symptom | Issue | Fix |
|---------------|-------|-----|
| `validatePath` rejects Windows keyPath | Regex `^[a-zA-Z0-9\/_\-\.~]+$` excludes `\:` | Use char-specific check for local paths (`["'\`$]`) |
| Absolute local path rejected on `--sync`/`--scp` | An absolute source has no relative segment to mirror under `appPath` | Add `--to <remote-path>`; relative paths still work without it |
| rsync "source and destination both remote" | Windows `C:\path` colon interpreted as remote host | Convert to POSIX style `/c/path` via `toPosixPath()` |
| Path with `..` rejected | `validatePath()` blocks traversal sequences | Intentional security: prevents `/var/www/../../../etc/passwd` escapes |
| A value interpolated into `-e`'s ssh string silently splits on spaces | `spawn` passes an argv array through untouched, but **rsync itself word-splits** the single `-e` string | Quote the value inside `hostKeyOptionsString()`. Verify with a path containing a space and `--dry-run` |

---

## rsync & Directory Transfers

| Error/Symptom | Issue | Fix |
|---------------|-------|-----|
| rsync flattens directory structure | Without `-R`, rsync only preserves last path component | Use `--relative` with `.` marker: `/cwd/./relative/path` |
| Dropping `-R` for an explicit destination doesn't work | `DEFAULT_RSYNC_FLAGS = "-avzR --progress"` fuses `R` into a flag **string**, and `--flags` replaces it wholesale | String surgery on the resolved flags (`stripRelativeFlag`), not skipping a `push()` |
| A directory lands one level too deep (`releases/build/build/`) | rsync's `src` vs `src/` decides nesting vs contents | Append `/` for a directory source. Verify with local `rsync -n` between two temp dirs — no SSH needed |
| `--mkpath` not recognised on macOS | macOS 15+ ships **openrsync**, not GNU rsync | Don't rely on `--mkpath`; chain the mkdir into rsync's remote command via `--rsync-path` (`buildMkdirChain()`) |

---

## Binary Installation (Windows/Linux/macOS)

| Error/Symptom | Issue | Fix |
|---------------|-------|-----|
| rsync not found on Windows | Not in PATH | Install from [MSYS2 repo](https://repo.msys2.org/msys/x86_64/) with DLLs (see below) |
| sshpass not found (Linux/macOS) | Password auth needs sshpass | `apt install sshpass` or `brew install sshpass` |
| sshpass not found (Windows) | No native sshpass on Windows | Use [sshpass-win32](https://github.com/xhcoding/sshpass-win32) or SSH keys instead |
| A missing binary reports as a timeout minutes later | `spawn`'s `ENOENT` is delivered asynchronously and never reaches a synchronous `spawnSync` poll loop, so the loop exhausts its whole budget | `existsSync()` the binary before spawning; the async `error` handler cannot substitute |

### rsync Installation (Windows/Git Bash)

Download from [MSYS2 x86_64 repo](https://repo.msys2.org/msys/x86_64/):
- `rsync-3.3.0-1-x86_64.pkg.tar.zst`
- `libxxhash-0.8.2-1-x86_64.pkg.tar.zst`
- `libopenssl-3.4.0-1-x86_64.pkg.tar.zst`
- `libzstd-1.5.6-1-x86_64.pkg.tar.zst`

Extract with 7-Zip (two-step: .zst → .tar → contents), copy `usr/bin/*` to `~/.local/bin/` or `C:\Program Files\Git\usr\bin\`

---

## Testing

| Error/Symptom | Issue | Fix |
|---------------|-------|-----|
| ⚠️ A `reject:` needle in test suite that can never appear passes while asserting **nothing** | `reject: ["-P "]` survived the move to rsync because rsync spells the port `-p`; a needle naming deleted code (`"only transfers single files"`) does the same | Before adding a `reject:`, `grep -rn "<needle>" src/` — zero hits means the assertion is vacuous. Prefer a positive `expect:` on the correct output |
| A `bun:test` suite reports `pass` for cases whose dependency never started | `test` vs `test.skip` is chosen at module-evaluation time, before `beforeAll` can boot anything | Decide from a cheap pre-flight at registration (`sshdAvailable()`), and throw inside the body if the boot later fails |
