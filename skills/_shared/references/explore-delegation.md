# Delegating Mechanical Retrieval to the `Explore` Agent

Referenced by skills whose workflow has a pure file-discovery / grep-sweep sub-step (read-summary, merge-task-docs, task-summary). Apply when a step's work splits into *gather raw hits* (mechanical) + *judge what they mean* (inline judgment).

**Rule:** delegate only the gathering. Spawn `Explore` (read-only, cheap) to run the `Glob`/`grep`, and have it return **raw candidates + hits only** — file paths, matched lines, header blocks — never a ranked pick or "the answer is X". The judgment (ranking, merge-fit, mapping, which hit matters) stays inline against that raw data.

⚠️ **Why:** Explore's search process — exploratory Glob misses, intermediate tool calls, retries — never touches the caller's context. Only the final hit list does. The caller absorbs that payload (an `Agent` call's result inlines into whoever spawned it), so "raw candidates" is not smaller than inline `grep` would return; the saving is that all the search churn stays isolated to the agent's own context, not yours.

**Two non-negotiable prompt clauses** for every such `Agent({subagent_type: "Explore", ...})` call:
1. "Use `grep -rn`/`grep -rli`, never `rg`" — `rg`'s `-r` means `--replace`, not recursive; it silently substitutes the pattern and exits 0, so a corrupted sweep reads as a clean empty result. Tell: the search term is absent from its own output.
2. "Return raw, do not rank/filter/summarize" — a ranked return smuggles the judgment out of the main loop.

⚠️ **Spawning several? Every `Agent` call goes in ONE assistant message** — that block IS the parallelism. One-per-message serialises them regardless of any flag. Emit calls with no prose before them — narration is what ends a message after call #1, so nothing to finish saying means the rest follow unblocked. Send the full batch in one emission; a split send serialises them. Sent a short block anyway? Next message is calls-only for the missing agents — a serialised batch still completes, an abandoned one doesn't.

⚠️ **`run_in_background: false` does NOT guarantee a blocking call — do not build a step around it blocking.** Since Claude Code v2.1.198 [subagents run in the background **by default**](https://code.claude.com/docs/en/sub-agents); `false` is a hint Claude may honour "when it needs the result before continuing", and [issue #69691](https://github.com/anthropics/claude-code/issues/69691) (OPEN) reports it is honoured in child sessions and **ignored in top-level interactive ones**. Pass it — it costs nothing and expresses intent — but write the step so an async return is fine: results arrive as a `<task-notification>` and are never lost. **Never poll** (`sleep`/`ScheduleWakeup`/`TaskOutput`) waiting for one, and never Read an agent's `.output` file (it's the full subagent JSONL — it overflows context).

⚠️ **Delegating JUDGMENT anyway (an audit: "find every place matching this defect definition")? Two more clauses — an agent handed a definition treats its absence as its own failure and stretches it until something matches.** Requiring a count doesn't help; findings are the number it inflates.
1. "Quote the line verbatim with its line number, and name which clause of the definition it satisfies" — a finding that can't cite both is the agent reasoning toward a match.
2. "An unqualified 'clean' is not acceptable — say which steps you checked and why each is unexposed" — this inverts the reliability: enumerated *clean* verdicts hold up, unverified *findings* do not.

Re-verify every finding against the file yourself before acting; the quotes make that cheap. **Tell: an agent's own quoted line disproves the finding it filed.**

**Handing an agent a SKILL whose value is its judgement** (`unhobble-instructions`, `task-summary`, a review skill) inverts the clause-stacking above: the more you specify, the less of the skill actually runs. Listing which facts must survive, prescribing the counts to hit, pre-writing the conclusion it may reach — each reads as diligence and each replaces a decision the skill exists to make, until the agent is ratifying a plan you already wrote. Give it the skill name, the target, and the ownership boundary; the constraints that matter are the ones a stranger to your session couldn't infer (which files are contested, what must not be run). Where the worry is that the agent destroys something, prompt text is the wrong instrument anyway — it can't fail loudly. Snapshot the target first and diff after, which also catches the case a prompt never could: an agent that reports success while having deleted things, since a self-report is a claim about the work and not evidence of it. **Tell: your prompt tells the agent what it should conclude.**

A previous agent having failed on this same target tempts over-specification. Re-dispatching with the failure narrated into the prompt tends to make the second attempt worse — the agent hears what its predecessor broke and under-edits to avoid similar failures, and a reassurance that finding little is acceptable reads as permission to do nothing. If an agent failed before on this target, tighten your own verification afterward (the kind that can't be talked out of firing); that's more effective than specifying what you fear it might do again.

**Fallback:** no `Explore`-capable context (e.g. running inside an agent that can't itself spawn agents)? Run the same `grep` (never `rg`) directly in Bash instead.

**Zero-candidate result:** treat exactly like an inline empty grep — don't conclude "no doc exists" from Explore's report alone. Re-run its search with a control query that must hit before accepting the empty result.
