# Determining Which Files in a Diff Are YOURS

Referenced by skills whose steps branch on file ownership (done, task-summary, read-summary). Apply before any step that writes, partitions, or scopes agents across a working tree.

**Rule:** classify by diff **content**, never by status plane. The harness auto-stages edits, so your own writes land staged (`M `) exactly like another writer's pre-existing staged work — the plane carries no ownership signal at all.

```bash
git diff HEAD -- <file> | grep -q '<a string this session introduced>' && echo MINE || echo OTHER
```

`HEAD` is load-bearing: a bare `git diff` reads only the unstaged plane and `--cached` only the staged one, so either alone returns empty on a file living in the other plane and reports OTHER for work you just did. The harness auto-stages, which puts most of your own edits where a bare `git diff` cannot see them — a real run classified 8 of its own 11 files as foreign this way, each with exit 0 and no error.

The same split misleads in the other direction, when you're checking that an edit of your own landed rather than whose it is. `git diff HEAD --stat` compares HEAD to the working tree, so it goes empty the moment the working copy is right — while the staged copy can still hold the value you just undid. `git status` then shows `MM` and a peer reading the tree sees the old state, correctly. Reverting a version bump is where this bites: content on disk says one number, the index says another, and a check that consults one plane calls it done. `git status --short` distinguishes them at a glance; `git show :<path>` reads what's actually staged.

Pick a marker only your session could have written: an identifier you added, a filename you created, a phrase from a rule you drafted. A word from the surrounding prose matches the other writer's copy too — and so does **a version number, which is the trap worth naming**, because a peer bumping in the same window writes that same string into their own changelog heading. Grepping `1.140.6` classified a file as owned whose diff was entirely someone else's release notes. A marker is safe when the peer had no reason to type it, which a shared version never satisfies.

⚠️ **The failure is silent and inverts the guard.** Reading `M ` as "someone else's" marks your own work contested and scopes every downstream step to almost nothing — agents review an empty slice, doc skills skip the docs you changed, and each step reports success. **Tell: a file you edited minutes ago classifies as "pre-existing", or the guard leaves you owning one file out of a large diff.**

⚠️ Both planes can be true at once. A file you edited that *also* carries another writer's staged work is contested-and-yours — treat it as contested (don't clobber) while still counting it in your own scope.

This rule reads ownership off disk, so it can only see a peer that has already written something. A live peer can be known earlier and more cheaply, before the collision (`cross-session-messaging.md`) — worth starting a session with when one is plausible, since arriving here means a file is already contested.

**In a project with no git repo, the command above errors rather than answering** (`fatal: not a git repository`), and so does every variant of it — there is no diff plane to classify against, so nothing here degrades gracefully. Ownership falls back to sole-by-construction, which is weaker than it sounds: `cross-session-messaging.md` is the only remaining way to learn a peer exists, and an empty listing isn't proof. `verifying-a-write-landed.md` carries the detection command and the rest of the substitutions. Note the caution inverts from the usual reassurance — with no stash, no `checkout --` and no reflog, anything a peer or an agent overwrites is unrecoverable, so a case this file would normally call merely contested is closer to fatal.

## When a file you must patch is contested

Do not edit it and do not defer the finding. Put the rule where it survives:

| Situation | Action |
|-----------|--------|
| The rule is shared by 2+ skills anyway | Write it to `_shared/references/<topic>.md` — the canonical home regardless — and add pointers from whichever callers are free |
| Only the contested file needs it | Write the finding into the run's report and name the exact edit owed, so the next session applies it in one step |
| A peer asks you to write it because the file isn't theirs | Check who contests it before agreeing. A file can be contested by a *third* session, and taking the write then relocates the collision rather than resolving it |

That last row is the case both this file and `contested-doc-sections.md` otherwise assume away: they are written for two parties, you and a peer, where "not mine" implies "free." With three sessions in one checkout it doesn't — a peer routing a write to you because the target isn't theirs has established only that, and the target can still be mid-write by someone neither of you has messaged. Settle it the same way as any other ownership question, by reading the diff's content rather than by who asked.

A dictated edit carries a second question past ownership: it asserts behavior in files you have not read. Landing it makes you the author of claims you cannot check, in a team-visible file. Ask for the diffs and verify, or decline and let the party who can verify write it — the peer's convenience is not a reason to publish an unverified claim under your own session's name.

Never `git stash`/`checkout -- .`/`reset`/`clean`/`restore` to "clear" contested work — these are repo-wide and take the other writer's uncommitted, unrecoverable changes with them.
