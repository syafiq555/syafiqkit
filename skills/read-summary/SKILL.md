---
name: read-summary
description: Read, find and understand task summary context before answering a question, investigating a bug, planning a deploy, or starting work in a project that uses tasks/**/current.md docs. Use at session start AND every time the conversation moves into a DIFFERENT domain/feature/repo mid-conversation (the doc loaded at the start does not cover the new domain), AND near the end of a piece of work to catch related docs a shipped change touched. Trigger whenever the user references existing feature work, asks an investigative question about current system behavior ("why does X fail", "is Y still broken", "what's the status of Z"), asks what it takes to ship/deploy/release/go live ("if we deploy staging to production what do we need to do", "what's left before go-live", "is this ready to ship"), pastes a bug report or ClickUp ticket, or names a domain/feature that might have a task doc. Deploy and go-live questions are a PRIME trigger, not an edge case — the prerequisites, blockers, and env state live in task docs, never in the code. Trigger even when the user doesn't say "read summary" explicitly, even when they name no feature, and even when a doc is already open from earlier — a new domain or a second repo entering the work needs its OWN discovery pass. Any request that could be answered wrong by skipping existing project context should go through this skill first.
---

# Read Summary

Read, find and understand task summary context. This is the unconditional first step before answering, investigating, or implementing anything in a project that keeps living docs at `tasks/<domain>/<feature>/current.md`. Those docs carry decisions, gotchas, and vocabulary that aren't derivable from the code alone, so skipping them is how confident-but-wrong answers happen.

The discovery is unconditional because everything downstream (Intent Detection, answering, investigating, implementing) depends on decisions and gotchas that only live in the docs — branching into work before reading means branching on incomplete information.

**Rediscover whenever scope changes**, not once per session. Three concrete triggers:
- A new domain or feature enters mid-conversation — the work drifts into a different `tasks/<domain>/`. Load its doc before acting.
- A second repo enters the question — its CLAUDE.md, CLAUDE.local.md, and task docs are separate and never auto-load. Read them before proceeding.
- Near the end of work that spans multiple files — a finished change usually touches more docs than where you started. Re-scan before calling it done.

If the user ends up pointing you at a doc or repo you should have found yourself, one of these three re-triggers was missed — worth noticing as a pattern.

**Path Convention**: `tasks/<domain>/<feature>/current.md` (examples: `tasks/payment/gateway/current.md`, `tasks/tenant/rebate/current.md`)

---

## Finding the Right Doc {#finding-docs}

The request is usually a fuzzy task description, not a path. Folder names are engineer-domain-named and rarely match how you'd phrase the request (`upload-redesign` owns "QC delete child question"; `payout` owns "refund"). Discover by content, not by folder name:

**1. Search by content — delegate the raw gathering, keep ranking inline.** Spawn the `Explore` agent to list candidate docs and grep them for the concept's vocabulary, including synonyms ("child"→"sub-question", "QC"→"review/screening", "refund"→"payout"). Search doc body + header, never the folder name alone, including `_archive/` and flat `tasks/<domain>/<feature>.md`. Delegation rules (raw-not-ranked, the `rg` clause, the Bash fallback): `../_shared/references/explore-delegation.md`.

```
Agent({subagent_type: "Explore", run_in_background: false, prompt: "In tasks/, find every current.md (plus _archive/ and flat tasks/<domain>/<feature>.md) mentioning: payout, disbursement, settlement (synonyms of 'refund'). Return matched paths, matched lines with line numbers, and each candidate's header block (<!--LLM-CONTEXT...--> if present) + # Title + ## Overview, all candidates raw."})
```

**2. Rank + disambiguate inline.** Read the top 2-3 candidates' header block (`<!--LLM-CONTEXT...-->` if present — tolerate missing/varied headers) + `# Title` + `## Overview`. Follow any `Merged into`/`Supersedes`/`> 📖` redirect to the live doc. Treat index/hub docs (roadmap, `shared/`, `*-architecture`, parent `current.md`) as routers, not targets.

An empty result usually means the search was wrong, not that the tree lacks the doc — a bad flag, a typo, or a gitignored `tasks/` dir all return empty just as easily as a genuine miss. Before concluding "no doc covers this," run a control query that must hit (`grep -rl "current.md" tasks/ | head -1`); if the control also comes back empty, the search mechanism itself is broken.

A keyword match lands you in the right *folder*, not necessarily the right *bug*. After the doc loads, restate the user's claim in your own words and confirm the doc addresses *that symptom*, not a nearby topic it happens to mention. If the central claim shifts mid-conversation (new symptom, a screenshot, "this was fixed before and came back"), re-run discovery from step 1 — and treat a regression as its own investigation: find the prior fix, check what reverted.

A follow-up that names "this" or "it" after a multi-part answer is ambiguous between every part of that answer. Recency bias makes the thing just finished feel like the obvious referent even when it isn't. When two readings would lead to materially different work, state which one you took in your first sentence, so a wrong guess costs a one-line correction instead of redoing the whole answer.

---

## Read Order {#read-order}

Read the task doc first, before anything else this skill does — even for what looks like a quick check. Complete this sequence before branching to Intent Detection.

**1. Resolve and read the current.md**
   - Use discovery above if no path was given
   - Resolve any `Merged into`/`Supersedes` redirects to the live doc

**2. MADR / Decisions Index**
   - A thin index (`## Decisions Index` routing table → `decisions/*.md`) holds NO ADR content itself — reading only the index reads zero decisions
   - Open the specific `decisions/<theme>.md` file(s) matching what you're investigating; multiple themes → read all
   - Routers can nest, sometimes more than one level deep (`decisions/<theme>.md` → `decisions/<theme>/<sub>.md` → `<theme>/<engine>/<leaf>.md`), and a pointer above the split usually isn't updated when it happens (nothing breaks, so nothing signals the change)
   - Landing on a file with only a Quick Start and a `## Sub-Files` table means you're on a router, not a thin theme — the actual ADRs (`Problem`/`Decision`/`Rejected` blocks) are deeper. Verify the tree once rather than trusting the index's file list: `grep -rl "" --include='*.md' tasks/<domain>/<feature>/decisions/` and descend until real ADR content appears
   - The same applies to any `📖 <file>` pointer elsewhere in a doc (an LLM-CONTEXT `Gotchas:` or `Next Steps` field included) — a pointer that itself points further is how a fact gets recorded and never actually read
   - Note: Companions (`.claude-companions/`) do NOT auto-load and cannot be found via recursive `grep -rl` (misses dotfiles and gitignored paths). Follow their `📖` pointers when your task matches their named symptoms; verify existence via `ls <path>`, never grep.

**3. Related docs**
   - Read EVERY doc in `Related:`, not just on-topic-sounding titles
   - Two docs split by *audience* (e.g. admin-QC vs student-runtime) can describe *one* subsystem — a tangential-looking title can be load-bearing
   - Only conclude "not relevant" after reading it, never from the title
   - Check `Glob: tasks/shared/*.md` unconditionally, even when `Related:` doesn't name one — a shared doc not yet cross-linked from this feature is still in scope

**4. CLAUDE.md tree walk**
   - Read every CLAUDE.md on the path to the files this task touches: root → layer → subdir → domain (auto-loaded additively). 📖 **`references/claude-md-tree-walk.md`** — which CLAUDE.md files exist at each level (Layer/Subdir/Domain/Companion/Related) and the discovery command
   - Scope to dirs actually in play (match blast radius, not repo size) — but token-scoping is within-repo only; step 5 always applies if a second repo touches the question
   - When a `.claude-companions/` companion file is mentioned in a `> 📖` pointer, follow it: read if your task matches the symptom description; confirm existence via `ls <path>`, never `grep -rl` — recursive grep reaches neither `.claude/` nor gitignored files, so an existing companion returns 0 hits for even a common word (a control like `README.md` proves recursion works, not that your target is in scope)

**5. Sibling repo (if the question touches one at all)**
   - Read its `CLAUDE.md` + `CLAUDE.local.md` (per-env state lives in `.local`)
   - Follow their `> 📖` companion pointers first, both gated on the question's scope, not which files you'll edit
   - Two reasons this is easy to under-do: the harness only tree-walks from the working dir (no auto-load), and even after reading the sibling's CLAUDE.md, its `> 📖` companions sit one hop further; stopping either way feels complete while server/DB/container facts remain unread
   - The risk is a plausible wrong answer with no error, real prod data read as staging
   - Sibling task docs live in its own `tasks/**` tree

**Authority & Staleness During the Read**

A task doc is authoritative for **decisions and gotchas** — why the code is built this way, what will bite you, the rejected alternatives. It is **not a live-state oracle**: anything about a running system (prod's DB, a flag, whether an "open" bug is still open, what a third-party tool actually deletes) decays the moment anyone touches a server. If the answer depends on current state, go measure it; when doc and live system disagree, the live system wins.

Reading a doc is also auditing it. When it contradicts the code, don't just narrate the drift and move on — sweep the least-revisited fields (`Quick Start`, `Status:`, `Immediate next actions`, since these are written once and checked least, so they carry the costliest staleness), name the finding, and route it in the same turn to `task-summary` (project facts) or `update-plugin` (skill/command defects). An offer parked on the user's reply isn't routing — they act on your answer and often never respond, and the finding dies with the conversation.

📖 **`references/doc-authority.md`** — the full authoritative-for/not table, the mirror trap (don't re-ask a fork the doc already decided), open-bug diagnoses as hypotheses, resolving a doc's own shorthand ID (`D8`, `R2`) before quoting it back to the user, and the three live-state cases (running a researched tool · remote state from local absence · "it's the staging one"). Open it when a doc's claim about a running system or an open bug is load-bearing for your answer, or when you're about to quote a doc's internal ID back to the user.

---

## Intent Detection {#intent-detection}

After reading, determine the type of the user's request. This decision only determines what you do *after* the read — it never excuses skipping the Read Order.

- **Doc path** — matches `tasks/*/current.md`, a `domain/feature` slug, or a file path → Read the doc using the Read Order above, then **wait for the user's next instruction**. A path handed alongside an action ("here's the doc, now let's do X") is a doc path *plus* a task — the doc is starting context, not the finish line. If X means running a third-party tool the doc merely researched, read that tool's source before the first destructive command.

- **Investigation / diagnostic** — a read-only question about current state: "is X paid by card?", "why did Y fail?", "check on production", "what's the status of Z?" (often with screenshots)
  - Infer the domain, run the full Read Order first, THEN investigate and answer
  - Multi-image requests carry MORE claims, not one. Each image is typically evidence for a distinct clause (a test result, a UI state, a data-linkage gap). Before answering, enumerate what each image is evidence *of*: a request like "on our last E2E we did this [screenshot], but [screenshot] the account isn't even linked?" has at least two claims to reconcile (E2E outcome + linkage gap), and both need addressing
  - **Exit gate**: Before sending a conclusion, compare the question the user asked against the question you actually answered. It's easy to confirm an adjacent, easier fact instead of the harder thing that was asked — e.g. confirming a field's *value* when the real question was *which field is authoritative*. If they diverge, re-open and answer the one actually asked, reconciling every clause and number the user gave
  - This gate also covers end-of-work re-scans: a finished change usually touches more docs than the one you started in — a multi-commit ship spanning domains, a fix whose defect is documented in a sibling doc, a doc that describes the mechanism your change replaced. Re-scan for those before calling it done
  - **Finding a defect is the deliverable — designing its fix is new work the user hasn't scoped.** An investigation that escalates ("this affects X too" → "the whole flow needs checking") is following real evidence, but each escalation grows what you'll hand back, and left unchecked you end up presenting a plan for something never requested. Report the finding and its blast radius, then let the user decide whether a fix gets designed at all. That decision is a multi-fork one by construction — which findings to act on, fix now vs. defer, where the record lands — so route it through `AskUserQuestion` per the global multi-choice convention rather than a closing "want me to patch these?", which collapses three separate choices into a single yes/no. An option that depends on an unconfirmed capability (a tool that turns out not to exist, a permission you don't hold) is worth settling before it goes in the list, not after the user picks it. A stale doc contradicting live code is different — the auditing rule above routes that in-turn, never gated on an ask

- **Task description** — contains a bug report, feature request, ClickUp paste, chat transcript, or any actionable work description (not a path) → Read relevant context (infer domain from keywords, find matching `tasks/**/current.md`, load domain CLAUDE.md), then **proceed to implement the task**

---

## Delegation Notes

After the doc is read, if implementing/investigating needs an open-ended codebase search ("where does X live", "how does Y work"), that routes through the project's `Explore`/`Plan` agent, never a bare `general-purpose` agent with a manual model override. This skill only prescribes `Explore` for its own doc-discovery step — the project's own CLAUDE.md is what mandates it for everything downstream, and it's easy to satisfy this skill's Read Order in full and then slip back to ad-hoc search once past it.

---

## Plan Mode vs Normal Mode {#plan-mode}

The Read Order is unconditional in both modes. What changes is what happens once the doc is loaded:

- **Normal mode**: once the doc(s) are read and the intent's follow-up action is clear, continue straight into it (answer, investigate, or implement) — no extra hand-off step
- **Plan Mode**: after the read, delegate the deeper pass to `Explore`/`Plan` subagent before drafting — `Explore` for "where does X live / what calls Y", `Plan` for "design the implementation approach." Only a question the doc answers outright, changing nothing, skips this delegation.
  - Don't gate that delegation on whether the doc "left a gap" — a good doc is accurate about what it covers and silent about what nobody's hit yet (a sibling form, a second entry point, an existing mutator), so a thorough read that confirms everything and finds no gap is not evidence there isn't one; it just means the doc never had reason to mention it
  - Once a recommendation has formed from the doc plus your own searching and is about to go to the user, that's the moment to delegate the wider pass — before proposing, not after, since a redundant `Explore` call costs one agent and an unexplored proposal costs a rewrite
