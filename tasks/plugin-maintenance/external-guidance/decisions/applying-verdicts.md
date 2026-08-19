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
Related: ../current.md (feature index), grading-method.md (sibling theme — how a verdict is reached in the first place), ../../doc-condensation/decisions/verification-rigor.md (D63, the measured prose-vs-value boundary every adoption pass needs)
Last updated: 2026-08-20 — split out of current.md when it reached 294 lines, ahead of grading source #6
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

### D-ceiling-found-not-yet-cleared — Four Skills Exceed the Re-Attach Ceiling and Only One Was Reduced — committed — 2026-08-20

**Problem**
The 5,000-token post-compaction ceiling (D-source-6-harness-drift) was adopted as a fact, and the same pass that adopted it added content to five skills. Measured after: `done` ~9.9k, `update-claude-docs` ~8.2k, `task-summary` ~6.2k, `unhobble-instructions` ~5.9k, `agent-setup` ~5.4k — the last of which this pass pushed over the line itself, from ~4.9k.

Only `update-claude-docs` was reduced, by relocating `## 6. Agent Sync` to `references/agent-sync.md` (1,724 bytes, destination written before the cut). That took it from ~8.35k to ~8.16k: real, and nowhere near enough for a file 63% over.

**Decision**
Chosen: state the overage as an open finding rather than clear it here. The remaining reductions are condense work — `update-claude-docs`'s largest section is its residency gate, which every capture pass reads, so extracting it is the hot-path treadmill this corpus has already rejected twice. A skill that is over the ceiling is not broken; its tail is unreliable after a compaction, which is a real cost and a bounded one.

**Rejected**
- Extracting the residency gate to get under the number. Why not: hot path, read on every invocation. Shrinking a file by moving the part everyone reads is how a metric improves while the artifact gets worse.
- Leaving the ceiling undocumented until someone could act on it. Why not: the fact is what makes the overage visible at all, and a session that knows the boundary can put the load-bearing half above it even without condensing.

**Consequences**
- **`done` was reduced and is still over.** Its blindness-pattern catalogue (~6.6KB) moved to `references/agent-blind-spots.md`, taking it 9,880 → 8,281 tokens and moving the boundary from ~line 134 to ~line 146. The exit gate sits at line 195, so it remains past the cut — the relocation helped and did not solve it.
- **The boundary's position matters more than the overage.** `done`'s cut fell mid-Step-1, so Steps 2-5, the exit gate and the output template were all in the vanishing half. A file 60% over whose guards sit early is in better shape than one 20% over whose verification sits late.
- **A pass that adopts a ceiling and then adds content owes the measurement.** `agent-setup` crossed the line in this pass; saying so is the accounting, and quietly shaving prose to get back under would have been gaming it.
- **Position now matters independently of length.** Until these files come down, what sits in the first 5,000 tokens is a real editorial decision — the guards and mode selection belong above the boundary, the reference tables below it.
- `done` at ~9.9k is the worst case and the most exposed, since it runs at session end when a compaction is likeliest to have already happened.

**Status**: committed · **Reversible**: yes · Open: four skills remain over · **Superseded by D-ceiling-cleared** (kept: records what the interim state was and why the staged approach was taken)

---

### D-pointers-are-suggestions — Progressive Disclosure Has No Loader, and the Only Levers Are Path and Phrasing — committed — 2026-08-20

**Problem**
The corpus routes content behind `📖` pointers on the strength of D55's progressive-disclosure verdict, and D-deferral-is-not-delivery already found the follow-through rate poor. What neither established is the *mechanism*, which turns out to decide everything: there is no loader. Verified against `code.claude.com/docs/en/skills.md` — a SKILL.md has no `@path` import, no frontmatter field, no naming convention that pulls a companion file in. Anthropic's entire recommendation is a markdown link stating what the file holds and when to read it. A subagent's `skills:` field preloads whole SKILL.md bodies and still does not reach their reference files.

So a pointer is a suggestion the reading model may decline, every time, with no retry — the skill body enters context once and is never re-read.

**Decision**
Chosen: treat extraction as a trade of certainty for tokens rather than a free win, and pull both levers that exist.

**Lever 1 — absolute paths.** `${CLAUDE_SKILL_DIR}` and `${CLAUDE_PLUGIN_ROOT}` **do** expand in skill markdown, reversing what `consumer-portability.md` asserted. [#9354](https://github.com/anthropics/claude-code/issues/9354) closed as completed 2026-08-17; a probe skill confirmed it live, both variables rendering as real absolute paths in a SKILL.md body. A relative pointer asks the reader to resolve a path against an uncertain working directory; `${CLAUDE_SKILL_DIR}/references/foo.md` is unambiguous on any machine at any install version. This does not reach `tasks/`, which still never ships.

**Lever 2 — conditional phrasing at the decision point**, which D-deferral-is-not-delivery already measured: name the trigger, not the topic.

**Rejected**
- Duplicating critical lines inline and in the reference. Why not: two copies drift, and this corpus has repeatedly found the unedited one going stale while reading as authoritative.
- Treating "no loader" as an argument against extraction generally. Why not: the ceiling is real and a skill's tail is lost anyway after compaction. An unread pointer and a truncated section fail the same way; the pointer at least survives for a reader who follows it.
- Waiting for an official auto-load mechanism. Why not: the docs are explicit that on-demand reading is the intended design, not a gap.

**Consequences**
- **The order of operations follows from the mechanism.** Reordering is strictly better than extraction where both are available: content moved above the ceiling is *certain* to be re-attached, while content moved behind a pointer is only *probably* read. Reorder first; extract only what genuinely belongs in a reference.
- **`consumer-portability.md`'s expansion row was wrong and is corrected.** A false negative about a mechanism is worse than silence — it argues against the one thing that makes a bundled pointer reliable.
- **An issue closed as completed is a real event that no local check watches.** This one had been cited in a decision as settled fact for months and was fixed three days before anyone looked.

**Status**: committed · **Reversible**: yes · Verified live 2026-08-20

---

### D-reorder-beats-extract — Where a Cut Falls Decides More Than How Far Over You Are — committed — 2026-08-20

**Problem**
Five skills sit over the 5,000-token ceiling and the obvious response is to extract until each fits. Measured, the overage turned out not to be the thing that hurts. `unhobble-instructions` is 880 over and loses three trailing scope notes; `done` was 3,281 over and lost its exit gate, its output template and Step 5 — the verification *and* the deliverable. Same units, incomparable damage.

D-pointers-are-suggestions then settled why extraction cannot be the primary lever: there is no loader, so extracted content is read only if the model chooses to. Content moved *above* the cut is certain to survive; content moved *behind a pointer* is probable at best.

**Decision**
Chosen: reorder first, extract second, and measure by what falls past the cut rather than by the overage.

For `done`, that meant stating the contract — the six Output rows, that each row is a claim a step actually ran, that invoking is not updating — in a block at line 14, above everything. The file grew ~280 tokens doing this and is *better off*, which is the whole argument: a smaller file whose guard sits at line 195 is worse than a larger one whose guard sits at line 14.

**Rejected**
- Extracting until every skill fits under 5,000. Why not: it trades a certain loss for a probable one and, on the evidence of the pointer audit, the probability is poor. Also risks the over-condensing failure D-a-floor-is-not-a-ceiling already records.
- Splitting `done` and `update-claude-docs` into separate skills. Why not: changes invocation and every caller, to solve a problem that ordering solves without moving anything.
- Treating the overage number as the priority ranking. Why not: it ranked `unhobble-instructions` (loses scope notes) above `agent-setup` while saying nothing about which loses a guard.

**Consequences**
- **The diagnostic is "what is past the cut", not "how many tokens over".** Roughly, the boundary is 20,000 bytes into the file; print the headings after it and read what would vanish.
- **A skill whose tail cannot be reordered away should say so at the top.** `done` now tells its reader that a missing exit gate *is* the compaction, and to re-read the skill — turning a silent loss into a detectable one.
- **The pointer audit found both levers unused**: of 125 `📖` pointers, 11 carried a trigger condition and none used an absolute path. Fixing phrasing and path form is cheaper than any restructure and raises the odds on every pointer already written.
- Four skills remain over. Their cuts now fall past reference material rather than past guards, which is the state to hold until a real condense pass.

**Status**: committed · **Reversible**: yes · Open: four skills still over, none losing a guard

---

### D-agent-broke-its-own-pointer-check — Three Agents Reported the Same Reference Missing Because Their Extraction Kept the Emoji — committed — 2026-08-20

**Problem**
A pointer audit reported 38 of 127 pointers broken, 30% of the corpus, with six named as actionable depth errors. Resolving all six by hand from their citing directories: every one existed. The agent had extracted paths from `` `📖 ../foo.md` `` without stripping the `📖`, then tested a path beginning with an emoji and a space — which cannot exist — and reported the miss as a defect of the file. Its stated reason ("emoji in path breaks resolution") reads as a real finding.

The first correction attempt had the identical bug, and `agent-setup/SKILL.md:157` already recorded that **two earlier subagents independently reported this same file missing when it exists**. Three separate agents, one cause, and the file was already carrying a note saying not to trust the report.

**Decision**
Chosen: a broken-pointer sweep needs a positive control before its output is read — resolve one pointer known to be good and confirm the checker says so. A checker that reports everything broken is measuring itself, which is `{#zero-hit-measures-the-pattern}` inverted: a *universal* hit is as suspect as a universal miss.

Second: a `📖` is decoration inside the backticks, not part of the path, so any extraction has to strip a leading emoji, a `> ` blockquote marker and a `See `. Glob patterns and illustrative examples (`tasks/**/current.md`, `📖 See .../gotcha-name.md`) are not paths and belong on an exclusion list.

**Consequences**
- **Real count: 2 broken, not 38.** One of those two is a false positive on inspection — `agent-setup:157` quotes a `../../` path as an example of what a *template* contains, where that depth is correct, and the surrounding sentence says a copied pointer is dead on arrival by design. One genuine defect: a missing `../` prefix in `update-claude-docs`, now fixed.
- **A 30% failure rate should have been the tell.** A defect that common in a corpus with a standing resolve-check would have surfaced long before; the number was evidence about the checker.
- **The file's own warning did not prevent the third recurrence**, because a reader reaches the finding through the agent's report rather than through the file. Where a known-good artifact keeps getting reported broken, the note belongs with whoever runs the check, not only with the file being checked.

**Status**: committed · **Reversible**: yes

---

### D-ceiling-pass-two — Every Over-Ceiling Skill Now Loses Procedure Instead of a Guard — committed — 2026-08-20

**Problem**
D-reorder-beats-extract established the method on `done` and left four skills untreated, each losing something different: `update-claude-docs` lost Steps 3-6 *and* all three alternate modes (a six-step skill keeping two), while `agent-setup` lost a descriptive Output section that costs nothing.

**Decision**
Chosen: apply the diagnostic per file and let it pick the treatment, rather than driving every file toward the number.

- **`update-claude-docs`** — extracted the prune delegation (3.4KB → `references/prune-delegation.md`, guards left inline), then stated the six-step shape plus the two rules that hold across all of them ("writing nothing is legitimate", "sharpen rather than add") in an opening block. 8,187 → 7,968 tokens; more importantly the back half is now recoverable from the front.
- **`unhobble-instructions`** — moved `## What This Is Not` above the cut. It is 392 bytes and is the scope boundary that stops the skill firing on a condense job. Moving it exposed a duplicate paragraph restating the same three boundaries, now collapsed.
- **`task-summary`** — the lost section holds a real trap (back-references no git-driven scan reaches). The trigger moved into the step-5 line already above the cut; the method stays in §6.
- **`agent-setup`** — left alone. Its lost section describes output shape, derivable from the templates.

**Rejected**
- Extracting `update-claude-docs`'s residency gate, its largest section at 5.7KB. Why not: every capture pass reads it, so it is hot path and extraction is D50's treadmill.
- Driving all five under 5,000. Why not: two of the five lose nothing that matters, and the remaining reductions are condense work rather than reordering.

**Consequences**
- **All five now lose procedure rather than a guard**, which is the state worth holding. `done` and `update-claude-docs` also tell their reader that a missing back half *is* the compaction, converting a silent loss into a detectable one.
- **Set totals rose in every case** (`update-claude-docs` 32,651 → 37,155 across its set), so every relocation has a named destination.
- **The extraction introduced a depth error in the file it created** — a `../_shared/` pointer correct in a SKILL.md and wrong one directory down — written by a session that had just documented that exact trap two hours earlier. Caught by resolving rather than reading. This is the third instance of the shape in this corpus and the argument for the mechanical check over the rule.

**Status**: committed · **Reversible**: yes · Open: five skills over, none losing a guard · **Superseded by D-ceiling-cleared** (kept: records what the interim state was and why the staged approach was taken)

---

### D-ceiling-cleared — All 32 Skills Under the Re-Attach Ceiling — committed — 2026-08-20

**Problem**
Five skills remained over 5,000 tokens after the reordering pass, which had fixed *what* they lost without changing *that* they lost it. Getting under required real relocation, which is where `condense-task-doc`'s over-cutting incident happened.

**Decision**
Chosen: dispatch `unhobble-instructions` per file on haiku — the right instrument, since these are SKILL.md files and its lens (collapse enumerations, route cold material out) is the operation needed. Snapshot first, then verify against the snapshot rather than against the agents' reports.

Handled inline instead where the gap was small: `agent-setup` (−431) and `unhobble-instructions` (−813) were cheaper to edit directly than to brief.

| Skill | Before | After |
|---|---|---|
| `done` | 8,559 | 4,232 |
| `update-claude-docs` | 7,968 | 2,976 |
| `task-summary` | 6,229 | 2,642 |
| `unhobble-instructions` | 5,813 | 4,998 |
| `agent-setup` | 5,431 | 4,989 |

**Rejected**
- Extracting `update-claude-docs`'s residency gate or `agent-setup`'s agent roster. Why not: both read on every invocation. Hot-path extraction is the treadmill, and shrinking a file by moving what everyone reads improves the metric while degrading the artifact.
- Trusting the agents' reports. Why not: two contradicted themselves — one claimed it "comes under the 20 KB target" while reporting 16,617 bytes, another reported a 66% cut without noting its set total had fallen.

**Consequences**
- **Set accounting held everywhere**: `done` +3%, `task-summary` +3%, `unhobble-instructions` −1%, `agent-setup` −4%, `update-claude-docs` −10%. All well inside the ~35% deletion threshold; the two that grew are relocations landing in siblings.
- **One real loss, restored.** `done` dropped a stated limitation — `ListAgents` confirms a peer is live but *cannot* say which checkout, so the diff read stays the only check. Exactly D-limitation-reads-as-hedging: text saying what a tool can't do reads as hedging to a pass hunting over-caution, and cutting it leaves the diff read looking optional.
- **The identifier-diff produced false positives twice**, both from comparing exact strings: a pointer correctly re-prefixed `../../` on moving into `references/` reads as a deleted identifier, as does a command relocated to a companion. Compare by concept across the whole set, never by literal string against one file.
- **`${CLAUDE_SKILL_DIR}` pointers went 0 → 14.** Every new pointer this pass created uses the absolute form and conditional phrasing.
- Four single-row `❌/✅` tables were found and converted while the user read along — a table that shrinks to one row is scaffold outliving its justification, now named in `entry-style.md`.

**Status**: committed · **Reversible**: yes · Closes the ceiling work opened by D-source-6-harness-drift

---

### D-scripted-anchor-matched-the-wrong-occurrence — A Python Edit Duplicated Half a Doc and Every Section Still Read Correct — committed — 2026-08-20

**Problem**
Updating this doc's Quick Start, a `python3` heredoc sliced on `s.index('**Gotchas that will trip you**:')`. That string appears twice — once in Quick Start, once in the body — so the "replacement" inserted a second copy of the front half instead of replacing anything. The file went 174 → 309 lines with `## Overview`, `## Critical Gotchas`, `## Bugs Fixed` and `## Last Session` each appearing twice, and a mangled `## Next Steps\`.` heading where two fragments met.

Nothing caught it for three further edits. Every individual section read correctly; only the *set* was wrong, and each subsequent edit anchored into whichever copy it found first, compounding the damage. Recovery from `/tmp` backups failed twice because the backups had been taken after the corruption.

**Decision**
Chosen: for an anchored edit, use `Edit` — it refuses a non-unique anchor, which is precisely the failure here. Where a script is genuinely right, assert uniqueness before slicing (`s.count(anchor) == 1`) rather than trusting `.index()` to find the intended one.

Structural repair is bounded by section inventory, not by reading: list every `^## ` heading and confirm each appears exactly once. That check found the damage in one command after three edits had walked past it.

**Rejected**
- Reverting to the committed version. Why not: it predates this session's split, so recovery would have destroyed correct work to undo a formatting fault.
- Trusting a `/tmp` snapshot taken mid-session. Why not: two of the three had been written after the corruption, so restoring from them reproduced it. A snapshot is only a baseline if it predates the first suspect write.

**Consequences**
- **`.index()` on a phrase that recurs is the scripted-write trap in its quiet form.** It doesn't no-op and it doesn't error; it edits the wrong place and leaves output that reads correct section by section.
- **A duplicated section is invisible to every content check.** Fact-survival greps came back healthy — the facts were all present, some of them twice. Only heading inventory and the line count showed it.
- Confirms the plugin's own `{#shell-finds-tools-write}` rule from the failure side: the shell is for finding, `Edit` for changing.

**Status**: committed · **Reversible**: yes

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
- **D17's finding was re-confirmed on 2.1.235 and stands** — see `D-a-model-that-declines-a-rule-reports-it-as-absent` below for the re-test, and for why the four probes run before it produced the opposite answer.

**Status**: committed · **Reversible**: yes (re-test the canary if Anthropic ships a fix)

---

### D-a-model-that-declines-a-rule-reports-it-as-absent — Four Probes Concluded a File Never Loaded While the Harness Was Printing "Loaded" — committed — 2026-08-20

**Problem**
Asked whether D17's five-week-old finding had since been fixed upstream, this session re-tested it and concluded the mechanism had changed for the worse: a `paths:`-scoped rule appeared to load *never*, even when a matching file was read in the same turn. Four headless (`claude -p`) probes agreed, each with a positive control showing a frontmatter-less rule loading normally. The conclusion was wrong, and it was about to be written into three skill files and a changelog correction sent to colleagues.

An interactive run settled it in one shot: the session UI printed `Loaded .claude/rules/_probe-convention.md`, and the reply quoted the rule's contents back by full path — then answered "NONE STATED" anyway, having judged the planted file a probe rather than a genuine project convention ("isn't referenced by CHANGELOG.md, CLAUDE.md, or any skill, and this repo is a markdown plugin that emits no logs at all"). The rule had loaded every time. What varied was whether the model *acted* on it.

**Decision**
Chosen: keep D17's finding — a `paths:` glob does not keep the file out of context — and record the measurement trap as the more durable result. Read load-state from the harness (the `Loaded <path>` line, `/context`) rather than from the model's answer.

**Rejected**
- Trusting the headless probes because they carried a positive control. Why not: the control proved the payload *could* load, not that a negative answer meant it hadn't. Both arms share the confound — a model that dismisses the content answers identically to one that never received it.
- Rewriting the payload to be more credible and re-probing. Why not: this was already the second payload. The first (a planted passphrase) drew an explicit prompt-injection refusal; the neutral rewrite (a fake log-timestamp convention) drew a reasoned dismissal instead. Making the bait better produces a better refusal, not a cleaner measurement.

**Consequences**
- **Self-report cannot measure context membership.** "The model didn't mention it" is evidence about the model's judgement, not about what was in its window — and the two are indistinguishable from outside. Any absence-based finding about loading needs an out-of-band witness.
- **A planted canary invites the exact judgement that breaks the test.** Content designed to be distinguishable is content that looks planted, and a model that notices reports it as absent. This is the flaw in D17's own method too, though its conclusion survived.
- **Headless and interactive differ in what they let you see, not only in what they do.** The UI's load report existed the whole time and no headless probe could reach it.
- Confirms `{#absence-needs-a-live-writer}` on a surface it wasn't written for: the witness whose health went unestablished here was the model's willingness to answer.

**Status**: committed · **Reversible**: yes

---

### D-rewrite-skills-branch-on-file-ownership — House Style Is Enforced On Our Files and Never Imposed On a Consumer's — committed — 2026-08-20

**Problem**
A gate added earlier the same day told `update-claude-docs` Rewrite mode to adopt any *consistent* convention it found in a target CLAUDE.md, on the reasoning that consistency is evidence a person decided it. That is right for a consumer's repo and wrong for this one: inside syafiqkit, a uniformly-applied wrong shape is what a single bad pass produces, so the gate preserved drift and reported it as respect for authorial intent. The user's report — *"theirs one could be wrong or following outdated one the previous session do it wrong"* — is that failure from the owner's side.

**Decision**
Chosen: branch on **where the file sits**, which is checkable, rather than on how deliberate its shape reads, which is not. Plugin-owned → `references/structure.md` is authoritative and the skill normalizes. Consumer-owned → the file's own convention wins. Applied to Rewrite's gate, Capture's write step (the mode `/done` runs on nearly every session, and the one the original complaint most likely came through), and `condense-claude-md`'s compress-in-place conversions, which reshape convention despite being framed as a shrink.

Task docs are carved out explicitly: `tasks/**` never ships, so there is no consumer side and no branch to take.

**Rejected**
- Collapsing back to adopt-always. Why not: it is the defect the user reported.
- Collapsing to enforce-always. Why not: it reintroduces the defect the morning's gate was added to fix — reshaping a consumer's maintained file under cover of a tidy-up.
- Leaving Capture alone as "additive, so out of scope." Why not: Capture is the highest-traffic path, and an entry written in the wrong shape is how a file's convention drifts one entry at a time. Scoped instead to the entry being added, never a licence to restructure around it.

**Consequences**
- **Consistency proves a pass was uniform, never that it was right.** This is the sentence the whole branch rests on, and it is why a clean-looking convention in a file we own is drift rather than intent.
- **The deciding fact has to be checkable or the gate is decoration.** "Where the file sits" needs asking from the target file's own directory — a probe anchored to the plugin's directory walks up to whatever encloses it and fails silently toward claiming a consumer's file as plugin-owned.
- **A same-day reversal is a shape to expect, not an anomaly.** Both gates were correct about the case in front of them and wrong as universals; the repair was a branch, not picking a winner.

**Status**: superseded by `D-house-style-applies-everywhere` (v1.187.0) · **Reversible**: yes

---

### D-house-style-applies-everywhere — The Ownership Branch Was an Answer to a Question Nobody Asked — committed — 2026-08-20

**Problem**
The user asked for `update-claude-docs` to "enforce this plugin docs convention," and two consecutive sessions read "this plugin" as *files inside this repo* rather than *the convention this plugin holds*. The result was an ownership branch: enforce inside syafiqkit, defer to the file's own convention everywhere else. Shipped in v1.186.0. The user's correction was immediate — *"i dont want their claude.md keep their convention, it should enforce this plugin style"* — and confirmed against three options, choosing enforcement in every mode.

The branch was elaborate, internally consistent, reviewed by three agents, and answered a question about *authorial intent* that had never been in scope. Nothing in the reviews caught it, because each judged the branch's coherence rather than whether the branch should exist.

**Decision**
Chosen: house style applies to every CLAUDE.md the skills touch, consumer repos included, in Rewrite, Create, the Capture write step and `condense-claude-md`. Installing an opinionated plugin is installing the opinion; a pass that defers to what it found delivers nothing on exactly the files worth restructuring.

The content guarantee is what carries the safety the branch was reaching for: the rule inventory and its diff, with the capture filter as the only deletion authority. Form is enforced, content is preserved, and the pass states what it restructured.

**Rejected**
- Keeping the branch with better wording. Why not: the axis was wrong, not the phrasing. Every sentence explaining *when* to defer was machinery for a decision the user doesn't want made.
- Enforcing only in explicitly-invoked modes (Rewrite/Create), leaving Capture to match the file. Why not: offered and declined — a house-style entry written into a foreign-shaped file is the first step of the restructure, not a violation of it.

**Consequences**
- **"Consistency proves a pass was uniform, never that it was right" survived the reversal and changed sides.** It was the argument for enforcing inside this repo; it is now the argument for not weighing an existing file's shape anywhere. A sentence that works equally well for both branches of a decision is a sign the branch is doing no work.
- **A shipped version can be superseded within the hour, and the changelog has to carry it.** v1.186.0 announced the ownership branch to colleagues; v1.187.0 says plainly that it shipped and was reversed, rather than quietly describing new behaviour.
- **Task docs keep the opposite rule and now say so at both ends** — `task-summary`'s citation of the shared reference previously claimed it stated "the same judgement," which became false the moment the CLAUDE.md rule flipped.

**Status**: committed · **Reversible**: yes
