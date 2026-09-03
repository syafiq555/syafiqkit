---
name: notes-summary
description: Create, update, or read a personal session journal — a living log of non-code conversations, decisions, feedback, and dynamics that don't belong in the repo. Use whenever the user wants to record or recall a discussion that isn't feature work: boss/teammate/client feedback, career or relationship dynamics, strategy and planning chats, vendor calls, or any "remember this conversation so I can refer back later" request. Stores logs privately under ~/.claude/notes/<domain-slug>/<thread-slug>.md (never committed, never auto-memory). Trigger this even when the user just says "log this", "save this convo", "what did we decide about X", "record this somewhere", "start a journal for X", or references an existing notes file.
---

# Notes Summary

A personal session journal for the things that don't belong in code. Task docs (`tasks/**/current.md`) capture *feature work* for the team; auto-memory captures *facts*. This captures the third thing: **conversations, decisions, and dynamics that are yours alone** — what your boss actually meant, what you decided to do about it, what to watch next time. Living documentation, always reflecting current understanding — not a transcript dump.

⚠️ **Privacy: These logs stay outside the repo, never committed, never in auto-memory.** Journal content is personal/sensitive (boss feedback, career thinking, relationship dynamics) and must remain private. Never write a journal entry into `tasks/`, the repo, or shared docs — the whole point is they stay on this machine only.

⚠️ **Not for Claude behavior preferences.** A durable working-style or communication preference for Claude belongs in global `~/.claude/CLAUDE.md` (Working Style section), not here. A journal records what a *person* said/decided; CLAUDE.md records how *Claude* should act. Capture behavior-steering input via `update-claude-docs` — never as a journal thread.

## Why this shape

Task docs capture *feature work* for the team. Auto-memory captures *facts* the assistant recalls passively. This captures something else: deliberate reading and reasoning that only you do across sessions. It borrows task-summary's discipline (header, Quick Start, dated entries, density rules) because that discipline works — just pointed at `~/.claude/notes/` (private, on this machine) instead of `tasks/` (committed).

The privacy that makes this work also makes it undiscoverable: nothing under `tasks/` or in a project tree can link here, so a session doing project work reaches the journal only if it thinks to look. `read-summary`'s Read Order is where that looking is supposed to happen, and it is worth knowing from this side too — a thread recording *why* a decision was made is only worth writing if a later session reading around that decision can find it.

## Workflow at a glance

Do these in order:

1. **Resolve path** — find or name the thread (full path / slug / scan existing).
2. **Read the template** — canonical section structure from `references/templates.md`.
3. **Create or update** — new file uses template; existing file appends dated entry.
4. **Distil Standing Takeaways** — lift durable rules/expectations above the narrative.
5. **Validate** — header, Quick Start, index, entries, sections all current.

## Path naming convention

Paths live at `~/.claude/notes/<domain-slug>/<thread-slug>.md` where both segments are **descriptive, never generic**:

- `<domain-slug>`: the broad area or person (`boss-hong-liang-ng` not just `boss`, `career`, `clients`).
- `<thread-slug>`: the specific thread (`feedback-and-expectations`, `salary-review-2026`, never `summary`).
- **kebab-case, lowercase, stable** — dates live inside entries, not filenames. The path is the address; the file's header carries full context.

Examples: `boss-hong-liang-ng/feedback-and-expectations.md`, `career/salary-review-2026.md`, `strategy/listmy-competitor-response.md`

`~/.claude/notes/` is machine-local and private — not synced, not in git. If the user wants a portable/backed-up copy, mention they can drop one in a synced location too, but this stays the canonical home.

## Resolving paths

| Input | Action |
|-------|--------|
| Full path (`~/.claude/notes/.../<thread>.md`) | Use as-is |
| `domain-slug/thread-slug` | Expand to `~/.claude/notes/<domain-slug>/<thread-slug>.md` |
| Fuzzy description / empty | **Scan** (see below) |

### Scan (when no explicit path)

Find the thread by content: `Glob ~/.claude/notes/**/*.md` + `Grep` for vocabulary from the request (synonyms: "boss" → person's name). Rank candidates by header + title + index; pick the actual thread, not just a keyword match. No match → propose a new descriptive slug.

## Creating or updating a journal

Read `references/templates.md` for the canonical structure (Running-Log or Minimal template).

**Creating**: Use the Running-Log or Minimal template. Required header fields (LLM-CONTEXT block): `Status`, `Domain`, `People`, `Last updated`, `Private` (always true). Optional: `Review` (date or condition for follow-up — see Review & Durability below).

**Updating**: Append a **new dated entry** under `## Entries` (newest at bottom); never overwrite past entries. A journal is chronological by nature — entries accumulate as the record. Refresh the **Standing Takeaways** block (live summary of durable rules). Update Quick Start + Index to reflect current state, and the Open Threads checklist — tick off what's resolved, add what's new.

The key: **Entries are immutable records, Standing Takeaways are the living summary.** Capture meaning not full transcript, decisions not narrative logistics, durable rules not one-off comments. Fold new takeaways into the Standing Takeaways block so they're findable without re-reading the thread. If an entry introduces a new rule or refines an old one, update the takeaway; never bury lasting insights inside a narrative entry.

## Standing Takeaways

This is what separates a useful journal from a pile of notes. After capturing an entry, distill: **"What durable rule, expectation, or insight should future-me act on — without re-reading everything?"** Lift those into `## Standing Takeaways` (near the top, tight and rule-only, not narrative).

Example: an entry recounting a boss's feedback becomes the takeaway "Boss measures reaction latency, not hours—I should respond faster, not longer." When a new entry refines or contradicts an old takeaway, **edit it** — don't append a duplicate.

If an entry records a genuine decision (not routine chat), see Decision-supersession below.

## Decision-supersession

A *durable rule* (Standing Takeaway) can be edited as it evolves. A **decision made at a point in time** ("I'll do X", "I'll take the job") must NOT be rewritten when it changes — append a new entry that supersedes the old one, leaving the original's reasoning intact. The pair ("what I thought then, why I changed") is the entire learning signal.

Convention (only when an entry records a genuine decision):
- New entry: `### YYYY-MM-DD — Decided Y (supersedes 2026-06-18 decision to do X)`.
- Old entry: leave verbatim; optionally add `> Superseded by 2026-MM-DD.` for clarity.
- Capture **what you expect to happen** + (optionally) **what would change your mind** — so a future review has something concrete to check against.

## Review & Durability

Journals die when nothing resurfaces them. The highest-leverage habit is the *read* side, not the write side.

Keep this a lightweight affordance, not heavy process — heavy process kills the review habit as surely as no process does. When an entry has a future check worth making, set `Review: <date or condition>` in the header (e.g. `Review: 2026-07-18` or `Review: when boss gives feedback`). On any `/read-notes` or update, surface reviews that have come due: "you flagged this for review on X — did the open item land as expected?" That read-path is what prevents rot; a Review nobody surfaces is a note to self nobody reads. A dormant thread is fine with `Status: Dormant` and no Review — not everything needs a follow-up, only matters with a real check to make.

## Capturing entries with density

A journal bloats in two ways: transcript-dumping and repeating the same insight across entries. Guard both using a **capture filter**: keep a detail only if future-you would *act or feel differently* knowing it. Emotional context counts (it's personal) — but "we talked for an hour" doesn't qualify; "she said she was wrong and praised my honesty" does.

Entry structure: each `### YYYY-MM-DD — <title>` entry stands alone (context, what happened, what was decided, open items). Paraphrase what was *said that matters*, what was *decided*, what to *do next* — quote verbatim only when exact wording is the point.

A durable rule lives once in Standing Takeaways, not restated in every entry — an entry can reference it ("reinforced the X rule") but doesn't re-explain it.

No hard size limit (journals grow over time), but keep Standing Takeaways and Quick Start lean — *entries* accumulate, *summaries* stay sharp.

For full guidance on capture, meaning vs. narrative, and editing discipline: 📖 `../_shared/references/writing-style.md`.

## Validate before finishing

Re-read after writing:
1. Header: Status, Domain, People, Last updated, Private (always true)
2. Last updated = today
3. New entry dated, appended (not overwritten), and indexed
4. Quick Start reflects current state
5. Standing Takeaways updated if the entry introduced/changed a rule
6. Open Threads checklist current

Never write real passwords or secrets into a journal, even here — it's private, not a vault.
