<!--LLM-CONTEXT
Status: ✅ Method proven on 4 sources — Claude-5 article (2 of 9 claims adopted), a `/doctor` health report (0 of 3 live-state flags survived re-measurement), the plugin's own skill corpus (14 of 24 skills clean; 3 agent findings disproved), and a real consumer's run that graded the grader (2 defects in the now-removed `audit-instructions` skill, D59/D61 — removed 2026-08-01, user decision not a defect)
Domain: plugin-maintenance/external-guidance
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../doc-condensation/current.md (owns D54 and every skill-density decision this evaluation fed, plus D63 — the later-found scope boundary on the judgment-over-prescription claim)
  - ../agent-architecture/current.md (sibling feature — agent delegation + verification rigor)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
Last updated: 2026-08-01 — `audit-instructions` removal (separate user decision) reconciled across every live-read field; the D33→D63 mis-citation fix from 2026-07-31 stands unchanged
-->

# Plugin Maintenance — Evaluating External Guidance

## Quick Start (read this first in next session)

**Where we are**: The method for judging outside best-practice advice (a vendor article, a blog post, a tool's own audit report) against this plugin's own measured evidence — and the record of four evaluations run so far. The answer is never "adopt" or "ignore"; it is a per-claim verdict with the measurement that decided it. The method ran INWARD too, via `skills/audit-instructions` (D59/D61) — that skill was removed 2026-08-01, a user decision unrelated to the method's validity, not a defect; the fleet-audit capability could be reimplemented later if wanted. Source #4 was a real consumer's run of that (now-removed) skill, which found two defects in it — the fixes (D61) outlived the skill itself and remain correct for any future re-implementation.

**Immediate next actions (in order)**:
1. Grade the consumer's 22 findings against local ADRs before acting; they were produced against a different machine's setup. See `## Next Steps`.
2. Reply to the consumer on their sequencing question (companion dirs first).

**Gotchas that will trip you**:
- **Generic advice describes a different SYSTEM, not just a different opinion** — match the advice's assumed dynamics against yours before weighing its merits, see D55
- **A vendor's claim about its own tooling still needs running, and two tools can share a name** — `claude doctor` (CLI) ≠ `/doctor` (in-session); one is installation health, the other a 10-check audit, see the Bugs Fixed row
- **A report's numbers are a snapshot of when it ran — re-measure before acting; 3 of 3 live-state flags failed** — the one marked **Remove** would have disabled a server used 3 days earlier, see D56
- **A report generated in ANOTHER project names paths that do not exist here — but provenance is not staleness** — a user-scope MCP server reads as another project's row while being live in every project; run both checks, see D56
- **A raw duplication count is not duplication** — 13 files shared a table *format*, not a rule; opening three settled it, see D55
- **An agent's finding is a hypothesis whose line numbers are usually right even when the claim is wrong** — that is what makes it convincing; 3 of this corpus's findings died on re-reading the cited lines, see D59
- **A "cold path to extract" that every invocation reads is hot path** — the commonest way a density pass becomes D50's treadmill, see D59
- **The plugin's own ADRs outrank an external claim when they disagree, because they were measured here** — D23→D50 already ran the article's headline experiment, see ../doc-condensation/current.md
- **A growth ranking counts a file created in the window as having grown by its whole length** — the top-ranked entry is then an artifact that hides the real grower, see D61
- **An instruction naming a path under `tasks/` is unfollowable off this checkout — `tasks/` is not shipped and installs are version-scoped** — there is no absolute path that fixes it, see D61

**Success looks like**: every claim in a piece of guidance carries a verdict (adopt / already adopted / reject / unverified) and the command or ADR that decided it — no claim left as an impression.

---

## Overview

External guidance arrives regularly — a vendor article, a framework blog, a colleague's "you should be doing X." It is usually right *somewhere* and wrong *here*, and the failure mode is treating it as either gospel or noise. This feature holds the method for grading it claim-by-claim against local evidence, plus the record of each evaluation.

Sources graded so far, all 2026-07-27: Anthropic's *"The new rules of context engineering for Claude 5 generation models"* (D55), an in-session `/doctor` health report run in a different project (D56), and the plugin's own 24-skill corpus (D59) — the first time the method was pointed inward rather than at an outside source.

---

## Architecture / Data Model

The method is four steps, in order. Steps 1-2 are cheap; step 3 is what makes the verdict defensible.

1. **Enumerate the claims discretely.** A 9-claim article gets 9 verdicts. Prose summaries hide the claims that are already adopted and the ones that are false.
2. **Measure the corpus before judging.** Per-artifact size, density, and arrival rate — never impressions:
   ```bash
   # per-file density (bytes/line), the hot-path signal
   for f in skills/*/SKILL.md; do echo "$(echo "scale=1;$(wc -c<$f)/$(wc -l<$f)"|bc) $f"; done | sort -rn
   # emphasis dilution
   grep -rc '⚠️' --include='*.md' skills/ .claude/agents/ CLAUDE.md | awk -F: '{s+=$2} END {print s}'
   # arrival rate — the number that decides density-vs-rate arguments
   git log --since="7 days ago" --numstat --format='' -- 'skills/**/*.md' \
     | grep -E '^[0-9]+\s+[0-9]+' | awk '{a+=$1; d+=$2} END {printf "added %d removed %d net %+d\n", a, d, a-d}'
   ```
   ⚠️ Ranking files by that net figure needs the disqualify-in-window-creations step D61 added (`audit-instructions` Step 1, before that skill's 2026-08-01 removal) — a new file's whole length otherwise counts as growth and ranks it first. Any future re-run of this measurement needs the same guard reimplemented.
3. **Grade each claim against a local ADR or a command — not against plausibility.** Four verdicts: **adopt**, **already adopted**, **reject** (name the ADR or decision that refutes it), **unverified** (the claim is about a tool; run it).
4. **Record the verdicts.** A rejected claim returns in six months wearing new words; the verdict table is what stops it being re-litigated from scratch.

---

## Files

| File | Role |
|------|------|
| `tasks/plugin-maintenance/doc-condensation/decisions/structural-splits.md` | D54 — where this evaluation's outcome landed; its Rejected block holds the article verdict |
| `skills/update-plugin/SKILL.md` | Step 3a — owns the B/L gate and the `references/` scope rule the evaluation settled |
| `skills/done/SKILL.md` | Step 5 — Gate B, the arrival-rate checkpoint the evaluation motivated |
| `skills/audit-instructions/SKILL.md` (removed 2026-08-01) | Had pointed the method inward — fleet grading of BOTH instruction families; owned the FLEET arrival ratio and trajectory (D59). Removal was a user decision, not a defect; D59/D61's fixes remain correct for any future re-implementation |
| `CHANGELOG.md` | v1.131.0 — the per-claim verdicts as shipped, both sources (D55's 9 article claims, D56's report flags) |

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Evaluate Anthropic's Claude-5 context-engineering article (9 claims → verdicts) | ✅ |
| 2 | Corpus measurement method (density · emphasis · arrival rate) | ✅ |
| 3 | Act on adopted claims — progressive disclosure + emphasis discipline | ✅ shipped as D54 |
| 4 | Apply the method to a second piece of guidance — a `/doctor` health report | ✅ D56 |
| 5 | Characterise the in-session `/doctor` (was accepted as unverified) | ✅ 10-check audit, distinct from the CLI — read-only half only |
| 6 | Point the method inward — grade the plugin's own 24-skill corpus | ✅ D59 |
| 7 | Make the audit re-runnable instead of a one-off | ✅ shipped as `skills/audit-instructions/SKILL.md`, then removed 2026-08-01 (user decision, not a defect) |

---

## Key Technical Decisions

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
- **Judgment-over-prescription's boundary, found by a live A/B test rather than reasoned**: correct for judgement-shaped content (a Sonnet agent scored 6/6 on reasoning questions from a prose-only excerpt), measurably wrong applied unconditionally to value-shaped content (the same agent's confidence dropped on a pure-lookup question prose had nowhere to carry a literal answer). `../doc-condensation/decisions/structural-splits.md` D63.
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

---

### D61 — A consumer's audit run graded the skill: two defects, and the recording step was unreachable by construction

**Problem**: A real consumer (marketplace install, not this checkout) ran `audit-instructions` and returned a complete 25-skill report — then stopped at Step 5 to ask where to record verdicts, because it named `tasks/plugin-maintenance/external-guidance/current.md` relatively. Their report also carried an undetected measurement artifact.

**Decision**: Fix both, and take the destination out of the skill entirely. Step 5 hands verdicts to `update-plugin`, which owns the ownership gate; Step 1 disqualifies files created inside the measurement window.

**Rejected**
- Naming an absolute install path. Why not: **measured — there is none that works.** `tasks/` is not shipped to installs at all, and installs are version-scoped (`plugins/cache/<marketplace>/<plugin>/<version>/`), so any literal path is stale on the user's next update. `${CLAUDE_PLUGIN_ROOT}` does not expand in markdown ([#9354](https://github.com/anthropics/claude-code/issues/9354)), `~` does not resolve on native Windows, and a `~/.claude` shared with WSL stores paths broken on the other side ([#36575](https://github.com/anthropics/claude-code/issues/36575)).
- Giving `audit-instructions` its own OWNER/CONSUMER probe. Why not: a second gate is a second failure mode, and `update-plugin` already owns one; three independent research passes agreed on delegating over branching.
- Recording a consumer's verdicts into their own project's `tasks/`. Why not: that tree is the user's work, and the verdicts grade *this* plugin.

**Consequences**
- **A newly-created file reported its whole length as growth, and the artifact ranked #1.** `audit-instructions` (168 lines, created the day before) reported itself as the fleet's top grower at +168L, masking the real one (`done`, +43L). Step 1 now disqualifies in-window creations via `git log --diff-filter=A`; a file with no baseline has no arrival reading. The consumer routed the artifact into `update-plugin`'s queue, where it would have driven a density pass on a one-day-old file.
- **`%+d` broke the ranking it fed.** A leading `+` defeats `sort -rn`, so the per-file list ordered `+9, +8, +43`. Bare `%d` restored it — the ranking is the command's only purpose, so a cosmetic format string was the whole defect.
- **The ownership probe was right by luck.** `git -C <plugin-dir>` **walks up** to the enclosing `~/.claude` dotfiles repo and resolves *its* remote (`my-claude-settings.git`); the grep missed, yielding `CONSUMER` for the wrong reason, and would invert for anyone who forked that settings repo. Rewritten to ask the CWD (`git rev-parse --show-toplevel`) — verified OWNER from the checkout, CONSUMER from a non-git dir and from `~/.claude` itself.
- **The receiving branch was unreachable, and both `/done` reviewers caught it independently.** `update-plugin` Step 1's arrival-rate branch skips Steps 1-2 whenever a handoff carries *any* arrival-rate file — and since arrival rate is measured every run, that is nearly every handoff, so the new row recording verdicts was dead on the common path. Narrowed to *solely* arrival-rate, with an explicit mixed-handoff rule. Same shape as D59's own N-owners defect, one layer down.
- **The consumer upstream flow was singular-defect shaped.** Its template titles one skill and one defect; the real payload was 22 findings across 25 files. A fleet audit now files as ONE issue with the table as body — splitting it buries the corpus-wide signal a sweep exists to produce, under the user's own name.
- **Scope came in narrower than approved, on evidence.** A full sweep found 7 further sites; 7 were correct as written — the 6 `.claude/agents/*.md` hits have templates that are already generic, so the hardcoded domain belongs in this repo's own copies, and `task-summary/references/templates.md` cites the path as split history, not as a path to read.

**Status**: committed · **Reversible**: yes

---

## Critical Gotchas

### Grading a claim

| Symptom | Cause | Fix |
|---------|-------|-----|
| Advice sounds obviously right and contradicts a local ADR | The advice assumes different system dynamics (edit frequency, who controls the artifact, what an arriving rule costs) | Name the assumed dynamics and compare to yours before weighing merits. A centrally-controlled prompt edited quarterly ≠ an incident-driven accumulator at 22 commits/week |
| A duplication count looks damning (`N files share this shape`) | A shared *format* counts identically to a duplicated *rule* | Open three of the N. Distinct content = not duplication, no cut available |
| A verdict has no command or ADR behind it | It is an impression wearing a verdict's clothes | Downgrade to "unverified" and go run the thing, or cite the ADR |
| A tool's report lists a finding as already-decided (a `Verdict` column, a **Remove** row) | Generated output arrives shaped as a to-do list, which reads as more settled than prose making the same claim | Grade it with the same four verdicts anyway. The formatting is not evidence |
| A report's flag contradicts a fix you know shipped | Its numbers are a snapshot of run time; a flag on a since-fixed file inverts rather than softens | Re-measure before acting. A stale metric arrives looking rigorous, which is worse than none |
| A report names paths that return nothing | It ran in a different project — `/doctor` audits the tree it was invoked in | Check provenance before treating any named path as actionable |
| A grading agent's finding cites a line number and reads as settled | Its line numbers are usually right even when its claim is wrong — that is what makes it convincing | Re-read the cited lines yourself before acting. Record disproved findings; a wrong finding costs more than a missing one |
| An agent proposes extracting a "cold path" to `references/` | A section read on every invocation (mode selection, a routing table) is hot path | Ask which invocations skip it. If none, extraction is D50's treadmill |
| A report's row looks like another project's, so you dismiss it | Provenance and staleness are different tests — an MCP server configured at **user scope** (`~/.claude.json` `.mcpServers`) is live in every project, and a missing `.mcp.json` proves nothing | Enumerate every config scope, then re-measure. Being right for the wrong reason teaches the wrong rule |
| A measurement's top-ranked file is one created inside the window | Its whole length counts as "added", so a brand-new file outranks every real grower and crowds out the signal | Disqualify in-window creations (`git log --diff-filter=A`) before ranking. **Tell: the reported growth equals the file's total length** — D61 |
| An instruction names a path under `tasks/` that resolves on this checkout | `tasks/` is not shipped to installs, and installs are version-scoped — no literal path reaches it, so the step is unfollowable exactly where it was written for | State the step as source-checkout-only, or route the write through the skill owning the ownership gate — D61 |

### Measuring before judging

Step 2's corpus measurement is where a verdict is won or lost, and its traps (a ratio that *rises* after a successful extraction · a stale size projection · line count reading healthy on long table rows) are owned by `../doc-condensation/current.md` — D50 and D54. Read them there before running the commands above; they are density decisions this doc consumes, not grading decisions it owns.

---

## Bugs Fixed

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| Article credits `claude doctor` with rightsizing skills/CLAUDE.md "matching the 80% reduction" | The installed v2.1.220 CLI reports **installation health only** — version, platform, install method, search binary, auto-update status. No skill inspection, no CLAUDE.md analysis | Ran it before relying on it. Nothing in the plan was allowed to depend on it. A vendor's claim about its own tooling is still a claim |
| This doc's own prior wording read as "doctor does nothing," which would have discouraged running the useful one | **Two different tools share the name.** `claude doctor` (CLI) is the installation check above; in-session **`/doctor` is a 10-check audit** — memory files, plugins, MCP usage, hooks, context weight, version, denied commands | Distinguish them wherever either is named. `/doctor` is worth running; its *findings* still need local re-measurement before they count as verdicts — D56 |

---

## Last Session (2026-08-01)

- **`skills/audit-instructions/SKILL.md` was removed this session (a separate, unrelated user decision) — reconciled every live-read reference in this doc** (LLM-CONTEXT Status, Quick Start, `## Files`, a Task Status row, two Next Steps items) to state the removal instead of describing a skill that no longer exists. D59/D61's historical ADR blocks were left untouched — they record decisions made when the skill existed and stay accurate as history; only the fields a fresh session reads as *current* state needed the fix.
- A `/done` product-reviewer agent caught the gap: this doc's own `audit-instructions` scan diff (2026-08-01) was scoped to a single D33→D63 citation fix and never touched the now-stale live-read fields.

---

## Next Steps

**Applying the method**
- [ ] Reuse D55's four-verdict table + D56's two report-specific checks on the next piece of guidance rather than judging by impression. No specific source queued.
- [x] ~~Re-run the fleet audit now that Step 1 disqualifies in-window creations~~ — moot: `audit-instructions` was removed 2026-08-01 (user decision). Its fixes (the disqualify-in-window-creations guard, the CWD-not-`-C` ownership probe) stay correct and worth reusing if the fleet-audit capability is ever reimplemented.

**From the consumer's report (source #4)**
- [ ] Grade their 22 adopt findings against local ADRs before acting on any — they arrive as verdicts but were produced against a different machine's setup (their global CLAUDE.md reads 305L/40.7KB vs 219L here).
- [ ] Their sequencing call — build companion dirs first, as the prerequisite unblocking 5 of 6 routing verdicts — is sound and unanswered. Reply to them.

**Deferred / accepted**
- [ ] `/doctor`'s "can also fix issues" half is still untested — this run was read-only and nothing was applied from it. Accepted: it is user-run, and no verdict here depends on its fix mode.
- [ ] `audit-instructions` has no proactive trigger — its description keys entirely on explicit user phrasing, so the fleet arrival ratio it owns is measured only when someone thinks to ask. `claude-md-pruner` by contrast fires on file growth. Accepted for now: a proactive trigger belongs in `/done`'s Gate B or a periodic check, and neither has a natural home yet.
