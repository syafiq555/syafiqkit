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

⚠️ **Lexical match ≠ semantic match.** Grepping the request's vocabulary lands you in the right *folder*, not necessarily the right *bug*. "Set tak sync" and "set shows 0 but components have stock" hit the same doc but are different problems (sync mechanism vs. stock-field semantics). After the doc loads, restate the user's claim in your own words and confirm the doc's content actually addresses *that symptom* — not a nearby technical topic the doc happens to cover.

⚠️ **Re-discover when the request mutates.** Requests arriving as chat transcripts / forwarded threads often dribble in their real claim across several messages. If the central claim shifts after you've started (new symptom, a screenshot, or "this was fixed before and came back"), re-run discovery from step 1 — do NOT extend your original answer. A regression of a previously-fixed bug is a different investigation: find the *prior fix* and check what regressed, don't re-derive from scratch.

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
  - ⚠️ **Exit gate — before you conclude, not just before you query.** The Read Order guards the *front* of the investigation; this guards the *exit*. A confident answer to a *nearby* question is the classic failure (you queried thoroughly, the data was clean, but you answered the technical question you could close cleanly — not the one asked). Before sending a conclusion, check it against the user's *literal* claim:
    - Does it address the exact symptom in their words, or a subsystem you found easier to reason about? (e.g. they asked "why does the SET show 0 when front/rear have stock" — answering "the SET correctly synced 0" misses the *field-semantics* question: which qty field feeds the calc — `on_hand` vs `available_qty` vs `in_process`.)
    - If they said it "regressed" / "was fixed before", did you find the prior fix and confirm what broke — or re-derive from zero?
    - If a screenshot shows specific numbers, does your explanation reconcile *those* numbers, or numbers from a different field/store/listing?
    - If any answer is "no", keep investigating — do not ship the partial conclusion.
- **Task description** — contains a bug report, feature request, ClickUp paste, chat transcript, or any actionable work description (not a path) → Read relevant context (infer domain from keywords, find matching `tasks/**/current.md`, load domain CLAUDE.md, run GitNexus), then **proceed to implement the task**.

## Execute

$ARGUMENTS