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

**Reorganizing** (splitting the whole doc set onto a new axis — e.g. platform-based folders → feature-based folders): bigger than a rename or an A-into-B merge, and neither of those workflows covers the content-mapping step this needs.

1. **Map old → new BEFORE moving anything.** For each source doc, decide per-section which new doc owns it — a platform doc's content routinely serves several features plus shared infra, so most sections need a real per-row decision, not a bulk move. Write the mapping down (a plan file, not memory) before the first `git mv`.
2. **`git mv` what maps 1:1**, create new docs for what doesn't, using the Full Template per section 3 above.
3. ⚠️ **A `decisions/<theme>.md` file whose content is FULLY absorbed into a new doc becomes an orphan — delete it, don't leave it behind.** It's invisible from the moved doc's own Decisions Index (which you already updated to stop pointing at it), so nothing flags it as stale; it just sits in the old folder duplicating content that now lives elsewhere.
4. ⚠️ **A decision whose MADR block lived in an orphaned file needs a NEW home if it doesn't map to any of the new docs.** Deleting an orphaned theme file (step 3) is safe only for content that fully migrated — a file can hold 5 decisions where 3 moved and 2 didn't belong to any single new doc (e.g. they were about shared storage/deploy mechanics, not the feature the rest of the file was themed around). Audit every decision in a file before deleting it, not just the ones the plan already accounted for.
5. **Renumber per-domain** (existing rule, `templates.md` MADR section — run `grep -rn "^## D" tasks/<domain>/<feature>/decisions/` there for the exact command) — a decision moving into a fresh domain gets the next sequential ID there, not its old number carried over.
6. **Back-reference sweep is repo-wide, not just sibling task docs** — grep old paths across `tasks/**/*.md` AND the project's own `CLAUDE.md`/`CLAUDE.local.md`, which routinely hard-code a doc-routing sentence or a `📖` pointer into the old structure.
7. Delete the emptied source folders once their `current.md` and `decisions/*.md` are all accounted for — an empty directory left behind resurfaces in the next `Glob tasks/**`.
