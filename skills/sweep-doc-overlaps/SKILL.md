---
name: sweep-doc-overlaps
description: >
  Fleet-wide scan across ALL tasks/ domains to surface CROSS-domain doc merge candidates that a single-domain `merge-task-docs` invocation would never see (e.g. `payment/stuck-payment` overlapping `payment/gateway`, or a stray doc that belongs under a different domain entirely). Use when the user says "check for similar docs across domains", "find overlapping docs across the whole project", "sweep all task docs for merges", "is anything duplicated across domains", or asks a merge question without naming a specific domain/keyword. Hands the resulting candidate list to `merge-task-docs` for execution — this skill does discovery only, never writes/deletes docs itself.
---

# Sweep Doc Overlaps

Parallel fleet scan of every `tasks/<domain>/*/current.md` to find subsystem overlaps that cross domain boundaries. `merge-task-docs` already handles "merge these related docs" once a domain or keyword narrows the search — this skill is for the harder case: nobody knows yet which docs, in which domains, actually overlap.

## When to use this vs `merge-task-docs` directly

| Situation | Skill |
|---|---|
| User names a domain/keyword ("merge the payment docs") | `merge-task-docs` directly — no fleet scan needed |
| User wants the whole `tasks/` tree checked for overlap, no domain named | This skill first, then `merge-task-docs` per confirmed group |
| A `task-summary` update reveals two docs already say the same thing | `merge-task-docs` directly (already scoped) |

## Workflow

### Step 1 — Inventory

Delegate to `Explore`: list every `tasks/<domain>/<feature>/current.md`, plus `_archive/`, flat `tasks/<domain>/<feature>.md`, and `decisions/*.md` siblings, grouped by domain. Raw paths only, per `_shared/references/explore-delegation.md`.

### Step 2 — Fan out verification + candidate-finding

Split the domain list into N batches (aim for ≤6 domains per batch so each agent's context stays light) and dispatch one `Explore` agent per batch (one-message parallelism rule: `_shared/references/explore-delegation.md`). Safe to fan out freely here — a read-only sweep has no file-partition conflict to worry about.

Each agent's prompt must:
1. `ls` (never `find`/`grep` for existence) its assigned domain dirs to confirm the Step 1 inventory is still accurate — flag any drift.
2. Read each `current.md`'s LLM-CONTEXT block (Status/Domain/Related) and Overview — skim, not deep-read every line.
3. Read a few docs from **other** domains for cross-comparison where a hypothesis is plausible (e.g. does `communication/email-preferences` overlap `ui/email-templates` or `superadmin/email-management`?).
4. Apply `merge-task-docs`'s own merge test — don't restate it from memory, point the agent at the one canonical definition: `Read merge-task-docs/SKILL.md`'s "When to merge vs when to keep separate" section first.
5. Return a table: candidate pair/group, one-line reason, verdict (merge / keep separate) — plus the freshness check result.

⚠️ **Deliberate departure from `explore-delegation.md`'s gather-only rule.** That reference says Explore should return raw hits, never a verdict — judgment stays inline. Here the verdict is left in-agent anyway: a real cross-domain hypothesis (do these two docs describe the same subsystem?) needs the full doc content in context to judge, and re-collecting that content inline after every batch would mean reading the same docs twice. The one canonical merge-test pointer (step 4) keeps the verdict criteria consistent across agents despite the delegation; treat each batch's verdict as provisional and spot-check a candidate before handing it to `merge-task-docs`.

⚠️ **Batching by domain, not by hypothesis** — a real cross-domain overlap (e.g. `statement/agency-leaderboard` belonging in `report/pm-reports`) only surfaces if the agent holding one domain also reads the other. Tell each agent explicitly which sibling domains to cross-check, based on plausible subsystem overlap (shared nouns in the domain names, or known shared tables from CLAUDE.md) — don't just hand it its batch and hope.

### Step 3 — Compile and present

Collect all batch reports. Keep only candidates where the verdict is **merge** — the "keep separate, confirmed correctly scoped" rows are noise once compiled (don't dump all ~20 non-candidates back to the user; one line summarizing "N pairs checked, correctly separated" suffices). If any batch flagged inventory drift, surface it as a note above the table before presenting candidates.

Present the surviving candidates as one table, same format as `merge-task-docs` Step 2:

```
| Source | Merge Into | Reason |
|--------|-----------|--------|
| payment/stuck-payment, payment/consolidated-payment | payment/gateway → payment/module | Same 2C2P callback pipeline, same tables, explicit mutual Related refs |
| statement/agency-leaderboard | report/pm-reports | Planned Phase-2 SA view, explicitly reuses IncomeCalculationService + existing UI pattern |
```

### Step 4 — Hand off

Don't merge inline. For each confirmed group, invoke `merge-task-docs` (Skill tool) with that specific source/target pair — it owns the actual read-full/write/delete/reconcile workflow, its own `AskUserQuestion` forks (scope/structure/naming), and back-reference sweep. Running the merge logic here would duplicate it and risk drifting out of sync. Zero confirmed groups → the Step 3 summary line is the terminal output; nothing to hand off.

## Rules

| ❌ Never | ✅ Always |
|---|---|
| Merge or delete anything from this skill | Discovery only — hand confirmed groups to `merge-task-docs` |
| Batch by "likely overlap topic" | Batch by domain (file-partition, no write conflict) and tell each agent which siblings to cross-check |
| Report all ~20+ "keep separate" verdicts back to the user in full | Compile to one summary line; only show the table of actual merge candidates |
| Let an agent restate the merge test from memory | Point it at `merge-task-docs/SKILL.md`'s own section — one canonical definition |
| Assume the Step 1 inventory is still accurate | Each batch agent `ls`'s its own domains and flags drift |
