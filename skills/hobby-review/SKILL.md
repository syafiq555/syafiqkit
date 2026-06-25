---
name: hobby-review
description: Socratic debrief of a hobby item (anime, book, game, etc.) against the taste rubric in the matching current.md. Use when the user says they've watched/read/played something, wants to share their experience, or says "I finished X". Derives questions from the existing Criteria Reference Card — does not hardcode any domain. Outputs a structured verdict: axes passed/failed + any new taste signals worth capturing.
---

# Hobby Review — Socratic Debrief

A conversation-driven review that surfaces the user's real experience with a hobby item, then maps it onto the existing taste rubric. The goal is to **discover new taste signals**, not just confirm known ones.

<HARD-GATE>
Do NOT summarize or output a verdict until the conversation has covered all four:
1. The most surprising or memorable aspect (or expectation gap if mood was mixed/disappointed)
2. Whether the item delivered on the rubric's most important axis
3. How it compares to the user's anchor/baseline title (first impressions only if still watching)
4. The gap question — "if this had one more season/arc/chapter, what would make it perfect?"

Only then output the verdict. No shortcuts.
</HARD-GATE>

## Constraints

| ❌ Never | ✅ Always |
|----------|----------|
| Ask multiple questions at once in conversation | One question per message in the Socratic arc (AskUserQuestion is only for the Step 3 pre-flight — 2 classifier questions, once, before the arc starts) |
| Derive questions from memory/training data | Read the current.md rubric and derive from its axes |
| Assume what the user thought | Let them tell you — the Socratic method means *they* surface the insight |
| Output a verdict mid-conversation | Complete all 3 conversation gates first |
| Invent axes not in the rubric | Flag new signals as "new axis candidate", don't silently add |

## Steps

### 1. Load context

Read the matching `tasks/hobbies/<domain>/current.md`. If no path was given, infer domain from what the user mentioned. Extract:
- The **Criteria Reference Card** axes (the rubric)
- The **anchor title** (baseline "this is my vibe" reference)
- The current **Top Picks** for comparison

### 2. Identify the item

Confirm which title/item the user experienced. If ambiguous, ask once.

### 3. Pre-flight classification (AskUserQuestion)

Before the Socratic arc, use `AskUserQuestion` to classify the session. Ask both questions together in one call:

**Question 1 — Completion status**
- Header: "Progress"
- Options: Still watching / Finished / Dropped
- Use to branch the arc: partial watch → soften the anchor comparison to "first impressions vs anchor" rather than a full verdict

**Question 2 — Opening mood**
- Header: "First impression"
- Options: Loved it / Decent start / Mixed / Disappointed
- Use as the probe baseline: "mixed" or "disappointed" → open the arc by asking what the gap was between expectation and reality, before asking about memorable moments

These are **classifiers**, not elicitors — they orient the arc, not replace it.

### 4. Run the Socratic conversation

Drive conversation with **one question per message**. Questions must follow this arc — but adapt wording naturally, don't feel like a form:

**Arc**:
1. **Most memorable moment** — open with the sharpest or most unexpected thing. This surfaces what the item actually *did* to them, not what they expected. If mood was "mixed/disappointed", open with the expectation gap instead: "what were you hoping for that didn't land?"
2. **Delivery on the anchor feeling** — did it deliver the core vibe they come to this hobby for? (E.g., for anime-romance: "did it give you the couple payoff?")
3. **Comparison to anchor title** — if *finished*: where does it sit relative to their baseline, what does it do better or worse? If *still watching*: "based on what you've seen, how does the vibe compare to [anchor] so far?" — frame as first impressions, not a final verdict.
4. **Rubric axis drill-down** — for any axis where the answer was ambiguous or surprising, probe one level deeper. (E.g., "so the FL was warm — but did it feel earned or was it just her personality from ep 1?")
5. **Gap question** — always ask, even after gates 1–3 are covered: "if this had one more season / arc / chapter, what would make it perfect?" — reveals unmet expectations and new axis candidates. Do not skip this.

Stop after the gap question. Don't drag the conversation past the point of diminishing returns.

### 5. Output the verdict

After the conversation naturally reaches the 3 gates, output this structure:

```
## Verdict: [Item Title] ([Year if known])

**Rubric result**
| Axis | Result | Evidence from conversation |
|------|--------|---------------------------|
| [Axis 1 from rubric] | ✅ Pass / ❌ Fail / ⚠️ Partial | [one-line summary of what user said] |
| ... | | |

**Placement**
Where it sits relative to existing Top Picks — one sentence. E.g. "Sits between X and Y: beats X on [axis], loses to Y on [axis]."

**New taste signals** (if any)
Any axis or preference the user revealed that isn't in the current rubric. Flag as: "New axis candidate: [name] — [what it measures]". These are surfaced for the user to decide whether to add to the Reference Card; they are NOT automatically written.

**Recommendation**
Whether to update the Top Picks table for this item, and what the updated row should say. One sentence.
```

Output the verdict in plain text in the conversation — do NOT write anything to the doc. The user decides what to keep.
