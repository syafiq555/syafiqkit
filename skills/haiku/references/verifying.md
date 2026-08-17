# Verification Gotchas

The agent's report is a claim about the work, not evidence of it. These gotchas are where confident claims fall apart — measure every one.

## Shape-measuring instruments fail silently

A byte-count drop contradicts the report's claim of growth — obviously wrong, and you look. The opposite direction is dangerous: a term-survival sweep (grepping for domain vocabulary) measures that words survived, never that their sentences mean the same thing. A rewrite keeping `net`, `gross` and every label while inverting the arithmetic passes completely — every term is present, nothing was dropped, but the fact is inverted. When the dispatch was a rewrite pass specifically (`unhobble-instructions`), `../../unhobble-instructions/references/verifying.md` covers this failure in more depth — delegation risk, rewording-vs-deletion, and the markup damage that survives every content check.

For rules stated in the file (formulas, precedence, comparison directions, guards), re-derive the specific claim against the original. Don't confirm by the presence of its nouns. 📖 `../../_shared/references/two-tier-condense.md` for value-shaped content (commands, error strings) that must survive verbatim, and for the redistribution case where detail moving to an owning sibling makes a correct pass read as mass deletion — size drops even though nothing was lost.

## A pointer existing doesn't prove its destination holds the content

Three ways this fails:

**The destination was never written.** A relative pointer resolves against the reader's cwd, so checking from repo root while the file sits a level down reports every companion missing. Two failure modes look identical: either the destination was never written, or it was written where nothing resolves to (a sibling `.claude-companions/` one level up is common). Both leave the source reading as clean extraction with its facts gone. Open the destination and look for the content there.

**The destination already existed.** The pass deleted a section and cited a destination holding unrelated content, so there is no new file to be missing and every pointer resolves — "every pointer resolves" answers "does the link work," not "does it hold the facts." Grep the deleted passage's identifiers against the destination and expect partial hits from general vocabulary while specific mechanisms are absent. A report claiming content already lived elsewhere is the cheapest claim to make and the one to test first.

**Stale content moved untouched.** A structural skill preserves outdated facts as well as current ones because preservation is what it optimizes for. A gotcha moved verbatim into a companion, stale claim intact, passes every structural check. Spot-check time-sensitive claims (branch names, dates, counts, status) against the live codebase, not against the original file alone. This is not full re-verification — most files aren't dated — but content that ages needs a second independent read.

## The agent's own numbers are frequently wrong

A report that contradicts itself (claims lines cut but bytes up, anchors fixed when new ones added) has done arithmetic it never took. Re-measure. A report volunteering a *preservation* claim ("preserved all references to X") costs nothing to write whether true — re-count what actually survived.

## Deciding whether to revert or patch

When damage is systemic (whole sections gone, a claimed companion never written, numbers contradicting the report), the run is untrustworthy throughout and reverting before re-dispatch is cheaper than clause-by-clause audit. When the rest of the file checks out and the gap is one contained passage, patch it back from the snapshot rather than discarding a mostly-good rewrite.

**"Systemic" is a verdict you reach after the full read, never a shortcut past it.** Every symptom (a dead pointer, missing section, byte contradiction) surfaces on its own, so this branch reads as pre-authorised the moment one turns up. Those symptoms establish that something is wrong, never that the rest is worthless. Only the full read separates a good rewrite with one bad pointer from a genuinely untrustworthy pass. Reverting is irreversible. **Tell: you can name what the agent deleted but not what it wrote.**

## If the user says they've read it, verification is done

Verification exists to tell them whether to trust the result; auditing after they've looked themselves re-answers a question they answered. If you have a real defect in hand (a dead pointer, a known-wrong fact), state it in one line and leave it with them rather than acting on it. **Tell: you are still verifying after being told the work is good.**
