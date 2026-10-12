<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/agent-architecture/drift-gates-and-modes
Gotchas (critical — full list in each ADR's Consequences):
  - A confirmation gate that defaults ON forces the caller to pre-empt it every invocation (D28)
  - Drift checks must cover addition (missing agent), not just modification (D38)
  - Widening a threshold table needs every downstream decision point checked, not just the table (D39)
  - `/done` docs-only runs the full agent trio (not just a referential check); the prose-vs-executable sub-gate is gone (D58, supersedes D52's 1.127.0 gate)
Related: ../current.md (feature index), ../../doc-condensation/current.md, ../../madr-structure/current.md, verification-checklists.md and reader-behaviour-and-method.md (sibling theme files split out of verification-rigor.md)
Last updated: 2026-10-12 · split out of verification-rigor.md; D28, D38, D39, D48, D58, D-parity-drift-is-bidirectional moved word for word
-->

# Agent Architecture: Drift Detection, Gates, and Modes

How the plugin spots template drift and missing agents, and which confirmation gates and modes default on or off.

---

## Drift Detection: How to Spot What Changed When Templates Matter

### D38 — `agent-setup`'s Drift Check Only Covered Modification, Never Addition; Model-Override Exemption Was Ambiguous — committed — 2026-07-19

**Problem**
GitHub issue #7, filed via `/update-plugin` from a consumer install, reported two gaps in `agent-setup` Step 1/Step 5 found during a real update-run. (1) Step 1's "Agents exist" row and Step 5's template-drift check both only diff *existing* `.claude/agents/*.md` files against their templates — neither instructs enumerating `templates/*.template.md` against `.claude/agents/*.md` to catch a template with **no generated copy at all** (`task-builder` predated the agents being regenerated; caught only by a manual `ls`). (2) Step 5's exemption clause — "model overrides already justified in-file are NOT drift" — reads as "leave model overrides alone," so an unjustified override (`code-simplifier` on `opus` vs. template's `sonnet`, no comment) was left in place instead of flagged, forcing an explicit user correction.

**Decision**
Chosen: added a distinct **Missing-agent check** (Step 1 row + new Step 5 checklist item) instructing `comm -23` on sorted basenames of `templates/*.template.md` vs `.claude/agents/*.md` — any first-file-only entry is a missing agent, not drift, create it in the same pass. Sharpened the Template-drift item's model-override clause: an in-file override is preserved **only if** a justification comment accompanies it; unjustified deviation from the template's `model:` **is** drift, align it. Verified both fixes against this repo's own live state — `task-builder` and `browser-verifier` templates currently have no generated agent here, reproducing Finding 1 exactly; `comm -23` on the corrected argument order surfaces both.

**Rejected**
- Leaving the two checks merged into one "Template-drift check" item. Why not: addition (no agent exists) and modification (agent exists but stale) are different failure classes needing different actions (create vs. backport) — collapsing them into one item is how the addition case kept going unmentioned in the first place.

**Consequences**
- `agent-setup` Step 5 now has two checklist items where addition and drift used to share one: **Template-drift check** (modification) and **Missing-agent check** (addition).
- This repo's own `.claude/agents/` still lacks `task-builder.md`/`browser-verifier.md` — the fix documents the gap but doesn't backfill it; flagged in Next Steps for a future `/agent-setup` run.
- Plugin version bumped 1.116.3→1.116.4.

**Status**: committed · **Reversible**: yes

---

### D48 — Template-Drift Check's Delegated Diff Missed Field-Level Drift — committed — 2026-07-24 · renumbered from D40 (2026-07-26, collided with doc-condensation's older D40)

**Problem**
Running `agent-setup`'s Step 5 on Autorentic's 8 generated agents, the Template-drift item's `diff` instruction was executed by delegating a single agent to summarize all 8 file-vs-template diffs in prose (~400-word budget). That agent correctly caught a whole-block issue (`code-reviewer.md` carrying a stray `Write`/`Edit` tool grant) but reported "no drift" on 5 files that, on direct `grep "^description:"`, had visibly thinner trigger descriptions than their templates — missing the newer cue-phrase/negative-guidance pattern entirely. A second manual check then found a third defect the same diff agent missed: 6 of 8 files carried an `Agent`-tool inline comment copy-pasted from `Explore`'s template line, naming the wrong agent (e.g. "lets this Explore spawn..." on `Plan`/`code-simplifier`/`product-reviewer`/`browser-verifier`/`claude-md-pruner`). Both defect classes are real per-field drift that a whole-section prose summary calls "no drift" because nothing whole (section/table/tool) is missing — only a value inside an otherwise-present line.

**Decision**
Chosen: added a checklist sub-item directly under Template-drift check mandating two specific greps run against BOTH copies directly, not via a delegated summary: `grep "^description:"` (read side-by-side in full, not just present/absent) and `grep -n "  - Agent\|# lets this"` (confirm the comment names THIS agent, not a copy-pasted one).

**Rejected**
- Telling the delegated diff agent to "be more thorough" or raising its word budget. Why not: the failure mode isn't insufficient effort, it's the unit of comparison — a prose summary naturally compares sections/tables as present-or-absent and has no natural trigger to flag "this line exists in both but reads differently." A larger budget doesn't fix the comparison granularity.
- Replacing the delegated diff entirely with a mandatory literal `diff -u` dump per file. Why not: whole-file diffs on 8 generated files (each with large filled-in project-specific tables) would be mostly noise; the two targeted greps isolate exactly the fields known to drift (description, per-tool comments) without demanding the caller read 8 full diffs.

**Consequences**
- `agent-setup` Step 5's Template-drift checklist item now has a mandatory sub-check naming the exact two greps to run directly.
- No template or generated-agent content changed by this decision — it's a process fix to how drift is VERIFIED, not a new rule about what agents should contain.
- Plugin version bumped 1.123.9→1.123.10.

**Status**: committed · **Reversible**: yes

---

### D-parity-drift-is-bidirectional — Both Sides of a Template/Agent Pair Can Be Ahead at Once, So "Patch the Template" Names the Wrong Repair — committed (v1.149.0) — 2026-08-14

**Problem**
A product review flagged `claude-md-pruner`'s generated agent as edited without its template, citing the standing rule that editing `.claude/agents/<name>.md` requires patching `skills/agent-setup/templates/<name>.template.md` in the same change. Reading the diff inverted the finding: the **template** carried the newer unhobbled prose ("Edit surgically rather than rewriting whole files…", 152 lines) while the **generated agent** still held old rigid bullet lists ("Use `Edit` tool (not `Write`)", 142 lines) — but the agent held the better guard placement, with the never-remove list moved into classification instead of trailing the file after deleting had begun. Each side was ahead on a different axis because different passes edit them: an `unhobble-instructions` sweep rewrites the template's prose, while a session fixing live agent behaviour edits the generated copy. D38 and the root CLAUDE.md rule both assume exactly one file is stale, so following either literally discards whichever improvement the other side carried; copying toward the template additionally ships repo-specific text ("this repo has no backend/frontend split") upstream into a file meant to stay generic.

**Decision**
Chosen: read the diff and decide **per hunk** which side is right, rather than picking a direction. The signal that both were edited independently is a `diff <template> <agent>` whose changes cluster into distinct topics instead of one contiguous block. Applied here by moving only the guard placement into the template and leaving its prose alone. Root `CLAUDE.md`'s Agent Definition Parity section now states this alongside D38's "parity proves agreement, never correctness".

**Rejected**
- Treating the generated file as canonical whenever it is newer by mtime. Why not: mtime records which pass ran last, not which content is better, and the two passes here were editing different axes — the older file was right about prose.
- Regenerating the agent from the template to force agreement. Why not: that is the wholesale copy under a different name, and it silently discards the guard-placement fix the generated file was carrying.

**Consequences**
- A parity check that returns "these differ" is the start of a read, not a verdict on which file to overwrite.
- Two sessions independently made this same guard-placement fix and collided in the working tree; the peer's structure (its own numbered step) was kept and this session's inline copy dropped. Their renumbering left duplicate step numbers and a dead `step 0.5` back-reference, both fixed here — a renumbering defect neither writer could see alone.
- Plugin version bumped to 1.149.0.

**Status**: committed · **Reversible**: yes

---

## Gates, Modes, and Default Behavior

### D28 — A Confirmation Gate That Defaults ON Forces the Caller to Pre-Empt It Every Invocation — committed — 2026-07-15

**Problem**
`merge-task-docs` Step 2 gated all three merge decisions (scope, structure, naming) behind `AskUserQuestion` by default, even when the subsystem test already made the grouping obvious. A session spawning agents to execute an already-approved merge plan had to explicitly instruct each agent "the merge decision is already made and approved — do not ask questions" to get it to proceed — the skill's default behavior fought the caller's actual intent, and the workaround had to be re-typed every invocation rather than being something the skill itself recognized.

**Decision**
Chosen: invert the default. Step 2 now proceeds with the recommended grouping/structure/name, stated inline as it goes, and only stops for `AskUserQuestion` on genuine ambiguity — two candidate groupings equally valid under the subsystem test, a flat-merge overage large enough to hurt cold-start readability (~450+ lines), or an invented name with no obvious pick. A user's invocation stating the decision is pre-made/approved (any wording, not one exact phrase) is now recognized as blanket consent for all three forks, not just a magic phrase that happens to work.

**Rejected**
- Keep the default-ask behavior and just document the override phrase more prominently. Why not: same shape as D25's rejected option — a documented workaround the caller must remember and re-supply every time is a rule that survives in prose but fails at the moment of use; the fix belongs in the skill's default, not in caller discipline.
- Remove `AskUserQuestion` from `merge-task-docs` entirely. Why not: genuine ties (two equally-valid groupings) and truly ambiguous names still need a human call — the fix is narrowing when it fires, not eliminating it.

**Consequences**
- Matching Rules-table row in `merge-task-docs/SKILL.md` fixed — it previously prescribed "ask every time," which directly contradicted the new default and would have silently reverted the fix on the skill's next self-read.
- A user pushing back on a stated recommendation after the fact is now treated as a normal in-flight correction, not a sign the pre-check should have fired — this matches how the rest of the plugin treats corrections (revise and continue) rather than treating every disagreement as evidence a gate was needed.
- Plugin version bumped 1.79.0→1.80.0; CHANGELOG entry added.

**Status**: committed · **Reversible**: yes

---

### D39 — Raised `/done`'s Agent-Count File Thresholds, Removed Light Mode — committed — 2026-07-20

**Problem**
User wanted `/done` Step 1's changed-file thresholds raised (they were hitting the 41+/7-agent tier too easily). Widening the buckets alone left a stale asymmetric carve-out: light mode (`<5` files → 1 reviewer, 0 simplifier, 0 product reviewer) referenced the pre-raise top bucket and was threaded through four separate decision points (agent count, product-reviewer skip, `task-summary` invocation scope, Output table format), not just the table.

**Decision**
Chosen: raised the three file-count tiers **≤15/16–40/41+ → ≤30/31–80/81+** (agent counts per tier unchanged: 3/5/7 total), and removed light mode entirely rather than rescale its cutoff — every diff now routes through docs-only/infra-only/full mode only. Full mode's `task-summary` invocation is now always a bare, unscoped multi-domain scan (light mode's "pass the known doc path" branch is gone).

**Rejected**
- Scaling light mode's `<5` cutoff proportionally with the raised tiers (e.g. `<10`). Why not: user explicitly said "i dont want light mode" once asked — the carve-out's asymmetric agent count (skipping the simplifier entirely) was judged not worth keeping as a separate case once the main tiers moved.
- Raising only the per-role cap (e.g. 4-5 reviewers at the top tier) instead of the bucket boundaries. Why not: user's actual complaint was hitting the top tier too easily at moderate file counts, not that the top tier's agent count was too low once reached.

**Consequences**
- `skills/done/SKILL.md`: mode-selection section, the agent-count table, the `task-summary` invocation rule, the docs-only/infra-only exception cross-references, and the Output-table Product row all edited to drop light-mode language — verified via `grep -i "light"` returning zero hits post-edit.
- A session that previously qualified for light mode (small, single-domain, no new capability) now runs full-mode Step 1 (1 reviewer + 1 simplifier + product-reviewer-if-project-agent-exists, ≤30 files) instead of the old 1-reviewer-only path — slightly more agent spend on small sessions, traded for one fewer mode to reason about.
- Plugin version bumped 1.116.7→1.117.0 (minor bump: removes a documented mode, not a patch-level tweak).

**Status**: committed · **Reversible**: yes (light mode can be reintroduced if the extra agent spend on trivial sessions proves unwanted)

---

### D58 — `/done`'s Docs-Only Mode Runs the Full Agent Trio, Not Just a Referential Check — Removing the Prose-vs-Executable Sub-Gate — committed (v1.132.0) — 2026-07-27

**Problem**
D52 fixed docs-only mode to gate on prose-vs-executable rather than `.md`-vs-code (1.127.0), so executable instruction markdown routed to full mode and only true prose skipped the agents. But the distinction was itself an error surface: it was subtle, easy to misread, and required a per-diff judgment call about whether a `.md` file was "executable." This session's own diff was mostly `.md`, ran (correctly, via that gate) in full mode, and the product reviewer caught a real 🟠 ordering defect (the GH #14 carve-out left a trailing "re-grep to zero" cleanup unsatisfiable for the carve-out path) — fresh evidence that a doc diff hides agent-catchable defects, and that the safe default is to always run the agents on docs.

**Decision**
Chosen: docs-only now runs the full agent trio (like full mode) PLUS the docs-specific referential-integrity check — "additive, not subtractive." The prose-vs-executable sub-gate is removed entirely, eliminating the wrong-call site. Only infra-only (reviewer-only) and ops-only (no agents, live read-back) still narrow the agent set. The whole-session partition rule (count committed + uncommitted files) survives as a plain file-counting rule, no longer a mode-selection escape hatch. User chose this explicitly over two narrower options.

**Rejected**
- Product-reviewer-only on docs (skip simplifier/reviewer). Why not: keeps the prose-has-no-code premise for two of three lenses, and the reviewer/simplifier do find real issues in executable markdown.
- Only sharpening the prose-vs-executable gate's wording, no behaviour change. Why not: the distinction *itself* was the error surface, not merely its phrasing — a clearer gate is still a gate a reader can misjudge.

**Consequences**
- Docs-only is now a superset of full mode for doc diffs (adds the referential check), not a reduced mode — supersedes D52's rejected-option reasoning and the 1.127.0 prose-vs-executable gate it referenced.
- One fewer mode-selection judgment call: any all-doc diff runs the same agents regardless of whether the markdown is "executable."

**Status**: committed · **Reversible**: yes · **Supersedes** the 1.127.0 prose-vs-executable gate (D52's rejected option)

**Problem**
D24 and D49 each left an audit row open: whether any skill besides `done`/`ship` carried the self-caught-deviation blind spot, and whether any carried the empty-input-pass shape. Both were unexamined across the other 19 substantive skills, and neither is visible without reading each file against the definition — no grep expresses either shape.

**Decision**
Chosen: audit all 19 in one pass (both shapes per file, since one read covers both), delegated to four `Explore` agents partitioned by FILE so no two could contradict each other on the same line, each reading this ADR file directly rather than a paraphrase. Results:
- **D24: clean.** The shape requires a *reporting* gate — a step deciding what to tell the user about problems. `done` Step 5 is the only one in the plugin; `update-plugin` is the near-equivalent and already names deviation in its Step 1 signal table. Constraint tables (`brainstorming`'s HARD-GATE, `gchat-format`'s completeness check) decide what to do next, not what to report, and are not the shape.
- **D49: two confirmed, both fixed.** `sweep-doc-overlaps` Step 4 terminated on zero merge candidates with no control, and because Step 2 delegates every verdict to batch agents, one mis-scoped batch contributes zeroes that compile into `"N pairs checked, correctly separated"` — a line the user reads as verified. Now gated on three checks (inventory reconciliation, a reasoned `keep separate` returned, one pair spot-checked inline). `md-to-pdf` Step 1 branched on a bare `grep -c` whose `0` is identical for no-diagrams, unreadable path, and a NUL-byte binary skip; gained a `grep -c ''` control and the `grep -a` recovery.
- Left alone: `hobby-review` Step 5's unverified "after the conversation naturally reaches the 3 gates" — real but soft guidance, and it writes nothing.

**Rejected**
- Partitioning the agents by defect shape instead of by file. Why not: two agents would each read all 19 files for double the cost, and neither would hold the other's context on a shared line.
- Accepting the agents' findings as reported. Why not: 3 of 4 filed findings that did not survive re-verification against the file — one quoted the very line disproving its own claim (`condense-task-doc` step 6 already carries "zero deletions means this step wasn't done"). An agent handed a defect definition treats the definition's absence as its own failure. Their *clean* verdicts were the reliable half, because the prompt required each to enumerate which steps were checked rather than assert "clean".

**Consequences**
- Both `## Next Steps` audit rows are answered and removed.
- `sweep-doc-overlaps` inherits the must-hit control `merge-task-docs` has carried since D25 — the discovery front-end deciding whether the merge runs at all never got it, only the skill with the destructive step did. A shared-mechanism fix should have swept both then.
- Generalizes the delegation lesson to a global `~/.claude/CLAUDE.md` agent-bootstrap row: an audit agent's findings need per-finding verbatim quotes plus your own re-verification; its clean verdicts need enumerated scope.
- Folded into unreleased 1.123.27 rather than minting a version — same D49 theme as that entry's existing content.

**Status**: committed · **Reversible**: yes

---

