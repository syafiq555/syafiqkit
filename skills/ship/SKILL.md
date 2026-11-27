---
name: ship
description: Ship code to production — commit, changelog, push, verify CI/CD deploy, generate release note, close the tracker cards the shipped commits name. Use when the user says "ship", "ship it", "deploy", "push to prod", "send it", or after /done is complete and code is ready to go live. Works with single repos and multi-repo setups (root + sub-repos). Assumes /done (or /quick-done for a small session) was already run.
---

# Ship

End-to-end shipping workflow: commit → changelog → push → verify deploy → release note.

Run the whole chain in one turn. A sub-skill's closing summary or report looks like an ending and isn't one; the chain is done when this skill's own Output block is written.

**A deploy made after the Output is a new ship.** A follow-up fix pushed to the deploy branch in the same session owes Steps 4b and 5 again: the CHANGELOG line, the task doc's verified state, the tracker entry, the client's sheet row when the fix answers one (a row told "live on staging" is answered again once production is verified), and the team post (edit the earlier post when it only adds to it, so nobody is notified twice). **Tell: you pushed to a deploy branch after this skill's Output, and your reply ends on the run's conclusion.**

Resuming mid-chain after a compaction: answer which steps ran from evidence (the commit, the push, the release note each step writes), not from the summary. 📖 `../_shared/references/one-turn-chain.md` for the two boundaries where the stop lands.

## Prerequisites

**Code must have been reviewed.** `/done` runs the review; `/quick-done` leaves code unread, so after it, say so and get a review before proceeding.

**`/done` must have reached its Output, not only its review.** Asked for "/done and /ship" together, the review's fixes and their tests feel like the wrap-up and the chain jumps here, leaving Knowledge, Task docs and the plugin gate unrun (18/11/2026: a tool built and shipped this way never reached `update-plugin`). Before Step 1, find the last `/done` Session table in this conversation written after the code; if there is none, finish `/done`'s Steps 3 to 5 first. Code built from the answers to that `/done`'s own closing questions came after its Session table, so it needs another `/done` (27/11/2026: three answered questions were built and taken straight to the push, and the user asked for `/done` first). **Tell: you are shipping and no Knowledge or Plugin row exists for this code, or the code answers a question the last `/done` asked.**

**Review covers only what reviewers saw.** Code written after they returned (fixes to findings, a new redirect, one more screen) reads as covered when it isn't, and the peer-commit rule below never catches it. Before the push, run `git diff --stat <last-reviewed-SHA>..HEAD -- <code paths>` and send anything non-trivial to a reviewer (a product reviewer where users see it). 📖 `references/ship-incidents.md` (2026-11-10). **Tell: a summary line says the last fixes were "checked with tests" or "not agent-reviewed", and you are about to push.**

**"Ship everything" on a shared checkout pushes code nobody here reviewed.** Neither the git author nor the `Claude-Session:` trailer shows who reviewed a peer's commit. List the range's commits this session neither wrote nor saw through `/done`, and dispatch a reviewer (product too, where users see it) on exactly those before the push. Naming the gap in the Ship Summary is not the review. 📖 `references/ship-incidents.md` (2026-10-10). **Tell: your Ship Summary says some code wasn't reviewed in this session, and no reviewer ran before the push.**

## Workflow

Run in sequence, except Step 4a's kickoff, which backgrounds and doesn't block Step 5; finish Step 4b when it resolves. Stop on errors and report.

**Key principle: a ship is complete when the user-visible change is live at the destination, not when source is pushed or CI goes green.** A pushed branch, a registry image or a fired webhook proves nothing about the runtime, and bundled frontends or compiled assets are built apart from source. Verify each artifact in its own place (code in git, containers in a registry, files on a server, schema in the DB), not from the exit code or the pipeline's report.

### Step 1: Detect Repos

Find repos with uncommitted changes: the working directory, then immediate subdirectories with a nested `.git`:

```bash
git status --short
for dir in */; do [ -d "$dir/.git" ] && (cd "$dir" && echo "=== $dir ===" && git status --short); done
```

Commit only the repos with changes. Check every repo for unpushed commits (`git log origin/main..HEAD`), clean or not: a sub-repo committed earlier still needs its push while the root is dirty. Step 3 pushes exactly the repos that have them; if all are clean, go straight there.

### Step 2: Commit Each Repo

**Run `/commit`; it owns this step** (staging, changelog gate, task-doc validation, commit format, all in `../commit/SKILL.md`). Restating any of it here gives it a second home that drifts. Commit order: sub-repos first, then root.

Two rules ON TOP of `/commit`, specific to ship:

1. **Version-bump gate (plugin/package repos):** bump every file carrying the version before staging. Secondary fields such as `plugins[0].version` drift silently when only the primary moves; `grep -rn '"version"' <manifest-dir>` finds them all (the repo's `CLAUDE.md#version-bumping`).

   **Then print every version the repo declares and read them as a set; they must all match the CHANGELOG's top heading.** A printed list is the check, not recall. A heading this push adds sits above the last shipped one (re-number an uncommitted entry a peer's push has overtaken). A value behind the others is ordinary; take the highest only once its CHANGELOG entry exists. 📖 `references/ship-incidents.md` (version drift).

2. **Task-doc deploy state is verified output from Step 4, not input to it.** Don't write deploy-state lines now; Step 4b writes what actually lands. Fix genuinely-stale content elsewhere in the doc.

**When `/commit` returns, go straight to Step 3 in this same turn.** Committed and unpushed is the worst place to stop; a reply that says "next is the push" has already stopped.

### Step 3: Push

**Understand what you're shipping.** Pushing sends the entire branch, not just today's commit.

**Deploy target:** Read `CLAUDE.md`/`CLAUDE.local.md` for which branch deploys where. Targets differ by project (`main` → staging, `prod` → production), and CI goes green either way, so the wrong branch is silent.

⚠️ **Run `git status --short` before any checkout of the deploy branch. Where the tree holds work that isn't yours, don't check anything out: rebuild only your SHAs on the deploy branch's tip with `git merge-tree --write-tree` and `git commit-tree`, which touch no file, index or branch, then push that commit. Where the tree holds no one else's work and you're on another branch, `git checkout <deploy-branch> && git merge <current> --no-edit` is the route instead.** A checkout carries a peer's in-flight files onto the deploy branch and only the following merge fails. Don't stash someone else's work to clear the path. A throwaway worktree beside the repo (never under `/tmp`) is the fallback for a pick that conflicts. Either way, check that the diff against `origin/<deploy-branch>` lists only your files before pushing.

**A push by SHA leaves the checked-out branch behind, so follow it with `<this skill's base directory>/../commit/scripts/sync-push.sh --no-push`** when the pushed commit lands on the branch you're on (the deploy branch is your own, or one commit goes to both `main` and `staging`). Without it the files stay "modified" and the next push reads ahead and behind over work already upstream (beacon-mart 17/11, `4695c75e`). 📖 `references/promotion-worktree.md` for both recipes, the next-leg merge rule and why cherry-pick scopes the ship.

**What's riding along:** Read the hunks of `git diff --name-only <deploy-branch>..HEAD`, not the subjects: a `chore:` or `docs:` commit can hide live behavior (feature flags, payout schedules, cron, migrations, `.env.example`). Anything that moves money, mail or user-visible state is the user's decision before merging, not a line in the summary after. If uncertain, ask.

**Backlog and authorship:** `git log origin/<deploy-branch>..HEAD` lists unpushed commits. If any exist, surface the count in the Ship Summary, check authorship (`git log --format='%an' <deploy-branch>..HEAD | sort | uniq -c`; one name can hide several sessions), and if another author's work rides along, name the surface it touches for the user to decide. Whatever ships unreviewed follows the Prerequisites review gate, findings fixed first.

**If conflicts occur:** The CHANGELOG needs special handling: both authors usually write under the same dated heading, and accepting both hunks duplicates it. For every other file, keep both sides (picking one discards a colleague's real work). 📖 `references/merge-conflict-resolution.md` for the changelog case, the entry-count check and cherry-pick conflicts on a promotion.

**Safety: don't orphan commits.** `reset --hard origin/<branch>` is correct on the branch you merge *into* and destructive on the one you merge *from*, and `git status` reads clean after it, so the loss isn't visible. Before any reset, `git log --oneline @{u}..HEAD` must be empty; if not, merge directly (`git checkout <target> && git merge <this-branch> --no-edit`). 📖 `references/orphaned-commits.md` for the reachability check and recovery.

**Check GitHub auth:** `gh auth status`. If the wrong account is active, prefix the `gh` calls that need the other one with `GH_TOKEN=$(gh auth token --user <user>)` rather than switching the active account, which other sessions share (`gh` auth is independent of the SSH remote alias). Then push:

```bash
git push
```

If `git status -sb` shows `[behind N]` or the push is rejected as non-fast-forward, run `<this skill's base directory>/../commit/scripts/sync-push.sh` from the repo root instead of pulling. It replays your commits on the remote tip and moves the local branch without touching peers' files (exit 1: real conflict; exit 2: a peer's edit blocks the local move after the push succeeded).

### Step 4a: Kick Off CI/Deploy

**Before backgrounding, three checks decide whether polling tells you anything.** (1) Is CI the route? Polling for a deploy never queued hangs or reports a false negative. (2) Does the change carry an **irreversible ordering constraint** (a migration before the code reading it, a flag flipped in a fixed order)? A missed ordering cannot be repaired afterwards. (3) Does a task doc record a **standing manual step or go-live obligation** the diff doesn't touch? 📖 `references/ship-incidents.md` (Step 4a).

**Once those pass, queue the deploy in the background** and proceed to Step 5 while it runs. A docs-only push (only the root repo changed) skips CI verify. Match the run to *your* commit's SHA before trusting it: a poll that reads the newest run exits green on its first tick while your deploy is still queued. Hold any further push to that branch (a `/done` docs commit included) until the run resolves, or fold it into the same push: a workflow with `cancel-in-progress` concurrency cancels the run you are verifying, and the watch reports "canceled", not a result for your fix.

📖 `references/step4-polling-and-sequencing.md`, read once the background job completes and before Step 4b: polling commands, multi-run assertion, sequencing sweep, manual-step check.

### Step 4b: Verify at Destination

**Once CI/deploy resolves, verify the artifact is live** at its destination (the Key principle).

**Verify by artifact type:**

- **Code:** `remote <prod-server> "cd <deploy-path>/<repo> && git log --oneline -1"` (skip if `remote` isn't configured or no prod server is documented). Non-git deployments: grep the changed file, or confirm config through the app's bootstrap. Believe the workflow file over the alias when they name different hosts; inside a container, get its own root before concluding from a negative. 📖 `references/ship-deploy-verification.md` § Host Aliases and Container Paths.
- **Schema:** Migrations often run apart from code (entrypoint, release phase, separate job, manual). Ask the DB: migration status, or a query confirming the new column. Missing-column errors surface hours after a green deploy.
- **Data steps:** A seed or backfill in this payload runs AFTER the code lands. Run before it, it executes the old file and changes nothing, which reads as a broken tool. 📖 `references/ship-deploy-verification.md` § Seeded Reference Data.
- **Provider switched from test to live:** a payment gateway or other provider keeps separate objects per mode (webhook endpoints, signing secrets, API keys), so the test-mode setup that worked in UAT does not exist in live mode. Create the live ones in this ship and check each where it lives: the endpoint listed and enabled in the provider's live dashboard, its secret and keys set on production. 📖 `references/ship-incidents.md` § Live webhook missing after a go-live.

**Update the task doc with the verified outcome:** flip `Status:`, tick the deploy checkbox, record observed command output (not "deployed ✅"). Then grep for the old state, which survives in the LLM-CONTEXT header, Quick Start, Task Status and Last Session sections, and fix every hit in one pass with a positive grep control.

**If CI failed, read the failed job's log (`gh run view <id> --log-failed`) before saying anything about it.** A rerun is for a failure the log shows came from outside the payload (a network timeout, a runner fault). A failure the payload caused or exposed (a failing test, a build error, a missing server extension or package) is fixed, pushed and verified again in this run, since a rerun of it fails the same way and the deploy sits broken while the reply reads like progress. 📖 `references/ship-incidents.md` § CI failure left at "suggest a rerun". **Tell: your reply suggests a rerun and the failed log is unread.** If prod HEAD doesn't match or behavior is wrong: report the mismatch.

**A personal side project with no real address yet (its first deploy, or still on an sslip.io host or a raw IP) gets one in this ship, once Prod Verify passes:** run `side-domain`, which routes `<name>.<umbrella>`, 301s any old host and moves uploads to R2 only when the app stores any. Whether the project is a side project and which umbrella domain it uses come from the global `CLAUDE.md` `#side-domain` (check `git remote -v` against it); a client or employer app keeps its own deploy docs. Leave search hiding as it is unless the owner chose to open it. **Tell: your Prod Verify row names an sslip.io URL for a side project, and `side-domain` did not run.**

### Step 5: Release Note

Frame the note from the task doc, not the changelog: a CHANGELOG lists wins one by one and over-claims when work is partial. The real status lives in `tasks/**/current.md`. Generate a Google Chat-formatted note.

A repo with no `CHANGELOG.md` skips the changelog gate and the release note, except an internal repo (plugin, script, tooling), which still gets a release note: it ships too.

**A docs-only push still owes the team post when the team acts on what it carries** (a proposal, a plan, a decision record, a tracker row someone owns); only a push the team never needs to know about (a typo, private working notes) skips it. "No screen changed" is a reason for no release note, not for no post: the post then explains the situation and what was done, per `gchat-format` § Work not shipped. **Tell: your Release Note row says "not posted" and the push carries something a named teammate must read or act on.**

Scope the note to everything the push carried, and to whatever this session changed on production outside git (a setting flipped, a key added). When the user names the last version they posted ("last posted 1.488.0"), the note starts there however many pushes followed, and a later ship in the same session rebuilds that one note to include its own version rather than replacing the earlier note on the clipboard, unless the user says the earlier one went out (27/11/2026: a second ship's 1.496.0-only note replaced the 1.490.0 to 1.495.0 one, and the user asked "So only these are the release note from the last time i posted is it ?"). Find the last-deployed version with `git log --oneline <pre-push-SHA>..<pushed-SHA> -- <version-file>`. Rely on the commit range, not a CHANGELOG heading this session just edited: a docs-only range can hide a live release made outside git. 📖 `references/ship-incidents.md` (2026-10-23). A note scoped back past this push ("last posted 1.488.0") covers commits already pushed: any that no `/done` Output covered (marked as in `../done/references/git-variants-by-state.md` § Work Already Committed) go through the Prerequisites review gate before the note is written, since announcing them is releasing them to readers. A defect it finds in pushed code is fixed in a new version, pushed, and the note then covers that version too.

1. Read `tasks/**/current.md` (use `read-summary`) for what's done, deferred, and what the effort *was*.
2. Read the CHANGELOG entries in scope for the itemized list.
3. **Lead with accomplishment, not caveats.** Deferred work is a closing note; a note that hands an action to a named person says how in one line, or where the steps are. Regroup the flat list by feature: what users couldn't do before, what they can do now.
4. **Pass raw CHANGELOG text to gchat-format; don't paraphrase.** Count shipped items against the output bullets; a mismatch means something dropped. Cross-check `git diff --stat <last-deployed>..<HEAD>` for user-facing changes (copy, status labels, templates, buttons) a mid-work changelog missed, add them to the CHANGELOG, then format.
5. **If a tracker is documented, open its most recent entry before formatting.** Its length, structure and voice beat any default. List the newest few by date (titles drift) and read the top one plus the one before it when they differ. 📖 `references/ship-incidents.md` (stale tracker format).
6. Format with the `gchat-format` skill, invoked even when it ran earlier in the session (📖 `references/ship-incidents.md`, 13/11/2026), unless the project's own `CLAUDE.md` or `CLAUDE.local.md` spells out a plain-text release-post format for that destination (a plain first line, no bullets or bold): then draft to that and skip the call. A written format that names bold sections or lists still gets the call, which supplies the syntax while the project's words set the shape; and the doc's words outrank the space's latest posts, which teammates may have typed plain (20/11/2026: a GB Mart rule saying "short bold sections" was drafted plain to match the space's last posts, and the user asked for `/gchat-format` after it was sent). A user who names `gchat-format` still gets its formatting. Then copy to the clipboard (`pbcopy`). **Tell: your release note was drafted without a `Skill` call in this step, and the project doc you followed names bold or bullets, or names no format at all.** A project-named format skips only the formatting call; the captures in item 8 are still owed.
7. **When the work answers an ask someone posted in Chat, reply to that ask first.** The request often arrives as their words pasted in (a link plus a one-line "patch if any"), so search the recent spaces for that text before choosing a destination. Answer it where it was asked, in the sender's voice through `casual-message`; the project's release space follows. 19/11/2026: an nginx CVE patch the CTO asked for in the tech group was previewed straight into the product space, and the user stopped it with "check the tech group one". **Tell: the invocation's text reads like a forwarded message and you never looked for where it came from.**
8. **Where the team reads release notes in a Chat space, the clipboard is not delivery.** When the project docs name the space, or an earlier release note or team update sits in it, preview the post with the Chat send tool in this run, show its line and full text in the reply, then send: the send tool's own permission prompt is the one confirmation, so no `AskUserQuestion` before it. **A note about a changed screen then gets its captures as a thread reply under it, in the same run**: only captures holding seeded demo or test data, each opened first, kept and dropped ones named above the fence, previewed like the post. A screen with a dialog, sheet, sticky bar or toast goes as a screen-sized capture, since a full-page one paints the overlay and its dimming over the first screen only. **Tell: the post is sent, the change is visible, and no thread reply carries a capture.** 📖 `references/ship-deploy-verification.md` § Release Captures, `references/ship-incidents.md` (15/11/2026, 20/11/2026). Docs naming no space is not evidence there is none: list the Chat spaces, open the one named after the project, and record it in the project's local instructions. 📖 `references/ship-incidents.md` § Release note only on the clipboard.
9. If the project documents an issue tracker (`CLAUDE.md`/`CLAUDE.local.md`), post there in the same run. Update an existing entry for this release rather than duplicating it; multi-repo ships need one entry per repo. A release-note card is a record, not open work: once posted, set it to the list's done status and read it back, or every release sits in the board's to-do column (25/11/2026: 18 had piled up and the team's board tidy closed them by hand). None documented: skip silently. If the tracker's MCP server is project-scoped (a repo's `.mcp.json`), start a session in that repo and hand it the post rather than reporting the tracker unreachable.
10. **Close the tracker cards this release finished, when the shipped commits name any.** Read `git log <pre-push-SHA>..<pushed-SHA> --format=%B` for `Task:` lines; most ships have none and this step does nothing. Flip each card only once Prod Verify passed (a card closed on a staging-only deploy tells the requester it is live), read its status back, and leave a parent or project card open when only one child shipped. A card named only in conversation is invisible here. Report each in the Ship Summary's Cards row.
11. **Answer the sheet row this ship fixed.** When the user asked this session to fix a client tracker row or a tester's Fail, only that row reaches the reporter; the post and card reach the team. Once the deploy is verified where it landed, re-read the row (a peer or the client may have written since), then add one line per row saying what was fixed and where it is live (staging only, or production), and set the status. The reply cell, signature, colour and next status come from the project's own rule for that sheet: a tracker usually hands the row to whoever acts next, a test workbook usually puts the check back to runnable, and a fix that touches a test script's source owes that sync too. The line says what they can now see or do, never that the fix was a setting flipped or something already built (`casual-message` § Replying to their message). Append the reply with `cell_append_line` so other people's colours survive; the status cell takes a plain value write. When the row was only context, the fix is partial, someone wrote after the fix, the line would promise something the user did not choose, or the sheet has no documented rule, write nothing: put the draft in the Output's Decisions block and mark the row "not written" in Client rows. Report each in the Ship Summary's Client rows row. **Tell: the release note is posted and the row that reported the bug still ends on the client's line.**
12. **Log the release in the user's own work log, when their instructions name one** (a daily huddle sheet, a standup doc, a timesheet). A production deploy is the moment that log's line changes: today's row for the project gets the shipped outcome, ticked, in the log's own conventions, and a plan row the deploy just made true (a later "X to production" row) is rewritten or ticked. The release card and the team post feel like the whole record, and the user's personal log is the one place nobody else updates. Read the instruction's own location and conventions before writing, and report it in the Ship Summary's Work log row. **Tell: your Output has a Cards row and no Work log row, and the user's instructions name a daily log.**

## Output

The release note is its own labelled fenced block after the Ship Summary table, distinct from it: a release note buried in a table reads as one the user can't copy. The inner fence is the artifact. **Operator commentary (open items, offers, next steps) goes ABOVE the fence, never below it.** Caveats for Chat readers ("Note: bulk export still deferred") go inside the fence.

````
## Decisions

1️⃣ [what's true now]
   [the question]

(only when the ship left something the user has to decide; shape and thresholds in `../_shared/references/decision-first-output.md`)

## Ship Summary

| Step | Status | Details |
|------|--------|---------|
| Commit | ✅ | [repos committed, commit hashes] |
| Push | ✅ | [repos pushed] |
| CI/CD | ✅ | [deploy status per repo] |
| Prod Verify | ✅ | [what you observed on the server: HEAD match, or the shipped behavior itself] |
| Release Note | ✅ | [posted to <space> at <time>, or why not posted]; text below |
| Images | ✅ | [captures sent as a thread reply, each opened first; or the ones dropped and why; or "none rendered this session"] |
| Cards | ✅ | [cards flipped to done, from `Task:` lines; omit the row when the range named none] |
| Client rows | ✅ | [each row answered: sheet, row, the line written, the status it moved to; omit when the work came from no shared sheet] |
| Work log | ✅ | [the user's daily log row written and ticked, and plan rows the deploy made true; omit only when their instructions name no log] |

[Operator commentary: open items, caveats, offers, status the user should know. Omit if none. The ONLY place commentary goes; a choice the user must make goes in Decisions above, since anything parked here gets read past.]

**Release note (posted to <space> at <time>, shown for reference; nothing to send):**

```
[gchat-format output: Google Chat syntax, changes-only]
```
````

The fence's label states what the user still has to do with it, because it is the last line they read. When the note was posted (Step 5 item 8), the label says where and when, so it reads as a record. Only a note that went to the clipboard, or was held back, keeps the copy label ("copy everything inside the fence below, nothing outside it"). A sent note under a copy label reads as still to post, and gets sent twice. **Tell: your Release Note row says posted, and the label above the fence says copy.**

Nothing follows the release-note fence's closing backticks.

## References

📖 **Failure modes & recovery:**
- `references/orphaned-commits.md`: orphaning and recovery
- `references/step4-polling-and-sequencing.md`: Step 4a polling, sequencing sweep, standing manual steps
- `references/ci-provider-polling.md`: CI status per provider, with traps (empty list, retry id reuse)
- `references/ship-deploy-verification.md`: destination recipes per artifact type, host aliases, release captures
- `references/merge-conflict-resolution.md`: changelog and living-doc conflicts, cherry-pick conflicts
- `references/promotion-worktree.md`: promoting onto a deploy branch from a shared checkout
- `references/ship-incidents.md`: the dated incidents behind these rules
