# Trigger Testing for Skill Creator

When a skill is written, test whether its description actually fires — a skill that never matches looks fine until a user tries to summon it.

## Test your own description

Take three or four phrasings you'd plausibly use months from now — including a vague one, and one that names the artifact but not the action — and check honestly whether this description would win against the other skills' descriptions. Where it wouldn't, the fix is usually vocabulary in the description, not more explanation in the body.

## Test the near-miss

Name something adjacent that should route elsewhere, and confirm the description's exclusions actually send it there. A skill that fires too eagerly costs more than one that fires too rarely, because it displaces the right skill silently.

## Check for hidden overlap

The failure the above tests can't see is a sibling whose description already claims your subject in words you'd never grep for — you're searching your feature's vocabulary and it names the category. A skill about redesigning pages doesn't grep "UI/UX work", so the category name hides your overlap until a user summons both.

Open the descriptions of every skill in adjacent territory and read what they claim, rather than inferring from names or the registry table's one-line summary. What makes this worth the time is that overlap isn't symmetric in cost: where two skills prescribe *incompatible* workflows for one request — one gating all implementation behind an approval dialogue, the other building small changes directly — whichever fires decides the collaboration model, and the user experiences a spacing fix turning into an interrogation.

When you find real overlap, a clause in each description naming the boundary is the fix, and it belongs in *both* files. The new skill deferring upward is only half of it; the incumbent goes on claiming the same ground, so update its description too. Nothing checks this automatically, and a new skill's trigger is a claim about every existing trigger.

## Baseline eval

If you want to measure whether the skill beats no-skill on a real task, move the skill directory out before running the without-skill arm — an installed skill gets discovered and used anyway, which contaminates the comparison.
