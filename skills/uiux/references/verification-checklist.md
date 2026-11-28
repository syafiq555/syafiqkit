# Verification checklist

Read this when a surface is about to be called done. A screenshot at one width in one state is where most misses hide.

Take the looks in one batched round, confirm fixes in at most one more, then stop. Polishing past that without a named defect trades the reader's time for the reviewer's unease.

## Widths

Look at 375px (phone), 768px (tablet) and 1280px (desktop) at minimum. At each: no horizontal overflow, no text truncated unexpectedly, images scale without stretching, navigation reflows (bottom tabs on the phone), touch targets stay at 44px, and long-form text stays within about 65 to 75 characters a line rather than running the width of a wide screen. On the phone, also look in landscape and at the largest system text size — both reflow the layout in ways portrait at default size never shows.

**A layout sized to the screen is judged by height as well as width.** A pinned scroll scene, a sticky stage or a `100svh` hero holds a fixed amount of content in a box that shrinks with the viewport, and `overflow: hidden` on it clips the excess silently, so a tall test phone (Pixel 7 is 839px) passes while a 667px iPhone loses the top of the price and buries the link under a fixed bar. Look at 375×667 and 320×568 on the phone and 1366×650 on a laptop, and have a spec assert there that the key element sits below the header and the action is hit-testable. Measured 2026-10-20: a cinematic hero passed every width check and clipped its price at 375×667.

## Interaction states

Every interactive element shows, visibly and distinctly:

- **Hover** (pointer devices only, never the sole affordance)
- **Focus** — reachable by keyboard, with a visible ring; the tab order follows the reading order
- **Active / selected** — which tab, row or item is current
- **Cause and effect** — click every control that changes other content. The change lands in view, in the same container, and the thing you clicked doesn't move out from under the pointer.
- **Pressed** — colour, opacity or elevation changes; the element's bounds do not, so nothing around it jitters
- **Disabled** — and, where possible, why
- **Loading** — pending is distinguishable from broken; stale content is not left on screen while new data loads

## Forms

- Validation fires on leaving a field, not on every keystroke, and the message sits by the field it belongs to.
- A failed submit keeps the inline errors and, where there is more than one, adds a summary at the top that receives focus and links to each field.
- Password and code fields accept paste and password managers; a check that only a human can pass has a non-cognitive alternative.
- Anything done by dragging can also be done with a button or the keyboard.

## Colour and contrast

- Body text against its background reaches 4.5:1; large text and UI boundaries reach 3:1 (WCAG AA).
- Colour is never the only signal: error, success and selection each carry an icon, a label or a shape as well.
- A hue means one thing. Red is not both "error" and "attention".
- If the app has a dark mode, every state above is checked there too.

## Motion

- Animate `transform` and `opacity` only; animating layout properties (width, height, top) forces reflow and stutters on phones.
- Durations come from shared tokens chosen by distance and complexity — a small state change lands around 150 to 200ms, a full-panel move longer. One duration copied onto every transition is the defect, not a value outside that range. A page-load sequence is one orchestrated moment, not an effect on every element.
- Every animation respects `prefers-reduced-motion`. Anything that rotates or advances on its own (a carousel, a ticker, a countdown) has a visible pause control and stops on focus, on hover and under reduced motion.

## Layout stability

- Deferred content lands in a placeholder of its final size; nothing jumps when it arrives.
- Fonts load without a visible reflow (size-adjusted fallback or `font-display: swap` with matched metrics).
- Stacking uses a small named scale (say 10, 20, 30, 50 for raised, sticky, overlay, modal), so a new element never needs `z-index: 9999` to win.

## Captures a static shot misses

Screenshots of a settled page miss clipping and sequence. Open a dropdown or picker inside a scrolling modal, step through each stage of a multi-step modal, and check the colour mode the user actually runs (not only the default). A reused or secondary surface is where defects cluster, so those shots are graded too.

## Grading a builder's set

Grade each of the builder's screenshots against its siblings on the same page (does it read as one of them, for this reader?), not against "does it render", and the items inside one group against each other: tiles, cards or rows of one kind share width, height and alignment, and a mismatch usually means an atom built for another shape (short option chips) was reused for long choices. The skipped shots are usually the reused or secondary surfaces, where the defects sit. When the user calls a screen unpolished, check its structure before its copy: a component in the wrong context needs replacing, and string patches waste a round. `done` runs this grade as its Design row at wrap-up, alongside `impeccable` `critique`, for any diff that changes something a person sees.

## Flows and recordings

Verify flows with `browser-verifier` only on an explicit ask this turn, otherwise run the flow yourself. Screenshots verify static state (spacing, alignment, readability, contrast); E2E recordings catch what assertions miss (markup rendering as text, copy the product never delivers).

## Parallel builders and specs

Builders on screens whose files don't overlap run in parallel, and each re-runs only the specs for the files it touched; a spec already green on an untouched surface is not run again until the final pass ("is there a need ... to keep running full test again and again ?", 18/11/2026).

## Reproduction limits

Reproduce only what you can fully read. Where the real page won't fit (too many files, an unlocated component, an unresolved branch), the gap fills from the design system as a plausible page that looks faithful and isn't. Name the unreadable part and what it leaves unverified.

## Scale by blast radius

A single-element fix checks the widths where it can break (usually phone and the desktop it sits in). A page redesign checks 375px, 768px, 1280px, plus a short height (375×667, 1366×650) wherever a stage is pinned or sized to the screen, with hover, focus, disabled, loading, contrast, motion and layout-shift. Look in one batched round, confirm fixes in one more, and go further only for a named defect. The before capture and the approval render are not rounds. For builders sharing a round and for thresholds: § Parallel builders and specs.

## Sources

- State and colour checks: https://github.com/jezweb/claude-skills/blob/main/plugins/frontend/skills/design-review/SKILL.md
- Motion rules: https://github.com/github/awesome-copilot/blob/main/skills/premium-frontend-ui/SKILL.md (the 150–200ms figure; treated as typical, not a cutoff)
- Responsive widths: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md
- Duration not a universal cutoff (#8), z-index scale (#15), validation on blur (#56), line length (#73), focusable error summary (#109): https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/data/ux-guidelines.csv
- Pressed state without layout shift, landscape and largest text size, auto-rotating content controls: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/references/pro-rules.md
- Contrast ratios: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Accessible authentication and dragging alternatives (WCAG 2.2 AA): https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html and https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
