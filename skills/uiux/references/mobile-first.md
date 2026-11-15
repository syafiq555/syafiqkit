# Mobile-first checks

Read this before declaring a surface done. A layout that only works with a pointer, a wide screen and two hands has not been designed for most of its users.

## Touch and reach

- **Touch targets** are 44 to 48px square with at least 8px between neighbours. 44px is the recommended target; WCAG 2.2's AA floor is 24px and its AAA criterion is 44px, so 44 is a design choice, not the legal minimum. A 24px icon inside a 48px hit area is fine; a 24px icon *as* the hit area is not.
- **Thumb zones.** Most touches are made with one thumb. Primary actions sit in the bottom third of the screen where the thumb rests; secondary actions in the middle; destructive actions away from easy reach, never beside a primary one. A sticky bottom action bar is the usual way to keep the primary action reachable on a long page.
- **Safe areas.** Pad above the home indicator and around notches. A bottom bar that sits under the gesture area gets swiped away instead of tapped.

## Navigation

- Three to five primary destinations go in a bottom tab bar, not behind a hamburger; a hamburger hides the product. More than five means the information architecture needs a decision, not a wider bar.
- Icons carry a visible text label. Labels only in tooltips do not exist on a phone.
- Hover-only affordances do not exist on a phone either. Anything revealed on hover needs a visible state or a tap path.

## Layout and CSS

- Write `min-width` media queries: the phone layout is the base, wider screens add columns. `max-width` queries produce a desktop layout that degrades.
- Type is at least 16px for body text on mobile; smaller invites zoom, and iOS zooms into form fields below 16px.
- Full-height layouts use `dvh`, not `100vh`: the mobile browser's own chrome eats part of `100vh`, so a bottom bar sized to it sits under the address bar.
- Forms: one column, the right keyboard per field (`inputmode`, `type`), autofill attributes, the submit action reachable without scrolling back.
- Tables: decide the phone shape (cards, a priority column set, horizontal scroll with a pinned first column) rather than letting a desktop table overflow.

## Performance

- Aim for a first usable render within about two seconds on a slow mobile connection. Defer heavy pickers, maps and page two; keep resident whatever tells the user what the screen is and what to do next.
- Deferred content needs a placeholder at its real size so the layout does not shift when it lands.

## Sources

- Thumb zones, one-handed use: https://www.smashingmagazine.com/2019/08/bottom-navigation-pattern-mobile-web-pages/ and https://parachutedesign.ca/blog/thumb-zone-ux/
- Target size criteria: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (24px AA) and https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html (44px AAA)
- Mobile-first checklist shape: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md
- `dvh` over `100vh` (#20): https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/data/ux-guidelines.csv
