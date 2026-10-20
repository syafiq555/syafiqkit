<!--LLM-CONTEXT
Status: Source #11 graded 2026-10-09 — adopted into `uiux` 1.373.0; critique mode not yet run on a real screen
Domain: plugin-maintenance/external-guidance (source #11, two design skills)
Related: `../current.md` (index — which file holds which decisions), `applying-verdicts.md` (D-second-pass-on-uiux, D-third-pass-on-uiux: the earlier passes on `uiux`), `skill-survey-2026-10.md`
Last updated: 2026-10-20: both sources vendored whole as `taste` and `impeccable`, routing decided (`#vendored`)
-->

# Evaluating External Guidance — Two Design Skills (source #11)

Source #11 (2026-10-09) was two design skills, `pbakaus/impeccable` (Apache-2.0, v4.5.2) and `Leonxlnx/taste-skill` (MIT), retrieved by two haiku agents and spot-checked against the GitHub API and raw files (stars, licence, last push, three quoted rules, file counts all matched). Adopted into `uiux` as 1.373.0: a critique mode with 0–4 scoring over Nielsen's ten heuristics and two isolated reviews (impeccable), a named generic-look list reframed as questions (both), a one-line design read before code (taste's "Design Read"), a stop-polishing rule (impeccable's bounded verification), and a short marketing-page reference. Rejected: taste's 87 KB single file, capitalised "mandatory" bans, the em-dash ban, and its "production tests" claims, which link no data; impeccable's Rust detector and PRODUCT.md/DESIGN.md files, because ours already writes design decisions into `frontend/CLAUDE.md`. Taste excludes dashboards and forms, so only rules that transfer to business tools went into the main skill. Review of the first draft changed five things: critique mode now says how to run (screenshots saved as files because a subagent cannot see a pasted image, two unnamed `general-purpose` agents so reports return, parent merges); heuristics 7 and 10 may be n/a on landing pages with the score printed over /32; the "trend across runs" claim was dropped because nothing stores a score between sessions; the `product-reviewer` template now tells the reviewer to skip critique mode (it is already the reviewer), which generated copies pick up only through `/agent-setup`; and the description gained "review" and "looks generic or AI-made" triggers. A second review round added to critique mode: a fallback when the three widths cannot be captured (design view inline, evidence view marked "not measured"), a prompt skeleton for the two agents (paths, audience and job, return shape), "not observable" as a score state beside n/a, `marketing-pages.md` as the yardstick for landing-page critiques, and the closing question through `AskUserQuestion`. Open: critique mode has not been run on a real screen, and `uiux`'s trigger for "critique this" is untested until a fresh session.

## 2026-10-20: both vendored whole, and who owns which design request {#vendored}

Both sources were later copied in whole as skills (shipped 1.406.9): `taste` from tasteskill v2 commit `63aba5f`, MIT, and `impeccable` 4.7.0, Apache-2.0. Each folder's `SOURCE.md` lists the local patches. This reverses two of the 2026-10-09 rejections (taste's large single file, impeccable's downloaded binary) for one reason: on a marketing page, `uiux`'s judgement, built for restraint inside apps, kept settling on the category default. On 2026-10-19 the Azlan Drive site went through several `uiux` rounds of "extravagant" and "bump more looks wow" before `taste` existed.

Routing, as the user decided on 2026-10-20 (asked through `AskUserQuestion`):

| Request | Owner |
|---|---|
| Make a public-facing page (landing, marketing, portfolio) look better, whatever the verb (build, redesign, polish, improve, "wow"), even when the user names `uiux` | `taste` |
| Critique with no edits, research on how others solve it, a named small fix ("price cut off at 375px") on such a page | `uiux` |
| Anything inside an existing app | `uiux` |
| The user names impeccable (alone or `/impeccable <command>`); a bare "polish" or "critique" is not a name | `impeccable` |
| Pictures owing a credit (CC BY, CC BY-SA) on a client's commercial site | Allowed with a footer credit; `taste/references/imagery.md` owns the credit rules |

`taste/SKILL.md` is about 38 KB, past the 5,000-token re-attach point, and its inspector gate and no-Chrome or no-Node-22 fallbacks come after that point. The user chose a one-line re-read pointer under its title over leaving the file byte-identical. Open: neither skill has been trigger-tested in a session started after it was written (a reload registers the name but not the description). The test is "redesign the site" in `mamat-marketing-site`.
