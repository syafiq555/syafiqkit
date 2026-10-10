<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/external-guidance/applying-verdicts
Gotchas (critical — full list in each ADR's Consequences):
  - A verdict records which LEVER was rejected, not which outcome — a compressed restatement is what gets read (D-verdict-records-lever)
  - A source that is a working artifact gets a build decision per capability: depend / adapt / build (D-fork-the-gap-not-the-source)
  - An official plugin's DEFAULT can be inverted for your use even when its content is good — a wrapper inherits it (D-fork-the-gap-not-the-source)
  - A new skill's trigger is a claim about every sibling trigger, and nothing checks that automatically (D-fork-the-gap-not-the-source)
  - A growth ranking counts a file created in the window as having grown by its whole length (D61)
  - An instruction naming a path under `tasks/` is unfollowable off this checkout (D61)
Related: ../current.md (feature index — which file holds which decisions), grading-method.md (sibling theme — how a verdict is reached in the first place), reattach-ceiling.md (sibling theme — the re-attach ceiling cluster), agent-and-edit-traps.md (sibling theme — agent and scripted-edit traps), house-style-ownership.md (sibling theme — whose CLAUDE.md shape the skills enforce), ../../doc-condensation/decisions/unhobble-rule-writing.md (D63, the measured prose-vs-value boundary every adoption pass needs)
Last updated: 2026-10-10 — split by topic into four files; this one keeps the verdict, fork and grading-applied decisions (7), decision blocks moved verbatim. Before that, 2026-08-20 — split out of current.md when it reached 294 lines, ahead of grading source #6
-->

# External Guidance — Applying a Verdict

What happens after a claim is graded: how a verdict gets restated without inverting it, what a source that is a usable artifact demands beyond a score, and how a consumer's run grades the grader.

---

### D-fork-the-gap-not-the-source — Grading an Official Plugin Ends in a Build Decision, and the Verdict Is Per-Capability — committed — 2026-08-11

**Problem**
Anthropic's official `frontend-design` plugin was installed and the ask was whether to route syafiqkit's frontend work through it. It arrives with maximum authority — first-party, Apache-2.0, actively maintained — and the obvious readings are both wrong: adopt it wholesale, or dismiss it and write everything fresh. Neither is a verdict. The prior four sources were all *advice* (an article, a report, a corpus); this is the first source that is a **working artifact you could depend on**, so the four verdicts needed a build decision attached rather than a claim-by-claim score.

**Decision**
Chosen: grade it per *capability*, then let each verdict pick its own disposition — depend, adapt, or build. Three capabilities, three different answers: its **trigger surface** rejected (measured: aesthetics-flavored, cannot fire on "something wrong with the image slider" — the actual reporting shape); its **loading-state guidance** rejected as absent (grep: covers empty/error at line 53, mentions page-load only as an *animation* idea); its **AI-default calibration** adopted by adaptation under Apache-2.0 (names three looks concretely, which is what makes "generic" checkable rather than a vibe). Result: `skills/uiux/SKILL.md`, self-contained, carrying the one adopted piece with attribution.

**Rejected**
- Routing to it via a thin-pointer skill, the cheapest option. Why not: **its default is inverted for this use.** It is written for greenfield briefs — invent a palette, pick a signature element — and applied to an existing app that instruction *produces* the inconsistency it was meant to prevent. A wrapper inherits the wrong default no matter how the trigger is worded.
- Depending on it at all. Why not: colleagues install syafiqkit from its marketplace and may not have `frontend-design`; the plugin's own self-contained convention forbids a hard dependency. This is the D61 shape one layer up — an instruction that only resolves on the author's machine.
- Forking its full text. Why not: 55 lines of greenfield aesthetic process for a delta that is three named looks. The `skill-creator@claude-plugins-official` precedent (CHANGELOG v1.126.0) rejected building on an official skill for a *different* reason — generic workflow vs local conventions — and does not transfer: this source has no workflow to conflict with, only judgement prose.
- Scoping the new skill to "make the model look at screenshots," which is where the first design landed. Why not: **generalised from a bug fix, where the design space is tiny.** The originating session reasoned well about spinner timing unaided, which read as evidence that aesthetic direction was unnecessary — it isn't, for "redesign this page." The user named *generic output* as a real failure and the calibration went back in.

**Consequences**
- **The trigger gap is the finding, and it is not fixable by wording.** The user's own framing: *"the user dont know if it's related to ui or what."* You cannot enumerate vocabulary for people who don't know their problem is a UI problem, so the skill keys on an image of a UI arriving and on reports of what someone *saw*, independent of whether anyone says "UI".
- **Evidence it was real**: a slider bug session ran `read-summary` + two Explore agents, correctly found an unused `card` conversion and a Spatie `preview_url` naming mismatch — and never mentioned that the attached screenshot showed the photo overflowing its container and colliding with the title. Two exchanges, unmentioned. Good code diagnosis is not the missing part; *looking* is.
- **A near-miss rule made it worse, not better.** `read-summary` already said "enumerate what each image is evidence *of*" — that rule fired in this very session and still missed the layout defect, because treating a screenshot as *evidence for a bug* is a different act from reading it as a *rendered interface*. Fixed with a pointer, not a second image rule.
- **Two reviewers independently found a trigger collision the build introduced**: `brainstorming`'s description named "UI/UX work" and carries a `<HARD-GATE>` blocking implementation until approval, while `uiux` says a section polish builds directly — incompatible collaboration models on one request. Both descriptions now state the boundary. **A new skill's trigger is a claim about every sibling trigger, and nothing checks that automatically.**
- **Greenfield was missing and the skill would have fired anyway** — it activates on "redesign a page" and then stalls, because its first instruction is to read an app language that doesn't exist. Caught by the user asking, not by any check. A skill that fires and has nothing to say is worse than one that stays silent.

**Status**: committed · **Reversible**: yes
---

### D-verdict-records-lever — A Verdict Records Which Lever Was Rejected, Not Which Outcome — committed — 2026-08-09

**Problem**
D55 rejects the article's 80%-cut claim, and the entry reads as settled. A session working from the same article four hours without opening D55 then wrote "its headline claim is **rejected here**" into `unhobble-instructions/SKILL.md` — a sentence that would stop the next reader from performing a large cut, which is the opposite of what D55 argues. D55's actual claim is about durability: for a file edited ~22 times a week, cutting stock without changing admission just refills, so the lever is arrival rate. It says nothing against the cut itself. The D50 regression cited as evidence was two skills *hand-condensed* — prose squeezed for bytes, `condense-claude-md`'s operation — not rules deleted and rewritten as principle, which is what the article describes and what this session actually did (192 table rows → 6 paragraphs in the global CLAUDE.md, every mechanism retained).

**Decision**
Chosen: a rejection records the **lever**, and any downstream restatement names which. Where a verdict could be read as forbidding an outcome, the entry states the outcome it permits — here, that a large cut is often right and what makes it durable is a change to what gets admitted.

**Rejected**
- Softening D55's reject to "partially adopted". Why not: the lever claim is correct and measured; the defect is in restatement, not the verdict.
- Leaving the skill's "rejected here" line and relying on the reader to follow the pointer to D55. Why not: this session had the pointer and didn't follow it. A compressed restatement is what gets read.

**Consequences**
- `unhobble-instructions/SKILL.md` now states a large cut is a fine outcome, names the operation (delete what stopped being true, rewrite the rest as principle — `never write multi-line comment blocks` → `match the surrounding code's comment density`), and keeps arrival rate as the durability point.
- **D63's boundary is the load-bearing half and now travels with the verdict**: prose-only is right for judgement-shaped content and wrong for value-shaped. The global cut initially dropped value-shaped harness facts (`localStorage` eviction across browser agents, NULL `causer_id` from a sibling's in-flight write, an agent's `HEAD~1` baseline) as "variations on a principle"; restored as reasoning with the identifiers literal.
- `/doctor` was recommended into the skill from the article, then removed — D55 had graded it unverified→false against the installed tooling on 2026-07-27. Cost: one false CHANGELOG bullet, caught by review before ship.

**Status**: committed · **Reversible**: yes
---

### D61 — A consumer's audit run graded the skill: two defects, and the recording step was unreachable by construction

**Problem**: A real consumer (marketplace install, not this checkout) ran `audit-instructions` and returned a complete 25-skill report — then stopped at Step 5 to ask where to record verdicts, because it named `tasks/plugin-maintenance/external-guidance/current.md` relatively. Their report also carried an undetected measurement artifact.

**Decision**: Fix both, and take the destination out of the skill entirely. Step 5 hands verdicts to `update-plugin`, which owns the ownership gate; Step 1 disqualifies files created inside the measurement window.

**Rejected**
- Naming an absolute install path. Why not: **measured — there is none that works.** `tasks/` is not shipped to installs at all, and installs are version-scoped (`plugins/cache/<marketplace>/<plugin>/<version>/`), so any literal path is stale on the user's next update. `${CLAUDE_PLUGIN_ROOT}` does not expand in markdown ([#9354](https://github.com/anthropics/claude-code/issues/9354)), `~` does not resolve on native Windows, and a `~/.claude` shared with WSL stores paths broken on the other side ([#36575](https://github.com/anthropics/claude-code/issues/36575)).
- Giving `audit-instructions` its own OWNER/CONSUMER probe. Why not: a second gate is a second failure mode, and `update-plugin` already owns one; three independent research passes agreed on delegating over branching.
- Recording a consumer's verdicts into their own project's `tasks/`. Why not: that tree is the user's work, and the verdicts grade *this* plugin.

**Consequences**
- **A newly-created file reported its whole length as growth, and the artifact ranked #1.** `audit-instructions` (168 lines, created the day before) reported itself as the fleet's top grower at +168L, masking the real one (`done`, +43L). Step 1 now disqualifies in-window creations via `git log --diff-filter=A`; a file with no baseline has no arrival reading. The consumer routed the artifact into `update-plugin`'s queue, where it would have driven a density pass on a one-day-old file.
- **`%+d` broke the ranking it fed.** A leading `+` defeats `sort -rn`, so the per-file list ordered `+9, +8, +43`. Bare `%d` restored it — the ranking is the command's only purpose, so a cosmetic format string was the whole defect.
- **The ownership probe was right by luck.** `git -C <plugin-dir>` **walks up** to the enclosing `~/.claude` dotfiles repo and resolves *its* remote (`my-claude-settings.git`); the grep missed, yielding `CONSUMER` for the wrong reason, and would invert for anyone who forked that settings repo. Rewritten to ask the CWD (`git rev-parse --show-toplevel`) — verified OWNER from the checkout, CONSUMER from a non-git dir and from `~/.claude` itself.
- **The receiving branch was unreachable, and both `/done` reviewers caught it independently.** `update-plugin` Step 1's arrival-rate branch skips Steps 1-2 whenever a handoff carries *any* arrival-rate file — and since arrival rate is measured every run, that is nearly every handoff, so the new row recording verdicts was dead on the common path. Narrowed to *solely* arrival-rate, with an explicit mixed-handoff rule. Same shape as D59's own N-owners defect, one layer down.
- **The consumer upstream flow was singular-defect shaped.** Its template titles one skill and one defect; the real payload was 22 findings across 25 files. A fleet audit now files as ONE issue with the table as body — splitting it buries the corpus-wide signal a sweep exists to produce, under the user's own name.
- **Scope came in narrower than approved, on evidence.** A full sweep found 7 further sites; 7 were correct as written — the 6 `.claude/agents/*.md` hits have templates that are already generic, so the hardcoded domain belongs in this repo's own copies, and `task-summary/references/templates.md` cites the path as split history, not as a path to read.

**Status**: committed · **Reversible**: yes
---

### D-source-6-harness-drift — A Mechanism Fact Goes Stale Without Anyone Editing the File, and the Corpus Cannot Tell — committed — 2026-08-20

**Problem**
Sources #1–#5 were all *advice or artifacts* — a claim to weigh, a plugin to depend on. Source #6 is a different kind: the official reference pages for the three mechanisms these skills write (`memory.md`, `skills.md`, `sub-agents.md`). Guidance can be rejected on local evidence; **a mechanism fact cannot** — when the harness changes, a correct rule becomes a wrong one with no edit, no diff and no failing check, and every downstream verdict built on it inherits the error while still reading as measured.

Graded against the live pages, the corpus was wrong or silent on:

| Claim | Verdict | Evidence |
|---|---|---|
| `allowed-tools` is a fixed enum; adding `Agent` silently fails | **reject** | skills.md — "does not restrict which tools are available: every tool remains callable." It pre-approves, turn-scoped. `disallowed-tools` restricts. The plugin's practical advice was right; its stated reason was false. |
| SKILL.md frontmatter has 5 fields | **reject** | 20 fields, incl. `when_to_use`, `paths`, `effort`, `hooks`, `disallowed-tools`, `background` |
| (silent) post-compaction re-attach ceiling | **adopt** | skills.md — first **5,000 tokens** of each skill, 25,000 shared, most-recent-first. Measured here: 4 skills over it. |
| (silent) a SKILL.md is never re-read after invocation | **adopt** | skills.md — write standing instructions, not one-time steps |
| `tools: []` doesn't block a tool (partial-shadow quirk) | **reject** | sub-agents.md — `tools:` IS an allowlist; "`disallowedTools` is applied first, then `tools` is resolved against the remaining pool" |
| a subagent may not spawn a subagent | **reject as stated** | sub-agents.md — it can, up to three layers. The plugin's *policy* stands; what was wrong is calling it a capability limit. Enforced by omitting `Agent` from `tools`. |
| `disallowedTools` camelCase | **already adopted** | correct for agents — but skills spell it `disallowed-tools`. Two surfaces, two spellings. |
| auto memory is forbidden (D55) | **reject** | memory.md — on by default; `MEMORY.md` first 200 lines/25KB every session. The standing decision was made when the premise was true. |
| `@path` imports are a size lever | **reject** | memory.md — "imported files still load and enter the context window at launch". Max depth 4 hops. |
| (silent) `.claude/rules/` with `paths:` globs | **reject — graded `adopt` in error, reversed 2026-08-20** | memory.md calls it the recommended fix for a large CLAUDE.md, loading only on matching files. **D17 had already disproved this on a live canary and the grading pass missed it.** The glob does not gate loading; it gates whether the model acts. See the reversal note below. |
| CLAUDE.md target ~200 lines | **already adopted** | `structure.md:157` had 200 soft / 350 hard before this pass |
| nested CLAUDE.md doesn't survive `/compact` | **already adopted** | `structure.md` §1 was already correct |

**Decision**
Chosen: grade a mechanism source the same four ways, but treat **"already adopted" as the finding that matters** rather than the one to skip. Two of the twelve came back already-correct, and those are the evidence that the corpus can hold a right answer and a wrong one about the same subject simultaneously — so a verdict of *reject* on a mechanism fact carries a re-check date, not just a correction.

Where the plugin's conclusion was right and its stated reason false (`allowed-tools`, the read-only agent guard), **fix the reason and keep the conclusion** — a correct rule resting on a false premise breaks the moment someone changes the thing the premise names.

**Rejected**
- Treating "Anthropic says prose/judgement" as licence to convert value-shaped rows. Why not: the current framing is *degrees of freedom* — fragile, consistency-critical content is explicitly **low freedom**, which agrees with D63's A/B result rather than overturning it. The user's instruction to follow the current framing is satisfied by calibration, not by blanket conversion.
- Re-running D63's A/B before acting. Why not: nothing in the new pages contradicts it, so the test would re-derive a boundary already measured here.
- Adopting `.claude/rules/` as a replacement for the companion mechanism. Why not: unmeasured here, and `condense-claude-md` owns split policy. Recorded as a real alternative the skills must *name*, with the choice left to the file's owner.

**Consequences**
- **A mechanism fact needs a provenance line, which no other verdict class needs.** Advice graded in 2026-07 stays graded; a harness fact verified 2026-08-20 is true as of that date and silently expires. Every fact this pass wrote carries its source page.
- **The 5,000-token ceiling is the highest-value single finding**, because it is invisible from inside a session: the tail of an over-ceiling skill simply stops existing after a compaction, and the skill still reports as invoked. `done` (~9.9k) is worst-affected and runs at session end, when a compaction is most likely to have happened.
- **`/context` is the missing verification primitive.** The corpus had no way to answer "did this file actually load"; every routing decision was reasoned rather than checked.
- **Two "already adopted" rows are the control.** They prove the grading wasn't confirmation-shaped — the same read that found ten gaps confirmed two rules already right, and those two came from the file (`structure.md`) that had been maintained most carefully.

**Status**: committed · **Reversible**: yes · Verified against live docs 2026-08-20
---

### D-paths-glob-readopted-from-the-docs-that-were-already-rejected — A Verdict Table Graded a Claim `adopt` That a Canary Test Here Had Disproved — committed — 2026-08-20

**Problem**
Source #6's grading pass recorded `.claude/rules/` with `paths:` globs as **adopt**, sourced from `memory.md` calling it the recommended fix for a growing CLAUDE.md. D17 (2026-07-12, `doc-condensation/decisions/bloat-generator-fixes.md`) had already tested that exact claim with a canary — a secret string in a path-scoped rule, probed from a session touching nothing matching — and found the file loads in full regardless. The glob changes whether the model *acts* on the rule, not whether the rule is in context.

The wrong verdict shipped into three files and a release note: `structure.md` (as the recommendation, sitting seven lines above the surviving correction that contradicted it), `read-summary/SKILL.md:52` (stated as fact, in the skill that runs at the start of most sessions), and the v1.185.0 release note sent to colleagues. `condense-claude-md` was the only consumer that still had it right, because D17 had fixed it there.

**Decision**
Chosen: reverse the verdict in place rather than delete it, and record the re-adoption as the finding. Route file-type-scoped rules to a real subdirectory `CLAUDE.md` (D17-verified to genuinely scope); reach for `.claude/rules/` only where loading every session is acceptable, its value being organisation rather than savings — the same standing as an `@path` import.

**Rejected**
- Deleting the row. Why not: a claim graded `adopt` and silently removed looks unexamined to the next pass, which is what invites the third adoption. The reversal has to be legible as a reversal.
- Re-running the canary before reversing. Why not: D17's test is on record with its method stated, and nothing about the mechanism has changed. Re-deriving it would cost a session to reach the same answer.

**Consequences**
- **A tool's own docs are the failure case the outside-guidance rule reads past.** The rule says grep `tasks/**/decisions/` before adopting outside guidance; it named "vendor articles and tool reports," which reads as third-party commentary. Official documentation for the tool you are running does not feel like a claim, so the grep feels unnecessary exactly when it matters. Sharpened in the global CLAUDE.md as `{#official-docs-are-still-a-claim}`.
- **Re-deriving a rejected claim leaves no trace that it was ever settled.** The second adoption looked like new research, and the contradiction it created inside `structure.md` survived a full review pass — the correction and the recommendation sat seven lines apart, and a reader hits the table first.
- **Docs describe intended behaviour; a decision record here describes observed behaviour on this install.** Where they disagree on a fast-moving CLI, the local measurement wins until re-measured.
- **D17's finding was re-confirmed on 2.1.235 and stands** — see `D-a-model-that-declines-a-rule-reports-it-as-absent` in `agent-and-edit-traps.md` for the re-test, and for why the four probes run before it produced the opposite answer.

**Status**: committed · **Reversible**: yes (re-test the canary if Anthropic ships a fix)
---

### D-second-pass-on-uiux — A Survey of Community Skills Widens a Fork Already Taken, and the Retrieving Agent's Own Figures Are the Claims to Grade — committed — 2026-09-05

**Problem**
`uiux` was built (D-fork-the-gap-not-the-source) by adapting one capability of the official `frontend-design` plugin. Three weeks of use showed three gaps the source could never have filled: nothing on mobile, no way to say an existing design language or stack was dated, and a greenfield path that stalled on "read the app language" (the last already named in that decision's Consequences). The user asked for a survey of published UI/UX skills and primary design guidance, run on two haiku research agents, and for the skill to be redesigned from it — with the outdated-stack verdict reaching the framework and build tooling, the widest of three scopes offered.

**Decision**
Chosen: grade per capability again, and adopt three as inline judgement (a greenfield/brownfield branch that gives the existing language a keep / modernise-within / migrate-off verdict; mobile-first as the base layout; design for people who scan) with their checkable lists in five `references/` files, keeping the skill body under the 5,000-token re-attach ceiling. The framework-level verdict is admitted as a finding with a blast radius that is stated before designing and never executed inside a polish request — execution routes to `brainstorming` as its own task. Sources: Anthropic `frontend-design` (five stock looks, four self-tests), edenspiekermann `audit-design-system`, jezweb `design-review`, nextlevelbuilder `ui-ux-pro-max`, `awesome-copilot` premium-frontend-ui, Nielsen Norman scanning and icon studies, WCAG 2.2 target-size and contrast criteria, Atlassian and GOV.UK foundations. Every URL was fetched and returned 200 before being cited.

**Rejected**
- Splitting greenfield and design-system health into a second skill. Why not: a new trigger is a claim about every sibling trigger, and the original decision already rejected a greenfield-default skill firing on existing apps.
- Everything inline in `SKILL.md`. Why not: roughly 8,000 tokens, so the verification and mobile sections would fall past the compaction boundary while the skill still reported as loaded.
- Five figures the research agents delivered: "labels raise engagement 75%", "CTA 100 to 150px from the bottom", "minimalism rejected in 2026", "99% of fonts are low quality", "44px is WCAG 2.1 AA". Why not: the first two were absent from the cited page (which carried a *different* 75%, the share of touches made with one thumb); the third was one vendor blog; the fourth was marketing opinion; the fifth conflates the AAA criterion with the 24px AA floor. The mobile reference now states where the floor actually sits.

**Consequences**
- **The retrieving agent's numbers are the claims to grade, and a resolving URL does not grade them.** Both haiku agents cited real pages for every claim, so the research-fabrication check (open the URL) passed clean while two figures were inflated and one was misattributed. The failure is the identification shape the global instructions already name for entities, applied to figures: a genuine page about the subject carries a different number. Grade a figure by finding it on the page, never by finding the page.
- **A second pass on a shipped fork is cheaper than the first and finds what use surfaced rather than what the source offered.** The first pass graded what `frontend-design` had; this one started from what `uiux` lacked in use, and every adopted capability answered a gap use had shown.
- **Framework scope was the user's call and was offered as three sizes rather than assumed.** The widest was chosen; the boundary (proposed, never executed inside a polish) is what makes it safe to admit, and the product reviewer confirmed the polish scenario does not over-fire into a migration.
- **The reviewers' two polish findings were both about a rule not scaling with the request** — verification widths applied unconditionally, and a migrate-off verdict with no path to outlive the conversation. Both fixed; the second is the `/done` capture convention made explicit at the point it applies.
- Shipped as v1.240.0. This file is now over its own budget and is the next `condense-task-doc` target in this domain.

**Status**: committed · **Reversible**: yes
---

### D-third-pass-on-uiux — A Catalog Source Is Graded for the Judgements Its Rows Encode, and a Figure Found on the Page Can Be the Row's Counter-Example — committed — 2026-09-07

**Problem**
The user pointed at `ui-ux-pro-max-skill.com` and asked for three haiku agents to research it and take what is good for `uiux`. The site is an unofficial, client-rendered translation of the `nextlevelbuilder/ui-ux-pro-max-skill` repo, which source #7 had already cited for two items. The repo is catalog-first: a Python search over CSVs (88 styles, 192 palettes, 74 font pairings, 119 UX guidelines, 34 landing patterns, 22 stack files) that turns a product category into a design system, persists it as `design-system/<slug>/MASTER.md` with per-page override files, and ends on a fixed checklist. `uiux` is procedure-first.

**Decision**
Chosen: grade per capability and adopt the judgements, not the rows. Six adopted — write the greenfield decisions into the conventions doc the brownfield branch reads (`frontend/CLAUDE.md` by default, created through `update-claude-docs` when absent), with deviations recorded as deviations and a deviation recorded twice treated as a scale gap (the persistence practice, without the script); an **Exclude** self-test (every style row carries a Do Not Use For); the AI-native gradient as a sixth stock look (an anti-pattern on fourteen reasoning rows); light-or-dark and spacing density as decisions keyed to the job; and a set of checkable items with a row each (`dvh`, z-index scale, 65–75ch, validate on blur, focusable error summary, pressed state without layout shift, landscape and largest text size, pause controls on auto-rotating content, WCAG 2.2 authentication and dragging, no emoji icons). One of ours softened: the motion checklist's "150 to 200ms" is now typical rather than a rule, because the source's own guideline #8 says not to present any cutoff as universal.

**Rejected**
- The catalogs and the generator. Why not: a category-to-look table is the stock-look machinery the skill exists to interrupt, and every output is a template by construction; the plugin's authoring rule is to state what to establish, not which command establishes it.
- The 22 stack files (implementation guidance, not design), the chart data (`dataviz` owns it), the variance and motion dials (audience, subject and job already decide these), a longer unconditional width list (the rule-not-scaling defect source #7's reviewer already caught), and the search-failure and `--force` mechanics of a tool we do not ship.
- An agent's "35–60 characters on mobile" — not found on any row read.

**Consequences**
- **A figure found on the page can still be the row's counter-example.** The research check from D-second-pass-on-uiux says find the number on the page; here the number was on the page, in the Don't column. An agent reported it as the guideline. Grading a CSV-shaped source means reading the column a figure sits in, not only the cell.
- **A catalog source yields judgements, and each judgement needs one sentence of reason, not a row.** The row says "dark mode by default: anti-pattern for SaaS"; the skill says mode is keyed to how long people stay and what they are doing. The second is what a later session can apply to a product the catalog never listed.
- **The docs site was never the source.** All of its content pages are client-rendered shells; the agent filed them as could-not-retrieve and graded the repo. A translation site's value is the pointer to the artifact.
- **A practice adopted without its script has to carry the script's side effects.** The source persists by *creating* a file; the first adaptation kept "write it to the conventions doc" and dropped the create, so a greenfield session — where the doc never exists — had nowhere named to write. The product reviewer's greenfield scenario found it before shipping. When the verdict is adapt rather than depend, list what the source's mechanism does besides the rule (creates, deletes, gates) and decide each.
- **A "do not edit any file" brief did not stop a scratch write to `/tmp`.** Harmless here; a read-only dispatch onto a repo should still be verified with `git status` afterwards.
- Shipped as v1.242.0. This file remains over budget; the condense is still the domain's first next action.

**Status**: committed · **Reversible**: yes
