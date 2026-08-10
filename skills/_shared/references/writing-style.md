# Writing Style — Shared Density Rules

Referenced by multiple skills that write living docs (task-summary, notes-summary, update-claude-docs, condense-task-doc, condense-claude-md). Apply these to every row/sentence you write in those docs.

| Rule | Detail |
|------|--------|
| **One idea per sentence** | ≤1 parenthetical. No arrow-chain shorthand (`A → B → fails`) — write it out. |
| **No filler words** | Cut: "basically", "essentially", "in order to", "please note that", "this means that", "it is important to", "as mentioned". If removing the phrase doesn't change meaning, remove it. |
| **Capture filter** | Keep only if a future session would act differently knowing it. Process history and narrative fail this test. |
| **Prose for judgement, a literal row for a value** | Measured, not reasoned: two agents answered the same six scenarios from either a gotcha table or the same facts as prose. Both scored correctly wherever the answer was "it depends" — and the prose agent *downgraded its own confidence* on the one question needing an exact value, because prose had nowhere to put it without becoming a table again. So a constraint a reader reasons through becomes prose stating the mechanism; an answer that is one specific string (a command, an error, an IP, an id) stays a row. A signal carrying both is prose ending in a pointer, with the value at the anchor. Applying either shape past its half is the failure — a value dissolved into prose reads complete and cannot be acted on. |
| **State the mechanism, not the trip-wire** | A row earns its place by explaining what's actually going on — the reader recognises their own situation from that. A trailing "**Tell:** you're about to do X" names one specific way to have erred and usually just restates the row's own opening, so prefer the mechanism and drop the tell. A `\| Symptom \| Rule \|` table resists this by construction (the symptom column already fills that slot); prose rows and free-form callouts are where it creeps back in. |
