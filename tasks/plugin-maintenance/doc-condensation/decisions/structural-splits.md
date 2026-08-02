<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation/structural-splits
Gotchas (critical — full list in each ADR's Consequences):
  - `condense-claude-md` verification diff needs a false-positive filter; completion needs a byte threshold alongside the line threshold (D22)
  - Skill-file density is a distinct bloat class from CLAUDE.md/task-doc bloat (D23)
  - Companion-file split applies to ANY oversized cross-cutting section, not just global CLAUDE.md (D26)
  - Pre-existing plan/spec docs are NOT decisions/<theme>.md candidates (D27)
  - `<thinking>` recommendation retired — reasoning scaffolds belong to the output-style layer (D33)
  - Skill-file bloat is ARRIVAL-RATE, not density — re-condensing regresses; extract + gate instead (D50)
Related: ../current.md (feature index), ../../agent-architecture/current.md, ../../madr-structure/current.md
Last updated: 2026-07-26
-->

# Doc Condensation — Byte Thresholds, Skill Density & Structural Splits

Decisions about WHEN a doc/CLAUDE.md/skill needs a structural split (byte thresholds, companion files, plan-doc typing) rather than denser prose.

---

### D22 — `condense-claude-md`'s Verification Diff Needed a Second-Pass Filter, and Completion Needed a Byte Threshold Alongside the Line Threshold — committed — 2026-07-12

**Problem**
Two gaps in a live Dourr `CLAUDE.md` condensation run. (1) Prescribed `diff`/`comm -23` verification flagged ~30 lines as possibly-dropped; all were false positives (reworded labels, table-header artifacts). (2) The pass hit the ≤200-line target (257→221) but was still 20.4KB — line count doesn't catch table-row byte density.

**Decision**
Two patches to `condense-claude-md/SKILL.md`. (1) Verification rule now warns `diff`/`comm` output is a *candidate list, not a verdict* — each flag needs `grep -c '<substring>'` confirmation. (2) Added Process step 6: hitting the line target isn't done if bytes are still high (originally set at ~15KB for a root CLAUDE.md, corrected to the actual 40KB ceiling on 2026-07-19 after a real condense run showed the old target was ~2.5x too tight); proactively offer a seam-test split via `AskUserQuestion`.

**Rejected**
- Leaving the diff/comm check as-is, treating the manual `grep -c` triage as implicit good practice. Why not: the same false-positive noise will recur on every future run of this exact command shape (rewording is the norm, not the exception, in a condensation pass) — worth naming as a known step, not left to be independently re-discovered each time, matching this doc's own D20/D6 lineage of promoting a repeated ad hoc fix into a stated rule.
- Raising the line-count target itself (e.g. ≤150) instead of adding a parallel byte check. Why not: line count and byte density are orthogonal axes for a one-row-per-item table — a lower line target doesn't fix a table whose rows are already irreducibly long; the existing ⚠️ note under Process already identifies this shape as line-count-deceptive, so the real fix is checking the metric that shape actually hides (bytes), not tightening the metric that was never diagnostic for it.
- Making the seam-test split offer mandatory/automatic without asking. Why not: splitting creates a new file and changes what loads when — a structural change with real tradeoffs (the seam-test can fail, or the user may prefer to accept more lines over more files), consistent with this skill already gating splits behind `AskUserQuestion` rather than executing them unprompted.

**Consequences**
- `condense-claude-md/SKILL.md`: verification bullet gained the false-positive-filter note; Process gained step 6.
- Dourr `CLAUDE.md` further split: root (181 lines/12.7KB) + new `docker/CLAUDE.md` (53 lines/8.5KB, passes seam-test).

**Status**: committed · **Reversible**: yes

---

### D23 — Skill-File Density Is a Distinct Bloat Class From CLAUDE.md/Task-Doc Bloat, and `update-plugin` Now Owns Its Checklist — committed — 2026-07-12

**Problem**
User flagged plugin skills as "bloated," naming `update-claude-docs` and `task-summary`. Both sat under their line budgets — line count didn't explain the complaint. A full-plugin audit found the real signal was bytes/line: `condense-claude-md` and `condense-task-doc` — whose JOB is fixing this pattern — were themselves the densest files (147 and 140 bytes/line), stacking multiple ⚠️ callouts and embedding worked-incident anecdotes as instruction text.

**Decision**
Two-round hand-edit pass. Round 1 (v1.62.0): collapsed stacked warnings and stripped anecdotes across 7 skills; `update-claude-docs` extracted its cold-path CREATE/REWRITE/CONDENSE modes to `references/other-modes.md` (239→205 lines, 27% smaller hot path). Round 2 (v1.63.0): `read-summary` revised (82→71 lines), `task-summary`'s rare merge/rename branch extracted to `references/merge-rename.md` (223→202 lines). Captured the pattern into `update-plugin/SKILL.md` (v1.63.1) as Step 1 signal + Step 3a checklist for future density passes.

**Rejected**
- Delegating skill-density fixes to `condense-claude-md`/`condense-task-doc`. Why not: those skills' entire density-rule vocabulary (WHY-column stripping, `Symptom|Cause|Fix` table shape, `{#anchor}` preservation) is CLAUDE.md/task-doc specific; SKILL.md files have different structure (frontmatter, mode sections, `references/` split) and no equivalent skill existed to point to.
- Treating this as one-time manual cleanup with no reusable capture. Why not: the same shape (stacked warnings, worked anecdotes, self-contradiction, cold-path-in-hot-path) is exactly the kind of recurring, nameable pattern this doc's own D3/D6/D13 lineage says belongs in the generator/checklist, not re-discovered by inspection each time a skill grows dense again.
- Extracting cold-path content from every skill preemptively, not just the two found. Why not: the round-2 plugin-wide scan explicitly checked all 12 remaining skills for this lever and found only `task-summary` §2a qualified — most skills are single-purpose with no hot/cold split; forcing an extraction where none is warranted adds indirection without a token-budget payoff.

**Consequences**
- 9 skill files edited across two rounds; 2 new `references/*.md` files created; `update-plugin/SKILL.md` gained permanent density-pass capability.
- Plugin version bumped 1.61.2→1.63.1 across three CHANGELOG entries; kept `plugin.json`/`marketplace.json` in sync.

**Status**: committed · **Reversible**: yes

---

### D26 — Companion-File Split Widened From Global-Only to Any Oversized Cross-Cutting Section — committed — 2026-07-15

**Problem**
`condense-claude-md` Restructuring #7 documented companion files as global-only. A layer file sat at 42kb with a ~130-row gotchas block that failed the subdir seam-test — genuinely cross-cutting, no single subdirectory owned it. Wording-compression alone got it to 28kb; the model concluded "dense, not bloated" and stopped, since the only documented lever was "stays inline." The user pushed back twice before the companion split was tried — it cut the file to 18kb (56%).

**Decision**
Chosen: widen Restructuring #7 to any file whose oversized section is cross-cutting (fails seam-test per #6, isn't feature-owned). Three coordinated patches: `condense-claude-md` (Restructuring #7 + step-5 completion check) now treats failed seam-test as the split's *trigger*, not a dead end; `update-claude-docs/references/structure.md` gained a **Third structural lever** section; `read-summary` step 5 gained a **Companion** bullet. All three now require a **per-category symptom index** for moved blocks with multiple sub-categories, plus a grep-and-repoint pass for sub-anchors (3 task-doc cross-refs broke silently this session).

**Rejected**
- Leaving the lever global-only and treating every cross-cutting layer-file overflow as a permanent "stays inline" case. Why not: D19/D20 already established the pointer lever's boundary (needs a real feature owner); this left a real third case — no subdirectory AND no feature owner — with no lever at all, and "dense, not bloated" is not actually a resolution to a 42kb auto-loading file.
- A single generic trigger phrase on the companion pointer, matching the original global-file wording. Why not: a multi-category source block (React/Chakra/Data gotchas) collapsed under one phrase gives a reader no way to match their specific symptom without opening the file — defeats the pointer's purpose. Confirmed insufficient live; the user asked for a per-category index twice before it landed.

**Consequences**
- `condense-claude-md/SKILL.md` Restructuring #7 rewritten; caught internal miscitation (`#49` → `#7`, fixed same session).
- Plugin version bumped 1.75.0→1.76.0; also fixed pre-existing `plugin.json` (1.75.0) vs `marketplace.json` (1.74.0) drift.

**Status**: committed · **Reversible**: yes

---

### D27 — Pre-Existing Plan/Spec Docs Are a Distinct Type From `decisions/<theme>.md`, and Split-Doc Guidance Needed a Parent-Directory Audit Step — committed — 2026-07-15

**Problem**
A Dourr `tasks/trust-engine/` merge left 5 pre-existing plan files (`phase2-plan.md`, etc.) untouched in the parent folder, cited by 13+ PHPDoc comments. The user asked whether they should move into `decisions/` for consistency. Two independent research passes concluded they shouldn't: `decisions/<theme>.md` is specifically for ADR blocks split out of budget-overrun `current.md`; these files were pre-build engineering PLANS that never originated that way. Real-world convention (adr-tools, MADR, Diátaxis) confirmed teams keep plan/spec docs and decision logs separate. The actual gap wasn't folder layout — it was that `current.md`'s routing table only listed the 3 `decisions/*.md` files, silently omitting the 5 siblings.

**Decision**
Chosen: (1) leave plan/spec docs as siblings of `current.md`, never move them into `decisions/`; (2) when retiring siblings, absorb still-load-bearing content into a NEW themed `decisions/<theme>.md` grouped by reader question, not source file; (3) patch `templates.md`'s split-doc section + `merge-task-docs` Step 3 with an explicit "`ls` the PARENT directory" audit — the existing sibling-file rule only scanned folders being deleted, never the folder the split lands in.

**Rejected**
- Converting the plan docs into ADR blocks to fit `decisions/` uniformly. Why not: their content (schemas, edge-case tables, build-order checklists) doesn't fit Problem/Decision/Rejected/Consequences without stripping real engineering detail to force a shape — information loss dressed as tidiness, the exact failure `condense-task-doc`/`merge-task-docs` warn against.
- Folding the plan docs' content directly into `current.md`'s body once retiring them. Why not: `current.md` must stay a thin index (Quick Start + routing only) per `templates.md`'s own split-doc rule — pulling ~1,100 lines of schemas/edge-cases back in would recreate the exact bloat the split existed to fix.
- Accepting a single research pass (internal skill re-read) as sufficient before making the call. Why not: the user explicitly asked for external verification (real-world ADR/Diátaxis convention) before trusting the internal skill's own guidance on itself — a second, independent source corroborating the same conclusion is what actually earned confidence here, not the first pass alone.

**Consequences**
- `templates.md`'s "Splitting" section gained a parent-directory audit paragraph; `merge-task-docs/SKILL.md` Step 3 gained matching "also `ls` the DESTINATION folder" note.
- Establishes durable rule: `decisions/<theme>.md` routing table must enumerate EVERY file in its parent folder, even when siblings correctly stay outside `decisions/` — routing completeness and folder placement are separate concerns.

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
D26 widened the companion lever to any oversized cross-cutting section but assumed the source block was one coherent topic. Asked to shrink a 285-line `backend/CLAUDE.md` whose ~155-row gotchas table spanned Tenancy, OAuth/MyDigital ID, SMS/OTP, Trust/Bricks, PDF-stamping, and blog-sync bugs, the first pass trimmed row prose (56KB→47KB) and, on request for more, dumped every moved row into one `CLAUDE-backend-gotchas.md` — same dense-wall problem, new address. The user caught it twice: a minimap screenshot showing the file still read as one unbroken block despite the byte win, then "not all need to be in a single file."

**Decision**
Chosen: `condense-claude-md` Restructuring #7 now requires clustering moved rows by topic FIRST (grep each row's subject noun/class name, group matches), then writing one narrow `.claude-companions/<shared|local>/CLAUDE-<topic>.md` per cluster — or routing a cluster to an existing domain subdir CLAUDE.md when one already owns that topic, instead of a new companion. Process #5's exit criteria gained a matching check: byte reduction from row-trimming alone doesn't prove a still-single oversized table stopped reading as one block — re-run the atomic-file gate's multi-topic question before declaring done.

**Rejected**
- Treating the byte/line drop as sufficient completion evidence. Why not: a tightened single companion can hit its byte target while a reader checking one symptom still scrolls past five unrelated topics — the file itself becomes the next thing needing a split.
- Splitting by row count instead of topic (e.g. first half / second half). Why not: defeats the pointer's purpose exactly like D26's rejected single-generic-trigger-phrase option — a reader can't predict which arbitrary half holds their symptom.

**Consequences**
- Final split (reference, not a rule): 64 of 141 rows moved to 4 new topic companions (`CLAUDE-oauth-gotchas.md`, `CLAUDE-sms-otp-gotchas.md`, `CLAUDE-blog-guide-sync-gotchas.md`, `CLAUDE-backend-misc-gotchas.md`) + 2 clusters routed to existing domain files (`Tenancy/CLAUDE.md`, `Trust/CLAUDE.md`) instead of a companion. `backend/CLAUDE.md` landed at 32,799 bytes (−42% from 56,322), each companion independently under 6KB.
- `read-summary` and `update-claude-docs` checked (shared-mechanism grep) — both already describe consuming "a" companion file generically, not "the" one file; needed no change.

**Status**: committed · **Reversible**: yes

---

### D50 — Skill-File Bloat Is an ARRIVAL-RATE Problem, Not a Density Problem: Extraction + a Replace-or-Route Gate Replace Repeat Condensing — committed — 2026-07-26

**Problem**
D23 (2026-07-12) hand-condensed `condense-claude-md` and `condense-task-doc` from 147/140 bytes/line and captured a density checklist into `update-plugin` Step 3a. A full-plugin sweep on 2026-07-26 found both files back at **207 and 179 B/L** — past their pre-fix state — with `read-summary` at 202. The regression is not sloppy writing: the CHANGELOG shows six versions shipped in ~6 hours, each appending a hard-won rule to these same files, and 1.123.23 records `done/SKILL.md` being deliberately shrunk to 122 B/L only to sit at 126 three versions later. D23's own rejected option ("most skills are single-purpose with no hot/cold split") was judged when these files were roughly half their current size and no longer held.

**Decision**
Chosen, three parts. (1) **Extraction over re-wording** — the three offenders had no `references/` dir while every acceptable-density large skill (`task-summary`, `done`, `update-claude-docs`) does; cold paths moved to `condense-claude-md/references/structural-splits.md` and `read-summary/references/doc-authority.md`, each SKILL.md keeping the highest-cost fact inline above the pointer per #6's own rule. (2) **An arrival-rate gate** in `update-plugin` Step 3a: a skill above ~90 B/L gains a rule only by replacing one, routing it to `references/`, or stating in the report that it grew and why no retirement was available. (3) **Retirement as a named lever**, citing D33's precedent that absence of uptake is admissible evidence — gated on verifying the trap is actually dead, since a still-installed tool is a live guardrail whatever its own "abandoned" note claims.

**Rejected**
- Another in-place density pass, as D23 ran. Why not: that is the treadmill this ADR exists to name. Two rounds of it produced a sawtooth with a rising floor — the files ended denser than before the fix, so the pass demonstrably buys weeks, not a resolution. `condense-claude-md`'s own Process #5 already carries this diagnosis for CLAUDE.md files ("a file that has been condensed before is a GROWTH-RATE problem"); the skill layer had no equivalent.
- Compressing `read-summary` further after extraction. Why not: its ratio moved 202 → 201 despite a −21% byte cut, which is precisely the atomic-file gate's predicted signature — extraction removed whole lines so bytes and lines fell together, leaving one distinct rule per line with nothing restating anything else. Compressing past that erodes content rather than bloat, and the gate exists to stop exactly this pass from running.
- Making the gate a hard block on adding rules to a dense skill. Why not: the rules arriving are real, session-earned defects; refusing them loses more than the density costs. Requiring a replace/route/declare *decision* keeps every rule while making growth visible in the report instead of silent.

**Consequences**
- `condense-claude-md` 22,349 → 14,094 bytes (−37%, 207 → 164 B/L); `read-summary` 22,418 → 17,659 (−21%); `condense-task-doc` 21,071 → 19,575 (−7%). Two new `references/*.md` files.
- ⚠️ **Extraction can silently drop an ENUMERATED item's visibility while every pointer still resolves.** Condensing this skill's Restructuring #6/#7 left the *task-doc* lever (the second of three) as a subordinate clause, contradicting the file's own L10 claim to own "every split decision (subdir, task doc, companion file)" — a numbered list visibly offering two options where the prose promises three. No link broke, so the pointer check passed. Caught only by re-reading the skill's self-description against its own list. When condensing a numbered/enumerated set, verify the COUNT the surrounding prose claims, not just that each surviving item resolves.
- Collateral: the write-mode rule was found stated in **three** homes (Process step + Hard rules + `_shared/references/two-tier-condense.md`) across two skills, collapsed to the shared reference alone. A new Step 3a row names the three-homes pattern as its own bloat class.
- Live bug found by the shared-mechanism grep, not the density scan: **four skill files still prescribed `rg`**, abandoned globally since 2026-07-13 — including `read-summary`, whose L82 prescribed `rg --files` while L20 warned against `rg`. Confirms a density pass should always carry a shared-mechanism grep.
- Supersedes D23's rejected-option finding that preemptive extraction isn't warranted — true at that size, false at this one. The size at which a judgment was made is part of the judgment.
- ⚠️ **The gate as first written was unenforced — a product review caught it shipping the same weakness it diagnosed.** Step 3a stated the rule but Step 4 (Validate) had no row checking it ran, making it prose a session is trusted to remember, which is structurally how D23's capture regressed. Fixed same session: Step 4 now requires naming which of replace / `references`-route / declared-growth a change to a >90 B/L file was, and treats a purely additive CHANGELOG entry against a dense file as a failed check. Step 3a also gained the ratio one-liner (the threshold had been stated with no way to compute it).
- Open half: the gate is reachable only from `update-plugin`, while rules mostly arrive as direct hand-edits, and `references/*.md` files inherit no budget of their own — both tracked in `../current.md` Next Steps.

**Status**: committed · **Reversible**: yes

---

### D62 — A Stale Pointer Passes the Same Staleness Grep a Missing Rule Fails, So Two New `_shared/references/` Files Close the Gap Instead of a Rewording — committed — 2026-07-30

**Problem**
A remote-cli session's `update-claude-docs` grep for `scp` returned exactly one hit in the global `CLAUDE.md`: the file's own `> 📖` pointer line advertising the companion's contents. That read as "not covered here, nothing to update," so the companion (`CLAUDE-remote-cli.md`) was never opened — it still described the deleted bug. The existing classification rule only named the direction where grep finds **nothing**; a match that IS the pointer line itself was unhandled, and it's invisible precisely because the grep succeeds. Separately, `done`'s exit gate and `two-tier-condense`'s Diff step each independently carried the same "an empty `git diff` is inconclusive" rule with the same missing case (a gitignored target no git command can ever show), and `update-claude-docs`'s own Validate step was a third consumer with no shared home.

**Decision**
Chosen, three parts. (1) New `skills/update-claude-docs/references/pointer-discipline.md` (2.5KB) consolidating four pointer rules — a match-inside-a-pointer-line is not a match and must be followed; a pointer's own `Covers:` summary goes stale the moment the companion changes; a bare pointer needs 1-2 inlined facts unless it's a task-doc `## Gotchas` row; and resolve a pointer target by content, not folder name. `update-claude-docs/SKILL.md`'s classification table gained a row naming the trap directly. (2) New `skills/_shared/references/verifying-a-write-landed.md` (2.0KB) tabling all three causes of an empty `git diff` (staged target, CWD-relative pathspec, untracked/gitignored target) with the command that settles each — `done`, `two-tier-condense`, and `update-claude-docs` all now point to it instead of carrying their own copy. (3) New `skills/_shared/references/long-running-commands.md`, extracted from `done`'s Step-1 re-run rule (a verification command that mutates shared state must not race a second copy of itself).

**Rejected**
- Rewording the existing classification rule in place rather than adding a reference file. Why not: the rule already existed and was already followed correctly in the direction it named — the gap was a missing SECOND direction, not unclear wording in the first. A file consolidating both directions plus the `Covers:`-staleness and folder-name traps gives one place to check "am I about to trust a pointer" instead of three partial mentions.
- Treating the three-owner empty-diff rule as `done`-only and patching it there alone. Why not: a shared-mechanism grep (`show-toplevel\|diff HEAD --stat`) found the identical rule, with the identical gap, already duplicated in `two-tier-condense.md` — two owners means the canonical home is `_shared/`, not either caller.

**Consequences**
- `update-claude-docs/SKILL.md`: gained a Step-1 pointer to `pointer-discipline.md` plus a classification-table row naming the trap; net B/L moved 94.1 → 94.3 (+142B) after retiring two rows the new reference now covers — a route, not a bare addition, consistent with D50's gate.
- `done/SKILL.md` and `two-tier-condense.md`: inline empty-diff prose replaced with a pointer to `verifying-a-write-landed.md` (net bytes fell in both).
- `task-summary/references/templates.md` gained a related but distinct rule: `D-N` inside a **split** doc set's `decisions/*.md` files is unique per DOMAIN, not per file — a theme file holding a chronologically-gapped subset is correct, and a bare cross-domain reference must carry its domain prefix. This does not change the cross-FEATURE global-uniqueness convention this doc's own D40/D44 already established; it governs numbering within one feature's split sub-files only.
- CHANGELOG 1.136.10 and 1.136.11 hold the narrated incidents; this block is the durable decision record.

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

---

### D63 — Prose Is the New Entry-Format Default, Not a Blanket Replacement for Tables — A/B-Tested, Not Just Reasoned — committed — 2026-07-31

**Problem**
D54 rejected the Claude-5 article's density-reduction advice wholesale as measuring a different dynamic (a rarely-edited system prompt vs. this plugin's incident-driven accumulation) — but never tested the article's narrower, separate claim: "rigid rules → let Claude use judgement" as a *format* choice (prose vs. table), independent of *how much* content survives. A Dourr session ran a controlled test: two isolated Sonnet agents each answered 6 real scenarios (an OOM-killer misconfiguration, hand-editing a prod server, copying a password hash, a green-test-suite/dev-DB mismatch, a port-binding choice, a staging/prod DB ambiguity) using only one excerpt of `CLAUDE.local.md` — the existing gotcha-table format, or the same facts converted to judgement-prose. Both scored correctly on every judgement-shaped question. The one gap: the prose agent got the right principle on the port-binding question but explicitly downgraded its own confidence, since prose had nowhere to carry the literal answer (which exact IP) without becoming a table again. Executing the finding on the real file then hit a second, related failure twice more: the experimental table excerpt's own "trim" pass cut a real cross-reference pointer and a precedent example, and the live prose conversion softened away a specific error-code detail — both instances of a value/pointer being mistaken for prose padding because it reads as a short trailing clause, not a rule of its own.

**Decision**
Chosen, three parts, all format/routing changes, no density mandate. (1) A **judgement-vs-value test** replaces the unconditional "gotchas/guidance default to a table row" rule in `update-claude-docs` — response is "it depends, reason about it" → prose ending in a `**Tell:**` sentence; response is "the answer is this specific string" → table row; a signal mixing both → prose with a `📖 <companion> {#anchor}` pointer, exact value at the anchor. Applied to BOTH `update-claude-docs`' live capture rule AND its Create-mode scaffolding templates (`references/structure.md` §3/§4/§5) — the templates still showed pure `❌/✅` and `Symptom|Cause|Fix` tables after the capture rule changed, so a freshly scaffolded CLAUDE.md would have looked like the old convention regardless. (2) `condense-claude-md` gained the inverse lever — `references/prose-vs-value-split.md` — for splitting an existing table row WITHIN itself (judgement stays as prose, attached exact value moves to a companion) as an alternative to the existing lever's whole-row-by-frequency move. (3) `_shared/references/two-tier-condense.md`'s verify checklist gained an explicit check for this specific failure mode (a rule's core claim surviving while its pointer/precedent/exact-value appendage doesn't) — shared by `condense-claude-md` and `condense-task-doc`, since both condense existing content and both are exposed to it.

**Rejected**
- Making prose the default everywhere, including for pure-lookup content. Why not: the A/B test's own port-binding result showed prose measurably loses on value-shaped content — the article's advice is real but narrower than "always prose," and applying it unconditionally would repeat D54's mistake in the opposite direction (a density-shaped fix applied to a format-shaped problem, here a format-shaped fix applied past its tested domain).
- Treating this as contradicting D54. Why not: D54 rejected *removing content* (density); this decision only changes *how surviving content is shaped* (format) and is evidence-backed by a live agent test, not re-reasoned from the same article — the two decisions answer different questions about the same source.
- Leaving `update-claude-docs`'s Create-mode templates untouched since the capture-mode rule already covered "new signals added during a session." Why not: a user caught the gap directly ("u didnt update the reference template") — Create mode is a separate code path from Capture mode and reads the templates in `references/structure.md`, not the capture-mode rule table, so fixing one without the other leaves a freshly scaffolded file inconsistent with a file that grew through normal session capture.

**Consequences**
- `update-claude-docs/SKILL.md` was already over its ~90 B/L gate (94.3) with no retirable rule found — the capture-mode change is a **declared growth** (94.3 → 96.2 B/L, +623B after a same-turn tightening pass removed a restated test from the per-signal bullets).
- `condense-claude-md/SKILL.md` was already over budget (165.5) with nothing to retire — the new lever is a one-sentence **declared growth** (165.5 → 167.6 B/L) pointing to the new reference file rather than inlining the technique.
- `references/structure.md` (`update-claude-docs`) is a CATALOG per D54's exemption (read section-by-section, not scanned whole) — the template fix added prose there freely with no B/L concern, but the file's own explicit "default form" claim (§4 Formatting conventions) had to be corrected in the same pass or it would keep contradicting the capture-mode rule two sections earlier.
- The technique is deliberately scoped as one lever among several, not a mandate — `prose-vs-value-split.md`'s own closing section states this explicitly, matching the session's instruction not to invent a rigid always-split rule from a single test.
- **`task-summary`'s own table conventions (Critical Gotchas `| Issue | Rule |`, task-doc Gotchas format) were checked and correctly left unchanged** — a task-doc gotcha row is tied to a specific bug/error-string by design (investigation-log shaped, i.e. value-shaped), which is exactly the case D63's own test already routes to a table. MADR blocks are task docs' existing judgement-shaped format for decisions. The two skills already implement the split naturally; only `update-claude-docs` (which previously had NO judgement/value distinction at all) needed the fix.

**Status**: committed · **Reversible**: yes

---

### D64 — `unhobble-instructions` Softened an Absolutist Rule That Was a Deliberate Fix, Not Unexamined Scaffolding — committed — 2026-08-01

**Problem**
`unhobble-instructions` ran a second time (`task-summary`, `condense-task-doc`, `merge-task-docs`, `sweep-doc-overlaps`, plus three files carrying a prior pass on `commit`/`ship`/`templates.md`). The `/done` product-reviewer flagged that the rewrite had turned `commit/SKILL.md`'s task-doc staleness gate — "the grep hitting is the ENTIRE trigger; no judgment about whether the hit is 'real' staleness is permitted" — into "A real hit means..., run `task-summary`... rather than reasoning that the line is technically accurate right now." That phrasing invites exactly the judgment call the original forbade. Traced to D37/D57 (this same file): D57 explicitly rejected "relaxing the absolutism to 'use judgment whether the hit is real staleness'" as a listed alternative, because it reopens the rationalization pattern that caused an undocumented deviation (issue #14) before the gate existed in its current form. `unhobble-instructions`' own test — "is this a fact, or a constraint standing in for judgement the model already has?" — has no step that checks whether a rigid-looking rule already survived exactly that judgement call once and lost.

**Decision**
Chosen: patch `unhobble-instructions/SKILL.md` Process step 2 — before softening an absolutist rule ("no exceptions," "no judgment permitted," not a garden-variety `⚠️ MANDATORY`), grep the project's `decisions/*.md` for the rule's own keywords; a Rejected-alternatives entry matching the softening about to happen means the absolutism is deliberate and outranks this pass's default lean toward loosening. The commit gate itself was restored to its no-judgment trigger, kept as flowing judgement prose (no reintroduced `⚠️ MANDATORY` formatting) rather than reverted to the original's bolded-callout shape.

**Rejected**
- Reverting the commit-gate rewrite to the original's exact wording (`⚠️ MANDATORY`, ALL-CAPS). Why not: the absolutism was the load-bearing part, not the formatting — D57 fixed a lexical carve-out onto the same rule with plain prose already, so a bolded revert would undo an unrelated, correct improvement to fix an unrelated regression.
- Treating this as a one-off fix scoped to the single file. Why not: the same review also caught a smaller instance in `merge-task-docs` (a fork's "don't proceed without an answer" rule dropped, silently replaced by a different rule's sentence that happened to occupy the same paragraph position) and three stale `templates.md` line-number citations (pre-existing, but this session had the content open and didn't catch them) — three separate instances of the same underlying miss (a rewrite trusting the position/shape of the old text instead of re-deriving what specifically needed to survive there).

**Consequences**
- `commit/SKILL.md`'s staleness gate reads as judgement prose with the absolute trigger, the rationalization-trap reasoning, and the shape-not-meaning carve-out test all restored in one paragraph — grep-verified against the original wording, not assumed from the fix's intent.
- `merge-task-docs/SKILL.md` Step 2 regained its "don't proceed past a fork without an answer, even if the recommendation seems obviously right" sentence, restored separately from (not merged into) the constraint-scope sentence it had been overwritten by.
- `condense-task-doc/SKILL.md` and `merge-task-docs/SKILL.md`'s `templates.md` citations converted from line numbers to the section name ("Splitting a whole-doc MADR further") — this repo's own CLAUDE.md maintenance table already names stale line-number cross-refs as a known-bad pattern; these predated this session but were caught while the content was open.
- The code-simplifier pass (run after the fixes above) caught two further regressions on re-read: `merge-task-docs`' closing `❌ Never / ✅ Always` table had been deleted outright during the original rewrite on the reasoning that it duplicated the numbered Steps above it — but this repo's own CLAUDE.md prescribes exactly this table shape for write-decision skills ("Prompting Techniques for Commands" § Constitutional), a rule that existed and was simply not checked before the deletion; and `ship/SKILL.md` Step 3's three independently-substantial checks (which branch deploys, is there a gate, what rides along) had been flattened from a numbered list into one run-on sentence, losing the checklist structure a real push needs to step through one item at a time. Both restored.
- No new content-preservation gap found in `sweep-doc-overlaps` or `task-summary` — both agents and this session's own fact-by-fact grep verification (35 genuine facts inventoried across the four newly-touched files, each grepped post-rewrite) found these two clean.

**Status**: committed · **Reversible**: yes

### D65 — A Companion File Is a Condense Target in Its Own Right, Not Just a Destination Content Moves To — committed — 2026-08-01

**Problem**
`condense-claude-md`, `declared-budget.md`, and `update-claude-docs/references/structure.md` all described `.claude-companions/<shared|local>/CLAUDE-*.md` only as a place a section gets relocated TO during a split (Restructuring #7) — none stated that a pre-existing companion is itself subject to the condense process (atomic-file gate, longest-row scan, Restructuring #4) once it exists. A session ran `unhobble-instructions` across all seven companions of a project (correct, since unhobble's lens is judgement-vs-constraint), then ran a bare `/condense-claude-md` on the same project and explicitly excluded the companions, reasoning "already looked at these under the unhobble lens" — conflating unhobble's check with condense's own. The user caught it directly: "claude-companion supposed should be seen as claude.md too." Re-running condense against the companions (once told to) surfaced two real defects the exclusion had hidden, on that external project.

**Decision**
Fix at the shared root: `declared-budget.md` (the file all three size-judging consumers already point to) states a companion is a CLAUDE.md for every rule on the page, with the concrete action `Glob .claude-companions/**/*.md` alongside the usual `**/CLAUDE.md` sweep. `condense-claude-md/SKILL.md` and `update-claude-docs/references/structure.md` each get a short cross-reference back to it rather than restating the mechanics inline. `claude-md-pruner`'s own template already classified companions correctly (it decides pruning ELIGIBILITY, a different question from condense SCOPE) and needed no change.

**Rejected**
- Writing the full explanation independently in each of the three files. Why not: this plugin's own DRY convention (3+ owners of one rule → extract to `_shared/references/`) applies directly, and `condense-claude-md/SKILL.md`'s first draft of its cross-reference initially restated `declared-budget.md`'s internal mechanics (atomic-file gate, longest-row scan, Restructuring #4) verbatim instead of pointing at them — caught by this session's own `/done` simplifier pass against the file's own citation convention (compare its line 81, a bare `see <file>` pointer with no restatement) and tightened to match.
- Treating `unhobble-instructions` as needing no reciprocal note. Why not: this session's `/done` product-reviewer flagged that the specific failure mode — sweeping every file under one directory feels exhaustive in a way a narrower single-file skill wouldn't, so "I already looked at these" under a different skill's lens is a standing trap for the *next* misapplication in this direction — has no dedicated line anywhere in `unhobble-instructions/SKILL.md`; its existing unhobble-vs-condense boundary (line 53) is real but generic and doesn't name the companion-plurality shape of the trap. Deferred as a recommendation rather than auto-fixed in this session, since it's a scope decision about a different skill than the one this fix targeted.

**Consequences**
- A bare `/condense-claude-md` or `/update-claude-docs` invocation now Globs companions alongside root/layer/subdir CLAUDE.md files — verified this session that both cross-reference paragraphs sit at a point in their file's own read order that precedes scope being decided (not after), so the fix is load-bearing rather than decorative.
- The CHANGELOG's 1.136.28 entry originally stated "two real defects" as a directly-verified fact; this session's product-reviewer noted the defects live on an external project with no artifact in this repo (which has no `.claude-companions/` directory at all), so the entry was reworded to attribute the finding without overclaiming a re-verification that didn't happen in this repo's own tracked history.
- `unhobble-instructions/SKILL.md` gaining the reciprocal companion-plurality note remains open — see this doc's Next Steps, not auto-applied here.
- `.claude-plugin/marketplace.json` had drifted to 1.136.27 against `plugin.json`'s 1.136.28 (the recurring version-drift gap already tracked in this doc's Next Steps, 4th occurrence) — caught by this session's `/done` reviewer and bumped in the same pass.

**Status**: committed · **Reversible**: yes

---

### D66 — Unhobbling Is an Authoring Default, Not Only an Audit Pass; the Standalone Skill Survives for What Authoring Cannot Reach — committed — 2026-08-01

**Problem**
`unhobble-instructions` shipped as a lever you invoke deliberately (2c), so a rule written between invocations still landed in whatever shape its author reached for. That makes the corpus a sawtooth for overconstraint exactly as D50 describes it for density: a pass cuts markers, authoring puts them back, and the next pass is needed because nothing changed at the point of arrival. Measured before this session: 54 `⚠️`, 11 `**Tell:**`, 5 `MANDATORY` across `skills/*/SKILL.md`, concentrated in four files. User's framing: *"the skills also should follow unhobble by default, so no need to run like this."*

**Decision**
Chosen: put the shape rule at the two write points — `update-plugin` Step 3's "Workflow rule" bullet and `agent-setup` Step 4 — and keep the standalone skill. The rule states when a marker is *earned* (a cost that is silent or irreversible, where a careful reader still walks past the problem) rather than banning markers, because a blanket ban is the same mistake in the opposite direction and would have stripped the five incident-backed rules this session's own sweep preserved. The skill stays because authoring only governs *new* rules in *this plugin*: an existing file, a project's `CLAUDE.md`, or a third-party agent definition is reachable by nothing else.

**Rejected**
- Retiring `unhobble-instructions` once the principle lives in the authoring skills (the `audit-instructions` precedent, D59). Why not: that skill was discovery-only over this plugin's own corpus, which authoring genuinely subsumes. This one audits arbitrary existing files including non-plugin ones, so retiring it removes a capability rather than a duplicate.
- Authoring rule only, no backlog sweep. Why not: fixes arrival while leaving 70 markers in place, and the four concentrated files are the ones every session loads.
- A corpus-wide marker budget enforced numerically. Why not: D50's treadmill with a new number, and the sweep showed markers are not fungible — five were the load-bearing survivors of real incidents.

**Consequences**
- Corpus `⚠️` 54 → 39, `**Tell:**` 11 → 7, `MANDATORY` unchanged at 5 (every instance incident-backed). Per-file: `agent-setup` 13 → 6, `update-claude-docs` 11 → 8, `condense-claude-md` 6 → 0.
- **`done/SKILL.md` returned a negative finding and was not edited** — at its documented steady state (247 lines, 134.2 B/L) with every marker traceable to a decision that already rejected loosening it. A pass that finds nothing is a valid outcome; manufacturing a diff to justify the dispatch is the failure mode.
- **D64's gap is closed in the skill itself**: verification checked that facts survived, never that an absolute rule's *strength* did. Step 3 now marks absolutist rules while listing facts, step 5 checks they still bind. D64 was caught by a downstream product reviewer rather than by the pass — this makes the pass able to catch it.
- Three of four sweep agents independently grepped incident history and refused to loosen rules with documented backing, which is the D64 check working under delegation rather than only when the lead runs it by hand.
- **A version-drift report that dissolved on the correct comparison**: the working copies read 1.136.29 vs 1.136.33 and were written up as a 5th occurrence of the recurring gap, but `git show HEAD:` put both at 1.136.27 — the difference was another session's uncommitted bumps. This is the failure the Version Bumping convention's own `⚠️` predicts verbatim, and it was reached anyway by reading the working copies first; the correction came from re-reading that convention while building an unrelated skill, not from any gate.

- **The authoring rule as first written governed body rules and missed frontmatter, which is where the same drift was worst.** Caught by the user within the same session, twice: the rule was added to `update-plugin`, then a third `Do NOT use` clause was stacked onto that very file's description minutes later, and the pass reported clean because it checked for the *vocabulary* of overconstraint (`NEVER`, `MUST`, `⚠️`) rather than its *shape* — a prescribed ask-the-user procedure and a stacked-negation description both pass a keyword scan. Descriptions were then rewritten (`update-plugin` 1379 → 769, `unhobble-instructions` 2148 → 1213 chars, 6 imperatives removed between them, all 25 trigger signals verified surviving) and the rule extended to say a description carries routing vocabulary while its reasoning lives in the body. A `WHENEVER`/`ESPECIALLY` marking a trigger *condition* is not the same shape and was left alone in three skills.

**Status**: committed · **Reversible**: yes · Extends 2c, closes D64's verification gap
