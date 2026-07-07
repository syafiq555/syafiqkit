---
name: notes-summary
description: Create, update, or read a personal session journal — a living log of non-code conversations, decisions, feedback, and dynamics that don't belong in the repo. Use whenever the user wants to record or recall a discussion that isn't feature work: boss/teammate/client feedback, career or relationship dynamics, strategy and planning chats, vendor calls, or any "remember this conversation so I can refer back later" request. Stores logs privately under ~/.claude/notes/<domain-slug>/<thread-slug>.md (never committed, never auto-memory). Trigger this even when the user just says "log this", "save this convo", "what did we decide about X", "record this somewhere", "start a journal for X", or references an existing notes file.
---

# Notes Summary

A personal session journal for the things that don't belong in code. Task docs (`tasks/**/current.md`) capture *feature work* for the team; auto-memory captures *facts*. This captures the third thing: **conversations, decisions, and dynamics that are yours alone** — what your boss actually meant, what you decided to do about it, what to watch next time. Living documentation, always reflecting current understanding — not a transcript dump.

⚠️ **A durable working-style / communication preference for how Claude should behave is NOT a journal entry — route it to global `~/.claude/CLAUDE.md` Working Style, not here.** When the user hands you a preferred output format or working correction ("give me summaries like this instead", "always X when you Y"), that steers behavior on every future session — it must live in the always-loaded global CLAUDE.md, not a passively-read private journal. Capture it via `update-claude-docs` (or edit the global file directly); do NOT absorb it as a notes thread or a Standing Takeaway. A journal records what a *person* said/decided; global CLAUDE.md records how *Claude* should act.

## Why this exists (and why not the alternatives)

- **Not in the repo.** This content is personal/sensitive (boss feedback, career thinking, relationship dynamics). It must never be committed where a teammate could read it. So it lives outside the repo entirely.
- **Not auto-memory.** Memory is for durable *facts* the assistant recalls passively. A journal is something the user deliberately reads, appends to, and reasons over across sessions — it needs structure and a stable address, not scattered fact-files.
- **Like task-summary in shape, not in home.** It borrows task-summary's living-doc discipline (header, Quick Start, dated entries, density rules) because that discipline works. It just points at `~/.claude/notes/` instead of `tasks/`.

## Storage convention

```
~/.claude/notes/<domain-slug>/<thread-slug>.md
```

Every path segment must **earn its place** — one-word segments are too thin to recall later. Make both the folder AND the filename descriptive; the filename is NOT a constant like `summary.md` (naming every file the same makes the leaf carry zero information — the PKM equivalent of naming every variable `data`).

- `<domain-slug>` = the broad area, named specifically: `boss-hong-liang-ng` (not just `boss` — *which* boss?), `career`, `clients`, `strategy`. Include the person/subject when the domain is about someone.
- `<thread-slug>` = the specific thread, named after its subject: `feedback-and-expectations`, `raja-aisyah-onboarding`, `salary-review-2026`. Never `summary`.
- Examples:
  - `~/.claude/notes/boss-hong-liang-ng/feedback-and-expectations.md`
  - `~/.claude/notes/boss-hong-liang-ng/raja-aisyah-onboarding.md`
  - `~/.claude/notes/strategy/listmy-competitor-response.md`
  - `~/.claude/notes/career/salary-review-2026.md`

⚠️ **Naming rules** (from PKM research — files must stay stable and linkable):
- **Evergreen, never date-prefixed** the *filename* — dates live inside entries, not in the slug, so the file stays stable as a link target. (A year suffix like `salary-review-2026` is fine when the year *is* the identity.)
- **kebab-case**, lowercase, descriptive. A reader seeing the path alone should grasp the thread.
- The path is the *address*; the file's `# Title` + LLM-CONTEXT header carry the *full* human-readable context (people, roles, what it's about). Keep the path a reasonable length and let the header do the heavy lifting.

⚠️ `~/.claude/notes/` is machine-local and private — not synced, not in git. If the user wants a portable/backed-up copy, mention they can also drop it in a synced location, but the canonical home stays here.

## Workflow at a glance

Do these in order — details below.

1. **Resolve path** — turn the input (full path / `domain-slug/thread-slug` / fuzzy description / empty) into `~/.claude/notes/<domain-slug>/<thread-slug>.md`. No explicit path → run the scan (Step 1).
2. **Read the template** — `references/templates.md` holds the canonical sections. Pick Running-Log (multi-entry thread) or Minimal (one-off).
3. **Create or update** — missing file → template; existing → edit in place, append a new dated entry, gap-check sections.
4. **Distil into Standing Takeaways** — the durable rules/expectations that future-you acts on, lifted above the narrative.
5. **Validate** — re-read: header complete, Quick Start current, index updated, no entries lost.

## 1. Resolve Path

| Input | Action |
|-------|--------|
| Full path (`~/.claude/notes/.../<thread>.md`) | Use as-is |
| `domain-slug/thread-slug` | Expand to `~/.claude/notes/<domain-slug>/<thread-slug>.md` |
| Fuzzy description / empty | **Scan** — see below |

### Scan (when no explicit path given)

The user describes the thread in their own words ("the thing with my boss about being faster", "the onboarding chat"), which rarely matches the slug exactly. Discover by content:

1. **List + grep in one tool block**: `Glob ~/.claude/notes/**/*.md` AND `Grep` those files for the concept's vocabulary from the request (plus synonyms — "boss"→a person's name, "competitor"→the product name).
2. **Rank**: read the top candidates' header block + `# Title` + Index. Pick the one whose subject matches the user's *actual* thread, not just a shared keyword.
3. **No match → Create.** A new thread gets a new file. Propose a descriptive `<domain-slug>/<thread-slug>.md` and confirm with the user if ambiguous — the slug is how they'll find it again, so make it self-explaining (see naming rules above).

## 2. Read the template

Read `references/templates.md` before writing either path — it holds the canonical section structure for both Running-Log and Minimal formats.

## 3. Create or Update?

- **Missing file** → Create using the Running-Log template (or Minimal for a genuine one-off).
- **Exists** → Update in place: append a new dated entry under `## Entries`, refresh Quick Start + Index, and fold any durable rule into Standing Takeaways.

### When creating

Required header fields (LLM-CONTEXT block): `Status`, `Domain`, `People`, `Last updated`, `Private` (always true). Optional but recommended: `Review` (a date or condition — see §4c).

### When updating

Each conversation becomes a new **dated entry** appended under `## Entries` — newest at the bottom, with an index line added at the top. This is the key difference from task-summary: a journal is **chronological by nature**, so entries accumulate (they are NOT overwritten like task-summary's Last Session). What gets pruned/distilled instead is the **Standing Takeaways** block — that stays current.

| ❌ Never | ✅ Always |
|---------|---------|
| Overwrite a past entry | Append a new dated entry; past entries are the record |
| Paste the full chat transcript | Capture the *decision, the read, and what to do next* — not every line |
| Bury the durable rule inside one entry's narrative | Lift it into Standing Takeaways so it's findable without re-reading the whole thread |
| Let Quick Start / Index go stale | Rewrite Quick Start every update; add an Index line per new entry |
| Leave open follow-ups untracked | Maintain the Open Threads checklist — tick/remove done, add new |

## 4. Standing Takeaways (the heart of a journal)

This is what separates a useful journal from a pile of notes. After capturing an entry, ask: **"What durable rule, expectation, or insight should future-me act on — without re-reading the whole story?"** Lift those into the `## Standing Takeaways` block near the top. Examples: "boss measures reaction latency, not hours"; "decide and give him an opt-out, don't push the decision up". Keep it tight — these are the rules, not the narrative. When a new entry refines or contradicts an old takeaway, **edit the takeaway** (don't append a contradicting one).

## 4b. Decisions: supersede, never rewrite

A *durable rule* (Standing Takeaway) can be edited as it evolves. But a **decision you made at a point in time** ("I'll reply with X", "I'll take the job") must NOT be rewritten when it changes — append a new entry that references and supersedes the old one, and leave the original entry's reasoning intact.

The reason is specific to personal logs and stronger than the ADR audit-trail argument: **hindsight bias silently overwrites what you believed before you knew the outcome.** Your brain doesn't store the original belief and flag the update — it replaces it. So the frozen "what I was thinking when I decided X, and why I later switched to Y" pair is the entire learning signal. Rewriting X to look like Y destroys it.

Convention (only when an entry records a genuine *decision*, not every conversation):
- New entry: `### YYYY-MM-DD — Decided Y (supersedes 2026-06-18 decision to do X)`.
- Old entry: leave the body verbatim; you may add a one-line trailer `> Superseded by 2026-MM-DD.` so a reader isn't misled.
- For a second-guessable decision, capture **what you expect to happen** + (optionally) **what would change your mind** — so the later review has something to check against. Skip this for routine chat; reserve it for decisions you'd actually want to learn from.

This mirrors what ADRs, decision journals, and append-only logs independently converge on: append + supersede, never overwrite.

## 4c. The review loop (what actually keeps a journal alive)

The dominant reason these logs die is NOT bad writing — it's that nothing ever resurfaces them. "Documentation without a read path is performance art." A record written and never re-read drifts from reality and becomes a graveyard. So the highest-leverage habit is the *read* side, not the write side.

Lightweight affordance (don't over-engineer — heavy process kills the habit just as surely as no process):
- When an entry has a future check worth making — a decision whose outcome you'll want to grade, an open thread with a deadline — set `Review: <date or condition>` in the header (e.g. `Review: 2026-07-18` or `Review: when boss gives sheet feedback`).
- On any `/read-notes` or update, **surface a Review that has come due** ("you flagged this for review on X — the open item was Y; how did it land?"). This is the read-path that prevents rot.
- A genuinely dormant thread is fine — `Status: Dormant` and no Review. Not everything needs a follow-up; only set Review when there's a real check to make.

## 5. Density rules

A journal bloats two ways: **transcript-dumping** (pasting whole conversations) and **restating the same insight in every entry**. Guard both:

| Rule | Detail |
|------|--------|
| **Capture the meaning, not the messages** | An entry records what was *said that matters*, what was *decided*, and what to *do next* — paraphrased tightly. Quote verbatim only when exact wording is the point. |
| **No filler words** | Cut: "basically", "essentially", "in order to", "please note that", "this means that", "it is important to", "as mentioned". If removing the phrase doesn't change meaning, remove it. |
| **One insight, one home** | A durable rule lives in Standing Takeaways. An entry can *reference* it ("reinforced the decide-don't-ask rule") but doesn't re-explain it. |
| **Entries are dated and self-contained** | Each `### YYYY-MM-DD — <title>` entry stands alone: context, what happened, what was decided, open items. A reader skimming one entry shouldn't need three others to follow it. |
| **Capture filter** | Keep a detail only if future-you would *act or feel differently* knowing it. Emotional context counts here (it's a personal journal) — but "we chatted for an hour" doesn't; "he conceded the point and praised speaking up" does. |

Size: no hard line limit (journals legitimately grow over time), but if a single file's Standing Takeaways or Quick Start sprawls, condense those — the *entries* are allowed to accumulate, the *summary blocks* must stay lean.

## 6. Validate

Re-read after writing:
1. Header has Status, Domain, People, Last updated, Private: true
2. Last updated = today
3. New entry is dated, appended (not overwriting), and indexed
4. Quick Start reflects the *current* state of the thread
5. Standing Takeaways updated if the entry introduced/changed a durable rule
6. Open Threads checklist current

## Privacy reminder

❌ Never write these logs into the repo, a `tasks/` doc, or auto-memory — the whole point is they stay private. ❌ Never include real passwords/secrets even here. If a log references people, that's expected (it's a personal journal), but treat it as confidential by default.
