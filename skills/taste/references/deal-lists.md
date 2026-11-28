# Deal lists

The per-kind deal lists and the rules for a dealt part's photographs, brand colours and tech-only grounds, from run step 4 of `SKILL.md`; `SKILL.md` points here. Open it after running the step 4 commands, for the kind's list and what a tech page takes.

The lists, in order nav, footer, close, rhythm, buttons, mark (`sections.md` sections 2 and 3):
- software: `"nav-mega|nav-cards|nav-centre" "footer-dark|footer-statement|footer-columns" "close-type|close-word" "dark-band|surface-pairs|space" "solid|pill|tonal|arrow" "wordmark|initial|arc|ring|stack|dots"`
- gaming: `"nav-mega|nav-centre|nav-cards" "footer-dark|footer-statement" "close-word|close-type" "dark-band|media-band|space" "solid|pill|block" "wordmark|initial|arc|ring|stack|dots"`
- product and hardware: `"nav-cards|nav-split|nav-mega" "footer-columns|footer-dark" "close-photo|close-type|close-word" "dark-band|brand-band" "arrow|solid|block|pill" "wordmark|initial|arc|ring|stack|dots"`
- service: `"nav-mega|nav-split|nav-centre" "footer-visit|footer-dark|footer-columns" "close-type|close-photo" "surface-pairs|dark-band|space" "solid|tonal|block|arrow" "wordmark|initial|arc|ring|stack|dots"`
- place: the whole line in `sections.md` section 4, Place (The deal), read in its order.

A product or hardware with no photographs deals with `--has photo` for its stand-ins;
`--has object` only for a cut-out or a render the brief asks for (always the `product` hero, its
widest view across the wrap, no box); a game without art files passes `--has setting` (the
`photo` hero, its name over a stand-in of its setting; a game always passes `--has`). A product
page is dealt only the product, photo and film heroes. A place's hero is printed, never dealt (`--type
place`). A dealt part that needs a photograph the page lacks is dealt again (`sections.md` section 2). The
client's own colours go through `start.mjs brand` instead (`sections.md` section 4, Look). On tech only: the lit ground (`<html data-ground>`:
`sand|sky|sage` through the one-liner), the CSS grounds (`backgrounds.md`) and the one effect
(`effects-usage.md`). Write every result on plan line 2 and in
the comment at the top of `<body>`, and build exactly that (a short page drops what it has no section for: `sections.md` section 4).
