# LaTeX pictures for explainer decks

Typeset equations (with labelled underbraces) and hierarchy trees read far better than formulas written as slide text. Render them to transparent PNGs and place each with a mechanism slide's `image` visual (`references/spec.md`), whose `text` field repeats everything the picture says so its figures are still checked.

## Toolchain

- Use `xelatex` with `fontspec` and the deck's font (`\setmainfont{Arial}` matches pptxgenjs's default), so equation text matches the slide text. A minimal TeX install often lacks the Type 1 Helvetica metrics `\usepackage{helvet}` needs and fails with `mktextfm phvr7t`; `fontspec` uses the system font instead.
- `amsmath` for `alignat*` and `\underbrace`, `tikz` (libraries `positioning`, `decorations.pathreplacing`) for trees and brackets.
- Without the `standalone` class or `pdfcrop`, typeset on a large `geometry` page and crop afterwards: `pdftocairo -png -transp -r 300 -singlefile build/x.pdf eq/x` then `magick eq/x.png -trim +repage -bordercolor none -border 30 eq/x.png`.

## Layout rules that came from Google's render

- The picture is fitted to the slide's picture area, so its aspect ratio sets its size. A tall stack of two cases renders small; put the cases side by side (`alignat*{2}`) so the image is wide.
- Keep one shared preamble (colours as the deck's party colours, macros for names, amounts and labels) and one `.tex` per picture, rendered by one script, so a wording change reaches every picture.
- Label underbraces in the source's vocabulary and keep labels short; a label wider than its term pushes the equation apart.
- `step` is a reserved TikZ key; naming a style `step` fails with "requires a value".
- Open every rendered PNG, then the slide in Google's export: dark text on a transparent PNG reads grey in some viewers but correctly on the slide.
