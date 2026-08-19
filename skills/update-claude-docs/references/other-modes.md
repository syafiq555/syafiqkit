# Create / Rewrite modes

Cold-path modes for `update-claude-docs` — Capture is the hot path and stays inline in SKILL.md; these two are read only when explicitly invoked.

## Prerequisites

Both modes depend on the same foundational gates:

- **The capture filter** — exclude content that is derivable from the codebase (listing a directory, searching the tree, reading the manifest, asking a tool for its own help), enforceable by whatever linter the project runs, or feature-specific enough to belong in that feature's task doc instead. Only load-bearing rules that can't be reconstructed from the code stay resident.
- **structure.md, read in full** — it holds the hierarchy, template shapes, section taxonomy (§3), capture filter rationale, formatting conventions, and the structural-split guidance. Not optional for either mode.
- **Anchors on every heading** — `{#anchor}` syntax is structural, not optional. Missing anchors break interior `📖 See file#anchor` pointers and the companion-file index.

## CREATE MODE

Scaffold a new CLAUDE.md for a repo, layer, or subdir that has none. The goal is a lean, house-style file — not an exhaustive dump.

1. **Pick the template that matches the target** — structure.md §3 holds the hierarchy and template family. A project root with sub-repos → root-router (routes, doesn't hold every rule). A sub-repo or `app/`/`react/` layer → domain-or-layer. A single split-off directory → subdir (one focused table, no LLM-CONTEXT header). `~/.claude/` → global.
2. **Analyze the codebase for real content — don't invent.** Every line must pass the capture filter (from Prerequisites, above). Gather:
   - **Commands**: the actual test/build/seed/dev commands (read `package.json` scripts, `composer.json`, Makefile, README). Only the non-obvious ones.
   - **Architecture**: the 3-5 dirs a newcomer must know, with ✅/⚠️ markers for canonical-vs-legacy. Not the whole tree.
   - **Stack + entry points** for the LLM-CONTEXT header (framework versions from lockfiles; entry files).
   - **Critical rules / gotchas**: only ones you can actually justify from the code (a broken legacy model, a schema quirk, a route-placement constraint). If you can't justify a rule from the code, leave it out — an empty section is better than a guessed one.
3. **Write in house style** — LLM-CONTEXT header, `❌ NEVER / ✅ INSTEAD` and `Symptom | Cause | Fix` tables, file+symbol references (never line numbers), sections in taxonomy order (structure.md §3). Cross-reference the parent layer for shared concepts (`> Schema: parent CLAUDE.md #{plans}`). ⚠️ Verify the file's actual contents before saving — tool output can include trailing markup tags that should not be persisted in the real file.
4. **Stay under budget** — target <200 lines. A fresh scaffold already near the cap means you're including too much; keep the highest-signal rules. Before dropping the rest, check whether a block is feature-specific enough to route to that feature's task doc instead (structure.md "second structural lever") — only truly cross-cutting content should stay.
5. **Validate**: anchors present + unique, tables well-formed, no invented rules, no secrets (those go to `CLAUDE.local.md` by name only), cross-refs resolve, and the file contains only real content (inspect the last few lines to verify no tool-output markup was accidentally persisted).

## REWRITE MODE

Restructure an existing CLAUDE.md to the canonical layout + formatting without losing any load-bearing rule. This is a *structural* rewrite, not a capture pass and not primarily a shrink.

### Before step 1: house style applies, whatever the file currently looks like

This mode restructures to the canonical shape in `structure.md`, in this repo and in a consumer's alike. Someone who invoked a rewrite asked for one, and a pass that finds a file written another way and defers to it delivers nothing — the opinion about how a CLAUDE.md should be built is what installing this plugin buys.

**Don't read an existing file's consistency as intent.** A shape applied uniformly is what one pass produces, so uniformity says a pass was uniform and nothing about whether it was right. Where the file's shape and `structure.md` disagree, `structure.md` wins.

The constraint that *does* bind is content, not form: step 1's inventory and step 7's diff are what stop a conversion dropping a rule on the way into its new shape, and step 5's capture filter is the only thing licensed to remove anything. Shape conversion is exactly where a table cell's content quietly goes missing.

Say in one line what you restructured before the rewrite lands — *4 tables to prose, 11 bullets to ❌/✅ rows, 3 sections reordered, 6 anchors added* — so the file's owner meets the change in your summary rather than in a diff.

📖 `../../_shared/references/adopt-vs-impose.md` — the rule in full, plus why task docs are the one artifact this doesn't extend to.

1. **Inventory every rule in the current file** before touching anything — list each constraint/gotcha/command so you can prove none is dropped in the rewrite. This is the safety gate: a rewrite that silently loses a hard-won gotcha is worse than no rewrite.
2. **Re-section to the taxonomy order** — consult structure.md §3 for the canonical section order. Move each existing rule into its correct section. If the file has no Architecture section at all (common in a gotchas-only file that grew incident-by-incident), that's a gap to fill — derive it from the real contracts/sibling classes (e.g. a "4 mutually-exclusive-precondition sibling Actions" table), never invent structure that isn't in the code.
3. **Convert tables to prose where they carry reasoning.** A table row whose Fix/✅ cell explains WHY ("because X, so Y") should become prose stating that reasoning, not stay tabular — only bare lookup values stay in tables. Apply this test to every row, not just obvious cases, including a table whose shape is otherwise uniform throughout the file — that uniformity is what one pass left behind, not a convention this step should protect. Re-check after finishing each section before moving to the next, since fixing one section doesn't carry over automatically.

   The judgement-vs-value split is what decides the conversion, and it runs in both directions: reasoning a reader works through becomes prose, while an answer that is one exact string — a command, an error message, a port, an id — stays a row, because prose has nowhere to put a literal value without becoming a table again. Converting past that boundary produces a paragraph that reads complete and cannot be acted on.
4. **Normalize formatting to house style** — free-form bullets → `❌/✅` rows; debugging notes → `Symptom | Cause | Fix` rows; add missing `{#anchor}`s; strip line numbers down to file+symbol; delete session storytelling.
5. **Apply the capture filter** (Prerequisites, above) as you go: a rule that's discoverable-from-code, linter-enforced, or feature-specific gets *removed* (feature-specific → note in a task doc instead), not reformatted. This is the one place Rewrite deletes.
6. **Route mis-placed rules:** a rule that belongs one layer down goes to (or creates) the subdir/domain file. A cross-cutting rule wrongly buried in a subdir moves up to the layer. If a block is feature-specific but has no layer, route to that feature's task doc instead — leave a bare `📖 See <file>` pointer, no inline duplication.
7. **Validate**: diff your rule-inventory (step 1) against the rewritten file — every load-bearing rule still present (possibly relocated), zero dropped. Verify the file contains only real content by inspecting its end (tool-output markup must not be persisted). Re-run the prose-vs-table check (step 3) on every section you touched, as a final pass across the whole file — easy to miss in one section while focused on another.

