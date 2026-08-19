# Editing a File Someone Else Shaped

Referenced by the skills that rewrite an existing artifact rather than create one — `update-claude-docs` (Rewrite mode), `task-summary`, `condense-claude-md`, `condense-task-doc`, `merge-task-docs`. Apply before the first structural edit.

## The judgement

**What counts as drift is a section going missing, not a shape that differs. Reshape only where the current shape loses something.**

A file that has been maintained for a while usually has a convention of its own, and a conformance pass cannot distinguish that from a file that never had one — both present as "not the shape I'd write." So the normalize instruction fires on each identically, and on the maintained file it destroys a working decision while every check still passes: a rule-inventory diff proves the *rules* survived and is silent about the form they arrived in.

The test is **consistency, not conformance**. A file that solves the same problem the same way each time — every gotcha as a paragraph, every rule as a numbered item, its own table columns used uniformly — is evidence that a person decided that. Adopt it, and write new content to match. A house style is the default for an artifact with no convention of its own; it is not a standard that working files get converted to.

## What to fix anyway

Three things are losses rather than differences, so they get repaired whichever reading you took:

- A rule filed where its reader won't be looking.
- A missing anchor that breaks an inbound pointer.
- Content the owning skill's capture filter excludes outright.

Everything else needs a reason beyond "it isn't how we write them."

## Say which reading you took

State it in one line before the edit lands — *adopting the file's own numbered-rule convention*, or *no consistent convention found, normalizing to house style*. Unstated, the choice reads afterwards as an accident, and the file's owner cannot tell whether you judged or defaulted. This is the cheapest half of the rule and the half most often skipped, because the decision feels obvious at the moment you make it and is invisible an hour later.

## Why this is not the same as leaving the file alone

Adopting a convention is a decision to work *within* it, not a licence to skip the pass. The rules still get re-filed, the anchors still get added, the dead content still goes. What changes is that the file's form stops being treated as an error to correct.
