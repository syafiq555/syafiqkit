---
name: uiux
description: >
  Apply design judgement to UI/UX work at any scope: polish, rethink, redesign, tighten, "make this nicer"; a screen someone calls boring, plain, flat, busy or default ("doesn't stand out", "no focal point"); a CRITIQUE/audit/review with no edits ("what's wrong with this", "does this look generic or AI-made"); RESEARCH ("research", "case study", "benchmark", "how do other apps do this", even about the user's own screen), answered with sourced case studies from real products, never a design from memory; or a GO-LIVE CHECK of a site about to launch or just launched ("is the site ready", a team's launch SOP: indexing, titles, sitemap, speed, security routes, WordPress settings, hidden login). Also fires when a screenshot arrives or someone reports what they saw ("looks wrong", "shows the old one") without naming UI, and on greenfield projects; mobile-first by default. Making a public-facing page (landing page, marketing site, portfolio, one-pager) look better goes to `taste`, whatever the verb; a request naming impeccable goes to `impeccable`; this skill keeps a critique of such a page, research and a named small fix. NOT for backend-only work or charts (dataviz), nor a BRIEF for someone else to design (an external designer, a contractor, a Claude Design project): that is `design-handoff`, which withholds the decisions this skill makes. When what to build comes before how it looks, `brainstorming` runs first.
---

# Apply Design Judgement

Five failures recur: inconsistent UI (surface-by-surface, unaware of what the app already has); generic UI (stock defaults unchecked); shallow UI (happy path only); desktop-first UI (one width designed, not all); crowded UI (every brief item answered instead of the one a reader came for). None shows in a diff.

## Look at the Picture

An image referenced by position ("this one", "the second") needs its target surface named before work starts; the pointer otherwise attaches to whatever you worked on last. 📖 `../design-handoff/references/handoff-incident-patterns.md` for a worked case.

Read a screenshot as a rendered interface even when the question is about an API or a bug: overflow, collision or contrast defects still show. Answer what was asked, note what else you saw and offer the fix; do not silently fix the layout. A complaint about the screen itself is a design pass: fix it (§ A design pass ends in a better screen, shown).

## First decide which job this is

**Making a landing page, marketing site or portfolio look better is `taste`'s job whatever the verb (build, redesign, polish, improve, "make it wow"), even when the user named this skill: invoke `taste` rather than designing the page here, and hand over mid-task when a page job turns into a look change.** This skill's restraint drifts to the category default on a page. Stays here: a critique with no edits, research, and a named small fix ("the price is cut off at 375px"). A critique of such a page takes 📖 `references/marketing-pages.md`; business tools inherit the app's language. **A shop's storefront home (product rails, deals, grids) is a shop screen, not a marketing page, and stays here**; its rules are in 📖 `references/design-pass-details.md` § Shop storefront home, and its browse pages take the scroll-up header rule (`references/mobile-first.md` § Navigation).

**A request for every design skill ("use all", "use the design skills", or the user calling a surface's design work "the UI/UX", which means the design skills, not this one alone) runs `uiux`, `impeccable` and `taste` together, whatever the page type**: `taste` then takes its review path, no full run (commands: § A design pass ends in a better screen, step 2), and every finding from it is fixed in the same pass. The routing above names one owner per job, which reads as permission to drop the others (08/11/2026: `taste` was left out of a "use all" pass until the user asked "What about taste skill").

**A go-live check is measured, not designed**: 📖 `references/go-live-check.md` before running any check of a site about to launch or just launched.

**Whatever moves or responds to touch belongs to Emil Kowalski's skills, even inside a polish or redesign that never says "animate"**: transitions, drawers, toasts and cases nobody calls motion (full list in 📖 `references/motion-routing.md` § Cases nobody calls motion). Invoke the Emil skill that motion-routing.md names for the task, with the task as its argument (bare, most only greet).

Brownfield (an app with a language) and greenfield (nothing to inherit) start from different questions.

**When a design already exists:** A prototype, Figma file, Claude Design project or annotated screenshots means a port: reproduce what is there, and reserve judgement for what the platform forces. 📖 `references/porting-existing-designs.md` before reading or asking about the design and before briefing any builder.

**When reading an existing app's language:** run `node scripts/probe-design-system.mjs <repo root>` first; the brief names the atoms it found that this surface must reuse. Where `tokenLint` is absent, the lint offer and its record line are in 📖 `references/design-pass-details.md` § Reading an app's language. Before writing a treatment, grep for its mechanism: several hits elsewhere mean the app already decided; one in your own file means you invented a pattern. Breaking a convention means saying which and why; a verdict beyond the visual layer is a finding with a blast radius, never a polish (📖 `references/design-language-health.md` § Working inside an app's language).

Design the branch that renders on the active route, not the file that names it: components hold several layouts behind flags (📖 `references/reading-live-branches.md`).

**When starting from nothing:** there is no app language to read, so name what you're designing FOR (audience, subject, job, asked in that order), then decide the smallest system that keeps the second screen consistent with the first (📖 `references/greenfield-minimum-system.md`).

**Whichever job it is, write a one-line design read before any code:** audience, subject, job, and how bold or restrained this surface should be. Ask only if the read genuinely forks; otherwise state it and proceed, never past an approval gate. A critique writes none.

## A design pass ends in a better screen, shown

**Unless the ask is a critique ("what's wrong", "audit", "review it" with no edits), the deliverable is changed screens, not findings.** "Use the design skills", "polish", "improve the UI/UX" or a screenshot with a complaint all mean: find what is wrong, fix it in the same pass, re-measure, and show the result. Only a finding that changes who can do or see something, wording a customer is promised, or a direction the user has not picked goes back as a question (the 15/11/2026 incident: 📖 `references/design-incidents.md`). **Tell: your reply lists findings and the diff has no frontend file.**

A redesign, a revamp or a "not nice" goes to the deal rule first (§ Scope and Blast Radius). Steps 3 to 6 then run on the chosen direction, never on today's look. Each rendered direction is scored against `../impeccable/reference/critique-rubric.md` before any is offered, each option carrying its score and top finding (📖 `references/direction-approval.md`). Directions for one state of a screen are rendered beside its busy state and on a real role's data (`references/design-incidents.md` § A pick waits on a thin fixture). **Tell: you are offering directions and no `impeccable detect` ran on them.**

The pass, in order. Paths are relative to this skill's folder (`${CLAUDE_SKILL_DIR}`), and sibling skills sit beside it (`${CLAUDE_SKILL_DIR}/../impeccable`, `${CLAUDE_SKILL_DIR}/../taste`); never resolve them against the project. Without Node 22+ and Chrome, Edge or Playwright's Chromium (`CHROME_PATH` overrides), say so in the reply, read screenshots instead and label the pass unmeasured.

0. **Find the page.** Measuring needs a URL a browser can open, started if it isn't running; a signed-in screen needs a saved login. Steps, login recipes and the `Run locally:` lines: `references/design-pass-details.md` § Finding the page (step 0) and § Saved login. With no openable page, write "check-render: not run: <reason>", never skip silently.
1. **Probe** an existing app with `scripts/probe-design-system.mjs` (§ When reading an existing app's language), even when you have already read its token file. Capture the before state with `scripts/check-render.mjs --out <dir>`.
2. **Find**: your own read plus the other design skills' detectors, run as commands on the before page (`references/design-pass-details.md` § Detector commands (step 2)). When the user said "design skills" (or "use all"), `impeccable`'s critique runs in the same pass too (§ First decide which job this is). Offering these passes afterwards, when the user already asked for them, is the defect ("say if you want those passes too", headless test, 22/11/2026).
3. **Fix** everything that needs no question, reusing the atoms the probe listed.
4. **Measure** with `node scripts/check-render.mjs <url>` on every changed screen after the last edit (`--storage-state <file>` behind a login; check the final URL is not the login page). Fix every FAIL and WARN, or name it as an exemption with its reason; card-in-card, truncated text and uneven cards are what users complain about. A screen people operate (ticks, steppers, toggles, a drawer, a search box or a dropdown typed into) also gets a clickthrough at a phone and a desktop width, read frame by frame. Shared headers and navs also run laptop widths (`references/design-pass-details.md` § Laptop widths and clickthrough). **Tell: you are about to call a screen done and check-render has not run since your last edit to it.**
5. **Look**: open (`Read`) the after captures yourself at phone and desktop width, plus the `-blur8` capture (the main element and the groups should still separate when blurred, NN/g's squint test). The script cannot judge hierarchy or crowding, and in 39% of measured UI sessions nobody looked at the last edit at all. **Tell: you are about to show captures you have not opened.**
6. **Show** four pictures, before and after at 375 and at 1280 (check-render's `w375-…-top` and `w1280-…-top` captures), through `show_image` where it exists, otherwise as the four file paths in the reply, and say what changed. **Where the user follows from a phone or another device (Remote Control, the mobile app), send the pictures with `SendUserFile` (`display: render`), never as paths** (`references/design-pass-details.md` § Showing on a phone).

## When the user asks for research, or how real products solve it

"Research" in a UI request triggers this section even about the user's own screen. Run the dispatch before proposing; measuring the app runs alongside it, never instead. A proposal citing "best practice" with no URL you opened means the research didn't happen.

**Every research run includes real-world case studies: live products, named, where the same situation occurs, each with a URL you or an agent fetched.** Research about the subject is brief input: subject research is a third agent, never a substitute for the case-study leg, and research that stops there feels complete and isn't (📖 `references/design-incidents.md` for the run that stopped there). **Tell: every URL in your research is the subject's own.**

**Every research run also reaches outside the user's own domain, whatever the question.** Same-domain products show the market's baseline; the answer worth having often comes from products renowned for their UX in other domains that face the same page job or decision. Keep at least two such products beside the domain's best (📖 `references/case-study-research.md` § Renowned-UX library: the named list and how to filter it). Measured 22/11/2026 and 25/11/2026, both times the user had to ask (📖 `references/design-incidents.md` § Same-domain research only). **Tell: every product in your brief sells or does what the user's product does.**

**A report where most cells say "not stated" means the brief aimed at the wrong evidence, not that no precedent exists:** re-brief once at a different source kind before relaying (`references/case-study-research.md` § What comes back). Open the cited sources yourself and report evidence and judgement separately; a look or layout is captured live (`scripts/capture-references.mjs`). Dispatch, cells and returns: 📖 `references/case-study-research.md`.

**Research is the first half of this skill's job, never all of it.** The build comes many turns later, when the research rules are only recalled, and it still needs a design decision and a graded render. **So re-invoke this skill before briefing UI builders, and again when they return, before calling the screens done.** 📖 `references/design-incidents.md` for the builders that followed a research-only invocation. **Tell: you invoked this skill for research, and your next UI verdict cites no re-invocation.**

A design principle the user supplied (a screenshot, a reel) is a source to read, not research to replace (📖 `references/case-study-research.md`).

## When asked to review a screen

"Critique", "audit" or "what's wrong with this" is a judging job, not a fixing job: score it, rank what the reader loses, and hand the findings back before touching anything. 📖 `references/critique-mode.md` for the two isolated reviews and the 0-4 scoring.

## Scope and Blast Radius

Scope by blast radius, not phrasing.

Single-element fixes build directly; section polishes propose inline and code. A control the app lacks is a question other products have answered, so run the research dispatch before its options reach the user, even unprompted (📖 `references/design-incidents.md`). **Tell: every option you are about to offer cites only the app's own components.** Page redesigns and module-wide passes survey first (language, audience, subject, job), capture the before-state (§ Verify by Looking), then wait for approval. **A new look (palette, type, layout language) is dealt by a script, never chosen from memory, and shown as two or three real screens beside today's: a score, a tiebreak or "closest to current" never picks it** (📖 `references/design-pass-details.md` § New look: the deal). A user who calls a product "not nice" expects a revamp they can see (measured 19/11/2026: 📖 `references/design-incidents.md` § A new look chosen by tiebreak). **Tell: your plan names the winning direction before the user has seen any of them rendered.** Before a new flow or page direction goes for approval, run both reviewers first (📖 `references/direction-approval.md`).

**Where stakes are highest, prefer a rendering tool to a text mockup** (Claude Design via `ToolSearch`, or a dev-server page); a text mockup shows layout order and hierarchy only (📖 `references/design-pass-details.md` § Rendering tools over text mockups).

## Verify by Looking

**On a redesign, capture the before state**, both states side by side. Single-element fixes need no baseline; section polishes usually do; page redesigns always do.

A UI change is verified by looking, not by the diff. The rendering carries meaning the source never does. `scripts/check-render.mjs` (step 4) captures 320 to 1280 px in each colour scheme and measures what a screenshot reader misses (`references/design-pass-details.md` § Captures (step 4)). Hierarchy, crowding and readability are still your grade, by opening the captures.

Reproduce only what you can fully read: "likely" or "presumably" about a layout means the page did not fit and the design system filled the gap. Name the unreadable part and what stays unverified (📖 `references/verification-checklist.md` § Reproduction limits).

Before trusting a capture, 📖 `references/verification-traps.md`: stale bundles, fixed elements and phone bottom bars all look like defects.

**A builder's screenshots are a set to grade, not a sample.** Open every one, and grade them on a fresh invocation of this skill, not the research one whose rules are recalled by then (📖 `references/verification-checklist.md` § Grading a builder's set: the rules and the wrap-up grade `done` runs). **Tell: your verdict cites fewer screenshots than the builder produced.**

Ask for screenshots after proposals; the first render is a second approval gate (📖 `references/verification-checklist.md` § Flows and recordings). A cut-off edge at the viewport is a boundary, not a layout bug.

Verification scales with blast radius: the widths and states per 📖 `references/verification-checklist.md` § Scale by blast radius. Look in one batched round, confirm fixes in one more, and go further only for a named defect; the before capture and the approval render are not rounds.

## The Tension

Matching the app fights being distinctive: unchecked, it inherits templated defaults, and "be distinctive" alone produces a page that matches nothing. **Spend distinctiveness where the surface's actual *job* calls for it; keep everything else consistent.** Core workflow pages can stand out; sidebars, modals and settings inherit. A brief that pins a direction (brand refresh, new component system) makes consistency win.

Without neighbours to anchor against, ask whether it was shaped by its audience, subject and job or defaulted (📖 `references/ai-look-tells.md` § Stock aesthetic looks, `#stock-looks`). **A screen called boring, plain, flat, busy or default, or one with "no focal point", gets the move for that complaint** (📖 `references/composition-moves.md`, read before choosing; a vague "meh" is diagnosed from the blur captures first).

A one-word theme names a direction, not a costume: spend it on one element and keep everything around it quiet (📖 `references/design-incidents.md` § A one-word theme is a direction, not a costume).

Five questions (swap, squint, signature, token, exclude) test whether something was shaped or defaulted: 📖 `references/ai-look-tells.md` § Five questions.

The real logo goes in a logo slot; where none exists, leave it empty or set the product name as text, and say the logo is missing; a stand-in mark ships silently as a finished decision (📖 `references/design-incidents.md` § A fabricated logo reads as a finished decision).

## Mobile-first is the default, not a viewport check

Design at 375px first and let columns arrive with width: that order locks in what a later "check it on mobile" pass cannot undo. 📖 `references/mobile-first.md` for the default checklist and WCAG target-size floors. Read it before choosing a header or nav, not only before calling a screen done.

## Design for people who scan

People look for one thing and act, so design for scanning: one bold action per screen, rare actions in a menu, and only home, search and print work unlabelled. 📖 `references/designing-for-scanners.md` § Scanning checklist for the rest and for progressive-disclosure traps.

**Wording is half the design, and every pass edits it as hard as the layout.** Use the fewest words a first-time reader needs to act correctly: cut what the screen already says, and let structure carry the rest. Never cut the fact that changes what the reader does: a deadline, a fee, who will see it, what cannot be undone. 📖 `references/designing-for-scanners.md` § Words. **Tell: your design diff changed classes and no strings, or a sentence you cut held the only mention of a consequence.**

**A gap-list brief produces a crowded page:** each gap gets its own element, and together they bury the one figure the reader came for. Apply hierarchy to the list itself (📖 `references/designing-for-scanners.md` § Gap-list briefs).

**A control belongs in the same container as what it changes.** A chevron or chip on a distant control labels the separation without fixing it: open the detail inside the thing clicked, or put selector and detail in one card (📖 `references/design-incidents.md`).

## The States Beyond the Happy Path

A populated, working interface is what gets reviewed; shallow UI breaks silently in loading, zero-row, one-row, error, disabled and text-overflow states. Build for those too.

**Loading**: stale content feels broken rather than pending, and users can't tell fetching from a hang. Show a pending state in its place (skeleton, spinner or gray), at the final size (📖 `references/design-incidents.md`, the stale slider).

**Empty states invite action; errors explain and show the path forward.** Naming the absence is not enough.

**Lazy-loading is design, not just performance.** Defer what users hunt for; keep resident what tells them what the screen is and what to do. Deferred content still needs a loading state. 📖 `references/designing-for-scanners.md`.

**A populated interface needs the same question.** Accurate figures with nowhere to go answer "what is true", never "what do I do". Ask what the reader does next with each figure and give them a way to act. Where there's no honest next step, state the meaning rather than invent a destination.
