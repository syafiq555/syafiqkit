<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/agent-architecture/verification-checklists
Gotchas (critical — full list in each ADR's Consequences):
  - Having read a file earlier in-session ≠ having verified it against a checklist (D21)
  - A self-caught deviation from a skill's own instructions is a reportable signal, not a win to file silently (D24)
  - A scan's "zero results = done" needs a must-hit control, not just a correct command (D25)
  - A verification whose input is empty emits the same output as a genuine pass — name the empty case, don't trust the checker (D49)
Related: ../current.md (feature index), ../../doc-condensation/current.md, ../../madr-structure/current.md, drift-gates-and-modes.md and reader-behaviour-and-method.md (sibling theme files split out of verification-rigor.md)
Last updated: 2026-10-12 · split out of verification-rigor.md; D21, D24, D25, D47, D49, D52 moved word for word
-->

# Agent Architecture: Verification Checklists

How skills verify their own checklists actually ran, catch self-caught deviations, and avoid silent-pass exit conditions.

---

## How to Verify a Checklist Actually Ran (Not Just Skimmed)

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

## Catching Defects the Model Already Fixed In-Place (Unreported Deviations)

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

## Silent-Pass Exit Conditions: When Empty Input Emits Success

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
- 1.140.13: the must-hit-control rule was itself generalised away by a later `unhobble-instructions` pass over `explore-delegation.md` and had to be restored — the same "documented rule surviving in prose doesn't survive an editing pass" shape this decision's own first bullet names, recurring one level up (against the rule, not just the moment-of-use command). Same change added the non-empty-inventory half D49 doesn't cover: an empty result is easy to distrust, but a short, real-looking list (2 files where 9 exist; a plausible sibling path missing the one that matters) reads settled and gets none of the scrutiny D49's empty-input case does. Both were locally accurate and wrong as inventories. Fix: before acting on any absence an agent asserts, run the one-line count yourself — same instrument as the must-hit control, aimed at a non-empty result instead of a zero one.

**Status**: committed · **Reversible**: yes · Updated 1.140.13 (control-query regained + non-empty-inventory half)

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

