# Split Decision Tree

When Process #4 indicates splitting is needed (dense table, distinct topics, or file exceeds budget), use this tree to decide the lever.

## Lever #1: Subdir CLAUDE.md

For sections that are subdir-local and auto-load additively (parent keeps a `📖` pointer).

**Decision:** Does this rule apply primarily to one subdirectory?

- Apply seam-test: grep 3-5 core symbols against sibling dirs; let usage counts decide.
- If it fails seam-test but is **feature-scoped**, route it to that feature's task doc instead.
- If it passes (used heavily in one subdir, lightly elsewhere), create `app/<subdir>/CLAUDE.md` (or `resources/js/CLAUDE.md`, `tests/CLAUDE.md`, etc.)

Subdir CLAUDE.md auto-loads additively — no pointer setup needed in the parent.

## Lever #2: Companion File

For genuinely cross-cutting sections (no subdir owner, failed seam-test, or high reference frequency).

**Decision:** Is this a rule governing a routine choice, or a symptom-indexed gotcha?

- **Routine choice** (which tool to reach for, what to check before action) — keep inline in the always-loaded file however seldom it's referenced. Deferring behind a pointer means it only fires after someone violates it. There's no symptom to search under until failure, so moving it gains nothing.

- **Symptom-indexed** (implementation detail, gotcha table, how to debug X) — move to `.claude-companions/<shared|local>/CLAUDE-<topic>.md`, clustered by reader-search topic, behind a symptom index. Frequency alone doesn't decide eviction; a reader only arrives when they're already holding a failure to solve.

A row mixing judgment with exact values (IP, command, id) can split within itself instead of moving wholesale — extract the reference values to a companion, keep the mechanism inline. 📖 `prose-vs-value-split.md` for patterns.

**After moving content:** Create a pointer in the parent file named exactly as the reader will search for it. Pointer format: `📖 See .claude-companions/shared/CLAUDE-<topic>.md`. Track companion files in git — they are not gitignored, and their discovery depends on being indexed by parent pointers.

## Lever #3: Task Doc

Feature-scoped rules that belong in a task doc, not a CLAUDE.md.

**Decision:** Is this rule specific to a feature-in-progress or a domain initiative?

- If yes, route it to `tasks/<domain>/<feature>/current.md` via `update-claude-docs` rather than keeping it in CLAUDE.md or creating a companion.
- Task-scoped rules live in their own time and can be retired when the feature is live or shelved; CLAUDE.md rules are perpetual and accumulate.

## Reference: Pointer Requirements

Every `📖` pointer to a companion must satisfy:

1. The companion file exists in git (`ls` it before finishing)
2. The pointer path matches the actual file path exactly — no trailing `.md`, correct case, correct nesting
3. No dangling pointers — a pointer cited once in the prose anchors that file; if only the pointer cite exists and the file is stale/empty/misnamed, a reader lands nowhere
4. Accompany each pointer with context — a pointer buried in a 200-line section reads as "maybe important"; a pointer preceded by "If you hit X, see…" reads as actionable
