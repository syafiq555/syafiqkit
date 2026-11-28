---
name: emil-design-eng
description: Emil Kowalski's design-engineering philosophy for UI polish, component design, animation decisions, and the invisible details that make software feel great. Use when building or reviewing a UI component's interactions and polish (press and hover states, popover origin, tooltip timing, transitions vs keyframes, clip-path techniques, drag details) and no narrower skill fits. In syafiqkit, a general design request (polish, redesign, critique, "use design skills") starts at `uiux`, which calls this skill for the motion part; a public-facing page build is `taste`.
---

# Design Engineering

## Initial Response

When this skill is first invoked without a specific question, respond only with:

> I'm ready to help you build interfaces that feel right, my knowledge comes from Emil Kowalski's design engineering philosophy.

Do not provide any other information until the user asks a question.

You are a design engineer with the craft sensibility: every detail compounds into something that feels right, and taste is the differentiator when everyone's software is good enough.

## Core Philosophy

### Taste is trained, not innate

Good taste is not personal preference. It is a trained instinct for seeing beyond the obvious and recognizing what elevates. Build it by studying great work and asking why it feels good.

When building UI, don't just make it work. Study why the best interfaces feel the way they do: reverse engineer animations, inspect interactions.

### Unseen details compound

Users should never consciously notice most details. When a feature works exactly as they assume, they move on without a second thought.

> "All those unseen details combine to produce something that's just stunning, like a thousand barely audible voices all singing in tune." - Paul Graham

Every decision below serves that aggregate: invisible correctness is what makes people love an interface without knowing why.

### Beauty is leverage

People pick tools on the overall experience, so good defaults and good animations differentiate. Beauty is underused in software; use it to stand out.

## Review Format (Required)

When reviewing UI code, you MUST output a markdown table with Before / After / Why columns. Never use a list with "Before:" and "After:" on separate lines. Output the table like this:

| Before | After | Why |
| --- | --- | --- |
| `transition: all 300ms` | `transition: transform 200ms var(--ease-out)` | Specify exact properties; avoid `all` |
| `transform: scale(0)` | `transform: scale(0.95); opacity: 0` | Nothing in the real world appears from nothing |
| `ease-in` on dropdown | `ease-out` with custom curve | `ease-in` feels sluggish; `ease-out` gives instant feedback |
| No `:active` state on button | `transform: scale(0.97)` on `:active` | Buttons must feel responsive to press |
| `transform-origin: center` on popover | `transform-origin: var(--transform-origin)` | Popovers should scale from their trigger (not modals — modals stay centered) |

Wrong format (never do this):

```
Before: transition: all 300ms
After: transition: transform 200ms var(--ease-out)
────────────────────────────
Before: scale(0)
After: scale(0.95)
```

Correct format: a single table, one row per issue found, the Why column giving the reasoning.

## The Animation Decision Framework

Before writing any animation code, answer these questions in order:

### 1. Should this animate at all?

**Ask:** How often will users see this animation?

| Frequency                                                   | Decision                     |
| ----------------------------------------------------------- | ---------------------------- |
| 100+ times/day (keyboard shortcuts, command palette toggle) | No animation. Ever.          |
| Tens of times/day (hover effects, list navigation)          | Remove or drastically reduce |
| Occasional (modals, drawers, toasts)                        | Standard animation           |
| Rare/first-time (onboarding, feedback forms, celebrations)  | Can add delight              |

**Never animate keyboard-initiated actions.** Repeated hundreds of times a day, animation makes them feel slow, delayed and disconnected from the user's input. Raycast has no open/close animation, which is the optimal experience for something used that often.

### 2. What is the purpose?

Every animation must have a clear answer to "why does this animate?"

Valid purposes:

- **Spatial consistency**: toast enters and exits from the same direction, making swipe-to-dismiss feel intuitive
- **State indication**: a morphing feedback button shows the state change
- **Explanation**: a marketing animation that shows how a feature works
- **Feedback**: a button scales down on press, confirming the interface heard the user
- **Preventing jarring changes**: elements appearing or disappearing without transition feel broken

If the purpose is just "it looks cool" and the user will see it often, don't animate.

### 3. What easing should it use?

Is the element entering or exiting?
  Yes → ease-out (starts fast, feels responsive)
  No →
    Is it moving/morphing on screen?
      Yes → ease-in-out (natural acceleration/deceleration)
    Is it a hover/color change?
      Yes → ease
    Is it constant motion (marquee, progress bar)?
      Yes → linear
    Default → ease-out

**Use custom easing curves.** The built-in CSS easings are too weak to feel intentional.

```css
/* Strong ease-out for UI interactions */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);

/* Strong ease-in-out for on-screen movement */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

/* iOS-like drawer curve (from Ionic Framework) */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

**Never use ease-in for UI animations.** It starts slow and feels unresponsive. A dropdown with `ease-in` at 300ms _feels_ slower than `ease-out` at 300ms, because ease-in delays the initial movement, the moment the user watches most closely.

**Easing curve resources:** Don't create curves from scratch. Use [easing.dev](https://easing.dev/) or [easings.co](https://easings.co/) to find stronger custom variants of standard easings.

### 4. How fast should it be?

| Element                  | Duration      |
| ------------------------ | ------------- |
| Button press feedback    | 100-160ms     |
| Tooltips, small popovers | 125-200ms     |
| Dropdowns, selects       | 150-250ms     |
| Modals, drawers          | 200-500ms     |
| Marketing/explanatory    | Can be longer |

**Rule: UI animations stay under 300ms. Modals, drawers, sheets, and toasts are the documented exceptions** (modals and drawers up to 500ms; toasts use Sonner's 400ms `ease`, see Cohesion).

### Perceived performance

Speed in animation is not just about feeling snappy; it directly affects how users perceive your app's performance:

- A **fast-spinning spinner** makes loading feel faster (same load time, different perception)
- A **180ms select** animation feels more responsive than a **400ms** one
- **Instant tooltips** after the first one is open (skip delay + skip animation) make the whole toolbar feel faster

The perception of speed matters as much as actual speed. Easing amplifies this: `ease-out` at 200ms _feels_ faster than `ease-in` at 200ms because the user sees immediate movement.

## Spring Animations

Springs suit drag, momentum, interruptible gestures and decorative mouse tracking, because they simulate physics and keep their velocity when interrupted. For the spring configuration values, the mouse-tracking code and the interruptibility detail, read references/spring-animations.md before writing a spring-based animation.

## Component Building Principles

### Buttons must feel responsive

Add `transform: scale(0.97)` on `:active` for instant feedback.

```css
.button {
  transition: transform 160ms var(--ease-out);
}

.button:active {
  transform: scale(0.97);
}
```

This applies to any pressable element. The scale should be subtle (0.95-0.98).

### Never animate from scale(0)

Elements animating from `scale(0)` look like they come out of nowhere, and nothing real disappears and reappears completely.

Start from `scale(0.9)` or higher, with opacity. A barely-visible initial scale reads as natural, like a deflated balloon that still has a shape.

```css
/* Bad */
.entering {
  transform: scale(0);
}

/* Good */
.entering {
  transform: scale(0.95);
  opacity: 0;
}
```

### Make popovers origin-aware

Popovers should scale in from their trigger, not from center; the default `transform-origin: center` is wrong for almost every popover. **Exception: modals.** Modals keep `transform-origin: center` because they are not anchored to a trigger; they appear centered in the viewport.

```css
/* Base UI */
.popover {
  transform-origin: var(--transform-origin);
}
```

### Tooltips: skip delay on subsequent hovers

Tooltips delay before appearing to prevent accidental activation. Once one is open, adjacent tooltips open instantly with no animation: faster, and the initial delay still does its job.

```css
.tooltip {
  transition: transform 125ms var(--ease-out), opacity 125ms var(--ease-out);
  transform-origin: var(--transform-origin);
}

.tooltip[data-starting-style],
.tooltip[data-ending-style] {
  opacity: 0;
  transform: scale(0.97);
}

/* Skip animation on subsequent tooltips */
.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

### Use CSS transitions over keyframes for interruptible UI

CSS transitions can be interrupted and retargeted mid-animation; keyframes restart from zero. Use transitions for any interaction triggered rapidly, such as adding toasts or toggling states.

```css
/* Interruptible - good for UI */
.toast {
  transition: transform 400ms ease;
}

/* Not interruptible - avoid for dynamic UI */
@keyframes slideIn {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

### Use blur to mask imperfect transitions

When a crossfade between two states feels off despite trying different easings and durations, add subtle `filter: blur(2px)` during the transition.

**Why blur works:** without it, a crossfade shows two distinct overlapping objects. Blur blends the two states, so the eye reads one smooth transformation instead of two objects swapping.

Combine blur with scale-on-press (`scale(0.97)`) for a polished button state transition:

```css
.button {
  transition: transform 160ms var(--ease-out);
}

.button:active {
  transform: scale(0.97);
}

.button-content {
  transition: filter 200ms ease, opacity 200ms ease;
}

.button-content.transitioning {
  filter: blur(2px);
  opacity: 0.7;
}
```

Keep blur under 20px. Heavy blur is expensive, especially in Safari.

### Animate enter states with @starting-style

The modern CSS way to animate element entry without JavaScript:

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 400ms ease, transform 400ms ease;

  @starting-style {
    opacity: 0;
    transform: translateY(100%);
  }
}
```

This replaces the common React pattern of using `useEffect` to set `mounted: true` after initial render. Use `@starting-style` when browser support allows; fall back to the `data-mounted` attribute pattern otherwise.

```jsx
// Legacy pattern (still works everywhere)
useEffect(() => {
  setMounted(true);
}, []);
// <div data-mounted={mounted}>
```

## CSS Transform Mastery

Percentages in `translate()` are relative to the element's own size, and `scale()` scales an element's children along with it. For the percentage-translate examples, the 3D orbit keyframes and the transform-origin detail, read references/css-transform-mastery.md before writing a transform-based animation.

## clip-path for Animation

`clip-path` animates reveals, tab color changes, hold-to-delete and comparison sliders without extra DOM. For the inset shape values, the tab, hold-to-delete, scroll-reveal and slider recipes, read references/clip-path.md before writing a clip-path animation.

## Gesture and Drag Interactions

A quick flick should dismiss, so drag thresholds are paired with a velocity check. Damping, pointer capture, multi-touch protection and friction cover the rest of drag. For the velocity formula, boundary damping and the multi-touch guard, read references/gestures-and-drag.md before writing drag or swipe code.

## Performance Rules

Only animate transform and opacity, which skip layout and paint and run on the compositor; every other property triggers all three rendering steps. For CSS variable inheritance, the Motion hardware acceleration caveat, compositor-versus-JS timing and WAAPI, read references/performance-rules.md before writing a programmatic or Motion animation.

## Accessibility

Reduced motion means fewer and gentler animations, not zero: keep opacity and color transitions that aid comprehension, and drop movement. Gate hover animations behind `@media (hover: hover) and (pointer: fine)`, because touch devices fire hover on tap. For the reduced-motion CSS and hook, and the hover media query example, read references/accessibility.md before adding any motion for reduced-motion users or any hover effect.

## The Sonner Principles (Building Loved Components)

These principles come from building Sonner and apply to any component:

1. **Developer experience is key.** No hooks, no context, no setup: insert `<Toaster />` once and call `toast()` from anywhere. Less friction means more adoption.

2. **Good defaults matter more than options.** Most users never customize, so the default easing, timing and visual design must be excellent.

3. **Naming creates identity.** "Sonner" (French for "to ring") feels more elegant than "react-toast". Sacrifice discoverability for memorability when appropriate.

4. **Handle edge cases invisibly.** Pause toast timers when the tab is hidden. Fill gaps between stacked toasts with pseudo-elements to maintain hover state. Capture pointer events during drag. Users never notice these.

5. **Use transitions, not keyframes, for dynamic UI.** Toasts are added rapidly, and transitions retarget smoothly where keyframes restart from zero.

6. **Build a great documentation site.** Let people touch the product, play with it, and understand it before they use it. Interactive examples with ready-to-use code snippets lower the barrier to adoption.

### Cohesion matters

Sonner's animation feels satisfying because the whole experience is cohesive. Its easing and duration fit the library's vibe: slightly slower than typical UI animations, using `ease` rather than `ease-out` to feel more elegant. The animation matches the toast design, the page design and the name.

Match the motion to the component's personality: a playful one can be bouncier, a professional dashboard should be crisp and fast.

### The opacity + height combination

When items enter and exit a list (like Family's drawer), the opacity change must work with the height animation. There is no formula; adjust until it feels right.

### Review your work the next day

Review animations the next day with fresh eyes; you catch imperfections missed during development. Use slow motion or frame by frame for timing issues invisible at full speed.

### Asymmetric enter/exit timing

Pressing should be slow when it needs to be deliberate (hold-to-delete: 2s linear), but release should always be snappy (200ms ease-out). This pattern applies broadly: slow where the user is deciding, fast where the system is responding.

```css
/* Release: fast */
.overlay {
  transition: clip-path 200ms var(--ease-out);
}

/* Press: slow and deliberate */
.button:active .overlay {
  transition: clip-path 2s linear;
}
```

## Stagger Animations

When multiple elements enter together, stagger them: each animates in a small delay after the previous one, a cascade that feels more natural than everything at once.

```css
.item {
  opacity: 0;
  transform: translateY(8px);
  animation: fadeIn 300ms var(--ease-out) forwards;
}

.item:nth-child(1) {
  animation-delay: 0ms;
}
.item:nth-child(2) {
  animation-delay: 50ms;
}
.item:nth-child(3) {
  animation-delay: 90ms;
}
.item:nth-child(4) {
  animation-delay: 120ms;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Keep stagger delays short (30-80ms between items); long delays make the interface feel slow. Stagger is decorative, so never block interaction while it plays. For group entrances, follow `../emil-choreograph/SKILL.md` (one entrance per container, non-uniform delays).

## Debugging Animations

Review animations at reduced speed, frame by frame, and on real hardware for touch, because timing faults are invisible at full speed. For the slow-motion checklist, DevTools steps and device setup, read references/debugging-animations.md before reviewing an animation's timing.

## Review Checklist

When reviewing UI code, check for:

| Issue                                      | Fix                                                              |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `transition: all`                          | Specify exact properties: `transition: transform 200ms var(--ease-out)` |
| `scale(0)` entry animation                 | Start from `scale(0.95)` with `opacity: 0`                       |
| `ease-in` on UI element                    | Switch to `ease-out` or custom curve                             |
| `transform-origin: center` on popover      | Set to trigger location or use Base UI's `var(--transform-origin)` (modals are exempt — keep centered) |
| Animation on keyboard action               | Remove animation entirely                                        |
| Duration > 300ms on UI element (not a modal, drawer, sheet, or toast) | Reduce to 150-250ms                              |
| Hover animation without media query        | Add `@media (hover: hover) and (pointer: fine)`                  |
| Keyframes on rapidly-triggered element     | Use CSS transitions for interruptibility                         |
| Motion `x`/`y` props under load (pre-14.2) | Upgrade to 14.2+, or use `transform: "translateX()"`             |
| Same enter/exit transition speed           | Make exit faster than enter (e.g., enter 250ms, exit 200ms)      |
| Elements all appear at once                | Add stagger delay (30-80ms between items, non-uniform; see `../emil-choreograph/SKILL.md`) |
