# Mobile-first checks

Read this before declaring a surface done. A layout that only works with a pointer, a wide screen and two hands has not been designed for most of its users.

## Touch and reach

- **Touch targets** are 44 to 48px square with at least 8px between neighbours. 44px is the recommended target; WCAG 2.2's AA floor is 24px and its AAA criterion is 44px, so 44 is a design choice, not the legal minimum. A 24px icon inside a 48px hit area is fine; a 24px icon *as* the hit area is not. Grow the element's own box, not a pseudo-element: an `::after` hit area takes taps but `check-render` measures the box and still flags it, so a control whose look must stay (a switch track) gets padding or transparent borders with `background-clip: padding-box` instead.
- **Thumb zones.** Most touches are made with one thumb. Primary actions sit in the bottom third of the screen where the thumb rests; secondary actions in the middle; destructive actions away from easy reach, never beside a primary one. A sticky bottom action bar is the usual way to keep the primary action reachable on a long page.
- **Safe areas.** Pad above the home indicator and around notches. A bottom bar that sits under the gesture area gets swiped away instead of tapped.

## Navigation

- Three to five primary destinations go in a bottom tab bar, not behind a hamburger; a hamburger hides the product. More than five means the information architecture needs a decision, not a wider bar.
- Icons carry a visible text label. Labels only in tooltips do not exist on a phone.
- Hover-only affordances do not exist on a phone either. Anything revealed on hover needs a visible state or a tap path.
- **A shop's long browse pages (product, listing) whose top bar holds menu, search and cart hide the header on scroll down and bring it back on the first scroll up**, not fixed and not scrolled away for good. A rental or booking marketplace's listing and detail pages have the same shape and take the rule by inference; the test was a product shop. Evidence (Sources below): Proof3's 19-day A/B/n test on Joseph Joseph, published by the vendor Mida, sitewide, desktop and tablet only. Against a permanently sticky header: revenue per user +15.55%, purchase conversion +6.27%, add to basket +2.88%; a header that scrolled away for good did worse than sticky (add to basket -15.10%, purchase conversion -1.86%). One vendor case study, no published sample size or significance, phones untested: phone use is inference, backed only by NN/g calling this "partially persistent" header common on mobile. NN/g: trigger the return on a few pixels of upward scroll and let it finish sliding in (300 to 400 ms); not every scroll up wants it (a shopper rereading a spec), so keep it unobtrusive. Craft judgement, not from either source: move it with `transform: translateY`, keep it shown near the top and while focus is inside it, and swap the slide for an instant change under `prefers-reduced-motion`. Browse pages only; a short marketing page keeps its header fixed (`taste`, `references/motion.md`).
- **One sheet at a time.** A choice opened from inside a bottom sheet becomes a step in the same sheet, with a back arrow. It never becomes a second sheet stacked on the first: Apple HIG, eBay Playbook and NN/g all advise against stacking, and the stack shows two handles, two close buttons and a cut-off list.
- **A stepped sheet keeps one height on a phone.** Size it to the screen (`dvh`), not to its content, so a short step doesn't shrink the sheet and read as a different one (23/11/2026, "a bit weird ux"). Check it by opening a long step and a short one and comparing the panel's box.
- **A drag handle promises a swipe.** A sheet that shows one must close on a swipe down (`emil-gestures`), or drop the handle: users try to drag it.

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
- Shop header that hides on scroll down and returns on scroll up: https://www.mida.so/case-studies-joseph-joseph-scroll-up-header (the test) and https://www.nngroup.com/articles/sticky-headers/ (partially persistent headers)
- `dvh` over `100vh` (#20): https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/data/ux-guidelines.csv
