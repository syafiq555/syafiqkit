---
name: judgement
description: Something came up mid-task that is arguably not yours to decide — a defect found while building something else, a fix that would refuse what currently succeeds, a scope question, a workaround whose cost lands on someone else. Use when about to escalate ("should I fold this in", "is this in scope", "do you want me to also fix", "worth doing now or later", "I found something while doing X"), and equally when about to stay silent about a real finding. Decides whether the call is yours or the user's, and makes the question answerable before asking it. Not for shaping a question you have already decided to ask (that's `_shared/references/decision-first-output.md`), not for choosing between design approaches on work already agreed (that's `brainstorming`), not for scoping a list that already exists (that's `plan-worklist`).
---

# Judgement

Two failures, opposite and equally expensive. Escalating a call you should have made yourself spends the user's attention on something they'd have said "sure, obviously" to. Deciding one that was theirs takes away a choice with a real cost — and they find out afterwards, from the consequence.

The reflex to check with them is not evidence the call is theirs. It usually means the finding is unmeasured, and uncertainty about facts is being routed to a person as if it were uncertainty about preferences.

This skill exists because the rule it carries was already written down and still didn't fire. `read-summary#decision-first` states it — including "if the decision hinges on something unmeasured, say what to measure" — but that skill is read once at session start, and a scope question typically arises tens of turns later, after a background run or a query. By then the section is being recalled rather than read, and recall reliably returns the shapes that matched ("several paths, list the trade-off") while dropping the one that applied. Measured 2026-09-10: a question went out as an unmeasured either/or from exactly that section, forty-odd turns after it was read. Invoking this skill at the moment of asking is what puts the test back in front of you.

## Measure before you classify

Most mid-task findings are classified before anyone has looked at who they touch, and the classification is what decides whether they get escalated, built, or dropped. That ordering is backwards — a single query usually settles it.

⚠️ **Measure the population the change would NEWLY affect, not what already exists.** They differ, and the existing-rows count is the easy one to reach and the one that reads as reassuring. A guard that has never fired affects zero rows today and may refuse a dozen real users the moment it starts working. 📖 `../_shared/references/decision-first-output.md` § Earning the decision for the worked case and the tell.

The measurement resolves most findings without a question. Nobody affected and the fix is contained: do it, mention it. Nobody affected and the fix is large: leave it, write it down. Real people affected in a way that trades one group's experience against another's: that one is theirs.

## Whose call is it

Yours when the answer follows from something already settled — the approved plan, a stated preference, a convention the repo already holds to, or a cost so one-sided that the other branch is indefensible. Reversibility matters here: a choice you can re-edit next turn is one to make and report, not one to hold the turn open for.

Theirs when the options differ on an axis you have no standing on. Who gets refused or charged. What ships this week versus next. Anything outward-facing — a message sent, a record written somewhere they'd have to correct later, a customer-visible change. Anything hard to undo. And anything where you'd be trading their stated goal against your own sense of tidiness, which is what "while I was in there" usually turns out to mean.

The honest test: would a "no" be a coherent answer that changes what you do? If you'd proceed identically either way, it was never a question. This test also rides on the session ruleset's rule 4, which fires as a turn is being composed rather than only when this skill is invoked — because the failure it catches happens at the moment a reply ends, which is usually long after anyone thought to reach for a skill about judgement.

⚠️ **Answering that test from recall is the same failure this skill exists to catch, one level up.** "Would a no be coherent" is itself a measurement question, not a vibe — asserting "yes, genuinely" without checking is the reflex-to-escalate finding an unmeasured population and calling it settled. Measured 2026-09-10: asked whether to reapply an earlier structural edit, a session offered a bare yes/no, defended the framing when questioned ("that stands, no correction needed"), and only checked after the user pushed back three times — `git diff` then showed the two options were a clean, disjoint reapply with no conflict, meaning the honest test had a real answer the whole time and it was reachable in one command. **Before asking, run the check the test implies**: diff the two branches, grep for the conflict, read the file the "no" path would leave untouched. If that check shows the branches don't actually differ in cost or risk, there is no question — proceed on the one with fewer steps and say so. If it shows a real difference, hand the user the diff or the risk, not a bare binary.

## Neither answer is silence

A finding that is not worth a question is still worth a sentence. The failure mode is deciding it's out of scope and letting it disappear — the user never learns the thing exists, and the next session rediscovers it at full cost. Say what you found, what you measured, and what you did about it. One line in the summary; it does not need a heading.

Where it's genuinely theirs, ask it in the same turn you found it rather than banking it for the wrap-up. A question answered before the surrounding work is built costs one round-trip. The same question at the end can invalidate what you built in between.

## Scope stays where they put it

Finding a real defect adjacent to the task does not license fixing it. Bring the measurement, name the options, let them choose — and if they've already chosen once, that answer holds for the rest of the session. Re-asking a settled question in a new costume is its own failure, and it reads as not having listened.

The exception is a finding that makes the approved work itself wrong — a premise that turns out false, a fix that would ship a defect. That is not scope creep to raise; the approved work depends on it, so it goes to them immediately, before more is built on the bad premise.

⚠️ **This forbids YOU from reopening a settled question; it says nothing about the user revising their own answer.** "That answer holds for the rest of the session" is a rule against re-asking in a new costume — read as symmetrical it turns a later "actually, do it the other way" into noise to argue with, which is the opposite of listening. A revision from the person who decided is new instruction and outranks whatever plan the first answer shaped. The same applies to an answer that fits none of the options you offered: that is a finding about your options, not an imprecise selection. 📖 `../_shared/references/decision-first-output.md` § The options are a hypothesis, not the decision.
