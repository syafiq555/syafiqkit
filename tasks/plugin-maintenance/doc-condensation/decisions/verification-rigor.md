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

---

### D68 — The Unhobbling Pass Reads the File as a Document Before It Reads Any Rule — committed — 2026-08-02

**Problem**
Asked to unhobble four skills, a session grepped `⚠️`/`MANDATORY`/`**Tell:**`, graded the hits, and began editing callouts; the user stopped it — *"it means to read the skills according to judgement prose, not simply find those grep those thing, improving the file as whole."* The skill's own text invited that: its framing test opened "For every rule, callout, or instruction in the target," which makes the pass an enumeration over units before anything has looked at the file as a whole, and Process step 1's "read the target file whole" produced no artifact, so step 2's "go through it top to bottom" absorbed it. Nothing said the deliverable is a better-shaped file. This is D66's authoring rule holding while the *audit* half degraded to the keyword scan `{#own-output-shape}` already names as the failure mode.

**Decision**
Chosen: a document-level read runs first and must be written down before any rule is opened — what the file makes a reader do in order, where each rule sits relative to the moment it applies, and what it says more than once. The per-rule fact-vs-constraint test runs second, against what the shape pass leaves. Reporting leads with structural changes; a wording-only pass stays valid but must say so, since that is also what a marker hunt produces.

**Rejected**
- Adding a "don't just grep" warning to the existing text. Why not: the defect is the framing's *order*, not a missing prohibition — a warning above a per-rule test still yields a per-rule pass, and it grows the file D66 had just shrunk.
- Making the whole-file read a checklist of named shape defects. Why not: the same enumeration one level up, and the four defects found this session were not a fixed set — a fifth file would need a fifth row.

**Consequences**
- The three shape findings were all invisible to a marker scan: `task-summary` carried nine rules averaging three homes each *in the file whose headline rule is "One fact, one home"*, plus a live contradiction between Validate's "No rows deleted" and an entire Pruning section about deleting rows; `update-claude-docs` mandates "rows ≤2 sentences" while running four to five and forbids session storytelling while telling one; `done`'s chain-break defenses are written as reasoning while its derivable material is written as dispatch tables, which is backwards if rigidity tracks risk.
- `task-summary` 26,224 → 25,594 bytes with all sixteen inventoried facts verified by grep; `update-claude-docs` −1,064 bytes; `read-summary` returned a genuine negative (unhobbled the day before, one clause).
- **A relocation in 1.137.17 orphaned a "the MANDATORY callout above" reference**, found by this pass and fixed by moving the arrival-rate rule back above its citing row rather than repointing the words — Capture is the mode that adds lines, so the rule governs it most.
- The pass that finds only wording problems is now distinguishable in the report from the pass that never looked for shape ones.

**Status**: committed · **Reversible**: yes · Extends D66

### D-haiku-condense-delegation — Condensation Drafting May Be Delegated to a `haiku` Agent; Verifying May Not — committed — 2026-08-07

**Problem**
`two-tier-condense.md` forbade spawning any agent for the draft step ("dropped per explicit preference: no agent for this task"). The preference changed; a new `haiku` skill (`skills/haiku/SKILL.md`) was built this session to dispatch mechanical rewrite work to haiku-tier agents with a mandatory post-return verification pass, and `condense-claude-md`/`condense-task-doc` needed to point at it instead of restating "work inline."

**Decision**
Chosen: allow delegating the Draft step to a `haiku` agent; keep Verify non-delegable. Measured this session: a haiku condense of a 375-line CLAUDE.md cut 35% of bytes with the rules intact. The split is what makes delegation safe — an agent grading its own rewrite uses the same read that produced it, so its closing report is an artifact to check, never evidence.

**Rejected**
- Keeping "no spawned agent" as a blanket rule. Why not: superseded by explicit preference change, and the measured haiku run showed the restructuring quality is there when verification is external to the drafter.

**Consequences**
- `two-tier-condense.md` rewritten: Draft section now states the delegation call (`Skill(skill: "syafiqkit:haiku")`) explicitly — a first pass had described delegation as possible without ever naming the dispatch mechanic, caught by this session's own `/done` product-review pass.
- New failure mode named: a delegated rewrite can keep a backtick-quoted identifier intact while reversing the claim around it (kebab-case keys relabelled "camelCase", a hyphen-vs-underscore mismatch called "case-sensitive") — survives an identifier-survival grep because only the identifier is checked, not the sentence. `two-tier-condense.md`, `unhobble-instructions/SKILL.md`, and `haiku/SKILL.md` all now carry this check.
- `condense-claude-md/SKILL.md` step 3 and `condense-task-doc/SKILL.md` step 7 both repointed at `two-tier-condense.md` instead of restating "no spawned agent."

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

### D-limitation-reads-as-hedging — A Stated Limitation Is the Fact an Unhobbling Pass Deletes First — committed — 2026-08-09

**Problem**
Five haiku agents ran `unhobble-instructions` on five staged docs in one batch. Two rewrites inverted the meaning of the passage they compressed: `read-summary`'s peer-check paragraph went from "`ListAgents` cannot tell you which project a peer is in, and an empty listing is not evidence nobody is writing" to "checking for concurrent sessions prevents contested edits" — asserting the guarantee `cross-session-messaging.md` exists to withhold — and its authority paragraph lost "if the answer depends on current state, go measure it," leaving "the live system wins," which states a precedence and instructs nothing. One agent reported the first as an achievement ("defensiveness about what `ListAgents` doesn't guarantee collapsed to a single sentence"). D64 covers an absolutist rule softened against a documented Rejected entry; this is a different mechanism, and D64's `decisions/*.md` grep cannot reach it, because a tool's limitation is a fact about the world rather than a decision anyone recorded.

**Decision**
Chosen: name the shape in `unhobble-instructions/SKILL.md`'s fact-vs-constraint section — text saying what a tool cannot do, what a check does not prove, or what a result is not evidence of has the cadence of an author covering themselves, so a pass hunting over-caution cuts it and counts the cut as a win, leaving the confident half of the sentence asserting what the original withheld. Stated as one sentence pair beside the existing "losing a genuine fact is the failure mode" line, without the worked incident that produced it.

**Rejected**
- A fuller entry carrying the before/after quotes as illustration. Why not: the skill's own line 44 lists "a worked incident embedded in the instructions" as a constraint tell, and the user challenged whether the entry was itself hobbling — the mechanism generalises, the incident belongs here.
- A companion rule about a fact whose force lives in a verb ("go measure it" → "the live system wins"). Why not: Process steps 3 and 5 already state that a fact can survive a rewrite while its force does not; a third home is the repetition the skill's own preamble warns against.

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
