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
Related: ../../current.md (index), ../agent-architecture.md (router), ../doc-condensation.md
Last updated: 2026-07-20
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
