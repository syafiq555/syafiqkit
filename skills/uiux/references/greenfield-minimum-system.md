# The minimum design system for a new build

Read this when there is no app language to inherit. The aim is the smallest set of decisions that keeps every later screen consistent without anyone re-deciding them.

## Decide these first

**Typography.** One typeface, two at most. Prefer a variable font or one with five or more weights, so hierarchy comes from weight and size rather than from a second face. Build a type scale from a ratio (1.125 to 1.25 is the usual range) and name the steps by role — display, heading, label, body — not by size, so a component asks for "label" and never for "13px".

**Spacing.** An 8px base unit. Three ranges cover most layouts: small (0 to 8px) inside components, medium (12 to 24px) between related elements, large (32 to 80px) between sections. Every margin and padding is a step on that scale; anything off-scale is a decision to justify. The scale's density is picked from the job, not inherited: a data-dense dashboard and a marketing page do not share one, and choosing the dashboard's tight steps for a landing page (or the reverse) is the first thing a user notices without being able to name.

**Colour.** Tokens with semantic names (`surface`, `text-muted`, `danger`) that point at palette values, never raw hex in components. Give each hue a full ramp of around ten shades so that hover, disabled and dark-mode variants exist before they are needed. HSL makes those ramps easier to derive than hex. Light or dark as the default is a decision keyed to how the product is used, never a taste call: long sessions, low ambient light and dense data argue for dark; short visits, reading and forms argue for light. A dark default on a product that is read rather than monitored is the commonest way a new build looks like a template.

**Tokens before components.** Colour, type and spacing tokens are the single source of truth; components consume them. This is what makes a later "modernise within" pass cheap: the tokens change, the components follow.

**Start from a mature library.** Material 3, Polaris, Chakra, shadcn or the framework's own system, customised through its tokens. A custom library is a later decision, taken when the product's needs outgrow the base. Add components only when a screen needs them; a system that ships twenty unused components is a maintenance bill.

**Grid and breakpoints.** Decide the column grid and the mobile-first breakpoints once. `min-width` queries, so the phone layout is the base and wider screens are enhancements.

## Keep it consistent afterwards

Every new screen is checked against the tokens, not against the last screen built. When a screen needs a value the scale lacks, extend the scale rather than the screen. GOV.UK's practice of publishing a component only after it has been tested with users is the model for adding to the system: a component earns its place by being needed and shown to work.

None of that holds unless the decisions are written where the next session reads before building. Put them in the project's frontend conventions doc — the file the brownfield branch of the skill looks for first, `frontend/CLAUDE.md` unless the project already keeps its conventions elsewhere — as the tokens, the typeface, the breakpoints, the library and the mode, with the reason for each. On a greenfield brief that file does not exist yet; create it through `update-claude-docs` rather than inventing a design-system file of your own shape, since a doc nobody's CLAUDE.md hierarchy loads is a doc the next session never reads. Then a later screen that genuinely needs something different records it in the same doc as a named deviation ("the print view uses a 12px label step because …"), so the deviation stays visible as one rather than silently becoming a second rule that the screen after it inherits. The same deviation recorded a second time is not a deviation but a gap in the scale: extend the scale, and fold the entries back in. A design system that lives only in the first screen's CSS is re-derived, differently, by whoever builds the second.

## Sources

- Spacing scale and ranges: https://atlassian.design/foundations/spacing
- Foundations overview (colour, type, grid): https://atlassian.design/foundations
- Typeface count, weights, variable fonts: https://www.untitledui.com/blog/best-free-fonts (advice only; its figures are opinion)
- Palettes and hierarchy: https://refactoringui.com/
- Research-backed component adoption: https://design-system.service.gov.uk/get-started/
- Persisted source of truth with page-level overrides, density keyed to dashboard vs marketing: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md (its Step 2b and `--density` dial; the script is theirs, the practice is what is adopted here)
- Mode as a per-product decision ("dark mode by default" and "light mode default" each listed as an anti-pattern for different product types): https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/src/ui-ux-pro-max/data/ui-reasoning.csv
