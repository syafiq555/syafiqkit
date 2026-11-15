<!--LLM-CONTEXT
Status: `uiux` is the one design skill, with `impeccable`, `taste` and `taste-web` as its modules (plugin 1.436.0, uncommitted); critique mode not yet run on a real screen
Domain: plugin-maintenance/external-guidance (source #11, two design skills)
Gotchas (critical): The `#vendored` routing table is superseded, so route design requests by the job table in `skills/uiux/SKILL.md`. `uiux`'s trigger for "critique this" is untested until a session started after it was written.
Related: `../current.md` (index: which file holds which decisions), `applying-verdicts.md` (D-second-pass-on-uiux, D-third-pass-on-uiux: the earlier passes on `uiux`), `skill-survey-2026-10.md`
Last updated: 2026-11-15: the owner chose to combine `taste-web` and `taste` on public pages (`#modules`); current state at the top, `#vendored` and `#one-entry` marked superseded
-->

# External Guidance: Two Design Skills (source #11)

## Current state {#current}

As of 2026-11-15, verified against the tree:
- `uiux` is the one design skill. Its router `SKILL.md` measures 4,746 tokens (the earlier 4,051 predates taste-web and the combined page row).
- `impeccable` (4.8.2), `taste` (2.1) and `taste-web` (2.5.1) live inside it as modules at `skills/uiux/modules/<name>/`, each with `MODULE.md` and `SOURCE.md`. On a public page the two taste modules run as one job, one leading by page kind (`#modules`).
- The `taste-web` finish gate's Stop hook has passed shell tests (silent with no build; an on-screen warning when a build is open and the gate can't run), but has not yet been seen to fire in a real session.
- No separate `impeccable` or `taste` skill remains. Which module answers which request is decided in the job table of `skills/uiux/SKILL.md`; `#modules` records the shape.
- Plugin version 1.436.0, not yet committed.
- Open: critique mode has not been run on a real screen. The `uiux` trigger tests are open until a session started after the skill was written: "critique this", and "redesign the site" in `mamat-marketing-site`. A reload registers the name but not the description.

## Key Technical Decisions {#decisions}

### 2026-11-15 (later): one skill, modules inside it {#modules}

**Current.** Supersedes `#one-entry` the same day. The owner found three skills redundant and asked for one, with the condition "I don't want a single mechanism missing but duplicate can merge", and widened the scope to everything a human sees (web apps, websites, native mobile apps, email, PDF, slides, documents, anything else) with more design skills to merge later.

Shape chosen, answering the objections recorded under `#one-entry`:
- **No loss by construction:** `impeccable` and `taste` moved whole into `skills/uiux/modules/`; only `SKILL.md` was renamed `MODULE.md` with its frontmatter replaced by a module header, so every script, reference and library file stayed as it was (identical to upstream apart from the patches each `SOURCE.md` already listed) and upstream re-syncs still apply. The owner has since allowed each `MODULE.md` to be edited locally, so those no longer match upstream and an upstream update to one is merged by hand. Inventories taken before the move counted 394 mechanisms in `uiux`, 524 in `taste` and 814 in `impeccable`.
- **Size:** `uiux/SKILL.md` became a router (job table, surface table, module registry) under the 5,000-token re-attach limit (counts in `#current`); the long paragraphs it replaced moved word for word into `uiux/references/core-principles.md`.
- **Dilution:** `taste`'s judgement is not folded into `uiux`'s prose; a public-page build reads its lead module whole and follows its run, so that module's voice stays its own.
- **Duplicates** merge only in `uiux`'s own references (tells, mobile, verification, copy), which now index the module files that cover the same ground.
- **Project docs:** `impeccable`'s PRODUCT.md and DESIGN.md are folded into the `setup-project-docs` doc set (product truth in its PRD, the design system in its design doc), per the owner's answer.
- **Edit hook:** `impeccable`'s post-edit detector hook stays off, offered per project.
- **taste 2.5.1 kept beside 2.1:** the owner asked to fetch `taste`'s missing scroll scenes, which exist only from upstream 2.5.0. Upstream calls 2.5.0 "a complete rebuild ... around professional company websites", replacing 2.1's app-screen pipeline, direction deal and juror critique, and gives no reason for removing them. Replacing 2.1 would have broken the no-loss rule, so after a plain-language explanation the owner chose to keep both: `modules/taste-web/` (2.5.1, company websites, scenes, icons, product UI, checker, finish gate moved into `uiux`'s frontmatter as a Stop hook) and `modules/taste/` (2.1, portfolio and editorial pages, app screens, the review engine). Asked the same day which module a landing page goes to and whose rules judge a page `taste-web` built, the owner answered "Can combine" to both, and on a named single engine: "the design skills should do them, that's why i think the mechanism should be combined". So the router runs one public-page job using both: the lead module (`taste-web` for a business selling to a visitor, `taste` for a portfolio, event or editorial page) runs its whole procedure and the other supplies what it does better; where their house rules disagree, the lead module's rule wins, in building and in review; a named `impeccable` critique or audit still runs all three engines. `impeccable`'s saved critique reports (`.impeccable/critique/` in the project) stay, by the owner's choice, and are where a score trend comes from.
- **Future modules** in scope: `dataviz`, `product-still`, `motion-clip`, `explainer-deck`, `user-manual`, the visual side of `design-handoff`; adding one is a folder plus a registry row.

### 2026-11-15: one entry, three engines {#one-entry}

**Superseded by `#modules`, same day.** Kept for the objections `#modules` answers. Its routing (a Skill call to `impeccable` and `taste` from `uiux`) no longer applies.

The user asked whether the three design skills should become one. Chosen (`AskUserQuestion`): `uiux` is the single entry for every design review (critique, audit, grade, `done`'s Design row, the approval gate, "all the design skills"), and its first steps are Skill calls to `impeccable`'s critique and `taste`'s review path, then its own grade, merged in `uiux/references/critique-mode.md`. `uiux`'s copy of impeccable's Nielsen scoring was replaced by the call to `impeccable` itself. Building stays routed as in `#vendored`: who builds a page is unchanged, only who reviews.

Why not a full merge, on evidence gathered and string-checked that day:
- **History:** the 2026-10-09 absorption into `uiux` was reversed on 2026-10-20 for the reason in `#vendored`.
- **Size:** Anthropic, Claude Code and the Agent Skills spec all say to keep `SKILL.md` "under 500 lines" (spec: under 5,000 tokens; platform.claude.com best practices, code.claude.com/docs/en/skills, agentskills.io/specification). The three bodies total about 13,700 tokens, so a merged skill would push most rules into references that load only when opened.
- **Rule density:** IFScale (arXiv 2507.11538) measured even top models at "68% accuracy at the max density of 500 instructions", biased toward earlier ones.
- **Upkeep:** `impeccable` moved 4.7.0 to 4.8.2 in three weeks; both keep local patch lists in `SOURCE.md`, which a merge would turn into manual merges.

For a merge: `taste` had been dropped from reviews five times while each skill had to remember the others; practitioners report selection getting noisier as overlapping skills multiply (dev.to, anecdotal); and `uiux`'s critique mode already duplicated `impeccable`'s scoring. The chosen shape answers the first and third. It still depends on `uiux`'s body being followed, from the start of the task rather than recalled at wrap-up; if `taste` is dropped again, the next instrument is a hook, not more wording.

### 2026-10-20: both vendored whole, and who owns which design request {#vendored}

**Superseded by `#modules`.** This is the 2026-10-20 routing table, kept as the record of that decision. Do not route by it: `uiux` is the entry, and `impeccable`, `taste` and `taste-web` are its modules.

Both sources were later copied in whole as skills (shipped 1.406.9): `taste` from tasteskill v2 commit `63aba5f`, MIT, and `impeccable` 4.7.0, Apache-2.0. Each folder's `SOURCE.md` lists the local patches. This reverses two of the 2026-10-09 rejections (taste's large single file, impeccable's downloaded binary) for one reason: on a marketing page, `uiux`'s judgement, built for restraint inside apps, kept settling on the category default. On 2026-10-19 the Azlan Drive site went through several `uiux` rounds of "extravagant" and "bump more looks wow" before `taste` existed.

Routing, as the user decided on 2026-10-20 (asked through `AskUserQuestion`):

| Request | Owner |
|---|---|
| Make a public-facing page (landing, marketing, portfolio) look better, whatever the verb (build, redesign, polish, improve, "wow"), even when the user names `uiux` | `taste` |
| Critique with no edits, research on how others solve it, a named small fix ("price cut off at 375px") on such a page | `uiux` |
| Anything inside an existing app | `uiux` |
| The user names impeccable (alone or `/impeccable <command>`); a bare "polish" or "critique" is not a name | `impeccable` |
| Pictures owing a credit (CC BY, CC BY-SA) on a client's commercial site | Allowed with a footer credit; `taste/references/imagery.md` owns the credit rules |

`taste/SKILL.md` is about 38 KB, past the 5,000-token re-attach point, and its inspector gate and no-Chrome or no-Node-22 fallbacks come after that point. The user chose a one-line re-read pointer under its title over leaving the file byte-identical.

### 2026-10-09: adopted into `uiux` {#adopted}

Source #11 (2026-10-09) was two design skills, `pbakaus/impeccable` (Apache-2.0, v4.5.2) and `Leonxlnx/taste-skill` (MIT), retrieved by two haiku agents and spot-checked against the GitHub API and raw files (stars, licence, last push, three quoted rules, file counts all matched). Adopted into `uiux` as 1.373.0: a critique mode with 0–4 scoring over Nielsen's ten heuristics and two isolated reviews (impeccable), a named generic-look list reframed as questions (both), a one-line design read before code (taste's "Design Read"), a stop-polishing rule (impeccable's bounded verification), and a short marketing-page reference. Rejected: taste's 87 KB single file, capitalised "mandatory" bans, the em-dash ban, and its "production tests" claims, which link no data; impeccable's Rust detector and PRODUCT.md/DESIGN.md files, because ours already writes design decisions into `frontend/CLAUDE.md`. Taste excludes dashboards and forms, so only rules that transfer to business tools went into the main skill. Review of the first draft changed five things: critique mode now says how to run (screenshots saved as files because a subagent cannot see a pasted image, two unnamed `general-purpose` agents so reports return, parent merges); heuristics 7 and 10 may be n/a on landing pages with the score printed over /32; the "trend across runs" claim was dropped because nothing stores a score between sessions; the `product-reviewer` template now tells the reviewer to skip critique mode (it is already the reviewer), which generated copies pick up only through `/agent-setup`; and the description gained "review" and "looks generic or AI-made" triggers. A second review round added to critique mode: a fallback when the three widths cannot be captured (design view inline, evidence view marked "not measured"), a prompt skeleton for the two agents (paths, audience and job, return shape), "not observable" as a score state beside n/a, `marketing-pages.md` as the yardstick for landing-page critiques, and the closing question through `AskUserQuestion`.