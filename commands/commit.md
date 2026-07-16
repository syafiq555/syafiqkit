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
   - ⚠️ **The gate is per distinct user-visible change, not per day.** Seeing today's heading already exists is not "done" — a staged diff routinely bundles 2+ independent features (built in different sessions, committed together), and an entry for one does not cover the other. Before concluding the gate is satisfied, list every distinct user-facing behavior in `git diff --staged` and check each has its own bullet — don't stop at "a heading for today exists."
   - Stage with `git add <path-to-root>/CHANGELOG.md` (relative to sub-repo cwd, e.g. `../CHANGELOG.md`) — it lives outside the sub-repo's `.git`, so commit it as part of the root repo's commit (or a standalone `docs` commit in root).
   - ❌ Never head the entry `[Unreleased]` — always a dated heading, no per-repo version numbers as headings (version numbers go inline in bullet text).
   - Do NOT ask the user — just do it.

3. **For each repo with staged changes**:
   - `git diff --staged --stat` + `git diff --staged`
   - **Check task docs**: `git diff --staged --name-only | grep '^tasks/'` — read any staged `current.md`. Its `Status:` line and `## Last Session` reveal what was actually built. Also check `tasks/**/current.md` for docs whose *files* appear in the staged set even if the doc itself isn't staged.
   - **Task doc staleness gate** — ⚠️ MANDATORY, staged or not. `grep -n -i "uncommitted\|not yet pushed\|pending"` the doc. **Any hit → run `task-summary` as the very next tool call.** The grep hitting is the ENTIRE trigger; no judgment about whether the hit is "real" staleness is permitted. The rationalizations this blocks — "it's accurate right now", "expected transient state", "it'll become true once I commit" — are all *true* in the moment (of course a pre-commit line says "uncommitted"), which is exactly what makes them a trap rather than an exception. Then re-stage, sweep the WHOLE doc (LLM-CONTEXT line, Quick Start, `## Files`, Task Status table, `## Last Session` all repeat the same claim), and re-grep to zero. Skip only if no `tasks/**/current.md` overlaps this diff's files.
     ⚠️ Under `/ship` this gate has an override — do NOT resolve a hit by writing the pre-deploy state. See `skills/ship/SKILL.md` Step 2.
     ⚠️ This gate's `task-summary` run satisfies `/done` Step 4 — a later `/done` in the same session invokes it SCOPED to new findings, not bare. See `skills/done/SKILL.md` Step 4.
   - **Cross-doc status mirror sweep** — ⚠️ MANDATORY, separate from the file-overlap check: `grep -rl` the feature name/keyword across `tasks/**/*.md` for OTHER docs that characterize this feature's status inline (e.g. "deferred pending backend work") even with zero file overlap. Read the surrounding sentence — a bare `Related: tasks/x/current.md` link is neutral, but a status-characterizing sentence isn't, even without the word "uncommitted." Flip stale "deferred"/"scoped"/"not built" language to match what just shipped.
   - Determine type: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf` — **highest-impact type wins** (a user-visible feature co-landing with a refactor = `feat`, regardless of file count).
   - Determine scope from file paths (e.g., `app/Services/Workshop/*` → `workshop`).
   - Commit: `<type>(<scope>): <description>` — lowercase, no period, imperative, max 72 chars.
   - Verify: `git status && git log -1 --oneline`.

4. **Validate**: no secrets committed, type matches changes.

5. **Push** (only if `ARGUMENTS` includes "push"): per-repo, check `git status -sb` for tracking state. If tracking an upstream, `git push`. If no upstream (new local branch), confirm with the user before `git push -u origin <branch>` — creating a new remote branch is visible and hard to reverse.

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
