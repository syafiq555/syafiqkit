# Designing for people who scan

Read this when a brief lists everything a user needs to know, or when a screen is complete and still gets reported as confusing. People do not read interfaces; they scan for the one thing they came for and act.

## How people actually look at a screen

Eye-tracking finds four patterns. The **F-pattern** (first lines and the left edge) is what people fall back to on a wall of undifferentiated text, and it is the least effective, because everything below the first paragraph is skipped. The **layer-cake** pattern (headings and subheadings, dipping into a chunk only when its heading earns it) is the most effective short of reading everything. Design for the layer-cake: chunk content under headings that say what the chunk contains, front-load the label with the word the user is looking for, and make links and buttons describe their destination rather than "click here" or "more".

## Hierarchy

- One bold figure or action per screen, the thing the user does in the first two seconds. Everything else earns its pixels after that.
- Rare actions go behind a menu; frequent ones stay visible. Completeness on the surface is clutter.
- A column that is all zeros, a relation nobody follows, an explainer sentence above a table: fold, hide or delete rather than style.

## Words

- Buttons: verb plus outcome ("Send invoice", not "Submit").
- Errors: what happened, why, what to do next. Never an apology alone.
- Empty states: what this is, what appears here once it exists, the action that makes it exist.
- Defaults over choices. A form that pre-fills the common answer asks one question fewer.

## Icons

- Only home, search and print are close to universal. Every other icon carries a visible label.
- Five-second rule: if it takes more than five seconds to think of an icon for a concept, an icon will not communicate it. Use the word.
- Labels sit beside the icon, never only in a tooltip.
- An emoji is not an icon: it renders differently on every platform and cannot be themed or sized by token. Structural icons come from one vector family at token sizes.

## Progressive disclosure

Show the common case first and reveal the rest on request. This works only when the split matches how users prioritise, which means the grouping is a decision to test rather than assume, and it can oversimplify: hiding a capability behind "advanced" makes it invisible to the person who needed it. An accordion or "show more" header has to say what is inside it; "More settings" tells nobody whether to open it.

## Lazy-loading is design

Deferring a component or list buys a faster first paint by hiding discoverability, so what you defer decides what users find. Defer what they hunt for (a heavy picker, a map, page two); keep resident what tells them what the screen is and what to do. The trade lands hardest on phones, where below-the-fold content on a slow connection may never appear. Defer only where weight exists, since splitting small content costs a round trip. Deferred content still needs a loading state and a placeholder at its final size so the layout does not shift.

## Copy rules in the modules {#module-index}

This file is the one index for words-on-screen rules across uiux, impeccable and taste. The two module files below carry the full rule sets. Paths are relative to `skills/uiux/`.

- `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/clarify.md`: rewriting interface text so users know what happened, what matters and what to do next (sections "Audit the language", "Set the message hierarchy", "Rewrite by function", "Voice, accessibility, and localization", "Verify").
- `${CLAUDE_SKILL_DIR}/modules/taste/references/copy.md`: copy for pages, written as plain text before markup (sections 1 to 7: argument first, the two-line headline, headline shapes, supporting line, body and buttons, proof, things that read as generated, micro-typography). Its generated-copy tells are checked by `${CLAUDE_SKILL_DIR}/modules/taste/scripts/lint.mjs` rules `copy`, `cta-copy`, `lorem` and `em-dash`.

### Overlaps with this file

- **Buttons.** This file: verb plus outcome. `clarify.md` "Actions and navigation": a specific verb and object, the same noun and verb for the same concept across the product; for destructive actions name the object and consequence, prefer undo to confirmation when recovery is safe, and name the action on both the message and the button instead of `Yes`, `No`, `OK` or `Submit`. `copy.md` § 4: name the action or the thing ("Book a table", "See the plans"), one to three words, the primary action keeps one name everywhere, one primary button per screen. The `cta-copy` lint rule flags "Learn more", "Get started", "Click here", "Read more", "Discover more", "Explore now", "Submit".
- **Links that say where they go.** This file: not "click here" or "more". `clarify.md` "Help and instructional text": link text must make sense out of context.
- **Errors.** This file: what happened, why, what to do next. `clarify.md` "Errors and permissions": the same three answers; no internal codes as the primary message; promise no cause or resolution the system cannot know; no jokes on privacy, payment, deletion, access loss or blocked work.
- **Empty states.** This file: what this is, what appears here, the action. `clarify.md` "Loading, empty, and success states": also separate first use, no results, filters, permissions and failure, since each needs different words.
- **Defaults and fewer questions.** This file: pre-fill the common answer. `clarify.md` "Forms": put format and eligibility requirements before submission; explain why information is requested only when it is not obvious.
- **Progressive disclosure and what a disclosure says.** This file: an accordion or "show more" header must say what is inside. `clarify.md` "Help and instructional text": use progressive disclosure for uncommon detail; helper text answers an implicit question instead of restating the control.
- **Icons need words.** This file: visible labels beside icons. `clarify.md` "Help and instructional text": icon-only controls need accessible names; "Voice, accessibility, and localization": keep screen-reader names aligned with visible labels and do not rely on iconography to carry the message alone.
- **One thing to act on.** This file: one bold figure or action per screen. `clarify.md` "Set the message hierarchy": decide the one fact needed now, the next action, supporting context that changes the decision; say each idea once, and if the heading explains the state the introduction adds something or disappears.

### What the modules add that this file lacks

Each item is one line with its source.

- **Audit the whole path, not isolated strings**: ambiguous nouns and verbs, jargon, vague states, missing consequences or timing, inconsistent terminology and capitalisation, redundant intros, text that breaks at realistic widths or in translation, tone that ignores stress or urgency. `clarify.md` "Audit the language". It also says to ask before changing factual claims, legal meaning or a domain-specific term.
- **Persistent labels; placeholders are examples, not labels**; validation says what needs attention and how to correct it without blaming the user. `clarify.md` "Forms".
- **Loading text names the real operation**, shows determinate progress when available and never invents progress; routine success is brief and mentions a next consequence only when it changes what to do. `clarify.md` "Loading, empty, and success states".
- **Localisation**: whole translatable messages instead of concatenated fragments, structured variables so translators can reorder, room for expansion, pluralisation. `clarify.md` "Voice, accessibility, and localization" and "Verify".
- **Alt text conveys the image's information; empty alt for decoration**. `clarify.md` "Voice, accessibility, and localization".
- **Voice stays consistent while tone adapts**; keep a short terminology glossary when inconsistency spans the product. `clarify.md` "Voice, accessibility, and localization".
- **Copy verification list**: comprehension without hidden product knowledge, actionability, factual accuracy, scanability at target widths and 200% zoom, long names and dynamic values, announced state changes, tone for the consequence. `clarify.md` "Verify".
- **Write the argument first**: who reads, what they believe after one screen, what proves it; a section with no claim is filler. `copy.md` § 1.
- **Headline budget**: two lines or fewer at every viewport, about 32 characters (four to six words) for a hero headline, section headings two to five words, supporting line one sentence of about 22 words or fewer; a large-set statement is a paragraph, not a headline. `copy.md` § 2 and § 4.
- **Headline shapes that work and ones to avoid** (the mad-lib, the tricolon, the correction "not just X, it's Y", "X, reimagined", a question nobody asked). Sentence case. `copy.md` § 3.
- **Specific over generic**: the specific noun and the real number ("ships in a week", not "fast delivery"); if another company could print the sentence unchanged, sharpen or cut it. `copy.md` § 4.
- **Navigation labels**: wordmark, up to five plain links with single-noun labels, one action; at most one arrow glyph, on the primary action. `copy.md` § 4.
- **Proof without inventing it**: never invent customers, quotes, press logos, counts or ratings; use sample details (full realistic rows) and list them in the report. `copy.md` § 5.
- **Things that read as generated**: genre verbs and adjectives, labels pretending to be editorial, furniture text (locale strips, "Scroll", coordinates), em dashes as a habit, captions narrating the design, step labels duplicating numbers, three parallel items everywhere. `copy.md` § 6.
- **Micro-typography**: curly quotes, a real ellipsis, en dash for ranges, non-breaking space between number and unit, tabular numerals in columns, `text-wrap: balance` on headings and `pretty` on paragraphs, no all-caps over three words, no text under 13px, no centred paragraph over three lines, no justified text. `copy.md` § 7.

### Values that differ

- **Em dashes.** `copy.md` § 6 and the `em-dash` lint rule tolerate one or two on a page and warn above four; the house rule for the surfaces you are writing may be stricter, so check the project's own instructions before relying on either.
- **Smallest text.** `copy.md` § 7: no text under 13px. `${CLAUDE_SKILL_DIR}/references/mobile-first.md` (module section) lists the other floors: 11px, 12px and 16px for body on mobile.

## Sources

- Scanning patterns: https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/
- Icon labels and the five-second rule: https://www.nngroup.com/articles/icon-usability/
- Progressive disclosure and its risks: https://www.nngroup.com/articles/progressive-disclosure/ and https://www.interaction-design.org/literature/topics/progressive-disclosure
- No emoji as structural icons, one icon family at token sizes: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/references/pro-rules.md
