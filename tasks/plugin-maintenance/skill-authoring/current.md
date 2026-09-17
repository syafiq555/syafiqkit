<!--LLM-CONTEXT
Status: ✅ Two skills shipped (1.291.0) — casual-message, continue-session
Domain: plugin-maintenance
Gotchas (critical — full list in ## Gotchas below):
  - A mid-session reload registers a skill's NAME but not its description, so it cannot auto-fire and a trigger test done then measures nothing
  - A new skill's overlap hides behind CATEGORY words a vocabulary grep never reaches
Related:
  - ../agent-architecture/current.md (sibling feature — dispatch and delegation; issue #27 closed from here)
  - ../doc-condensation/current.md (sibling feature — the pointer-defers-a-rule finding behind the deferred `skill-creator` item)
Last updated: 2026-09-17
-->

# Plugin Maintenance — Skill Authoring

## Quick Start (read this first in next session)

**Next action**: Trigger-test both new skills in a session started AFTER 2026-09-17 — say "reply to syazwan, make it like my standard whatsapp message" and confirm `casual-message` wins over `gchat-format`; say "let's continue" and confirm `tackle` wins over `continue-session`. This cannot be done in the authoring session — a mid-session reload registers the name but not the description (first Gotcha row).
**Current state**: 1.291.0 in both manifests. Committed as one release covering twelve versions (1.280.0–1.291.0) accumulated across several sessions, not just this work.
**Success looks like**: Each of the four phrasings routes to the intended skill, and issues #29/#30 close by hand.

## Overview

How skills in this plugin get created, scoped against their siblings, and verified to actually fire — the authoring concerns `skill-creator` runs but does not record.

## Task Status

| Item | State |
|------|-------|
| `casual-message` (#29) | ✅ Written, registered, resolves by name |
| `continue-session` (#30) | ✅ Written, registered, resolves by name |
| Reciprocal carve-outs | ✅ `gchat-format`, `tackle` both updated |
| `gchat-format` proactive row | ✅ Added (was direct-only) |
| Trigger test | ⏸️ Blocked until a fresh session |
| #29 / #30 closure | ⏸️ After ship |

## Key Technical Decisions

**Register is inferred, not asked.** #29's audience gate fired correctly and still produced a formal document, so a second "how formal?" question would move the failure one question later rather than remove it. `casual-message` reads register off how the request is phrased. The one exception is a named **client** contact — the trigger fires on "tell X that…" whoever X is, so a client inherits the casual default by phrasing alone, which is the original bug pointing the other way.

**The split is document vs. message, never destination.** A Google Chat DM to a colleague is `casual-message`; a WhatsApp broadcast to a client group may not be. Destination was rejected as the axis because it is the misreading the issue itself warned about.

**#30's auto-offer keys on observable events, not a context estimate.** The issue asked for it to fire "when the session is deep into its context window". A session cannot measure its own remaining context — asking returns willingness, not membership, a failure this repo already paid four agreeing probes for. The proxies are: work parked with a reason, visible compaction, the user saying they're clearing.

**Named `continue-session`, not `/handoff`.** `design-handoff` already owns that vocabulary, and two skills competing on one word both trigger weakly.

**D70 — the hidden-overlap check moved to where the skill is drafted, and a second copy went to `update-plugin`.** The rule was correct and unreached: `skill-creator` line 16 prescribed grepping your own feature's vocabulary, and the caveat that a sibling claims the *category* word instead sat in `references/trigger-testing.md`, cited at line 46 — after "Registering it". A session finds it only by opening the reference out of order, which is how the `tackle` overlap was caught here, late. The grep isn't just insufficient, it is actively misleading: it returns clean and reads as a completed check. Fixed at line 16 where the act happens, with the reference kept for the rest. The sweep for who else owns the mechanism found `update-plugin` **maintains** descriptions with zero overlap coverage — a session widening a trigger there can collide exactly the same way — so its Step 5 now carries it too, including that a shared boundary belongs in both descriptions.

## Gotchas

### Registration and trigger verification

| Symptom | Cause | Fix |
|---------|-------|-----|
| New skill resolves by name but never auto-fires; listing shows it with an empty description | A mid-session `/reload-skills` or `/reload-plugins` registers the NAME but not the `description`, and the description is what a request is matched against | Trigger-test only in a session started after the file was written. Four other skills showed the same blank with full descriptions on disk |
| `Unknown skill` on a file that is correct | Skills register at session start | Reload first; the error names the skill, not the registry, which sends you editing a good file |
| A new skill quietly competes with an existing one | The sibling claims your subject in CATEGORY words your vocabulary grep never searched (`tackle` owns "continuation"; found only by reading descriptions) | Read the descriptions of every adjacent skill before writing. `skill-creator`'s own reference says this — but behind a `📖` after "Registering it", so it arrives after the skill is written |

### Registry and versioning

| Symptom | Cause | Fix |
|---------|-------|-----|
| A skill reads as registered yet never fires unprompted | `CLAUDE.md` has two tables and it was filed in the direct one only; a sync check passes because it appears *somewhere* | A skill that fires both ways needs a row in each. `gchat-format` had this defect for its whole life |
| Pre-commit hook blocks the commit | `plugin.json` and `marketplace.json` disagree | Read BOTH working copies (not just against HEAD), take the higher, bump from there. A peer session can claim your intended number mid-session — 1.290.0 was taken this way |

## Next Steps

### Blocking issue closure

- [ ] 🔴 Trigger-test all four phrasings in a fresh session (see Quick Start) — the one check that settles the overlap risk
- [ ] 🟠 Close #29 and #30 by hand after ship, per this repo's convention

### Deferred / accepted

- [ ] 🟡 `done`'s one-message dispatch rule failed a seventh time this session (reviewer sent alone, then two). Count corrected in the skill; deliberately **not** reworded — 1.288.0 ruled that a further restatement makes it less followed, and the sixth and seventh both came after the paragraph was already moved to the dispatch. The next person changes the instrument or accepts it as a model-side lapse

## Last Session (2026-09-17)

Resolved three open GitHub issues. #27 was found already fixed in 1.211.0 and closed with a comment — it had simply never been closed by hand. #29 and #30 produced the two new skills above.

The product reviewer caught that `casual-message` cited `gchat-format`'s `## Key Rules` for WhatsApp syntax while that section never mentions WhatsApp and is framed entirely as document-conversion — exactly the half of #29 that asked for WhatsApp to be named. Fixed at the citation: the shared inline syntax is now stated in `casual-message` itself, with the pointer kept for detail and scoped to ignore the header/table/fence conversions.
