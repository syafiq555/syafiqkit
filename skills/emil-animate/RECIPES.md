# Animation Recipes

Ready-to-build implementations for the cases that come up most. Start from the recipe, then adapt — don't rebuild from scratch.

Curves are the `--ease-out`, `--ease-in-out`, and `--ease-drawer` tokens defined in SKILL.md.

---

## Button press

Any pressable element. Instant feedback that the interface heard the user.

```css
.button {
  transition: transform 160ms var(--ease-out);
}

.button:active {
  transform: scale(0.97);
}
```

`scale()` scales children too — the label and icons come along, which is what makes it read as a physical press.

No hover gating needed here: `:active` is a real press on touch. Gate any `:hover` styling separately.

---

## Dropdown, popover, menu, select

Scales out of its trigger, not out of thin air.

```css
.popover {
  transform-origin: var(--transform-origin); /* Base UI supplies this */
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out);
}

.popover[data-starting-style],
.popover[data-ending-style] {
  opacity: 0;
  transform: scale(0.95);
}
```

The `transform-origin` is the whole point — the panel should look like it came out of the thing you clicked.

---

## Tooltip

Same shape as a popover, faster, plus the detail most implementations miss.

```css
.tooltip {
  transform-origin: var(--transform-origin);
  transition:
    transform 125ms var(--ease-out),
    opacity 125ms var(--ease-out);
}

.tooltip[data-starting-style],
.tooltip[data-ending-style] {
  opacity: 0;
  transform: scale(0.97);
}

/* Once one tooltip is open, neighbours open instantly */
.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

The initial delay prevents accidental activation. After that, skipping both the delay and the animation makes the whole toolbar feel faster.

---

## Modal

The one popover that stays centered.

```css
.modal {
  transform-origin: center; /* exempt — not anchored to a trigger */
  transition:
    opacity 250ms var(--ease-out),
    transform 250ms var(--ease-out);
}

.modal[data-starting-style],
.modal[data-ending-style] {
  opacity: 0;
  transform: scale(0.96);
}

.backdrop {
  transition: opacity 250ms var(--ease-out);
}
```

Animate the backdrop's opacity alongside it so they read as one surface.

---

## Drawer / sheet

```css
.drawer {
  transform: translateY(0);
  transition: transform 500ms var(--ease-drawer);
}

.drawer[data-closed] {
  transform: translateY(100%);
}
```

This is how Vaul hides a drawer before animating it in.

Add drag and it becomes a gesture problem — see **Drag to dismiss** below.

---

## Toast

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 400ms ease,
    transform 400ms ease;

  @starting-style {
    opacity: 0;
    transform: translateY(100%);
  }
}
```

- `ease` rather than `ease-out`, slightly slower than typical UI: Sonner reads as elegant partly because its motion is tuned to the component's personality rather than to the generic UI budget.
- If `@starting-style` isn't available, fall back to the mount flag:

```jsx
useEffect(() => { setMounted(true); }, []);
// <div data-mounted={mounted}>
```

When toasts stack and the list reflows, the opacity change has to work against the height change. There's no formula for that pair — adjust until it feels right, then check it again the next day.

---

## Accordion / collapse

```css
.content {
  overflow: hidden;
  transition:
    height 200ms var(--ease-out),
    opacity 200ms var(--ease-out);
}
```

To animate to `height: auto` in CSS, opt in to intrinsic-size interpolation, gated so other browsers never see it:

```css
.content {
  height: 0;
  overflow: hidden;
  transition: height 200ms var(--ease-out);
}

@supports (interpolate-size: allow-keywords) {
  :root {
    interpolate-size: allow-keywords;
  }

  .content.open {
    height: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .content {
    transition: none;
  }
}
```

This block replaces the first one when you take the CSS route. Fallback for browsers without it (the `@supports` block above is skipped there, so JS drives the heights):

```js
const cssAuto = CSS.supports('interpolate-size', 'allow-keywords');
const still = matchMedia('(prefers-reduced-motion: reduce)');

function setOpen(el, open) {
  el.classList.toggle('open', open);
  if (cssAuto) return;
  if (still.matches) {
    el.style.height = open ? 'auto' : '0';
    return;
  }
  if (open) {
    el.style.height = `${el.scrollHeight}px`;
    const settle = (e) => {
      if (e.target !== el || e.propertyName !== 'height') return;
      el.removeEventListener('transitionend', settle);
      if (el.classList.contains('open')) el.style.height = 'auto';
    };
    el.addEventListener('transitionend', settle);
  } else {
    el.style.height = getComputedStyle(el).height;
    el.offsetHeight;
    el.style.height = '0';
  }
}

if (!cssAuto) {
  document.querySelectorAll('.content.open').forEach((el) => { el.style.height = 'auto'; });
}
```

- MDN calls `interpolate-size` the preferred route and says to use `height: calc-size(auto, size)` only when the animation also needs a calculation (`calc-size(auto, size + 8px)`). Both live at https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size and https://developer.mozilla.org/en-US/docs/Web/CSS/calc-size.
- Support, from MDN's browser-compat-data read on 27/11/2026 (https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/interpolate-size.json): Chrome 129, Edge the same (mirrors Chrome), Firefox not supported (bug 1945962), Safari preview only (WebKit bug 295132), flagged experimental. Where it is missing, `height: auto` snaps with no animation, hence the `@supports` gate and the snippet above.
- `interpolate-size` inherits, so on `:root` it makes every `auto` size animatable on the page; MDN notes sites in the wild assume intrinsic sizes cannot be animated. Set it on `.content` instead when that matters.

Keep it short: this is one of the few animations that costs layout on every frame, so a long duration is expensive as well as sluggish. Where neither route fits, use a headless primitive that supplies the measured height.

---

## Stagger a group entrance

For a list or grid the user sees occasionally — not for a list they scroll past all day. For group entrances, follow `../emil-choreograph/SKILL.md` (one entrance per container, non-uniform delays).

```css
.item {
  opacity: 0;
  transform: translateY(8px);
  animation: fadeIn 300ms var(--ease-out) forwards;
}

.item:nth-child(2) { animation-delay: 50ms; }
.item:nth-child(3) { animation-delay: 90ms; }
.item:nth-child(4) { animation-delay: 120ms; }

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Stagger is decorative — it must never block interaction while it plays.

---

## Hold to confirm

For destructive actions where a plain click is too easy to fire by accident.

```css
.overlay {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms var(--ease-out); /* release: snappy */
}

.button:active .overlay {
  clip-path: inset(0 0 0 0);
  transition: clip-path 2s linear;             /* press: slow and deliberate */
}

.button:active {
  transform: scale(0.97);
}
```

`linear` is correct here — the fill is a progress indicator, and progress shouldn't ease.

---

## Tab indicator with a color transition

Timing individual color transitions across a tab list never quite lands. Clip instead.

Duplicate the tab list. Style the copy as the active state — different background, different text color. Clip the copy so only the active tab shows, and animate the clip on change:

```css
.tabs-active-copy {
  clip-path: inset(0 60% 0 20%); /* driven by the active tab's position */
  transition: clip-path 250ms var(--ease-in-out);
}
```

The text and background change together, in perfect sync, because they're one element being revealed rather than two colors being interpolated.

---

## Scroll reveal

Marketing surfaces only. Don't do this to functional UI a user visits daily.

```css
.reveal {
  clip-path: inset(0 0 100% 0);
  transition: clip-path 600ms var(--ease-in-out);
}

.reveal[data-visible] {
  clip-path: inset(0 0 0 0);
}
```

Trigger with `IntersectionObserver`, or Motion's `useInView` with `{ once: true, margin: "-100px" }`. Fire it once — re-animating on every scroll-by is an interface fighting its reader.

---

## Drag to dismiss

The gesture recipe. Springs, not durations, because the user can reverse mid-motion.

```js
// Dismiss on a flick, not just on distance
const timeTaken = Date.now() - dragStartTime.current;
const velocity = Math.abs(swipeAmount) / timeTaken;

if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
  dismiss();
}
```

```js
// Set transform on the dragged element directly.
// Driving it through a CSS variable on the parent recalcs styles for every child.
element.style.transform = `translateY(${distance}px)`;
```

Four details that separate a good drag from a bad one:

- **Pointer capture** once the drag starts, so it continues when the pointer leaves the element's bounds.
- **Multi-touch protection** — `if (isDragging) return` on new touch points, or switching fingers mid-drag makes the element jump.
- **Damping past boundaries** — dragging beyond a natural edge moves the element less the further it goes. Real things slow before they stop.
- **Friction, not a wall** — allow the over-drag with rising resistance rather than refusing it.

Settle with a spring so an interrupted drag keeps its velocity:

```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
```

---

## Masking a crossfade that won't settle

When two states overlap visibly during a transition and no amount of easing or duration tuning fixes it, blur the seam:

```css
.content {
  transition:
    filter 200ms ease,
    opacity 200ms ease;
}

.content.transitioning {
  filter: blur(2px);
  opacity: 0.7;
}
```

Without blur the eye reads two distinct objects swapping. Blur blends them into one perceived transformation. Keep it under 20px — heavy blur is expensive, especially in Safari.

---

## Shake on a refused submit

When the server refuses a submit (wrong password, wrong code), shake the field or form once, beside the error text.

```css
@keyframes refuse {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
}

.refused {
  animation: refuse 300ms var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .refused { animation: none; }
}
```

Add `.refused` when the refusal arrives and remove it on `animationend`, so the next refusal replays it; remounting the form to restart it wipes what the user typed.

- **Never the only signal.** NN/g: "never use exclusively color or animation to indicate errors", and an error message "must contain copy" (https://www.nngroup.com/articles/error-message-guidelines/). Show the text message and the error colour every time; move focus to the field.
- **Once per refusal, not per keystroke.** The same NN/g page calls errors shown before the user has answered "a hostile pattern".
- **Reduced motion:** no shake, and the message and colour still show. WCAG 2.3.3: "Motion animation triggered by interaction can be disabled, unless the animation is essential" (https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).
- **The numbers are craft judgement, not sourced.** Neither NN/g, WCAG, Apple's HIG nor Material states an amplitude or duration for a shake. The 6px start, the decay to 2px and 300ms are a starting point inside NN/g's general 100-500ms range for animations (https://www.nngroup.com/articles/animation-duration/); play it at 2-5x duration and tune by eye.

---

## Theme switch without a colour flash

Toggling light/dark makes every element's colour transition fire at once, which looks glitchy. Turn transitions off for the switch, force a style flush, then restore them. With next-themes, pass `disableTransitionOnChange` to `ThemeProvider`; its README describes it as disabling "all CSS transitions before the theme is changed", re-enabled "immediately afterwards" (https://github.com/pacocoursey/next-themes/blob/main/next-themes/README.md). Without it:

```js
const css = document.createElement('style');
css.appendChild(document.createTextNode('*, *::before, *::after { transition: none !important; }'));
document.head.appendChild(css);

document.documentElement.classList.toggle('dark');

window.getComputedStyle(css).opacity;
document.head.removeChild(css);
```

The selector covers `::before` and `::after` as next-themes' own does, since an underline or badge drawn by a pseudo-element otherwise still fades; on a site with a Content Security Policy, give the style element the page's nonce. Read `getComputedStyle` before removing the style element: the author of next-themes found that waiting a `requestAnimationFrame` "seemed to work at first, but it was unreliable and elements still transitioned", while `getComputedStyle` "works reliably on every major browser" (https://paco.me/writing/disable-theme-transitions). Keep per-component hover and press transitions as they are; this suppresses them only for the switch frame.

---

## Programmatic, without a library

When the motion needs JS control but not a dependency, WAAPI gives you CSS-grade performance:

```js
element.animate(
  [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
  { duration: 1000, fill: 'forwards', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }
);
```

Hardware-accelerated, interruptible, no bundle cost.
