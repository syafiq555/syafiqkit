---
name: watch-sheets
description: >
  Keep watching shared Google Sheets that other people write in (a client tracker, UAT or test workbooks, a
  feedback or issue log) on a repeating check, and alert the user only when something is their turn. Fires on
  "keep checking the tracker", "watch the tracker", "check the tracker and the UAT sheets every 10 minutes",
  "monitor the sheet", "alert me when the client replies", "tell me if a tester marks something Fail", "lots of
  people are in the sheets today", a `/loop` whose prompt checks a tracker or a test sheet, and a one-off "check
  the tracker" during a busy testing or launch week. Each check reads only what changed since the last one, tells
  routing lines ("Sam pls review") apart from asks to us, notices a status that moved with no new text, checks
  live peer sessions for the same work so two sessions don't answer one row, and stays quiet when nothing needs
  the user. NOT for building or restructuring a tracker (`setup-tracker`), NOT for writing the reply itself in
  the user's voice (`casual-message`), and NOT for watching CI, a deploy or a log file (use `/loop` or Monitor
  directly).
---

# Watch Sheets

A shared sheet during a busy week changes in small ways: a client adds a line, a tester flips a status, someone closes a row. Most of it is not the user's turn. The skill is the body of one check, run again on a schedule, and its job is to raise only what needs them. Google's SRE guidance is the bar: "Every page should be actionable", and alerts that come too often get skimmed and then ignored.

## Setup (first check only)

Find each sheet's id and its layout before the first read. Look in the project's own instructions (CLAUDE.md, CLAUDE.local.md, a tracker config JSON) before asking. A project that already runs a tracker usually records the id, the reply column, the status column, which statuses mean "our turn", and the colours and names its side writes with. Write down, for this session:

- **Tracker:** id, reply column (e.g. `Tracker!F2:F200`), status column, ask column, `myNames` (every name your side signs with, teammates included), and which statuses mean our turn. When the status names who acts next, only that status is our turn. A tracker with no status column has no handoff to read, so every client line after ours is our turn.
- **Test workbooks:** id, the summary tab with its counts, the defects tab, and the tester columns on each role tab (tester, date, remarks).

When the user asks for a repeating check and no job exists yet, schedule one with `CronCreate`, putting the user's own wording in the prompt so each run comes back here. Tell them the job id, that it lasts only as long as this session, and that it expires after 7 days. **"No job exists" is a `CronList` answer, not a memory of the jobs you made:** a session can hold watch jobs this conversation never created, and each fires its own full check and its own alert. Run `CronList` before creating one and on every later invocation; when more than one job runs this skill, keep the one whose interval and sheets match the user's latest request and delete the rest, saying which; if none match, delete them all and create one. **Tell: you are about to call `CronCreate`, or say the watch is off, without a `CronList` result this turn.**

## Each check

1. **Did anything change?** `drive_file_get` on each sheet returns `modifiedTime`. If no sheet moved since the last check, report one quiet line and stop. A cell edit moves it (measured: a row closed between two checks matched the tracker's `modifiedTime`). The gate saves the full read on quiet checks, not correctness, so the first check of a session always does the full read.
2. **Tracker.** `cells_awaiting_reply` with `statusColumn`, `askColumn` and `myNames`. A listed row is a client line after ours, but many of those lines just pass the item to someone on their own side ("pls review", "noted"). Only a row whose status is our turn, or whose last line asks us something, needs the user. Then read the rows whose status is our turn even when nothing new arrived: our own last line may promise something that later work has kept or overtaken. Find them by reading the whole status column once (Closed rows included, which `cells_awaiting_reply` leaves out); step 3 diffs the same read. It comes back unnumbered (an empty row is `[]`, trailing ones are dropped), so name each row by its cell: the range's first row plus the entry's index, never a hand count. Where the tracker numbers its own rows, report both ("No 47, Tracker!F48"), since that number need not match the sheet row. `alsoRead` numbers only the rows the reply check lists, so these rows still need this read.
3. **Status-only moves.** Compare each row's status with the last check's, using the status read from step 2: a row that closed or changed hands adds no text, so the reply check never shows it, and a count such as `skippedByStatus` holds steady when one row closes as another reopens. Name each row that moved, with its old and new status.
4. **Test workbooks.** Diff the summary counts against the last check, read the defects tab, and read the tester columns on each role tab. Request only the columns you compare (check ID, status, tester, date, remarks) as separate ranges per tab, never whole rows: the step and expected-result text in between made one batch read of eight role tabs return 145,000 characters, past the tool's output limit. A tester can move a status without writing a name or remark, so the counts are what catch that. A new Fail, a new defect, or a tester line after our last reply needs the user.
5. **Peer sessions.** Run `ListAgents`. A peer counts only when it is live (not offline) and works in the same project. Its name or opening prompt says which project; a session in another repo is not overlap. Only when step 2 or 4 found something for us, and a peer in this project is live, run `read-summary` for that item's domain and message the peer to ask whether it already has the row. Two sessions replying to one client cell is the failure this step prevents. Never ask a peer to do anything this session would not be allowed to do.
6. **Look once more before alerting.** People keep typing while you check, so run step 2 again just before you report anything as our turn.

Keep the baseline (each sheet's `modifiedTime`, each tracker row's status, the summary counts, the last tester line per check, and each row the user said to leave with its last line at the time) in the conversation, never in a file: these sheets often hold personal data. After compaction, the next check re-reads everything and treats that as its new baseline. A check with no baseline reports nothing as moved: it records the statuses and counts, and raises only what is our turn as it stands.

## Reporting

- **Something is our turn:** raise it with `AskUserQuestion`, so the user sees it even when away from the transcript. Name the row and its ask in plain words, who wrote it, and whether a peer already has it. Offer: draft replies now; leave it, they'll handle it; another session has it. Several items found in one check go into one question, never one each. A row the user said to leave comes back only when its last line or status has changed since: an unrelated edit moves `modifiedTime` and would otherwise raise it on every check.
- **Nothing is:** a short report with the counts, what moved (e.g. "row 80 closed"), and when the next check runs. After several quiet checks in a row, say so in one line and remind them how to stop the job (`CronDelete` with the id). Stopping the watch (`/loop off`, "stop watching") deletes every job `CronList` shows running this skill, then lists again and reports it empty: deleting only the id you remember left two duplicate watchers running while the reply said nothing was scheduled.
- Replying in the sheet is a separate step that follows the project's tracker rules (`cell_append_line` keeps each person's colours). Never reply because the check found something: the user picks.

📖 `references/worked-example.md`: a launch-week run over one tracker and two UAT workbooks. It shows the routing lines that looked like asks, a row that closed with no text, and the `modifiedTime` gate checked against it.
