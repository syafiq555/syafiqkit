---
name: score-loop
description: Score a piece of work against a fixed rubric out of N, fix the gaps, re-score with a fresh reviewer, and repeat until it reaches a target band, plateaus, or the rest needs the user. Fires on "score it out of 20", "rate it and keep improving", "loop until 80%", "keep going until it's good", "give it a score then fix", "run the product reviewer and score it", "iterate until N/20", or a `/goal` that names a score. Works on any artefact a reviewer can judge from evidence: a UI or storefront, a feature, a document, a proposal. Not for a one-off review with no loop (that is `done`'s reviewers, `uiux`/`impeccable` critique, or a single `product-reviewer` dispatch), and not for planning a list before anything is built (`plan-worklist`).
---

# Score loop

One agent builds, a separate agent judges, and the loop repeats until the judge's score reaches what the user asked for. Anthropic calls this the evaluator-optimizer pattern; their harness work found that separating the agent doing the work from the agent judging it is a strong lever, that a standalone judge is easier to make sceptical than a builder is to make self-critical, and that scores rise and then plateau with headroom left. The loop is only as honest as its judge and its rubric, so most of this skill is about keeping both fixed and independent.

## Before round 1: write the rubric and the stop rule

**The rubric is written once, from the brief, and frozen.** Derive the criteria from what the work is for (the client's brief, the task doc's purpose, the spec), not from what the current version happens to do well. A useful default is ten criteria scored 0/1/2, which gives N/20: 2 = fully meets for every audience and context the brief names, 1 = meets with a visible gap, 0 = missing or broken. Small fixed scales with a written meaning for each level are what the evaluation literature converges on; a 1–10 score per criterion invites ties and drift. Give the judge an explicit "cannot assess from here" so it doesn't invent a grade for what it couldn't check.

**Write the scoring conventions next to the rubric, before any score exists.** Name what is not a defect: input the user or client hasn't supplied yet (judge how the work handles its absence instead), decisions the user already made and recorded, and known test artefacts. Without these, round 1 docks points for things no fix can move, and a later round that adds the conventions looks like progress it isn't. Changing the rubric or conventions mid-loop breaks comparability; if it must change, say so beside the score and treat that round as a new baseline.

**Agree the stop rule with the user, or state it:** the target band (the user's "80–90%" is 16–18/20), a round cap (four rounds is a sensible default; every published loop that lacked one grew one), and a plateau rule (stop when a round gains nothing, or only one point, since a one-point move is within a judge's run-to-run noise). The loop also stops when every remaining point needs the user's or a third party's input.

**Save the rubric, conventions and stop rule to the task doc before round 1, and append each round's score.** A loop that lives only in the transcript loses its baseline to a compaction or a fresh session, and "was Y" then has nothing to compare against. With no task doc, keep them in one file beside the work and say where.

## Each round

1. **Dispatch a fresh judge.** A new agent each round, report-only, with the same rubric and conventions pasted in full, using the project's `product-reviewer` when one exists and a general-purpose agent given the brief otherwise (a document or proposal has no codebase for `product-reviewer` to bootstrap from). Tell it to score from evidence it gathers itself (open the code, run the thing, drive the pages, read the document) and never from earlier reports or your summary, and to give the evidence before each score. A fresh context is what keeps it from inheriting the builder's framing; a judge that saw the previous round's report tends to confirm it.
2. **Check the claims that rest on a checkable record before acting on them.** A judge's "X is still broken" is read from whatever it happened to open. Where a gap rests on a file, a setting or a rendered state you can check in one call, check it; a gap that was already fixed comes off the list, and you note the judge's miss rather than re-fixing.
3. **Split the gaps.** Plain fixes go to the build. A gap whose fix changes who can do or see something, or what customers or readers are told, is the user's call: ask those through one `AskUserQuestion`, with the rubric's evidence in each option, before the build round starts.
4. **Build the round's fixes in one dispatch** (the project's `task-builder` when it exists, otherwise a general-purpose agent or this session, one at a time if builders share a database), with its own verification: tests, specs, renders at the widths that matter. Check its report against the tree before scoring again.
5. **Report the round in one line** the user and any `/goal` evaluator can see: `Round N: X/20 (was Y)`, the criteria that moved, and what is left. A criterion the judge could not assess scores 0 and is named beside the total (`16/20, 1 not assessed`), so the band is never reached on points nobody checked. `/goal`'s evaluator reads only the transcript, so a score that lives only inside an agent's report never ends the loop.

## Stopping

Stop and report when the target band is reached, the cap is hit, a round plateaus, or what's left needs the user. The final report gives the score per round, the remaining gaps each with its fix and whose call it is, and anything the judge could not assess. Reaching the band is not a reason to hide what's left: list it so the user decides whether one more round is worth it.

📖 `references/worked-example.md`: one full run (a storefront scored 12/20 then 16/20), including the conventions that had to be added after round 1 and the judge claims that turned out stale.
