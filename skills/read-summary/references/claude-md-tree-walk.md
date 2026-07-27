# CLAUDE.md Tree Walk — Path Taxonomy

Cold path for `read-summary` Read Order step 5. Mechanical lookup: **which** CLAUDE.md files exist and where. The rules about what happens when you *skip* one stay inline in SKILL.md — they are the hot path.

CLAUDE.md files auto-load additively by directory (root → layer → subdir → domain). Read every one on the path to the files this task touches.

| Level | Path shape | Note |
|-------|-----------|------|
| **Layer** | `app/CLAUDE.md` (backend) / `resources/js/CLAUDE.md` (frontend) | |
| **Subdir** | e.g. `resources/js/routes/CLAUDE.md` | Exists where a section split down a level; don't assume layer is deepest |
| **Domain** | `app/Domain/<Domain>/CLAUDE.md` (capitalized) | Inferred from the task path |
| **Companion** | `.claude-companions/<shared\|local>/CLAUDE-<topic>.md` at repo root | Reached via a `📖`/`> 📖` pointer inside a loaded CLAUDE.md or task doc. These do **not** auto-load, so the tree-walk misses them. Follow the pointer when your task matches its named symptoms; the companion holds real facts the main file moved out to stay lean |
| **Related** | Any CLAUDE.md named in a task doc's `Related:` | |

**Discovery**: `grep -rl --include='CLAUDE.md' "" <dirs>` scoped to the dirs in play — never `rg`, whose `-r` is `--replace`, not recursive.

**Scoping**: match blast radius, not repo size. This token-scoping is **within-repo only** — it is not licence to skip step 6 (sibling repo).
