---
name: ship
description: Ship code to production — commit, changelog, push, verify CI/CD deploy, generate release note, close the tracker cards the shipped commits name. Use when the user says "ship", "ship it", "deploy", "push to prod", "send it", or after /done is complete and code is ready to go live. Works with single repos and multi-repo setups (root + sub-repos). Assumes /done (or /quick-done for a small session) was already run.
---

# Ship

End-to-end shipping workflow: commit → changelog → push → verify deploy → release note.

Run the whole chain in one turn. A sub-skill's closing summary or report looks like an ending and isn't one; the chain is done when this skill's own Output block is written.

**A deploy made after the Output is a new ship.** A follow-up fix pushed to the deploy branch in the same session owes Steps 4b and 5 again: the CHANGELOG line, the task doc's verified state, the tracker entry, the client's sheet row when the fix answers one (a row told "live on staging" is answered again once production is verified), and the team post (edit the earlier post when it only adds to it, so nobody is notified twice).
Resuming mid-chain after a compaction: answer which steps ran from evidence (the commit, the push, the release note each step writes), not the summary. 📖 `../_shared/references/one-turn-chain.md` for where the stop lands.

## Prerequisites

**Code must have been reviewed.** `/done` runs the review; `/quick-done` leaves code unread, so say so and get a review.

**`/done` must have reached its Output, not only its review.** Before Step 1, find the last `/done` Session table written in this conversation after the code; if there is none, finish `/done`'s Steps 3 to 5 first. Code built from that `/done`'s own closing answers needs another `/done`. 📖 `references/ship-incidents.md` (18/11/2026, 27/11/2026).
**Review covers only what reviewers saw.** Code written after they returned (fixes to findings, a new redirect, one more screen) reads as covered when it isn't, and the peer-commit rule below never catches it. Before the push, run `git diff --stat <last-reviewed-SHA>..HEAD -- <code paths>` and send anything non-trivial to a reviewer (product too, where users see it). 📖 `references/ship-incidents.md` (2026-11-10). **Tell: a summary line says the last fixes were "checked with tests" or "not agent-reviewed", and you are about to push.**

**"Ship everything" on a shared checkout pushes code nobody here reviewed.** Neither git author nor `Claude-Session:` trailer shows who reviewed a peer's commit. Dispatch a reviewer (product too, where users see it) on the range's commits this session neither wrote nor saw through `/done`, before the push. Naming the gap in the Ship Summary is not the review. 📖 `references/ship-incidents.md` (2026-10-10). **Tell: your Ship Summary says some code wasn't reviewed in this session, and no reviewer ran before the push.**

## Workflow

Run in sequence, except Step 4a's kickoff, which backgrounds and doesn't block Step 5; finish Step 4b when it resolves. Stop on errors and report.

**Key principle: a ship is complete when the user-visible change is live at the destination, not when source is pushed or CI goes green.** Verify each artifact where it lives (git, registry, server, DB), not from the exit code or the pipeline's report.

### Step 1: Detect Repos

Find repos with uncommitted changes: `git status --short` in the root and each sub-repo.

Commit only repos with changes, but check every repo for unpushed commits (`git log origin/main..HEAD`), clean or not: a sub-repo committed earlier still needs its push, and Step 3 pushes exactly those repos.

### Step 2: Commit Each Repo

**Run `/commit`; it owns this step** (`../commit/SKILL.md`). Commit order: sub-repos first, then root.

Two rules ON TOP of `/commit`, specific to ship:

1. **Version-bump gate (plugin/package repos):** bump every file carrying the version before staging. `grep -rn '"version"' <manifest-dir>` finds the secondary fields (`plugins[0].version` drifts silently when only the primary moves; the repo's `CLAUDE.md#version-bumping`).

   **Then print every version the repo declares and read them as a set; they must all match the CHANGELOG's top heading.** A printed list is the check, not recall. Take the highest value only once its CHANGELOG entry exists (📖 `references/ship-step-details.md` § Step 2: Version heading order; `references/ship-incidents.md`).

2. **Task-doc deploy state is verified output from Step 4, not input to it.** Write no deploy-state lines now; Step 4b writes what lands. Fix other stale content in the doc.

**When `/commit` returns, go straight to Step 3 in this same turn.** Committed and unpushed is the worst place to stop; a reply that says "next is the push" has already stopped.

### Step 3: Push

A push sends the whole branch, not just today's commit.

**Deploy target:** `CLAUDE.md`/`CLAUDE.local.md` says which branch deploys where. Targets differ by project, and CI goes green either way, so the wrong branch is silent.

⚠️ **Run `git status --short` before any checkout of the deploy branch. Where the tree holds someone else's work, check nothing out and never stash a peer's work.** Rebuild only your SHAs on the deploy branch's tip (📖 `references/promotion-worktree.md` § First choice). The diff against `origin/<deploy-branch>` must list only your files.

**A push by SHA leaves the checked-out branch behind, so follow it with `<this skill's base directory>/../commit/scripts/sync-push.sh --no-push`** when the pushed commit lands on the branch you're on, or the next push reads ahead and behind. 📖 `references/promotion-worktree.md` (recipes, next-leg merge rule); `references/ship-step-details.md` § Step 3: sync-push exit codes.

**What's riding along:** read the hunks of `git diff --name-only <deploy-branch>..HEAD`, not the subjects: a `chore:` or `docs:` commit can hide live behavior. Anything that moves money, mail or user-visible state is the user's decision before merging, not a line in the summary after. If uncertain, ask.

**Backlog and authorship:** `git log origin/<deploy-branch>..HEAD` lists unpushed commits. Surface their count and authors in the Ship Summary; another author's work that rides along is the user's call (📖 `references/ship-step-details.md` § Step 3: Backlog and authorship). Unreviewed work follows the Prerequisites review gate, findings fixed first.

**If conflicts occur:** merge the CHANGELOG by section, never by hunk; keep both sides of every other file, since picking one drops a colleague's work. 📖 `references/merge-conflict-resolution.md` (changelog, entry count, cherry-picks).

**Safety: don't orphan commits.** Before any reset, `git log --oneline @{u}..HEAD` must be empty; if not, merge directly (📖 `references/orphaned-commits.md`).

**Check GitHub auth:** `gh auth status`; on the wrong account, prefix the `gh` calls with `GH_TOKEN=$(gh auth token --user <user>)` rather than switching the shared account (`gh` auth is independent of the SSH remote alias; 📖 `references/ship-step-details.md` § Step 3: GitHub account).

Then `git push`. If `git status -sb` shows `[behind N]` or the push is rejected as non-fast-forward, run `<this skill's base directory>/../commit/scripts/sync-push.sh` from the repo root instead of pulling.

### Step 4a: Kick Off CI/Deploy

**Before backgrounding, three checks decide whether polling tells you anything:** (1) is CI the route (polling a deploy never queued hangs or reports a false negative); (2) is there an **irreversible ordering constraint**, such as a migration before the code reading it or a flag flipped in a fixed order (a missed one cannot be repaired afterwards); (3) does a task doc record a **standing manual step or go-live obligation** the diff doesn't touch (📖 `references/ship-incidents.md`, Step 4a).

**Once those pass, queue the deploy in the background** and go to Step 5 while it runs. A docs-only push (root repo only) skips CI verify. Match the run to *your* commit's SHA: a poll that reads the newest run exits green on its first tick while your deploy is still queued. Hold further pushes to that branch (a `/done` docs commit included) until it resolves, or fold it into the same push.

📖 `references/step4-polling-and-sequencing.md`, read before starting the poll in 4a (§ Concurrency cancels the run you verify).

### Step 4b: Verify at Destination

**Once CI/deploy resolves, verify the artifact is live** (the Key principle).

**If CI failed, read the failed job's log (`gh run view <id> --log-failed`) before saying anything about it.** Only a fault outside the change gets a rerun, named in the report (a runner fault, a network blip, a flaky test in untouched code: the job's earlier runs on this branch pass and fail with no code change). Anything the change caused is fixed in this run (a rerun fails the same way): the fix passes the Prerequisites review rule and `/commit`, then Step 4a runs again on its own SHA and Step 5 is re-read against the fixed payload (a posted release note is edited, not reposted). A second failure on the same cause stops the loop: report it with the log. A deploy-step SSH timeout goes to `ci-ssh-deploy-timeout`; a job refused for billing gets no rerun. A fix on the server itself: 📖 `references/ship-step-details.md` § Step 4b: Server-side fixes; `references/ship-incidents.md` § CI failure left at "suggest a rerun". **Tell: your reply suggests a rerun and the failed log is unread.**

**Verify by artifact type** (recipes and traps: 📖 `references/ship-deploy-verification.md`). Skip the code check when no prod server is documented; the workflow file outranks an alias naming another host. A seed runs AFTER the code lands: run before it, it executes the old file and changes nothing.
- **Code:** `remote <prod-server> "cd <deploy-path>/<repo> && git log --oneline -1"` matches the pushed SHA.
- **Schema:** ask the DB (migration status, a query for the new column), since migrations can run apart from code.
- **Provider switched from test to live** (checked on the production deploy): until the live settings are verified, Prod Verify reads ⚠️ not verified and Step 5 items 8 to 12 are held (📖 `references/ship-step-details.md` § Step 5 item 8: Held note), so nobody is told payments are live. Where you hold live access, show the user the exact endpoint, events and settings, and create them only on their yes. Spotting and creating the settings: 📖 `references/ship-step-details.md` § Step 4b: Provider switched from test to live; `references/ship-incidents.md` § Live webhook missing after a go-live.

**Update the task doc with the verified outcome:** flip `Status:`, tick the deploy box, record observed command output (not "deployed ✅"), then grep for the old state (it survives in the LLM-CONTEXT header, Quick Start, Task Status and Last Session) and fix each hit with a positive grep control.

If prod HEAD doesn't match or behavior is wrong: report the mismatch.

**A personal side project on an sslip.io host or raw IP gets `side-domain` in this ship, once Prod Verify passes** (📖 `references/ship-step-details.md` § Step 4b: Side-domain).
### Step 5: Release Note

Frame the note from the task doc (`tasks/**/current.md`), not the changelog, which lists wins one by one and over-claims when work is partial. Generate a Google Chat-formatted note. Repos with no `CHANGELOG.md` follow 📖 `references/ship-step-details.md` § Step 5: No-changelog repos.

**A docs-only push still owes the team post when the team acts on what it carries** (📖 `references/ship-step-details.md` § Step 5: Docs-only post).
Scope the note to everything the push carried, including production changes made outside git. A later ship in the same session rebuilds that one note to include its own version rather than replacing it, unless the user says the earlier note already went out. The last-deployed version comes from `git log --oneline <pre-push-SHA>..<pushed-SHA> -- <version-file>`, not a CHANGELOG heading this session just edited. A note reaching back past this push also falls under the Prerequisites review gate (📖 `references/ship-step-details.md` § Step 5: Release-note scope; `references/ship-incidents.md` 27/11/2026).

1. Read `tasks/**/current.md` (`read-summary`) for what's done, deferred, and what the effort *was*.
2. Read the CHANGELOG entries in scope for the list.
3. **Lead with accomplishment, not caveats.** Deferred work is a closing note; a hand-off to a named person says how in one line, or where the steps are. Regroup by feature: what users could not do before, what they can now.
4. **Pass raw CHANGELOG text to gchat-format; don't paraphrase.** Count shipped items against the output bullets; a mismatch means something dropped. Cross-check `git diff --stat <last-deployed>..<HEAD>` for user-facing changes (copy, status labels, templates, buttons) a mid-work changelog missed, add them, then format.
5. **If a tracker is documented, open its most recent entry before formatting.** Its length, structure and voice beat any default; titles drift, so list the newest few by date and read the top one, plus the one before it when they differ. 📖 `references/ship-incidents.md` (stale tracker format).
6. Format with the `gchat-format` skill, invoked even when it ran earlier in the session (📖 `references/ship-incidents.md`, 13/11/2026), unless the project's docs spell out a plain-text format for that destination: then draft to that, and the captures in item 8 are still owed (📖 `references/ship-step-details.md` § Step 5 item 6). Then copy to the clipboard (`pbcopy`). **Tell: the note was drafted without a `Skill` call, and the project doc names bold or bullets, or no format at all.**
7. **When the work answers an ask someone posted in Chat, reply to that ask first.** Search the recent spaces for the pasted text before choosing a destination. Answer it where it was asked, in the sender's voice through `casual-message`; the project's release space follows (📖 `references/ship-incidents.md`, 19/11/2026).8. **Where the team reads release notes in a Chat space, the clipboard is not delivery.** A ship that switched a provider to live holds items 8 to 12 until Step 4b's check passes (§ Held note). When the project docs name the space (or an earlier post sits in it), preview with the Chat send tool in this run and show its line and full text; its permission prompt is the one confirmation, so no `AskUserQuestion` before it. **A note about a changed screen then gets its captures as a thread reply under it, in the same run**: only captures holding seeded demo or test data, each opened first, the kept and dropped named above the fence, previewed like the post. Never render a capture at ship time to fill the gap (📖 `references/ship-deploy-verification.md` § Release Captures). **Tell: the post is sent, the change is visible, and no thread reply carries a capture.** Docs that name no space prove nothing (📖 `references/ship-step-details.md` § Step 5 item 8; incident: 📖 `references/ship-incidents.md` § Release note only on the clipboard).
9. If the project documents an issue tracker (`CLAUDE.md`/`CLAUDE.local.md`), post there in the same run, updating the entry for this release rather than duplicating it (multi-repo needs one entry per repo). A posted release-note card is a record: set it to the list's done status and read it back; a project-scoped tracker MCP means handing the post to a session in that repo (📖 `references/ship-step-details.md` § Step 5 item 9; `references/ship-incidents.md` 25/11/2026).
10. **Close the tracker cards this release finished, when the shipped commits name any.** Read `git log <pre-push-SHA>..<pushed-SHA> --format=%B` for `Task:` lines; most ships have none. Flip each card only once Prod Verify passed (a card closed on a staging-only deploy tells the requester it is live), read its status back, and leave a parent or project card open when only one child shipped. A card named only in conversation is invisible here.
11. **Answer the sheet row this ship fixed.** When the user asked to fix a client tracker row or a tester's Fail, only that row reaches the reporter; the post and card reach the team. Once the deploy is verified where it landed, re-read the row (a peer or the client may have written since), add one line on what they can now do and where it is live (staging only, or production), and set the status. Append the reply with `cell_append_line` so other people's colours survive; the status cell takes a plain value write. Never write that a setting was flipped or something was built. Write nothing when the row was only context, the fix is partial, someone wrote after the fix, the line would promise something the user did not choose, or the sheet has no documented rule (📖 `references/ship-step-details.md` § Step 5 item 11); the draft then goes in Decisions and the row reads "not written" in Client rows. **Tell: the release note is posted and the row that reported the bug still ends on the client's line.**
12. **Log the release in the user's own work log, when their instructions name one**. Today's row gets the shipped outcome, ticked; a plan row the deploy made true is rewritten or ticked. (📖 `references/ship-step-details.md` § Step 5 item 12). **Tell: your Output has a Cards row and no Work log row, and the user's instructions name a daily log.**

## Output

The release note is its own labelled fenced block after the table: buried in one, it reads as uncopyable. **Operator commentary (open items, offers, next steps) goes ABOVE the fence, never below it.** Caveats for Chat readers go inside the fence.

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
| Prod Verify | ✅ | [what you observed on the server: HEAD match, or the shipped behavior itself; ⚠️ not verified with what is missing, e.g. a live webhook the user still has to create] |
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

The fence's label states what the user still has to do with it, because it is the last line they read. When the note was posted (Step 5 item 8), the label says where and when, so it reads as a record. Only a note that went to the clipboard, or was held back, keeps the copy label ("copy everything inside the fence below, nothing outside it"). **Tell: your Release Note row says posted, and the label above the fence says copy.**

Nothing follows the release-note fence's closing backticks.

## References

📖 **Failure modes & recovery:**
- `references/orphaned-commits.md`: recovery
- `references/step4-polling-and-sequencing.md`: Step 4a polling and sequencing
- `references/ci-provider-polling.md`: CI provider traps
- `references/ship-deploy-verification.md`: deploy recipes, aliases, captures
- `references/merge-conflict-resolution.md`: conflicts
- `references/promotion-worktree.md`: promoting from a shared checkout
- `references/ship-step-details.md`: detail behind one-line rules
- `references/ship-incidents.md`: dated incidents
