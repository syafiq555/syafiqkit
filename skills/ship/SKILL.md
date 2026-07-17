---
name: ship
description: Ship code to production — commit, changelog, push, verify CI/CD deploy, generate release note. Use when the user says "ship", "ship it", "deploy", "push to prod", "send it", or after /done is complete and code is ready to go live. Works with single repos and multi-repo setups (root + sub-repos). Assumes /done was already run.
---

# Ship

End-to-end shipping workflow: commit → changelog → push → verify deploy → release note.

## Prerequisites

- `/done` has already been run (code reviewed, simplified, task docs updated)
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

2. ⚠️ **SHIP OVERRIDE on the staleness gate** — `/commit`'s gate hunts "pending / not yet pushed" language and demands you eliminate it before committing. Under `/ship`, do NOT resolve it by writing the **pre-deploy** state: a deploy follows in minutes, so "not yet deployed" / "🚢 in flight" is guaranteed wrong by the time anyone reads it and costs a second commit to undo. Leave deploy-state lines alone; **Step 4 writes them once, from the verified outcome.** Fix only genuinely-stale non-deploy content here — even right after catching a *false* "deployed" claim, correct it straight to the outcome, never to the transient midpoint.

### Step 3: Push

⚠️ **`git push` on the current branch is NOT the deploy — establish the deploy branch FIRST.** Many projects promote through a chain (`master → staging → production`), often with a manual approval gate, and the branch names differ per repo (one repo's `master` can BE its staging). Pushing the branch you're on can deploy nothing, or deploy to staging while you report "shipped to production" — and CI goes green either way, so nothing catches it. Read the project's `CLAUDE.md`/`CLAUDE.local.md` for the deploy chain, then confirm against the repo: `git rev-list --count origin/<deploy-branch>..HEAD` tells you what the target branch is actually missing.

Per repo, before pushing anything:
1. **Which branch deploys to the target env?** If it isn't the current one, the ship is a forward-merge chain (`git merge <src> --no-edit` — a real merge commit; `--ff-only` fails on diverged branches), not a push.
2. **Is there a gate?** A manual CI approval means the push only *queues* the deploy.
3. **What rides along?** Read the DIFF, never the commit subjects — `git diff --name-only <deploy-branch>..HEAD`. Commit messages routinely understate blast radius: a `chore:`/`docs:` commit can carry a live behavior change (a payout schedule, a feature flag, a cron cadence) that nothing in its subject line hints at, and no gate catches it. Scan the file list for anything with a runtime surface (`config/`, `Kernel.php`, `.env.example`, migrations) and read those hunks. Migrations especially are a one-way door and belong in the user's decision, not a silent side effect. **Anything that moves money, mail, or user-visible behavior → surface it and confirm before merging**, even when it was already committed and reviewed.

If the chain isn't documented and you can't infer it, **ask** — pushing to a deploy branch is outward-facing and hard to reverse.

⚠️ **NEVER `git reset --hard` a branch that has commits you haven't pushed — including the one you just committed on.** Projects commonly carry a "`reset --hard origin/<branch>` before any merge" rule (local branches lag). It's correct for a **stale branch you're merging INTO** but **destroys work** on the branch you're merging **FROM**: the commit is orphaned (reachable from no branch), `git status` goes clean, and `git stash` can't save it — the work was already committed, nothing is in the working tree.

**Prevention** — before any `reset --hard`, prove the branch has nothing unpushed:
```bash
git log --oneline @{u}..HEAD    # MUST be empty before you reset this branch
```
Not empty → don't reset it. If you just committed here, you don't need the reset at all: `git checkout <target> && git merge <this-branch> --no-edit` is the whole chain.

**Detection** (cheap, run it anyway — the reset may come from a project script):
```bash
SHA=$(git rev-parse HEAD)    # BEFORE any checkout/reset
git branch --contains "$SHA" # AFTER — must be non-empty. Empty = orphaned.
```
Orphaned is recoverable if noticed — the object still exists, `git cherry-pick $SHA` onto the right branch. Tells you it's already lost: `git status` unexpectedly clean right after editing files, or a `grep` for content just written returning zero.

Then:
1. Check `gh auth status` — if wrong account, read project's `CLAUDE.local.md` for the correct GitHub user and switch (`gh` auth is independent of the SSH remote alias, so a personal `git@github-personal:...` remote with `gh` active on a work account would hit the wrong account via the API; `gh auth switch --user <personal-user>` first, no switch needed for a plain `github.com` work repo)
2. Push each repo that has commits ahead of remote:

```bash
git push
```

### Step 4: Verify CI/CD Deploy

⚠️ **Check the project's `CLAUDE.local.md` for a documented non-CI deploy path (rsync hotfix, manual sync, etc.) before assuming CI is the only route.** Some projects fast-track backend-only changes (no migration/deps/frontend touch) around CI entirely — polling `gh run list` for a deploy that was never queued will hang or false-negative. If such a path exists and applies to this change, follow it instead of Steps 4.1–4.2 (still do the prod-HEAD-mismatch style verification appropriate to that path, e.g. grep the deployed file/config on the server).

⚠️ **No deploy is a gate — not even the ship's own.** Kick off the CI/deploy check (`gh run watch`/a Monitor/a polling loop) and proceed straight to Step 5 — a deploy running is not a reason to sit idle, and this applies to every deploy that comes up during the ship (the primary one, a follow-up mid-ship fix, anything else). Come back to finish 4.1–4.2 (and the task-doc write in 4.5) once the background check resolves, whether before or after Step 5. Only block synchronously if the very next step genuinely needs that deploy's specific output.

Otherwise, verify production matches once the deploy resolves:

1. **Check CI status** — first establish **which CI provider** this repo uses (`CLAUDE.md`/`CLAUDE.local.md`, or look for `.circleci/`, `.github/workflows/`, `.gitlab-ci.yml`). ⚠️ `gh run list` is **blind to any non-GitHub-Actions provider** — against a CircleCI/GitLab repo it returns an **empty list and exit 0**, which reads exactly like "no deploy was queued" and invites you to re-push or declare the ship broken. Two repos in one session can differ (one GitHub Actions, one CircleCI). Poll the provider the repo actually uses in the background, and confirm the pipeline is building **your** SHA — not just that *a* pipeline exists.
   - GitHub Actions: `gh run list --limit 1 --json status,conclusion,headSha`
   - Anything else: use that provider's API/CLI per the project's `CLAUDE.local.md` (it will document the token, project slug, and any manual approval gate).

2. **Verify production HEAD** — read the project's `CLAUDE.local.md` for the production server name and deploy path, then:

```bash
remote <prod-server> "cd <deploy-path>/<repo> && git log --oneline -1"
```

Skip this step if `remote` CLI is not configured or no production server is documented.

⚠️ **The deploy target is often NOT a git repo** (rsync/CI-sync deploys land plain files), so `git log` there errors or misleads — and a green CI run proves only that the *pipeline* ran, never that YOUR change is on disk. Verify the **behavior you shipped**, not the commit: grep the changed file on the server for the line you added, and resolve config/env-driven changes through the app's own bootstrap (which also proves the config cache rebuilt).

⚠️ **Any grep returning `0` needs a positive control, and the control must actually run.** `0` reads identically whether the deploy broke or the search string was never going to match (a closure-dispatched job never prints its class name in a scheduler listing; a bundler hoists a shared string out of the chunk you searched) — re-run unfiltered first. Then chain the probes with `;`, never `&&`: `grep -c` exits 1 on zero matches, so `grep -c mystring file && grep -c CONTROL file` short-circuits right when the control was needed, leaving a bare uncontrolled `0` that reads as a clean negative. Separate every probe with `;` and confirm all lines printed — a missing control IS the bug.

3. If CI failed → report error, suggest `gh run rerun <id> --failed`
4. If prod HEAD doesn't match → report mismatch
5. **Write the verified outcome to the task doc** — the write Step 2 deferred. Flip `Status:` to live, tick the deploy checkbox in `## Next Steps`, and record what you actually observed (the command output, not "deployed ✅"). Then grep the doc for every restatement of the old state — it survives in the LLM-CONTEXT header, Quick Start, Task Status table and Last Session, and fixing one leaves three lying. Run that grep with a positive control that must hit.

### Step 5: Release Note

Generate a Google Chat-formatted release note. ⚠️ **Frame from the task doc, not the changelog.** The CHANGELOG lists changes per-item and reads each as a self-contained win — summarizing from it alone over-claims (e.g. "cleared all alerts" when the task doc's `Status:` is 🟡 partially-done with deferred work). The bigger picture — what the effort *was*, what's actually done vs deferred — lives in `tasks/**/current.md`.

1. Read the shipped work's `tasks/**/current.md` (use `read-summary`) for the framing: what the effort accomplished, and its real `Status:` (done vs mitigated vs deferred).
2. Read the latest `CHANGELOG.md` entry for the itemized change list.
3. **Lead with the accomplishment, not caveats.** Headline = what was done ("upgraded dependencies + hardened security"). Deferred/partial work is a short closing note, not a co-headline — don't bury the win under an alarming caveat section.
4. ⚠️ **Pass the CHANGELOG entry's actual text into `gchat-format` — never paraphrase it from memory first.** Summarizing the read before formatting is where items silently drop or get replaced with generic one-liners the changelog never said; the skill's own condense step already does the WHAT-not-HOW trim, so feeding it raw text is both less work and more faithful. Before sending, count the entry's actual shipped items against the output bullets — a mismatch means an item got lost, not "cleanly merged." ⚠️ Count against whatever structure the entry really uses (Keep-a-Changelog `### Added`/`### Changed`/`### Fixed` headings, or a bare `## <version>` + prose bullets — this repo's own CHANGELOG is the latter). Hardcoding the heading names makes the check silently unrunnable on repos that don't use them, and a check that cannot fire reads exactly like a check that passed.
5. Format using the `gchat-format` skill (convert to Google Chat syntax).
6. Copy to clipboard.
7. ⚠️ **Render the formatted result as its own labelled, fenced block — after the Ship Summary table, never inline within it.** A release note that only shows up as a table row reads as buried, not as a standalone artifact the user can copy — see the Output template below.
8. ⚠️ **The fenced block is the LAST element of the output. Nothing follows it — ever.** All *operator* commentary (open items, next-decisions, offers like "I can trigger the migration") goes **above** the label, before the fence. Appending it below is silently unreadable: item 3 makes the note's own last line a `Note: …` caveat, so trailing text reads as more note — the user can't see where the copy-paste stops. Do not "fix" this by stripping caveats from the note; the two classes have different audiences:

| Caveat class | Example | Goes |
|---|---|---|
| **Audience** — the Chat readers need it | "Note: bulk export still deferred." | **Inside** the fence (item 3) |
| **Operator** — addressed to the user | "One open item (not blocking)…", "I can flip the flag if you want" | **Above** the label |

## Output

````
## Ship Summary

| Step | Status | Details |
|------|--------|---------|
| Commit | ✅ | [repos committed, commit hashes] |
| Push | ✅ | [repos pushed] |
| CI/CD | ✅ | [deploy status per repo] |
| Prod Verify | ✅ | [what you observed on the server — HEAD match, or the shipped behavior itself] |
| Release Note | ✅ | See below |

[Operator commentary — open items, caveats for the user, offers, next decisions. Omit if none. This is the ONLY place it goes.]

**Release note — copy everything inside the fence below, nothing outside it:**

```
[gchat-format output — Google Chat syntax, changes-only]
```
````

⚠️ The inner fence is the artifact. The output ends at its closing backticks — never write another word after them.

## Edge Cases

| Situation | Action |
|-----------|--------|
| Only root repo has changes (docs only) | Push root only, skip CI verify |
| No `remote` CLI or no prod server in CLAUDE.local.md | Skip prod verification step |
| No `CHANGELOG.md` | Skip changelog gate and release note |
| Repo is "internal" (plugin, script, tooling) | Never skip the release note — internal repos ship too. Only skip is `No CHANGELOG.md` |
| Sub-repo already pushed but root not | Push only unpushed repos |
| Single repo (no sub-repos) | Works as-is — just one repo to process |
