# Pointer discipline (`> 📖` lines in CLAUDE.md)

A pointer is a load-bearing instruction, not a citation. Four facts govern writing one, following one, and keeping one true — ordered by when you need them.

## 1. Finding the target by content, not folder name

Folder names are engineer-domain-named and rarely match the topic (`upload-redesign` owns "QC", `payout` owns "refund"). `Glob tasks/**/*.md` + `Grep` for the concept's vocabulary + synonyms across doc body + header before writing `> 📖 See tasks/.../current.md`. A pointer to a non-existent or wrong doc is worse than no pointer — the reader lands somewhere plausible and never knows it's wrong.

## 2. Writing a pointer FROM a CLAUDE.md

Inline the 1-2 most critical facts alongside it — a session reading CLAUDE.md directly won't follow a bare pointer unprompted. This is the rule that keeps companions on the hot path instead of invisible.

Exception: a task doc's own `## Gotchas` table pointing to a reference file (`📖 See .../gotcha-name.md`) works bare — `Explore`/`Plan` reliably follow doc-level pointer rows (`structure.md` §6). Task-doc-scoped only — a CLAUDE.md `📖` line still needs the inlined facts above.

## 3. A pointer's own summary clause goes stale

A pointer usually carries a `Covers: …` list. That list is a claim about the companion's contents and rots when the companion changes — including when *you* just changed it. Re-read the pointer against the companion in the same pass, and correct the summary. A pointer advertising a gotcha the companion no longer carries sends the reader looking for something that isn't there. This is maintenance that fires on every companion edit.

## 4. Following a pointer — verifying what you found

**Companions live outside the normal discovery paths.** Companions sit in `.claude-companions/` (outside version control or in gitignored parts), so a search within the main repo won't find them — they either return nothing (if you didn't know the file existed) or only the pointer line referencing them (if the companion's contents are stale). Verify a companion's existence by checking the file itself, not by searching.

The two directions fail differently and neither announces itself. **Zero results in a codebase-wide search reads as "no one has written this down," so the fact gets added fresh — into a file that already covers it, one companion away.** The duplicate is invisible afterward because both copies are correct; they only drift later. **Tell: you concluded a topic was New from a search that excluded the companion directory.**

The other direction: **your only hit for a topic in the main codebase is the line that names the file where the topic is documented.** That's evidence the fact is stale in the companion, not present in the main files.

When settling a companion's existence, check the file directly. Rely on search results only for facts that live in tracked, searchable files.
