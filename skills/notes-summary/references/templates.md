# Notes Summary Templates

Two formats. Use **Running-Log** for any thread that will recur (a relationship, an ongoing decision, a competitor you'll revisit). Use **Minimal** only for a genuine one-off you still want recorded.

---

## Running-Log Template (default)

This is the gold standard. Header → Quick Start → Standing Takeaways → Index → dated Entries → Open Threads.

````markdown
<!--LLM-CONTEXT
Status: <Active | Resolved | Watching | Dormant>
Domain: <boss | career | team | clients | strategy | personal>
People: <names + roles, e.g. Hong Liang Ng (founder), KL (teammate)>
Last updated: <YYYY-MM-DD>
Private: true
Review: <date or condition — omit if no real follow-up; e.g. 2026-07-18, or "when boss gives sheet feedback">
Related: <other ~/.claude/notes/<domain-slug>/<thread-slug>.md threads, if any>
-->

# <Thread Title> — <who/what it's about>

> **What this is:** A private running journal of <one line: what this thread tracks>.
> Personal context — NOT for the repo, task docs, or auto-memory. New conversations get
> appended as dated entries below.
>
> **To resume with Claude:** `@notes/<domain-slug>/<thread-slug>.md` — or ask "what's the
> status on <thread>".

## Quick Start
<!-- Rewrite EVERY update. A cold-start reader gets oriented from THIS alone. ≤12 lines. -->
- **Current state:** <where this thread stands right now, one or two lines>
- **What I'm waiting on / next move:** <the immediate open thing>
- **Watch out:** <the 1-2 things that would trip future-me on this thread>

## Standing Takeaways
<!-- The durable rules/expectations/insights future-me acts on. EDIT these as they evolve —
     don't append contradictions. This is the most valuable block in the file. -->
1. <Durable rule or expectation, stated as guidance to future-self>
2. <...>

## Index
- [YYYY-MM-DD — <entry title>](#yyyy-mm-dd--entry-title)

## Entries
<!-- Newest appended at the bottom. Never overwrite a past entry. -->

### YYYY-MM-DD — <entry title>

**Context:** <where/with whom, channel, what prompted it>
**What happened:** <tight paraphrase — the decision, the dynamic, what mattered. Quote
verbatim only when exact wording is the point.>
**What was decided / my read:** <the conclusion reached, the interpretation landed on>
**Open from this entry:** <anything left hanging — also reflect in Open Threads below>

## Open Threads
<!-- Live checklist across ALL entries. Tick/remove done, add new. -->
- [ ] <pending follow-up>
````

---

## Minimal Template (one-off)

For a single conversation you want on record but don't expect to revisit.

````markdown
<!--LLM-CONTEXT
Status: Resolved
Domain: <domain>
People: <names + roles>
Last updated: <YYYY-MM-DD>
Private: true
-->

# <Title>

**Date:** <YYYY-MM-DD> · **With:** <people> · **Where:** <channel>

## What happened
<tight paraphrase of the conversation that matters>

## What was decided / my read
<the conclusion, interpretation, or outcome>

## Takeaways
- <durable insight, if any>

## Open
- [ ] <follow-up, if any — else "none">
````

---

## Format notes

- **Entries accumulate; summary blocks stay lean.** Unlike task-summary's Last Session (overwritten each run), journal entries are the permanent chronological record. The blocks that must stay current are Quick Start, Standing Takeaways, and Open Threads.
- **Decisions supersede, never rewrite.** A *Standing Takeaway* (durable rule) is edited as it evolves; a *decision made at a point in time* is not. When a decision changes, append a new entry referencing the old (`Decided Y, supersedes the 2026-06-18 decision to do X`) and leave the original verbatim — hindsight bias makes the frozen original the whole learning signal. See SKILL.md §4b.
- **The review loop keeps it alive.** Set `Review:` in the header when an entry has a real future check; the read path surfaces it when due. This, not writing quality, is what stops a journal rotting (SKILL.md §4c).
- **Emotional/relational context is in scope** — this is a personal journal. Record how something landed and why, if future-you would act differently knowing it. Skip pure narration ("we talked for an hour").
- **Mermaid / tables** are fine wherever a visual helps (e.g. a timeline of a multi-message thread).
- **Anchor links** in the Index use GitHub-style slugs (lowercase, spaces→hyphens, punctuation stripped) so they resolve when the file is viewed as markdown.
- **Entry style** — one idea per sentence; no filler words ("basically", "essentially", "in order to", "please note that", "this means that", "it is important to", "as mentioned"). If removing the phrase doesn't change meaning, remove it.
