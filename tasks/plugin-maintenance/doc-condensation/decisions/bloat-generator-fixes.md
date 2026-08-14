<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation/bloat-generator-fixes
Gotchas (critical — full list in each ADR's Consequences):
  - Fix doc bloat at the generator (task-summary rules), not by hand-trimming individual docs (D3)
  - A CLAUDE.md line is dead weight once a skill enforces it at action-time (D6)
  - `.claude/rules/*.md` path-scoping frontmatter doesn't actually scope (D17)
  - `/read-summary` discovery in Explore/Plan is now unconditional, not gated on prompt specificity (D18)
  - Task-doc index + pointer is a second structural lever for over-budget CLAUDE.md (D19)
  - Seam-test must check EVERY real sibling subdirectory, not just the obvious one (D20)
  - `/commit`'s staleness gate carves out lexical false positives (`pending` in an identifier) on a shape test, keeping D37's semantic absolutism (D57)
Related: ../current.md (feature index), ../../agent-architecture/current.md, ../../madr-structure/current.md
Last updated: 2026-07-27
-->

# Doc Condensation — Fix Bloat at the Generator, Not by Hand-Trimming

The seed lineage: doc bloat gets fixed in `task-summary`'s rules and CLAUDE.md's structural levers, not by manually trimming individual docs after the fact.

---

### D3 — Fix Doc Bloat at the Generator, Not by Hand-Trimming — committed — 2026-06-09

**Problem**
User flagged the `done`/`task-summary` workflow as "bloated." Repeated facts came from each template section restating the critical thing.

**Decision**
Chosen: add anti-bloat governance rules to `task-summary` itself (one-fact-one-home, rows-≤2-sentences, LLM-CONTEXT-is-pointer-index, Quick-Start-≤15-lines) rather than manually trimming individual docs. `done` cut 164→111 lines: deleted the inline conversation-analysis procedure duplicating `update-claude-docs`; capture is now one delegated Skill call. `## Last Session` strengthened to enforce exactly one heading.

**Rejected**
- Hand-trimming each bloated doc as found. Why not: doesn't fix the generator — every future doc re-bloats the same way.

**Consequences**
A cross-section dedup rule in `task-summary` shrinks every future doc; this is the seed of "one fact, one home" later applied to CLAUDE.md itself (D6) and this doc's full MADR conversion (D12).

**Status**: committed · **Reversible**: yes

---

### D6 — A CLAUDE.md Line Is Dead Weight Once a Skill Enforces It at Action-Time — committed

**Problem**
CLAUDE.md is read at session start (ambient); a skill is read at the moment of action. When both state the same rule, copies drift out of sync (seen with `/commit`'s changelog gate).

**Decision**
Chosen: when a skill enforces a rule at action-time, delete the CLAUDE.md copy — the skill wins.

**Consequences**
Prevents stale-CLAUDE.md-vs-skill contradiction; part of the "one fact, one home" lineage as D3.

**Status**: committed · **Reversible**: yes

---

### D17 — `.claude/rules/*.md` Path-Scoping Frontmatter Does Not Actually Scope; Removed as a Routing Recommendation — committed — 2026-07-12

**Problem**
`update-claude-docs/references/structure.md`'s capture-filter table recommended routing file-type-specific rules to `.claude/rules/*.md` with `paths:`/`globs:` YAML frontmatter, assuming this only loads content when Claude touches a matching file — same property verified for subdirectory `CLAUDE.md`.

**Decision**
Chosen: empirically test the claim with a canary (a secret string in a path-scoped rule file, probed from a fresh session on a non-matching path). Result: the file loaded regardless — the model just self-suppresses acting on it, which is model judgment, not context filtering. Removed `.claude/rules/` as the recommended target; replaced with "real subdirectory CLAUDE.md," verified to genuinely scope.

**Rejected**
- Trusting the vendor-docs-sourced claim (a fetched official doc page did describe `.claude/rules/` frontmatter as reducing loaded context) without a live test. Why not: official docs describe intended/designed behavior; a live bug (this exact gap is tracked upstream, e.g. path-scoped rules failing to apply as documented) can silently break the part that matters. "The docs say X" and "X is true in this install" are different facts on a fast-moving CLI tool.
- Leaving the recommendation in place with a caveat. Why not: a routing table is read at the moment of a real decision — a caveat gets skipped under time pressure; the wrong destination needed to be replaced, not annotated.

**Consequences**
- Fixed `update-claude-docs/references/structure.md` (capture-filter table + `@import` row clarified as also not scoping — launch-time load, DRY-only) and `condense-claude-md/SKILL.md` (step 6, added explicit anti-pattern warning) — the two skill files a future CLAUDE.md split decision would actually read.
- Global `~/.claude/CLAUDE.md` Platform Gotchas gained the frontmatter-doesn't-scope row, plus a corrected row on `📖 See <file>` pointer reliability: a follow-up test showed `read-summary`/the project `Explore`/`Plan` agents already do the correct thing (mandatory CLAUDE.md tree-walk + `/read-summary` call) — but that walk is gated on "does this look like a documented feature/flow," same gate as task-doc discovery, not on "does the search touch a directory with a CLAUDE.md." A generic symptom-only investigation prompt naming no specific flow can slip past that gate straight to code search. Initial framing ("investigation tasks skip docs") was imprecise; corrected after tracing the actual gate in `Explore.template.md`/live `Explore.md`.
- Establishes a general lesson for this decision log's "verify before documenting" lineage: a context-management mechanism's own official docs are a claim to test empirically (negative control: plant a distinguishable fact, probe from a session that should NOT have it, confirm absence), not evidence to route on directly — same standard as any other unverified project claim. Also: when a negative-control test finds a "reliability gap," trace it to the actual gating logic in the responsible skill/template before generalizing — the first plausible explanation (task-type) was wrong; the real one (feature-name-matching) was one file-read away.

**Status**: committed · **Reversible**: yes (revisit if Anthropic ships a fix)

---

### D18 — `/read-summary` Discovery in `Explore`/`Plan` Made Unconditional, Reversing D17's "Gate Is Correct Design" Call — committed — 2026-07-12

**Problem**
D17 concluded the `Explore`/`Plan` Bootstrap gate (task-doc/CLAUDE.md discovery only ran when prompt named a feature/flow) was intentional, correct design. The user chose precision over efficiency: **"burn tokens on unnecessary lookups over risk missing a real gotcha."**

**Decision**
Chosen: remove the feature/flow-name gate from `Explore.template.md` and `Plan.template.md` — `/read-summary` discovery now runs on every call. Bootstrap sections now open with a `⚠️ MANDATORY, no exceptions` line rather than a caveat buried after it.

**Rejected**
- Leaving `Explore` gated but making `Plan` unconditional (or vice versa). Why not: user's stated preference was general ("I don't mind, Explore is haiku anyway") — applied to both since `Plan`'s lower call-frequency per session offsets its higher per-call model cost (sonnet) similarly to `Explore`'s low per-call cost at higher frequency.
- Only strengthening wording in the existing caveat rather than restructuring Bootstrap's opening. Why not: the caveat already existed (D17's own text) and still didn't prevent the original miss — a rule stated as an exception-to-a-default reads weaker than one stated as the default itself; matches this doc's own D3/D6 "escalate by position and sharpness" lineage.
- Reverting D17's underlying finding (that the old gate was well-designed). Why not: D17's finding was correct as a description of the code's PRE-existing intent — this decision is a values call by the user overriding that intent going forward, not new evidence that the old design was flawed.

**Consequences**
- `Explore`/`Plan` pay a `/read-summary` discovery cost on every invocation now, including trivial calls — accepted cost per user choice.
- Plugin-wide: every project's scaffolded `Explore.md`/`Plan.md` inherits the unconditional gate by default.

**Status**: committed · **Reversible**: yes (stated user preference, not a discovered technical fact)

---

### D19 — Task-Doc Index + Pointer Added as a Second Structural Lever for Over-Budget CLAUDE.md Files — committed — 2026-07-12

**Problem**
`update-claude-docs/references/structure.md` §6 offered ONE structural lever for over-budget CLAUDE.md: push a section down to subdirectory CLAUDE.md, gated on seam-test. Horizontal-layer files commonly fail that seam-test — their gotchas are about shared primitives used across many dirs, not confined to one. D18 confirmed `Explore`/`Plan` follow a task doc's own `📖 See <file>` pointer rows reliably.

**Decision**
Chosen: add a second lever to `references/structure.md` §6 — when a block is too big, fails seam-test, but IS scoped to one documented feature/flow, route it to that feature's task doc `## Gotchas` table with a bare `📖 See <file>` pointer row. Explicit boundary table added distinguishing this from the subdir lever: needs a FEATURE identity (confirmed via content-based `/read-summary` discovery), not a directory.

**Rejected**
- Applying this lever to ANY over-budget block, including cross-cutting layer conventions. Why not: `code-reviewer`/`code-simplifier` don't run `/read-summary` on every trivial edit the way `Explore`/`Plan` now do (D18 only changed those two) — a write-time convention a fresh session needs BEFORE editing would silently vanish for those agents if moved out of CLAUDE.md. Restricted to debugging/investigation-shaped content (`Symptom | Cause | Fix`), which is what a task doc's Gotchas table already holds and what `Explore`/`Plan` actually consume.
- Treating "seam-test fails" as terminal (per D17's own then-correct conclusion, later reaffirmed in `condense-claude-md`'s step 6 warning: "the section stays in the layer file — that's the correct outcome"). Why not: that conclusion predates D18's mandatory-discovery change; a lever that didn't reliably work when D17 was written now does, verified live.
- Auto-creating a new task doc slug just to hold a relocated section. Why not: an orphaned single-purpose doc invented to house one block is worse than leaving the block inline — the lever only applies when a real feature doc exists or genuinely should via content-based discovery, never a guessed folder name.

**Consequences**
- `update-claude-docs/references/structure.md` §6 gained the second-lever section + boundary table.
- `condense-claude-md/SKILL.md` step 6 warning updated: checks feature-specificity before declaring the layer file terminal.

⚠️ **Correction (see D20)**: "spans the whole authz layer" was true but irrelevant — Multi-Agency concentrates 11-26x in `app/Http/*` vs 0-4 in `app/Domain/*`, so it DID pass seam-test against a subdirectory this decision never checked.

**Status**: committed · **Reversible**: yes

---

### D20 — Seam-Test Must Check EVERY Real Sibling Subdirectory, Not Just the Intuitively-Obvious One — committed — 2026-07-12

**Problem**
D17 concluded Multi-Agency Gotchas "fails the seam-test," checked only against `app/Domain/*`. Re-examination grepped its core symbols against every top-level `app/` subdirectory and found 5-10x concentration in `app/Http/*` — a real seam the original check never looked for.

**Decision**
The seam-test itself was under-specified — "check the seam-test" meant "check the intuitively-named subdirectory," not systematic. Added explicit instruction to `references/structure.md` §1 and both skill SKILL.md files: grep core symbols against EVERY candidate subdirectory with `grep -rl "<symbol>" <dir> | wc -l`, let counts decide. Applied live: created `app/Http/CLAUDE.md` (86 lines), moved Multi-Agency Gotchas + Controller Patterns there, `app/CLAUDE.md` shrank 295→241 lines (20.5% reduction).

**Rejected**
- Treating this as a one-off correction to D17 alone, not a methodology fix. Why not: the same "check only the obvious candidate" gap exists in every place the seam-test is invoked (`condense-claude-md` step 6, `update-claude-docs` §2/Rewrite step 6) — fixing D17's specific conclusion without fixing the underlying check means the next session hits the identical miss on a different section/project.
- Re-checking Cast Gotchas and Media/PDF against the same broadened methodology and finding they ALSO have a hidden seam. Why not: actually checked (grep counts run) — Cast Gotchas stays genuinely cross-cutting (`$casts` concentrates in `Domain`+`Models`, both real content-generating layers, no single dominant seam), Media/PDF splits evenly between `Http`/`Domain` with no dominant candidate either. Not every miss is the same miss; verified rather than assumed the fix generalized to all three sections.

**Consequences**
- `references/structure.md` §1, `condense-claude-md/SKILL.md` step 6, `update-claude-docs/SKILL.md` §2 patched with the "check every real sibling" instruction + methodology.
- D19's text kept as-written, correction note added rather than rewritten — MADR log preserves what was concluded at each point.

**Status**: committed · **Reversible**: yes

---

### D44 — A File's Own Declared Size Budget Outranks the Skill's Default — committed — 2026-07-25

**Problem**
Reported by an external consumer as [issue #9](https://github.com/syafiq555/syafiqkit/issues/9) against installed 1.123.1. `update-claude-docs` Step 4 spawned `claude-md-pruner` unconditionally once the agent file existed, and Step 5 flagged overage against a hardcoded 350. A project whose CLAUDE.md header records the owner's decision — budget ~460 not 350, 13 consecutive passes confirming every gotcha row load-bearing, per-stack splitting evaluated and **declined**, "don't re-open either question" — therefore got an agent spawned to re-answer a closed question and a false overage on every run. The reporter deviated from the step twice in one session to behave correctly, which is the signal that a step is missing a case.

Two things kept this alive. Step 4's existing ⚠️ "only background-prune files that are SETTLED" scopes to *timing within a session* (don't prune a file you're still editing), so it read as satisfied while the permanently-closed case went unhandled — a warning whose wording overlaps an uncovered case actively suppresses the fix. And the root cause was an authority inversion appearing at **four** sites, not the two the issue named: fixing only the caller leaves a directly-invoked pruner or condenser still re-litigating.

**Decision**
Chosen: a file's own stated budget/decision outranks every default. Detection lives once in `skills/_shared/references/declared-budget.md` (prose signals — a declared budget, a "don't re-open"/"declined" note, a recorded count of no-op passes — plus an act table and fallbacks), cited by one-line pointers from `update-claude-docs` Steps 4+5, `condense-claude-md` step 4, `structure.md` §6, and the pruner agent+template. Prose-signal detection over a formal marker, so files already written this way (including the reporter's) work with no retrofit. Step 4 gained a third table row: agent found **but the file records pruning/splitting as decided** → skip the spawn, report size against the file's own budget.

**Rejected**
- Patching only `update-claude-docs` Steps 4+5 as filed. Why not: four independent copies of "350 is the ceiling" is *why* the bug existed in four places; four independent copies of the fix rebuilds the same drift surface.
- A formal header field (`Budget: 460 (decided)`) as the sole detection method. Why not: every existing file, the reporter's included, would need retrofitting before the skip fires — it would not close the reported case on its own.
- Letting a declared budget suppress measurement too. Why not: deferring on the *threshold* is not deferring on whether it was met. A file 200 lines past its own stated 460 is over budget and must be told so.

**Consequences**
- A declared budget below the default is equally authoritative — the signal is "the owner decided", not "the owner wants more room".
- A declared *split* decision suppresses `condense-claude-md`'s split offer, not merely its number — the reporter's file had declined the split specifically.
- Follow-on the same session: the pruner stopped carrying any size policy at all (its `~200`/`350` figures deleted), leaving `condense-claude-md`/`condense-task-doc` as the single owners per artifact. Recorded as a `CLAUDE.md` § Conventions row. See D43 (`../../agent-architecture/decisions/injection-and-delegation.md`) for the agent's own scope change.

**Status**: committed · **Reversible**: yes

---

### D51 — An Undersized File Skips the Pruner Spawn, Gated on a Ratio Rather Than a Fourth Absolute Number — committed — 2026-07-26

**Problem**
Reported as [issue #10](https://github.com/syafiq555/syafiqkit/issues/10) against installed 1.124.1, and the direct successor to D44. D44 taught Step 4 to skip when the owner had *decided* against pruning, but the middle row gates on a decision, never on size — so a 26-line project CLAUDE.md (7% of the 350 default) with no declared decision still mandated a spawn that could only return a no-op. The reporter declined it, the same deviation signal D44 was filed on.

`_shared/references/declared-budget.md` already stated the cost principle ("a no-op result … is not a success worth paying an agent for") but scoped it to the decided case, so it read as covering this and did not.

**Decision**
Chosen: a size floor in the shared reference's Act table — **under half the hard ceiling** (declared figure, else 350 → under 175) **and** ≤5 net lines added this session. Both conditions must hold to skip; the final row is an explicit catch-all so a file that clears the size test but grew this session still gets a real pass. Expressed as a ratio so no new absolute number enters a file that isn't one of the two condense skills (`CLAUDE.md` § Conventions), and so one rule covers a declared 460 and the 350 default alike. Both inputs are values a caller already computes (`wc -l`, `git diff --stat`).

**Rejected**
- An absolute floor (`<100 lines`), as the issue suggested. Why not: writes a fourth number (alongside 200/250/350) into `_shared/`, which the § Conventions row reserves to the condense skills, and needs a second rule for a file declaring a *small* budget — a ratio handles both with one row.
- Measuring against the soft target rather than the hard ceiling. Why not: a soft/hard pair makes "half the budget" two different numbers (100 vs 175), leaving every file between them undecidable — a reader computing against either gets a defensible, opposite answer.
- Routing the size question to `condense-claude-md` instead of stating a floor. Why not: turns a `wc -l` into a full skill invocation on every `/done`, and that skill rewrites files rather than answering yes/no.

**Consequences**
- All 6 sites citing `declared-budget.md` inherit the floor.
- ⚠️ **A gate needs its measurement named at the DECIDING step.** Step 4 gained an explicit measure line. This recurrence is why a `CLAUDE.md` § Maintenance checklist now requires it.

**Status**: committed · **Reversible**: yes

---

### D57 — `/commit`'s Staleness Gate Gained a Lexical Carve-Out for Identifier/UI-Name Hits — committed (v1.132.0) — 2026-07-27

**Problem**
Reported as [issue #14](https://github.com/syafiq555/syafiqkit/issues/14) against 1.130.0. The `/commit` staleness gate greps task docs for `uncommitted|not yet pushed|pending` and, by D37's design, forbids any judgment about whether a hit is "real" staleness — the absolutism defeats *rationalization* ("it's accurate right now" excusing a genuinely stale hedge). But `pending` is ordinary domain vocabulary: in one real run it matched `pendingStep` (a DTO field) and "pending-step chip" (a UI element), neither a commit-state claim. The no-judgment rule forbade saying so, leaving only a pointless full `task-summary` run or an undocumented deviation — the latter is what happened, eroding the gate generally.

**Decision**
Chosen: a carve-out on a DIFFERENT axis from the one the absolutism guards. The absolutism is semantic (real-vs-rationalized staleness); the carve-out is lexical (identifier-vs-prose). A hit fused into a camelCase/kebab/Pascal identifier or a quoted UI-label (`pendingStep`, `pending-step chip`, `PendingTasks`) is the domain's vocabulary — note it inline, no `task-summary` run. Token SHAPE is mechanically checkable and never reopens the judgment door; anything not unambiguously code-shaped defaults to prose and the absolutism applies in full. Also fixed the coupling this exposed: `/commit` line 28 said the gate's run "satisfies" `/done` Step 4, but a carve-out-only resolution runs NO `task-summary`, so both `/commit` line 28 and `done` Step 4 now key on whether a run ACTUALLY happened, not on the gate firing — else a false-positive resolution makes `/done` skip a scan it owes.

**Rejected**
- Word-boundary anchoring the pattern (`\bpending\b`). Why not: still matches "pending-step chip", and bare "pending" is legitimate prose too — the discriminator is identifier-vs-prose, not word-boundary.
- Relaxing the absolutism to "use judgment whether the hit is real staleness". Why not: reopens exactly the rationalization door D37 closed. The carve-out must be a mechanical shape test, not a semantic one.

**Consequences**
- The gate now has two axes — a mechanical shape filter (lexical) layered on the mandatory semantic absolutism; future edits must keep them distinct.
- The `/done` Step 4 "already ran → scoped" optimization now requires confirming `task-summary` actually ran, not just that the gate fired.
- Inverse of the "a gate is only real if a step computes its inputs" family (D50/D51): here the fix narrows a gate that fired too broadly, rather than wiring a gate that never measured.

**Status**: committed · **Reversible**: yes

### D67 — `condense-task-doc`'s Aggregate Line/Byte Target Passed While Individual Sentences Stayed Bloated — committed — 2026-08-02

**Problem**
A real run on Dourr's `blog-automation/current.md` (a sibling project, not this repo) did a full row-existence pass per D-family precedent, cut the doc 21% by bytes, and reported the pass done against step 9's target. The user's reply was "each line also bloated" — several Task Status and Bugs Fixed rows were still single sentences running 500-1000+ characters, stacking parentheticals, inline measurements ("$2.8778", "13/107 vs 12/35"), and multiple `⚠️` clauses in one run-on. Step 9's tripwire is entirely aggregate (bytes-per-line, total size), which a doc can clear while only its worst few lines carry the bloat — most lines in a typical task doc are short table rows or short prose, so an average absorbs a handful of very long sentences without moving much.

**Decision**
Added step 11: after the row-existence pass, run `awk '{print length, NR}' <file> | sort -rn | head -15` directly against sentence length, not the aggregate. Tighten the worst offenders specifically — evidence/measurement detail collapses to its conclusion, three related facts fused into one run-on become one line naming the mechanism. Same underlying test as step 6's row-existence keep-test, just applied one level down: bytes-per-line already existed as a *derived* signal in step 9 ("bytes-per-line above ~120-150... means there's a second pass"), but nothing forced actually running that second pass, and a derived aggregate threshold is exactly the shape D50/D54 already flagged as gameable without a direct per-unit check.

**Rejected**
- *Lower the bytes-per-line aggregate threshold instead of adding a direct check.* Why not: same failure mode as D51's "a gate is only real if a step computes its inputs" — an aggregate can't distinguish "20 medium lines" from "19 short lines + 1 giant one," so tightening the number doesn't add discrimination, it just moves where the same blind spot sits.
- *Fold this into step 6 (row-existence) instead of adding a new step.* Why not: row-existence is about whether a row/fact should exist at all; this is about whether a fact that DOES belong is stated at the length it needs. Conflating them makes step 6 harder to apply cleanly to either question.

**Consequences**
- `condense-task-doc` now has three tiers of check at increasing granularity: doc-set-wide duplication (step 5/10), row-existence (step 6), sentence length (step 11) — each catches a bloat shape the others structurally can't.
- Same family as D50 ("byte-neutrality is not content-preservation") and D54 ("a marker downgrade is presentation, not condensation") — an aggregate or surface-level metric passing is not proof the underlying defect this skill exists to fix is actually gone.
- The awk command is cheap enough to run unconditionally after every row-existence pass, so this doesn't need its own opt-in gate the way D51's undersized-file skip does.

**Status**: committed · **Reversible**: yes — a future run could fold this back into step 9's aggregate check if a better single metric is found, but none currently discriminates "few giant lines" from "many medium ones."

---

### D-done-owes-the-condense — `/done` Measures the Doc Set It Just Wrote — committed — 2026-08-10

**Problem**
Reported as [issue #19](https://github.com/syafiq555/syafiqkit/issues/19). A task doc finished 332 lines against budget; the overage was measured, reported, and never condensed. The rule lived in `task-summary` and no step enforced it.

**Decision**
Measurement moves to Step 4, the deciding step. Over budget → condense in the same turn, or state why it was skipped. `condense-task-doc` owns the threshold; `/done` cites it with no number (§ Conventions).

**Consequences**
- Measurement at the deciding step is the only thing that makes a gate real; a checklist row is itself an unenforced gate.
- A gate can be present and unreachable (placed after the hand-off sentence).
- Overage-that-feels-inherited is the same deferral as overage-I-caused; both now named rather than only forbidden.

**Status**: committed · **Reversible**: yes

### D-guard-scoped-to-what-it-can-see — Contest Is Uncommitted State, Not History — committed — 2026-08-10

**Problem**
Same issue #19. A session declined the condense as "another session's content," but the reporter's instinct was right — they would have been fine.

`condense-task-doc` step 0 uses `git diff HEAD` (uncommitted work only). Committed history has no live party to collide with.

**Decision**
Docs whose `git diff HEAD` is empty are uncontested and free to condense. Additive; no existing guard was loosened.

**Consequences**
- A misscoped guard blocks safe operations and erodes trust; a missing gate lets bad things through — the rarer failure is expensive.
- This guard compounded D-done-owes-the-condense (even had it fired, this wording would have talked the session out of the fix).

**Status**: committed · **Reversible**: yes

### D-unmatched-glob-measures-zero — Doc-Set Measurement Must Survive Unsplit Docs — committed — 2026-08-10

**Problem**
`cat current.md decisions/*.md | wc -c` aborts on unsplit docs (unmatched glob in zsh, shell-level). The set reports 0 — every unsplit doc passes any budget gate by appearing empty.

**Decision**
Use `find <doc-dir> -name '*.md' | xargs cat | wc -lc` (works split and unsplit; counts lines + bytes).

**Consequences**
- Fixed at 4 sites: `done/SKILL.md`, `task-summary/SKILL.md`, `agent-setup/templates/claude-md-pruner.template.md`, generated `.claude/agents/claude-md-pruner.md`.
- The defect was in the gate written to close D-done-owes-the-condense — same permissive-default shape, one layer down.

**Status**: committed · **Reversible**: yes

### D-skill-args-eat-dollar-zero — A Skill's Own Snippets Are Rewritten by Its Argument — committed — 2026-08-14

**Problem**
Invoking a skill with an argument makes the harness replace every bare dollar-zero in that skill's body with the argument text before the agent reads it, code fences included. `condense-task-doc`'s per-section measure used exactly that token, so `awk` received a bare regex and returned a plausible wrong count instead of erroring. Reported by a consumer as issue #22; reproduced here with a throwaway skill, which also established that `$1`/`$2`/`$9` survive intact, so only dollar-zero is exposed.

**Decision**
Read a line back through a shell variable (`grep -n` for the number, `sed -n "${var}p"` for the text) rather than an awk whole-line field. The mechanic is stated in `editing-skills-checklist.md` and restated inline in `condense-task-doc`'s Core Facts, since a reference nothing routes through at the moment of writing would not have been read.

**Consequences**
- The budget check this replaced had been silently lost by an earlier unhobbling rewrite, leaving prose with no command behind it. Restoring it exposed a second defect: the original excluded everything below the `## Next Steps` heading rather than the section, so any doc with sections after it was undercounted — this doc's own index read 66 instead of 105.
- A snippet restored faithfully from a bug report or an older commit carries whatever bug it already had. The report proves the command ran, never that it was right; run it against a real doc and check the output against a manual read.
- `task-summary/SKILL.md`'s size gate still states bytes (`wc -c`) where step 7 now measures lines with a section subtracted. Left as-is, tracked in Next Steps.

**Status**: committed · **Reversible**: yes
