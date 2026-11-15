---
name: uiux
description: >
  Design judgement for everything a person sees: web apps, websites, native mobile apps (iOS, Android, Flutter), emails, PDFs, slides and documents. Builds, redesigns, polishes, CRITIQUES/audits/reviews ("what's wrong with this", "does this look generic, cheap, templated or AI-made") and RESEARCHES ("case study", "benchmark", "how do other apps do this", answered with sourced real products, never from memory). The one design skill, combining its modules on each job: `taste-web` and `taste` together for public pages (company website, landing, marketing, product, pricing, portfolio, event, editorial, "make it wow"; tasteskill), and `impeccable` (impeccable, polish, audit, critique, bolder, quieter, distill, harden, clarify, typeset, layout, adapt, animate, colorize, delight, overdrive, onboard, optimize, shape, live, generate, init, document, extract). A review is one combined review with one score, carrying every module's checks. Fires on explicit asks (redesign, rethink, polish, "make this nicer", "use the design skills"), on a screenshot or a report of what someone saw ("looks wrong", "shows the old one"), on greenfield projects and dated design languages. Not for backend-only work, charts (dataviz), a brief for someone else to design (design-handoff), or product images and clips (product-still, motion-clip); when what to build is still open, brainstorming runs first.
allowed-tools:
  - Bash(npx impeccable *)
  - Bash(*/uiux/modules/impeccable/scripts/impeccable *)
hooks:
  Stop:
    - hooks:
        - type: command
          command: 'f=""; for s in "${CLAUDE_SKILL_DIR:-}" "${CLAUDE_PLUGIN_ROOT:+$CLAUDE_PLUGIN_ROOT/skills/uiux}" "$HOME/.claude/plugins/syafiqkit/skills/uiux" "$HOME"/.claude/plugins/cache/*/syafiqkit/*/skills/uiux; do if [ -n "$s" ] && [ -f "$s/modules/taste-web/scripts/gate.mjs" ]; then f="$s/modules/taste-web/scripts/gate.mjs"; break; fi; done; if [ -n "$f" ] && command -v node >/dev/null 2>&1; then exec node "$f" --hook claude; fi; for d in .taste-skill */.taste-skill; do if [ -f "$d/build.json" ]; then printf "{\"systemMessage\":\"taste-web finish gate did not run (node or gate.mjs not reachable from the hook); the build in %s is unchecked\"}\n" "$d"; break; fi; done; exit 0'
          timeout: 600
---

# Design Everything a Person Sees

Five failures recur: inconsistent UI (surface-by-surface, unaware of what the app already has); generic UI (stock defaults unchecked); shallow UI (happy path only); desktop-first UI (one width designed, not all); crowded UI (every brief item answered instead of the one a reader came for). None shows in a diff.

## Look at the Picture

Images with positional references ("this one", "the second") need the target surface resolved and stated before work starts: the pointer attaches to whatever you worked on last, and a full pass on the wrong screen looks like completed work. 📖 `../design-handoff/references/handoff-incident-patterns.md` for a worked case.

Read a screenshot as a rendered interface *separately* from the question that came with it. Even for API or bug questions, scan for overflow, collision, misalignment, spacing, truncation and contrast: visual defects hide inside technical questions. Answer what was asked first, then note what else you saw and offer to fix it, rather than silently fixing the layout.

## Route the job

This skill is the one entry for design. Its modules live in `modules/` and are opened when a job needs them; each keeps its own judgement, scripts and score.

| Job | Do this |
|---|---|
| **Review**: critique, audit, grade, `done`'s Design row, the approval gate before a redesign, "all the design skills", "the UI/UX" | One review, one report, one score, carrying every check: two isolated reviewers (A on the screenshots, started before the machine checks run; B on the checks that fit the surface: `impeccable`'s detector, `taste`'s inspector and lint, `taste-web`'s checker on a public page) scoring one rubric that folds in `taste`'s critique questions and this skill's own checks. A script's output alone is evidence, not the review. 📖 `references/critique-mode.md` |
| **Build, redesign or polish a public page** (company website, landing, product, pricing, marketing, portfolio, event, editorial or one-off page), whatever the verb, even mid-task | Both taste modules, one run. The page's main job picks the lead: selling a product or service (any company, a freelancer's services page) leads with `modules/taste-web/MODULE.md` (its run and finish gate); showing the maker's own work (a portfolio, a design studio's showcase), an event, an editorial or one-off page leads with `modules/taste/MODULE.md` (directions dealt from 247 studied sites). Read the lead module whole and follow its run, and take from the other what it does better: `taste`'s dealt direction and imagery rules when a business page should look art-directed, `taste-web`'s scenes, icons, product UI pieces and checker on any page. Where their house rules disagree (gradients, effects, dark heroes), the lead module's rule wins. This skill's restraint drifts to the category default on a page; the modules prevent that. A critique, research or a named small fix ("the price is cut off at 375px") on any page stays here |
| **A named `impeccable` command** (polish, bolder, harden, typeset …) | Read `modules/impeccable/MODULE.md`, then its `reference/<command>.md`, inside the same combined job: a named critique or audit runs the one review above |
| **Build or fix a screen inside an app** (web or native) | This skill's body below. Before any UI edit, read `modules/impeccable/reference/craft-floor.md`; its passes (`harden`, `clarify`, `layout`, `typeset`, `adapt`) are there when a screen needs one. "It looks generic" about an app screen is a review first, then a fix with `modules/taste/references/app-screens.md` |
| **Build or polish an email, PDF, slide or document** | `craft-floor.md` as above; the surface row below for widths or pages; `modules/taste/scripts/lint.mjs` on the rendered HTML; the review skips the browser inspector and says so |
| **Research**, a port of an existing design, a dated design language | The sections below |

| Surface | Extra guidance |
|---|---|
| Web app, dashboard, admin, product UI | This body; business tools inherit the app's language, never the marketing yardstick; `modules/taste/references/app-screens.md` for a new app screen's look; `modules/impeccable/reference/mode-operate.md` |
| Website, marketing, campaign, pricing | The combined public-page run (§ Route the job); `modules/impeccable/reference/mode-persuade.md`; critique yardstick 📖 `references/marketing-pages.md` |
| Docs, guides, help, changelogs (reading pages) | `taste`'s reading-page path; `modules/impeccable/reference/mode-read.md` |
| Portfolio, gallery, showcase | `impeccable`'s Experience mode; `taste` leads the combined run, `taste-web` supplies |
| Native mobile app (iOS, Android, Flutter) | 📖 `references/mobile-first.md`; `modules/impeccable/reference/ios.md`, `android.md`, `audit.native.md`, `adapt.native.md`. Its browser detector, `live` and `generate` read web markup only, so they do not run; a native critique runs the design review alone and says so |
| Email | Captured at the widths it ships at (375 and full width); table layout and inline styles; lint the rendered HTML, not the template |
| PDF and generated documents | Graded from rendered pages, not widths; the detector reads web markup only, so say so |
| Slides and decks | Graded from rendered pages; `explainer-deck` builds them, and a deck shows each mechanism, not just each step |
| Documents (Word, Google Docs, manuals) | Graded from rendered pages; `user-manual` and the Word skills build them |
| Anything else a person sees | The same judgement and the same review, from its rendered form |

**Modules.** Each is a folder with a `MODULE.md` entry, a `SOURCE.md` (origin, licence, local changes) and its own files. A vendored module stays as upstream shipped it apart from the local edits its `SOURCE.md` lists (its `MODULE.md` and a few patched files), which are merged by hand on an update; everything else re-syncs by copying. A new one gets a row in the module table and routes in the job and surface tables.

| Module | Owns | Source |
|---|---|---|
| `taste` | Art-directed pages: directions dealt from 247 studied sites, open-collection pictures, house rules and laws, browser inspector, juror critique questions (read into the review's rubric); the app-screen path | tasteskill 2.1, MIT |
| `taste-web` | Company websites: one page system by business kind, scroll scenes, product UI fragments, icons, components, diagrams, effects, 100+ browser checks and a finish gate (Stop hook in this file's frontmatter) | tasteskill 2.5.1, MIT |
| `impeccable` | Named commands, modes, the craft floor, critique with Nielsen scoring and detector, native iOS and Android guidance, optional post-edit hook (`hooks on`, offered per project) | impeccable 4.8.2, Apache-2.0 |

In scope, still separate skills until merged as modules: `dataviz`, `product-still`, `motion-clip`, `explainer-deck`, `user-manual`, and the visual side of `design-handoff`.

**Project design docs.** A project's product and design facts live in the doc set `setup-project-docs` builds: product truth (users, purpose, positioning, constraints) in its `PRD.md`, and the design system (tokens, type, components, do's and don'ts, Google design.md format) in its design doc, with the frontend CLAUDE.md pointing at it. Where a module says PRODUCT.md or DESIGN.md, read and write those instead; `impeccable`'s `init` and `document` fill them. Its launcher finds `docs/DESIGN.md` but only a root `PRODUCT.md`, so in a project with `docs/PRD.md` its `NO_PRODUCT_MD` notice is answered by reading the PRD, never by writing a root `PRODUCT.md`.

## First decide which job this is

Brownfield (an app with a language) and greenfield (nothing to inherit) start from different questions.

**When a design already exists:** A prototype, Figma file, Claude Design project or annotated screenshots means a port: reproduce what is there, and reserve judgement for what the platform forces. Read the design before asking any layout question, and check its system-behaviour claims (defaults, rates, when a state applies) against the domain docs, since a prototype runs on a mock engine. States the design never drew (errors, returning users) go to the designer through `design-handoff` while their surface is live; builders wire logic behind plain placeholders. Builders get the design source itself (raw file plus each screen's anchors), never your summary, and their reports list each screen's remaining differences. 📖 `references/porting-existing-designs.md` for how ports differ from redesigns, screens the design never drew, and briefing builders.

**When reading an existing app's language:** read the project's design doc (§ Project design docs), `frontend/CLAUDE.md` or a similar conventions doc; if none exists, infer the language from sibling pages and shared components. Docs name tokens and rules, but the answer is often a component that already exists for this job: before writing a treatment, grep for its mechanism (the prop, the component name, the shape). One hit in your own file means you invented a pattern; several elsewhere mean the app already decided. A component reused in a new place brings its old audience: judge reuse by who reads it and what contains it, not by shared fields. Reuse the logic, rebuild the surface when either differs, and say so in the builder's brief. 📖 `references/design-incidents.md` for a form that compiled and rendered cleanly yet was wrong in a staff modal. A new section must read as its siblings do on that page (same card, label and value pattern), so name the sibling in the brief. Work inside the conventions unless told otherwise; when you break one, say which and why. A brief that pins a direction overrides the app's language. An existing language can be healthy, drifting or dated; a verdict beyond the visual layer (component library, framework) is a finding with a blast radius, stated before designing and never inside a polish request. 📖 `references/design-language-health.md` for judging it at each layer and where the verdict goes.

Design the branch that renders on the active route, not the file that names it: components hold several layouts behind conditionals and flags, so designing from the file redesigns a surface no user sees. 📖 `references/reading-live-branches.md` for how to trace.

**When starting from nothing:** there is no app language to read. Pin down the audience (who, their situation), the subject matter (what the surface represents), and the job (what friction it solves). An 8-year-old's surface reads differently from a surgeon's; a hospital dashboard differs from a social network. Name what you're designing FOR before you design it.

Then decide the smallest system that keeps the second screen consistent with the first: one typeface, colour/type/spacing tokens, an 8px base, mobile-first breakpoints, a mature library customised through tokens. Write those into the project's design doc (§ Project design docs; `setup-project-docs` creates the set if absent) and point the frontend CLAUDE.md at it, so the next session reads them instead of re-deciding. A screen needing another value records a named deviation, not a second rule. 📖 `references/greenfield-minimum-system.md` for the decisions in order.

**Whichever job it is, write a one-line design read before any code:** audience, subject, job, and how bold or restrained this surface should be. Ask one question only if the read genuinely forks; otherwise state it and proceed within the scope below, never past an approval gate. A critique writes no design read.

## When the user asks for research, or how real products solve it

"Research" in a UI request triggers this section even when the question is about the user's own screen ("research how to make this compact"). Run the dispatch before proposing: measuring the app runs alongside it and never replaces it. A proposal that cites "best practice" and not one URL you opened means the research didn't happen. Every run includes named live products where the same situation occurs, each with a fetched URL; research about the subject itself is brief input, never that leg. 📖 `references/core-principles.md#research` for the dispatch and `references/case-study-research.md` for the method.

**Research is the first half of this skill's job, never all of it.** The build comes many turns later, when the research rules are recalled, not read, and it still needs a design decision and a graded render. **So before briefing UI builders, re-invoke this skill for the build, and again when they return, before calling the screens done.** 📖 `references/design-incidents.md` for the builders that followed a research-only invocation. **Tell: you invoked this skill for research, and your next UI verdict cites no re-invocation.**

## When asked to review a screen

"Critique", "audit" or "what's wrong with this" is a judging job, not a fixing job: run the one review (§ Route the job), rank what the reader loses, and hand the findings back before touching anything. 📖 `references/critique-mode.md` for the steps, the rubric and the report.

## Scope and Blast Radius

Scope by blast radius, not phrasing: "polish this section" touches existing surfaces, while "redesign this page" reworks structure.

Single-element fixes build directly; section polishes (card layout, forms) propose inline and code. A control the app does not have yet (a picker, a suggestion pattern, a new input behaviour) is a question other products have answered: run the research dispatch above before its options reach the user, even unprompted. Measured 2026-10-22: a category-picker proposal cited only the app's own components, the user asked "did u research or not?", and the research then changed the starter list and option order. **Tell: every option you are about to offer cites only the app's own components.** Page redesigns and module-wide passes survey first (language, audience, subject, job), capture the before-state, then propose and wait for approval. Before a new flow or page direction goes for approval, run the review and fold its fixes in or put the open findings beside the question: its reviewers judge the direction even unbuilt (from the agreed design and the files it extends; with nothing rendered the detector has nothing to scan, so say so in the report rather than skip the review), and `taste`'s inspector runs on the current screen at its three widths. The checks catch different things: the heuristics judge the flow, the inspector what a first glance misses (contrast, foreign field labels, a control that reads as disabled). Each of the five times `taste`'s checks were left out (2026-10-20 to 2026-11-15) they found real defects once run, which is why the report lists every check as run or "not run: <reason>". Use `AskUserQuestion` for genuine branches and inline prose for one direction to confirm. Mockups go in the reply above the question and again in the option `preview`, since either surface can fail to render (📖 `brainstorming` Step 4).

**Prefer a rendering tool to a text mockup:** Claude Design's tools (`mcp__claude-design__*`), artifacts or a dev-server page show type, weight, spacing and colour; box-drawing shows none of it, and the ASCII fallback happens silently. Use one where stakes are highest (page redesign, new visual direction, brand or palette), usually one `ToolSearch` away. Reserve text mockups for layout order and hierarchy.

## The Tension

Matching the app fights being distinctive. Unchecked, "match existing conventions" inherits templated defaults, and "be distinctive" produces a page that matches nothing. **Spend distinctiveness where the surface's actual *job* calls for it; keep everything else consistent.** Core workflow pages can stand out; sidebars, modals and settings inherit. A brief that pins a direction (brand refresh, new component system) makes consistency win. Stock looks, one-word themes, the five shaped-or-defaulted questions (Swap, Squint, Signature, Token, Exclude) and the real-logo rule: 📖 `references/core-principles.md#tension`.

## Mobile-first is the default, not a viewport check

Design at 375px first and let columns arrive with width: that order locks in what a later "check it on mobile" pass cannot undo. Primary action in thumb reach, destructive actions away from it, 44px targets, three to five bottom tabs, labelled icons, nothing hidden on hover, 16px body text, tables with a phone shape. A surface that works only with a pointer and a wide screen was not designed for most of its users. A native app follows its platform (iOS, Android) through the `impeccable` module's platform files. 📖 `references/mobile-first.md` for checks and WCAG target-size floors.

## Design for people who scan

People look for one thing and act. Scan headings, read chunks when earned: chunk under descriptive headings, front-load labels, name button outcomes. One bold action per screen (the first two seconds); rare actions in a menu; defaults instead of questions; errors say what happened, why and what's next; empty states say what would appear and how to create it. Only home, search and print work unlabelled. A gap-list brief produces a crowded page, and a control belongs in the same container as what it changes: 📖 `references/core-principles.md#scanners` and `references/designing-for-scanners.md`.

## The States Beyond the Happy Path

Build for loading, zero-row, one-row, error, disabled and text-overflow states, not only the populated one: a pending state in place of stale content, empty states that invite action, errors that show the path forward, deferred content with a final-size placeholder, and a next action for every figure. 📖 `references/core-principles.md#states`.

## Verify by Looking

**On a redesign, capture the before state**, both states side by side. Single-element fixes need no baseline; section polishes usually do; page redesigns always do. A change is verified by its rendering at every width it ships at, from a bundle newer than your edits, with every builder screenshot opened and graded against its siblings; verification scales with blast radius. 📖 `references/core-principles.md#verify`, `references/verification-checklist.md` and `references/verification-traps.md`.
