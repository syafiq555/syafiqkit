---
name: read-summary
description: Read task summary context and project instructions before answering investigative questions, implementing work, or starting a new domain within a session. When a request about current system behavior, a deploy question, a bug report, or an unfamiliar domain is asked, this skill finds and reads the right docs first — decisions and gotchas live there, not in the code alone, so skipping them is how confident-but-wrong answers happen.
---

# Read Summary

Task docs carry decisions and gotchas the code alone doesn't show. Reading them first prevents confident-but-wrong answers.

When scope changes (a new domain, a second repo, a host a fleet sweep reached that another repo owns, or a claim that shifts mid-conversation), reread the docs for that scope before asking anything about it; session-start docs are scoped to their domain. A regression starts fresh discovery rather than pivoting from prior findings, since the doc that explained the original behaviour rarely owns why it broke.

⚠️ **Live measurement evades the rule above, because measuring is not a scope change and feels rigorous.** A DB query, controller read or column grep returns a true fact, so a run of them reads as research while the domain's decisions go unopened. A query result needs corroborating; it is not the corroboration. **Tell: every citation in your reply is a query or a line number, and the domain's docs are unopened.**

---

## Discovery: Finding the Right Doc {#finding-docs}

Folder names are domain-scoped and rarely match how a user phrases a request (`payout` may own "refund" work). Search doc bodies and headers under `tasks/` by content, delegating as the Agents section describes. The hits are raw; your judgment ranks them. Skim the top hits, then read the full doc.

Once a doc lands, restate the user's claim and confirm the doc addresses that symptom, not a nearby topic mentioned in passing. An empty search is usually a search error (bad flag, typo, gitignored dir): search for something you know is there before concluding no doc exists. When a doc *points at* a file you can't find, run `git fetch` and check the upstream (`git log --oneline HEAD..@{u}`, `git ls-tree -r --name-only @{u} -- <dir>`) before reporting it missing: a checkout can sit behind its remote.

⚠️ **A matched line that answers your question is the strongest reason to open its file, and it reads as the reason you no longer need to.** The surrounding page holds what reframes it (a prior occurrence, a procedure already worked out), and this fires hardest on an unexpected match, which gets dismissed as coincidence. **Tell: you reasoned from a grep's output, and the files it named are still unread.**

---

## Agents

For doc discovery when no doc is already named, dispatch the `Explore` agent to search task docs by content, batching its searches rather than running one per pattern. A named path is read directly. While it runs, do other work; don't re-grep the same files, since verification happens *after* the report. 📖 `../_shared/references/explore-delegation.md` covers the rest, including what to delegate and what to keep.

⚠️ **If there is no other work, end the turn; do not manufacture the wait.** The harness re-invokes you when the agent finishes, so a `sleep` or a repeated `ReadNotifications` buys nothing. **Tell: you are about to make a call whose previous identical call returned nothing new, with no other work queued.** 📖 `../_shared/references/explore-delegation.md` § The Waiting Game

**Open the files a report names before concluding anything from it.** A report reads like a deliverable, so this form evades the matched-line rule above. Read `explore-delegation.md`'s ⚠️ on the returning report before stating a cause.

**Generated agents can drift from their templates.** An agent's `.md` holds only what its template had on generation day, and a stale agent still returns a normal-looking report. Validate its safety-critical constraints the first time a session dispatches it. 📖 `references/validating-generated-agents.md` has the checks.

---

## Reading Order {#read-order}

Follow every pointer in sequence: each layer (a `docs/` set, task docs, decisions, CLAUDE.md files, sibling repos, journal) holds facts the previous one didn't reach.

**Pointer chain (in sequence):**

- A project doc set under `docs/`, where one exists: `ARCHITECTURE-ESSENTIALS.md` first and **whole** (nothing points at this layer, and it holds constraints worth reading before any change), then `ARCHITECTURE.md` when the work spans subsystems and `PRD.md` when scope is in question. `PRD.md` earns its read before you report something as missing, since a "gap" is often a documented exclusion. A date or status line in these files can lag the task doc: on a date or decision the task doc wins, on whether something is built the code wins over both. Name any lag you find in your reply.
- Task doc (`current.md`): if explicitly redirected (Merged into, Supersedes, top-level pointer), follow to the live doc.
- Decisions and related files: follow `📖` pointers and `Related:` sections. A large verbatim copy (a contract, quotation or policy) is read by line range from its outline, never whole and never from a keyword grep's hits (they come cut from their section), even to check one claim; 📖 `references/doc-authority.md` § Reading a large verbatim copy through its outline gives the steps.
- CLAUDE.md files auto-load additively by directory (root, layer, domain, subdir), but a folder's `CLAUDE.md` loads only once a file under that folder is read, and refreshes now move rules into folder files on purpose (a frontend folder's rules live in its own `CLAUDE.md`). So before answering or acting on an area you haven't opened a file in, `Read` the `CLAUDE.md` of the folder the work belongs to, and follow the root's 📖 pointers into it. `.claude/rules/*.md` loads every session without a walk. Check `/context` for what actually loaded, not what should have.
- Sibling repos: if the question spans repos, read their `CLAUDE.md` and `CLAUDE.local.md`.
- Private journal: grep `~/.claude/notes/` when the answer hinges on interpersonal or commercial context not in code or docs.

⚠️ **Companion files are found by following pointers, not by search**, since grep omits `📖` references. Verify a pointer's path with `ls` before trusting it: a broken one or a typo reads silently as a missing fact.

---

## What Task Docs Are and Aren't {#doc-authority}

Task docs are authoritative for **decisions and gotchas**: why the code works this way, what will bite you, rejected alternatives. They are **not** live-state oracles; anything about a running system (prod's DB, a flag, an "open" bug) decays the moment anyone touches a server. If the answer depends on current state, go measure it. Where doc and live system disagree, the live system wins.

⚠️ **"The live system wins" assumes your measurement caught a settled state.** A system mid-reaction returns a value that is true and about to change, and a doc that disagrees looks stale by definition. Where something is in flight (a restart, deploy, retry, refresh), check the artifact's mtime against when the event began, or take two reads far enough apart to disagree.

**Three authority boundaries matter:**

- **Schema vocabulary doesn't decay**: column names, enum values, table shapes and headers stay stable. Read a table's column names from the docs before querying it.

- **Claims about external APIs are neither decided fact nor live-state.** "The vendor requires X" describes someone else's system, and nothing updates it. A false constraint makes the correct fix look unavailable, so spend one call checking it (the vendor's release notes as well as its docs page, which can lag them), then correct the doc.

- **Claims about your own code that are blocking-shaped matter most.** "This is impossible", "this must come first" or "we have no way to do this" reorder work and produce no failure to notice. Read the code a blocker rests on before planning around it, and say where a blocker is true for one case and false for another: a narrowed blocker is more useful than a deleted one.

  ⚠️ **Reading code is the wrong instrument when a blocker rests on a CONFIG VALUE, and that is where it stays wrong longest.** The adapter, client and credential path all still exist and read as healthy, so opening them confirms the blocker rather than testing it. **Resolve the value in that environment before treating the blocker as real.** A superseded integration's section needs a dead label at its heading, or the next reader debugging a live payment lands in the wrong adapter.

⚠️ **Confirm against what LOADS the technology, not what declares it.** An installed package or manifest entry is weak evidence, since a dependency is declared once and left unwired. Read the entry point: the layout that emits the script tags, the container registration, the actual import sites.

Reading a doc is also auditing it. Sweep the fields written once and checked least (`Quick Start`, `Status:`, `Immediate next actions`), since those carry the costliest staleness, and route what you find in the same turn to `task-summary` (project facts) or `update-plugin` (skill defects). An offer parked on the user's reply isn't routing: the finding dies with the conversation. A doc's silence about something doesn't make it incomplete; nobody has needed that path yet.

📖 `references/doc-authority.md`: edge cases where a doc's claim contradicts live state, external claims go stale, blockers differ by path, or a doc records both an ask and a conclusion.

---

## After Reading Docs {#what-comes-next}

Once the docs are read, the request decides what happens next, in one of four shapes:

- **Doc path only**: the user supplied a doc path or named a domain without an action. You've read the docs; stop here. If they then ask you to "now do X", the doc is context for work. If X uses a tool the doc researched, read that tool's source before running it, and do the same for a skill you are about to recommend: a skill's name states its subject, not the input it needs.

- **Investigation**: a question about current state. Read docs first, then investigate. For screenshots shown as evidence, identify what each one is evidence *of* before answering. A video's soundtrack is evidence too: a phone recording of a bug usually carries the reporter's spoken account, which frames cannot show, so extract and transcribe the audio before diagnosing (reuse an installed speech-to-text model, such as the `mlx_whisper` that `motion-clip`'s setup installs, before installing another). **Tell: you are reasoning from a video's frames and have not checked whether it has an audio track.** Verify you answered the question asked, not an adjacent one. **Any question about where work stands now ("what's the latest on X", "my part", "what's open", "what can I do next", "what's blocking") also reads the team's chat and fetches the remote** (the space the project's instructions name, through a chat tool where one is connected; `git fetch` then `git log HEAD..@{u}`) beside the docs and the tracker: decisions, teammates' handovers and asks waiting on the user land there before any doc records them. **Tell: your answer lists what someone can do next and no chat message was read.** A finished investigation that found defects reports the finding and blast radius, then stops; deciding which findings matter and when to fix them is the user's call.

- **Study a tool or feature**: "study X", "research X", "see if it improves our workflow". The deliverable is what X would change in the user's work: its capability gap against what they use now, gains per workflow, costs, and a recommendation. A prior decision to wait on X is input, not the answer: when its blocker turns out gone, ask what that unlocks. A vendor's docs page can lag its own release notes, so read both (for Claude Code, its CHANGELOG; 22/11/2026 the Code Mode page still listed a refusal two releases after the changelog dropped it).

- **Task description**: a bug report, feature request, or work description. Read the relevant docs (infer domain from keywords), then proceed to implement. When the work is a build a plan will be approved on (a feature, several cards, a new flow), research each item before presenting that plan: one `haiku` agent per item in parallel (📖 `../haiku/SKILL.md`), each brief starting with this skill on its item's topic and asking for the governing decision records and spec rows, the code it would touch with file:line, and how strong products handle it, with a URL per claim. The open decisions that research surfaces get their own pass on how others handle each choice before they reach the user (📖 `../_shared/references/decision-first-output.md` § Earning the decision). Spot-check the claims against the files, fold what holds into the plan, then build. A plan drafted from the task docs alone reads as researched because it cites them. The user asked for this pass on every build. **Tell: you are about to present a build plan and no research agent has reported on its items.**

⚠️ **This skill is the preamble; the rest of the request belongs to whichever skill owns it.** Arguments often name a second job ("research uiux", "then brief the designer"), and a hand-rolled agent for it lacks the owner's brief, evidence rules and verification. Check the skill list before dispatching any agent: a named skill or trigger match (UI research → `uiux`, designer brief → `design-handoff`, "I can't read all of this" → `understanding-guide`) is invoked next, with these docs as context. **Tell: the request names a skill or trigger word, and your next call is `Agent` rather than `Skill`.**

⚠️ **A second guess is the signal to stop and research, whatever the task.** It shows as a fix that didn't work followed by another theory, an explanation revised under pushback, a cause blamed then dropped, or a long run started to "see if it helps". Each guess feels like progress, so nothing says "you don't know yet". A mid-task symptom is a new domain with its own docs. Research first: grep the instruction files and task docs for the symptom's words, open what they point at (it usually records what was already tried), check the skill list for an owner, then measure the one open thing with the smallest direct check. Hand the searching to a `haiku` agent (📖 `../haiku/SKILL.md`) and keep the measuring. **Tell: your next change is a second theory, with no docs searched and no direct check run.**

---

## Plan Mode {#plan-mode}

If the next step is clear, proceed. If the approach isn't, and the answer would change the design (where a surface lives, how to design a solution), delegate that search before proposing: `Explore` for "where does X live", `Plan` for "how should I build this", and the project's CLAUDE.md for implementing work.

Plan mode's own workflow restricts its first phase to `Explore` agents. That limit is about code search: it does not cancel a skill the request names, nor the per-item research pass a build plan owes (§ After Reading Docs, Task description). A `uiux` research pass, a `design-handoff` read or a `haiku` research agent is read-only and runs in plan mode; skipping it there is the same miss.

⚠️ **A question a delegated agent hands back is still the user's question, and writing it into the plan as a default is not asking it.** A `Plan` agent often ends with "decisions for you" and a recommended answer for each. Copied in as "defaults, overridable at approval", they become decisions nobody made, since approving a long plan approves every line unread. Put each through `AskUserQuestion` before `ExitPlanMode`. **Tell: your plan contains "overridable", "default unless", or an agent's question with its answer filled in.**

⚠️ **A subagent inherits plan mode, so one dispatched to MEASURE returns a plan to measure.** Searching and reading still work, which is why the limit goes unnoticed. Exit plan mode first, or defer the measurement until after approval and say which. 📖 `../_shared/references/explore-delegation.md` § How to Spawn. **Tell: you are about to spawn an agent to find out a fact about the world while the session cannot act on the world.**

---

## Shared Checkouts and Writes {#shared-checkout}

Before writing to a doc, check `ListAgents` for a live session that might be editing the same `current.md`. Presence narrows the question without settling which checkout they're in; 📖 `../_shared/references/cross-session-messaging.md` covers what it does and doesn't tell you.

⚠️ **When another session's work must finish first, the wait is yours to arrange, not the user's to relay.** Find the peer with `ListAgents`, say what you will touch, and subscribe with `SendMessage` `notify_when_idle: true`. Idle means its turn ended, not its work done, so act on its reply. **Tell: your closing line asks the user to report another session's progress.**

⚠️ **A live peer makes `git stash` unsafe for the whole session.** The full ban is in 📖 `../_shared/references/diff-ownership.md` (loaded only by wrap-up and doc skills), so a session that reads docs and then builds meets the command with nothing else loaded. The operative half: **`git stash` answers no question.** What a file used to contain, whether a failure predates your edits, which session wrote a line: `git show HEAD:<path>`, `git diff HEAD -- <path>`, `git log -S`, or a second worktree at HEAD, none of which move a byte. Reserve it for a merge that needs one path parked. `--keep-index` still takes every *unstaged* file, which on a shared checkout is a peer's in-flight work. **Tell: you are about to stash for any reason other than an in-progress merge.**

---

## Decision-First on Every Turn After {#decision-first}

This skill sets a rule for every later turn: **any turn that ends on a question states the decision needed before the report.** A build incomplete, a next step you don't own, or two paths open all need that frame: the decision says what is unresolved, the report shows what you built.

The same rule applies to the wrap-up skills (`done`, `quick-done`, `ship`) on their final turns: name open questions, one to four through one `AskUserQuestion` call. On a brief to finish everything, ask mid-work questions before the turn ends and build their answers rather than parking them in the task doc.

⚠️ **What goes first is the QUESTION, not your planning.** Applied from memory for dozens of turns, the rule degrades into narrating working state: what you still need to read, which calls are blocked, the plan restated. That reads as diligence, so nothing stops it. **Tell: your reply opens by describing what you are about to do.** Most turns carry no decision and should open with the answer. 📖 `../_shared/references/decision-first-output.md` for the full carve-out.

⚠️ **A question a doc lists as open may already be answered in a sibling doc, and "ask me first" makes asking feel like step one.** Before putting an open item to the user, grep its `Related:` docs and the domain that owns the subject (a storage rule belongs to the storage domain even when a compliance doc lists it) for a recorded decision. If one exists, quote it inside the option, or the user answers again from another frame and two contradictory decisions land on one day. **Tell: you ask, or report a defect as new, without opening the doc's `Related:` docs.**

⚠️ **Any question about how the product behaves is asked only after the spec rows (or the quotation) that govern it are read and quoted inside the options, and, where the spec is silent, after a short pass on how two or three strong products handle it.** It holds in plan mode and in every build turn after it, for who may see or do something and equally for what a customer is told, how a list groups records, or a visual convention. A build feels researched because its items were, while each decision it surfaces is asked from the codebase's current state, and the spec often settles it (21/11/2026: dashboard access asked bare, answered by the BRS row "Permissions are independently configurable by function and data scope"; 22/11/2026: a returns line, order-list rows and status colours were each asked bare mid-build and sent back as "Check brs", "Research rbs", "Research", then settled by BRS M12.16, BRS M9.20 and three design systems). 📖 `../_shared/references/decision-first-output.md` § Earning the decision for the research pass. **Tell: an option describes product behaviour and carries no spec quote and no researched example.**

⚠️ **An open item about something nothing uses (a template with no sender, a notification with no dispatch site, a job no schedule runs) asks why before what.** Its options (redesign it, wire it up, delete it) all assume a purpose waiting to be served. Find the answer first: `git log -S '<its name>'` (what last used it and what replaced it) and live data (whether the moment it would fire ever happens), and put it in the question. **Tell: your option offers to build or redesign something, and you have not looked up why nothing uses it.**

**Decision shapes**: not every question mark is a decision point. With several open paths:
- **One path**: name it, and explain why it's the one. "We should X because Y" is a complete decision.
- **Several paths**: list them with a trade-off ("X costs time, Y costs money, Z is reversible"), then pick the best fit if the trade-off points one way, or name the dimension the user should decide on.
- **A missing fact**: if the decision hinges on something unmeasured, say what to measure and how it would change the decision.

📖 `../_shared/references/decision-first-output.md` for the full test logic on when a question-mark ending does or doesn't require a decision frame.