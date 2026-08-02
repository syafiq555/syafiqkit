---
name: done
description: Post-task cleanup - simplify code, review changes, update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize".
---

# Post-Task Workflow

Execute all steps in sequence without pausing for confirmation.

⚠️ **Ending the turn with steps outstanding is a pause, even when you announce it and ask nothing** — 📖 `../_shared/references/one-turn-chain.md`. This bites hardest at the sub-skill RETURN boundaries (3→4, 4→5): `update-claude-docs` and `task-summary` each close with a summary of their own writes, and that summary reads like the end of the turn even though the next step hasn't run. Treat any sub-skill's closing output as mid-turn, and if your reply is naming a remaining step rather than performing it, that's the pause.

**`run_in_background: false` is not a guarantee the call blocks** — [subagents run in the background by default since v2.1.198](https://code.claude.com/docs/en/sub-agents), and [#69691](https://github.com/anthropics/claude-code/issues/69691) reports `false` is ignored in top-level sessions. Pass it anyway to express intent, but expect results as `<task-notification>`s regardless — see Step 1 for what that means in practice.

Two structural rules get their full reasoning where they're used rather than restated here: batch emission shape (Step 1's emission block — the message shape is the enforcement, not the stated rule) and step completeness (the Exit Gate section — a step with only part of its checklist ticked isn't done, and gets said there in the depth it needs).

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

**An empty `git status --short` doesn't by itself select a no-code mode — it means three different things and only one of them is ops-only.** Work can be already committed this session (full mode, count off the base commit — recovery command in Step 1's Agent-count section), or it can be another writer's tree you don't own (see the ownership guard below), or the session genuinely never touched the repo (ops-only). Name which one applies before treating "nothing to review" as the answer.

## Ownership guard — you may not own the whole diff

**Establish which files are YOURS before Step 1** — by diff CONTENT, never by status plane (`../_shared/references/diff-ownership.md`): auto-staging lands your writes as `M ` identically to another writer's pre-existing staged work, so the plane misclassifies your own files as theirs and scopes every downstream step to nothing. Every writing step below assumes the diff is yours, and when it isn't, the default behavior destroys work you can't see.

The question to keep asking, for every file and every hunk in it, is: does this diff content trace to something *this session* wrote? A clean "no" is the easy case. What's easy to miss is that the answer can be "partly" — a background `Agent` you spawned still running, `git status` showing files you never touched at all (a parallel session), a tree that already carried uncommitted work before this session started, or two sessions having edited the *same file*, so the content itself is a mix and no pathspec or file list can cleanly separate the two (the Commit row below covers what to do about that case). None of these are a fixed checklist to match against — they're what "not fully yours" has looked like in practice, and a case that doesn't resemble any of them still needs the same question asked, not a pass because it didn't match a named pattern.

| Step | Default (you own the whole diff) | When you don't |
|------|-----------------------------------|--------------------------|
| 1 (agents) | Partition the `git status --short` file list | Scope every agent to the files **you** changed and name the contested paths off-limits — a reviewer handed another session's uncommitted file will "fix" it. **A file partition does not scope a REPO-WIDE command: also ban `git stash`/`checkout -- .`/`reset`/`clean`/`restore` **by name** in every prompt, since a review agent with edit tools runs one as readily as a build agent and takes the unstaged, unrecoverable work with it** |
| 3+4 (skills) | `task-summary` bare, so it multi-domain scans | Do **not** invoke it unscoped — its scan edits the contested docs. Pass a scoped read-only verification arg and say why |
| Commit | — | Never `git add`/bare `git commit`: it sweeps the other writer's staged work into your commit. An explicit pathspec (`git commit -m msg -- <your files>`) works when the split is file-level. When it isn't — the same file carries both sessions' work — no pathspec separates them: stop, describe the other work to the user, and let them decide rather than committing any slice of that file |

This generalizes the settled-file rule `update-claude-docs` Step 4 already applies to the pruner: **a writer reads a file when it starts, not when it finishes.**

## Step 1: Simplify + Review + Product Review (parallel)

Run all applicable agents **in parallel — every `Agent` call in ONE assistant message** (emission shape below). That single block IS the parallelism; no flag substitutes for it. Pass `run_in_background: false` on each to express intent, but expect results as `<task-notification>`s regardless (see the header note above on why).

The three roles are deliberately different lenses, not redundant — which is also why each one needs a prompt actually shaped for its own lens, not a generic "review this":
- **Simplifier** — is the code *clean*? (duplication, readability)
- **Reviewer** — is the code *correct*? (bugs, security, conventions)
- **Product reviewer** — is the *feature* complete and valuable? (missing journeys, dead-end flows, UX/business gaps the engineer forgot to build — the class of miss a line-level diff structurally cannot catch, e.g. a CRUD with no "create" button). Runs in **full mode only**, and **only if a project `.claude/agents/product-reviewer.md` exists** (it carries project-specific product context — there's no generic fallback; skip silently if absent).

Handing product-review content to a `code-reviewer` `subagent_type` (or the reverse) doesn't get caught downstream — the agent runs, returns something, and every later check sees "this role was spawned," even though the role that was actually asked for never ran on the content it needed to see. Match the prompt's content to the `subagent_type` you're calling, not just to the role you have in mind.

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

**Agent count — auto-scale by changed-file count, user arg overrides.** Count changed files first with **`git status --short`** (run it in EVERY repo of a multi-repo project), then pick agents-per-role. "Multi-repo" here isn't limited to a project's known sub-repos — a global dotfiles checkout (`~/.claude`) or a separately-cloned plugin repo sits outside the project directory entirely, so a session that writes to one has touched a git tree no `Glob`/directory walk from the project root will ever surface.

⚠️ **`git status --short` is canonical — NOT `git diff --name-only`.** `diff --name-only` shows only unstaged changes to tracked files — new/staged files are invisible. If you staged before `/done`, it returns empty for the entire session's work — you then partition zero files, every agent reports clean on an empty slice, and `/done` passes having reviewed nothing. `git status --short` shows staged + unstaged + untracked with status letters. **Tell: the command returns nothing for work you just did.**

**For the "already committed" case named in mode selection above**: count off the session's base commit instead of the working tree. Recovery: `git diff --name-only <base>..HEAD`, where `<base>` is HEAD at session start (or the merge-base with trunk if unknown). Partition and review those files exactly as you would an uncommitted diff.

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

A finding, a fix, and anything built in response to one are three separate moments — the agents only ever saw the first. Everything downstream of that moment (a fix you apply, code the user asks you to build off a gap, a second pass over the same file) is new content no agent has read, and it stays that way until something reviews it again. Below are the shapes this takes in practice; treat a case that isn't literally one of them as needing the same question asked, not as clear by default.

- **Cross-partition seams**: an agent given one side of a contract (backend, one layer, one repo) can't see whether the other side consumes what it emits, so a half-built feature returns as two clean reports — a typed client silently dropping a key it doesn't declare, a new column/prop/response field with a writer and no reader, both invisible to a static gate. For each value introduced this session, trace it yourself to a *consuming* site, not just to its emitter — the tell is two adjacent-layer reports both green and you never opened the file where their work actually meets.
- **A reviewer finding, by the time you act on it**: confirm the diagnosis against the file as it stands *now* — the simplifier is editing concurrently, by design, so a reported defect may already be fixed and a fresh extraction can be misreported as dead code. Where the two disagree on a remedy, the one that executed code outranks the one that reasoned — but that tie-breaker assumes only one side ran something; when both did, what decides is whose probe was isolated from the subject (`../_shared/references/probe-isolation.md`). Then apply the fix and re-run the failing thing to compare the count; a fix whose command you never re-ran is unverified however obviously right it looked, and a diagnosis being correct says nothing about whether the remedy is safe — it can cure the symptom and break something the original failure was masking. If that re-run takes minutes and touches shared state (a test DB, a build dir), serialize it — a racing second copy corrupts both and reads as a fresh code defect (`../_shared/references/long-running-commands.md`).
- **A simplifier's own changes**: verify they landed (a linter may have auto-formatted on top) and that nothing load-bearing got collapsed with the duplication. Re-run `php -l`/`tsc` — "declared but not used" is a half-done refactor. When an agent's mandate was restricted (comments only, docs only, a named file list), neither a syntax gate nor the agent's own summary can confirm it stayed in bounds — added code parses exactly as clean as deleted comments. Filter the diff to what the mandate allowed and require the remainder to be empty before trusting a "no code was changed" claim.
- **A product-reviewer gap, once triaged**: triage by kind, not by which agent found it — a sibling call site outside the diff that needed the same new rule and didn't get it is a correctness defect wearing a product-reviewer badge, not a scope question, so confirm and fix it like any other reviewer finding. A genuine missing journey stays a recommendation, never an auto-fix — surface it and let the user decide what to build now vs. defer to the task doc's Next Steps, after confirming the gap is real (the deferral might already be documented).
- **Whatever this loop itself produces**: a fix, or a feature the user asked you to build off a surfaced gap, is exactly the same kind of unreviewed content as the rest of this list — it just arrived a step later. If the session's remaining work is more than a one-line patch, treat it as a slice this step hasn't covered yet rather than closing the loop on the strength of the original agents' reports.

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

**Step 4 — Update Task Docs:**

Invoke `syafiqkit:task-summary` **with no args** — let the skill do a multi-domain scan.

**Why it scans**: Passing an explicit path skips the scan, causing missed updates to related docs (roadmaps, bug reports mentioned in chat that need stubs).

**`task-summary` or `update-claude-docs` already ran THIS session → invoke it scoped, not bare.** Two routes reach this state: `/commit`'s staleness gate forcing a full run **when it hits genuine prose staleness** (a run resolved only by the lexical carve-out invoked nothing — don't assume the gate firing means `task-summary` ran; confirm it did), and a session that invoked the doc skills by hand before reaching `/done`. Either way the docs are often already reconciled by Step 4. Pass an arg naming only what's NEW since that run (typically the product reviewer's gaps → Next Steps). The bare-scan rule above governs a COLD `/done`, not this case. A scoped invoke still counts as running the step; skipping it does not.

The skill auto-detects create vs update. Handles: path resolution, status updates, completed work, cross-references.

> Agent files no longer contain injected CLAUDE.md content — they read it dynamically. No agent syncing needed.

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

Output here is a starting point, not a verdict — that checkout is shared by every project, so it routinely carries another session's uncommitted work, and a file you only *read* this session looks identical to one you wrote. Settle it by mtime against when this session began before treating the gate as fired; on macOS that's `stat -f '%Sm' -t '%m-%d %H:%M' <file>` (BSD `stat`, so the GNU `ls --time-style=...` spelling silently prints nothing). Files predating the session, or ones you recognise as untouched, drop out — if that empties the list, Gate B did not fire, and saying so is the complete answer.

Any surviving output → **a rule arrived by direct hand-edit, which is the dominant arrival path and the one Gate A cannot see.** A hand-edited rule is legitimate and usually earned; the point is not to refuse it but to make its arrival *visible*. Enter Step 5 and run `update-plugin`'s **Step 3a arrival-rate gate** against every file the command listed: for each file above ~90 B/L, the change must be a **replace** (a superseded rule removed), a **route** (moved to `references/`), or a **declared growth** with the reason no retirement applied. Compute the ratio, don't estimate it:

```bash
for f in <the files listed above>; do echo "$(echo "scale=1;$(wc -c<$f)/$(wc -l<$f)"|bc) $f"; done
```

Gate B fires on a clean, successful session with no defect at all — that is the point. Skill files have run above 2:1 added-to-removed across every 7-day window measured so far, with most arrivals never reaching a checkpoint. **This gate sees only the files THIS session touched** — no single `/done` run can compute the corpus-wide ratio.

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

⚠️ **Verify the Knowledge/Task docs rows with `git -C "$(git rev-parse --show-toplevel)" diff HEAD --stat -- <repo-relative-path>`, never bare `git diff` — and treat an empty result as inconclusive, never as proof the write is missing.** Three causes return empty with exit 0, and a gitignored target (`CLAUDE.local.md`) can NEVER be shown by any git command — grep is its only verification: `../_shared/references/verifying-a-write-landed.md`.

A row you cannot substantiate is a step you skipped — go run it now rather than writing `✅` beside it. If you spawned agents of only ONE role in Step 1, the step is half-run: spawn the missing role before proceeding. (Plugin is the one row where absence is the norm, not a miss.)

⚠️ **Spawning is not running — an agent that returns a FAILURE instead of findings leaves its row unfillable, and `✅ none needed` there is a false completion claim.** A role whose agent died produced no findings, which is indistinguishable in the Output table from a role that found nothing. Re-run the role. When the cause is the agent's own definition, editing that file does not take effect this session — the registry is read at session start — so re-run the ROLE as `general-purpose` with an explicit `model:` matching what the agent file pins, and fix the file for next time. But when the failure is a spawn/routing fault rather than a definition problem — an opus-pinned role 400ing with `effort 'max' not supported when thinking is disabled` is the recurring shape — matching the same model tier reproduces the identical fault; re-dispatch on a different tier (`general-purpose model: "sonnet"`) instead of retrying opus a second way. **Tell: you are writing a `✅` for a role whose agent you never saw return findings, or your retry changed the wrapper but not the model tier that actually faulted.**

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
