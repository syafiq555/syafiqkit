---
name: read-summary
description: Read task summary context and project instructions before answering investigative questions, implementing work, or starting a new domain within a session. When a request about current system behavior, a deploy question, a bug report, or an unfamiliar domain is asked, this skill finds and reads the right docs first — decisions and gotchas live there, not in the code alone, so skipping them is how confident-but-wrong answers happen.
---

# Read Summary

Task docs carry decisions and gotchas that aren't derivable from the code alone. Reading them before investigating or implementing prevents confident-but-wrong answers grounded in incomplete information.

When scope changes — a new domain enters mid-conversation, a second repo touches the question, or work spans multiple files — reread the docs relevant to that new scope before proceeding. The docs you loaded at session start are scoped to their domain; a domain shift needs its own discovery.

Before writing to a doc, one `ListAgents` call shows whether another session is live and possibly editing the same `current.md` — though presence alone doesn't say which checkout they're in. `../_shared/references/cross-session-messaging.md` covers what a peer's presence does and doesn't tell you.

---

## Finding the Right Doc {#finding-docs}

Folder names are domain-scoped and rarely match how a user phrases a request — `payout` might own "refund" work, `upload-redesign` might own "QC delete child question." Discover by content using the Explore agent to search doc bodies and headers across `tasks/`. The agent's report delivers raw hits only — file paths and matched lines — never a ranked judgment. Your job is the judgment: skim the top hits until you're confident you've found the right topic, then read the full doc.

The mechanical parts of discovery — grep setup, search retries, recursion — run in the agent's context and stay there. This split (gathering vs. judgment) is what makes delegating safe, and it only works if both halves stay separate; see the Agents section below for what to do while it runs.

Once a doc lands, restate the user's claim and confirm the doc actually addresses that symptom, not a nearby topic mentioned in passing. An empty search result is usually a search error (bad flag, typo, gitignored dir), not a missing doc — run a control query like `grep -rl "current.md" tasks/ | head -1` to verify the search mechanism works before concluding there's no doc.

When a claim shifts mid-conversation, start a fresh discovery pass rather than pivoting within prior findings — a regression investigation in particular starts fresh, since the doc that explained the original behaviour rarely owns the reason it broke.

---

## Read Order {#read-order}

**1. The task doc**

Start with the `current.md` file for the domain at hand. If a doc is explicitly marked as redirecting to another — `Merged into`, `Supersedes`, or a `📖` pointer at the top — follow it to the live doc. A `Merged into` stub is a legacy artifact (new merges delete the source outright rather than leaving one), so following it and mentioning it wants cleanup are both right.

**2. Decisions and related docs**

A task doc often includes a routing section pointing to decision files (usually under `decisions/`). When you land on a file that's pure routing — headers, quick-start, and pointers to sub-files — follow those pointers to the actual decisions. Read the decision files matching your question.

Any `📖 <file>` pointer in the doc points to external content — read those. Companion files don't auto-appear in grepped results, so verify their paths with `ls`.

Read docs named in a `Related:` section — they describe the same subsystem from different angles and fill gaps one angle alone misses.

**3. CLAUDE.md files**

CLAUDE.md files auto-load additively by directory: root `CLAUDE.md`, then layer (`app/CLAUDE.md`), then domain (`app/Domain/<Domain>/CLAUDE.md`, capitalized), then subdir — a section that split down a level leaves one there, so don't assume the layer file is the deepest. Read the ones on the path to the files you're working with, found with `grep -rl --include='CLAUDE.md' "" <dirs>` scoped to the directories in play. Never `rg` for this: its `-r` means `--replace`, so the command runs and returns the wrong thing rather than failing.

Scope to your actual blast radius rather than the repo, but that economy is within-repo only — it doesn't license skipping step 4, where a second checkout holds facts this walk can't reach. When you encounter a `📖` pointer to a companion file (`.claude-companions/<shared|local>/CLAUDE-<topic>.md`), follow the path and verify with `ls`; companions don't auto-load and don't surface in a recursive grep.

**4. Sibling repos**

If the question involves a second repo, read its `CLAUDE.md` and `CLAUDE.local.md` — per-environment state lives in `.local`. Follow their companion pointers next. A plausible answer grounded in one repo while real facts live in another (prod state vs staging config, for example) is the risk of skipping this.

**5. Private journal**

When the answer hinges on a judgment call — assessing an opportunity, pricing, resuming a thread whose history is conversation rather than code — the journal at `~/.claude/notes/` might hold the reasoning behind a prior decision. Task docs record what was built; the journal records the why. Grep `~/.claude/notes/` for vocabulary if the answer depends on interpersonal or commercial context that doesn't appear in code or task docs.

**What Task Docs Are and Aren't**

Task docs are authoritative for **decisions and gotchas** — why the code works this way, what will bite you, rejected alternatives. They are **not** live-state oracles; anything about a running system (prod's DB, a flag, whether an "open" bug is still open) decays the moment anyone touches a server. If the answer depends on current state, go measure it — and where doc and live system disagree, the live system wins.

Reading a doc is also auditing it. Sweep the fields written once and checked least — `Quick Start`, `Status:`, `Immediate next actions` — since those carry the costliest staleness, and route what you find in the same turn to the `task-summary` skill (project facts) or `update-plugin` (skill defects). An offer parked on the user's reply isn't routing: they act on your answer, often never respond, and the finding dies with the conversation.

When a doc's claim about a running system or an open bug is load-bearing for your answer, open `📖 references/doc-authority.md` — it covers the full authoritative-for/not table, the mirror trap (re-deriving a settled decision from the doc reads as not having read it), and how to handle live-state contradictions.

---

## After Reading Docs {#what-comes-next}

Once the docs are read, three patterns determine what happens next:

- **Doc path only** — user supplied a path to a doc or named a domain without an action → you've read the docs; stop here. If they ask you to "now do X", the doc is context for work, not the endpoint. If X involves a tool the doc merely researched, read that tool's own source before running it.

- **Investigation** — a question about current state → read docs first, then investigate. When a user shows you screenshots or images as evidence of a problem, identify what each one is evidence *of* before answering. Before you send your conclusion, verify you answered the question the user asked, not an adjacent one. A finished investigation that found defects: report the finding and blast radius, then stop. Deciding which findings matter and when to fix them is the user's call.

- **Task description** — a bug report, feature request, or work description → read the relevant docs (infer domain from keywords), then proceed to implement.

### Decision-first on every turn after {#decision-first}

This skill runs at the start of most sessions, establishing a rule that carries forward into every turn: any turn that ends on a question (a build incomplete, a next step you don't own, two paths open with one for the user to pick) states the decision needed before the report. This isn't a separate wrapper — it's part of your answer shape. The decision tells them what's actually unresolved; the report shows them what you've built.

The same rule applies to the wrap-up skills (`done`, `quick-done`, `ship`) on their final turns — don't end on pending questions without naming them.

How a decision gets shaped depends on how many are open — one takes a different form from several, and not every question mark is a real decision. `../_shared/references/decision-first-output.md` owns both tests.

---

## Agents

For doc discovery, dispatch the `Explore` agent to search task docs by content. The agent returns raw hits; your judgment ranks them and picks the right doc. While the agent runs, do other work or think — don't re-read or re-grep the same files yourself. That duplication costs context for a fact you'll see again in the agent's report, and the check that makes delegation safe is verification *after* the report, not before.

Two clauses belong in the prompt itself, since neither is derivable from the agent's side: tell it to search with `grep -rn` rather than `rg`, which isn't installed here and fails as an empty result rather than an error, and to batch its searches into few calls instead of one per pattern. `../_shared/references/explore-delegation.md` has the rest of the mechanics, including what separates delegable gathering from judgment you keep.

For implementing work after docs are read, the project's CLAUDE.md determines whether to use `Explore` (locating code), `Plan` (designing an approach), or work inline. This skill prescribes only the agent for its own discovery step.

**A generated agent only carries what its template held on the day it was generated**, so a project's `.claude/agents/*.md` can be months behind a constraint the templates gained since — and nothing about dispatching a stale agent looks wrong, because it returns a normally-shaped report. The gap is worth one cheap look the first time a session dispatches a project agent: compare a rule you'd expect every current agent to carry against what the generated files actually say. A safety-relevant one is the cheapest probe, since it either appears in all of them or in none:

```bash
find .claude/agents -name '*.md' ! -name 'Explore.md' \
  -exec grep -L 'agent-may-not-redelegate\|Spawn only' {} + 2>/dev/null
```

Any file listed is missing the re-delegation constraint, which is what lets a dispatched agent hand your brief to a copy of itself. `Explore` is excluded because nested `Explore` is its designed behaviour — an enumeration that flags it trains the reader to ignore the result. `/agent-setup` regenerates them and owns the full per-hunk drift comparison — the point here is only that a stale agent never announces itself, so someone has to look while there's still a reason to. Skip it in a project with no `.claude/agents/` at all, and don't re-run it once a session has already checked.

---

## Plan Mode {#plan-mode}

After reading docs, if the next step is clear (answer a question, investigate, implement), proceed. If the approach isn't yet clear — you need to know where a surface lives in the codebase or how to design a solution — delegate that search before proposing. Use `Explore` for "where does X live" and `Plan` for "how should I build this."

A doc's silence about something doesn't mean it's incomplete; it means nobody's needed that path yet. The absence of a doc entry isn't a blocker for design — it means you're in genuinely new territory, which is fine. Delegate only when exploration answers a question your design depends on.
