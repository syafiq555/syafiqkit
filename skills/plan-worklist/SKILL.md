---
name: plan-worklist
description: A pre-scoped list of work items already exists — findings from a read-summary/investigation pass, a pasted backlog or ClickUp list, a brainstormed todo list — and the user wants it turned into a build plan before anyone writes code. Dispatch product-reviewer to judge each item against the product's intent (task doc) and size/sequence them, then present the plan and stop. Triggers on "let's do these", "use product reviewer to see it first", "scope this list", "plan these out", "which of these should we build first", said against an existing list — not a single vague idea. Do NOT use for a vague "let's continue" against one doc with no list in hand (that's `tackle`), for exploring a single new feature with multiple design approaches (that's `brainstorming`), or for reviewing code that was just built (that's `done`, which dispatches product-reviewer post-build instead of pre-build).
---

# Plan Worklist

Turn an already-identified list of items into a scoped plan, without building anything yet.

## When this applies

The list has to already exist — pasted findings, a backlog, a ClickUp export, todos surfaced earlier in the conversation. If there's no list yet, just one idea to explore, that's `brainstorming`'s job, not this one. If the user is continuing a doc with no explicit scoping ask, that's `tackle`.

## What to do

1. **Load the product's task-doc context** if it isn't already loaded — via `read-summary`, scoped to whatever domain/project the list belongs to. `product-reviewer` needs the doc's stated intent to tell a deliberate scope-cut from a real gap, so skipping this makes its judgment worthless.

2. **Dispatch `product-reviewer`** against the list. If the target project has it set up as a project agent (`.claude/agents/product-reviewer.md`), use that; if not, say so and point at `agent-setup` rather than improvising a substitute review. Give it every item verbatim plus the task-doc context — its job is to judge each against product intent, size it, flag sequencing/dependency between items, and frame each as a build-or-skip decision. It's read-only by design; it will not write code, and that's the point of choosing it here. While it runs, don't size or sequence the list yourself — judging the items IS the job you delegated, so a parallel pass costs the same reading twice and turns its report into an echo you can no longer check independently. 📖 `../_shared/references/explore-delegation.md`

Check what it spawned before trusting what it returns. `product-reviewer` holds the `Agent` tool, and a reviewer handed a long list will sometimes dispatch a second `product-reviewer` carrying the same brief rather than partitioning retrieval — the tell is a child whose task description restates the parent's instead of naming a slice of it. What comes back is then a relay: correctly shaped, and stripped of whatever verification you asked for, since your clauses reached the child only as the parent's paraphrase. Re-dispatch with the constraint stated rather than accepting the report. 📖 `../_shared/references/agent-may-not-redelegate.md`

3. **Present the plan it returns.** The natural default is to stop here — the user asked to see it "first," and `product-reviewer`'s whole design is read-only-plan-out. Say as much plainly ("this is the plan; say the word to build") rather than silently sliding into implementation. That said, this is a judgment call, not a hard gate: if the user's own phrasing already bundled "plan and build these" in one breath, building through in the same turn is the reasonable read of what they asked for — the skill exists to prevent an unscoped list turning into unscoped code, not to force an extra round-trip when the user was explicit.

4. **Hand off to build** once the user is ready — `tackle` (if the plan lives against one doc and the user wants to keep working it) or direct implementation, whichever fits what the plan produced.

## Why product-reviewer specifically

It's the one agent in this plugin that's read-only and plan-producing by construction — findings come back framed as "build or skip," never as an auto-fix. That shape is exactly what a pre-build scoping pass needs: something that can judge a list of items against product intent without the temptation to just start writing code along the way.
