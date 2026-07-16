# Create / Rewrite / Condense modes

Cold-path modes for `update-claude-docs` — Capture is the hot path and stays inline in SKILL.md; these three are read only when explicitly invoked.

## CREATE MODE

Scaffold a new CLAUDE.md for a repo, layer, or subdir that has none. The goal is a lean, house-style file — not an exhaustive dump.

1. **Read `references/structure.md` in full first** — it holds the hierarchy, capture filter, section taxonomy, formatting conventions, and the template family. Pick the template that matches the target (root-router / domain-or-layer / subdir / global).
2. **Determine placement + template.** A project root with sub-repos → root-router (routes, doesn't hold every rule). A sub-repo or `app/`/`react/` layer → domain-or-layer. A single split-off directory → subdir (one focused table, no LLM-CONTEXT header). `~/.claude/` → global.
3. **Analyze the codebase for real content — don't invent.** Every line must pass the capture filter (§2). Gather:
   - **Commands**: the actual test/build/seed/dev commands (read `package.json` scripts, `composer.json`, Makefile, README). Only the non-obvious ones.
   - **Architecture**: the 3-5 dirs a newcomer must know, with ✅/⚠️ markers for canonical-vs-legacy. Not the whole tree.
   - **Stack + entry points** for the LLM-CONTEXT header (framework versions from lockfiles; entry files).
   - **Critical rules / gotchas**: only ones you can actually justify from the code (a broken legacy model, a schema quirk, a route-placement constraint). If you can't justify a rule from the code, leave it out — an empty section is better than a guessed one.
4. **Write in house style** — LLM-CONTEXT header, `{#anchor}` on every `##`, `❌ NEVER / ✅ INSTEAD` and `Symptom | Cause | Fix` tables, file+symbol references (never line numbers), sections in taxonomy order. Cross-reference the parent layer for shared concepts (`> Schema: parent CLAUDE.md #{plans}`). ⚠️ Strip tool-output wrapper artifacts before writing — see `_shared/references/strip-tool-output-tags.md`.
5. **Stay under budget** — target <200 lines (§6). A fresh scaffold that's already near the cap means you're including too much; keep the highest-signal rules. Before dropping the rest outright, check whether a block is feature-specific enough to route to that feature's task doc instead (§6 "second structural lever") — only truly cross-cutting or low-signal content should be cut.
6. **Validate** (§5 checks apply): anchors present + unique, tables well-formed, no invented rules, no secrets (those go to `CLAUDE.local.md` by name only), cross-refs resolve.

## REWRITE MODE

Restructure an existing CLAUDE.md to the canonical layout + formatting without losing any load-bearing rule. This is a *structural* rewrite, not a capture pass and not primarily a shrink (that's Condense).

1. **Read the target file AND `references/structure.md` in full.**
2. **Inventory every rule in the current file** before touching anything — list each constraint/gotcha/command so you can prove none is dropped in the rewrite. This is the safety gate: a rewrite that silently loses a hard-won gotcha is worse than no rewrite.
3. **Re-section to taxonomy order** (§3): LLM-CONTEXT header → Commands → Architecture → Critical Rules → domain sections → Gotchas → cross-refs. Move each existing rule into its correct section. If the file has no Architecture section at all (common in a gotchas-only file that grew incident-by-incident), that's a gap to fill, not just a reorder — derive it from the real contracts/sibling classes (e.g. a "4 mutually-exclusive-precondition sibling Actions" table), never invent structure that isn't in the code.
4. **Normalize formatting to house style** (§4): free-form bullets restating a constraint → `❌/✅` rows; debugging notes → `Symptom | Cause | Fix` rows; add missing `{#anchor}`s; strip line numbers down to file+symbol; delete session storytelling.
5. **Apply the capture filter** (§2) as you go: a rule that's discoverable-from-code, linter-enforced, or feature-specific gets *removed* (feature-specific → note it belongs in a task doc), not reformatted. This is the one place Rewrite deletes — for the wrong-layer/discoverable class only, never for "seems long".
6. **Route mis-placed rules** (§1): a rule that belongs one layer down goes to (or creates) the subdir/domain file, using the seam-test. A cross-cutting rule wrongly buried in a subdir moves up to the layer. If a block fails the seam-test (no real subdirectory owns it) but is feature-specific, route to that feature's task doc instead (`references/structure.md` §6 "second structural lever") — leave a bare `📖 See <file>` pointer row, no inline duplication needed.
7. **If still over budget after restructure** → hand off to `condense-claude-md` for a density pass; don't force-shrink by dropping rules yourself.
8. **Validate**: diff your rule-inventory (step 2) against the rewritten file — every load-bearing rule still present (possibly relocated), zero dropped. Then §5 checks. Also run the leaked-tag check from `_shared/references/strip-tool-output-tags.md` (step 4's warning).

## CONDENSE MODE

The user wants a bloated CLAUDE.md shrunk. **Delegate to the sibling skill — do not reimplement:**

```
Skill: syafiqkit:condense-claude-md
```

Pass the target file. That skill owns the density rules (strip WHY columns, collapse 3-col→2-col tables, remove discoverable content, tighten multi-sentence rows). If the file also needs *structural* re-sectioning (wrong section order, missing anchors), run Rewrite mode first, then Condense — structure before density.
