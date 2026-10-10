<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation/unhobble-rule-writing
Gotchas (critical — full list in each ADR's Consequences):
  - A judgement-vs-value test governs CLAUDE.md entry format, not "table is always the default" (D63)
  - `unhobble-instructions` can soften an absolutist rule that was a deliberate fix, not unexamined scaffolding — grep decisions/*.md before loosening (D64)
  - A stated limitation is the fact an unhobbling pass deletes first — text saying what a tool can't do reads as hedging (D-limitation-reads-as-hedging)
Related: ../current.md (feature index), structural-mechanics.md (sibling theme file — byte thresholds/companion files/plan-doc typing, split out 2026-08-11), verification-rigor.md (sibling theme file — verifier, torn-page, routing and pointer decisions, split out 2026-10-10), ../../madr-structure/current.md
Last updated: 2026-10-10 — split out of verification-rigor.md by topic: the write-path and unhobbling-rule decisions (D63–D68, D-haiku-condense-delegation, D-mandate-vs-judgement, D-limitation-reads-as-hedging) moved here; verification-rigor.md keeps the verifier and pointer decisions
-->

# Doc Condensation — Unhobbling Rule Writing

Decisions about how rules get written and rewritten: when a marker earns its place, when prose or a table is the right shape, which absolutist rules are deliberate, which stated limitations look like hedging to an unhobbling pass, and which steps a delegated rewrite may take.

---

## Key Technical Decisions {#decisions}

### D63 — Prose Is the New Entry-Format Default, Not a Blanket Replacement for Tables — A/B-Tested, Not Just Reasoned — committed — 2026-07-31

**Problem**
D54 rejected density-reduction wholesale but never tested format choice (prose vs. table). A/B test with two agents over six scenarios: both judged correctly, but the prose agent lost confidence on the one needing an exact value (port binding). Prose conversion also dropped cross-reference pointers and precedents, mistaking them for padding.

**Decision**
(1) Judgement-vs-value test replaces unconditional "table row default": "it depends" → prose + `**Tell:**`; exact string → table row; mixed → prose + `📖 pointer` to exact value. Apply to capture rule AND Create-mode templates (`structure.md` §3/§4/§5). (2) `condense-claude-md` gains inverse lever: split table row WITHIN itself (keep prose judgment, move exact value to companion). (3) Verify checklist: flag core claim surviving while value/pointer/precedent appendage doesn't.

**Consequences**
- `update-claude-docs` declared growth (+623 B); `condense-claude-md` declared growth (165.5→167.6 B/line) and points at the new reference.
- `task-summary`'s table conventions already implement this split (gotchas are value-shaped by design).

**Status**: committed · **Reversible**: yes

---

### D64 — `unhobble-instructions` Softened an Absolutist Rule That Was a Deliberate Fix, Not Unexamined Scaffolding — committed — 2026-08-01

**Problem**
An `unhobble-instructions` rewrite softened `commit/SKILL.md`'s absolutist staleness gate, which D57 had explicitly rejected in its Rejected alternatives. The rule had already survived one attempt to loosen it (issue #14).

**Decision**
Patch `unhobble-instructions` Process step 2: before softening absolutist rule ("no exceptions," "no judgment"), grep `decisions/*.md` for the rule's keywords. If Rejected-alternatives matches the softening, the absolutism is deliberate. Restore commit gate to no-judgment trigger (prose, not warning-emoji MANDATORY formatting).

**Consequences**
- `commit/SKILL.md` staleness gate restored: absolute trigger + rationalization-trap reasoning + shape-not-meaning test.
- Simplifier found two collateral regressions (`merge-task-docs` checklist flattened to run-on; `ship/SKILL.md` Step 3 lost numbered structure). Both restored.
- `templates.md` citations converted from line numbers to section names.

**Status**: committed · **Reversible**: yes

### D65 — A Companion File Is a Condense Target in Its Own Right, Not Just a Destination Content Moves To — committed — 2026-08-01

**Problem**
Companions were treated only as condense destinations, never as targets, so a bare `/condense-claude-md` excluded them. User: "companions should be seen as claude.md too." Re-running revealed two hidden defects.

**Decision**
`declared-budget.md` (shared root for size-judging consumers): companions are CLAUDE.md under every rule. Add `Glob .claude-companions/**/*.md` alongside `**/CLAUDE.md`. `condense-claude-md`/`structure.md` cross-reference back rather than restate.

**Consequences**
- Bare `/condense-claude-md` now includes companions. Cross-references sit before scope is decided (load-bearing).
- `unhobble-instructions` reciprocal note (companion-plurality trap name) deferred to Next Steps.

**Status**: committed · **Reversible**: yes

---

### D66 — Authoring Should Follow Unhobble by Default, Not Only on Audit — committed — 2026-08-01

**Problem**
`unhobble-instructions` ran on-demand only, so rules written between runs landed as authored. The corpus was a sawtooth: a pass cut markers and authoring restored them (measured: 54 warning-emoji markers, 11 `**Tell:**`, 5 `MANDATORY`, concentrated in 4 files).

**Decision**
Authoring rule at two write points (`update-plugin` Step 3, `agent-setup` Step 4): marker earns place if it signals silent/irreversible cost. Keep standalone skill for existing files/projects.

**Consequences**
- Corpus: warning markers 54→39, `**Tell:**` 11→7, `MANDATORY` stable at 5 (all incident-backed).
- `done/SKILL.md` returned a negative finding at steady state; manufacturing a diff would have been the failure mode.
- Step 3 marks absolutist rules and Step 5 checks they bind (closes the D64 gap).
- Authoring rule extended: descriptions carry routing vocabulary, bodies carry reasoning; `WHENEVER`/`ESPECIALLY` trigger-condition markers are left alone.

**Status**: committed · **Reversible**: yes · Extends 2c, closes D64's verification gap

---

### D68 — Read the File as a Document Before Reading Any Rule — committed — 2026-08-02

**Problem**
A session grepped for markers, graded the hits and began editing. User: "read the skills as a document, not just grep-and-edit." The skill's framing invited a per-rule enumeration before any document-level read.

**Decision**
Document-level read runs FIRST (what reader must do in order; where rules sit relative to their moment; what is stated twice). Per-rule fact-vs-constraint test runs SECOND. Report leads with structural changes; wording-only pass says so.

**Consequences**
- Three shape defects were invisible to a marker scan: `task-summary` had 9 rules at 3 homes each plus a contradiction (Validate says "no rows deleted", the Pruning section deletes rows); `update-claude-docs` mandated "≤2 sentences" while running 4–5; `done`'s chain-breaks were reasoning while its derivable material was dispatch tables (backwards).
- `task-summary` 26.2 KB→25.6 KB (16 facts verified by grep); `update-claude-docs` −1.1 KB.
- An orphaned reference from 1.137.17 was fixed by moving the arrival-rate rule back above its citation.
- The report now distinguishes a wording-only pass from one that never checked shape.

**Status**: committed · **Reversible**: yes · Extends D66

### D-haiku-condense-delegation — Draft May Be Delegated to `haiku`; Verify May Not — committed — 2026-08-07

**Problem**
`two-tier-condense.md` forbade spawning agents for drafts. The preference changed, and the `haiku` skill was built for mechanical rewrite plus external verification.

**Decision**
Allow Draft delegation to `haiku` agent; keep Verify non-delegable. Measured: haiku condense of 375-line file cut 35% bytes with rules intact. External verification makes delegation safe (agent grading its own output uses same read that produced it — report is artifact, not evidence).

**Consequences**
- `two-tier-condense.md`: Draft section now states delegation call explicitly (`Skill(skill: "syafiqkit:haiku")`).
- New failure mode: a delegated rewrite keeps an identifier intact while reversing the claim around it (kebab-case relabelled "camelCase"), which survives grep. All three files (two-tier, unhobble, haiku) now carry this check.
- `condense-claude-md`/`condense-task-doc` repoint at `two-tier-condense.md` instead of restating "no spawned agent."

**Status**: committed · **Reversible**: yes

### D-mandate-vs-judgement — The Write Path's Defect Was Contradicting Mandates, Not Missing Guidance — committed — 2026-08-09

**Problem**
A session set out to make every doc-writing skill "follow" the Claude-5 article, without first opening D55 (the failure D-verdict-records-lever records). An exhaustive read found the framing wrong: D55 had graded all 9 claims, D63 had A/B-tested the central one and found blanket judgement-prose wrong for value-shaped content, and D50 had rejected from-scratch rewriting twice (`skills/` measured at 2.04:1 add/remove over 7 days, the rate that makes a rewrite refill).

What the read did find: the write path carries mandates that override judgement, and five contradict each other or themselves. `condense-task-doc` required table shape to match `templates.md` "exactly" while `condense-claude-md` called shape "a means, not the thing being preserved". Two files mandated different CLAUDE.md section orders. `templates.md` shipped literal empty rows under pre-seeded `### Backend`/`### Frontend` headings, so a literally-followed template emitted empty tables. Columns were locked "regardless of which axis is used" while the same file mandated different columns two sections earlier. `condense-claude-md` contradicted itself on splitting an under-budget file.

**Decision**
Fix the five contradictions and add nothing else. Each is a disagreement between two existing files, which bounds the work and keeps it off D50's treadmill. Shape mandates become judgement with the reasoning stated; facts carried inside them (Backend/Frontend, Hosting/Build-Pipeline, both column shapes) survive as guidance. One addition only: D63's prose-vs-value boundary moves into `_shared/references/writing-style.md`, which four consumers already read.

**Rejected**
- Rewriting the write-path skills from scratch. Why not: D50 rejected it twice, and the 2.04:1 arrival rate is what makes stock fixes temporary. The defect tracks mandate density, not article awareness: `skill-creator` is ~10% mandate and names judgement explicitly; `templates.md` is ~65–70% mandate and never mentions it.
- Making judgement prose the universal output shape. Why not: D63's A/B test found prose won on judgement questions and *lost confidence* on the one needing an exact value. Applying it past its tested half is D54's error inverted.
- Treating the global `~/.claude/CLAUDE.md` as the fix. Why not: the plugin ships and the global file does not. A consumer running `/update-claude-docs` gets these templates with nothing in their environment to supply the missing judgement.

**Consequences**
- Five contradictions resolved. `condense-task-doc`'s conformance rule now conserves content over form (keeping the one real fact: renaming *kept* columns breaks the positional `awk -F'|'` checks); `condense-claude-md` cites `structure.md` §3 as the single home for section order; `templates.md` emits shape rather than empty rows; the split rule reads as one instruction across its three former sites.
- **A third copy of the section order surfaced** in `other-modes.md`. It matched §3, so it was redundancy rather than a second contradiction, but a fact that has already drifted between two copies does not get a third; collapsed to a pointer.
- **A downstream enforcement site outlived the mandate it enforced.** `task-summary/SKILL.md` step 2 still called "wrong columns" drift against a template that no longer locks them. Found by grepping the mandate's vocabulary, not the changed file's name: a mandate's removal has to reach whatever enforces it.
- **Gate B now asks the replace/route/declare question**, closing the open half D50 named. That gate hung off `update-plugin`, while rules arrive as direct hand-edits, which is exactly what Gate B detects. Declared growth stays a legitimate answer; what it stops being is the silent default.
- The arrival rate is the measurement to watch, not this change's byte delta (2.04:1 over 7 days, 1.74:1 over 30 at the time of writing). A single re-measure proves nothing.

**Status**: committed · **Reversible**: yes

---

### D-limitation-reads-as-hedging — Stated Limitations Read as Hedging to Unhobble — committed — 2026-08-09

**Problem**
Two haiku agents inverted passage meaning by compressing: `read-summary` changed "`ListAgents` CANNOT..." (withholding a guarantee) to "checking PREVENTS..." (asserting one). D64's grep of `decisions/*.md` cannot catch this, since tool limitations are facts about the world, not recorded decisions.

**Decision**
Name the shape in `unhobble-instructions` fact-vs-constraint: text saying what a tool cannot do or what a check doesn't prove reads as hedging; pass hunting over-caution cuts it. Stated as one sentence pair beside "losing genuine fact is failure mode," no worked incident.

**Consequences**
- The verification method D64 relied on (inventory the genuine facts, grep each one post-rewrite) is blind to this class by construction: both defects kept every identifier and changed only the claim around it. What surfaced them was reading the rewritten passage against its snapshot and asking what a reader would now *do* differently.
- All four delegated agents reported "zero facts lost"; two were wrong. The drafter's report is an artifact to check, never evidence (D-haiku-condense-delegation).
- Four other findings in the same batch were false alarms from token-diffing (a dropped `explore-delegation.md` pointer was a correct cut). Reporting a missing-token count as data loss is its own error, and costlier than the loss it chases.
- One agent scoped to one file also edited four `.claude/agents/*.md` files: out of mandate but correct, since Process step 7 requires reconciling inbound pointers. No template parity gap; the templates carry `<!-- describe -->` placeholders.

**Status**: committed · **Reversible**: yes
