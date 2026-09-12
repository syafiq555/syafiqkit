# Routing Content Out of a File

Read when something should leave a file and you're deciding where it goes and what shape the destination takes. The four residency questions are below; `SKILL.md` carries the principle and the traps, this file the full test.

## The four residency questions

Run them in sequence.

1. **Is it derivable?** If a reader could reconstruct it with `ls`, `grep`, reading the manifest, or running `--help`, cut it outright rather than rewriting it. Name the command before cutting; "a competent reader would know this" is not one, and it is the phrase under which a harness quirk (`git checkout HEAD --` because the harness auto-stages) or a version constraint leaves a file that was its only home.

2. **Is it safety-critical?** Prohibitions that *must* fire even if ignored by a prior session ("never edit generated files", "never push to main") are always resident, never deferred. Their cost is fixed; their value is irreplaceable.

3. **Does it need to arrive before action, or only during failure?** A rule governing a routine choice (which tool to use, what to check before an action) needs to be resident and absorbed preemptively — deferring it behind a pointer means it only fires again after someone violates it. A consultation rule, implementation detail, or symptom-indexed gotcha is different: it's read by someone already holding a failure, so moving it behind a pointer costs nothing and gains resident clarity.

4. **Is it a reference table or lookup?** A section reading like a catalog (error strings, commands, configuration paths) should usually move behind a pointer or become a lazy-load skill, even if you've just finished sharpening its prose.

⚠️ **A file that is *already* a lookup table still has two levels to judge, and "rows stay rows" settles only the first.** The second is the shape a reader meets: whether related rows sit together under a heading they can jump to, whether one kind of content wears one frame (a NEVER/ALWAYS header over rows that are symptoms trains a reader to see rules), and whether two rows share a cause and belong as one. Clustering and reframing are the pass on that file, so reporting "it should stay tabular" after three row edits is a first-level answer to a second-level question. Reframing has a cost of its own: a column the source never had is a slot every row must now fill, and where the source recorded no cause the honest cell is `—`, never a mechanism supplied from what usually causes that symptom — a measured pass filled such a column with six wrong causes in the same register as the rows it copied.

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

Inheriting the source's structure is the default outcome rather than a lapse: the content arrives already grouped that way, and regrouping reads as a second job the move didn't ask for. It also passes every check — the destination exists, the pointers resolve, the resident file shrank — so nothing in the result exposes it. The cost is paid by the reader, who arrives holding a symptom ("the flag reads as never-set", "my rows silently disappeared") rather than a category name. A file indexed by category asks them to already know which category their symptom belongs to, which is the knowledge they came for; that is the difference between a lookup and a hunt, and it is invisible to whoever performed the split.

⚠️ **Adding a symptom table to the top of the single large file is the near-miss that reads as the fix.** It answers "how does a reader find their row" while leaving "the bodies are all still in one file" untouched, so the file grows and the reader still scrolls a wall once they arrive. The index earns its name only when the bodies live in separate topic-scoped files and the index is the thing that routes between them — at which point the index becomes its own small file the parent points at, per `../../condense-claude-md/references/structural-splits.md` §"The pointer is the whole ballgame". Judge the outcome by whether one file now answers one symptom, never by whether an index exists.

📖 `../../condense-claude-md/references/structural-splits.md` — the clustering method, the per-category index requirement, the maintenance rule, and the rows that have no symptom and therefore cannot be evicted at any frequency.
