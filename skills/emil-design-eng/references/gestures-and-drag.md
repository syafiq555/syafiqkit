# Gesture and Drag Interactions

### Momentum-based dismissal

Don't rely on distance alone. Velocity is `Math.abs(dragDistance) / elapsedTime`; above ~0.11, dismiss regardless of distance. A quick flick should be enough.

```js
const timeTaken = new Date().getTime() - dragStartTime.current.getTime();
const velocity = Math.abs(swipeAmount) / timeTaken;

if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
  dismiss();
}
```

### Damping at boundaries

Past a natural boundary (e.g., a drawer dragged up when already at top), apply damping: the more the user drags, the less the element moves. Real things slow down before they stop.

### Pointer capture for drag

Once dragging starts, capture all pointer events so the drag continues when the pointer leaves the element bounds.

### Multi-touch protection

Ignore additional touch points after the initial drag begins. Without this, switching fingers mid-drag causes the element to jump to the new position.

```js
function onPress() {
  if (isDragging) return;
  // Start drag...
}
```

### Friction instead of hard stops

Allow the drag with increasing friction rather than preventing it entirely; it feels more natural than an invisible wall.
