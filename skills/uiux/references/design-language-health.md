# Is the existing design language healthy?

Read this when the app has a language and the job is to decide whether to work inside it, modernise it, or propose leaving it. The verdict is a finding with a blast radius, not a licence: a polish request never starts a migration.

## Signals, by layer

A dated system shows itself at three layers, and each layer has its own repair. Judge them separately, because a healthy visual language can sit on a dead library and a modern library can be used inconsistently.

**Visual language** — hardcoded colours and pixel values where tokens should be; spacing with no scale (13px here, 18px there); one border-radius and one shadow on everything regardless of hierarchy; dense tables with no visual hierarchy; two or three typefaces doing one job; icons from more than one family at mixed sizes.

**Component library** — components with local overrides drifting from the base (the same button styled four ways); a Bootstrap-3-era grid or float layout; utility classes and component classes fighting; no consistent states (hover, focus, disabled) across components; a library with no dark-mode or reduced-motion story where the product needs one.

**Framework and tooling** — DOM wired by jQuery selectors alongside a component framework; no bundler, so no code splitting and no dead-code removal; fixed-pixel layouts with no responsive units; no `prefers-reduced-motion` handling anywhere; a build that cannot produce a modern output target.

Confirm the stack from what *loads* it — the layout's script tags, the entry point, the actual import sites — not from a manifest. A declared dependency is routinely installed and never wired.

## Verdict routes

- **Keep.** The language is consistent and its tokens exist. Work inside it. Departures are named and justified.
- **Modernise within.** The visual layer drifts but the library is sound. Introduce tokens *beside* existing values, not as a replacement; new work uses tokens by default and old screens migrate one at a time. Normalise spacing scale, radius, shadow and icon family first, since they are the cheapest and most visible fixes.
- **Migrate off.** The library or framework blocks the product's needs (responsive layout, accessibility, performance). Propose the strangler shape: the new library or framework runs beside the old, one low-risk screen moves first, a route or feature flag decides which version serves, and the old one is removed only when nothing routes to it. Name the first screen and what "done" looks like for it.

A framework or tooling verdict has the largest blast radius, so state it as a proposal with its cost, and take execution to `brainstorming` as its own task. The uiux skill's job is to notice and name it before designing on top of it, and to get it into the project's task doc at wrap-up (`/done` captures it) so the next session inherits the finding rather than rediscovering it.

## Sources

- Audit shape (token binding, component drift, maturity classification): https://github.com/edenspiekermann/Skills/blob/main/skills/audit-design-system/SKILL.md
- Token-first, incremental migration of a live UI: https://developer.android.com/develop/ui/compose/designsystems/material2-material3
- Strangler pattern for frontends: https://www.future-processing.com/blog/strangler-fig-pattern/ and https://altersquare.io/how-teams-incrementally-modernize-large-frontend-codebases/
