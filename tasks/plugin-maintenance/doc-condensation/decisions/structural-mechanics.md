<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation/structural-mechanics
Gotchas (critical — full list in each ADR's Consequences):
  - `condense-claude-md` verification diff needs a false-positive filter; completion needs a byte threshold alongside the line threshold (D22)
  - Skill-file density is a distinct bloat class from CLAUDE.md/task-doc bloat (D23)
  - Companion-file split applies to ANY oversized cross-cutting section, not just global CLAUDE.md (D26)
  - Pre-existing plan/spec docs are NOT decisions/<theme>.md candidates (D27)
  - `<thinking>` recommendation retired — reasoning scaffolds belong to the output-style layer (D33)
  - Skill-file bloat is ARRIVAL-RATE, not density — re-condensing regresses; extract + gate instead (D50)
Related: ../current.md (feature index), verification-rigor.md (sibling theme file — unhobble-instructions correctness, split out 2026-08-11), ../../agent-architecture/current.md, ../../madr-structure/current.md
Last updated: 2026-08-11 — split out of structural-splits.md (which became this file's original name) once it grew to 21 decisions across two themes; this file keeps the structural-mechanics half (byte thresholds, companion files, plan-doc typing, arrival-rate density)
-->

# Doc Condensation — Byte Thresholds, Skill Density & Structural Splits

Decisions about WHEN a doc/CLAUDE.md/skill needs a structural split (byte thresholds, companion files, plan-doc typing) rather than denser prose.

---

### D22 — `condense-claude-md`'s Verification Diff Needed a Second-Pass Filter, and Completion Needed a Byte Threshold Alongside the Line Threshold — committed — 2026-07-12

**Problem**
Two gaps in a `CLAUDE.md` condensation. (1) `diff`/`comm` verification flagged ~30 lines as dropped; all were false positives (rewordings). (2) Pass hit line target (257→221) but bytes still high (20.4KB) — line count doesn't catch table density.

**Decision**
Verification now warns `diff` output is candidate-list, not verdict — each flag needs `grep -c` confirmation. Added Process step 6: byte check (40KB ceiling for root CLAUDE.md); offer seam-test split via `AskUserQuestion`.

**Consequences**
- `condense-claude-md/SKILL.md`: verification gained false-positive-filter; Process gained step 6.
- Line and byte density are orthogonal axes; check the one that hides bloat.

**Status**: committed · **Reversible**: yes

---

### D23 — Skill-File Density Is a Distinct Bloat Class From CLAUDE.md/Task-Doc Bloat, and `update-plugin` Now Owns Its Checklist — committed — 2026-07-12

**Problem**
Skills flagged as bloated despite being under line budget. Bytes/line was the real signal: `condense-claude-md` and `condense-task-doc` (147 and 140 B/L) stacked ⚠️ callouts and embedded anecdotes.

**Decision**
Two-round hand-edit: collapsed warnings (7 skills), stripped anecdotes; extracted cold paths (`update-claude-docs` CREATE/REWRITE/CONDENSE → `references/other-modes.md`; `task-summary` merge/rename → `references/merge-rename.md`). Captured pattern in `update-plugin/SKILL.md` Step 3a checklist.

**Consequences**
- 9 skill files edited; 2 new `references/*.md` files. `update-plugin/SKILL.md` gained density-pass capability.
- Plugin version bumped 1.61.2→1.63.1; kept `plugin.json`/`marketplace.json` in sync.

**Status**: committed · **Reversible**: yes

---

### D26 — Companion-File Split Widened From Global-Only to Any Oversized Cross-Cutting Section — committed — 2026-07-15

**Problem**
Cross-cutting oversized gotchas block (42KB, ~130 rows) failed seam-test. Wording compression got it to 28KB; no documented lever for "cross-cutting but not global" existed, so condensation stopped. User pushed back twice before trying companion split — it cut to 18KB (56%).

**Decision**
Widen Restructuring #7 to any file with oversized cross-cutting section. Failed seam-test is now the split's *trigger*, not dead-end. All three (condense, update-docs, read-summary) now require per-category symptom index for multi-category blocks.

**Consequences**
- `condense-claude-md/SKILL.md` Restructuring #7 rewritten; fixed internal miscitation.
- Plugin version bumped 1.75.0→1.76.0; also fixed version drift (plugin.json 1.75.0 vs marketplace.json 1.74.0).

**Status**: committed · **Reversible**: yes

---

### D27 — Pre-Existing Plan/Spec Docs Are a Distinct Type From `decisions/<theme>.md`, and Split-Doc Guidance Needed a Parent-Directory Audit Step — committed — 2026-07-15

**Problem**
5 pre-existing plan files in a task folder. Should they move to `decisions/`? No — `decisions/<theme>.md` is for ADRs split from budget-overrun `current.md`, not pre-build plans. Real-world convention (adr-tools, MADR, Diátaxis) keeps plans and decisions separate. Actual gap: `current.md` routing table omitted the 5 siblings.

**Decision**
(1) Leave plan/spec docs as siblings, never in `decisions/`. (2) When retiring, absorb content into NEW themed `decisions/<theme>.md` grouped by reader question, not source. (3) Audit: `templates.md` + `merge-task-docs` Step 3 need explicit "also `ls` the DESTINATION folder" — existing rule scanned only folders being deleted.

**Consequences**
- Routing table must enumerate EVERY parent-folder file, even siblings correctly outside `decisions/` — routing completeness and placement are separate concerns.

**Status**: committed · **Reversible**: yes

---

### D33 — Retire the `<thinking>` Recommendation: Reasoning Scaffolds Belong to the Style Layer, Not Skill Files — committed — 2026-07-16

**Problem**
D2 kept Chain-of-Thought (`<thinking>`) as a recommended technique for "commands with multi-branch inference", and a `## Next Steps` item had been monitoring whether it reduced domain-inference errors. A `grep -rn` across every skill and command found **zero** adopters — the row had sat purely aspirational since it was written. Separately, the user asked where `<thinking>` blocks in their sessions came from: not the plugin at all, but their active output style (`~/.claude/output-styles/deliberate-explanatory.md` §1), which mandates them unconditionally.

**Decision**
Chosen: retire the CoT row from CLAUDE.md's prompting-techniques table and close the monitoring item, recording zero-uptake-over-many-sessions as the verdict. The two layers are now explicit: reasoning scaffolds are the **harness/output-style** layer's job (global, user-switchable), and a skill file hardcoding one fights whatever style is active. D2's Constitutional/Validation halves stand unchanged.

**Rejected**
- Leaving the row as a dormant option "in case someone wants it". Why not: an unused recommendation still costs every skill author a decision, and a plugin must be self-contained — it cannot know which output style a *different* user runs, so prescribing a scaffold at the skill layer is unsound in principle, not just unused in practice.
- Reading zero adopters as "not tried hard enough" and adding a CoT block to a skill to test it. Why not: inverts the evidence. An 18-skill sample over many sessions choosing not to reach for a documented tool *is* the signal.

**Consequences**
- Establishes a layer boundary: skills own *procedure*, the output style owns *how reasoning is surfaced*. A future "should this skill think out loud?" question is answered at the style layer.
- Absence of uptake is admissible evidence for retiring a recommendation — a monitoring item that never fires has reported its result.

**Status**: committed · **Reversible**: yes

---

### D45 — A Heterogeneous Companion Split Needs One File Per Topic Cluster, Not One Grab-Bag File — committed — 2026-07-24

**Problem**
285-line `backend/CLAUDE.md` (155-row gotchas) spanned 6 unrelated topics (Tenancy, OAuth, SMS, Trust, PDF, blog-sync). First pass: trimmed to 47KB. Second pass: dumped into one `CLAUDE-backend-gotchas.md` — same dense-wall, new address. User: "not all need to be in a single file."

**Decision**
Cluster moved rows by topic FIRST, then write one companion per cluster (or route to existing domain CLAUDE.md). Process #5: re-run atomic-file's multi-topic check after byte-trimming — byte drop doesn't prove a still-single table stopped reading as one block.

**Consequences**
- 64 of 141 rows moved to 4 topic companions + 2 routed to existing domain files. `backend/CLAUDE.md` → 32.8KB (−42%), each companion under 6KB.

**Status**: committed · **Reversible**: yes

---

### D50 — Skill-File Bloat Is an ARRIVAL-RATE Problem, Not a Density Problem: Extraction + a Replace-or-Route Gate Replace Repeat Condensing — committed — 2026-07-26

**Problem**
D23's condense (207→147 B/L) regressed: same files back at 207/179 B/L by 2026-07-26 after 6 versions shipped in ~6 hours. Each version appended a hard-won rule. D23's rejected option ("no hot/cold split") was judged at half the current size.

**Decision**
(1) Extract to `references/` (cold paths to `condense-claude-md/references/structural-splits.md`, `read-summary/references/doc-authority.md`); skills keep highest-cost fact inline above pointer. (2) Arrival-rate gate: ~90 B/L skills gain rules only by replace/route/declare. (3) Retirement as named lever (D33 precedent: absence of uptake is evidence).

**Consequences**
- `condense-claude-md` 22.3KB→14.1KB (−37%); `read-summary` 22.4KB→17.7KB (−21%); `condense-task-doc` 21.1KB→19.6KB (−7%).
- Gate was unenforced until Step 4 validation added the check.
- Enumerated-set extraction dropped a lever from a numbered list (task-doc was second of three); caught only by re-reading the file's own count claim.
- Shared-mechanism grep found 4 skills still prescribing `rg` (abandoned 2026-07-13).

**Status**: committed · **Reversible**: yes

---

### D62 — A Stale Pointer Passes the Same Staleness Grep a Missing Rule Fails, So Two New `_shared/references/` Files Close the Gap Instead of a Rewording — committed — 2026-07-30

**Problem**
Pointer grep for `scp` returned one hit: the pointer line itself. "Not covered here," so companion never opened. Pointer-IS-the-match case unhandled. Three separate files carried overlapping "empty `git diff` is inconclusive" with same missing case (gitignored targets).

**Decision**
(1) New `pointer-discipline.md` (2.5KB) consolidating pointer rules: match-inside-pointer-line isn't a match; `Covers:` summary goes stale when companion changes; bare pointer needs 1-2 inlined facts; resolve by content, not folder name. (2) New `verifying-a-write-landed.md` (2.0KB) tabling empty-diff causes (staged target, CWD-relative pathspec, gitignored) with settling commands — replaces copies in `done`, `two-tier-condense`, `update-claude-docs`. (3) New `long-running-commands.md` extracted from `done` Step-1 re-run rule.

**Consequences**
- `update-claude-docs`: net B/L 94.1 → 94.3 (+ 142B, a route not bare addition).
- `done`/`two-tier-condense`: inline prose replaced with pointers (net bytes fell).
- `D-N` inside split-doc `decisions/*.md` is unique per DOMAIN only, not per file.

**Status**: committed · **Reversible**: yes

---

### D46 — The Third Structural Lever (Manual Companion File) Needed a Budget Gate Before Firing — committed — 2026-07-25

**Problem**
`update-claude-docs`'s companion lever had no size gate — reachable from a bare "split by category" request even when the source file was nowhere near budget. Asked to split a 216-line `backend/CLAUDE.md`'s 79-row gotchas table "by category," the skill jumped straight to extracting 4 new `.claude-companions/shared/*.md` files, when the file sat well under the 200/350-line budget and every row was uniformly high-frequency Laravel content — no oversized-file problem existed to justify the lever at all. The user corrected: "no need to put in a companion file for the ones that's always needed... just in the same file but differentiated by category."

**Decision**
Chosen: `references/structure.md` §6 now gates all three structural levers (subdir push-down, task-doc pointer, manual companion) behind an explicit budget check before any is reached for. Under budget → in-place `### ` subsection headers, every row stays inline, no new file. The companion lever specifically is reserved for a block that's both over budget AND genuinely low-frequency — "split by category" names a shape, not a location.

**Rejected**
- Treating "split by category" as sufficient license to create new files regardless of budget. Why not: conflates a request about *organization* (subsection headers within one file) with a request about *size* (extraction to companions) — the two only coincide when the file is actually over budget.

**Consequences**
- A file under budget asked to "split by category" now gets `### ` subsections in place — zero new files, same navigability gain the user actually wanted.

**Status**: committed · **Reversible**: yes

---

### D54 — The Arrival-Rate Gate Needs a Trigger That Fires With NO Defect; `references/*.md` Is Out of the B/L Gate's Scope — committed — 2026-07-27

**Problem**
D50 built the arrival-rate gate inside `update-plugin` Step 3a, but `update-plugin` only runs when `/done` Step 5 fires, and Step 5's single gate asked "does a real skill signal exist?" — a *defect* trigger. Rules mostly arrive as direct hand-edits during otherwise-clean sessions, so the dominant arrival path reached no checkpoint. Measured over a 7-day window: `skills/**/*.md` took **+418 net lines** (677 added / 259 removed, 2.6:1) across 22 commits. Separately, `references/*.md` had carried no size policy through two deferrals, and Step 3a's ~90 B/L line named SKILL.md only — a gap that widens every time a cold path is extracted.

**Decision**
Chosen, two parts. (1) **Step 5 gains a second, independent Gate B** — "did this session WRITE to a skill/command/agent file?" — with the detecting `git status` command and the B/L loop placed *at the deciding step*, per D51's rule that a gate whose inputs nothing computes resolves to its permissive default. Gate B fires on clean sessions by design; `update-plugin` Step 1 gained a matching arrival-rate-only branch that skips the defect scan and routes straight to Step 3a. (2) **`references/*.md` is OUT of the B/L gate's scope, decided rather than deferred** — the ratio measures a hot path read every invocation, while a reference is a cold-path lookup whose correct shape is a dense table with long rows; applying it would push good tables toward prose. A reference owes single-topic (D45), a symptom-naming `📖` pointer, and **~6KB for prose**; a **catalog is exempt** and grows with what it catalogs (`templates.md` 23KB, `structure.md` 15KB are correct). The test is how the file is READ.

**Rejected**
- Adopting the "remove 80%+ of the rules, let the model use judgment" advice from Anthropic's Claude-5 context-engineering article wholesale. Why not: that is a *density* prescription, and D23→D50 measured a regression from exactly it. The article describes a centrally-controlled, rarely-edited system prompt; this plugin is an incident-driven accumulator at 22 skill-fixing commits a week. Same goal, different dynamics — act on the rate, not the stock. Its progressive-disclosure and emphasis advice was adopted; its automatic-memory advice conflicts with a standing user decision.
- Giving Gate B a significance floor so trivial edits don't trigger it. Why not: the gate already scales with the *file's* density, not the edit's size — a typo fix in a lean skill resolves in one `wc -lc` ("all under budget" is the complete output). A second threshold would be a new unmeasured condition, the defect D51 named.
- Extending the ~90 B/L ratio to `references/` siblings. Why not: it would flag `templates.md` and `structure.md`, two files that are correct at their size, and a gate that fires on healthy files trains the reader to ignore it.

**Consequences**
- `⚠️` markers cut 291 → 233 corpus-wide (global `~/.claude/CLAUDE.md` 53 → 12, from 1 per 4 lines). **A marker downgrade is presentation, not condensation** — it changes no rule text, so it escapes D50's treadmill by construction. Verify it by diffing sorted word SETS, never `wc -w`: a stripped marker counts as a word, so a formatting-only edit reports a deficit that reads exactly like deleted rules.
- Extraction stopped at 3 of 6 candidates. `read-summary`'s ratio ROSE post-extraction (199.8 → 206.8) — D50's documented floor signature, since extraction removes whole lines so bytes and lines fall together. Its queued ~130 B/L projection was stale: it assumed 4.9KB would move and only 621 bytes did, because the marker pass had already shortened those lines. **A projection made before an unrelated pass touched the same lines is not a target.**
- Two unreachability defects found while wiring, both invisible to a file-scoped read: docs-only and infra-only modes excluded Step 5 entirely ("Steps 2-4"), and `done` promised accounting that `update-plugin`'s defect-shaped Step 1 could not receive. The second was the product reviewer's — 3rd consecutive session that lens carried the load-bearing finding. **Verifying a caller's reachability says nothing about whether the callee accepts the call.**
- `condense-claude-md/references/structural-splits.md` (6,515 bytes) is the first live edge case of the new prose ceiling — flagged in Next Steps, not split; a 53-line file split gets harder to use.

**Status**: committed · **Reversible**: yes

