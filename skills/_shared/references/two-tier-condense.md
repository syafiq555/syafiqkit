# Two-Tier Condense — Shared Execution Model

Referenced by skills that condense/densify existing files (update-plugin's Step 3a, condense-task-doc, condense-claude-md). Defines HOW to execute a condensation once you know WHAT to cut — each skill's own checklist stays skill-specific; this governs the draft/verify split.

## Why two-tier

Sentence-level condensation ("is this restatement or a distinct rule?") is a judgment call, not pattern-matching. A weak drafter can silently turn a real rule into nothing while producing prose that reads perfectly plausible — the failure is invisible without a diff-level check by a stronger reader. Splitting draft (cheap, fast) from verify (accurate) gets both properties instead of trading one for the other.

## Draft (Haiku, background)

Spawn an `Agent` with `model: "haiku"`. Do NOT pass `run_in_background: false` — agents run in the background by default, and setting `false` forces a synchronous wait, which is exactly what this step must avoid. Multiple files → spawn all in one message so they draft concurrently. Give the drafter:
- The skill's own cut/keep checklist (what content to remove/compress)
- A hard constraint: reword/collapse/relocate/delete-per-checklist only — never silently change what the doc/skill *does* (a policy, a default, a table's meaning), only how densely it's stated
- ⚠️ **A second, explicit constraint for numbers**: quote every number, count, version, and named quantity VERBATIM — never recompute, round, or "helpfully" continue an obvious-looking sequence. A drafter told to leave a section untouched still silently changed "8 steps (was 7)" to "9 steps (was 8)" — a fabricated fact that read as fully plausible in isolation and was NOT a deletion, so it didn't show up as a gap when scanning for missing content. State this as its own line in the prompt, not folded into the general "don't change what it does" constraint — a weak drafter treats prose-meaning and digit-accuracy as different tasks even when told once.
- Instruction to use `Write` for a full rewrite (not `Edit`), per the skill's own Hard Rules

⚠️ **A single-file condense has no other work to interleave, so "background" only pays off if you actually do something else — say a status line, check another file's byte count, or read the next candidate — before turning to Verify.** If you spawn the draft and immediately sit idle waiting on it, that's functionally foreground even with the right parameter; the value of background mode is real work happening concurrently, not just the tool call succeeding. Never poll (`ScheduleWakeup`/sleep) — the harness notifies on completion.

## Verify (you, not another Haiku call) — mandatory, never skip

Runs when the background draft's completion notification arrives. Haiku is weak at exactly this judgment, so a second Haiku pass would miss what the first one missed — the calling session (or a Sonnet+ agent) does this step itself.

⚠️ **Verify with `git diff`, never by re-reading the finished file.** A drafter given an explicit "never touch X" constraint still silently trimmed bullets from a protected section (MADR `Rejected` blocks) — the rewritten prose read as fully plausible on its own, and re-reading caught nothing. Only a line-by-line diff surfaces a silent drop, and it surfaces it immediately instead of requiring after-the-fact manual comparison against the original text.

1. Diff against the file's **pre-draft state** — `git diff HEAD -- <file>` only if it was clean when you started. ⚠️ **A dirty file makes HEAD the wrong baseline**, and the failure is asymmetric: someone else's uncommitted edits appear as `-` lines, reading exactly like the drafter rewrote a protected block. "Restoring" that is how you destroy the other writer's work while believing you caught a fabrication. Dirty file → snapshot it before the drafter runs (`cp`), or diff `git show :<file>` (staged) / `git show HEAD:<file>` (committed) against the version you actually handed the drafter. **Tell: a `-` line whose text you recognise as an edit made earlier in this session — that is the wrong baseline, not a drafter fabrication.**
2. Read every `-` line. For each rule, warning, table row, or behavioral instruction it carried, confirm the *same fact* — not just similar words — survives somewhere in the `+` lines.
3. ⚠️ **Check every changed number separately from checking dropped lines.** A diff hunk with a `-`/`+` pair (not a pure deletion) reads as "reworded" on a skim — the two lines look similar enough that a reader confirms the row still exists and moves on without comparing the digits themselves. For every `-`/`+` pair that contains a number, count, version, or named quantity, diff the numbers character-by-character, not the sentence shape. This is the failure mode a pure "did the fact survive" scan misses: the fact reads as present, just wrong.
4. Watch for scope creep: a "condensation" that changes what the file *does* (a policy, a default, a decision) rather than how densely it says it. This is a correctness bug, not a style nit.
5. Any dropped rule, changed number, or scope creep → fix directly. Don't re-run Haiku on the same file blind — either patch the specific gap yourself or restart that file's draft with the gap named explicitly.
6. Report both `wc -lc` deltas — ratio should drop or hold flat, never rise.
