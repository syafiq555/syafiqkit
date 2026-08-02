# Deferring to a File's Own Declared Size Budget

Referenced by skills and agents that judge whether a CLAUDE.md is too big (update-claude-docs, condense-claude-md, claude-md-pruner). Apply before spawning a pruner, proposing a split, or flagging an overage.

**Rule:** a file's own stated budget/decision outranks the skill's default. Read the target before asserting a threshold — the owner may have already closed the question you are about to re-open.

**Scope: a `.claude-companions/<shared|local>/CLAUDE-*.md` file is a CLAUDE.md for every rule on this page**, not just a destination content gets moved to. It carries its own budget, its own atomic-file gate, its own Restructuring-#4 redundancy check — the same as a root, layer, or subdir file. The companion-specific pages (`structural-splits.md`, `update-claude-docs/references/structure.md` §"companion file") describe how content arrives at a companion; they don't limit what a companion is once it exists. On a bare invocation naming "the CLAUDE.md files," `Glob` `.claude-companions/**/*.md` alongside the usual `**/CLAUDE.md` — a companion excluded from scope reads as reviewed when it was never opened.

## Detect

Grep the target file (header region first — the skill already reads it in full) for the owner's own words:

| Signal | Example |
|--------|---------|
| A stated line/byte budget differing from the default | "Line budget: ~460, NOT the global 350 (user decision)" |
| A "don't re-open" note attached to pruning or splitting | "Splitting into per-stack files was evaluated and **declined**. Don't re-open either question." |
| A recorded count of no-op passes | "13 consecutive pruning passes confirmed every row is load-bearing" |

These are prose signals, not a formal field — match on meaning, not an exact string.

## Act

| Found? | Action |
|--------|--------|
| A declared budget | That number is the threshold. Report size against **it**, never the default |
| Pruning/splitting recorded as decided | Do not spawn a pruner and do not propose the split. Report current size against the file's own budget and stop |
| Under half the **hard ceiling** (declared figure, else 350 → under 175), **and** this session added ≤5 net lines to it | Same as above — too small for a spawn to find anything. Report the size, skip |
| Anything else, including under-ceiling-but-grown-by->5-lines | Defaults govern unchanged — ~200 soft target, 350 hard ceiling; `condense-claude-md`'s ≤200 / >250 split-offer trigger |

A no-op result is not a success worth paying an agent for — it burns a run, and on the decided case re-litigates a settled question.

⚠️ **The floor measures against the HARD ceiling, never the soft target** — a soft/hard pair makes "half the budget" two different numbers (100 vs 175), and the last row is a catch-all precisely so a file that clears the size test but grew this session still gets a real pass. Both conditions must hold to skip; either one failing spawns.

⚠️ **A declared budget suppresses the DECISION, not the MEASUREMENT.** Still run `wc -lc`, still report the number, and still flag an overage — against the declared figure. A file 200 lines past its own stated 460 is over budget and must be told so; deferring to the owner's threshold is not deferring on whether it was met. **Tell: you skipped the size report entirely because the file declared a budget.**

⚠️ **A budget declared *below* the default is still authoritative.** The signal is "the owner decided", not "the owner wants more room" — a file declaring ~150 is held to 150, not to 200.

**Same failure mode, different artifact:** `read-summary` carries the parallel rule for task docs — when the doc has already resolved a fork, use its answer instead of handing the settled question back. Re-deriving a decision the artifact records reads as not having read it.
