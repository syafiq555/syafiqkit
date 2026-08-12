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

### Step 1: Detect Repos

Find all git repos with uncommitted/staged changes. Check the working directory first, then scan immediate subdirectories for nested `.git` repos:

```bash
git status --short
for dir in */; do [ -d "$dir/.git" ] && (cd "$dir" && echo "=== $dir ===" && git status --short); done
```

Skip repos with nothing to commit. If ALL repos are clean, check for unpushed commits (`git log origin/main..HEAD` in each repo). If unpushed commits exist, skip to Step 3.

### Step 2: Commit Each Repo

**Run `/commit` — it owns this step.** Staging, the changelog gate, the task-doc staleness gate + cross-doc mirror sweep, type/scope selection, commit format and anti-patterns all live in `skills/commit/SKILL.md`; don't restate or re-derive them here. Commit order: sub-repos first, then root (changelog, task docs).

Two rules apply ON TOP of `/commit`, and only under `/ship`:

1. **Version-bump gate (plugin/package repos)** — if the repo has version files, bump **EVERY** file carrying the version before staging. `grep -rn '"version"' <manifest-dir>` finds them all (secondary fields like `plugins[0].version` drift silently when only the primary is bumped). See the repo's `CLAUDE.md#version-bumping`.

2. **Deploy-state override on the staleness gate** — `/commit`'s gate hunts "pending / not yet pushed" language and demands you eliminate it before committing. Under `/ship` the deploy is minutes away, so resolving that gate by writing the pre-deploy state ("not yet deployed", "🚢 in flight") is wrong the moment it's written and costs a second commit to undo. Leave deploy-state lines alone here — Step 4 writes them once, from the verified outcome. Fix only genuinely-stale non-deploy content in this step, and if you catch a false "deployed" claim along the way, correct it straight to the real outcome rather than to the transient midpoint.

**When `/commit` returns, go straight to Step 3 in this same turn.** This is where the chain breaks: a sub-skill signs off with a summary shaped exactly like the end of a turn, so completing the *sub-skill* reads as completing the *work* — and the code is now committed but unpushed, which is the worst place to stop. Naming the next step is not performing it; if your reply says "next is the push", that sentence is the stop. Call it instead.

### Step 3: Push

`git push` on the current branch is not the same thing as deploying. Many projects promote through a chain (`master → staging → production`), sometimes with a manual approval gate, and branch names differ per repo — one repo's `master` can *be* its staging. Pushing whatever branch you happen to be on can deploy nothing, or deploy to staging while the ship gets reported as "shipped to production" — and CI goes green either way, so nothing catches the mismatch on its own. Read the project's `CLAUDE.md`/`CLAUDE.local.md` for the deploy chain, then confirm against the repo with `git rev-list --count origin/<deploy-branch>..HEAD` to see what the target branch is actually missing.

Per repo, before pushing anything, work out:

1. **Which branch deploys to the target env?** If it isn't the current one, the ship is a forward-merge (`git merge <src> --no-edit` — a real merge commit; `--ff-only` fails on diverged branches), not a push.
2. **Is there a gate?** A manual CI approval means the push only queues the deploy.
3. **What rides along?** Read the DIFF, not the commit subjects — `git diff --name-only <deploy-branch>..HEAD`. A `chore:`/`docs:` commit can carry a live behavior change (a payout schedule, a feature flag, a cron cadence) that its subject line gives no hint of, and no gate catches it. Scan the file list for anything with a runtime surface (`config/`, `Kernel.php`, `.env.example`, migrations) and read those hunks — migrations especially are a one-way door and belong in the user's decision, not a silent side effect. Anything that moves money, mail, or user-visible behavior gets surfaced and confirmed before merging, even if it was already committed and reviewed earlier in the session.

If the chain isn't documented and can't be inferred, ask — pushing to a deploy branch is outward-facing and hard to reverse.

`git push` sends the whole local branch, not just the commit `/commit` just made. If `origin/main..HEAD` (checked before pushing) has more than that one commit, the push carries prior-session backlog along with today's work — a user who asked to ship "this" reasonably assumes only "this" goes out. Run `git log --oneline origin/main..HEAD` before pushing, and if it's more than one commit, say so plainly in the Ship Summary's operator commentary (e.g. "this push also carries N earlier commits that were sitting unpushed: `<subjects>`") rather than waiting to be asked.

**Never `git reset --hard` a branch that has commits you haven't pushed — including the one you just committed.** Projects commonly carry a "`reset --hard origin/<branch>` before any merge" rule, correct for a stale branch you're merging *into* but destructive on the branch you're merging *from*: the commit becomes orphaned (reachable from no branch), `git status` reads clean, and `git stash` has nothing to save because the work is already committed, not sitting in the working tree. Before any `reset --hard`, prove the branch has nothing unpushed:

```bash
git log --oneline @{u}..HEAD    # must be empty before resetting this branch
```

If it isn't empty, don't reset it — and if you just committed here, you don't need the reset at all: `git checkout <target> && git merge <this-branch> --no-edit` is the whole chain. It's cheap to detect even when the reset comes from a project script rather than this skill:

```bash
SHA=$(git rev-parse HEAD)    # before any checkout/reset
git branch --contains "$SHA" # after — non-empty means still reachable; empty means orphaned
```

An orphan is recoverable if noticed while the object still exists (`git cherry-pick $SHA` onto the right branch). The signal that it's already too late is a `git status` that reads unexpectedly clean right after editing files, or a grep for content just written returning zero.

Then: check `gh auth status` — if the wrong account is active, read the project's `CLAUDE.local.md` for the correct GitHub user and switch (`gh auth switch --user <personal-user>`; `gh` auth is independent of the SSH remote alias, so a personal `git@github-personal:...` remote with `gh` active on a work account would hit the wrong account via the API). Then push each repo that has commits ahead of remote:

```bash
git push
```

### Step 4: Deploy and Verify

"Ship" means every step that puts the change in front of users, not just the one that moves code. A repo push updates *source*; anything the runtime consumes as a separately built artifact (a bundled frontend, a container image, a compiled asset, a mobile binary) is untouched by it, and a backend that deploys cleanly makes the whole ship look complete while the user-visible half never moved — every check on the deployed half still passes, so the gap doesn't announce itself. Derive the artifact list from the diff's file types, not from what the deploy command reports, then deploy each or name it as outstanding in the Ship Summary.

This includes overriding a project rule that reserves a step for the user by default ("user builds manually", "never run production builds") when the user has just explicitly asked for the whole ship to be carried — a standing rule describes the default workflow, not a ceiling on what an explicit instruction in the moment can ask for. Declining an action the user asked for twice, citing a doc you both already know about, reads as procedural correctness while actually leaving the ship half-done; if you do this, name the rule being overridden and the instruction that authorized it.

Check the project's `CLAUDE.local.md` for a documented non-CI deploy path (rsync hotfix, manual sync, etc.) before assuming CI is the only route — some projects fast-track backend-only changes around CI entirely, and polling `gh run list` for a deploy that was never queued will hang or false-negative. If such a path applies here, follow it instead of 4.1–4.2 below, still doing the equivalent of prod-HEAD verification for that path (e.g. grep the deployed file/config on the server).

A file transfer is verified at the destination, never from the sending command's exit code — a backgrounded or wrapper-mediated upload can hand back control before, or instead of, actually transferring, and the failure then surfaces later as a confusing error about something else entirely. `ls`/checksum the destination before consuming it; if a wrapper rejects its own arguments, drop to the plain tool rather than retrying variations of the wrapper.

A fix applied on the deploy target itself must go through git, not stay on the server — the deploy overwrites its own checkout (`git pull`, or a `reset --hard` that discards local edits without warning), so a hand-edit to a tracked file vanishes silently and the repo disagrees with what's actually running. Read how the deploy updates the checkout before editing there; per-server values belong in the gitignored env file, which survives redeploys.

No deploy is a gate — not even this ship's own. Kick off the CI/deploy check (`gh run watch`/a Monitor/a polling loop) and proceed straight to Step 5; a deploy running in the background is not a reason to sit idle, whether it's the primary deploy or a follow-up mid-ship fix. Come back to finish 4.1–4.2 (and the task-doc write in 4.5) once the background check resolves, before or after Step 5 — only block synchronously if the very next step genuinely needs that deploy's specific output.

Before CI/prod verification, discover the task docs owning each shipped commit's changed files rather than reusing whatever doc is already in context — a different commit in the same push can belong to a different domain than what's already loaded. `git show --name-only <sha>` per commit, then `grep -rl` those filenames/feature keywords across `tasks/**/current.md`. Read each match's `## Next Steps` for items that reference the shipped file/feature and are still open — a commit that *writes* a tool (a new artisan command, a migration helper) is often paired with an approved-but-unexecuted follow-up logged in a doc that has nothing to do with the commit's own domain folder. Surface any hits in the Ship Summary's operator commentary.

Otherwise, verify production matches once the deploy resolves:

1. **Check CI status** — establish which provider the repo uses and poll it in the background. A repo with no CI config deploys manually; `gh run list` returns an empty list and exit 0 against a non-GitHub-Actions provider, which reads identically to "no deploy was queued."
   📖 `references/ci-provider-polling.md` — provider commands, and the three traps: an empty list read as no-deploy, one push fanning out to several runs, a retried run reusing its id.

2. **Verify production HEAD** — read the project's `CLAUDE.local.md` for the production server name and deploy path, then:

```bash
remote <prod-server> "cd <deploy-path>/<repo> && git log --oneline -1"
```

Skip this step if `remote` CLI is not configured or no production server is documented.

The deploy target is often not a git repo at all (rsync/CI-sync deploys land plain files), so `git log` there errors or misleads — and a green CI run only proves the *pipeline* ran, never that the change is actually on disk. Verify the behavior you shipped, not the commit: grep the changed file on the server for the line you added, and resolve config/env-driven changes through the app's own bootstrap (which also proves the config cache rebuilt).

Any grep returning `0` needs a positive control that actually runs before it's trusted. `0` reads identically whether the deploy broke or the search string was never going to match (a closure-dispatched job never prints its class name in a scheduler listing; a bundler hoists a shared string out of the chunk you searched) — re-run unfiltered first. Chain probes with `;`, never `&&`: `grep -c` exits 1 on zero matches, so `grep -c mystring file && grep -c CONTROL file` short-circuits exactly when the control was needed, leaving a bare uncontrolled `0` that reads as a clean negative. Separate every probe with `;` and confirm all lines printed.

3. If CI failed → report error, suggest `gh run rerun <id> --failed`
4. If prod HEAD doesn't match → report mismatch
5. **Write the verified outcome to the task doc** — the write Step 2 deferred. Flip `Status:` to live, tick the deploy checkbox in `## Next Steps`, and record what you actually observed (the command output, not "deployed ✅"). Then grep the doc for every restatement of the old state — it tends to survive in the LLM-CONTEXT header, Quick Start, Task Status table, and Last Session, so fixing one occurrence and stopping leaves the others lying. Run that grep with a positive control that must hit.

### Step 5: Release Note

Generate a Google Chat-formatted release note. Frame it from the task doc, not the changelog — the CHANGELOG lists changes per-item and each reads as a self-contained win, so summarizing from it alone over-claims (e.g. "cleared all alerts" when the task doc's `Status:` is 🟡 partially-done with deferred work). What the effort actually *was*, and what's done versus deferred, lives in `tasks/**/current.md`.

Scope the note to everything the push carried, not just the commit `/commit` just made — a push that included prior-session backlog needs those CHANGELOG versions covered too. Find the last-known-*deployed* version (the task doc's prior live version, or the CHANGELOG entry for the last successful deploy's SHA, which isn't always the previous commit) and include every entry between it and the current one.

A version's presence in `CHANGELOG.md` proves someone wrote the entry, not that it ever reached the remote — a repo that accumulates local commits across sessions can carry many unreleased versions' worth of entries before a single push sends all of them out at once, and skimming the file for "have I seen this feature mentioned already" answers a different question than "was this actually shipped before." Settle the boundary mechanically: `git log --oneline <pre-push-SHA>..<pushed-SHA> -- <version-file>` (or diff the version file's own value at each endpoint) tells you exactly which versions this push newly released, and that range — not whichever heading happens to be nearby in the file — is what the note must cover.

A heading this session just edited is the weakest evidence of scope, not the strongest. Consolidating a backlog heading into today's date (folding `[Unreleased]` in, merging two dated sections) is a routine and correct changelog fix, and it leaves the file reading as though everything under that heading ships now — the entries are real, dated today, and sitting above your own new bullet, so nothing looks off. The commit range still knows the truth: entries already live on the remote stay in the file but belong to an earlier deploy. Derive the note's items from `<pre-push-SHA>..<pushed-SHA>` and treat a large gap between that count and the heading's bullet count as the tell you're reading a merged section, not a release.

1. Read the shipped work's `tasks/**/current.md` (use `read-summary`) for the framing: what the effort accomplished, and its real `Status:` (done vs mitigated vs deferred).
2. Read every `CHANGELOG.md` entry in scope (see above) for the itemized change list — not just the latest one.
3. Lead with the accomplishment, not caveats. The headline is what was done ("upgraded dependencies + hardened security"); deferred/partial work is a short closing note, not a co-headline.

   A changelog's shape isn't a release note's shape, so restructure rather than transcribe. A changelog is a flat per-item log grouped by `Added`/`Fixed` — right for a developer record, wrong for an announcement, because it can split one feature across two headings and give a headline feature the same visual weight as a tooltip fix. Convert to: a short plain-language lead saying what changed for a user and what they couldn't do before (the before-state usually lives in the task doc's Problem/Decision, not the changelog); the headline feature's own items grouped together regardless of which heading they came from; everything unrelated demoted under a plainly-named catch-all. A bug that's really "this feature now works properly" belongs under the feature, not billed beside it as a peer.
4. Pass the CHANGELOG entry's actual text into `gchat-format` — don't paraphrase it from memory first. Summarizing before formatting is where items silently drop or get replaced with generic one-liners the changelog never said, and the skill's own condense step already does the WHAT-not-HOW trim, so feeding it raw text is both less work and more faithful. Before sending, count the entry's actual shipped items against the output bullets — a mismatch means something got lost. Base the count on whatever structure the entry really uses (headings, or a bare `## <version>` + prose bullets) rather than a hardcoded set of heading names, since a check that can't fire on an entry's actual shape reads exactly like one that passed.

   That count only validates the note against the CHANGELOG — it can't tell you the CHANGELOG is itself short. Reconcile the entry against the deployed diff before formatting: the changelog is written by hand mid-work and routinely under-reports what actually shipped, so a note faithfully derived from it inherits every omission while every self-check still passes. Diff the deployed range (`git diff --stat <last-deployed>..<HEAD>`) and scan the surfaces a user can perceive — notification/mail classes, user-facing copy and status labels, templates, form and button states — confirming each has a line in the entry. Two cheap cross-checks: a commit subject claiming a count ("close 14 items") against the entry's actual item count, and each commit's body naming changes the entry never mentions. Add anything missing to the CHANGELOG first, then format from the corrected entry.
5. Format using the `gchat-format` skill (convert to Google Chat syntax).
6. Copy to clipboard.
7. If the project documents an issue tracker, post there in the same run rather than waiting to be asked — a release note that only exists in the reply is a note nobody reads. Check `CLAUDE.md`/`CLAUDE.local.md` for a tracker convention (list/board ids, card-per-date naming, required status/assignee) and follow it exactly, searching for an existing entry first and updating it rather than creating a duplicate. Multi-repo ships usually need one entry per repo, in that repo's own list. No documented tracker → skip silently.
8. Render the formatted result as its own labelled, fenced block after the Ship Summary table, never inline within it — a release note that only shows up as a table row reads as buried rather than as a standalone artifact the user can copy. See the Output template below.
9. The fenced block is the last element of the output; nothing follows it. All operator commentary (open items, next-decisions, offers like "I can trigger the migration") goes above the label, before the fence — appending it below makes the note's own last line read as more note, so the user can't tell where the copy-paste stops. The two caveat classes have different audiences and belong in different places:

| Caveat class | Example | Goes |
|---|---|---|
| **Audience** — the Chat readers need it | "Note: bulk export still deferred." | **Inside** the fence (item 3) |
| **Operator** — addressed to the user | "One open item (not blocking)…", "I can flip the flag if you want" | **Above** the label |

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

## Edge Cases

| Situation | Action |
|-----------|--------|
| Only root repo has changes (docs only) | Push root only, skip CI verify |
| No `remote` CLI or no prod server in CLAUDE.local.md | Skip prod verification step |
| No `CHANGELOG.md` | Skip changelog gate and release note |
| Repo is "internal" (plugin, script, tooling) | Never skip the release note — internal repos ship too. Only skip is `No CHANGELOG.md` |
| Sub-repo already pushed but root not | Push only unpushed repos |
| Single repo (no sub-repos) | Works as-is — just one repo to process |
