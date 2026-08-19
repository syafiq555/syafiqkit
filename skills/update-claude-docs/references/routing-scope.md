# Routing Scope and Seam Test

## Scope hierarchy

Find the **most specific** CLAUDE.md for what's left. This ladder is the same hierarchy documented in `${CLAUDE_SKILL_DIR}/references/structure.md` §1 — read it if a routing call is unclear:

1. Personal, per-machine context (never team-wide facts) → `./CLAUDE.local.md` (project root)
2. Same domain as modified files → that domain's CLAUDE.md
3. **Subdir-level** — when a rule only matters inside one subdirectory
4. Layer-level — when a rule applies across multiple subdirectories in one layer
5. Project root `CLAUDE.md`
6. Global `~/.claude/CLAUDE.md`

A subdir `CLAUDE.md` auto-loads *additively* on top of its parents, so routing a rule down a level doesn't hide it — it scopes it. Prefer the subdir file when the rule is both needed in that subdir AND useless elsewhere (the seam test); if it's cross-cutting (terminology, shared utilities, contracts used across sibling directories), keep it at the layer level instead — pushing a cross-cutting rule into one subdir means the sibling dirs never load it. Creating the subdir `CLAUDE.md` if it doesn't exist yet is fine.

## The Seam Test

A rule belongs at subdir level only if the concepts it uses are heavily concentrated in that one directory and appear rarely (or not at all) in siblings. State the test as: **"Do the core terms from this rule appear frequently in THIS subdirectory and infrequently across its siblings?"**

If yes, it owns the rule. If no, the rule stays at the layer level because it applies across multiple subdirs. The test is how you decide; which tool you use to measure it is your choice. See `${CLAUDE_SKILL_DIR}/references/structure.md` §1 for more detail on this concept.

## Auto-loading file vs. companion

A companion is demand-loaded and indexed by symptom, so it's read by someone who already has a failure in hand and a phrase to search; the auto-loading file is read every session by someone about to act. Route on **when the rule needs to arrive**, not on what it's about — a rule that governs a routine choice (which tool to reach for, how to shape a command) has to be in the auto-loading file or it never fires, because nobody consults a symptom index before doing something that hasn't broken yet.

The companion earns rules whose trigger is a specific observed failure the reader can name. Picking it because its topic matched the rule's subject is the misroute: subject matter is how the fact got filed, never how the reader will come looking for it.
