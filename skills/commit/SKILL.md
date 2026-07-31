---
name: commit
description: Create git commits from staged changes. Works for single repos and multi-repo projects. Use when the user says "commit", "commit this", "commit staged changes", or asks to create a commit message from what's staged.
---

# Git Commit

Create conventional commits from staged changes.

## Workflow

The `gitStatus` context block at conversation start is a snapshot of the invoking directory only, taken at session start — it says nothing about nested repos. Run `git -C <subdir> status -s` for every nested repo before concluding what's in scope.

1. **Find repos to commit** — check working directory for staged changes, then subdirs for nested `.git` repos with staged changes. Skip any repo with nothing staged.

2. **Changelog gate**: if staged changes include user-visible fixes/features/improvements, add an entry to the **workspace-root `CHANGELOG.md`** — the top-level one above all sub-repos — not the sub-repo's own, even when committing inside a nested repo. This applies whenever sibling repos share one root workspace; a standalone single-repo project updates its own `CHANGELOG.md` instead.
   - Read root `CHANGELOG.md`, find/create today's `## [YYYY-MM-DD]` heading, prepend a bullet under the right sub-heading (`### Fixed` / `### Added` / `### Changed`) tagged `- [<repo-name>] <description>`.
   - A staged diff often bundles more than one independent user-visible change (built across separate sessions, committed together). Today's heading already existing doesn't mean the gate is satisfied — check the diff for every distinct user-facing behavior and give each its own bullet.
   - Stage with `git add <path-to-root>/CHANGELOG.md` (relative to sub-repo cwd, e.g. `../CHANGELOG.md`) — it lives outside the sub-repo's `.git`, so commit it as part of the root repo's commit (or a standalone `docs` commit in root).
   - Always a dated heading, never `[Unreleased]`; no per-repo version numbers as headings — version numbers go inline in bullet text.
   - Do this without asking the user first.

3. **For each repo with staged changes**:
   - `git diff --staged --stat` + `git diff --staged`
   - **Check task docs**: `git diff --staged --name-only | grep '^tasks/'` — read any staged `current.md`. Its `Status:` line and `## Last Session` reveal what was actually built. Also check `tasks/**/current.md` for docs whose *files* appear in the staged set even if the doc itself isn't staged.
   - **Task doc staleness gate**, applies whether or not the doc itself is staged: `grep -n -i "uncommitted\|not yet pushed\|pending"` any overlapping doc. The grep hitting is the whole trigger — run `task-summary` next, with no judgment call about whether this particular hit is "real" staleness. That restriction exists because every pre-commit line saying "uncommitted" is, in the moment, locally true ("it's accurate right now", "it'll become true once I commit") — which is exactly what makes case-by-case judgment here a rationalization trap rather than a reasonable shortcut, not a hypothetical risk. The one exception is a mechanical shape test, not a judgment call: the match is fused into an identifier or UI label (camelCase/kebab/Pascal, or a quoted element name like `pending-step chip`) rather than sitting in a sentence describing state — that's the domain's own vocabulary, note it and move on, no run needed. Judge the token's *shape*, never the sentence's *meaning* — a case that isn't unambiguously code-shaped is prose, and the no-judgment rule applies to it in full. When it's real staleness, sweep the whole doc for the same claim (LLM-CONTEXT line, Quick Start, `## Files`, Task Status table, `## Last Session` commonly repeat it) and confirm the grep comes back empty after the fix.
     `/ship` overrides this gate — see `skills/ship/SKILL.md` Step 2 rather than resolving a hit by writing the pre-deploy state.
     This gate's `task-summary` run covers `/done` Step 4 only when a real run happened, not when the hit was the identifier/label exception — in that case `/done` Step 4 still needs its normal scan. See `skills/done/SKILL.md` Step 4.
   - **Cross-doc status mirror sweep**, separate from the file-overlap check above: `grep -rl` the feature name/keyword across `tasks/**/*.md` for other docs that characterize this feature's status inline (e.g. "deferred pending backend work"), even with zero file overlap. A bare `Related: tasks/x/current.md` link is neutral; a sentence characterizing status isn't, even without the word "uncommitted" — flip stale "deferred"/"scoped"/"not built" language to match what just shipped. Run this per repo the commit spans, from each repo's own root — a grep doesn't see across repo boundaries, so a feature built across two repos often leaves its stalest claim in the other repo's docs.
   - Determine type: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf` — highest-impact type wins regardless of file count (a user-visible feature co-landing with a refactor is `feat`).
   - Determine scope from file paths (e.g., `app/Services/Workshop/*` → `workshop`).
   - Commit: `<type>(<scope>): <description>` — lowercase, no period, imperative, max 72 chars.
   - Verify: `git status && git log -1 --oneline`.

4. **Validate**: no secrets committed, type matches changes.

5. **Push** (only if the user's invocation includes "push"): per-repo, check `git status -sb` for tracking state. If tracking an upstream, `git push`. If no upstream (new local branch), confirm with the user before `git push -u origin <branch>` — creating a new remote branch is visible and hard to reverse.

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
