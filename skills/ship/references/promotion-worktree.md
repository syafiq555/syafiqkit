# Promoting to the deploy branch from a shared checkout

Read when Step 3 must merge or cherry-pick onto the deploy branch and the working tree holds work that isn't yours.

## Why a worktree

On a shared checkout carrying another session's in-flight files, `git checkout <deploy-branch>` succeeds and carries those files onto the deploy branch. Only the following `git merge` fails, listing files the merge never touches. By then a peer's work is already on the branch you are about to ship, and the promotion is half-started. The failure also reads as a conflict to resolve, which invites stashing someone else's work to clear the path.

## First choice: rebuild the commits in place, no checkout at all

When the picks apply cleanly, git can build them on the deploy branch's tip without touching the working tree, the index or any branch, so a shared checkout stays exactly as it was:

```bash
tip=$(git rev-parse origin/<deploy-branch>)
for c in <your SHAs, oldest first>; do
  tree=$(git merge-tree --write-tree --merge-base "$c^" "$tip" "$c") || { echo "conflict on $c"; break; }
  tip=$(git log -1 --format=%B "$c" | git commit-tree "$tree" -p "$tip")
done
git diff --name-only origin/<deploy-branch> "$tip"   # only your files
git push origin "$tip:refs/heads/<deploy-branch>"
"$SHIP_SKILL_DIR"/../commit/scripts/sync-push.sh --no-push   # ship's base directory; only when <deploy-branch> is checked out here
```

`merge-tree --write-tree` (git 2.38+) exits non-zero on a conflict, which is the moment to fall back to the worktree below. Pass the original author through `GIT_AUTHOR_*` if it matters. A push by SHA never moves a local branch. When `<deploy-branch>` is the branch checked out here (often `main`), the last line moves it to the pushed commit, leaving peers' unsaved files alone; skip it and the next push reads "ahead N, behind M" over work already upstream (beacon-mart 17/11). Never fold the old commits back in with `git merge origin/<deploy-branch>`: that adds a merge of identical work on a shared tree. A branch that is not checked out (a separate `staging`) needs nothing. Prefer this route: a worktree needs its own dependencies to run the project's checks (a symlinked `vendor` or `node_modules` can make path-sensitive tests fail), and a user watching a shared checkout reads a new folder beside it as risk (17/11/2026: the worktree route was refused twice with "cannot inside here ?", and this route shipped the same four commits).

## Recipe (worktree, when a pick conflicts)

1. `git worktree add ../<repo>-ship <deploy-branch>` beside the repo, never under `/tmp`. A sandboxed session's `/tmp` can be gone by the next shell call while git still lists the worktree, and a `cd /tmp/<name> && ...` chain then skips silently and the rest of the line runs in the shared checkout. `git worktree prune` clears a stale entry.
2. `cd` into the worktree in every call.
3. `git cherry-pick <your SHAs>`.
4. Verify `git diff --name-only origin/<deploy-branch>..HEAD` lists only your files. To run tests there, copy the gitignored dependency folder rather than symlinking it: Composer's autoloader resolves the source path from its own real location, so a `vendor/` symlinked from the main checkout runs the main checkout's code and the worktree's suite proves nothing (17/11/2026: identical test counts in both trees gave it away). Copy it and run `composer dump-autoload`; check the count moves with what the worktree adds.
5. Push, then `git worktree remove --force`. If `<deploy-branch>` is checked out in the main tree, run `sync-push.sh --no-push` there, as above.

## Next leg

Merge `origin/<previous-branch>` in its own worktree. Use `--ff-only` where the deploy branch only fast-forwards. Use a plain merge commit where it carries merge commits of its own: `--ff-only` is refused there, and pushing the previous branch's SHA straight to it is rejected as non-fast-forward. Check the same file list before each push.

## Ship only this session's work

Cherry-pick is the honest answer. A branch merge carries whatever else the branch accumulated; cherry-pick is scoped by construction. A hunk that conflicts during the pick is covered in `merge-conflict-resolution.md` § Cherry-pick conflicts on a promotion.
