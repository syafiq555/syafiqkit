---
name: help-centre
description: >
  Build an in-app HELP CENTRE for a big system, or convert an existing user manual into one: the
  guides served inside the product to its logged-in users, one page per task, a book per reader role,
  server-side search and the command palette, and a "Help for this screen" link on every covered screen.
  Fires on "help centre", "help center", "in-app help", "a knowledge base inside the app", "help for
  this screen", "put the guide in the system", "drop the PDF, show it in the app", "the manual is too
  big", "nobody can find anything in the manual", "which part of the manual is for me", "convert the
  manual into a help centre", "per-role guides", "context help", and on keeping such a help centre in
  step with screen changes. Any stack (Laravel, Rails, Next.js, Django). NOT for writing the guide's
  content from scratch for a small system, or a Word or PDF manual handed over for sign-off
  (`user-manual`), NOT for a public docs site's content (`user-manual`, then a static site
  generator), NOT for UAT checks (`uat-script`).
---

# Help centre

A user manual and a help centre carry the same Markdown; what differs is how readers reach it and how it stays true. A manual is read as a document. A help centre is reached mid-task, from the screen the reader is stuck on, by someone who reads only their own part, in a product that changes every release. So the build is mostly routing (who reads which book, which screen points at which task) and upkeep, not prose.

## Manual or help centre: decide by size {#manual-or-help-centre}

Judge it from the system, not from taste:

| Signal | Points to a manual (`user-manual`) | Points to a help centre |
|---|---|---|
| Reader roles | One audience | Several, each reading a different part |
| Screens readers reach | A handful | Dozens, many with their own task |
| Change rate | Settles after launch | Screens change every release |
| Who reads it | People without accounts, or the client's sign-off | The app's own logged-in users |
| How it's used | Read once, start to finish, or printed | Looked up mid-task, searched |

A small system served as a help centre spends a parser, routes and tests on twenty pages nobody searches; a big system served as a manual gives every reader a long file mostly about other people's jobs. A manual that has grown into the right column is converted, not rewritten: the signals are "I can't find anything in it", "which part is for me", and support questions about screens the manual already covers.

A **public** guide, or one for people with no account, is neither: write it with `user-manual` and publish it on a static docs site (Starlight, Docusaurus, MkDocs), since serving one inside the app adds a login nobody needs.

## Content shape for a help centre {#content-shape}

Write each page per `user-manual` (📖 `../user-manual/SKILL.md` § Shape, § Screenshots): tutorials first, tasks named by what the reader does, one action per step, screenshots from an E2E capture spec. Three things change once the guide is served page by page:

- **Every page stands alone**, since a reader arrives on it from a screen or a search, not from the page before ("any page is as likely as another to be the first page the reader sees", Mark Baker's Every Page is Page One, 📖 https://idratherbewriting.com/2011/05/16/every-page-is-page-one/). Say which role it is for and what must be true first, rather than "as above".
- **A heading's `{#anchor}` is a public address.** Screens, the command palette, UAT sheets and sent messages link to it, so renaming one breaks every link silently. Name task anchors with a stable prefix (`task-assign-roles`) and change them only together with everything that points at them.
- **One book per reader role**, each a single Markdown file (or folder) whose heading levels the parser trusts: parts, then roles, then tasks. A shared glossary is written once and appended to every book.

## Converting an existing manual {#converting}

The usual path, since a system tends to start small. Keep the Markdown; change what serves it.

1. Split the manual into one book per reader role, keeping every heading's anchor where the content is unchanged.
2. Check where links into the manual already point (UAT sheets, emails, the old PDF's section names) before any anchor moves.
3. Move the guides to where the production artifact can read them, and repoint every tool that read the old path (📖 `references/server-and-screens.md` § Before building, measure the deploy).
4. Keep the Word build if a client still signs off a document; drop the PDF only when asked.

## Decide before building {#decide}

Record these in the plan; each changes the build:

- **Which role reads which book**, as a small matrix. One book for everyone skips the books layer; a role reading several books (staff reading the seller guide to help a seller) needs book-scoped URLs; a reader who must never see another role's procedures is enforced on the server, not hidden in the menu.
- **The file layout and heading levels the parser trusts**; a test fails when a guide's levels stop matching.
- **One language assumed**; a second language is a book per locale.
- **Whether a new screen must have a "Help for this screen" entry**: either a test that fails on a page route with no entry and no explicit "no help" marker, or a written rule (§ Upkeep). This is the user's call; ask it.

## Build order {#build-order}

1. Move the guides where the production artifact can read them.
2. Parser and sections, with a unit test on a fixture guide.
3. Access guard and the authenticated image route.
4. Pages: home, article, contents. This is the smallest slice worth shipping.
5. Search, then the command palette's quick find.
6. The "Help for this screen" map and its link in the shared page header.
7. Tests over the real guides and the e2e spec, then the design pass.
8. Retire the PDF half of the build, if asked.

📖 **`references/server-and-screens.md` before step 2**: parsing and sanitising, one page per heading, books by role on the server, link rewriting, the parse cache's version key, search scoring, the context map's matching rule, and the screens. 📖 **`references/verify.md` before calling it done.**

## Upkeep is the product {#upkeep}

A manual goes stale where someone notices; a help centre goes stale behind a "Help for this screen" link that still works and lands on the wrong steps. Nothing automatic compares a guide's prose with the screen it describes (docs-as-code puts guide and code in one change, but git "could not tell you which untouched documentation should have changed too", 📖 https://slite.com/learn/docs-as-code), so the guard is a rule in the place builders read, plus tests for the parts a machine can check:

- **Write the rule into the target project's CLAUDE.md as part of the build**: a change to anything a reader sees updates its guide task, and its context-map entry, in the same piece of work; an anchor is a link address; a parser change raises the parser version constant or the cached old rendering keeps being served. Where the project keeps UAT checks that name guide sections, the same rule covers them.
- **Tests that run over the real guides** catch the mechanical drift: a broken in-guide link, a missing image, a map entry whose route or anchor no longer exists (📖 `references/verify.md`).
- **Screenshots come from a capture spec**, re-run when a screen changes, with the image folder diffed against what the guides reference.

## Report {#report}

The role-to-book matrix, how many screens the map covers and which are unmapped, where the guides live and how to edit them, and the CLAUDE.md line that now ties a screen change to its guide.
