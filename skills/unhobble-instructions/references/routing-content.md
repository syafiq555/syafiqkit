# Routing Content Out of a File

Read when the four residency questions in `SKILL.md` have told you something should leave, and you're deciding where it goes and what shape the destination takes.

## Pick the destination by why it failed

Content that failed on **derivability** gets deleted rather than moved — a companion full of things `ls` would have answered is a file nobody opens twice. Content that failed on **timing** (read only once someone holds a failure) goes behind a pointer. Content that failed because it's a **catalog** — error strings, commands, config paths — becomes a reference file or a lazy-load skill. Content that is **task-specific** rather than general belongs in the skill that performs that task.

Passing all four means it stays resident. There is no fifth option where content is neither kept nor given a home.

## A file with no destination changes the bar

Some files reach their reader without a working directory: a hook payload, a prompt assembled at runtime, a manifest concatenated by CI. A `📖` line in one of those resolves nowhere and a lazy-load skill is unreachable, so the only moves are keep or delete — and that raises the bar on cutting, because content that would normally be relocated is now being destroyed. **Establish how a file reaches its reader before applying any routing test.**

## Multiple tiers in one file is the split signal

A SKILL.md holding both resident rules and lazy-loaded material has two audiences competing for the same brevity budget — one reading every session, one arriving on demand. That is the point to split rather than to keep trimming.

**The shape to reach for is a symptom index over per-category files.** One row per symptom stays resident, each pointing at an anchor; every mechanism and fix body moves behind those anchors. The reader matches their own symptom, follows one anchor, opens one small file — so the resident half stays a routing surface and never re-accumulates the bodies.

Measured on a real corpus: a 74.7 KB `CLAUDE.md` left 17 KB resident, and a 184 KB companion became a 31 KB hub over six files with no anchor lost.

Cluster by the symptom a reader searches on, never by the headings the file already has — a split that follows existing headings rebuilds the same wall one file over.

📖 `../../condense-claude-md/references/structural-splits.md` — the clustering method, the per-category index requirement, the maintenance rule, and the rows that have no symptom and therefore cannot be evicted at any frequency.
