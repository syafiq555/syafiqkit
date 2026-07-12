---
name: done
description: Post-task cleanup - simplify code, review changes, update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize".
---

# Post-Task Workflow

Execute all steps in sequence without pausing for confirmation.

| ❌ NEVER | ✅ ALWAYS |
|----------|----------|
| Omitting `run_in_background` on any Agent call | Pass `run_in_background: false` **explicitly** — omitting the flag has still returned an async task; only the explicit `false` reliably blocks |
| Run agents one at a time when independent | Two Agent calls in **same message** for parallel foreground execution |
| Report a step done when only PART of it ran (reviewers but no simplifiers; Step 3 but no Step 4) | Every step below is a CHECKLIST, not prose. Before reporting, tick each named part — a step with an unticked part is NOT done |

⚠️ **MANDATORY — the steps are a checklist; run them ALL, and verify before reporting.** Each multi-part step (Step 1's three lenses, Steps 3+4's two skills) is stated below as an explicit tick-list; the Output table's row is only fillable once its part actually ran. If a part is deliberately skipped, the row says `➖ <reason>` — never leave it silently blank.

**User args**: If the user passed instructions with `/done` (e.g., "make sure this works for X"), address those FIRST before proceeding with the standard steps. The user's instructions override defaults. Record what you did about them in the **User Instructions** table of the Output. If no args were passed, omit that table.

## Mode selection (decide first)

**Light mode** when the session touched **<5 files in a single domain** AND no new feature/architecture was introduced (bug fix, small tweak, config change):
- Step 1: ONE reviewer agent only (skip the separate simplifier — tell the reviewer to also flag obvious duplication; skip the product reviewer — a trivial fix has no new feature journey to judge).
- ⚠️ **Exception — a small diff that EXPOSES or CHANGES a user-facing capability is NOT light** (a new toggle/button/field/route, a status control, anything a user now acts on). File count measures diff size, not journey significance — a one-line change can complete or fake a whole journey. Run the product reviewer (go full mode for Step 1) even at 1 file.
- Step 4: invoke `syafiqkit:task-summary` WITH the known doc path (skip the multi-domain scan — you already know the one affected doc).
- Output: the compact single-table form (see Output).

**Docs-only mode** when the diff is **entirely documentation** — `*.md` only (task docs, CLAUDE.md, README), zero application code (`git diff --name-only` shows no `.php`/`.ts`/`.tsx`/etc.):
- Step 1: **skip all three code agents** — simplifier/reviewer/product-reviewer audit *code*; there is none. Running them against markdown is theater. Instead run a **referential-integrity check** yourself (the real "review" for docs): no broken `tasks/**/current.md` or `CLAUDE.md` links, renamed/deleted paths fully reconciled (0 stale refs), anchors unique, `> 📖` pointers resolve.
- Steps 2-4 as normal (temp-artifact scan rarely applies to docs; knowledge capture + task-doc reconciliation still run).
- Output: mark Simplify/Review/Product as ➖ with reason "docs-only, no code"; report the integrity-check result on the Review row.
- ⚠️ **Exception — a doc edit that DOCUMENTS new code shipped this session** (you wrote both code and its doc) is NOT docs-only; the diff includes code, so use Full/Light by file count.

**Infra-only mode** when the diff is **entirely deploy/build/CI plumbing** and no application code — CI workflows (`.github/workflows/*.yml`, `.circleci/`), `docker-compose*.yml`/`Dockerfile`, build config (`next.config.*`, `vite.config.*`), nginx/env config. The **mirror image of docs-only**: docs need no reviewer; infra needs *only* the reviewer, and needs it badly.
- Step 1: **reviewer ONLY.** Skip the simplifier (no logic to DRY) and the product reviewer (no user journey). Size-independent — the trigger is file KIND, not count.
- ⚠️ **Prompt the reviewer adversarially: infra fails SILENTLY.** A broken deploy step exits 0 and reports success (an `nginx -s reload` re-reading an orphaned inode), and lint/typecheck/tests all pass — review is the only thing that catches it. Give it the change's PURPOSE and what it must not break, and ask it to verify empirically rather than reason from docs. Beware blanket-applying one fix to every occurrence of a pattern: two call sites of the same command can need opposite treatments.
- Steps 2-4 as normal. Output: mark Simplify/Product as ➖ "infra-only".
- ⚠️ **Exception — a compose/env change that FLIPS A FEATURE FLAG on is NOT infra-only**; it exposes a user-facing capability → run the product reviewer (see Light mode's exception).

**Full mode** (default) for everything else — multi-file features, multi-domain sessions, anything with external inputs (WhatsApp/ClickUp pastes) that may need new doc stubs. When in doubt, full.

## Step 1: Simplify + Review + Product Review (parallel)

Run all applicable agents **in parallel** (single message, multiple Agent tool calls). Pass `run_in_background: false` explicitly on each — so results are available immediately, with nothing to poll or wait on afterward.

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

<example>
`Glob: .claude/agents/code-reviewer.md` returns a hit → spawn `subagent_type: "code-reviewer"`.
Same Glob returns nothing → spawn `subagent_type: "feature-dev:code-reviewer"`.
Run the Glob first every time — don't assume the project agent exists or doesn't.
</example>

**Agent count — auto-scale by changed-file count, user arg overrides.** Count changed files first (`git diff --name-only` + `git diff --staged --name-only`, unioned), then pick agents-per-role:

| Changed files | Reviewers | Simplifiers | Product | TOTAL agents |
|---------------|-----------|-------------|---------|--------------|
| ≤15 | 1 | 1 | 1 | **3** |
| 16–40 | 2 | 2 | 1 | **5** |
| 41+ | 3 (cap) | 3 (cap) | 1 | **7** |

⚠️ **The count is PER ROLE — it multiplies, it does not replace.** N reviewers means N reviewers **AND** N simplifiers, plus the single product reviewer. Spawning N agents *total* (all of one role) is the failure this table exists to prevent: at 41+ files, 3 agents is wrong — **7** is right. The product reviewer is always exactly 1 (it judges the whole feature, so it is never partitioned).

**Before sending the Agent calls, state the roll-call out loud**: "N reviewers + N simplifiers + 1 product = TOTAL." If that sentence doesn't name all three roles, you're about to under-run the step.

A user arg always wins: "2 agents each" / "4 each" sets the per-role count explicitly (ignore the table); a count is also implied by "split it up". Light mode (`<5` files) is the ONE case with an asymmetric count (1 reviewer + 0 simplifier) — it takes precedence over the table's top bucket.

When count >1 per role, **partition the file list** across the same-role agents by domain/directory — each agent gets a disjoint slice (file count sets *how many*; domain sets *which files each gets*, so coupled files stay together). NEVER hand every same-role agent the full list: duplicated review + conflicting edits on the same file. All agents run in ONE message (foreground, parallel).

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

Run both **in parallel** (single message, two Skill tool calls) — they are independent. Pass `run_in_background: false` explicitly if these dispatch as Agent calls. If you invoked one and not the other, the step is not done.

**Step 3 — Capture Session Knowledge → CLAUDE.md:**

```
Skill: syafiqkit:update-claude-docs
```

This is the **single** writer of CLAUDE.md / `CLAUDE.local.md` entries. It scans the FULL conversation for **both** conversational signals (user corrections, convention preferences, team/strategy context, things Claude got wrong) **and** code-level patterns (debugging root causes, env surprises, tool misuse), then handles dedup + routing to the narrowest scope. Do NOT pre-write CLAUDE.md entries in `/done` — delegate the whole capture to the skill, otherwise you force a "don't double-write" reconciliation.

⚠️ **Invoke it BARE (no arg), or if you pass an arg keep it a HINT — never a scope limiter.** Handing the skill a pre-written arg that lists only this session's code facts silently narrows its scan and drops early-session behavioral misses (a wrong task-doc discovery, a source you checked wrong and the user corrected). Those "user had to correct" signals are the highest-value capture and the easiest to lose. If you do pass an arg, it must still say "and scan the full conversation for corrections/wrong-turns too."

**Step 4 — Update Task Docs:**

Invoke `syafiqkit:task-summary` **with no args** in full mode — let the skill do a multi-domain scan. In **light mode**, pass the known doc path instead.

⚠️ **Why full mode scans**: Passing an explicit path skips the scan, causing missed updates to related docs (roadmaps, bug reports mentioned in chat that need stubs). Light mode is exempt because its trigger condition (single domain, no external inputs) rules those out.

The skill auto-detects create vs update. Handles: path resolution, status updates, completed work, cross-references.

> Agent files no longer contain injected CLAUDE.md content — they read it dynamically. No agent syncing needed.

## Step 5: Capture plugin learnings (CONDITIONAL — usually skipped)

Steps 3+4 write to the *project*; this writes to the *plugin* — a global artifact shared across every project.

**ONE gate: does a real skill signal exist?** A skill misfired, a workflow step was wrong/missing, a trigger missed, or an absent rule caused a mistake. **Most runs have none — that is the expected case, so skip silently (no Output row).** Merely *using* skills successfully is not a signal; never manufacture one, since a thin patch to a shared skill is worse than no patch.

⚠️ **The signal you CAUGHT still counts — that is the one this gate keeps missing.** If you declined to follow a skill's step, worked around it, or told the user "this skill's step doesn't apply here," that IS the defect: you had the context to catch it, and the next session won't. It feels like a win in the moment ("I handled it"), which is exactly why it gets filed as competence instead of a finding. Ask literally: *did I deviate from any skill's written instructions this session, and why?* A deviation with a good reason is a skill that needs the reason written into it.

Signal exists → invoke `syafiqkit:update-plugin`. It owns everything downstream: it probes ownership itself and branches — **owner** → patch the skill files + version bump + CHANGELOG; **consumer** → draft the finding and *offer to file it as a GitHub issue* upstream (asking first, posting under the user's own identity). Either way the finding survives.

⚠️ Do NOT hand-patch skill files from `/done`, and do NOT skip this step just because you're not the owner — a defect hit by a real user is the most valuable kind.

## Exit gate — check BEFORE writing the Output

⚠️ Every row of the Output table below is a claim that a step ran. Before writing it, verify each claim against what you ACTUALLY invoked this session — not what you intended to:

| Row | Only fillable if you actually... | Full-mode expectation |
|-----|----------------------------------|-----------------------|
| Simplify | spawned simplifier agent(s) | N simplifiers (N = the per-role count) |
| Review | spawned reviewer agent(s) | N reviewers |
| Product | spawned the product-reviewer agent | exactly 1 |
| Knowledge | invoked `syafiqkit:update-claude-docs` | 1 skill call |
| Task docs | invoked `syafiqkit:task-summary` | 1 skill call |
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
