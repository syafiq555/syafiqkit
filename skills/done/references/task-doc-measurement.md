# Task Doc Measurement and Condense Logic

After invoking `task-summary`, measure the doc set before leaving the step.

## Three Core Rules

1. **Measure the SET, never the index alone.** Use `find` not a `decisions/*.md` glob — an unsplit doc has no such dir, and under zsh an unmatched glob aborts before `cat` runs. Once a doc splits, `decisions/*.md` routinely outweighs the index several times; an index reading ~110 lines can front a set three times its budget.

2. **Over budget has two outcomes only.** Run `condense-task-doc` in the same turn, or state in the Output that it was skipped and why. Reporting the overage alone is not an outcome.

3. **Expect the pull to defer, and recognize it rather than trusting it.** An overage predating this session reads as pre-existing; a condense rewrites earlier work — both feel like reasons to defer to the user. Neither is a reason to skip the run: `condense-task-doc`'s guard reads the working tree, so committed history is a baseline rather than a collision, and its own accounting step now has to say where the bytes went before it can report success. That rules out the silent shape — a set shrinking with no file grown to receive the content — rather than guaranteeing nothing was lost. So dispatch it — then re-derive the one number rather than reading it. Where the report names a file that grew to receive what left, `wc -c` that file yourself; a set whose members all shrank had no destination, and that claim costs nothing to write whether or not it happened.

## Taking the measurement

Measure **per file, then total** — one merged number cannot answer the question you are actually asking. A correct split drops the index hard while its `decisions/*.md` siblings grow to receive what left, so what separates that from deletion is *which file grew*, and a single fused total shows neither side of it. Take a per-file listing of the whole set with its total, before and after, so the two readings can be compared line by line.

Count lines and bytes together, because they disagree in a way that is itself the signal: a MADR restructure grows lines while shrinking bytes, so lines alone would report it as growth. Lines are what `condense-task-doc` budgets against; bytes are what tells you whether prose was actually removed.

Cover the set the way the directory is actually shaped. A doc that was never split has no `decisions/` directory, and a glob written to assume one expands to nothing under most shells and aborts the command under `zsh` — either way the reading that comes back is about a directory layout rather than about the docs. Walk the doc directory for markdown files instead of guessing its structure, and satisfy yourself the count found roughly the number of files you know are there.

The threshold and the cut/keep rules live in `condense-task-doc`; read them there rather than carrying a number in this file, where it would drift.
