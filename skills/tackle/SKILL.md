---
name: tackle
description: Vague multi-item doc continuation ("let's continue", "do the next steps") — read the doc via read-summary, then use judgment on what's actually buildable before starting; don't just ask which items they want. A specific ask, even against a doc, is read-summary's job, not this.
---

# Tackle

Read the doc via `read-summary`, then invoke `done` when finished. `quick-done` is the exception, not a coin-flip alternative: it captures docs and reviews nothing, so it only fits when what you built turned out small, single-domain, and isn't heading for `/ship` — built code that nobody has reviewed wants `done`. Judge that at the end, against the work done, not from how the request sounded.
