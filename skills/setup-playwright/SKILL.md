---
name: setup-playwright
description: Set up or harden a Playwright E2E suite in any project, either first-time scaffolding (config, auth storageState, first spec) or fixing one that is flaky, times out more as workers rise, races between spec files, depends on hand-made local DB rows, or has no CI story. Use when the user says "set up playwright", "add e2e tests", "set up e2e", "set up browser tests", "scaffold browser tests", "we need integration tests for the frontend", "our e2e tests are flaky", "the test suite is flaky", "why do the e2e tests time out", "the e2e run takes too long", "it only passes with one worker", "specs pass alone but fail together", "e2e breaks after a db reset", "tests only pass on my machine", "make the e2e suite parallel-safe", "the e2e never tests mobile", "add a mobile viewport project", "record the e2e run", "video of the tests", "watch the flows", or names Playwright while describing an untrustworthy suite. NOT for writing one more spec in a suite that already works, NOT for backend/unit test setup, NOT for a CI runner that cannot reach a server (ci-ssh-deploy-timeout), NOT for a designed promo video (motion-clip). Bare footage requests against a working suite ("give me the videos", "record these specs", "show me the flows", "can I see it running") belong here too, because the traps are in what the recording shows.
---

# Set Up / Harden a Playwright E2E Suite

Two entry points, same file. **Scaffolding** a suite that doesn't exist yet, or **hardening** one that exists and isn't trusted. Read the section you need.

The hardening half matters more. A suite that passes locally and nowhere else is the common state, and the causes are almost always one of five: workers sharing rows, fixture data nobody seeds, auth that trips a rate limit, a local server that can't serve the requests parallel browsers make, or the browser/environment itself differing from wherever it's failing.

## Establish first

Before either path, these facts decide most of what follows:

| Question | How to settle it | Why it forks the work |
|---|---|---|
| Is a dev server already running? | Check the project's own docs/CLAUDE.md for a local URL before adding a `webServer` block | Herd/Valet/Docker setups already serve the app; adding `webServer` there makes Playwright fight the running one |
| What creates test data? | Look for a seeder/factory layer; ask if there's none | Decides whether fixtures come from a seeder or from hardcoded rows you'll have to replace later |
| Is the login endpoint throttled? | Grep the route's middleware for a throttle/rate-limit | Decides whether auth can drive the UI form at all, see Auth below |
| Does the failure reproduce with no data race, no missing fixture, and no throttle? | Rule out the other three first | Points at environment/browser drift, see below |

Read the app's own conventions rather than assuming a stack. A test suite that ignores them produces specs nobody maintains.

## Scaffolding a new suite

`npm i -D @playwright/test && npx playwright install chromium`. Then a config with a `setup` project (auth) that the main project depends on, `baseURL` pointing at the running dev server, and `ignoreHTTPSErrors` if that server uses a self-signed cert.

Set these explicitly even where they match Playwright's defaults, because they're the ones you'll want to tune and they're invisible until you do: `timeout` (30s), `expect.timeout` (5s), `forbidOnly: !!process.env.CI`, `retries` (0 local / 2 CI), `workers`, and a CI-aware `reporter`.

Keep local `retries` at 0. A retry re-runs a whole `describe.serial` block from the start, so it converts exactly the fixture races this skill exists to remove into intermittent passes.

Write the first spec against a flow the user actually cares about, and follow the assertion rules below from the start, since they are much cheaper to adopt now than to retrofit.

## Hardening an existing suite

### One browser project covers one viewport

A suite with a single desktop project silently has no coverage of any layout that changes below a breakpoint, so a mobile-only break ships looking tested. 📖 `references/hardening-incidents.md#viewport-coverage` for the examples and why the gap stays quiet.

Add a second project with a device descriptor when the app has responsive layout swaps, and tag only the specs that assert them. Most specs assert data, not layout, so re-running everything at a second viewport buys nothing.

The half that's easy to miss: **the tag needs both a `grep` and a `grepInvert`.** Restricting the mobile project alone leaves desktop still matching those files, so they run at desktop width, where the mobile-only markup does not exist, and fail for the wrong reason. The result is a red suite that looks like the new specs are broken:

```ts
{ name: 'chromium', use: { ...devices['Desktop Chrome'] }, grepInvert: /@mobile/, dependencies: ['setup'] },
{ name: 'mobile',   use: { ...devices['Pixel 7'] },        grep:       /@mobile/, dependencies: ['setup'] },
```

Verify by running each project separately and checking the counts differ, since a tag typo yields a mobile project that silently matches nothing and reports as a pass.

A device descriptor fixes the height too, and that height is taller than most phones. Where a layout is sized to the screen (a pinned scroll scene, a sticky stage, a `100svh` hero), add specs inside the mobile project that call `page.setViewportSize` to 375×667 and 320×568 and assert the key element and action still fit. The descriptor alone passes while a shorter phone clips. 📖 `references/hardening-incidents.md#viewport-coverage` for the Pixel 7 measurement.

### Failures that grow with the worker count

The signature: element-not-found and page-load timeouts spread across unrelated specs, rare at one worker and common at several. Before changing any setting, **load one page the way a spec does and count its requests by host and path** (a short script with `page.on('request')`, grouped). That count names the mechanism in half a minute; a theory tested by a full-suite run costs an hour per guess and returns timeouts that fit every theory. Measured: a suite blamed in turn on the PHP pool size, the socket queue and a static-file rule turned out to load about 950 modules a page from a dev server the local tooling had restarted mid-run, against about 35 from the built bundle.

What a count usually shows, largest first: a dev server (Vite and the like) answering instead of the build, which some local hosts start by themselves; static files routed through the app runtime rather than served from disk; console-log or analytics beacons the specs never assert on. Stub what no spec reads in the shared fixture, serve static files from disk, and pick the worker count from a measured pass rate rather than the core count.

⚠️ **A fix that consists of stopping a process is not a fix until you know what starts it.** Re-check before every run that it is still stopped (port listener, the hot file it writes), or guard the run with a watchdog, because a process restarted mid-run turns the second half of the suite into noise that reads as fresh failures. **Tell: you stopped something earlier in the session and the current run never checked it is still down.**

Make each failure carry its cause, so the next diagnosis reads rather than guesses: a shared fixture that fails a test the moment the app shows its crash screen (a page binding plus `page.close({ reason })` interrupts the pending wait with that message), attaches the same-origin failed and 5xx requests, and `trace: 'retain-on-failure'` (`'on-first-retry'` with local retries at 0 never saves one).

### The cross-file race

The signature: two spec files that each pass alone fail together, on assertions unrelated to what either one mutates.

`test.describe.serial` orders tests only *within* one file. Under `fullyParallel`, two files touching the same rows land on different workers and interleave, and no Playwright construct serialises them, because the database is external to the runner and workers are separate processes.

Reproduce it before fixing it, or you cannot tell the fix worked. Establish the failure RATE, not one captured instance: a single failure supports a plausible story that survives the fix, so take a baseline over enough runs that the failure appears more than once, then require the fix to move that same number.

`--repeat-each` does not give that number on a `describe.serial` file, since the first failure aborts the remaining repeats. Loop whole runs and count. Confirm a collision with `--reporter=json` by comparing `parallelIndex` (not `workerIndex`) and start times, and write the JSON to a file rather than piping it. 📖 `references/hardening-incidents.md#race-repro` for why `--repeat-each` fails and why piping breaks `jq`.

Establish the mechanism, not just the correlation. Before acting on any "X fails because Y", run the one command that would come out differently if Y were false.

**Fix by partitioning, not locking.** Give each worker its own data (its own account/tenant/org and everything hanging off it) so no two can collide. A lockfile mutex does work, but it becomes a global bottleneck and fails in ways that read as unrelated bugs. 📖 `references/hardening-incidents.md#partition-not-lock` for the stale-lock and hook-timeout failures.

Partition on `workerInfo.parallelIndex`, **not** `workerIndex`, which keeps climbing as replacement workers spawn after a failure and can map two *concurrent* workers onto one fixture. `parallelIndex` is the slot number, bounded by the live worker count and reused only after its holder exits. 📖 `references/hardening-incidents.md#parallel-index` for the measured collision.

Then cap `workers` at the number of fixture sets you seeded, and assert it, since a machine with more cores silently re-creates the race:

```ts
if (workerInfo.parallelIndex >= FIXTURE_COUNT) {
  throw new Error(`${workerInfo.parallelIndex + 1}+ workers but only ${FIXTURE_COUNT} fixture sets; workers would share rows.`)
}
```

### Fixture data nobody seeds

Specs that hardcode local row ids work on one machine until someone resets the database, then fail as confusing assertion errors far from the cause.

Write a seeder that builds N self-contained fixture sets, one per worker, idempotent so a re-run repairs a partial wipe. Guard it to local/dev/test environments, since it writes known-password accounts and would be destructive against real data. Verify that guard with a negative control (run it with the env var flipped and confirm it refuses). An unproven guard on a destructive script is worth little.

**`firstOrCreate`-style helpers apply their defaults only on insert.** Re-running never touches an existing row, including the columns specs mutate that a killed worker left un-restored. Re-assert those fields explicitly after the create, or the seeder's "just re-run it" recovery silently does nothing. Scope the match key to the parent FK too, so a stale child under a deleted parent cannot shadow the real one.

Seed the untidy shapes real data holds, not only the tidy ones: an empty JSON column, a legacy row missing a foreign key a newer table now carries, a record with no optional children. Tidy fixtures are why a form passes every spec and fails on the first old record a user opens.

Prove idempotence by running it twice and diffing row counts, and prove self-healing by sabotaging a field, re-running, and reading the field back.

Pair it with a precondition check that fails naming the missing rows and the exact seeder command. That converts a database reset from a debugging session into one line of output.

### Auth, and the throttle that breaks it

Driving the login **form** once per identity is the obvious approach, and it stops working once the suite needs more than a handful, because login routes are commonly rate-limited per IP. The SPA swallows the 429, so the spec hangs on a login page that never navigates and reads as a broken selector.

Grep the login route's middleware for a throttle before choosing. If there is one, authenticate through the API (one request per identity) and write `storageState` by hand, then reuse a still-fresh state file instead of re-authenticating every run.

⚠️ **A throttle applied as route middleware counts successful logins too, so caching state does not save the specs that log in through the form on purpose** (a landing-after-login test, a wrong-password test). Reset the counters for the fixture accounts before each run, from the idempotent seeder or whatever runs before the suite (`globalSetup`, a setup project). 📖 `references/hardening-incidents.md#throttle` for the limiter's key format and how to prove the reset works.

Build that state from what the app actually persists, not from assumption: log in once through the UI, dump `storageState`, and mirror those keys. A missing key usually renders a blank page with no error. 📖 `references/hardening-incidents.md#persisted-state` for the token-level and role-payload traps.

Cap the setup project's parallelism (`fullyParallel: false` on that project, since `workers` is not a per-project option) so a cold start doesn't burst.

⚠️ **Caching the state and still paying for it every run is the common end state: `dependencies: [setup]` re-runs the whole setup project whether or not the cached state is fresh.** Nothing looks wrong, the run just passes slowly. When iterating, run with `--no-deps`, and drop it when auth genuinely changed (a seeded reset, an expired token, a login failing at the app layer) or when a failure implicates the session. 📖 `references/hardening-incidents.md#no-deps` for the measured cost. **Tell: you are waiting on a login you already have on disk.**

### Environment and browser drift

The signature: "works on my machine," with no data race, no missing fixture, and no throttle. The three checks above all come back clean.

Confirm the installed browser binary matches what's failing elsewhere: `npx playwright install --with-deps` pins the exact Chromium/WebKit/Firefox build the test was written against, so a machine that ran `playwright install` at a different time can silently diverge from CI or a teammate's machine. Also check timezone/locale (date and currency assertions), and installed system fonts (layout-sensitive screenshot/pixel assertions). Both differ by machine, and neither shows up as a Playwright error, just a wrong value or a failed visual diff.

### Recording the run as video

Worth wiring even when nothing is failing: a recorded pass shows spacing, truncation, clipped modals and copy problems that no assertion encodes. Offer it once a suite covers real user journeys, since the flows already exist. A designed launch or promo video is `motion-clip`. 📖 `references/recording-video.md#why-record`.

Video is a **context-creation** option, which is the whole difficulty. `use.video` reaches only the contexts the runner builds for its own `page` fixture. Specs that build contexts by hand, such as a multi-party flow with two sessions open, need the context-level `recordVideo` option, and setting only one leaves half the suite silently unrecorded. 📖 `references/recording-video.md#context-creation` for the two-directory gather.

⚠️ **Verify a recording by looking at a frame, not by the run being green.** Extract a frame near the end and view it before sending. A green suite masks stale dev-server code, stale build output, encoding cut off by an early context close, and a recording of the wrong half of the page. Rebuild before grading, since a built-asset app serves the last `build` rather than your edit. Do the check before the file reaches the user, because the moment of sending is where a green count makes an unwatched file look verified. 📖 `references/recording-video.md#verify-frame` for the ffmpeg command and each trap.

- **Encoding stops the moment a context closes**, and a spec ends on its last assertion, so hold each context open briefly before closing, behind the recording flag, so a normal run pays nothing.
- **Name the file after the test.** A hand-built context's video lands under a content hash, so record its path inside the test while the page is open, keyed to the test title, and route every context through one close helper. A context closing by itself skips naming and the tail wait. 📖 `references/recording-video.md#encoding-naming`.

Config placement is a trap: `test.use({launchOptions: {slowMo}})` cannot sit inside a `describe` block, since it forces a new worker. Put it at file top level, gated by the recording flag. A per-test timeout raise is legal inside the block via `describe.configure`. 📖 `references/recording-video.md#placement` for the exact error text.

**Gate the framing, never the claim.** Reveal, pace and hold are camera-only and belong behind the flag; an `expect` does not, since gated it runs only when someone records. Hoist an `expect` out of a recording-only block and leave only the framing. An API read verifies state, but the *rendering* of it is different code and needs its own assertion.

A recording is a viewport, not the page. Scroll the subject into shot behind the recording flag, and perform any interaction the spec skips (a grid that stays empty until a date is picked) under the same guard. Scrolling alone still films an empty element. 📖 `references/recording-video.md#viewport-framing` for the cropped-modal case.

### Assertion and locator conventions

Worth adopting early; retrofitting is tedious.

Prefer role/label/text locators over CSS. Use web-first assertions (`await expect(locator).toBeVisible()`), never `expect(await locator.isVisible()).toBe(true)`, since the latter does not retry. Never `waitForTimeout` as a substitute for waiting on a condition.

Two that repeatedly catch real bugs:

- Assert absence with `toHaveCount(0)`, not `not.toBeVisible()`, since something rendered off-screen or inside a collapsed section passes a visibility check while still in the DOM.
- Before any absence assertion, assert something that *must* be present. A blank or errored page satisfies every `toHaveCount(0)` in the file, so an absence-only spec passes hardest exactly when the app is most broken.
- A save is proven by reloading and reading the value back, never by the success toast, since a form can serialise a field away while the server answers 200. 📖 `references/hardening-incidents.md#save-proof`. A spec that stubs the API with `page.route` proves only that the screen renders a given reply; keep at least one unstubbed round-trip per write path.

**A spec that asserts state it never establishes is the highest-value thing to check for, because it passes.** Prove a spec is not vacuous by inverting its fixture in the database and re-running: it must fail. This is also how you check a gate is live: remove the guard and confirm something goes red. When a probe still passes, confirm the mutation landed before concluding the spec is vacuous. 📖 `references/hardening-incidents.md#vacuity`.

## CI

Wiring CI is often the stated goal and is frequently the wrong next step. Check what the pipeline's triggers actually are: if it only runs on deploy branches, an E2E step there gates *after* merge, which is not what anyone wants from a test suite. And CI needs an environment with the fixture rows. The seeder is a prerequisite for CI being possible at all, not a parallel task.

Say plainly when CI should stay deferred and why, rather than adding a step that runs in the wrong place.

## Report

Give the user the numbers, not adjectives: tests passing before and after, the race reproduced at N/8 before and 0/8 after, and the exact command to run the suite including any seeding step. If something was deliberately not done (CI, a fix that fought the framework), say so and why, so it does not read as an oversight.
