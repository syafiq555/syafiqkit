---
name: taste
description: >-
  Build, redesign, restyle, polish or improve a public-facing web page: a company or product site,
  landing page, marketing page, portfolio, shop, cafe, studio or SaaS one-pager, in any stack. Fires
  whatever the verb, even mid-way through `uiux`, and when the user calls a page generic, templated,
  cheap, boring, plain, flat, busy or "AI-made", says it doesn't stand out or has no focal point, or asks for
  premium, bold or "wow". Builds to the figma.com and x.ai bar: plain
  copy, one system, one section per screen, real photographs and product UI, a hero entrance and dealt
  moments, with a checker and a finish gate that run in a real browser. Vendored from tasteskill
  2.5.1 (MIT). NOT for screens inside an existing app (dashboard, admin, settings, an in-product
  form) or for working within an app's own design language: that is `uiux`, which owns the app-screen
  kit. A marketplace or grocery storefront of product rails, deals and grids is a shop screen and also
  `uiux`'s ("shop" above means a small brand's site). Not for a scored critique with no rebuild (`uiux`), nor when the user names impeccable
  (`impeccable`). An image composed from the product's own screens is `product-still`.
hooks:
  Stop:
    - hooks:
        - type: command
          command: 'N=$(command -v node 2>/dev/null); for c in /opt/homebrew/bin/node /usr/local/bin/node "$HOME/Library/Application Support/Herd/config/nvm/versions/node/"*/bin/node "$HOME/.nvm/versions/node/"*/bin/node; do [ -z "$N" ] && [ -x "$c" ] && N="$c"; done; [ -n "$N" ] || exit 0; for f in ${CLAUDE_SKILL_DIR:+"$CLAUDE_SKILL_DIR/scripts/gate.mjs"} ${CLAUDE_PLUGIN_ROOT:+"$CLAUDE_PLUGIN_ROOT/skills/taste/scripts/gate.mjs"} ${CLAUDE_PROJECT_DIR:+"$CLAUDE_PROJECT_DIR/.claude/skills/taste/scripts/gate.mjs"} ${HOME:+"$HOME/.claude/skills/taste/scripts/gate.mjs" "$HOME/.claude/plugins/syafiqkit/skills/taste/scripts/gate.mjs"}; do if [ -f "$f" ]; then exec "$N" "$f" --hook claude; fi; done; for d in .taste-skill */.taste-skill; do if [ -f "$d/build.json" ]; then echo "taste gate: gate.mjs not found; the build in $d is not checked" >&2; break; fi; done; exit 0'
          timeout: 600
---

# tasteskill 2.5

App screens and a shop's storefront home belong to `uiux` (the description above), which owns the app-screen kit and may borrow `photos.mjs` and `shoot.mjs` from here.

A page that draws a complaint about how it looks (boring, plain, flat, busy, "doesn't stand out", "no focal point") is diagnosed before it is rebuilt: read `../uiux/references/composition-moves.md` (relative to this skill's folder), name the symptom and the move its table maps it to, and carry that move into the plan at run step 3 ("Plan the page as screens"). Rebuilding without naming the symptom deals a new page with the same failure. One odd element, detail from the subject, one tap colour and a bigger heading that stays inside the page's lines need nothing more; three moves break `layout-v4.md`'s "nothing staggered, cut off or overlapping" on purpose, so their section is marked. The marker, what a marked section lets through and what still FAILs are in `references/data-move.md`; open it when the plan uses a `data-move` section.

Build the website a good company would ship: it says plainly what is sold, shows the real thing on
every screen, and looks made for this client, not from a template and not like an art piece.
figma.com and x.ai are the bar (in words: `layout-v4.md` section 1).

`<skill>` is this folder. It needs Node 22+ and Chrome, Edge or Chromium (ffmpeg optional).

## House rules

These nine win over everything else in this skill.

1. **No caption or description under any image, render or visual.** Licence credits go in one
   footer line.
2. **Every visual renders, never an empty ground,** at 1440, 1024, 768 and 390.
3. **One section per screen:** the hero alone on the first screen, every section exactly one or
   two screens tall at 1440x900, no second section heading peeking in. The one exception is a
   live `photo-chapters` section, three or four screens, set by the moment.
4. **Equal left and right content edges** (the heading and subject of a `data-move` section excepted, above).
5. **Hover micro-animations:** a linked card lifts 2px, a photo zooms 1.02-1.03 inside its frame,
   buttons step on hover and press on click, underlines draw, card loops cycle in 2.5-4 s, repeat
   and restart on hover. The motion layer does it; never strip or override it. No tilt, carousels
   or timed tabs. Every hero enters once on load (`data-enter`), and every page carries one dealt
   moment, two on a long page (the gate holds both).
6. **More and better real photographs where they fit;** nicer backgrounds; better heroes, layouts
   and fonts.
7. **Real full-colour icons** (a known product's real icon, never a drawn one); small diagram
   visuals in cards (a hub with branches; one input, a main processor, three parallel lanes;
   pulses running along the lines).
8. **The big award-site scenes and creative moments are part of the skill:** every page deals its
   moments (photo- and type-led off tech), but shader effects and scenes only where the trade has a
   technical subject (tech, AI, developer tools, gaming, fintech, hardware), never on a local cafe,
   bakery, guesthouse or shop: those get photographs.
9. **Addresses:** street and district only (no street given: the district), no house number, postcode or coordinates; no register
   or VAT numbers; no phone in a real format; contacts on `.example`.

## 1. The kind of business decides everything

Write the kind on the plan's first line and declare it on the page: the page type on
`<html data-type>` and `<meta name="page-type">` (the same value), and `<meta name="site-kind">`;
a place adds `<meta name="page-kind" content="place">`. The dealers take the last column
(`start.mjs --page`, `moments.mjs --page`), the hero dealer the page type; `consistency.mjs` reads
the metas.

| Brief | page type | site-kind | kind |
|---|---|---|---|
| App, SaaS, AI, developer tool, fintech or banking app, a studio selling its own software | software | software | software |
| A game, a studio launching its game | software | gaming | gaming |
| Hardware or a tech device (a drone, a robot arm, a keyboard) | product | tech | tech |
| Any other physical product or brand (a chair, a bike, coffee beans sold online) | product | other | product |
| People are hired: clinic, law firm, agency, creative studio, trade | service | other | service |
| People come to it: cafe, bar, bakery, restaurant, guesthouse, small hotel, shop, florist, bike shop, gym, local studio | place | other | place |

A maker that also opens its door or teaches (a ceramics studio, a bakery with a web shop) is a
**place**; its web shop becomes the goods section. It is a product only when nothing happens at the door.

"Tech" below means site-kind software, gaming or tech; "other" is everything else. Effects,
scenes, loops, counts, CSS grounds, dark pages and dark heroes are tech only. An other page is
photographs, flat colour, type, real icons, the hero's entrance, its dealt moment (photo- or
type-led, `moments.md`) and the hover layer.

## 2. The page plan by kind

The full plans, deal lists and section order: `references/sections.md`.

The six per-kind bullets (place, product and service, every product page, tech, one object never carries the page, the client's own assets get slots) are in `references/page-plans-by-kind.md`. Open it when planning the page at run step 3, before the plan's section lines are written.

## 3. What serves which page

Open the reference of every asset family the page uses first. A dash means never.

The needs, the asset for each, its use per page kind and its reference are in `references/asset-routing.md`. Open it before the first page.

Read `copy.md`, `copy-voice.md`, `system.md`, `layout-v4.md` and `sections.md` in full before the first page.

## 4. The run

0. **The stack.** Empty folder: copy `<skill>/assets` into `assets` and start from
   `assets/starter.html`. Existing project: build in its own stack, components taking the starter's
   markup and classes, the kit copied to `public/assets` and loaded there as plain files. A Next.js
   brief builds a static export (`output: 'export'`), checked on its built page (`--root out`).

1. **Read the brief.** When the brief is a complaint (the paragraph on complaints above), run `cat <skill>/../uiux/references/composition-moves.md` first and write down the symptom, its mapped move and the section that carries it (with its `data-move` when the move staggers, crops or overlaps). Write down the kind (section 1), what is sold, who buys it, the one main
   action (the transaction: Book a room, Order a cake, Start a free trial; a place with neither:
   Get directions) and the real material: logo, screens, photographs, prices, address, hours.
   Then arm the finish gate, before any page exists:

   ```bash
   node <skill>/scripts/gate.mjs --start index.html --kind <kind> --category "<what is sold>" --primary "<main action>"
   ```

   A framework build names its dev server's URL (`--start http://localhost:5173/`) or its built page (`--start dist/index.html --root dist`; a Next.js export: `out`) in place of `index.html`, and
   rebuilds before every gate run (`references/gate.md`: what the gate opens).

2. **Write all the copy first,** with the copy layer (`copy-voice.md`: the fact sheet, the voice
   card on the plan, the page's shape, the device budget; a register from `copy-registers.md`, the
   moves of `copy-moves.md`) within the rules of `copy.md`: the h1 names the category and the buyer or the place (a game: its name and genre),
   one hard fact on the first screen, a noun in every heading, buttons as a verb and an object.
   Nothing is invented but a coined brand name (searched first, the result kept in `names.json`
   beside the page) and, on a place, plausible hours and prices, each marked `data-assumed`
   (`copy.md`, What may be assumed). A draft kept in a `.md` file lints the same way as the page
   (the voice card and part labels are skipped).

3. **Plan the page as screens.** Line 1: the kind. Line 2: the deal (step 4), with one sentence on
   why the palette fits the trade. Then one line per
   section: its id, its one idea, its picture and its kind (object, use, parts, world, slot, diagram, type; three object lines at most), its
   screens (1 or 2, from its content height, `layout-v4.md` section 2), which section holds a
   moment and why it moves (on tech also the effect or the scene). Pick the photographs now (`photos.md`); their count,
   stand-ins included, sets a place's length (section 2). Then read `cards.md` and the recipe of
   every id you use in `sections-library.md`.

4. **Deal, never choose by taste.** Each command keeps a history, so pages differ:

   ```bash
   node <skill>/assets/layout/deal.mjs --type <page type> --has <photo,ui,film,object,setting> --history .taste-skill/layout-history.json   # the hero; a game adds --kind gaming, hardware --kind tech
   node <skill>/scripts/start.mjs deal --page <kind> --trade <trade> --history .taste-skill/history.json    # three palettes made for the trade, three pairings: take the first; add --axis after a word or editorial hero
   node <skill>/scripts/start.mjs css --page <kind> --palette <id> --type <id> --radius soft --history .taste-skill/history.json
   node <skill>/scripts/start.mjs brand --page place --bg "#.." --ink "#.." --accent "#.." [--surface "#.."] [--muted "#.."] --type <id> --radius soft   # the client's own colours (a logo, a painted shopfront), in place of css
   node <skill>/scripts/moments.mjs pick --page <kind> --count 1|2 --fits section,statement --photo --history .taste-skill/history.json   # every kind
   node -e "for(const l of process.argv.slice(1)){const o=l.split('|');console.log(o[Math.floor(Math.random()*o.length)])}" <the kind's list, in references/deal-lists.md>
   ```

   Run every command from the project folder (`start.mjs deal` arms the gate there or joins the build
   one or two folders up; `references/gate.md`).

   Take the first palette and the first pairing printed (the next only when the first clashes with the client's logo or photographs, or fails `hero-lines`, said on plan line 2). Never violet (section 6): deal again. Keep the `:root` block as printed. Radius: `sharp` for fintech and developer tools, `soft` by default, `round` for consumer apps, square on a place. The per-kind deal lists, and the tech-only lit ground, CSS grounds and effect: `references/deal-lists.md`, opened after the commands above and before step 5.

5. **Build.** In `starter.html`: set `<html lang data-type data-radius data-buttons data-motion>`
   (lang: the brief's language), the three metas, the head block (title, description, og, icon,
   theme-color: `system.md`, Head) and the nav class; keep the skip link and the `m-enter` head
   line. Then the sections, the hero and the icon scan, as `references/build.md` gives them; open it
   before the first section.

6. **Check and look.** Only the skill's scripts, each one headless Chrome with WebGL on the CPU,
   closed by its own PID, one at a time in the foreground with a 10-minute timeout (never in the
   background, a windowed browser or a browser tool). Each serves the page file itself over http on
   127.0.0.1 (never `file://`), so no server is needed; a built page whose links start at the site
   root (`/_astro/page.css`) takes `--root` with the build folder (`dist`). `--profile <dir>` is the
   Chrome profile: a folder of its own in the OS temp folder or in `.taste-skill`
   (`.taste-skill/chrome-check`), never outside the project (no `../`); a relative one that leads out
   is replaced by `.taste-skill/chrome-<script>`. Then:

   ```bash
   node <skill>/scripts/copy-lint.mjs index.html --kind <kind>
   node <skill>/scripts/consistency.mjs index.html --widths 1440,1024,820,768,390 --rhythm-widths 1440,820,768,390 --profile <dir> --page <kind> --category "<what is sold>" --primary "<main action>"
   node <skill>/assets/layout/check.mjs --url index.html --profile <dir> --sizes 1440x900,1024x768,820x1180,768x1024,390x844 --shots shots/layout
   node <skill>/scripts/shoot.mjs --url index.html --w 1440 --out shots/1440.png --profile <dir>
   node <skill>/scripts/perf.mjs index.html --profile <dir>
   ```

   Shoot 1024, 820x1180, 768x1024 and 390 as well. Every `check.mjs` finding fails the page (no `--no-stress`); inside a `data-move` section it skips the edge rules for that section's heading and subject only.
   copy-lint opens no browser and takes under a second. Fix every FAIL (a copy-lint WARN too, or say
   why it stays) and read the copy aloud (`copy-voice.md` section 6); shoot again and read every
   screenshot against the checklist. In the fix rounds run `consistency.mjs --quick --widths
   1440,390`. Then the gate: the checker at 1440 and 390, a walk at 320 for overflow, collide and
   tap-size, and copy-lint, whose FAILs block like the checker's:

   ```bash
   node <skill>/scripts/gate.mjs index.html
   ```

   Fix what it lists and run it again until its last line is `GATE: PASS` or `GATE: OPEN`, three
   rounds at most. The stop hook, the round count and the waiver file are in `references/gate.md`;
   open it when the last line is none of PASS, FAIL or OPEN, and before any waiver. `GATE: SETUP`
   (no page yet, a framework's source shell, a page that is not local): arm the page (step 1) and
   run again. `GATE: ERROR` or `GATE: OFF`: put the line in the report and finish; do not rerun.
   When the user tells you to stop, or to ship the page as it is, run `gate.mjs --done "<what they
   said>"` (`GATE: DONE`) and report the open FAILs. Never edit the kit's files or hide anything from
   the checker. A FAIL you judge false is waived in `.taste-skill/waivers.json` with its reason, never
   fixed by gaming the check; a copy-lint FAIL on the client's own copy is waived hit by hit, the brief
   as the reason; a word inside the client's own name is not counted: one WARN.

7. **Report:** the `GATE:` line first, then every waiver with its reason and every open FAIL; the
   kind, the deal (palette and why it fits, pairing, hero, grounds, effect, moments, scene); the
   voice card in one line and every copy-lint WARN kept, with why; the checker, layout and perf
   results; what you could not check; every assumed fact (the checker's `assumed` list) and the
   coined name's search; the form's `.example` stand-in and the canonical domain still to come; the photographs and art the client must supply, every
   stand-in frame among them (library and live search); every client slot, its file and its stand-in.

## 5. Checklist

The fourteen checklist lines, each with its `consistency.mjs` ids, `check.mjs` findings and `perf.mjs` rows, are in `references/checklist.md`. Open it at step 6's fix rounds, and again before reporting at step 7.

## 6. Never

- A card, row or tile that fades in on scroll; a fade-in on every section; parallax on text;
  scroll-jacking; random blinking.
- Stock photographs passed off as the client's product, people or place (a stand-in is listed in
  the report as one, never shown with another maker's name or logo); a product page that never
  shows the product.
- A drawn look-alike of a real logo; invented reviews, quotes, customers or figures.
- Violet or lavender in the page's own design: accent, ground, gradient, effect colour or tint (a
  real third-party logo keeps its own colours, `icons.md`).
- Copying a reference site's code, copy, pictures or signature effect.
- Deleting or editing the kit's own files (`assets/`, `scripts/`) to clear a check: a check that
  flags a kit file is reported, and the page is checked again after any change.

## References

All in `references/`; `references/asset-routing.md` names the one each asset needs.
