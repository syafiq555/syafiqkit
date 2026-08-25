---
name: read-summary
description: Read task summary context and project instructions before answering investigative questions, implementing work, or starting a new domain within a session. When a request about current system behavior, a deploy question, a bug report, or an unfamiliar domain is asked, this skill finds and reads the right docs first — decisions and gotchas live there, not in the code alone, so skipping them is how confident-but-wrong answers happen.
---

# Read Summary

Task docs carry decisions and gotchas that aren't derivable from the code alone. Reading them before investigating or implementing prevents confident-but-wrong answers grounded in incomplete information.

When scope changes — a new domain enters mid-conversation, a second repo touches the question, or work spans multiple files — reread the docs relevant to that new scope before proceeding. The docs you loaded at session start are scoped to their domain; a domain shift needs its own discovery.

Before writing to a doc, one `ListAgents` call shows whether another session is live and might be editing the same `current.md`. Presence alone doesn't say which checkout they're in, so it narrows the question rather than settling it — 📖 `../_shared/references/cross-session-messaging.md` covers what a peer's presence does and doesn't tell you.

---

## Discovery: Finding the Right Doc {#finding-docs}

Folder names are domain-scoped and rarely match how a user phrases a request — `payout` might own "refund" work, `upload-redesign` might own "QC delete child question." Discover by content using the Explore agent to search doc bodies and headers across `tasks/`. The agent's report delivers raw hits only — file paths and matched lines — never a ranked judgment. Your job is the judgment: skim the top hits until you're confident you've found the right topic, then read the full doc.

The mechanical parts of discovery — grep setup, search retries, recursion — run in the agent's context and stay there. This split (gathering vs. judgment) is what makes delegating safe, and it only works if both halves stay separate; see the Agents section below for what to do while it runs.

Once a doc lands, restate the user's claim and confirm the doc actually addresses that symptom, not a nearby topic mentioned in passing. An empty search result is usually a search error (bad flag, typo, gitignored dir), not a missing doc — before concluding no doc exists, search for something you know is there and confirm you find it.

⚠️ **A matched line that answers your question is the strongest reason to open its file, and it reads as the reason you no longer need to.** A hit arrives already shaped like a finding — it names the entity you asked about and states something true — so the search feels concluded rather than started, and the file goes unopened while its own conclusion is that you read it. What the surrounding page holds is the part that changes your reading: the prior occurrence that makes this the second one, the procedure someone already worked out, the instruction to check the whole platform rather than the one case you asked about. Each of those is invisible from the matched line and each reframes it. The tell is a grep whose output you then reasoned from — treat every file the search named as unread until you have opened it, and note that this fires hardest on a hit you were not looking for, since an unexpected match gets classified as a coincidence and dismissed rather than followed.

When a claim shifts mid-conversation, start a fresh discovery pass rather than pivoting within prior findings — a regression investigation in particular starts fresh, since the doc that explained the original behaviour rarely owns the reason it broke.

---

## Reading Order & Authority {#read-order}

Follow every pointer you encounter in sequence. Each layer — task docs, decisions, CLAUDE.md files, sibling repos, journal — holds facts the previous one didn't reach, so skipping or reordering has a cost.

**Pointer chain (in sequence):**

- Task doc (`current.md`) — if explicitly redirected (Merged into, Supersedes, top-level pointer), follow to the live doc.
- Decisions and related files — follow `📖` pointers to external files and `Related:` sections.
- CLAUDE.md files — auto-load additively by directory: root, layer, domain, subdir; also check for `.claude/rules/*.md` (loaded every session, not discovered by walk). Check `/context` to see what actually loaded rather than reasoning about what should have.
- Sibling repos — if the question spans repos, read their `CLAUDE.md` and `CLAUDE.local.md`.
- Private journal — grep `~/.claude/notes/` when the answer hinges on interpersonal or commercial context not in code or docs.

⚠️ **Companion files are discovered by following pointers, not by search.** Grep results omit `📖` references and external files — when you encounter a pointer to `.claude-companions/` or a reference folder, verify the path with `ls` before trusting it. The resolved file is authoritative; a broken pointer or typo reads silently as a missing fact.

⚠️ **A doc header or tech mention in shorthand is not the same as its architecture.** "React" in a header might mean the library, an SDK, or one layer of a larger stack — the *surface* of the technology the project actually uses. Stopping at the shorthand leaves you wrong about the layer. When a doc's architecture matters to your next step, read past the tables to the prose, and confirm against something on disk — an installed package, a config file, a type definition — before building on it.

---

## What Task Docs Are and Aren't {#doc-authority}

Task docs are authoritative for **decisions and gotchas** — why the code works this way, what will bite you, rejected alternatives. They are **not** live-state oracles; anything about a running system (prod's DB, a flag, whether an "open" bug is still open) decays the moment anyone touches a server. If the answer depends on current state, go measure it — and where doc and live system disagree, the live system wins.

**Three authority boundaries matter:**

- **Schema vocabulary doesn't decay** — column names, enum values, table shapes, and header names stay stable. Before querying a table, read its column names from the docs.

- **Claims about external APIs are neither decided fact nor live-state.** "The vendor requires X" is a claim about someone else's system. Nothing updates it when the vendor changes, and its cost is distinctive: a false constraint makes the correct fix look unavailable. When an external API claim rules out an approach, spend the one call to check it before believing it, and correct the doc afterwards.

- **Claims about your own code that are blocking-shaped matter most.** "This is impossible", "this must come first", or "we have no way to do this" reorder work and produce no failure to notice — only a plan bent around them. Read the code a blocker rests on before planning around it. Where a blocker is true for one case and false for another, say which — a blocker narrowed is more useful than one deleted.

**A doc that records both what someone ASKED FOR and what a session CONCLUDED can misdirect.** Both are decisions, so both read as authoritative — but a conclusion that resolved one premise is often written as though it settled the whole request, and it is the later, narrower sentence a reader scopes from. So when a doc contains both, scope from the ask and treat the conclusion as one input to re-check, particularly where the conclusion's stated reason resolved a *premise* (a cost, a constraint, a feasibility question) rather than the request itself. **Tell: the sentence you are scoping from begins "the work is therefore".**

Reading a doc is also auditing it. Sweep the fields written once and checked least — `Quick Start`, `Status:`, `Immediate next actions` — since those carry the costliest staleness, and route what you find in the same turn to the `task-summary` skill (project facts) or `update-plugin` (skill defects). An offer parked on the user's reply isn't routing: they act on your answer, often never respond, and the finding dies with the conversation.

📖 `../read-summary/references/doc-authority.md` — edge cases and troubleshooting when a doc's claim contradicts live state, when external-system claims go stale, and how to handle blockers that are true for some paths and false for others.

---

## After Reading Docs {#what-comes-next}

Once the docs are read, three patterns determine what happens next:

- **Doc path only** — user supplied a path to a doc or named a domain without an action → you've read the docs; stop here. If they ask you to "now do X", the doc is context for work, not the endpoint. If X involves a tool the doc merely researched, read that tool's own source before running it.

- **Investigation** — a question about current state → read docs first, then investigate. When a user shows you screenshots or images as evidence of a problem, identify what each one is evidence *of* before answering. Before you send your conclusion, verify you answered the question the user asked, not an adjacent one. A finished investigation that found defects: report the finding and blast radius, then stop. Deciding which findings matter and when to fix them is the user's call.

- **Task description** — a bug report, feature request, or work description → read the relevant docs (infer domain from keywords), then proceed to implement.

---

## Plan Mode {#plan-mode}

After reading docs, if the next step is clear (answer a question, investigate, implement), proceed. If the approach isn't yet clear — you need to know where a surface lives in the codebase or how to design a solution — delegate that search before proposing. Use `Explore` for "where does X live" and `Plan` for "how should I build this."

A doc's silence about something doesn't mean it's incomplete; it means nobody's needed that path yet. The absence of a doc entry isn't a blocker for design — it means you're in genuinely new territory, which is fine. Delegate only when exploration answers a question your design depends on.

---

## Decision-First on Every Turn After {#decision-first}

This skill runs at the start of most sessions, establishing a rule that carries forward into every turn: **any turn that ends on a question states the decision needed before the report.** A build incomplete, a next step you don't own, two paths open with one for the user to pick — all need a decision frame. This isn't a separate wrapper; it's part of your answer shape. The decision tells them what's actually unresolved; the report shows them what you've built.

The same rule applies to the wrap-up skills (`done`, `quick-done`, `ship`) on their final turns — don't end on pending questions without naming them.

**Decision shapes** — not every question mark is a real decision point. When multiple paths are open:
- **One path** — name it, and explain why it's the one. "We should X because Y" is a complete decision.
- **Several paths** — list them with a trade-off ("X costs time, Y costs money, Z is reversible"), then either pick the best-fit (if the trade-off points one way) or state which dimension the user should decide on.
- **A missing fact** — if the decision hinges on something unmeasured, say what to measure and how it would change the decision.

📖 `../_shared/references/decision-first-output.md` — the full test logic for when a question-mark ending does or doesn't require a decision frame.

---

## Agents

For doc discovery, dispatch the `Explore` agent to search task docs by content. The agent returns raw hits; your judgment ranks them and picks the right doc. While the agent runs, do other work or think — don't re-read or re-grep the same files yourself. That duplication costs context for a fact you'll see again in the agent's report, and the check that makes delegation safe is verification *after* the report, not before.

One clause belongs in the prompt itself, since it isn't derivable from the agent's side: tell it to batch its searches into few calls instead of one per pattern. 📖 `../_shared/references/explore-delegation.md` has the rest of the mechanics, including what separates delegable gathering from judgment you keep.

For implementing work after docs are read, the project's CLAUDE.md determines whether to use `Explore` (locating code), `Plan` (designing an approach), or work inline. This skill prescribes only the agent for its own discovery step.

**Generated agents can drift from their templates.** An agent's `.md` file holds only what its template had on generation day — if the template gained a safety constraint or a tool permission since then, the agent won't have it. Dispatching a stale agent looks normal (returns a report just fine) but may violate a safety rule or skip a check. The first time a session dispatches a project agent, validate the safety-critical constraints. 📖 `references/validating-generated-agents.md` has the checks.
