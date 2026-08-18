---
name: unhobble-instructions
description: >
  Read an instruction-bearing file as a whole and rewrite it into better shape — a SKILL.md, an agent definition, a CLAUDE.md/CLAUDE.local.md, a slash command, an on-demand reference table, a task doc (current.md or decisions/*.md), or a payload delivered whole into a context rather than opened by a session (a hook's injected ruleset, a runtime-assembled prompt). This is a whole-file improver, not a marker checker: it judges what the file makes a reader DO (ordering, where each rule sits relative to the moment it applies, what's stated in three places, what the balance of the file trains) and restructures accordingly, then folds rigid imperatives and mechanical thresholds into judgement prose wherever judgement already covers them — while keeping every fact a model can't derive. Moving, merging and resequencing whole sections is in scope and often the main deliverable. Trigger on "apply unhobbling to X", "unhobble these skills", "rewrite this as judgement prose", "read this file as a whole and improve it", "is this skill overconstrained", "this file has too many rules", "check this agent for rigid instructions", "de-constrain this", or when authoring or reviewing an instruction file that has accumulated more enforcement machinery than the judgement it protects seems to warrant. The lens applies equally to live files and those being drafted — the difference is deliverable shape and where verification starts. A file accumulating constraint-drift usually does so long after authoring; invoking this on a half-drafted file to govern its construction before drift sets in is a legitimate use case and often cheaper than fixing later. The lens is judgement-vs-constraint, not length — plain trimming is `condense-claude-md`/`condense-task-doc`. Decision blocks within task docs (### D-* sections) record a historical choice, and what was decided is inviolable: the option chosen, the options rejected and the reasons given cannot be replaced with a different judgement, and a superseded decision is never quietly restated as though it had always said the current thing. How that record is PHRASED is fair game — a Consequences list of trip-wires can become the reasoning it stands for, since that changes the shape and not the choice. `task-summary` writes new docs under this lens from the start; here the distinction matters more, because you are editing a record someone else committed.
---

# Unhobble Instructions

**Read the target whole, decide what shape it should have, and rewrite it.** The deliverable is the edited file (when rewriting an existing file) or the drafted file (when authoring one informed by this lens). A run that ends in findings, a strategy or an estimated cut has not done the job however good the analysis — two live runs stopped there and left the target byte-identical. If you reach the end holding a plan, execute it.

## What This Skill Is

This pass judges whether instruction files state facts or constraints, and whether the balance trains readers to reason or to reach for instruments. A file accumulates constraints one patched worst-case at a time: a mistake happened once, so a rule was added to prevent it; another happened elsewhere, another rule was born. Over time, the file reads as a comprehensive manual rather than guidance, even though every rule was earned by a real incident. The skill's job is to restore that judgment by collapsing enumerations into mechanisms, routing reference material away from resident prose, and reordering content so rules meet readers at the moment they're needed — not before there's anything to apply them to.

A rule is a constraint when a reader could derive it from context. A fact is something only the file teaches. The test is checkable: a missed fact leaves damage a reader couldn't have prevented by reasoning alone; a missed constraint is a mistaken process the reader would have caught anyway. **Keep facts; turn constraints into reasoning.**

Anthropic's write-up (`claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models`) names six shifts: rules→judgement, examples→interfaces, upfront→progressive disclosure, repetition→one home, CLAUDE.md-memory→auto-memory, simple specs→rich references. Two carry most of the work on a real file — rules becoming judgement, and hot-path detail moving behind a pointer — and they are the two a structural pass silently skips, because neither shows up as a section in the wrong place. Meaning is what's conserved; form is free. `never write multi-line comment blocks` becoming `match the surrounding code's comment density` is fewer words, the same meaning, now applicable to cases the enumeration got wrong.

This is not a condensing pass (`condense-claude-md` owns byte reduction) or a correctness review (`code-reviewer` checks whether rows are true). It's not the default when a rewrite feels large — it's the pass you run exactly when a file has accumulated enforcement machinery that judgement would have covered. Not a one-time fix: constraint-drift returns once this pass ends, so files stay healthier when they're revisited annually.

## Reading the File as a Document

Read it end to end **before opening a single rule**, and form a view on six things. A source the pass leans on gets the same treatment — an article summarised from memory yields a reading that is plausible, specific and wrong in the details that decide the rewrite.

- **What does this make a reader do, in order?** Where the physical order disagrees with the execution order, a reader meets rules before there's anything to apply them to and mostly won't carry them that far.
- **Where does each rule sit relative to the moment it's needed?** A correct rule in the wrong place fails as reliably as a wrong one — commonly a warning stacked above the branch it governs, or a mandate in a path most invocations skip.
- **What does it say more than once, and do the copies still agree?** A rule in three homes is three sessions patching the same miss without retiring the previous patch, and collapsing them beats sharpening any one. Copies drift as well as duplicate: two statements of the same fact hundreds of lines apart can contradict outright.
- **What would a reader who absorbed all of it default to?** Not what any row says — what the balance trains. Twenty mechanical rows beside one judgement sentence produce a reader who reaches for the instrument every time, because the instrumental options carry concrete shape and the judgement is a line they scroll past.
- **Which enumerations are standing in for one principle?** An enumeration is raw material this pass converts. Twenty rows each naming a way to have erred usually encode two or three mechanisms a reader could apply to cases the list never anticipated — `never write multi-line comment blocks` becoming `match the surrounding code's comment density` is the whole operation in one line.
- **What here does a reader need on every invocation, and what do they need twice a year?** The rare half belongs behind a pointer in `references/` or a lazy-load skill. The heuristic: a reader arrives at a fact already holding the failure that sends them looking (error string, command, ID) or about to act preemptively (rule governing a routine choice). The second kind needs to be resident and absorbed, not deferred behind a pointer; the first can move. But file delivery shape matters — content moved to a companion is lost if the file is assembled at runtime and delivered whole. Know how the file reaches its reader before answering this question.

The first four questions are about shape and the last two about content, and that split is why a pass can go wrong while looking thorough: reordering sections, merging duplicate homes and regrouping a table all answer the shape questions completely, and a file can come out of that better organised with every rule it started with. That is reorganisation, not this pass. If nothing became a principle and nothing left the hot path, the two content questions went unanswered whatever the structural work looked like.

### Sampling Bias

A target large enough that the six-question read feels like the whole job is exactly where this pass most often substitutes a different one: a file that announces its own recent merge or restructure reads as evidence the shape work is already done, and the reasoning quietly drifts to whether the file is big (`condense-claude-md`'s question) instead of whether its rules are judgement dressed as mandate (this pass's question).

Reading is what does this. A marker count locates candidates and nothing more — density predicts a file's subject, not its health. The densest file is often the healthiest; the one with no markers can be the badly shaped one.

For large files, opening at least one table and attempting conversion (even if it fails) is mandatory before concluding "no clusters here." A genre-level verdict resting on a sample needs that sample named, not assumed. And a whole-file verdict ("well-shaped", "no edit needed") built on skimming several tables is a claim about those tables only — extending it to every section the pass never opened is the failure this paragraph exists to name.

## Per-Rule Assessment

The heart of this step is **distinguishing facts from constraints**. A fact has a checkable consequence if missed — a harness quirk, a binary with a silent-failure cost, a structural detail of this repo. No amount of reasoning gets a reader there; it has to be told. A constraint restates what a competent read would conclude anyway, made rigid because a past mistake got patched with a rule instead of trust.

Its tells: a trip-wire naming one specific way to have failed, a bolded imperative, a numeric threshold standing in for "does this feel right", two callouts making the same point, a worked incident sitting in the instructions instead of git history.

**Take cluster verdicts first.** A large enumeration can pass the per-row test on every row — each was earned by a real incident, each names something true — yet the thirty rows together are the wrong form for what two or three sentences of mechanism would cover. The mechanism sentences replace the rows, the value-shaped specifics inside them survive as a shorter reference, and a reader ends up able to handle cases the enumeration never listed. Where a cluster genuinely resists — the rows share no mechanism, each is a separate arbitrary fact about a different tool — that is a real finding worth stating. Attempting and failing to abstract is the only way to know; skimming three tables and calling their genre "heterogeneous facts" is a shortcut that never opens the un-sampled ones.

For what remains after clusters convert:
- **Facts stay, stated plainly.** A stated limitation is a fact even though it reads like hedging — delete "this check does not prove X" and the confident half asserts a guarantee the original withheld.
- **Constraints become reasoning.** A rule that reads as absolutist may be the surviving fix to a documented incident. Grep the project's `decisions/*.md` for its keywords before softening; a Rejected-alternatives entry saying judgement was tried there and failed outranks this pass's lean toward loosening.

📖 `references/target-types.md` — what counts as a genuine fact per target class, and the ADR-blocks-inside-a-task-doc case where the boundary runs through a file rather than around it. Read it when the target isn't an obvious SKILL.md; the fact-vs-constraint test is constant, but what it protects differs by class.
- **A row can pass on content and still carry constraint-markers** (an `⚠️` or trailing `**Tell:**` that only restates the row's own condition). These are separate questions about the same row.

## Routing: Where Content Belongs

As constraints become reasoning and enumerations collapse into mechanisms, ask whether the resulting content belongs in an always-loaded file. Four questions run in sequence:

1. **Is it derivable?** If a reader could reconstruct it with `ls`, `grep`, reading the manifest, or running `--help`, cut it outright rather than rewriting it.

2. **Is it safety-critical?** Prohibitions that *must* fire even if ignored by a prior session (e.g., "never edit generated files", "never push to main") are always resident, never deferred. Their cost is fixed; their value is irreplaceable.

3. **Does it need to arrive before action, or only during failure?** A rule governing a routine choice (which tool to use, what to check before an action) needs to be resident and absorbed preemptively — deferring it behind a pointer means it only fires again after someone violates it. A consultation rule, implementation detail, or symptom-indexed gotcha is different: it's read by someone already holding a failure, so moving it to a `📖` pointer or a lazy-load skill costs nothing and gains resident clarity.

4. **Is it a reference table or lookup?** A section that reads like a catalog (error strings, commands, configuration paths) should usually move behind a pointer in `references/` or become a lazy-load skill, even if you've just finished sharpening its prose.

**But content delivery shape decides what's possible.** A file delivered whole into a context (a hook payload, a prompt string assembled at runtime, a manifest concatenated by CI) reaches its reader without a working directory, so a `📖` line resolves nowhere and a lazy-load skill is unreachable. When a file has no destination, keep or cut is the only choice, and it raises the bar on cutting: content failing the residency test would normally be relocated, but here it becomes a deletion. **Ask how the file reaches its reader before applying the routing tests.**

If content passes all four tests and can be relocated, keep it resident. If it fails any but has a destination (a companion, a reference folder), decide whether to delete it (derivable), defer it (failure-triggered), move it to a skill (task-specific), or split it into a companion (reference table). If it has no destination, keep or delete only — and keep higher-bar content to preserve facts that can't be reconstructed.

**A SKILL.md that accumulates multiple routing tiers** (resident rules + lazy-loaded content) is a signal to split. Each tier has a distinct reader audience (absorbed on every session vs. invoked on-demand), and they fight for brevity differently.

**The shape that split reaches for is a symptom index over per-category files.** What stays resident is one row per symptom, each pointing at an anchor; every mechanism and fix body moves out into a file behind those anchors. The reader matches their own symptom in the index, follows one anchor, and opens one small file — so the resident half stays a routing surface and never re-accumulates the bodies. Applied to a 74.7 KB `CLAUDE.md` it left 17 KB resident, and a 184 KB companion became a 31 KB hub over six files, no anchor lost. Reach for this before inventing a structure: a split that clusters by existing heading instead of by symptom rebuilds the same wall one file over. When you are ready to execute one, read 📖 `../condense-claude-md/references/structural-splits.md` for the clustering method, the per-category index requirement, the maintenance rule, and the rows that have no symptom and therefore cannot be evicted at any frequency.

## Rewriting

List the genuine facts first, marking which are stated absolutely — that list is what verification checks against later.

Then write it. A full `Write` once more than a handful of rules are affected; targeted `Edit`s for one or two callouts. Structural findings are the ones that go unexecuted most often, because moving a section feels like a bigger claim than softening a callout — but a file whose shape is wrong stays wrong when only its wording changes.

**When moving content to a companion:**

A move means the destination file exists and holds the content when you finish. Write it first, then cut from the source — the two halves in one pass, never a deletion now against a companion "ready to split" later. If the pass ends and a companion you named doesn't exist, the content is deleted, whatever the summary claims.

Where a split is the move (reverting a prior merge into on-demand companions), cluster by what a reader actually searches on (the trigger symptom, the tool, the class name), not by a pre-existing heading. Give each real cluster its own file. This mechanics — clustering, naming, pointer paths — is owned by `condense-claude-md`'s `../condense-claude-md/references/structural-splits.md`; read it before executing a companion split.

⚠️ **Destination path gotcha:** A companion belongs at the **nearest git-repo root** of the file you are editing (`git -C <target-dir> rev-parse --show-toplevel`), not at whatever a `~`-prefixed path happens to resolve to from your cwd. Settle both by reading an existing `📖` line in the target and copying its path shape, then `ls` the file at the path the pointer states — not at the path you meant. 📖 `../condense-claude-md/references/structural-splits.md` (§Location) covers the global-`~/.claude` exception and why the rule matters.

**Don't propose; execute.** There is no approval step: the file is version-controlled, a bad rewrite is one `git checkout` away from gone, and asking costs more than reverting would.

## Verifying

Read the rewritten file from the top, whole — the same read as the one that opened the pass. Ask whether a reader of this file still knows what a reader of the old one knew, and whether it sits right as one document. The worst defects exist in no hunk: two sections that shouldn't coexist, a rule split across two homes hundreds of lines apart, a heading describing the file as something it isn't. Each hunk is locally fine, so a diff review is blind to all of them by construction.

**Structural defects hide in edits that look finished at the line level.** Counting doesn't reach them. Surviving identifiers, anchors, rows, bytes — each answers "how many survived", which is answerable and different from "does this work". A search for a fact you suspect was dropped returns zero just as readily when the fact was reworded. Empty headings (sections with no content, just a heading) are the same defect in miniature; they survive every check because the heading is exactly what a structural pass looks for.

**References and pointers invalidate when content moves.** The ones inside the file you just rewrote are the easy half and the half most often missed: moving a section elsewhere leaves every sentence that said "see the X section below" pointing at nothing — read those in place. The harder half is in *other* files: is each surviving pointer still accurate? And a pulled-up fact leaves a citation behind; after inlining anything, ask which files this one no longer cites and which absorbed facts had machinery behind them. A reference left cited by nothing is either content to fold in and delete, or a pointer to restore.

📖 `references/verifying.md` — what each check can and cannot see, what delegation changes, and the markup damage that survives every content check.

**Report both halves:** what moved, merged or got resequenced, and what stopped being an enumeration or left the hot path. A report that is all structure describes a reorganisation, and one that is all softened callouts describes a wording pass — either alone reads as complete while the other half never happened. Where a half genuinely had nothing to do, say that rather than omitting it. Every claim names an edit that landed; a strategy, a proposal or an estimated cut belongs to a pass that didn't run. Say where you made a bet rather than a strict improvement: trading a mechanical check for a judgement call is a real trade-off, since the mechanical one fires regardless of how a read feels.

Reading the file and finding it well-shaped is a legitimate outcome, and it is the one case where the report is the whole deliverable — say so plainly, since it's also what a marker hunt produces.

## Authoring Under This Lens

When authoring a new instruction file under this lens from the start, the structure reads differently than when auditing an existing one: there is no before/after to diff, no drift to measure against a baseline. Apply the six-question read as you draft — what should a reader DO in order, where does each rule sit relative to its moment of need, what facts repeat, what would the balance train — and write toward that shape from the start. The verification step still applies (read it whole when draft is done, ask the same six questions) but it measures against the file itself rather than against an earlier version.

A run that ends in an outline or a structure sketch has not delivered, the same as an audit-shaped run that ends in strategy.

## Syafiqkit Conventions

For a syafiqkit target, this runs alongside the plugin's authorship conventions: version bump + CHANGELOG entry, the ownership check before patching (never edit a consumer-side install), and a shared-mechanism grep before assuming a fix is single-file. For a third-party file, none of that applies.

## What This Is Not

- Not a condensing pass — `condense-claude-md`/`condense-task-doc` own byte reduction and structural splits.
- Not a correctness review: a rule can be correct and still the wrong shape, and prose can read well and be quietly wrong, which `code-reviewer` catches and this doesn't.
- Not a one-time fix, since overconstraint accumulates one patched worst-case at a time.
