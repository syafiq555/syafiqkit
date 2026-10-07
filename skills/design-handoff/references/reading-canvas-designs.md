# Reading a returned canvas design

A design-tool canvas usually reads as text in seconds, with no agent needed:

1. Unescape the HTML and drop the style and script blocks.
2. Keep component names and the copy.
3. Then read the script's data too, because state tables and list rows often live there, and the markup alone shows only template placeholders.

An agent's claim that something is **absent** is the one to check this way before it turns into build work. Measured 2026-09-30: an agent reported three confirm steps missing from a canvas. Two were there, drawn as dialogs.
