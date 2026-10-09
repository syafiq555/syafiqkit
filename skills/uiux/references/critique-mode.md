# Critique mode

Read this when asked to review, audit or critique an existing screen ("what's wrong with this", "is this good", "audit the page"). A critique judges; it does not edit. Fixing starts only after the reader has the findings and picks what to change.

## How to run it: two views, kept apart

Two separate reviews, so neither colours the other:

- **Design judgement.** The screen as a rendered picture (screenshot first, source second): hierarchy, whether one action leads, the job the screen serves, consistency with the app's language, the tells in `ai-look-tells.md`, and the heuristics under Scoring.
- **Evidence from the render.** The screen at 375, 768 and 1280px against `verification-checklist.md`: overflow, truncation, targets, contrast, states (empty, loading, error, disabled).

Steps:

1. Get screenshots at the three widths as files on disk, from a browser tool, a Playwright spec or the project's run skill. A subagent cannot see an image pasted into your conversation.
2. Dispatch two `general-purpose` agents in one message, without `name:` (a named agent's report never reaches you), one per view. Tell both to report only: no edits, no git commands. Each prompt carries: the screenshot paths; the absolute paths of its reference files (this skill's `references/` directory); a one-line audience and job for the screen, from the user or inferred and labelled as inferred; and the return shape, one entry per finding with what is seen, the evidence, who is affected, the smallest change, plus a list of anything the screenshots cannot show. The design agent also gets the five questions from `SKILL.md` (Swap, Squint, Signature, Token, Exclude) and, for a landing page, portfolio or brochure site, `marketing-pages.md` as its yardstick for structure, proof, type and colour only, skipping its dials and design-read steps.
3. Merge the two reports yourself, assign the heuristic scores from both, and rank the findings.

If the three widths cannot be captured, or all you have is a pasted image (one width, and not passable to a subagent), run the design view inline, mark the evidence view "not measured: no render at 375/768/1280", and tell the user what would complete it: a URL plus a browser tool, or three screenshots saved as files. If agents are not available, do the views in order and say they were not isolated; a second view otherwise inherits the first view's verdict.

## Scoring

Score the ten usability heuristics (Nielsen) 0 to 4 each, 40 total: visibility of status, match to the real world, user control and undo, consistency, error prevention, recognition over recall, flexibility for experts, minimal design, error recovery, help. A 4 means genuinely excellent. Most real interfaces land between 20 and 32, so a screen scoring 38 on first read means the scoring was generous.

Mark a heuristic n/a when it does not apply (flexibility for experts and help on a landing page, campaign or portfolio) and "not observable" when static renders cannot show it (user control and undo, error prevention, error recovery are often this). Print the score over the applicable maximum (say 26/32), never over 40, and print the ten rows as a short table so the gaps are visible. Nothing stores a score between sessions, so a trend exists only if the user or a task-doc line carries the earlier number; do not claim one otherwise.

## What the report holds

- Findings ranked by what the reader loses, not by how easy the fix is. Lead with the one that most blocks the screen's job.
- Each finding: what is seen, which heuristic or tell it breaks, who is affected, and the smallest change that would answer it.
- What works, in one or two lines, so a later fix pass does not break it.
- The decision the user needs to make is the last thing in the reply, asked through `AskUserQuestion` (which findings to fix first).

Method adapted from the critique command in impeccable (Apache-2.0, `github.com/pbakaus/impeccable`).
