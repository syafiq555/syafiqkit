# Template for docs/DESIGN.md

The design system in the [Google design.md format](https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md): YAML frontmatter carrying machine-readable tokens, then up to eight markdown sections in a fixed order. **Tokens are normative; prose says how to apply them.** The canonical, fuller procedure is `uiux/modules/impeccable/reference/document.md`; this file owns the shape and when the doc exists, that one owns the extraction and interview steps.

## When it exists

Any project with a UI. A project with none (API, CLI, library) skips it and says so in CLAUDE.md.

| Situation | Mode | What gets written |
|---|---|---|
| Code with tokens, components or rendered output | **Scan** | Frontmatter from the real tokens, all sections that apply, plus the `.impeccable/design.json` sidecar |
| Greenfield, no code yet | **Seed** | The seed marker line, frontmatter with `name` and `description` only, the sections the chosen direction settles, no Components section, no sidecar |

Seed needs the PRD first (users, purpose, platform), since a visual world with no product truth behind it is invented. Re-run in scan mode once code exists. An existing DESIGN.md is never overwritten silently: show it, then refresh, overwrite or merge.

## Who reads and writes it

`uiux` reads it before any UI work. Its `impeccable` module's `init` writes the PRD (never this file) and its `document` command writes this file and the sidecar. CLAUDE.md, and the frontend CLAUDE.md where there is one, points here and says UI work reads it first. A screen that needs a value the doc lacks records a named deviation in the doc, not a second rule.

## Frontmatter

Only tokens the project actually uses. Colors take any valid CSS colour string; keep the project's canonical format and never restate a token with another value in prose.

```yaml
---
name: <project title>
description: <one-line tagline>
colors:
  primary: "#b8422e"            # key = descriptive slug, not blue-800
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
spacing:
  md: "16px"
components:
  button-primary:               # variants are sibling keys: -hover, -active
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "16px 48px"
---
```

- Token references are `{path.to.token}`. Components may reference primitives; primitives may not reference each other.
- Component props are limited to `backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`.
- Only `colors`, `typography`, `rounded`, `spacing` and `components` are top-level groups. Shadows, motion and breakpoints go in the sidecar's `extensions`.

## Body sections

Exact headings, in this order. Omit a section that does not apply rather than inventing rules; never rename one, because tooling parses the headers.

```markdown
# Design System: <Project Title>

## Overview
**Creative North Star: "<named metaphor>"**
2-3 paragraphs: personality, density, philosophy; confirmed visual rejections only. End with **Key Characteristics:** bullets.

## Colors
Palette character in a sentence, then Primary, Secondary, Tertiary (only if real) and Neutral, each as **Descriptive Name** (value): where and why it is used. Named Rules ("The One Voice Rule. ...") where they help.

## Typography
Display, body and label families with fallbacks; Character line; Hierarchy (role, weight, size, line-height, purpose).

## Layout
Grid or spatial model, containers, density, responsive changes and the spacing rhythm. Mobile-first behaviour and breakpoints are stated here.

## Elevation & Depth
Shadows, tonal layering or both. If flat, say so and say how depth is conveyed.

## Shapes
Radius strategy, borders, clipping, recurring silhouettes.

## Components
Per component: a short character line, then shape, colours, states (hover, focus, error, disabled) and distinctive behaviour. Only components the project has.

## Do's and Don'ts
Concrete guardrails grounded in the incumbent system or the owner's chosen world, each led by "Do" or "Don't" with exact values where established.
```

Seed form leads the file with `<!-- SEED: established with the user before implementation; re-run document once there's code to capture the actual tokens and components. -->` and marks unresolved values `[to be resolved during implementation]`.

## Writing it well

- Descriptive first, value in parentheses: "gently curved edges (8px)".
- Say where and why a token is used, not only what it is.
- Strictly visual: product truth, page strategy and surface concepts stay in the PRD or a surface brief. A binding brand commitment is cited from the PRD, not copied.
- One format per token. Do not extract every value; stop at what is reused.
- `[SOURCED]` / `[INFERRED]` / `[TBD]` tags follow the skill's rule: a value read from code is sourced, a character line proposed by the writer and unconfirmed is inferred, and a pruning pass must not strip them.
