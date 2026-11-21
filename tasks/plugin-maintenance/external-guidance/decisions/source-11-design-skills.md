<!--LLM-CONTEXT
Status: the 15/11/2026 merge is reverted (`#reverted`): `uiux`, `impeccable` and `taste` are separate skills again, routed by `#vendored`
Domain: plugin-maintenance/external-guidance (source #11, two design skills)
Gotchas (critical): `#vendored`'s routing table applies again since the revert. Plan mode can keep `uiux` from firing on a build request, so trigger tests run outside it. A headless test session names `--model` (a user-level hook refuses `claude -p` without one).
Related: `../current.md` (index: which file holds which decisions), `applying-verdicts.md` (D-second-pass-on-uiux, D-third-pass-on-uiux: the earlier passes on `uiux`), `skill-survey-2026-10.md`
Last updated: 2026-11-16: merge reverted (`#reverted`). Before that, 2026-11-15: the fresh-session checks ran (`#checks`). Before that, 2026-11-15: the owner chose to combine `taste-web` and `taste` on public pages (`#modules`); current state at the top, `#vendored` and `#one-entry` marked superseded
-->

# External Guidance: Two Design Skills (source #11)

## Current state {#current}

Since 22/11/2026, `impeccable` is 4.10.0 and `taste` is 2.5.1 (public pages only; its 2.1 app-screen tools live in `uiux/app-kit/`), per `source-13-ui-handling.md`. As of 2026-11-16, verified against the tree: the merge is reverted (`#reverted`). `uiux`, `impeccable` (then 4.8.2) and `taste` (then 2.1) are three separate skills again, routed by `#vendored`'s table; `taste-web` 2.5.1 is not in the plugin, apart from its scroll scenes, now in `taste` (`#after-revert`). `done`'s Design row merges the three reviews into one score (`#after-revert`). A Sonnet retest on the restored skills ran `taste`'s procedure through to its inspector (`#after-revert`). The checks and decisions below describe the merged shape and stay as the record of why it was reverted.

## Fresh-session checks, 2026-11-15 {#checks}

Each ran as a new headless session (`claude -p "<plain request>" --output-format stream-json --verbose`), reading which tools it called. The site lives in `~/Herd/azlan-drive-agent` (`resources/js/info/`, served as `info.azlandrive.com`); `mamat-marketing-site` is frozen since 20/10/2026 and a session there correctly refuses to redesign it. Build requests ran in a throwaway worktree.

| Check | Model | Result |
|---|---|---|
| Trigger: "critique this screen: the tenant list page" (Autorentic) | Opus, Sonnet | ✅ `uiux` was the first call on both |
| Trigger: "redesign the info site" (`azlan-drive-agent`) | Opus | ✅ outside plan mode: `uiux` first, then `taste-web` opened. ❌ in plan mode: no `uiux` in 6 turns, scoping questions instead |
| Trigger: "redesign the site" (`azlan-drive-agent`) | Opus | Asked "which site?" (info page or app) before any skill, which is fair there |
| One combined review end to end, one score | Sonnet | ❌ `uiux` invoked, `critique-mode.md` read, screenshots at 375/768/1280, 9 sound findings; but no isolated reviewers, no detector, no `taste` inspector, and an informal "about 27/40". It listed each as not run, so the report is honest and the procedure was skipped |
| `taste-web` finish-gate Stop hook on a real build | Sonnet | ❌ `uiux` invoked and a 59-turn redesign built (35 info specs pass), but `taste-web`'s `MODULE.md` was never read, the gate never armed (no `.taste-skill/build.json`), and no Stop hook event appears in the stream |

Both failures have one shape: `uiux`'s router is entered and the module procedure it routes to is not followed. Rewording the router is the instrument that already failed (the `taste` drop five times, `#one-entry`); what was tried next is in `#reverted`.

## Key Technical Decisions {#decisions}

### 2026-11-16 (later): after the revert {#after-revert}

**Current.** Asked three follow-ups after the revert (`AskUserQuestion`), the owner chose:
- **"One merged score"**: the three skills stay separate, and `done`'s Design row merges them into one report and one score. `impeccable`'s Nielsen total is the starting score, each `uiux` or `taste` finding bearing on a heuristic lowers it and is named beside it, and an open `taste` inspector FAIL holds the whole score to 60%. This answers the 15/11 "Not run all 3 / But 1 only" without merging the skills.
- **"Add scenes to taste"**: `taste-web` 2.5.1's eleven built scroll scenes, the object renders and `system.css` they load, and its scene manual (as `README.md`, with a header mapping its paths) are in `skills/taste/assets/web-scenes/` (359 files, 11 MB, including the `effects/` and `ui/` folders the object demos import). `taste`'s `references/scenes.md` sends a page there before it builds a scene by hand, and `taste/SOURCE.md` lists it as a local change. One demo (`letter-physics`) rendered from the new folder with no load errors.
- **"Run it"**: a Sonnet retest of "redesign the info site" on the restored skills, in a throwaway worktree (16/11/2026). Sonnet invoked `taste` directly (not `uiux`), dealt a direction with `draw.mjs`, built in 114 turns, and ran `inspect.mjs` to a final one FAIL and two WARNs, each defended in its report: the procedure ran, unlike every merged-shape build. The look (photo masthead, flat yellow price block, shared 42% vertical line) still carries a defect the inspector named and the build left open: at 390px the fixed WhatsApp dock overlaps the hero's own WhatsApp button on the first screen. The session also committed to a new local branch and wrote screenshots to `~/Downloads/info-site-redesign`, neither asked for.

### 2026-11-16: merge reverted {#reverted}

**Current.** Supersedes `#modules`; `#vendored` applies again. After the fresh-session checks, three rewrites of the merged router were tested on Sonnet. The critique fix held: a rerun dispatched both reviewers as agents, ran the detector and lint, and scored 24/32. The build fix did not: the rerun opened `taste-web` and then skipped its checks and finish gate, first calling the module "for static pages in an empty folder", then, after `MODULE.md` step 0 was given a sentence saying the gate runs whatever the stack, skipping it without comment. The Stop hook does fire (a sentinel written from it on a plain session proved it), but `gate.mjs` exits silently when no build was armed on a page without `taste`'s page-type meta, so nothing catches the skip. Shown the redesign, the owner said "The design isnt that nice", declined a hook that blocks an unarmed build, and asked to "revert back the skill to previously unmerged one". The revert restored `uiux`, `impeccable`, `taste`, `setup-project-docs`, `done`'s Design row and the skill tables to `47057ca` and kept the unrelated fixes the merge commits carried (`read-summary`, `refresh-instructions`, `ship`, `done`'s references). Patches of this session's merged-shape edits are not kept in the repo.

### 2026-11-15 (later): one skill, modules inside it {#modules}

**Superseded by `#reverted`.**

Superseded `#one-entry` the same day. The owner found three skills redundant and asked for one, with the condition "I don't want a single mechanism missing but duplicate can merge", and widened the scope to everything a human sees (web apps, websites, native mobile apps, email, PDF, slides, documents, anything else) with more design skills to merge later.

Shape chosen, answering the objections recorded under `#one-entry`:
- **No loss by construction:** `impeccable` and `taste` moved whole into `skills/uiux/modules/`; only `SKILL.md` was renamed `MODULE.md` with its frontmatter replaced by a module header, so every script, reference and library file stayed as it was (identical to upstream apart from the patches each `SOURCE.md` already listed) and upstream re-syncs still apply. The owner has since allowed each `MODULE.md` to be edited locally, so those no longer match upstream and an upstream update to one is merged by hand. Inventories taken before the move counted 394 mechanisms in `uiux`, 524 in `taste` and 814 in `impeccable`.
- **Size:** `uiux/SKILL.md` became a router (job table, surface table, module registry) under the 5,000-token re-attach limit (counts in `#current`); the long paragraphs it replaced moved word for word into `uiux/references/core-principles.md`.
- **Dilution:** `taste`'s judgement is not folded into `uiux`'s prose; a public-page build reads its lead module whole and follows its run, so that module's voice stays its own.
- **Duplicates** merge only in `uiux`'s own references (tells, mobile, verification, copy), which now index the module files that cover the same ground.
- **Project docs:** `impeccable`'s PRODUCT.md and DESIGN.md are folded into the `setup-project-docs` doc set (product truth in its PRD, the design system in its design doc), per the owner's answer.
- **Edit hook:** `impeccable`'s post-edit detector hook stays off, offered per project.
- **taste 2.5.1 kept beside 2.1:** the owner asked to fetch `taste`'s missing scroll scenes, which exist only from upstream 2.5.0. Upstream calls 2.5.0 "a complete rebuild ... around professional company websites", replacing 2.1's app-screen pipeline, direction deal and juror critique, and gives no reason for removing them. Replacing 2.1 would have broken the no-loss rule, so after a plain-language explanation the owner chose to keep both: `modules/taste-web/` (2.5.1, company websites, scenes, icons, product UI, checker, finish gate moved into `uiux`'s frontmatter as a Stop hook) and `modules/taste/` (2.1, portfolio and editorial pages, app screens, the review engine). Asked the same day which module a landing page goes to and whose rules judge a page `taste-web` built, the owner answered "Can combine" to both, and on a named single engine: "the design skills should do them, that's why i think the mechanism should be combined". So the router runs one public-page job using both: the lead module (`taste-web` for a business selling to a visitor, `taste` for a portfolio, event or editorial page) runs its whole procedure and the other supplies what it does better; where their house rules disagree, the lead module's rule wins, in building and in review; a named `impeccable` critique or audit runs the same review. After 1.436.0 shipped with three engines each scored and then merged, the owner corrected it: "Not run all 3 / But 1 only". So 1.436.1 makes a review one procedure with one report and one score: the machine checks that fit the surface (`impeccable`'s detector, `taste`'s inspector and lint, `taste-web`'s checker), then `impeccable`'s two isolated reviewers scoring its Nielsen heuristics, with `taste`'s critique questions and `uiux`'s own checks read into the heuristics they bear on. No check is dropped; the report lists each as run or "not run: <reason>", which keeps the visibility the per-engine scores were added for. `impeccable`'s saved critique reports (`.impeccable/critique/` in the project) stay, by the owner's choice, and are where a score trend comes from.
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

**Current again since `#reverted` (2026-11-16).** It was superseded by `#modules` from 15/11 until the merge was reverted; route design requests by this table.

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