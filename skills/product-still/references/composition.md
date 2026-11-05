# Composition and legibility

The rules in SKILL.md § Compose, with the arithmetic and the sources behind them. Each source below was fetched and its quoted line found on the page (2026-11-05).

## Legibility arithmetic {#legibility}

Shown px = CSS px in the app x (canvas px per CSS px in the image) x (display width / canvas width).

A card cropped from a 2x capture and placed `w` canvas px wide covers `crop_w / 2` CSS px, so canvas px per CSS px = `2w / crop_w`.

Worked numbers for a 1448 px canvas shown in a 700 px column (factor 0.48):

| What is placed | Canvas px per CSS px | 15 px body text shows at |
|---|---|---|
| A whole 1440 px window, 866 px wide | 0.60 | 4.3 px |
| A card captured at 1440 px viewport, 1098 CSS px crop, 712 px wide | 0.65 | 4.7 px |
| The same card captured at a 900 px viewport, 648 CSS px crop, 700 px wide | 1.08 | 7.8 px |

On a 390 px phone a 1448 px canvas has a factor of 0.27, which is why the phone image is its own composition: phone-width captures (430 px) placed at about 720 of 780 canvas px give 15 px text at about 12.6 px.

Aim for about 10 px. Text that is context (a faded list behind the subject) may fall well below; text the caption is about may not.

## Sources {#sources}

- moonjar.ai, "How to make a good product screenshot": "Show part of the screen at a size people can read, rather than all of it at a size they can't." "An arrow has to be followed. A lifted row is simply seen." "Vary the crop, not the look." Also the shown-size formula and "export at about 2x". https://moonjar.ai/blog/how-to-make-a-good-product-screenshot
- SavvyShot, highlighting a detail: use a box or arrow when the target is already legible, a spotlight when the screen is busy, a zoom callout only when the target is too small; "stacking them rarely helps in practice." https://savvyshot.app/blog/how-to-highlight-a-detail-in-a-screenshot
- GitHub brand toolkit, product UI: most UI sits on a neutral background; keep spacing consistent across multiple images and keep the UI recognisable. https://brand.github.com/graphic-elements/product-ui
- SaaSFrame, product screenshot pattern: label a styled preview honestly, use representative data in the focal area, and keep scale consistent when images are compared. https://www.saasframe.io/patterns/product-screenshot

## How others ship it {#examples}

- Separate phone crops rather than a shrunk desktop image: Linear's feature page carries `show-tablet` / mobile image classes (https://linear.app/features); Bukku ships `dashboard-hero-desktop.jpg` and `dashboard-hero-mobile.jpg` (https://bukku.my/); Stripe Billing has a separate mobile hero.
- A UI card floating over a picture: Xero's homepage, alt text "a Xero invoice card showing "$2,260 Paid" overlaid on the image" (https://www.xero.com/).

## Arrows and badges {#arrows}

A curved arrow reads as drawn by hand when the head is a separate V placed near the arc's end: its angle never matches the curve. Draw the arc and the head from one centre and radius, point the head along the arc's tangent at its end, and leave room in the SVG box for the head, since a head outside the box is clipped. `templates/still.html` computes all three.
