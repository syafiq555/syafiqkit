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

A real "no" has to be a coherent answer. That is the whole test.

| Question | Real decision? |
|---|---|
| "Both mutations landed — proceed?" | No. Nothing changes if they say no, so it is a status wearing a question mark. |
| "Tests pass. Should I continue?" | No. You were going to continue anyway. |
| "Nobody can add this node to a workflow yet. Should I build the palette entry now?" | Yes. Deferring it is a real option with a cost they own. |
| "The migration rewrites the table on a large tenant. Run it now, or wait for a quiet window?" | Yes. Both answers are live and you can't pick for them. |

The pattern: if you already know what you will do regardless of the reply, it is not a decision. Anything already decided, already fixed, or needing no input from the reader belongs in the summary instead.

## The summary below it

A cell reports what was found. It is not the place to argue the work was good, and phrases whose only job is to reassure ("landed precisely", "following the established pattern", "exactly the failure mode I flagged earlier") are that argument. Cut them.

Where a gap is already stated above as a question, the cell points at it rather than restating it. One copy of the question, not two — a reader who meets the same gap twice, once as a question and once as a finding, has to work out whether they are the same thing.
