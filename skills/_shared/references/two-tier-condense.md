# Draft + Verify — Shared Execution Model

Referenced by skills that condense/densify existing files (update-plugin's Step 3a, condense-task-doc, condense-claude-md). Defines HOW to execute a condensation once you know WHAT to cut — each skill's own checklist stays skill-specific; this governs the draft/verify split.

⚠️ **Draft inline, not via a spawned Agent.** Earlier revisions of this file spawned a background Haiku agent for the draft step — dropped per explicit preference: no agent for this task. Both steps below run in the current turn.

## Why draft/verify still split

Sentence-level condensation ("is this restatement or a distinct rule?") is a judgment call, not pattern-matching. Treat drafting and verifying as two distinct passes even inline — write the full rewrite first, then separately diff it against the original — rather than editing-while-reading. Collapsing them into one pass is how a real rule silently turns into confident-sounding nothing, because the same read that produced the prose also "confirms" it.

## Draft

Rewrite the file inline (current turn, no spawn):
- Follow the skill's own cut/keep checklist (what content to remove/compress)
- Hard constraint: reword/collapse/relocate/delete-per-checklist only — never silently change what the doc/skill *does* (a policy, a default, a table's meaning), only how densely it's stated
- ⚠️ **Quote every number, count, version, and named quantity VERBATIM** — never recompute, round, or "helpfully" continue an obvious-looking sequence. A number is easy to treat as a paraphrasable detail rather than a fact requiring exact preservation, precisely because it looks small and unambiguous. Diff it against the original in Verify like any other fact.
- Use `Write` for a full rewrite (not `Edit`), per the skill's own Hard Rules

## Verify — mandatory, never skip

A separate pass over your own draft, not a re-read of it — re-reading confirms it sounds plausible; diffing against the source confirms it's still true.

⚠️ **Verify with `git diff`, never by re-reading the finished file.** A rewrite pass can silently trim bullets from a section meant to stay untouched (e.g. MADR `Rejected` blocks) while reading as fully plausible on its own — only a line-by-line diff against the original surfaces a silent drop.

1. Diff against the file's **pre-draft state** — `git diff HEAD -- <file>` only if it was clean when you started. ⚠️ **A pathspec resolves against CWD, not the repo root**, so a repo-relative path run from inside a subdirectory returns empty with exit 0 — indistinguishable from "the rewrite changed nothing." Anchor it: `git -C "$(git rev-parse --show-toplevel)" diff HEAD -- <repo-relative-path>`, and treat an empty diff as inconclusive until a grep confirms it. ⚠️ **A dirty file makes HEAD the wrong baseline**, and the failure is asymmetric: someone else's uncommitted edits appear as `-` lines, reading exactly like your rewrite touched a protected block. "Restoring" that is how you destroy the other writer's work while believing you caught your own mistake. Dirty file → snapshot it before rewriting (`cp`), or diff `git show :<file>` (staged) / `git show HEAD:<file>` (committed) against the version you started from. **Tell: a `-` line whose text you recognise as an edit made earlier in this session — that is the wrong baseline, not a real regression.**
2. Read every `-` line. For each rule, warning, table row, or behavioral instruction it carried, confirm the *same fact* — not just similar words — survives somewhere in the `+` lines.
3. ⚠️ **Check every changed number separately from checking dropped lines.** A diff hunk with a `-`/`+` pair (not a pure deletion) reads as "reworded" on a skim — the two lines look similar enough that a reader confirms the row still exists and moves on without comparing the digits themselves. For every `-`/`+` pair that contains a number, count, version, or named quantity, diff the numbers character-by-character, not the sentence shape. This is the failure mode a pure "did the fact survive" scan misses: the fact reads as present, just wrong.
4. ⚠️ **When merging per-phase/dated tables into one living map (e.g. a `## Files` table), treat every merged row as a claim to re-verify, not a fact to carry forward.** A per-phase table row is a snapshot frozen at its phase's date — a later phase changing that behavior does not retro-edit the earlier table, so a naive merge can lift a stale, since-superseded row into the present tense. Where two sections of the same doc disagree, the later-dated one wins; verify the surviving claim against current code before writing it.
5. ⚠️ **A fact can survive the `-`/`+` diff verbatim and still be false.** This is the one failure a pure did-it-survive scan cannot surface, because nothing was dropped or changed — after the `-`/`+` pass, separately scan the finished file for two surviving statements that contradict each other. The older-dated one is usually the stale snapshot (see check 4).
6. Watch for scope creep: a "condensation" that changes what the file *does* (a policy, a default, a decision) rather than how densely it says it. This is a correctness bug, not a style nit.
7. Any dropped rule, changed number, stale-but-surviving fact, or scope creep → fix directly.
8. Report `wc -lc` deltas — ratio should drop or hold flat, never rise.
