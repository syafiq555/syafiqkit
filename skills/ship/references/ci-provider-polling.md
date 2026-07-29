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
| Every check green, yet a real failure shipped | One push can start SEVERAL runs (multiple branches, a fan-out CI); watching one hides a sibling's failure | Re-list at the END and assert zero unresolved failures — never poll a single id |
| A failure notification and a green run disagree | A retried run reuses its id, so both states share one identifier | Read `attempt` + `conclusion`; check whether a *different* run failed rather than assuming it refers to the one you watched |
