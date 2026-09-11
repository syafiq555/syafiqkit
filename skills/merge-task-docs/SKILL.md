---
name: merge-task-docs
description: >
  Find related task docs that should be merged together, merge them into a single coherent document, delete the sources, and reconcile all back-references to the deleted paths. Use this whenever the user says "merge these docs", "find payment docs and merge", "consolidate task docs", "combine related docs", "find all X docs and merge", "these docs overlap, merge them", or asks to clean up / reduce the number of task docs in a domain. Also use it proactively when a task-summary update reveals that a doc's content already lives in another doc — don't just update both, propose a merge.
---

# Merge Task Docs

Combines related `current.md` task docs into fewer, more complete documents. After merging: the source doc is deleted (no redirect stubs — a stub surviving past its own merge is clutter, not discoverability; Step 6's reconciliation is what replaces it), all back-references point to the new path, and the merged doc reads as a single coherent current-state document — not two docs stapled together.

## Merge Fit — Subsystem Test

Merge when two docs share the **same subsystem** — same DB tables, same service classes, same user journey, or same deploy lifecycle. The test: would a future session editing one doc almost certainly need to read the other? If yes, merge.

**Subsystem coupling beats keyword overlap.** "Payment" appears in 10 docs, but that doesn't mean they merge — `bank-warning` and `payout` both touch the `agencies.bank_warning_sent_at` → `payouts` lifecycle, so they share a subsystem and belong together, while a generic "payment feature" keyword links unrelated docs. Merge on subsystem boundary, not keyword.

Keep separate when docs are **topically adjacent** only — they share a keyword but live in different subsystems, have different deployment cadences, or would create a doc >300 lines after merging two already-dense sources (Step 2's structure fork addresses this case).

**Examples of good merge signals:**
- Both docs reference the same model/table/service as their primary concern
- One doc is a "UI layer on top of" another (payout PM visibility + payout disbursement = same `payouts` table)
- One doc is a "sub-concern" of another (gateway channel config + gateway integration = same 2C2P system)
- One doc is a "debugging tool for" another (analytics instrumentation + stuck payment = same triage loop)
- One doc is the "customer-facing framing of" another (fee FAQ + fee passthrough engineering = same canonical fact)

## Workflow

### Step 1 — Read all candidates

When given a domain or keyword (e.g. "all payment docs"), delegate the file-listing to the `Explore` agent to list every `tasks/<domain>/*/current.md` and any flat/archive docs, then read them yourself before deciding anything. Don't merge based on titles alone.

**Watch for dead redirect stubs from a PRIOR merge** — a doc whose entire body is "# Merged into: ..." or "content now lives at X". Delete these (same as Step 5) and reconcile what still points at them (same as Step 6), even if they're outside this session's scope. Check actively rather than only avoiding creating new ones.

### Step 2 — Build a merge plan and confirm decisions

Present a table to the user before writing:

```
| Source | Merge Into | Reason |
|--------|-----------|--------|
| gateway-config | gateway | Channel config is a sub-concern of the 2C2P gateway system |
| payout-visibility | payout | PM listing/export is a UI layer on the same payouts table |
```

Also list what stays standalone and why. Confirm three decisions explicitly:

1. **Scope** — does the proposed grouping match the user's intent? If the user requests a different grouping against the subsystem test, pause and confirm tradeoffs rather than silently complying.
2. **Structure** — if merged docs would exceed 300 lines combined, choose between: condense aggressively (if bloat exists) or split into index + `decisions/<theme>.md` theme files (if facts are dense and neither source is verbose). Decide before writing either.
3. **Naming** — if the merge changes canonical paths, ask explicitly for the merged doc's name rather than assuming the richest source doc's path.

Each decision needs a recommended option so the user can accept by default. Don't proceed without confirmation.

### Step 3 — Scan back-references BEFORE writing

For every source doc being deleted, delegate the grep sweep to the `Explore` agent to return raw `file path + line + matched line` for every reference. Build the "needs updating" set from the agent's results before writing anything — do not duplicate the grep inline.

**List every file in each source folder, not just `current.md`.** A task folder holds sibling files (`stories.md`, `script.sql`, screenshots) that a plain scan never reads, and Step 5's `rm -rf` deletes the whole folder unreviewed. For each non-`current.md` file: read it, then fold its content into the merged doc or a theme file, or verify it can be deleted cleanly.

### Step 4 — Write the merged docs

For each merge group:

1. **Read both docs in full** before writing.
2. **Read `task-summary/references/templates.md`** for structure: section headings, table columns, MADR layout, Density Rules (one fact per home, ≤15-line Quick Start, rows ≤2 sentences). Don't paraphrase — copy the authoritative rules.
3. **Choose the canonical path** from Step 2's naming decision, or keep the richer doc's path if no renaming was confirmed.
4. **Write the merged doc** matching `templates.md`: LLM-CONTEXT (`Status`, `Domain`, `Related`, `Last updated`), Quick Start, Overview, Architecture, Files, Task Status, Key Technical Decisions, Critical Gotchas, Next Steps, Last Session. Regroup multi-doc Next Steps by kind of work (task-summary template), not by source doc. Strip `<content>` tags from `Read` results before writing.
5. **Merge sections without duplication** — one Gotchas table, one Files map, never per-doc subsections. Absorb rows from both sources.
6. **Last Session** notes the merge. Check if any source doc is contested (a peer's uncommitted work) — fold contested sections into typed sections instead of collapsing them. Don't preserve both docs' Last Session entries where uncontested.
7. **Size check before writing** — measure source docs' line counts. If the sum + 10% padding exceeds 300, decide: condense (if bloat exists) or split structurally (if facts are dense and neither is verbose).
   - **Condense**: collapse completed Task Status rows, trim Files to living map, cut Gotchas to rule+symptom. Structure stays flat.
   - **Structural split**: use `task-summary/references/decision-splits.md` pattern. Index keeps Quick Start + doc-wide operational tables + routing table. `Task Status`, `Bugs Fixed`, `Critical Gotchas`, `Next Steps` stay in index (scoped to cross-cutting items). `Next Steps` includes one-line entries pointing to theme files (so readers don't open four files for status). Add 3–5 `decisions/<theme>.md` theme files, each self-contained with own LLM-CONTEXT and `Related:` pointer back to index.

### Step 5 — Delete source docs

Before deleting, confirm every folder file was accounted for in Step 3 (carried forward or absorbed). Then re-check ownership here at delete-time: a source folder can be contested by work that never touched Last Session. Run the diff-ownership check against each source folder; if contested, skip the delete, leave the merged doc alongside it, and record the delete as owed in Next Steps. Merging without deleting is recoverable; deleting a peer's uncommitted work is not.

```bash
rm -rf tasks/<domain>/<source-feature>/
```

**No redirect stubs.** Step 6's back-reference reconciliation replaces discoverability — stubs are clutter.

### Step 6 — Reconcile ALL back-references

For every deleted path, update every file that referenced it:

- `Related:` fields in other task docs
- Inline path mentions (`tasks/payment/analytics-instrumentation/current.md`)
- Domain `CLAUDE.md` pointers
- Roadmap/hub tables

After updating, verify zero stale references remain:

```bash
grep -rn "tasks/<domain>/<deleted-feature>" /path/to/tasks/ /path/to/app/
grep -rn "current.md" /path/to/tasks/ | head -1   # control: sanity check the search works
```

Confirm the control returned a hit before trusting a zero on the deletion check — a broken search is indistinguishable from a clean tree once docs are deleted.

### Step 7 — Validate

For each merged doc, verify:
- LLM-CONTEXT: Status, Domain, Related, Last updated = today
- Quick Start answers: next action, current state, gotchas, success criteria
- No section duplicates another's content
- No rows deleted from source docs
- Last Session notes the merge
- No `</content>` wrapper tag at file end

**Absence gate** — the checks above find excess, not missing sections. A merge that drops a whole section type passes them cleanly because the content still exists somewhere else. Run an additive check: extract section headings from the merged doc, then from each source doc. Every section TYPE in any source must survive somewhere, and `Task Status` / `Bugs Fixed` / `Critical Gotchas` / `Next Steps` must be in the index, not only in `decisions/*.md` theme files.

## Output

Tell the user:
- What was merged into what (the table from Step 2)
- How many docs went from N → M
- Zero stale back-references confirmed

📖 `references/checklist.md` — implementation checklist and rules as a quick reference for repeated runs, after you've learned the workflow once.

