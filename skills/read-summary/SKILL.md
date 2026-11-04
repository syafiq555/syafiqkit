---
name: read-summary
description: Read task summary context and project instructions before answering investigative questions, implementing work, or starting a new domain within a session. When a request about current system behavior, a deploy question, a bug report, or an unfamiliar domain is asked, this skill finds and reads the right docs first — decisions and gotchas live there, not in the code alone, so skipping them is how confident-but-wrong answers happen.
---

# Read Summary

Task docs carry decisions and gotchas that aren't derivable from the code alone. Reading them before investigating or implementing prevents confident-but-wrong answers grounded in incomplete information.

When scope changes (a new domain, a second repo touching the question, or a claim that shifts mid-conversation), reread the docs for that scope before proceeding; the docs loaded at session start are scoped to their domain. A regression starts fresh discovery rather than pivoting from prior findings, since the doc that explained the original behaviour rarely owns the reason it broke.

⚠️ **Answering from live measurement is the case that evades the rule above, because measuring is not a scope change and feels like the rigorous option.** Querying the DB, reading the controller, grepping the column each returns a true fact, so a run of them reads as a well-researched answer while the domain's decisions were never opened. Nothing in the session says "new domain", and the tell is what sourced your answer, not what you touched. **Before sending facts about a domain whose docs you have not opened this session, open them; a SQL result or file read needs corroborating, it is not the corroboration.** **Tell: you are answering questions about a subsystem and every citation in your reply is a query or a line number.**

Before writing to a doc, one `ListAgents` call shows whether another session is live and might be editing the same `current.md`. Presence narrows the question without settling which checkout they're in; 📖 `../_shared/references/cross-session-messaging.md` covers what it does and doesn't tell you.

⚠️ **When another session's work must finish first ("don't run X until I tell you"), the wait is yours to arrange, not the user's to relay.** Find the peer with `ListAgents`, tell it what you will touch and what you need confirmed, and subscribe with `SendMessage` `notify_when_idle: true` so the harness wakes you. Idle means its turn ended, not that the work is done, so act on its reply, not on the notice. Ending the turn on "tell me when it has finished" makes the user a courier between two sessions they can both see. **Tell: your closing line asks the user to report another session's progress.**

⚠️ **A live peer also makes `git stash` unsafe for the whole session that follows.** The full ban is in 📖 `../_shared/references/diff-ownership.md`, reachable only from wrap-up and doc skills, so a session that reads docs and then builds for two hours meets the command with nothing loaded. Its operative half belongs here, where a session starts: **`git stash` answers no QUESTION.** Whatever a stash is reached for (what a file used to contain, whether a failure predates your edits, which session wrote a line) is answered by `git show HEAD:<path>`, `git diff HEAD -- <path>`, `git log -S`, or a second worktree at HEAD, none of which move a byte. Reserve it for a merge that genuinely needs one path parked. `--keep-index` is not the careful variant it appears to be: it protects your staged copies while still taking every *unstaged* file, which on a shared checkout is a peer's in-flight work plus any of your own edits since the last auto-stage. **Tell: you are about to stash for any reason other than an in-progress merge.**

---

## Discovery: Finding the Right Doc {#finding-docs}

Folder names are domain-scoped and rarely match how a user phrases a request (`payout` may own "refund" work). Search doc bodies and headers under `tasks/` by content, delegating the search as the Agents section describes. The hits are raw; your judgment ranks them. Skim the top hits until you have the right topic, then read the full doc.

Once a doc lands, restate the user's claim and confirm the doc addresses that symptom, not a nearby topic mentioned in passing. An empty search is usually a search error (bad flag, typo, gitignored dir): search for something you know is there before concluding no doc exists. That control can't catch a checkout behind its remote, so when a doc *points at* a file you can't find, run `git fetch` and check the upstream (`git log --oneline HEAD..@{u}`, `git ls-tree -r --name-only @{u} -- <dir>`) before reporting it missing.

⚠️ **A matched line that answers your question is the strongest reason to open its file, and it reads as the reason you no longer need to.** A hit arrives shaped like a finding, so the search feels concluded and the file goes unopened. The surrounding page holds what reframes it: the prior occurrence, the procedure already worked out, the instruction to check the whole platform. This fires hardest on an unexpected match, which gets dismissed as coincidence rather than followed. **Tell: you reasoned from a grep's output, and the files it named are still unread.**

---

## Agents

For doc discovery, dispatch the `Explore` agent to search task docs by content. Tell it in the prompt to batch its searches into few calls rather than one per pattern. Its hits are raw and your judgment ranks them. While it runs, do other work; don't re-read or re-grep the same files, since verification happens *after* the report. 📖 `../_shared/references/explore-delegation.md` covers the rest of the mechanics, including what separates delegable gathering from judgment you keep.

⚠️ **If there is no other work, end the turn; do not manufacture the wait.** The harness re-invokes you when the agent finishes, so a `sleep` or a repeated `ReadNotifications` buys nothing. It feels diligent because it doesn't duplicate the agent's work. **Tell: you are about to make a call whose previous identical call returned nothing new, with no other work queued.** 📖 `../_shared/references/explore-delegation.md` § The Waiting Game

**Open the files a report names before concluding anything from it.** The hits are an index, not the answer. A report reads like a deliverable rather than a search result, which is why this form evades the matched-line rule above. Read `explore-delegation.md`'s ⚠️ on the returning report before telling the user a cause.

**Generated agents can drift from their templates.** An agent's `.md` holds only what its template had on generation day, so a safety constraint or tool grant added since is missing, and a stale agent still returns a normal-looking report. Validate the safety-critical constraints the first time a session dispatches a project agent. 📖 `references/validating-generated-agents.md` has the checks.

---

## Reading Order {#read-order}

Follow every pointer you encounter in sequence. Each layer (a `docs/` set, task docs, decisions, CLAUDE.md files, sibling repos, journal) holds facts the previous one didn't reach, so skipping or reordering has a cost.

**Pointer chain (in sequence):**

- A project doc set under `docs/`, where one exists: `ARCHITECTURE-ESSENTIALS.md` first and **whole**, then `ARCHITECTURE.md` when the work spans subsystems and `PRD.md` when scope is in question. This layer comes first because nothing points at it, and an essentials file is written to be read *before* a change. It is short on purpose: reading it whole costs less than the one constraint it exists to stop you violating. `PRD.md` earns its read whenever you are about to report something as missing, since a "gap" is often a documented exclusion.
- Task doc (`current.md`): if explicitly redirected (Merged into, Supersedes, top-level pointer), follow to the live doc.
- Decisions and related files: follow `📖` pointers to external files and `Related:` sections.
- CLAUDE.md files: auto-load additively by directory: root, layer, domain, subdir; also check for `.claude/rules/*.md` (loaded every session, not discovered by walk). Check `/context` to see what actually loaded rather than reasoning about what should have.
- Sibling repos: if the question spans repos, read their `CLAUDE.md` and `CLAUDE.local.md`.
- Private journal: grep `~/.claude/notes/` when the answer hinges on interpersonal or commercial context not in code or docs.

⚠️ **Companion files are discovered by following pointers, not by search.** Grep results omit `📖` references and external files. When you encounter a pointer to `.claude-companions/` or a reference folder, verify the path with `ls` before trusting it. The resolved file is authoritative; a broken pointer or typo reads silently as a missing fact.

---

## What Task Docs Are and Aren't {#doc-authority}

Task docs are authoritative for **decisions and gotchas**: why the code works this way, what will bite you, rejected alternatives. They are **not** live-state oracles; anything about a running system (prod's DB, a flag, whether an "open" bug is still open) decays the moment anyone touches a server. If the answer depends on current state, go measure it. Where doc and live system disagree, the live system wins.

⚠️ **"The live system wins" assumes your measurement caught a settled state, and a system mid-reaction hands you a value that is true and about to stop being true.** A doc that disagrees with a live read looks stale by definition, so the read seems to license a rewrite, and the rewrite then reads as authoritative. Where something is in flight (a restart, deploy, retry, refresh), check the artifact's mtime against when the event began, or prefer two reads far enough apart to disagree.

**Three authority boundaries matter:**

- **Schema vocabulary doesn't decay**: column names, enum values, table shapes, and header names stay stable. Before querying a table, read its column names from the docs.

- **Claims about external APIs are neither decided fact nor live-state.** "The vendor requires X" describes someone else's system, and nothing updates it when the vendor changes. A false constraint makes the correct fix look unavailable, so spend the one call to check it, then correct the doc.

- **Claims about your own code that are blocking-shaped matter most.** "This is impossible", "this must come first" or "we have no way to do this" reorder work and produce no failure to notice. Read the code a blocker rests on before planning around it, and say where a blocker is true for one case and false for another: a narrowed blocker is more useful than a deleted one.

  ⚠️ **Reading the code is the wrong instrument when a blocker rests on a CONFIG VALUE, and that is where it stays wrong longest.** The adapter, client and credential path all still exist and read as healthy, so opening them confirms the blocker rather than testing it. **Resolve the value in that environment before treating the blocker as real.** A superseded integration that keeps its docs needs its section labelled dead at its heading, or the next reader debugging a live payment lands in the wrong adapter.

⚠️ **Confirm against what LOADS the technology, not what declares it.** An installed package or manifest entry is weak evidence, since a dependency is declared once and left unwired. Nothing errors, so the wrong answer propagates. Read the entry point: the layout that emits the script tags, the container registration, the actual import sites.

Reading a doc is also auditing it. Sweep the fields written once and checked least (`Quick Start`, `Status:`, `Immediate next actions`), since those carry the costliest staleness, and route what you find in the same turn to `task-summary` (project facts) or `update-plugin` (skill defects). An offer parked on the user's reply isn't routing: the finding dies with the conversation.

📖 `../read-summary/references/doc-authority.md`: edge cases when a doc's claim contradicts live state, when external-system claims go stale, blockers true for some paths and false for others, shorthand headers, and docs that record both an ask and a conclusion.

---

## After Reading Docs {#what-comes-next}

Once the docs are read, the request decides what happens next, in one of three shapes:

- **Doc path only**: the user supplied a doc path or named a domain without an action. You've read the docs; stop here. If they then ask you to "now do X", the doc is context for work. If X uses a tool the doc researched, read that tool's own source before running it, and the same holds for a skill you are about to recommend. A skill's name states its subject, never the input shape it needs, so open it and check what it assumes it is pointed at.

- **Investigation**: a question about current state. Read docs first, then investigate. For screenshots shown as evidence, identify what each one is evidence *of* before answering. Verify you answered the question asked, not an adjacent one. A finished investigation that found defects reports the finding and blast radius, then stops; deciding which findings matter and when to fix them is the user's call.

- **Task description**: a bug report, feature request, or work description. Read the relevant docs (infer domain from keywords), then proceed to implement.

⚠️ **This skill is the preamble, so the rest of the request still belongs to whichever skill owns it.** Arguments often name a second job or carry its trigger ("research uiux", "then brief the designer"). Read in this skill's frame, that job looks like more investigation and gets a hand-rolled agent without the owning skill's brief, evidence rules or verification. Before dispatching any agent, check the request against the skill list. A named skill, or a trigger match (UI research → `uiux`, designer brief → `design-handoff`, "I can't read all of this" → `understanding-guide`), is invoked as the next step, with these docs as its context. **Tell: the request names a skill or trigger word, and your next call is `Agent` rather than `Skill`.**

⚠️ **A second guess is the signal to stop and research, whatever the task.** It shows up as a fix that didn't work followed by another theory, an explanation revised after the user pushes back, a cause blamed and then dropped, or a long run started to "see if it helps". Each guess feels careful on its own, and the run of them feels like progress because something changes every time, so nothing in the moment says "you don't know yet". A symptom that appears mid-task is a new domain with its own docs, even though diagnosing in place feels like continuing the task. Research comes first, in this order, and the searching half is small work for a `haiku` agent (📖 `../haiku/SKILL.md`) while you keep the measuring: grep the instruction files and task docs for the symptom's own words, open what they point at (such a doc usually records what was already tried and ruled out), check the skill list for one that owns the symptom, and then measure the one thing those leave open with the smallest direct check rather than a full rerun. **Tell: your next change or explanation is your second theory, and since the first one failed you have neither searched the docs nor run a direct check.**

---

## Plan Mode {#plan-mode}

After reading docs, if the next step is clear (answer a question, investigate, implement), proceed. If the approach isn't yet clear (you need to know where a surface lives in the codebase or how to design a solution), delegate that search before proposing. Use `Explore` for "where does X live" and `Plan` for "how should I build this."

Plan mode's own workflow restricts its first phase to `Explore` agents. That limit is about code search: it does not cancel a skill the request names. A `uiux` research pass or a `design-handoff` read is read-only and runs inside plan mode, and skipping it there is the same miss as above.

For implementing work after docs are read, the project's CLAUDE.md decides between `Explore` (locating code), `Plan` (designing an approach) and inline work.

⚠️ **A question a delegated agent hands back is still the user's question, and writing it into the plan as a default is not asking it.** A `Plan` agent often ends with "decisions for you" and a recommended answer for each. Copied in as "defaults, overridable at approval", they become decisions nobody made, since approving a long plan approves every line unread. Put each through `AskUserQuestion` before `ExitPlanMode`. **Tell: your plan contains "overridable", "default unless", or an agent's question with its answer filled in.**

A doc's silence about something doesn't make it incomplete; nobody has needed that path yet. Delegate only when exploration answers a question your design depends on.

⚠️ **A subagent inherits plan mode, so one dispatched to MEASURE returns a plan to measure.** Searching and reading still work, which is why the limit goes unnoticed. Exit plan mode first, or defer the measurement until after approval and say which. 📖 `../_shared/references/explore-delegation.md` § How to Spawn (the 2026-09-18 measured incident). **Tell: you are about to spawn an agent to find out a fact about the world while the session cannot act on the world.**

---

## Decision-First on Every Turn After {#decision-first}

This skill runs at the start of most sessions and sets a rule for every later turn: **any turn that ends on a question states the decision needed before the report.** A build incomplete, a next step you don't own, or two paths open for the user to pick all need that frame. It is part of the answer's shape, not a separate wrapper: the decision says what is unresolved, and the report shows what you built.

The same rule applies to the wrap-up skills (`done`, `quick-done`, `ship`) on their final turns. Don't end on pending questions without naming them. One to four open questions go through one `AskUserQuestion` call; on a brief to finish everything, ask a question raised mid-work before the turn ends and build the answer rather than parking it in the task doc.

⚠️ **What goes first is the QUESTION, not your planning.** Read once at session start and applied from memory for dozens of turns, the rule degrades into narrating working state: what you still need to read, which calls are blocked, the plan restated. That is not a decision, and it reads as diligence, so nothing stops it. **Tell: your reply opens by describing what you are about to do.** Most turns carry no decision and should open with the answer. 📖 `../_shared/references/decision-first-output.md` for the full carve-out.

⚠️ **A question a doc lists as open may already be answered in a sibling doc, and "ask me first" makes asking feel like step one.** Before putting an open item to the user, grep its `Related:` docs and the domain that owns the subject (a storage rule belongs to the storage domain even when a compliance doc lists it) for a recorded decision. If one exists, quote it inside the option, or the user answers again from another frame and two contradictory decisions land on one day. **Tell: you are about to ask a question, or report a defect as new, from a doc whose `Related:` docs you have not opened.**

**Decision shapes**: not every question mark is a real decision point. When multiple paths are open:
- **One path**: name it, and explain why it's the one. "We should X because Y" is a complete decision.
- **Several paths**: list them with a trade-off ("X costs time, Y costs money, Z is reversible"), then either pick the best-fit (if the trade-off points one way) or state which dimension the user should decide on.
- **A missing fact**: if the decision hinges on something unmeasured, say what to measure and how it would change the decision.

📖 `../_shared/references/decision-first-output.md` for the full test logic on when a question-mark ending does or doesn't require a decision frame.