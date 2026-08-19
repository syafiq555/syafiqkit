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

### Before step 1: whose file is this?

Two different jobs share this mode, and the wrong one runs silently because both start from "this file doesn't match our house style."

**When the target belongs to this plugin — any CLAUDE.md inside the syafiqkit repo — the house style is authoritative and this mode enforces it.** A convention you find here that differs from `structure.md` is drift, an older pass, or a mistake, not a decision to defer to. Consistency is not evidence of intent on a file this repo owns: a wrong shape applied uniformly is exactly what one bad pass produces, and reading that uniformity as authorial choice is how a defect gets preserved by the tool that was run to fix it. Normalize per steps 3 and 4, and where the file's shape and `structure.md` disagree, `structure.md` wins.

**When the target belongs to somebody else** — a consumer's project, a repo this plugin was merely invoked inside — the file's own convention is authoritative and the house style is not yours to impose. A mature CLAUDE.md a team maintained for a year usually has a convention of its own, and steps 3 and 4 cannot tell it apart from a file that never had one; on the first kind they destroy a working decision while every check still passes, because step 7 only proves the *rules* survived and says nothing about the form they arrived in. Apply `task-summary`'s test there: **drift is a section going missing, not a shape that differs. Reshape only where the current shape loses something.**

Settle ownership by where the file sits, not by how it reads — the repo you are invoked in is the fact, and it is cheap to check. Getting this backwards is costly in both directions: enforcing house style in a consumer's repo reshapes work that wasn't yours, and deferring to a stale convention inside this plugin is how a bad shape survives every pass run to correct it.

Three things get fixed whichever way ownership lands, because they are losses rather than differences: a rule filed where a reader won't find it, a missing `{#anchor}` that breaks an inbound pointer, and content the capture filter excludes outright.

Say which reading you took, in one line, before the rewrite lands — "plugin-owned, enforcing house style" or "consumer repo, adopting the file's own numbered-rule convention." An unstated choice reads afterwards as an accident, and the owner cannot tell whether you judged or defaulted.

📖 `../../_shared/references/adopt-vs-impose.md` — the same judgement as it applies to task docs and condense passes.

1. **Inventory every rule in the current file** before touching anything — list each constraint/gotcha/command so you can prove none is dropped in the rewrite. This is the safety gate: a rewrite that silently loses a hard-won gotcha is worse than no rewrite.
2. **Re-section to the taxonomy order** — consult structure.md §3 for the canonical section order. Move each existing rule into its correct section. If the file has no Architecture section at all (common in a gotchas-only file that grew incident-by-incident), that's a gap to fill — derive it from the real contracts/sibling classes (e.g. a "4 mutually-exclusive-precondition sibling Actions" table), never invent structure that isn't in the code.
3. **Convert tables to prose where they carry reasoning.** A table row whose Fix/✅ cell explains WHY ("because X, so Y") should become prose stating that reasoning, not stay tabular — only bare lookup values stay in tables. Apply this test to every row, not just obvious cases. Re-check after finishing each section before moving to the next, since fixing one section doesn't carry over automatically. Skip this conversion only on a **consumer-owned** file whose own convention the gate above told you to adopt — a uniform table shape used consistently is that convention, and this step is what would erase it. On a plugin-owned file, run the conversion: uniformity there is not a convention to protect.

   The judgement-vs-value split is what decides the conversion, and it runs in both directions: reasoning a reader works through becomes prose, while an answer that is one exact string — a command, an error message, a port, an id — stays a row, because prose has nowhere to put a literal value without becoming a table again. Converting past that boundary produces a paragraph that reads complete and cannot be acted on.
4. **Normalize formatting to house style** — free-form bullets → `❌/✅` rows; debugging notes → `Symptom | Cause | Fix` rows; add missing `{#anchor}`s; strip line numbers down to file+symbol; delete session storytelling. **Always on a plugin-owned file. On a consumer-owned file, only where the gate above found no convention of its own** — where it did, the anchors, the line-number stripping and the storytelling deletion still apply (all three are losses), while the bullet and table reshaping is what you agreed to leave alone.
5. **Apply the capture filter** (Prerequisites, above) as you go: a rule that's discoverable-from-code, linter-enforced, or feature-specific gets *removed* (feature-specific → note in a task doc instead), not reformatted. This is the one place Rewrite deletes.
6. **Route mis-placed rules:** a rule that belongs one layer down goes to (or creates) the subdir/domain file. A cross-cutting rule wrongly buried in a subdir moves up to the layer. If a block is feature-specific but has no layer, route to that feature's task doc instead — leave a bare `📖 See <file>` pointer, no inline duplication.
7. **Validate**: diff your rule-inventory (step 1) against the rewritten file — every load-bearing rule still present (possibly relocated), zero dropped. Verify the file contains only real content by inspecting its end (tool-output markup must not be persisted). Re-run the prose-vs-table check (step 3) on every section you touched, as a final pass across the whole file — easy to miss in one section while focused on another.

