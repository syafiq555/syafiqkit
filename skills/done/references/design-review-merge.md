# Design Review: Dispatch and Merge

Read this before dispatching the Design row's skills (capture widths, which screens each one sees, decks) and again once they return, before writing the Design row.

## Dispatch

- **`uiux`** grades the changed screens: capture each at 375, 768 and 1280 px, in every colour scheme the screen has, open every capture, and grade each against its sibling screens.
- **`impeccable` critique** runs on the changed screens and starts its own two isolated reviewers. Hand it the capture set `uiux` made rather than a second one, after opening every capture to confirm it shows the changed state, not an error page or an empty list (20/11/2026: four reviewers across both skills were handed product captures that were all a 500 from an unrun migration and a listing emptied by a wrong fixture id, and spent their runs reporting the captures).
- **`taste`'s review path** runs on any screen a customer sees. An email or document a customer receives counts as one: on 15/11/2026 tenant emails were graded by `uiux` and `impeccable` only, a fourth `taste` omission.

## Decks and rendered documents

A deck is graded from its rendered pages, not at widths. On a deck, `impeccable`'s detector reads only web markup, so its critique runs the design review alone, and the Design row says so. A render check for overflow is not this review: on 14/11/2026 a 31-slide deck passed every render check, and its owner then asked for the design skills because it looked generic.

## Merge

When the reviews that ran have returned (`taste`'s only on a screen a customer sees), merge them into one report with one score, since three separate scales give the reader no single verdict: `impeccable`'s Nielsen total is the starting score (N/M over the applicable maximum), each `uiux` or `taste` finding that bears on a heuristic lowers that heuristic and is named beside it, and an open `taste` inspector FAIL holds the whole score to 60% of the maximum. Findings are de-duplicated across the three and ranked by what the reader loses.

