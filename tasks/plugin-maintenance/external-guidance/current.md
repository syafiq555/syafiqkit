<!--LLM-CONTEXT
Status: ✅ Method proven on 2 sources — Claude-5 article (2 of 9 claims adopted) and a `/doctor` health report (0 of 3 live-state flags survived re-measurement)
Domain: plugin-maintenance/external-guidance
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../doc-condensation/current.md (owns D54 and every skill-density decision this evaluation fed)
  - ../agent-architecture/current.md (sibling feature — agent delegation + verification rigor)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
Last updated: 2026-07-27 — D56 added: graded a `/doctor` health report as source #2; all 3 of its live-state flags failed re-measurement (including its one **Remove** row), and `/doctor` vs `claude doctor` are now distinguished
-->

# Plugin Maintenance — Evaluating External Guidance

## Quick Start (read this first in next session)

**Where we are**: The method for judging outside best-practice advice (a vendor article, a blog post, a tool's own audit report) against this plugin's own measured evidence — and the record of two evaluations run so far. The answer is never "adopt" or "ignore"; it is a per-claim verdict with the measurement that decided it.

**Immediate next actions (in order)**:
1. Nothing pending. Re-open this doc when the next piece of external guidance arrives, and reuse the four-verdict table below rather than starting from impressions.
2. If re-running the corpus measurement, use the commands in `## Architecture` — they are the whole method.

**Gotchas that will trip you**:
- **Generic advice describes a different SYSTEM, not just a different opinion** — match the advice's assumed dynamics against yours before weighing its merits, see D55
- **A vendor's claim about its own tooling still needs running, and two tools can share a name** — `claude doctor` (CLI) ≠ `/doctor` (in-session); one is installation health, the other a 10-check audit, see the Bugs Fixed row
- **A report's numbers are a snapshot of when it ran — re-measure before acting; 3 of 3 live-state flags failed** — the one marked **Remove** would have disabled a server used 3 days earlier, see D56
- **A report generated in ANOTHER project names paths that do not exist here — but provenance is not staleness** — a user-scope MCP server reads as another project's row while being live in every project; run both checks, see D56
- **A raw duplication count is not duplication** — 13 files shared a table *format*, not a rule; opening three settled it, see D55
- **The plugin's own ADRs outrank an external claim when they disagree, because they were measured here** — D23→D50 already ran the article's headline experiment, see ../doc-condensation/current.md

**Success looks like**: every claim in a piece of guidance carries a verdict (adopt / already adopted / reject / unverified) and the command or ADR that decided it — no claim left as an impression.

---

## Overview

External guidance arrives regularly — a vendor article, a framework blog, a colleague's "you should be doing X." It is usually right *somewhere* and wrong *here*, and the failure mode is treating it as either gospel or noise. This feature holds the method for grading it claim-by-claim against local evidence, plus the record of each evaluation.

Sources graded so far, both 2026-07-27: Anthropic's *"The new rules of context engineering for Claude 5 generation models"* (D55) and an in-session `/doctor` health report run in a different project (D56).

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
3. **Grade each claim against a local ADR or a command — not against plausibility.** Four verdicts: **adopt**, **already adopted**, **reject** (name the ADR or decision that refutes it), **unverified** (the claim is about a tool; run it).
4. **Record the verdicts.** A rejected claim returns in six months wearing new words; the verdict table is what stops it being re-litigated from scratch.

---

## Files

| File | Role |
|------|------|
| `tasks/plugin-maintenance/doc-condensation/decisions/structural-splits.md` | D54 — where this evaluation's outcome landed; its Rejected block holds the article verdict |
| `skills/update-plugin/SKILL.md` | Step 3a — owns the B/L gate and the `references/` scope rule the evaluation settled |
| `skills/done/SKILL.md` | Step 5 — Gate B, the arrival-rate checkpoint the evaluation motivated |
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
- Verdicts on the 9 claims: **adopt** progressive disclosure + skills-as-lightweight-guides; **already adopted** judgment-over-prescription (D33), CLAUDE.md-as-navigable-tree, comment rules (harness-level), tool-examples (measured: only 2 `Agent()` + 2 `Skill()` corpus-wide, nothing to cut); **reject** the 80% cut (D23→D50) · eliminate-repetition (measured distinct) · automatic memory (standing user decision, forbidden in global CLAUDE.md and plugin CLAUDE.md alike); **unverified→false** `claude doctor`.
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
| A report's row looks like another project's, so you dismiss it | Provenance and staleness are different tests — an MCP server configured at **user scope** (`~/.claude.json` `.mcpServers`) is live in every project, and a missing `.mcp.json` proves nothing | Enumerate every config scope, then re-measure. Being right for the wrong reason teaches the wrong rule |

### Measuring before judging

Step 2's corpus measurement is where a verdict is won or lost, and its traps (a ratio that *rises* after a successful extraction · a stale size projection · line count reading healthy on long table rows) are owned by `../doc-condensation/current.md` — D50 and D54. Read them there before running the commands above; they are density decisions this doc consumes, not grading decisions it owns.

---

## Bugs Fixed

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| Article credits `claude doctor` with rightsizing skills/CLAUDE.md "matching the 80% reduction" | The installed v2.1.220 CLI reports **installation health only** — version, platform, install method, search binary, auto-update status. No skill inspection, no CLAUDE.md analysis | Ran it before relying on it. Nothing in the plan was allowed to depend on it. A vendor's claim about its own tooling is still a claim |
| This doc's own prior wording read as "doctor does nothing," which would have discouraged running the useful one | **Two different tools share the name.** `claude doctor` (CLI) is the installation check above; in-session **`/doctor` is a 10-check audit** — memory files, plugins, MCP usage, hooks, context weight, version, denied commands | Distinguish them wherever either is named. `/doctor` is worth running; its *findings* still need local re-measurement before they count as verdicts — D56 |

---

## Last Session (2026-07-27)

- Created this doc, recording **D55** — the method, which existed only in a CHANGELOG entry and D54's Rejected block, so the next session facing similar advice would have re-measured the whole corpus to answer it.
- **The method got its first re-use the same day** — a `/doctor` report run in another project graded as source #2 → **D56**. All 3 of its live-state flags failed re-measurement, including the one row it marked **Remove**: `posthog-mcp` has **51 calls in 30 days** against the report's 0.
- **That row also corrected D56 mid-session.** Dismissing it as another project's (no `.mcp.json` here) was right by luck — it is a **user-scope** server in `~/.claude.json`, live in every project. Provenance and staleness are separate checks; the ADR now says run both.
- **`/doctor` closed this doc's own unverified item**: a 10-check audit, *not* the installation-health CLI the Bugs Fixed row grades. Prior wording would have led a reader to skip the useful one.

---

## Next Steps

**Applying the method**
- [ ] Reuse D55's four-verdict table + D56's two report-specific checks on the next piece of guidance rather than judging by impression. No specific source queued.

**Deferred / accepted**
- [ ] `/doctor`'s "can also fix issues" half is still untested — this run was read-only and nothing was applied from it. Accepted: it is user-run, and no verdict here depends on its fix mode.
