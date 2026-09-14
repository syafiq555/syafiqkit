# Decision-First Output

Governs where an open question goes, relative to everything already finished.

`read-summary` applies this to **every turn of a session**, not just a wrap-up — it runs at the start of most sessions, so its `{#decision-first}` section is where the rule reaches ordinary working turns. `done`, `quick-done`, `ship` and `update-plugin` apply it to their closing summaries, and `done` checks it at its exit gate.

Only that gate enforces anything. Everywhere else this is a standing rule read once at session start, which is the furthest a skill file reaches without a hook — so a long session drifting back into question-last output is the expected failure, not a surprise.

A reader scans a wrap-up top to bottom asking one thing: is there something you need from me? Completed work answers no — they asked for it, they know it landed. An open call answers yes, and it is the only content in the whole output that changes what they do next. Put it first. A reader who has to reach the last line to find the question will ask you what you wanted instead, which is the same conversation one round-trip later.

This matters most for readers who don't read English natively, who are a real share of this plugin's users. Long explanatory prose costs them more than it costs you to write, and a question buried at the bottom of it may not get found at all.

## Where it goes

Count every open question first. The count picks the mechanism, so discovering a second one while already writing means the wrong mechanism is on screen — and a picker, once fired, can't become a list without a second round-trip.

**Exactly one open question** → ask it with `AskUserQuestion`. One line of context in the question text, options shaped as the real choices (build it now, defer to the task doc's next steps). A single decision is where the picker earns its cost: it stops the reply and cannot be scrolled past.

**Two or more** → a `## Decisions` block, first in the output, before any summary table:

```
## Decisions

1️⃣ [What is true now — one line, no history of how you got there]
   [The question, ending in a question mark]

2️⃣ [Same shape]
```

Keycap numerals (1️⃣ 2️⃣ 3️⃣) so the block cannot be mistaken for any other list in the reply. No cap — list every open question the session raised.

**None** → omit the block entirely. No empty heading, and never manufacture a question to fill one. Most sessions have nothing here.

## What counts as a decision

A real "no" has to be a coherent answer. That is the whole test — but answering it from a plausible-sounding guess is the same failure as skipping "Earning the decision" below; if you have not checked, you do not know it is coherent, you are asserting it.

⚠️ **"Decision first" licenses a QUESTION at the top, never your planning at the top — and the second is what the rule reliably degrades into.** The failure is putting your own working state on screen: what you still need to fetch, which calls are blocked on which, which items are independent and therefore dispatched together, a restatement of the plan. None of that is a decision, because the reader cannot answer any of it; deciding what to do next is the job they delegated. It reads as diligence, which is why nothing stops it. Measured 2026-09-14: roughly a dozen consecutive replies opened with a literal "what I need next" enumeration before the user cut in to ask what the spam was. It spends the one line a reader is guaranteed to get on bookkeeping — the exact cost the ordering rule exists to avoid. The rest of this file still applies unchanged: a real decision goes first, and goes first *as a question*.

Two things make it escalate rather than stay a one-off. Reasoning about dependencies genuinely is correct — batch independent calls, measure before asking, resolve blockers before dispatching — so the visible block feels like evidence of doing it, when the reasoning's product is the tool calls, not a paragraph about them. And once the shape appears twice, later turns pattern-match against your own transcript instead of against the reader, so it becomes self-sustaining and reads back as house style precisely because you wrote it.

**Tell: your reply opens by describing what you are about to do, or you are reproducing a shape because the last several turns used it.** Check it against the reader, not the transcript. Think in whatever structure you like; ship the answer.

| Question | Real decision? |
|---|---|
| "Both mutations landed — proceed?" | No. Nothing changes if they say no, so it is a status wearing a question mark. |
| "Tests pass. Should I continue?" | No. You were going to continue anyway. |
| "Nobody can add this node to a workflow yet. Should I build the palette entry now?" | Yes. Deferring it is a real option with a cost they own. |
| "The migration rewrites the table on a large tenant. Run it now, or wait for a quiet window?" | Yes. Both answers are live and you can't pick for them. |

The pattern: if you already know what you will do regardless of the reply, it is not a decision. Anything already decided, already fixed, or needing no input from the reader belongs in the summary instead.

## Earning the decision

The table above tests a question you already have. This tests whether you should have it at all — because a scoping question you cannot answer yourself is usually one you have not measured yet, and measuring it either dissolves the question or turns it into a real one.

The shape is a defect or a change found mid-task, where the honest options are fix it now, fix it separately, or leave it. Asked cold ("fold this in, or track it separately?") that is a preference the reader has to answer blind, and they will answer it with whatever costs least to say. Asked after one query it becomes a decision with a stake: who is affected, and what does each option cost them.

⚠️ **Measure the population your change would NEWLY affect, not the rows that already exist — the two differ, and the existing-rows number is the one that is easy to reach and reads as reassuring.** Measured 2026-09-10: a guard that had never fired was reported as "production carries 1 group, 0 affected", which was true and answered the wrong question. It counted groups already created. Fixing the guard meant *refusing* groupings that succeed today, so the number that decided the question was how many could walk into the refusal — 2 of 8 groupable tenants, both real, both a PM would hit. The first figure argued for a free fix; the second is what made it worth asking about.

The tell is that you are about to describe a fix as safe using a count of what already happened. Ask instead who the change newly says no to, newly charges, or newly moves — then bring that number with the question.

Two things follow from this. A question that survives measurement is worth `AskUserQuestion` even mid-task, because the answer changes what you build next. And a question that does *not* survive it — the population is zero, or the cost is trivially one-sided — should be decided and mentioned in the summary, not escalated.

## The options are a hypothesis, not the decision

The options you wrote encode your model of the choice, so an answer that does not fit one is information about that model rather than an imprecise selection. Two shapes recur, and both are cheapest to handle by believing the answer over the menu.

**An answer from outside the list is usually attacking a premise every option shared.** Three ways to handle a bad edit — refuse it, silently correct it, warn about it — all assume the edit is a mistake; "ask the user which they meant" is outside that set because it treats the edit as a legitimate ambiguous intent, which is a different question from the one asked. So when a reply doesn't map, do not snap it to the nearest option: name the assumption the list shared and check whether it holds, because the reply is normally pointing at it. **Tell: you are deciding which of your options the user "basically meant".**

**A user revising their own earlier answer is not re-litigating, and the rule against re-asking does not apply to them.** `judgement`'s "scope stays where they put it" forbids *you* from reopening a settled question; a later "actually, do it the other way" from the person who settled it is new instruction and outranks the plan built on the first answer. Rebuild from the revision rather than defending the work already shaped by the original. Their correction also frequently points at a convention the codebase already holds — the revision that lands as obviously right is often the one that stops inventing a rule and reuses an existing one, so before implementing it, look for the mechanism it is naming.

Related: an option carrying a `notes:` field is answered by the selection *and* the note, and the note routinely widens scope past what the option said (a styling pick arriving with two edge-case questions and a request for a review pass). Read the note as part of the answer, not as commentary on it.

## The summary below it

A cell reports what was found. It is not the place to argue the work was good, and phrases whose only job is to reassure ("landed precisely", "following the established pattern", "exactly the failure mode I flagged earlier") are that argument. Cut them.

Where a gap is already stated above as a question, the cell points at it rather than restating it. One copy of the question, not two — a reader who meets the same gap twice, once as a question and once as a finding, has to work out whether they are the same thing.
