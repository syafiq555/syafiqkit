---
name: single-metric-split-checks
description: When a skill replaces one score with several, check the stop rule, report line, denominator and unattended path together
metadata:
  type: feedback
---

When a skill replaces a single metric with several (score-loop 1.464.3 dropped the mean of two judges), the stop rule, the round report line, the scale the user named and the unattended `/goal` path were all written against the old single number. None of them fails visibly.

**Why:** the 21/11/2026 review found all four unanswered in one pass; the user then had to choose which score ends the loop.
**How to apply:** on any metric-splitting change, check those four places in the same review before calling the change complete.
