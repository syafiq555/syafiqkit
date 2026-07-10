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

| Changed files | Agents per role (reviewer + simplifier) |
|---------------|------------------------------------------|
| ≤15 | 1 |
| 16–40 | 2 |
| 41+ | 3 (hard cap) |

A user arg always wins: "2 agents each" / "4 each" sets the count explicitly (ignore the table); a count is also implied by "split it up". Light mode (`<5` files) already means 1 reviewer + 0 simplifier — it takes precedence over the table's bottom bucket.

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

Run both **in parallel** (single message, two Skill tool calls) — they are independent. Pass `run_in_background: false` explicitly if these dispatch as Agent calls.

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
| User args | [what was done about them] (only if args passed) |
```
