# In-app edition: serving the manual inside the product {#in-app-edition}

Read when the manual's readers are the app's own logged-in users (staff, sellers, dealers, members) and the ask is "put the guide in the system", "a help centre", "help for this screen", or "drop the PDF". The Markdown stays the only source; the app renders it, and the Word copy (if anyone still needs one) is built from the same files.

Worked example: GB Mart (Laravel 13, Inertia 3, React 19), `apps/gb-mart/app/Domain/Help`, `widgets/help-centre`, `tests/{Unit,Feature}/Help`, `e2e/help.spec.ts` in the beacon-mart repo. Names below are that app's; map them to the target app's own layers.

## Choose the route first

| Route | Wins when | Costs |
|---|---|---|
| **Inside the app** (a route group rendered from the Markdown) | The guide is for logged-in users, books differ by role, the screens should link to their task | One parser, one page, a search; ships with the app |
| **Static docs site** (Astro Starlight, Docusaurus, MkDocs) | The guide is public, or for people with no account | Its own build and deploy, its own theme to keep matched; private access is extra work |

Research behind the default (20/11/2026): Starlight is static and public by default; serving it privately needs on-demand rendering (`prerender: false`, an SSR adapter), and its Pagefind search cannot be enabled then (https://starlight.astro.build/reference/configuration/, https://docs.astro.build/en/guides/on-demand-rendering/). Shopify, Stripe, Linear and EasyStore all run topic-and-search help sites that the app links into; none of those checked splits help by the reader's role, so a role split is your own build either way.

## Before building, measure the deploy

Check what the deployed app can actually read. A container that mounts or copies only the app folder never sees a repo-root `docs/` folder, so the guides move into the app (`resources/help/`), and every tool that read the old path moves with them: the Word build script, any UAT/manual drift checker, the screenshot capture spec's output folder, the repo's docs. Move with a plain `mv` (git still records the rename at commit) when other sessions are pushing from the same checkout, and wait for the owner of any uncommitted edit in the guide files before moving them.

If the repo's formatter covers Markdown (Prettier, `vp fmt`, dprint), add the guide folder to its ignore list in the same change, or the first push reformats or rejects the whole guide.

## Server

- **Parse with the app's Markdown library**, raw HTML stripped and unsafe links dropped (league/commonmark: `html_input: strip`, `allow_unsafe_links: false`, plus `AttributesExtension` so a trailing `{#anchor}` on a heading becomes its `id`). Guides written for pandoc may hold syntax the app's parser renders literally (`:::` divs, footnotes, `{.class}`); a test fails on it.
- **One page per heading**, split at the levels the guides use for parts, roles and tasks. Leaves show their body; a heading with children shows its intro and a child list. The `{#anchor}` is the page address, so anchors are now public identifiers: renaming one breaks every link to it.
- **Books by role.** Decide who reads which book (staff may read the seller book to help a seller; a seller never reads staff procedures) and enforce it on the server: the route group's own login guard, a gate for the help pages, and an image route that serves only files the requested book references, so a guessed file name for another book 404s. Anchors often repeat across books, so URLs carry the book.
- **Rewrite links at serve time**, per surface: `#anchor` to that book's article URL, `images/x.png` to the authenticated image route. Never put guide images under the public web root.
- **Cache the parse** keyed on each file's modification time and size **plus a parser version constant**; without the constant, a change to parsing or rendering keeps serving the old output until a guide happens to change.
- **Search on the server** over the parsed sections, query in the URL, never refusing a long or malformed query (scrub invalid UTF-8 and cap the length before it reaches a JSON response). Fold hyphens inside words when matching ("reship" must find "Re-shipping"), rank title hits first and the reader's own book above another, and build the snippet with the same folding or it starts at the top of the section. Strip inline tags without adding spaces when making the plain text, or snippets read "Click Print ." Use the guide's own example search terms as test cases.
- **"Help for this screen"**: a map of route name (exact, or a `prefix.*` group) to book and anchor, resolved for the current request and shared lazily to every page, rendered by the shared page-header component so no screen changes. Build the first map from each task's opening step and the app's navigation. Tests fail when an entry names a route or an anchor that no longer exists; nothing forces a new screen to have an entry, so the repo's "screen change updates its guide" rule gains "and its map entry".

## Screens

Inherit the app's existing design language: help is a support surface, not a new look. Compose existing atoms; where an atom can't do something (a guide-styled rich-text body, a sticky contents column), add a named variant so every existing caller renders unchanged.

- One `h1` per page: on an article the article title is the heading and the breadcrumb leads home; the guide's name heads only the home and search views.
- A contents column beside an app that already has a sidebar squeezes the article at tablet width: show it only from the large breakpoint and use a Contents button that opens the app's sheet below it. Give that button its own icon, not the menu icon.
- Don't repeat the contents tree on the home page if the home already lists the parts.
- Body text 16px on a phone, no sideways scroll, images lazy and linked to full size. Full-window screenshots read poorly on a phone: crop them to the step's area when recapturing.
- Feed help results into the app's command palette if it has one, as a separate request merged with `Promise.allSettled` so neither source hides the other.

## Verify

Server tests: access per role (including the refused cases and the image route), sanitising, every in-guide link resolving within its book, every referenced image existing, one section per heading, no pandoc-only syntax in the output, search ranking and limits, every map entry resolving. An e2e spec at phone and desktop width: open help from the menu, an article with a loaded image, a cross-link that navigates without a full reload, the Contents sheet, a search, the palette result, "Help for this screen" landing on its task, and the other role refused. Then the design pass on rendered screens at 375, 768 and 1280 in each colour scheme, every capture opened (`uiux`, `impeccable` critique).

If the PDF edition is dropped, take the PDF half out of the build script rather than leaving it unused, and say in the team post where the guides now live and how to edit them.
