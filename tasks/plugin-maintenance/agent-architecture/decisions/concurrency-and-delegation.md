<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/agent-architecture/concurrency-and-delegation
Gotchas (critical — full list in each ADR's Consequences):
  - Delegating a skill's heavy step to a cheaper agent only works when mechanical retrieval is split from judgment first — the judgment half stays on the calling session's own model (D30)
  - Explore can self-nest for multi-doc sweeps (depth-5 cap); generated-agent/template parity is a recurring drift class (D31)
  - Parallelism is the single-message block, not `run_in_background: false` — that flag is a hint, not a contract (D32)
  - On-disk transcript scanning was tried and REMOVED (D34→D36) — kept as design history only, the mechanism no longer runs
  - A skill pair that both scan the same conversation for overlapping signal classes and route dependently must dispatch sequentially, not in D32's parallel block (D42)
  - Cost relief for an expensive skill goes in a separate sibling skill, not a mode branch inside it — and its name must not reuse the parent's trigger vocabulary (D-quick-done)
Related: ../current.md (feature index), ../../doc-condensation/current.md, ../../madr-structure/current.md
Last updated: 2026-08-07
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
- Generated-agent/template parity is now a documented recurring drift class (4th occurrence, after D14's description/Bootstrap gap, D29's missing `Skill` tool, and a later untracked instance) — root CLAUDE.md gained a `⚠️ MANDATORY` callout under Project-Specific Agents rather than another ad-hoc fix. 2026-08-06: drift can surface with no edit trigger at all — `code-simplifier.md` alone had drifted to `model: opus` while its template already read `sonnet`, discovered only when a `/done` spawn 400'd with `effort 'xhigh' not supported`; the CLAUDE.md callout gained a line naming this as worth diffing against the template before treating a spawn fault as an unfixable routing/environment issue.
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
- ⚠️ **SUPERSEDED (v1.116.0, D36) — REMOVED from `/done`, and `transcript-scan.md` is deleted.** Transcript scanning ran as a shared reference (a caller resolved the session `.jsonl` and handed it to an `Explore` agent for a two-pass filter, judgment staying on the caller's model per D30). It cost an agent slot + ~47k tokens/run and didn't prevent the false-"done" doc miss it was meant to guard — that was a reporting failure, not recency. The operating detail is dropped as unusable; what survives is the verdict, so a future session proposing transcript scanning recognises it as tried and measured rather than new.
- **A sub-spawn grant must name its allowed agent type in the runtime-visible body**, not just a `tools:` comment. `browser-verifier`'s Constraints now state Explore-only, never another browser-verifier or an editing agent; the `tools:` comment tightened to match.

**Rejected**
- A registered `transcript-inspector` agent. Why not: the lighter shared-reference form avoided a registry-sync and template-parity surface. Moot once D36 removed the mechanism.
- A blocklist-only filter pass. Why not: verified leaky against a real transcript — a full skill body survived until markers were matched on line 1 rather than anywhere in the turn. Worth keeping because the shape recurs: a pattern list is a first cut, never the authoritative check.

**Consequences**
- `browser-verifier` fix lands in the template only; this plugin repo generates no `browser-verifier.md`, so consuming projects pick it up on their next `/agent-setup`.
- ⚠️ The transcript-scan half is superseded/removed by D36 — the sub-spawn-grant half stands.

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

---

### D53 — A Contested Doc Inverts the Section-Overwrite Mandates; the Rule Lives in `_shared/`, Keyed to a Run-Wide Condition — committed — v1.130.0

**Problem**
Reported upstream as [issue #13](https://github.com/syafiq555/syafiqkit/issues/13) by an outside user. `task-summary` §4 marks a full `## Quick Start` rewrite and a `## Last Session` overwrite MANDATORY on every update, while §1's ownership guard mandates additive-only edits once another writer owns the doc. Both fire together on a contested `current.md`, so the only moves are to obey the mandate and delete a peer's bullets, or skip it silently. The reporter improvised a third path — the real cost, since an unwritten rule is re-invented differently each session. `## Last Session` already carried "Parallel sessions: overwrite only your own content", but the clause trailed the mandate mid-row: a reader executing the instruction has already acted before reaching it.

**Decision**
Chosen: the contested branch is stated at every mandate site, and the rule itself extracted to `skills/_shared/references/contested-doc-sections.md` (Quick Start → additive only; Last Session → don't overwrite, route facts to typed sections). §1's guard was rewritten from "Before **scanning**" to "Before writing — scan or explicit path alike", and now names the contested state the §4 branches refer to.

**Rejected**
- Keep the rule in `task-summary` alone, per the single-owner half of the extract convention. Why not: correct on the information at hand, reversed by measurement — grepping the *mandate's* vocabulary (`Overwrite in place`, `Rewrite on every update`) rather than the rule's own wording found the identical unguarded mandate in `condense-task-doc` and `merge-task-docs`. Three owners crosses the 3+ threshold.
- Fold it into `_shared/references/diff-ownership.md`. Why not: that file answers *which files in a diff are mine* (consumed by `done`/`update-plugin` for agent partitioning); this answers *which sections I may overwrite*. Detection and remedy are different planes — diff-ownership keeps the former, the new file owns only the latter.

**Consequences**
- **The first fix shipped unreachable**, and this is the transferable half: all three branches keyed off a condition §1 only evaluated on the multi-domain-scan path, while the reporter's repro (and `write-summary`/`update-summary`) pass an explicit path. A branch is dead wherever no step computes its condition — the same defect as D52's unmeasured floor gate, one face over (threshold vs. reachability), 4th recurrence of the shape.
- Caught by the **product reviewer**, after the code reviewer correctly returned the three changed lines as mutually consistent. Reachability lives *between* sections; a file-scoped lens structurally cannot see it. Second consecutive session where that lens found the load-bearing defect (D52) — treat its verdict on a rule change as load-bearing, not advisory.
- An author cannot self-check this: the intent is in their head, so the branch reads as obviously reachable.

**Status**: committed · **Reversible**: yes

---

### D-commit-staleness-same-session-carveout — `/commit`'s Staleness Gate Gains a Same-Session Carve-Out, Mirroring `/done`'s Own Scoped-Invoke Rule — committed — v1.139.10

**Problem**
Reported upstream as [issue #16](https://github.com/syafiq555/syafiqkit/issues/16). `/commit`'s task-doc staleness gate is absolutist by design (judgment here is a rationalization trap) — any prose hit forces a full `task-summary` run, with only one carve-out (a lexical/identifier-shaped match, D57). But a `/done → /commit/ship` chain routinely hits the gate *after* `/done` Step 4 already ran `task-summary` scoped earlier the same session — re-invoking the full skill for a one-line fix is redundant, and `/done` Step 4 already states the opposite principle for itself ("`task-summary` already ran this session → invoke it scoped, not bare"). The two skills disagreed about the same state.

**Decision**
Chosen: a second carve-out, same shape as D57's (mechanical condition, not judgment) — when `task-summary` already ran this session (scoped or bare), a real hit may be resolved by direct scoped edit instead of a fresh full invocation, provided the existing sweep-to-zero obligation still runs. Cross-references `/done` Step 4's principle explicitly rather than restating it.

**Rejected**
- Loosen the gate's absolutism generally for "recently-verified" docs. Why not: reintroduces the exact rationalization surface D57/D53 close — "recently" is a judgment call, and every stale claim looks locally true at commit time regardless of session history.

**Consequences**
- Two mechanical carve-outs now sit side by side in the same paragraph (identifier-shape, same-session-already-ran) — both restructured into labeled sub-bullets during the same fix (unhobble-instructions pass) to keep the gate's absolutism legible against two exceptions instead of a run-on qualifier chain.

**Status**: committed · **Reversible**: yes

---

### D-quick-done — A Cheap `/done` Sibling as a Separate Skill, Not a Mode — committed — 2026-08-07

**Problem**
`/done`'s floor is nearly flat: a two-line fix still loads 75.8KB of instructions (`done` + `update-claude-docs` + `task-summary`, measured `cat … | wc -c`), spawns 3 agents minimum, and runs two full-conversation scans back-to-back in the main context. D39 had removed the only size-scaled carve-out, so nothing cheap remained.

**Decision**
Chosen: a separate user-invoked skill `quick-done` — one reviewer agent, one bare `task-summary`, and `/done`'s Step 5 Gate B. `/done` is unmodified. Only `task-summary` runs because D42 makes the two doc skills sequential-dependent; running one alone is safe (no concurrent router), running both would restore most of the cost. The name carries the size signal because `/done`'s own `description:` already claims the phrase "wrap up", so a name reusing that vocabulary leaves both skills competing for one trigger.

**Rejected**
- A `light` mode inside `/done`. Why not: this is D39's removed shape — a fourth case threaded through four decision points. D39 recorded the reversal as available ("if the extra agent spend on trivial sessions proves unwanted"), which this takes without re-adding a branch.
- `/wrap-up` as the name. Why not: a cold-read trigger test showed it competing directly with `/done`'s literal "wrap up" trigger, resolvable only by a body clause the model reads after routing has already happened.
- Keeping `update-claude-docs`. Why not: it is the larger half of the cost, and D42 forbids the cheap parallel form.

**Consequences**
- A `/quick-done` session does not capture broadly reusable patterns into CLAUDE.md. Named in the skill's own "What this deliberately doesn't do" so it is a stated loss, not a silent one.
- `ship` accepts either skill as its prerequisite (both its `description:` and Prerequisites list), and `tackle`'s hardcoded terminal `invoke done` became a size judgment — a caller's `description:` cannot reveal a hardcoded terminal call, so callers need opening, not reasoning about.
- The reviewer prompt carries `/done`'s destructive-verb ban; a one-agent dispatch is no safer than a fan-out, since the same Bash-capable agent runs.
- Plugin version bumped 1.139.15→1.140.0 (minor: adds a user-facing skill).

**Status**: committed · **Reversible**: yes (delete the skill + 4 registration edits; `/done` needs no unwinding)

---

### D-quick-done-docs-only — `/quick-done` Trades Its Reviewer for the CLAUDE.md Capture — committed — 2026-08-07

**Problem**
D-quick-done chose a reviewer plus `task-summary`, rejecting `update-claude-docs` as "the larger half of the cost." Used once, the shape was wrong for what a small session actually loses: a two-line fix rarely has defects a reviewer finds, but the one reusable thing it surfaced dies unrecorded, and `/quick-done` had named that loss without preventing it.

**Decision**
Chosen: swap the reviewer for `update-claude-docs`, keeping `task-summary` and the plugin gate. The skill is now docs-only and reads no code for defects. Supersedes D-quick-done's step composition; its separate-skill-not-a-mode holding stands unchanged.

**Rejected**
- Adding `update-claude-docs` alongside the reviewer. Why not: restores most of `/done`'s cost, which is the only reason this skill exists.
- Dropping the reviewer with no replacement. Why not: leaves a wrap-up skill whose sole act is one `task-summary` call, too thin to be worth a trigger of its own.

**Consequences**
- Instruction load is 53.6KB against `/done`'s 76.6KB (`cat` + `wc -c`, 2026-08-07) — a ~30% saving, not the ~58% D-quick-done's 31.9KB figure advertised. **The shipped CHANGELOG entry for v1.140.0 quotes that superseded number.**
- A session wrapped here has unreviewed code. `/ship`'s Prerequisites now reject `/quick-done` as satisfying its reviewed-code precondition, reversing D-quick-done's "ship accepts either skill"; `tackle`'s terminal call is scoped to sessions not heading for a ship.
- The docs-only Step 1 opens with `git status`, which surfaces a contaminated shared checkout earlier than a reviewer dispatch would have. Unplanned.

**Status**: committed · **Reversible**: yes · **Supersedes** D-quick-done (step composition only)

---

### D-mtime-cannot-see-concurrent-writers — Ownership Needs a Diff Read, Not a Timestamp — committed — 2026-08-07

**Problem**
`/done` Gate B and `/quick-done`'s plugin gate both settled shared-checkout ownership by comparing file mtime against session start. That excludes work finished *before* the session and nothing else: a second session editing this checkout concurrently stamps its files inside the same window, so every foreign file passes. Three foreign skill edits landed within 60 seconds of this session's own and read as owned.

**Decision**
Chosen: mtime stays as the cheap first filter, with a diff read on anything the session doesn't remember editing, and an ask before treating an unrecognised file as owned. A foreign edit is recognisable on sight; nothing cheaper distinguishes it.

**Rejected**
- Comparing against a session-start snapshot of `git status`. Why not: correct, but it must be captured at session start, and a gate that fails when someone forgets step zero is worse than one that reads a diff on demand.

**Consequences**
- The failure was biased toward over-claiming — the gate hands `update-plugin` *more* files than it should, which then version-bumps and ships another session's in-flight work under the wrong changelog entry.
- Stated in both `done` and `quick-done` at the point each prescribes the test. Two copies, below `_shared/`'s 3-copy extraction threshold.

**Status**: committed · **Reversible**: yes

---

### D-agent-verb-ban-shared — The Destructive-Verb Ban Belongs to Every Spawner, Not Just `/done` — committed — 2026-08-07

**Problem**
`/done` Step 1 told its spawned agents not to run `stash`/`checkout -- .`/`reset`/`clean`/`restore`/`commit`/`push`. Writing `quick-done` reproduced the dispatch without the ban, which surfaced the real scope: six skills spawn agents and only one stated it. Measuring the frontmatter (`awk '/^tools:/…' .claude/agents/*.md`) showed every spawned agent holds `Bash` — `Explore` holds `Bash Write Edit` and `claude-md-pruner` holds `Bash Edit`, despite both reading as retrieval roles.

**Decision**
Chosen: extract to `skills/_shared/references/agent-prompt-verb-ban.md` with the verification command inline, and point `quick-done`, `update-claude-docs`, and `explore-delegation.md` (covering both `Explore` callers) at it. `explore-delegation.md`'s "read-only, cheap" description of `Explore` was corrected in the same edit — it was false against the frontmatter and was the reason the exposure stayed invisible.

**Rejected**
- Merging into `diff-ownership.md`/`contested-doc-sections.md`, which carry the same verb list. Why not: those state a self-directed rule (don't run these to clear contested work); this states a delegation rule (put this in the prompt). Same vocabulary, different trigger — merging would make both harder to find.
- Restating the list per skill. Why not: 4+ owners, past the plugin's extraction threshold.

**Consequences**
- An agent's declared role is not evidence of its tool grants; read the frontmatter before calling one read-only.
- `/done` still carries its own inline copy — it was off-limits this session. A future pass can point it at the shared file, making 5 pointers and one owner.

**Status**: committed · **Reversible**: yes

### D-agent-may-not-redelegate — A Tool Grant Scoped Only In A YAML Comment Is Unscoped At Runtime — committed — 2026-08-14

**Problem**
A dispatched `product-reviewer` handed a six-item worklist spawned a second `product-reviewer` carrying the same brief rather than spawning `Explore` for retrieval. Seven templates grant the `Agent` tool; the intended scope lived in a frontmatter comment (`- Agent  # lets this agent spawn Explore agents for multi-target sweeps`) on six of them, and only `browser-verifier` stated it in body prose — because that role hit the failure first. A comment constrains whoever edits the file; the agent receives the tool with its own generic description and nothing narrowing it.

The failure is invisible from the dispatcher's side. The parent reformats the child's work into its own output contract, so the report arrives correctly shaped and on time; what silently drops is the brief, since a prompt clause binding the agent you dispatched reaches the child only as that agent's paraphrase of it. It also manufactures corroboration — a premise you supplied, restated by a child and relayed by a parent, reads as two agents independently agreeing.

**Decision**
Chosen: extract to `skills/_shared/references/agent-may-not-redelegate.md` and state the operative rule in body prose in every Agent-holding template plus its generated copies — spawn only `Explore`, only for retrieval, never a same-typed child and never your own assignment. `Explore` stays exempt: nested `Explore` is its designed behaviour for multi-target sweeps. Detection is the other half, so `plan-worklist` and `/done`'s blindness-patterns table tell the *dispatcher* what a relayed report looks like; prevention in the agent and detection in the caller fail independently.

**Rejected**
- Removing `Agent` from the roles that misused it. Why not: retrieval fan-out is why the grant exists, and revoking it pushes multi-target sweeps back into the agent's own context — the cost the delegation was buying down.
- Relying on the existing frontmatter comments. Why not: that is the mechanism that failed. The comment is also what a reviewer sees and finds reassuring, so it actively conceals the gap.
- Leaving generated copies to inherit via a `📖` pointer. Why not: project copies cite no `_shared` references and a project checkout need not have the plugin installed, so the rule must be inline there even though the templates carry a pointer.

**Consequences**
- Grepping a tools block measures the wrong thing. Every template's comment looks compliant, and `task-builder` omits `tools:` entirely to receive the full set — so `grep '^  - Agent'` cannot see its grant at all and reported it unaffected. Enumerate by capability, and confirm scope by reading the body for what the agent is told to spawn.
- The plugin's own `.claude/agents/` is a third copy location beside the two project checkouts, easy to miss because the plugin isn't thought of as a project. A sweep over generated agents has to include it.
- A same-typed child is the shape to look for, not nesting itself. The tell is a child whose task description restates the parent's rather than naming a slice of it.

**Status**: committed · **Reversible**: yes

---

### D-cross-session-messaging — Peer Discovery Belongs at the Entry Point, Not the Write Sites — committed — 2026-08-09

**Problem**
Claude Code 2.1.224+ shipped cross-session messaging (`ListAgents`/`SendMessage`), raised as a fix for the plugin's documented concurrency gaps. The real exposure it maps to: two sessions on one project, both reaching a doc-writing skill, where `task-summary`'s "Rewrite entirely" mandate destroys one session's work with no error and a success report from the loser. Existing detection (`diff-ownership.md`, `contested-doc-sections.md`) is retrospective and disk-bound, so a peer mid-edit or holding changes in memory doesn't exist yet.

**Decision**
Chosen: judge each problem by shape before reaching for the tool. Two of the four documented concurrency problems — version-bump races and `/done` Step 1's simplifier+reviewer pair — are *intra-session* subagent races with no session boundary to cross, so messaging is the wrong tool reached for by name similarity; their existing fixes (re-read-before-write, D32 disjoint partitioning) stand. For the two that are genuinely cross-session, the check goes in `read-summary`'s "Rediscover whenever scope changes" block, not at the write sites: `read-summary` opens ~9/10 sessions, re-triggers on scope change, and runs before both code and doc work, so one check covers a shared source file and a shared `current.md` alike. A write-site check fires after the session has already been editing for an hour. Limits live in `skills/_shared/references/cross-session-messaging.md`, written as a limits document; the write-side skills carry pointers only.

Found while surveying: `update-claude-docs` had no ownership handling at all, while its sibling `task-summary` carried a run-wide guard — and `/done` invokes them back-to-back (Steps 3→4), so concurrent sessions meet there first. Its new guard sits above the mode-selection table, since Rewrite and Condense restructure whole files and would never reach a guard placed inside Capture mode.

**Rejected**
- Treating the feature as a general fix and reworking the ownership gates around it. Why not: a plain-text, best-effort channel has no ack or lock semantics — a receiver that is busy, on `bypassPermissions` (held, 5-min expiry, then dropped), or set to `refuse` is indistinguishable from one with no objection, so silence can never be consent.
- Hosting the check at each write site (`task-summary`, `update-claude-docs`, `merge-task-docs`). Why not: too late to prevent anything, and it duplicates the rule into every skill that touches a file while still missing the same-source-file case.
- A new skill wrapping the tools. Why not: the legitimate use is one `ListAgents` call plus a courtesy message — judgement attached to existing gates, not a repeatable multi-step workflow.

**Consequences**
- **The tool and the command are not the same surface**, settled by running both in one session: `/list-agents` prints each local session's working directory, while the `ListAgents` tool returns name/kind/status/ref and no directory. A session driving this itself therefore sees less than the user does. The first draft asserted the cwd was simply absent, which was true of the tool and false of the command. It changes nothing structurally — the cwd appears only for local rows, whose names already identify them, and never for the Remote Control majority. Revisit if the tool gains cwd or delivery becomes guaranteed.
- **A large listing is history, not concurrency.** 81 rows, of which one was a live local session; the other 80 were resumable Remote Control sessions (other machines and the web), recognisable as past conversations by their first-message-derived names. Reading the total as a peer count is the wrong inference — filter to local interactive first.
- **An empty listing does not mean no concurrent writer**, which the implementation session demonstrated on itself: three files in this checkout changed mtime within the preceding minute while the only local interactive peer was idle in an unrelated project, so the writer was never addressable. The first draft of the reference said a listing with no local peer "means proceed normally" and was corrected before landing. Where the listing and `git status` disagree, `git status` observed a write and the listing observed nothing — the diff-content check stays mandatory, and the same run confirmed it separates cleanly (8 owned files carried the session's marker, 4 foreign ones carried none) where mtime could not, all four foreign files being stamped inside the session window.
- Fixed in passing: `merge-task-docs` L84 parked its contested clause *after* its mandate, the exact defect `contested-doc-sections.md` names.
- Out of scope by user decision: a version-file disagreement (`plugin.json` 1.140.5 vs `marketplace.json` 1.140.4) left in the working tree by a prior fan-out race, observed while planning. Reported, not fixed — no parity check added, so the next recurrence surfaces the same way.

**Status**: committed · **Reversible**: yes
