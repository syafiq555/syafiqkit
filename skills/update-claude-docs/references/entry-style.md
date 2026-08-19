# Entry Style Rules

## Before writing

Absorb the three judgment-shaped rules from 📖 `../../_shared/references/writing-style.md` (capture filter, prose-vs-value, mechanism-not-trip-wire — these decide what shape an entry should take before you write it). Then apply these as you draft:

- **Rows ≤2 sentences**: State the constraint + the single reason it exists. ≤1 parenthetical per sentence.
- **No session storytelling**: Never state how the mistake happened or how many times. The rule is the constraint, not its history.
- **One concrete example max**: One symptom string or code snippet — multiple instances of the same failure add length, not clarity.
- **Corrections need verification**: An entry asserting a doc, an agent, or a prior session got something wrong lands in a team-visible file and is read as settled forever. Verify before writing: if a single command settles it (run it); if not, state the observation, not a verdict.

## New signals → Add entry

A new entry's shape follows from the kind of answer it's recording. If the answer is "it depends, reason about it," write that reasoning as prose — 2-4 sentences stating the mechanism so the reader recognises their own situation. If the answer is a specific string the reader could not otherwise produce (an IP, an id, a credential key, an invocation meeting the non-guessable bar), use a table row instead; prose would just pad around a lookup value. A signal mixing both (judgement plus one value) gets prose ending in a `📖 <companion> {#anchor}` pointer, with the value at that anchor (see `../../condense-claude-md/references/prose-vs-value-split.md`).

### Naming a command

**Naming the routine command is the failure mode this shape invites.** A rule saying what to *establish* holds on every machine; the same rule pinned to one invocation holds on yours and quietly misleads everywhere else — a flag that means something different on another platform, a shell that parses the line differently, a search keyed to wording that has since changed. Each returns a clean-looking result that stops the reader looking further, which is worse than no answer, and enumerating the variants multiplies the defect rather than fixing it.

A reader not told the command can work one out; they cannot recover from a confident wrong one. So state the thing to find out — "read the file's modification time", "ask the VCS whether it would ignore this path" — and leave the invocation to whoever is standing in the environment.

### Shape by signal type

On first capture, default to plain statement-of-fact prose — no `⚠️` callout, no trigger phrases, no prescribed sequences. Reserve the imperative shape (`**Never X**`) for the "Violations → Escalate" path, after a rule has already been violated. An entry that came out as `**Never X**` plus a parenthetical carve-out is the imperative shape reasserting itself where prose was cleaner; that shape signals a repeat violation, not a first discovery.

- **Gotchas / Guidance**: apply the test above.
- **Behavioral corrections**: the same test applies — if the correction is "you reached for the wrong thing, here's why", that's reasoning and belongs in prose. `❌ NEVER | ✅ ALWAYS` earns its place when the correction is a bare swap with no reasoning worth stating (this command, not that one). Either way, compare against specific past actions rather than general principles.
- **Patterns**: Prose + code (reusable only).
- **Pair every prohibition with an alternative**: "don't X" needs "do Y instead".

A `❌/✅` table that has grown to **one row** is the shape to re-read, whichever way it got there. Either the reasoning arrived later and the row now carries a "why" the two-column form has nowhere to put, or the siblings were merged away and a whole heading plus table scaffold is left wrapping a single sentence. Both read as house style rather than as a decision, so nobody re-opens them. Ask what the row would look like as one sentence — if it reads better, it was prose that got tabulated.
