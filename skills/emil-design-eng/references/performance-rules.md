# Performance Rules

### Only animate transform and opacity

`transform` and `opacity` run on the GPU. Animating `padding`, `margin`, `height` or `width` triggers all three rendering steps.

### CSS variables are inheritable

Changing a CSS variable on a parent recalculates styles for all children; in a drawer with many items, updating `--swipe-amount` on the container is expensive. Update `transform` on the element instead.

```js
// Bad: triggers recalc on all children
element.style.setProperty('--swipe-amount', `${distance}px`);

// Good: only affects this element
element.style.transform = `translateY(${distance}px)`;
```

### Motion hardware acceleration caveat

From `motion` 14.2, Motion's shorthand properties (`x`, `y`, `scale`, `rotate`) are hardware-accelerated on HTML elements. Before 14.2 they use `requestAnimationFrame` on the main thread, so on those versions use the full `transform` string for hardware acceleration:

```jsx
// motion 14.2+: hardware accelerated. Before 14.2: main thread, drops frames under load
<motion.div animate={{ x: 100 }} />

// Hardware accelerated in every version (stays smooth even when main thread is busy)
<motion.div animate={{ transform: "translateX(100px)" }} />
```

Some Motion animations still run on the main thread in every version: layout animations (`layout`, `layoutId`), animations with `onUpdate` or `transformTemplate`, inertia (drag momentum), and values driven every frame by a motion value (drag, `useTransform`).

This matters when the browser is also loading content, running scripts or painting. At Vercel, the dashboard tab animation used Shared Layout Animations and dropped frames during page loads. Switching to CSS animations (on `transform`/`opacity`, they run on the compositor) fixed it.

### CSS animations beat JS under load

CSS animations of `transform` and `opacity` run off the main thread. Animations on `requestAnimationFrame` (including Motion layout animations) drop frames while the browser loads a page; CSS stays smooth. Use CSS for predetermined animations and JS for dynamic, interruptible ones.

### Use WAAPI for programmatic CSS animations

The Web Animations API gives you JavaScript control with CSS performance. Hardware-accelerated, interruptible, and no library needed.

```js
element.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
  duration: 1000,
  fill: 'forwards',
  easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
});
```
