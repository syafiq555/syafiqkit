---
name: user-manual
description: >
  Write or extend an END-USER manual — a guide for the people who use the product, not the people who build it. Fires on "write a user manual", "buat guide", "we need a guide for the dealers/customers/staff", "document how to use X", "make a manual for the new module", and on requests for a shareable Word or PDF edition of one. Also fires when someone reports an existing guide is wrong in shape: "this reads like a reference not a manual", "there are no steps", "it's just a QnA", "where are the screenshots". Covers scoping against what users actually do, capturing screenshots from the E2E suite rather than by hand, and building .docx/.pdf editions. NOT for internal engineering docs (that is task-summary), NOT for CLAUDE.md instruction files (update-claude-docs), and NOT for plain format conversion of a document whose content is already settled (md-to-pdf).
---

# User Manual

A manual is judged by whether a reader finishes a task, so it is organised by what they came to do — not by what the product contains. Get the scope and the shape right first; the file format is the last and cheapest decision.

## Scope from what users do, not from what you just built

The trap is documenting the slice of the product you have most recently been working in. That produces a guide that is internally coherent and covers a fraction of the user's day, and nothing about it looks wrong from the inside.

Enumerate the surfaces the user actually reaches — their real navigation, not the routes you happen to know — and check the list against whatever the *client* asked for, where such a statement exists. A requirements message, an activity list, a scoping doc: that is the spec, and it usually names things a feature-shaped reading misses. Where the product replaces something (a spreadsheet, another system, a phone call to head office), a short "what moved, and where it is now" table near the front is often the single most valuable thing in the document.

Then verify each surface is live and populated before writing a word about it. A manual describing a screen the reader cannot open is worse than no manual, and deployment claims in internal docs decay silently — check the running system.

## Shape: tutorials, then task lookup, then reference

These three are different modes and mixing them serves none of them. Diátaxis (📖 https://diataxis.fr/) is the standard treatment and worth reading once.

**Tutorials** are followed start to finish by someone new, in order, on a single path. **Task sections** answer one question for someone who already knows their way around. **Reference** is looked up, mirrors the product's own structure (the menu, the API surface), and stays austere.

Lead with two or three tutorials, since that is what a first-time reader needs and what the rest of the document can then assume. A section that only describes a screen has skipped the tutorial layer, however good the description is.

**A tutorial step is one action, one sentence.** Microsoft's authoring research (📖 https://learn.microsoft.com/contribute/content/style-quick-start) finds a reader takes the first sentence, acts on it, and misses the rest — so a trailing explanation in the same step is invisible. Put the action in the step and the explanation beneath it. The same source treats a procedure past ~12 steps as too long: split it.

**Headings name the task, not a question.** "Checking your available credit" reads as a manual; "Can I still place an order?" reads as an FAQ, and a document of those is a support page rather than a guide.

**End each journey on what to do about what was found.** The moment a reader most needs the manual is when the answer is bad news — over the limit, blocked, payment missing. A section that stops at "here is the screen" abandons them exactly there.

## Screenshots

Capture them from the E2E suite rather than by hand: a spec regenerates them as the UI moves, where hand-taken images rot silently and nobody notices until a reader is looking at a screen that no longer exists.

Write a **dedicated capture spec** rather than reusing the regression specs. Those exist to assert behaviour and their screenshots are incidental — commonly `fullPage: true`, which composites a fixed sidebar over the page heading and is fine as a test artifact but unusable in a document. Take viewport shots, after the network settles and scrolled to the top.

Two things decide whether the images are worth having:

**Write to a path that is actually committed.** Test-output directories are usually gitignored, so shots landed there vanish from the commit and the manual ships with broken images. `docs/<thing>/images/` works.

**Fixtures are often empty, and an empty screen teaches nothing.** A list rendering "no records found" shows layout and no content. Look for an account with real data, and prefer the state that shows the interesting case — a blocked order, a populated cart, an error banner — over the happy path.

⚠️ **Open every screenshot before writing prose around it.** A spec that passes proves the page returned 200, not that the image communicates: it can be mid-load, mid-animation, or of a screen that isn't what its route name suggested. Reading them also corrects your own model of the product — a screen labelled "purchase orders" may turn out to be a different journey than the one you assumed, and describing them as one thing sends readers to the wrong menu.

## Word and PDF editions

Generate them from the Markdown; never maintain a second copy. The formal apparatus a printed manual carries — title page, revision history, numbered chapters and figure captions — belongs in a build script rather than in the source, which stays readable on its own.

`pandoc` handles `.docx` including embedded images: `--toc --number-sections --reference-doc reference.docx`, where the reference doc comes from `pandoc -o reference.docx --print-default-data-file reference.docx` and controls the Word styling. For PDF, `md-to-pdf` with a print stylesheet; add explicit page breaks so a step list never separates from its screenshot.

Strip in the build what only makes sense on a doc site: `{#anchor}` syntax renders literally, in-page links go nowhere in print, and a hand-written contents list duplicates the generated TOC. Add generated intermediates to `.gitignore`.

Skip the regulated-industry apparatus — approval sign-off blocks, document classification markings, control numbers — unless the manual is genuinely entering a compliance process. On an ordinary product guide it reads as theatre.

⚠️ **A build reporting success is not a document.** Unzip the `.docx` and confirm what landed: `word/media/` holds the images, `word/document.xml` holds the TOC field and the heading hierarchy. A missing-image `.docx` opens fine and looks complete until someone scrolls.

## Verify before handing over

Check every image path resolves and no image is orphaned; both fail silently. Re-run the capture spec from an empty directory to prove it reproduces exactly the set the manual references — that is what stops the images rotting.

Say plainly whose data the screenshots show. Fixture figures in a guide going to real customers is a judgment call for the user, not a detail to leave implicit.
