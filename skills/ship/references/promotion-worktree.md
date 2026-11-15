# Promoting to the deploy branch from a shared checkout

Read when Step 3 must merge or cherry-pick onto the deploy branch and the working tree holds work that isn't yours.

## Why a worktree

On a shared checkout carrying another session's in-flight files, `git checkout <deploy-branch>` succeeds and carries those files onto the deploy branch. Only the following `git merge` fails, listing files the merge never touches. By then a peer's work is already on the branch you are about to ship, and the promotion is half-started. The failure also reads as a conflict to resolve, which invites stashing someone else's work to clear the path.

## Recipe

1. `git worktree add ../<repo>-ship <deploy-branch>` beside the repo, never under `/tmp`. A sandboxed session's `/tmp` can be gone by the next shell call while git still lists the worktree, and a `cd /tmp/<name> && ...` chain then skips silently and the rest of the line runs in the shared checkout. `git worktree prune` clears a stale entry.
2. `cd` into the worktree in every call.
3. `git cherry-pick <your SHAs>`.
4. Verify `git diff --name-only origin/<deploy-branch>..HEAD` lists only your files.
5. Push, then `git worktree remove --force`.

## Next leg

Merge `origin/<previous-branch>` in its own worktree. Use `--ff-only` where the deploy branch only fast-forwards. Use a plain merge commit where it carries merge commits of its own: `--ff-only` is refused there, and pushing the previous branch's SHA straight to it is rejected as non-fast-forward. Check the same file list before each push.

## Ship only this session's work

Cherry-pick is the honest answer. A branch merge carries whatever else the branch accumulated; cherry-pick is scoped by construction. A hunk that conflicts during the pick is covered in `merge-conflict-resolution.md` § Cherry-pick conflicts on a promotion.
