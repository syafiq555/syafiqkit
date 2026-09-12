---
name: root-cause-fix-vs-symptom-fix
description: A wrong measurement method documented as a fact can be corrected in its outputs (changelog, task docs) without correcting the file that prescribes the method — verify the prescription's OWN source, not just its citing sites
metadata:
  type: project
---

`skills/update-plugin/references/harness-constraints.md` prescribed `bytes ÷ 4` as the token-count method for the 5,000-token re-attach ceiling, created at commit 9f38506 (v1.205.0). The same bug — bytes/4 overstating tokens by 15-20%, manufacturing false ceiling breaches — was independently discovered and documented in CHANGELOG.md's 1.261.0 entry with correct tokenizer numbers, but that fix touched only the affected skills' reported figures, never `harness-constraints.md` itself. The wrong divisor stood for 66 minor versions in total (1.205.0 → 1.271.0), but the load-bearing figure is the **10 versions after it was already known to be wrong** (1.261.0 → 1.271.0): someone had disproved it, published the correct numbers, and the file went on prescribing it until session 2026-09-12 re-diagnosed the whole thing from scratch.

**Why:** This is the CLAUDE.md-documented failure mode "Correcting a premise does not correct rules citing it" recurring on the plugin's own measurement tooling, not just its prose rules. A correction that fixes the *reported numbers* (the symptom) reads as complete because the numbers are now right — but if the *method that produced them* still lives at its original citation point, it regenerates the same wrong numbers on the next skill that grows.

**How to apply:** When reviewing a fix to a wrong-measurement or wrong-fact bug, always ask: was the fix applied at the file that PRESCRIBES the method/fact, or only at the files that CITE/report it? Grep for the specific broken value (`bytes ÷ 4`, `bytes/4`) across the whole corpus, including CHANGELOG history, before accepting a fix as durable — a changelog entry documenting the same bug at an earlier version number is evidence the fix path has failed silently once already. See also [[unhobble-drops-standing-rule-pointer]] for the sibling failure (rewrite drops the pointer to shared machinery).
