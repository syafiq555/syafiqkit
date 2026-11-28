# Debugging Animations

### Slow motion testing

Play animations at reduced speed to spot issues invisible at full speed: temporarily set duration to 2-5x normal, or slow playback in the browser DevTools animation inspector.

Things to look for in slow motion:

- Do colors transition smoothly, or do you see two distinct states overlapping?
- Does the easing feel right, or does it start/stop abruptly?
- Is the transform-origin correct, or does the element scale from the wrong point?
- Are multiple animated properties (opacity, transform, color) in sync?

### Frame-by-frame inspection

Step through frame by frame in Chrome DevTools' Animations panel to see timing gaps between coordinated properties.

### Test on real devices

For touch (drawers, swipe gestures), test on a physical device: connect the phone via USB, open the local dev server by IP and use Safari's remote devtools. The Xcode Simulator is an alternative, but real hardware is better for gestures.
