# Determining Which Files in a Diff Are YOURS

Referenced by skills whose steps branch on file ownership (done, task-summary, read-summary). Apply before any step that writes, partitions, or scopes agents across a working tree.

**Rule:** classify by diff **content**, never by status plane. The harness auto-stages edits, so your own writes land staged (`M `) exactly like another writer's pre-existing staged work — the plane carries no ownership signal at all.

```bash
git diff --cached -- <file> | grep -q '<a string this session introduced>' && echo MINE || echo OTHER
```

Pick a marker only your session could have written: a version number you bumped, an identifier you added, a filename you created. A word from the surrounding prose matches the other writer's copy too.

⚠️ **The failure is silent and inverts the guard.** Reading `M ` as "someone else's" marks your own work contested and scopes every downstream step to almost nothing — agents review an empty slice, doc skills skip the docs you changed, and each step reports success. **Tell: a file you edited minutes ago classifies as "pre-existing", or the guard leaves you owning one file out of a large diff.**

⚠️ Both planes can be true at once. A file you edited that *also* carries another writer's staged work is contested-and-yours — treat it as contested (don't clobber) while still counting it in your own scope.

## When a file you must patch is contested

Do not edit it and do not defer the finding. Put the rule where it survives:

| Situation | Action |
|-----------|--------|
| The rule is shared by 2+ skills anyway | Write it to `_shared/references/<topic>.md` — the canonical home regardless — and add pointers from whichever callers are free |
| Only the contested file needs it | Write the finding into the run's report and name the exact edit owed, so the next session applies it in one step |

Never `git stash`/`checkout -- .`/`reset`/`clean`/`restore` to "clear" contested work — these are repo-wide and take the other writer's uncommitted, unrecoverable changes with them.
