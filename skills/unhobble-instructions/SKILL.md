---
name: unhobble-instructions
description: >
  Read an instruction-bearing file as a whole and rewrite it into better shape — a SKILL.md, an agent definition, a CLAUDE.md/CLAUDE.local.md, a slash command, an on-demand reference table, a task doc (current.md or decisions/*.md), or a payload delivered whole into a context rather than opened by a session (a hook's injected ruleset, a runtime-assembled prompt). This is a whole-file improver, not a marker checker: it judges what the file makes a reader DO (ordering, where each rule sits relative to the moment it applies, what's stated in three places, what the balance of the file trains) and restructures accordingly, then folds rigid imperatives and mechanical thresholds into judgement prose wherever judgement already covers them — while keeping every fact a model can't derive. Moving, merging and resequencing whole sections is in scope and often the main deliverable. Trigger on "unhobble X", "rewrite this as judgement prose", "read this file as a whole and improve it", "is this skill overconstrained", "this file has too many rules", "check this agent for rigid instructions", "de-constrain this", or when authoring or reviewing an instruction file carrying more enforcement machinery than the judgement it protects warrants. The lens is judgement-vs-constraint, not length — plain trimming is `condense-claude-md`/`condense-task-doc`. Applies equally to live and half-drafted files; invoking it during authoring, before drift sets in, is legitimate and usually cheaper than fixing later.
---

# Unhobble Instructions

**Read the target whole, decide what shape it should have, and rewrite it.** The deliverable is the edited file. A run ending in findings, a strategy or an estimated cut has not done the job however good the analysis — two live runs stopped there and left the target byte-identical. If you reach the end holding a plan, execute it.

## What This Is Not

- Not a condensing pass — `condense-claude-md`/`condense-task-doc` own byte reduction and structural splits.
- Not a correctness review: a rule can be correct and still the wrong shape, and prose can read well and be quietly wrong, which `code-reviewer` catches and this doesn't.
- Not a one-time fix, since overconstraint accumulates one patched worst-case at a time.

## What This Skill Is

This pass judges whether instruction files state facts or constraints, and whether the balance trains readers to reason or to reach for instruments. A file accumulates constraints one patched worst-case at a time: a mistake happened once, so a rule was added to prevent it; another happened elsewhere, another rule was born. Over time, the file reads as a comprehensive manual rather than guidance, even though every rule was earned by a real incident. The skill's job is to restore that judgment by collapsing enumerations into mechanisms, routing reference material away from resident prose, and reordering content so rules meet readers at the moment they're needed — not before there's anything to apply them to.

A rule is a constraint when a reader could derive it from context. A fact is something only the file teaches. The test is checkable: a missed fact leaves damage a reader couldn't have prevented by reasoning alone; a missed constraint is a mistaken process the reader would have caught anyway. **Keep facts; turn constraints into reasoning.**

Two moves carry most of the work on a real file — rules becoming judgement, and hot-path detail moving behind a pointer — and they are the two a structural pass silently skips, because neither shows up as a section in the wrong place. Meaning is conserved; form is free. `never write multi-line comment blocks` becoming `match the surrounding code's comment density` is fewer words, the same meaning, and now covers cases the enumeration got wrong.

**Why this matters, and where it stops.** The current framing for this is *degrees of freedom*: match how tightly you specify something to how fragile it is. Where several approaches are valid and the right one depends on context, a rigid rule is worse than useless — it fires on the cases it was written for and misfires on every neighbour, and a reader who absorbed twenty of them reaches for an instrument instead of thinking. That is what this pass exists to undo. But the same principle sends fragile, must-be-identical operations the other way: an exact command, a literal threshold, a specific sequence is *low* freedom by design, and converting it to judgement prose is the same error inverted. The test that separates them is what happens when the reader is wrong — a misjudged heuristic costs a rethink, a mangled command costs the operation.

The companion test is whether a line is telling the reader something they don't already know. A model arrives competent; explaining what a well-known tool does, or restating what the surrounding prose implies, spends context to add nothing and dilutes the rules that do carry weight. Ask of each passage whether a reader could have derived it — and keep the ones they couldn't, however plainly they read.

Not the default when a rewrite feels large — the pass you run when a file has accumulated enforcement machinery that judgement would have covered.

## Reading the File as a Document

Read it end to end **before opening a single rule**, and form a view on six things:

- **What does this make a reader do, in order?**
- **Where does each rule sit relative to the moment it's needed?**
- **What does it say more than once, and do the copies still agree?**
- **What would a reader who absorbed all of it default to?** — not what any row says, what the balance trains.
- **Which enumerations are standing in for one principle?**
- **What does a reader need every invocation, and what twice a year?**

The first four questions are about shape and the last two about content, and that split is why a pass can go wrong while looking thorough: reordering sections, merging duplicate homes and regrouping a table all answer the shape questions completely, and a file can come out of that better organised with every rule it started with. That is reorganisation, not this pass. If nothing became a principle and nothing left the hot path, the two content questions went unanswered whatever the structural work looked like.

A verdict built on a sample is a claim about that sample, so "well-shaped, no edit needed" after skimming a few tables is not a reading of the file — and a marker count locates candidates rather than settling anything.

📖 `${CLAUDE_SKILL_DIR}/references/reading-as-a-document.md` — what each of the six questions means against a real file, the sampling-bias trap in full, and how to grade an outside source against the project's own decision records before adopting anything from it (a session once worked for hours from an article whose verdict already sat in the repo, and wrote in a restatement that *inverted* it). Read it when the target is large, or when an outside source motivated the pass.

## Per-Rule Assessment

⚠️ **When you are running as a dispatched agent, your prompt's "must survive" list is an input to this step, not a boundary around it — and a clause protecting a CLASS by its form has already answered the question you were dispatched to ask.** "Keep every `**Tell:**`", "preserve all `⚠️` callouts", "all dated incidents stay" quantify over a pattern rather than naming a thing whose loss costs something, so they cannot be tested and cannot be argued with. The failure is silent in both directions: obeying leaves the pass a no-op on exactly the rules most likely to need it, while disagreeing silently produces the shape measured 2026-09-11 — an agent that deleted a protected sentence with a rationale attached, duplicated a rule it reported relocating, and dropped a dated incident, all inside a report claiming full compliance. So treat a form-based clause as the dispatcher telling you what they VALUE, judge each member on its merits, and **say in your report which protected items you judged against and why** — one line each. A named instance ("the 2026-09-06 chunk-load incident, because it is the only evidence this rule exists") is a genuine constraint and stays; a pattern is a preference you must surface rather than quietly honour or quietly break. Cross-file contracts are the exception that really is absolute: `{#anchor}`s and `📖` pointers are named by files you cannot see, so their loss lands somewhere you will never look.

The heart of this step is **distinguishing facts from constraints**. A fact has a checkable consequence if missed — a harness quirk, a binary with a silent-failure cost, a structural detail of this repo. No amount of reasoning gets a reader there; it has to be told. A constraint restates what a competent read would conclude anyway, made rigid because a past mistake got patched with a rule instead of trust.

Its tells: a trip-wire naming one specific way to have failed, a bolded imperative, a numeric threshold standing in for "does this feel right", two callouts making the same point, a worked incident sitting in the instructions instead of git history.

**Take cluster verdicts first.** A thirty-row enumeration can pass the per-row test on every row — each earned by a real incident, each true — and still be the wrong form for what two or three sentences of mechanism would cover. Convert the rows to mechanism, keep the value-shaped specifics as a shorter reference, and the reader gains cases the list never anticipated. A cluster that genuinely resists (rows sharing no mechanism, each an arbitrary fact about a different tool) is a real finding — but only once you have attempted the abstraction and watched it fail.

For what remains after clusters convert:
- **Facts stay, stated plainly.** A stated limitation is a fact even though it reads like hedging — delete "this check does not prove X" and the confident half asserts a guarantee the original withheld.
- **Constraints become reasoning.** A rule that reads as absolutist may be the surviving fix to a documented incident. Grep the project's `decisions/*.md` for its keywords before softening; a Rejected-alternatives entry saying judgement was tried there and failed outranks this pass's lean toward loosening.
- **A row can pass on content and still carry constraint-markers** (an `⚠️` or trailing `**Tell:**` that only restates the row's own condition). These are separate questions about the same row.

**A decision block in a task doc (`### D-…`) is a record, and what it decided is not yours to change.** The option chosen, the options rejected and the reasons given all stay — a superseded decision gets a new block saying so, and is never quietly restated as though it had always said the current thing. This is the one target class where the usual licence to rewrite meaning stops, because you are editing something someone else committed and a future reader will cite. How the record is *phrased* stays fair game: a Consequences list of trip-wires can become the reasoning it stands for, since that changes the shape and not the choice. The tell that you have crossed the line is a rewritten block that a reader would now act on differently.

📖 `references/target-types.md` — what counts as a genuine fact per target class, and where the boundary runs through a file rather than around it. Read it when the target isn't an obvious SKILL.md; the fact-vs-constraint test is constant, but what it protects differs by class.

## Routing: Where Content Belongs

As constraints become reasoning and enumerations collapse into mechanisms, ask whether the resulting content belongs in an always-loaded file. Four questions run in sequence:

1. **Is it derivable?** If a reader could reconstruct it with `ls`, `grep`, reading the manifest, or running `--help`, cut it outright rather than rewriting it. Name the command before cutting; "a competent reader would know this" is not one, and it is the phrase under which a harness quirk (`git checkout HEAD --` because the harness auto-stages) or a version constraint leaves a file that was its only home.

2. **Is it safety-critical?** Prohibitions that *must* fire even if ignored by a prior session (e.g., "never edit generated files", "never push to main") are always resident, never deferred. Their cost is fixed; their value is irreplaceable.

3. **Does it need to arrive before action, or only during failure?** A rule governing a routine choice (which tool to use, what to check before an action) needs to be resident and absorbed preemptively — deferring it behind a pointer means it only fires again after someone violates it. A consultation rule, implementation detail, or symptom-indexed gotcha is different: it's read by someone already holding a failure, so moving it to a `📖` pointer or a lazy-load skill costs nothing and gains resident clarity.

4. **Is it a reference table or lookup?** A section that reads like a catalog (error strings, commands, configuration paths) should usually move behind a pointer in `references/` or become a lazy-load skill, even if you've just finished sharpening its prose.

   A file that is *already* a lookup table still has two levels to judge, and "rows stay rows" settles only the first. The second is the shape a reader meets: whether related rows sit together under a heading they can jump to, whether one kind of content wears one frame (a NEVER/ALWAYS header over rows that are symptoms trains a reader to see rules), and whether two rows share a cause and belong as one. Clustering and reframing are the pass on that file, so reporting "it should stay tabular" after three row edits is a first-level answer to a second-level question. Reframing has a cost of its own: a column the source never had is a slot every row must now fill, and where the source recorded no cause the honest cell is `—`, never a mechanism supplied from what usually causes that symptom — a measured pass filled such a column with six wrong causes in the same register as the rows it copied.

**Content delivery shape decides what's even possible.** A file delivered whole into a context — a hook payload, a runtime-assembled prompt — reaches its reader with no working directory, so a pointer resolves nowhere and relocation stops being an option. Establish how the file reaches its reader before applying these tests, because for those files the choice is keep or delete, and cutting destroys rather than moves.

⚠️ **Relocating is not delivering.** Nothing loads a reference file — no import, no frontmatter field — so a pointer is a suggestion the reading model may decline, and measured follow-through is poor. That makes extraction a trade rather than a free win: keep the sentence that tells a reader they HAVE a problem inline, and move only the procedure for fixing it. Two things raise the odds and cost nothing — name the trigger where the pointer sits ("when X, read Y because Z"), and write the path as `${CLAUDE_SKILL_DIR}/references/<file>.md`, which expands to an absolute path rather than one the reader must resolve against an unstated working directory.

⚠️ **Before cutting a rule as derivable, check where else it actually lives — "a reader could look this up" and "a reader can look this up" are different claims.** Question 1 is about derivability in principle; this is about the file's remaining copies in practice, and a rule stating an obligation the codebase cannot show you (a mirror in another repo that no CI reaches, a manual step deliberately kept out of a deploy path) usually has exactly one home. A grep across the repo's other docs and source settles it in seconds. Where the target is the sole home, the rule stays resident whatever its shape, because the cheapest correct version of it is still the only version.

The corollary binds the write order: **a destination has to exist before the content is cut from the source.** A pass that trims first and intends to write the companion afterwards ships a `📖` pointing at nothing, which reads as thorough routing until someone follows it and is worse than the inline text it replaced — grep "finds" the pointer and reports the topic covered. Write the destination, confirm the path resolves, then cut.

When something does need to leave, read `${CLAUDE_SKILL_DIR}/references/routing-content.md` — it maps each failure mode to a destination, and holds the symptom-index shape a multi-tier file should split into.

## Rewriting

List the genuine facts first, marking which are stated absolutely — that list is what verification checks against later.

Then write it. A full `Write` once more than a handful of rules are affected; targeted `Edit`s for one or two callouts. Structural findings are the ones that go unexecuted most often, because moving a section feels like a bigger claim than softening a callout — but a file whose shape is wrong stays wrong when only its wording changes.

**When moving content to a companion:**

A move means the destination file exists and holds the content when you finish. Write it first, then cut from the source — the two halves in one pass, never a deletion now against a companion "ready to split" later. If the pass ends and a companion you named doesn't exist, the content is deleted, whatever the summary claims.

⚠️ **Deleting because an existing companion "already covers this" is the same deletion with the write step skipped, and it feels safer precisely because no new file was needed.** The rule above binds when you write a destination; this is the case where you write none, so nothing in your own pass looks like a move and the reasoning arrives as tidying rather than cutting. It is a licensed move when true — but the belief that a sibling already holds a section is a memory of having seen that topic there, and topic overlap is not the same as the passage. Before cutting on that basis, grep the survivor for the section's heading and its primary named symbol; a zero means you are about to delete the only copy. Measured 2026-09-03: a pass cut 44% of a 31 KB file reporting "the companion already held the removed material", and all 17 removed headings returned zero matches in a companion the pass never opened. **Tell: your justification for a deletion is a claim about a file you have not read this pass.**

⚠️ **Resolve a new pointer as a path, never by eye.** A companion belongs at the nearest git-repo root of the file you're editing, and the depth prefix differs by where the citing file sits — `../_shared/…` from a SKILL.md is correct and the same string one directory down is not. Copy the shape from an existing pointer in the target, then `ls` the file from the citing file's own directory. This is the defect that reads as correct at both ends and has recurred repeatedly here.

⚠️ **A companion clustered by the source's own headings has rebuilt the same wall one file over** — and nothing in the result shows it, since the move completes, every pointer resolves and the resident file really is smaller. Decide the destination's clustering deliberately instead of inheriting it, before writing the destination: retrofitting means moving every body a second time. **Tell: your new companion's headings are recognisable as the source's section names.** `${CLAUDE_SKILL_DIR}/references/routing-content.md` holds the symptom-index shape and why a reader needs it; `../condense-claude-md/references/structural-splits.md` (§Location) covers the clustering method and the global-`~/.claude` path exception.

**Don't propose; execute.** There is no approval step: the file is version-controlled, a bad rewrite is one `git checkout` away from gone, and asking costs more than reverting would.

**When a dispatching prompt forbids one of this skill's core moves, say so in the report rather than letting the constraint pass as a finding about the file.** A caller who can see something you cannot — a concurrent agent mid-restructure in the directory you would extract into — has a real reason to scope the write, and following it is right. What is not right is reporting "no extraction needed", because that is a verdict about the target and the prompt supplied it. Name it as the caller's constraint, name what you would have moved, and the caller can re-dispatch once the obstacle clears; stay silent and the half that never ran is indistinguishable from a half that had nothing to do. Measured 2026-09-03 on exactly this pair. **Tell: your report claims a pass found nothing to do on an axis your prompt closed.**

## Verifying

Read the rewritten file from the top, whole — the same read as the one that opened the pass. Ask whether a reader of this file still knows what a reader of the old one knew, and whether it sits right as one document. The worst defects exist in no hunk: two sections that shouldn't coexist, a rule split across two homes hundreds of lines apart, a heading describing the file as something it isn't. Each hunk is locally fine, so a diff review is blind to all of them by construction.

**A count answers "how many survived", never "does this still work".** Identifiers, anchors, rows and bytes all survive a rewrite that reversed the claim around them, and a search for a dropped fact returns zero just as readily when the fact was merely reworded. Empty headings are the same defect in miniature — the heading is exactly what a structural pass preserves.

**Moving content invalidates pointers at both ends.** Inside the file, every "see the X section below" now aims at nothing. Outside it, a fact you pulled up leaves its citation stranded — so after inlining anything, ask which files this one no longer cites, and whether any absorbed fact had machinery behind it. A reference cited by nothing is either content to fold in and delete or a pointer to restore.

Before trusting any of the above, read `${CLAUDE_SKILL_DIR}/references/verifying.md` — it names what each check can and cannot see, what delegation changes, and the markup damage that survives every content check.

**Report both halves:** what moved, merged or got resequenced, and what stopped being an enumeration or left the hot path. A report that is all structure describes a reorganisation, and one that is all softened callouts describes a wording pass — either alone reads as complete while the other half never happened. Where a half genuinely had nothing to do, say that rather than omitting it. Every claim names an edit that landed; a strategy, a proposal or an estimated cut belongs to a pass that didn't run. Say where you made a bet rather than a strict improvement: trading a mechanical check for a judgement call is a real trade-off, since the mechanical one fires regardless of how a read feels.

Finding the file well-shaped is a legitimate outcome and the one case where the report *is* the deliverable — say so plainly, since a genuine clean verdict and an unread file produce the same report.

## Authoring Under This Lens

Authoring under this lens differs only in what verification measures against: there is no baseline to diff, so the six-question read runs as you draft and again on the finished file, judged against the file itself. A run ending in an outline has not delivered, the same as an audit ending in strategy.

## Syafiqkit Conventions

When the target is a syafiqkit file, the plugin's own authorship conventions apply on top of this pass — 📖 `syafiqkit:update-plugin`, which owns them: the ownership check before patching (never edit a consumer-side install), the shared-mechanism grep before assuming a fix is single-file, and the version bump + CHANGELOG entry. For a third-party file, none of it applies.
