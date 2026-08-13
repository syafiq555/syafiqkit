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

When given a domain or keyword (e.g. "all payment docs"), delegate the file-listing to the `Explore` agent (`Agent({subagent_type: "Explore", run_in_background: false, prompt: "List every tasks/<domain>/*/current.md file, plus any _archive/ or flat tasks/<domain>/<feature>.md docs. Return file paths only, no summaries."})`), then Read them all yourself before deciding anything — the merge-fit judgment stays inline. Don't merge based on titles. While that agent runs, don't re-`Glob`/re-grep the same tree inline — wait for its report rather than duplicating the gathering. Delegation rules: `../_shared/references/explore-delegation.md`.

**Watch for dead redirect stubs from a PRIOR merge** — a doc whose entire body is "# Merged into: ..." or a one-line "content now lives at X" table. These aren't merge candidates, they're cleanup: delete them now (same as Step 5) and reconcile whatever still points at them (same as Step 6), even if nothing else in this session's merge touches that domain. Check for these actively rather than only avoiding creating new ones.

### Step 2 — Build a merge plan and confirm three decision forks

Present a table to the user before writing a single file:

```
| Source | Merge Into | Reason |
|--------|-----------|--------|
| gateway-config | gateway | Channel config is a sub-concern of the 2C2P gateway system |
| payout-visibility | payout | PM listing/export is a UI layer on the same payouts table |
| analytics-instrumentation | stuck-payment | PostHog funnel is a triage tool for stuck payments |
| fee-faq | platform-fee-passthrough | Customer FAQ is the outward-facing framing of the same fee mechanics |
```

Also list what stays standalone and why.

Confirm via `AskUserQuestion` — not a flat "does this look right?" — raising three distinct decision forks, each at the point the merge plan reveals it:

1. **Scope** — does the proposed grouping match what the user wants merged? Options: your recommended grouping (subsystem reasoning as the description) vs. a broader/narrower alternative vs. "no merge, just tidy." If the user pushes back (e.g. picks "merge everything" against the subsystem test), don't silently comply — pause and confirm the resulting tradeoffs.
2. **Structure** — merged docs approaching 300 lines or exceeding it signal a choice: condense aggressively (if bloat exists) or split into index+`decisions/<theme>.md` (if facts are dense and neither doc is verbose). Ask flat-with-overage vs. split, before writing either. 📖 See Step 4.7–4.8 for when each applies.
3. **Naming** — if the merge changes canonical paths, ask explicitly rather than assuming the richest source doc's name is good enough. Offer 2-3 options with a Recommended pick and reasoning.

Each question needs a Recommended option so the user can accept-by-default — but a strong recommendation still isn't an answer. Don't proceed past a fork without one, and treat an answer that names a constraint on HOW ("not a generic name", "keep it under X") as governing the whole run, not just one option.

### Step 3 — Scan back-references BEFORE writing

For every source doc being deleted, delegate the back-reference grep sweep to the `Explore` agent (Step 6 judges which hits matter, inline). Don't re-grep the same paths inline while it runs — wait for its raw hit list instead. Delegation rules: `../_shared/references/explore-delegation.md`.

```
Agent({subagent_type: "Explore", run_in_background: false, prompt: "Using grep -rn (never rg), search /path/to/tasks/ and /path/to/app/ for every occurrence of these paths/names: tasks/payment/analytics-instrumentation, analytics-instrumentation, tasks/payment/bank-warning, bank-warning. Return every file path + line number + matched line, verbatim. Do not summarize or filter — return the raw hit list. If output looks truncated, redirect to a temp file and Read it back before returning."})
```

Build the "needs updating" set from the agent's raw file+line list yourself, before the merge writes.

**`ls` every source folder now, not just its `current.md`.** A task folder can hold sibling files a plain domain/feature scan never reads (`stories.md`, `script.sql`, screenshots, exported data), and Step 5's `rm -rf` deletes the whole folder — a file never opened is destroyed with zero chance to review first. For each non-`current.md` file found: read it, then fold its content into the merged doc/a theme file, or copy it forward unchanged.

### Step 4 — Write the merged docs

For each merge group:

1. **Read both docs in full** before writing anything.
2. **Read `task-summary/references/templates.md`** — canonical source for section headings, table column names, field order, MADR-block structure, and the Density Rules (one fact one home, ≤15-line Quick Start, `Last updated` never restates commit/deploy status, rows ≤2 sentences). Don't paraphrase these rules from memory — if `task-summary` tightens a rule later, a paraphrase here silently falls out of compliance the same way any duplicated shared mechanism drifts.
3. **Choose the canonical path** — keep the richer/primary doc's path as the merge target, UNLESS the naming fork (Step 2) produced a different confirmed name — then use that instead of silently keeping the old one.
4. **Write the merged doc** to the canonical path matching `templates.md`'s structure: LLM-CONTEXT block (`Status`, `Domain`, `Related`, `Last updated`), Quick Start, Overview, Architecture, Files, Task Status, Key Technical Decisions, Critical Gotchas, Next Steps, Last Session — and the Density Rules from step 2 apply to every section written. Concatenating two docs' `## Next Steps` yields one long flat list — regroup it by KIND of work (`task-summary/references/templates.md` "Next Steps"), never by which source doc each item came from: source-provenance is a temporal axis wearing a different hat, and it's stale the moment the merged doc is edited once. Strip tool-output wrapper artifacts before writing: a `Read` result wraps file content in `<content>` tags, and merging two docs means echoing back two `Read` results, so the wrapper can ride into the `Write` payload as a literal trailing line.
5. **Merging content**: combine sections without duplicating rows. If both docs have a Gotchas table, merge into one table — never two Gotchas sections. If both have a Files section, combine into one living map (don't keep per-doc subsections).
6. **Last Session**: write ONE Last Session block that notes the merge happened. First check whether any source doc is contested — another session's uncommitted work sitting in it, whose bullets aren't yours to collapse (`../_shared/references/contested-doc-sections.md`); fold those into typed sections instead. Where none is, don't preserve both docs' Last Session entries. A live peer can be known before its work reaches disk (`../_shared/references/cross-session-messaging.md`), which is worth checking before a merge deletes source docs outright.
7. **Size and structure decision** — merged doc should stay under 300 lines when possible. Before writing, measure the two source docs' line counts: if the sum with 10% padding for merge-overhead would exceed 300, this is your signal to decide between condensing (if bloat exists) or structural split (if facts are dense).
   - **If condensing is viable**: collapse completed Task Status rows, trim Files to a living map, cut narrative from Gotchas to rule+symptom only — the structure stays flat.
   - **If neither source is verbose and facts are dense**: structure as index + `decisions/<theme>.md` theme files (see Step 4.8 below). Raising this option during Step 2 prevents surprise at write-time.

8. **Structural split — index + theme files** (when two already-dense docs would exceed 300 lines combined): use `condense-task-doc`'s `templates.md` pattern ("Splitting a whole-doc MADR further"). The index keeps THREE things: "Quick Start, doc-wide operational tables, and a routing table." Only per-theme ADR/gotcha DETAIL moves down; `Task Status`, `Bugs Fixed`, `Critical Gotchas` and `Next Steps` stay in `current.md`, the first three scoped to what's cross-cutting. **Dropping these is invisible** — the content still exists in `decisions/*.md`, so no gate fires, and the index silently stops showing open work. That holds only while those tables are SMALL: merging two mature docs doubles them at a stroke, so route each ROW to the theme owning its mechanism and keep only open items + a routing table in the index. **`## Next Steps` is always in the index** at whatever size, one line each pointing at the file with the why (`task-summary` §4 step 3), since a reader asking "what's outstanding?" shouldn't have to open four files. An index over budget on live backlog alone is the expected outcome. Plus 3-5 `decisions/<theme>.md` files, grouped by the question a reader is asking, not by source doc. Each theme file is self-contained (own LLM-CONTEXT, `Related:` back to the index). This structure is correct when merge candidates pass the subsystem test but fail flat-doc size — the subsystem is still one merge, it just needs more than one file.

### Step 5 — Delete source docs

Back-reference reconciliation is the gate — don't delete until every stale reference has been repointed (Step 6). After reconciliation confirms zero stale refs, delete:

```bash
rm -rf tasks/<domain>/<source-feature>/
```

Before deleting, confirm every file in the folder was accounted for in Step 3's `ls` sweep (carried forward or absorbed) — `git status` after deleting is your safety net, not your first check.

**No redirect stubs.** The back-reference reconciliation in Step 6 is what replaces discoverability — a stub that says "# Merged into: ..." is clutter, not help, and survives as dead weight the next time the domain is touched.

### Step 6 — Reconcile ALL back-references

For every deleted path, update every file that referenced it to point to the merge target:

- `Related:` fields in other task docs
- Inline mentions (`tasks/payment/analytics-instrumentation/current.md`) in body text
- Domain `CLAUDE.md` `> 📖` pointers
- Roadmap/hub table rows

After updating, run a final scan to confirm zero stale references:

```bash
grep -rn "tasks/<domain>/<deleted-feature>" /path/to/tasks/ /path/to/app/
grep -rn "current.md" /path/to/tasks/ | head -1   # control: MUST return a hit
```

Zero results = done — **but only if the control line above returned a hit.** A zero from a broken search (wrong flag, wrong path, gitignored dir) is indistinguishable from a genuinely clean tree, and the docs are already deleted by this point. Don't accept an empty result you haven't proven the search *could* have filled.

### Step 7 — Validate

For each merged doc, re-read and verify:
- LLM-CONTEXT has Status, Domain, Related, Last updated = today
- Quick Start answers: next action, current state, gotchas, success criteria
- No section duplicates another's content
- No rows deleted from source docs (facts absorbed, not dropped)
- Last Session notes the merge
- The last line is real content, not a `</content>` tag that rode in from a `Read` (`tail -c 40 <file>`)

**Absence gate — every check above detects EXCESS; none detects a MISSING section.** A merge that drops whole section types passes all of them cleanly, because the content still exists somewhere. Run an additive check: `grep '^## ' <index>`, then diff against `grep -h '^## ' <each source doc>` — every section TYPE present in any source must survive somewhere, and `Task Status` / `Bugs Fixed` / `Critical Gotchas` / `Next Steps` must be in the INDEX, not only in `decisions/*.md`. Sanity-check against a sibling split doc in the same repo rather than from memory.

## Output

Tell the user:
- What was merged into what (the table from Step 2)
- How many docs went from N → M
- Zero stale back-references confirmed

📖 `references/checklist.md` — implementation checklist and rules as a quick reference for repeated runs, after you've learned the workflow once.

