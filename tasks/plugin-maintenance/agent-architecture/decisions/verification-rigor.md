<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/agent-architecture/verification-rigor
Gotchas (critical — full list in each ADR's Consequences):
  - Having read a file earlier in-session ≠ having verified it against a checklist (D21)
  - A self-caught deviation from a skill's own instructions is a reportable signal, not a win to file silently (D24)
  - A scan's "zero results = done" needs a must-hit control, not just a correct command (D25)
  - A confirmation gate that defaults ON forces the caller to pre-empt it every invocation (D28)
  - Drift checks must cover addition (missing agent), not just modification (D38)
  - Widening a threshold table needs every downstream decision point checked, not just the table (D39)
  - A verification whose input is empty emits the same output as a genuine pass — name the empty case, don't trust the checker (D49)
  - `/done` docs-only runs the full agent trio (not just a referential check); the prose-vs-executable sub-gate is gone (D58, supersedes D52's 1.127.0 gate)
Related: ../current.md (feature index), ../../doc-condensation/current.md, ../../madr-structure/current.md
Last updated: 2026-07-27
-->

# Agent Architecture — Verification Rigor & Self-Audit

How skills verify their own checklists actually ran, catch self-caught deviations, and avoid silent-pass exit conditions.

---

### D21 — Step 5's Checklist Requires a Command Per Item, Not a Re-Read — committed — 2026-07-12

**Problem**
A live `/agent-setup` run on an existing 6-agent project re-read all six files, judged them "well-established" from that skim, and reported the Step 5 checklist as satisfied. The user pushed back ("check properly"); a literal grep against the same files immediately found 2 failing items (`Skill` tool + `/read-summary` wiring missing from 5 agents per D14; `disallowedTools: [Write, Edit]` missing from `Explore`/`Plan` per the naming-exception note) that the skim had missed entirely.

**Decision**
Chosen: Step 5's checklist is prefaced with an explicit instruction that each item is a command to run against current file content, not a fact to recall from having read the file earlier in the session. The "Agents exist" row in Step 1 also no longer permits skipping Step 5 — an established-looking agent set still gets the full checklist.

**Rejected**
- Trusting a prior in-session file read as sufficient verification. Why not: reading a file for "does this look right" and grepping it for "does this literal string exist" are different operations with different failure rates — the session's own before/after is the proof (same six files, skim said pass, grep said fail on 2/17 items).

**Consequences**
- Distinct from D15: D15 is about whether a *generated agent* reliably calls `/read-summary` at runtime. D21 is one layer up — whether the model *executing agent-setup itself* reliably runs its own verification checklist, or silently substitutes a skim.
- General pattern, not `agent-setup`-specific: any skill with a Step-N "verify" checklist is exposed to the same substitution unless the checklist text itself forecloses it.

**Status**: committed · **Reversible**: yes

---

### D24 — A Self-Caught Deviation From a Skill's Own Instructions Is a Reportable Signal — committed — 2026-07-13

**Problem**
`done` Step 5's gate ("does a real skill signal exist?") was calibrated entirely against false positives — wording like "most runs have none" and "never manufacture one" — with nothing guarding the opposite failure. A live session hand-rolled a correct branch chain because `/ship`'s Step 3 wrongly assumed `git push` on the current branch was the deploy, then almost skipped Step 5 anyway: catching and working around the defect in the moment felt like competence, not a finding, so it nearly went unreported.

**Decision**
Chosen: `done` Step 5 now asks explicitly — *did I deviate from any skill's written instructions this session, and why?* A deviation with a good reason is a skill that needs the reason written into it; the gate treats a self-caught workaround as equivalent to a user-flagged misfire.

**Rejected**
- Leaving the gate as "does something feel like a bug" and trusting the model to generalize to self-caught cases. Why not: the same session that caught the deviation is the one that nearly filed it as a non-event — the moment of catching it is exactly when it stops looking like a defect.

**Consequences**
- Directly produced the `ship` Step 3 fix in the same session (D-equivalent fix, not yet numbered as its own ADR — see CHANGELOG 1.64.1): deploy-branch identification now required before any push, recognizing forward-merge chains as merges (not pushes) and surfacing manual gates + migrations riding along.
- Distinct from D21: D21 catches a *checklist skimmed instead of run*; D24 catches a *defect the model already fixed in place*, which is arguably easier to miss because there's no failing check to notice — only a decision not to mention it.

**Status**: committed · **Reversible**: yes

---

### D25 — A Scan Step's "Zero Results = Done" Exit Condition Needs a Must-Hit Control, Not Just a Correct Command — committed — 2026-07-13

**Problem**
`merge-task-docs` Step 3/Step 6 and `read-summary`'s discovery fallback shipped `rg -rn "pattern"` as the literal copy-pasteable command in three places. `rg` has no recursive flag — `-r` is `--replace` — so the command silently substituted the searched pattern out of its own output and exited 0. Step 6's exit condition is "zero results = done," run *after* Step 5 already deleted the source docs — a corrupted scan reads identically to a genuinely clean tree, and the merge finishes with dangling references nobody catches.

**Decision**
Chosen: replace `rg -rn` with `grep -rn` (ugrep's `-r` is genuinely recursive) in both skills, AND add a must-hit control line to `merge-task-docs`' final scan (`grep -rn "current.md" tasks/ | head -1`) so a zero result is only accepted once the control proves the search could have returned something. `read-summary` gained the same control-line rule at its discovery step, plus an explicit "the tell" line (search term absent from its own output, or an unrelated token in its place) since the failure mode has no error/stderr to notice.

**Rejected**
- Fixing only the broken command (`rg`→`grep`) without adding a control. Why not: this doc's own D21 lineage — a checklist item needs a command per item, not trust in the command being right — extends here: a *correct* command with an *unverified* empty result is still a silent-pass exit condition. The next accidental `-r` reintroduction (or an unrelated cause of a genuinely-empty grep, like a wrong path) would pass the same way.
- Scoping the fix to `merge-task-docs` alone, since that's where the destructive step (Step 5 delete) lives. Why not: `read-summary`'s discovery step has the identical footgun and the identical "silent empty result reads as success" shape, just without a delete attached — the mechanism is shared even though the blast radius differs; `update-plugin`'s own "a fix to a shared mechanism is a fix to all skills using it" rule (see CHANGELOG 1.64.4) applies.

**Consequences**
- Global `~/.claude/CLAUDE.md` already carried the `rg`-has-no-recursive-flag rule in its Shell Commands table; this decision is that rule failing anyway at the exact moment (mid-skill-authoring, "I'm finding a doc" framing) it existed to prevent — a documented rule surviving in prose doesn't guarantee the moment-of-use command gets typed correctly. Reinforces D3/D6's "fix the generator, not the instance" lineage: the fix isn't a fourth restatement of the rule, it's making the *unsafe form structurally unreachable* (mandate `grep -rn`, name the tell) rather than trusting recall.
- Plugin version bumped 1.64.4→1.64.5; CHANGELOG entry added.

**Status**: committed · **Reversible**: yes

---

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

### D49 — A Verification Step Whose Input Is Empty Reports a Pass, Not a Gap — committed — 2026-07-26 · renumbered from D44 (2026-07-26, collided with doc-condensation's older D44)

**Problem**
Two skills shipped the same defect in one release. `done`'s mode table (docs-only / infra-only / full) presupposed a repo diff, so a session that provisioned a production demo account entirely through `tinker` — clean tree, no session commit, only throwaway scratchpad scripts — matched no mode; Step 1 was skipped by improvisation, and an empty file partition handed to the three code agents would have returned a green report meaning nothing. Independently, `ship` Step 4 was singular throughout and literally ran `gh run list --limit 1`: a Dourr ship pushed `master` and forward-merged `production` seconds apart, starting two runs; the polled run passed while its sibling failed all 3 SSH retries, leaving staging a commit behind while the ship reported green. The user found out by email. Both share one shape — the check ran, found nothing to object to *because it was looking at nothing*, and emitted the same output as a genuine pass.

**Decision**
Chosen: name the empty-input case explicitly at each site rather than trusting the checker. `done` gains an **ops-only mode** (skip the three code agents; verify by reading the live system back, since an action's own return value is not evidence; Step 4 becomes the point of the run because a live-system change leaves no trace in `git log`), plus a rule that an empty `git status --short` does not by itself select a no-code mode — committed-this-session, another writer's tree, and no-repo-work look identical and need opposite handling. `ship` moves to `--limit 5 --json workflowName,status,conclusion,attempt,headSha`, must re-list at the end and assert zero unresolved failures across all runs, and records that a retried run reuses its id — so a stale failure email and a currently-green run can name the same id, and only `attempt` + `conclusion` settle it.

**Rejected**
- Letting the three code agents run against an empty partition in ops-only sessions. Why not: it produces a clean report indistinguishable from a real one, which is worse than an acknowledged skip — it manufactures the evidence of review that `done`'s Output table then reports as fact.
- Treating the second CI run as the caller's problem to notice. Why not: the ship is the step that created both runs, so it owns the assertion; the failure surfaced via a user's inbox, precisely the notification path a ship exists to make unnecessary.

**Consequences**
- `done` has a fourth mode and a companion disambiguation rule above Full mode; its Output table's Simplify/Review/Product rows accept `➖ ops-only`.
- `ship` Step 4 asserts across all runs a push started, not one id; Step 5 gained an issue-tracker item (post in the same run when the project documents a tracker, searching before creating).
- A hand-fix applied on a deploy target must go through git — a `reset --hard` deploy discards it silently, and only gitignored env files legitimately live server-side.
- Generalizes D25's must-hit control from a *scan's* zero-result exit to any verification whose input can be empty.
- Plugin version 1.123.25→1.123.27.

**Status**: committed · **Reversible**: yes (each rule is additive; reverting one leaves the others intact)

---

### D47 — Fleet Audit Closed Both Open Rows: D24 Is `done`-Only, D49 Hit Two More Skills — committed — 2026-07-26

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

### D52 — A Review Pass Over the Same Session's Own Fixes Is Where the Agents Earn Their Cost; Findings-vs-Clean Reliability Is Prompt-Dependent, Not Fixed — committed — 2026-07-26

**Problem**
D47 concluded that an audit agent's *findings* need re-verification while its *clean* verdicts are the reliable half — measured on agents handed a defect definition to hunt across 19 files. Applying that as a general prior is wrong: a `/done` pass reviewing the **fixes this same session just wrote** inverts it. All three agents filed findings; all three survived verification; the one that mattered was invisible to both the author and the two file-scoped lenses.

**Decision**
Chosen: keep D47's rule scoped to *definition-handed audit* agents, and record the opposite case explicitly — a review of the session's own new work is high-yield, and the product reviewer is the lens that finds the defect the author structurally cannot see. What each found on D51's floor gate:
- **Product reviewer** (🔴, the load-bearing one): the gate named two inputs *nothing in the workflow computed* before the deciding step read them. Neither file-scoped lens could see it — the defect was in the *ordering across steps*, not in any line. Same shape as D50's unenforced gate, 3rd recurrence.
- **Reviewer**: "under ~half its applicable budget" was undecidable against a soft/hard pair (100 vs 175); and a conjunction fallthrough left an under-ratio-but-grown file matching no row.
- **Simplifier**: 4 line-neutral cuts, plus the one recommendation the author had explicitly ruled out cutting — it respected the constraint and proposed a different, correct offset.

**Rejected**
- Skipping the agents because the diff was all-markdown (`/done`'s docs-only mode). Why not: in this repo markdown *is* the executable artifact — a skill file's logic error is a real defect. The mode was overridden by hand and the pass returned three real findings, so the override was correct — and the mode itself was then fixed, gating on prose-vs-executable rather than `.md`-vs-code (1.127.0), so no future session needs the override.
- Treating the product reviewer as redundant with the reviewer on a 3-file diff. Why not: the two file-scoped lenses both read the same lines and both missed the cross-step ordering defect. Small diff ≠ product reviewer has nothing to add.
- Generalizing "agent findings are reliable" from this pass. Why not: the difference is the *prompt shape*, not the agent — hunting a supplied definition across many files manufactures matches (D47); reviewing a small, fresh, self-authored change does not. Verify findings either way; expect the yield to differ.

**Consequences**
- ⚠️ **An author reviewing their own new rule cannot see whether anything computes its inputs** — the intent is in your head, so the missing step reads as present. This is why the pass runs even when the change is small and self-checked. Fix landed as a `CLAUDE.md` § Maintenance row; mechanism in D51 (`../../doc-condensation/decisions/bloat-generator-fixes.md`).
- The simplifier's constraint-respecting behaviour is worth keeping: it was told one specific clause was off-limits *with the reason*, and it found a different offset rather than arguing. Naming the reason, not just the prohibition, is what made that work.

**Status**: committed · **Reversible**: yes

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

---

### D-emission-shape-reanchor — Reordering a Rule Earlier in a Doc Fixes the Cold Read, Not the Behavioral Miss — committed — v1.139.10

**Problem**
Reported upstream as [issue #18](https://github.com/syafiq555/syafiqkit/issues/18). `/done` Step 1's "Ownership" section (file-partitioning guard) sat ~45 lines before the "emission-shape" rule (all `Agent` calls in one message). A session doing non-trivial ownership reasoning (contested files) lost track of emission-shape by the time it drafted the `Agent` calls, and split the batch across two messages. The first fix reordered Step 1 so "Emission shape" is read *before* "Ownership." The product reviewer then asked the harder question: does reading the rule earlier in a cold pass actually prevent the reporter's failure, which happened *after* a full read, once attention was absorbed by the ownership partitioning itself?

**Decision**
Chosen: reordering stays (it helps the cold-start case) AND a one-line re-anchor is added at the end of Ownership, immediately before "Agents to run" — the exact point where partitioning reasoning ends and `Agent`-call drafting begins: "Once the partition is decided, emit every agent from it in the single message described above." This is the reporter's own suggested fix ("closer to, or immediately after, the ownership-guard section") — document position alone doesn't survive a reasoning-heavy section in between; the constraint needs to re-trigger at the moment of action, not just appear earlier in a linear read.

**Rejected**
- Reordering alone (ship the first fix as sufficient). Why not: fixes the failure mode for a reader who acts immediately after reading Emission-shape, but the original reporter's miss happened with the OLD order too — after fully processing Ownership, not before it. A rule read once, then followed by several paragraphs of unrelated reasoning, needs a second trigger at the point where that reasoning ends, not just an earlier read.

**Consequences**
- Same shape as D52/D53 (a branch/rule dead wherever no step re-checks its own condition at the moment it's needed) — this is the "salience," not "reachability," face of the same underlying pattern: a true statement earlier in a document is not the same as a statement present at the point of action.
- Caught by the product reviewer against the two GitHub issues' original text, not by the code reviewer (which correctly verified the reorder was internally consistent) or by the author re-reading their own fix — 3rd consecutive session where the product-reviewer lens found the load-bearing defect a file-scoped/self lens couldn't (D52, D53, this).

**Status**: committed · **Reversible**: yes
