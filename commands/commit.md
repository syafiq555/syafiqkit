---
description: Create git commits from staged changes. Works for single repos and multi-repo projects.
---

# Git Commit Command

Create conventional commits from staged changes.

## Workflow

⚠️ **MANDATORY — run `git -C <subdir> status -s` for EVERY nested repo before concluding scope.** The `gitStatus` context block shown at conversation start reflects only the invoking directory at session-start time — it is not proof the sub-repos are clean. Never infer sub-repo state from it.

1. **Find repos to commit** — check working directory for staged changes, then check subdirs for nested `.git` repos with staged changes. Skip any repo with nothing staged.

2. **Changelog gate**: If staged changes include user-visible fixes/features/improvements, add an entry to the **workspace-root `CHANGELOG.md`** (the top-level one above all sub-repos), NOT the sub-repo's own `CHANGELOG.md` — even when committing inside a nested repo (e.g. `myhalalgig-duopharma/`, `QuikHalalv4/`). This applies whenever multiple sibling repos share one root workspace (multi-repo project layout) — for a genuinely standalone single-repo project, update that repo's own `CHANGELOG.md` instead.
   - Read the root `CHANGELOG.md`, find (or create) the `## [YYYY-MM-DD]` heading for today, and prepend a bullet under the correct sub-heading (`### Fixed` / `### Added` / `### Changed`) tagged with the originating repo: `- [<repo-name>] <description>`.
   - Stage it with `git add <path-to-root>/CHANGELOG.md` (relative to the sub-repo's cwd, e.g. `../CHANGELOG.md`) alongside that repo's own commit — the changelog file lives outside the sub-repo's `.git`, so it does NOT get committed as part of the sub-repo's commit; commit it as part of the root repo's own commit (or a small standalone `docs` commit in root if root has nothing else staged).
   - ❌ Never head the entry `[Unreleased]` — always a dated heading `[YYYY-MM-DD]`, no per-repo version numbers as headings (version numbers, if relevant e.g. a mobile APK release, go inline in the bullet text, not as a heading).
   - Do NOT ask the user — just do it.

3. **For each repo with staged changes**:
   - `git diff --staged --stat` + `git diff --staged`
   - **Check task docs**: `git diff --staged --name-only | grep '^tasks/'` — read any staged `current.md` files. Their `Status:` line and `## Last Session` reveal what was actually built (a task doc riding the commit is the strongest signal of intent). Also check `tasks/**/current.md` for any doc whose files appear in the staged set even if the doc itself isn't staged.
   - **Task doc staleness gate** — ⚠️ MANDATORY before committing: if a doc was found by the previous bullet's file-overlap check but is NOT itself staged, its `Status:`/`## Last Session` describes an OLDER state than what's about to ship (e.g. still says "uncommitted", references a different commit hash, or is missing files present in this diff). Run the `task-summary` skill workflow on it now (update in place, same rules as any task-summary update) and stage it alongside the commit. Do NOT commit code whose owning doc silently drifts out of date — a doc that says "uncommitted" surviving past the commit that ships it is the exact failure this gate exists to prevent. Skip only if no `tasks/**/current.md` doc overlaps this diff's files at all (genuinely undocumented work — not this gate's job to create one).
   - ⚠️ **Whole-doc sweep, not a single-line fix**: when a doc's own status IS stale (the case above), grep that SAME doc for every other occurrence of "uncommitted"/the old commit hash/the old status word before considering it fixed — the same stale claim commonly repeats in the LLM-CONTEXT status line, Quick Start, a `## Files` section header, the Task Status table row, AND `## Last Session`. Fixing only the first occurrence you spot and moving on is the exact failure mode this note exists to prevent — verify with a final `grep -n -i "uncommitted"` (or the relevant stale term) on the file returning zero hits before treating the doc as reconciled.
   - **Cross-doc status mirror sweep** — ⚠️ MANDATORY, separate from the file-overlap check above: `grep -rl` the feature name/keyword across `tasks/**/*.md` (not just docs sharing changed files) to find OTHER docs that describe this feature's status inline (e.g. "escrow scoped in `X/current.md` (v1 design locked...)", "admin frontend deferred pending backend work"). A doc can mirror a stale status with ZERO file overlap — it just prose-references the feature by name. For each hit, check whether the mirrored status still matches reality post-commit; if the feature just shipped, flip "deferred"/"scoped"/"not built"/"design locked" language to reflect that. Do NOT dismiss a hit as "just a neutral pointer" without reading the surrounding sentence — a bare `Related: tasks/x/current.md` link is neutral, but a sentence that CHARACTERIZES the feature's build status is not, even if it doesn't use the word "uncommitted."
   - Determine type: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf` — **highest-impact type wins** (a user-visible feature co-landing with a refactor = `feat`, regardless of file count)
   - Determine scope from file paths (e.g., `app/Services/Workshop/*` → `workshop`)
   - Commit: `<type>(<scope>): <description>` — lowercase, no period, imperative, max 72 chars
   - Verify: `git status && git log -1 --oneline`

4. **GitNexus re-index** (background, per-repo): For each repo where commit type is NOT `docs`, if `.gitnexus/` exists, run in background:
   ```bash
   [ -d ".gitnexus" ] && npx gitnexus analyze --skip-agents-md
   ```

5. **Validate**: No secrets committed, type matches changes

6. **Push** (only if `ARGUMENTS` includes "push"): per-repo, check `git status -sb` for tracking state. If tracking an upstream, `git push`. If no upstream (new local branch), confirm with the user before `git push -u origin <branch>` — creating a new remote branch is a visible, hard-to-reverse action per repo.

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
| `refactor` when a user-visible feature also landed in the same staged set | `feat` — the highest-impact type wins regardless of file count. A refactor that rides alongside a new feature is a `feat` commit. |
