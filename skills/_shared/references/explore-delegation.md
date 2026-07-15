# Delegating Mechanical Retrieval to the `Explore` Agent

Referenced by skills whose workflow has a pure file-discovery / grep-sweep sub-step (read-summary, merge-task-docs, task-summary). Apply when a step's work splits into *gather raw hits* (mechanical) + *judge what they mean* (inline judgment).

**Rule:** delegate only the gathering. Spawn `Explore` (read-only, cheap) to run the `Glob`/`grep`, and have it return **raw candidates + hits only** — file paths, matched lines, header blocks — never a ranked pick or "the answer is X". The judgment (ranking, merge-fit, mapping, which hit matters) stays inline against that raw data.

⚠️ **Why (be precise about the real benefit):** the caller still absorbs Explore's full returned payload — an `Agent` call's result is inlined as text into whoever spawned it, so "raw candidates, verbatim" is not smaller than what inline `grep` would have returned directly. The actual saving is that Explore's *own* search process (exploratory Glob misses, intermediate tool calls, retries) never touches the caller's context — only the final hit list does. Don't oversell this as "raw output never reaches the main loop"; it does, one hop later.

**Two non-negotiable prompt clauses** for every such `Agent({subagent_type: "Explore", run_in_background: false, ...})` call:
1. "Use `grep -rn`/`grep -rli`, never `rg`" — `rg`'s `-r` means `--replace`, not recursive; it silently substitutes the pattern and exits 0, so a corrupted sweep reads as a clean empty result. Tell: the search term is absent from its own output.
2. "Return raw, do not rank/filter/summarize" — a ranked return smuggles the judgment out of the main loop.

⚠️ **Always pass `run_in_background: false` explicitly in the same call** — the next step reads Explore's result synchronously; an async/backgrounded call leaves it with nothing to read yet.

**Fallback:** no `Explore`-capable context (e.g. running inside an agent that can't itself spawn agents)? Run the same `grep` (never `rg`) directly in Bash instead.

**Zero-candidate result:** treat exactly like an inline empty grep — don't conclude "no doc exists" from Explore's report alone. Re-run its search with a control query that must hit before accepting the empty result.
