# Emission Shape and Agent Counts

## Emission Shape (Non-Negotiable)

All applicable agents go in **ONE assistant message**. No prose before the `Agent` calls — no count, no plan, no "spawning N agents now". Open with the first call and emit the rest back-to-back. Narration ends the message early; without it, there's nothing to stop after the first call. A serialized batch still completes, but an abandoned one does not.

**Where the harness asks for a line of approach before acting** (background jobs and status-tracked sessions), spend it on the message where you settle the partition above, never on the one carrying the calls. See `${CLAUDE_SKILL_DIR}/../_shared/references/explore-delegation.md` for why an otherwise-careful session walks into this one.

## Agent Count Scaling

Auto-scale by changed-file count; user arg overrides. Count changed files first (use the git variants in `git-variants-by-state.md`), then pick agents-per-role from this table:

| Changed files | Reviewers | Simplifiers | Product | TOTAL agents |
|---|---|---|---|---|
| ≤30 | 1 | 1 | 1 | **3** |
| 31–80 | 2 | 2 | 1 | **5** |
| 81+ | 3 (cap) | 3 (cap) | 1 | **7** |

The count is **PER ROLE**, and **ALL agents go in ONE tool-call block**. N reviewers means N reviewers AND N simplifiers, plus one product reviewer (never partitioned — it judges the whole feature).

## Partitioning by Write Authority

When count >1 per role, partition the file list across same-role agents by domain/directory — each agent gets a disjoint slice. Never hand every same-role agent the full list (duplicated review + conflicting edits on the same file).

⚠️ **The thing being partitioned is WRITE authority, not role membership, so a small diff needs the same care as a large one.** Simplifier and reviewer both carry `Edit`, so handing both the identical list races them on the same file — and a diff small enough to need only one of each is exactly where that reads as correct, since there is nothing to split by count. Reading is safe to overlap and usually desirable; writing is not. Give at most one agent write authority over any given file per fan-out: split the files between the two roles, or tell one role to report findings without editing.

A concurrent write is hard to diagnose after the fact, which is what makes it worth preventing rather than detecting. It surfaces as editor diagnostics against a half-written file — an undefined method, imports flagged unused — that are indistinguishable from real defects and gone by the time you look. It also breaks the obvious verification: a hash taken to check whether an agent's reported edit landed says nothing unless you know it predates that edit, and a report claiming a change while the file looks untouched invites exactly the wrong conclusion. The `git rev-parse HEAD` / `git status -sb` re-read after the fan-out does not catch this — both agents' work is in the tree and the status is clean. If you must overlap, record each file's hash BEFORE emitting and compare after all agents report, and treat any mid-run diagnostic on a shared file as noise until then.

## Prompting Each Agent

**All agents get:**
- The file slice this agent owns (full paths) — its partition, not the whole list when split
- For simplifier: focus on duplication removal, readability, pattern consistency
- For reviewer: focus on bugs, security, logic errors, project convention violations
- For product reviewer: name the **feature** built this session and its **task-doc path** (e.g. `tasks/admin/school-accounts/current.md`) so it reads the intent. It is NOT partitioned — it judges the whole feature's journey.

A slice plus a focus area buys a clean-looking pass — the agent reads what you handed it, finds it consistent, and says so. Three things turn that into a review worth its cost:

1. **The judgement call you are genuinely unsure about** — name it, including where your answer conflicts with an existing project rule, so the agent argues the case instead of restating the rule
2. **What you have already verified**, so a report doesn't hand your own findings back as corroboration
3. **What you did NOT check and want hunted** — this is highest-value and lives outside the slice (e.g., "this bug class may exist in sibling call sites, I haven't audited them")

⚠️ **An agent spawned with `name:` must be told to deliver its report via `SendMessage`, or the findings never arrive.** Naming a subagent makes it an addressable background teammate, and a teammate's plain-text final output is not returned to the caller — the completion notification carries the fact that it finished and none of what it found. The failure is silent and reads as success: every agent completes, every notification lands, and the reports are simply absent, so a run that reviewed nothing looks exactly like one that reviewed everything. It is also non-deterministic — six identically-spawned agents split one reporting unprompted against five not — so a run where the reports did arrive is no evidence the clause is unnecessary. Either add the clause to every named agent's prompt, or drop `name:` and let results return as ordinary tool results; naming is worth keeping when you need mid-flight addressability (correcting an agent, or claiming a file back before editing it).

> Project agents have a Bootstrap section — they read relevant CLAUDE.md files + the task doc themselves. Do NOT paste project conventions into the prompt.
