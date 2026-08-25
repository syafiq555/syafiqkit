# Verification Gotchas

The agent's report is a claim about the work, not evidence of it. These gotchas are where confident claims fall apart — measure every one. Don't confirm a report by grepping for its nouns; that measures your pattern, not the rewrite.

## Measurement tools

Byte-count and term-survival checks reveal different things and neither is verification alone.

**Byte counts** appear to measure what they measure. A drop contradicts a growth claim — obviously wrong. In the opposite direction, a rewrite holding `net`, `gross` and every label while inverting the arithmetic passes: every term present, nothing dropped, claim inverted. When you dispatched a rewrite pass specifically, `../../unhobble-instructions/references/verifying.md` holds failure analysis and control forms.

**Term survival** (grepping for vocabulary) measures that words survived, never that their sentences mean the same thing. For rules stated in the file (formulas, precedence, comparison directions, guards), re-derive the specific claim against the original. A search returning zero can mean the pattern is broken, the term was reworded, or the fact is genuinely gone — the search alone cannot distinguish them. Before reporting anything absent, run the same pattern against the ORIGINAL. A search that cannot find a known-present fact is measuring itself. The only check separating pattern failure from deletion is reading the current section whole, then asking whether the specific claim is still assertable from what's there. 📖 `../../_shared/references/two-tier-condense.md` for value-shaped content (commands, error strings) that must survive verbatim. 📖 `../../_shared/references/explore-delegation.md` → "Verifying Agent Counts" for control-query forms.

## Pointers and destinations

A pointer resolving is not the same as a pointer verifying. Three patterns cause this to break:

**Destination never written.** A relative pointer resolves against the reader's cwd. Checking from repo root while the file sits a level down reports every companion missing. Either the destination was never written, or it was written where nothing resolves to (a sibling `.claude-companions/` one level up is common). Both leave the source reading as clean extraction with facts gone. Open the destination and look for the content there.

**Destination holds unrelated content.** The pass deleted a section and cited a destination holding something else, so every pointer resolves — "resolves" answers "does the link work," not "does it hold the facts." Grep the deleted passage's identifiers against the destination and expect partial hits from general vocabulary while specific mechanisms are absent.

**Stale content.** A structural skill preserves outdated facts because preservation is what it optimizes for. A gotcha moved verbatim into a companion, stale claim intact, passes structural checks. Spot-check time-sensitive claims (branch names, dates, counts, status) against the live codebase, not the original file alone.

When the dispatched skill MOVED content rather than only rewriting it, read 📖 `../../_shared/references/verifying-a-relocation.md` before reporting clean. Relocation defects are outside the rewritten file — a link whose `../` depth no longer resolves, a documented glob that still matches after it stopped covering, a destination nothing in the project cites.

## Agent reports are unreliable metrics

Reports claim work; they don't measure it. A report contradicting itself (lines cut but bytes up, anchors fixed when new ones added) has done arithmetic it never took. A report volunteering *preservation* claims ("preserved all references to X") costs nothing to write whether true.

A condense report naming where deleted bytes went is cheap to claim, since `condense-task-doc` requires the claim before reporting success — so every run produces one whether true or not. Re-run `wc -c` on whichever file the report says grew. A set whose members all shrank had no destination, whatever the report names.

Reports also under-claim. An agent that silently did more than it described is a real failure mode. One run updated three `CLAUDE.md` prose passages and reported only the link rewrites; the near-miss was re-doing work already done against a file nobody had checked. Verify before repairing what a report says is missing: diff the target against the snapshot baseline. A report's silence about a file is not evidence the file is untouched.

## Revert or patch

When damage is systemic (whole sections gone, a claimed companion never written, numbers contradicting the report), reverting before re-dispatch is cheaper. When the gap is one contained passage and the rest checks out, patch from snapshot.

The count of defects does not decide this — enumeration does. A run whose every defect you can name, locate and restore is contained, however many defects there are. A run you cannot characterise is systemic at one. Ask what would go into the re-dispatch prompt: if it's a specific list of facts to preserve, that list is the patch. Reverting discards the structural work the pass delivered, which a patch keeps. A rewrite that fixed section ordering and halved byte count has delivered something a patch preserves and a revert re-earns from a non-deterministic pass that can fail differently.

Snapshot the agent's OUTPUT before reverting, not just the pre-dispatch baseline. A revert overwrites what the agent made, and that copy exists nowhere else. It costs one `cp` command and is the difference between a reviewable call and one the user takes on trust.

A second run of the identical prompt is the cheapest control. These passes are non-deterministic, so re-dispatching unchanged produces a different rewrite. Comparing the two tells whether a finding is about this run or the metric you screened with. A metric scoring one read and judged sound worse than the other invalidates itself and its verdict.

When patching, restore the fact, not the bytes. The snapshot holds those bytes in the shape the pass existed to change. Pasting verbatim undoes the dispatch locally while reading as repair because the text is provably original. This bites hardest on rewrite passes: a `❌ NEVER / ✅ ALWAYS` table restored into a file `unhobble-instructions` just converted to prose puts back the exact shape removed. What does this passage tell a reader that nothing else does? What form does the rewritten file use? Carry the first across in the second. Facts a model cannot derive (real identifiers, exact error strings, measured numbers) have to survive somewhere; the enforcement scaffolding around them usually does not.

A snapshot preserves what the file claimed, never what is true. A "restored" fact needs checking against the system, not the baseline. A value the pass dropped because it aged is indistinguishable from careless deletion, and confirming "it came back" is diffing the artifact whose accuracy was never in question. Anything that can change — versions, counts, hostnames, expiries — gets re-measured at its source before patching. Where measurement is out of reach, state what you restored unverified. 📖 `../../read-summary/references/doc-authority.md` for the usual direction of doc-vs-reality, which reverses here.

"Systemic" is a verdict reached after the full read, never a shortcut. Symptoms (dead pointers, missing sections, byte contradictions) establish something is wrong, never that the rest is worthless. Only the full read separates a good rewrite with one bad pointer from a genuinely untrustworthy pass. Reverting is irreversible, so every fact in the case for it owes the three costs the meaning-survives check charges — the section you expected it in, the lines you read there, and why the prose you found doesn't cover it. A list you cannot pay them for is a list of searches rather than of losses. Before recommending revert, could you find the claim in the current file's actual text? Grepping for it is not the same as reading it.

## If the user has read it, verification is done

Verification exists to tell them whether to trust the result. Auditing after they've looked themselves re-answers a question they answered. If you have a real defect in hand (a dead pointer, a known-wrong fact), state it in one line and leave it with them rather than acting on it.
