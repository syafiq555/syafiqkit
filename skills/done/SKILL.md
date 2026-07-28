---
name: done
description: Post-task cleanup - simplify code, review changes, update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize".
---

# Post-Task Workflow

Execute all steps in sequence without pausing for confirmation.

⚠️ **Ending the turn with steps outstanding is a pause, even when you announce it and ask nothing** — 📖 `_shared/references/one-turn-chain.md`. It fires at the sub-skill RETURN boundary (Steps 3→4→5), where a freshly-written summary reads like the end of the turn. **Tell: your reply names a remaining step instead of performing it.**

| ❌ NEVER | ✅ ALWAYS |
|----------|----------|
| Emitting one `Agent` call per message and calling it a parallel batch | **Every agent of a batch goes in ONE assistant message, opened with no prose before the calls** — see Step 1's emission block. Reciting the rule does not enforce it; the message shape does |
| **Treating `run_in_background: false` as a guarantee the call blocks** | It isn't — [subagents run in the background by default since v2.1.198](https://code.claude.com/docs/en/sub-agents), and [#69691](https://github.com/anthropics/claude-code/issues/69691) reports `false` is ignored in top-level sessions. Pass it, but expect a `<task-notification>`; results are never lost. **Never poll** for one |
| Run agents one at a time when independent | Two Agent calls in **same message** for parallel foreground execution |
| Send an agent a prompt whose ROLE doesn't match its `subagent_type` (product-review content to `code-reviewer`) | The prompt's role and the `subagent_type` must be the SAME role. A mis-prompted agent silently skips BOTH — the role you invoked never ran, and the role you asked for wasn't registered as run. It still looks "spawned" to every downstream check |
| Report a step done when only PART of it ran (reviewers but no simplifiers; Step 3 but no Step 4) | Every step below is a CHECKLIST, not prose. Before reporting, tick each named part — a step with an unticked part is NOT done. A part you deliberately skipped gets `➖ <reason>` in its Output row, never a silent blank |

**User args**: If the user passed instructions with `/done` (e.g., "make sure this works for X"), address those FIRST before proceeding with the standard steps. The user's instructions override defaults. Record what you did about them in the **User Instructions** table of the Output. If no args were passed, omit that table.

## Mode selection (decide first)

**Docs-only mode** when the diff is entirely documentation — task docs, CLAUDE.md, README, `skills/*/SKILL.md`, `commands/*.md`, `.claude/agents/*.md`, `references/`, and nothing else (`git status --short` shows no `.php`/`.ts`/`.tsx`/etc.). This mode is **additive, not subtractive** — it runs the full agent trio like full mode AND adds a docs-specific check; the agents are not skipped for prose. A doc can still hide a defect the agents catch: instruction markdown a future session *executes* has logic (a gate whose inputs no step computes, a threshold ambiguous against two numbers, an ordering defect *between* steps), and even a plain README can describe a workflow wrong — a referential check alone misses both.
- Step 1: **run all three agents (full-mode counts + partition)** AND run a **referential-integrity check** yourself: no broken `tasks/**/current.md` or `CLAUDE.md` links, renamed/deleted paths fully reconciled (0 stale refs), anchors unique, `> 📖` pointers resolve, and no edited table has a row/callout wedged mid-table (a blank line or prose between `|`-rows splits one GFM table into two).
- Steps 2-5 as normal (temp-artifact scan rarely applies to docs; knowledge capture + task-doc reconciliation still run). **Step 5's Gate B runs in every mode** — a docs-only diff is exactly where a hand-edited skill file hides.
- Output: fill Simplify/Review/Product from the agent runs as in full mode; ALSO report the referential-integrity result (append it to the Review row).
- **The partition must cover the whole SESSION's work, not just the uncommitted diff.** Code you already committed this session was never agent-reviewed, and the working tree may show only `.md` changes — so count files from `git show --stat <this-session's commit>` + the uncommitted diff and partition all of them. The tell: a commit you authored this session in `git log`, but `git status --short` lists only docs.

**Infra-only mode** when the diff is **entirely deploy/build/CI plumbing** and no application code — CI workflows (`.github/workflows/*.yml`, `.circleci/`), `docker-compose*.yml`/`Dockerfile`, build config (`next.config.*`, `vite.config.*`), nginx/env config. Unlike docs-only (which runs the full trio), infra needs *only* the reviewer, and needs it badly.
- Step 1: **reviewer ONLY.** Skip the simplifier (no logic to DRY) and the product reviewer (no user journey). Size-independent — the trigger is file KIND, not count.
- **Prompt the reviewer adversarially: infra fails SILENTLY.** Broken deploy steps exit 0 while tests pass — review is the only catch. Give it the change's PURPOSE, what it must not break, ask for empirical verification. Two call sites of the same command can need opposite treatments.
- Steps 2-5 as normal. Output: mark Simplify/Product as ➖ "infra-only".
- **Exception — a compose/env change that FLIPS A FEATURE FLAG on is NOT infra-only**; it exposes a user-facing capability → run the product reviewer.

**Ops-only mode** when the session changed a **running system rather than the repo** — provisioning/seeding an environment, a data migration or backfill, a deploy or config flip applied out-of-band — and produced **no repo diff and no session commit** in any repo. Throwaway scripts written outside a repo (scratchpad/tmp) are not a diff; they are never committed and never re-run.
- Step 1: **skip all three code agents** — there is no repo code to review, and an empty partition returns a green report that means nothing. Do NOT substitute the docs-only integrity check either; nothing was edited yet at that point.
- ⚠️ **The state you changed is the deliverable, so verification is a READ-BACK, not an agent.** Query the live system for each value the session claimed to set and report what it returned — an action's own return value is not evidence. This replaces Step 1's Output row.
- Steps 2-5 as normal, and **Step 4 is the whole point**: a live-system change leaves no trace in `git log`, so the task doc is the only place it exists. Record what changed, in which environment, and anything synthetic/temporary that a later reader must not mistake for real.
- Output: mark Simplify/Review/Product as ➖ "ops-only, no repo diff"; report the read-back on the Review row.

**Full mode** (default) for everything else — multi-file features, multi-domain sessions, anything with external inputs (WhatsApp/ClickUp pastes) that may need new doc stubs. When in doubt, full.

**An empty `git status --short` does not by itself select a no-code mode — establish WHY it's empty first.** Three causes look identical and need opposite handling: work already committed this session (→ full mode, count off the base commit), another writer's tree you don't own (→ see the ownership guard), or the session genuinely never touched the repo (→ ops-only). **Tell: you're skipping Step 1 because there was "nothing to review" without having named which of the three applies.**

## Ownership guard — you may not own the whole diff

**Establish which files are YOURS before Step 1** — by diff CONTENT, never by status plane (`_shared/references/diff-ownership.md`): auto-staging lands your writes as `M ` identically to another writer's pre-existing staged work, so the plane misclassifies your own files as theirs and scopes every downstream step to nothing. Every writing step below assumes the diff is yours, and when it isn't the default behavior destroys work you can't see. Three tells, and the third has no other writer at all: a background `Agent` you spawned is still running · `git status` shows files you never touched (a parallel session) · **the tree carries uncommitted work predating this session**. That last one is the quiet case — nothing is racing you, so no guard trips, yet the exposure is identical.

| Step | Default (you own the whole diff) | When you don't |
|------|-----------------------------------|--------------------------|
| 1 (agents) | Partition the `git status --short` file list | Scope every agent to the files **you** changed and name the contested paths off-limits — a reviewer handed another session's uncommitted file will "fix" it. **A file partition does not scope a REPO-WIDE command: also ban `git stash`/`checkout -- .`/`reset`/`clean`/`restore` **by name** in every prompt, since a review agent with edit tools runs one as readily as a build agent and takes the unstaged, unrecoverable work with it** |
| 3+4 (skills) | `task-summary` bare, so it multi-domain scans | Do **not** invoke it unscoped — its scan edits the contested docs. Pass a scoped read-only verification arg and say why |
| Commit | — | Never `git add`/bare `git commit`: it sweeps the other writer's staged work into your commit. Explicit pathspec only (`git commit -m msg -- <your files>`) |

This generalizes the settled-file rule `update-claude-docs` Step 4 already applies to the pruner: **a writer reads a file when it starts, not when it finishes.**

## Step 1: Simplify + Review + Product Review (parallel)

Run all applicable agents **in parallel — every `Agent` call in ONE assistant message** (emission shape below). That single block IS the parallelism; no flag substitutes for it. Pass `run_in_background: false` on each (it expresses intent), but do not depend on it blocking — expect results as `<task-notification>`s and never poll for them.

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

**`browser-verifier` is NOT part of this step — it is opt-in, never auto-spawned.** It drives a real browser against a running app, so it is slow, needs the app up, and is meaningless on a backend-only diff. Spawn it **only when the user asked in words** — "the diff touches UI so they'd want runtime proof" is an inference, and inferring it is the auto-spawn this rule forbids. A UI diff is a reason to offer, never a reason to spawn. It is not counted in the agent table below and never partitioned. See `references/browser-verification.md`.

**Agent count — auto-scale by changed-file count, user arg overrides.** Count changed files first with **`git status --short`** (run it in EVERY repo of a multi-repo project), then pick agents-per-role:

⚠️ **`git status --short` is canonical — NOT `git diff --name-only`.** `diff --name-only` shows only unstaged changes to tracked files — new/staged files are invisible. If you staged before `/done`, it returns empty for the entire session's work — you then partition zero files, every agent reports clean on an empty slice, and `/done` passes having reviewed nothing. `git status --short` shows staged + unstaged + untracked with status letters. **Tell: the command returns nothing for work you just did.**

**If `git status --short` is empty because the session's work is already committed, it's not a clean tree — count off the session's base commit instead.** Running `/done` after committing as you go is a normal flow, and a legitimately empty `git status --short` here is the *correct* output but the *wrong* signal — committed work is invisible to it, same failure as the staged case above, different cause. Recovery: `git diff --name-only <base>..HEAD`, where `<base>` is HEAD at session start (or the merge-base with trunk if unknown). Partition and review those files exactly as you would an uncommitted diff.

| Changed files | Reviewers | Simplifiers | Product | TOTAL agents |
|---------------|-----------|-------------|---------|--------------|
| ≤30 | 1 | 1 | 1 | **3** |
| 31–80 | 2 | 2 | 1 | **5** |
| 81+ | 3 (cap) | 3 (cap) | 1 | **7** |

**The count is PER ROLE, and ALL agents go in ONE tool-call block.** N reviewers means N reviewers **AND** N simplifiers, plus the single product reviewer (never partitioned — it judges the whole feature).

**Emit them like this — the shape is the enforcement, not the intent:**

> The message that spawns agents contains **NO prose before the `Agent` calls** — no count, no plan, no "spawning N agents now". Open the message with the first `Agent` call and emit the rest back-to-back. Narration is what ends a message early; with nothing to finish saying, there is nothing to stop after call #1.

Anchor the emission to the Glob you just ran — each `.claude/agents/*.md` hit is one role, one call per hit (×N when the table says >1). **Already sent a short block by mistake? The next message is calls-only for the missing roles** — a serialised batch still completes; an abandoned one does not.

A user arg always wins: "2 agents each" / "4 each" sets the per-role count explicitly (ignore the table); a count is also implied by "split it up".

When count >1 per role, **partition the file list** across the same-role agents by domain/directory — each agent gets a disjoint slice (file count sets *how many*; domain sets *which files each gets*, so coupled files stay together). NEVER hand every same-role agent the full list: duplicated review + conflicting edits on the same file.

**Prompt for each must include:**
- The file slice this agent owns (full paths) — its partition, not the whole list when split
- For simplifier: focus on duplication removal, readability, pattern consistency
- For reviewer: focus on bugs, security, logic errors, project convention violations
- For product reviewer: name the **feature** built this session and its **task-doc path** (e.g. `tasks/admin/school-accounts/current.md`) so it reads the intent. It is NOT partitioned by file slice — it judges the whole feature's journey. Don't give it a file slice; give it the feature + doc.

> Project agents have a Bootstrap section — they read relevant CLAUDE.md files + the task doc themselves. Do NOT paste project conventions into the prompt.

**After all complete:**
- **Verify the SEAMS between partitions yourself — no agent owns them.** A file partition is also a blind spot: an agent given one side of a contract (backend, one layer, one repo) cannot see whether the other side consumes what it emits, so a half-built feature returns as two clean reports. Static gates span nothing here — a typed client silently drops a key it doesn't declare, and a new column/prop/response field can have a writer and no reader with everything green. For each value introduced this session, trace it to a *consuming* site (a render, a query, a branch), not just to its emitter. **Tell: two agents reported success on adjacent layers and you never opened the file where their work meets.**
- If reviewer found issues → **confirm the diagnosis against the file AS IT IS NOW, apply the fix, then re-run the failing thing and compare the count.** A finding is a claim, not a verdict (grep the call site / re-read the line); don't blind-apply, but don't dismiss either — a real bug a blanket `replace_all` left behind looks identical to a false positive until you check. ⚠️ **This step's own batch manufactures stale findings — the simplifier EDITS the files the reviewer READS, concurrently and by design.** A reported defect may already be fixed, and a fresh extraction can be reported as dead code. Where the two disagree on a remedy, **the one that executed code outranks the one that reasoned** — adopting the reasoned remedy can undo a correct fix. ⚠️ **A correct diagnosis licenses nothing about the remedy** — a suggested fix can cure the reported symptom and break something the failure was masking, and the new failure wears a different cause's clothes. The loop is confirm → fix → **re-run → count**; a fix whose command you never re-ran is unverified, however obviously right it looked.
- If simplifier made changes → verify they were applied (linter may have auto-formatted) AND that nothing was over-collapsed (an intentional guard/workaround removed). Re-run `php -l`/`tsc` on touched files — "declared but not used" = a half-done refactor. ⚠️ **Where an agent's mandate RESTRICTED what it may change (comments only, docs only, a file list, "don't touch logic"), a syntax gate cannot verify it and neither can its own report** — added code parses exactly as clean as deleted comments, so both come back green while the agent's summary asserts it stayed in bounds. Filter the diff to what the mandate ALLOWED and require the remainder to be empty (`git diff -U0` piped through a `grep -v` of the permitted line shapes). **Tell: you're about to relay an agent's "no code was changed" claim.**
- If product reviewer found gaps → **triage by KIND, not by which agent reported it.** The product reviewer reads the feature's intent rather than the diff, so it will routinely catch things a diff-scoped code reviewer structurally cannot — e.g. a sibling call site outside the diff that needed the same new parameter/rule and didn't get it. That is a correctness defect wearing a product-reviewer badge, not a scope question.
  - **Confirmed correctness/security defect** (a real bug, not a missing feature) → handle exactly like a code-reviewer finding: confirm against the actual code first (a finding is a claim, not a verdict), then fix it now. Do not downgrade it to a scope question just because the product reviewer found it.
  - **Genuine missing journey / UX / business-value gap** → unchanged: these are **product recommendations, not auto-fixes**. Do NOT silently build them. Surface 🔴/🟠 findings to the user and ask which to implement now vs add to the task doc's Next Steps — a missing journey is a scope decision the user owns. Confirm each gap is real (the deferral might be documented) before raising it.

## Step 2: Clean up temp code

Scan session for temporary artifacts that should be removed:

| Artifact | How to detect | Action |
|----------|--------------|--------|
| Test buttons / debug UI | `TEMP:`, `TODO: REMOVE`, `test buttons` in modified files | Ask user: "Remove temp test code from {file}?" |
| `console.log` debugging | `console.log` added this session | Remove unless intentional |
| Commented-out old code | Large commented blocks from migration | Remove if replaced |

**Skip if**: No temp artifacts found.

## Steps 3 + 4: Capture Knowledge + Update Task Docs (sequential — Step 3 before Step 4)

⚠️ **TWO skills, both mandatory — running only Step 3 and skipping the task doc is a common `/done` failure.** Tick both:

- [ ] Step 3 — `syafiqkit:update-claude-docs`
- [ ] Step 4 — `syafiqkit:task-summary`

⚠️ **Run Step 3 FIRST, then Step 4 — not in parallel.** Both skills scan the same conversation for the same class of signal and independently decide routing (CLAUDE.md vs. task doc) with no visibility into the sibling's decision — a parallel dispatch is two isolated routing judgments over shared state, not two independent tasks, and risks the same fact landing in both files or neither getting the version that should have deferred to the other. `update-claude-docs` decides what's broadly reusable; `task-summary`'s own rule ("only patterns that apply broadly go in CLAUDE.md") depends on that decision already being made, so Step 4 needs Step 3's result, not a race against it.

**Step 3 — Capture Session Knowledge → CLAUDE.md:**

```
Skill: syafiqkit:update-claude-docs
```

This is the **single** writer of CLAUDE.md / `CLAUDE.local.md` entries. It scans the FULL conversation for **both** conversational signals (user corrections, convention preferences, team/strategy context, things Claude got wrong) **and** code-level patterns (debugging root causes, env surprises, tool misuse), then handles dedup + routing to the narrowest scope. Do NOT pre-write CLAUDE.md entries in `/done` — delegate the whole capture to the skill, otherwise you force a "don't double-write" reconciliation.

**Invoke it BARE (no arg), or if you pass an arg keep it a HINT — never a scope limiter.** Handing the skill a pre-written arg that lists only this session's code facts silently narrows its scan and drops early-session behavioral misses (a wrong task-doc discovery, a source you checked wrong and the user corrected). Those "user had to correct" signals are the highest-value capture and the easiest to lose. If you do pass an arg, it must still say "and scan the full conversation for corrections/wrong-turns too."

⚠️ **Its summary is not your turn's ending — invoke Step 4 in this same turn.** Writing that summary is what makes the boundary feel terminal.

**Step 4 — Update Task Docs:**

Invoke `syafiqkit:task-summary` **with no args** — let the skill do a multi-domain scan.

**Why it scans**: Passing an explicit path skips the scan, causing missed updates to related docs (roadmaps, bug reports mentioned in chat that need stubs).

**`task-summary` already ran THIS session → invoke it scoped, not bare.** `/commit`'s staleness gate forces a full run **when it hits genuine prose staleness** (a run resolved only by the lexical carve-out invoked nothing — don't assume the gate firing means `task-summary` ran; confirm it did), and `/commit`+`/ship`+`/done` are routinely chained, so the docs are often already reconciled by Step 4. Pass an arg naming only what's NEW since that run (typically the product reviewer's gaps → Next Steps). The bare-scan rule above governs a COLD `/done`, not this case. A scoped invoke still counts as running the step; skipping it does not.

The skill auto-detects create vs update. Handles: path resolution, status updates, completed work, cross-references.

> Agent files no longer contain injected CLAUDE.md content — they read it dynamically. No agent syncing needed.

⚠️ **Same boundary as Step 3: `task-summary`'s closing validation is not your turn's ending — run Step 5's two gates in this same turn.**

## Step 5: Capture plugin learnings (Gate A rare · Gate B fires whenever a skill file was touched)

Steps 3+4 write to the *project*; this writes to the *plugin* — a global artifact shared across every project.

**TWO independent gates. Run BOTH — either one firing enters the step.**

**Gate A — does a real skill signal exist?** A skill misfired, a workflow step was wrong/missing, a trigger missed, or an absent rule caused a mistake. **Most runs have none — that is the expected case, so skip silently (no Output row).** Merely *using* skills successfully is not a signal; never manufacture one, since a thin patch to a shared skill is worse than no patch.

**The signal you CAUGHT still counts — it is the one Gate A keeps missing.** If you declined to follow a skill's step or worked around it, that IS the defect: you had the context to catch it, the next session won't. Ask: *did I deviate from any skill's written instructions this session, and why?* A deviation with a good reason is a skill that needs the reason written into it.

**A workaround you typed into an AGENT's prompt is the same signal, one level down.** If you had to hand-write an instruction to get an agent past something — an escape hatch, a correction to a doc it had believed, a recipe it couldn't derive — it still lacks that knowledge. The tell: a second agent spawned to redo what the first couldn't, with extra instructions. Ask: *what did I have to tell an agent that its own file or the project docs should have told it?* The fix belongs in the agent file or the docs — never in the prompt.

**Gate B — did this session WRITE to a skill file?** Measure it here, now — this gate is not satisfied by recalling whether you edited one:

```bash
# run from the plugin checkout (CWD), never `git -C <hardcoded path>` — that walks
# up to an enclosing ~/.claude repo and reports the dotfiles tree's status instead
git status --short -- 'skills/**/*.md' 'commands/*.md' '.claude/agents/*.md'
```

Not in the plugin repo this session? Then no skill file was hand-edited here and Gate B cannot fire — say so, rather than reaching for a path.

Any output → **a rule arrived by direct hand-edit, which is the dominant arrival path and the one Gate A cannot see.** A hand-edited rule is legitimate and usually earned; the point is not to refuse it but to make its arrival *visible*. Enter Step 5 and run `update-plugin`'s **Step 3a arrival-rate gate** against every file the command listed: for each file above ~90 B/L, the change must be a **replace** (a superseded rule removed), a **route** (moved to `references/`), or a **declared growth** with the reason no retirement applied. Compute the ratio, don't estimate it:

```bash
for f in <the files listed above>; do echo "$(echo "scale=1;$(wc -c<$f)/$(wc -l<$f)"|bc) $f"; done
```

Gate B fires on a clean, successful session with no defect at all — that is the point. Skill files have run above 2:1 added-to-removed across every 7-day window measured so far, with most arrivals never reaching a checkpoint. **This gate sees only the files THIS session touched** — the corpus-wide ratio is `audit-instructions`' measurement, not one a single `/done` run can compute.

Either gate fires → invoke `syafiqkit:update-plugin`. It owns everything downstream: it probes ownership itself and branches — **owner** → patch the skill files + version bump + CHANGELOG; **consumer** → draft the finding and *offer to file it as a GitHub issue* upstream (asking first, posting under the user's own identity). Either way the finding survives.

**Gate B alone is a lighter run than Gate A**: there is no defect to capture, so the work is the accounting above plus the version bump — nothing else. A file that grew with no retirement available is an acceptable outcome **stated**, never a silent one. **If every touched file measured under ~90 B/L, the accounting is one line ("all under budget") — that is the complete, correct output, not a skipped step.** The gate scales with the file's density, not with the edit's size, so a typo fix in a lean skill costs one `wc -lc`.

**Do NOT hand-patch skill files from `/done`, and do NOT skip this step just because you're not the owner** — a defect hit by a real user is the most valuable kind.

## Exit gate — check BEFORE writing the Output

⚠️ **FIRST: is the WORK done, or just this skill's steps?** `/done` wraps up finished work — it is not a milestone marker for a slice of it. Re-read the approved plan (`~/.claude/plans/*.md` for this session) or the user's original request, and confirm every part was built. **A plan titled `X + Y` with only X built is not done**, however green X's tests are.

This check is not optional and not covered by the rows below — they audit whether *this skill* ran, never whether the *work* finished. `/done` is the one skill that manufactures evidence of completion (a ✅ summary table, a task doc reading "shipped", a Quick Start saying "commit it"), so running it early doesn't just mislead the user — it writes artifacts you will later read back and believe. Part-done → stop, finish the work, then invoke.

**Every row of the Output table below is a claim that a step ran.** Before writing it, verify each claim against what you ACTUALLY invoked this session — not what you intended to:

| Row | Only fillable if you actually... | Full-mode expectation |
|-----|----------------------------------|-----------------------|
| Simplify | spawned simplifier agent(s) **and gave them a simplifier prompt** | N simplifiers (N = the per-role count) |
| Review | spawned reviewer agent(s) **and gave them a code-review prompt** (bugs/security — NOT product gaps) | N reviewers |
| Product | spawned the product-reviewer agent **with a product prompt** | exactly 1 |
| Knowledge | invoked `syafiqkit:update-claude-docs` **and confirmed the target CLAUDE.md changed** (not just launched the skill) | 1 skill call, edits landed |
| Task docs | invoked `syafiqkit:task-summary` **and re-read the doc to confirm its `Last updated` + content actually changed** — invoking is not updating; a skill that ran as a separate process and silently no-op'd still reads as "invoked" | 1 skill call, doc verified changed |
| Plugin | invoked `syafiqkit:update-plugin` | Fires when **either** Step 5 gate does: a real skill signal (Gate A, usually absent) **or** this session having written to a skill/command/agent file (Gate B, measured by `git status`, not recalled). Omit the row only when both were checked and neither fired; never invent a patch to fill it. (Not-the-owner is NOT a reason to skip — the skill switches to upstream-report mode.) |

⚠️ **Verify the Knowledge/Task docs rows with `git -C "$(git rev-parse --show-toplevel)" diff HEAD --stat -- <repo-relative-path>`, never bare `git diff`.** Two blind spots make a landed write read as a missing one, both silent: a target staged earlier shows nothing in the unstaged plane, and a **pathspec resolves against CWD, not the repo root** — so a repo-relative path run from inside a subdirectory returns empty with exit 0. Anchoring to the toplevel closes both. **An empty result is inconclusive, never proof the write is missing** — fall through to a grep for the text you just wrote before concluding anything.

A row you cannot substantiate is a step you skipped — go run it now rather than writing `✅` beside it. If you spawned agents of only ONE role in Step 1, the step is half-run: spawn the missing role before proceeding. (Plugin is the one row where absence is the norm, not a miss.)

## Output

One combined table. Detail only what was actually WRITTEN or FIXED — never enumerate skipped signals or "nothing to do" rows beyond the status icon.

```
## /done Summary

| Step | Result |
|------|--------|
| Simplify | [changes made, or ✅ none needed; ➖ ops-only / infra-only] |
| Review | [issues found + fixed, or ✅ clean; docs-only ALSO appends the referential-integrity result; ops-only = live read-back] |
| Product | [🔴/🟠 gaps surfaced to user + decision, or ✅ journeys complete; ➖ if no project agent / infra-only / ops-only mode] |
| Cleanup | [removed, or ➖] |
| Knowledge | [N entries → target files, one line each; "0 new" if none] |
| Task docs | [doc path → one-line summary of the update] |
| Plugin | owner: [skill files patched + version bump] · consumer: [issue URL filed, or the report + why not] (**omit the row entirely** if Step 5 didn't fire) |
| User args | [what was done about them] (only if args passed) |
```
