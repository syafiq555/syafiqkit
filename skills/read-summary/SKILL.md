---
name: read-summary
description: Read, find and understand task summary context before answering a question, investigating a bug, or starting work in a project that uses tasks/**/current.md docs. Use at session start whenever the user references existing feature work, asks an investigative question about current system behavior ("why does X fail", "is Y still broken", "what's the status of Z"), pastes a bug report or ClickUp ticket, or names a domain/feature that might have a task doc. Trigger even when the user doesn't say "read summary" explicitly — any request that could be answered wrong by skipping existing project context should go through this skill first.
---

# Read Summary

Read, find and understand task summary context. Run this **before** answering, investigating, or implementing anything in a project that keeps living docs at `tasks/<domain>/<feature>/current.md` — those docs carry decisions, gotchas, and vocabulary that isn't derivable from the code alone, and skipping them is how confident-but-wrong answers happen.

**Path Convention**: `tasks/<domain>/<feature>/current.md`
- Examples: `tasks/payment/gateway/current.md`, `tasks/tenant/rebate/current.md`

## Finding the Right Doc (when no path given)

⚠️ The request is usually a fuzzy task description, not a path. Folder names are engineer-domain-named and rarely match how you'd phrase the request (`upload-redesign` owns "QC delete child question"; `payout` owns "refund"). So **discover by content, not by folder name**:

1. **Parallel, in one tool block**: `Glob tasks/**/*.md` (include `_archive/` and flat `tasks/<domain>/<feature>.md` — whole features live there, not just `current.md`) **AND** `Grep` those for the *concept's vocabulary* from the request — include synonyms ("child"→"sub-question", "QC"→"review/screening", "refund"→"payout"), searching doc **body + header**, never the folder name alone.
2. **Rank + disambiguate**: read the top 2-3 candidates' header block (`<!--LLM-CONTEXT...-->` if present — tolerate missing/varied headers) + `# Title` + `## Overview`. Follow any `Merged into`/`Supersedes`/`> 📖` redirect to the live doc. Treat index/hub docs (roadmap, `shared/`, `*-architecture`, parent `current.md`) as routers, not targets.

A keyword match lands you in the right *folder*, not necessarily the right *bug* — so after the doc loads, restate the user's claim in your own words and confirm the doc addresses *that symptom*, not a nearby topic it happens to mention. And requests that arrive as chat transcripts often reveal their real claim only across several messages: if the central claim shifts (new symptom, a screenshot, or "this was fixed before and came back"), re-run discovery from step 1 rather than extending your first answer. A regression is its own investigation — find the prior fix and check what reverted, don't re-derive from scratch.

### Doc-staleness handoff (don't just narrate it)

⚠️ Reading a doc is also **auditing** it. While loading context you will often catch the doc contradicting the code you just examined — a `Status:` that says "not done" for a feature that's built, a `Provider:`/dependency named that the code has since swapped, a `Key files` path that moved, a date-conditioned caveat now past. **Do NOT just mention the drift in passing and move on** — that drops the fix on the floor, the exact failure this skill exists to prevent. When you spot staleness:

1. **Name it explicitly** as a stale-doc finding (which doc, which line/field, what the code actually shows), separate from answering the user's question.
2. **Route it, don't fix it inline** — this skill is read-only. Hand off: project facts (status, provider, moved files, expired caveats) → tell the user to run the `task-summary` skill (update mode); a skill/command defect → the `update-plugin` skill. Confirm scope before writing.

Staleness you surface and route is closed; staleness you narrate and abandon is a silent regression waiting for the user to catch it re-reading later.

## Read Order

⚠️ **Reading the task doc is the MANDATORY FIRST ACTION whenever this skill applies — even for a "quick check" you think you already know the answer to.** If you have not read the matching `current.md` (+ its `decisions/*.md` files, if it's a split index) + every CLAUDE.md on the path to the files in play (layer, subdir, domain — see step 5), you have not run this skill. The first tool call must be the Glob/Grep discovery (or a direct Read if given a path), never a query, edit, or answer — the docs carry decisions, gotchas, and vocabulary your prior knowledge doesn't.

1. Read the resolved `current.md` (found via the discovery method above when no explicit path was given)
2. ⚠️ **Whole-doc MADR index check**: if `current.md` is a thin index (routing table under `## Decisions Index`/similar, pointing at `decisions/*.md`), it holds NO ADR content itself — reading only the index and stopping is reading zero decisions. Open the specific `decisions/<theme>.md` file(s) whose routing-table question matches what you're investigating; if the request spans multiple themes, read all of them. Don't rely on the generic `Related:` field for this — a split doc's own `decisions/*.md` files are part of THIS doc, not a cross-domain reference, and get buried among the 5-10 genuinely-external docs `Related:` usually lists.
3. Check LLM-CONTEXT `Related:` field for OTHER linked docs (cross-domain, not this doc's own `decisions/*.md`)
4. If Related mentions `tasks/shared/*.md`, read those too
5. **CLAUDE.md tree walk** — read EVERY `CLAUDE.md` on the path to the files this task touches, not just the backend domain one. The harness auto-loads them additively by directory (root → layer → subdir), and discovery must mirror that or you load zero context for a frontend task (there's no `app/Domain/` for it). For each dir you'll edit, walk up reading any `CLAUDE.md` found:
   - **Layer**: `app/CLAUDE.md` (backend) or `resources/js/CLAUDE.md` (frontend)
   - **Subdir**: a `CLAUDE.md` inside the specific dir (e.g. `resources/js/routes/CLAUDE.md`) — these exist where a section was split down a level; don't assume the layer file is the deepest
   - **Backend domain**: `app/Domain/<Domain>/CLAUDE.md` (capitalize: `payment` → `Payment`), inferred from the task path
   - Also read any CLAUDE.md explicitly named in the `Related:` field
   - Quick discovery when unsure which exist: `rg --files -g '**/CLAUDE.md'` scoped to the dirs in play
   - ⚠️ **Scope to the dirs actually in play, not the whole tree.** "Every CLAUDE.md on the path" means the layer + subdir + domain files for the specific files this task touches — not a blanket read of every CLAUDE.md in the repo. If the task doc's `Key files` only name backend paths, don't also pull `resources/js/CLAUDE.md`; if a domain isn't implicated, don't pull its `app/Domain/*/CLAUDE.md`. Coverage should match the blast radius of the task, not the size of the repo — reading an irrelevant layer file burns tokens without adding signal.
6. **GitNexus (mandatory if `.gitnexus/` exists)** — run in parallel with step 1:
   - `gitnexus_context({name: "<symbol>"})` on the 2-3 most critical symbols from `Key files` (e.g., main service class, controller) — shows callers, callees, process participation
   - `gitnexus_impact({target: "<symbol>", direction: "upstream"})` on symbols you expect to modify — shows blast radius
   - ⚠️ Do NOT use `gitnexus_query()` — requires `--embeddings` index (not enabled). Use `context()` + `impact()` instead (pure graph traversal)
   - ⚠️ Do NOT skip this even if you "already read the files" — file reads miss callers, process participation, and blast radius

**Shared docs**: Check `Glob: tasks/shared/*.md` for cross-domain references if they exist.

---

## Intent Detection

Determine the type of the user's request. **Reading the doc (full Read Order) is unconditional and comes first for every intent.** The intent only decides what you do *after* the read — it never excuses skipping it:

- **Doc path** — matches `tasks/*/current.md`, a `domain/feature` slug, or a file path → Read the doc using the Read Order above, then **wait for the user's next instruction**.
- **Investigation / diagnostic** — a read-only question about current state: "is X paid by card?", "why did Y fail?", "check on production", "what's the status of Z?" (often with a screenshot). This is the easiest intent to mishandle: the question feels self-contained, so the temptation is to answer or query immediately. Don't. Infer the domain, run the full Read Order first, THEN investigate and answer.
  - **Multi-image / multi-message requests carry MORE claims, not fewer.** A request bundling several screenshots ("[Image #1]...[Image #4]") is rarely one symptom — each image is typically evidence for a distinct clause (a test result, a UI state, a data-linkage gap). Before answering, enumerate what each image is evidence *of*, not just what the text says: a request like "on our last E2E we did this [screenshot], but [screenshot] the account isn't even linked?" has at least two claims to reconcile (E2E outcome + the linkage gap), and the doc/code must address both, not just whichever is easier to confirm from the task doc alone.
  - **Exit gate.** The Read Order guards the *front* of an investigation; this guards the *exit*. Before sending a conclusion, state side-by-side the question the user asked and the question you actually answered. If they differ — you confirmed an easy adjacent fact instead of the hard thing asked — that's *attribute substitution* (e.g. confirming a field's *value* when the real question was *which field is authoritative*); re-open and answer the one asked. Your conclusion must reconcile **every** clause and number the user gave, not just one.
- **Task description** — contains a bug report, feature request, ClickUp paste, chat transcript, or any actionable work description (not a path) → Read relevant context (infer domain from keywords, find matching `tasks/**/current.md`, load domain CLAUDE.md, run GitNexus), then **proceed to implement the task**.

## After the Read: Plan Mode vs Normal Mode

The Read Order above is unconditional in both modes — what changes is what happens once the doc is loaded:

- **Normal mode**: once the doc(s) are read and the intent's follow-up action is clear, continue straight into it (answer, investigate, or implement) — no extra hand-off step.
- **Plan Mode**: after the read, judge whether the request still needs deeper exploration before a plan can be written. A narrow, well-covered question (the doc plus a quick code check fully answers it) can go straight to drafting the plan. A request that spans unfamiliar code, multiple domains, or where the task doc's `Key files` don't obviously cover the blast radius, should delegate to the `Explore` or `Plan` subagent for that deeper pass — reading one doc is not a substitute for exploring code you're about to plan changes against. Use judgment on which one: `Explore` for "where does X live / what calls Y", `Plan` for "design the implementation approach." Don't reflexively spawn a subagent for every Plan Mode request — only when the doc read leaves a real gap the plan can't be written without closing.
