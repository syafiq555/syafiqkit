# Verification checklist

Read this when a surface is about to be called done. A screenshot at one width in one state is where most misses hide.

Take the looks in one batched round, confirm fixes in at most one more, then stop. Polishing past that without a named defect trades the reader's time for the reviewer's unease.

## Contents

1. Widths
2. Interaction states
3. Forms
4. Colour and contrast
5. Motion
6. Layout stability
7. Captures a static shot misses
8. Sources
9. Module cross-references (craft floor, polish, harden, audit, taste motion) and what they add

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

## Sources

- State and colour checks: https://github.com/jezweb/claude-skills/blob/main/plugins/frontend/skills/design-review/SKILL.md
- Motion rules: https://github.com/github/awesome-copilot/blob/main/skills/premium-frontend-ui/SKILL.md (the 150–200ms figure; treated as typical, not a cutoff)
- Responsive widths: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md
- Duration not a universal cutoff (#8), z-index scale (#15), validation on blur (#56), line length (#73), focusable error summary (#109): https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/data/ux-guidelines.csv
- Pressed state without layout shift, landscape and largest text size, auto-rotating content controls: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/references/pro-rules.md
- Contrast ratios: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Accessible authentication and dragging alternatives (WCAG 2.2 AA): https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html and https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html

## Module cross-references {#module-index}

This file is the one index of "is it done" checks across uiux, impeccable and taste. The modules carry their own verification lists; this section says which of their checks this file already holds and which it lacks. Paths are relative to `skills/uiux/`. Open the module file for the full wording.

### Overlaps (already covered above)

- **Contrast 4.5:1 and 3:1.** `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/craft-floor.md` Verify "Contrast"; `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/audit.md` dimension 1 (adds 7:1 for AAA).
- **Line length 65 to 75 characters.** `craft-floor.md` Verify "Type" (65 to 75ch).
- **States: hover, disabled, loading, focus.** `craft-floor.md` Verify "States"; `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/polish.md` § 5 (loading, empty, error, success, disabled).
- **Widths and touch targets.** `polish.md` § 5 (mobile, intermediate and wide layouts); `audit.md` dimension 4 (44 x 44px, with WCAG 2.5.8 24px as the AA floor; the same split `${CLAUDE_SKILL_DIR}/references/mobile-first.md` states under "Touch and reach").
- **Reduced motion, transform and opacity, loops that stop.** `${CLAUDE_SKILL_DIR}/modules/taste/references/motion.md` § 8 (animate `transform`, `opacity`, `clip-path`; pause loops off screen or in a hidden tab) and § 10 rule 14 (every hidden state lives inside `prefers-reduced-motion: no-preference`); `audit.md` dimension 1 "Motion sensitivity".
- **Keyboard focus and a visible ring.** `craft-floor.md` Verify "States"; `polish.md` § 5 (focus, semantics, screen-reader names); `audit.md` dimension 1 "Keyboard navigation".
- **Dark mode checked as well.** `audit.md` dimension 3 "Broken dark mode"; for native, `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/ios.md` and `android.md` "Verifying the build".
- **Layout shift.** `polish.md` § 5 ("layout shift"); `audit.md` dimension 2 (layout thrashing).

### Where a module differs from this file

- **What may be animated.** This file: `transform` and `opacity` only. `craft-floor.md` Verify "Motion": reach past those; "blur, backdrop-filter, clip-path, mask, and shadow belong to the palette when they stay smooth". `motion.md` § 8: `transform`, `opacity` and `clip-path`, with `grid-template-rows` for accordions as the one accepted layout exception. `audit.md` dimension 2 flags casual layout-property animation and unbounded blur, filter or shadow effects, not these properties as such. All three forbid animating width, height, top or left as a habit; they differ on clip-path, mask, blur and shadow.
- **Reduced motion.** This file: every animation respects `prefers-reduced-motion`. `motion.md` § 8: "fewer and gentler, not none" (keep opacity and colour changes, drop travel, scale, parallax and autoplay). `audit.md` dimension 1: flag a global `0.01ms` kill that destroys useful feedback; the alternative must preserve state change and hierarchy.
- **Durations.** This file: about 150 to 200ms for a small state change, one duration copied everywhere is the defect. `motion.md` § 10 rule 4: press 140ms, hover colour 180 to 200ms, hover that moves 300 to 400ms, menus 240ms, reveals 700 to 900ms, picture openings 1,100 to 1,300ms, exits 60 to 70% of the entrance. Compatible; taste is the more specific table.
- **Shadows.** `craft-floor.md` Verify "Depth": shadows carry an offset and soft blur. Taste bans shadows on elements at rest (see `${CLAUDE_SKILL_DIR}/references/ai-look-tells.md`, module index). Not a checklist item here.

### Checks the modules add that this file lacks

Each is one line with its source.

- **Error and empty states** looked at, not only hover, focus, pressed, disabled and loading. `craft-floor.md` Verify "States"; `polish.md` § 5; `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/harden.md` Verify ("Errors", "Empty").
- **Real content and working controls**, with the real copy run at every breakpoint to catch overflow. `craft-floor.md` Verify "States" and "Type".
- **Success state, long-content state and missing-content state.** `polish.md` § 5.
- **Shadow depth**: offset plus soft blur; a zero-offset coloured halo is decoration. `craft-floor.md` Verify "Depth".
- **Secondary text on a coloured surface** is tinted from that hue or the foreground, never grey. `craft-floor.md` Verify "Contrast".
- **Spacing rhythm**: tight groups, generous separation, more space above a heading than below it, read from computed values. `craft-floor.md` Verify "Spacing".
- **Type limits**: display size max 6rem, tracking floor -0.04em, balanced headings, obvious scale and weight steps. `craft-floor.md` Verify "Type".
- **One authored motion moment**, exponential ease-out from an already-visible default. `craft-floor.md` Verify "Motion". Taste's matching limits: first frame painted with the headline in the HTML and the load sequence settled by 1.2s with four elements at most; reveals fire once and nothing in view stays hidden over 900ms; fills start at 45% ink, dims no lower than 40%, blur at most 8px; staggers 80 to 110ms for lines; no preloader, custom cursor or wheel capture (`motion.md` § 10 rules 1, 2, 5, 6 and 10). A reveal that never fires leaves a blank band: look at every screenshot for missing content after the motion pass (`motion.md` § 9).
- **Browser surfaces themed**: text selection, caret, custom scrollbars, focus rings, underline offset, tabular numerals. `craft-floor.md` Verify "Browser surfaces".
- **Copy checks**: controls name their action; errors name the problem and the recovery. `craft-floor.md` Verify "Copy"; the full copy verification list is in `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/clarify.md` "Verify" (see `${CLAUDE_SKILL_DIR}/references/designing-for-scanners.md`).
- **Coverage**: every brief requirement present and findable within seconds. `craft-floor.md` Verify "Coverage".
- **Semantics and names**: ARIA roles, labels and states, semantic HTML and heading hierarchy, landmarks, alt text, form labels and required indicators. `audit.md` dimension 1; `polish.md` § 5.
- **Zoom** and **text scaling** (layouts that break when text size increases; this file has largest system text size for the phone only). `polish.md` § 5; `audit.md` dimension 4 "Text scaling".
- **Console errors, interaction latency, image loading.** `polish.md` § 5.
- **Performance beyond animation**: layout thrashing, missing lazy loading, `will-change` left on at rest, bundle size, re-renders. `audit.md` dimension 2; `motion.md` § 8 (`will-change` only on an element about to animate, no many-children driven from one CSS variable).
- **Theming integrity**: hard-coded colours instead of tokens, theme-switch values that do not update. `audit.md` dimension 3.
- **Broken touch interaction**: custom sliders, drag surfaces and scrollable control strips whose gesture fails under touch, swallows page scroll or sticks after an interruption. `audit.md` dimension 4; `harden.md` Verify ("Interrupted gestures": a second finger mid-drag, scrolling across the control, releasing outside it, switching windows mid-drag, then dragging again), with the instruction to say what produced the gesture evidence.
- **Hardening cases**: names of 100+ characters, emoji in every text field, RTL (Arabic, Hebrew), CJK, network off and throttled, 1000+ items, submit clicked 10 times rapidly, forced API errors, all data removed. `harden.md` Verify "Verify Hardening". Related dimension list: `harden.md` "Hardening Dimensions".
- **Implementation integrity**: repeated shortcuts, design-system drift, decorative or misleading content, structure interchangeable with an unrelated product. `audit.md` dimension 5.
- **Agreement with the design system and the user's scope**, and a closing source diff that removes accidental churn, orphaned code and temporary artifacts. `polish.md` § 5. Fix order when many defects are found: `polish.md` § 3 (broken or blocked tasks and misleading state first, then missing states, then flow and responsive drift, then visual and motion, then code and asset cleanup).
- **Native apps**: phone and tablet size classes in both orientations, supported OS versions, runtime warnings and dropped frames; screenshots from the Simulator or emulator, never a browser. `polish.md` § 5; `ios.md` and `android.md` "Verifying the build"; `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/audit.native.md`.
