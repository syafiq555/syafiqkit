---
name: ship
description: Ship code to production — commit, changelog, push, verify CI/CD deploy, generate release note. Use when the user says "ship", "ship it", "deploy", "push to prod", "send it", or after /done is complete and code is ready to go live. Works with single repos and multi-repo setups (root + sub-repos). Assumes /done (or /quick-done for a small session) was already run.
---

# Ship

End-to-end shipping workflow: commit → changelog → push → verify deploy → release note.

Run the whole chain in one turn. A sub-skill's closing summary (or a written artifact like a report) is shaped like the end of a turn but isn't one — the chain isn't done until this skill's own Output block is written.

If you are **resuming** this skill mid-chain (a compaction landed between two steps), which steps already ran is a question to answer from evidence, not from the summary saying so: each step writes something — a commit, a push, a release note — and whether that artifact exists is checkable in a way a narrative is not. 📖 `../_shared/references/one-turn-chain.md` — the two boundaries where the stop actually lands, and why announcing the remaining step honestly evades every guard framed around false claims.

## Prerequisites

- `/done` has already been run (code reviewed, simplified, task docs updated). `/quick-done` does **not** satisfy this — it is docs-only and spawns no reviewer, so a session wrapped there reaches this skill with its code unread. Say so and get a review before shipping, rather than treating the wrap-up as cover
- Changes are staged or ready to stage

## Workflow

Execute all steps in sequence, except Step 4's CI/deploy check — background that one (see its note) and don't let it block Step 5. Stop on errors and report to the user.

**Key principle: a ship is complete when the user-visible change is live at the deployment destination, not when source is pushed or CI goes green.** A successful CI run proves the *pipeline* worked, but not that the change reached users. A new container in a registry means code exists somewhere; HEAD on the remote is updated; a webhook fires — none of these prove the artifact is live. The runtime consumes separately-built artifacts (bundled frontend, container image, compiled asset), and source being pushed never touches them. Every deployment step has a distinct artifact living in its own place: code in git, containers in a registry, files on a server, schema in the DB. Verify each in place rather than inferring from the tool's exit code or the pipeline's reported success.

### Step 1: Detect Repos

Find all git repos with uncommitted/staged changes. Check the working directory first, then scan immediate subdirectories for nested `.git` repos:

```bash
git status --short
for dir in */; do [ -d "$dir/.git" ] && (cd "$dir" && echo "=== $dir ===" && git status --short); done
```

Skip repos with nothing to commit. If ALL repos are clean, check for unpushed commits (`git log origin/main..HEAD` in each repo). If unpushed commits exist, skip to Step 3.

### Step 2: Commit Each Repo

**Run `/commit` — it owns this step.** The staging, changelog gate, task-doc staleness validation, type/scope selection, commit format, and anti-pattern checks all live in `skills/commit/SKILL.md`, and stay there: restating one here gives it two homes that drift apart, and the copy a reader hits first is the one they act on. Commit order: sub-repos first, then root (changelog, task docs).

Apply two rules ON TOP of `/commit`, specific to the ship context:

1. **Version-bump gate (plugin/package repos)** — if the repo has version files, bump **EVERY** file carrying the version before staging. `grep -rn '"version"' <manifest-dir>` finds them all (secondary fields like `plugins[0].version` drift silently when only the primary is bumped). See the repo's `CLAUDE.md#version-bumping`.

2. **Deploy-state override on the staleness gate** — `/commit`'s gate rejects "pending / not yet pushed" language. Under `/ship` the deploy is imminent, so writing transient states ("not yet deployed", "🚢 in flight") becomes wrong the moment it's written — Step 4 writes the verified outcome once it's observed. Leave task-doc deploy-state lines alone; fix only genuinely-stale non-deploy content. If you catch a false "deployed" claim, correct it to the real current state (what's actually live now), not to a midpoint state.

**When `/commit` returns, call Step 3 immediately in this same turn.** A sub-skill's closing summary reads exactly like the end of a turn, so completing the sub-skill feels like completing the work — but code is now committed and unpushed, the worst stopping point. If your reply says "next is the push," that sentence is the stop, not the call. Proceed directly.

### Step 3: Push

Before pushing anything, understand the deploy chain: **which branch deploys to which environment, and in what order?** Many projects promote through a pipeline (`master → staging → production`) or have names that encode the target (`production` branch = production, `main` = staging), sometimes with manual approval gates. Pushing the wrong branch can deploy to staging while being reported as production, and CI goes green either way, so the mismatch doesn't announce itself.

Read the project's `CLAUDE.md`/`CLAUDE.local.md` for the deploy chain. If the current branch isn't the deploy branch, the ship is a forward-merge (`git merge <current> --no-edit` onto the target), not a push.

**Surface what's riding along:** A commit message says *why* the change exists, not *what* changed. A `chore:` or `docs:` message can hide live behavior (feature flags, payout schedules, cron jobs, migrations, currency multipliers). Run `git diff --name-only <deploy-branch>..HEAD` and scan those files for a runtime surface (`config/`, `Kernel.php`, migrations, `.env.example`). Read the hunks themselves: anything that moves money, mail, or user-visible state belongs in the user's decision, not a silent side effect of a message that says the change is routine. If uncertain, ask before merging.

**Check for backlog:** `git push` sends the whole branch, not just today's commit. If the deploy branch is missing prior commits (`git log origin/<deploy-branch>..HEAD`), say so plainly in the Ship Summary so the user knows those are going out too.

**Safety: don't orphan commits.** Projects often require `git reset --hard origin/<branch>` before merging — correct for a branch you're merging *into*, destructive on the branch you're merging *from*. Resetting away from unpushed commits orphans them (they become unreachable from any branch), and `git status` reads clean, so the loss isn't visible. Before any `reset --hard`, verify the branch has nothing unpushed: `git log --oneline @{u}..HEAD` must be empty. If it isn't, don't reset — just merge directly (`git checkout <target> && git merge <this-branch> --no-edit`). If you already reset and suspect orphaning, check reachability: `git branch --contains <SHA>` — empty output means gone. 📖 `references/orphaned-commits.md` for recovery if the object still exists.

**Check GitHub auth:** `gh auth status` — if the wrong account is active, switch it (`gh auth switch --user <personal-user>`; `gh` auth is independent of the SSH remote alias). Then push:

```bash
git push
```

### Step 4: Deploy and Verify

**Kick off the CI/deploy in the background immediately.** A deploy running in the background is not a reason to pause work — a green CI run only proves the *pipeline* executed, never that the change is live. Proceed to Step 5 while verification runs; come back to finish this step once the background check resolves.

First check whether CI is even the route: some projects document a non-CI deploy path (rsync hotfix, manual sync) that fast-tracks certain changes around the pipeline entirely. Polling for a deploy that was never queued hangs or false-negatives, and an empty run list reads identically to one that hasn't started. Read `CLAUDE.local.md` for such a path and follow it if it applies, still verifying at the destination the same way.

A standing project rule that reserves a step for the user ("user builds manually", "never run production builds") describes the default workflow, not a ceiling on what the user can ask for in the moment. When they've explicitly asked for the whole ship to be carried, that instruction authorizes the reserved step — declining it and citing a doc you both know about reads as procedural correctness while leaving the ship half-done. If you do override, name the rule and the instruction that authorized it.

Before polling, discover task docs that reference the shipped commits — different commits can belong to different domains. `git show --name-only <sha>` per commit, then `grep -rl` those files/keywords across `tasks/**/current.md`. Read each match's `## Next Steps` and look for:

- **Sequencing constraints** (prose under headings like "Go-Live Sequencing"). These rarely appear in the checklist and often aren't obvious — grep for keywords like `BEFORE`, `LAST step`, `must be`, `sequenc` alongside any flag/env/backfill name from the diff. Missing an ordering constraint is irreversible, while missing a follow-up is fixable later, so surface constraints to the user *before* the deploy. (A routine follow-up like "tick this checkbox in staging" surfaces in the summary, not as a decision.)
- **Unfinished work** (items in Next Steps still marked pending) — surface in the Ship Summary.

⚠️ **Then sweep the deploy-obligation docs the diff does NOT touch.** The discovery above is scoped to files in this ship, so it can only ever find obligations this ship created — and a manual step an EARLIER deploy left open (a seeder no pipeline runs, a backfill nobody ran, an env key set on one environment only) belongs to a domain whose files are nowhere in your diff. It is structurally invisible to a keyword search built from those files, so following the step exactly still reports clean while a breached obligation sits in production. Grep every `tasks/**/current.md` for the manual-action vocabulary itself, independent of the diff: `on prod|on production|run .*artisan|backfill|seed|must be run|not yet|go-live`. Anything a project's docs flag as a standing manual step is worth confirming against the live system whatever you happen to be shipping today, because the deploy that exposes it is rarely the deploy that created it.

**A doc claiming a feature is "not yet on prod" is a claim to check, not a fact to route by.** Branch history is what settles it (`git merge-base --is-ancestor <feature-sha> origin/<deploy-branch>`) — a doc written when that was true stays unedited after the merge that made it false, so reading it as current is how a live-and-inert feature gets skipped. When the two disagree, the branch wins. 📖 `references/ship-deploy-verification.md` → **Seeded Reference Data** for confirming one of these at the destination.

Once the CI/deploy resolves, verify in place. The principle is the same whether you're checking code, schema, or config: touch the artifact at its destination, don't infer from the tool's report.

**Derive the artifact list from the diff's file types:** bundled frontend lives in a registry or server directory, container images in a registry, schema in the DB, config in env or `.env` on the server. For code:

```bash
remote <prod-server> "cd <deploy-path>/<repo> && git log --oneline -1"
```

Skip if `remote` CLI isn't configured or no prod server is documented. The destination may not be a git repo (rsync/CI-sync land plain files), so verify the behavior instead of the commit: grep the changed file on the server for what you added, or confirm the config applied through the app's own bootstrap.

**If the diff includes migrations, verify the schema changed.** CI green and a passing health probe don't prove the migrations ran — the pipeline that ships code and the pipeline that runs migrations are often different systems (container entrypoint, release phase, separate job, or manual). Ask the DB directly: `artisan migrate:status` (show new migrations as `Ran`), `\d <table>` (check columns exist), or an equivalent query. Code expecting a column that doesn't exist usually breaks on first use, not at boot, so missing migrations surface as production errors hours after the deploy reads green.

**Update the task doc with the verified outcome:** flip `Status:` to live (or whatever the real state is), tick the deploy checkbox, and record what you actually observed (command output, not "deployed ✅"). Then grep the doc for every mention of the old state — it often survives in the LLM-CONTEXT header, Quick Start, Task Status table, and Last Session sections. Fix all of them in one pass, using a positive grep control.

If CI failed: report the error and suggest `gh run rerun <id> --failed`. If prod HEAD doesn't match or behavior is wrong: report the mismatch.

### Step 5: Release Note

Generate a Google Chat-formatted release note. Frame it from the task doc, not the changelog — a CHANGELOG lists items as individual wins, so summarizing from it alone can over-claim when work is partially done. The real status lives in `tasks/**/current.md`.

Scope the note to everything the push carried. Find the last-deployed version in the CHANGELOG (the prior live version in the task doc, or git to settle which SHA was last deployed: `git log --oneline <pre-push-SHA>..<pushed-SHA> -- <version-file>` shows exactly which versions this push newly released). A heading this session just edited is weak evidence — consolidating `[Unreleased]` into today's date is a routine changelog fix, so rely on the commit range, not the file's structure.

1. Read `tasks/**/current.md` (use `read-summary`) for the real status: what's done, what's deferred, what the effort *was*.
2. Read the CHANGELOG entries in scope for the itemized change list.
3. **Lead with accomplishment, not caveats.** The headline is what was done ("upgraded dependencies + hardened security"); defer/partial work is a closing note, not co-headline. Restructure the changelog's flat per-item list into what a user cares about: what they couldn't do before, what they can now, grouped by feature rather than by changelog heading.
4. **Pass raw CHANGELOG text to gchat-format; don't paraphrase.** Summarizing before formatting is where items drop silently. Count the shipped items against the output bullets before sending — a mismatch means something was lost. Cross-check against the diff: a changelog written mid-work routinely under-reports. `git diff --stat <last-deployed>..<HEAD>` and scan for user-facing changes (copy, status labels, templates, buttons) missing from the entry. Add anything missing to the CHANGELOG first, then format from the corrected entry.
5. Format using `gchat-format` skill, then copy the result to the clipboard (`pbcopy`) so it's ready to paste.
6. If the project documents an issue tracker (check `CLAUDE.md`/`CLAUDE.local.md`), post there in the same run — a release note that only exists in the reply doesn't get read. Search for an existing entry first and update it rather than duplicate. Multi-repo ships need one entry per repo. No tracker documented → skip silently.
7. Render as its own fenced block after the Ship Summary table, labelled and distinct — a release note buried in a table reads as one the user can't copy. See the Output template below.
8. **Operator commentary goes ABOVE the fence, never below it.** Commentary (open items, offers, next-steps) addressed to the user goes above the label. Caveats for Chat readers ("Note: bulk export still deferred") go inside the fence. The fence's closing backticks are the end of the output.

## Output

````
## Decisions

1️⃣ [what's true now]
   [the question]

(only when the ship left something the user has to decide — shape and thresholds in `../_shared/references/decision-first-output.md`)

## Ship Summary

| Step | Status | Details |
|------|--------|---------|
| Commit | ✅ | [repos committed, commit hashes] |
| Push | ✅ | [repos pushed] |
| CI/CD | ✅ | [deploy status per repo] |
| Prod Verify | ✅ | [what you observed on the server — HEAD match, or the shipped behavior itself] |
| Release Note | ✅ | See below |

[Operator commentary — open items, caveats, offers, status the user should know. Omit if none. This is the ONLY place commentary goes; a choice they have to make goes in the Decisions block above instead, since anything parked down here is something they can read past.]

**Release note — copy everything inside the fence below, nothing outside it:**

```
[gchat-format output — Google Chat syntax, changes-only]
```
````

The inner fence is the artifact. The output ends at its closing backticks — never write another word after them.

## Edge Cases & References

| Situation | Action |
|-----------|--------|
| Only root repo has changes (docs only) | Push root only, skip CI verify |
| No `remote` CLI or no prod server documented | Skip prod verification step |
| No `CHANGELOG.md` | Skip changelog gate and release note |
| Repo is "internal" (plugin, script, tooling) | Never skip the release note — internal repos ship too |
| Sub-repo already pushed but root not | Push only unpushed repos |
| Single repo (no sub-repos) | Works as-is |

📖 **Failure modes & recovery:**
- `references/orphaned-commits.md` — what orphaning looks like and how to recover
- `references/ci-provider-polling.md` — CI status checks per provider (GitHub Actions, CircleCI, etc.) and common traps (empty list, retry id reuse)
- `references/ship-deploy-verification.md` — destination verification recipes per artifact type (container, file, git repo, database)
