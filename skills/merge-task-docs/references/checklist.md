# Merge Task Docs — Checklist & Reference

Quick reference for repeated invocations. Read the main SKILL.md first; this file is for checking specific rules after you've run the workflow once.

## Implementation Checklist

| ❌ Never | ✅ Always |
|---------|---------|
| Leave a `# Merged into:` redirect stub | Delete the source; Step 6's reconciliation replaces discoverability |
| Decide to merge based on shared keywords | Merge based on shared subsystem (same tables/services/journey) |
| Delete source before reconciling back-refs | Reconcile to the new path first, then delete (Step 6's zero-stale check is the gate) |
| Force a flat merged doc past 300 lines by deleting real facts | Condense first; if sources are already dense (not bloated), split into index + `decisions/<theme>.md` instead (Step 4.7–8) |
| `rm -rf` a source folder having only read its `current.md` | `ls` the folder first — carry forward or absorb every sibling file (SQL scripts, stories docs, screenshots) before deleting |
| Preserve both docs' Last Session entries | One merged Last Session noting the merge happened — unless a source is contested (Step 4.6) |
| Merge without user confirmation, or bundle scope/structure/naming into one flat "does this look right?" | Three separate `AskUserQuestion` forks, each at the point it arises — scope, structure, naming (Step 2) |
| Plain `mv` a renamed folder | `git mv` — preserves file history (renames only; a deleted source has no history worth preserving since its content lives on in the merge target) |

## Rare Cleanup: Dead Redirect Stubs

Watch for prior-merge redirect stubs when scanning candidates (Step 1): a doc whose entire body is `# Merged into: <path>` or a one-line `content now lives at X` table. These aren't merge candidates, they're cleanup:

1. Delete the stub folder (no reconciliation needed — nothing valid points at a redirect)
2. Reconcile any reference to the stub to point directly to its target
3. Run the final scan to confirm zero stale references to the stub's own path
