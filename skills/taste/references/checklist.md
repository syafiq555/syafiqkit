# Checklist

The fourteen checklist lines from `SKILL.md` section 5; `SKILL.md` points here. Open it at step 6's fix rounds and again before reporting at step 7.

Each line names its checks: `consistency.mjs` ids in brackets, `check.mjs` findings in braces,
`perf.mjs` rows. The last line is for your eyes.

- **First screen:** says what is sold, for whom or where, with one hard fact [copy-headline,
  copy-fact]; the hero fills it alone at every width, its main button inside it [hero-screen,
  hero-fill, fold-action, fold-cut] {hero-fold}.
- **One section per screen:** every section 1 or 2 screens, its h2 first and top-aligned, no
  neighbour's heading or picture in its tile, nothing sparse, no section half empty [section-height, one-section,
  one-heading, section-air, one-screen, section-gaps, empty-area] {screen-short, screen-height, sparse,
  neighbour, neighbour-ground}.
- **Equal edges:** every block on the `.wrap` lines or the grid's columns, nothing out to one side,
  no sideways scroll [container-edges, row-lines, split-pair, off-grid, right-edge, col-edge,
  spill, off-viewport, stagger, top-stagger] {edge-left, edge-right, spill, bleed-one-side,
  one-sided, lines}.
- **Every visual draws** at 1440, 1024, 768 and 390; a refused effect shows its still fallback
  [visual-empty, empty-visual, gl-fallback, shader-lint, no-visual, photo-weight].
- **No caption** explains, apologises for or labels a picture; credits in one footer line
  [visual-caption, caption, credit-wall, photo-credit]; no placeholder, sample note or printed
  `.example` address [placeholder, sample-label].
- **The right things for the kind:** outside tech no effect ground, print or scene, only the
  dealt photo- or type-led moments (WebGL only for a product render the brief asked for)
  [effect-kind, effects-fit, photo-print]; the subject itself
  shows: the product big, whole in three sections at most, a new picture each [product-shown,
  same-object, photo-repeat]; each asset the brief names in its slot; a game's name and its world as key art,
  the diff of a code-review tool, software's `app-frame`;
  real photographs where they fit, none twice [photo-set, photo-repeat, photo-upscale]; real icons in their own
  colours; flat grounds on other [grounds]; a place deals two different compositions and one type
  moment.
- **Motion:** every button, link, linked card and linked photograph visibly answers the pointer,
  nothing tilts [motion-layer, hover, hover-move, tilt]; the hero enters once on load
  [hero-enter]; one or two dealt moments [moment-none]; card loops cycle in 2.5-4 s [loop-cycle]; nothing moves because the page scrolled
  except a dealt moment inside its own section (every kind) or the big scene (tech)
  [scroll-linked, scroll-reveal, pinned: expected only there]; anything
  moving past 5 s has a pause button [loop-pause]; under reduced motion everything rests and nothing
  stays hidden [reduced-motion, hidden-content]; at most four live contexts [webgl].
- **Contacts** as rule 9 [street-number, postcode, coordinates, company-number, phone-number];
  Get directions only with a street, "See the area" with a district, no map link with a town only [map-link].
- **Keyboard and head:** every control named, alt on pictures, labels you can see, headings one
  level at a time, no tabindex above 0; Tab reaches the skip link first, its ring shows at once and
  never under the header; the menu button says its state; lang, title, description and share tags
  [a11y-name, img-alt, field-label, heading-order, tabindex, skip-link, focus-ring, focus-visible,
  focus-hidden, menu-toggle, lang, page-meta, share-meta].
- **One system:** one button pair, one card style, one radius scale, one link look [button-styles,
  button-shape, card-family, card-layout, link-styles]; two boxes deep at most [nesting]; one
  heading scale, its faces loaded [heading-scale, font-load]; text contrast [text-contrast,
  contrast].
- **Copy and links:** headings name things, buttons a verb and an object, at most two hero actions
  [copy-headings, copy-buttons, copy-actions, action-count]; one action twice a screen at most
  [action-repeat]; a heading's grey half is its own sentence [run-on]; one fact, one wording
  [fact-agree]; assumed facts marked, never an open-now line from them [assumed, open-now]; every
  link lands, forms send, a confirmation only after a real send, each error under its own field
  [links, forms, form-send, form-fields]; no slop word, stock line, leftover or device used as a
  tic, a voice of its own (copy-lint's ids: copy-residue, copy-slop-word, copy-stock-phrase,
  copy-two-fragment, copy-virtue, ...; `copy-voice.md`).
- **Fast:** no FAIL row in `perf.mjs` (image weight, contexts, layout shift).
- **820, 768, 390 and 320:** sections on their screens [section-height]; on a phone a section is at
  least its screens and grows with what it holds, so nothing lies on anything else or under a fixed
  bar [collide]; every link and control outside running text 44px tall [tap-size] (a FAIL when
  another target is under 8px away); nothing past the screen at 320 [off-viewport], and nothing
  lies on anything else there either [collide]; the first screen ending whole or on a clear bleed [fold-card]
  (`layout-v4.md`); splits stack text first, no row half empty; one column at 390, buttons full
  width, a full-screen menu; the place action bar.
- **Your eyes:** beside the figma.com and x.ai frames it reads as a professional company site;
  nothing tilted, staggered, cut or overlapping outside a `data-move` section; the hero is the work, not a mood.
