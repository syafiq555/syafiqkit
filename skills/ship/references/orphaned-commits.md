# Orphaned Commits: Recovery

An orphaned commit is one that's been disconnected from all branches — it exists in git's object store but isn't reachable from any branch ref, so it doesn't show up in `git status` or `git log`, and `git stash` can't see it because it's not in the working tree.

## How It Happens

A `git reset --hard origin/<branch>` on a branch that has unpushed commits (including ones you just made) orphans them:

```bash
git checkout feature
git reset --hard origin/feature  # ← if feature is ahead of origin, its commits are orphaned
```

The commits become unreachable, `git status` reads clean, and the loss isn't visible.

## The Tell That It Happened

If you just ran `git reset --hard`, watch for:
- `git status` reads unexpectedly clean right after editing files
- `grep` for content you just wrote returns zero
- No reflog entry you recognize

These symptoms mean the commits are orphaned and recovery is possible (object still exists).

## Recovery (while the object still exists)

Recovery is possible immediately after orphaning, before the git garbage collector runs (usually ~30 days):

1. **Find the orphaned SHA:**
   ```bash
   git reflog
   git log -n 20 origin/feature  # check if it shows in recent history
   git rev-parse HEAD@{N}        # where N is the entry in reflog
   ```

2. **Recover it onto the right branch:**
   ```bash
   git checkout target-branch
   git cherry-pick <orphaned-SHA>
   ```

3. **Verify reachability:**
   ```bash
   git branch --contains <SHA>  # non-empty output means it's reachable
   ```

## Prevention

Before `git reset --hard`, verify the branch has nothing unpushed:

```bash
git log --oneline @{u}..HEAD  # must be empty
```

If it isn't empty, don't reset. Instead, merge directly:

```bash
git checkout <target> && git merge <current-branch> --no-edit
```
