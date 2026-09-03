# Step 4a: CI Polling and Sequencing Checks

Before verifying deployed artifacts, resolve the CI/deploy and check for sequencing constraints.

## Polling the CI/Deploy

**Non-CI deploy paths:** Some projects document rsync hotfixes or manual sync that bypass CI. Check `CLAUDE.local.md` for a non-CI path and follow it if documented, still verifying at destination the same way.

**Match the run to YOUR commit.** A poll on "most recent run" will return the *previous* commit's run if it completed — CI goes green, loop exits, and your deploy is still queued unnoticed. Key the wait on the SHA or commit subject you just pushed, not on position in the list. Treat "green" as a starting point, not the answer — verify the artifact at destination (Step 4b).

📖 `ci-provider-polling.md` for per-provider commands and sibling-run traps.

**User-reserved steps:** A project rule saying "user builds manually" or "never run production builds" describes the default, not a ceiling. When the user has explicitly asked you to carry the whole ship, that instruction overrides the reserve. Name both the rule and the user's instruction if you do override.

## Sequencing Constraints

Before verifying, surface any ordering constraints to the user.

**Discover task docs:** `git show --name-only <sha>` per commit, then `grep -rl` those files/keywords across `tasks/**/current.md`. For each match, read `## Next Steps` and surface:

- **Sequencing constraints** (under headings like "Go-Live Sequencing"): grep for `BEFORE`, `LAST step`, `must be`, `sequenc` paired with any flag/env/backfill name from your diff. Missing an ordering constraint is irreversible; missing a routine follow-up is fixable later. Surface constraints *before* deploy.
- **Unfinished work** (items still marked pending in Next Steps): surface in Ship Summary.

**Sweep for standing manual steps:** The discovery above only finds obligations this ship created. Earlier deploys may have left manual steps (seeders no pipeline runs, backfills nobody ran, env keys set on one environment only) whose docs don't appear in your diff. Grep every `tasks/**/current.md` for manual-action keywords independent of your changes: `on prod|on production|run .*artisan|backfill|seed|must be run|not yet|go-live`. Surface anything a project flags as a standing manual step — the deploy that exposes it is rarely the one that created it.

**Feature status claims:** A doc claiming "not yet on prod" is a claim, not a fact. Check it: `git merge-base --is-ancestor <feature-sha> origin/<deploy-branch>` tells you if it's actually deployed. Docs written before a merge stay unedited after, so live-and-inert features get skipped.

📖 `ship-deploy-verification.md` → **Seeded Reference Data** for verification recipes.
