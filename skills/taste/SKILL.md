---
name: taste
description: >-
  Build, redesign, restyle, polish or improve a public-facing web page with real art direction: a
  landing page, marketing site, portfolio, product page, one-pager or hero, in any stack. Fires when
  the user wants such a page to look better whatever the verb, even mid-way through `uiux`; says it
  looks generic, templated, cheap, "AI-made" or not powerful enough and wants it changed; or asks for
  premium, award-level, bold, cinematic or "wow". Deals researched directions
  (idea, composition, type, palette, photographs, section blueprints, scroll scenes) from a library
  distilled from 247 gallery sites, finds real pictures in open collections, enforces a no-ornament
  house style with a real-browser inspector, and runs a look-and-fix loop on screenshots. Vendored
  from tasteskill v2 (MIT). NOT for screens inside an existing app or for working within an app's
  established design language (that is `uiux`), for a scored critique with no rebuild (`uiux`), or
  when the user names impeccable (`impeccable`); its review path (inspector and lint on the live
  screen, no rebuild) still runs on a customer-facing app screen such as a checkout or sign-up form
  when `uiux` calls it before a redesign goes for approval. An image composed from the product's own screens
  for such a page (a how-it-works step, a feature or hero composite) is `product-still`. Beyond that review path, app screens run here only
  when the user asks for taste by name.
---

# tasteskill v2

> After a compaction, re-read the current step in `references/run.md` before the next build step.

A model-built page looks like the average of every page it has seen: a centred headline, a small
label above it, icon cards, a soft gradient, thin rules, a monospace caption. Nothing in it is wrong and
nothing in it was decided. This skill replaces those defaults with decisions:

1. **A script deals the directions; you choose.** `scripts/draw.mjs` deals three of twenty directions,
   then the type, palette, hero and sections for the one you pick, from 247 researched sites.
2. **The idea comes from the subject.** In the study, the best sites were distinguished by a concept taken
   from the thing itself, not by styling.
3. **A house style with no ornaments,** measured in a real browser by `scripts/inspect.mjs`.
4. **You look at what you made.** Screenshots at three widths, a juror's rubric, fix, look again.

One warning learned in testing: removing ornament without adding substance reads as thin, and blind
jurors prefer a richer page with tells over an empty one.

In the commands below `<skill>` is this skill's folder. Run them from the project root; working files land
in `.taste-skill/`. Requirements: Node 22+ and Chrome, Edge or Chromium; the scripts install nothing.
`assets.mjs` needs network access and uses no API keys.

## Page or app screen

- **A page** is read and scrolled (landing, marketing or product site, portfolio, event, one-pager). It
  follows **the run** below.
- **An app screen** is worked in (dashboard, admin, settings, billing, inbox, filtered list, editor). It
  follows **`references/app-screens.md`**, read whole first, with `draw.mjs --app` and `inspect.mjs --app`.
- **A reading page** is read to understand something and sells nothing (an internal guide, an explainer,
  documentation). It takes the review path: the house rules and laws hold, `lint.mjs` and `inspect.mjs`
  run, but `few-pictures`, `still-page`, `no-footage` and `focal-point` are defended in one line each where
  no honest picture exists and motion would cost the reader. Those floors exist to win a visitor's
  attention, and on a page whose job is comprehension they push in imagery and movement that compete with
  the text.

A product site that shows its app is a page; its interface fragments follow the app rules. Deal the app
style once, keeping the page's colours and type:

```bash
node <skill>/scripts/draw.mjs --app --kind <kind> --brief "<the product>" --keep palette,type --out .taste-skill/app
```

Build each fragment (the live screen, a feature's crop, a chart) as a real piece of that app, with
`assets/app.css` and `assets/charts.js`. A fragment that looks like a working product is the strongest
picture a software page has. A request mixing both gets each its own run and one shared palette.

## House rules

These hold on every build, whatever the direction. `inspect.mjs` measures them.

| Rule | Instead |
| --- | --- |
| **Headlines: two lines or fewer, at every width.** Every `h1`–`h6`, and the first screen's main line. | Cut words, then widen the measure. Size last. |
| **A clear title on the first screen** in the one `h1`, and a heading on every section. | Say what it is: the name with what it does, the product with what it is for. |
| **Equal outer margins; no section huddled on one side.** | Close every void on its far side: a picture, a second column, a list. |
| **No blank stretches** taller than about half a screen. | The normal section gap. One deliberate rest per page: a placed picture or a field of colour. |
| **Statements are paragraphs.** An intro or set quotation is `<p>`/`<blockquote>`, 36px or less (24px on a phone), about 25 words. | Larger is a headline. In blind tests jurors read a 42px sentence over four lines as a headline. |
| **No eyebrows.** No small label above a heading, no pill badge, no "New ·" chip. | Put the information in the heading or first sentence, or drop it. |
| **No monospace** outside real code blocks. | The text face. Tabular figures where numbers align. |
| **No index numbering.** No 01 / 02 / 03, no (001), no "Step 2". | Position, size or words. A real `<ol>` if order matters. |
| **No thin rules.** No hairlines, 1px outlined boxes, grid lines, crosshairs or crop marks. | Space, a step in background tone, a change of scale, a filled shape. |
| **No gradients,** as backgrounds, on buttons or in text. | Flat colour or a real photograph. A neutral scrim on a photo is the one exception. |
| **No shadows on things at rest.** No glows. | A tone step. Shadows only on what truly floats: a menu, a dialog. |
| **No assistant palette.** No yellow-cream ground with terracotta or rust; no violet or indigo. | The dealt palette. |
| **No tiny uppercase letter-spaced labels.** | Sentence case at a readable size. |
| **No icon-topped feature cards, no rows of identical cards.** | The dealt section blueprint. |
| **No glass.** No backdrop blur panels, no floating pill navigation. | A plain bar: wordmark, a few links, one action. |
| **No emoji, gradient blobs, decorative shapes or fake dashboards of grey bars.** | A real picture, a real interface fragment, or nothing. |
| **No styled accent word** in a headline (italic, serif, coloured, underlined). | One face, one colour. The words carry the emphasis. |
| **Two typefaces at most,** usually one. | The dealt type system. |

Three places keep their own conventions and the inspector leaves them alone: real code in
`<pre>`/`<code>` (monospace is correct there), real tables and form fields (they may have lines), and a
real interface fragment whose root carries the attribute `data-ui` (the product's own borders and menus;
see `references/imagery.md` §7).

Why these, honestly. Among the 247 sites, those the panel scored 7.5 or higher used icon feature cards 1%
of the time against 28% for sites under 6.5, pill badges 14% against 34%, gradients 22% against 52%,
shadows 24% against 48%, tiny tracked caps 16% against 57%. The rest are the owner's taste: monospace
labels, index numbers and hairline grids are *more* common on award sites than on weak ones, which is why
generators imitate them and why they read as costume. Banned without exception; `references/tells.md`
is the dated registry.

Removing ornament leaves space. Fill it with scale, the full content, a picture made for this subject, or
flat colour, never with another ornament.

## Laws of the craft

Numbers are from the study unless marked as house style.

**Type.** Two or three sizes do the visible work, one very large and one small. The median headline-to-body
ratio is 4.3; the top sites go far beyond (median largest type 8.4vw, against 5.0vw on the weak ones).
Display tracking -0.02 to -0.05em, leading 0.85–1.05; text 16–20px, leading 1.45–1.6, 45–75 characters per
line. Five sizes is the ceiling. One family is normal (a third of studied sites); two is the limit.
Left-aligned; centre at most one moment.

**Space.** One grid and one pair of tight margins (16–32px). Large things run to the edges; text blocks share
two or three left edges on the whole page. Asymmetry lives inside the grid, never in the frame: the outer
margins are equal, and an off-centre heading is answered by something on the far side. The gap between
sections is clearly larger than any gap inside one: 120–240px on desktop (the study's median is about 240).
Each section has a different composition from its neighbours.

**Colour.** One ground, one ink, one accent, on the action and perhaps one other thing. Running text in the
full ink; soft grey reads unfinished. Surfaces part by a small tone step, never a line or a shadow. A
section may change the whole field colour. Nothing fades into anything: a change of colour between sections
is a hard edge.

**Imagery.** One dominant image beats six small ones: on the top-scored sites the hero media covers at least
half the first screen 68% of the time. Same crop ratios and treatment; square corners unless the direction
says otherwise (73% of studied sites leave media square). No image is better than a placeholder, an icon,
or an abstract shape. A picture drawn for this subject beats either; a real picture of its world, found and
credited, beats that. Every found picture is downloaded into the project, credited on the page and in the
report, never presented as the client's own. Nothing lies on top of a headline or a statement.

**Components.** Buttons flat, one fill, square or fully round, decided once (top sites: 52% square, 23% pill;
the 9–16px "soft" radius is the weak-site default). Most strong heroes have no button at all, or one; this
skill keeps the one primary action step 5 asks for. Navigation: wordmark, three to five plain links, one
action, no bar chrome. The footer is a designed close, not a sitemap; most strong sites return the name at full width.

## Gate and fallbacks

Every build passes the gate in step 7 before it is reported. Fix every `FAIL`. Treat each `WARN` as wrong unless you can defend it to a designer in one sentence. Re-run until there are no `FAIL`s. Do not argue with the meter and do not hide things from it.

**No Chrome or Node 22.** Run `lint.mjs` (Node 18+), take screenshots with whatever browser tool you have, and critique those. Say in the report that the inspector could not run.

**No network.** If `assets.mjs` reaches no source, draw the pictures and say in the report that the open collections could not be searched.

## The run

Do these in order. Each step's detail is in `references/run.md#step-N`; read it before the step.
Steps 1–5 take a few minutes and decide whether the page is any good.

### 1. Read the brief and the project

Find what is real: the subject, audience, the one action the page must earn, the stack, any existing
brand, and above all **what imagery truly exists** (the project's own photographs, a real interface, an
image tool, or nothing). State your reading in one line rather than asking; ask only when a missing fact
blocks the work. Then **inventory the subject**: eight to twelve things that belong to this
client and to no competitor. The list feeds the idea in step 4 and the picture searches in step 6.
📖 references/run.md#step-1

### 2. Write the argument

List the page as claims with their proof, one line per section (`references/copy.md` §1). Delete any
section that has no claim. 📖 references/run.md#step-2

### 3. Draw the direction

```bash
node <skill>/scripts/draw.mjs --sector <sector> --brief "<one line about the subject>" \
  --sections <roles in the order of your argument> [--tone <tone>] [--have <assets>] [--keep palette,type] \
  --options 3
```

The first command deals three directions. Choose the one that can carry something only this client has,
not the most familiar; note why in one line. Then deal the full sheet.
📖 references/run.md#step-3

```bash
node <skill>/scripts/draw.mjs <the same arguments, without --options> --direction <chosen id>
```

The **direction sheet** is the art direction for this build: adopt it, do not blend it. Redraw a slot (`--redraw hero | type | palette | photos | scenes | section:<role> | direction`) only for a stated reason, and record it in the report. If a dealt section cannot hold the real content, list others with `--alternatives <role>` and take one with `--redraw section:<role>=<id>`. Reprint with `node <skill>/scripts/draw.mjs --show`.
📖 references/run.md#step-3 (palette check)

### 4. Find the idea

The idea is what makes the page belong to this subject and no other. Do not start building until both
blanks of this sentence are filled from the subject itself:

> On this page, **[something that belongs to the subject]** becomes **[the device the direction calls for]**.

Fill the first blank from your inventory, not from the category. **The competitor test:** put the
nearest real competitor in the sentence. If it still works, the idea belongs to the category. The
places to look for the first blank (output, object, name, place, ritual, artefact, opposite) are in
📖 references/run.md#step-4.

**One live thing.** Give the page one thing the visitor can do, made from the idea, with the subject's
real content, a thumb-sized phone version and a plain fallback without script. In blind tests every
winning page had one and the jurors named it first. It is built in step 6, not added as motion in step 9.
Scroll scenes need the idea too: a scene of pictures that could belong to anyone is a screensaver.

### 5. Write the words

Write the whole page as a plain-text copy deck before markup, following `references/copy.md`.

- **Every headline fits in two lines or fewer at every width** (about 32 characters is safe; copy.md §2
  has the arithmetic).
- **The first screen answers the visitor's first question in large type**: what the event is, when and
  where; what the product is and costs; who the person is. Each section the visitor came for has its own
  heading and navigation entry.
- One supporting sentence directly under the headline, shown with it; one primary action, named for
  what it does, as a real button on the first screen.
- **Write the full content.** Thin sections are the commonest reason a clean page loses to a busier one.
- Sample details are allowed where the brief has gaps, listed in the report for the client to confirm.
  Proof is never invented: no customers, quotes, reviews, press, logos or business statistics.
📖 references/run.md#step-5

### 6. Build it, still

Build with motion off in your head. Order: tokens from the sheet as CSS custom properties (`<skill>/assets/base.css`, optional), the hero at both widths, each section from its blueprint, imagery, the live thing, scroll scenes, then fullness, frame and states. Carry the idea into every section, footer included.

**Imagery,** in order of preference: the project's own; generated, if you have an image tool; real
pictures of the subject's world from the open collections, searched with
`node <skill>/scripts/assets.mjs "<query>"` (`--get <ref>` downloads one, `--credits`
prints the footer credit); drawn in code from the subject; the photographs dealt on the sheet, only where
an honestly generic picture fits; type and colour alone. **The floor, which the inspector checks:** at
least four real pictures on the page, usually six to twelve; SVG drawings do not count. Add one moving
picture where an honest clip exists (`assets.mjs --video "<query>"`), as a muted loop with a poster frame.
📖 references/run.md#step-6

### 7. Gate

```bash
node <skill>/scripts/lint.mjs <source files or folder>
node <skill>/scripts/inspect.mjs <url or path/to/index.html>
node <skill>/scripts/scenes.mjs <url or path/to/index.html>     # when the page has scroll scenes
```

`lint.mjs` scans source for banned patterns; `inspect.mjs` measures the page in a real browser at 1440,
768 and 390 pixels and saves screenshots to `.taste-skill/inspect/`; `scenes.mjs` photographs each scroll
scene (a scene that never starts or rests on desktop is a `FAIL`). If the page must also open from the
file system, open `index.html` that way once before you finish. 📖 references/run.md#step-7

### 8. Look

Passing the gate means nothing banned was measured, not that the page is good. Open every screenshot the
inspector lists and critique them with `references/critique.md`; fix the top three problems, inspect and
look again, three rounds at most. Judge only the pictures. 📖 references/run.md#step-8

### 9. Move

Build the motion layer; it is required. The inspector counts the elements that really move and fails a page
under eight (it warns under sixteen). Four parts: the signature move, section entrances, control feedback,
one moving picture. Transform and opacity only, each with a `prefers-reduced-motion` fallback.
📖 references/run.md#step-9 · `references/motion.md`

### 10. Report

Do not report until `inspect.mjs` shows **0 FAIL** at 1440, 768 and 390 on the final version, every
screenshot listed after the last change has been opened, and the critique is written up (📖
references/run.md#step-10 has the full checklist). Tell the user the direction, the idea and live thing,
the last scores, each found picture's credit, which pictures stand in for photography, and any sample
content to swap. Do not claim a check you did not run.

## Special cases

**An existing brand or design system.** Pass `--keep palette,type`, map the brand's colours and faces onto
the roles, and take only composition from the draw. If the brand itself needs a banned device (a logo in a
gradient, a violet accent), keep the brand asset, say so in the report, and pass `--allow <rule>` for that
rule only.

**Redesign, restyle or review.** Record the before first: `inspect.mjs <url> --out .taste-skill/before`
(with `--app` for an app screen), and lint the source. A review stops after the critique. A redesign keeps
the stack, content and what works, then proceeds from step 2 with the real content; prove it by inspecting
into `.taste-skill/after` and comparing at every width. 📖 references/run.md#redesign

**A component or a single section, not a page.** Skip the draw unless there is no direction to follow.
Match the surrounding design, apply the house rules and the laws, and still inspect the result.

**No checkout, no form backend.** The primary button goes to the real destination when the brief names
one; otherwise it opens a `mailto:` with a written subject and body, or, for a shop, points at `#checkout`
and the report says it must be wired before launch. Never fake a payment form.

## Files

| File | Read it when |
| --- | --- |
| `references/run.md` | Detail behind each step (1–10) and the redesign procedure. |
| `references/app-screens.md` | Any app screen: its run, rules, tokens, checks. |
| `references/copy.md` | Steps 2 and 5: argument, copy deck, two-line arithmetic. |
| `references/type.md` · `references/colour.md` · `references/layout.md` | Type, palette, grid, margins, navigation, footer. |
| `references/imagery.md` | Finding, crediting, cropping pictures; what to do with none. |
| `references/motion.md` | Step 9: budget, tokens, recipes, reduced motion. |
| `references/scenes.md` | Step 6 scroll scenes: placing, filling, checking. |
| `references/critique.md` | Step 8: how to look, score, what to fix first. |
| `references/tells.md` | Dated registry of generated-page tells and replacements. |
| `references/research.md` | The study's method and numbers; cite, do not guess. |
| `scripts/draw.mjs` | Deals and reprints the direction; `--photos`, `--site <id>`, `--app`. |
| `scripts/assets.mjs` | Step 6: searches open collections; `--get` downloads, `--credits` prints credits. |
| `scripts/lint.mjs` · `scripts/inspect.mjs` · `scripts/scenes.mjs` | The gate. |
| `assets/base.css` · `assets/base.js` | An optional neutral foundation. |
| `assets/scenes/` | Shared scroll-scene stage; each scene's files and `demo/` pages. |
| `assets/app.css` · `assets/charts.js` | App screens: shell, panels, tables, controls, SVG charts. |
| `library/` | Data the draw reads. Use the script, not the whole folder. |
