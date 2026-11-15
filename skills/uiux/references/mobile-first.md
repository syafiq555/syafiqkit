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

- Aim for a first usable render within about two seconds on a slow mobile connection. What to defer and what to keep resident: `designing-for-scanners.md` § Lazy-loading is design (placeholder sizing: `verification-checklist.md` § Layout stability).

## Native apps and the modules' phone rules {#native-and-modules}

This file is written for the mobile web. For a native iOS, Android or adaptive app, and for taste's app-screen phone rules, read the module files below as well. Paths are relative to `skills/uiux/`.

| Source | What it holds |
|---|---|
| `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/ios.md` | iOS platform rules: safe area, tab bar, edge-swipe back, large titles, Dynamic Type, SF Symbols, semantic colours, Simulator capture. Includes "The iOS slop test". |
| `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/android.md` | Android platform rules: Material navigation matched to window size, predictive Back, edge-to-edge insets, type scale in sp, colour roles, tonal elevation, emulator capture. Includes "The Android slop test". |
| `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/audit.native.md` | Code-level native audit in five dimensions (accessibility, performance, appearance and theming, platform conformance, adaptivity), each scored 0 to 4. |
| `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/adapt.native.md` | Moving a native design across contexts: phone to tablet, orientation and foldables, iOS to Android (idiom translation table), web to native. |
| `${CLAUDE_SKILL_DIR}/modules/taste/references/app-screens.md` § 12 "The phone" | House rules for app screens at 390px: navigation fold, margins, KPI grids, charts, row actions, tables to two-line rows below about 640px, the 641 to 1100px tablet band, several panes, settings. Its § 14 holds the generated-dashboard tells. |
| `${CLAUDE_SKILL_DIR}/modules/taste/references/layout.md` § 9 "The phone is a second composition" | Phone rules for pages (not app screens): own composition, portrait crops, margins, body size, targets. |

### Where they overlap this file, and where the values differ

Differences are listed, not resolved: pick by the surface (mobile web against native against a taste-built app screen), and say which source you followed.

- **Touch targets.** This file: 44 to 48px with at least 8px between. `ios.md`: 44 x 44 pt minimum. `android.md`: 48 x 48 dp minimum with at least 8 dp between. `audit.native.md` flags anything under 44 pt (iOS) or 48 dp (Android). `app-screens.md` § 12 and `layout.md` § 9: at least 44px. `${CLAUDE_SKILL_DIR}/modules/impeccable/reference/audit.md` (web), dimension 4: under 44 x 44px, and it states WCAG 2.5.8 AA is 24 x 24 CSS px, which agrees with the criteria cited under Sources below.
- **Type floors.** This file: body at least 16px on mobile. `layout.md` § 9: body 16 to 18px. `ios.md`: 11 pt floor, Body 17 pt, system text styles (Dynamic Type), no hard-coded sizes. `android.md`: Material type roles in `sp`, never fixed px. `app-screens.md` § 12: data and labels 14px, sublines no smaller than 12px. `${CLAUDE_SKILL_DIR}/modules/taste/references/copy.md` § 7: no text under 13px. Taste's inspector (`${CLAUDE_SKILL_DIR}/modules/taste/scripts/lib/rules.mjs`): `body-size` FAILs under 15px on a page, `tiny-text` FAILs more than two text blocks under 11px on an app screen. So the smallest allowed text is 11 (iOS, taste app-screen inspector), 12 (app-screens sublines) or 13px (copy.md); this file does not set a floor for secondary text.
- **Safe areas and insets.** This file: pad above the home indicator and around notches. `ios.md`: lay out inside the safe-area insets, nothing under the notch, Dynamic Island or home indicator. `android.md`: edge-to-edge, apply status bar, navigation bar, display cutout and IME insets. `adapt.native.md`: respect insets in every new configuration (notch, hinge, status bar, keyboard). `audit.native.md` flags inset violations and inputs hidden behind the keyboard.
- **Navigation.** This file: three to five destinations in a bottom tab bar, no hamburger. `ios.md`: tab bar for 2 to 5 top-level sections. `android.md`: navigation bar for 3 to 5 destinations on compact width, rail or drawer when expanded. `app-screens.md` § 12: either a 48px top bar with a menu button that opens a full-screen sheet, or a bottom bar of four or five destinations; an icon rail becomes the bottom bar. The counts differ (2, 3 or 4 as the lower bound), and `app-screens.md` accepts a menu-button sheet where this file rejects a hamburger. `${CLAUDE_SKILL_DIR}/modules/taste/scripts/lib/rules.mjs` `sidebar-phone` FAILs a sidebar still taking over 30% of a phone's width.
- **Back and gestures** (not in this file). `ios.md`: keep the left-edge swipe back alive. `android.md`: honour the predictive Back gesture and button. `audit.native.md` and `adapt.native.md` flag a disabled or hijacked system gesture.
- **Margins** (not in this file). `layout.md` § 9 and `app-screens.md` § 12: 16 to 20px.
- **Full-height layouts.** This file: `dvh`, not `100vh`. `${CLAUDE_SKILL_DIR}/modules/taste/scripts/lint.mjs` rule `h-screen`: use `100svh` or `100dvh`. The two agree; `svh` is the small-viewport variant.
- **Tables on a phone.** This file: choose cards, a priority column set, or horizontal scroll with a pinned first column. `app-screens.md` § 12: below about 640px a table becomes a list of two-line rows (identity and key number on line 1, other fields on line 2, never dropped); a table that must stay a table scrolls inside its own frame with the first column fixed.
- **Orientation and tablets.** `adapt.native.md`: restructure rather than stretch a phone layout; drive structure from size classes, not device models; landscape restructures, never clips. `app-screens.md` § 12 treats 641 to 1100px as its own band. This file only asks for a landscape look via `${CLAUDE_SKILL_DIR}/references/verification-checklist.md`.
- **Dark appearance.** `ios.md` and `android.md` make dark a first-class appearance to design and test; `audit.native.md` scores broken dark appearance.

## Sources

- Thumb zones, one-handed use: https://www.smashingmagazine.com/2019/08/bottom-navigation-pattern-mobile-web-pages/ and https://parachutedesign.ca/blog/thumb-zone-ux/
- Target size criteria: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (24px AA) and https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html (44px AAA)
- Mobile-first checklist shape: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md
- `dvh` over `100vh` (#20): https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/data/ux-guidelines.csv
