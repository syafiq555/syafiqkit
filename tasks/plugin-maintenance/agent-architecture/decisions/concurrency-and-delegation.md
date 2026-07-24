<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/agent-architecture/concurrency-and-delegation
Gotchas (critical — full list in each ADR's Consequences):
  - Delegating a skill's heavy step to a cheaper agent only works when mechanical retrieval is split from judgment first — the judgment half stays on the calling session's own model (D30)
  - Explore can self-nest for multi-doc sweeps (depth-5 cap); generated-agent/template parity is a recurring drift class (D31)
  - Parallelism is the single-message block, not `run_in_background: false` — that flag is a hint, not a contract (D32)
  - On-disk transcript scanning was tried and REMOVED (D34→D36) — kept as design history only, the mechanism no longer runs
  - A skill pair that both scan the same conversation for overlapping signal classes and route dependently must dispatch sequentially, not in D32's parallel block (D42)
Related: ../current.md (feature index), ../../doc-condensation/current.md, ../../madr-structure/current.md
Last updated: 2026-07-24
-->

# Agent Architecture — Concurrency, Cheap-Model Delegation & Self-Nesting

How the plugin delegates work to cheaper/parallel agents, what `run_in_background` actually guarantees, and the transcript-scan mechanism that was tried and removed.

---

### D30 — Split Mechanical Retrieval From Judgment Before Delegating to a Cheaper Agent — committed — 2026-07-15

**Problem**
A request to make `read-summary` and "all our agents" use multi-level Haiku sub-agents, to offload heavy-token work, conflated two different goals: reducing main-loop context bloat, and reducing model cost. Blanket-delegating a skill's work to a cheaper model risks the judgment-heavy steps (doc disambiguation, staleness detection, subsystem-boundary reasoning) as much as the mechanical ones — a wrong cheap-model verdict on a judgment call is worse than the tokens it would have saved, and nesting it (Haiku spawning Haiku) compounds the lossy-summarization risk on exactly the reasoning each skill exists to get right.

**Decision**
Chosen: split each candidate skill's flagged step into a mechanical half (file discovery, grep sweeps — zero judgment) and a judgment half (ranking, disambiguation, merge-fit, staleness). Delegate only the mechanical half to the existing `Explore` agent (already read-only, already `model: haiku`, already registered for "find X" tasks) — instructed to return raw candidates/hits, never a ranked conclusion. The judgment half stays inline on the calling session's own model. Patched `read-summary` (doc-discovery), `merge-task-docs` (Step 1 candidate listing + Step 3 back-reference sweep), `task-summary` (multi-domain candidate-gathering). Extracted the repeated delegation pattern (3+ callers) to `skills/_shared/references/explore-delegation.md` per the existing DRY threshold.

**Rejected**
- Multi-level Haiku delegation across all skills, as originally requested. Why not: tested against the actual problem (context bloat, not cost) it doesn't hold up — most of this plugin's skills are judgment-heavy by design (task-summary's doc mapping, merge-task-docs' subsystem test, update-claude-docs' routing), and a uniform cheap-model policy would degrade exactly the reasoning these skills exist to protect.
- Claiming the delegation removes raw output from the main loop's context entirely. Why not: an `Agent` call's result is inlined as text into whoever spawned it — for `read-summary`/`task-summary`, the caller IS the main loop, so the raw hit list still lands there, one hop later. The real saving is that `Explore`'s own search *process* (exploratory misses, intermediate tool calls) never surfaces, not that the final payload shrinks. Caught by product review; corrected in the shared reference's own "Why" framing rather than left overstated.

**Consequences**
- Every `Explore` delegation must return raw data only — a ranked/summarized return would smuggle judgment out of the calling session silently.
- Every such `Agent({...})` call needs a documented fallback (plain `grep`, never `rg`) for contexts with no `Agent` tool access, and must tolerate an ASYNC return — `run_in_background: false` is a hint, not a guarantee (v2.1.198 made background the default; [#69691](https://github.com/anthropics/claude-code/issues/69691)). Both folded into the shared reference so any future caller inherits them for free.
- Plugin version bumped 1.81.0→1.82.0; CHANGELOG entry added.

**Status**: committed · **Reversible**: yes

---

### D31 — Explore Agent Gains `Agent` Tool for Self-Nested Multi-Doc Sweeps — committed — 2026-07-15

**Problem**
User observed the project's local Explore override doing a flat, single-level sweep across `tasks/**/current.md` for a staleness audit and asked whether Explore should be able to spawn its own sub-agents to parallelize that kind of multi-target work, rather than reading every doc serially inside one Explore call.

**Decision**
Chosen: verified against the official Claude Code docs (not agent paraphrase — line-cited claims were independently re-fetched and grepped for confirmation) that any subagent definition listing `Agent` in its `tools:` can spawn nested subagents, capped at a fixed depth-5 limit. Added `Agent` to `.claude/agents/Explore.md`'s `tools:`, added a Search Strategy step for "many independent targets → spawn one nested Explore per target instead of serial reads," and updated the Constraints table's "Speed over completeness" row to match. Ported the identical three edits into `skills/agent-setup/templates/Explore.template.md` (caught by `code-reviewer` as parity drift before commit — this project's generated agent and its source template must move together, now codified as a `⚠️ MANDATORY` root CLAUDE.md callout under Project-Specific Agents).

**Rejected**
- Leaving fan-out as the caller's responsibility (spawn several flat Explores in parallel from outside), the prior design. Why not: it works for the caller-already-knows-all-targets-upfront case, but for a request like "check every current.md" the caller would need to enumerate targets itself before delegating anything — self-nesting lets Explore do its own target enumeration + fan-out in one call.

**Consequences**
- Nested Explore-spawns-Explore for raw multi-doc reads is the mechanical-retrieval case D30 already carves out as safe for cheap-model delegation — no judgment crosses the boundary, so this doesn't reopen D30's blanket-delegation rejection.
- A nested Explore at depth 5 loses the `Agent` tool and can't spawn further; the fixed cap is not configurable, so extremely deep fan-out plans must flatten before depth 5.
- Generated-agent/template parity is now a documented recurring drift class (3rd occurrence, after D14's description/Bootstrap gap and D29's missing `Skill` tool) — root CLAUDE.md gained a `⚠️ MANDATORY` callout under Project-Specific Agents rather than a fourth ad-hoc fix.
- Plugin version bumped 1.82.0→1.83.0.

**Status**: committed · **Reversible**: yes

---

### D32 — Parallelism Is the Single-Message Block; `run_in_background: false` Is Not a Blocking Guarantee — committed — 2026-07-16

**Problem**
The plugin asserted, in `done`'s rules table and `explore-delegation.md`, that passing `run_in_background: false` makes an `Agent` call block ("omitting it has still returned an async task" — CHANGELOG 1.x). A session set it explicitly on five consecutive calls and every one returned async, then emitted agents one-per-message believing the flag carried the parallelism. Meanwhile `two-tier-condense.md` already stated the opposite ("agents run in the background by default"), so the plugin taught two contradictory things about one parameter.

**Decision**
Chosen: state the documented behaviour and separate the two concerns.
- **Parallelism = every `Agent` call in ONE assistant message.** No flag substitutes for it; one-per-message serialises regardless. This is the rule that was actually being violated.
- **`run_in_background: false` is a hint, not a contract.** [Official docs](https://code.claude.com/docs/en/sub-agents): *"As of v2.1.198, subagents run in the background by default. Claude runs a subagent in the foreground when it needs the result before continuing."* [Issue #69691](https://github.com/anthropics/claude-code/issues/69691) (OPEN) reports it is honoured in child sessions and ignored in top-level interactive ones. Keep passing it (free, expresses intent); never build a step around it blocking.
- Async is safe: results arrive as `<task-notification>` and are not lost. **Never poll** (`sleep`/`ScheduleWakeup`/`TaskOutput`), and never Read an agent's `.output` file — it's the full subagent JSONL and overflows context.

**Rejected**
- Escalating the old rule again ("pass it *harder*"). Why not: the rule was factually wrong, not weakly worded — the prior CHANGELOG entry had already "corrected" it in the wrong direction. Escalating a false premise compounds it.
- Documenting the `background:` frontmatter field as the fix. Why not: it forces background *on* (`true` = always background, even when Claude wants the result); there is no documented way to force *foreground*. It's the opposite lever from the one the old rule was reaching for — noted below, not adopted.

**Consequences**
- Skills must tolerate an async return from any delegated `Agent`. A step that reads a result "synchronously in the next line" is unsafe by construction.
- The only documented per-agent control is frontmatter `background: true` (always background); unset = Claude chooses. No foreground guarantee exists at any level.
- Undocumented in official sources, from [#63938](https://github.com/anthropics/claude-code/issues/63938): a `min(16, cpu_cores - 2)` concurrency cap on workflow `agent()` calls — excess queue rather than fail. Not relied on.

**Status**: committed · **Reversible**: yes (revisit if #69691 lands a documented foreground control)

---

### D34 — On-Disk Transcript Scan Defeats Recency Bias; Agent Sub-Spawn Must Name Its Allowed Type — committed — 2026-07-18

**Problem**
Two agent-steering gaps in one session. (1) The doc-update skills (`update-plugin`, `update-claude-docs`, `done` Steps 3/5) reconstruct "what happened this session" from the calling loop's own context — recency-biased and compaction-prone, so an early correction silently drops. `update-plugin`'s own Step 1 admits producing a partial scan twice in one session despite the warning. (2) `browser-verifier` carries the `Agent` tool (granted per D31 for spawning `Explore`), but the grant lived only in a `tools:`-line code comment — invisible to the agent at runtime — so the agent kept trying to spawn *another browser-verifier*, a redundant self-nest.

**Decision**
Chosen, both:
- ⚠️ **SUPERSEDED (v1.116.0, D36) — REMOVED from `/done`.** The mechanism below is kept only as design history; it no longer runs, and `transcript-scan.md` is deleted. It cost an agent slot + ~47k tokens/run and didn't prevent the false-"done" doc miss it was meant to guard (that was a reporting failure, not recency). **Transcript scan as a shared reference, not a new agent** (`_shared/references/transcript-scan.md`). A caller resolves the session `.jsonl` path itself (`ls -t ~/.claude/projects/*/"$CLAUDE_CODE_SESSION_ID".jsonl | head -1` — glob by the unique session-id UUID, sidestepping the lossy cwd encoding of #7009/#21085) and passes it literally to an `Explore` agent, which runs a two-pass filter (jq drops tool_result bulk; contaminant-strip drops harness-injected `type=="user"` turns — skill-body injections, `<task-notification>`, `<local-command-caveat>`, `[Request interrupted by user]`, bare command scaffolding) and returns a RAW numbered list of the human's genuine messages. Judgment (which lines are signals) stays on the caller's model (D30). Wired into `done` Step 1's agent batch only this pass — `update-plugin`/`update-claude-docs` standalone deferred.
- **A sub-spawn grant must name its allowed agent type in the runtime-visible body**, not just a `tools:` comment. `browser-verifier`'s Constraints now state Explore-only, never another browser-verifier or an editing agent; the `tools:` comment tightened to match.

**Rejected**
- A registered `transcript-inspector` agent (SKILL.md registry + template). Why not: user chose the lighter shared-reference form — no registry sync, no template-parity surface; skills spawn a generic `Explore` following the reference.
- Subagent self-locates the transcript via inherited `$CLAUDE_CODE_SESSION_ID`. Why not: it forces re-implementing the lossy, collision-prone cwd encoding in a second place; empirically the var IS inherited (returns the parent's id), so it's kept only as a cheap stale-path cross-check, never the primary lookup.
- A blocklist-only Pass 2. Why not: verified leaky against a real transcript (a full `read-summary` skill body survived until markers were matched *anywhere* in the turn, not just line 1) — the reference makes the human-eye completeness skim the authoritative check, the pattern list only the first cut.

**Consequences**
- `done` gains a Transcript row (exit-gate audit + Output table); the scan skips in light/docs/infra *minimal* runs but not a substantive docs session.
- The scan agent is never partitioned by file slice (whole-session, like the product reviewer) and its list is an async enrichment to Steps 3/5, never a hard dependency — if it hasn't returned, those steps run their own scan bare.
- `browser-verifier` fix lands in the template only; this plugin repo generates no `browser-verifier.md`, so consuming projects pick it up on their next `/agent-setup`.
- ⚠️ Both bullets superseded/removed by D36 — kept here as design history only.

**Status**: committed · **Reversible**: yes

---

### D35 — Superseded by D36 (Transcript Scan "Mode B" Removed)

Never had its own ADR block — was a routing-table stub for a since-removed transcript-scan variant. See D36.

**Status**: superseded

---

### D36 — Transcript-Scan `Explore` Agent Removed From `/done` — committed — v1.116.0

**Decision**
Reverses D34/D35. The on-disk transcript-scan mechanism (D34) cost an agent slot + ~47k tokens per run yet, in the session that removed it, returned a full record while the doc-update still failed — the failure was a false "done" report (reported invoked = done), not the recency miss the scan defends against. The real fix went into the exit gate instead: Task-docs/Knowledge rows now require confirming the artifact CHANGED, not just that the skill was invoked. `_shared/references/transcript-scan.md` deleted.

**Status**: committed · **Reversible**: yes

---

### D42 — `done` Steps 3+4 (`update-claude-docs` + `task-summary`) Dispatch Sequentially, Not in Parallel — committed — v1.123.9

**Problem**
`done`'s Steps 3+4 ran `update-claude-docs` and `task-summary` in the same parallel block per D32's general "every `Agent`/`Skill` batch goes in one message" rule. But the two skills aren't independent tasks operating on disjoint state — both scan the *same* conversation for the *same* class of signal (durable pattern vs. feature-specific note) and each independently decides CLAUDE.md-vs-task-doc routing with zero visibility into the sibling's call. `task-summary`'s own rule ("only patterns that apply broadly go in CLAUDE.md") presupposes that judgment has already been made — it can't be, racing in parallel.

**Decision**
Chosen: `done`'s Steps 3+4 section now runs `update-claude-docs` first, `task-summary` second — sequential, not parallel. `update-claude-docs` decides what's broadly reusable and writes it; `task-summary` then routes the feature-specific remainder, aware of what already landed in CLAUDE.md.

**Rejected**
- Keep parallel dispatch and rely on each skill's own "no duplicates" check to reconcile after the fact. Why not: each skill greps for existing entries *in its own target files* — `update-claude-docs` greps CLAUDE.md, `task-summary` greps the task doc — so neither call can see a fact the sibling call is mid-write on. The dedup check is real but scoped to the wrong file to catch this race.

**Consequences**
- This is a narrow exception to D32's general parallel-batch rule, not a reversal of it — D32 still governs same-role agent batches (N simplifiers, N reviewers) where slices are genuinely disjoint. The exception applies specifically to skill pairs whose routing decisions depend on each other.
- Any future skill pair added to `done` (or elsewhere) that both scan the same conversation for overlapping signal classes should default to sequential too — check for this shape before assuming D32's parallel-block rule applies.

**Status**: committed · **Reversible**: yes
