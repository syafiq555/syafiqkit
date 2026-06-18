---
description: Read and load a personal session journal (non-code conversation log) before continuing a thread. Use at the start of a session to recall what was discussed/decided about a boss/team/career/strategy topic.
argument-hint: "[domain/about or full path to summary.md, or a fuzzy description]"
---

**Storage convention**: `~/.claude/notes/<domain-slug>/<thread-slug>.md` (descriptive segments, no constant `summary.md` leaf)
- Examples: `~/.claude/notes/boss-hong-liang-ng/feedback-and-expectations.md`, `~/.claude/notes/strategy/listmy-competitor-response.md`

## Finding the Right Log (when no path given)

⚠️ The arg is usually a fuzzy description ("the thing with my boss", "the onboarding chat"), not a path. Folder slugs rarely match how you'd phrase it. So **discover by content**:

1. **One tool block**: `Glob ~/.claude/notes/**/*.md` AND `Grep` those files for the concept's vocabulary from the request — include synonyms (a generic word like "boss" may map to a person's name in the file; "competitor" → the product's name). Search body + LLM-CONTEXT header.
2. **Rank + confirm**: read the top 1-2 candidates' header + `# Title` + `## Quick Start` + Index. Pick the thread whose *subject* matches what the user actually means, not just a shared keyword. If two threads are close, name them and ask which.

## Read Order

⚠️ **Reading the matching `summary.md` is the MANDATORY FIRST ACTION of this command.** There is no path through `/read-notes` that answers or continues a thread without first loading its journal — the whole point is that the log carries the decisions, the read on people, and the standing takeaways your prior turn-context may have lost. The first tool call after `/read-notes` fires must be the Glob/Grep discovery (or a direct Read if given a path), never an answer.

1. Read the resolved thread file.
2. Check LLM-CONTEXT `Related:` for linked journal threads — read those too if the user's question spans them.
3. Lead with the **Quick Start** + **Standing Takeaways** + **Open Threads** — that's the live state; older entries are background unless the user asks about a specific past conversation.
4. **Surface a due Review.** If the header has a `Review:` date that has passed (today is 2026-06-18) or a `Review:` condition the user just indicated has occurred, raise it proactively: name the open item it was attached to and ask how it landed. This read-path is the single thing that keeps the journal from rotting — don't skip it.

## Argument Detection

Loading the log comes first for every intent. The intent only decides what happens after:

- **Path / slug** → Read it, surface Quick Start + Open Threads, then **wait for the user's next instruction**.
- **A question about the thread** ("what did we decide about X?", "where did the boss thing land?") → Load the log, then answer *from it* — reconcile every part of the question against the entries, don't answer from memory of this session alone.
- **A new development to record** (the user is telling you what just happened) → Load the existing log for context, then hand off to the `notes-summary` skill to append an entry.

## Execute

Invoke the `notes-summary` skill with this input:

$ARGUMENTS
