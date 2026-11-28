# CSS Transform Mastery

### translateY with percentages

Percentages in `translate()` are relative to the element's own size, so `translateY(100%)` moves an element by its own height whatever its dimensions. Sonner positions toasts this way, and Vaul hides the drawer this way before animating in.

```css
/* Works regardless of drawer height */
.drawer-hidden {
  transform: translateY(100%);
}

/* Works regardless of toast height */
.toast-enter {
  transform: translateY(-100%);
}
```

Prefer percentages to hardcoded pixels: less error-prone, and they adapt to content.

### scale() scales children too

Unlike `width`/`height`, `scale()` also scales children: on a button press, font size, icons and content scale proportionally. This is a feature, not a bug.

### 3D transforms for depth

`rotateX()` and `rotateY()` with `transform-style: preserve-3d` create real 3D effects. Orbits, coin flips and depth work without JavaScript.

```css
.wrapper {
  transform-style: preserve-3d;
}

@keyframes orbit {
  from {
    transform: translate(-50%, -50%) rotateY(0deg) translateZ(72px) rotateY(360deg);
  }
  to {
    transform: translate(-50%, -50%) rotateY(360deg) translateZ(72px) rotateY(0deg);
  }
}
```

### transform-origin

Transforms run from the element's anchor point, which defaults to center. Set it to where the trigger lives for origin-aware interactions.
