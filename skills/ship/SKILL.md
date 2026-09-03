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

Execute all steps in sequence, except Step 4a's CI/deploy kickoff — background that one (see its note) and don't let it block Step 5. Return to finish Step 4b once the background job resolves. Stop on errors and report to the user.

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

   **Then print every version this repo declares and read them against each other, before staging.** This instruction has existed in some form through more than ten recorded drifts and every one was still caught by a person opening both files, because bumping *feels* like having bumped and nothing downstream disagrees: each file is independently valid JSON, the plugin installs, and the mismatch surfaces only when someone later reads the pair. So the deliverable here is the printed list, not a belief — a gate satisfied by recalling that you edited the file is the failure mode itself. Read the values as a set: all equal and matching the CHANGELOG's top heading, or you have found the drift. A value *behind* the others is the ordinary shape (an earlier bump touched one file), and taking the highest is right only once you have confirmed the CHANGELOG entry for it exists.

2. **Task-doc deploy state is verified output from Step 4, not input to it.** Don't write task-doc status lines now — step 4 observes what actually lands and writes the truth then. Fix genuinely-stale content elsewhere in the doc; leave deploy-state lines alone.

**When `/commit` returns, call Step 3 immediately in this same turn.** A sub-skill's closing summary reads exactly like the end of a turn, so completing the sub-skill feels like completing the work — but code is now committed and unpushed, the worst stopping point. If your reply says "next is the push," that sentence is the stop, not the call. Proceed directly.

### Step 3: Push

**Understand what you're shipping.** Pushing sends the entire branch, not just today's commit. Scan the range for unreviewed work and runtime surface changes you didn't write.

**Deploy target:** Read `CLAUDE.md`/`CLAUDE.local.md` for which branch deploys to which environment. Projects often have multiple targets (`main` → staging, `prod` → production) and CI goes green either way, so pushing to the wrong branch is silent. If the current branch isn't the deploy branch, merge onto it (`git checkout <deploy-branch> && git merge <current> --no-edit`), then push.

**What's riding along:** Run `git diff --name-only <deploy-branch>..HEAD` and read those hunks. A commit message says *why* a change exists, not *what* changed, so a `chore:` or `docs:` subject can hide live behavior — feature flags, payout schedules, cron jobs, migrations, currency multipliers. Scan the changed paths for a runtime surface (`config/`, `Kernel.php`, migrations, `.env.example`) and read the hunks rather than the subject lines. Anything that moves money, mail, or user-visible state belongs in the user's decision before merging, not in the summary after. If uncertain, ask.

**Backlog and authorship:** `git log origin/<deploy-branch>..HEAD` shows unpushed commits. If any exist:
- Surface the count in the Ship Summary
- Check authorship: `git log --format='%an' <deploy-branch>..HEAD | sort | uniq -c`
- If another author's work is riding along, name what surface it touches — the user decides whether to ship it

**If conflicts occur:** The CHANGELOG needs special handling — both authors usually write under the same dated heading, and accepting both hunks duplicates it. For every other file, keep both sides (picking one discards a colleague's real work). 📖 `references/merge-conflict-resolution.md` for the changelog case and the entry-count check.

**Safety: don't orphan commits.** Projects often require `git reset --hard origin/<branch>` before merging — correct for a branch you're merging *into*, destructive on the branch you're merging *from*. Resetting away from unpushed commits orphans them (they become unreachable from any branch), and `git status` reads clean, so the loss isn't visible. Before any `reset --hard`, verify the branch has nothing unpushed: `git log --oneline @{u}..HEAD` must be empty. If it isn't, don't reset — just merge directly (`git checkout <target> && git merge <this-branch> --no-edit`). If you already reset and suspect orphaning, check reachability: `git branch --contains <SHA>` — empty output means gone. 📖 `references/orphaned-commits.md` for recovery if the object still exists.

**Check GitHub auth:** `gh auth status` — if the wrong account is active, switch it (`gh auth switch --user <personal-user>`; `gh` auth is independent of the SSH remote alias). Then push:

```bash
git push
```

### Step 4a: Kick Off CI/Deploy

**Queue the deploy in the background immediately.** Don't wait for it — proceed to Step 5 while it runs. A green CI run only proves the *pipeline* executed, never that the change is live.

**Before backgrounding, three things decide whether polling will tell you anything.** First, whether CI is even the route — polling for a deploy that was never queued hangs or reports a false negative. Second, whether this change carries an **irreversible ordering constraint** (a migration that must land before the code reading it, a flag flipped in a fixed order): missing an ordering constraint cannot be repaired afterwards, while missing a follow-up can. Third, whether a task doc records a **standing manual step or go-live obligation** the diff itself does not touch — a breached obligation sits in production looking like nothing happened, which is how a ship once reported clean over exactly that.

Then, when you read the run: match it to *your* commit's SHA before trusting its conclusion. A poll that reads the newest run exits green on its first tick while your deploy is still queued.

📖 `references/step4-polling-and-sequencing.md` for the polling commands, the multi-run assertion, the sequencing-constraint sweep and the manual-step check. Read it once the background job completes and before Step 4b.

### Step 4b: Verify at Destination

**Once the CI/deploy resolves, verify the artifact is actually live.** The principle is the same whether you're checking code, schema, or config: touch the artifact at its destination, don't infer from the tool's report.

**Verify by artifact type:**

- **Code:** `remote <prod-server> "cd <deploy-path>/<repo> && git log --oneline -1"` (skip if `remote` CLI isn't configured or no prod server documented). Non-git deployments: grep the changed file for what you added, or confirm config applied via the app's bootstrap.
- **Schema:** Migrations often run separately from code deployment (container entrypoint, release phase, separate job, or manual). Ask the DB directly — check the migration tool's status or query the table to confirm the new column exists. Errors on missing columns surface hours after deploy reads green.
- **Data steps:** If a seed/backfill is *part of* this payload, it runs AFTER the code lands (destination still holds the old file). Ask which side of the deploy the step's source lives on — running a backfill before code deploys executes the old version and changes nothing, which reads as a broken tool rather than wrong ordering. 📖 `references/ship-deploy-verification.md` for seeded-reference recipes.

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
