# Worked example: a launch-week watch

One project, five days before go-live, with a `/loop 10m` running over three sheets. Names below are made up.

- **Tracker:** about 80 rows. Replies go in column F and status in E. Each status names who acts next: Pending Client-Business, Pending Client-IT, Pending Us, Closed. Every person writes in their own text colour.
- **UAT Phase 1:** a Summary tab with counts per role tab (Checks, Not run, Pass, Fail, Waiting), a Defects tab, and tester columns J to L (Tester, Date, Remarks) on each role tab.
- **UAT Phase 2:** the same layout.

## What the first check found

- `cells_awaiting_reply` listed 4 rows. In all four, the client's last line passed the item to someone on their own side: "Sam pls review", "Sam, pls confirm", "noted, deal with it later". Each row's status was Pending Client-Business or Pending Client-IT, so none was our turn. Reporting "4 rows await reply" would have been an alert nobody could act on.
- One row was Pending Us. Its last two lines were the client saying it could wait until after go-live, and us agreeing. So it was not a new ask either.
- UAT: 22 Pass, 0 Fail, 23 Waiting. Both defects tabs were empty. Every tester remark already ended with our reply or the client's.
- Peers: two live sessions, both in another repo, so no overlap and no `read-summary` run.

That made it a quiet check: no `AskUserQuestion`, just a short report.

## The fourth check: a status-only move

The reply check gave the same 4 rows, but diffing each row's status against the last check showed that row 80 had gone from Pending Client-IT to Closed (`skippedByStatus` also went from 23 to 24, though a count alone would miss a close paired with a reopen), with no new text anywhere. A check that diffed only reply text would never have shown it.

The tracker's `modifiedTime` was 19:16 local time, between the third check (around 19:12) and the fourth (around 19:22). The UAT Phase 1 file's `modifiedTime` was 18:45, before the watch started, which matched its unchanged counts. That is the evidence behind gating each check on `modifiedTime`.

## What the run taught

| Lesson | Where it went |
|---|---|
| A line after ours is often routing on the client's side, not an ask | Each check, step 2: the status decides |
| A closed row adds no text | Each check, step 3: per-row status diff |
| Three identical checks cost three full reads | Each check, step 1: the `modifiedTime` gate |
| "Check the other sessions" found only sessions in other repos | Each check, step 5: count only live peers in this project, and only when something is our turn |
