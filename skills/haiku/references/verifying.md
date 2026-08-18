# Verification Gotchas

The agent's report is a claim about the work, not evidence of it. These gotchas are where confident claims fall apart — measure every one.

## Shape-measuring instruments fail silently

A byte-count drop contradicts the report's claim of growth — obviously wrong, and you look. The opposite direction is dangerous: a term-survival sweep (grepping for domain vocabulary) measures that words survived, never that their sentences mean the same thing. A rewrite keeping `net`, `gross` and every label while inverting the arithmetic passes completely — every term is present, nothing was dropped, but the fact is inverted. When the dispatch was a rewrite pass specifically (`unhobble-instructions`), `../../unhobble-instructions/references/verifying.md` covers this failure in more depth — delegation risk, rewording-vs-deletion, and the markup damage that survives every content check.

For rules stated in the file (formulas, precedence, comparison directions, guards), re-derive the specific claim against the original. Don't confirm by the presence of its nouns. 📖 `../../_shared/references/two-tier-condense.md` for value-shaped content (commands, error strings) that must survive verbatim, and for the redistribution case where detail moving to an owning sibling makes a correct pass read as mass deletion — size drops even though nothing was lost.

**A zero-hit search is a claim about your pattern before it is a claim about the file**, and it arrives already shaped like a finding — "this fact is gone" is the most alarming thing verification can produce, so it gets reported with the least scrutiny. The pattern is where it usually breaks: an alternation written `\|` under `grep -E` is a literal pipe matching nothing, a `-F` pattern containing regex metacharacters, an unquoted backtick the shell ate before grep saw it, a term the rewrite legitimately reworded. Every one returns clean and looks identical to real deletion. Before reporting anything absent, run the same pattern against the ORIGINAL — a search that can't find the fact where you know it exists is measuring itself, not the rewrite. 📖 `../../_shared/references/explore-delegation.md` → "Verifying Agent Counts" for the control-query form this generalises to. **Tell: you are about to report content missing on the strength of a search returning nothing.**

## A pointer existing doesn't prove its destination holds the content

Three ways this fails:

**The destination was never written.** A relative pointer resolves against the reader's cwd, so checking from repo root while the file sits a level down reports every companion missing. Two failure modes look identical: either the destination was never written, or it was written where nothing resolves to (a sibling `.claude-companions/` one level up is common). Both leave the source reading as clean extraction with its facts gone. Open the destination and look for the content there.

**The destination already existed.** The pass deleted a section and cited a destination holding unrelated content, so there is no new file to be missing and every pointer resolves — "every pointer resolves" answers "does the link work," not "does it hold the facts." Grep the deleted passage's identifiers against the destination and expect partial hits from general vocabulary while specific mechanisms are absent. A report claiming content already lived elsewhere is the cheapest claim to make and the one to test first.

**Stale content moved untouched.** A structural skill preserves outdated facts as well as current ones because preservation is what it optimizes for. A gotcha moved verbatim into a companion, stale claim intact, passes every structural check. Spot-check time-sensitive claims (branch names, dates, counts, status) against the live codebase, not against the original file alone. This is not full re-verification — most files aren't dated — but content that ages needs a second independent read.

**When the dispatched skill MOVED content out of a file rather than only rewriting it, read 📖 `../../_shared/references/verifying-a-relocation.md` before reporting the pass clean.** Both phases of the verification above read the rewritten file, and a relocation's defects are outside it — a link whose `../` depth no longer resolves, a documented glob that still matches after it stopped covering. Reading the file whole is the strongest check this skill has and it cannot see either.

## The agent's own numbers are frequently wrong

A report that contradicts itself (claims lines cut but bytes up, anchors fixed when new ones added) has done arithmetic it never took. Re-measure. A report volunteering a *preservation* claim ("preserved all references to X") costs nothing to write whether true — re-count what actually survived.

**Reports also under-claim, and that direction costs more to get wrong.** The framing above is about agents overstating, so a report that omits work reads as honest by comparison — but an agent that silently did *more* than it described is a real failure mode, not a safe one. One run updated three `CLAUDE.md` prose passages and reported only the link rewrites; the near-miss was re-doing work already done, against a file whose state nobody had checked. Verify before *repairing* what a report says is missing, on the same evidence you would demand for what it claims to have done: diff the target against the snapshot baseline. A report's silence about a file is not evidence the file is untouched.

## Deciding whether to revert or patch

When damage is systemic (whole sections gone, a claimed companion never written, numbers contradicting the report), the run is untrustworthy throughout and reverting before re-dispatch is cheaper than clause-by-clause audit. When the rest of the file checks out and the gap is one contained passage, patch it back from the snapshot rather than discarding a mostly-good rewrite.

**Patching back means restoring the FACT, not the bytes** — and the snapshot holds those bytes in the shape the pass existed to change. Pasting a passage verbatim out of it undoes the dispatch locally while reading as careful repair, because the text is provably the original and provably missing. This bites hardest where the skill was a rewrite pass: a `❌ NEVER / ✅ ALWAYS` table restored intact into a file `unhobble-instructions` just converted to prose puts back the exact shape the run removed, and the restoration is *more* confident than the rewrite because it can cite the source. Separate the two before writing: what does this passage tell a reader that nothing else in the file does, and what form does the rewritten file state things in? Carry the first across in the second. A fact a model cannot derive (a real identifier, an exact error string, a measured number) has to survive somewhere; the enforcement scaffolding it arrived wrapped in usually does not. **Tell: you are pasting from the snapshot into a file whose whole point was to not look like the snapshot.**

**"Systemic" is a verdict you reach after the full read, never a shortcut past it.** Every symptom (a dead pointer, missing section, byte contradiction) surfaces on its own, so this branch reads as pre-authorised the moment one turns up. Those symptoms establish that something is wrong, never that the rest is worthless. Only the full read separates a good rewrite with one bad pointer from a genuinely untrustworthy pass. Reverting is irreversible. **Tell: you can name what the agent deleted but not what it wrote.**

## If the user says they've read it, verification is done

Verification exists to tell them whether to trust the result; auditing after they've looked themselves re-answers a question they answered. If you have a real defect in hand (a dead pointer, a known-wrong fact), state it in one line and leave it with them rather than acting on it. **Tell: you are still verifying after being told the work is good.**
