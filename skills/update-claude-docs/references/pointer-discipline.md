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

**Grep doesn't reach scattered files.** Companions live outside the tree recursive grep walks (`.claude/`, gitignored paths), so a grep for a companion's fact returns either nothing (if you didn't know the file existed) or only the pointer line itself (if the companion is stale). Don't use grep to decide whether a companion covers a topic — `ls <path>` to check existence, then Read it.

**Tell: your only grep hit for a topic is the line that names the file where the topic is documented.** That's evidence the fact is stale in the companion, not present in the main files.

A control that merely hits (`README.md`) proves recursion works; it doesn't prove your target is in scope. Settle a companion's existence with `ls <path>`, never `grep -rl`.
