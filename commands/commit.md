---
description: Create git commits from staged changes. Works for single repos and multi-repo projects.
---

# Git Commit Command

Create conventional commits from staged changes.

## Workflow

⚠️ **MANDATORY — run `git -C <subdir> status -s` for EVERY nested repo before concluding scope.** The `gitStatus` context block at conversation start reflects only the invoking directory at session-start time — it is not proof sub-repos are clean.

1. **Find repos to commit** — check working directory for staged changes, then subdirs for nested `.git` repos with staged changes. Skip any repo with nothing staged.

2. **Changelog gate**: if staged changes include user-visible fixes/features/improvements, add an entry to the **workspace-root `CHANGELOG.md`** (the top-level one above all sub-repos), NOT the sub-repo's own — even when committing inside a nested repo (e.g. `myhalalgig-duopharma/`, `QuikHalalv4/`). Applies whenever sibling repos share one root workspace; for a standalone single-repo project, update that repo's own `CHANGELOG.md` instead.
   - Read root `CHANGELOG.md`, find/create today's `## [YYYY-MM-DD]` heading, prepend a bullet under the right sub-heading (`### Fixed` / `### Added` / `### Changed`) tagged `- [<repo-name>] <description>`.
   - Stage with `git add <path-to-root>/CHANGELOG.md` (relative to sub-repo cwd, e.g. `../CHANGELOG.md`) — it lives outside the sub-repo's `.git`, so commit it as part of the root repo's commit (or a standalone `docs` commit in root).
   - ❌ Never head the entry `[Unreleased]` — always a dated heading, no per-repo version numbers as headings (version numbers go inline in bullet text).
   - Do NOT ask the user — just do it.

3. **For each repo with staged changes**:
   - `git diff --staged --stat` + `git diff --staged`
   - **Check task docs**: `git diff --staged --name-only | grep '^tasks/'` — read any staged `current.md`. Its `Status:` line and `## Last Session` reveal what was actually built. Also check `tasks/**/current.md` for docs whose *files* appear in the staged set even if the doc itself isn't staged.
   - **Task doc staleness gate** — ⚠️ MANDATORY, regardless of whether the doc is already staged. Before committing: `grep -n -i "uncommitted\|not yet pushed\|pending"` the doc. **A hit is a hard stop, not a judgment call — fix it before the next tool call, don't reason about it first.** ⚠️ Repeatedly violated by reading the matched line, judging it "still accurate right now" or "expected transient state," and moving on WITHOUT running `task-summary` — that in-the-moment read is always true (of course a line written pre-commit says "uncommitted" before the commit exists) and is exactly what makes it a trap, not a signal the gate doesn't apply. The grep hitting is the ENTIRE trigger — no secondary judgment call about whether the hit is "real" staleness is permitted. Any non-zero grep hit count → immediately run `task-summary` as the very next tool call, no intermediate reasoning step. "The doc's prose is accurate" / "it'll become true once I commit" are the exact rationalizations this gate exists to block, not exceptions to it. On any hit: run `task-summary` now, re-stage, then sweep the WHOLE doc (LLM-CONTEXT line, Quick Start, `## Files`, Task Status table, `## Last Session` commonly repeat the same stale claim), re-grep to zero hits before treating it as reconciled. Skip only if no `tasks/**/current.md` doc overlaps this diff's files at all.
   - **Cross-doc status mirror sweep** — ⚠️ MANDATORY, separate from the file-overlap check: `grep -rl` the feature name/keyword across `tasks/**/*.md` for OTHER docs that characterize this feature's status inline (e.g. "deferred pending backend work") even with zero file overlap. Read the surrounding sentence — a bare `Related: tasks/x/current.md` link is neutral, but a status-characterizing sentence isn't, even without the word "uncommitted." Flip stale "deferred"/"scoped"/"not built" language to match what just shipped.
   - Determine type: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf` — **highest-impact type wins** (a user-visible feature co-landing with a refactor = `feat`, regardless of file count).
   - Determine scope from file paths (e.g., `app/Services/Workshop/*` → `workshop`).
   - Commit: `<type>(<scope>): <description>` — lowercase, no period, imperative, max 72 chars.
   - Verify: `git status && git log -1 --oneline`.

4. **GitNexus re-index** (background, per-repo): for each repo where commit type is NOT `docs`, if `.gitnexus/` exists, run in background:
   ```bash
   [ -d ".gitnexus" ] && npx gitnexus analyze --skip-agents-md
   ```

5. **Validate**: no secrets committed, type matches changes.

6. **Push** (only if `ARGUMENTS` includes "push"): per-repo, check `git status -sb` for tracking state. If tracking an upstream, `git push`. If no upstream (new local branch), confirm with the user before `git push -u origin <branch>` — creating a new remote branch is visible and hard to reverse.

## Commit Format

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <message>
EOF
)"
```

## Anti-Patterns

| Avoid | Instead |
|-------|---------|
| `fix: fixed stuff` | `fix(auth): resolve token expiry race condition` |
| `update code` | `refactor(orders): extract validation to service` |
| `wip` | `chore: wip - <context>` or don't commit |
| `refactor` when a user-visible feature also landed in the same staged set | `feat` — highest-impact type wins regardless of file count |
