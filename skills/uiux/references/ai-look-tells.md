# Tells of a generic AI-built UI

Read this when a design feels competent and forgettable, or when reviewing a screen for "does this look defaulted". These are examples of the pattern, not an exhaustive ban list: lists like this date within months, and the real test is the five questions in `SKILL.md` (Swap, Squint, Signature, Token, Exclude). A tell that survives the test because the surface's audience and job asked for it is not a defect.

Each tell is common because it is the statistically safest answer to "make this look designed". That is also why a reader recognises it at a glance and stops trusting the page.

## Contents

1. The table of tells (below)
2. Using the list
3. Stock aesthetic looks
4. Where the modules also cover each tell (the index across uiux, taste and impeccable)
5. Tells that exist only in the modules

| Tell | Why it reads as default | Ask instead |
|---|---|---|
| Thick coloured stripe down one edge of a card | The cheapest way to mark a card as "important"; appears on every generated dashboard | What is this card's status, and can the status be a label, an icon or its position? |
| Purple or violet gradients, cyan on dark | The training-data default for "modern tech" | What colour does this product's audience already associate with it? |
| Gradient text on a headline | Emphasis borrowed from decoration | Can weight or size carry the emphasis? |
| Cards inside cards | Nesting to create grouping the layout could create with spacing | Would spacing and one heading group these just as well? |
| Bounce or elastic easing | Motion added "for delight" by reflex | A short deceleration curve; does the motion tell the reader where something went? |
| A small tracked uppercase label above every section heading | Template rhythm: every section announces itself the same way | Delete it; does the heading still work alone? Keep one only where it adds information |
| Three identical cards: icon, heading, two lines | The default answer to "list the features" | Do these items differ in importance? Show that |
| A hero stat template (big number, small label, supporting line) repeated | Looks like data, says nothing next to it | Which one figure does the reader act on? |
| Glow shadows, radial halos, glass on every surface | Depth used as decoration | One elevated layer, with a reason |
| Browser defaults left in place: focus ring, text selection colour, scrollbars | The parts no mockup shows, so nobody chose them | Theme them from the same tokens as everything else |
| Overused display faces (Inter as the only voice, or the current fashionable serif) | The model's first choice for a brief | Why this face for this audience, in one sentence? |

## Using the list

In a critique (this skill's grade, `critique-mode.md` step 4) a hit is a prompt to ask the right-hand question, not a finding by itself. In a build, check your own diff for the tells before showing it, the way you check it for raw colour values. Two or three together on one screen is the signal that nothing on it was shaped by the audience.

Adapted from the anti-pattern lists in impeccable (Apache-2.0, `github.com/pbakaus/impeccable`) and taste-skill (MIT, `github.com/Leonxlnx/taste-skill`), restated in our own terms and reframed as questions.

## Stock aesthetic looks {#stock-looks}

Whole-look defaults, one level above the component tells in the table. Choices collapse into one of these when nothing drives them, and each bundles an unexamined assumption:

- **cream/serif/terracotta** (literary)
- **near-black + acid** (high contrast)
- **broadsheet hairline** (airy)
- **SaaS card kit** (rounded, one shadow)
- **template chrome** (tracked labels)
- **AI-native gradient** (glowing)

When you recognise one, ask what your audience, subject and job would choose instead.

Adapted from `frontend-design` skill (Apache-2.0) and `superdesign` skill (MIT).

## Where the modules also cover each tell {#module-index}

This file is the one index for AI-look tells. The two vendored modules carry the same tells with their own wording and, in taste's case, machine checks. The table above stays the uiux voice (questions to ask); the table below says where else each tell is stated or measured. Paths are relative to `skills/uiux/`. Aliases used in the cells:

- `tells.md` = `${CLAUDE_SKILL_DIR}/modules/taste/references/tells.md` (taste's dated registry; each row there carries a status: banned fails the page, warned needs a reason)
- `lint.mjs` = `${CLAUDE_SKILL_DIR}/modules/taste/scripts/lint.mjs` (source scan, rule table `R`, ids written `lint:<id>`)
- `rules.mjs` = `${CLAUDE_SKILL_DIR}/modules/taste/scripts/lib/rules.mjs` (rendered-page checks in `judge()`, ids listed in `RULE_IDS`, written `inspect:<id>`; `inspect.mjs` runs them)
- `craft-floor.md` = `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/craft-floor.md` (its "Refuse" list holds the category defaults; its "Verify" list holds the build checks)
- `app-screens.md` = `${CLAUDE_SKILL_DIR}/modules/taste/references/app-screens.md`

| Tell (as in the table above) | taste | impeccable |
|---|---|---|
| Thick coloured stripe down one edge of a card | Nothing measures a card stripe. Nearest: `app-screens.md` § 14 row "A dark navy or tinted sidebar with a coloured active pill and a left bar" (sidebar, not card) | `craft-floor.md` Refuse, "Surface habits": "A colored `border-left` or `border-right` above 1px on cards, list items, callouts, or alerts" |
| Purple or violet gradients, cyan on dark | `tells.md` § 1 "Violet / indigo gradients" (banned) and § 2 "Near-black ground with one neon accent and a glow" (banned via shadow, gradient); `lint:purple`, `lint:gradient`; `inspect:palette-purple`, `inspect:gradient`. Cyan has no rule of its own | Not on the craft floor |
| Gradient text on a headline | `tells.md` § 1 "Gradient-filled headline text" (banned); `lint:gradient-text`; `inspect:gradient-text` | `craft-floor.md` Refuse: "Gradient text. Emphasis comes from weight or size." |
| Cards inside cards | No rule. Related box checks: `inspect:outlined-box`, `inspect:card-rows`, `lint:outlined-box` | `craft-floor.md` Refuse, "Page scaffolds": "nested cards are always wrong" |
| Bounce or elastic easing | `tells.md` § 7 "Motion tells" and `${CLAUDE_SKILL_DIR}/modules/taste/references/motion.md` § 9 ("Bounce or elastic easing on interface elements") and § 10 rule 3 ("No overshoot"); `lint:bounce` matches only `animate-bounce`, `animate-ping`, `animate-pulse` classes, not an overshooting curve | `craft-floor.md` Verify, "Motion": "Exponential ease-out from an already-visible default" (the positive form; no bounce ban) |
| Small tracked uppercase label above every section heading | `tells.md` § 2 "Eyebrow / kicker" (banned) and § 4 "Tiny uppercase letter-spaced captions" (banned at 3 or more); `lint:eyebrow`, `lint:micro-label`; `inspect:eyebrow`, `inspect:micro-label` (FAIL at 3 or more, WARN below). In app mode `rules.mjs` `APP_SKIP` and `lint.mjs` `APP_LEVEL` relax `eyebrow` | `craft-floor.md` Refuse: "A kicker or eyebrow above a heading. This one is a ban, not a default: no brief earns it back." |
| Three identical cards: icon, heading, two lines | `tells.md` § 1 "Three identical feature cards, each with an icon in a rounded square" (banned); `inspect:icon-cards` (FAIL), `inspect:card-rows` (WARN); dashboards: `inspect:icon-chips`, `inspect:icon-tiles` and `app-screens.md` § 14 row "Four KPI cards, each with an icon in a tinted circle" | `craft-floor.md` Refuse: "Same-size cards of icon plus heading plus text as the page structure" |
| A hero stat template (big number, small label, supporting line) repeated | `app-screens.md` § 14 rows "A green +12.5% pill on every KPI", "KPI values at 36-48px, bold, in the brand colour"; `inspect:kpi-size` (WARN from 48px) | `craft-floor.md` Refuse: "The hero-metric template: big number, small label, supporting stats, accent." |
| Glow shadows, radial halos, glass on every surface | `tells.md` § 1 "Glass panels" (warned at 2 or more), "Glowing or gradient 'Get started' button", "Soft grey drop shadow under every card" (banned); `lint:glass`, `lint:shadow`; `inspect:glass`, `inspect:shadow`, `inspect:text-shadow`, `inspect:button-fx`, `inspect:heavy-shadow` | `craft-floor.md` Refuse: "Glass and blur as decoration rather than as a specific effect"; Verify, "Depth": "shadows carry an offset and a soft blur. A zero-offset colored halo is decoration." **Differs:** taste bans any shadow on an element at rest (only menus, dialogs and sticky bars may carry one); the craft floor accepts an offset, soft-blur shadow as depth |
| Browser defaults left in place: focus ring, selection colour, scrollbars | `inspect:default-link` (warns on the browser-default blue or purple link colour) is the only check | `craft-floor.md` Verify, "Browser surfaces": text selection, caret, custom scrollbars, focus rings, underline offset and tabular numerals "ship with browser defaults that belong to no design system. Theme them from the palette." |
| Overused display faces (Inter as the only voice, or the fashionable serif) | `tells.md` § 1 "The same typeface on every generated page" (warned) and § 3 "High-contrast or soft serif display as the shortcut to 'premium'", "Oversized italic serif headline" (no rule); `lint:default-font`; `inspect:font-count`, `inspect:font-fallback`. App-screens variant: `app-screens.md` § 14 row "The kit's own face: Geist or Inter on #f8f8f8" | `craft-floor.md` Refuse: "A system display face (Impact, Arial Black, the platform sans) as the display voice of an own-world page"; `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/typeset.md` for the font choice itself |

Stock looks (the section above): cream, serif and terracotta is `tells.md` § 3 "Yellow-cream ground + terracotta / rust / clay accent" (`lint:claude-palette`; `inspect:palette-claude`, `inspect:palette-terracotta`, `inspect:palette-cream`); near-black plus acid is `tells.md` § 2 (above); broadsheet hairline is `tells.md` § 3 "Broadsheet cosplay" (banned via hairline: `lint:hairline`, `inspect:hairline`); SaaS card kit is `tells.md` § 1 (soft shadow, three cards) and `app-screens.md` § 14 row "Cards with a 16-24px radius, a 1px border and a large soft shadow"; template chrome is `tells.md` § 2 eyebrow and § 4 "Tiny uppercase letter-spaced captions"; AI-native gradient is `tells.md` § 1 violet gradients (`lint:gradient`, `lint:purple`).

## Tells that exist only in the modules {#module-only-tells}

Not in the table above and not in the stock looks. Each line gives where to read it.

**impeccable**

- Loaded symbols as decoration: emblems tied to militarism, supremacy or hate movements used as motifs, badges or ornament (the Rising Sun flag's rays, the Confederate battle flag, Nazi-era insignia and stylised variants). `${CLAUDE_SKILL_DIR}/modules/impeccable/MODULE.md`, "How to design", bullet "Loaded symbols stay out of the decoration". Content that documents such a symbol as fact stays.
- A modal for a task that needs neither interruption nor protected focus. `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/craft-floor.md` Refuse, "Page scaffolds".
- A system display face as the display voice of an own-world page; the closest installed font is a failure, not a fallback. `craft-floor.md` Refuse, "Surface habits".
- Geometric masks (circle, polygon, radial-gradient cutout) standing in for a photographic subject's organic edge. `craft-floor.md` Refuse, "Surface habits".
- Hard offset shadows (`box-shadow: 4px 4px 0`) outside a world that is actually neobrutalist. `craft-floor.md` Refuse, "Surface habits".
- Light or dark picked by category instead of by use scene (who, where, under what ambient light). `craft-floor.md` Refuse, "Surface habits".
- Sparklines, progress rings and soft-shadowed rounded rectangles standing in for content. `craft-floor.md` Refuse, "Surface habits".
- Monospace as a costume for "technical" rather than for code, data or measurement; Unicode glyphs or emoji standing in for an icon system. `craft-floor.md` Refuse, "Surface habits" (taste also bans both: `lint:mono`, `lint:emoji`).
- Section numbers (01 / 02 / 03) unless the sequence carries information. `craft-floor.md` Refuse, "Page scaffolds" (taste bans them outright: `tells.md` § 4, `lint:numbering`, `inspect:numbering`).
- Product-UI strangeness without purpose (over-decorated buttons, mismatched controls, display fonts where labels belong). `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/operate.md`, "The product slop test".
- Native apps ported from a website (reinvented nav bars, web-shaped buttons, hover affordances) and an iOS app in Android's skin. `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/ios.md` "The iOS slop test"; `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/android.md` "The Android slop test".

**taste**

- Dated waves in `${CLAUDE_SKILL_DIR}/modules/taste/references/tells.md`: § 1 (2023 to 2024) emoji as icons, centred headline-subtitle-two-buttons-screenshot hero; § 2 (2025) pill badge above the hero headline ("New", "Beta"), one headline word in italic serif, colour or underline (`inspect:mixed-font-headline`), bento grid of rounded tiles, floating rounded pill navigation (`inspect:pill-nav`), fake dashboard hero from grey bars and donuts, decorative status dot, fade-and-rise on every section; § 3 (2025 to 2026) cream with terracotta, serif display as the "premium" shortcut, broadsheet cosplay.
- Performative labels ("Field notes", "Quietly trusted by", "On our desks"). `tells.md` § 3; `lint:copy`; `${CLAUDE_SKILL_DIR}/modules/taste/references/copy.md` § 6.
- Design-tool chrome as ornament (crosshairs, crop marks, selection handles, dashed guides, rulers). `tells.md` § 4; `lint:hairline`; `inspect:dashed`.
- Agency micro-meta (local time, coordinates, weather, version stamps, "Scroll", middle-dot strings). `tells.md` § 4; `copy.md` § 6 "Furniture text".
- Gallery fashion banned as house style: monospace micro-labels (`inspect:mono`), index numbering, thin rules and 1px outlined boxes (`inspect:hairline`, `inspect:outlined-box`), tiny tracked captions scattered around the viewport. `tells.md` § 4.
- Structural tells: headline as a full sentence at display size (`inspect:headline-lines`), stock section order, every section the same layout, everything centred (`inspect:all-centred`, over 72%), one medium radius on everything, nine near-equal font sizes (`inspect:size-count`), invented social proof, text or a CSS box where a picture belongs. `tells.md` § 5; `${CLAUDE_SKILL_DIR}/modules/taste/references/copy.md` § 5 for proof.
- Copy tells: genre verbs and adjectives (unlock, supercharge, seamless, elevate), "not just X, it's Y", tricolon headlines, "Get started" and "Learn more" as labels, an em-dash habit, lorem ipsum. `tells.md` § 6; `lint:copy`, `lint:cta-copy`, `lint:lorem`, `lint:em-dash`; `copy.md` §§ 3 and 6.
- Motion tells: identical fade-up on every block, a dozen staggered hero entrances, hover lift on every card, infinite loops that mean nothing, reveals that fail and leave a blank band, preloaders, scroll hijacking, custom cursors, scramble text. `tells.md` § 7; `${CLAUDE_SKILL_DIR}/modules/taste/references/motion.md` § 9 and "Seen in the latest Sites of the Day"; `lint:transition-all`, `lint:ease-in`, `lint:scale-zero`, `lint:bounce`.
- Generated-dashboard tells (greeting with a waving hand, KPI icon circles, green delta pill on every KPI, sparkline per KPI, gradient area chart with a dot per point, rainbow chart palette, fat donut with slice labels, left-aligned proportional numbers, saturated status chips, placeholder people and companies, pagination under a short list). `app-screens.md` § 14; `inspect:icon-chips`, `inspect:rainbow-chart`, `inspect:numeric-align`, `inspect:tabular`, `inspect:placeholder-data`, `inspect:colour-sprawl`.
- The avoidance aesthetic: a page with every tell removed and nothing in their place is itself a tell. `tells.md` § 8.
- App mode relaxes some taste rules (`eyebrow`, `mono`, `numbering`, `hairline`, `outlined-box`, `icon-cards`, `card-rows` among them) because app screens legitimately keep quiet table lines and data labels: `${CLAUDE_SKILL_DIR}/modules/taste/scripts/lib/rules.mjs` `APP_SKIP`, `${CLAUDE_SKILL_DIR}/modules/taste/scripts/lint.mjs` `APP_LEVEL`. Do not read a skipped rule as "taste permits it" on a landing page.
