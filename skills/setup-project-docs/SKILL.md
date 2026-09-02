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

## Greenfield versus adoption

These are different jobs sharing an output shape, and the difference is where truth lives.

**Greenfield** — the decisions exist in scope docs, meeting notes and someone's head. Your job is derivation: read the source of truth, and write views over it. Nothing is discovered; everything is transcribed and organized. The risk is inventing a constraint nobody agreed to, so every rule you write should trace to something recorded.

**Adoption** — the code is ground truth and it disagrees with people. Your job is archaeology, and the risk inverts: a doc that describes the intended system rather than the running one is worse than no doc, because it will be trusted. What the code does is what the system does, whatever anyone says.

### Adopting an existing codebase

Read before you write, and prefer evidence in this order: **the code, then the tests, then git history, then what people tell you.** A test asserting behaviour is stronger evidence than a comment claiming it; a commit that fixed a bug records a real constraint; a README often describes the system as of two years ago.

⚠️ **A dependency manifest is a statement of intent, not of what runs — and it sits below every rung of that ladder while being the first file anyone opens.** `package.json`, `composer.json`, `requirements.txt` and their kin are the fastest way to describe a stack and the easiest to be wrong about, because a package is declared once and unwired silently: nobody deletes the dependency when they stop importing it. Measured 2026-09-01 on a Laravel app whose manifest listed `vite`, `tailwindcss` and `alpinejs` — a survey reported "Vite + Tailwind + Alpine" and the running app was Bootstrap 5 and jQuery off static files, with **no** `@vite` directive in any of 518 views, no `tailwind.config.js`, no build output directory, and zero uses of `x-data` against 173 files using jQuery. Its own frontend CLAUDE.md had documented half of this and its `[Scope]` header still named Alpine.

So confirm a declared tool against the thing that would have to load it — the layout or entry template for a frontend, the DI container or bootstrap for a backend, the actual import sites — before it reaches an architecture doc. Two properties make this worth the extra command every time: the failure is silent in both directions (a directive from the phantom framework produces no error and no effect), and the wrong answer here is the one most likely to be copied onward, since a stack line is exactly what a reader quotes rather than checks. **Tell: you are about to name a framework in a doc and your source for it is a dependency list.**

⚠️ **The same shape reaches every doc asserting a MECHANISM, and there the existing docs contradict each other rather than the manifest — so the ladder tells you which side wins and not that a side is losing.** A README describing an auth scheme, a session model or a caching strategy is making a claim about running code in exactly the way a manifest makes one about a stack, and it decays the same way: nobody edits the doc when the mechanism is replaced. What makes it worth a dedicated check is that the disproof is a **targeted zero** and takes one command — the mechanism's own required token, counted across the tree. Measured 2026-09-01 adopting a Laravel + Next.js repo whose README documented cookie-based Sanctum auth with `credentials: 'include'` and a CSRF-cookie step: both strings appeared **zero** times in the frontend, while the real Bearer-token key appeared in the API client, and the project's own CLAUDE.md separately *forbade* the cookie approach the README taught. Pick the string the claimed mechanism cannot run without, count it, and let a zero settle it — that number is load-bearing in a way a survey of the auth directory is not, and it belongs in the finished doc, since a reader's conclusion flips the moment it stops being zero. Record the contradiction rather than quietly fixing the loser: a doc that still teaches the dead mechanism will keep being read. **Tell: you are copying a mechanism from one doc into another and have not counted the token that mechanism requires.**

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

⚠️ **An `Explore` report is orientation, not evidence — and this skill's findings are exactly the kind it reports least reliably.** A summary drops the specific line a constraint turns on while sounding complete, and the constraints worth documenting here look like ordinary code until you read why they're there. Treat what comes back as a map: it tells you which files to open, and you open them.

**Verify before anything reaches a doc, because a documented constraint gets trusted and stops being questioned.** Three checks, cheapest first:

- **Open the file at the line.** Every rule bound for the essentials file gets read at its source, not accepted from a summary. If a report cannot tell you where a constraint lives, it has not found one.
- **Grep every identifier the report hands you** — a symbol, path, config key, table name. A fabricated identifier arrives wearing the credibility of the true facts around it, and a name is precisely the token that gets quoted onward into a doc rather than checked.
- **Ask what would have to be true.** A claimed constraint usually implies something else observable: a guard implies a caller that could violate it, a "we always do X" implies no counter-example in the tree. Grep for the counter-example. Finding one means the rule is narrower than reported — which is itself the finding.

A report that is uniformly confident across a large survey deserves more of this, not less; the areas an agent found genuinely hard to read are the ones where a hedge should have appeared. 📖 `../_shared/references/explore-delegation.md` for batching, waiting and count verification.

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

Then check the facts you can check. Figures, dates, identifiers and file paths should each trace to a source; a number that appears in a derived doc and nowhere in the source is either wrong or was invented during the pass. Read the essentials file whole, as its reader meets it, and ask whether a stranger could follow it before their first edit.

**Verifying a figure settles whether it is right, never whether it belongs.** An exact count of models, controllers, views or tests is accurate on the day it is written and starts decaying on the next commit — silently, because nothing recomputes it and a plausible number invites no suspicion. Worse, it hands every future reader a maintenance debt they never agreed to, so the honest question after confirming a count is what it buys a reader that an order of magnitude would not. Usually nothing: "a couple of hundred services" tells someone to grep before adding one, which is the actual decision, while "147 services" tells them the same thing and goes stale. Prefer the shape plus the command to re-derive it, and keep an exact figure only where the *precision itself* is the argument — a **zero** ("no view carries an `@vite` directive", "axios is used by zero files") is load-bearing in a way that 173-vs-175 never is, because the reader's conclusion flips when it stops being zero. **Tell: you have just verified a count and are about to paste the digits into a doc nobody will recount.**

The same instinct applies to counting the doc's own contents — "the eight rules" and a `## Scale` table fail identically, and for the same reason.

## After

Recommend `/agent-setup` if the project has agents that now need to bootstrap from these files, and `update-claude-docs` as the ongoing home for gotchas discovered later — this skill establishes the set, that one maintains CLAUDE.md within it.

**Say who maintains the three new files, because nothing points at them and an unowned doc set decays fastest.** This skill runs once; `read-summary` reads the set at the top of its pointer chain, and `claude-md-pruner` carries it in its staleness lane alongside CLAUDE.md and task docs. Name both when handing off, and name the one thing neither can judge for you: whether a rule still passes the essentials file's own admission test. Growth is the failure mode there — a file that stops being read whole has lost its entire value while every line in it remains true, so the maintenance question is never "is this still correct" but "is this still short enough that someone reads all of it."
