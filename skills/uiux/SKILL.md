---
name: uiux
description: >
  Apply design judgement to UI/UX work at any scope — polish, rethink, redesign, tighten, CRITIQUE/audit/review an existing screen ("what's wrong with this", "does this look generic or AI-made"), or RESEARCH. Making a public-facing page (landing page, marketing site, portfolio, one-pager) look better goes to `taste`, whatever the verb (build, redesign, polish, improve); a request naming impeccable goes to `impeccable`; this skill keeps a critique of such a page, research, and a named small fix. Fire on explicit requests (redesign, rethink, polish, "make this nicer"), on any UI request that says "research", "case study", "benchmark" or "how do other apps do this" — including research about the user's own screen — which this skill answers with sourced case studies from real products and design systems, never a design from memory; and on implicit ones: a screenshot arrives, or someone reports what they saw ("looks wrong", "shows the old one") without naming UI. Also fires on greenfield projects (no app language yet), judges whether existing design languages are dated, and treats mobile-first as the default. Will NOT fire on backend-only work or chart building (that is dataviz), nor when the ask is a BRIEF for someone else to design (an external designer, a contractor, a Claude Design project) — that is `design-handoff`, which ships context and withholds the design decisions this skill makes. When exploring what to build comes before how it should look, `brainstorming` runs first.
---

# Apply Design Judgement

Five failures recur: inconsistent UI (surface-by-surface, unaware of what the app already has); generic UI (stock defaults unchecked); shallow UI (happy path only); desktop-first UI (one width designed, not all); crowded UI (every brief item answered instead of the one a reader came for). None shows in a diff.

## Look at the Picture

Images with positional references ("this one", "the second") need the target surface resolved and stated before work starts: the pointer attaches to whatever you worked on last, and a full pass on the wrong screen looks like completed work. 📖 `../design-handoff/references/handoff-incident-patterns.md` for a worked case.

Read a screenshot as a rendered interface *separately* from the question that came with it. Even for API or bug questions, scan for overflow, collision, misalignment, spacing, truncation and contrast: visual defects hide inside technical questions. Answer what was asked first, then note what else you saw and offer to fix it, rather than silently fixing the layout.

## First decide which job this is

**Making a landing page, marketing site or portfolio look better is `taste`'s job whatever the verb (build, redesign, polish, improve, "make it wow"), even when the user named this skill: invoke `taste` rather than designing the page here, and hand over mid-task when a page job turns into a look change.** Stays here: a critique with no edits, research, and a named small fix ("the price is cut off at 375px"). This skill's restraint drifts to the category default on a page; `taste`'s dealt directions, real pictures and browser inspector prevent that. A critique of such a page takes 📖 `references/marketing-pages.md`; business tools inherit the app's language.

**A request for every design skill ("use all", "use the design skills") runs `uiux`, `impeccable` and `taste` together, whatever the page type**: `taste` then takes its review path (inspect and lint, no full run) on a page it would not own. The routing above names one owner per job, which reads as permission to drop the others (08/11/2026: `taste` was left out of a "use all" pass until the user asked "What about taste skill").

Brownfield (an app with a language) and greenfield (nothing to inherit) start from different questions.

**When a design already exists:** A prototype, Figma file, Claude Design project or annotated screenshots means a port: reproduce what is there, and reserve judgement for what the platform forces. Read the design before asking any layout question, and check its system-behaviour claims (defaults, rates, when a state applies) against the domain docs, since a prototype runs on a mock engine. States the design never drew (errors, returning users) go to the designer through `design-handoff` while their surface is live; builders wire logic behind plain placeholders. Builders get the design source itself (raw file plus each screen's anchors), never your summary, and their reports list each screen's remaining differences. 📖 `references/porting-existing-designs.md` for how ports differ from redesigns, screens the design never drew, and briefing builders.

**When reading an existing app's language:** read `frontend/CLAUDE.md` or a similar conventions doc; if none exists, infer the language from sibling pages and shared components. Docs name tokens and rules, but the answer is often a component that already exists for this job: before writing a treatment, grep for its mechanism (the prop, the component name, the shape). One hit in your own file means you invented a pattern; several elsewhere mean the app already decided. A component reused in a new place brings its old audience: judge reuse by who reads it and what contains it, not by shared fields. Reuse the logic, rebuild the surface when either differs, and say so in the builder's brief. 📖 `references/design-incidents.md` for a form that compiled and rendered cleanly yet was wrong in a staff modal. A new section must read as its siblings do on that page (same card, label and value pattern), so name the sibling in the brief. Work inside the conventions unless told otherwise; when you break one, say which and why. A brief that pins a direction overrides the app's language. An existing language can be healthy, drifting or dated; a verdict beyond the visual layer (component library, framework) is a finding with a blast radius, stated before designing and never inside a polish request. 📖 `references/design-language-health.md` for judging it at each layer and where the verdict goes.

Design the branch that renders on the active route, not the file that names it: components hold several layouts behind conditionals and flags, so designing from the file redesigns a surface no user sees. 📖 `references/reading-live-branches.md` for how to trace.

**When starting from nothing:** there is no app language to read. Pin down the audience (who, their situation), the subject matter (what the surface represents), and the job (what friction it solves). An 8-year-old's surface reads differently from a surgeon's; a hospital dashboard differs from a social network. Name what you're designing FOR before you design it.

Then decide the smallest system that keeps the second screen consistent with the first: one typeface, colour/type/spacing tokens, an 8px base, mobile-first breakpoints, a mature library customised through tokens. Write those into the conventions doc the brownfield branch looks for (`frontend/CLAUDE.md` by default, created through `update-claude-docs` if absent) so the next session reads them instead of re-deciding. A screen needing another value records a named deviation, not a second rule. 📖 `references/greenfield-minimum-system.md` for the decisions in order.

**Whichever job it is, write a one-line design read before any code:** audience, subject, job, and how bold or restrained this surface should be. Ask one question only if the read genuinely forks; otherwise state it and proceed within the scope below, never past an approval gate. A critique writes no design read.

## When the user asks for research, or how real products solve it

"Research" in a UI request triggers this section even when the question is about the user's own screen ("research how to make this compact"). Run the dispatch before proposing: measuring the app runs alongside it and never replaces it. A proposal that cites "best practice" and not one URL you opened means the research didn't happen.

**Every research run includes real-world case studies: live products, named, where the same situation occurs, each with a URL you or an agent fetched.** Research about the subject (the client's brand, the user's own app, a competitor's data) is brief input, never the case-study leg, and it feels complete on its own. 📖 `references/design-incidents.md` for the run that stopped there. **Tell: every URL in your research is the subject's own.**

Start from the situation and send agents to where it occurs, not to a category of products. Dispatch through `syafiqkit:haiku`: one agent for live products, one for component libraries and research bodies, asked the same cells, each claim with a fetched URL. Subject research is a third agent, never a substitute. **A report where most cells say "not stated" means the brief aimed at the wrong evidence, not that no precedent exists:** re-brief once at a different source kind before relaying. Open the cited sources yourself, and report evidence and judgement separately. 📖 `references/case-study-research.md` for the method, cells and what to check in returns.

**Research is the first half of this skill's job, never all of it.** The build comes many turns later, when the research rules are recalled, not read, and it still needs a design decision and a graded render. **So before briefing UI builders, re-invoke this skill for the build, and again when they return, before calling the screens done.** 📖 `references/design-incidents.md` for the builders that followed a research-only invocation. **Tell: you invoked this skill for research, and your next UI verdict cites no re-invocation.**

A design principle the user supplied (a screenshot, a reel) is a source to read, not research to replace. 📖 `references/case-study-research.md` for how to brief and what comes back.

## When asked to review a screen

"Critique", "audit" or "what's wrong with this" is a judging job, not a fixing job: score it, rank what the reader loses, and hand the findings back before touching anything. 📖 `references/critique-mode.md` for the two isolated reviews and the 0-4 scoring.

## Scope and Blast Radius

Scope by blast radius, not phrasing: "polish this section" touches existing surfaces, while "redesign this page" reworks structure.

Single-element fixes build directly; section polishes (card layout, forms) propose inline and code. A control the app does not have yet (a picker, a suggestion pattern, a new input behaviour) is a question other products have answered: run the research dispatch above before its options reach the user, even unprompted. Measured 2026-10-22: a category-picker proposal cited only the app's own components, the user asked "did u research or not?", and the research then changed the starter list and option order. **Tell: every option you are about to offer cites only the app's own components.** Page redesigns and module-wide passes survey first (language, audience, subject, job), capture the before-state, then propose and wait for approval. Before a new flow or page direction goes for approval, run both reviewers and fold their fixes in or put the open findings beside the question: `impeccable` `critique` on the direction, even unbuilt (from the agreed design and the files it extends; with nothing rendered its detector half has nothing to scan, so say so in the header rather than skip the critique), and, on any screen a customer sees, `taste`'s review path (`inspect.mjs --app` and `lint.mjs` on the current screen at its three widths). They catch different things: the critique judges the flow, the inspector what a first glance misses (contrast, foreign field labels, a control that reads as disabled). The routing sends a whole job to either only when it is named, so `taste` was left out three times (2026-10-20, 2026-11-08, 2026-11-10: "how do u know taste is not ? probably got something can improve also"), and each time it found real defects once run. Use `AskUserQuestion` for genuine branches and inline prose for one direction to confirm. Mockups go in the reply above the question and again in the option `preview`, since either surface can fail to render (📖 `brainstorming` Step 4).

**Prefer a rendering tool to a text mockup:** Claude Design's tools (`mcp__claude-design__*`), artifacts or a dev-server page show type, weight, spacing and colour; box-drawing shows none of it, and the ASCII fallback happens silently. Use one where stakes are highest (page redesign, new visual direction, brand or palette), usually one `ToolSearch` away. Reserve text mockups for layout order and hierarchy.

## The Tension

Matching the app fights being distinctive. Unchecked, "match existing conventions" inherits templated defaults, and "be distinctive" produces a page that matches nothing. **Spend distinctiveness where the surface's actual *job* calls for it; keep everything else consistent.** Core workflow pages can stand out; sidebars, modals and settings inherit. A brief that pins a direction (brand refresh, new component system) makes consistency win.

Without neighbours to anchor against, distinctiveness is a question: was this shaped by its audience, subject and job, or did it default? Choices collapse into stock looks when nothing drives them, and each bundles an unexamined assumption: when you recognize one, ask what your audience, subject and job would choose instead. 📖 `references/ai-look-tells.md` names the six stock looks (`#stock-looks`) and the concrete giveaways (edge-stripe cards, gradient text, a label above every heading), each with the question it should prompt. (Adapted from `frontend-design` skill, Apache-2.0, and `superdesign` skill, MIT.)

A one-word theme ("industrial", "brutalist", "retro") names a direction, not a costume to assemble. Spend it on one element, keep everything around it quiet, and cut what exists only because of the theme word. A brief's "no need to follow the existing palette" removes a constraint; it does not make the theme the goal.

Five questions test whether something was shaped or defaulted: **Swap** the typeface or layout with a default one, would anyone notice? **Squint**: does hierarchy survive? **Signature**: point to the element carrying this product's character. **Token**: do the variable names belong to this world or any project? **Exclude**: name an audience this direction would be wrong for; a look that suits everyone was chosen by nobody.

Where a surface has a logo slot and the product has a real logo, the real logo goes there: never initials in a circle, an emoji, a generic icon-set mark or an invented SVG. Where no real logo exists, leave the space empty or set the product name as text, and say the logo is missing; that is a question for whoever owns the brand. A placeholder mark reads as a finished decision and ships silently. 📖 `references/design-incidents.md` for the measured cases behind the theme, crowded-page, control-placement and logo rules.

## Mobile-first is the default, not a viewport check

Design at 375px first and let columns arrive with width: that order locks in what a later "check it on mobile" pass cannot undo. Primary action in thumb reach, destructive actions away from it, 44px targets, three to five bottom tabs, labelled icons, nothing hidden on hover, 16px body text, tables with a phone shape. A surface that works only with a pointer and a wide screen was not designed for most of its users. 📖 `references/mobile-first.md` for checks and WCAG target-size floors.

## Design for people who scan

People look for one thing and act. Scan headings, read chunks when earned: chunk under descriptive headings, front-load labels, name button outcomes. One bold action per screen (the first two seconds); rare actions in a menu; defaults instead of questions; errors say what happened, why and what's next; empty states say what would appear and how to create it. Only home, search and print work unlabelled. 📖 `references/designing-for-scanners.md` for patterns and progressive-disclosure traps.

**A gap-list brief produces a crowded page.** "Can't find property, tenant, grouped meaning, ungroup route, relations" reads as items to cover, so each gap gets its own element; each is defensible, and together they bury the one figure the reader came for. Apply hierarchy to the list itself; a reader in a hurry is the audience, not completeness.

**A control belongs in the same container as what it changes.** A row, tab or switch that re-renders a card elsewhere reads as two separate things, and a chevron or chip on that distant control labels the separation without fixing it. Open the detail inside the thing clicked (accordion row, expanding card), or put selector and detail in one card. A fix that adds a label rather than moving the content is the wrong fix. 📖 `references/design-incidents.md`.

## The States Beyond the Happy Path

A populated, working interface is what gets reviewed; shallow UI breaks silently in loading, zero-row, one-row, error, disabled and text-overflow states. Build for those too.

**Loading**: stale content feels broken rather than pending, and users can't tell fetching from a hang (an image slider kept the previous photo until the next loaded, reported as a bug). Show a pending state in its place (skeleton, spinner or gray).

**Empty states invite action; errors explain and show the path forward.** "No activity yet" names the absence, not what the state means or how to change it.

**Lazy-loading is design, not just performance.** Defer what users hunt for; keep resident what tells them what the screen is and what to do. Deferred content still needs a loading state and a placeholder at its final size. 📖 `references/designing-for-scanners.md`.

**A populated interface needs the same question.** Accurate figures with nowhere to go answer "what is true", never "what do I do". Ask what the reader does next with each figure and give them a way to act. Where there's no honest next step, state the meaning rather than invent a destination: a drill-down built on an API-unsupported filter reads helpful but goes nowhere.

## Verify by Looking

**On a redesign, capture the before state**, both states side by side. Single-element fixes need no baseline; section polishes usually do; page redesigns always do.

A UI change is verified by looking, not by the diff: spacing right at one viewport breaks at another, and a three-item card layout wraps differently with twelve. The rendering carries meaning the source never does.

Reproduce only what you can fully read. Where the real page won't fit (too many files, an unlocated component, an unresolved branch), the gap fills from the design system as a plausible page that looks faithful and isn't. Writing "likely", "probably" or "presumably" about a layout means you are in that case: name the unreadable part and what it leaves unverified.

Verify the render came from your source. A stale bundle looks like a design defect, so check it is present, fetchable and newer than your edits. A full-page capture misplaces `fixed` or `sticky` elements; judge those from viewport shots at scroll top and bottom. 📖 `references/verification-traps.md` for both traps.

**A builder's screenshots are a set to grade, not a sample to spot-check.** Open every one before calling the screens done, and grade them on a fresh invocation of this skill, not the research invocation whose rules are recalled by then. The skipped shots are usually the reused or secondary surfaces, where the defects sit. Add what a static capture misses (📖 `references/verification-checklist.md`). Grade each against its siblings on the same page (does it read as one of them, for this reader?), not against "does it render". When the user calls a screen unpolished, check its structure before its copy: a component in the wrong context needs replacing, and string patches waste a round. **Tell: your verdict cites fewer screenshots than the builder produced.** `done` runs this grade as its Design row at wrap-up, alongside `impeccable` `critique`, for any diff that changes something a person sees.

Ask for screenshots after proposals; the first render is a second approval gate. Verify flows with `browser-verifier` only on an explicit ask this turn, otherwise run the flow yourself. Screenshots verify static state (spacing, alignment, readability, contrast); E2E recordings catch what assertions miss (markup rendering as text, copy the product never delivers). A cut-off edge at the viewport is a boundary, not a layout bug.

Verification scales with blast radius: a single-element fix checks the widths where it can break (usually phone and the desktop it sits in); a page redesign checks 375px, 768px, 1280px, plus a short height (375×667, 1366×650) wherever a stage is pinned or sized to the screen, with hover, focus, disabled, loading, contrast, motion and layout-shift. Look in one batched round, confirm fixes in one more, and go further only for a named defect. The before capture and the approval render are not rounds. 📖 `references/verification-checklist.md` for thresholds.
