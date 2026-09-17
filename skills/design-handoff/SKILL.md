---
name: design-handoff
description: >
  Write a brief for someone ELSE to design a screen — an external designer, a Claude Design
  project, a contractor, a teammate who cannot read this repo. Fires on "give me the prompt",
  "brief for the designer", "I'll prompt over there", "hand it to Claude Design", "business
  side only", "what do they need to know". Also fires when a reply is about to volunteer a
  layout, component list or step breakdown for work someone else owns. NOT for designing it
  yourself — that is `uiux`, which applies design judgement here; this skill deliberately
  withholds it and ships context instead.
---

# Design Handoff

Someone else is designing. Your job is to give them what they cannot look up, and to stay out
of the part that is theirs.

The failure this skill exists to prevent is sincere and hard to see from the inside: you know
the domain, you have read the docs, a shape has already formed in your head — so the brief
comes out carrying that shape. It reads as thoroughness. What it actually does is spend the
designer's judgement on ratifying yours, and it arrives with enough authority that a junior
designer will not push back on it.

## Withhold the design, ship the constraints

The line is not "avoid UI words". It is **who decides**.

A designer cannot look up how billing works, which two operations hide behind one screen, what
a regulator requires, or which past decision already cost someone money. That is what only you
have, and leaving it out is the other way to waste their time. So say what the screen is for,
who uses it, what the business rules are, what must be possible, and what has already gone
wrong — then stop.

Yours to state: purpose, audience, frequency, the operations involved, business and legal
rules, data that must be captured, states that exist in reality, measured failures. Theirs to
decide: layout, hierarchy, step count, which control, what collapses, what goes first, copy.

⚠️ **A constraint and a solution arrive in the same sentence shape, and the solution is the one
that feels more helpful.** "Two operations hide behind this screen and a PM needs to know which
they are doing" is a constraint. "Use a segmented control for new-vs-existing" is a solution
wearing a constraint's clothes — it names a component, so it has already designed. The tell is
that you could delete the *reason* and the sentence still instructs. Where a real constraint
happens to imply a mechanism (a control must stay visible, a warning must appear at the moment
of the choice), state the requirement and the consequence of missing it; let them pick the
mechanism. **Tell: your brief names a component, a step count, or an ordering.**

## What only you can supply

Measured failures outrank everything else in the brief and are the first thing to look for,
because they are unguessable and they change decisions. "The submit button was hidden until a
field was filled; a real signup abandoned onboarding on that screen and never came back" does
more work than any amount of principle, and it constrains without prescribing.

Dig for the ones with a number, a date or a person attached. A rule stated as principle invites
debate; the same rule with a cost attached settles it.

## Read the docs, then cut most of what you read

Task docs are the source, but a doc extract is not a brief. Docs are organised by domain, so a
sweep for one screen returns constraints for three: neighbouring surfaces, implementation notes,
test names, deploy mechanics. Passing those through is worse than omitting them, because the
designer cannot tell which apply and will either honour a rule for a screen nobody is designing
or discount the whole list.

Cut anything that only means something to a person editing the code. Keep the business fact and
throw away its file path. If a constraint cannot be stated so that someone who has never seen
the repo understands it, either translate it or drop it.

⚠️ **A doc's decision may already have been overridden by the person you are briefing.** Docs
record what was settled when written; a later conversation can reverse it, and the doc rarely
says so. Shipping the stale side sends the designer around an obstacle that no longer exists.
Before pasting a decision, check whether this session already overruled it, and if so say which
way it went and why — an override with its reason is useful context; an unmarked contradiction
costs a whole review cycle.

## Check whether it has been designed already

A screen being rebuilt has often been designed before, and the prior artboards are usually in
the repo. Finding them changes the ask from "design this" to "here is what you specified, here
is what shipped, here is where they diverged" — which is both cheaper and more likely to be
right, since a fresh exploration re-decides things that were already settled well.

This matters most where the prior design was *sound and partially implemented*. Re-briefing it
cold gets the same answer back a second time, and the real problem — that the design was not
followed — goes unaddressed and unmentioned.

## Show the current state

Screenshot what exists now, at the widths that matter, in the states that matter. First load and
fully-populated are different screens and the gap between them is often the whole problem; a
form that looks empty on arrival and runs to thousands of pixels once filled cannot be described
in prose as well as it can be shown.

Capture the awkward states too — the empty one, the error, the branch a seeder cannot build.
Those are what a designer would otherwise have to guess at, and guessing produces a design for
the happy path only.

## Delivering it

Ask where it is going before formatting: a chat message, a ticket, a doc and a paste into another
tool are different shapes. For Google Chat, `gchat-format` owns the syntax.

Keep the brief to what a person will actually read. Lead with what the screen is for; put the
measured failures where they cannot be skipped. End by offering the material you held back —
prior artboards, extra screenshots, the full doc — rather than pre-emptively attaching all of it.

## After

If the returned design contradicts a constraint you supplied, that is worth reading twice before
treating it as a mistake: a designer who breaks a rule often found something wrong with it, and
the rule may be yours to fix rather than theirs to follow. 📖 `../judgement/SKILL.md` for whose
call it is once you know which.
