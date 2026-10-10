---
name: uiux
description: >
  Apply design judgement to UI/UX work at any scope — polish, rethink, redesign, tighten, CRITIQUE/audit/review an existing screen ("what's wrong with this", "does this look generic or AI-made"), or RESEARCH. Also covers landing pages and portfolios. Fire on explicit requests (redesign, rethink, polish, "make this nicer"), on any UI request that says "research", "case study", "benchmark" or "how do other apps do this" — including research about the user's own screen ("research how to make this compact") — which this skill answers with sourced case studies from real products and design systems, never a design from memory; and on implicit ones: a screenshot arrives, or someone reports what they saw ("looks wrong", "shows the old one") without naming UI. Also fires on greenfield projects (no app language yet), judges whether existing design languages are dated, and treats mobile-first as the default. Will NOT fire on backend-only work or chart building (that is dataviz), nor when the ask is a BRIEF for someone else to design (an external designer, a contractor, a Claude Design project) — that is `design-handoff`, which ships context and withholds the design decisions this skill makes. When exploring what to build comes before how it should look, `brainstorming` runs first.
---

# Apply Design Judgement

Five things go wrong: inconsistent UI (working surface-by-surface without knowing what the app already has); generic UI (stock defaults unchecked); shallow UI (only the happy path); desktop-first UI (designing at one width, not across all of them); crowded UI (answering every item in the brief instead of serving the one readers came for). All are invisible from a diff, which is why UI changes are verified by looking at them.

## First decide which job this is

Brownfield (an app with a language) and greenfield (nothing to inherit) start from different questions.

**When a design already exists:** You were handed a prototype, Figma file, Claude Design project or annotated screenshots. The job is a port: reproduce what is there. Reserve judgement for what the target platform genuinely forces, read the design before proposing or asking the user any layout question, and check its claims about system behaviour (defaults, rates, when a state applies) against the domain docs, since a prototype runs on a mock engine. States the design never drew (errors, returning users) are a brief to the designer through `design-handoff` while their surface is live, not copy you write; builders wire logic behind plain placeholders. A port handed to builders travels as the design source itself (raw file plus each screen's anchors), never as your summary of it, and their reports list each screen's remaining differences; a brief that cites a summary and no line range of the design file is the sign it didn't. 📖 `references/porting-existing-designs.md` for how ports differ from redesigns, how to handle screens the design never drew, and how to brief builders.

**When reading an existing app's language:** look for a `frontend/CLAUDE.md` or similar conventions doc and read it; if none exists, infer the language from sibling pages and shared components. A doc names tokens and rules, while the answer you need is usually a component that already exists for this exact job, so once you've chosen a treatment, grep the codebase for the mechanism you're about to write (the prop, the component name, the shape) before writing it. A single hit that turns out to be your own file means you just invented a pattern; several hits elsewhere mean the app already decided. A component reused in a new place brings its old audience with it. A form written for the account holder ("your bank", a decorative preview, reassurance banners, its own lone button) is wrong in a staff modal, even though it compiles, renders and has the right fields. Judge reuse by who reads it and what contains it, not by shared fields: reuse the logic, rebuild the surface when either differs, and say so in the builder's brief. The same applies to a new section on an existing page. It must read as one of its siblings there (same card, label and value pattern), so name that sibling in the brief. Work inside the conventions unless explicitly asked otherwise; when you break one, say which and why. A brief that pins a direction (brand refresh, new interaction model) overrides the app's language. An existing language can be healthy, drifting, or dated. A verdict beyond the visual layer (component library, framework) is a finding with a blast radius, stated before you design and never executed inside a polish request. 📖 `references/design-language-health.md` for judging the language at visual, component library and framework layers, and where the verdict goes.

To know what you're designing for, trace to the branch that actually renders on the active route — not the file that contains it or the component that names it. Components hold multiple layouts (conditionals, feature flags, route checks). Designing from the file rather than the branch means redesigning a surface no user sees. 📖 `references/reading-live-branches.md` for how to trace.

**When starting from nothing:** there is no app language to read. Pin down three things: the audience (who, their situation), the subject matter (what does this surface represent), and the job (what friction are you solving). A surface designed for an 8-year-old reads different from one for a surgeon; a hospital dashboard differs from a social network. Name what you're designing FOR before you design it.

**Whichever job it is, write a one-line design read before any code:** audience, subject, job, and how bold or restrained this surface should be. Ask one question only if the read genuinely forks; otherwise state it and proceed to the survey or build the scope below allows, not past an approval gate. A critique writes no design read. A landing page or portfolio also takes 📖 `references/marketing-pages.md`; business tools inherit the app's language.

Then decide the smallest system that keeps the second screen consistent with the first: one typeface, tokens for colour/type/spacing, an 8px base, mobile-first breakpoints, a mature library customised through tokens. Write those decisions into the conventions doc the brownfield branch goes looking for — `frontend/CLAUDE.md` by default, created through `update-claude-docs` when it doesn't exist yet — so the next session reads them instead of re-deciding; a screen needing a different value records it as a named deviation, not a second rule. 📖 `references/greenfield-minimum-system.md` for the decisions in order.

## Scope and Blast Radius

Scope by blast radius, not phrasing: a "polish this section" is smaller than "redesign this page" because polish affects existing surfaces while redesign reworks structure.

Single-element fixes build directly. Section polishes (card layout, forms) propose inline and code. Page redesigns or module-wide passes survey first (existing language, audience/subject/job), capture the before-state, then propose and wait for approval. Use `AskUserQuestion` for genuine branches, inline prose for one direction to confirm. Put the mockup in option `preview`, not prose ahead — the prompt is what the user sees (📖 `brainstorming` Step 4).

**Prefer a rendering tool to a text mockup:** Claude Design's tools (`mcp__claude-design__*`), artifacts, or a dev-server page show type, weight, spacing and colour (the decision). Box-drawing shows none of it. These tools are usually one `ToolSearch` away; the fallback to ASCII happens silently by default. Use a rendering tool wherever the stakes are highest (page redesign, new visual direction, anything with brand or palette). It also creates a durable home the next session can reopen, which a prompt string does not. Reserve text mockups for layout ORDER and information hierarchy, decided in one turn.

## The Tension

Matching the app fights being distinctive. "Match existing conventions" unchecked inherits the app's templated defaults. "Be distinctive" unchecked produces a page that doesn't match anything. **Spend distinctiveness where the surface's actual *job* calls for it; keep everything else consistent.** Core workflow pages can stand out; sidebars, modals and settings inherit. If the brief already pins a direction (brand refresh, new component system), consistency wins.

Without neighbours to anchor against, distinctiveness becomes a question: was this shaped by its audience, subject and job, or did it default? A dashboard built for a surgeon mid-procedure reads nothing like a reading platform for a novelist. Choices collapse into stock looks when nothing drives them: **cream/serif/terracotta** (literary); **near-black + acid** (high contrast); **broadsheet hairline** (airy); **SaaS card kit** (rounded, one shadow); **template chrome** (tracked labels); **AI-native gradient** (glowing). Each bundles an unexamined assumption. When you recognize one, ask what your audience, subject and job would choose instead. 📖 `references/ai-look-tells.md` for the concrete giveaways (edge-stripe cards, gradient text, a label above every heading) and the question each should prompt. (Adapted from `frontend-design` skill, Apache-2.0, and `superdesign` skill, MIT.)

A one-word theme ("industrial", "brutalist", "retro") names a direction, not a costume to assemble. Spend it on one element, everything around it quiet. If a brief names a look rather than a problem, name the one element carrying the theme, then cut everything else on the page that exists only because of the theme word. A brief's "no need to follow the existing palette" removes a constraint; it does not make the theme the goal. Several separate things on the page existing only because of the theme word is the sign you assembled a costume.

Where a surface has a logo slot and the product has a real logo, the real logo goes there — never initials in a circle, an emoji, a generic icon-set mark or an invented SVG. Where no real logo exists, leave the space empty or set the product name as text, and say the logo is missing — that is a question for whoever owns the brand. A placeholder mark reads as a finished decision and ships silently. 📖 `references/design-incidents.md` for the measured cases behind the theme, crowded-page, control-placement and logo rules.

Five questions test whether something was shaped or defaulted: **Swap** the typeface or layout with a default one — would anyone notice? **Squint** — does hierarchy survive? **Signature** — point to the specific element carrying this product's character. **Token** — do the variable names belong to this world or any project? **Exclude** — name an audience this direction would be wrong for; a look that suits everyone was chosen by nobody.

## Mobile-first is the default, not a viewport check

Design at 375px first and let columns arrive with width. That order locks in things a later "check it on mobile" pass cannot undo: primary action within thumb reach, destructive actions away from it, 44px touch targets with spacing, three to five destinations in a bottom tab bar, every icon carries a label, nothing hidden on hover, 16px body text (no zoom), tables get a phone shape. A surface that only works with a pointer and wide screen was not designed for most of its users. 📖 `references/mobile-first.md` for checks and WCAG target-size floors.

## Design for people who scan

People look for one thing and act. Eye-tracking favours the layer-cake: scan headings, read chunks when earned. Chunk content under descriptive headings, front-load labels, name button outcomes. One bold action per screen (the first two seconds); rare actions in a menu; defaults instead of questions; errors say what happened, why, what's next; empty states say what would appear and how to create it. Only home, search and print work unlabelled. 📖 `references/designing-for-scanners.md` for patterns and progressive-disclosure traps.

**A brief written as a gap-list produces a page that answers every item — and that page is crowded.** "Can't find property, tenant, grouped meaning, ungroup route, relations" reads as items to cover, so each gap gets its own element. Each is defensible; together they bury the one figure the reader came for. Apply hierarchy to the gap-list itself, not each gap; a reader in a hurry is the audience, not completeness.

**A control belongs in the same container as what it changes.** A row, tab or switch that re-renders a card elsewhere on the page reads as two separate things. Adding affordances to the distant control (a chevron, a chip) labels the separation but doesn't fix it. Instead, open the detail inside the thing clicked (accordion row, expanding card), or put the selector and detail in one card. The distant control also changes something out of view, or shifts the page under the cursor. If your fix for "I didn't know this was clickable" adds a label rather than moving the content, it is the wrong fix.

## When the user asks for research, or how real products solve it

"Research" in a UI request triggers this section even when the question is about the user's own screen ("research how to make this compact"). It reads as a design question with a research verb attached, so the session measures the app's data, reads its components and proposes from memory, and the skipped research never shows (measured 2026-10-07: no source opened, and the user had to ask "didn't uiux have the research one?"). Run the dispatch before proposing; measuring the app runs alongside it and does not replace it. If your proposal cites "best practice" and not one URL you opened, the research didn't happen.

Dispatch through `syafiqkit:haiku`: one agent for named products' own pages, one for research bodies and design systems, each asked for the same cells (optional fields, per-row flags, destructive actions, grouping, tap targets) with a fetched URL per claim. Then open the cited sources yourself before relaying anything — product docs describe feature use, almost never row layout, so what survives verification is usually hard numbers (tap-target sizes) and a few named interactions. Report the evidence and your own judgement as separate things.

⚠️ **Research is the first half of this skill's job, never all of it.** When the same session goes on to build, the screens still need a design decision and a graded render, and both happen many turns after this file was read: the research invocation's rules are recalled by then, not read. So before briefing UI builders, re-invoke this skill for the build, and invoke it again when they return, before calling the screens done. Measured 2026-10-10: a research-only invocation was followed by two builders. One reused an end-user form in a staff modal, and the screenshots were graded "renders fine" from memory. The user then sent five screenshots of defects. **Tell: you invoked this skill for research, and your next UI verdict cites no re-invocation.**

Treat a design principle the user supplied (a screenshot, a reel) as a source to read, not research to replace. 📖 `references/case-study-research.md` for how to brief and what comes back.

## When asked to review a screen

"Critique", "audit" or "what's wrong with this" is a judging job, not a fixing job: score it, rank what the reader loses, and hand the findings back before touching anything. 📖 `references/critique-mode.md` for the two isolated reviews and the 0-4 scoring.

## The States Beyond the Happy Path

A populated, working interface is what gets reviewed. What it looks like while loading, with zero rows, with one row, on error, when disabled, and when text overflows is the space where shallow UI breaks silently. Build for those too.

**Loading specifically**: stale content feels broken rather than pending — users can't tell fetching from hang. An image slider kept showing the previous photo until the next loaded, reported as a bug. Show nothing (skeleton, spinner, gray) instead.

**Empty states invite action; errors explain and show the path forward.** "No activity yet" names the absence, not what the state means or how to change it.

**Lazy-loading is design, not just performance.** Deferring a component or list buys a faster first paint by hiding discoverability — what you defer decides what users find. Defer what they hunt for (heavy picker, map, page two); keep resident what tells them what the screen is and what to do. The trade lands hardest on phones where deferred is below-fold and slow connections mean "never appears". Use deferral only where weight exists; splitting small content costs a round trip. Deferred content still needs loading states and full-size placeholders so layouts don't shift.

**A populated interface needs the same question.** A surface showing accurate figures but offering nowhere to go answers "what is true", never "what do I do". Ask what the reader does next with each figure and give them a way to act. Where there's no honest next step, state the meaning rather than invent a destination — a drill-down built on an API-unsupported filter reads helpful but goes nowhere.

## Look at the Picture

When multiple images arrive with positional references ("this one", "the second"), resolve which surface is meant before starting work. Say which you resolved it to — the pointer attaches to whatever is most salient to you, normally the surface you worked on last. A full pass on the wrong screen looks like completed work; catching it after costs rewrites. 📖 `../design-handoff/references/handoff-incident-patterns.md` for a worked case.

When a screenshot arrives, read it as a rendered interface *separately* from whatever question came with it. Even for API or bug questions, scan for overflow, collision, misalignment, spacing, truncation, contrast. Visual defects hide inside technical questions.

Answer what was asked first, then note what else you saw and offer to fix it. "Your slider timeout — here's the fix. I also spotted the image overflowing its container and title colliding with it; want me to address those?" beats silently fixing the layout.

## Verify by Looking

**On a redesign, capture the before state.** "Is this better than what it replaced?" needs both states side by side. Scope it by blast radius: single-element fixes need no baseline, section polishes usually do, page redesigns always do.

A UI change is verified by looking at it, not by the diff. Spacing correct at one viewport breaks at another; a button readable on desktop sits at bad contrast on mobile; a three-item card layout wraps differently with twelve. The rendering carries meaning the source never does.

Reproduce only what you can fully read. Where the real page won't fit — too many files, a component you couldn't locate, a branch you couldn't resolve — the gap fills from the design system as a plausible fictional page that looks faithful but isn't. If you are writing "likely", "probably" or "presumably" about a layout, you are in this case. Say which part you couldn't read and what that leaves unverified, rather than shipping a reproduction you can't vouch for.

Verify the render came from your source. A stale bundle looks like a design defect — a vanished control reads as broken conditional, shifted layout as bad spacing. Check the bundle is present, fetchable and newer than your edits. 📖 `references/verification-traps.md` for stale-bundle and other verification traps.

**A builder's screenshots are a set to grade, not a sample to spot-check.** Open every one before calling the screens done, and grade them on a fresh invocation of this skill rather than the research invocation, whose rules are recalled by then (see the research section's Tell). The shots you skip are usually the reused or secondary surfaces, and that is where the defects sit. Add what a static capture misses: an open dropdown or picker inside a scrolling modal (clipping), each step of a multi-step modal, and the colour mode the user actually runs. Grade each against its siblings on the same page (does it read as one of them, for this reader?), not against "does it render". When the user then calls a screen unpolished, look at its structure before its copy: a component in the wrong context needs replacing, and patching its strings first wastes a round. **Tell: your verdict cites fewer screenshots than the builder produced.**

Ask for screenshots after proposals, especially at scope where surprises are common, and treat the first render as a second approval gate. Where a browser-driving agent exists, verify flows with it; `browser-verifier` dispatches only on an explicit ask this turn, so otherwise run the flow yourself. Otherwise screenshots verify static state: spacing, alignment, readability, contrast.

E2E recordings surface defects assertions can't — markup rendering as text, copy broken by the product never delivering. Treat a cut-off edge as viewport boundary, not layout bug.

Verification scales with blast radius: a single-element fix checks the widths where it can actually break, usually a phone width and the desktop it sits in; a page redesign checks 375px, 768px, 1280px with hover, focus, disabled, loading states, contrast, motion, layout-shift. Look in one batched round, confirm fixes in one more, then go further only for a named defect, not a feeling that it could be better. The before capture and the approval render are not rounds. 📖 `references/verification-checklist.md` for thresholds.
