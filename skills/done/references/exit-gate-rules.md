# Exit Gate: Verification Rules

Every row of the Output table is a claim that a step ran. Before writing it, verify each claim against what you ACTUALLY invoked this session.

## When Each Row Is Fillable

| Row | Only fillable if you actually... | Full-mode expectation |
|-----|----------------------------------|-----------------------|
| Simplify | spawned simplifier agent(s) **and gave them a simplifier prompt** | N simplifiers (N = the per-role count) |
| Review | spawned reviewer agent(s) **and gave them a code-review prompt** (bugs/security — NOT product gaps) | N reviewers |
| Product | spawned the product-reviewer agent **with a product prompt** — and every gap it surfaced that survived triage is asked as a question above, since the row itself no longer carries the gap text | exactly 1 |
| Knowledge | invoked `syafiqkit:update-claude-docs` **and confirmed the target CLAUDE.md changed** (not just launched the skill) — **and can say what the machine-local sweep returned**, since a team-visible write satisfies this row while the private half was never run | 1 skill call, edits landed, private sweep answered (a stated "nothing reached that a fresh session couldn't" counts) |
| Task docs | invoked `syafiqkit:task-summary` **and re-read the doc to confirm its `Last updated` + content actually changed** — invoking is not updating — **and measured the doc SET, with any overage either condensed this turn or stated as skipped in the Output** — measuring is not condensing | 1 skill call, doc verified changed, set measured |
| Plugin | invoked `syafiqkit:update-plugin` | Fires when **either** Step 5 gate does: a real skill signal (Gate A, usually absent) **or** this session having written to a skill/command/agent file (Gate B). Omit the row only when both were checked and neither fired. (Not-the-owner is NOT a reason to skip — the skill switches to upstream-report mode.) |

## Verification Methods

**For Knowledge/Task docs rows:**

```bash
git -C "$(git rev-parse --show-toplevel)" diff HEAD --stat -- <repo-relative-path>
```

An empty result is inconclusive (three causes return empty with exit 0; gitignored targets like `CLAUDE.local.md` never show in git output — grep them instead, see `${CLAUDE_SKILL_DIR}/../_shared/references/verifying-a-write-landed.md`).

In a non-git project that command errors, and the same reference's substitutes ARE the verification: re-read or grep each target.

**Substantiating a row that way is a filled row, not a skipped step.**

## Failed Agents

A row you cannot substantiate is a step you skipped — go run it before writing `✅`. If you spawned only ONE agent role, the step is half-run: spawn the missing role before proceeding.

An agent that returns FAILURE leaves its row unfillable — re-run it. On spawn/routing faults (an opus-pinned role 400ing with `effort 'max'`/`'xhigh' not supported`), re-dispatch on a different model tier instead of retrying the same way — then diff the generated `.claude/agents/<name>.md` against its `skills/agent-setup/templates/<name>.template.md`, since the fault is sometimes the generated file having silently drifted from an already-correct template rather than an inherent tier limitation; sync it instead of leaving the workaround as the permanent fix.

## Before Writing Output

**Is the last full test run green?** Any failure left in it, pre-existing or not, means go back and fix it: the code if it's wrong, the test if it's stale or clock- or order-dependent. The Output then names each fix and says which side it was on. A clean run on a subset, or a failure explained as "fails on master too", doesn't pass this check.

**Then read the message you're about to send, from the top.** Is there anything the user has to decide, and is it the first thing they hit? A gap the product reviewer surfaced, that survived triage, and that the Output never asks about was dropped rather than resolved — and the Product row now reads `✅` on a change with an open question, which is the one shape this gate can't infer from the rows above.

Measured 2026-08-28: a decision block was written and a sequencing plan stayed in the conversation, so the check was not run before Output.

## Red Suites and Interrupted Turns

⚠️ **A red test suite blocks the exit, whoever caused it.** A failure you proved pre-existing is still a failure, and fixing it is part of `/done`. A baseline run at HEAD tells you WHAT to fix (the code or an outdated test), never WHETHER to fix it. "Not caused by this diff" is a finding to state beside the fix, not a reason to stop at a report. Fix the code when it's wrong. Fix the test when it's stale or its fixture is date- or order-dependent. Where the right behaviour is a genuinely open product call, fix the test's determinism and record the product question. Measured 2026-09-29: a `/done` proved 7 billing failures pre-existing and wrote them up as not its concern, and the user had to ask for the fix. Keep the full runner output, never a `tail`: the failure names are what a fix needs, and dropping them costs a whole re-run. **Tell: your Output says a test fails "on master too" and no row says it was fixed.**

⚠️ **If new work arrived from the user while this skill was running, the wrap-up is the thing most likely to have been lost, and nothing will remind you.** A bug report mid-`/done` is real and urgent, so attending to it is right; what makes it costly is that fixing it produces its own endpoint (tests green, a screenshot) which then gets written up as the turn's conclusion, because at that moment it is the only outstanding thing in view. The steps still owed are not contradicted by anything, they are simply no longer present, having entered context before several rounds of file edits. Measured 2026-09-17: five interrupting reports landed during a `/done`; all five were fixed and verified, and the reply that followed carried no Knowledge, Task-docs or Plugin row and never mentioned `/done` had run. **Before writing Output, ask whether this turn was interrupted; if it was, resume at the step you left and re-read this file rather than recalling it.** 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/one-turn-chain.md` for the involuntary-severance cases and why an honest summary of the remaining step still evades every guard.
