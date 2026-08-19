<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/external-guidance/grading-method
Gotchas (critical — full list in each ADR's Consequences):
  - Generic advice describes a different SYSTEM, not just a different opinion — match assumed dynamics before weighing merits (D55)
  - A raw duplication count is not duplication — a shared FORMAT counts identically to a duplicated RULE; open three (D55)
  - A report's numbers are a snapshot of its run time; 3 of 3 live-state flags failed re-measurement (D56)
  - Provenance and staleness are different tests — run both, neither substitutes (D56)
  - An agent's finding is a hypothesis whose line numbers are usually right even when the claim is wrong (D59)
Related: ../current.md (feature index), applying-verdicts.md (sibling theme — what happens when a verdict is acted on), ../../doc-condensation/current.md (owns D50/D54, the density decisions this method consumes)
Last updated: 2026-08-20 — split out of current.md when it reached 294 lines, ahead of grading source #6
-->

# External Guidance — The Grading Method

How a piece of outside advice becomes a per-claim verdict: the four verdicts, the measure-before-judging step, and the two additions a generated tool report needs.

---


### D55 — Grade External Guidance Per-Claim Against Local Evidence; a Rejected Claim Needs a Named ADR — committed — 2026-07-27

**Problem**
Anthropic's Claude-5 context-engineering article makes 9 discrete claims, led by "we removed 80%+ of Claude Code's system prompt with no performance loss — let Claude use judgement." Taken as a whole it reads as authoritative and actionable. Taken claim-by-claim, 4 were already adopted here, 1 was false against the installed tooling, 2 were refuted by this plugin's own measurements, and only 2 were genuinely actionable. There was no method for reaching that split, and no home for the result — so the next arrival of similar advice would restart from impressions.

**Decision**
Chosen: grade each claim discretely with one of four verdicts — **adopt**, **already adopted**, **reject**, **unverified** — and require a *named ADR or a run command* behind every reject. Impressions are not verdicts. The corpus measurement (density, emphasis, arrival rate) runs BEFORE grading, because the decisive rebuttals were numbers: `skills/` growing +418 net lines in 7 days (2.6:1 add/remove) is what turns "cut 80% of the rules" from advice into a treadmill.

**Rejected**
- Adopting the headline claim wholesale. Why not: D23→D50 already ran exactly that experiment — two skills hand-condensed on 2026-07-12 were *denser than their pre-fix state* by 2026-07-26. The article describes a centrally-controlled, rarely-edited system prompt; this plugin is an incident-driven accumulator at ~22 skill-fixing commits a week. **Same goal, different system dynamics, different lever** — act on arrival rate, not stock.
- Dismissing the article because its headline was wrong here. Why not: its progressive-disclosure and emphasis arguments were right and unfinished (only 9 of 24 skills had a `references/` dir; `⚠️` ran 1-per-4-lines in the global CLAUDE.md). A wrong headline does not make a source worthless, and the per-claim split is what separates the two.
- Trusting the article's "eliminate repetition" claim from a raw count. Why not: `❌/✅` tables appeared in 13 files, which reads as damning until you open three and find the *content* distinct per skill. It was a shared **format**, not a duplicated rule. A count is a hypothesis about duplication; reading is the test.

**Consequences**
- Verdicts on the 9 claims: **adopt** progressive disclosure + skills-as-lightweight-guides; **already adopted** judgment-over-prescription (scope later refined by D63, not D33 — D33 is the unrelated `<thinking>`-scaffold retirement, a mis-citation fixed 2026-07-31), CLAUDE.md-as-navigable-tree, comment rules (harness-level), tool-examples (measured: only 2 `Agent()` + 2 `Skill()` corpus-wide, nothing to cut); **reject** the 80% cut (D23→D50) · eliminate-repetition (measured distinct) · automatic memory (standing user decision, forbidden in global CLAUDE.md and plugin CLAUDE.md alike); **unverified→false** `claude doctor`.
- **Judgment-over-prescription's boundary, found by a live A/B test rather than reasoned**: correct for judgement-shaped content (a Sonnet agent scored 6/6 on reasoning questions from a prose-only excerpt), measurably wrong applied unconditionally to value-shaped content (the same agent's confidence dropped on a pure-lookup question prose had nowhere to carry a literal answer). `../doc-condensation/decisions/verification-rigor.md` D63.
- Shipped from the two adopted claims: `⚠️` 291 → 233 corpus-wide (global CLAUDE.md 53 → 12), three cold-path extractions, and Gate B (D54).
- **A rejected claim now costs one lookup instead of one re-evaluation.** The next "shouldn't we just cut the rules?" resolves to D23→D50 + the arrival-rate number.

**Status**: committed · **Reversible**: yes

### D56 — A Tool's Audit Report Is Graded Like Any Other Guidance; Re-Measure Its Numbers and Check Which Tree It Ran In — committed — 2026-07-27

**Problem**
An in-session `/doctor` run produced a 10-check health report — memory-file sizes, plugin/MCP usage counts, hooks, context weight, denied commands. Unlike prose advice it arrives already shaped as a to-do list, with a table column literally headed *Verdict* and one row marked **Remove**. Every flag it raised about live state — the global CLAUDE.md trim candidate, its growth rate, the `posthog-mcp` removal — was measured before the report reached this session. Acting on the list as given would have meant trimming a file already fixed and disabling a server used three days earlier.

**Decision**
Chosen: run a tool report through D55's four verdicts unchanged, with **two additions specific to generated reports**. (1) **Re-measure every number before acting** — a report is a snapshot of its run time, and a flag on a file fixed since does not merely soften, it inverts. (2) **Check the report's provenance tree before treating any path as actionable** — `/doctor` reports the project it ran in, and a path from elsewhere is not a finding here at all. Neither check is expensive; three flags were settled by four commands.

**Rejected**
- Acting on the `~/.claude/CLAUDE.md` trim flag. Why not: measured live at **12** `⚠️` rules against the report's 52 (D54's emphasis pass took it 53→12), and the 7-day arrival rate is **added 241 / removed 267 / net −26 — 0.90:1**, already below the 1:1 that Gate B exists to reach. The file is shrinking; the report described it growing.
- Acting on the `posthog-mcp` **Remove** row (its one row marked actionable). Why not: measured **51 calls in 30 days, last used 2026-07-24** against the report's "0 calls, last 18 Jul". This is the flag that proves the rule — the other two only wasted effort, while this one would have disabled a live server. A tool report's *most* actionable-looking row earns the most re-measurement, not the least.
- Dismissing the report because its flags were stale. Why not: same reasoning as D55's second Rejected. Checks 0/2/5/7/9 came back clean at no cost, and the run itself closed this doc's own open unverified item on `/doctor`.
- Treating `/doctor` as the `claude doctor` CLI already graded false. Why not: they are different tools sharing a name. The CLI reports installation health only; the slash command runs the 10-check audit. The prior verdict stands for the CLI it named — see Bugs Fixed.

**Consequences**
- `/doctor` is characterised rather than unverified: a real audit, whose *findings still need local re-measurement* before they are verdicts.
- A cross-project report's PATH rows are scoped on sight — `frontend/CLAUDE.md`, `backend/CLAUDE.md` name a tree that is not this one. **But scope is not the same test as staleness**: `posthog-mcp` reads as another project's row and is in fact a user-scope server live in every project, so provenance dismissed it for the wrong reason and re-measurement is what actually settled it. Run both checks; neither substitutes.
- **The trim flag now costs one lookup instead of one re-measurement**, the same payoff D55 claims for the 80%-cut claim.
- **3 of 3 flags naming live state failed re-measurement** — a report's numbers age faster than its structure. The audit's *shape* stayed useful; every *figure* in it needed re-running.

**Status**: committed · **Reversible**: yes

### D59 — Point the Method Inward: the Corpus Is Graded Like Any Other Source, and an Agent's Finding Is a Hypothesis Until Its Cited Lines Are Re-Read — committed — 2026-07-27

**Problem**
Nothing could grade the whole skill corpus. `update-plugin` Step 3a grades ONE file when a session touches it; `/done` Gate B measures only the files that session edited. Both are per-file by construction, so corpus-wide drift is invisible to them — and a request to "audit all our skills" had no method behind it, only impressions. Measured before grading: 24 skills, emphasis 235 corpus-wide, 10 of 24 with a `references/` dir, and a 7-day arrival of **added 833 / removed 346 / net +487 — 2.41:1 across 22 commits**, worse than the +418 that made D50 reject re-condensing.

**Decision**
Chosen: a discovery-only skill, `skills/audit-instructions/SKILL.md`, mirroring `sweep-doc-overlaps` — measure first, fan out graders **partitioned by file**, verify findings inline, hand flagged files to `update-plugin` Step 3a. It **carries no threshold**: the B/L gate, the density checklist and the replace/route/declare rule stay with Step 3a, cited not restated. Its one new measurement is the **fleet arrival ratio**, which is genuinely absent elsewhere rather than a second copy of an existing gate. Result: 14 of 24 skills graded clean.

**Rejected**
- Extracting `done`'s mode-selection and `merge-task-docs` Step 4.8. Why not: both are read on every invocation — hot path, so extraction is D50's treadmill wearing a progressive-disclosure label.
- Extracting `read-summary`'s 3-line Agent example. Why not: saves 3 lines and costs a lookup in the highest-B/L file; D50 predicts irreducible, not under-cut.
- Consolidating `agent-setup`'s three two-repo warnings. Why not: re-reading showed a routing-table cell, a banner instruction and a distinct hardcoded-absolute-path trap — three rules, not three copies. Consolidating would have deleted one.
- Extracting `md-to-pdf`'s Prerequisites. Why not: 8 lines resolving to "runs via npx, nothing to install", in the corpus's lowest-density file. Pure churn.
- Partitioning graders by AXIS rather than by file. Why not: no agent would hold a whole file, so any finding living between two axes in one skill is structurally invisible.

**Consequences**
- **Three agent findings were disproved by re-reading their cited lines** — a claimed absence of inbound pointers to `_shared/references/` (all 8 have 2-5; the grep's own filter excluded them, caught by a must-hit control), a claimed duplication of `writing-style.md` (the file already points at it and its rows are distinct — one genuinely duplicated row, deleted), and a claimed empty heading (the grep could not see fenced code blocks). Line numbers were right in all three; the claims were not. Disproved findings are now recorded rather than dropped, because the next run re-derives them otherwise.
- **The graders missed the run's only correctness defect**: `gchat-format`'s worked example contradicted the skill's own regroup-by-feature rule by preserving `Added`/`Changed` in its output. Extraction became a fix, not a density move — `references/example-release-note.md` now demonstrates the mandated shape.
- **Emphasis rose 235 → 240**: the new skill added 6 markers against 1 removed. The audit's own arrival-rate criticism applies to the audit, and stating that is the D54 accounting, not a failure to hide.
- `done`'s Gate B lost its point-in-time figure (+418 net, 677/259) for the durable pattern plus a pointer to `audit-instructions` — a stale number inside a gate's own justification is D56's trap in-house.
- **Extended the same session to the CLAUDE.md family, and the skill was renamed `audit-skills` → `audit-instructions`** per the scope-outgrows-name rule. Measured: the global `~/.claude/CLAUDE.md` grew **16.8KB → 40.1KB in 30 days at a 1.34:1 arrival ratio** — a *better* ratio than `skills/`' 2.41:1 while auto-loading on every turn of every project, which makes it the highest-leverage hot path in the setup and the one nothing watched. **A healthy ratio and a doubling file are compatible; report the trajectory beside the ratio or the number reassures.**
- **CLAUDE.md gets three axes, not four — density is deliberately excluded.** The artifact reached D50's conclusion independently: its own maintenance note reads *"re-bloats by ARRIVAL RATE, not density — repeated condenses cannot hold it."* It also records a retirement pass run 2026-07-26 returning **0 of ~7 candidates dead**, so retirement is reported as candidates-with-a-settling-command, never as confirmed. Progressive disclosure becomes **hot-vs-cold routing**: the `📖` companion mechanism already exists, so the question is placement, not extraction.
- **The extension pushed the skill to 95.0 B/L, over the ~90 gate — accepted as declared growth.** No superseded rule existed to retire and the new axes are read on exactly the invocations that grade CLAUDE.md, so neither replace nor route applied. Stating it is the D54 accounting; shaving prose to sneak under the line would have been gaming the measurement.
- **The `/done` reviews then found three defects in what this decision shipped, all fixed.** (1) The CLAUDE.md command block ran a 30-day window while the prose beside it quoted the 7-day ratio, so a session following the file would report a figure its own command never produced — both windows now run and **every ratio carries its window label**, because the two disagree (1.34:1 at 7d, 1.46:1 at 30d) and an unlabelled one is unreproducible. (2) The `condense-claude-md` routing row was unreachable: no grading pass emits an "over budget" verdict when density is not an axis. Rescoped to fire only when the trajectory crosses a budget the file **declares for itself**.
- **A skill routing to N owners needs a receiving branch in all N — wiring one hides the gap.** `update-plugin` was retrofitted to accept a graded handoff for the skills side; `update-claude-docs` was not, so a flagged CLAUDE.md would arrive with its verdict already decided, find a step that scans the session for a signal, and die silently as "no signal, nothing to capture." The wired path demonstrably worked, which is exactly what made the unwired sibling look wired. Fixed with a **Graded-handoff mode** keyed on the axis handed over; the general rule went to the plugin CLAUDE.md review checklist.

**Status**: committed · **Reversible**: yes

