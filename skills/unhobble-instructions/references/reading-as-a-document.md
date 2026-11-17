# Reading the File as a Document — the six questions expanded

The six questions live in `SKILL.md`; this file is what each one means once you are holding it against a real file, plus the two traps that make a whole-file read go wrong while looking thorough.

## Grading an outside source before you adopt it

When the pass is motivated by an outside source — an article, a vendor's guidance, a tool's audit report — search the project's own decision records for that source before adopting anything from it. A team that has met it before will have graded it, and the grading is what stops a rejected claim returning in new words.

The failure this prevents is specific and has happened: a session worked for hours from an article whose verdict already sat in the repo, then wrote a compressed restatement into a skill that *inverted* what the verdict said.

A prior verdict also records which **lever** was rejected rather than which outcome — "we rejected cutting 80% of the rules" usually means the cut alone doesn't hold, not that a large cut is wrong.

A source the pass leans on gets the same end-to-end treatment as the target: an article summarised from memory yields a reading that is plausible, specific, and wrong in the details that decide the rewrite.

## The four shape questions

**What does this make a reader do, in order?** Where the physical order disagrees with the execution order, a reader meets rules before there's anything to apply them to and mostly won't carry them that far.

**Where does each rule sit relative to the moment it's needed?** A correct rule in the wrong place fails as reliably as a wrong one — commonly a warning stacked above the branch it governs, or a mandate in a path most invocations skip.

**What does it say more than once, and do the copies still agree?** A rule in three homes is three sessions patching the same miss without retiring the previous patch, and collapsing them beats sharpening any one. Copies drift as well as duplicate: two statements of the same fact hundreds of lines apart can contradict outright.

**What would a reader who absorbed all of it default to?** Not what any row says — what the balance trains. Twenty mechanical rows beside one judgement sentence produce a reader who reaches for the instrument every time, because the instrumental options carry concrete shape and the judgement is a line they scroll past.

## The two content questions

**Which enumerations are standing in for one principle?** Twenty rows each naming a way to have erred usually encode two or three mechanisms, and the mechanisms cover cases the list never anticipated. An enumeration is raw material, not a finding.

**What does a reader need every invocation, and what twice a year?** A rule governing a routine choice has to be resident and absorbed before it applies; a fact someone reaches for while already holding the failure (an error string, a command, an ID) can move behind a pointer. The first kind deferred is a rule that only fires after someone has violated it.

## Sampling bias

A verdict built on a sample is a claim about that sample. "Well-shaped, no edit needed" after skimming several tables says nothing about the sections never opened, and a large target is exactly where this substitution happens — a file announcing its own recent restructure reads as already done, and the question quietly drifts from *are these rules judgement dressed as mandate* (this pass) to *is this file big* (`condense-claude-md`).

A marker count locates candidates and nothing more; the densest file is often the healthiest and the one with no markers can be the badly shaped one. Only reading settles it. On a large file, open at least one table and actually attempt a conversion before concluding there are no clusters — a failed attempt is evidence, an unattempted one is a guess.

## Degrees of freedom: where the principle stops

The framing is *degrees of freedom*: match how tightly you specify something to how fragile it is. Where several approaches are valid and the right one depends on context, a rigid rule is worse than useless: it fires on the cases it was written for and misfires on every neighbour, and a reader who absorbed twenty of them reaches for an instrument instead of thinking. That is what the unhobble pass exists to undo. The same principle sends fragile, must-be-identical operations the other way: an exact command, a literal threshold or a specific sequence is *low* freedom by design, and converting it to judgement prose is the same error inverted. The test that separates them is what happens when the reader is wrong: a misjudged heuristic costs a rethink, a mangled command costs the operation.

## Shape questions versus content questions

The first four questions are about shape and the last two about content, and that split is why a pass can go wrong while looking thorough. Reordering sections, merging duplicate homes and regrouping a table all answer the shape questions completely, and a file can come out better organised with every rule it started with. That is reorganisation, not this pass.
