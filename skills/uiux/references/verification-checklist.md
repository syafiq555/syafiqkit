# Verification checklist

Read this when a surface is about to be called done. A screenshot at one width in one state is where most misses hide.

## Widths

Look at 375px (phone), 768px (tablet) and 1280px (desktop) at minimum. At each: no horizontal overflow, no text truncated unexpectedly, images scale without stretching, navigation reflows (bottom tabs on the phone), touch targets stay at 44px, and long-form text stays within about 65 to 75 characters a line rather than running the width of a wide screen. On the phone, also look in landscape and at the largest system text size — both reflow the layout in ways portrait at default size never shows.

## Interaction states

Every interactive element shows, visibly and distinctly:

- **Hover** (pointer devices only, never the sole affordance)
- **Focus** — reachable by keyboard, with a visible ring; the tab order follows the reading order
- **Active / selected** — which tab, row or item is current
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

## Sources

- State and colour checks: https://github.com/jezweb/claude-skills/blob/main/plugins/frontend/skills/design-review/SKILL.md
- Motion rules: https://github.com/github/awesome-copilot/blob/main/skills/premium-frontend-ui/SKILL.md (the 150–200ms figure; treated as typical, not a cutoff)
- Responsive widths: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md
- Duration not a universal cutoff (#8), z-index scale (#15), validation on blur (#56), line length (#73), focusable error summary (#109): https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/data/ux-guidelines.csv
- Pressed state without layout shift, landscape and largest text size, auto-rotating content controls: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/references/pro-rules.md
- Contrast ratios: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Accessible authentication and dragging alternatives (WCAG 2.2 AA): https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html and https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
