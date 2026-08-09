# Writing a Task Doc Another Session Owns

Referenced by skills that overwrite `current.md` sections (task-summary, condense-task-doc, merge-task-docs). Apply before any Quick Start rewrite or Last Session overwrite.

**Detection is `diff-ownership.md`'s job** — settle ownership by diff CONTENT, never by status plane. This file covers only what to do once a doc comes back contested.

**Rule:** the doc is contested for the rest of the run — on a scan *or* an explicit path. Every section mandate below inverts:

| Section | Uncontested (default) | Contested |
|---------|----------------------|-----------|
| `## Quick Start` | Rewrite entirely | **Additive only** — touch only lines describing your own work, leave the peer's state line alone |
| `## Last Session` | Overwrite in place, one session only | **Do NOT overwrite** — route your facts to their typed sections (Decisions/Gotchas/Next Steps), where they must live anyway |
| Any other section | Per the skill's own rules | Scoped, additive edits; never delete a row you didn't write |

A heads-up to the peer costs nothing once you know a doc is contested, and can turn a blind additive-only write into an agreed split — but it never gates the write, and silence is not consent (`cross-session-messaging.md`).

⚠️ **A mandate's qualifier must interrupt it, not trail it.** A contested-case clause parked at the end of a row reads as a footnote — the reader executing "MANDATORY: rewrite entirely" has already acted before reaching it. Put the branch immediately after the mandate it overrides, at *every* site that states it. This is the defect [issue #13](https://github.com/syafiq555/syafiqkit/issues/13) reported: `task-summary` already carried "Parallel sessions: overwrite only your own content" mid-row, and the reporter still found no guidance.

⚠️ **A branch is only reachable if some step evaluates its condition.** Gating the contested branch on a check that only runs in one code path (e.g. a scan-only preamble) makes it dead on every other invocation — and an explicit doc path is the most common one. State the ownership check as a run-wide condition, not a step-local one. **Tell: your guard's own text says "before scanning" while the branch it feeds is in a section reached by any path.**

Never `git stash`/`checkout -- .`/`reset`/`clean`/`restore` to "clear" contested work — repo-wide, and it takes the other writer's unrecoverable changes with it.
