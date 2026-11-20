---
name: unhobble-instructions
description: >
  Read an instruction-bearing file as a whole and rewrite it into better shape — a SKILL.md, an agent definition, a CLAUDE.md/CLAUDE.local.md, a slash command, an on-demand reference table, a task doc (current.md or decisions/*.md), or a payload delivered whole into a context rather than opened by a session (a hook's injected ruleset, a runtime-assembled prompt). This is a whole-file improver, not a marker checker: it judges what the file makes a reader DO (ordering, where each rule sits relative to the moment it applies, what's stated in three places, what the balance trains) and restructures accordingly, then folds rigid imperatives and mechanical thresholds into judgement prose wherever judgement already covers them — while keeping every fact a model can't derive. Moving, merging and resequencing whole sections is in scope and often the main deliverable. Trigger on "unhobble X", "rewrite this as judgement prose", "read this file as a whole and improve it", "is this skill overconstrained", "this file has too many rules", "check this agent for rigid instructions", "de-constrain this", or when authoring or reviewing an instruction file carrying more enforcement machinery than the judgement it protects warrants. The lens is judgement-vs-constraint, not length — plain trimming is `condense-claude-md`/`condense-task-doc`. Applies equally to live and half-drafted files; invoking it during authoring, before drift sets in, is legitimate and usually cheaper than fixing later.
---

# Unhobble Instructions

Fewest tokens for the same or better meaning, never fewer at the cost of meaning (📖 `../_shared/references/writing-style.md`). A tighter rewrite that reversed a rule's guidance, or trimmed the evidence that made a "Tell:" checkable, is not an improvement. Meaning is conserved; form is free, but conserved means checked, not assumed.

**Read the target whole, decide what shape it should have, and rewrite it.** The deliverable is the edited file. A run ending in findings, a strategy or an estimated cut has not done the job however good the analysis: two live runs stopped there and left the target byte-identical. If you reach the end holding a plan, execute it.

## What This Is Not

- Not a condensing pass (`condense-claude-md`/`condense-task-doc` own byte reduction and splits). Every file you touched stays a condense target; "already looked at these" is the reasoning that skips them. On a target with companions, condense the set, not only the file someone named.
- Not a correctness review: a correct rule can have the wrong shape, and `code-reviewer` catches what this doesn't.
- Not a one-time fix: overconstraint accumulates one patched worst-case at a time.

## What This Skill Is

This pass judges whether instruction files state facts or constraints, and whether the balance trains readers to reason or to reach for instruments. A file accumulates constraints one patched worst-case at a time until it reads as a manual rather than guidance, though every rule was earned by a real incident. Restore the judgement: collapse enumerations into mechanisms, route reference material away from resident prose, and reorder content so rules meet readers when they apply, not before.

A rule is a constraint when a reader could derive it from context. A fact is something only the file teaches. The test is checkable: a missed fact leaves damage a reader couldn't have prevented by reasoning alone; a missed constraint is a mistaken process the reader would have caught anyway. **Keep facts; turn constraints into reasoning.**

Two moves carry most of the work, rules becoming judgement and hot-path detail moving behind a pointer, and a structural pass silently skips both because neither shows up as a section in the wrong place. `never write multi-line comment blocks` becoming `match the surrounding code's comment density` is fewer words, the same meaning, and covers cases the enumeration got wrong.

**Degrees of freedom stop at fragility.** A rigid rule misfires on every neighbour where several approaches are valid, so convert it to judgement. A fragile, must-be-identical operation (an exact command, a literal threshold) is *low* freedom by design, and judgement prose would be the same error inverted. The test is what happens when the reader is wrong: a misjudged heuristic costs a rethink, a mangled command costs the operation.

The companion test: does a line tell the reader something they couldn't derive? Explaining a well-known tool, or restating what the prose already implies, spends context and dilutes the rules that carry weight. Keep the ones a reader couldn't have derived, however plainly they read.

Not the default when a rewrite feels large: it is the pass you run when a file has accumulated enforcement machinery that judgement would have covered.

## Reading the File as a Document

Read it end to end **before opening a single rule**, and form a view on six things:

- **What does this make a reader do, in order?**
- **Where does each rule sit relative to the moment it's needed?**
- **What does it say more than once, and do the copies still agree?**
- **What would a reader who absorbed all of it default to?** Not what any row says but what the balance trains.
- **Which enumerations are standing in for one principle?**
- **What does a reader need every invocation, and what twice a year?**

Shape questions can pass for a thorough read: reordering and regrouping answer them completely while every rule survives. If nothing became a principle and nothing left the hot path, the two content questions went unanswered, whatever the structural work looked like.

📖 `${CLAUDE_SKILL_DIR}/references/reading-as-a-document.md`: what each question means against a real file, the sampling-bias trap (a verdict on a few skimmed tables is a claim about those tables), grading an outside source against the project's decision records (a session once wrote a restatement that *inverted* a verdict already in the repo), and the degrees-of-freedom argument. Read it before calling any file well-shaped, when the target is large, or when an outside source motivated the pass.

## Per-Rule Assessment

⚠️ **When you are a dispatched agent, your prompt's "must survive" list is an input to this step, not a boundary around it, and a clause protecting a CLASS by its form has already answered the question you were dispatched to ask.** "Keep every `**Tell:**`" and "all dated incidents stay" quantify over a pattern, so they cannot be tested or argued with. The failure is silent both ways: obeying leaves the pass a no-op on the rules most likely to need it, while disagreeing silently produces the report measured 2026-09-11 (story in verifying.md). Treat a form-based clause as the dispatcher's statement of what they VALUE, judge each member on its merits, and **say in your report which protected items you judged against and why**, one line each. A named instance ("the 2026-09-06 chunk-load incident, the only evidence this rule exists") is a genuine constraint and stays; a pattern is a preference to surface, not to honour or break quietly. Cross-file contracts are the exception that really is absolute: `{#anchor}`s and `📖` pointers are named by files you cannot see.

The heart of this step is **distinguishing facts from constraints**. A fact has a checkable consequence if missed: a harness quirk, a binary with a silent-failure cost, a structural detail of this repo. No amount of reasoning gets a reader there; it has to be told. A constraint restates what a competent read would conclude anyway, made rigid because a past mistake got patched with a rule instead of trust.

Its tells: a trip-wire naming one specific way to have failed, a bolded imperative, a numeric threshold standing in for "does this feel right", two callouts making the same point, a worked incident sitting in the instructions instead of git history.

**Take cluster verdicts first.** A thirty-row enumeration can pass the per-row test on every row and still be the wrong form for two or three sentences of mechanism. Convert the rows to mechanism and keep the value-shaped specifics as a shorter reference. A cluster that genuinely resists (rows sharing no mechanism) is a real finding only once you have attempted the abstraction and watched it fail.

For what remains after clusters convert:
- **Facts stay, stated plainly.** A stated limitation is a fact even though it reads like hedging: delete "this check does not prove X" and the confident half asserts a guarantee the original withheld.
- **Constraints become reasoning.** A rule that reads as absolutist may be the surviving fix to a documented incident. Grep the project's `decisions/*.md` for its keywords before softening; a Rejected-alternatives entry saying judgement was tried there and failed outranks this pass's lean toward loosening. Reconciling a hard rule with an exception means writing an exception the file already states into the rule's own sentence, never inventing one. A sentence another file quotes stays verbatim, with nothing added beside it (17/11/2026: a reconciling pass wrote a licence into a sentence skills/judgement quotes; reverted by hand).
- **A row can pass on content and still carry constraint-markers** (an `⚠️` or trailing `**Tell:**` that only restates the row's own condition). These are separate questions about the same row.

**A decision block in a task doc (`### D-…`) is a record, and what it decided is not yours to change.** The option chosen, the options rejected and the reasons stay; a superseded decision gets a new block saying so, never a quiet restatement. This is the one target class where the licence to rewrite meaning stops. How the record is *phrased* stays fair game: a Consequences list of trip-wires can become the reasoning it stands for. The tell that you have crossed the line is a rewritten block a reader would now act on differently.

**A verbatim copy under `decisions/` (a contract, quotation, policy, or captured spec whose header or owning doc says so) is not an instruction file at all.** Leave it untouched even when the set you were handed includes it: its wording is the deliverable, and scripts or `git diff` history often read it at its path. Report it as skipped.

**A task doc's skeleton is also a contract.** Other skills and sessions find content by its frame: the LLM-CONTEXT block, the template's section headings (`current.md` uses the Full Template; a `decisions/*.md` theme file uses its own shape, `task-summary/references/templates.md`), and required sections kept as pointer rows. Rewrite and regroup freely inside a section, and move material to a `decisions/<theme>.md` theme file. Renaming headings, deleting the header block or dropping a required section changes the template, which a single-file pass must not do; a move you judge right but cannot make is reported, not carried out as a deletion. Measured 2026-10-01: three of six haiku passes did exactly that (story in target-types.md).

📖 `${CLAUDE_SKILL_DIR}/references/target-types.md`: what counts as a genuine fact per target class, and where the boundary runs through a file rather than around it. Read it when the target isn't an obvious SKILL.md; the fact-vs-constraint test is constant, but what it protects differs by class.

## Routing: Where Content Belongs

Content fails routing when it belongs in a reference file, behind a pointer, or deleted outright, rather than staying resident. The question is whether it governs a routine choice (resident, read preemptively) or only arrives once someone holds a failure (pointer, consulted on demand). A catalog (error strings, commands, config paths) usually moves to a reference file. A rule stating derivable information (`ls` would show it, `--help` documents it) gets cut outright.

Safety-critical prohibitions ("never edit generated files", "never push to main") stay resident always; their cost is fixed and their value irreplaceable.

📖 `${CLAUDE_SKILL_DIR}/references/routing-content.md`: the four-question routing test, how a file's delivery shape decides what moves are possible, and the symptom-index clustering method for multi-tier files. Read it when routing means moving content to a companion rather than deleting it outright.

⚠️ **Relocating is not delivering.** Nothing loads a reference file, so a pointer is a suggestion the reading model may decline, and measured follow-through is poor. Extraction is a trade, not a free win: keep the sentence that tells a reader they HAVE a problem inline, and move only the fix procedure. Two things raise the odds at no cost: name the trigger where the pointer sits ("when X, read Y because Z"), and write the path as `${CLAUDE_SKILL_DIR}/references/<file>.md`, which expands to an absolute path.

⚠️ **Before cutting a rule as derivable, check where else it actually lives: "a reader could look this up" and "a reader can look this up" are different claims.** An obligation the codebase cannot show you (a mirror in another repo no CI reaches, a manual step kept out of a deploy path) usually has exactly one home. A grep across the repo's other docs settles it. Where the target is the sole home, the rule stays resident whatever its shape.

## Rewriting

List the genuine facts first, marking which are stated absolutely; that list is what verification checks against later. Then write it. Structural findings are the ones that go unexecuted most often, because moving a section feels like a bigger claim than softening a callout, but a file whose shape is wrong stays wrong when only its wording changes.

**Don't propose; execute.** There is no approval step: asking costs more than reverting would.

Make the rewrite as a series of `Edit`s, even when it touches many rules: a revert to the last commit also discards whatever earlier, uncommitted passes or other sessions left in the file, and `Edit` refuses a stale anchor where a whole-file `Write` silently overwrites. A full `Write` is for a file whose uncommitted diff is entirely your own, after copying it aside, and never when your brief says `Edit` only (20/11/2026: a `refresh-instructions` Pass 3 agent replaced a root `CLAUDE.md` holding two earlier passes' uncommitted output with one `Write`, against its brief).

**When moving content to a companion:**

The destination exists and holds the content when you finish. Write it first, then cut from the source, never a deletion now against a companion "ready to split" later. A named companion that doesn't exist means the content is deleted, whatever the summary claims, and reads as thorough routing because grep "finds" the pointer.

⚠️ **Deleting because an existing companion "already covers this" is the same deletion with the write step skipped, and it feels safer precisely because no new file was needed.** The rule above binds when you write a destination; this is the case where you write none, so nothing in your own pass looks like a move and the reasoning arrives as tidying rather than cutting. It is licensed when true, but a sibling holding a section is a memory of having seen that topic, and topic overlap is not the passage. Before cutting, grep the survivor for the section's heading and primary named symbol; a zero means you are about to delete the only copy. Measured 2026-09-03: 17 of 17 removed headings absent from an unopened companion (story in verifying.md). **Tell: your justification for a deletion is a claim about a file you have not read this pass.**

⚠️ **Resolve a new pointer as a path, never by eye.** The depth prefix depends on where the citing file sits: `../_shared/…` is correct from a SKILL.md and the same string one directory down is not. Copy the shape from an existing pointer, then `ls` it from the citing file's own directory. This defect reads as correct at both ends and has recurred here.

⚠️ **A companion clustered by the source's own headings has rebuilt the same wall one file over**, and nothing in the result shows it: the pointers resolve and the resident file really is smaller. Decide the destination's clustering before writing it; retrofitting moves every body twice. **Tell: your new companion's headings are recognisable as the source's section names.** `${CLAUDE_SKILL_DIR}/references/routing-content.md` has the symptom-index shape; `../condense-claude-md/references/structural-splits.md` (§Location) has the clustering method and the global-`~/.claude` path exception.

**When a dispatching prompt forbids one of this skill's core moves, say so in the report rather than letting the constraint pass as a finding about the file.** A caller may see what you cannot (a concurrent agent mid-restructure in the target directory), and following the scope is right. Reporting "no extraction needed" is not: that is a verdict about the target that the prompt supplied. Name the constraint and what you would have moved, and the caller can re-dispatch; a silent skip looks identical to a half that had nothing to do. Measured 2026-09-03 on exactly this pair. Content whose destination your write scope doesn't reach stays in place, named by its destination; deleting it loses it. **Tell: your report claims a pass found nothing to do on an axis your prompt closed, or says content "belongs elsewhere" about something you deleted.**

## Verifying

Read the rewritten file from the top, whole: the same read as the one that opened the pass. Ask whether a reader of this file still knows what a reader of the old one knew, and whether it sits right as one document. The worst defects exist in no hunk: two sections that shouldn't coexist, a rule split across two homes hundreds of lines apart, a heading describing the file as something it isn't. Each hunk is locally fine, so a diff review is blind to all of them by construction.

**A count answers "how many survived", never "does this still work".** Identifiers, anchors, rows and bytes all survive a rewrite that reversed the claim around them, and a search for a dropped fact returns zero just as readily when the fact was merely reworded. Empty headings are the same defect in miniature: the heading is exactly what a structural pass preserves.

**Moving content invalidates pointers at both ends.** Inside the file, every "see the X section below" now aims at nothing. Outside it, a fact you pulled up leaves its citation stranded, so after inlining anything, ask which files this one no longer cites, and whether any absorbed fact had machinery behind it. A reference cited by nothing is either content to fold in and delete or a pointer to restore.

Before trusting any of the above, read `${CLAUDE_SKILL_DIR}/references/verifying.md`: it names what each check can and cannot see, what delegation changes, and the markup damage that survives every content check.

**Report both halves:** what moved, merged or got resequenced, and what stopped being an enumeration or left the hot path. Where a half genuinely had nothing to do, say that rather than omitting it. Every claim names an edit that landed; a strategy, a proposal or an estimated cut belongs to a pass that didn't run. Say where you made a bet rather than a strict improvement: trading a mechanical check for a judgement call is a real trade-off, since the mechanical one fires regardless of how a read feels.

Finding the file well-shaped is a legitimate outcome and the one case where the report *is* the deliverable: say so plainly, since a genuine clean verdict and an unread file produce the same report.

## Authoring Under This Lens

Authoring under this lens differs only in what verification measures against: there is no baseline to diff, so the six-question read runs as you draft and again on the finished file, judged against the file itself. A run ending in an outline has not delivered, the same as an audit ending in strategy.

## Syafiqkit Conventions

When the target is a syafiqkit file, the plugin's own authorship conventions apply on top of this pass, owned by 📖 `syafiqkit:update-plugin`: the ownership check before patching (never edit a consumer-side install), the shared-mechanism grep before assuming a fix is single-file, and the version bump + CHANGELOG entry. For a third-party file, none of it applies.
