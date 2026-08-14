<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation/verification-rigor
Gotchas (critical — full list in each ADR's Consequences):
  - A judgement-vs-value test governs CLAUDE.md entry format, not "table is always the default" (D63)
  - `unhobble-instructions` can soften an absolutist rule that was a deliberate fix, not unexamined scaffolding — grep decisions/*.md before loosening (D64)
  - A stated limitation is the fact an unhobbling pass deletes first — text saying what a tool can't do reads as hedging (D-limitation-reads-as-hedging)
  - Confirming a passage is gone doesn't establish it should have gone — apply the target skill's own bar, not your own read of "looks rigid" (D-dropped-is-not-the-same-as-correctly-dropped)
  - A file still being written is not an artifact to verify — wait for it to stop moving (D-torn-page-verification)
  - A fact routes by what it's ABOUT, not where it was found (D-route-by-subject-not-discovery)
Related: ../current.md (feature index), structural-mechanics.md (sibling theme file — byte thresholds/companion files/plan-doc typing, split out 2026-08-11), ../../agent-architecture/current.md, ../../agent-architecture/decisions/verification-rigor.md (sibling verification-rigor file — agent-dispatch/scan-control mechanics rather than unhobble-instructions correctness; distinct domain, same name by coincidence), ../../madr-structure/current.md
Last updated: 2026-08-11 — split out of structural-splits.md once it grew to 21 decisions across two themes; this file holds the unhobble-instructions/verification-correctness half (overconstraint detection, drop-grading, torn-page reads, routing-by-subject)
-->

# Doc Condensation — Unhobbling & Verification Correctness

Decisions about whether `unhobble-instructions` rewrites and their verifiers get the judgement call right: what a marker earns its place by, what counts as a genuine loss vs. correct trimming, when a target is safe to read, and where a fact actually belongs.

---

### D63 — Prose Is the New Entry-Format Default, Not a Blanket Replacement for Tables — A/B-Tested, Not Just Reasoned — committed — 2026-07-31

**Problem**
D54 rejected density-reduction wholesale but never tested format choice (prose vs. table). A/B test: two agents, 6 scenarios (OOM, hand-edit prod, password copy, test-DB mismatch, port-binding, staging/prod DB). Both scored correctly on judgement questions. Prose agent lost confidence on the one needing an exact value (port binding). Prose conversion also dropped cross-reference pointers and example precedents, mistaking value/pointers for padding.

**Decision**
(1) Judgement-vs-value test replaces unconditional "table row default": "it depends" → prose + `**Tell:**`; exact string → table row; mixed → prose + `📖 pointer` to exact value. Apply to capture rule AND Create-mode templates (`structure.md` §3/§4/§5). (2) `condense-claude-md` gains inverse lever: split table row WITHIN itself (keep prose judgment, move exact value to companion). (3) Verify checklist: flag core claim surviving while value/pointer/precedent appendage doesn't.

**Consequences**
- `update-claude-docs`: declared growth (94.3→96.2 B/L, +623B).
- `condense-claude-md`: declared growth (165.5→167.6 B/L) pointing to new reference.
- `task-summary`'s table conventions already implement this split naturally (gotchas are value-shaped by design).

**Status**: committed · **Reversible**: yes

---

### D64 — `unhobble-instructions` Softened an Absolutist Rule That Was a Deliberate Fix, Not Unexamined Scaffolding — committed — 2026-08-01

**Problem**
`unhobble-instructions` rewrite softened `commit/SKILL.md`'s absolutist staleness gate. D57 explicitly rejected this softening in its Rejected alternatives. Rule already survived one attempt to loosen it and lost (issue #14).

**Decision**
Patch `unhobble-instructions` Process step 2: before softening absolutist rule ("no exceptions," "no judgment"), grep `decisions/*.md` for the rule's keywords. If Rejected-alternatives matches the softening, the absolutism is deliberate. Restore commit gate to no-judgment trigger (prose, not `⚠️ MANDATORY` formatting).

**Consequences**
- `commit/SKILL.md` staleness gate restored: absolute trigger + rationalization-trap reasoning + shape-not-meaning test.
- Simplifier found two collateral regressions: `merge-task-docs` lost a checklist (flattened to run-on), `ship/SKILL.md` Step 3 lost numbered check structure. Both restored.
- `templates.md` citations converted from line numbers to section names (stale line-number refs are a known-bad pattern).

**Status**: committed · **Reversible**: yes

### D65 — A Companion File Is a Condense Target in Its Own Right, Not Just a Destination Content Moves To — committed — 2026-08-01

**Problem**
Companions treated as condense *destination* only, never as condense *target*. A session unhobbled companions, then bare `/condense-claude-md` excluded them (reasoning "already looked at these"). User: "companions should be seen as claude.md too." Re-running revealed two hidden defects.

**Decision**
`declared-budget.md` (shared root for size-judging consumers): companions are CLAUDE.md under every rule. Add `Glob .claude-companions/**/*.md` alongside `**/CLAUDE.md`. `condense-claude-md`/`structure.md` cross-reference back rather than restate.

**Consequences**
- Bare `/condense-claude-md` now includes companions. Cross-references sit before scope is decided (load-bearing).
- `unhobble-instructions` reciprocal note (companion-plurality trap name) deferred to Next Steps.

**Status**: committed · **Reversible**: yes

---

### D66 — Authoring Should Follow Unhobble by Default, Not Only on Audit — committed — 2026-08-01

**Problem**
`unhobble-instructions` ran on-demand only, so rules written between runs landed as authored. Corpus was a sawtooth: pass cuts markers, authoring restores them. Measured: 54 `⚠️`, 11 `**Tell:**`, 5 `MANDATORY` (concentrated in 4 files).

**Decision**
Authoring rule at two write points (`update-plugin` Step 3, `agent-setup` Step 4): marker earns place if it signals silent/irreversible cost. Keep standalone skill for existing files/projects.

**Consequences**
- Corpus: `⚠️` 54→39, `**Tell:**` 11→7, `MANDATORY` stable at 5 (all incident-backed).
- `done/SKILL.md` returned negative finding (at steady state); manufacturing a diff would be the failure mode.
- Step 3 marks absolutist rules, Step 5 checks they bind (closes D64 gap).
- Authoring rule extended: descriptions carry routing vocabulary, bodies carry reasoning; `WHENEVER`/`ESPECIALLY` marking trigger condition are left alone.

**Status**: committed · **Reversible**: yes · Extends 2c, closes D64's verification gap

---

### D68 — Read the File as a Document Before Reading Any Rule — committed — 2026-08-02

**Problem**
Session grepped for markers, graded hits, began editing. User: "read the skills as a document, not just grep-and-edit." Skill's framing invited a per-rule enumeration before any document-level read.

**Decision**
Document-level read runs FIRST (what reader must do in order; where rules sit relative to their moment; what is stated twice). Per-rule fact-vs-constraint test runs SECOND. Report leads with structural changes; wording-only pass says so.

**Consequences**
- Three shape defects invisible to marker scan: `task-summary` had 9 rules at 3 homes each + contradiction (Validate says "no rows deleted", Pruning section deletes rows); `update-claude-docs` mandates "≤2 sentences" while running 4-5; `done`'s chain-breaks are reasoning, derivable material is dispatch tables (backwards).
- `task-summary` 26.2KB→25.6KB (16 facts verified by grep); `update-claude-docs` −1.1KB.
- Orphaned reference in 1.137.17 fixed by moving arrival-rate rule back above its citation.
- Report now distinguishes wording-only pass from one that never checked shape.

**Status**: committed · **Reversible**: yes · Extends D66

### D-haiku-condense-delegation — Draft May Be Delegated to `haiku`; Verify May Not — committed — 2026-08-07

**Problem**
`two-tier-condense.md` forbade spawning agents for draft. Preference changed; `haiku` skill built for mechanical rewrite + external verification. Need delegation path for condense skills.

**Decision**
Allow Draft delegation to `haiku` agent; keep Verify non-delegable. Measured: haiku condense of 375-line file cut 35% bytes with rules intact. External verification makes delegation safe (agent grading its own output uses same read that produced it — report is artifact, not evidence).

**Consequences**
- `two-tier-condense.md`: Draft section now states delegation call explicitly (`Skill(skill: "syafiqkit:haiku")`).
- New failure mode: delegated rewrite can keep identifier intact while reversing claim around it (kebab-case relabelled "camelCase") — survives grep. All three (two-tier, unhobble, haiku) now carry this check.
- `condense-claude-md`/`condense-task-doc` repoint at `two-tier-condense.md` instead of restating "no spawned agent."

**Status**: committed · **Reversible**: yes

### D-mandate-vs-judgement — The Write Path's Defect Was Contradicting Mandates, Not Missing Guidance — committed — 2026-08-09

**Problem**
A session set out to make every doc-writing skill "follow" the Claude-5 article, having already spent hours on it the day before without opening D55 (the failure D-verdict-records-lever records). An exhaustive read found the framing wrong twice over: D55 had graded all 9 claims, D63 had A/B-tested the central one and found blanket judgement-prose measurably *wrong* for value-shaped content, and D50 had rejected from-scratch rewriting twice — with `skills/` measured live at 2.04:1 add/remove over 7 days, the rate that makes a rewrite refill.

What the read did find was concrete: the write path carries mandates that override judgement, and five contradict each other or themselves. `condense-task-doc` required table shape to match `templates.md` "exactly" while its sibling `condense-claude-md` called shape "a means, not the thing being preserved". Two files mandated different CLAUDE.md section orders. `templates.md` shipped literal empty rows (`| | |`) under pre-seeded `### Backend`/`### Frontend` headings and a phantom `| B1 | Critical | | |`, so a literally-followed template emitted empty tables. Columns were locked "regardless of which axis is used" while the same file mandated different columns two sections earlier. `condense-claude-md` contradicted itself on whether an under-budget file may be split.

**Decision**
Chosen: fix the five contradictions, add nothing else. Each is a disagreement between two files that already exist, which bounds the work and keeps it off D50's treadmill. Shape mandates become judgement with the reasoning stated; facts that were carried inside them (Backend/Frontend, Hosting/Build-Pipeline, both column shapes) survive as guidance rather than requirements. One addition only: D63's measured prose-vs-value boundary moves into `_shared/references/writing-style.md`, which `task-summary`, `update-claude-docs`, `condense-claude-md` and `notes-summary` all already read, so every consumer gets the boundary instead of just `update-claude-docs`.

**Rejected**
- Rewriting the write-path skills from scratch. Why not: D50 rejected it twice, and the measured 2.04:1 arrival rate is what makes stock fixes temporary. The correlation found while surveying is the same story — `skill-creator` is ~10% mandate with no output template and names judgement explicitly; `templates.md` is ~65-70% mandate and never mentions it. The defect tracks mandate density, not article awareness.
- Making judgement prose the universal output shape. Why not: D63 measured the boundary with two isolated agents over six scenarios — prose won on judgement questions and *lost confidence* on the one needing an exact value. Applying it past its tested half is D54's error inverted.
- Treating the global `~/.claude/CLAUDE.md` as the fix. Why not: the plugin ships and the global file does not. A consumer running `/update-claude-docs` gets these templates with nothing in their environment to supply the missing judgement, since the plugin is barred from reading a user's global file. The global file's flatness is a symptom of the skill that maintains it.

**Consequences**
- Five contradictions resolved: `condense-task-doc`'s conformance rule now conserves content over form (keeping the one real fact — renaming *kept* columns breaks the positional `awk -F'|'` checks); the divergent section order in `condense-claude-md` cites `structure.md` §3 as its single home; `templates.md` emits shape rather than empty rows; `condense-claude-md`'s split rule reads as one instruction across all three of its former sites.
- **A third copy of the section order surfaced during verification** — `other-modes.md:26` inlined the same list. It matched §3 exactly, so it was redundancy rather than a second contradiction, but a fact that has already drifted between two copies does not get a third; collapsed to a pointer.
- **A downstream enforcement site outlived the mandate it enforced.** `task-summary/SKILL.md` step 2 still called "wrong columns" drift against a template that no longer locks them — found by grepping the mandate's vocabulary, not the changed file's name. A mandate's removal has to reach whatever enforces it.
- **Gate B now asks the replace/route/declare question**, closing the open half D50 named: that gate hung off `update-plugin` while rules arrive as direct hand-edits, which is exactly what Gate B detects. Declared growth stays a legitimate answer; what it stops being is the silent default.
- Arrival rate is the measurement to watch, not this change's byte delta — 2.04:1 (7d) and 1.74:1 (30d) at the time of writing. A single re-measure proves nothing.

**Status**: committed · **Reversible**: yes

---

### D-limitation-reads-as-hedging — Stated Limitations Read as Hedging to Unhobble — committed — 2026-08-09

**Problem**
Two haiku agents inverted passage meaning by compressing: `read-summary` changed "`ListAgents` CANNOT..." (withholding guarantee) to "checking PREVENTS..." (asserting guarantee). D64's grep of `decisions/*.md` doesn't catch this — tool limitations are facts about the world, not recorded decisions.

**Decision**
Name the shape in `unhobble-instructions` fact-vs-constraint: text saying what a tool cannot do or what a check doesn't prove reads as hedging; pass hunting over-caution cuts it. Stated as one sentence pair beside "losing genuine fact is failure mode," no worked incident.

**Consequences**
- Verification method (inventory facts, grep post-rewrite) is blind to this class — both defects kept every identifier, changed only claims around them.
- Reading rewritten passage against snapshot and asking "what would reader do differently?" surfaces this class.

**Consequences**
- The verification method D64 relied on — inventory the genuine facts, grep each one post-rewrite — is blind to this class by construction. Both defects kept every identifier and changed only the claim around it, so the sweep passed. What surfaced them was reading the rewritten passage against its snapshot and asking what a reader would now *do* differently.
- All four delegated agents reported "zero facts lost"; two were wrong. Consistent with D-haiku-condense-delegation's split — the drafter's report is an artifact to check, never evidence.
- Four other findings in the same batch were false alarms from token-diffing (a dropped `explore-delegation.md` pointer was a correct cut, since the rewritten file no longer fans out). Reporting a missing-token count as data loss is its own error, and costlier than the loss it chases.
- One agent scoped to a single file also edited four `.claude/agents/*.md` and created `skills/_shared/references/editing-skills-checklist.md`. Out of mandate but correct — Process step 7 requires reconciling inbound pointers, and CLAUDE.md's extraction had orphaned four Bootstrap tables. No template parity gap: the templates carry `<!-- describe: ... -->` placeholders, so those rows are project fill.

**Status**: committed · **Reversible**: yes

---

### D-dropped-is-not-the-same-as-correctly-dropped — Confirming a Passage Is Gone Doesn't Establish It Should Have Gone — committed — 2026-08-10

**Problem**
`haiku`'s verification pass could establish that a passage was genuinely absent (not reworded, not relocated) and then decide whether that mattered by reading the passage and judging whether it looked rigid. Against an `unhobble-instructions` rewrite that judgment is circular: the drop under review is precisely the kind of thing the target skill exists to remove, so a `**Tell:**` marker or a mechanical-reading callout reads as correct trimming on sight. Two live dispatches against the same file this session: the first deleted whole sections and asserted in its own report that it had written a companion file that did not exist; the second was a mostly-clean rewrite whose one dropped `**Tell:**` was initially graded correct trimming on exactly that read.

**Decision**
Chosen: split the question in two, and settle the second against the target skill's own stated bar rather than the verifier's impression. Confirming absence answers "did this disappear"; whether it should have is a separate test, and when the target skill states its own criterion (a fact-vs-constraint distinction, a "does this earn its place" check) that criterion is what gets applied to the dropped passage directly. The `**Tell:**` above reversed under this test — it named a non-derivable, checkable fact dressed as a rule, passed `unhobble-instructions`' own bar for what a marker must earn, and was restored as a genuine loss.

Second rule, on the response rather than the finding: severity decides it. Systemic damage — missing sections, a fabricated companion file, report numbers contradicting themselves — makes the whole run untrustworthy, so reverting to the snapshot and re-dispatching with the failure named in the retry prompt is cheaper than auditing it clause by clause. A single contained gap in an otherwise-sound rewrite gets patched back from the snapshot instead of discarding the pass.

Third rule (1.140.11), on the report rather than the check: when the dispatch ran a named skill, the report names that skill and states its job in one line before presenting results, instead of presenting the outcome as `haiku`'s own. Two skills are in play — `haiku` dispatches and verifies, the named skill decides what the rewrite should look like — and the layering was invisible in the report, which is what let a correctness verdict get argued from `haiku`'s reasoning rather than the target skill's rules. Without this, the rule above is unreachable in practice: a reader who can't see that a second skill governs the passage has no cue to go consult its criteria.

**Rejected**
- Forbidding the verifier from ever grading a drop as correct, treating every absence as a loss to restore. Why not: D-limitation-reads-as-hedging already records four false alarms from token-diffing in one batch, where a dropped pointer was a correct cut; a rule that restores everything reinstates the bloat the pass was dispatched to remove, and costs more than the loss it chases.
- A list of marker types that always survive (`**Tell:**`, `⚠️`, bolded imperatives). Why not: the marker isn't the discriminator — the same `**Tell:**` shape is sometimes a restatement of its own row and sometimes the only home of an exact command. Naming shapes would re-encode the eyeballing this entry removes.

**Consequences**
- Completes the pair with D-limitation-reads-as-hedging. That entry taught the rewriter what not to cut; this one stops the verifier from ratifying the cut when it happens anyway. Both are needed because the verifier's read and the rewriter's read fail the same way.
- The verification pass now has an escalation ladder rather than a single flag-it outcome, so a confirmed loss no longer terminates in an unresolved finding handed back to the user.
- Third consecutive real `unhobble-instructions` run to surface a defect in the tooling around it (D64, D-limitation-reads-as-hedging, this). The pattern is that every defect so far has been invisible to the structural checks and visible only on a full read against the snapshot.
- A rule about which criteria govern a judgment needs the report to make the governing party visible, or it can't be followed — the 1.140.11 addition is that half, found one version later by the same defect recurring through a different surface.
- 1.140.13: fourth consecutive real run, this time the verifier's OWN evidence rather than a rewriter's cut. A `condense-claude-md` result shed 25%, three greps for old phrasing came back empty, and the file was never opened before being judged systemic loss and reverted. The drop was mostly redistribution behind a `📖` pointer; only two of three claimed losses were real, and each cost one edit to patch back. `haiku`'s own text already carried "size reduction is never the failure signal" — the rule existed and was walked past on its own evidence. Sharpened rather than extended with a named tell: **you are about to revert on evidence you could have resolved by opening the file.** The asymmetry matters — an uncommitted rewrite reverted on a byte delta is gone, while the losses that triggered the revert are usually one edit each to restore.

**Status**: committed · **Reversible**: yes · Extends D-limitation-reads-as-hedging · Updated 1.140.11 (report-layering half), 1.140.13 (revert-on-own-evidence half)

### D-torn-page-verification — A File Still Being Written Is Not an Artifact to Verify — committed — 2026-08-11

**Problem**
`haiku` and `explore-delegation.md` both covered a dispatched agent's mid-flight state for *dispatch ordering* only (don't poll, don't shadow by re-reading delegated files while waiting) — neither had a rule against verifying the agent's output before the agent had finished producing it. A live case: a target was read at 101 lines, findings filed for "dangling cross-references," a fix scripted against those findings — and every substitution missed, because the dispatched agent had already repaired them in a later pass the reader never saw. The finding was true of the bytes on disk at that instant and false about the work; a defect filed against it may already be fixed by the time it's filed.

**Decision**
Chosen: an explicit gate opens the verification section in both files — nothing below it (byte checks, whole-file reads, the drop-grading test in D-dropped-is-not-the-same-as-correctly-dropped) is worth running until the target has stopped moving. Wait for the completion notification, then confirm with two `wc -c` calls seconds apart rather than one. Named as its own category distinct from shadowing (reading a file while idle, which merely duplicates work already in flight): reading a moving target produces confident, false findings about a state that will never exist, which is costlier than the wasted read shadowing produces. **Tell: `git status` shows `MM`, or the size changed between two of your own commands.**

**Rejected**
- Relying on the "don't shadow" rule alone to cover this. Why not: shadowing is about not duplicating cost; this is about the data being unstable regardless of who reads it. A reader who has correctly avoided shadowing all session can still open the file the instant after the agent's first write and be exactly as wrong.

**Consequences**
- Same rule added to both `haiku/SKILL.md` (owns dispatch + mandatory verification) and `explore-delegation.md` (owns the waiting-on-agents flow) — 1.140.13 collapsed `haiku`'s copy to a pointer at the sibling file per the simplifier's finding that stating the same mechanism with two different worked examples in two files is the drift shape D-instruction-contradictions already names.
- Positioned ahead of D-dropped-is-not-the-same-as-correctly-dropped's tests in both files' reading order — a torn-page read fails before reaching the question of whether a drop was correctly graded, since there's no fixed state yet to grade.

**Status**: committed · **Reversible**: yes

### D-route-by-subject-not-discovery — A Fact Routes By What It's ABOUT, Not Where It Was Found — committed — 2026-08-11

**Problem**
`update-claude-docs` Step 2's routing ladder ("most specific CLAUDE.md wins") asks only where a fact was encountered, never what the fact is about. A session learned two Playwright API behaviours (`page.request` doesn't carry a localStorage token; `page.mouse` doesn't auto-scroll) — both true in every project using Playwright, forever — and the ladder routed both into the one repo's CLAUDE.md where the session happened to be working, because that's the most specific file touching the modified test files. The next project using Playwright rediscovers both from scratch. `condense-claude-md` had the mirror-image gap: its seam-test measures where a symbol is *used* (grep sibling dirs, let usage counts decide "local"), which cannot distinguish a framework fact with three local hits from a genuinely project-local one — a Playwright row passes the seam-test as subdir-local and gets buried by the lever meant to relocate it correctly.

**Decision**
Chosen: both files gained a check that runs BEFORE the existing routing/seam-test logic, asking what the fact is about rather than where it surfaced. `update-claude-docs` Step 2 opens with "ask what the fact is ABOUT before asking where it was found" — a fact about this codebase's own schema/helpers/conventions still routes down the specificity ladder; a fact about a tool, framework, or the harness belongs at the level it holds at (usually global), regardless of which project's session surfaced it. `condense-claude-md`'s seam-test section gained the same test ahead of both relocation levers, naming explicitly that the test "measures where a fact is used, not where it's true." Shared tell in both: **the fact would still be true if this codebase didn't exist.**

**Rejected**
- Fixing only `update-claude-docs` (the write path) and leaving `condense-claude-md`'s seam-test alone. Why not: the seam-test is the read path for the identical judgement, applied later during condensation — a framework fact correctly kept out of the wrong repo by the write-time fix can still be walked back into "subdir-local" by a condense pass that only counts local usage. Both sides of the same fact need the same question asked, same as D63's write/scaffold pairing (D63's Consequences: "the two are separate code paths and fixing one without the other leaves a freshly created file inconsistent with one that grew through normal capture").

**Consequences**
- Same fix-shape as D63 and D-limitation-reads-as-hedging: a judgement test inserted ahead of an existing mechanical check, rather than a new mechanical check added beside it — the existing ladder/seam-test still runs, just after the subject-matter question has already ruled out the wrong destination.
- `update-claude-docs`'s "Match, but this session's work made the rule FALSE" classification (Invalidated row, same 1.140.12 change) is a sibling fix to the same Step-1/Step-2 classification table — New/Violation/Misplaced all assumed an existing matched rule was still correct; a rule a session's own work just disproved had nowhere to go and read as already-covered.

**Status**: committed · **Reversible**: yes

### D-inlining-breaks-the-citation-graph — Absorbing a Reference Severs Both Ends and Nothing Checks Either — committed — 2026-08-14

**Problem**
An unhobbling pass on `read-summary` inlined `references/claude-md-tree-walk.md` into the read order and dropped its pointer, leaving the file cited by nothing — the second time that same citation had been severed by a rewrite (first restored under 0116e70). Separately the same pass dropped the `decision-first-output.md` citation while keeping the rule's prose, so a reader is told to state the decision and never routed to the file holding the one-versus-several shapes and the test for what counts as a decision at all. Neither is visible to any existing check: every surviving pointer still resolves, no heading 404s, the diff shows a plausible rewrite, and the inlined prose reads finished — which is `D-pointer-needs-a-trigger` inverted, since the closed-reading line has no pointer left to follow.

**Decision**
After any pass that inlines content, ask which files this one no longer cites and which absorbed facts had machinery behind them. A reference that ends up cited by nothing is either content to fold in and delete, or a pointer to restore; leaving it is what produced the same severed citation twice. Captured in the plugin's `CLAUDE.md` Authoring Checklist rather than in `unhobble-instructions`, since it applies to any inlining pass — `condense-claude-md` and hand edits included.

**Consequences**
- `claude-md-tree-walk.md` retired, its content folded into Read Order step 3 where the `rg -r`/`--replace` trap and the sibling-repo caveat now sit at the point a reader runs the search.
- Four other non-derivable facts had to be patched back into the same file by hand (the `ListAgents` guard, `grep -rn` over `rg`, and the two above). A structural pass optimises for preservation of what it keeps and is explicitly not a correctness review, so pairing it with a fact-check of the file's claims about sibling skills is what caught the four stale conventions it would otherwise have preserved faithfully.
- Found by the product reviewer alone. Code review verified pointers resolve (true — none pointed at the orphan) and the simplifier only reads its own slice, so an uncited file and a missing citation are both structurally invisible to them.

**Status**: committed · **Reversible**: yes
