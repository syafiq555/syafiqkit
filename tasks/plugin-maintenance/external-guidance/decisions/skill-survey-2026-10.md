<!--LLM-CONTEXT
Status: Source #10 graded 2026-10-08 — one live defect found and fixed (hook cap, see ../../output-style-hook/current.md); six borrowable ideas recorded, none planned yet
Domain: plugin-maintenance/external-guidance (whole-plugin comparables survey)
Gotchas (critical): research agents' figures were checked on the page; the ones marked unverified were not, and two agent figures did not survive the check
Related: `../current.md` (index), `applying-verdicts.md`, `reattach-ceiling.md`, `agent-and-edit-traps.md`, `house-style-ownership.md`, `grading-method.md`, `../../output-style-hook/current.md`
Last updated: 2026-10-08 — created
-->

# Evaluating External Guidance — Whole-Plugin Comparables Survey (source #10)

Five haiku research agents, one per skill cluster (task docs and memory · instruction authoring · delegation and review · git, ship and dev-ops · comms, design and doc output), each asked for public comparables, case studies with quoted figures, and a per-skill verdict. Prompted by a "what-would-jeff-dean-do plugin" question that found no such plugin (closest: `snailer-team/JeffDean-Mind`, a Korean system-design persona skill, and `areu01or00/perf-hints`, a Claude Code plugin on Dean and Ghemawat's *Performance Hints*). Neither fits syafiqkit: both are about runtime performance, and syafiqkit has no runtime.

## Key Technical Decisions {#decisions}

### D-survey-hook-cap — The SessionStart payload must stay under 10,000 characters ✅ adopted — 2026-10-08

**Problem**: An agent cited `code.claude.com/docs/en/hooks.md`: hook stdout is "capped at 10,000 characters"; anything longer is replaced by "the file path with a preview of up to the first 2,000 characters". `hooks/RULESET.md` was 13,240.
**Decision**: Verified on the page and live (this session's banner read "Output too large (12.9KB)… Preview (first 2KB)"). Cut the ruleset and gated it in `.githooks/pre-commit`. Owned by `../../output-style-hook/current.md`.
**Rejected**: Treating it as an agent-side claim to log for later. It was a mechanism fact about a shipped file, so it was checked the same turn.
**Consequences**: This is the second source where a harness fact silently invalidated a local file (after source #6, D-source-6-harness-drift). The same page also says injected text should be "factual statements rather than imperative system instructions"; not acted on.

### D-survey-verdicts — Per-claim verdicts from the survey 📋 recorded — 2026-10-08

**Verified on the page** (opened by the orchestrator, not just the agent):

| Claim | Source | Bears on |
|---|---|---|
| Context files "do not generally improve task success rates, while increasing inference cost by over 20%"; "repository overviews… are not helpful"; useful "for specifying non-standard coding practices" | arXiv 2602.11988 v3 abstract | `setup-project-docs` (ARCHITECTURE overviews), the capture filter in `update-claude-docs` (agrees with it) |
| "Context collapse": one iterative rewrite took a context from 18,282 tokens to 122, accuracy 66.7 → 57.1; recommends itemised delta updates | arXiv 2510.04618 (ACE) | `refresh-instructions`, `condense-*` whole-file passes |
| Feature list kept in JSON because the model is "less likely to inappropriately change or overwrite JSON files compared to Markdown files" | anthropic.com/engineering/effective-harnesses-for-long-running-agents | task-doc format choice (not adopted, recorded) |
| Multi-agent beat single-agent by "90.2% on our internal research eval"; token usage explains "80% of the variance" | anthropic.com/engineering/multi-agent-research-system | `haiku`; the post also says a subagent brief needs objective, output format, tool guidance and boundaries, which sits in tension with `haiku`'s "minimal prompt" |
| Stars on 2026-10-08: obra/superpowers 296,585; anthropics/skills 180,126; pbakaus/impeccable 78,470 | `gh api` | scale of the overlapping projects |

**Rejected or unverified**: the agents' AGENTS.md figures (−2%/−3% generated, +4% human-written) are not in the paper's current abstract, so they are not used. "75.8% of failures are false success" (arXiv 2606.09863): PDF unreadable, unverified. The source of a "tiered brainstorming gate (spike / bounded / architectural)" was never established. `parallelIndex` over `workerIndex` for Playwright slots came from a third-party post, unverified.

**Overlaps with established tools**: `commit` ↔ Anthropic `commit-commands` (ours adds the changelog gate and multi-repo); `update-claude-docs`/`condense-claude-md` ↔ `claude-md-management` and `/doctor` trim (theirs propose or add only); `brainstorming`, `done` ↔ `obra/superpowers`; `uiux` ↔ `frontend-design` (generate vs judge); `user-manual` ↔ `silkyland/love-me-love-my-docs`; `md-to-pdf` ↔ mermaid-cli wrappers.

**Borrowable candidates (unplanned)**: `skill-creator` gets a description-trigger eval loop (anthropics/skills); `code-reviewer` gets a 0–100 confidence score with an 80 threshold and a false-positive exclusion list (claude-plugins-official `code-review`); `read-summary`/`continue-session` check that files a handoff names still exist (toby-session `catchup`); `casual-message` gets a measured voice profile and a "Not me" log (mblode/agent-skills `ghostwriter`); `hobby-review` gets an anchor list against score drift and verbatim recall; `setup-playwright` keys slots on `parallelIndex` (unverified).

**No comparable found**: `judgement`, `plan-worklist`, `quick-done`, `product-reviewer`, `unhobble-instructions`, `refresh-instructions`, `merge-task-docs`, `sweep-doc-overlaps`, `notes-summary`, the `excalidraw-board` layout, `pull-db`.

**Consequences**: Sized by `product-reviewer` the same day, user picked three. Built: `code-reviewer` template and local agent gain three out-of-scope finding kinds (pre-existing, mechanically caught, untouched line); the 80% threshold and false-positive table already existed. `continue-session` confirms the handoff path resolves. `skill-creator`'s eval loop is already provided by `claude plugin eval` (fresh session per case, `tool_used: Skill` grader, no-plugin baseline), so `references/trigger-testing.md` points at it instead of building one. Skipped: `setup-playwright` already keys on `parallelIndex` with its own measured case; `hobby-review` already has an anchor title and writes nothing to the doc by design; `casual-message` would need per-user storage the plugin keeps out of shared memory.
