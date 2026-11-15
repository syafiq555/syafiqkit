# Standard shapes for a PRD and an architecture doc

What a reader expects to find when they open a file with one of these names. Consult when writing or restructuring either document; the skill body owns *what may be claimed*, this file owns *what shape the claims go in*.

**`ARCHITECTURE-ESSENTIALS.md` is deliberately not here.** It is the one file in the set with no external convention to conform to — it exists because a coding agent cannot afford a long architecture document, and its shape is decided entirely by its admission test (*can this be violated in a single line, silently?*), which the skill body owns. Nobody opens it expecting arc42, so it carries no shape promise to keep; judge it by whether it is still short enough to be read whole, never against a template.

That asymmetry is worth noticing, because it explains where this file's risk actually sits: a document with a well-defined internal test tends to come out right, and the two with widely-known external expectations are the ones a sourcing-first pass gets wrong.

The reason a shape matters at all: these filenames are a promise. Someone opening `PRD.md` is looking for personas, metrics and acceptance criteria, and someone opening `ARCHITECTURE.md` is looking for a diagram and a runtime trace. A well-sourced document that answers different questions than its title advertises is read as incomplete rather than as differently-scoped, and the reader's next move is to go looking for the real one.

## Architecture

Two published conventions, and they solve different problems. Both are worth knowing by name because a team that has adopted one will expect it.

**[arc42](https://arc42.org)** — twelve numbered sections, stable since 2005, and the safe default when a doc has to serve several audiences:

1. Introduction & Goals — including *quality goals*, which are worth ranking rather than listing, since they conflict and the ranking is how a trade-off gets settled
2. Constraints — what you are not free to change
3. Context & Scope — the system's boundary and its external partners
4. Solution Strategy — the handful of decisions everything else follows from
5. Building Block View — the codemap: which module owns what
6. Runtime View — traced scenarios, not structure
7. Deployment View — what runs where
8. Crosscutting Concepts — the conventions that recur everywhere
9. Architecture Decisions
10. Quality Requirements — and how each is verified
11. Risks & Technical Debt
12. Glossary

**[C4](https://c4model.com)** — four zoom levels (context → container → component → code), diagram-first and lighter. Better when the main deliverable is orientation rather than a record.

Whichever frame, three things carry most of the value and are the ones most often missing:

- **A diagram.** Even ASCII. Prose describing a topology is read three times and understood once; a picture inverts that.
- **A runtime view.** Structure says what exists, a traced request says how it behaves — and it is where a reader learns which flows a change will perturb. Trace the two or three that carry the most risk.
- **A glossary.** Every project has words a newcomer will mis-grep. This is the cheapest section to write and the one that saves the most time.

## PRD

No single canonical template, but the recognised shapes agree on more than they differ. Worth knowing:

- **Amazon PR/FAQ (Working Backwards)** — write the launch announcement and customer FAQ first; if the press release is dull the product is dull.
- **[Shape Up](https://basecamp.com/shapeup)** — a *pitch* of five ingredients: problem, appetite, solution, rabbit holes, and **no-gos** (explicitly excluded scope).
- **Google's design doc** — context and scope → **goals and non-goals** → design → **alternatives considered** → cross-cutting concerns.

What a reader expects in a file named `PRD.md`:

| Section | Answers |
|---|---|
| Platform | Web, iOS, Android or adaptive, stated first (see the mapping table below) |
| Problem & positioning | Why does this exist, and why now |
| Personas | Who is it for — goals, pains, behaviour, what success means for each |
| Success metrics | What number tells you it worked, with a target |
| Scope | What it does today |
| User stories & acceptance criteria | What "done" means, testably |
| Out of scope | What is deliberately not built, and why |
| Roadmap | What comes next, and what is explicitly undated |
| Open questions | What is unresolved, who decides, what it blocks |

## PRD sections that carry the impeccable product record

The `uiux` skill's `impeccable` module used to keep a root `PRODUCT.md`; its schema now lives in the PRD. Every PRODUCT.md section maps to a PRD section, so `impeccable init` fills these and nothing is lost. Where a PRODUCT.md section has no equivalent above, the PRD gains a section **under the same heading**, so tooling and readers find it by the name they know.

| PRODUCT.md section | PRD section | How |
|---|---|---|
| Platform | `## Platform` (new) | Bare value: `web`, `ios`, `android` or `adaptive` (one product that genuinely adapts its design language per OS). Mobile web is `web`; a native wrapper around a website is not native. Absent means `web`. Native values send UI work to the impeccable iOS and Android references. |
| Stack | `## Stack` (new, greenfield only) | The user's answer on what to build with, including "delegated: what was chosen and why". Omit when an existing codebase answers it (ARCHITECTURE.md owns the detail). |
| Users | Personas | Equivalent. Primary user, situation and job first; extra audiences only when confirmed. |
| Product Purpose | Problem & positioning, with Success metrics | Equivalent: purpose and why it exists go in the first, what success means in the second. |
| Positioning | Problem & positioning | Equivalent: the mechanism or claim a neighbouring product could not truthfully copy. |
| Operating Context | `## Operating Context` (new) | Workflows, environments, tools, documents and rituals that are factual parts of using or judging the product. |
| Capabilities and Constraints | Scope, plus `## Constraints and Terminology` (new) | Confirmed functionality is Scope. Technical constraints and the project's vocabulary get the new section. Explicitly undecided product facts go to Open questions, with who decides. |
| Brand Commitments | `## Brand Commitments` (new) | Existing name, voice, assets and identity constraints the owner made binding. Omit when none. DESIGN.md cites this, never restates it. |
| Evidence on Hand | `## Evidence on Hand` (new) | Real content, data, testimonials, case studies and assets, with paths, plus the absences future work must not fabricate. |
| Product Principles | `## Product Principles` (new) | Three to five durable strategic principles from confirmed answers. No visual recipes. |
| Accessibility and Inclusion | `## Accessibility & Inclusion` (new) | Known user needs or the required standard. Omit when none was established. |

Rules carried over from the init flow: write only confirmed facts and marked open decisions; record the undecided instead of inventing it; no visual worlds, palettes, typography or page concepts in the PRD (those go to `docs/DESIGN.md`); no invented testimonials, customers, benchmarks, pricing or licensing. Where the file carries an `<!-- impeccable:product-schema N -->` comment, copy it verbatim to the top of the PRD so the module can tell a deliberately short record from one written before a section existed. A section the project has not decided is kept and marked `[TBD]` under the rule below, which suits the sections the PRD name promises. The sections above that are new are the exception: omit those when irrelevant, as the init flow does, rather than filling them with generic prose.

**Non-goals earn their own named section** — Shape Up, Google and the ADR tradition converge on this independently, which is unusual enough to be worth weighting. It is the section that prevents a whole feature being invented, and the one most often dropped because absence feels like it needs no documenting.

## The gap that is not an omission

An adoption pass will find a repo that records constraints richly and product intent not at all — code and task docs carry escrow rules and column semantics, while personas, metrics and acceptance criteria live only in someone's head. That asymmetry is the normal case, not a failure of the search, and it creates the trap this file exists to name.

**Keep the standard section and mark the gap; do not drop the section because the repo is silent about it.** A heading marked `[TBD — no target recorded]` tells a reader that nobody has decided, which is a real and actionable finding. Silently omitting it produces a document that looks finished, and the missing metric is then invisible to everyone who reads it afterwards — including the person who could have supplied it in a sentence.

This is the one place where the skill's general instinct — delete an empty section rather than fill it with plausible prose — needs qualifying. Deleting is right for a section this project genuinely has no analogue for. Marking is right for a section the document's own name promises and the project simply has not decided yet. The distinction is whether a reader would come looking for it.

Where a fact is derived rather than transcribed, tag it inline so a reader can tell which is which — a persona inferred from the code's own flows is a reasonable starting point and a bad thing to plan against unnoticed. `[SOURCED]` / `[INFERRED]` / `[TBD]` costs three words per line and turns an unverifiable document into a review checklist. Tags are content, not scaffolding: a later pass tidying them away destroys the only record that the gap exists.
