# Hardening a Playwright suite: measured incidents and mechanics

Detail behind the hardening sections of `../SKILL.md`. The rules stay in SKILL.md; this file holds the reasoning, the incidents they came from and the literal numbers.

## Viewport coverage {#viewport-coverage}

A single desktop project has no coverage of any layout that changes below a breakpoint: a tab strip replacing a two-column grid, a card list replacing a table, a drawer replacing a sidebar. The suite goes green because it never renders that branch. A mobile-only break ships looking tested, and nothing announces the gap: nothing fails, and the spec names give no hint that they only ever ran wide.

Pixel 7's 839px height is taller than most phones, so a descriptor-only mobile project passes at a height that a shorter phone clips. Hence the explicit 375×667 and 320×568 `page.setViewportSize` specs.

Most specs assert data, not layout, so re-running the whole suite at a second viewport doubles the run and re-checks data that does not change with width.

## Cross-file race: reproducing it {#race-repro}

`--repeat-each` does not give the failure rate on a `describe.serial` file: the first failure aborts the block's remaining repeats, so the run reports "N did not run" and yields no rate. Loop whole runs instead and count.

Write the JSON to a file rather than piping it. With a second reporter configured, the streams interleave and `jq` dies on the non-JSON lines, which reads as "no failures found" when it means the parse failed.

Two specs on different `parallelIndex` slots hold different fixtures and never touched the same rows, however alike their failures look. Compare `parallelIndex` and start times rather than inferring a collision.

## Why partition, not lock {#partition-not-lock}

A killed worker leaves a stale lock that wedges every later run. If the lock's acquire timeout exceeds the hook timeout, the hook dies first and reports a bare `"beforeAll" hook timeout` while the lock's own diagnostic never prints.

## parallelIndex versus workerIndex {#parallel-index}

`workerIndex` keeps incrementing as Playwright spawns replacement workers after a failure, so a modulo on it maps two concurrent workers onto one fixture. Measured at `--workers=10`, raw indexes 4 and 10 resolved to the same account. `parallelIndex` is the slot number: bounded by the live worker count, and reused only after its holder exits.

## Throttle mechanics {#throttle}

Laravel's `throttle:<name>` (Fortify adds it when `fortify.limiters.login` is set, as Jetstream and the starter kits do) counts every request to the route, not only failures. Each form-login spec spends attempts on its account on every run, and rapid reruns hit the limit within the limiter's per-minute budget. It looks like a flake that worsens the more you iterate, and the 429 often surfaces only as an error modal over the login page.

Clear the key exactly as the limiter builds it: Laravel's named limiters store `md5(name . key)`, while the app's own limiter stores the raw key. Prove the fix by looping rapid runs until the baseline fails twice, then confirming zero after.

## Reading the app's persisted state {#persisted-state}

Two things reliably differ from expectation. The token often sits at a different level of the response than the user object, and permission/role values may not be in the login payload at all, needing a separate read. A missing key usually renders a blank page with no error.

## Cost of re-running setup {#no-deps}

Measured: one spec file took 70 s with the dependency and 7 s with `--no-deps`, the entire difference being logins re-establishing sessions that were already valid. Nothing looks wrong, since the run passes, just slowly. It gets absorbed as "E2E is slow" and silently taxes every verification loop in a session, which is what makes a session stop verifying.

## Save proof {#save-proof}

A form can serialise a field away while the server answers 200: an empty object arriving as `[]`, or a field the payload builder drops. The success toast fires on a write that stored nothing.

## Vacuous probes {#vacuity}

A `sed` misfire or a cached view both produce a green run while the mutation never landed. When a probe still passes after its fixture is inverted, re-grep and check the count moved, or diff the file, before concluding the spec is vacuous.

## Worker-count signature {#worker-count-signature}

A suite was blamed in turn on the PHP pool size, the socket queue and a static-file rule. The request count named the real mechanism: about 950 modules a page from a dev server the local tooling had restarted mid-run, against about 35 from the built bundle.

What a count usually shows, largest first: a dev server (Vite and the like) answering instead of the build, which some local hosts start by themselves; static files routed through the app runtime rather than served from disk; console-log or analytics beacons the specs never assert on.

## Hot-file immunity {#hot-file-immunity}

In a Laravel app on Vite, the testing environment points `Vite::useHotFile()` at a path that never exists, and a middleware active only in local does the same when Playwright sends a marker header (`use.extraHTTPHeaders`). The suite's guard then checks that the build manifest exists, not that the hot file is absent. The per-request switch held through every later run.

## Seeder mechanics {#seeder-mechanics}

Re-running never touches an existing row, including the columns specs mutate that a killed worker left un-restored. Scope the match key to the parent FK too, so a stale child under a deleted parent cannot shadow the real one.

Seed the untidy shapes real data holds, not only the tidy ones: an empty JSON column, a legacy row missing a foreign key a newer table now carries, a record with no optional children. Tidy fixtures are why a form passes every spec and fails on the first old record a user opens.

## Zero-tolerance proof {#zero-tolerance-proof}

In the reported case three repeat runs then matched across 15 images, and a 1-pixel edit and a 1/255 colour change were still caught.
