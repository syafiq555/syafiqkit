# Verification Gotchas

The agent's report is a claim about the work, not evidence of it. These gotchas are where confident claims fall apart. The verdict on a rewrite comes from reading it against the original section by section (`../SKILL.md` → "Does meaning survive?"); what follows is the set of failures that survive a careless read, plus the narrow places a search is the right instrument.

## Measurement tools

**Byte counts** are a screen for the crude failures and nothing more. A drop contradicting a growth claim is obviously wrong; the reverse direction passes silently, since a rewrite holding `net`, `gross` and every label while inverting the arithmetic loses no bytes at all. When you dispatched a rewrite pass specifically, `../../unhobble-instructions/references/verifying.md` holds failure analysis and control forms.

**There is no keyword form of the verification question**, which is why the token-diff step was removed from the skill rather than qualified. Whether a rewrite kept a file's meaning is settled by reading the original's sections against the rewrite's and naming what each one lost — a search over vocabulary returns a number whose size is set by tokenisation rather than by damage, and every recorded attempt to interpret that number has produced a wrong verdict. 📖 `../../_shared/references/two-tier-condense.md` for value-shaped content (commands, error strings) that must survive verbatim, where an exact-match check before dispatch is the right instrument.

**A column or slot the rewrite added is read cell by cell, separately from the walk for loss.** The SKILL.md's "rewrite is also a research report" check names paths, status words and examples, and a reframed table carries none of those — it carries a *What Happens* or *Cause* column the original never had, which the agent had to fill for every row. Filling from priors produces mechanisms that are wrong in ways only a test exposes (a zsh glob described as silent when it aborts loudly, `git show HEAD:` called the staging area, a positive-control tell inverted), and they sit in the same register as the rows copied faithfully beside them. So when the after-file has a column the before-file lacks, read that column on its own and ask of each cell where it came from; a cell the source can't account for is `—` or a correction, and a row-walking reviewer with the original open will find the ones a grep for dropped rows cannot.

## Pointers and destinations

A pointer resolving is not the same as a pointer verifying. Four patterns cause this to break:

**Destination never written.** A relative pointer resolves against the reader's cwd. Checking from repo root while the file sits a level down reports every companion missing. Either the destination was never written, or it was written where nothing resolves to (a sibling `.claude-companions/` one level up is common). Both leave the source reading as clean extraction with facts gone. Open the destination and look for the content there.

**Destination holds unrelated content.** The pass deleted a section and cited a destination holding something else, so every pointer resolves — "resolves" answers "does the link work," not "does it hold the facts." Grep the deleted passage's identifiers against the destination and expect partial hits from general vocabulary while specific mechanisms are absent.

**Destination was never written because the pass says it already held the content.** The other three patterns all assume the pass *wrote* somewhere, so every check above starts by opening a destination the report names as new — and this shape produces none. The report instead justifies a deletion as removing duplication: the companion "already has the full content", this was "redundant with" an existing section, the pass "only deleted the duplication". That is a real and licensed move (`condense-task-doc` calls it cross-file dedup), which is exactly why it passes review — a destination with a clean `git status` reads as *untouched because nothing needed moving*, indistinguishable from *untouched because nothing was moved*. Measured 2026-09-03: an `unhobble-instructions` pass cut a 31KB file by 44%, reporting "the companion file already held the removed material; this pass only deleted the duplication" — the companion was byte-identical to its pre-dispatch snapshot and all 17 deleted headings returned **zero** matches in it. The check is the survivor, not the diff: take each deleted section's heading or primary symbol and grep the named survivor for it, one lookup per unit. A single zero settles it, and a wall of zeros means the justification was invented rather than merely optimistic. **Tell: the report explains a deletion by saying another file already covers it, and you have not grepped that file.**

**Stale content.** A structural skill preserves outdated facts because preservation is what it optimizes for. A gotcha moved verbatim into a companion, stale claim intact, passes structural checks. Spot-check time-sensitive claims (branch names, dates, counts, status) against the live codebase, not the original file alone.

When the dispatched skill MOVED content rather than only rewriting it, read 📖 `../../_shared/references/verifying-a-relocation.md` before reporting clean. Relocation defects are outside the rewritten file — a link whose `../` depth no longer resolves, a documented glob that still matches after it stopped covering, a destination nothing in the project cites.

## Agent reports are unreliable metrics

Reports claim work; they don't measure it. A report contradicting itself (lines cut but bytes up, anchors fixed when new ones added) has done arithmetic it never took. A report volunteering *preservation* claims ("preserved all references to X") costs nothing to write whether true.

A condense report naming where deleted bytes went is cheap to claim, since `condense-task-doc` requires the claim before reporting success — so every run produces one whether true or not. Re-run `wc -c` on whichever file the report says grew. A set whose members all shrank had no destination, whatever the report names.

Reports also under-claim. An agent that silently did more than it described is a real failure mode. One run updated three `CLAUDE.md` prose passages and reported only the link rewrites; the near-miss was re-doing work already done against a file nobody had checked. Verify before repairing what a report says is missing: diff the target against the snapshot baseline. A report's silence about a file is not evidence the file is untouched.

## Revert or patch

Enumeration decides this, and it is the first question rather than a qualifier on a symptom. A run whose every defect you can name, locate and restore is contained, however many defects there are; a run you cannot characterise is systemic at one. Write the re-dispatch prompt and read it back — if it is a specific list of facts to preserve, that list is the patch. Reverting discards the structural work the pass delivered, which a patch keeps: a rewrite that fixed section ordering and halved byte count has delivered something a patch preserves and a revert re-earns from a non-deterministic pass that can fail differently.

Symptoms — whole sections gone, a claimed companion never written, numbers contradicting the report — establish that something is wrong and never that the rest is worthless. Reaching one before the enumeration test is how a contained run gets reverted: the symptom reads as authorisation and the test that would overrule it is applied to a case already decided.

A sectioned read hands you the enumeration directly — headings and claims, which is the unit a re-dispatch prompt names. Reverting is for a rewrite you cannot characterise at all, and that is rarer than it feels while holding a list of real losses.

Snapshot the agent's OUTPUT before reverting, not just the pre-dispatch baseline. A revert overwrites what the agent made, and that copy exists nowhere else. It costs one `cp` command and is the difference between a reviewable call and one the user takes on trust.

A second run of the identical prompt is the cheapest control. These passes are non-deterministic, so re-dispatching unchanged produces a different rewrite. Comparing the two tells whether a finding is about this run or the metric you screened with. A metric scoring one read and judged sound worse than the other invalidates itself and its verdict.

When patching, restore the fact, not the bytes. The snapshot holds those bytes in the shape the pass existed to change. Pasting verbatim undoes the dispatch locally while reading as repair because the text is provably original. This bites hardest on rewrite passes: a `❌ NEVER / ✅ ALWAYS` table restored into a file `unhobble-instructions` just converted to prose puts back the exact shape removed. What does this passage tell a reader that nothing else does? What form does the rewritten file use? Carry the first across in the second. Facts a model cannot derive (real identifiers, exact error strings, measured numbers) have to survive somewhere; the enforcement scaffolding around them usually does not.

A snapshot preserves what the file claimed, never what is true. A "restored" fact needs checking against the system, not the baseline. A value the pass dropped because it aged is indistinguishable from careless deletion, and confirming "it came back" is diffing the artifact whose accuracy was never in question. Anything that can change — versions, counts, hostnames, expiries — gets re-measured at its source before patching. Where measurement is out of reach, state what you restored unverified. 📖 `../../read-summary/references/doc-authority.md` for the usual direction of doc-vs-reality, which reverses here.

"Systemic" is a verdict reached after the full read, never a shortcut. Symptoms (dead pointers, missing sections, byte contradictions) establish something is wrong, never that the rest is worthless. Only the full read separates a good rewrite with one bad pointer from a genuinely untrustworthy pass. Reverting is irreversible, so every fact in the case for it owes the three costs the meaning-survives check charges — the section you expected it in, the lines you read there, and why the prose you found doesn't cover it. A list you cannot pay them for is a list of searches rather than of losses. Before recommending revert, could you find the claim in the current file's actual text? Grepping for it is not the same as reading it.

## If the user has read it, verification is done

Verification exists to tell them whether to trust the result. Auditing after they've looked themselves re-answers a question they answered. If you have a real defect in hand (a dead pointer, a known-wrong fact), state it in one line and leave it with them rather than acting on it.
