---
name: read-summary
description: Read, find and understand task summary context before answering a question, investigating a bug, planning a deploy, or starting work in a project that uses tasks/**/current.md docs. Use at session start whenever the user references existing feature work, asks an investigative question about current system behavior ("why does X fail", "is Y still broken", "what's the status of Z"), asks what it takes to ship/deploy/release/go live ("if we deploy staging to production what do we need to do", "what's left before go-live", "is this ready to ship"), pastes a bug report or ClickUp ticket, or names a domain/feature that might have a task doc. Deploy and go-live questions are a PRIME trigger, not an edge case — the prerequisites, blockers, and env state live in task docs, never in the code. Trigger even when the user doesn't say "read summary" explicitly, and even when they name no feature — any request that could be answered wrong by skipping existing project context should go through this skill first.
---

# Read Summary

Read, find and understand task summary context. Run this **before** answering, investigating, or implementing anything in a project that keeps living docs at `tasks/<domain>/<feature>/current.md` — those docs carry decisions, gotchas, and vocabulary that isn't derivable from the code alone, and skipping them is how confident-but-wrong answers happen.

**Path Convention**: `tasks/<domain>/<feature>/current.md`
- Examples: `tasks/payment/gateway/current.md`, `tasks/tenant/rebate/current.md`

## Finding the Right Doc (when no path given)

⚠️ The request is usually a fuzzy task description, not a path. Folder names are engineer-domain-named and rarely match how you'd phrase the request (`upload-redesign` owns "QC delete child question"; `payout` owns "refund"). So **discover by content, not by folder name**:

1. **Search by content — delegate the raw gathering, keep ranking inline.** Spawn the `Explore` agent to list candidate docs and grep them for the *concept's vocabulary* — include synonyms ("child"→"sub-question", "QC"→"review/screening", "refund"→"payout"), searching doc **body + header**, never the folder name alone, including `_archive/` and flat `tasks/<domain>/<feature>.md`. Delegation rules (raw-not-ranked, the `rg` clause, the Bash fallback): `_shared/references/explore-delegation.md`.

   ```
   Agent({subagent_type: "Explore", run_in_background: false, prompt: "In tasks/, find every current.md (plus _archive/ and flat tasks/<domain>/<feature>.md) mentioning: payout, disbursement, settlement (synonyms of 'refund'). Use grep -rli and grep -rn (never rg — its -r means --replace, not recursive, and silently corrupts results). Return: matched file paths, matched lines with line numbers, and each candidate's header block (<!--LLM-CONTEXT...--> if present) + # Title + ## Overview. Do not rank or pick a winner — return all candidates raw."})
   ```

2. **Rank + disambiguate inline**, from the returned candidates: read the top 2-3 candidates' header block (`<!--LLM-CONTEXT...-->` if present — tolerate missing/varied headers) + `# Title` + `## Overview` (already fetched by Explore if delegated; Read them yourself if not). Follow any `Merged into`/`Supersedes`/`> 📖` redirect to the live doc. Treat index/hub docs (roadmap, `shared/`, `*-architecture`, parent `current.md`) as routers, not targets.

⚠️ **An empty result is a claim about your search, not about the tree.** Before concluding "no doc covers this", run a control that MUST hit (`grep -rl "current.md" tasks/ | head -1`). A wrong flag, a typo, or a gitignored `tasks/` dir all return a clean, confident, empty set.

A keyword match lands you in the right *folder*, not necessarily the right *bug* — so after the doc loads, restate the user's claim in your own words and confirm the doc addresses *that symptom*, not a nearby topic it happens to mention. And requests that arrive as chat transcripts often reveal their real claim only across several messages: if the central claim shifts (new symptom, a screenshot, or "this was fixed before and came back"), re-run discovery from step 1 rather than extending your first answer. A regression is its own investigation — find the prior fix and check what reverted, don't re-derive from scratch.

The same "re-run discovery" rule applies when the SCOPE changes, not just the claim: a doc already open from earlier in the session is not evidence it covers a different commit/file now in question. A multi-commit ship touching unrelated domains (a frontend feature + a standalone backend command) has multiple owning docs — checking the one already loaded and calling it done is the same miss as skipping discovery entirely.

### Doc-staleness handoff (don't just narrate it)

⚠️ Reading a doc is also **auditing** it. While loading context you will often catch the doc contradicting the code you just examined — a `Status:` that says "not done" for a feature that's built, a `Provider:`/dependency named that the code has since swapped, a `Key files` path that moved, a date-conditioned caveat now past. **Do NOT just mention the drift in passing and move on** — that drops the fix on the floor, the exact failure this skill exists to prevent. When you spot staleness:

1. **Name it explicitly** as a stale-doc finding (which doc, which line/field, what the code actually shows), separate from answering the user's question.
2. **Route it, don't fix it inline** — this skill is read-only. Hand off: project facts (status, provider, moved files, expired caveats) → tell the user to run the `task-summary` skill (update mode); a skill/command defect → the `update-plugin` skill. Confirm scope before writing.

Staleness you surface and route is closed; staleness you narrate and abandon is a silent regression waiting for the user to catch it re-reading later.

⚠️ **Treat any "diagnosis" for an open bug as a hypothesis, not a finding — confidence is the symptom, not the evidence.** Two shapes to catch, both making you (or an agent) confidently cite a wrong cause: (1) a live "OPEN BUG" row whose diagnosis a *different* doc has since RETRACTED — tells: the row prescribes a fix for a "decided" issue, or the behaviour has an accepted workflow around it documented in the owning doc; (2) a doc's stated root cause for a bug it *still* lists as open, uncontradicted by anything — tells: it prescribes a fix despite the bug being open (a decided fix implies a decided diagnosis), or its own `Last Session` admits writing it from the symptom. Either way: read the code path the doc blames before you change it. Expect the real cause to be adjacent but different in kind from what's written.

### What the doc is authoritative FOR (and what it isn't)

⚠️ **A task doc is authoritative for DECISIONS and GOTCHAS. It is NOT a live-state oracle.** Those decay the moment anyone touches a server:

| The doc IS authoritative for | The doc is NOT authoritative for |
|------------------------------|----------------------------------|
| Why it's built this way (ADRs, rejected options) | What's in prod's DB / `.env` / a bucket **right now** |
| What will bite you (gotchas, traps, invariants) | Whether a flag is on, a table exists, a row is populated |
| Vocabulary, ownership, blast radius | Whether a bug it calls "open" is still open |
| Why we picked/evaluated a third-party tool | **What that tool actually DOES** — its delete/write scope lives in its source, never in our summary of it |

A well-read doc feels *fully grounded* — the trap is answering a live-state question from a snapshot that may be weeks stale, with total confidence. **If the answer depends on the current state of a running system, go MEASURE it** (query the DB, read the server's config, call the API), then reconcile with the doc. A doc's claim about prod is a hypothesis to test, not evidence — when doc and live system disagree, the live system wins and the doc gets routed for update. This extends to three specific cases:

- **Running a researched tool** — a doc researching X ("what did we learn about X") does not license running it once the task shifts to "let's use X" and X writes/deletes/migrates. Its summary bullets (stack, license, install command) describe the box, not the delete paths inside. Read the tool's actual source and issue tracker for data-loss reports before the first destructive command — measuring the live system doesn't substitute, since you can profile every byte on disk and still not know what the tool removes. Tell: you can't name, from code you read, the exact paths the command touches.
- **Remote state from local absence** — never infer a REMOTE system's state from a LOCAL file's absence ("prod's `.env` has no `AWS_*`" describes wiring, not whether the bucket exists). Ask the remote system directly with a call that discriminates (`HeadBucket`: 403 = exists-but-denied vs 404 = absent).
- **"It's the staging/test one"** — a live-state CLAIM, not a property of the name; measure before recommending anything irreversible there. A doc saying "staging exists for e2e, flag is on" describes what the env was SET UP to be, never what it IS now. Test-ness lives in one value (API-key prefix, bucket name, DB name, `mode` field) — name it and read it from the running process (`printenv KEY` + a control that must resolve).

## Read Order

⚠️ **Reading the task doc is the MANDATORY FIRST ACTION whenever this skill applies** — even for a "quick check." Not done until you've read the matching `current.md` (+ `decisions/*.md` if split), every CLAUDE.md on the path to the files in play (step 5), and the sibling repo's CLAUDE.md/CLAUDE.local.md if the question touches it at all (step 6). First tool call = discovery or direct Read, never a query/edit/answer.

1. Read the resolved `current.md` (via discovery above, or the given path)
2. ⚠️ **MADR index check**: a thin index (`## Decisions Index` routing table → `decisions/*.md`) holds NO ADR content itself — reading only the index reads zero decisions. Open the specific `decisions/<theme>.md` file(s) matching what you're investigating; multiple themes → read all. These are part of THIS doc, not the generic `Related:` cross-domain list — don't conflate them.
   - ⚠️ **Routers NEST — a theme file can itself be a router, and the parent index usually doesn't say so.** A busy theme splits again (`decisions/<theme>.md` → `decisions/<theme>/<sub>.md` → `<theme>/<engine>/<leaf>.md`), but pointers ABOVE it aren't updated by the split (nothing 404s, so nothing signals). Landing on a file with only a Quick Start + `## Sub-Files` table is not "this theme is thin" — it's a router, and the ADRs are one level down. Never conclude a decision area is undocumented from a file with no `Problem`/`Decision`/`Rejected` blocks. `ls` the decisions tree once (`grep -rl "" --include='*.md' tasks/<domain>/<feature>/decisions/`) rather than trusting the index's file list, and descend until you hit real ADRs. Same applies to any `📖 <file>` pointer (LLM-CONTEXT `Gotchas:`, `Next Steps`) — pointing at a router is how a fact gets recorded yet never read.
3. ⚠️ **Read EVERY doc in `Related:`** (cross-domain), not just on-topic-sounding titles. Two docs split by *audience* (e.g. admin-QC vs student-runtime) can still describe *one* subsystem — a tangential-looking title can be the most load-bearing related doc. Only conclude "not relevant" after reading it, never from the title.
4. If Related mentions `tasks/shared/*.md`, read those too
5. **CLAUDE.md tree walk** — read every CLAUDE.md on the path to the files this task touches (root → layer → subdir → domain), auto-loaded additively by directory:
   - **Layer**: `app/CLAUDE.md` (backend) / `resources/js/CLAUDE.md` (frontend)
   - **Subdir**: e.g. `resources/js/routes/CLAUDE.md` — exists where a section split down a level; don't assume layer is deepest
   - **Domain**: `app/Domain/<Domain>/CLAUDE.md` (capitalized), inferred from task path
   - **Companion**: a `📖`/`> 📖` pointer inside a loaded CLAUDE.md/task doc to `.claude-companions/<shared|local>/CLAUDE-<topic>.md` at the repo root — these do NOT auto-load, so the tree-walk misses them. Follow the pointer when your task matches its named symptoms; the companion holds real facts the main file moved out to stay lean.
   - Plus any CLAUDE.md named in `Related:`
   - Discovery: `rg --files -g '**/CLAUDE.md'` scoped to the dirs in play
   - ⚠️ Scope to dirs actually in play (match blast radius, not repo size) — but this token-scoping is within-repo only, not licence to skip step 6.
6. ⚠️ **SIBLING REPO** — if the question touches a second repo at all, Read its `CLAUDE.md` + `CLAUDE.local.md` FIRST. Gated on the **question's scope, not which files you'll edit** — a read-only planning question edits nothing, so step 5's tree-walk never fires and this is the one most often skipped. The harness only walks the tree from the working dir, so a sibling's CLAUDE.md is invisible while the current repo's *did* auto-load — context feels complete when it isn't. Read root `CLAUDE.md` + `CLAUDE.local.md` (per-env state/credentials) + any relevant subdir CLAUDE.md before any claim about the sibling's env keys, buckets, containers, credentials, deploy mechanics, or server state. Its task docs live in its own `tasks/**` tree.

**Shared docs**: Check `Glob: tasks/shared/*.md` for cross-domain references if they exist.

---

## Intent Detection

Determine the type of the user's request. **Reading the doc (full Read Order) is unconditional and comes first for every intent.** The intent only decides what you do *after* the read — it never excuses skipping it:

- **Doc path** — matches `tasks/*/current.md`, a `domain/feature` slug, or a file path → Read the doc using the Read Order above, then **wait for the user's next instruction**. ⚠️ A path handed to you *alongside an action* ("here's the doc, now let's do X") is a doc path **plus** a task — the doc is the starting context, not the finish line. If X means running a third-party tool the doc merely researched, read that tool's source before the first destructive command (see the authoritative-for warning above).
- **Investigation / diagnostic** — a read-only question about current state: "is X paid by card?", "why did Y fail?", "check on production", "what's the status of Z?" (often with a screenshot). This is the easiest intent to mishandle: the question feels self-contained, so the temptation is to answer or query immediately. Don't. Infer the domain, run the full Read Order first, THEN investigate and answer.
  - **Multi-image / multi-message requests carry MORE claims, not fewer.** A request bundling several screenshots ("[Image #1]...[Image #4]") is rarely one symptom — each image is typically evidence for a distinct clause (a test result, a UI state, a data-linkage gap). Before answering, enumerate what each image is evidence *of*, not just what the text says: a request like "on our last E2E we did this [screenshot], but [screenshot] the account isn't even linked?" has at least two claims to reconcile (E2E outcome + the linkage gap), and the doc/code must address both, not just whichever is easier to confirm from the task doc alone.
  - **Exit gate.** The Read Order guards the *front* of an investigation; this guards the *exit*. Before sending a conclusion, state side-by-side the question the user asked and the question you actually answered. If they differ — you confirmed an easy adjacent fact instead of the hard thing asked — that's *attribute substitution* (e.g. confirming a field's *value* when the real question was *which field is authoritative*); re-open and answer the one asked. Your conclusion must reconcile **every** clause and number the user gave, not just one.
  - ⚠️ **Finding a defect is the deliverable — designing its fix is new work the user hasn't scoped.** An investigation that escalates ("this affects X too" → "the whole flow needs checking") is following real evidence, but each escalation grows what you'll hand back; keep converting findings into a plan and you end up asking approval for something never requested. Report the finding and its blast radius, then ask whether they want a fix designed. **Tell: your investigation is about to produce a plan, a migration list, or a work partition.**
- **Task description** — contains a bug report, feature request, ClickUp paste, chat transcript, or any actionable work description (not a path) → Read relevant context (infer domain from keywords, find matching `tasks/**/current.md`, load domain CLAUDE.md), then **proceed to implement the task**.

⚠️ **The read is not where delegation ends — if implementing/investigating needs an open-ended codebase search ("where does X live", "how does Y work"), that still routes through the project's `Explore`/`Plan` agent, never a bare `general-purpose` agent with a manual model override.** This skill only prescribes `Explore` for its own doc-discovery step (above) — the project's own CLAUDE.md is what mandates it for everything downstream, and it's easy to satisfy this skill's Read Order in full and then slip back to ad-hoc search once past it.

## After the Read: Plan Mode vs Normal Mode

The Read Order above is unconditional in both modes — what changes is what happens once the doc is loaded:

- **Normal mode**: once the doc(s) are read and the intent's follow-up action is clear, continue straight into it (answer, investigate, or implement) — no extra hand-off step.
- **Plan Mode**: after the read, judge whether the request still needs deeper exploration before a plan can be written. A narrow, well-covered question (the doc plus a quick code check fully answers it) can go straight to drafting the plan. A request that spans unfamiliar code, multiple domains, or where the task doc's `Key files` don't obviously cover the blast radius, should delegate to the `Explore` or `Plan` subagent for that deeper pass — reading one doc is not a substitute for exploring code you're about to plan changes against. Use judgment on which one: `Explore` for "where does X live / what calls Y", `Plan` for "design the implementation approach." Don't reflexively spawn a subagent for every Plan Mode request — only when the doc read leaves a real gap the plan can't be written without closing.
