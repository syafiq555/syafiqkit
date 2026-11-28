# Step 4: Invoking task-summary

Read this when Step 4's args are in question: whether to scope the invoke, or what an agent's doc work changes about it.

## Why a builder's doc edits do not count

A builder or other agent editing task docs updates only the files its brief named. It never updates the hub's Quick Start or the project's derived views (`docs/ARCHITECTURE*.md`, `PRD.md`). So unless `task-summary` itself already ran this session, the invoke stays bare, and its args never say the agents' doc work is complete.

(19/11/2026: args saying "beyond what the builders already wrote" left a hub Quick Start listing two built features as not built, and `ARCHITECTURE.md` describing a superseded refund rule, until a bare re-run found both.)

Step 3 runs before Step 4 because both scan the same conversation and route facts (CLAUDE.md vs. task doc): in parallel a fact lands in both files or neither. `task-summary`'s rule that only broadly applying patterns go in CLAUDE.md relies on Step 3 deciding first.
