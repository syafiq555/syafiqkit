# Pointer discipline (`> 📖` lines in CLAUDE.md)

A pointer is a load-bearing instruction, not a citation. Four rules govern writing one, following one, and keeping one true.

## 1. Following a pointer during the Step-1 scan

⚠️ **A `> 📖` pointer is an instruction to descend, and neither of its two failure directions is visible to grep — `ls` the target and Read it before classifying anything.**

A lean index keeps detail in companions outside the tree recursive grep walks, so:

| Direction | What grep returns | What you wrongly conclude |
|---|---|---|
| (a) rule exists in the companion | 0 hits | **New** → you duplicate it |
| (b) rule exists but is **stale** | exactly 1 hit — the pointer line | "this file doesn't cover the topic" → companion left stale |

Direction (b) is the quiet one: the grep *succeeded*, so nothing signals. `grep -a` won't save either — the text is in another FILE, not an unreadable one, so it misreads as the NUL-byte trap.

**Tell: your only hit for a topic is the line that names the file where the topic is documented.**

`.claude/` and gitignored paths are unreachable by recursive grep regardless — settle a companion's existence with `ls <path>`, never `grep -rl`. A control that merely hits (`README.md`) proves recursion works, not that your target is in scope.

## 2. A pointer's own summary clause goes stale

A pointer usually carries a `Covers: …` list. That list is a claim about the companion's contents and rots when the companion changes — including when *you* just changed it. Re-read the pointer against the companion in the same pass, and correct the summary. A pointer advertising a gotcha the companion no longer carries sends the reader looking for something that isn't there.

## 3. Writing a pointer FROM a CLAUDE.md

Inline the 1-2 most critical facts alongside it — a session reading CLAUDE.md directly won't follow a bare pointer unprompted.

Exception: a task doc's own `## Gotchas` table pointing to a reference file (`📖 See .../gotcha-name.md`) works bare — `Explore`/`Plan` reliably follow doc-level pointer rows (`structure.md` §6). Task-doc-scoped only — a CLAUDE.md `📖` line still needs the inlined facts above.

## 4. Finding the target by content, not folder name

Folder names are engineer-domain-named and rarely match the topic (`upload-redesign` owns "QC", `payout` owns "refund"). `Glob tasks/**/*.md` + `Grep` for the concept's vocabulary + synonyms across doc body + header before writing `> 📖 See tasks/.../current.md`. A pointer to a non-existent or wrong doc is worse than no pointer.
