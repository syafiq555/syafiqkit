---
name: read-summary
description: Read task summary context and project instructions before answering investigative questions, implementing work, or starting a new domain within a session. When a request about current system behavior, a deploy question, a bug report, or an unfamiliar domain is asked, this skill finds and reads the right docs first — decisions and gotchas live there, not in the code alone, so skipping them is how confident-but-wrong answers happen.
---

# Read Summary

Task docs at `tasks/<domain>/<feature>/current.md` carry decisions and gotchas that aren't derivable from the code alone. Reading them before investigating or implementing prevents confident-but-wrong answers grounded in incomplete information.

When scope changes — a new domain enters mid-conversation, a second repo touches the question, or work spans multiple files — reread the docs relevant to that new scope before proceeding. The docs you loaded at session start are scoped to their domain; a domain shift needs its own discovery.

Before writing to a doc, check for concurrent sessions via `ListAgents` — another session may be editing the same `current.md`, and discovering that costs little. `../_shared/references/cross-session-messaging.md` covers what a session's presence does and doesn't mean.

**Path Convention**: `tasks/<domain>/<feature>/current.md` (examples: `tasks/payment/gateway/current.md`, `tasks/tenant/rebate/current.md`)

---

## Finding the Right Doc {#finding-docs}

Folder names are domain-scoped and rarely match how a user phrases a request — `payout` might own "refund" work, `upload-redesign` might own "QC delete child question." Discover by content, using the Explore agent to search doc bodies and headers (including synonyms) across `tasks/`, `_archive/`, and flat `tasks/<domain>/<feature>.md` files.

Once that agent is dispatched, don't re-read or re-grep the same files inline while it runs — that pays for the same facts twice and the agent's own report lands later and longer anyway. The pull to re-read feels like making progress; it isn't, and the tell is that your calls cover the scope you just assigned rather than that they feel redundant. Wait for the completion notification, then verify the report's claims against the source — that check is what shadowing destroys, since a fact you derived in parallel reads as corroboration when the report restates it while confirming nothing.

Skim the top hits (header + title + overview) until you're confident you've found the right doc — surface-level similarity often masks unrelated subsystems. Follow redirects (`Merged into`, `Supersedes`, `> 📖` pointers) to the live doc, and treat hub docs (roadmap, `shared/`, `*-architecture`) as routers, not endpoints.

Once a doc lands, restate the user's claim and confirm the doc actually addresses that symptom, not a nearby topic mentioned in passing. An empty search result is usually a search error (bad flag, typo, gitignored dir), not a missing doc — run a control query like `grep -rl "current.md" tasks/ | head -1` to verify the search mechanism works before concluding there's no doc.

When a claim shifts mid-conversation, start a fresh discovery pass rather than pivoting within prior findings — a regression investigation in particular starts fresh, since the doc that explained the original behaviour rarely owns the reason it broke.

---

## Read Order {#read-order}

**1. Resolve and read the current.md**

Start with the task doc, following any `Merged into`/`Supersedes` redirects to the live version.

**2. Decisions and related docs**

A `## Decisions Index` section is a routing table, not content — read the specific `decisions/<theme>.md` file(s) matching your question. Decision trees nest multiple levels; when you land on a file with only a Quick Start + `## Sub-Files` table, descend further to find actual ADR content.

Any `📖 <file>` pointer points to external facts — read those. Companion files don't appear in recursive grepping, so verify with `ls`.

Read every doc in `Related:` — audience-split docs describe the same subsystem from different angles and fill gaps one angle alone misses. Check `tasks/shared/*.md` too, even if `Related:` doesn't name it.

**3. CLAUDE.md files**

Read CLAUDE.md files on the path to the files you're working with: root → layer → domain → subdir. 📖 **`references/claude-md-tree-walk.md`** lists which levels exist and the discovery command. Scope to directories in play (your blast radius), not repo-wide. Follow companion pointers by path and verify with `ls`, not grep.

**4. Sibling repos**

If the question involves a second repo, read its `CLAUDE.md` + `CLAUDE.local.md` (per-environment state lives in `.local`). Follow their companion pointers next. The risk of skipping this: a plausible answer grounded in one repo while real facts live in another (prod state vs staging config, for example).

**5. Private journal**

When the answer hinges on a judgment call — assessing an opportunity, pricing, resuming a thread whose history is a conversation not a commit — the journal at `~/.claude/notes/` might hold the reasoning behind a prior decision. Task docs record what was built; the journal records the why. Grep `~/.claude/notes/` for vocabulary if the answer depends on interpersonal or commercial context that doesn't appear in code or task docs.

**What Task Docs Are and Aren't**

Task docs are authoritative for **decisions and gotchas** — why the code works this way, what will bite you, rejected alternatives. They are **not** live-state oracles; anything about a running system (prod's DB, a flag, whether an "open" bug is still open) decays the moment anyone touches a server. If the answer depends on current state, go measure it — and where doc and live system disagree, the live system wins.

Reading a doc is also auditing it. Sweep the fields written once and checked least — `Quick Start`, `Status:`, `Immediate next actions` — since those carry the costliest staleness, and route what you find in the same turn to `task-summary` (project facts) or `update-plugin` (skill defects). An offer parked on the user's reply isn't routing: they act on your answer, often never respond, and the finding dies with the conversation.

📖 **`references/doc-authority.md`** — the full authoritative-for/not table, the mirror trap, open-bug diagnoses as hypotheses, resolving a doc's shorthand ID (`D8`, `R2`) before quoting it back, and the three live-state cases. Open it when a doc's claim about a running system or an open bug is load-bearing for your answer.

---

## What Comes Next {#what-comes-next}

After reading the docs, three patterns determine what happens:

- **Doc path only** — the user supplied a path to a `current.md` or named a domain/feature without an action → read using the Read Order, then wait. A path with an action ("here's the doc, now do X") is different; the doc is context for the work, not the endpoint. If X involves a tool the doc merely researched, read that tool's actual docs before running it.

- **Investigation** — a question about current state → read the relevant docs first, then investigate. Multi-image requests carry multiple claims; enumerate what each image is evidence *of* before answering. That question treats an image as evidence for a bug, which is a different act from reading it as a rendered interface — when a screenshot shows UI, `uiux` owns the visual read and catches what the evidence framing steps past. Before sending a conclusion, verify you answered the question the user asked, not an adjacent one. A finished investigation that found defects: report the finding and blast radius, then stop. Deciding which findings matter, when to fix, and where to record them is the user's call — present it as `AskUserQuestion`, not a yes/no.

- **Task description** — a bug report, feature request, or work description (not a path) → read the relevant docs (infer domain from keywords), then proceed to implement.

---

## Agents

For doc discovery, use the `Explore` agent to search task docs by content (shadowing rule: see "Finding the Right Doc" above). For implementing the work after docs are read, the project's CLAUDE.md determines whether to use `Explore` (locating code), `Plan` (designing an approach), or work inline — this skill only prescribes the agent for its own discovery step.

📖 **`../_shared/references/explore-delegation.md`** — the two non-negotiable prompt clauses (batching, `grep -rn` not `rg`), what counts as delegable gathering vs. inline judgment, and the full shadowing mechanics.

---

## Plan Mode vs Normal Mode {#plan-mode}

After reading docs, the path forward depends on the working mode:

- **Normal mode**: the docs are read, the next step is clear (answer a question, investigate a symptom, implement a task) → proceed directly.
- **Plan Mode**: docs are read, but the approach isn't clear → delegate a code search to `Explore` (for "where does X live") or `Plan` (for "how should I build this") before drafting a proposal. A doc's silence about a surface doesn't mean it's incomplete; it means nobody's hit that path yet.

Timing: delegate *before* proposing, not after. A redundant call costs one agent; an unexplored proposal costs a rewrite.
