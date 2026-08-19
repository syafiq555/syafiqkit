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

### D-pointer-depth-reads-as-correct — A Pointer Can Be Right in Wording and Wrong in Depth — committed — 2026-08-17

**Problem**
An unhobbling pass extracted `haiku`'s verification gotchas to a new `skills/haiku/references/verifying.md` and cited `../_shared/references/two-tier-condense.md` from inside it. That prefix is correct in a `SKILL.md` and wrong one directory down, where `../` reaches the skill's own folder rather than `skills/` — it resolves to a `skills/haiku/_shared/` that does not exist. A sweep for the pattern found a second instance predating the session in `update-plugin/references/routing-gotchas.md`, so the shape recurs rather than being one slip. This is D-inlining's inverse: nothing is severed, no file is orphaned, the citing prose is complete and the target file genuinely exists — every citation-graph question returns clean, and the pointer is still dead. Reading it cannot catch it, because a correct and an incorrect pointer are the same string in different files.

**Decision**
Resolve a pointer as a path rather than by eye — `ls` its target from the citing file's own directory, which is the only check that fails when the depth is wrong. The rule naming the two depths was already in `CLAUDE.md`'s Authoring Checklist and was walked past twice, so the escalation was to the verification method, not the rule: "verify a new pointer resolves before landing it" states an intention with no mechanism, which reads as satisfied by having considered it.

**Consequences**
- Both instances fixed. The pre-existing one is the argument for sweeping the pattern rather than fixing the one in the diff — the defect is silent and permanent once landed, so instances accumulate at whatever rate passes create them.
- Escalating the method rather than the rule follows `update-claude-docs`'s position-and-sharpness branch: the existing rule was correctly worded and correctly placed, and a second warning beside it would have added length without adding a check.
- Found by a resolve-sweep run as `/done`'s docs-only referential-integrity step, not by any agent — all three read the pointer as prose and none resolved it, which is the same blindness that made the second instance survive since 2026-08-09.

**Status**: committed · **Reversible**: yes

### D-deferral-is-not-delivery — A Pointer Defers a Rule Rather Than Delivering It — committed — 2026-08-18

**Problem**
The corpus routes content behind `📖` pointers on the strength of D55's "adopt progressive disclosure" verdict, which graded the argument for deferral and never measured whether deferred content is read. A consumer reported the shape from the other side: `unhobble-instructions` and `condense-*` produce relocations whose defects sit outside the rewritten file, and the check for them would naturally live in a reference — reachable only if the pointer fires. 143 pointers across 43 files, 71% written mid-sentence in the weak `X for <topic>` shape.

**Decision**
Chosen: treat a pointer as deferral, not delivery, and split content on that basis — the sentence a reader needs to know they *have* a problem stays inline at the decision point, and only the procedure for fixing it goes behind the pointer. Nothing forces a reference to load: `allowed-tools` governs permissions rather than loading, SKILL.md has no `@import`, so every hop past the skill body is the reading model's judgement. Conditional framing at the citing site (*when a pass moves content out of a file, read X, because both phases above are blind to what a move breaks*) is what raises follow-through; stating a penalty for skipping does not, and a pointer trailing at a section's end does worse than one at the decision.

**Rejected**
- Citing the existing owner and stopping. Why not: the four citers of `verifying-a-relocation.md` are themselves reference files in three cases, so reaching it took two chained pointers — a shape that compounds an already-low rate to near-unreachable. Two of the four sites landed that way on first pass and were caught only by the product reviewer.
- Inlining the whole mechanism. Why not: it re-grows the resident file the routing tests exist to keep small, and `condense-claude-md/references/structural-splits.md` already owns the split mechanics correctly. The fix is where the trigger sits, not how much text moves.
- Reading this as contradicting D55. Why not: D55's verdict on progressive disclosure stands. What it never established is a delivery rate, so this refines its boundary the way D63 refined judgment-over-prescription — an adopted claim whose scope was narrower than the adoption implied.

**Consequences**
- Every relocation-producing skill now names the trigger inline at the point its own split lands, with only mechanics deferred. `unhobble-instructions` gained the symptom-index target shape at the split *decision* (its two existing citations both sat in `## Rewriting`, i.e. execution).
- The repo's own routing test (`Does it need to arrive before action, or only during failure?`) already reasoned to this conclusion for resident rules — the gap was that nothing applied it to the pointer's own wording, so a correctly-routed rule could still be introduced by a phrase nobody acts on.
- A reference file citing another reference file is now the shape to check: it is the two-hop case, and it reads as clean citation hygiene.

**Status**: committed · **Reversible**: yes

---

### D-prescribed-commands-are-environment-assumptions — Instruction Files State What to Establish, Not Which Command Establishes It — committed — 2026-08-18

**Problem**
The corpus prescribed commands for routine checks: `stat -f '%Sm'` for mtime, `wc -c` for doc size, a `sed`/`comm` pipeline for registry sync, `docker exec` for a table count, four `ci-ssh` diagnostics. Each bakes in an environment — `stat -f` is BSD syntax that fails on Linux, `docker exec` assumes Docker, `artisan migrate:status` assumes Laravel — and this plugin ships to colleagues on their own machines. Enumerating variants is the same defect multiplied: a four-way Laravel/PostgreSQL/MySQL/generic block is four things to maintain and still silent about Windows.

What made it worth a sweep rather than a preference is that the failures are quiet. A flag meaning something else on BSD, an unmatched glob reporting `0`, a search keyed to wording that has since changed — each returns a clean-looking result that stops the reader looking further. The registry-sync check was the proof: a `sed` range hardcoded to two CLAUDE.md heading names, so renaming either made it report zero missing rows on a registry that had genuinely rotted, with three sentences underneath explaining the trap and noting it had already fired once.

**Decision**
Chosen: state the property; let the reader pick the command. Five parallel audits covered every skill, both CLAUDE.md files, the hook ruleset and the generated agents. The line is routine versus special-case — a check that runs on every invocation states its property in prose, while a literal invocation stays where the *exact invocation is the knowledge*: a `mysqldump` flag set that took debugging to find, an SSH retry loop scoped to exit code 255, a Playwright guard keyed to `parallelIndex` rather than `workerIndex`. Facts about how a tool *behaves* also stay, being what a reader cannot derive.

**Rejected**
- Keeping platform variants side by side. Why not: multiplies the maintenance and still omits whoever runs this somewhere unlisted.
- Restoring a mechanical registry check in portable form. Why not: any extraction keyed to the file's own structure repeats the failure, since that structure is precisely what drifts. Prose plus a sanity floor ("confirm the extraction found roughly the number of skills this plugin has") degrades to a real question rather than a false green.

**Consequences**
- **The same instruction over-applied deleted 400 identifiers across 55 files in other repos.** Twenty agents were told `php artisan` "assumes Laravel" and `docker exec` "assumes Docker" — true of the tool, false of the project — so they stripped custom command names, deploy hostnames, container names, DOM selectors, a `--embeddings` flag whose absence silently destroys work, and in one file a www-data/root permission model. Four files lost every identifier they had. Every agent reported success, because each deletion matched the reason it was given. Left as-is by the user's call; the corrected rule is now in the global `CLAUDE.md`, stated as a positive boundary rather than as what to remove.
- **A summary cannot distinguish the correct pass from the destructive one** — both describe themselves as "converted commands to prose". What separated them was counting identifiers before against after, which took one command and found what nineteen confident reports had missed.
- **The global set came through clean** under the same instruction, keeping LibreSSL, `subjectAltName`, the `127.0.0.1`-vs-localhost rule and the base64 transfer recipe while dropping `stat -f` and `export PATH`. Same rule, opposite outcome — which is what makes it a prompt-wording failure rather than a bad idea.
- Snapshot before any fan-out over files outside a git checkout. The 129 snapshots taken here are what made the damage measurable and would have made it reversible.

**Status**: committed · **Reversible**: yes

---

### D-a-floor-is-not-a-ceiling — A size threshold guards one direction and reads as guarding both

**Problem**
A consumer dispatched `condense-task-doc` against a 4-file, 1243-line doc set. It deleted 63.1% of lines and 64.3% of bytes — taking ~40 Critical Gotchas rows, one written minutes earlier in the same session — and returned "CONDENSING COMPLETE ✅" carrying those exact figures without flagging them. The dispatch prompt had stated that a drop past ~35% means deletion; the agent reported the number and never applied the bar. A second dispatch was killed after deleting 328 lines, its plan opening "Delete the `## Last Session` section" (issue #26).

Every size threshold in these skills was a floor to reach. `condense-task-doc`'s ≤300 lines is a target to get *under*; its one reconciliation guard catches the row pass being *skipped*; `two-tier-condense.md`'s "ratio should drop or hold flat, never rise" guards against failing to shrink. Nothing asked whether a pass shrank too much, so the numbers a run produces read as achievement in whichever direction they went — and the session that produced them is the last one positioned to notice.

The guard that did exist was in the wrong file. `task-summary` has carried the right check throughout ("a doc set each shedding a third of its bytes is deletion wearing a rewrite's face"), but `done` Step 4, `haiku`, `task-summary`'s own delegate line and a bare invocation all hand control *to* `condense-task-doc`. A caller-side check cannot protect a delegated run.

**Decision**
Chosen: the ceiling goes inline in `condense-task-doc` (new step 7) and `condense-claude-md` (step 6), because that is the file every dispatch path opens — completing an ownership `condense-task-doc` already claims for size policy. The discriminator is not a percentage but **which file grew to receive the content**: a legitimate split drops the index while its `decisions/*.md` siblings grow, so the SET total holds flat or rises. The incident's four files all shrank, leaving no destination. Bound to the set total, never the index alone. Numbers (~10% restructure, ~35% itemized condense, flat-or-rising split) are anchors for that reasoning rather than trip-wires, so an `unhobble-instructions` pass reads them as load-bearing.

**Rejected**
- A bare percentage cap. Why not: a legitimate split drops the index as hard as the incident did (measured: -68% against the incident's -64%), so a threshold alone flags correct work and trains sessions to ignore the guard.
- Putting the ceiling only in `two-tier-condense.md`. Why not: nothing forces a `📖` to load, and `condense-task-doc` already cites it three times without any of those citations delivering a ceiling — the same reachability gap repeating.
- Dropping `condense-task-doc` from `haiku`'s delegation list (the issue's fourth suggestion). Why not: delegation was never the defect, since drafting delegates safely while verification stays with the orchestrator. The callee having no ceiling to violate was.

**Consequences**
- **A fourth legitimate shape needed naming after review**: cross-file dedup, which the skill's own step 3 licenses, collapses a fact stated in two files to one copy plus a pointer. The survivor already held the fact, so nothing grows and the diagnostic returns "none" — the same answer real deletion gives. Separated by naming the pre-existing survivor and grepping it, rather than looking for growth that was never going to happen.
- **The verifying half needed its own fix.** Step 7 puts the accounting duty on the executor; a caller was still told to *read* the report. Since the skill now requires a destination claim before reporting success, every run produces one, and "the siblings absorbed it" is as cheap to write when nothing moved. `done` and `haiku/references/verifying.md` now say to re-run `wc -c` on whichever file the report names.
- **`task-summary`'s copy stays deliberately.** Two differently-worded statements of one safety fact is what stops a single density pass stripping both.
- A `~10%` grep returned zero hits during investigation and read as the guard having been deleted; it had been reworded to "roughly a tenth" by an in-flight pass. Restoring a live guard was averted by re-running the search where the fact was known to live.

**Status**: committed · **Reversible**: yes
