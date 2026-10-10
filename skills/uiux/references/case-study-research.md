# Researching how real products solve a UI pattern

Used when the user asks for case studies, benchmarks or "how do other apps do this". The research runs through `syafiqkit:haiku`; this file is the brief and what to expect back.

## The brief

Start from the situation, in a sentence: what repeats, what qualifies for two places, what the reader hunts for. Then name products and components where that exact situation occurs (an item both pinned and in a normal list, a group label repeated per row), not a category of products. A non-terminal product is a fair source for a terminal surface when the pattern doesn't depend on the medium.

Split by source kind, one haiku per kind, so the two never fetch the same pages:

1. **Products whose behaviour is stated in words**: release notes, changelogs, help pages that say what happens (moves out of the list, shows in both). Pick the products the user's market actually uses.
2. **Component libraries and research bodies**: a component's demos, markup and props (`defaultExpanded`, a group-header slot) show collapse defaults and where a row flag sits; Baymard, Nielsen Norman Group and W3C/WCAG give numbers.

Ask both for the same cells, so the answers compare, and derive the cells from the situation. For a line-item row they were: (a) how an optional secondary field is revealed, (b) how a per-row binary flag is chosen (toggle, chip, menu), (c) where the destructive action sits, (d) how repeated rows stay distinguishable, (e) stated tap-target sizes. For a grouped list they would be: does an item repeat across sections or sit once with a flag, header versus per-row scope, inline flag versus warning section, collapse default. Put the pattern's real shape in the prompt (which fields, what is on which line today) and say what the user finds wrong with it.

Evidence rules go in the prompt, per `haiku`'s research guidance: a fetched URL per claim, `COULD NOT RETRIEVE` lines, training-data claims labelled, which URLs came from a search versus guessed, and no quotes that were not read on the page.

## What comes back, and what to check

Measured 2026-10-03 on a mobile line-item row (name, amount, note, per-row tax tag, remove):

- **Product docs describe how to use a feature, almost never how the row is laid out.** Six products returned functional steps and no layout. What survived verification was hard numbers (WCAG 2.2 target size: 24 by 24 CSS px at AA, 44 by 44 at AAA, on `target-size-minimum.html` and `target-size-enhanced.html`; NN/g: 1 cm by 1 cm, `articles/touch-target-size/`) and one named interaction (Stripe's invoice editor puts tax rate, coupon and supply date behind a per-item "Item options" control).
- **A guessed URL's 404 was reported as "paywalled" or "does not exist".** Four research-body pages the agent called 404 or gated (NN/g, W3C, Material, Baymard) all returned 200 at the correct path. Retest every reported failure with a browser User-Agent before repeating a negative, and look up the real path from the site's own navigation.
- **Client-rendered pages (Material, Apple HIG) return only a title to a plain fetch.** That makes the page unverifiable, not empty. Say so rather than citing or dismissing it.
- **A claim attributed to a real page may not be on it.** A "stacked rows on mobile" claim was not on the forum post it cited, and a swipe-to-delete claim sat behind a 403. Open the page and find the sentence; a resolving URL grades the page, not the claim.
- **A quote from a real page may be about a different subject.** An article on form-level Cancel and Back buttons was offered as guidance for per-row delete. Check what the passage is about before it supports a recommendation.
- **A report that is mostly "not stated" is a bad brief, not a finding.** Measured 2026-10-10 on a grouped document list: round one (named products and design systems) returned 15 of 18 product cells empty; terminal tools and component pages did the same, because help pages describe use and the component pages that carry the answer were not named. Only release notes and component props gave verifiable lines. Re-brief once at a different source kind before relaying.

## Reporting

Give the user the evidence and the judgement as two separate things. Hard numbers and named patterns carry a URL; the layout recommendation is yours, built on those and on any design source the user supplied (a reel's principles, a screenshot, a Figma frame), and it is labelled that way. Thin research is a finding to report, not a gap to fill with "best practice".
