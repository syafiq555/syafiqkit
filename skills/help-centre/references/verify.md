# Verifying a help centre {#verify}

Read before calling the build done, and again when a parser or map change lands.

## Tests that run against the real guides {#real-guide-tests}

Unit tests on a fixture guide prove the parser; a second set runs over the shipped guides and is what catches drift as writers edit them:

- one section per heading at the page levels, every anchor unique and in the URL-safe pattern;
- no anchor equal to a help route's own path word;
- every in-guide `#link` resolves within its book, every referenced image exists;
- no pandoc-only or unsafe output (`{#`, `:::`, `[^`, `<script`, `<iframe`, `onerror`, `javascript:`);
- plain-text spacing (no "word ." from stripped tags);
- the guide's own example search terms find their task first, per surface;
- every context-map anchor exists in its book, and every mapped route exists in the router.

## Access and search tests {#access-tests}

Access per role, including the refused cases (a role without help, a reader asking for another book's article or image), image headers and path traversal, sanitising, search ranking and limits, the quick-find minimum length, cap and throttle, and a malformed-UTF-8 query.

## End to end {#e2e}

An e2e spec at phone and desktop width: open help from the menu, an article with a loaded image, a cross-link that navigates without a full reload, the Contents sheet, a search, the palette result, "Help for this screen" landing on its task, and the other role refused.

## Screenshots {#screenshots}

A dedicated capture spec, skipped unless an env flag is set (GB Mart: `MANUAL=1`), writes into the guides' image folder with an override for a scratch folder. Orphans and gaps both fail silently, so diff the folder's file list against the image names the guides reference. Regenerate at least one screenshot through the authenticated image route as proof it is served.

## Design pass {#design-pass}

Rendered screens at 375, 768 and 1280 in each colour scheme, every capture opened (`uiux`, `impeccable` critique).
