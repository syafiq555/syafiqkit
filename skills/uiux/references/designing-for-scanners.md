# Designing for people who scan

Read this when a brief lists everything a user needs to know, or when a screen is complete and still gets reported as confusing. People do not read interfaces; they scan for the one thing they came for and act.

## How people actually look at a screen

Eye-tracking finds four patterns. The **F-pattern** (first lines and the left edge) is what people fall back to on a wall of undifferentiated text, and it is the least effective, because everything below the first paragraph is skipped. The **layer-cake** pattern (headings and subheadings, dipping into a chunk only when its heading earns it) is the most effective short of reading everything. Design for the layer-cake: chunk content under headings that say what the chunk contains, front-load the label with the word the user is looking for, and make links and buttons describe their destination rather than "click here" or "more".

## Hierarchy

- One bold figure or action per screen, the thing the user does in the first two seconds. Everything else earns its pixels after that.
- Rare actions go behind a menu; frequent ones stay visible. Completeness on the surface is clutter.
- A column that is all zeros, a relation nobody follows, an explainer sentence above a table: fold, hide or delete rather than style.

## Words

- Buttons: verb plus outcome ("Send invoice", not "Submit").
- Errors: what happened, why, what to do next. Never an apology alone.
- Empty states: what this is, what appears here once it exists, the action that makes it exist.
- Defaults over choices. A form that pre-fills the common answer asks one question fewer.

## Icons

- Only home, search and print are close to universal. Every other icon carries a visible label.
- Five-second rule: if it takes more than five seconds to think of an icon for a concept, an icon will not communicate it. Use the word.
- Labels sit beside the icon, never only in a tooltip.
- An emoji is not an icon: it renders differently on every platform and cannot be themed or sized by token. Structural icons come from one vector family at token sizes.

## Progressive disclosure

Show the common case first and reveal the rest on request. This works only when the split matches how users prioritise, which means the grouping is a decision to test rather than assume, and it can oversimplify: hiding a capability behind "advanced" makes it invisible to the person who needed it. An accordion or "show more" header has to say what is inside it; "More settings" tells nobody whether to open it.

## Sources

- Scanning patterns: https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/
- Icon labels and the five-second rule: https://www.nngroup.com/articles/icon-usability/
- Progressive disclosure and its risks: https://www.nngroup.com/articles/progressive-disclosure/ and https://www.interaction-design.org/literature/topics/progressive-disclosure
- No emoji as structural icons, one icon family at token sizes: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/references/pro-rules.md
