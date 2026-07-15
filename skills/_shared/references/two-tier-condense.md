# Two-Tier Condense — Shared Execution Model

Referenced by skills that condense/densify existing files (update-plugin's Step 3a, condense-task-doc, condense-claude-md). Defines HOW to execute a condensation once you know WHAT to cut — each skill's own checklist stays skill-specific; this governs the draft/verify split.

## Why two-tier

Sentence-level condensation ("is this restatement or a distinct rule?") is a judgment call, not pattern-matching. A weak drafter can silently turn a real rule into nothing while producing prose that reads perfectly plausible — the failure is invisible without a diff-level check by a stronger reader. Splitting draft (cheap, fast) from verify (accurate) gets both properties instead of trading one for the other.

## Draft (Haiku, background)

Spawn an `Agent` with `model: "haiku"`. Do NOT pass `run_in_background: false` — agents run in the background by default, and setting `false` forces a synchronous wait, which is exactly what this step must avoid. Multiple files → spawn all in one message so they draft concurrently. Give the drafter:
- The skill's own cut/keep checklist (what content to remove/compress)
- A hard constraint: reword/collapse/relocate/delete-per-checklist only — never silently change what the doc/skill *does* (a policy, a default, a table's meaning), only how densely it's stated
- Instruction to use `Write` for a full rewrite (not `Edit`), per the skill's own Hard Rules

⚠️ **A single-file condense has no other work to interleave, so "background" only pays off if you actually do something else — say a status line, check another file's byte count, or read the next candidate — before turning to Verify.** If you spawn the draft and immediately sit idle waiting on it, that's functionally foreground even with the right parameter; the value of background mode is real work happening concurrently, not just the tool call succeeding. Never poll (`ScheduleWakeup`/sleep) — the harness notifies on completion.

## Verify (you, not another Haiku call) — mandatory, never skip

Runs when the background draft's completion notification arrives. Haiku is weak at exactly this judgment, so a second Haiku pass would miss what the first one missed — the calling session (or a Sonnet+ agent) does this step itself.

⚠️ **Verify with `git diff`, never by re-reading the finished file.** A drafter given an explicit "never touch X" constraint still silently trimmed bullets from a protected section (MADR `Rejected` blocks) — the rewritten prose read as fully plausible on its own, and re-reading caught nothing. Only a line-by-line diff surfaces a silent drop, and it surfaces it immediately instead of requiring after-the-fact manual comparison against the original text.

1. `git diff HEAD -- <file>` (or against the pre-draft snapshot if the file was already dirty).
2. Read every `-` line. For each rule, warning, table row, or behavioral instruction it carried, confirm the *same fact* — not just similar words — survives somewhere in the `+` lines.
3. Watch for scope creep: a "condensation" that changes what the file *does* (a policy, a default, a decision) rather than how densely it says it. This is a correctness bug, not a style nit.
4. Any dropped rule or scope creep → fix directly. Don't re-run Haiku on the same file blind — either patch the specific gap yourself or restart that file's draft with the gap named explicitly.
5. Report both `wc -lc` deltas — ratio should drop or hold flat, never rise.
