# UAT script lessons {#lessons}

Measured on two client projects (a WooCommerce plugin's UAT, October to November 2026, and a Laravel marketplace's first pass, 17/11/2026). Each is the reason for a rule in `SKILL.md`.

## Writing checks {#writing}

| What happened | Rule it produced |
|---|---|
| Expected results written from memory of the screen made correct builds read as Fail during UAT | Quote the screen's own words, checked by `check_wording.py` |
| A tester's check failed on a product set to earn nothing; not a defect, the setup named the wrong product | "Before you start" names the exact seeded record |
| Four made-up products a check depended on had never been created on the test site; another check was marked Pass with none of its campaigns saved | Read the test site for every record a check names before testers reach it |
| A login was already approved by an earlier test, so a check about approving it failed | Before seeding data onto a test login, find every check that signs in as it |
| A blank-field check expected the app's message, but the browser's own "Please fill out this field" stopped the form first | For a field marked required in the page, expect the browser prompt; the app's message shows only for a wrong value |
| A quotation sentence with a straight apostrophe failed the word-for-word check against the signed text's curly one | Copy the sentence from the source file, never retype it |
| Checks that switched a shop's set-up or a masking setting broke other testers' checks reading the same shop | Give settings checks their own seeded record, or a put-it-back step |
| A marketplace's first seeder made one record per state: a product review found Logistics shipping the order Seller Centre checks needed Paid, two tabs closing the same payout cycle, and "ask TSB to reload" impossible because the seeder only added what was missing (18/11/2026) | One copy of each record per tab, shared global state owned by one tab and named by role, a new-round command instead of a reload, platform-wide switches on the last day |
| A tester's remark "unable to test due to go-live mid of the month" | A check gated on a date gets a test-site switch so it runs any day |

## Status and sign-off {#status}

- A check a tester can run today is Not run, never Waiting, unless the client asked to hold it: a note leaving "Waiting" as their choice parked two runnable checks.
- A sign-off tab was drafted and removed: the client accepts UAT by email. Per-module counts give the evidence without signature cells; ask before adding them.
- A tester can move a Status without writing a name or remark, so a change shows only in the Summary counts: compare those as well as the rows.

## Once testers are in the sheet {#testers-in-sheet}

- **Never overwrite a tester's Status, Tester, Date or Remarks.** Read the sheet for their edits before every publish; a whole-sheet republish would have overwritten seven cells of unknown authorship.
- For a few changed checks, write only their changed cells in your own columns; when rows are added, merge only the changed rows and append new ones at the tab's end.
- A check marked Fail is answered in its Remarks, under the tester's line, in the team's colour, signed with the team name and date (not a person's), and its Status goes back to Not run, since testers don't read the tracker.
- A reply that changes what a check waits on also changes the guide and other checks that mention it; grep for the old wording after every such reply.
- The 10/11 audit found 22 of 102 checks stale ("the uat docs seems very outdated"); update checks in the same work as the screen change, not in a later sweep.

## Format research {#research}

Checked 17/11/2026: no formal standard exists for UAT scripts. Shared practice is a requirement ID per check, an expected result specific enough that two testers reach the same verdict, tester and date, linked defects, and a sign-off step (TestRail on traceability, https://www.testrail.com/blog/requirements-traceability-matrix/). The Victorian Government's UAT guidance (https://www.vic.gov.au/test-product-or-service) uses pass, fail, inconclusive and test error, ranks defects blocker to trivial, stages sign-off, and warns that vendor-run testing is "extremely risky, and not acceptable". Status must never rely on colour alone (WCAG 1.4.1), which the text-valued status dropdown satisfies.
