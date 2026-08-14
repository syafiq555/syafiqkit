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
   - **Task doc staleness gate** (applies whether or not the doc itself is staged): A task doc that names uncommitted work, pending changes, or deferred features is stale and needs `task-summary` to refresh it. The gate uses a mechanical `grep -n -i "uncommitted\|not yet pushed\|pending"` to avoid judgment — every doc containing one of these tokens is locally true when written, making judgment feel safe while silently letting stale claims through on later reads. Any grep hit triggers `task-summary`; the judgment is upstream (in the `/done` pass that *wrote* the doc) and downstream (in your read of whether the claim still makes sense), never here.
     - **Exception: code-shaped tokens** — if the grep match is a code identifier or UI label (camelCase, kebab, quoted string like `pending-step chip`), it's domain terminology, not a staleness marker. These tokens don't count; skip the staleness check for them. Say which hits you skipped and why — a silent skip and a doc with no stale markers look identical to whoever reads the commit next.
     - **Exception: already resolved this session** — if `task-summary` already ran this session and swept the whole doc for that claim (checking LLM-CONTEXT, Quick Start, `## Files`, Task Status table, `## Last Session` for repeats), the claim may be resolved already. Verify by grepping after the fix: if the grep returns empty, skip re-running `task-summary`. The verification step is not optional — it confirms the claim actually left, rather than just moved to an unchecked section.
   - **Cross-doc status mirror sweep**, separate from file overlap: `grep -rl` the feature name/keyword across `tasks/**/*.md` for other docs that characterize this feature's status inline (e.g. "deferred pending backend work"), even with zero file overlap. A bare `Related: tasks/x/current.md` link is neutral; a sentence stating status isn't — flip stale "deferred"/"scoped"/"not built" language to match what just shipped. Run this per repo, from that repo's own root, because grep doesn't see across repo boundaries; a feature built across two repos often leaves its stalest claim in the other one's docs.
   - **Cross-reference**: `/ship` overrides this gate's behavior; see `skills/ship/SKILL.md` Step 2. This gate's `task-summary` run satisfies `/done` Step 4 only when a real run happened, not when the hit matched code-shaped tokens — `/done` Step 4 scans independently in that case; see `skills/done/SKILL.md` Step 4.
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
