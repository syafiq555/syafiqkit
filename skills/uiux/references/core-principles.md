# Core principles: the full text

Read this when building or fixing any surface and the one-line principle in `SKILL.md` is not enough to decide. Each section below is the full rule `SKILL.md` summarises. The full text lives here so `SKILL.md` stays under the 5,000-token re-attach limit.

## Research {#research}

**Every research run includes real-world case studies: live products, named, where the same situation occurs, each with a URL you or an agent fetched.** Research about the subject (the client's brand, the user's own app, a competitor's data) is brief input, never the case-study leg, and it feels complete on its own. 📖 `design-incidents.md` for the run that stopped there. **Tell: every URL in your research is the subject's own.**

Start from the situation and send agents to where it occurs, not to a category of products. Dispatch through `syafiqkit:haiku`: one agent for live products, one for component libraries and research bodies, asked the same cells, each claim with a fetched URL. Subject research is a third agent, never a substitute. **A report where most cells say "not stated" means the brief aimed at the wrong evidence, not that no precedent exists:** re-brief once at a different source kind before relaying. Open the cited sources yourself, and report evidence and judgement separately. 📖 `case-study-research.md` for the method, cells and what to check in returns.

A design principle the user supplied (a screenshot, a reel) is a source to read, not research to replace. 📖 `case-study-research.md` for how to brief and what comes back.

## The Tension {#tension}

Without neighbours to anchor against, distinctiveness is a question: was this shaped by its audience, subject and job, or did it default? Choices collapse into stock looks when nothing drives them, and each bundles an unexamined assumption: when you recognize one, ask what your audience, subject and job would choose instead. 📖 `ai-look-tells.md` names the six stock looks (`#stock-looks`) and the concrete giveaways (edge-stripe cards, gradient text, a label above every heading), each with the question it should prompt. (Adapted from `frontend-design` skill, Apache-2.0, and `superdesign` skill, MIT.)

A one-word theme ("industrial", "brutalist", "retro") names a direction, not a costume to assemble. Spend it on one element, keep everything around it quiet, and cut what exists only because of the theme word. A brief's "no need to follow the existing palette" removes a constraint; it does not make the theme the goal.

Five questions test whether something was shaped or defaulted: **Swap** the typeface or layout with a default one, would anyone notice? **Squint**: does hierarchy survive? **Signature**: point to the element carrying this product's character. **Token**: do the variable names belong to this world or any project? **Exclude**: name an audience this direction would be wrong for; a look that suits everyone was chosen by nobody.

Where a surface has a logo slot and the product has a real logo, the real logo goes there: never initials in a circle, an emoji, a generic icon-set mark or an invented SVG. Where no real logo exists, leave the space empty or set the product name as text, and say the logo is missing; that is a question for whoever owns the brand. A placeholder mark reads as a finished decision and ships silently. 📖 `design-incidents.md` for the measured cases behind the theme, crowded-page, control-placement and logo rules.

## Design for people who scan {#scanners}

**A gap-list brief produces a crowded page.** "Can't find property, tenant, grouped meaning, ungroup route, relations" reads as items to cover, so each gap gets its own element; each is defensible, and together they bury the one figure the reader came for. Apply hierarchy to the list itself; a reader in a hurry is the audience, not completeness.

**A control belongs in the same container as what it changes.** A row, tab or switch that re-renders a card elsewhere reads as two separate things, and a chevron or chip on that distant control labels the separation without fixing it. Open the detail inside the thing clicked (accordion row, expanding card), or put selector and detail in one card. A fix that adds a label rather than moving the content is the wrong fix. 📖 `design-incidents.md`.

## The States Beyond the Happy Path {#states}

A populated, working interface is what gets reviewed; shallow UI breaks silently in loading, zero-row, one-row, error, disabled and text-overflow states. Build for those too.

**Loading**: stale content feels broken rather than pending, and users can't tell fetching from a hang (an image slider kept the previous photo until the next loaded, reported as a bug). Show a pending state in its place (skeleton, spinner or gray).

**Empty states invite action; errors explain and show the path forward.** "No activity yet" names the absence, not what the state means or how to change it.

**Lazy-loading is design, not just performance.** Defer what users hunt for; keep resident what tells them what the screen is and what to do. Deferred content still needs a loading state and a placeholder at its final size. 📖 `designing-for-scanners.md`.

**A populated interface needs the same question.** Accurate figures with nowhere to go answer "what is true", never "what do I do". Ask what the reader does next with each figure and give them a way to act. Where there's no honest next step, state the meaning rather than invent a destination: a drill-down built on an API-unsupported filter reads helpful but goes nowhere.

## Verify by Looking {#verify}

A UI change is verified by looking, not by the diff: spacing right at one viewport breaks at another, and a three-item card layout wraps differently with twelve. The rendering carries meaning the source never does.

Reproduce only what you can fully read. Where the real page won't fit (too many files, an unlocated component, an unresolved branch), the gap fills from the design system as a plausible page that looks faithful and isn't. Writing "likely", "probably" or "presumably" about a layout means you are in that case: name the unreadable part and what it leaves unverified.

Verify the render came from your source. A stale bundle looks like a design defect, so check it is present, fetchable and newer than your edits. A full-page capture misplaces `fixed` or `sticky` elements; judge those from viewport shots at scroll top and bottom. 📖 `verification-traps.md` for both traps.

**A builder's screenshots are a set to grade, not a sample to spot-check.** Open every one before calling the screens done, and grade them on a fresh invocation of this skill, not the research invocation whose rules are recalled by then. The skipped shots are usually the reused or secondary surfaces, where the defects sit. Add what a static capture misses (📖 `verification-checklist.md`). Grade each against its siblings on the same page (does it read as one of them, for this reader?), not against "does it render". When the user calls a screen unpolished, check its structure before its copy: a component in the wrong context needs replacing, and string patches waste a round. **Tell: your verdict cites fewer screenshots than the builder produced.** `done` runs this grade as its Design row at wrap-up for any diff that changes something a person sees.

Ask for screenshots after proposals; the first render is a second approval gate. Verify flows with `browser-verifier` only on an explicit ask this turn, otherwise run the flow yourself. Screenshots verify static state (spacing, alignment, readability, contrast); E2E recordings catch what assertions miss (markup rendering as text, copy the product never delivers). A cut-off edge at the viewport is a boundary, not a layout bug.

Verification scales with blast radius: a single-element fix checks the widths where it can break (usually phone and the desktop it sits in); a page redesign checks the full width set and the short heights (`verification-checklist.md` § Widths), with hover, focus, disabled, loading, contrast, motion and layout-shift. Look in one batched round, confirm fixes in one more, and go further only for a named defect. The before capture and the approval render are not rounds. 📖 `verification-checklist.md` for thresholds.
