# Polling a CI provider for a deploy's result

Read when a repo HAS a CI provider and you need to confirm it deployed your change. A repo with no CI config deploys manually — skip this entirely.

## Establish the provider first

Check `CLAUDE.md`/`CLAUDE.local.md`, or look for `.circleci/`, `.github/workflows/`, `.gitlab-ci.yml`. Two repos in one session can differ.

| Provider | Command |
|---|---|
| GitHub Actions | `gh run list --limit 5 --json workflowName,status,conclusion,attempt,headSha` |
| Anything else | That provider's API/CLI per the project's `CLAUDE.local.md` — it documents the token, project slug, and any manual approval gate |

## Traps

| Symptom | Cause | Fix |
|---|---|---|
| Empty list, exit 0 — reads as "no deploy was queued", invites a re-push or a "ship is broken" verdict | `gh run list` is blind to any non-GitHub-Actions provider | Poll the provider the repo actually uses; confirm the pipeline is building **your** SHA, not just that *a* pipeline exists |
| Empty list on GitHub Actions while the run exists and may already be green; a wait loop keyed on it never exits | `gh run list --commit` matches only the full 40-character SHA, so a short one returns nothing, exit 0 | Pass `--commit "$(git rev-parse HEAD)"`, and make a wait loop treat "no run found" as a failure to report after a few tries, never as "still queued" |
| Every check green, yet a real failure shipped | One push can start SEVERAL runs (multiple branches, a fan-out CI); watching one hides a sibling's failure | Re-list at the END and assert zero unresolved failures — never poll a single id |
| CI green, the deploy silently failed, found only when someone asks why it is slow | A `workflow_run` deploy starts only after CI completes, as a separate run, so a wait that exits on CI's success never sees it | Grep `.github/workflows` for `workflow_run:`; when one names your CI, wait for that run too (same `headSha`) and read its log on failure before Step 5. A run that ends `skipped` (an `if:` on CI's conclusion) is not a failure |
| A failure notification and a green run disagree | A retried run reuses its id, so both states share one identifier | Read `attempt` + `conclusion`; check whether a *different* run failed rather than assuming it refers to the one you watched |
| A run "fails" within seconds with no step run: "The job was not started because recent account payments have failed or your spending limit needs to be increased" | GitHub-hosted runner minutes for the account are used up for the month (a private repo on the Free plan) or its billing failed; jobs on self-hosted runners still start | Not a code failure, so no rerun. Report it with the time of the first refusal, and check which workflows need hosted runners (`runs-on: ubuntu-latest`) and which are self-hosted. Until the reset or a billing change, which is the account owner's call, a deploy goes out by hand: replay the workflow's own steps on the target (fetch the SHA, the deploy steps, its smoke test, its deploy marker), building any hosted-runner artifact locally, once the user agrees. Long test runs in CI are what drain the minutes |
