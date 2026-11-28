# Spring Animations

Springs feel more natural than duration-based animations because they simulate physics: no fixed duration, they settle by physical parameters.

### When to use springs

- Drag interactions with momentum
- Elements that should feel "alive" (like Apple's Dynamic Island)
- Gestures that can be interrupted mid-animation
- Decorative mouse-tracking interactions

### Spring-based mouse interactions

Tying visual changes directly to mouse position feels artificial because it lacks motion. Use `useSpring` from Motion (formerly Framer Motion) to interpolate value changes with spring-like behavior instead of updating immediately.

```jsx
import { useSpring, useTransform } from 'motion/react';

// mouseX is a motion value (useMotionValue), updated on pointermove

// Without spring: feels artificial, instant
const rotation = useTransform(mouseX, (x) => x * 0.1);

// With spring: feels natural, has momentum
const springRotation = useSpring(rotation, {
  stiffness: 100,
  damping: 10,
});
```

This works because the animation is **decorative**, serving no function. In a functional graph in a banking app, no animation would be better. Know when decoration helps and when it hinders.

### Spring configuration

**Apple's approach (recommended, easier to reason about):**

```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
```

**Traditional physics (more control):**

```js
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

Keep bounce subtle (0.1-0.3) when used. Avoid bounce in most UI contexts. Use it for drag-to-dismiss and playful interactions.

### Interruptibility advantage

Springs keep velocity when interrupted; CSS animations and keyframes restart from zero. That makes springs ideal for gestures users might change mid-motion: click an expanded item, quickly press Escape, and a spring reverses smoothly from its current position.
