# The run: step detail

The steps and their commands are in `SKILL.md` § The run. This file holds the detail behind each step.
Read the step you are on here before you do it.

## Step 1. Read the brief and the project {#step-1}

Find out what is real: the subject, the audience, the one thing the page must get someone to do, the
stack, any existing brand (colours, fonts, logo), and above all **what imagery truly exists**: the
project's own photographs or product shots, a real interface that can be shown, an image generation
tool you can call, or nothing. Do not plan around pictures you do not have. Nothing of its own is
rarely nothing at all: the subject's city, street, materials and history are in open archives and
museums, free to use with a credit (step 6, `scripts/assets.mjs`).

If the request is vague, decide and state your reading in one line instead of asking. Ask only when a
missing fact blocks the work (for example, no product name).

Then **inventory the subject** in your notes: eight to twelve things that belong to this client and to
no competitor. Look for its name and what the name means; its address, door number, street and
neighbourhood, and what that place looks like (its tiles, signs, paint colours, typefaces on its shop
fronts, its light, its weather); the numbers in the brief (seats, rooms, minutes to the sea, the
price, the year); the constraint it lives with (only one batch a month, closed in winter, by
appointment); its materials and colours; its rituals and hours (the oven lit at five, the ferry at
seven); the printed things of its world (a timetable, a label, a ticket, a sign). This list is where
the idea comes from in step 4. In blind tests, the page that won each brief was built from an item on
such a list (the client's name and what it means, the street it stands in, the one constraint that
makes it what it is), and the pages that lost had a good composition with a category idea. The list
is also your picture search: each place, material and printed thing on it is a query for step 6.

## Step 2. Write the argument {#step-2}

Before any design, list the page as claims with their proof, one line per section, the way
`references/copy.md` §1 shows. The claims decide which sections exist and in what order. Delete any
section that has no claim. This is how you avoid the stock sequence of hero, logos, three features,
testimonial, pricing, call to action.

## Step 3. Draw the direction {#step-3}

The draw deals three directions and prints a short summary of each. Hold each one against your
inventory: which way of composing can carry something only this client has? Choose that one, not the
most familiar, and write one line in your notes on why. In testing, a single random direction that did
not suit the subject was the commonest cause of a weak page.

Arguments:

- `--sector`: `node <skill>/scripts/draw.mjs --list sectors`. Pick the closest.
- `--sections`: roles from `--list roles` (features, showcase, how-it-works, testimonial, proof, stats,
  pricing, faq, cta, footer, intro, about, work, gallery, list, contact). The hero is implied.
- `--tone` (optional): quiet, bold, warm, technical, playful, luxury, editorial. Only pass it when the
  brief clearly asks for one.
- `--have`: assets that really exist, comma-separated: `photography` (the project's own photographs of
  the place, people or work), `product-photo` (photographs of the specific product, or an image tool
  that can make them), `product-ui` (real screenshots), `illustration`, `video`. Leave it out if you
  have none: the draw then avoids compositions that depend on them and the sheet says how to fill
  picture slots honestly (software shows its own interface built in HTML; a product with no photographs
  is drawn and set among real pictures of its world, never a fake product shot). Pictures you will
  find in the open collections are not the project's own; leave them out of `--have`.
- `--keep palette,type`: when the brand already fixes colours or typefaces. The draw then deals only
  the composition, and you map the brand's values onto the roles.

The sheet is the art direction for this build:

- **Adopt it.** Do not blend it with the layout you would have made anyway. If it feels unfamiliar,
  good: the familiar layout is the one this skill exists to prevent.
- Redraw one slot only for a reason you can state: it contradicts a stated brand constraint, or needs
  an asset that does not exist. Never redraw to get something more comfortable. Record every redraw in
  your report.
- When a dealt section cannot hold the real content (it compares three plans and there is one price;
  it wants five quotations and there are none), do not bend the content to fit. List the others with
  `--alternatives <role>`, pick the one whose assumptions match the content, and take it with
  `--redraw section:<role>=<id>`.
- **Check the palette against the subject.** A dealt palette is a set of proportions (one ground, one
  ink, one accent, fields) as much as a set of colours. If its colours fight the subject's own material
  (candy pastels for a peat whisky, neon for a mountain hut), redraw the palette once; if the subject
  has unmistakable colours of its own (its material, the paint of its street, the landscape outside
  its windows), keep the dealt proportions and take the colours from the subject instead, and say so
  in the report.
- Reprint it any time with `--show`. In a long session, re-read it before each section you build.

## Step 4. Find the idea {#step-4}

The direction is a way of composing. The idea is what makes the page belong to this subject and no
other. Fill both blanks from the subject itself before you build.

Places to look for the first blank:

- **Its output.** What does the thing produce? Put the real output on the page as material. (A camera
  that prints poems delivered its copy as paper slips.)
- **Its object or shape.** What does it physically look like, in cross-section, in silhouette?
  Enlarge it, crop it, make it the frame or the one motif.
- **Its name.** Can the letters hold a photograph, stack into a wall, split to two corners?
- **Its place.** Is there one view that makes someone want to be there?
- **Its ritual.** Is there a sequence the page can perform as it scrolls?
- **Its artefact.** What printed thing already exists in its world: ticket, menu, label, receipt,
  invitation, folder, manual?
- **Its opposite.** Which other category owns the feeling this one lacks?

Fill the first blank from your inventory (step 1), not from the category. **The competitor test:** put
the nearest real competitor in the sentence (the bakery two streets away, another oak furniture maker,
another hut on the same mountain). If the sentence still works, the idea belongs to the category: a
loaf of bread is every bakery; the seven doors of the street this one is named after are only this one.
"Clean and modern" is not an idea. The sites the study's panel scored lowest were the ones whose idea
was recorded as "none beyond the standard formula".

**One live thing.** Give the page one thing the visitor can do, or that is different for each visit,
made from the idea: pick a wood and see the chair in it; type your name and see it cut in the
foundry's letters; set the loan and read the real monthly figure; see whether the hut's stove is lit
right now and how long until the last ferry; choose a size and see it against the room. In blind tests
every winning page had one and the jurors named it first. Rules: it uses the subject's real content, it
works on a phone with a thumb, it has a plain fallback without script, it never blocks reading, and it
is one thing, not a playground. It is built in step 6 as part of the page, not added as motion in step 9.

**The scenes carry the idea too.** The scroll scenes on the sheet are devices waiting for a subject.
Decide what each one shows from your inventory before building: the fly-through passes through this
studio's own title cards, the route is the road this shipment really takes, the picture that opens to
the whole screen is the room the guest will wake up in. A scene filled with pictures that could belong
to anyone is a screensaver.

## Step 5. Write the words {#step-5}

Write the whole page as a copy deck (plain text) before markup, following `references/copy.md`:

- **Every headline fits in two lines or fewer at every width.** Do the arithmetic in copy.md §2 before
  committing to a sentence: about 32 characters is safe everywhere at a confident size. The studied
  gallery heroes have a median of 5 words and 32 characters.
- One supporting sentence, directly under the headline (32–48px below it) and shown with it, never
  docked at the foot of the first screen or held back by an animation. When the headline is a name or
  a figure of speech, this sentence says plainly what the thing is. One primary action, named for what
  it does, as a real button on the first screen.
- **The first screen answers the visitor's first question in large type.** For an event: what it is,
  when and where (the dates belong in the headline or at the second size, never only in small text).
  For a product: what it is and what it costs or does. For a person: who and what they do. Every
  section the visitor came for (the line-up, the menu, the rooms, the price) has its own heading and
  its own place in the navigation.
- **Write the full content.** Every section the brief asks for delivers its information completely:
  the whole menu with prices, each room with its own details, every speaker and talk, the price with
  what it includes, an answer for each real question. Thin sections are the commonest reason a clean
  page loses to a busier one.
- Sample details are expected where the brief leaves gaps (dish names, room names and rates, project
  titles) so the design is seen at full density; list them in the report for the client to confirm.
  Proof is never invented: no customers, quotes, reviews, press, logos or business statistics.

## Step 6. Build it, still {#step-6}

Build the page with motion switched off in your head; a page that needs animation to look finished is
not finished. Order of work:

1. **Tokens.** Colour and type roles from the sheet as CSS custom properties. Everything downstream
   references tokens only. `<skill>/assets/base.css` is a neutral foundation you may start from (reset,
   token names, fluid type steps, grid, focus and selection styles, the motion helpers); it has no look
   of its own.
2. **The hero, exactly as the blueprint describes it,** at desktop and at phone width. Get the big
   thing big and the small things small before anything else exists.
3. **Each section from its blueprint,** with this project's content. Keep the geometry, change the
   subject. Neighbouring sections must not share a layout. **Carry the idea into every section,**
   pricing, FAQ and footer included: the commonest failure in the study, even among good sites, is a
   distinctive first screen followed by stock blocks.
4. **Imagery,** in this order of preference:
   1. the project's own;
   2. generated, if you have an image tool;
   3. **real pictures of the subject's world from the open collections,** whenever an honest one
      exists. Search them with `node <skill>/scripts/assets.mjs "<query>"` (Openverse, Wikimedia
      Commons, the Art Institute of Chicago and the Met; only licences that allow commercial use, by
      default). Search the inventory, not the category: its street in old postcards, an old map of the
      neighbourhood, its material up close, its trade in engravings, a museum object of its kind, a
      botanical plate, a star chart. Use them large and with intent: one archival photograph as the
      hero, an engraving enlarged into the page's motif, the real map of the street as the contact
      section. Look at each before choosing; `--get <ref>` downloads it into `assets/` and records
      its source and licence, and `--credits` prints the credit line for the footer. A found picture
      shows the world around the client and is never presented as the client's own product, room,
      dish, person or team;
   4. **drawn in code from the subject itself,** for what no honest picture exists of (its objects,
      its tiles, its windows, its product's interface, made as one consistent flat graphic language in
      the palette's real colours);
   5. the photographs dealt on the sheet, only where an honestly generic picture fits (the sea for a
      sea house), never as a stand-in for the subject;
   6. type and colour alone.

   When the project has footage or a real picture of its own process or product, the first screen
   shows it, large (about 40% of the screen or more). Never write a sentence on the page about where
   the pictures come from or what they are not ("none of these shows our bar"): a caption says what
   the picture is, and the credit line sits small in the footer. A portfolio whose work is invented
   for the brief draws each piece as a finished still of that work (its title card with its own type,
   an end frame, a poster), with real detail, never as a pictogram of the client's product.

   **The floor, which the inspector checks:** at least four real pictures on the page, usually six to
   twelve (photographs, archival images, maps, engravings, footage, raster artwork; for software, its
   cropped interface fragments count too). SVG drawings do not count toward the floor: draw what no
   picture exists of, and still carry real pictures. Add one moving picture wherever an honest clip
   exists: search it with `assets.mjs --video "<query>"` and use it as a muted loop with a poster
   frame. Models skip pictures and footage because finding them is work; the page fails without them.

   `references/imagery.md` covers searching, licences and credits, video, drawing, crops and treatments.
5. **The live thing** from step 4, built into the section where it proves the claim (often the hero
   or the booking), with real content, a thumb-sized phone version and a plain fallback.
6. **The scroll scenes,** when the sheet deals them (the rest of the motion layer is step 9), each
   with the section it carries: the page's big moments, the camera that flies through the work, the
   picture that opens to the whole screen, the word that buckles under the scroll. Copy the shared stage
   and the scene's files from `<skill>/assets/scenes/`, fill the scene with this project's own pictures
   and words, and set the page's tokens so it takes the page's look. A scene is composition: it decides
   how long the page is and what each screen shows, so it is built now and seen in every look round, not
   added at the end. `references/scenes.md` says how to put one on a page, fill it, fit it and check it;
   `assets/scenes/demo/<id>.html` is a working example of each.
7. **Fullness.** Look at each desktop screen as a poster: one dominant thing and the content it
   carries. A screen that is mostly empty ground is an underbuilt section, not a rest; one deliberate
   rest per page is the limit, and the inspector fails a page with two or more near-empty screens.
   Running text is in the full ink at 16px or more; grey is for secondary notes.
8. **The frame.** The page has one pair of equal outer margins at every width, and every section uses
   the width the page has set up: when its text sits in the left half, the right half holds its
   picture, its second column, its list or its figure, never nothing. Asymmetry lives inside the grid,
   never in the frame: a void is placed only when something closes it on the far side. No stretch of
   the page taller than about half a screen holds nothing at all; sections are 120–240px apart on
   desktop. Every section the visitor came for opens with a heading that names it, and the first
   screen carries the page's title in an `h1`. These are what readers name first when a page looks
   wrong ("no clear title", "random empty space", "everything is pushed to one side"), and the
   inspector measures each of them.
9. **States and semantics.** Real links and buttons, visible focus, alt text, a phone layout that is
   its own composition.

Read `references/type.md`, `references/colour.md` and `references/layout.md` when you need the detail
behind a decision; the laws in SKILL.md are the short form.

## Step 7. Gate {#step-7}

`lint.mjs` scans source for banned patterns and stock phrases. `inspect.mjs` opens the page in a real
browser at 1440, 768 and 390 pixels, measures it (headline line counts, type sizes, fonts actually
loaded, colours, rules, shadows, gradients, contrast, overflow, and the frame: equal margins, sections
huddled on one side, blank stretches, the title, untitled sections, text against the screen edge) and
saves screenshots to `.taste-skill/inspect/`. The inspector serves local files over a throwaway local
server; if the page must also open straight from the file system, open `index.html` that way once
before you finish.

`scenes.mjs` photographs every scroll scene at 0, 10 … 100% of its hold, on desktop and on a phone,
and the reduced-motion page; with scenes on the sheet, `inspect.mjs` also films the whole scroll
(`desktop-film-NN.jpg`). A scene that never started or rests on desktop is a `FAIL`.

## Step 8. Look {#step-8}

Passing the gate means nothing banned was measured. It does not mean the page is good. Open the
screenshots the inspector lists (every viewport, with your image viewer or Read tool) and critique them
with `references/critique.md`: the fourteen passes, the Awwwards-weighted score, the caps. Write the
critique down in its format, fix the top three problems, run the inspector again, look again. Three
rounds at most.

Judge only the pictures. If a problem is visible in a screenshot, it is real, whatever the code says.

## Step 9. Move {#step-9}

Build the motion layer. It is required, and it is more than one fade: the inspector counts the elements
that really move while the page loads and is scrolled, and fails a page under eight (it warns under
sixteen). Any scroll scenes are already built (step 6); around them the layer has four parts:

1. **The signature move** named on the sheet: one, done well (a dealt scene can be it).
2. **An entrance for the parts of every section:** the heading, then the text, then the picture,
   staggered by 60–90ms, rising 16–32px with opacity, triggered once as the section enters. Not one
   fade for the whole block, and never content that stays hidden if the script fails.
3. **Feedback on every control:** press, hover and focus on buttons, links, cards and the live thing.
4. **One moving picture:** a found clip as a muted loop, a slow scale or drift on a photograph, or a
   scroll-linked move on the hero picture.

Transform and opacity only; every move has a `prefers-reduced-motion` fallback that keeps the content
and drops the travel. A move that changes the colour or the layout of whole screens (colour by
chapter, a pinned story) is part of the composition, so build it in step 6 and let every look round see
it. `references/motion.md` has the tokens and tested recipes. Then run the inspector once more and check
every screenshot for content that failed to appear.

## Step 10. Report {#step-10}

Do not report until all of these are true; each one was skipped in a test run that came out badly:

- `inspect.mjs` shows **0 FAIL** at 1440, 768 and 390, on the final version of the page.
- You opened every screenshot it listed after the last change, not only the first screen.
- With scroll scenes: `scenes.mjs` ran on the final page with no problems, and you read every sheet
  (desktop, phone, reduced motion).
- A stranger reading the first screen for five seconds can say what this is and what to do.
- Every section has a heading; the margins match on both sides; no stretch of the page is empty.
- The critique of your last round is written down in the shape of `references/critique.md` §4.

Tell the user, briefly: the direction dealt (name and seed) and any redraws with reasons; the idea
sentence and the live thing; the final scores from your last critique round and what still falls short;
every found picture and clip with its title, creator, licence and source page (`assets.mjs --credits`
prints the list) and where its credit sits on the page; which bundled photographs and which drawings
stand in for photography (so they can be replaced); and any sample content that must be swapped before
launch. Do not claim a check you did not run.

## Special cases: redesign, restyle or review {#redesign}

1. **Record the before.** Run the project as it is and inspect it into its own folder
   (`inspect.mjs <url> --out .taste-skill/before`, with `--app` for an app screen) and lint its
   source. Read the code: the framework, the styling method (Tailwind v3 or v4, CSS modules,
   styled-components, plain CSS), the components, and what must survive: routes, forms, data,
   behaviour, the brand's own assets.
2. **A review stops here.** Critique the before screenshots with `references/critique.md`, list the
   findings with the inspector's measurements, and name the three changes that would move the page
   most.
3. **Keep the stack, the content and what works.** No framework or styling-library migration; check the
   dependency file before adding anything. A restyle keeps the layout and takes type, colour and
   components from a dealt direction (`--keep` whatever the brand fixes); a redesign deals a full
   direction and rebuilds the sections from its blueprints inside the existing components. Either way
   proceed from step 2 of the run with the page's real content.
4. **Order of work, biggest effect for least risk:** type (faces and scale), colour (one ground, one
   ink, one accent), the frame (margins, section rhythm, a title on the first screen and a heading on
   every section), states (hover, focus, loading, empty, error), then the stock components (icon
   cards, pill badges, gradient blobs, card grids) replaced by the dealt blueprints.
5. **Prove it.** Inspect again into `.taste-skill/after`, compare before and after at every width,
   click through every link, form and menu that worked before, and report the before and after
   measurements side by side.
