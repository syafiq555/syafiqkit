# Verifying a Relocation

Referenced by skills whose passes MOVE content out of a file rather than only rewriting it in place (`unhobble-instructions`, `condense-claude-md`, `condense-task-doc`, and `haiku` when it dispatches any of them). Read it once the split has landed and before reporting the pass clean.

**A relocation's correctness is a property of its pointers, not its prose.** Every check that reads the rewritten file — did bytes move, did meaning survive, do the facts still appear — is answering a question about the inside of a file whose defects are now outside it. The pass moved content; what broke is whatever used to reach that content. A file can read perfectly as one document, preserve every fact, and still have severed every route into itself.

Three shapes, all of which survive a full read of the resulting file.

## Inbound links resolve from the citing file, not from where you are reading

A link written `](../be-gotchas.md#anchor)` when both files sit in the same directory resolves one level too high and 404s. The reverse — a pointer left at sibling depth after its target moved down a level — fails identically. Neither errors at authoring time, both look correct in review, and the reader who follows one lands on nothing.

Resolve every inbound link by walking its `../` count from the **citing file's own directory**, not by eye and not from the repo root. `(cd <citing-dir> && ls <path-as-written>)` is the only check that fails when the depth is wrong. Do this for links *into* the moved content as well as the ones the pass wrote — a split changes the depth of both halves, and the ones the pass didn't touch are the ones nobody thinks to check.

## A documented glob keeps matching after it stops covering

The costlier shape, because it never returns empty. A `CLAUDE.md` documenting `grep .claude/companions/*-gotchas.md` still matches after a split produces `fe-gotchas-api-build.md`, `fe-gotchas-forms.md` and six siblings — it matched 2 of 8 files and reported nonzero, so the instruction kept looking correct while missing ~85% of the content it existed to find. The instruction was the safeguard; the split disabled it and nothing announced that.

Re-run every documented glob, path pattern or `grep` instruction the moved content is subject to, and compare the **match count** before and after — a nonzero result is not evidence of the same result. Patterns live in prose in other files, so they don't appear in the pass's diff: grep for the moved files' old and new naming stems across `CLAUDE.md`, companions and skill bodies to find which instructions were keyed to the old shape.

## A destination nothing ever pointed at

The two shapes above are routes a pass BROKE, so a before/after comparison finds them. This one is a route the pass never created — the file was written, the content is correct, and no parent ever cited it. There is no regression to detect: it reads as a finished split from inside, and the only symptom is silence.

It survives because both halves of the usual check pass. The content is present (a `grep -c` for the moved rows succeeds), and every pointer that exists resolves (nothing dangles, because nothing points). What's missing can only be found by asking the inverse question — not "does each pointer have a file" but **"does each file have a pointer"** — and that question is never prompted by anything in the diff.

Enumerate the destination directory and check each file for at least one inbound citation from outside itself, rather than walking the pointers you wrote and confirming their targets. The check is cheap:

```bash
for f in <dest-dir>/*.md; do
  n=$(grep -rl "$(basename "$f")" . --include="*.md" | grep -v "^$f$" | wc -l)
  [ "$n" -eq 0 ] && echo "ORPHAN: $f"
done
```

Run it across the whole destination directory, not just the files this pass wrote. An orphan is usually **an earlier split that half-landed** — someone extracted the content and never wired the pointer, and it has been invisible ever since precisely because an unreferenced file is also an unread one. Finding a stranger's orphan beside your own new files is the common case, and adopting it into the index you're building is nearly free at that moment and expensive to notice later.

This is distinct from a corrupted pattern matching a substring (`{{#anchor}}` satisfying a search for `{#anchor}`), which `../../unhobble-instructions/references/verifying.md` covers under "Corrupted delimiters hide in substring matches." Here the pattern is intact and still correct as written — the filenames moved out from under it. It is also distinct from that file's "Deletion disguised as routing", where a pointer resolves to a destination that doesn't hold the claimed facts: there the link works and the content is missing; here the content is present and the route to it is gone.

## A destination that resolves but ignores where the project keeps companions

Every check above asks whether the route works. A pass can satisfy all of them and still put the file in the wrong place: the agent writes the companion as a sibling of the file it split (`app/CLAUDE-marketplace.md`) while the project's other six companions live together in a dedicated directory, and the pointer it writes resolves correctly, so nothing fails. The defect is invisible to route-checking by construction — it *is* a working route — and it surfaces later as a companion nobody finds because it isn't where companions are, or as a near-duplicate of one that already existed under a similar name.

**Check:** before accepting a relocation, list the project's existing companions and confirm the new file joined them — same directory, same filename convention. `ls` the directory the incumbent pointers name, rather than reading only the pointer the pass wrote. Where a near-name already exists there, diff the two for overlap before keeping both, and make the new file's header say which sibling covers what so the next reader can tell them apart. Measured 2026-09-03: an `unhobble-instructions` pass on `app/CLAUDE.md` wrote `app/CLAUDE-app-marketplace-sync.md` as a sibling while that same file cited four companions in `.claude-companions/shared/`, one of them already called `CLAUDE-marketplace-sync.md`. **Tell: you verified a companion by following the pointer the pass wrote, and never looked at where the file's other companions live.**

## A live pointer dropped from a file that was rewritten, to a destination that wasn't

The three shapes above all involve content that moved. This one doesn't — a rewrite condenses or restructures the *citing* file, and one of its outbound pointers to an untouched sibling simply isn't in the output, with nothing in the diff calling it a deletion because the destination file itself is unchanged and still correct. A CLAUDE.md carrying four `📖 companion.md` pointers went through an unhobble pass that consolidated the surrounding prose and came out with one — the other three companions were never opened, never edited, and still held real, undiminished content, but nothing in the rewritten file reached them anymore. The pass's own report can say "no content deleted" truthfully by its own accounting (it never touched those bytes) while still stranding them.

The identifier-sweep and anchor checks upstream in this pass's own verification don't catch it: an anchor embedded inline in prose (`{#foo}`) is exactly what gets folded away when prose is compressed into a merged paragraph, so a dropped pointer usually travels together with a dropped anchor and neither raises the alarm on its own — the anchor check reports "gone" for a reason that reads as acceptable (the rule moved into unnamed prose) and misses that a citation went with it.

**Check:** enumerate every `📖`/relative-link pointer in the file BEFORE the rewrite, and confirm each one — or a clear successor — is still reachable from the file AFTER. Don't check the reverse (does every current pointer resolve); check that the *count and set* of distinct destinations survived, the same way the section above checks a destination directory for orphans rather than trusting the pointers actually written.
