---
name: uiux
description: >
  Apply design judgement to UI/UX work at any scope — "polish the uiux for this module", "rethink the uiux for this section", redesign a page, or tighten a single element. Fire on explicit requests (redesign, rethink, polish, uiux, "make this nicer") and on implicit ones: a screenshot arrives, or someone reports what they saw ("looks wrong", "shows the old one", "nothing happens") without ever naming UI — the person reporting a bug often can't tell whether the cause is code or layout. Will NOT fire on backend-only work or chart building (that is dataviz). When the surface's requirements aren't settled yet and several fundamentally different approaches need exploring first, `brainstorming` runs before this — that skill decides WHAT to build, this one decides how it should look and behave.
---

# Apply Design Judgement

Three things go wrong, and they have different causes. Inconsistent UI comes from working surface-by-surface without knowing the conventions the app already has. Generic UI comes from choices nothing drove — inherited defaults where an app exists, stock defaults where one doesn't. Shallow UI comes from designing only the happy path. All three are invisible from a diff, which is why a UI change is verified by looking at it.

## Read the app first (or the brief, when nothing exists)

**When an existing app provides the language:** infer the app's existing design language: spacing scale, type scale, colour usage, component patterns, border/shadow/radius treatment, interaction conventions. Look for a `frontend/CLAUDE.md` or similar conventions document — if one exists, read it for the app's established rules and component library. If not, infer the language from sibling pages and shared components. The point is not to copy the lowest-common-denominator treatment reflexively; it's to know what you're departing from and whether you're doing it deliberately.

Work inside those conventions unless explicitly asked otherwise. When you propose to break them, say which convention and why the change needs to break it. A brief that pins a direction (brand refresh, new interaction model) overrides the existing app language — that's explicit departure, not inconsistency.

Reading a conventions doc is not the same as having found the convention, and the difference is invisible until someone points at the result: a doc names tokens and rules, while the answer you need is usually a component that already exists for this exact job. So once you've chosen a treatment, grep the codebase for the mechanism you're about to write — the prop, the component name, the shape — before writing it. A single hit that turns out to be your own file means you just invented a pattern; several hits elsewhere mean the app already decided and you're about to disagree with it by accident. This costs one command and it is the only step that catches the failure while it's still cheap, because everything downstream — the diff, the type checker, the screenshot — shows an invention and a convention as equally working code.

**When you're starting from nothing:** there is no app language to read, so the anchor points come from elsewhere. Pin down three things: the audience (who is looking at this, what's their situation), the subject matter (what does the surface represent, what's its domain), and the job (what does a user need to do here, what's the single point of friction you're solving). These three push back against the stock looks named below. A surface designed for an 8-year-old reads different from one for a surgeon; a dashboard for hospital operations differs from a dashboard for a social network; a permission screen has one job, a home page another. Name what you're designing FOR before you design.

## The Tension

Matching the app fights being distinctive. "Match existing conventions" unchecked inherits the app's own templated defaults — the generic looks that appear regardless of subject matter. "Be distinctive" unchecked produces a page that doesn't match anything. Neither reads as a failure when examined alone; the failure is when both are true at once — a distinctive page beside a conventional one, or a conventional page that *should* stand out.

**When neighbours exist,** the resolution isn't a rule. Spend the distinctiveness where the surface's actual *job* calls for it, and keep everything around it consistent with its neighbours. If the surface is a core workflow page, make it sing. If it's a sidebar, a modal, or a settings section, let it inherit. If the brief pins a direction already — brand refresh, a new component system rolling out across the app — that decision is made and consistency wins.

**When you're starting from nothing,** there are no neighbours to anchor against, so the tension inverts: the only question left is whether the surface was shaped by the audience, subject and job you named earlier, or whether it defaulted. A dashboard built for a surgeon mid-procedure reads nothing like a reading platform for a novelist. Neither is distinctive by accident; both become distinctive by being shaped for their purpose.

Either way, choices collapse into a few stock looks when nothing drives them: **cream/serif/terracotta** (warm, literary, unhurried); **near-black + acid accent** (high contrast, speed, dark mode); **broadsheet hairline** (newspaper columns, delicate, airy). Each bundles an unexamined assumption — that the brief is literary, that contrast matters most, that editorial tone fits. They show up everywhere because nothing anchors them to a particular project; recognising one is the moment to ask what your audience, subject and job would choose instead. (Adapted from the `frontend-design` skill, Apache-2.0.)

## Scope and Blast Radius

A "polish this section" request is smaller than a "redesign this page" request, even if the page is small and the section is large, because polish affects existing surfaces and redesign can rework the whole structure. Scope by blast radius, not phrasing.

A single element or a focused polish (tighten spacing, improve a button) builds directly. A section polish (improved card layout, consistent form treatment) proposes changes inline and codes them. A page redesign or a module-wide pass (multiple sections, multiple features sharing one surface) surveys first — the existing language where there is one, the audience/subject/job where there isn't — then proposes the direction and waits for approval before coding — as `AskUserQuestion` when the proposal has genuine branches to choose between, inline prose when there's one direction to confirm. The distinction prevents two costly misfires: rewriting a page when spacing adjustments were wanted, or tweaking edges when a ground-up rework was intended.

## The States Beyond the Happy Path

A populated, working interface is what gets reviewed. What it looks like while loading, with zero rows, with one row, on error, when disabled, and when text overflows is the space where shallow UI breaks silently. Build for those too.

**Loading specifically**: showing stale content while new data arrives feels broken rather than pending, because a user can't tell whether you're fetching or something hung. A real case is worth naming — an image slider kept showing the previous photo until the next one finished loading, and it was reported as a bug when it was an unhandled state. Show nothing (a skeleton, a spinner, a grayed container) rather than stale data.

**Empty is an invitation to act; error is an explanation and a path forward, not an apology.** An empty state that names the absence ("No activity yet") has described the data rather than telling the reader what the state means or what would change it.

**Loading less up front is a design decision, not just a performance one.** Deferring a component, a screen's data, or the rest of a list — lazily-loaded modules, paginated fetches, an accordion, a "show more" — buys a faster first paint by trading away discoverability, so what you defer decides what a user can find. Defer what someone goes looking for, a heavy picker, a map, page two of results, and keep resident whatever tells them what this screen is and what to do next. The trade lands hardest on a phone, where the deferred thing is usually below the fold and a slow connection turns "loads on demand" into "appears never". Reserve the deferral for weight that's actually there: splitting out something small costs a round trip and a loading state to save bytes nobody was waiting on. Deferred content still needs the states above, including a placeholder at the real size, so the layout doesn't shift when it lands.

**The populated state needs the same question, and this is the one that survives review.** A surface reporting accurate figures and offering nowhere to go answers "what is true" and never "what do I do now" — correctness review can't catch it, because nothing is wrong. Ask what the reader does next with each figure and give the ones with a real answer a way to act. Where there's no honest next step, say what the state means rather than inventing a destination: a drill-down built on a filter the API doesn't support reads as helpful and goes nowhere, which is worse than the readout it replaced.

## Look at the Picture

When a screenshot arrives, read it as a rendered interface *separately* from whatever question came with it. Even when the question is about a bug, an API, or a query — not about UI at all — scan the image for overflow, collision, misalignment, inconsistent spacing, truncation, contrast. This applies even when nobody has called it a UI problem, because visual defects hide themselves inside technical questions.

Answer what was asked first, then note what else you saw and offer to fix it; don't silently widen scope. "Your slider timeout question — here's the fix. I also spotted the image overflowing its container and the title text colliding with it; want me to address those too?" beats silently fixing the layout and reporting it back.

## Verify by Looking

A UI change is verified by looking at it, not by the diff. A screenshot of the changed state suffices; a diff shows what bytes moved, not whether the interface reads right. Spacing that looks correct at one viewport breaks at another; a button that reads as clickable on desktop sits at ambiguous contrast on mobile; a card layout that works with three items wraps differently with twelve. The rendering carries meaning the source never does.

Where a project has a browser-driving agent available, user-action flows can be verified that way — testing that a click does what it's supposed to do. Absent one, a screenshot still verifies the static visual state — that the spacing is tight, the alignment is clean, the text is readable, the contrast passes, the truncation is handled. Ask for a screenshot after each proposal, especially at larger scopes where the surface is complex enough that rendering surprises are common.

A project with an E2E suite already has a third source, and it is the cheapest of the three: the suite can record its runs, and those recordings walk the real flows end to end. This is worth asking for when reviewing a whole module rather than one element, because the defects it surfaces are the ones assertions structurally cannot — raw markup rendering as text, copy promising something the product never does, a dialog whose label renders empty. A green suite says every asserted condition held; it says nothing about what the screen looked like while holding. Treat a cut-off edge in a recording as the viewport boundary until proven otherwise — the frame is smaller than the page, and reading a crop as a layout bug sends the review after a defect that isn't there.
