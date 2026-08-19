# Quick Start Section — Detailed Rules

Place immediately after the `# Title` and before `## Overview`. **Rewrite on every update** (same principle as all other sections — edit in place, don't append), unless §1's ownership guard fired (then additive only). A cold-start agent reads only this section before acting — if it can't act from Quick Start alone, the section is insufficient.

## Five Questions to Answer

Must answer these 5 questions in ≤15 lines total:

| # | Question | Format |
|---|----------|--------|
| 1 | What's the immediate next action? | Numbered list (ordered, first item = first thing to do) |
| 2 | What exact commands/files are involved? | Code blocks or inline code |
| 3 | What's the current state? | Bullet points — committed vs uncommitted, local vs prod, DB state |
| 4 | What gotchas will trip me up? | 2-3 critical ones only (e.g., "MUST use --queue not sync") |
| 5 | What does "success" look like? | One sentence with concrete numbers/expected output |

## Litmus Test

If a Sonnet agent reads only the Quick Start and answers "what do I do first?", it should give the correct action and the correct command without reading any other section.

## Environment Resources

A named environment resource is the one kind of Quick Start content that decays without anything in the doc changing — a fixture id, a seeded account, a test record, a queue name. Nothing marks it stale when someone restores a database or reseeds, so a section that named it correctly last month reads exactly as authoritative today, and a cold-start agent builds on an id that resolves to nothing. Cheap to settle while you're already in the doc: query for the ones this session didn't touch, not just the ones it did. If a named resource is gone, replacing the id matters less than saying what changed and what the environment now holds, since the next reader's real question is which fixtures are reachable at all.
