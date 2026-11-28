---
name: read-summary
description: Read task summary context and project instructions before answering investigative questions, implementing work, or starting a new domain within a session. When a request about current system behavior, a deploy question, a bug report, or an unfamiliar domain is asked, this skill finds and reads the right docs first — decisions and gotchas live there, not in the code alone, so skipping them is how confident-but-wrong answers happen. Also the entry for "let's continue" or "do the next steps" against a doc: read it, then build. A project-wide "what can I do now / what's blocked" is `unblock`.
---

# Read Summary

Task docs carry decisions and gotchas the code alone doesn't show. Reading them first prevents confident-but-wrong answers.

**When the arguments ask what is open, blocked or left across the project**, call `Skill(syafiqkit:unblock)` now, before reading any Quick Start, and follow it. A Quick Start read first becomes the answer and misses what the user then has to point out.

When scope changes (a new domain, a second repo, a host another repo owns, or a claim that shifts mid-conversation), reread the docs for that scope before asking anything about it; session-start docs are scoped to their domain. A regression starts fresh discovery rather than pivoting from prior findings: the doc that explained the original behaviour rarely owns why it broke.

⚠️ **Live measurement evades the rule above: measuring is not a scope change and feels rigorous.** A run of true query results reads as research while the domain's docs go unopened. A query result is not the corroboration. **Tell: every citation in your reply is a query or a line number, and the domain's docs are unopened.**

---

## Discovery: Finding the Right Doc {#finding-docs}

Folder names are domain-scoped and rarely match how a user phrases a request. Search doc bodies and headers under `tasks/` by content, delegating as the Agents section describes. Rank the raw hits yourself and read the top ones in full.

Once a doc lands, confirm it addresses the user's symptom, not a nearby topic mentioned in passing. An empty search is usually a search error: search for something you know is there before concluding no doc exists. When a doc *points at* a file you can't find, check the upstream before reporting it missing (📖 `references/branches.md#upstream` for the commands).

⚠️ **A matched line that answers your question is the strongest reason to open its file, and it reads as the reason you no longer need to.** It fires hardest on an unexpected match, dismissed as coincidence. **Tell: you reasoned from a grep's output, and the files it named are still unread.**

---

## Agents

When no doc is named, dispatch the `Explore` agent, batching its searches rather than one per pattern. A named path is read directly. While it runs, do other work, but don't re-grep its files: verification happens after the report. 📖 `../_shared/references/explore-delegation.md` covers the rest.

⚠️ **If there is no other work, end the turn; do not manufacture the wait.** The harness re-invokes you when the agent finishes, so a `sleep` buys nothing. **Tell: you are about to make a call whose previous identical call returned nothing new, with no other work queued.** 📖 `../_shared/references/explore-delegation.md` § The Waiting Game

**Open the files a report names before concluding anything from it.** A report reads like a deliverable and evades the matched-line rule above (📖 `explore-delegation.md`'s ⚠️ on the returning report).

**A generated agent's `.md` holds only what its template had on generation day**, and a stale agent still returns a normal-looking report. Validate a dispatched agent's safety-critical constraints the first time a session uses it (📖 `references/validating-generated-agents.md`).

---

## Reading Order {#read-order}

Follow every pointer: each layer holds facts the previous one didn't reach.

**Pointer chain:**

- A project doc set under `docs/`, where one exists: `ARCHITECTURE-ESSENTIALS.md` first and **whole** (nothing points at it), then `ARCHITECTURE.md` and `PRD.md` as the work and scope need (📖 `references/branches.md#docs-set`). Read `PRD.md` before you report something as missing. A date or status line in these files can lag the task doc: on a date or decision the task doc wins, on whether something is built the code wins over both.
- Task doc (`current.md`): if explicitly redirected (Merged into, Supersedes, top-level pointer), follow to the live doc.
- Decisions and related files: follow `📖` pointers and `Related:` sections. A large verbatim copy (a contract, quotation or policy) is read by line range from its outline, never whole or from a keyword grep's hits (📖 `references/doc-authority.md` § Reading a large verbatim copy through its outline). A document that exists only as a PDF, scan, photo or screenshot gets a `doc-to-md` copy before any claim is quoted from it (📖 `references/branches.md#scanned-copies`). **Tell: you are quoting a name, amount or clause from a scanned or photographed document you read by eye, or from a converted copy you never checked for empty pages.**
- CLAUDE.md files auto-load additively by directory, but a folder's loads only once a file under it is read, and refreshes move rules into folder files on purpose. So before answering or acting on an area you haven't opened a file in, `Read` the `CLAUDE.md` of the folder the work belongs to, and follow the root's 📖 pointers into it. `.claude/rules/*.md` loads every session. Check `/context` for what actually loaded, not what should have.
- Sibling repos' `CLAUDE.md` and `CLAUDE.local.md` when the question spans repos; `~/.claude/notes/` when the answer hinges on interpersonal or commercial context.

⚠️ **Companion files are found by following pointers, not by search**, since grep omits `📖` references. Verify a pointer's path with `ls`: a broken one reads silently as a missing fact.

---

## What Task Docs Are and Aren't {#doc-authority}

Task docs are authoritative for **decisions and gotchas**: why the code works this way, what will bite you, rejected alternatives. They are **not** live-state oracles; anything about a running system decays the moment anyone touches it. If the answer depends on current state, go measure it. Where doc and live system disagree, the live system wins.

⚠️ **"The live system wins" assumes your measurement caught a settled state.** A value mid-reaction is true and about to change, so a doc that disagrees looks stale by definition. Where something is in flight, check the artifact's mtime against when the event began, or take two reads far enough apart to disagree.

**Three authority boundaries matter:**

- **Schema vocabulary doesn't decay**: column names, enum values, table shapes and headers stay stable. Read column names from the docs before querying.

- **Claims about external APIs are neither decided fact nor live-state.** "The vendor requires X" describes someone else's system, and nothing updates it. A false constraint makes the correct fix look unavailable, so spend one call checking its release notes and docs page (they can lag each other), then correct the doc.

- **Claims about your own code that are blocking-shaped matter most.** "This is impossible", "this must come first" or "we have no way to do this" reorder work and produce no failure to notice. Read the code a blocker rests on before planning around it, and say where it holds and where it doesn't: a narrowed blocker beats a deleted one.

  ⚠️ **Reading code is the wrong instrument when a blocker rests on a CONFIG VALUE, and that is where it stays wrong longest.** Reading the adapter, client or credential path only confirms the blocker. **Resolve the value in that environment before treating the blocker as real.** A superseded integration's section needs a dead label (📖 `references/branches.md#config-value`).

⚠️ **Confirm against what LOADS the technology, not what declares it.** A manifest entry is weak evidence, since a dependency is declared once and left unwired. Read the entry point: the script-tag layout, the container registration, the import sites.

Reading a doc is also auditing it: route what you find in the same turn to `task-summary` (project facts) or `update-plugin` (skill defects), and sweep the fields checked least (📖 `references/branches.md#doc-audit`). A doc's silence doesn't make it incomplete.

📖 `references/doc-authority.md` when a doc contradicts live state, an external claim looks stale, or a blocker differs by path.

---

## After Reading Docs {#what-comes-next}

Once the docs are read, the request decides what happens next, in one of five shapes:

- **Doc path only**: the user gave a doc path or domain with no action. You've read the docs; stop here. If they then ask you to "now do X", the doc is context for work, and a tool or skill the doc researched gets its source or inputs checked before it runs (📖 `references/branches.md#skill-routing`).

- **Investigation**: a question about current state. Read docs first, then investigate. Verify you answered the question asked, not an adjacent one. A screenshot shown as evidence: identify what it is evidence *of*. A video's soundtrack is evidence too: extract and transcribe the audio before diagnosing (📖 `references/branches.md#investigation` for the transcriber choice). **Tell: you are reasoning from a video's frames and have not checked whether it has an audio track.** **A "where do I get X" or "is there a way to" question gets every place the product offers X, not the first one a doc names:** read the app's menu or route definitions and open each candidate screen, since a domain's doc describes only its own screen (📖 `references/branches.md#investigation`). **Any question about where work stands now also reads the team's chat** (the space the project's instructions name, via a connected chat tool) **and the remote** (📖 `references/branches.md#upstream`), beside the docs and tracker, since decisions, handovers and asks land there before any doc records them. **Tell: your answer lists what someone can do next and no chat message was read.** A project-wide "what can I do now / what's blocked / what's left" is `unblock`'s question: invoke it next. An answer built from chat or tracker text checks each item against its own task doc (grep its row number or subject) and, where it names live data, the live system, before it is listed or sent, since a tracker or chat line is a lead, not its state: work and decisions after it land in the task docs first (📖 `references/branches.md#investigation`). **Tell: a per-item status list came from cell or message text, and no task doc was opened for any item.** **A screenshot saying something was shared is followed to the tracker row that asked for it before the user is asked, since the sharer usually posted it on that row or thread**. **Tell: your closing line asks the user for a link or file someone said they shared.** A finished investigation that found defects reports the finding and blast radius, then stops: deciding which findings matter and when to fix them is the user's call.

- **Study a tool or feature**: "study X" or "see if it improves our workflow". The deliverable is what X would change in the user's work: capability gap, gains per workflow, costs, a recommendation (📖 `references/branches.md#study-a-tool` when a blocker has gone).

- **Meeting record**: a transcript or meeting notes to record or act on. The transcript is ground truth. Every question on a meeting's decision list gets an outcome with its timestamp, and each one left undiscussed, parked or ambiguous goes to the user through `AskUserQuestion` before the plan or the record is finished: "not discussed" written into a plan is a question nobody asked (📖 `references/branches.md#meeting-record`). An auto-summary's action item naming a screen, button or field is checked against the code first. **Tell: your plan's outcome table has a row reading "not discussed" or "open" and no question has gone to the user.**

- **Task description**: a bug report, feature request, or work description. Read the relevant docs, then implement. A vague doc continuation ("let's continue", "do the next steps") builds only the items the doc and live state show as unblocked, names the rest rather than building past them, then wraps up with `done` (`quick-done` only when the build turned out small, single-domain and not heading for `/ship`). When a build plan will be approved on, research each item first: one `haiku` agent per item in parallel (📖 `../haiku/SKILL.md`), each brief starting with this skill on its item's topic and asking for the governing decision records and spec rows (📖 `references/branches.md#build-plan-research` for the rest of the brief). Open decisions that research surfaces get their own pass on how others handle each choice (📖 `../_shared/references/decision-first-output.md` § Earning the decision). Spot-check the claims against the files before building. **Tell: you are about to present a build plan and no research agent has reported on its items.** When the project requires a pass before a change ships (a score loop, a design review), the plan names it before the first edit; a direction the user picks from a question is not approval to skip it.

⚠️ **This skill is the preamble; the rest of the request belongs to whichever skill owns it.** Arguments often name a second job, and a hand-rolled agent for it lacks the owner's brief, evidence rules and verification. Check the skill list before dispatching any agent (📖 `references/branches.md#skill-routing` for the trigger table): a named skill or trigger match is invoked next, with these docs as context. **Tell: the request names a skill or trigger word, and your next call is `Agent` rather than `Skill`.** A reply you decide to draft for the user to send is the same case though nobody asked for it: it goes through `casual-message` before it appears, since an inline draft drifts from the sender's voice (26/11/2026: two inline drafts).

⚠️ **A second guess is the signal to stop and research, whatever the task.** It shows as a fix that didn't work followed by another theory, an explanation revised under pushback, a cause blamed then dropped, or a long run started to "see if it helps". Each guess feels like progress, so nothing says "you don't know yet". A mid-task symptom is a new domain with its own docs: grep the instruction files and task docs for its words, open what they point at (it usually records what was already tried), then measure the one open thing directly. Hand the searching to a `haiku` agent (📖 `../haiku/SKILL.md`) and keep the measuring. **Tell: your next change is a second theory, with no docs searched and no direct check run.**

---

## Plan Mode {#plan-mode}

If the next step is clear, proceed. If the approach isn't, and the answer would change the design, delegate the search before proposing: `Explore` for "where does X live", `Plan` for "how should I build this", and the project's CLAUDE.md for implementing work.

Plan mode's first phase is limited to `Explore` agents, a limit on code search only: it does not cancel a named skill or the per-item research a build plan owes. A brief that names skills gets each invocation as a plan step, run after approval, never re-run by hand from the task doc's rubric (📖 `references/branches.md#plan-mode`).

⚠️ **A question a delegated agent hands back is still the user's question, and writing it into the plan as a default is not asking it.** A `Plan` agent often ends with "decisions for you" and a recommended answer for each. Copied in as "defaults, overridable at approval", they become decisions nobody made, since a long plan gets approved unread. Put each through `AskUserQuestion` before `ExitPlanMode`. **Tell: your plan contains "overridable", "default unless", or an agent's question with its answer filled in.**

⚠️ **A subagent inherits plan mode, so one dispatched to MEASURE returns a plan to measure.** Searching and reading still work, which is why the limit goes unnoticed. Exit plan mode first, or defer the measurement until after approval and say which. 📖 `../_shared/references/explore-delegation.md` § How to Spawn. **Tell: you are about to spawn an agent to find out a fact about the world while the session cannot act on the world.**

---

## Shared Checkouts and Writes {#shared-checkout}

Before writing to a doc, check `ListAgents` for a live session that might be editing the same `current.md`; presence doesn't settle which checkout (📖 `../_shared/references/cross-session-messaging.md`).

⚠️ **When another session's work must finish first, the wait is yours to arrange, not the user's to relay.** Find the peer with `ListAgents`, say what you will touch, and subscribe with `SendMessage` `notify_when_idle: true`. Idle means its turn ended, not its work done, so act on its reply. **Tell: your closing line asks the user to report another session's progress.**

⚠️ **A live peer makes `git stash` unsafe for the whole session, and `git stash` answers no question.** To learn what a file held or which session wrote a line, read `git show HEAD:<path>` or `git diff HEAD -- <path>` instead; the full ban is in 📖 `../_shared/references/diff-ownership.md`, and `--keep-index` is no safer than a plain stash (📖 `references/branches.md#stash`, read before any stash). **Tell: you are about to stash for any reason other than an in-progress merge.**

---

## Decision-First on Every Turn After {#decision-first}

This holds for every later turn: **any turn that ends on a question states the decision needed before the report.**

The wrap-up skills (`done`, `quick-done`, `ship`) end with one `AskUserQuestion` call naming one to four open questions. On a brief to finish everything, ask the mid-work questions before the turn ends and build their answers rather than parking them in the task doc.

⚠️ **What goes first is the QUESTION, not your planning.** A build left incomplete, a next step you don't own, or two open paths all need that frame: the decision says what is unresolved, the report shows what you built. Applied from memory, the rule degrades into narrating working state: what you still need to read, the plan restated. That reads as diligence, so nothing stops it. **Tell: your reply opens by describing what you are about to do.** Most turns carry no decision and should open with the answer. 📖 `../_shared/references/decision-first-output.md` for the full carve-out.

⚠️ **A question a doc lists as open may already be answered in a sibling doc, and "ask me first" makes asking feel like step one.** Before asking about an open item, grep its `Related:` docs and the owning domain (a storage rule belongs to the storage domain even when a compliance doc lists it) for a recorded decision. If one exists, quote it inside the option, or the user answers again from another frame and two contradictory decisions land on one day. **Tell: you ask, or report a defect as new, without opening the doc's `Related:` docs.**

⚠️ **Any question about how the product behaves is asked only after the spec rows that govern it, and the signed quotation or contract's line on it where one exists, are read and quoted inside the options, and, where the spec is silent, after a short pass on how two or three strong products handle it.** It holds in plan mode and in every build turn after it, for who may see or do something and equally for what a customer is told, how a list groups records, or a visual convention. "The spec is silent" is an absence claim about your search, and the item's own row is where that search starts: the rows that settle a behaviour often sit elsewhere, in the module's general rows and the access, approval and integration modules, so search the whole spec by the behaviour's nouns (who is told, who may see, who approves, when it locks, what is configurable) before writing "silent" into an option. A reply that points back at the spec ("follow the BRS") means read those rows and build them, quoting them in the task doc, not ask again (📖 `references/branches.md#spec-rows`). How a screen handles a state for its user is `uiux`'s to design and build, not the user's to pick, unless it changes who can do or see something or what a customer is promised. A researched default feels checked because its sources are outside (25/11/2026: reverted over the quotation's line; 📖 `references/branches.md#spec-rows`). **Tell: an option describes product behaviour and carries no spec quote and no researched example, says the spec is silent after a search of one row, or recommends a researched default with no line from the signed quotation or contract.**

⚠️ **An open item about something nothing uses asks why before what.** Find the answer first (📖 `references/branches.md#unused-item`) and put it in the question. **Tell: your option offers to build or redesign something, and you have not looked up why nothing uses it.**

**Decision shapes**: not every question mark is a decision point. With several open paths:
- **One path**: name it, and explain why it's the one.
- **Several paths**: list them with each one's trade-off, then pick the best fit if the trade-off points one way, or name the dimension the user should decide on.
- **A missing fact**: if the decision hinges on something unmeasured, say what to measure and how it would change the decision.

📖 `../_shared/references/decision-first-output.md` for the full test logic on when a question-mark ending does or doesn't require a decision frame.