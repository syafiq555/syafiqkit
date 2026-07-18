---
name: done
description: Post-task cleanup - simplify code, review changes, update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize".
---

# Post-Task Workflow

Execute all steps in sequence without pausing for confirmation.

| ❌ NEVER | ✅ ALWAYS |
|----------|----------|
| Emitting one `Agent` call per message and calling it a parallel batch | **Every agent of a batch goes in ONE assistant message.** One-per-message serialises them regardless of any flag, and reciting the rule does not enforce it — count the `Agent` calls in the block against the roles you owe *before* sending |
| Treating `run_in_background: false` as a guarantee the call blocks | It isn't — [subagents run in the background by default since v2.1.198](https://code.claude.com/docs/en/sub-agents), and [#69691](https://github.com/anthropics/claude-code/issues/69691) reports `false` is ignored in top-level sessions. Pass it, but expect a `<task-notification>`; results are never lost. **Never poll** for one |
| Run agents one at a time when independent | Two Agent calls in **same message** for parallel foreground execution |
| Send an agent a prompt whose ROLE doesn't match its `subagent_type` (product-review content to `code-reviewer`) | The prompt's role and the `subagent_type` must be the SAME role. A mis-prompted agent silently skips BOTH — the role you invoked never ran, and the role you asked for wasn't registered as run. It still looks "spawned" to every downstream check |
| Report a step done when only PART of it ran (reviewers but no simplifiers; Step 3 but no Step 4) | Every step below is a CHECKLIST, not prose. Before reporting, tick each named part — a step with an unticked part is NOT done. A part you deliberately skipped gets `➖ <reason>` in its Output row, never a silent blank |

**User args**: If the user passed instructions with `/done` (e.g., "make sure this works for X"), address those FIRST before proceeding with the standard steps. The user's instructions override defaults. Record what you did about them in the **User Instructions** table of the Output. If no args were passed, omit that table.

## Mode selection (decide first)

**Light mode** when the session touched **<5 files in a single domain** AND no new feature/architecture was introduced (bug fix, small tweak, config change):
- Step 1: ONE reviewer agent only (skip the separate simplifier — tell the reviewer to also flag obvious duplication; skip the product reviewer — a trivial fix has no new feature journey to judge).
- ⚠️ **Exception — a small diff that EXPOSES or CHANGES a user-facing capability is NOT light** (new toggle/button/field/route, status control, anything a user now acts on). File count measures diff size, not journey significance — run the product reviewer (full mode for Step 1) even at 1 file.
- ⚠️ **Exception — if you DROVE the real user journey this session (browser, real account, real flow), always run the product reviewer**, whatever the file count. Observations from a live flow are gone next session and exist nowhere else; a fix RESTORING a broken capability reads as light while holding the freshest product evidence you'll have.
- Step 4: invoke `syafiqkit:task-summary` WITH the known doc path (skip the multi-domain scan — you already know the one affected doc).
- Output: the compact single-table form (see Output).

**Docs-only mode** when the diff is **entirely documentation** — `*.md` only (task docs, CLAUDE.md, README), zero application code (`git status --short` shows no `.php`/`.ts`/`.tsx`/etc.):
- Step 1: **skip all three code agents** — simplifier/reviewer/product-reviewer audit *code*; there is none. Running them against markdown is theater. Instead run a **referential-integrity check** yourself (the real "review" for docs): no broken `tasks/**/current.md` or `CLAUDE.md` links, renamed/deleted paths fully reconciled (0 stale refs), anchors unique, `> 📖` pointers resolve.
- Steps 2-4 as normal (temp-artifact scan rarely applies to docs; knowledge capture + task-doc reconciliation still run).
- Output: mark Simplify/Review/Product as ➖ with reason "docs-only, no code"; report the integrity-check result on the Review row.
- ⚠️ **Exception — the trigger is "did THIS SESSION produce code", not "is code in the uncommitted diff".** Code already committed this session is NOT docs-only — it was never agent-reviewed. Count files from the SESSION's work (`git show --stat <this-session's commit>` + uncommitted diff), and run Full/Light Step 1 against committed code files. The tell: a commit you authored this session in `git log`, but the working tree shows only `.md` changes.

**Infra-only mode** when the diff is **entirely deploy/build/CI plumbing** and no application code — CI workflows (`.github/workflows/*.yml`, `.circleci/`), `docker-compose*.yml`/`Dockerfile`, build config (`next.config.*`, `vite.config.*`), nginx/env config. The **mirror image of docs-only**: docs need no reviewer; infra needs *only* the reviewer, and needs it badly.
- Step 1: **reviewer ONLY.** Skip the simplifier (no logic to DRY) and the product reviewer (no user journey). Size-independent — the trigger is file KIND, not count.
- ⚠️ **Prompt the reviewer adversarially: infra fails SILENTLY.** Broken deploy steps exit 0 while tests pass — review is the only catch. Give it the change's PURPOSE, what it must not break, ask for empirical verification. Two call sites of the same command can need opposite treatments.
- Steps 2-4 as normal. Output: mark Simplify/Product as ➖ "infra-only".
- ⚠️ **Exception — a compose/env change that FLIPS A FEATURE FLAG on is NOT infra-only**; it exposes a user-facing capability → run the product reviewer (see Light mode's exception).

**Full mode** (default) for everything else — multi-file features, multi-domain sessions, anything with external inputs (WhatsApp/ClickUp pastes) that may need new doc stubs. When in doubt, full.

## Concurrency guard — you may not own the whole diff

⚠️ **Check for another writer BEFORE Step 1.** Two tells: a background `Agent` you spawned is still running, or `git status` shows modified/staged files you never touched (a parallel Claude session). Every writing step below assumes the diff is yours; when it isn't, the default behavior destroys the other writer's work.

| Step | Default (assumes you own the diff) | With a concurrent writer |
|------|-----------------------------------|--------------------------|
| 1 (agents) | Partition the `git status --short` file list | Scope every agent to the files **you** changed, and name the contested paths as off-limits — a reviewer handed another session's uncommitted file will "fix" it |
| 3+4 (skills) | `task-summary` bare, so it multi-domain scans | Do **not** invoke it unscoped — its scan edits the contested docs. Pass a scoped read-only verification arg and say why |
| Commit | — | Never `git add`/bare `git commit`: it sweeps the other writer's staged work into your commit. Explicit pathspec only (`git commit -m msg -- <your files>`) |

This generalizes the settled-file rule `update-claude-docs` Step 4 already applies to the pruner: **a writer reads a file when it starts, not when it finishes.**

## Step 1: Simplify + Review + Product Review (parallel)

Run all applicable agents **in parallel — every `Agent` call in ONE assistant message**. That single block IS the parallelism; no flag substitutes for it. Pass `run_in_background: false` on each (it expresses intent), but do not depend on it blocking — expect results as `<task-notification>`s and never poll for them.

The three roles are deliberately different lenses, not redundant:
- **Simplifier** — is the code *clean*? (duplication, readability)
- **Reviewer** — is the code *correct*? (bugs, security, conventions)
- **Product reviewer** — is the *feature* complete and valuable? (missing journeys, dead-end flows, UX/business gaps the engineer forgot to build — the class of miss a line-level diff structurally cannot catch, e.g. a CRUD with no "create" button). Runs in **full mode only**, and **only if a project `.claude/agents/product-reviewer.md` exists** (it carries project-specific product context — there's no generic fallback; skip silently if absent).

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

Run the Glob first every time — don't assume the project agent exists or doesn't (e.g. a hit spawns `code-reviewer`; a miss spawns `feature-dev:code-reviewer`).

⚠️ **`browser-verifier` is NOT part of this step — it is opt-in, never auto-spawned.** It drives a real browser against a running app, so it is slow, needs the app up, and is meaningless on a backend-only diff. Spawn it **only when the user asked in words** — "the diff touches UI so they'd want runtime proof" is an inference, and inferring it is the auto-spawn this rule forbids. A UI diff is a reason to offer, never a reason to spawn. It is not counted in the agent table below and never partitioned. See `references/browser-verification.md`.

**Agent count — auto-scale by changed-file count, user arg overrides.** Count changed files first with **`git status --short`** (run it in EVERY repo of a multi-repo project), then pick agents-per-role:

⚠️ **`git status --short` is canonical — NOT `git diff --name-only`.** `diff --name-only` shows only unstaged changes to tracked files — new/staged files are invisible. If you staged before `/done`, it returns empty for the entire session's work — you then partition zero files, every agent reports clean on an empty slice, and `/done` passes having reviewed nothing. `git status --short` shows staged + unstaged + untracked with status letters. **Tell: the command returns nothing for work you just did.**

⚠️ **If `git status --short` is empty because the session's work is already committed, it's not a clean tree — count off the session's base commit instead.** Running `/done` after committing as you go is a normal flow, and a legitimately empty `git status --short` here is the *correct* output but the *wrong* signal — committed work is invisible to it, same failure as the staged case above, different cause. Recovery: `git diff --name-only <base>..HEAD`, where `<base>` is HEAD at session start (or the merge-base with trunk if unknown). Partition and review those files exactly as you would an uncommitted diff.

| Changed files | Reviewers | Simplifiers | Product | TOTAL agents |
|---------------|-----------|-------------|---------|--------------|
| ≤15 | 1 | 1 | 1 | **3** |
| 16–40 | 2 | 2 | 1 | **5** |
| 41+ | 3 (cap) | 3 (cap) | 1 | **7** |

⚠️ **The count is PER ROLE — it multiplies, it does not replace.** N reviewers means N reviewers **AND** N simplifiers, plus the single product reviewer. Spawning N agents *total* (all of one role) is the failure this table exists to prevent: at 41+ files, 3 agents is wrong — **7** is right. The product reviewer is always exactly 1 (it judges the whole feature, so it is never partitioned).

⚠️ **ALL agents go in ONE tool-call block.** The failure this prevents is *not* miscounting — it is stating the count correctly and then emitting one call anyway. Writing "TOTAL = 3" costs nothing and enforces nothing: a partial block raises no error, produces no diff, and fails no gate. It surfaces only when a human counts your tool calls and asks where the others went. Restating the rule to yourself is not the check — you can recite it and still send one call.

**Anchor the emission to the Glob you just ran, not to a number you wrote.** Each `.claude/agents/*.md` hit above is one role, and each role is one `Agent` call in the block you are about to send. Read your Glob results, then emit one call per hit (×N per role when the table says >1) — the same block, no exceptions.

⚠️ **You have already failed this step the moment you send a block intending to "spawn the rest next."** There is no next: the turn ends, the results come back, and the missing roles are never registered as skipped — every downstream check reads the step as run. If the block in front of you has fewer `Agent` calls than roles, add them *before* sending.

⚠️ **After-the-fact counter-check — writing "TOTAL = N" correctly does not prove you sent N.** Once results start coming back, count the `Agent` calls you actually emitted this turn against TOTAL before reading any result. A correct pre-send checklist can still be followed by a single call going out — the only reliable catch is counting what was actually sent, not what was intended.

A user arg always wins: "2 agents each" / "4 each" sets the per-role count explicitly (ignore the table); a count is also implied by "split it up". Light mode (`<5` files) is the ONE case with an asymmetric count (1 reviewer + 0 simplifier) — it takes precedence over the table's top bucket.

When count >1 per role, **partition the file list** across the same-role agents by domain/directory — each agent gets a disjoint slice (file count sets *how many*; domain sets *which files each gets*, so coupled files stay together). NEVER hand every same-role agent the full list: duplicated review + conflicting edits on the same file.

**Prompt for each must include:**
- The file slice this agent owns (full paths) — its partition, not the whole list when split
- For simplifier: focus on duplication removal, readability, pattern consistency
- For reviewer: focus on bugs, security, logic errors, project convention violations
- For product reviewer: name the **feature** built this session and its **task-doc path** (e.g. `tasks/admin/school-accounts/current.md`) so it reads the intent. It is NOT partitioned by file slice — it judges the whole feature's journey. Don't give it a file slice; give it the feature + doc.

> Project agents have a Bootstrap section — they read relevant CLAUDE.md files + the task doc themselves. Do NOT paste project conventions into the prompt.

**After all complete:**
- If reviewer found issues → **confirm each against the actual code before fixing** (grep the call site / re-read the line — a finding is a claim, not a verdict), then fix and continue. Don't blind-apply; don't dismiss either — a real bug a blanket `replace_all` left behind looks identical to a false positive until you check.
- If simplifier made changes → verify they were applied (linter may have auto-formatted) AND that nothing was over-collapsed (an intentional guard/workaround removed). Re-run `php -l`/`tsc` on touched files — "declared but not used" = a half-done refactor.
- If product reviewer found gaps → these are **product recommendations, not auto-fixes**. Do NOT silently build them. Surface 🔴/🟠 findings to the user and ask which to implement now vs add to the task doc's Next Steps — a missing journey is a scope decision the user owns. Confirm each gap is real (the deferral might be documented) before raising it.

## Step 2: Clean up temp code

Scan session for temporary artifacts that should be removed:

| Artifact | How to detect | Action |
|----------|--------------|--------|
| Test buttons / debug UI | `TEMP:`, `TODO: REMOVE`, `test buttons` in modified files | Ask user: "Remove temp test code from {file}?" |
| `console.log` debugging | `console.log` added this session | Remove unless intentional |
| Commented-out old code | Large commented blocks from migration | Remove if replaced |

**Skip if**: No temp artifacts found.

## Steps 3 + 4: Capture Knowledge + Update Task Docs (parallel)

⚠️ **TWO skills, both mandatory — running only Step 3 and skipping the task doc is a common `/done` failure.** Tick both:

- [ ] Step 3 — `syafiqkit:update-claude-docs`
- [ ] Step 4 — `syafiqkit:task-summary`

Run both **in parallel — both Skill calls in ONE assistant message**; they are independent. If you invoked one and not the other, the step is not done.

**Step 3 — Capture Session Knowledge → CLAUDE.md:**

```
Skill: syafiqkit:update-claude-docs
```

This is the **single** writer of CLAUDE.md / `CLAUDE.local.md` entries. It scans the FULL conversation for **both** conversational signals (user corrections, convention preferences, team/strategy context, things Claude got wrong) **and** code-level patterns (debugging root causes, env surprises, tool misuse), then handles dedup + routing to the narrowest scope. Do NOT pre-write CLAUDE.md entries in `/done` — delegate the whole capture to the skill, otherwise you force a "don't double-write" reconciliation.

⚠️ **Invoke it BARE (no arg), or if you pass an arg keep it a HINT — never a scope limiter.** Handing the skill a pre-written arg that lists only this session's code facts silently narrows its scan and drops early-session behavioral misses (a wrong task-doc discovery, a source you checked wrong and the user corrected). Those "user had to correct" signals are the highest-value capture and the easiest to lose. If you do pass an arg, it must still say "and scan the full conversation for corrections/wrong-turns too."

**Step 4 — Update Task Docs:**

Invoke `syafiqkit:task-summary` **with no args** in full mode — let the skill do a multi-domain scan. In **light mode**, pass the known doc path instead.

⚠️ **Why full mode scans**: Passing an explicit path skips the scan, causing missed updates to related docs (roadmaps, bug reports mentioned in chat that need stubs). Light mode is exempt because its trigger condition (single domain, no external inputs) rules those out.

⚠️ **`task-summary` already ran THIS session → invoke it scoped, not bare.** `/commit`'s staleness gate forces a full run, and `/commit`+`/ship`+`/done` are routinely chained, so the docs are often already reconciled by Step 4. Pass an arg naming only what's NEW since that run (typically the product reviewer's gaps → Next Steps). The bare-scan rule above governs a COLD `/done`, not this case. A scoped invoke still counts as running the step; skipping it does not.

The skill auto-detects create vs update. Handles: path resolution, status updates, completed work, cross-references.

> Agent files no longer contain injected CLAUDE.md content — they read it dynamically. No agent syncing needed.

## Step 5: Capture plugin learnings (CONDITIONAL — usually skipped)

Steps 3+4 write to the *project*; this writes to the *plugin* — a global artifact shared across every project.

**ONE gate: does a real skill signal exist?** A skill misfired, a workflow step was wrong/missing, a trigger missed, or an absent rule caused a mistake. **Most runs have none — that is the expected case, so skip silently (no Output row).** Merely *using* skills successfully is not a signal; never manufacture one, since a thin patch to a shared skill is worse than no patch.

⚠️ **The signal you CAUGHT still counts — that is the one this gate keeps missing.** If you declined to follow a skill's step or worked around it, that IS the defect: you had the context to catch it, the next session won't. Ask: *did I deviate from any skill's written instructions this session, and why?* A deviation with a good reason is a skill that needs the reason written into it.

⚠️ **A workaround you typed into an AGENT's prompt is the same signal, one level down.** If you had to hand-write an instruction to get an agent past something — an escape hatch, a correction to a doc it had believed, a recipe it couldn't derive — it still lacks that knowledge. The tell: a second agent spawned to redo what the first couldn't, with extra instructions. Ask: *what did I have to tell an agent that its own file or the project docs should have told it?* The fix belongs in the agent file or the docs — never in the prompt.

Signal exists → invoke `syafiqkit:update-plugin`. It owns everything downstream: it probes ownership itself and branches — **owner** → patch the skill files + version bump + CHANGELOG; **consumer** → draft the finding and *offer to file it as a GitHub issue* upstream (asking first, posting under the user's own identity). Either way the finding survives.

⚠️ Do NOT hand-patch skill files from `/done`, and do NOT skip this step just because you're not the owner — a defect hit by a real user is the most valuable kind.

## Exit gate — check BEFORE writing the Output

⚠️ **FIRST: is the WORK done, or just this skill's steps?** `/done` wraps up finished work — it is not a milestone marker for a slice of it. Re-read the approved plan (`~/.claude/plans/*.md` for this session) or the user's original request, and confirm every part was built. **A plan titled `X + Y` with only X built is not done**, however green X's tests are.

This check is not optional and not covered by the rows below — they audit whether *this skill* ran, never whether the *work* finished. `/done` is the one skill that manufactures evidence of completion (a ✅ summary table, a task doc reading "shipped", a Quick Start saying "commit it"), so running it early doesn't just mislead the user — it writes artifacts you will later read back and believe. Part-done → stop, finish the work, then invoke.

⚠️ Every row of the Output table below is a claim that a step ran. Before writing it, verify each claim against what you ACTUALLY invoked this session — not what you intended to:

| Row | Only fillable if you actually... | Full-mode expectation |
|-----|----------------------------------|-----------------------|
| Simplify | spawned simplifier agent(s) **and gave them a simplifier prompt** | N simplifiers (N = the per-role count) |
| Review | spawned reviewer agent(s) **and gave them a code-review prompt** (bugs/security — NOT product gaps) | N reviewers |
| Product | spawned the product-reviewer agent **with a product prompt** | exactly 1 |
| Knowledge | invoked `syafiqkit:update-claude-docs` **and confirmed the target CLAUDE.md changed** (not just launched the skill) | 1 skill call, edits landed |
| Task docs | invoked `syafiqkit:task-summary` **and re-read the doc to confirm its `Last updated` + content actually changed** — invoking is not updating; a skill that ran as a separate process and silently no-op'd still reads as "invoked" | 1 skill call, doc verified changed |
| Plugin | invoked `syafiqkit:update-plugin` | **usually absent** — Step 5 fires only when a real skill signal exists. Omit the row when none did; never invent a patch to fill it. (Not-the-owner is NOT a reason to skip — the skill switches to upstream-report mode.) |

A row you cannot substantiate is a step you skipped — go run it now rather than writing `✅` beside it. If you spawned agents of only ONE role in Step 1, the step is half-run: spawn the missing role before proceeding. (Plugin is the one row where absence is the norm, not a miss.)

## Output

One combined table. Detail only what was actually WRITTEN or FIXED — never enumerate skipped signals or "nothing to do" rows beyond the status icon.

```
## /done Summary

| Step | Result |
|------|--------|
| Simplify | [changes made, or ✅ none needed; ➖ docs-only] (full mode only) |
| Review | [issues found + fixed, or ✅ clean; in docs-only mode = referential-integrity result] |
| Product | [🔴/🟠 gaps surfaced to user + decision, or ✅ journeys complete; ➖ if no project agent / light / docs-only mode] (full mode only) |
| Cleanup | [removed, or ➖] |
| Knowledge | [N entries → target files, one line each; "0 new" if none] |
| Task docs | [doc path → one-line summary of the update] |
| Plugin | owner: [skill files patched + version bump] · consumer: [issue URL filed, or the report + why not] (**omit the row entirely** if Step 5 didn't fire) |
| User args | [what was done about them] (only if args passed) |
```
