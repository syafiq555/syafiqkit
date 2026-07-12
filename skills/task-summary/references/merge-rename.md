# Merging or Renaming a Task Doc

Cold-path for `task-summary` — read only when the user requests `merge A into B` or a doc-folder rename. The default create/update flow never touches this.

⚠️ **NO redirect stubs.** When a doc is merged into another or its folder is renamed, **delete the source outright** — do NOT leave a `# Merged into:` stub. Stubs are clutter the user does not want; discoverability is preserved by reconciling every back-reference, not by a breadcrumb file. The gate is **0 stale references**, verified before you finish.

**Merging** (`merge A into B`): delegate to `syafiqkit:merge-task-docs` — it owns the full workflow (subsystem-boundary check, back-ref scan, canonical-path choice, validation). Don't reimplement it here.

**Renaming a doc folder** (better discoverability slug):

1. **`git mv`** the folder (and any `instructions.md`/`stories.md` siblings) — preserves history; a plain `mv`+add shows as delete+add.
2. **Update the doc's own `# Title` + LLM-CONTEXT `Domain`** to match the new slug.
3. **Reconcile ALL back-references** to the new path (see below).
4. **Remove empty leftover dirs** so `Glob tasks/**` doesn't surface stale paths.

**Back-reference reconciliation (both cases) — sweep these, not just `Related:`:**
- `Related:` fields AND inline `tasks/**/current.md` mentions in OTHER task docs
- Domain `CLAUDE.md` `> 📖` pointers (e.g. `app/Domain/Invoice/CLAUDE.md`) — code docs cite task docs too
- Roadmap/hub rows that mirror the doc by name
- ⚠️ `rg` stdout can corrupt long paths — write matches to a file and Read it (don't trust truncated terminal output)

| ❌ Never | ✅ Always |
|---------|---------|
| Plain `mv` a renamed folder | `git mv` — keeps history |

For merge-specific ❌/✅ rules (stub handling, reconcile-before-delete, `Related:` sweep scope, subsystem-vs-keyword, size budget), see `syafiqkit:merge-task-docs`'s Rules table — don't duplicate them here.
