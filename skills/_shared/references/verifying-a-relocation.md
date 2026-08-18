# Verifying a Relocation

Referenced by skills whose passes MOVE content out of a file rather than only rewriting it in place (`unhobble-instructions`, `condense-claude-md`, `condense-task-doc`, and `haiku` when it dispatches any of them). Read it once the split has landed and before reporting the pass clean.

**A relocation's correctness is a property of its pointers, not its prose.** Every check that reads the rewritten file — did bytes move, did meaning survive, do the facts still appear — is answering a question about the inside of a file whose defects are now outside it. The pass moved content; what broke is whatever used to reach that content. A file can read perfectly as one document, preserve every fact, and still have severed every route into itself.

Two shapes, both of which survive a full read of the resulting file.

## Inbound links resolve from the citing file, not from where you are reading

A link written `](../be-gotchas.md#anchor)` when both files sit in the same directory resolves one level too high and 404s. The reverse — a pointer left at sibling depth after its target moved down a level — fails identically. Neither errors at authoring time, both look correct in review, and the reader who follows one lands on nothing.

Resolve every inbound link by walking its `../` count from the **citing file's own directory**, not by eye and not from the repo root. `(cd <citing-dir> && ls <path-as-written>)` is the only check that fails when the depth is wrong. Do this for links *into* the moved content as well as the ones the pass wrote — a split changes the depth of both halves, and the ones the pass didn't touch are the ones nobody thinks to check.

## A documented glob keeps matching after it stops covering

The costlier shape, because it never returns empty. A `CLAUDE.md` documenting `grep .claude/companions/*-gotchas.md` still matches after a split produces `fe-gotchas-api-build.md`, `fe-gotchas-forms.md` and six siblings — it matched 2 of 8 files and reported nonzero, so the instruction kept looking correct while missing ~85% of the content it existed to find. The instruction was the safeguard; the split disabled it and nothing announced that.

Re-run every documented glob, path pattern or `grep` instruction the moved content is subject to, and compare the **match count** before and after — a nonzero result is not evidence of the same result. Patterns live in prose in other files, so they don't appear in the pass's diff: grep for the moved files' old and new naming stems across `CLAUDE.md`, companions and skill bodies to find which instructions were keyed to the old shape.

This is distinct from a corrupted pattern matching a substring (`{{#anchor}}` satisfying a search for `{#anchor}`), which `../../unhobble-instructions/references/verifying.md` covers under "Corrupted delimiters hide in substring matches." Here the pattern is intact and still correct as written — the filenames moved out from under it. It is also distinct from that file's "Deletion disguised as routing", where a pointer resolves to a destination that doesn't hold the claimed facts: there the link works and the content is missing; here the content is present and the route to it is gone.
