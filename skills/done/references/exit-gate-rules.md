# Exit Gate: Verification Rules

Every row of the Output table is a claim that a step ran. Before writing it, verify each claim against what you ACTUALLY invoked this session.

## When Each Row Is Fillable

| Row | Only fillable if you actually... | Full-mode expectation |
|-----|----------------------------------|-----------------------|
| Simplify | spawned simplifier agent(s) **and gave them a simplifier prompt** | N simplifiers (N = the per-role count) |
| Review | spawned reviewer agent(s) **and gave them a code-review prompt** (bugs/security — NOT product gaps) | N reviewers |
| Product | spawned the product-reviewer agent **with a product prompt** — and every gap it surfaced that survived triage is asked as a question above, since the row itself no longer carries the gap text | exactly 1 |
| Knowledge | invoked `syafiqkit:update-claude-docs` **and confirmed the target CLAUDE.md changed** (not just launched the skill) | 1 skill call, edits landed |
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

**Then read the message you're about to send, from the top.** Is there anything the user has to decide, and is it the first thing they hit? A gap the product reviewer surfaced, that survived triage, and that the Output never asks about was dropped rather than resolved — and the Product row now reads `✅` on a change with an open question, which is the one shape this gate can't infer from the rows above.
