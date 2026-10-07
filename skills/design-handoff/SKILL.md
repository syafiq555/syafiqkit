---
name: design-handoff
description: >
  Write a brief for someone ELSE to design a screen — an external designer, a Claude Design
  project, a contractor, a teammate who cannot read this repo. Fires on "give me the prompt",
  "brief for the designer", "I'll prompt over there", "hand it to Claude Design", "business
  side only", "what do they need to know". Also fires when a reply is about to volunteer a
  layout, component list or step breakdown for work someone else owns, and when a build
  needs screens or states the team's live design (a Claude Design project, Figma) never
  drew. Brief those before a builder invents them. NOT for designing it
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

⚠️ **Settle WHICH surface first, in one line, whenever the request arrives with more than one
candidate in view.** A brief is long and researched, so an excellent one for the wrong screen
absorbs the whole effort and the error surfaces only when the designer answers about something
else. Salience is the trap: the surface you most recently worked on wins, which is exactly the
one your own shape has already formed around. Name the surface and its file path back to the
user as the first line of your reply, and where the request reached you through a positional
reference to attachments, say which attachment you resolved it to. 📖
`references/handoff-incident-patterns.md#{surface-selection}` for a measured 2026-09-20 incident where this cost a
full misdirected brief. **Tell: more than one screen is in play and you are starting research
without having named the target.**

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

⚠️ **The docs read earlier in the session cover the screens you started on. They do not cover
every operation the brief ends up naming.** A brief is about a feature, so it names neighbouring
operations as requirements: renew, terminate, retry, pause. Each of those has its own domain and
its own doc, and the reading done at session start feels like it covers them. A rule then gets
written from memory or from the nearest doc, and it reads as authoritative because the rest of
the brief is sourced. So before writing, list every operation and every state the brief will
name, and open the doc that owns each one you have not opened this session (`read-summary`'s
discovery finds it). Write each business rule down only once you have read it, and from where you
read it. For every operation, the brief also owes:
- what it does to things already prepared or already sent;
- what each named state means (what makes a bill "failed", say).

Those are the questions a designer returns first. 📖 `references/handoff-incident-patterns.md#{billing-brief}`
for a measured 2026-10-07 incident where incomplete research left the designer with unanswerable
questions and one false rule. **Tell: the brief names an operation whose domain doc you have not
opened this session, or states a rule you cannot point to a source for.**

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

⚠️ **A prior design carries its DECISIONS forward, never its look.** Its flow, fields and states
were settled; its colours, type and mode were whatever the product looked like that week. Offered
as the starting file, it hands the designer an outdated design language to extend, and nothing
flags it: the prototype renders, it matches the old brief, and it predates a rebrand only by date.
Before offering one as a base, compare its date with the app's last visual change; when it is
older, cite what it decided in the brief and leave the file out. 📖 `references/handoff-incident-patterns.md#{rebrand-prototype}`
for a measured 2026-09-30 incident where an outdated palette was included in a new project.
**Tell: the file you are about to call "current" came from a design project, not from the running app.**

## Show the current state

Screenshot what exists now, from the running app, at the widths that matter, in the states that
matter; a throwaway browser-test spec that walks the flow and screenshots each step at desktop
and phone width is the reliable way, and it reaches states a hand walk-through skips. First load and
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

**When the destination is a project filesystem rather than a person**, that last rule inverts: a
designer opening a project reads what is in it, and material you held back to offer is material
they never see. Write the reference files too, split by what each answers — the brief, the assets
and links, the source material in its own voice — so a reader lands on the one they need instead
of scrolling one long file. Check what the project already contains before writing, since these
tools seed a new project from whichever system was last active and the inherited one may belong
to a different product.

⚠️ **Where the destination is a project with a filesystem, deliver BOTH artefacts: the files in
the project, AND the text the person sends to the designer.** The person asked for something to
*send* — "give me the prompt" — and files in a project are addressed to the designer, not to them.
Ending on a report of what you wrote leaves them holding nothing to paste, and it reads as
completion because the research is real. Project files belong in the designer's workspace; the
prompt belongs in the person's hands in the turn's closing message, since one given mid-turn and
followed by more tool work scrolls away. Keep the prompt to what the files do not already carry:
once the brief opens with the ask and names its own siblings, the prompt is a few lines, and
padding it back into a summary of the brief is the same failure wearing the opposite face. A brief
revised after the prompt went out owes a fresh prompt. Do the same for follow-ups you find: if it's worth mentioning to the designer, hand the
person words to paste, not a suggestion to "ask them". Measured 2026-09-30: a renewal prompt went
mid-turn, twenty tool calls followed, the closing report referred to it without restating it, and
the user had to ask where the prompt was. **Tell: your closing message describes files you wrote
rather than giving the user words to send.**

Screenshots of more than a few KB can't go through the design tool's `write_files`, since the bytes
pass through model output and get truncated. Stage them in one folder under the names the brief
cites, and give the user that folder path in the same closing message as the prompt, since they
upload the files by hand.

Verify the destination's own facts before citing them. A URL you constructed rather than copied
from a live page is the common defect: it looks authoritative in a brief and sends the designer
to a 404, and a fetch tool will answer a question *about* a page that does not exist by assembling
the answer from elsewhere, so the content reads correct while the address is wrong. Check with
`curl -sL -o /dev/null -w '%{http_code}' '<url>'` before citing it — 📖
`../haiku/references/verifying-research.md` for why a fetch's success is never evidence the
address was real.

## After

If the returned design contradicts a constraint you supplied, that is worth reading twice before
treating it as a mistake: a designer who breaks a rule often found something wrong with it, and
the rule may be yours to fix rather than theirs to follow. 📖 `../judgement/SKILL.md` for whose
call it is once you know which.

⚠️ **The rules a design ADDS are the ones nobody checks.** A returned design answers its own open
questions by assumption: a tax on by default, a rate, a state that applies "only when the date has
passed". Those assumptions never contradict the brief, because the brief never named them, so a
contradiction check passes them through. Before planning the port, list every business rule the
design states that the brief did not supply. Check each one against the domain's docs and code, and
put the result in the plan as kept, corrected, or a question for the user, asked through `AskUserQuestion` before the plan is presented, not written into it as a default. Measured 2026-10-07: a
returned billing design defaulted SST to on at 6% for every agency, against an opt-in rule that
exempts residential rent. The port plan carried it until a side note flagged it. **Tell: your port
plan lists the design's deviations from the brief and nothing the design introduced.**

Read the returned design yourself; don't take a summary of it on trust. An agent's claim that
something is **absent** (a confirm step, legal text, a state) is the claim most likely to be
wrong, and the one that turns into build work. A canvas reads as text in seconds, with no agent
needed. 📖 `references/reading-canvas-designs.md` for how, and the measured case.
