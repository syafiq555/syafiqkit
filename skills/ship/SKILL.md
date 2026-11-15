---
name: ship
description: Ship code to production — commit, changelog, push, verify CI/CD deploy, generate release note, close the tracker cards the shipped commits name. Use when the user says "ship", "ship it", "deploy", "push to prod", "send it", or after /done is complete and code is ready to go live. Works with single repos and multi-repo setups (root + sub-repos). Assumes /done (or /quick-done for a small session) was already run.
---

# Ship

End-to-end shipping workflow: commit → changelog → push → verify deploy → release note.

Run the whole chain in one turn. A sub-skill's closing summary (or a written artifact like a report) is shaped like the end of a turn but isn't one: the chain isn't done until this skill's own Output block is written.

If you are **resuming** this skill mid-chain (a compaction landed between two steps), which steps already ran is a question to answer from evidence, not from the summary saying so: each step writes something (a commit, a push, a release note), and whether that artifact exists is checkable in a way a narrative is not. 📖 `../_shared/references/one-turn-chain.md` for the two boundaries where the stop actually lands.

## Prerequisites

**Code must have been reviewed.** `/done` runs the code review; `/quick-done` is docs-only and leaves code unread. If the session wrapped with `/quick-done`, say so and get a review before proceeding.

**Review covers only what reviewers saw.** Code written after they returned is the gap that reads as covered: fixes to their findings, a new redirect or cap, one more screen the user asked for. The peer-commit rule below never matches it, since this session wrote it. Before the push, name the commit or tree each reviewer last saw and run `git diff --stat <that>..HEAD -- <code paths>`; anything non-trivial in that delta goes to a reviewer (and a product reviewer where users see it) before the push. 📖 `references/ship-incidents.md` (2026-11-10). **Tell: a summary line says the last fixes were "checked with tests" or "not agent-reviewed", and you are about to push.**

**"Ship everything" on a shared checkout pushes code nobody here reviewed.** The push carries peers' commits, and neither the git author nor the `Claude-Session:` trailer shows who reviewed them. List the range's commits this session neither wrote nor saw through `/done`, and dispatch a code reviewer (plus a product reviewer where users see the change) on exactly those before the push. Naming the gap in the Ship Summary is not the review. 📖 `references/ship-incidents.md` (2026-10-10). **Tell: your Ship Summary says some code wasn't reviewed in this session, and no reviewer ran before the push.**

**Changes are staged or ready to stage.**

## Workflow

Execute all steps in sequence, except Step 4a's CI/deploy kickoff: background that one (see its note) and don't let it block Step 5. Return to finish Step 4b once the background job resolves. Stop on errors and report to the user.

**Key principle: a ship is complete when the user-visible change is live at the deployment destination, not when source is pushed or CI goes green.** A successful CI run proves the *pipeline* worked, but not that the change reached users. A new container in a registry, an updated remote HEAD, a fired webhook: none of these prove the artifact is live. The runtime consumes separately-built artifacts (bundled frontend, container image, compiled asset), and source being pushed never touches them. Every deployment step has a distinct artifact living in its own place: code in git, containers in a registry, files on a server, schema in the DB. Verify each in place rather than inferring from the tool's exit code or the pipeline's reported success.

### Step 1: Detect Repos

Find all git repos with uncommitted/staged changes. Check the working directory first, then scan immediate subdirectories for nested `.git` repos:

```bash
git status --short
for dir in */; do [ -d "$dir/.git" ] && (cd "$dir" && echo "=== $dir ===" && git status --short); done
```

Skip repos with nothing to commit. If ALL repos are clean, check for unpushed commits (`git log origin/main..HEAD` in each repo). If unpushed commits exist, skip to Step 3.

### Step 2: Commit Each Repo

**Run `/commit`; it owns this step.** The staging, changelog gate, task-doc staleness validation, type/scope selection, commit format, and anti-pattern checks all live in `../commit/SKILL.md`, and stay there: restating one here gives it two homes that drift apart, and the copy a reader hits first is the one they act on. Commit order: sub-repos first, then root (changelog, task docs).

Apply two rules ON TOP of `/commit`, specific to the ship context:

1. **Version-bump gate (plugin/package repos):** if the repo has version files, bump **EVERY** file carrying the version before staging. `grep -rn '"version"' <manifest-dir>` finds them all (secondary fields like `plugins[0].version` drift silently when only the primary is bumped). See the repo's `CLAUDE.md#version-bumping`.

   **Then print every version this repo declares and read them as a set, before staging.** Bumping feels like having bumped and nothing downstream disagrees, so only the printed list catches a miss. All equal and matching the CHANGELOG's top heading, or you have found the drift. The printed list is the deliverable, not a recollection of editing the file. Every heading this push adds must sit above the last shipped one: re-number an uncommitted entry numbered before a version a peer pushed meanwhile. A value *behind* the others is the ordinary shape; take the highest only once its CHANGELOG entry exists. 📖 `references/ship-incidents.md` (version drift).

2. **Task-doc deploy state is verified output from Step 4, not input to it.** Don't write task-doc status lines now: step 4 observes what actually lands and writes the truth then. Fix genuinely-stale content elsewhere in the doc; leave deploy-state lines alone.

**When `/commit` returns, call Step 3 immediately in this same turn.** A sub-skill's closing summary reads exactly like the end of a turn, so completing the sub-skill feels like completing the work, but code is now committed and unpushed, the worst stopping point. If your reply says "next is the push," that sentence is the stop, not the call.

### Step 3: Push

**Understand what you're shipping.** Pushing sends the entire branch, not just today's commit.

**Deploy target:** Read `CLAUDE.md`/`CLAUDE.local.md` for which branch deploys to which environment. Projects often have multiple targets (`main` → staging, `prod` → production) and CI goes green either way, so pushing to the wrong branch is silent. If the current branch isn't the deploy branch, merge onto it (`git checkout <deploy-branch> && git merge <current> --no-edit`), then push.

⚠️ **Run `git status --short` before that checkout, and where the tree holds work that isn't yours, promote from a throwaway worktree beside the repo, never under `/tmp`.** A checkout carries a peer's in-flight files onto the deploy branch and only the following merge fails. Don't stash someone else's work to clear the path. In the worktree, cherry-pick only your SHAs and check `git diff --name-only origin/<deploy-branch>..HEAD` lists only your files before pushing. 📖 `references/promotion-worktree.md` for the recipe, the next-leg merge rule and why cherry-pick scopes the ship.

**What's riding along:** Run `git diff --name-only <deploy-branch>..HEAD` and read those hunks. A commit message says *why* a change exists, not *what* changed, so a `chore:` or `docs:` subject can hide live behavior (feature flags, payout schedules, cron jobs, migrations, currency multipliers). Scan the changed paths for a runtime surface (`config/`, `Kernel.php`, migrations, `.env.example`) and read the hunks rather than the subject lines. Anything that moves money, mail, or user-visible state belongs in the user's decision before merging, not in the summary after. If uncertain, ask.

**Backlog and authorship:** `git log origin/<deploy-branch>..HEAD` shows unpushed commits. If any exist:
- Surface the count in the Ship Summary
- Check authorship: `git log --format='%an' <deploy-branch>..HEAD | sort | uniq -c`. One name can still hide several sessions' work; the Prerequisites review gate covers that case.
- If another author's work is riding along, name what surface it touches: the user decides whether to ship it. Whatever ships unreviewed follows the Prerequisites review gate, findings fixed first

**If conflicts occur:** The CHANGELOG needs special handling: both authors usually write under the same dated heading, and accepting both hunks duplicates it. For every other file, keep both sides (picking one discards a colleague's real work). 📖 `references/merge-conflict-resolution.md` for the changelog case, the entry-count check and cherry-pick conflicts on a promotion.

**Safety: don't orphan commits.** Projects often require `git reset --hard origin/<branch>` before merging: correct for a branch you're merging *into*, destructive on the branch you're merging *from*. Resetting away from unpushed commits orphans them, and `git status` reads clean, so the loss isn't visible. Before any `reset --hard`, verify the branch has nothing unpushed: `git log --oneline @{u}..HEAD` must be empty. If it isn't, don't reset: just merge directly (`git checkout <target> && git merge <this-branch> --no-edit`). 📖 `references/orphaned-commits.md` for the reachability check and recovery.

**Check GitHub auth:** `gh auth status`. If the wrong account is active, switch it (`gh auth switch --user <personal-user>`; `gh` auth is independent of the SSH remote alias). Then push:

```bash
git push
```

### Step 4a: Kick Off CI/Deploy

**Queue the deploy in the background immediately.** Don't wait for it: proceed to Step 5 while it runs.

**Before backgrounding, three checks decide whether polling tells you anything.** (1) Is CI the route? Polling for a deploy never queued hangs or reports a false negative. (2) Does the change carry an **irreversible ordering constraint** (a migration before the code reading it, a flag flipped in a fixed order)? A missed ordering cannot be repaired afterwards. (3) Does a task doc record a **standing manual step or go-live obligation** the diff doesn't touch? 📖 `references/ship-incidents.md` (Step 4a).

When you read the run, match it to *your* commit's SHA before trusting its conclusion: a poll that reads the newest run exits green on its first tick while your deploy is still queued.

📖 `references/step4-polling-and-sequencing.md` for the polling commands, the multi-run assertion, the sequencing-constraint sweep and the manual-step check. Read it once the background job completes and before Step 4b.

### Step 4b: Verify at Destination

**Once the CI/deploy resolves, verify the artifact is actually live** (the Key principle above): touch it at its destination, whether code, schema or config.

**Verify by artifact type:**

- **Code:** `remote <prod-server> "cd <deploy-path>/<repo> && git log --oneline -1"` (skip if `remote` isn't configured or no prod server is documented). Non-git deployments: grep the changed file, or confirm config through the app's bootstrap. When the workflow file names a different host than the alias, believe the workflow; inside a container, get its own root before concluding anything from a negative. 📖 `references/ship-deploy-verification.md` § Host Aliases and Container Paths.
- **Schema:** Migrations often run separately from code deployment (container entrypoint, release phase, separate job, or manual). Ask the DB directly: check the migration tool's status or query the table to confirm the new column exists. Errors on missing columns surface hours after deploy reads green.
- **Data steps:** If a seed/backfill is *part of* this payload, it runs AFTER the code lands (destination still holds the old file). Ask which side of the deploy the step's source lives on: a backfill run before the code deploys executes the old version and changes nothing, which reads as a broken tool rather than wrong ordering. 📖 `references/ship-deploy-verification.md` for seeded-reference recipes.

**Update the task doc with the verified outcome:** flip `Status:` to live (or whatever the real state is), tick the deploy checkbox, and record what you actually observed (command output, not "deployed ✅"). Then grep the doc for every mention of the old state, which often survives in the LLM-CONTEXT header, Quick Start, Task Status table, and Last Session sections. Fix all of them in one pass, using a positive grep control.

If CI failed: report the error and suggest `gh run rerun <id> --failed`. If prod HEAD doesn't match or behavior is wrong: report the mismatch.

### Step 5: Release Note

Generate a Google Chat-formatted release note. Frame it from the task doc, not the changelog: a CHANGELOG lists items as individual wins, so summarizing from it alone can over-claim when work is partially done. The real status lives in `tasks/**/current.md`.

Scope the note to everything the push carried, and to whatever this session changed on production outside git (a setting flipped, a key added). Find the last-deployed version with `git log --oneline <pre-push-SHA>..<pushed-SHA> -- <version-file>`, which shows the versions this push newly released. A docs-only range can hide a live release made outside git, so rely on the commit range, not on a CHANGELOG heading this session just edited. 📖 `references/ship-incidents.md` (2026-10-23).

1. Read `tasks/**/current.md` (use `read-summary`) for the real status: what's done, what's deferred, what the effort *was*.
2. Read the CHANGELOG entries in scope for the itemized change list.
3. **Lead with accomplishment, not caveats.** The headline is what was done; deferred or partial work is a closing note. A closing note that hands an action to a named person says how to do it in one line, or where the steps are. Regroup the changelog's flat list by feature: what users couldn't do before, what they can do now.
4. **Pass raw CHANGELOG text to gchat-format; don't paraphrase.** Count the shipped items against the output bullets; a mismatch means something dropped. Cross-check `git diff --stat <last-deployed>..<HEAD>` for user-facing changes (copy, status labels, templates, buttons) a mid-work changelog missed. Add them to the CHANGELOG first, then format.
5. **If a tracker is documented, open its most recent entry now, before formatting.** Its length, structure and voice beat any default. List the newest few by date, since titles drift, and read the top one plus the one before it when they differ. 📖 `references/ship-incidents.md` (stale tracker format).
6. Format using the `gchat-format` skill, then copy the result to the clipboard (`pbcopy`). Invoke it even when it already ran earlier in the session: a note drafted in remembered syntax skips its first step (📖 `references/ship-incidents.md`, 13/11/2026). **Tell: your release note was drafted without a `Skill` call in this step.** Where the release changed something a person sees and the session already rendered it (a design-review capture, a verification screenshot), name those files above the fence; when the note is then posted through the Chat send tool, they go as a reply in its thread, a second send with its own preview and confirm. Open each one first: local and staging carry real customer data, so only a capture of a seeded demo or test account goes, and one you cannot view or that shows a real name, amount or account switcher is dropped and named as dropped in the same commentary. No capture, no images: don't render one at ship time (📖 `references/ship-incidents.md`, 15/11/2026).
7. If the project documents an issue tracker (`CLAUDE.md`/`CLAUDE.local.md`), post there in the same run. Update an existing entry for this release rather than duplicating it; multi-repo ships need one entry per repo. No tracker documented: skip silently. If the tracker's MCP server is project-scoped (a repo's `.mcp.json`), start a session in that repo and hand it the post rather than reporting the tracker unreachable.
8. **Close the tracker cards this release finished, when the shipped commits name any.** Read `git log <pre-push-SHA>..<pushed-SHA> --format=%B` for `Task:` lines. Most ships carry none, and then this step does nothing and says nothing. Flip each card to done only once Prod Verify passed (a card closed on a staging-only deploy tells the requester it is live), read its status back, and leave a parent or project card open when only one child shipped. A card named only in conversation is invisible here. Report each in the Ship Summary's Cards row.
9. Render as its own fenced block after the Ship Summary table, labelled and distinct; a release note buried in a table reads as one the user can't copy. See the Output template below.
10. **Operator commentary goes ABOVE the fence, never below it.** Commentary (open items, offers, next-steps) addressed to the user goes above the label. Caveats for Chat readers ("Note: bulk export still deferred") go inside the fence. The fence's closing backticks are the end of the output.

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
| Cards | ✅ | [cards flipped to done, from `Task:` lines; omit the row when the range named none] |

[Operator commentary — open items, caveats, offers, status the user should know. Omit if none. This is the ONLY place commentary goes; a choice they have to make goes in the Decisions block above instead, since anything parked down here is something they can read past.]

**Release note — copy everything inside the fence below, nothing outside it:**

```
[gchat-format output — Google Chat syntax, changes-only]
```
````

The inner fence is the artifact. The output ends at its closing backticks: never write another word after them.

## Edge Cases & References

| Situation | Action |
|-----------|--------|
| Only root repo has changes (docs only) | Push root only, skip CI verify |
| No `remote` CLI or no prod server documented | Skip prod verification step |
| No `CHANGELOG.md` | Skip changelog gate and release note |
| Repo is "internal" (plugin, script, tooling) | Never skip the release note: internal repos ship too |
| Sub-repo already pushed but root not | Push only unpushed repos |
| Single repo (no sub-repos) | Works as-is |

📖 **Failure modes & recovery:**
- `references/orphaned-commits.md`: what orphaning looks like and how to recover
- `references/step4-polling-and-sequencing.md`: Step 4a polling, sequencing-constraint sweep, standing manual steps
- `references/ci-provider-polling.md`: CI status checks per provider (GitHub Actions, CircleCI, etc.) and common traps (empty list, retry id reuse)
- `references/ship-deploy-verification.md`: destination verification recipes per artifact type (container, file, git repo, database), host aliases and container paths
- `references/merge-conflict-resolution.md`: changelog and living-doc conflicts, entry-count check, cherry-pick conflicts
- `references/promotion-worktree.md`: promoting onto a deploy branch from a shared checkout
- `references/ship-incidents.md`: the dated incidents behind these rules
