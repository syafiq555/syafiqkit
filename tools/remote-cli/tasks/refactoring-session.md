# Remote-CLI Modularization

<!--LLM-CONTEXT
[Key tech]: Bun + TypeScript + ssh2 + Zod | 20 modules
Tables: N/A (JSON config files)
Key files: index.ts, src/types.ts, src/ssh/executor.ts, src/sync/executor.ts
Gotchas: rsync Windows path colon, Zod v4 API, SSH cleanup on error
Flow: CLI args → parseArgs → loadConfig → buildConnection → executeCommand|executeSync
Related: tasks/ssh/session-lifetime/current.md
-->

**Status**: ✅ Complete | **Date**: 2026-01-12 | **Latest**: sync feature + rsync Windows fix

## 🎯 Goals {#goals}

- **What**: Refactor single-file CLI (487 lines) into modular architecture
- **Features**: Zod validation, custom errors, resource cleanup, type-safe CLI parsing, rsync sync
- **Success**: All commands work identically, type check passes, no resource leaks

## 📋 Quick Reference {#reference}

### Architecture

Thin entry point (`index.ts` ~95 lines) orchestrates 5 domain modules under `src/`.
Each module has barrel exports (`index.ts`) for clean imports.

### Key Decisions

| Aspect | Decision | Why |
|--------|----------|-----|
| rsync paths | Convert `C:\` → `/c/` | Windows colon breaks rsync remote host detection |
| Validation | Zod v4 | Runtime type safety, inferred TS types, clear errors |
| Errors | Custom hierarchy | Structured handling with user hints |
| Structure | Feature-based modules | Single responsibility, testable |
| Imports | Barrel exports | Clean import paths, easy refactoring |

### Module Structure

```
index.ts (entry)
├─ src/types.ts (Zod schemas + types)
├─ src/errors.ts (RemoteCliError hierarchy)
├─ src/config/ (loader, paths)
├─ src/ssh/ (parser, connection, executor)
├─ src/sync/ (executor - rsync upload) ← NEW
├─ src/cli/ (parser, commands, interactive)
├─ src/server/ (matcher)
└─ src/utils/ (colors, path, permissions)
```

## ⚙️ Changes Made {#changes}

| File | Before | After |
|------|--------|-------|
| `src/sync/executor.ts` | N/A | NEW: rsync upload with Windows path fix |
| `src/cli/parser.ts` | 4 commands | + `--sync` command parsing |
| `src/errors.ts` | 6 error types | + `RsyncError`, `LocalPathError` |
| `index.ts` | 487 lines, all logic | 95 lines, orchestration only |
| `package.json` | ssh2 only | + zod@4.3.5 |
| `tsconfig.json` | Default | + path alias `@/*`, removed deprecated `baseUrl` |
| `servers.schema.json` | N/A | Created JSON Schema for VS Code autocomplete |
| `CLAUDE.md` | Single-file docs | Modular architecture docs + rsync gotchas |

### Fixes Applied

| Issue | Location | Fix |
|-------|----------|-----|
| rsync "both remote" error | `sync/executor.ts` | `toPosixPath()` converts `C:\` → `/c/` |
| SSH resource leak | `ssh/executor.ts` | Added `cleanup()` on all error paths |
| Silent config errors | `loader.ts` | Zod validation throws `ConfigValidationError` |
| Type gaps (sshAlias XOR host) | `types.ts` | `.refine()` constraint |
| Stream errors unhandled | `ssh/executor.ts` | Added `stream.on("error")` handler |

## ⚠️ Gotchas {#gotchas}

| Issue | Cause | Fix |
|-------|-------|-----|
| rsync "source and destination both remote" | Windows `C:\` colon = remote host syntax | `toPosixPath()` converts to `/c/path` |
| rsync not found on Windows | MSYS2 package needed | Install from repo with DLLs (see project CLAUDE.md) |
| `baseUrl is deprecated` warning | TS 7.0 prep | Remove `baseUrl`, keep `paths` with `./` prefix |
| Missing schema IDE warning | No `servers.schema.json` | Create JSON Schema matching Zod types |
| `bun: command not found` | Git Bash PATH | Add `export PATH="$HOME/.bun/bin:$PATH"` to `~/.bashrc` |
| Zod v4 breaking changes | Auto-installed latest | Core API (`z.object`, `.refine`) unchanged for this use case |

## ✅ Verification {#verification}

- [x] `bun run tsc --noEmit` — No errors
- [x] `remote --help` — Shows usage with sync options
- [x] `remote --list` — Lists 5 servers with tags
- [x] Invalid server error — Shows hint message
- [x] Backward compatible with existing `servers.json`
- [x] JSON Schema provides autocomplete in VS Code
- [x] `remote --sync <server> ./src --dry-run` — Dry run shows file list
- [x] `remote --sync <server> ./src` — Actually uploads files via rsync
- [x] Path validation rejects absolute paths with helpful error — superseded 2026-07-30: an absolute path is now accepted when paired with `--to` (`tasks/scp-upload/current.md` D1)

## 🔮 Future Considerations

- [x] Test coverage — landed 2026-07-30 as **feature** tests (`bun test`, 28 cases), not unit tests; internals are covered through the CLI's public surface (`tasks/scp-upload/current.md` D3)
- [ ] Add command execution timeout — a max-runtime cap still does not exist. Idle detection landed separately (`tasks/ssh/session-lifetime/current.md`); a live-but-slow command is still unbounded.
- [ ] Consider `commander` or `yargs` if CLI grows more complex
