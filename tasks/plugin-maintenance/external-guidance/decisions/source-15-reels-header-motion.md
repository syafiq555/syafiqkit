# Source #15: three reels (store header, type ratio, ten animation hacks) {#source-15}

Date: 27/11/2026. Sources: three Instagram reels the owner shared (@levilayernn store header; @aevyvideoschool golden-ratio type scale; a "10 niche animation hacks" reel). Audio transcribed with local Whisper, frames read.

## Grading {#grading}

| Tip | Verdict | Why |
|---|---|---|
| Store header hides on scroll down, returns on scroll up | Adopt into `uiux` | Primary source: Proof3 A/B/n test on Joseph Joseph via Mida, https://www.mida.so/case-studies-joseph-joseph-scroll-up-header. Dynamic vs sticky: revenue per user +15.55%, purchase conversion +6.27%, add to basket +2.88%. Non-sticky: add to basket -15.10%, purchase conversion -1.86%. Desktop and tablet only, sitewide, 19 days. Vendor case study: no sample size or significance published. The reel shows phones and "under half a second"; neither is in the source. |
| Type scale from a ratio (1.618) | Already covered | `uiux/references/greenfield-minimum-system.md` builds the scale from a ratio (1.125 to 1.25 for app screens); posters are `taste`/`composition-moves.md` ground. |
| Scale from 0.95/0.97, press 0.97 | Already covered | `emil-design-eng/SKILL.md` table and § button press |
| Delay only the first tooltip | Already covered | `emil-design-eng/SKILL.md` "Instant tooltips after the first one" |
| Spring for flicks | Already covered | `emil-gestures/SKILL.md` release spring seeded with velocity |
| Rubber-band past the edge | Already covered | `emil-gestures/SKILL.md` "Rubber-band at the edges" |
| Directional slide in steppers | Already covered | `emil-choreograph/RECIPES.md` § Direction-aware steps |
| Transform, not top/left | Already covered | `emil-animate/SKILL.md` "transform and opacity only" |
| Shake on wrong password | Adopt | No coverage found |
| `interpolate-size` for height:auto | Adopt | `emil-animate/RECIPES.md` § Accordion says measure in JS; no mention of the CSS route |
| Disable transitions during theme switch | Adopt | No coverage found |

## Score loop {#score-loop}

Stop rule (owner, 27/11/2026): both judges at 18/20 or more in the same round, cap 4 rounds. Round 1 cannot meet it (no retained line yet).

### Rubric (frozen, ten criteria, 0/1/2) {#rubric}

1. **Header rule reachable.** A `uiux` session reviewing or building a shop's product or listing page meets the rule from the file it already reads for that work, and the rule names when it applies (long browse pages with a top bar holding menu, search, cart).
2. **Header figures exact.** Every figure, device scope, duration and test owner matches the Mida page, and the rule says it is one vendor case study with no published sample size.
3. **Header scope honest.** States that phones were not tested (any phone advice is marked inference), and does not contradict `taste`'s marketing-page rule that the header looks the same at every scroll position: the boundary is written where both readers would see it.
4. **Shake on error.** A sourced recipe in the `emil-*` motion layer: when to use it (a refused submit, not every invalid keystroke), size and duration, paired with a text message rather than replacing it, and `prefers-reduced-motion` handling.
5. **Smooth height:auto.** The accordion recipe gives `interpolate-size: allow-keywords` (or `calc-size()`), keeps a fallback for browsers without it, and states browser support from a primary source with the date checked.
6. **Theme switch.** A sourced rule and recipe for turning transitions off for the switch frame (e.g. next-themes `disableTransitionOnChange`, or a class removed after a reflow), with why (every transition fires at once).
7. **Sources live.** Every new external claim carries a URL that answers 200 to `curl -o /dev/null -w '%{http_code}' -L -A 'Mozilla/5.0'`, and the cited page says what the line claims.
8. **Vendored edits recorded and reviewed.** Every `emil-*` file changed has the change listed in its `SOURCE.md` "Changes from upstream"; where the new rule is a review check, `emil-review-animations` can catch its absence.
9. **Plugin hygiene.** Version bumped and equal in both manifests, CHANGELOG entry for colleagues, no em dash in any added line, every new relative path resolves from its citing file.
10. **Fresh-session reach.** A fresh headless Sonnet session given a user's own words reaches the new guidance, read from its tool calls: (a) "the header on our product page covers the photos when I scroll, fix it" reaches the header rule; (b) "make the login form feel better when the password is wrong" reaches the shake recipe.

2 = fully meets; 1 = present with a visible gap; 0 = missing or broken. A judge that cannot check a criterion says "cannot assess" and it scores 0, named beside the total.

### Conventions (not defects) {#conventions}

- Tips graded "Already covered" above are not re-added; their absence from the diff is not a gap.
- The reels are not cited as sources; primary sources only.
- `taste`'s marketing-page header rule stays as it is (marketing pages are short; the evidence is from a shop).
- The type-scale ratio range stays as it is.
- An uncommitted `CLAUDE.md` hunk in the checkout belongs to another session and is not part of this work.

### Settled list {#settled}

(empty at round 1)

### Rounds {#rounds}

- Round 1: 16/20 (judge A) and 17/20 (judge B), both fresh. Gaps both found: accordion fallback only prose (5), vendored rewrites of upstream lines unrecorded (8), the login session built its own shake without opening the recipe (10b; `uiux/references/motion-routing.md` routed to `emil-design-eng` only). Judge A is kept as the retained judge from round 2.
- Round 2: retained 19/20 (3 closed; 1 new, a SOURCE.md line) · fresh 20/20 (0 new, 3 nits). Stop rule met. A code reviewer in the same batch found two real defects the judges scored as passing: the theme-switch selector missed `::before`/`::after` (next-themes' own code uses `*,*::before,*::after`), and the accordion fallback left a panel that starts open collapsed in Firefox and Safari. Both fixed after scoring, with the retained judge's gap and the fresh judge's two nits (child `transitionend` bubbling, reduced motion); the final fallback passed a headless browser test of open, close, quick open-then-close, starts-open, a child transition, and reduced motion. Not re-scored after those fixes.
- `/done` review (unscored): the motion review moved the fallback's close to start from the current height (measured: a close mid-open first moved 5px further open) and the shake to `var(--ease-out)`. The product reviewer found the rule hard to reach while building a header, and the motion trigger silent on cases nobody calls motion. `uiux/SKILL.md` now names both, and `taste`'s `system.md` and `motion.md` state the boundary from taste's side, logged in `taste/SOURCE.md`. A rental or booking marketplace's listing pages take the header rule by inference. Left open: `impeccable` (vendored) has no pointer to the `emil-animate` recipes and is reached only when a user names it.
