<!--LLM-CONTEXT
Status: ✅ Method proven on 6 sources — the Claude-5 article (2 of 9 claims adopted), a `/doctor` report (0 of 3 live-state flags survived re-measurement), the plugin's own corpus (14 of 24 skills clean; 3 agent findings disproved), a consumer's run that graded the grader (D59/D61), the official `frontend-design` plugin (first source that was a usable artifact, graded per-capability into depend/adapt/build), and on 2026-08-20 Anthropic's live reference docs for CLAUDE.md, skills and subagents — the first source whose claims are MECHANISM rather than advice, so 10 of 12 local statements were wrong or silent and none could be rejected on local evidence
Domain: plugin-maintenance/external-guidance
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../doc-condensation/current.md (owns D54 and every skill-density decision this evaluation fed, plus D63 — the later-found scope boundary on the judgment-over-prescription claim)
  - ../agent-architecture/current.md (sibling feature — agent delegation + verification rigor)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
  - ../output-style-hook/current.md (sibling feature — the ayghri/i-have-adhd source: findings adopted, structure rejected)
Last updated: 2026-08-20 — source #6, Anthropic's live docs: a mechanism source expires silently rather than being refuted, so every fact it settles carries the page and the date it was read
-->

# Plugin Maintenance — Evaluating External Guidance

## Quick Start (read this first in next session)

**Where we are**: The method for judging outside guidance — a vendor article, a blog post, a tool's audit report, a vendor's own reference docs — against this plugin's measured evidence, plus the record of six evaluations. The answer is never "adopt" or "ignore"; it is a per-claim verdict with the measurement that decided it. Where the source is a usable artifact rather than advice, the verdict carries a build decision (depend / adapt / build) that can differ per capability.

Source #6 (2026-08-20) was the first of a different kind: Anthropic's live reference docs for CLAUDE.md, skills and subagents. **A mechanism source cannot be rejected on local evidence** — when the harness changes, a correct rule becomes wrong with no edit, no diff and no failing check. 10 of 12 local statements were wrong or silent; two came back already-correct and are the control proving the pass wasn't confirmation-shaped.

**Immediate next actions (in order)**:
1. Grade the consumer's 22 findings against local ADRs before acting; they were produced against a different machine's setup. See `## Next Steps`.
2. Reply to the consumer on their sequencing question (companion dirs first).
3. Re-read source #6's facts against the live pages before relying on them in a future session — each carries its page and the date it was read, because that is the only thing that ages.

**Gotchas that will trip you**:
- **Generic advice describes a different SYSTEM, not just a different opinion** — match the advice's assumed dynamics against yours before weighing its merits, see D55
- **A vendor's claim about its own tooling still needs running, and two tools can share a name** — `claude doctor` (CLI) ≠ `/doctor` (in-session); one is installation health, the other a 10-check audit, see the Bugs Fixed row
- **A report's numbers are a snapshot of when it ran — re-measure before acting; 3 of 3 live-state flags failed** — the one marked **Remove** would have disabled a server used 3 days earlier, see D56
- **A report generated in ANOTHER project names paths that do not exist here — but provenance is not staleness** — a user-scope MCP server reads as another project's row while being live in every project; run both checks, see D56
- **A raw duplication count is not duplication** — 13 files shared a table *format*, not a rule; opening three settled it, see D55
- **An agent's finding is a hypothesis whose line numbers are usually right even when the claim is wrong** — that is what makes it convincing; 3 of this corpus's findings died on re-reading the cited lines, see D59
- **A "cold path to extract" that every invocation reads is hot path** — the commonest way a density pass becomes D50's treadmill, see D59
- **A mechanism fact expires silently; it is never refuted** — advice graded in July stays graded, a harness fact read in August can be false by October with nothing to signal it, so each one carries its source page and read date (D-source-6-harness-drift)
- **A pointer defers a rule and never delivers one — there is no loader** — a `📖` is a suggestion the reading model may decline, so extraction trades certainty for probability; name the trigger and use `${CLAUDE_SKILL_DIR}` for an absolute path (D-pointers-are-suggestions)
- **What falls past a skill's 5,000-token cut matters more than how far over it is** — reordering is strictly better than extraction, since content moved above the boundary is certain to survive (D-reorder-beats-extract)
- **A check that can never pass is as broken as one that can never fail, and reads as a crisis** — 38 of 127 pointers reported broken when two were; the failure rate itself was the tell (D-agent-broke-its-own-pointer-check)
- **The plugin's own ADRs outrank an external claim when they disagree, because they were measured here** — D23→D50 already ran the article's headline experiment, see ../doc-condensation/current.md
- **A source that is a working artifact gets a build decision per capability, not one verdict** — depend / adapt / build can all be right for different parts of the same plugin, see D-fork-the-gap-not-the-source
- **An official plugin's DEFAULT can be inverted for your use even when its content is good** — greenfield "invent a palette" applied to an existing app produces the inconsistency it exists to prevent; a wrapper inherits that no matter how the trigger is worded
- **A growth ranking counts a file created in the window as having grown by its whole length** — the top-ranked entry is then an artifact that hides the real grower, see D61
- **An instruction naming a path under `tasks/` is unfollowable off this checkout — `tasks/` is not shipped and installs are version-scoped** — there is no absolute path that fixes it, see D61

**Success looks like**: every claim in a piece of guidance carries a verdict (adopt / already adopted / reject / unverified) and the command or ADR that decided it — no claim left as an impression.

---

## Overview

External guidance arrives regularly — a vendor article, a framework blog, a colleague's "you should be doing X." It is usually right *somewhere* and wrong *here*, and the failure mode is treating it as either gospel or noise. This feature holds the method for grading it claim-by-claim against local evidence, plus the record of each evaluation.

Sources graded so far. On 2026-07-27: Anthropic's *"The new rules of context engineering for Claude 5 generation models"* (D55), an in-session `/doctor` health report run in a different project (D56), and the plugin's own 24-skill corpus (D59) — the first time the method was pointed inward rather than at an outside source. Then a real consumer's audit run (D61), and on 2026-08-11 the official `frontend-design` plugin (D-fork-the-gap-not-the-source) — the first source that was a working artifact you could depend on rather than advice to weigh, which is what made the verdict a build decision.

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
| `tasks/plugin-maintenance/doc-condensation/decisions/structural-mechanics.md` | D54 — where this evaluation's outcome landed; its Rejected block holds the article verdict |
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

The decisions this feature has produced live in two theme files, split by whether they govern *reaching* a verdict or *acting* on one:

| File | Owns |
|------|------|
| `decisions/grading-method.md` | **D55** the four verdicts + measure-before-judging · **D56** grading a generated tool report (re-measure, check provenance) · **D59** pointing the method inward at the plugin's own corpus |
| `decisions/applying-verdicts.md` | **D-fork-the-gap-not-the-source** per-capability build decisions for a source that is a working artifact · **D-verdict-records-lever** a rejection records the lever, not the outcome · **D61** a consumer's run grading the grader · **D-source-6-harness-drift** grading a mechanism source, and why it expires rather than being refuted · **D-pointers-are-suggestions** progressive disclosure has no loader · **D-reorder-beats-extract** where a cut falls beats how far over · **D-ceiling-cleared** the 32-skill result · **D-agent-broke-its-own-pointer-check** a control that cannot pass · **D-paths-glob-readopted-from-the-docs-that-were-already-rejected** a claim graded three times in one day · **D-a-model-that-declines-a-rule-reports-it-as-absent** why self-report cannot measure what loaded · **D-house-style-applies-everywhere** enforcement is unconditional, and the superseded ownership branch that preceded it |

Read `grading-method.md` before grading a new source; read `applying-verdicts.md` before writing a verdict into any skill, because that is where a compressed restatement inverts it.

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

## Last Session (2026-08-20)

- **Source #6 — Anthropic's live reference docs, the first source whose claims are MECHANISM rather than advice.** Guidance can be rejected on local evidence; a mechanism fact cannot, because when the harness changes a correct rule becomes wrong with no edit and no failing check. 10 of 12 local statements were wrong or silent. Two came back already-correct and are the control that the pass wasn't confirmation-shaped — both from `structure.md`, the file maintained most carefully.
- **The corrected claims were right in conclusion and false in reason**, the shape that breaks later: `allowed-tools` never restricted anything (it pre-approves), an agent's `tools:` genuinely does, and spawn depth is 3 rather than 5 — the last wrong in 26 places.
- **A limitation this repo had built around was fixed three days earlier and nothing watched for it.** `${CLAUDE_SKILL_DIR}` and `${CLAUDE_PLUGIN_ROOT}` do expand in skill markdown ([#9354](https://github.com/anthropics/claude-code/issues/9354) closed 2026-08-17), verified with a probe skill. Pointers went from 0 absolute paths to 14.
- **All 32 skills brought under the 5,000-token re-attach ceiling**, five of which were over. Set totals moved between +3% and −10%, so content relocated rather than vanished. One real loss surfaced and was restored: a stated limitation about `ListAgents`, cut because text saying what a tool *cannot* do reads as hedging.
- **Three agents and this session produced the same false pointer epidemic in one day** — 38 of 127 reported broken when two were, each testing a path that kept the `📖` or lost its `${CLAUDE_SKILL_DIR}` prefix. The reviewers still found four real defects the session missed, including a safety guard (the destructive-verb ban) left with no inline trace.


## Next Steps

**Applying the method**
- [x] ~~Reuse D55's four-verdict table on the next piece of guidance~~ — done 2026-08-09, and the failure mode was arriving at the source without checking whether it had already been graded. See D-verdict-records-lever.
- [x] ~~The method has no trigger~~ — closed 2026-08-20. `update-claude-docs` Step 1 and `unhobble-instructions`' document-read both now say to search the project's decision records before adopting an outside source, phrased conditionally at the point the adoption decision is made.
- [x] ~~Re-run the fleet audit now that Step 1 disqualifies in-window creations~~ — moot: `audit-instructions` was removed 2026-08-01 (user decision). Its fixes (the disqualify-in-window-creations guard, the CWD-not-`-C` ownership probe) stay correct and worth reusing if the fleet-audit capability is ever reimplemented.

**Doc health**
- [x] ~~Split this doc before grading source #6~~ — done 2026-08-20, ahead of grading it. `current.md` is now an index (174L) over `decisions/grading-method.md` (91L) and `decisions/applying-verdicts.md` (286L); the set total rose, confirming redistribution rather than deletion. **`applying-verdicts.md` is now the file to watch** — six decisions landed in one session and it sits near the 300-line budget.

**From the consumer's report (source #4)**
- [ ] Grade their 22 adopt findings against local ADRs before acting on any — they arrive as verdicts but were produced against a different machine's setup (their global CLAUDE.md reads 305L/40.7KB vs 219L here).
- [ ] Their sequencing call — build companion dirs first, as the prerequisite unblocking 5 of 6 routing verdicts — is sound and unanswered. Reply to them.

**Deferred / accepted**
- [ ] `/doctor`'s "can also fix issues" half is still untested — this run was read-only and nothing was applied from it. Accepted: it is user-run, and no verdict here depends on its fix mode.
- [ ] `audit-instructions` has no proactive trigger — its description keys entirely on explicit user phrasing, so the fleet arrival ratio it owns is measured only when someone thinks to ask. `claude-md-pruner` by contrast fires on file growth. Accepted for now: a proactive trigger belongs in `/done`'s Gate B or a periodic check, and neither has a natural home yet.
