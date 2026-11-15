# Design Review: Scope, Engines and Incidents

Open this when Step 1's Design row is due and the change is not a plain web screen (a deck, a rendered document, an email), when a wrap-up has to show which engine ran, or when a UI diff has no spec covering it.

## Scope beyond a web screen

- A deck or rendered document (a deck spec, a .pptx or Google Slides build, a PDF) is graded from its rendered pages, not at widths.
- `impeccable`'s detector and `taste`'s inspector read only web pages, so on a deck the review runs its reviewers and lint on the rendered pages, and the Output lists those two checks as "not run".
- A render check for overflow is not the Design row (14/11/2026: a 31-slide deck passed every render check, and its owner then asked for the design skills because it looked generic).

## One review

- `uiux` is invoked once per wrap-up, fresh, in the batch with the agents. It runs one combined review (`uiux/references/critique-mode.md`): the machine checks that fit the surface, then two isolated reviewers scoring one rubric, giving one score.
- Running a module's script from a shell or an agent is evidence for that review, not the review.

## Runtime proof

Runtime behaviour is a Playwright spec's job, not an agent's. A UI diff with no spec covering it is a finding: write or extend the spec (`setup-playwright`) and run it, rather than reviewing the running app by eye.

## Incidents

- Measured 14/11/2026: a redesigned admin screen passed code and product review, and the user still had to ask twice for the design skills to run at wrap-up.
- 15/11/2026, twice: tenant emails were graded by `uiux` and `impeccable` only. A later wrap-up ran `taste`'s inspector without its procedure and never its critique. The owner then merged both into `uiux` as modules, and the same day asked for one combined review with one score rather than three reviews merged ("Not run all 3, but 1 only").
