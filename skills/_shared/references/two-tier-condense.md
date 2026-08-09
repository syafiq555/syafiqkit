# Draft + Verify — Shared Execution Model

Referenced by skills that condense/densify existing files (update-plugin's Step 3a, condense-task-doc, condense-claude-md). Defines HOW to execute a condensation once you know WHAT to cut — each skill's own checklist stays skill-specific; this governs the draft/verify split.

## Why draft/verify split

Sentence-level condensation ("is this restatement or a distinct rule?") is a judgment call, not pattern-matching. Collapsing draft and verify into one pass is how a real rule silently turns into confident-sounding nothing, because the same read that produced the prose also "confirms" it. A rewrite can trim bullets from a section meant to stay untouched while reading as fully plausible on its own — only a line-by-line diff against the original surfaces the silent drop. This holds even when you draft inline: write the full rewrite first, then diff it against the original as a separate pass, rather than editing-while-reading.

**Drafting may be delegated to a `haiku` agent; verifying may not.** Haiku handles this restructuring well — measured on a 375-line CLAUDE.md, it cut 35% of bytes with the rules intact — and the split is what makes that safe: the agent drafts, the orchestrating session verifies. An agent grading its own rewrite uses the same read that produced it, so its closing report is an artifact to check, never evidence. Drafting inline stays fine when the file is small or you're already holding its context.

## Draft

Rewrite the file (inline, or via a delegated `haiku` agent):
- Delegating → `Skill(skill: "syafiqkit:haiku")`, naming the target file and which skill's checklist governs the cut (`condense-claude-md`/`condense-task-doc`) in the prompt.
- Follow the skill's own cut/keep checklist (what content to remove/compress)
- Hard constraint: reword/collapse/relocate/delete-per-checklist only — never silently change what the doc/skill does (a policy, a default, a table's meaning), only how densely it's stated
- Quote every number, count, version, and named quantity verbatim — never recompute, round, or "helpfully" continue an obvious-looking sequence. A number is easy to treat as a paraphrasable detail rather than a fact requiring exact preservation, precisely because it looks small and unambiguous.
- Write mode depends on how much actually changes, per the calling skill's own rules: `Write` the whole file when most of it goes or its structure changes; `Edit` part by part when most of it survives. Never `Write`-rewrite a file just to preserve it — re-emitting unchanged bytes is waste, and each retyped line is a line you can silently corrupt.

When delegating, before reading the diff, extract every backtick-quoted identifier and bare number from the pre-draft original and grep each against the rewrite, treating every miss as a finding to inspect. Run it from the parent session — the same check written into the agent's own prompt is graded by the agent. It has a blind spot worth closing first: it presumes an edit happened, so confirm the bytes moved before trusting it (📖 `verifying-a-write-landed.md`). A rewrite can also relabel kebab-case keys "camelCase" or call a hyphen-vs-underscore mismatch "case-sensitive" and pass an identifier grep while restating a fact into falsehood — grep the target repo for any factual claim the rewrite introduces or changes in new words; settle it against the actual code before trusting the rephrasing.

## Verify — mandatory, never skip

A separate pass over your own draft, not a re-read of it — re-reading confirms it sounds plausible; diffing against the source confirms it's still true.

Verify against your pre-draft original:
- Diff with `git diff HEAD -- <file>` only if it was clean when you started. If the file is dirty, snapshot it first (`cp`) or diff against `git show :<file>` (staged) / `git show HEAD:<file>` (committed) — a dirty file makes HEAD the wrong baseline, and the failure is asymmetric: someone else's uncommitted edits appear as `-` lines, reading exactly like your rewrite touched a protected block. Tell: a `-` line whose text you recognize as an edit made earlier in this session — that is the wrong baseline, not a real regression.
- Read every `-` line. For each rule, warning, table row, or behavioral instruction it carried, confirm the same fact — not just similar words — survives somewhere in the `+` lines.
- For every `-`/`+` pair that contains a number, count, version, or named quantity, diff the numbers character-by-character. A diff hunk reads as "reworded" on a skim when two lines look similar enough — a reader confirms the row still exists and moves on without comparing the digits themselves, making this the failure mode a pure "did the fact survive" scan misses.
- When merging per-phase/dated tables into one living map, treat every merged row as a claim to re-verify, not a fact to carry forward. A per-phase table row is a snapshot frozen at its phase's date — a later phase changing that behavior does not retro-edit the earlier table. Where two sections disagree, the later-dated one wins; verify the surviving claim against current code before writing it.
- Scan the finished file for two surviving statements that contradict each other. A fact can survive the diff verbatim and still be false if later-dated content contradicts it. The older-dated statement is usually the stale snapshot.
- Watch for scope creep: a "condensation" that changes what the file does (a policy, a default, a decision) rather than how densely it says it. This is a correctness bug, not a style nit.
- For each surviving rule, check whether it used to carry a load-bearing appendage — a `📖` cross-reference, a "this already happened" precedent example, or an exact command/value. These are easy to cut as connective tissue because they're usually short trailing clauses that make the sentence read complete without them. A rule surviving is not the same as its appendages surviving.
- Fix any dropped rule, changed number, stale-but-surviving fact, dropped pointer/example/exact-value, or scope creep directly.
- Report `wc -lc` deltas — ratio should drop or hold flat, never rise.

## When the pass redistributes rather than condenses

The identifier grep above answers "did this string leave this file" and is only equivalent to "did this fact leave the project" when the file is the fact's only home. That equivalence breaks whenever the dispatched skill's job is to move detail somewhere else — `task-summary` pushing specifics out of an index into its owning `decisions/*.md`, a split moving a section into a new sibling, any pass that redistributes across a doc set. A correct delegation then reads as mass deletion, and the miscount scales with how well the skill did its job.

So before treating a batch of missing identifiers as loss, ask where each one *should* live now, and grep the sibling files, not just the one that was rewritten. A term that moved to its owning file is a success; only a term absent from the whole set is a finding. Worth checking the same way: content that was session narrative in a header or `Last updated:` block, whose identifiers legitimately disperse into the rows that now own them.

The regex used to extract identifiers matters here too, since a broad backtick-span match sweeps in commit SHAs, ticket ids and ordinary words, inflating the count with tokens nobody would call a fact. A large diff number sourced this way is not yet evidence of anything — resolve what it's actually made of before reporting it, because a confident loss figure that dissolves on inspection costs more trust than the drop it was meant to catch.
