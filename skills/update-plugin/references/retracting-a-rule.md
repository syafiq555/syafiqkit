# Retracting a Rule

Read when a patch WITHDRAWS a practice rather than adding one. Adding is bounded by where you put it; withdrawing is not.

## Why the scope is wider than the files you edit

Every site that prescribed the retracted practice keeps instructing the reader to do it, and those sites read as correct because they *were* correct until now. Nothing about them looks stale — no contradiction, no broken pointer, no failing check. They are simply still there.

Then the CHANGELOG entry names the files the fix touched, and a later session reads that list as the files that *needed* touching. The entry certifies a scope the pass never established.

Measured 2026-09-03: release 1.225.0 removed the token-diff verification step and patched its four named files. Two more still prescribed it — one as a numbered step in a shared verification checklist — and both sat on the delegated-rewrite path the removal was written about. A reviewing agent sweeping the four named files reported nothing else prescribed it, which was true of the four and false of the corpus.

## What to do instead

Grep the corpus for the **practice in its own vocabulary** — what the step told people to *do* — not for the files the entry lists. A retracted step is usually described in several wordings, so search the action rather than the label: the command it told you to run, the artifact it told you to produce, the check it told you to perform.

Treat a surviving prescription as in scope even where it predates the retraction. Age is not evidence that a site is exempt; it usually means the site is where the practice originally came from.

When the entry is written, describe what the corpus now says rather than which files changed. "No skill now prescribes X" is a claim a later session can check. "Removed from A, B, C and D" is a list that silently goes stale the moment a fifth file is found.
