# Researching how real products solve a UI pattern

Used when the user asks for case studies, benchmarks or "how do other apps do this". The research runs through `syafiqkit:haiku`; this file is the brief and what to expect back.

## The brief

Split by source kind, one haiku per kind, so the two never fetch the same pages:

1. **Named products' own pages**: help centres, docs, changelogs, blog posts (invoicing, ecommerce, accounting apps for a line-item row; the products the user's market actually uses).
2. **Research bodies and design systems**: Baymard, Nielsen Norman Group, Material Design, Apple HIG, GOV.UK, W3C/WCAG.

Ask both for the same cells, so the answers compare: (a) how an optional secondary field is revealed, (b) how a per-row binary flag is chosen (toggle, chip, menu), (c) where the destructive action sits, (d) how repeated rows stay distinguishable, (e) stated tap-target sizes. Put the pattern's real shape in the prompt (which fields, what is on which line today) rather than a category name, and say what the user finds wrong with it.

Evidence rules go in the prompt, per `haiku`'s research guidance: a fetched URL per claim, `COULD NOT RETRIEVE` lines, training-data claims labelled, which URLs came from a search versus guessed, and no quotes that were not read on the page.

## What comes back, and what to check

Measured 2026-10-03 on a mobile line-item row (name, amount, note, per-row tax tag, remove):

- **Product docs describe how to use a feature, almost never how the row is laid out.** Six products returned functional steps and no layout. What survived verification was hard numbers (WCAG 2.2 target size: 24 by 24 CSS px at AA, 44 by 44 at AAA, on `target-size-minimum.html` and `target-size-enhanced.html`; NN/g: 1 cm by 1 cm, `articles/touch-target-size/`) and one named interaction (Stripe's invoice editor puts tax rate, coupon and supply date behind a per-item "Item options" control).
- **A guessed URL's 404 was reported as "paywalled" or "does not exist".** Four research-body pages the agent called 404 or gated (NN/g, W3C, Material, Baymard) all returned 200 at the correct path. Retest every reported failure with a browser User-Agent before repeating a negative, and look up the real path from the site's own navigation.
- **Client-rendered pages (Material, Apple HIG) return only a title to a plain fetch.** That makes the page unverifiable, not empty. Say so rather than citing or dismissing it.
- **A claim attributed to a real page may not be on it.** A "stacked rows on mobile" claim was not on the forum post it cited, and a swipe-to-delete claim sat behind a 403. Open the page and find the sentence; a resolving URL grades the page, not the claim.
- **A quote from a real page may be about a different subject.** An article on form-level Cancel and Back buttons was offered as guidance for per-row delete. Check what the passage is about before it supports a recommendation.

## Reporting

Give the user the evidence and the judgement as two separate things. Hard numbers and named patterns carry a URL; the layout recommendation is yours, built on those and on any design source the user supplied (a reel's principles, a screenshot, a Figma frame), and it is labelled that way. Thin research is a finding to report, not a gap to fill with "best practice".
