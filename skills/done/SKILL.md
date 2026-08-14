---
name: done
description: Post-task cleanup - simplify code, review changes, update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize".
---

# Post-Task Workflow

Execute all steps in sequence. The skill is designed to run steps in a single turn without pausing — if you find yourself naming a remaining step rather than invoking it, that's a pause.

**`run_in_background: false` is not a guarantee the call blocks** — [subagents run in the background by default since v2.1.198](https://code.claude.com/docs/en/sub-agents), and [#69691](https://github.com/anthropics/claude-code/issues/69691) reports `false` is ignored in top-level sessions. Pass it anyway to express intent, but expect results as `<task-notification>`s regardless — see Step 1 for what that means in practice.

**User args**: If the user passed instructions with `/done` (e.g., "make sure this works for X"), address those FIRST before proceeding with the standard steps. The user's instructions override defaults. Record what you did about them in the **User Instructions** table of the Output. If no args were passed, omit that table.

## Mode selection (decide first)

Choose a mode that reflects what the session changed, then apply its step cascade below. Mode selection cascades consequences across all downstream steps.

**Docs-only mode** when the diff is entirely documentation — task docs, CLAUDE.md, README, `skills/*/SKILL.md`, `commands/*.md`, `.claude/agents/*.md`, `references/`, and nothing else (`git status --short` shows no `.php`/`.ts`/`.tsx`/etc.). This mode is **additive, not subtractive** — it runs the full agent trio like full mode AND adds a docs-specific check; the agents are not skipped for prose. A doc can still hide a defect the agents catch: instruction markdown a future session *executes* has logic (a gate whose inputs no step computes, a threshold ambiguous against two numbers, an ordering defect *between* steps), and even a plain README can describe a workflow wrong — a referential check alone misses both.
- Step 1: **run all three agents (full-mode counts + partition)** AND run a **referential-integrity check** yourself: no broken `tasks/**/current.md` or `CLAUDE.md` links, renamed/deleted paths fully reconciled (0 stale refs), anchors unique, `> 📖` pointers resolve, and no edited table has a row/callout wedged mid-table (a blank line or prose between `|`-rows splits one GFM table into two).
- Steps 2-5 as normal (temp-artifact scan rarely applies to docs; knowledge capture + task-doc reconciliation still run). **Step 5's Gate B runs in every mode** — a docs-only diff is exactly where a hand-edited skill file hides.
- Output: fill Simplify/Review/Product from the agent runs as in full mode; ALSO report the referential-integrity result (append it to the Review row).
- **The partition must cover the whole SESSION's work, not just the uncommitted diff.** Code you already committed this session was never agent-reviewed, and the working tree may show only `.md` changes — so count files from `git show --stat <this-session's commit>` + the uncommitted diff and partition all of them. The tell: a commit you authored this session in `git log`, but `git status --short` lists only docs.

**Infra-only mode** when the diff is **entirely deploy/build/CI plumbing** and no application code — CI workflows (`.github/workflows/*.yml`, `.circleci/`), `docker-compose*.yml`/`Dockerfile`, build config (`next.config.*`, `vite.config.*`), nginx/env config. Infra needs *only* the reviewer, and needs it badly because infra fails silently — broken deploy steps exit 0 while tests pass.
- Step 1: **reviewer ONLY.** Skip the simplifier (no logic to DRY) and the product reviewer (no user journey). Size-independent — the trigger is file KIND, not count. Prompt the reviewer adversarially: give it the change's PURPOSE, what it must not break, ask for empirical verification. Two call sites of the same command can need opposite treatments.
- Steps 2-5 as normal. Output: mark Simplify/Product as ➖ "infra-only".
- **Exception — a compose/env change that FLIPS A FEATURE FLAG on is NOT infra-only**; it exposes a user-facing capability → run the product reviewer.

**Ops-only mode** when the session changed a **running system rather than the repo** — provisioning/seeding an environment, a data migration or backfill, a deploy or config flip applied out-of-band — and produced **no repo diff and no session commit** in any repo.

- Step 1: **skip all three code agents** — there is no repo code to review. Do NOT substitute the docs-only integrity check either; nothing was edited yet at that point.
- **The state you changed is the deliverable, so verification is a READ-BACK, not an agent.** Query the live system for each value the session claimed to set and report what it returned — an action's own return value is not evidence. This replaces Step 1's Output row.
- Steps 2-5 as normal, and **Step 4 is the whole point**: a live-system change leaves no trace in `git log`, so the task doc is the only place it exists. Record what changed, in which environment, and anything synthetic/temporary that a later reader must not mistake for real.
- Output: mark Simplify/Review/Product as ➖ "ops-only, no repo diff"; report the read-back on the Review row.

**Full mode** (default) for everything else — multi-file features, multi-domain sessions, anything with external inputs (WhatsApp/ClickUp pastes) that may need new doc stubs. When in doubt, full.

**An empty `git status --short` doesn't by itself select a no-code mode.** It means three different things: work may be already committed this session (full mode, count off the base commit — recovery command in Step 1's Agent-count section), may be another writer's tree you don't own (see the ownership section below), or may be a session that genuinely never touched the repo (ops-only). Name which one applies before treating "nothing to review" as the answer.

**A git command that *errors* is a fourth state, and it selects no mode either.** In a project that was never `git init`ed, `git status --short` returns `fatal: not a git repository` rather than empty. A repo with no first commit yet is the sneakier version: `git status` succeeds and reads empty, then every `git diff HEAD` in the steps below errors on the missing revision — so the failure surfaces at the Exit gate rather than here. Either way the steps that establish what changed, who owns it, or whether a write landed need substitutes. **Ops-only is the trap here**: it looks like the closest fit ("no repo diff") and is wrong, because it skips all three agents on the grounds there's no repo code to review. An unversioned project still has code. Run **full mode** and substitute only the mechanisms — mtime off session start for the changed-file list, re-read/grep for write verification — per `../_shared/references/verifying-a-write-landed.md`, which owns the substitution table and the ownership caveat that comes with it.


## Step 1: Simplify + Review + Product Review (parallel)

The three roles see the diff through different lenses:
- **Simplifier** — is the code *clean*? (duplication, readability, consistency)
- **Reviewer** — is the code *correct*? (bugs, security, logic errors, conventions)
- **Product reviewer** — is the *feature* complete and valuable? (missing journeys, dead-end flows, UX/business gaps — the class of miss a line-level diff structurally cannot catch). Runs in full mode only, and only if a project `.claude/agents/product-reviewer.md` exists (skip silently if absent).

### Ownership (read-at-start, not read-at-finish)

Before running Globs or spawning agents, establish which files belong to this session by diff CONTENT, not by `git status` plane (`../_shared/references/diff-ownership.md`). A clean "no" is the easy case. What's missed is "partly" — a background agent still running, `git status` showing files never touched (parallel session), a tree that already carried work before this session, or two sessions editing the same file so the content is mixed.

When you don't own the whole diff: scope every agent to **your** files only and name contested paths off-limits. A reviewer handed another session's uncommitted file will "fix" it. For skills in Steps 3-4, pass a scoped read-only verification arg instead of invoking bare. On commit, use an explicit pathspec when the split is file-level; when the same file carries both sessions' work, stop and let the user decide.

A file partition doesn't scope repo-wide commands. Ban these verbs in every agent prompt: `stash`, `checkout -- .`, `reset`, `clean`, `restore`, `commit`, `push` — a review agent with edit tools runs any of them, and the first five destroy unrecoverable work.

Mismatch between role and `subagent_type` goes undetected — match the prompt's content to the subagent_type you're calling.

Once the partition is decided, move to Emission shape below and emit every agent from the partition in the single message.

### Emission shape (non-negotiable — do next)

All applicable agents go in ONE assistant message. No prose before the `Agent` calls — no count, no plan, no "spawning N agents now". Open with the first call and emit the rest back-to-back. Narration ends the message early; without it, there's nothing to stop after the first call. A serialized batch still completes, but an abandoned one does not.

### Agents to run

**Check for project agents first:**
```
Glob: .claude/agents/code-simplifier.md
Glob: .claude/agents/code-reviewer.md
Glob: .claude/agents/product-reviewer.md
```

| Agent | Project agent found? | Fallback subagent_type |
|-------|---------------------|------------------------|
| Simplifier | `subagent_type: "code-simplifier"` | `"code-simplifier:code-simplifier"` |
| Reviewer | `subagent_type: "code-reviewer"` | `"feature-dev:code-reviewer"` |
| Product reviewer (full mode only) | `subagent_type: "product-reviewer"` | *(none — skip if the project file is absent)* |

Run the Glob first every time — don't assume.

**`browser-verifier` is NOT part of this step — it is opt-in, never auto-spawned.** Spawn it **only when the user asked in words** — "the diff touches UI so they'd want runtime proof" is an inference. A UI diff is a reason to offer, never a reason to spawn. See `references/browser-verification.md`.

### Agent count

Auto-scale by changed-file count; user arg overrides. Count changed files first with `git status --short` (run it in EVERY repo of a multi-repo project), then pick agents-per-role. "Multi-repo" here isn't limited to a project's known sub-repos — a global dotfiles checkout (`~/.claude`) or a separately-cloned plugin repo sits outside the project directory entirely.

`git status --short` is canonical, not `git diff --name-only` — the latter omits new/staged files. If staged before `/done`, it returns empty, every agent reports clean on an empty slice, and `/done` passes having reviewed nothing.

For the "already committed" case (work may be committed but not yet pushed): count off the session's base commit instead of the working tree. Recovery: `git diff --name-only <base>..HEAD`, where `<base>` is HEAD at session start (or merge-base with trunk if unknown).

In a non-git project, count by mtime against session start instead — `find . -newermt "<session start>" -type f -not -path './node_modules/*' -not -path './vendor/*'`. The tier table below reads the same off that list; ownership is sole by construction, with the caveat in `../_shared/references/verifying-a-write-landed.md`.

| Changed files | Reviewers | Simplifiers | Product | TOTAL agents |
|---|---|---|---|---|
| ≤30 | 1 | 1 | 1 | **3** |
| 31–80 | 2 | 2 | 1 | **5** |
| 81+ | 3 (cap) | 3 (cap) | 1 | **7** |

The count is PER ROLE, and ALL agents go in ONE tool-call block. N reviewers means N reviewers AND N simplifiers, plus one product reviewer (never partitioned — it judges the whole feature).

When count >1 per role, partition the file list across same-role agents by domain/directory — each agent gets a disjoint slice. Never hand every same-role agent the full list (duplicated review + conflicting edits on the same file).

**Prompt for each:**
- The file slice this agent owns (full paths) — its partition, not the whole list when split
- For simplifier: focus on duplication removal, readability, pattern consistency
- For reviewer: focus on bugs, security, logic errors, project convention violations
- For product reviewer: name the **feature** built this session and its **task-doc path** (e.g. `tasks/admin/school-accounts/current.md`) so it reads the intent. It is NOT partitioned — it judges the whole feature's journey. Give it the feature + doc, not a file slice.

> Project agents have a Bootstrap section — they read relevant CLAUDE.md files + the task doc themselves. Do NOT paste project conventions into the prompt.

**While they run, do nothing they were spawned to do.** The verification agenda below is rich and already in your head, which is what makes the interval dangerous: starting it early reads as getting ahead rather than as duplicating the agents. It pays for the same facts twice and destroys the check that makes delegating safe, since a fact you derived inline and then see restated in a report reads as corroboration while confirming nothing. **Tell: your calls map onto a scope you just assigned, or you describe an agent as having "confirmed" something you had already looked up.** The harness re-invokes you on completion, so waiting costs nothing and polling costs the delegation — work on something disjoint, or don't work. 📖 `../_shared/references/explore-delegation.md`

**After all complete:**

Re-read `git rev-parse HEAD` and `git status -sb` before anything else. Your pre-fan-out reading of the repo's state is not evidence about its state now: an agent that committed or pushed leaves every other check in this workflow green, and the file-count and partition you reasoned from silently stop describing the tree. A HEAD you don't recognise, or an ahead/behind marker you didn't create, is the only signal that happened — and if it was pushed, say so rather than rewriting shared history to hide it.

**Agents have bounded visibility.** Each agent sees one repo, one domain, one layer. A partition that reads "clean" everywhere can hide cross-cutting seams a static gate cannot catch: a new field written here and not read there, a new case in a shared type with existing readers using the old case, a finding that contradicts what you know you built. These blindness patterns are not defects in the agents — they're structural. Once every agent has reported, verify what they could not see.

Two things decide a disagreement rather than plausibility. Where a reviewer and a simplifier reach opposite remedies, the one that executed code outranks the one that reasoned — but that tie-breaker assumes only one side ran something, and when both did, what decides is whose probe was isolated from the subject (`../_shared/references/probe-isolation.md`). And where confirming a finding means re-running something slow that touches shared state (a test DB, a build dir), serialize it: a racing second copy corrupts both runs and reads as a fresh code defect (`../_shared/references/long-running-commands.md`).

| Blindness Pattern | What Agent Saw | What It Missed | How to Verify |
|---|---|---|---|
| **Cross-partition seam** | Backend written, or response field added | Whether consumer reads it — a new field with only a writer, or old reader silently dropping new keys | Trace each introduced value to its *consuming* site; two clean same-layer reports suggest a seam to check |
| **New case in shared type** | Enum extended, status added, error code defined | Existing readers (already compiled, already have a default branch) that now silently swallow the new case | Grep the *type's name* (not the feature's) across readers; the shared property they route through (a `canRetry`, `isVisible`) is usually the single fix point |
| **Contradictory reports** | Agent A from `git log`, Agent B from current file | One describes the tree *before* the session, the other *now* — the baseline mismatch inverts the conclusion. Measured: a refutation asserted a section was untouched, citing real commits and quoting them accurately, while 192 rows of it were already gone from the working tree | Check what each agent measured, not whether its evidence exists; `git diff HEAD --stat` settles which baseline matches the work under review |
| **Simplifier raced the review** | Reviewer found defect, simplifier may have fixed it | Whether the defect survived or the fix is correct; a "fixed" finding can be fixing a wrong diagnosis, or the fix might have introduced new defects | Read the current file against the diagnosis; if real, run the cheap version (a request, one resolver read) before applying the patch, then re-run the failing thing to compare — a fix whose command you never re-ran is unverified however obviously right it looked |
| **Product gap is correctness** | Product reviewer surfaced a missing journey | Whether a sibling call site outside the diff needs the same new rule — a product finding can be a coverage defect wearing a feature badge | Grep the feature for sibling call sites; a second place needing the rule is a correctness bug, not a scope recommendation |

A finding, a fix, and anything built in response to one are three separate moments — the agents only ever saw the first. Everything downstream (a fix you apply, code the user asks you to build off a gap, a second pass over the same file) is new content no agent has read. Below are specific cases beyond the table above:

- **A simplifier's changes landed and stayed in bounds**: Verify they landed (a linter may have auto-formatted on top) and that nothing load-bearing got collapsed with the duplication. Re-run `php -l`/`tsc` — "declared but not used" is a half-done refactor. When an agent's mandate was restricted (comments only, docs only, a named file list), filter the diff to what the mandate allowed and require the remainder empty before trusting the claim.
- **A product-reviewer gap, once triaged**: Surface genuine missing journeys as a question at the TOP of the Output (per `../_shared/references/decision-first-output.md`), letting the user decide what to build now vs. defer to the task doc's Next Steps.
- **An agent's claim that something is already handled**: Open the file and check the claim reaches the case it was about — a mechanism that exists somewhere in a file is not the same as one that runs where it matters. Worth checking in both directions, since the claim can equally be right about code you assumed was fine.
- **A fix that widens a predicate, against passing tests**: After widening any guard, re-ask what each existing test would still fail on — where the answer is "nothing," the coverage is lost and the discrimination should be restored rather than the green.
- **Whatever this loop itself produces**: A fix or a feature the user asks you to build off a surfaced gap is exactly the same kind of unreviewed content as the rest of this list — it just arrived a step later. If the remaining work is more than a one-line patch, treat it as a slice this step hasn't covered yet rather than closing the loop on the strength of the original agents' reports.

## Step 2: Clean up temp code

Scan the session for temporary artifacts — debug UI, logging, commented-out migration code — and remove or ask before keeping. Skip if none found.

## Steps 3 + 4: Capture Knowledge + Update Task Docs (sequential — Step 3, then Step 4)

Run Step 3 before Step 4. Both skills scan the same conversation for the same class of signal and independently decide routing (CLAUDE.md vs. task doc). Parallel dispatch risks the same fact landing in both files or neither — `update-claude-docs` decides what's broadly reusable, and `task-summary`'s own rule ("only patterns that apply broadly go in CLAUDE.md") depends on that decision already being made. Step 4 reads Step 3's result.

**Step 3 — Capture Session Knowledge:**

Invoke `syafiqkit:update-claude-docs` bare (no arg), or if you pass an arg keep it a HINT, not a scope limiter. The skill scans the FULL conversation for conversational signals (user corrections, preferences, things Claude got wrong) AND code-level patterns (env surprises, tool misuse), then routes to the narrowest scope. Handing it a pre-written arg listing only code facts silently narrows the scan and drops early-session behavioral misses — exactly the highest-value captures.

Do not pre-write CLAUDE.md entries in `/done` — delegate the whole capture to the skill. A summary of CLAUDE.md writes is a complete-looking artifact; reporting it is how Step 4 gets skipped. The next thing after this skill's return is invoking the task-summary skill, not a reply describing what was written.

**Step 4 — Update Task Docs:**

Invoke `syafiqkit:task-summary` bare, letting the skill do a multi-domain scan. Passing an explicit path skips the scan, missing updates to related docs (roadmaps, bug reports needing stubs).

If the skill already ran THIS session (e.g., a `/commit`'s staleness gate forcing a full run): invoke it scoped, passing only what's NEW since that run. A scoped invoke still counts as running the step; skipping it does not.

The skill auto-detects create vs update and handles path resolution, status updates, cross-references.

**Then, before leaving this step, measure what it wrote.**

**Three core rules:**
1. **Measure the SET, never the index alone.** Use `find` not a `decisions/*.md` glob — an unsplit doc has no such dir, and under zsh an unmatched glob aborts before `cat` runs. Once a doc splits, `decisions/*.md` routinely outweighs the index several times; an index reading ~110 lines can front a set three times its budget.
2. **Over budget has two outcomes only.** Run `condense-task-doc` in the same turn, or state in the Output that it was skipped and why. Reporting the overage alone is not an outcome.
3. **Expect the pull to defer, and recognize it rather than trusting it.** An overage predating this session reads as pre-existing; a condense rewrites earlier work — both feel like reasons to defer to the user. Neither is true: `condense-task-doc`'s guard reads the working tree (no collisions), and its row-pass greps each fact before deleting (no loss).

**Measurement command:**

```bash
# per doc set touched this session — the SET, never the index alone
find <doc-dir> -name '*.md' | xargs cat | wc -lc
```

Lines are the budget `condense-task-doc` targets; bytes distinguish real growth from a MADR restructure that grows lines while shrinking bytes. Read `condense-task-doc` for the threshold and cut/keep rules rather than carrying a number here.

The doc-update summary plus this measurement are the last artifacts before the gates below, which only decide what Step 5 *does*, not that you reached Step 5. Once both are done, run the Step 5 check next.

> Agent files no longer contain injected CLAUDE.md content — they read it dynamically. No agent syncing needed.

## Step 5: Capture plugin learnings (optional — only if a gate fires)

Steps 3+4 write to the *project*; this writes to the *plugin* — a global artifact shared across every project. Skip if neither gate fires.

**Gate A — does a real skill signal exist?** Capture if a skill misfired, a workflow step was wrong, a trigger missed, or an absent rule caused a mistake. Most runs have none — skip silently. Merely using skills successfully is not a signal; don't manufacture one. A deviation you caught (you declined to follow a step or worked around something) is the defect — record what instruction the skill or docs lacked. A workaround you typed into an agent prompt is the same signal: the agent needed that knowledge but didn't have it. The fix belongs in the agent file or docs, not in the prompt.

**Gate B — did this session WRITE to a skill file?** Measure it:

```bash
# Run from the plugin checkout (CWD), not git -C <path>, which walks up to enclosing repos
git status --short -- 'skills/**/*.md' 'commands/*.md' '.claude/agents/*.md'
```

The checkout is shared by every project, so it may carry another session's work. Settle ownership by mtime against session start time — on macOS: `stat -f '%Sm' -t '%m-%d %H:%M' <file>`. Files stamped OUTSIDE your session's window drop out, in either direction: earlier is work that finished before you started, and later — including a timestamp hours ahead of now — is a peer writing as you read, not a file of yours. If the list empties, Gate B did not fire.

That test only catches a peer whose writes land outside your window; a session editing this checkout *concurrently* stamps its files inside it too, and the shared checkout makes that the ordinary case. So a clean mtime pass is not ownership — read `git diff HEAD -- <file>` on anything you don't remember editing, since a foreign edit is recognisable on sight and nothing else distinguishes it. `HEAD` matters: a bare `git diff` misses the staged plane the harness auto-stages your own work into, so it reports your files as foreign (`../_shared/references/diff-ownership.md`). Getting this wrong ships someone else's in-flight work under your version bump, which is the failure the paragraph above exists to prevent. If the file survives the diff read too, ask before treating it as yours.

`ListAgents` can confirm a peer session is live, which is worth a mention here and a heads-up before you bump — but it can't say which checkout a peer is in, so the diff read stays the only check (`../_shared/references/cross-session-messaging.md`).

Any surviving output means a rule arrived by direct hand-edit, which is the path D50's replace-or-route gate never sees — it hangs off `update-plugin`, while most rules land as edits like the ones you just made. So for each surviving file, say which happened: a rule **replaced** one already there, **routed** to `references/`, or the file **grew** and no retirement was available. The third answer is legitimate and worth stating plainly; what it is not is the silent default, which is how a corpus reaches 2:1 additions-to-removals with every individual rule justified.

Invoke `syafiqkit:update-plugin` — it owns everything downstream. It probes ownership and branches: **owner** → patch the skill files + version bump + CHANGELOG; **consumer** → draft and offer to file as a GitHub issue upstream. Either way the finding survives.

## Exit gate — verify steps actually ran BEFORE writing the Output

Confirm the WORK is done, not just this skill's steps. `/done` wraps up finished work. Verify against the approved plan or the user's original request that every part was built. Part-done → finish the work first.

**Every row of the Output table below is a claim that a step ran.** Before writing it, verify each claim against what you ACTUALLY invoked this session:

| Row | Only fillable if you actually... | Full-mode expectation |
|-----|----------------------------------|-----------------------|
| Simplify | spawned simplifier agent(s) **and gave them a simplifier prompt** | N simplifiers (N = the per-role count) |
| Review | spawned reviewer agent(s) **and gave them a code-review prompt** (bugs/security — NOT product gaps) | N reviewers |
| Product | spawned the product-reviewer agent **with a product prompt** — and every gap it surfaced that survived triage is asked as a question above, since the row itself no longer carries the gap text | exactly 1 |
| Knowledge | invoked `syafiqkit:update-claude-docs` **and confirmed the target CLAUDE.md changed** (not just launched the skill) | 1 skill call, edits landed |
| Task docs | invoked `syafiqkit:task-summary` **and re-read the doc to confirm its `Last updated` + content actually changed** — invoking is not updating — **and measured the doc SET, with any overage either condensed this turn or stated as skipped in the Output** — measuring is not condensing | 1 skill call, doc verified changed, set measured |
| Plugin | invoked `syafiqkit:update-plugin` | Fires when **either** Step 5 gate does: a real skill signal (Gate A, usually absent) **or** this session having written to a skill/command/agent file (Gate B). Omit the row only when both were checked and neither fired. (Not-the-owner is NOT a reason to skip — the skill switches to upstream-report mode.) |

Verify Knowledge/Task docs rows with `git -C "$(git rev-parse --show-toplevel)" diff HEAD --stat -- <repo-relative-path>`. An empty result is inconclusive (three causes return empty with exit 0; gitignored targets like `CLAUDE.local.md` never show in git output — grep them instead, see `../_shared/references/verifying-a-write-landed.md`). In a non-git project that command errors rather than returning anything, and the same reference's substitutes ARE the verification: re-read or grep each target. Substantiating a row that way is a filled row, not a skipped step.

A row you cannot substantiate is a step you skipped — go run it before writing `✅`. If you spawned only ONE agent role, the step is half-run: spawn the missing role before proceeding.

**Then read the message you're about to send, from the top.** Is there anything the user has to decide, and is it the first thing they hit? A gap the product reviewer surfaced, that survived triage, and that the Output never asks about was dropped rather than resolved — and the Product row now reads `✅` on a change with an open question, which is the one shape this gate can't infer from the rows above.

An agent that returns FAILURE leaves its row unfillable — re-run it. On spawn/routing faults (an opus-pinned role 400ing with `effort 'max'`/`'xhigh' not supported`), re-dispatch on a different model tier instead of retrying the same way — then diff the generated `.claude/agents/<name>.md` against its `skills/agent-setup/templates/<name>.template.md`, since the fault is sometimes the generated file having silently drifted from an already-correct template rather than an inherent tier limitation; sync it instead of leaving the workaround as the permanent fix.

## Output

Lead with what the user has to decide; report what was built underneath it. Within the summary, group by **what was built**, not by workflow step — findings per feature/change, not per agent/skill.

1. **Ask anything still open, first.** A product gap that stayed a recommendation per Step 1's triage, or any call the user owns, goes at the top — one open question uses `AskUserQuestion`, two or more use a `## Decisions` block. `../_shared/references/decision-first-output.md` owns the shape, the test for what qualifies, and the case for putting it first; read it before writing this section. Nothing open means no block at all.
2. **Partition the session's diff into changes** — coherent units the user thinks of as one thing (one feature, bugfix, refactor), not one file. Files coupled by logic are one change; features that share a file are two.
3. **For each change**, report what Simplify/Review/Product found. Omit roles that produced nothing on that change. A cell reports the finding; it isn't where you argue the work was good, and a gap already asked about above gets pointed at rather than restated.
4. **Knowledge, Task docs, Plugin stay session-level** — they're shared writes, not per-change.
5. **Add a Test row for changes that have one to run** — concrete command or 1-2 steps the user hasn't seen executed yet. For an API/data change: a `curl` against the new route, a query for the new column. For a UI/workflow change: the literal navigation path a user follows to see it — open the page, go to X, click Y, confirm Z — not a command, since there's nothing to run. Skip this row for doc-only edits or pure renames. If the test suite already ran, linking to it is enough; the Test row is for what the user still needs to verify, not recapping what ran.

Omit a row for changes with nothing on it; never fill it with "N/A".

```
## Decisions

1️⃣ [what's true now]
   [the question]

(two or more open questions only — shape and thresholds in `../_shared/references/decision-first-output.md`)

## /done Summary

### [Change 1 name]
| Step | Result |
|------|--------|
| Review | [issues found + fixed, or ✅ clean; docs-only ALSO appends the referential-integrity result; ops-only = live read-back] |
| Simplify | [changes made, or ✅ none needed] |
| Product | [✅ journeys complete, or → the question asked above] |
| Cleanup | [removed, or omit] |
| Test | [the exact command or steps the user runs to verify this change themselves] |

### [Change 2 name]
(same shape — omit rows this change had nothing for)

### Session
| Step | Result |
|------|--------|
| Knowledge | [N entries → target files, one line each; "0 new" if none] |
| Task docs | [doc path → one-line summary of the update] |
| Plugin | owner: [skill files patched + version bump] · consumer: [issue URL filed, or the report + why not] (**omit the row entirely** if Step 5 didn't fire) |
| User args | [what was done about them] (only if args passed) |
```

A session with exactly one change collapses to one `### [Change]` block plus `### Session` — don't invent a second change to justify the grouping. A change with only ✅/➖ across every row (nothing found, nothing to test) still gets its own heading; the value of the grouping is telling the reader "here's everything about X," not just surfacing problems.
