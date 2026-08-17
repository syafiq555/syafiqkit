---
name: setup-playwright
description: Set up or harden a Playwright E2E suite in any project — first-time scaffolding (config, auth storageState, first spec) or fixing an existing suite that is flaky, races between spec files, depends on hand-made local DB rows, or has no CI story. Use when the user says "set up playwright", "add e2e tests", "set up e2e", "set up browser tests", "scaffold browser tests", "we need integration tests for the frontend", "our e2e tests are flaky", "the test suite is flaky", "specs pass alone but fail together", "e2e breaks after a db reset", "tests only pass on my machine", "make the e2e suite parallel-safe", or names Playwright while describing a suite that isn't trustworthy. Covers per-worker fixture partitioning, login-throttle-safe auth, the seeder that makes a suite survive `migrate:fresh`, adding a mobile/small-viewport project to a suite that only ever runs desktop ("the e2e never tests mobile", "add a mobile viewport project", "our tests only run at desktop width"), and recording the suite as video ("record the e2e run", "video of the tests", "watch the flows") so the flows can be reviewed by eye. NOT for writing one more spec in a suite that already works (just write it), NOT for backend/unit test setup, and NOT for diagnosing a CI runner that can't reach a server (that's ci-ssh-deploy-timeout).
---

# Set Up / Harden a Playwright E2E Suite

Two entry points, same file. **Scaffolding** a suite that doesn't exist yet, or **hardening** one that exists and isn't trusted. Read the section you need.

The hardening half matters more. A suite that passes locally and nowhere else is the common state, and the causes are almost always one of four: workers sharing rows, fixture data nobody seeds, auth that trips a rate limit, or the browser/environment itself differing from wherever it's failing.

## Establish first

Before either path, these facts decide most of what follows:

| Question | How to settle it | Why it forks the work |
|---|---|---|
| Is a dev server already running? | Check the project's own docs/CLAUDE.md for a local URL before adding a `webServer` block | Herd/Valet/Docker setups already serve the app; adding `webServer` there makes Playwright fight the running one |
| What creates test data? | Look for a seeder/factory layer; ask if there's none | Decides whether fixtures come from a seeder or from hardcoded rows you'll have to replace later |
| Is the login endpoint throttled? | Grep the route's middleware for a throttle/rate-limit | Decides whether auth can drive the UI form at all — see Auth below |
| Does the failure reproduce with no data race, no missing fixture, and no throttle? | Rule out the other three first | Points at environment/browser drift — see below |

Read the app's own conventions rather than assuming a stack. A test suite that ignores them produces specs nobody maintains.

## Scaffolding a new suite

`npm i -D @playwright/test && npx playwright install chromium`. Then a config with a `setup` project (auth) that the main project depends on, `baseURL` pointing at the running dev server, and `ignoreHTTPSErrors` if that server uses a self-signed cert.

Set these explicitly even where they match Playwright's defaults, because they're the ones you'll want to tune and they're invisible until you do: `timeout` (30s), `expect.timeout` (5s), `forbidOnly: !!process.env.CI`, `retries` (0 local / 2 CI), `workers`, and a CI-aware `reporter`.

Keep local `retries` at 0. A retry re-runs a whole `describe.serial` block from the start, so it converts exactly the fixture races this skill exists to remove into intermittent passes.

Write the first spec against a flow the user actually cares about, and follow the assertion rules below from the start — they're much cheaper to adopt now than to retrofit.

## Hardening an existing suite

### One browser project covers one viewport

A suite with a single desktop project silently has no coverage of any layout that changes below a breakpoint — a tab strip that replaces a two-column grid, a card list that replaces a table, a drawer that replaces a sidebar. The suite goes green because it never renders that branch, so a mobile-only break ships looking tested, and the gap doesn't announce itself: nothing fails, and the spec names give no hint that they only ever ran wide.

Add a second project with a device descriptor when the app has responsive layout swaps, and tag the specs that assert them rather than re-running everything at a second viewport — most specs assert data, not layout, and doubling the suite to re-check them buys nothing.

The half that's easy to miss is that **the tag needs both a `grep` and a `grepInvert`**. Restricting the mobile project alone leaves the desktop project still matching those files, so it runs them at desktop width where the mobile-only markup doesn't exist and they fail correctly for the wrong reason — a red suite that looks like the new specs are broken:

```ts
{ name: 'chromium', use: { ...devices['Desktop Chrome'] }, grepInvert: /@mobile/, dependencies: ['setup'] },
{ name: 'mobile',   use: { ...devices['Pixel 7'] },        grep:       /@mobile/, dependencies: ['setup'] },
```

Verify by running each project separately and checking the counts differ — a tag typo yields a mobile project that silently matches nothing, which reports as a pass.

### The cross-file race

The signature: two spec files that each pass alone fail together, on assertions unrelated to what either one mutates.

`test.describe.serial` orders tests only *within* one file. Under `fullyParallel`, two files touching the same rows land on different workers and interleave, and no Playwright construct serialises them — the database is external to the runner and workers are separate processes.

Reproduce it before fixing it, or you can't tell the fix worked — and the number to establish is the failure RATE, not one captured instance. A single failure supports a plausible story every time, and that story survives the fix because the next run was going to pass anyway; take a baseline over enough runs that the failure appears more than once, then require the fix to move that same number.

`--repeat-each` does not give you that number on a `describe.serial` file: the first failure aborts the block's remaining repeats, so the run reports "N did not run" and yields no rate at all. Loop whole runs instead and count. Confirm the two files actually collide with `--reporter=json` — compare `parallelIndex` (per the rule below, not `workerIndex`) and start times rather than inferring it, since two specs on *different* slots hold different fixtures and never touched the same rows however alike their failures look.

Write the JSON to a file rather than piping it: with a second reporter configured, the streams interleave and `jq` dies on the non-JSON lines, which reads as "no failures found" when it means the parse failed.

Establish the mechanism, not just the correlation. Every fact an audit hands you can be individually true while the causal claim built on them is invented — a report citing real files and lines argued two specs share a worker and mutate one fixture, which Playwright never does; the JSON above disproved it in one run. Before acting on any "X fails because Y", run the one command that would come out differently if Y were false.

**Fix by partitioning, not locking.** Give each worker its own data — its own account/tenant/org and everything hanging off it — so no two can collide. A lockfile mutex is the tempting alternative and it does work, but it becomes a global bottleneck, and it fails in ways that read as unrelated bugs: a killed worker leaves a stale lock that wedges every later run, and if the lock's acquire timeout exceeds the hook timeout, the hook dies first and reports a bare `"beforeAll" hook timeout` while the lock's own diagnostic never prints.

Partition on `workerInfo.parallelIndex`, **not** `workerIndex`. `workerIndex` keeps incrementing as Playwright spawns replacement workers after a failure, so a modulo on it maps two *concurrent* workers onto one fixture — measured at `--workers=10`, raw indexes 4 and 10 resolved to the same account. `parallelIndex` is the slot number: bounded by the live worker count, reused only after its holder exits.

Then cap `workers` at the number of fixture sets you seeded, and assert it — a machine with more cores silently re-creates the race otherwise:

```ts
if (workerInfo.parallelIndex >= FIXTURE_COUNT) {
  throw new Error(`${workerInfo.parallelIndex + 1}+ workers but only ${FIXTURE_COUNT} fixture sets — workers would share rows.`)
}
```

### Fixture data nobody seeds

Specs that hardcode local row ids work on one machine until someone resets the database, then fail as confusing assertion errors far from the cause.

Write a seeder that builds N self-contained fixture sets, one per worker, idempotent so a re-run repairs a partial wipe. Guard it to local/dev/test environments — it writes known-password accounts and would be destructive against real data. Verify that guard with an actual negative control (run it with the env var flipped and confirm it refuses); an unproven guard on a destructive script is worth little.

**`firstOrCreate`-style helpers apply their defaults only on insert.** Re-running never touches an existing row — including the exact columns specs mutate and a killed worker leaves un-restored. Re-assert those fields explicitly after the create, or the seeder's "just re-run it" recovery silently does nothing. Scope the match key to the parent FK too, so a stale child under a deleted parent can't shadow the real one.

Prove idempotence by running it twice and diffing row counts, and prove self-healing by sabotaging a field, re-running, and reading the field back.

Pair it with a precondition check that fails naming the missing rows and the exact seeder command. That converts a database reset from a debugging session into one line of output.

### Auth, and the throttle that breaks it

Driving the login **form** once per identity is the obvious approach and it stops working as soon as the suite needs more than a handful, because login routes are commonly rate-limited per IP. The failure is badly disguised: the SPA swallows the 429 and the spec hangs on a login page that never navigates, so it reads as a broken selector.

Grep the login route's middleware for a throttle before choosing. If there is one, authenticate through the API — one request per identity — and write `storageState` by hand, then reuse a still-fresh state file instead of re-authenticating every run.

Building that state by hand means reading what the app actually persists rather than assuming: log in once through the UI, dump `storageState`, and mirror those keys. Two things reliably differ from expectation — the token often sits at a different level of the response than the user object, and permission/role values may not be in the login payload at all, needing a separate read. A missing key usually renders a blank page with no error.

Cap the setup project's parallelism (`fullyParallel: false` on that project — `workers` is not a per-project option) so a cold start doesn't burst.

### Environment and browser drift

The signature: "works on my machine," with no data race, no missing fixture, and no throttle — the three checks above all come back clean.

Confirm the installed browser binary matches what's failing elsewhere: `npx playwright install --with-deps` pins the exact Chromium/WebKit/Firefox build the test was written against, so a machine that ran `playwright install` at a different time can silently diverge from CI or a teammate's machine. Also check timezone/locale (date and currency assertions), and installed system fonts (layout-sensitive screenshot/pixel assertions) — both differ by machine and neither shows up as a Playwright error, just a wrong value or a failed visual diff.

### Recording the run as video

Worth wiring even when nothing is failing. A recorded pass is the cheapest way to *see* the product — a reviewer watches the flows and catches spacing, truncation, clipped modals and copy problems that no assertion encodes, because a spec asserts what someone thought to assert. Offer it once a suite covers real user journeys; the flows are already written, so the marginal cost is a flag.

Video is a **context-creation** option, which is the whole difficulty. `use.video` reaches only the contexts the runner builds for its own `page` fixture, and files them under the per-test output dir. Specs that build contexts by hand — any multi-party flow holding two sessions open at once — need the context-level `recordVideo` option instead. Set one and half the suite silently records nothing while the config reads as done; set both and the halves land in two directories, so gather them afterwards or the missing half reads as "that spec didn't record."

Two things make the difference between a useful recording and a confusing one:

- **Encoding stops the moment a context closes**, and a spec ends on its last assertion — so a fast test records its loading state and nothing else. Hold each context open briefly before closing, behind the same flag that turns recording on, so a normal run pays nothing. Without this the run is green while the video looks broken, and the disagreement reads as a product defect rather than a capture artifact. When a capture contradicts a passing assertion, believe the assertion and suspect the capture.
- **Name the file after the test.** A hand-built context's video lands under a content hash the runner reports nowhere, so the obvious fallback is numbering by creation time — which makes every video anonymous exactly when someone is trying to review twenty of them. The mapping is recoverable, but only from inside the test while the page is still open, where the video handle resolves to its path; record it there, keyed to the test title, and rename during collection. Route every context through one close helper so this and the tail wait have a single home — a context closing by itself skips both, and the missing name is the visible symptom of a truncated recording.

A recording is a viewport, not the page: content below the fold is absent, and a modal taller than the viewport looks cropped. Read a cut-off edge as the frame boundary before treating it as a layout bug.

### Assertion and locator conventions

Worth adopting early; retrofitting is tedious.

Prefer role/label/text locators over CSS. Use web-first assertions (`await expect(locator).toBeVisible()`), never `expect(await locator.isVisible()).toBe(true)` — the latter doesn't retry. Never `waitForTimeout` as a substitute for waiting on a condition.

Two that repeatedly catch real bugs:

- Assert absence with `toHaveCount(0)`, not `not.toBeVisible()` — something rendered off-screen or inside a collapsed section passes a visibility check while still being in the DOM.
- Before any absence assertion, assert something that *must* be present. A blank or errored page satisfies every `toHaveCount(0)` in the file, so an absence-only spec passes hardest exactly when the app is most broken.

**A spec that asserts state it never establishes is the highest-value thing to check for, because it passes.** Prove a spec is not vacuous by inverting its fixture in the database and re-running: it must fail. If it still passes, it isn't testing what it claims. This is also how you check a gate is live — remove the guard and confirm something goes red.

## CI

Wiring CI is often the stated goal and is frequently the wrong next step. Check what the pipeline's triggers actually are: if it only runs on deploy branches, an E2E step there gates *after* merge, which is not what anyone wants from a test suite. And CI needs an environment with the fixture rows — the seeder is a prerequisite for CI being possible at all, not a parallel task.

Say plainly when CI should stay deferred and why, rather than adding a step that runs in the wrong place.

## Report

Give the user the numbers, not adjectives: tests passing before and after, the race reproduced at N/8 before and 0/8 after, and the exact command to run the suite including any seeding step. If something was deliberately not done — CI, a fix that fought the framework — say so and why, so it doesn't read as an oversight.
