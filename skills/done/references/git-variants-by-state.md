# Counting Changed Files: Git Variants by Repo State

Use `git status --short` as canonical (it omits new/staged files if they're not staged, unlike `git diff --name-only`). Apply variants for special cases:

## Normal case
```bash
git status --short
```
Run in EVERY repo of a multi-repo project. Count applied files for agent scaling.

## Work Already Committed (Not Yet Pushed)

Count off the session's base commit instead of the working tree:
```bash
git diff --name-only <base>..HEAD
```

Where `<base>` is HEAD at session start (or merge-base with trunk if unknown).

**Trap:** This assumes commits are reachable from the branch you're standing on. If the session worked in a worktree, a checked-out branch you left, or another repo's PR branch, `HEAD` belongs to work you never touched, so `<base>..HEAD` comes back empty while `git status --short` shows files that aren't yours.

**Recovery:** Use commit SHAs as anchors instead of branch names:
```bash
git log --author=<you> --since=<session start> --all --oneline
```

Then diff those directly:
```bash
git show <sha>:<path>
```

This reads a file on a branch that isn't checked out, so you get accurate diffs even when the files don't exist in your current checkout.

## Non-Git Project

Count by mtime against session start:
```bash
find . -newermt "<session start>" -type f -not -path './node_modules/*' -not -path './vendor/*'
```

Ownership is sole by construction. See `${CLAUDE_SKILL_DIR}/../_shared/references/verifying-a-write-landed.md` for the caveat.

## Git Error (Not a Repository / No First Commit)

A missing `git init`:
```
fatal: not a git repository
```

A repo with no first commit:
```bash
git status  # succeeds, reads empty
git diff HEAD  # errors on missing revision
```

**Solution:** These are NOT "no repo diff to review." The session still has code. Run **full mode** and substitute only the mechanisms — mtime off session start for the changed-file list, re-read/grep for write verification — per `${CLAUDE_SKILL_DIR}/../_shared/references/verifying-a-write-landed.md`.
