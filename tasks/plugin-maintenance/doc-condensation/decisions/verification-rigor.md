<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation/verification-rigor
Gotchas (critical — full list in each ADR's Consequences):
  - Confirming a passage is gone doesn't establish it should have gone — apply the target skill's own bar, not your own read of "looks rigid" (D-dropped-is-not-the-same-as-correctly-dropped)
  - A file still being written is not an artifact to verify — wait for it to stop moving (D-torn-page-verification)
  - A fact routes by what it's ABOUT, not where it was found (D-route-by-subject-not-discovery)
Related: ../current.md (feature index), structural-mechanics.md (sibling theme file — byte thresholds/companion files/plan-doc typing, split out 2026-08-11), unhobble-rule-writing.md (sibling theme file — the write-path and unhobbling-rule decisions, split out 2026-10-10), ../../agent-architecture/current.md, ../../agent-architecture/decisions/verification-rigor.md (sibling file, different domain — agent-dispatch/scan-control mechanics; same name by coincidence), ../../madr-structure/current.md
Last updated: 2026-10-10 — split by topic: the write-path and unhobbling-rule decisions (D63–D68, D-haiku-condense-delegation, D-mandate-vs-judgement, D-limitation-reads-as-hedging) moved to unhobble-rule-writing.md; this file keeps the verifier, torn-page, routing, pointer and sweep decisions; 2026-10-10 — conformed to theme-file shape (Key Technical Decisions wrapper, D-a-floor heading completed, duplicate Consequences label merged); 2026-08-11 — split out of structural-splits.md once it grew to 21 decisions across two themes (unhobble-instructions/verification-correctness half)
-->

# Doc Condensation — Verification Correctness & Pointers

Decisions about whether a verifier grades a rewrite's drops and pointers correctly: when a target is safe to read, what counts as a genuine loss vs. correct trimming, where a fact actually belongs, and what a pointer does and does not deliver.

---

## Key Technical Decisions {#decisions}

### D-dropped-is-not-the-same-as-correctly-dropped — Confirming a Passage Is Gone Doesn't Establish It Should Have Gone — committed — 2026-08-10

**Problem**
A `haiku` verification pass established that a passage was genuinely absent, then judged whether that mattered by whether it looked rigid. Against an `unhobble-instructions` rewrite that judgement is circular: the drop is exactly what the skill exists to remove, so a `**Tell:**` marker reads as correct trimming on sight. In one live run the first dispatch deleted whole sections and claimed a companion file it never wrote; in a second, mostly clean, the one dropped `**Tell:**` was graded correct trimming on that same read.

**Decision**
Split the question. Confirming absence answers "did this disappear"; whether it should have is a separate test, settled against the target skill's own stated criterion (a fact-vs-constraint distinction, a "does this earn its place" check). The `**Tell:**` above reversed under that test: it named a non-derivable, checkable fact dressed as a rule, and was restored as a genuine loss.

Second rule, on the response: severity decides it. Systemic damage (missing sections, a fabricated companion file, contradictory report numbers) makes the run untrustworthy, so revert to the snapshot and re-dispatch with the failure named in the retry prompt. A single contained gap in an otherwise-sound rewrite is patched back from the snapshot instead.

Third rule (1.140.11), on the report: when the dispatch ran a named skill, the report names it and states its job in one line before presenting results. `haiku` dispatches and verifies; the named skill decides what the rewrite should look like. Without that layering visible, a correctness verdict gets argued from `haiku`'s reasoning rather than the target skill's rules, and a reader has no cue to consult the criteria.

**Rejected**
- Forbidding the verifier from ever grading a drop as correct, treating every absence as a loss. Why not: a rule that restores everything reinstates the bloat the pass was dispatched to remove, and costs more than the losses it chases (D-limitation-reads-as-hedging's false alarms).
- A list of marker types that always survive (`**Tell:**`, warning markers, bolded imperatives). Why not: the marker isn't the discriminator. The same `**Tell:**` shape is sometimes a restatement of its own row and sometimes the only home of an exact command.

**Consequences**
- Completes the pair with D-limitation-reads-as-hedging: that entry taught the rewriter what not to cut; this one stops the verifier ratifying a cut when it happens anyway. Both are needed because the verifier's read and the rewriter's read fail the same way.
- The verification pass now has an escalation ladder rather than a single flag-it outcome, so a confirmed loss no longer ends as an unresolved finding handed back to the user.
- Every defect in this line was invisible to structural checks and visible only on a full read against the snapshot.
- 1.140.11: a rule about which criteria govern a judgement needs the report to name the governing party, or it can't be followed.
- 1.140.13: a `condense-claude-md` result that shed 25% was judged systemic loss and reverted on three empty greps, without opening the file. Two of three claimed losses were real, each one edit to restore; the drop was mostly redistribution behind a `📖` pointer. The rule ("size reduction is never the failure signal") already existed in the verifier's own text. Before reverting, ask whether the evidence could have been resolved by opening the file: an uncommitted rewrite reverted on a byte delta is gone for good.

**Status**: committed · **Reversible**: yes · Extends D-limitation-reads-as-hedging · Updated 1.140.11 (report-layering half), 1.140.13 (revert-on-own-evidence half)

### D-torn-page-verification — A File Still Being Written Is Not an Artifact to Verify — committed — 2026-08-11

**Problem**
`haiku` and `explore-delegation.md` covered a dispatched agent's mid-flight state for dispatch ordering only (don't poll, don't shadow). Neither forbade verifying the agent's output before it had finished. In one live case a target was read at 101 lines, findings were filed for "dangling cross-references," and a fix scripted against them missed every substitution, because the agent had already repaired them. The finding was true of the bytes at that instant and false about the work.

**Decision**
An explicit gate opens the verification section: nothing below it (byte checks, whole-file reads, the drop-grading test in D-dropped-is-not-the-same-as-correctly-dropped) is worth running until the target has stopped moving. Wait for the completion notification, then confirm with two `wc -c` calls seconds apart. This is distinct from shadowing (reading a file while idle, which only duplicates work in flight): reading a moving target produces confident, false findings about a state that will never exist. A moving target gives itself away as `git status` showing `MM`, or as a size that changes between two of your own commands; the gate holds until neither happens.

**Rejected**
- Relying on the "don't shadow" rule alone to cover this. Why not: shadowing is about not duplicating cost; this is about the data being unstable regardless of who reads it. A reader who has correctly avoided shadowing all session can still open the file the instant after the agent's first write and be exactly as wrong.

**Consequences**
- The rule lives in `explore-delegation.md` (owns the waiting-on-agents flow); `haiku/SKILL.md`'s copy was collapsed to a pointer at it in 1.140.13, since two worked examples of one mechanism in two files is the drift shape D-instruction-contradictions names.
- Ordered ahead of D-dropped-is-not-the-same-as-correctly-dropped's tests: a torn-page read fails before the question of whether a drop was correctly graded, since there is no fixed state to grade.

**Status**: committed · **Reversible**: yes

### D-route-by-subject-not-discovery — A Fact Routes By What It's ABOUT, Not Where It Was Found — committed — 2026-08-11

**Problem**
`update-claude-docs` Step 2's routing ladder ("most specific CLAUDE.md wins") asks where a fact was encountered, never what it is about. Two Playwright behaviours (`page.request` doesn't carry a localStorage token; `page.mouse` doesn't auto-scroll) are true in every Playwright project, yet landed in one repo's CLAUDE.md because that was the most specific file touched. `condense-claude-md` had the mirror gap: its seam-test measures where a symbol is *used*, which cannot tell a framework fact with three local hits from a project-local one, so the Playwright row was buried by the lever meant to relocate it.

**Decision**
Both files gained a check that runs BEFORE the existing routing/seam-test logic, asking what the fact is about rather than where it surfaced. `update-claude-docs` Step 2 opens with "ask what the fact is ABOUT before asking where it was found": a fact about this codebase's own schema or conventions still routes down the specificity ladder; a fact about a tool, framework or the harness belongs at the level it holds at (usually global). `condense-claude-md`'s seam-test gained the same test, since it "measures where a fact is used, not where it's true." Both use one question: would the fact still be true if this codebase didn't exist?

**Rejected**
- Fixing only `update-claude-docs` (the write path). Why not: the seam-test is the read path for the same judgement, applied later during condensation. A framework fact kept out of the wrong repo at write time can still be walked back into "subdir-local" by a condense pass that only counts local usage. Both sides need the same question, as D63's write/scaffold pairing already showed.

**Consequences**
- Same fix-shape as D63 and D-limitation-reads-as-hedging: a judgement test inserted ahead of an existing mechanical check. The ladder and seam-test still run, just after the subject question has ruled out the wrong destination.
- The "Match, but this session's work made the rule FALSE" classification (Invalidated row, 1.140.12) is a sibling fix in the same classification table. A rule that a session's own work disproved had nowhere to go and read as already covered.

**Status**: committed · **Reversible**: yes

### D-inlining-breaks-the-citation-graph — Absorbing a Reference Severs Both Ends and Nothing Checks Either — committed — 2026-08-14

**Problem**
An unhobbling pass on `read-summary` inlined `references/claude-md-tree-walk.md` and dropped its pointer, leaving the file cited by nothing. It was the second severing of that citation (the first was restored earlier). The same pass dropped the `decision-first-output.md` citation while keeping the rule's prose, so a reader is told to state the decision and never routed to the file holding the test for what counts as one. No existing check sees either: every surviving pointer resolves, no heading 404s, and the inlined prose reads finished.

**Decision**
After any pass that inlines content, ask which files this one no longer cites and which absorbed facts had machinery behind them. A reference that ends up cited by nothing is either content to fold in and delete, or a pointer to restore; leaving it is what produced the same severed citation twice. Captured in the plugin's `CLAUDE.md` Authoring Checklist rather than in `unhobble-instructions`, since it applies to any inlining pass — `condense-claude-md` and hand edits included.

**Consequences**
- `claude-md-tree-walk.md` retired, its content folded into Read Order step 3 where the `rg -r`/`--replace` trap and the sibling-repo caveat now sit at the point a reader runs the search.
- Four other non-derivable facts had to be patched back into the same file by hand (the `ListAgents` guard, the `grep -rn` over `rg` choice, and the two above). A structural pass preserves what it keeps and is not a correctness review; pairing it with a fact-check of the file's claims about sibling skills caught four stale conventions it would otherwise have preserved faithfully.
- Found by the product reviewer alone. Code review verified that pointers resolve (true, none pointed at the orphan), and the simplifier reads only its own slice, so an uncited file and a missing citation are both invisible to them.

**Status**: committed · **Reversible**: yes

### D-pointer-depth-reads-as-correct — A Pointer Can Be Right in Wording and Wrong in Depth — committed — 2026-08-17

**Problem**
An unhobbling pass extracted `haiku`'s verification gotchas to `skills/haiku/references/verifying.md` and cited `../_shared/references/two-tier-condense.md` from inside it. That prefix is correct in a `SKILL.md` and wrong one directory down: it resolves to a `skills/haiku/_shared/` that does not exist. A sweep found a second instance predating the session (`update-plugin/references/routing-gotchas.md`), so the shape recurs. Unlike D-inlining, nothing is severed, so citation-graph checks return clean while the pointer is dead. Reading cannot catch it: a correct and an incorrect pointer are the same string in different files.

**Decision**
Resolve a pointer as a path rather than by eye: `ls` its target from the citing file's own directory, the only check that fails when the depth is wrong. The rule naming the two depths was already in `CLAUDE.md`'s Authoring Checklist and was walked past twice, so the escalation went to the verification method, not the rule. "Verify a new pointer resolves before landing it" states an intention with no mechanism.

**Consequences**
- Both instances fixed. The pre-existing one is the argument for sweeping the pattern rather than fixing only the one in the diff: the defect is silent and permanent once landed.
- Escalating the method rather than the rule follows the position-and-sharpness branch: the rule was correctly worded and placed, and a second warning beside it would have added length without a check.
- Found by a resolve-sweep run as `/done`'s referential-integrity step, not by any agent. All three read the pointer as prose and none resolved it, the same blindness that let the second instance survive from 2026-08-09.

**Status**: committed · **Reversible**: yes

### D-deferral-is-not-delivery — A Pointer Defers a Rule Rather Than Delivering It — committed — 2026-08-18

**Problem**
The corpus routed content behind `📖` pointers on the strength of D55's "adopt progressive disclosure" verdict, which argued for deferral but never measured whether deferred content is read. 143 pointers across 43 files, 71% written mid-sentence in the weak `X for <topic>` shape. Relocations also produce defects outside the rewritten file, and the check for them would live in a reference reachable only if the pointer fires.

**Decision**
Treat a pointer as deferral, not delivery. The sentence a reader needs to know they *have* a problem stays inline at the decision point; only the procedure for fixing it goes behind the pointer. Nothing forces a reference to load (`allowed-tools` governs permissions, not loading, and SKILL.md has no `@import`), so every hop past the skill body is the reading model's judgement. Conditional framing at the citing site raises follow-through (*when a pass moves content out of a file, read X, because both phases above are blind to what a move breaks*); stating a penalty for skipping does not, and a pointer trailing at a section's end does worse than one at the decision.

**Rejected**
- Citing the existing owner and stopping. Why not: the four citers of `verifying-a-relocation.md` were reference files in three cases, so reaching it took two chained pointers, which compounds an already-low rate toward unreachable. Two of the four sites landed that way on first pass and were caught only by the product reviewer.
- Inlining the whole mechanism. Why not: it re-grows the resident file the routing tests exist to keep small. The fix is where the trigger sits, not how much text moves.
- Reading this as contradicting D55. D55's verdict stands; it never established a delivery rate. This refines its boundary, as D63 refined judgement-over-prescription.

**Consequences**
- Every relocation-producing skill now names the trigger inline where its own split lands, with only mechanics deferred. `unhobble-instructions` gained the symptom-index target shape at the split decision.
- The repo's routing test (`Does it need to arrive before action, or only during failure?`) already reached this for resident rules; nothing applied it to a pointer's own wording.
- A reference citing another reference is the two-hop shape to check for. It reads as clean citation hygiene.

**Status**: committed · **Reversible**: yes

---

### D-prescribed-commands-are-environment-assumptions — Instruction Files State What to Establish, Not Which Command Establishes It — committed — 2026-08-18

**Problem**
The corpus prescribed commands for routine checks (`stat -f '%Sm'` for mtime, `wc -c` for size, a `sed`/`comm` pipeline for registry sync, `docker exec` for a table count). Each bakes in an environment: `stat -f` is BSD syntax, `docker exec` assumes Docker, `artisan migrate:status` assumes Laravel. This plugin ships to colleagues on their own machines, and enumerating variants is the same defect multiplied. The failures are quiet: a flag meaning something else on BSD, an unmatched glob reporting `0`, a search keyed to wording that has since changed. The registry-sync check was the proof: a `sed` range hardcoded to two heading names reported zero missing rows on a registry that had genuinely rotted.

**Decision**
State the property; let the reader pick the command. The line is routine versus special-case. A check that runs on every invocation states its property in prose. A literal invocation stays where the *exact invocation is the knowledge*: a `mysqldump` flag set that took debugging to find, an SSH retry loop scoped to exit code 255, a Playwright guard keyed to `parallelIndex` rather than `workerIndex`. Facts about how a tool *behaves* also stay, since a reader cannot derive them.

**Rejected**
- Keeping platform variants side by side. Why not: it multiplies maintenance and still omits whoever runs this somewhere unlisted.
- Restoring a mechanical registry check in portable form. Why not: any extraction keyed to the file's own structure repeats the failure, since that structure is what drifts. Prose plus a sanity floor ("confirm the extraction found roughly the number of skills this plugin has") degrades to a real question rather than a false green.

**Consequences**
- **The same instruction over-applied deleted 400 identifiers across 55 files in other repos.** Agents told that `php artisan` "assumes Laravel" stripped custom command names, deploy hostnames, container names, a `--embeddings` flag whose absence silently destroys work, and a permission model. Four files lost every identifier they had, and every agent reported success, since each deletion matched the reason it was given. Left as-is by the user's call; the corrected rule now sits in the plugin's `CLAUDE.md` Authoring Checklist (the bullet "State what to establish, not which command establishes it"), stated as a positive boundary rather than as what to remove.
- **A summary cannot tell the correct pass from the destructive one.** Both described themselves as "converted commands to prose". Counting identifiers before against after separated them.
- **The global set came through clean** under the same instruction, keeping LibreSSL, `subjectAltName`, the `127.0.0.1`-vs-localhost rule and the base64 transfer recipe while dropping `stat -f` and `export PATH`. Same rule, opposite outcome: a prompt-wording failure, not a bad idea.
- Snapshot before any fan-out over files outside a git checkout. The 129 snapshots taken here made the damage measurable and reversible.

**Status**: committed · **Reversible**: yes

---

### D-a-floor-is-not-a-ceiling — A size threshold guards one direction and reads as guarding both — committed — 2026-08-19

**Problem**
A consumer dispatched `condense-task-doc` against a 4-file, 1243-line doc set. It deleted 63.1% of lines and 64.3% of bytes, including ~40 Critical Gotchas rows written minutes earlier in the same session, and reported "CONDENSING COMPLETE" without flagging the figures. The dispatch prompt had stated that a drop past ~35% means deletion; the agent reported the number and never applied the bar. A second dispatch was killed after deleting 328 lines (issue #26).

Every size threshold in these skills was a floor to reach. Nothing asked whether a pass shrank too much, so the numbers a run produced read as achievement in whichever direction they went. The one check that existed lived in `task-summary` ("a doc set each shedding a third of its bytes is deletion wearing a rewrite's face"), while the skills that dispatch `condense-task-doc` (`done` Step 4, `haiku`, a bare invocation) never reached it. A caller-side check cannot protect a delegated run.

**Decision**
The ceiling goes inline in `condense-task-doc` (step 7) and `condense-claude-md` (step 6), because that is the file every dispatch path opens. The discriminator is not a percentage but **which file grew to receive the content**: a legitimate split drops the index while its `decisions/*.md` siblings grow, so the SET total holds flat or rises. The incident's four files all shrank, leaving no destination. Bound it to the set total, never the index alone. The numbers (~10% restructure, ~35% itemised condense, flat-or-rising split) are anchors for that reasoning rather than trip-wires, so an `unhobble-instructions` pass reads them as load-bearing.

**Rejected**
- A bare percentage cap. Why not: a legitimate split drops the index as hard as the incident did (measured -68% against the incident's -64%), so a threshold alone flags correct work and trains sessions to ignore the guard.
- Putting the ceiling only in `two-tier-condense.md`. Why not: nothing forces a `📖` to load, so the same reachability gap would repeat.
- Dropping `condense-task-doc` from `haiku`'s delegation list. Why not: delegation was never the defect; the callee had no ceiling to violate.

**Consequences**
- **A fourth legitimate shape needed naming after review**: cross-file dedup collapses a fact stated in two files to one copy plus a pointer. Nothing grows, so the diagnostic returns "none", the same answer real deletion gives. It is separated by naming the surviving copy and grepping for it.
- **The verifying half needed its own fix.** A caller was still told to *read* the report. `done` (`skills/done/references/task-doc-measurement.md`, reached from its Step 4 measure) and `haiku/references/verifying.md` now say to re-run `wc -c` on whichever file the report names, since "the siblings absorbed it" is as cheap to write when nothing moved.
- **`task-summary`'s copy stays deliberately.** Two differently-worded statements of one safety fact stop a single density pass stripping both.
- A `~10%` grep returned zero hits during investigation and read as the guard having been deleted. An in-flight pass had reworded it to "roughly a tenth". Re-running the search where the fact was known to live averted a restore.

**Status**: committed · **Reversible**: yes

---

### D-controls-validate-the-predicate-not-the-extractor — Both Controls Passing Says Nothing About A Hand-Rolled Sweep — committed — 2026-08-25

**Problem**
`CLAUDE.md` already required a known-good and a known-bad case before believing any sweep (written after three agents shipped pointer sweeps that reported most of the corpus broken). A session following it still produced two false findings in one `/done` run: 9 "broken" pointers (all sound) and 40 "split tables" (all sound, ordinary `## heading` lines after a table).

Both runs had passed the two-direction control, which cannot fail here: a known-good and a known-bad case route through the *same* extractor (the regex pulling paths out of prose, the `awk` deciding what a table boundary is). When the bug is in extraction, both cases are mis-extracted and the pair still agrees.

**Decision**
Sharpen the existing `CLAUDE.md` rule in place rather than add a neighbour: print the extracted values and read a few against the source, because an extractor is falsified by looking at what it produced, never by the pass/fail column. The diagnostic that worked both times was already written down: a failure rate too high to be plausible in a maintained corpus is evidence about the checker. The addition names *why the control didn't catch it*.

**Rejected**
- A new bullet beside the existing one. Why not: a second rule about sweeps would be read as a different rule rather than the same one qualified.
- Banning hand-rolled sweeps in favour of a checked-in script. Why not: the sweeps are one-off and shaped to the question; a maintained script would rot between the sessions that need it.

**Consequences**
Both failures were caught by unrelated means (nine "broken" pointers and forty "split tables" were each inspected because the count was implausible), so the corpus was never at risk, but both cost a verification detour. The lesson generalises to any sweep whose first stage is parsing (identifiers out of backticks, paths out of `📖` lines, sections out of headings), and whose extractor the controls do not test.

Read alongside `D-deferral-is-not-delivery`: the same pass found the inverse failure, where `[ -e ]` confirmed a pointer target existed while the target was untracked and would have been dropped by `git commit -am`. Existing on disk and being in the commit are different claims, and the existing check cannot see the difference.

**Status**: committed · **Reversible**: yes

---

### D-a-shared-vocabulary-is-not-a-shared-rule — The Resident-vs-Lazy-Load Extraction Was Measured And Declined — committed — 2026-09-12

**Problem**
A Next Steps row had stood since 2026-08-11 saying the "resident vs. lazy-load" routing principle was stated near-identically in four files and past the 3+ extraction threshold. It was re-confirmed and deferred at least twice. A dispatched survey agent concluded the same, citing consistent vocabulary across the sites as its evidence.

Reading the four passages side by side does not support it. They are four different rules that share a vocabulary:

- `condense-claude-md/SKILL.md` — a pointer's trigger CONDITION is content, so merging a list of `📖`s onto one line deletes the mechanism by which anyone chooses to open them.
- `condense-claude-md/references/structural-splits.md` — how to SHAPE a companion's pointer, as a per-category symptom index rather than one trigger phrase.
- `unhobble-instructions/SKILL.md` — the routing TEST itself (safety-critical? before-action or during-failure? catalog?), plus the separate fact that relocating is not delivering.
- `update-claude-docs/SKILL.md` — one compressed GATE inside a different three-gate sequence whose order is itself the rule.

Only the last two express the same underlying test, and a two-site overlap is below the threshold the row invoked.

**Decision**
Close the row as measured and not warranted. Extracting all four would merge distinct rules into one blurred statement and strand each skill's fit, the failure already recorded as D69: a rule stated in N files drifts in the ones that paraphrase it. The genuinely duplicated fact in this cluster is "relocating is not delivering", which already has its homes (the root `CLAUDE.md` in two places and `unhobble-instructions`); that duplication is deliberate under the deferral rule, since the sentence telling a reader they have a problem must stay inline.

**Rejected**
- Extracting anyway on the 3+ count. Why not: the count was of files sharing vocabulary, not of files stating the rule. Applying the threshold to a near-miss produces the drift it was written to prevent.
- Converging the four sites on one phrasing first, then extracting. Why not: that is the extraction with an extra step, and it would cost each site the specificity that makes it fire at its own moment.

**Consequences**
A shared vocabulary is the cheapest evidence of duplication to gather and the weakest to act on: a grep for "resident", "lazy-load" and "📖" returns all four sites and cannot tell a rule from its subject matter. The check that settles it is reading the passages side by side and asking what each tells a reader to DO. Here the four answers were don't-merge-pointers, shape-the-index, run-the-test and order-the-gates. The survey agent's conclusion quoted the very passages that refuted it: the quotes were accurate and the synthesis was not.

The row also shows a backlog-specific decay. It asserted a count ("4+ files") that no mechanism re-checked across roughly a month and five deferrals, and each deferral read as postponing real work rather than as a decision resting on an unverified number.

**Status**: committed · **Reversible**: yes
