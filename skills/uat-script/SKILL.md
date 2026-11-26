---
name: uat-script
description: >
  Build or extend a client UAT script: the test scenarios a client's non-technical testers run before
  sign-off, kept as CSV rows and rendered to an Excel workbook (and a Google Sheet copy) with a tab per
  role, a status dropdown, a Summary and per-module counts, and a Defects tab. Each check quotes the
  screen's own words and names the requirement (spec or BRS ID, with its scenario) and the signed
  quotation line it proves, and a script fails when a quoted screen text no longer exists in the app.
  Fires on "prepare UAT", "UAT script", "UAT pack", "UAT workbook", "test scenarios for the client",
  "acceptance test pack", "test cases for sign-off", "the client needs test cases before testing",
  "add UAT checks for this module", "the UAT sheet is out of date". NOT for a client tracker or issue
  log (setup-tracker), NOT for watching testers' edits on a repeating check (watch-sheets), NOT for an
  end-user guide (user-manual, or help-centre for one served in the app), NOT for automated Playwright tests (setup-playwright).
---

# UAT script

A UAT script is what the client signs off against, so every check has to be one a business tester can run cold, and a correct build must read as Pass. Most UAT failures that aren't defects come from the script: wording the screen never showed, setup data that was never created, or a check another tester's run changed underneath it.

## Scope it from the acceptance basis

Find what the contract says acceptance is measured against before writing a row: a quotation line such as "a test scenario for each module", a spec's "the stated scenario is the UAT basis", a module list. That decides the columns. Where acceptance is per module, add a Modules tab and a module column; where a requirement set carries scenarios, cite its IDs and let the build fill each scenario from the source file, never typed. A check's "quotation says" cell is the sentence it proves, copied word for word: the build refuses a paraphrase, because a paraphrased promise can't be held against the signed text.

Cover what is built today; give each unbuilt module one "still being built" row so the per-module counts show the whole scope from day one, and replace it with real checks when the module lands.

Split the writing by role tab across parallel `haiku` agents with one shared brief (columns, quoting rule, self-check commands), each writing its own CSV file, then verify the merged result yourself: re-run both scripts, read a sample row per tab against the screen's source, and open the rendered workbook.

## What makes a check runnable

- **Quote the screen.** Expected results put on-screen text inside double quotes, copied from the app's language files or page source. `scripts/check_wording.py` lists every quote the source no longer contains; it matches a whole sentence with values filled in, or a fixed part with no placeholder in it, so don't quote a fragment that spans a variable.
- **One action per step**, location first, the exact label: "On Payout cycles, select Close cycle." Under about ten steps; the explanation goes in Expected result, not inside a step.
- **Setup data exists before the tester reaches it.** A "Before you start" that names a record is a promise: seed those records (a re-runnable seeder with realistic made-up names beats hand-made data, which drifts as testers use it) and read the test site for them before testing opens. Name states a tester can't produce themselves (an expired order, a failed payment, a closed cycle) as seeded records, never as instructions.
- **Testers run tabs in parallel, so a record one check changes can't be read by another tab.** Seed one copy of every record per tab (the Test records tab then has an order-number column per tab), keep truly global state (a payout cycle, a platform setting) to the one tab that owns it, and name it by role rather than date when its dates follow the seeding day. A seeder that only fills in what's missing can't "reload" append-only data: give it a new-round mode that loads a fresh set with new numbers, run the morning a round starts if any record expires. Checks that flip a platform-wide switch (staff two-step, a role's permissions) run on the last test day.
- **Every role gets a refused-action check**: the role opens a page or presses something it must not, and the check quotes what it sees.
- **Status says who can act.** A check a tester can run now is Not run; Waiting only when something outside the tester's control blocks it, and Waiting on says what. Calling a runnable check Waiting parks it.
- **Cross-role journeys** (one order from purchase to payout) get their own tab, each step naming the earlier check whose record it uses.

## Building and publishing

`scripts/build_workbook.py <config.json>` renders the workbook from every `*.csv` in the config's `cases_dir`; `scripts/check_wording.py <config.json>` checks the quotes. `examples/uat.config.json` shows every key: tabs order, modules, requirements file with its row pattern and scenario marker, quotation file, wording sources, Read me blocks, logins, connections. Columns and validation are fixed by the script (status dropdown, colour plus text for status, frozen header, wrap, a 100-row Defects tab with severity). Both scripts need `openpyxl`, which on this machine lives only in the default `python3`'s user site-packages: run them with plain `python3`, not `-I`.

Keep the CSVs as the only source and copy the scripts into the project (with its config beside the cases) so the project builds without the plugin. Publishing to the client's Google Sheet goes through the `gsheets` MCP; the first publish is client-facing, so it waits for the user's go-ahead.

Once testers write in the shared copy, the script and the sheet stop being the same thing. 📖 `references/lessons.md` § Once testers are in the sheet for merging your changes without overwriting theirs, and answering a Fail.

## Keeping it current

A screen change that alters wording, a button or a rule updates its checks in the same piece of work; nothing else fails when they drift (one project found 22 of 102 checks stale in a single audit). Mark a changed check's Revised date so a tester who already passed it looks again. 📖 `references/lessons.md` for the incidents behind each rule above.
