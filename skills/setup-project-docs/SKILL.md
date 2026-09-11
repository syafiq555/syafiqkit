---
name: setup-project-docs
description: Establish a project's core documentation set — PRD, ARCHITECTURE.md, ARCHITECTURE-ESSENTIALS.md and the CLAUDE.md/AGENTS.md entry points — either for a greenfield project being scoped or for an EXISTING codebase adopting docs for the first time. Use when the user says "set up the docs", "we need a PRD", "scaffold the project docs", "adopt this repo", "there's no documentation here", "write an architecture doc", "onboard this codebase", "document what this thing actually does", or names the five-file doc structure. Also fires when work is about to start on a repo whose constraints live only in people's heads or in scattered meeting notes. Do NOT use for capturing one gotcha or pattern into an existing CLAUDE.md (that's `update-claude-docs`), for a feature's task doc under `tasks/` (that's `task-summary`), for an end-user guide (`user-manual`), or for shrinking docs that already exist (`condense-claude-md` / `condense-task-doc`).
---

# Set Up Project Docs

Establish the documentation layer a project reads before every session: what it must do, how it is built, and the short list of rules that break it.

## The set, and why it splits this way

| File | Answers | Read when |
|---|---|---|
| `docs/PRD.md` | What must it do, for whom, and what are we deliberately not building? | Scoping, or arguing about whether something is in scope |
| `docs/ARCHITECTURE.md` | How is it built, and what is still undecided? | Designing a subsystem |
| `docs/ARCHITECTURE-ESSENTIALS.md` | What will I get wrong in the next hour? | Before writing any code |
| `CLAUDE.md` | Everything an agent needs, plus where the above live | Automatically, every session |
| `AGENTS.md` | — | A pointer to CLAUDE.md, so non-Claude tools find their way |

The split earns itself through **the essentials file**. An agent about to write a line of code cannot afford a 300-line architecture document, and one that reads only headings will miss the rule buried in prose. Essentials is the file it can read whole, every time, without cost.

That gives a test for what belongs there: **can this be violated in a single line, silently?** A rule about tenancy scoping or money representation qualifies. A deployment concern, a blocked-on table, or a project-management fact does not — those go in ARCHITECTURE.md and are cited from essentials at most.

Give each essentials rule its own heading, so the table of contents *is* the rule list — a category heading with rules buried in prose underneath defeats the file's purpose, since an agent scanning headings sees topics rather than rules.

Number them if you like the scannability, but **cite them by name, not by number or count.** "The masking rule" survives an insertion above it; "rule 4" and "the eight rules" both go quietly wrong the moment the set changes, and the files doing the citing are agent definitions and sibling docs nobody re-reads. Renumbering is cheap and local; hunting down every stale citation is neither.

## First: has this already run?

A third case sits in front of the two below and is the easiest to walk past, because every symptom of it looks like greenfield — you open `docs/`, the files are there, and the natural reading is that someone made them and you are now improving them. What that misses is the **task doc from the previous run**, which records why the set is shaped as it is, what was deliberately deferred, and which of its claims are already known stale. Rebuilding that context from the files themselves produces a confident pass that re-decides settled questions and re-reports resolved gaps.

Invoke `read-summary`, or search `tasks/` for a doc owning the doc set (`ARCHITECTURE-ESSENTIALS`, `PRD.md`, `doc set`), **before reading the docs themselves** — a doc's own contents cannot tell you what a prior session chose not to put in it. Measured 2026-09-03: a session verified all three files clean, wrote a report, reshaped both docs, and only found `tasks/infrastructure/project-docs/current.md` after the user twice said a doc existed. Its `Status:` line still read *uncommitted* for work committed two days earlier — the ordinary task-doc decay direction — so the next session would have started by re-committing what was already shipped.

Where that doc exists, this is an **update** and the pass owes it a write-back: what changed, what is now uncommitted, and any decision the pass made. Where it does not, create it, since a doc set nothing points at is the failure this skill's own handoff section warns about.

## Greenfield versus adoption

These are different jobs sharing an output shape, and the difference is where truth lives.

**Greenfield** — the decisions exist in scope docs, meeting notes and someone's head. Your job is derivation: read the source of truth, and write views over it. Nothing is discovered; everything is transcribed and organized. The risk is inventing a constraint nobody agreed to, so every rule you write should trace to something recorded.

**Adoption** — the code is ground truth and it disagrees with people. Your job is archaeology, and the risk inverts: a doc that describes the intended system rather than the running one is worse than no doc, because it will be trusted. What the code does is what the system does, whatever anyone says.

### Adopting an existing codebase

Read before you write, and prefer evidence in this order: **the code, then the tests, then git history, then what people tell you.** A test asserting behaviour is stronger evidence than a comment claiming it; a commit that fixed a bug records a real constraint; a README often describes the system as of two years ago.

⚠️ **A dependency manifest is a statement of intent, not of what runs.** `package.json`, `composer.json`, `requirements.txt` list declared packages, not active ones — a package unwired silently when imports stop is declared forever. Confirm against entry points (layout template, DI container, bootstrap) or import sites before naming the stack. The failure is silent in both directions: a phantom framework directive produces no error. **Tell: you are about to name a framework and your source for it is a dependency list.**

⚠️ **Docs asserting a mechanism decay the same way — nobody edits when the code is replaced.** Disproof is a **targeted zero**: the token the mechanism requires, counted across the tree. Pick the string that cannot run without it, count it, let a zero settle it. Record contradictions rather than picking a side quietly; a doc that still teaches the dead mechanism keeps being read. **Tell: you are copying a mechanism from one doc into another and have not counted the token it requires.**

Hunt for patterns that signal load-bearing constraints — things that survived past the point where an obvious refactor would have removed them. Look for:

- **Defensive guards and validation that seem redundant.** Someone added them for a reason, usually after an incident. `git log -S` on the guard finds the commit that introduced it, and the message often carries the constraint.
- **Comments explaining why something isn't the obvious thing.** These mark exactly the places where the obvious refactor breaks production.
- **Duplication that survived** several refactors. Code that looks collapsible and has repeatedly not been collapsed is usually load-bearing.
- **Anything touching money, auth, tenancy, or a regulator.** These carry constraints whose violation is silent and expensive.

⚠️ **Where the code and a stakeholder disagree, record the disagreement rather than resolving it.** Writing down one side as fact is how a doc becomes confidently wrong. Name both and say which is running in production — that is a finding worth surfacing, and often the most valuable thing the pass produces.

Where a constraint is real but its reason is lost, say so: "this exists and predates anyone here; removing it broke X in 2023" is more useful than silence and far more useful than a guess.

#### Surveying a codebase too large to read

Past a few thousand lines you cannot read the whole thing, and the survey has to be delegated. Scale the fan-out to the repo: one `Explore` where the interesting surface is a handful of directories, several when the system splits into areas that can be searched independently.

**Partition by subsystem, not by file count.** An agent asked to "survey `app/`" returns a directory listing with prose around it; one asked "where does money get calculated, and what guards surround it" comes back with the constraint. Give each a question the essentials file needs answered — how tenancy is enforced, where money is represented, what the auth boundary is, which external systems are called and what happens when they fail. A partition that mirrors the questions you're trying to answer also keeps two agents from reading the same files.

⚠️ **An `Explore` report is orientation, not evidence.** A summary drops the line a constraint turns on. Treat it as a map: it tells you which files to open.

**Verify before a constraint reaches a doc**, because documented constraints get trusted. Three checks: (1) Open the file at the line — if the report cannot say where a constraint lives, it has not found one; (2) Grep every identifier (symbol, path, key, name) — a fabricated identifier wears credibility from surrounding facts; (3) Ask what would have to be true — a guard implies callers that could violate it, a "we always do X" implies no counter-examples. A report uniformly confident across a large survey deserves more checks, not less. 📖 `../_shared/references/explore-delegation.md` for batching, waiting and count verification.

## Writing them

Derive from what exists rather than from a template's idea of a project. Essentials stays short enough to read whole; ARCHITECTURE.md can be long because it's read in sections; a PRD is as long as the scope genuinely is.

⚠️ **These filenames are a promise about shape, and sourcing discipline alone will not keep it — followed faithfully against a repo that records constraints richly and product intent not at all, it yields a well-verified document of the wrong kind.** Someone opening `PRD.md` expects personas, success metrics, user stories and acceptance criteria; someone opening `ARCHITECTURE.md` expects a diagram, a runtime trace and a glossary. Miss those and the doc reads as incomplete rather than as differently-scoped, and its real content — which may be excellent — gets skipped past on the way to looking for the file they wanted. Measured 2026-09-01: an adoption pass produced a "PRD" with no personas, metrics or acceptance criteria and an "ARCHITECTURE.md" with no diagram, runtime view or data model, reported both as complete, and the user had to say twice that neither resembled the document its name names. 📖 `references/standard-shapes.md` — arc42, C4, PR/FAQ, Shape Up, and the section-by-section expectations for both files. **Read it before writing either one; pick the frame first and say which you picked.**

**A section the repo is silent about gets kept and marked, not deleted** — and this is the one instruction most likely to be misread as license to omit. Filling an empty heading with plausible prose is still wrong, but so is dropping a section the document's own name promises: a heading marked `[TBD — no target recorded]` reports that nobody has decided, which is actionable, whereas silent omission produces a document that looks finished and makes the gap invisible to the very person who could close it in a sentence. The test is whether a reader would come looking for it — delete only what this project has no analogue for. Where a claim is derived rather than transcribed, tag it (`[SOURCED]` / `[INFERRED]` / `[TBD]`) so a reader can tell which is which, and treat those tags as content a later tidying pass must not strip.

State what is **not** being built and why, in both the PRD and essentials. This is the section that stops work nobody wanted, and it's the one most often omitted because absence feels like it needs no documenting. It does: "no self-service registration, because users are onboarded by hand" prevents a whole feature from being invented.

Where something is undecided, name it, name who decides it, and say what it blocks. A doc that quietly picks a default for an open question has made someone else's decision invisibly.

## Wiring it together

CLAUDE.md indexes the set and says which file wins when two disagree — usually whatever is closest to the source of truth (a task doc over a derived view, code over both). AGENTS.md is a pointer, not a copy; two instruction files drift and the copy is always the stale one.

If the project has agents under `.claude/agents/`, their Bootstrap tables need to learn the new paths — an agent written before the docs existed will never read them. 📖 `agent-setup` owns that, and a doc move without it leaves the fleet citing paths that no longer resolve.

**Restructuring a doc the fleet already cites needs the same handoff, and it hides better than a move does.** A rewrite keeps the filename, so every Bootstrap row still resolves while the *sections* they promise get renamed, folded or dropped — an agent then reads a real file looking for a heading that is gone, and nothing errors anywhere. Re-run `agent-setup` after reshaping a doc, not only after creating or moving one; the same applies when a doc keeps its headings but changes what a reader may conclude from it, since a row describing the old contract is wrong in a way no path check can see.

## Verifying the docs you wrote

Distinct from verifying what a survey agent told you — that happens before a fact is written, and is covered above. This is the pass over the finished files.

Grep every path the new docs cite and confirm it resolves — a relative path written from the wrong directory is the common failure, and it reads fine.

Then check the facts you can check. Figures, dates, identifiers and file paths should each trace to a source; a number appearing in a derived doc and nowhere in the source is either wrong or invented. Read the essentials file whole and ask whether a stranger could follow it before their first edit.

**Verifying a figure settles whether it is right, never whether it belongs.** An exact count decays silently on the next commit; nothing recomputes it. Prefer the shape plus the command to re-derive it. Keep an exact figure only where precision itself is the argument — a **zero** ("no view carries an `@vite` directive") is load-bearing in a way that 173-vs-175 never is, because the reader's conclusion flips when it stops being zero. **Tell: you have verified a count and are about to paste the digits into a doc nobody will recount.** The same trap applies to counting the doc's own contents — "the eight rules" fails identically and for the same reason.

## After

Recommend `/agent-setup` if the project has agents that now need to bootstrap from these files, and `update-claude-docs` as the ongoing home for gotchas discovered later — this skill establishes the set, that one maintains CLAUDE.md within it.

**Say who maintains the three new files**, because nothing points at them and an unowned set decays fastest. This skill runs once; `read-summary` reads it at the top of its pointer chain. ⚠️ **A doc set carrying `[TBD]` headings and `[SOURCED]`/`[INFERRED]` tags needs those named as protected at handoff.** Pruning passes see them as empty sections and unverified markers — the purest form of what they remove — so the convention must reach the pruner, not live only in the doc it governs. The plugin carries this in `condense-task-doc`, `condense-claude-md`, and the `claude-md-pruner` template; state it in the project too, since hand-run cleanup obeys none of them. The one thing neither can judge: whether a rule still passes the essentials file's own admission test. Growth is the failure mode — a file that stops being read whole has lost its value while every line remains true, so the maintenance question is "is this still short enough that someone reads all of it."
