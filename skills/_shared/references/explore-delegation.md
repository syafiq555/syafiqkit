# Delegating Mechanical Retrieval to the `Explore` Agent

Referenced by skills whose workflow has a pure file-discovery / grep-sweep sub-step (read-summary, merge-task-docs, task-summary). Apply when a step's work splits into *gather raw hits* (mechanical) + *judge what they mean* (inline judgment).

**If you're citing this file with a `📖` pointer from a skill:** the shadowing rule under "The Waiting Game" below is a fact, not background reading — a skill whose own workflow spawns an agent and then continues must state that constraint in its own prose at the point it applies, not leave it only in this file. See `editing-skills-checklist.md`'s "Pointer citations" check for why.

## When to Delegate

**The core rule:** delegate only gathering, not judgment. Spawn `Explore` to run `Glob`/`grep` and return **raw candidates + hits only** — file paths, matched lines, header blocks — never a ranked pick or interpretation. The judgment (ranking, merge-fit, which hit matters, whether a hit is real) stays inline, against that raw data.

**Gathering vs. judgment aren't always obvious beforehand.** At the outset of a planned sweep, *what is there* (enumerate the callers, list the specs, read that file) is mechanical and delegable. Mid-investigation, when questions change shape, the line shifts: *does this hold* (a specific claim the plan now rests on) belongs inline. That second kind can't be delegated even in principle — the contradiction that raises it doesn't exist until something you're reading contradicts an assumption the agent was briefed on. A config default contradicted by an env file, a flag that appears set but is gated three layers down: the follow-up read decides feasibility and lands mid-turn, after the batch went out. **Tell: you're about to spawn an agent to verify a fact your next edit depends on.**

`Explore` is read-only by *role*, not by *tools* — its frontmatter grants `Bash Write Edit`, so the repo-wide verb ban belongs in its prompt (📖 `agent-prompt-verb-ban.md`, same directory). A search-scoped mandate is what makes the read-only role enforceable.

**Why delegate at all:** Explore's search process — Glob misses, tool call retries, backtracking — stays isolated to its own context. Only the final hit list inlines to you. That isolation is the saving: you don't pay the search tax, and "raw candidates" trades bandwidth for context isolation, not for size.

## How to Spawn

**Every multi-file search needs two non-negotiable prompt clauses:**

1. **Use `grep -rn`/`grep -rli`, never `rg`.** The `-r` flag in `rg` means `--replace`, not recursive. It silently substitutes the pattern and exits 0, so a corrupted sweep reads as a clean empty result. Tell: the search term is absent from its own output.
2. **Return raw output, do not rank/filter/summarize.** A filtered return smuggles judgment out of the main loop, defeating the split.

**Spawning multiple agents:** every `Agent` call in a batch goes in **ONE assistant message** — that block IS the parallelism. One call per message serialises them regardless of flags. Emit calls with no prose before them; narration ends a message after call #1, blocking the rest. Send the full batch in one emission; a split send serialises them. If you sent a short block first, follow with a calls-only message for the missing agents — the batch still completes, an abandoned batch doesn't.

## The Waiting Game

**Async behavior is weak — `run_in_background: false` does not block.** Since Claude Code v2.1.198, [subagents run in the background by default](https://code.claude.com/docs/en/sub-agents). The `false` flag is a hint Claude may honour, and [issue #69691](https://github.com/anthropics/claude-code/issues/69691) (OPEN) reports it is honoured in child sessions but **ignored in top-level interactive ones**. Pass it anyway — it costs nothing and expresses intent — but write the step so async arrival is fine. Results arrive as a `<task-notification>` in a later turn. **Never poll** or Read an agent's `.output` file (it's raw subagent JSONL and overflows context).

Waiting is not something you *do*, which is what makes it easy to get wrong: "don't poll" leaves an unanswered "then how?", and a `sleep` in Bash is the obvious wrong answer — the harness blocks it outright (`Blocked: sleep 45 ... use Monitor with an until-loop`). There is no waiting call to make. **End the turn**; the completion notification re-invokes you with the result. Reserve `Monitor` for genuinely external state the harness can't notify you about (a CI run, a remote queue), never for an agent it is already tracking.

**Don't shadow the agent.** The temptation while waiting is to read the delegated files yourself — it feels like progress and costs the delegation twice. You pay for the same facts inline, and the agent's version lands later and longer. What do you do while agents run? Usually *nothing, or think*. If you need to fill the wait, the delegation was scoped too wide — spawn fewer agents, read it inline from the start, don't do both.

Shadowing doesn't announce itself as duplication — each call reads as progress, so the tell isn't that a grep feels redundant, it's that your calls map onto the scope you just assigned. It also destroys the check that makes delegating safe: verification belongs *after* the report, testing its claims against the source. A fact you derived inline and then see restated in the report is the same fact arriving twice, which reads as corroboration while confirming nothing — and it's the report's *unshadowed* half, the part you have no independent read on, that most needs checking. **Tell: you describe the agent as having "confirmed" something you'd already grepped yourself.**

**A file being written is not an artifact to verify** — it's sweeping the floor while someone is still carrying bins out. The sweeping is real work and it feels productive, which is exactly why it's tempting; it is also void the moment it's done, and you will sweep again. Worse than shadowing, because it yields confident findings about a state that never exists: a live case read a target at 101 lines, filed "dangling cross-references", scripted the fix — and every substitution missed, the agent having already repaired them in a later pass. The finding was true of the bytes on disk that instant and false about the work. Wait for the completion notification, then confirm the file stopped moving (`wc -c` twice, seconds apart) before judging it. **Tell: `git status` shows `MM`, or the size changed between two of your own commands.**

## Verification & Edge Cases

### Delegating Judgment (Audits)

When the task is judgment — *find every instance matching this defect definition* — an agent handed a definition treats its absence as failure and stretches until something matches. Two clauses guard against that:

1. **Quote the line verbatim with its line number, and name which definition clause it satisfies.** A finding that can't cite both is the agent reasoning toward a match, not reporting one.
2. **An unqualified 'clean' is unacceptable.** Say which steps you checked and why each is unexposed. Enumerated *clean* verdicts hold up; unverified *findings* do not.

Re-verify every finding against the file yourself before acting; the quotes make that cheap. **Tell: an agent's quoted line disproves the finding it filed.**

### Over-Specifying a Skill

**Handing an agent a judgement-bearing skill** (`unhobble-instructions`, `task-summary`, review skills) is a different genre. The more you specify about what must happen, the less of the skill actually runs — each specification replaces a decision the skill exists to make. Give it the skill name, target, and ownership boundary. The constraints that matter are facts specific to *right now* — which files are contested, what must not run — not general guardrails. "Don't edit sibling files" and "don't run destructive git commands" against a clean tree are over-specification: the agent had no reason to do either. If you can't name the specific file or command a clause protects, it isn't a session fact. Where you worry the agent destroys something, prompt text can't fail loudly. Snapshot the target first and diff after instead; that catches an agent reporting success while having deleted things. **Tell: your prompt tells the agent what it should conclude.**

A previous agent having failed on the same target tempts over-specification. Re-dispatching with the failure narrated into the prompt tends to make the second attempt worse — the agent hears what its predecessor broke and under-edits to avoid similar failures. Tighten verification *yourself* instead (the kind that can't be talked out of firing); that's more effective than specifying what you fear it might do again.

### Verifying Agent Counts

**Don't trust agent inventory counts without your own check.** An empty result is easy to distrust, but a non-empty list *reads* settled in a way an empty one never does. The costly failure isn't fabricated hits but an incomplete sweep reported as complete: an agent naming two files where nine exist, or returning a plausible sibling path while missing the one the work touches. Both are locally accurate and wrong as inventories.

Before acting on an absence the agent asserted — *no test covers this, no doc exists, only N of these* — run a one-liner count yourself (`ls`, `grep -c`, `find`). It costs a command and it's the claim most likely to be wrong in the direction that wastes a session. For a zero-candidate result specifically, re-run the search with a control query that MUST hit: an empty result is as often a broken search (bad flag, typo, gitignored dir) as a true absence, and the control is what tells them apart.

For non-empty results: verify the agent's count is exhaustive before treating it as fact. Same method, same principle — don't conclude the absence from a successful search.

### Fallback (No Agent Context)

No `Explore`-capable context (inside an agent that can't spawn agents)? Run the same `grep` (never `rg`) directly in Bash instead.
