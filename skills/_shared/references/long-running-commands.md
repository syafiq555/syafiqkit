# Long-Running Commands — Before You Launch One Again

Applies to any command measured in minutes that MUTATES shared state: a test suite, a migration, a seeder, a build writing to one output dir, a deploy. Read-only probes are exempt — two `grep`s racing costs nothing.

## The rule

⚠️ **Before launching a long-running mutating command, confirm an identical one is not already in flight — `pgrep -f '<command>'`.** Two runs sharing one database or output dir corrupt each other, and the damage does not announce itself: a test suite whose tables another run is truncating fails on *arbitrary* tests, so the corruption presents as a plausible code defect in whatever happened to be mid-flight. You then debug a bug that does not exist.

⚠️ **The guard has to be its own call — chained ahead of the run (`pgrep …; <run>`), it reports on the moment before anything was launched and passes by construction.** A clean guard then sits directly above output from a run that raced anyway, which reads as proof the two are unrelated and sends you looking for a code defect in whatever failed. Same shape as the remote-predicate trap below: the check is worded correctly and cannot observe what it was written to catch. Run it, read it, then launch — and where a suite has already failed once for no reason you can reproduce, re-run it alone before believing any of its output. **Tell: your guard and the command it guards are separated by a `;` or `&&`.**

⚠️ **An empty background-output file means STILL BUFFERING, not failed.** A command piping through `tail`, `head`, or any non-line-buffered stage writes nothing until it exits, so "no output yet" and "never started" are indistinguishable from the file alone. Decide it with `ps`/`pgrep`, never by reading the file's size. **Tell: you are about to re-launch something because its output file looked empty.**

## Waiting correctly

Don't poll a long command with repeated `pgrep` calls. Block on it once:

```bash
while kill -0 <PID> 2>/dev/null; do sleep 5; done; cat <output-file>
```

A `0.0%` CPU reading is not proof of a hang — it can be a lock wait that clears. Check twice, seconds apart, before calling anything stuck.

⚠️ **Both forms above assume the job runs where you do.** Run the check on another host — `ssh host "pgrep -f 'next build'"`, or any wrapper around it — and the pattern travels inside the remote shell's own command line, so the predicate matches its own carrier process and can never return false. A `while ! ...; do` wait-loop then spins its full timeout no matter what the job is doing, and reports whatever the timeout implies. Bracketing the first character (`'[n]ext build'`) doesn't rescue it, since that literal is in the same command line; a PID is no help either, because each connection is a separate session. Poll an artifact the job itself produces instead — a build id, an output file's mtime, a sentinel line appended to its log. **Tell: your remote predicate contains the very string you typed into the ssh command.**

## Killing one

`pkill -f` matches broadly and its exit is not proof the process is gone. Confirm with a follow-up `pgrep -fl`, and remember a killed run can hold its DB connection briefly — the next run may still see contention.

## Reading the result

⚠️ **A duration is meaningless without the pass/fail count beside it.** A suite that errors during setup finishes fast and looks like a speedup; the same output shape means "14× faster" and "nothing ran". Never report or act on a timing number alone.
