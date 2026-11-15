# Docs-only Mode: Counting, Integrity and Product Scope

Open this when the diff is entirely markdown and you need the reason behind the file count, the referential-integrity method, or the ruling on whether the markdown counts as product.

## Counting and the ARCHITECTURE check

Count changed files from `git show --stat <this-session's commit>` plus the uncommitted diff, since agent review covers both: code committed earlier this session was never reviewed. When the diff touches `docs/ARCHITECTURE*.md`, open each cited `file:line` and re-derive any count it states. Those are claims about the codebase, and a markdown-only diff gives a reviewer no reason to doubt them.

## Referential integrity

The referential-integrity check is the one this mode adds, and a hand-rolled sweep for it reports the corpus broken when the bug is in your extractor. A defect that common would already have surfaced in a maintained corpus, so when a sweep flags many pointers, suspect the extractor first, and resolve a known-good and a known-bad pointer before trusting a run. The method is owned by `${CLAUDE_SKILL_DIR}/../_shared/references/editing-skills-checklist.md`.

## Product reviewer scope

Instructions or prompts for an assistant people talk to, a user guide, public docs, and a plugin's skills, commands and agent files ship to everyone who installs them and decide what their sessions do, so they count as product. Notes about a project (task docs, a project's own CLAUDE.md) do not. A file kind settles the mode, not whether anyone uses what it says, so ask who reads the diff's output before skipping. Skipping the product reviewer as docs-only has been wrong twice; the incidents are in `agent-blind-spots.md`.
