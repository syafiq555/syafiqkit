# Prose-vs-Value Split — Within-Row Content-Type Lever

An alternative to Restructuring #7's whole-row move. #7 moves entire rows by frequency (low-frequency rows out, high-frequency rows stay). This lever instead splits a SINGLE row/paragraph by content type, when the row is high-frequency as a whole but has a low-reasoning tail.

## When this applies

A row/rule has two parts with different shapes:
- A judgement call ("should I do X, and why") — answerable by reasoning, no lookup needed
- A literal value attached to it (an exact IP, command, ID, or credential) — answerable only by lookup, no reasoning applies

Test: if the correct answer to the scenario is "it depends, reason about it" → the content is judgement. If the correct answer is "the answer is this specific string" → the content is a value. A single row can contain both — the reasoning belongs inline (it's read every time), the value belongs in a companion (it's looked up, not reasoned about).

## The technique

1. Rewrite the row as prose stating the judgement/principle, ending in a `📖 <companion-path> {#anchor}` pointer.
2. Move the exact value(s) — verbatim, unrounded, unparaphrased — to the companion under that anchor, as a table row or short list.
3. The companion entry should be self-sufficient: someone opening only the companion, with no memory of the prose, must be able to act on it.

This differs from a plain condensing pass: a normal compress pass shortens a row's wording. This lever changes the row's *form* (table → prose) while relocating, not deleting, everything the table format was carrying.

## The failure mode this guards against

Converting a value-bearing row to prose is where information silently leaks out, because a value is usually a short trailing clause, not a rule of its own — the sentence reads complete without it. Two concrete ways this happens:

- The value gets softened into a vague gesture ("can fail in confusing ways") instead of being routed to the companion verbatim (the specific error code, command, or consequence).
- A cross-reference pointer, a "this already happened" precedent example, or an exact command gets cut as connective tissue during the same pass that converts the surrounding sentence — it looks like padding because it's short, but it was load-bearing.

Verify per `_shared/references/two-tier-condense.md` item 7 after this split — specifically confirm every value the original row carried is findable, verbatim, at the pointer target.

## Not a mandate

This is one lever among several (see the choosing-a-lever table in `structural-splits.md`), not a default every condense run should apply. Most rows have no separable value component and stay as a normal table row or a normal compressed prose sentence. Reach for this only when a row visibly mixes "reason about this" with "look this up."
