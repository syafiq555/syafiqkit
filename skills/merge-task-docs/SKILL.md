---
name: merge-task-docs
description: >
  Find related task docs that should be merged together, merge them into a single coherent document, delete the sources, and reconcile all back-references to the deleted paths. Use this whenever the user says "merge these docs", "find payment docs and merge", "consolidate task docs", "combine related docs", "find all X docs and merge", "these docs overlap, merge them", or asks to clean up / reduce the number of task docs in a domain. Also use it proactively when a task-summary update reveals that a doc's content already lives in another doc — don't just update both, propose a merge.
---

# Merge Task Docs

Combines related `current.md` task docs into fewer, more complete documents. After merging: the source doc is deleted (no redirect stubs), all back-references point to the new path, and the merged doc reads as a single coherent current-state document — not two docs stapled together.

## When to merge vs when to keep separate

Merge when two docs share the **same subsystem** — same DB tables, same service classes, same user journey, or same deploy lifecycle. The test: would a future session editing one doc almost certainly need to read the other? If yes, merge.

Keep separate when docs are just **topically adjacent** — they share a keyword (e.g. "payment") but live in different subsystems, have different deployment cadences, or would create a doc >300 lines.

**The keyword trap**: "payment" appears in 10 docs. That doesn't mean they merge. `bank-warning` mentions payment everywhere but belongs in `payout` — because both touch `agencies.bank_warning_sent_at` → `payouts` lifecycle. Merge on subsystem boundary, not keyword.

Good merge signals:
- Both docs reference the same model/table/service as their primary concern
- One doc is a "UI layer on top of" another (e.g. payout PM visibility + payout disbursement = same `payouts` table)
- One doc is a "sub-concern" of another (e.g. gateway channel config + gateway integration = same 2C2P system)
- One doc is a "debugging tool for" another (e.g. analytics instrumentation + stuck payment = same triage loop)
- One doc is the "customer-facing framing of" another (e.g. fee FAQ + fee passthrough engineering = same canonical fact)

Bad merge signals:
- "They both involve invoices" (every payment feature involves invoices)
- They have different owners or unrelated deploy schedules

Note: ">300 lines" alone is NOT a bad-merge signal if the subsystem test (above) passes — it's a size-handling problem, not a reason to keep subsystem-coupled docs apart. See Step 4.8 for the split-doc resolution.

## Workflow

### Step 1 — Read all candidates

When given a domain or keyword (e.g. "all payment docs"), list every `tasks/<domain>/*/current.md`. Read them all before deciding anything. Don't merge based on titles.

⚠️ **Watch for dead redirect stubs from a PRIOR merge** — a doc whose entire body is "# Merged into: ..." or a one-line "content now lives at X" table. These aren't merge candidates, they're cleanup: delete them now (same as Step 5) and reconcile whatever still points at them (same as Step 6), even if nothing else in this session's merge touches that domain. A stub surviving past its own merge is exactly the clutter Step 5's "no redirect stubs" rule exists to prevent — check for it, don't just avoid creating new ones.

### Step 2 — Build a merge plan

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

⚠️ **Confirm via `AskUserQuestion`, not a flat "does this look right?"** — three separate decision forks tend to show up in a merge, and each is its own question, asked at the point it arises rather than bundled into one wall of text upfront:

1. **Scope** — after building the merge table: does the proposed grouping match what the user wants merged? Options: your recommended grouping (with the subsystem reasoning as the description) vs. a broader/narrower alternative vs. "no merge, just tidy." If the user pushes back on your recommendation (e.g. picks "merge everything" when the subsystem test said otherwise), don't silently comply — the disagreement itself is a second question: confirm the resulting size tradeoff before writing anything (see #2).
2. **Structure** — if Step 4.8's split-doc trigger fires (dense sources, >300 lines with nothing left to cut): ask flat-with-overage vs. index+`decisions/<theme>.md` split, before writing either. Don't default silently to one.
3. **Naming** — if the merge changes canonical paths (new folder, renamed theme files): ask for the canonical name(s) explicitly rather than assuming the richest source doc's existing name is good enough. Offer 2-3 short options per name with a Recommended pick and its reasoning, not an open-ended "what should we call it?".

Each question should have a Recommended option so the user can accept-by-default without re-deriving the reasoning themselves. Do not proceed past a fork without the user's answer, even if your recommendation seems obviously correct — the point is catching the cases where it isn't.

### Step 3 — Scan back-references BEFORE writing

For every source doc being deleted, find all docs that reference its path:

```bash
grep -rn "tasks/payment/analytics-instrumentation\|tasks/payment/bank-warning" /path/to/tasks/
grep -rn "analytics-instrumentation\|bank-warning" /path/to/app/   # domain CLAUDE.md files
```

⚠️ **Use `grep -rn` here, never `rg -rn`.** In `rg`, `-r` is `--replace` (there IS no recursive flag — `rg` always recurses), so `rg -rn "pat"` prints every match with the pattern *substituted by `n`* and exits 0. The path you searched for vanishes from its own output — and this step's exit condition is "zero results = done", so the corruption reads as a clean all-clear and Step 5 deletes the docs anyway. `grep`'s `-r` genuinely means recursive.

⚠️ Long paths may be truncated in tool output. If so, redirect to a temp file and Read it.

Build a list of every file + line that needs updating. Do this now — before the merge writes — so nothing is missed.

⚠️ **`ls` every source folder now, not just its `current.md`.** A task folder can hold sibling files a plain domain/feature scan never reads — `stories.md`, `script.sql`, screenshots, exported data. Step 5's `rm -rf` deletes the whole folder; a file you never opened is destroyed with zero chance to review it first. For each non-`current.md` file found: read it, and either fold its content into the merged doc/a theme file, or copy it forward unchanged to the new canonical folder. Never let `rm -rf` be the first time you learn a file existed.

### Step 4 — Write the merged docs

For each merge group:

1. **Read both docs in full** before writing anything.
2. **Choose the canonical path** — keep the richer/primary doc's path as the merge target, UNLESS the naming fork (Step 2) produced a different confirmed name — then use that instead of silently keeping the old one.
3. **Write the merged doc** to the canonical path using the task-summary template structure:
   - LLM-CONTEXT block with updated `Status`, `Domain`, `Related`, `Last updated` — `Last updated` names the date + what changed, not commit/deploy status prose (that lives only in Quick Start's state line; see Density rules below)
   - Quick Start (≤15 lines, cold-start actionable)
   - Overview, Architecture, Files, Task Status, Key Technical Decisions, Critical Gotchas, Next Steps, Last Session
4. **Density rules** (from task-summary skill) apply: one fact one home, no section duplicates the content of another, no commit hashes outside Last Session, no filler words.
5. **Merging content**: combine sections without duplicating rows. If both docs have a Gotchas table, merge into one table — never two Gotchas sections. If both have a Files section, combine into one living map (don't keep per-doc subsections).
6. **Last Session**: write ONE Last Session block that notes the merge happened. Don't preserve both docs' Last Session entries.
7. **Size budget**: merged doc should stay under 300 lines. If it would exceed this, condense aggressively — collapse completed Task Status rows, trim Files to a living map, cut narrative from Gotchas to rule+symptom only.
8. **When condensing can't reach budget**: two docs that are each already dense and near 300 lines (not narrative-bloated) can combine to 500+ lines with nothing left to cut without deleting real facts — this contradicts Step 7's "no rows deleted, facts absorbed" gate. Don't force a single flat file, and don't silently default to the split either — this is fork #2 from Step 2: ask flat-with-overage vs. index+`decisions/<theme>.md` split. If split is chosen, use the split-doc pattern from `condense-task-doc`'s `templates.md` ("Splitting a whole-doc MADR further"): a thin index `current.md` (Quick Start + a routing table framed as "read `decisions/<theme>.md` if you're asking: *[question]*") plus 3-5 `decisions/<theme>.md` files, grouped by the question a reader is asking, not by which source doc a fact came from. Each theme file is self-contained (own LLM-CONTEXT, `Related:` back to the index). This is the correct outcome when the merge candidates fail the "bad merge signal: >300 lines" test in isolation but pass the same-subsystem test — the subsystem is still one merge, it just needs more than one file.

### Step 5 — Delete source docs

Before deleting, confirm every file in the folder was accounted for in Step 3's `ls` sweep (carried forward or absorbed) — `git status` after deleting is your safety net, not your first check.

```bash
rm -rf tasks/<domain>/<source-feature>/
```

No redirect stubs. The back-reference reconciliation in Step 6 is what replaces discoverability — a stub is clutter, not a help.

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

Zero results = done — **but only if the control line above returned a hit.** A zero from a broken search (wrong flag, wrong path, gitignored dir) is indistinguishable from a genuinely clean tree, and the docs are already deleted by this point. Never accept an empty result you haven't proven the search *could* have filled.

### Step 7 — Validate

For each merged doc, re-read and verify:
- LLM-CONTEXT has Status, Domain, Related, Last updated = today
- Quick Start answers: next action, current state, gotchas, success criteria
- No section duplicates another's content
- No rows deleted from source docs (facts absorbed, not dropped)
- Last Session notes the merge

## Output

Tell the user:
- What was merged into what (the table from Step 2)
- How many docs went from N → M
- Zero stale back-references confirmed

## Rules

| ❌ Never | ✅ Always |
|---------|---------|
| Leave a `# Merged into:` redirect stub | Delete the source; reconcile every back-ref instead |
| Decide to merge based on shared keywords | Merge based on shared subsystem (same tables/services/journey) |
| Delete source before reconciling back-refs | Reconcile to the new path FIRST, then delete (0 stale = gate) |
| Force a flat merged doc past 300 lines by deleting real facts | Condense first; if sources are already dense (not bloated), split into index + `decisions/<theme>.md` instead (Step 4.8) |
| Preserve both docs' Last Session entries | One merged Last Session noting the merge happened |
| Stop at `Related:` fields | Sweep inline mentions + domain CLAUDE.md pointers too |
| Plain `mv` a renamed folder | `git mv` — keeps history (for renames, not deletes) |
| `rm -rf` a source folder having only read its `current.md` | `ls` the folder first — carry forward or absorb every sibling file (SQL scripts, stories docs, screenshots) before deleting |
| Merge without user confirmation, or bundle scope/structure/naming into one flat "does this look right?" | Three separate `AskUserQuestion` forks, each at the point it arises — scope, flat-vs-split structure, canonical naming (Step 2) |
