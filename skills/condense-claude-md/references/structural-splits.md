# Structural Splits — Subdir, Task Doc, Companion

Cold path for `condense-claude-md` Restructuring #6/#7. Reached only when a file is **over** its budget (`../../_shared/references/declared-budget.md`) and compression alone hasn't closed the gap. An under-budget file splits *in place* — `### ` subsections with `{#anchor}`s, every row inline, no new file.

## Choosing a lever

| Lever | Fires when | Result |
|-------|-----------|--------|
| In-place subsections | File under budget, section reads as a wall | `### ` headers, zero new files |
| #6 Subdir `CLAUDE.md` | Section is subdir-local (passes seam-test) | Auto-loads additively; parent keeps a `> 📖` pointer |
| Task doc | Section is feature-scoped, no subdir owns it | Routes via `update-claude-docs/references/structure.md` §6 |
| #7 Companion file | Cross-cutting: no subdir AND no feature owner | Manual pointer; does NOT auto-load |

Run these in order. A failed seam-test is the *trigger* for the next lever, not a dead end.

## #6 — Split to a subdir CLAUDE.md

A subdir `CLAUDE.md` auto-loads additively on top of its parents, so a section can move down a level leaving a one-line `> 📖` pointer — a real condensing lever, not just compression.

**Seam-test**: move a section only if its rules are both needed in that subdir and useless elsewhere. Grep the section's 3-5 core symbols against every plausible sibling directory (`grep -rl "<symbol>" <dir> | wc -l`), not just the one its name suggests — usage counts decide, and a section can fail against the obvious guess while passing against a directory nobody thought to check.

- Cross-cutting rules (token/money/table) stay at the layer level.
- Vertical-slice trees (`app/Domain/*`) usually pass; horizontal-layer trees (`components/`, `hooks/`) usually fail.
- `.claude/rules/*.md` `paths:`/`globs:` frontmatter is NOT a substitute — those always load in full; only a real subdirectory `CLAUDE.md` scopes load-by-path.
- When you split, the parent's `> 📖` pointer carries the single highest-cost fact inline.

⚠️ **Run the seam-test yourself before offering ANY split — never hand "subdir vs. companion" to the user as a menu choice, and never wait for pushback to run it.** The grep is cheap and decisive; presenting both options outsources work this skill exists to do. Ask the user only what the grep genuinely can't decide (e.g. the frequency cutoff for what stays inline).

⚠️ **Verify every factual claim inside an option's label/description/preview BEFORE presenting it.** Naming rows as removable or quoting a byte saving is a measurement, not an illustration — the user picks *because* of that number. Check per named item (`which <tool>`, `ls <path>`, `grep -c <ref> <config>`) and quote only what survives; a rule whose tool is still installed is a live guardrail no matter what its own "abandoned/removed" note says. **Tell: an option preview names an item as dead, or carries a saving you estimated rather than measured.**

## #7 — Manually-referenced companion file(s)

The split for a section with no auto-loading target. Two cases: the **global `~/.claude/CLAUDE.md`** (tied to no subdirectory, so #6 is unavailable), and any **layer/project file** whose oversized section is genuinely cross-cutting. Move the lowest-frequency, most heterogeneous rows out; keep the highest-frequency rows inline; replace the moved block with a `> 📖` pointer.

⚠️ **One heterogeneous block → multiple topic-scoped files, not one grab-bag file.** A block spanning unrelated topics recreates the dense-wall problem one file over — a reader checking one symptom still scrolls past everything else, and the file becomes the next thing needing a split. Cluster moved rows by topic FIRST (grep each row's subject noun/class name, group matches), then write one `.claude-companions/<shared|local>/CLAUDE-<narrow-topic>-gotchas.md` per cluster. A cluster that already has a home (an existing domain subdir CLAUDE.md, per #6) goes there instead, even mid-split. Byte count dropping is not the DONE signal — a reader should tell from the pointer index alone which single file answers their symptom.

**Location**: one `.claude-companions/` folder at the nearest git-repo root — not a same-directory file, and not the monorepo root in a multi-repo checkout (each repo gets its own). For the global `~/.claude/CLAUDE.md`, `~/.claude` is not itself a git repo: the folder is `~/.claude-companions/`, a sibling of `~/.claude/`, never nested inside it. Two subfolders split by trackability:

- `shared/` — tracked in git. For a companion supporting a checked-in file (project CLAUDE.md, subdir CLAUDE.md, task doc).
- `local/` — gitignored. For a companion supporting a local-only file (`CLAUDE.local.md`, `.env`-adjacent notes) — never commit these regardless of the parent's tracking state.

⚠️ **Moving content into `shared/` strips it of machine-specific paths, even if the source already had them.** A tracked project `CLAUDE.md` can carry a hardcoded `~/<user>/<checkout>/...` path nobody caught; copying it verbatim ships it to every teammate whose checkout differs. Grep the moved block for `~/`, `/Users/`, or any absolute path and reword to a portable reference first.

### The pointer is the whole ballgame

A companion does NOT auto-load, so it helps ONLY if the pointer makes a reader open it. A bare "see `CLAUDE-<topic>.md`" is the silently-unfollowed failure. Requirements:

- Name **concrete trigger symptoms/tools**, never a generic category label alone.
- Multiple sub-categories in the moved section → the pointer must be a **per-category symptom index**, one line per category listing distinctive symptoms, so a reader matches their bug *without* opening the file. A single trigger phrase is insufficient for a multi-category file.
- Tell the user explicitly it does NOT auto-load like a subdir CLAUDE.md.
- Existing cross-references to a moved anchor don't need repointing if the parent's redirect line indexes that anchor by name — the reader lands on the parent and follows it in one hop. Repoint only when the anchor ISN'T named in the index (renamed/merged during the move): `grep -rn "<oldfile>. #<subanchor>"` across `tasks/**` + sibling CLAUDE.md.
- Hand the user the maintenance rule: a later companion row must also add its symptom to the matching index bullet in the main file.
- First write to `.claude-companions/local/` in a repo: check `.gitignore` for it and add if missing — don't assume a prior split did.
