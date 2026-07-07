---
name: ship
description: Ship code to production — commit, changelog, push, verify CI/CD deploy, re-index GitNexus, generate release note. Use when the user says "ship", "ship it", "deploy", "push to prod", "send it", or after /done is complete and code is ready to go live. Works with single repos and multi-repo setups (root + sub-repos). Assumes /done was already run.
---

# Ship

End-to-end shipping workflow: commit → changelog → push → verify deploy → GitNexus re-index → release note.

## Prerequisites

- `/done` has already been run (code reviewed, simplified, task docs updated)
- Changes are staged or ready to stage

## Workflow

Execute all steps in sequence. Stop on errors and report to the user.

### Step 1: Detect Repos

Find all git repos with uncommitted/staged changes. Check the working directory first, then scan immediate subdirectories for nested `.git` repos:

```bash
git status --short
for dir in */; do [ -d "$dir/.git" ] && (cd "$dir" && echo "=== $dir ===" && git status --short); done
```

Skip repos with nothing to commit. If ALL repos are clean, check for unpushed commits (`git log origin/main..HEAD` in each repo). If unpushed commits exist, skip to Step 3.

### Step 2: Commit Each Repo

For each repo with changes:

1. **Stage files** — `git add <specific files>` (never `git add -A`)
2. **Version-bump gate (plugin/package repos)** — if the repo has version files, bump **EVERY** file that carries the version before staging. Run `grep -rn '"version"' <manifest-dir>` to discover all version fields (secondary fields like `plugins[0].version` drift silently when only the primary is bumped). See the repo's `CLAUDE.md#version-bumping` for the canonical file list.
3. **Changelog gate** — if changes include user-visible work AND `CHANGELOG.md` is not staged → STOP. Ask user to update changelog first.
4. **Task doc staleness gate** — ⚠️ don't rely solely on `/done` having run. Cross-check: `git diff --staged --name-only | grep '^tasks/'` for already-staged docs, AND `Grep tasks/**/current.md` for any doc whose `## Files`/file references overlap this diff's changed paths but that is NOT staged. An overlapping-but-unstaged doc means its `Status:`/`## Last Session` describes a state older than what's about to ship (e.g. still says "uncommitted"). Run the `task-summary` skill on it and stage it before committing — never ship code whose owning doc drifts stale.
5. **Commit** — conventional format: `<type>(<scope>): <message>`

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <message>
EOF
)"
```

Commit order: sub-repos first, then root (changelog, task docs).

### Step 3: Push

1. Check `gh auth status` — if wrong account, read project's `CLAUDE.local.md` for the correct GitHub user and switch
2. Push each repo that has commits ahead of remote:

<example>
Remote uses a personal SSH alias (e.g. `git@github-personal:...`), but `gh auth status` is active on a different account. `gh` auth is independent of the SSH alias, so any `gh` API call would hit the wrong account. Switch first: `gh auth switch --user <personal-user>` (the username is in the project's `CLAUDE.local.md`), then push. If the remote is a plain `github.com` work repo, no switch needed.
</example>

```bash
git push
```

### Step 4: Verify CI/CD Deploy

⚠️ **Check the project's `CLAUDE.local.md` for a documented non-CI deploy path (rsync hotfix, manual sync, etc.) before assuming CI is the only route.** Some projects fast-track backend-only changes (no migration/deps/frontend touch) around CI entirely — polling `gh run list` for a deploy that was never queued will hang or false-negative. If such a path exists and applies to this change, follow it instead of Steps 4.1–4.2 (still do the prod-HEAD-mismatch style verification appropriate to that path, e.g. grep the deployed file/config on the server).

Otherwise, wait for CI to complete, then verify production matches:

1. **Check CI status** — poll `gh run list --limit 1 --json status,conclusion,headSha` in each pushed repo. Wait up to 5 minutes.

2. **Verify production HEAD** — read the project's `CLAUDE.local.md` for the production server name and deploy path, then:

```bash
remote <prod-server> "cd <deploy-path>/<repo> && git log --oneline -1"
```

Skip this step if `remote` CLI is not configured or no production server is documented.

3. If CI failed → report error, suggest `gh run rerun <id> --failed`
4. If prod HEAD doesn't match → report mismatch

### Step 5: GitNexus Re-index

Re-index repos that had code changes (not just docs). Check for `.gitnexus/` directory in each repo — only re-index if GitNexus is set up:

```bash
[ -d ".gitnexus" ] && npx gitnexus analyze --skip-agents-md
```

Run in background — takes 30-60s per repo. Always use `--skip-agents-md`.

### Step 6: Release Note

Auto-generate a Google Chat-formatted release note from the changelog:

1. Read the latest `CHANGELOG.md` entry
2. Format using the `gchat-format` skill (convert to Google Chat syntax)
3. Copy to clipboard

## Output

```
## Ship Summary

| Step | Status | Details |
|------|--------|---------|
| Commit | ✅ | [repos committed, commit hashes] |
| Push | ✅ | [repos pushed] |
| CI/CD | ✅ | [deploy status per repo] |
| Prod Verify | ✅ | [HEAD hashes match] |
| GitNexus | ✅ | Re-indexed [repos] |
| Release Note | ✅ | Copied to clipboard |
```

## Edge Cases

| Situation | Action |
|-----------|--------|
| Only root repo has changes (docs only) | Push root only, skip CI verify + GitNexus |
| CI takes too long (>5 min) | Report status, tell user to check manually |
| No `remote` CLI or no prod server in CLAUDE.local.md | Skip prod verification step |
| No `.gitnexus/` directory | Skip GitNexus re-index for that repo |
| No `CHANGELOG.md` | Skip changelog gate and release note |
| Repo is "internal" (plugin, script, tooling) | Never skip the release note — internal repos ship too. Only skip is `No CHANGELOG.md` |
| Sub-repo already pushed but root not | Push only unpushed repos |
| Single repo (no sub-repos) | Works as-is — just one repo to process |
