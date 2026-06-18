---
description: Read, find and understand task summary context. Use at session start to load existing feature documentation before continuing work.
argument-hint: "[domain/feature or full path to current.md]"
---

**Path Convention**: `tasks/<domain>/<feature>/current.md`
- Examples: `tasks/payment/gateway/current.md`, `tasks/tenant/rebate/current.md`

## Finding the Right Doc (when no path given)

⚠️ The arg is usually a fuzzy task description, not a path. Folder names are engineer-domain-named and rarely match how you'd phrase the request (`upload-redesign` owns "QC delete child question"; `payout` owns "refund"). So **discover by content, not by folder name**:

1. **Parallel, in one tool block**: `Glob tasks/**/*.md` (include `_archive/` and flat `tasks/<domain>/<feature>.md` — whole features live there, not just `current.md`) **AND** `Grep` those for the *concept's vocabulary* from the request — include synonyms ("child"→"sub-question", "QC"→"review/screening", "refund"→"payout"), searching doc **body + header**, never the folder name alone.
2. **Rank + disambiguate**: read the top 2-3 candidates' header block (`<!--LLM-CONTEXT...-->` if present — tolerate missing/varied headers) + `# Title` + `## Overview`. Follow any `Merged into`/`Supersedes`/`> 📖` redirect to the live doc. Treat index/hub docs (roadmap, `shared/`, `*-architecture`, parent `current.md`) as routers, not targets.

A keyword match lands you in the right *folder*, not necessarily the right *bug* — so after the doc loads, restate the user's claim in your own words and confirm the doc addresses *that symptom*, not a nearby topic it happens to mention. And requests that arrive as chat transcripts often reveal their real claim only across several messages: if the central claim shifts (new symptom, a screenshot, or "this was fixed before and came back"), re-run discovery from step 1 rather than extending your first answer. A regression is its own investigation — find the prior fix and check what reverted, don't re-derive from scratch.

<example>
Request: "set tak sync" → grep matches `combo-stock-desync` doc, which is about sync-mechanism RCs.
Later message: "set shows 0 but front/rear have stock, and this was fixed before."
The real claim is stock-field semantics + a regression — a different bug than the doc's sync RCs. Correct move: re-discover (the claim mutated), and treat "fixed before" as the lead — locate the prior fix first.
</example>

## Read Order

⚠️ **Reading the task doc is the MANDATORY FIRST ACTION of this command. If you have not read the matching `current.md` + domain CLAUDE.md, you have not run `/read-summary` — you've ignored it.** There is NO path through this command that answers, investigates, or implements without first completing the discovery and reading the doc. This holds even when you think you already know the answer, even for a one-line "quick check", even when the question seems too small to need context. The whole point of the command is that the docs carry decisions, gotchas, and vocabulary your prior knowledge does not — skipping the read defeats the command's only purpose. The first tool call after `/read-summary` fires must be the Glob/Grep discovery (or a direct Read if given a path), never a query, edit, or answer.

1. Read the resolved `current.md` (found via the discovery method above when no explicit path was given)
2. Check LLM-CONTEXT `Related:` field for linked docs
3. If Related mentions `tasks/shared/*.md`, read those too
4. **Domain CLAUDE.md** — infer the domain from the task path (`tasks/<domain>/...`) and check for `app/Domain/<Domain>/CLAUDE.md` (capitalize domain name: `payment` → `Payment`). If it exists, read it — contains gotchas and patterns that only load when working inside that domain directory.
   - Also read any CLAUDE.md files explicitly referenced in the `Related:` field (e.g., `app/Domain/Payment/CLAUDE.md`)
5. **GitNexus (mandatory if `.gitnexus/` exists)** — run in parallel with step 1:
   - `gitnexus_context({name: "<symbol>"})` on the 2-3 most critical symbols from `Key files` (e.g., main service class, controller) — shows callers, callees, process participation
   - `gitnexus_impact({target: "<symbol>", direction: "upstream"})` on symbols you expect to modify — shows blast radius
   - ⚠️ Do NOT use `gitnexus_query()` — requires `--embeddings` index (not enabled). Use `context()` + `impact()` instead (pure graph traversal)
   - ⚠️ Do NOT skip this even if you "already read the files" — file reads miss callers, process participation, and blast radius

**Shared docs**: Check `Glob: tasks/shared/*.md` for cross-domain references if they exist.

---

## Argument Detection

Determine the type of `$ARGUMENTS`. **Reading the doc (full Read Order) is unconditional and comes first for every intent.** The intent only decides what you do *after* the read — it never excuses skipping it:

- **Doc path** — matches `tasks/*/current.md`, a `domain/feature` slug, or a file path → Read the doc using the Read Order above, then **wait for the user's next instruction**.
- **Investigation / diagnostic** — a read-only question about current state: "is X paid by card?", "why did Y fail?", "check on production", "what's the status of Z?" (often with a screenshot). This is the easiest intent to mishandle: the question feels self-contained, so the temptation is to answer or query immediately. Don't. Infer the domain, run the full Read Order first, THEN investigate and answer.
  - **Exit gate.** The Read Order guards the *front* of an investigation; this guards the *exit*. Before sending a conclusion, state side-by-side the question the user asked and the question you actually answered. If they differ — you confirmed an easy adjacent fact instead of the hard thing asked — that's *attribute substitution*; re-open and answer the one asked. Your conclusion must reconcile **every** clause and number the user gave (a screenshot's figures, "front/rear have stock", "it regressed"), not just one. Answering part is not closure.

    <example>
    Asked: "why does the SET show 0 on the marketplace when front/rear have stock — and it was fixed before?"
    Answered: "the SET correctly synced 0." ← substitution: that's the *value* of one field, not *which field is authoritative* (`on_hand` vs `available_qty` vs `in_process`), and it ignores the regression. Gate fails on two clauses → keep investigating: find the prior fix, and reconcile the component-stock numbers against the field the combo calc actually reads.
    </example>
- **Task description** — contains a bug report, feature request, ClickUp paste, chat transcript, or any actionable work description (not a path) → Read relevant context (infer domain from keywords, find matching `tasks/**/current.md`, load domain CLAUDE.md, run GitNexus), then **proceed to implement the task**.

## Execute

$ARGUMENTS