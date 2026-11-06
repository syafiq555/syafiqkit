---
name: setup-tracker
description: >
  Set up, or restructure, a shared tracker spreadsheet for a project: client asks, change requests, issues,
  questions and what each side owes the other, in Google Sheets. It works for one project shared with a client
  or with a team, and for a master sheet that rolls several project trackers into one view. Fires on "set up a
  tracker", "make a client tracker", "issue log", "bug tracker sheet", "change request log", "feedback
  tracker", "punch list", "snag list", "RAID log", "decision log", "action items sheet", "tracker for the new
  project", "one tracker for all our projects", "our tracker sheet is messy", "the remarks column is too long",
  "client can't tell what's waiting on them", "make the tracker intuitive", "no tutorial", "turn this sheet
  into a template", and on a pasted screenshot of a tracker sheet to improve. Any team, any client; every
  label is set per project, so any language. NOT for a per-person daily or weekly huddle or timesheet, NOT for
  a UAT test script (test cases with steps and expected results), NOT for a project plan or Gantt chart, NOT
  for moving work into ClickUp, Jira or Linear boards (configure that tool directly), and NOT for planning
  which items to build (`plan-worklist`).
---

# Set up a tracker

A shared tracker works when anyone who opens it can answer "what is waiting on me?" in one glance, without a guide. Every choice below serves that. The reader is often non-technical (a client, an operations lead), so the sheet has to explain itself through its words, colours and layout.

## Read the context first

The shape comes from the project, not from a default. Before designing, find out:

- **Who reads it and who writes in it.** A client's view drops anything internal: build-card links, effort figures, internal names for things. Keep those in the team's own master sheet or, where the owner wants one sheet that both sides type in, in the team's chat, task board or a conversation. A filter view or a hidden column hides nothing from someone with the link.
- **The parties whose turn it can be.** Usually us, them, and a third party (a bank, a host, a supplier). Name each party in its status ("With Studio", "With Acme"). "Your reply needed" and "With us" only read right on a sheet just one side opens. Once both sides edit it, "you" and "we" point at different people depending on who is reading, and "the client" talks about the reader in the third person.
- **What actually arrives.** Read the existing tracker, the client's messages or the project's task docs, and make the Type list from what really comes in (bugs, change requests, questions, content the client owes). Don't use a generic list.
- **Milestones.** UAT, go-live and handover give "Needed by" its meaning. Without them the date column stays empty.
- **Where the build work lives.** If cards live in ClickUp, Jira or Linear, the tracker links to them rather than copying them. Re-typing one update in three places is the commonest reason trackers go stale.
- **Locale.** The date format, time zone and language of the people reading it.
- **Whether the owner will install `onEdit.gs`.** Without it, History and Updated go (see Replies below), and No, Raised and Closed become typed by hand, since the script is what fills them.

When an existing tracker is in front of you, read it (read only) and list its problems with row evidence before proposing anything: a cell that has grown into a chat log, a status that means two things, a column holding two meanings, values outside the dropdown, secrets pasted in. Those findings are what the new layout has to fix, and they make the proposal convincing to whoever owns the sheet.

## The shape that works

Published issue-log and change-log templates (Asana, Atlassian, Monday, ProjectManager, Smartsheet and others; sources in `references/research.md`) agree on ID, description, raised by, owner, priority, status, and raised/target/closed dates. **None of them says whose turn it is**, and that is the column a shared tracker lives or dies on. What this skill adds on top of them:

- **Status is whose turn, in plain words.** For example: With Studio · With Acme · Studio done, please check · Waiting on third party · Closed. Split "the other side must answer" from "done, please verify". Merged, they make half the list look stuck on the client. Where the people who answer the asks will open the sheet (a client, or colleagues on an internal one), the sheet is how the asks reach them: seed each unsent ask as its answerer's turn and share the sheet with the message that carries it. Seeded as the owner's turn ("With Syafiq", "To raise with client"), the counts show the owner's to-do list and every row reads stuck on the person sending it. A "To raise" status suits only a sheet the answerers never open. A second closing status such as "Not proceeding" keeps a declined ask from reading as done. A duplicate is closed with "Duplicate of #12" as its latest update, and an ask that turns out to be two becomes two rows, each saying "Split from #12".
- **Raised by and Next action by are separate columns.** One "Owner" column ends up meaning both. For an internal team, make Next action by a dropdown of people, so each person can filter to their own rows. Where most rows sit with one person, add a row of counts per person above the status counts: a status strip reading "Waiting on client: 1" hid that 24 of 28 rows were one person's turn.
- **Dates: Raised, Needed by, Closed, plus Updated.** Updated drives the "waiting too long" colour.
- **Replies: a one-line Latest update, plus a History cell with dated replies, newest first.** The current state sits at the top, and the record is kept in the same row where people already type. A separate updates tab is tidier, but non-technical readers skip it. History and Updated only stay current with `onEdit.gs` below, so ask the owner before building whether they will install it (or let you install it in their browser), and when you hand the sheet over, say that History stays frozen until it is in. A sheet handed over with the script called optional drew "so how the history updated?". An owner who won't install it gets columns nobody keeps up ("abit hassle later need to keep updating"), so drop both, let Google's cell edit history and comments hold the record, and the amber rule goes with Updated.
- **Decisions get their own tab.** Any answer that settles how something works goes there with a date and who decided it, so it isn't buried in History.
- **Change requests carry the scope answer.** Whether it is in the quote goes in the latest update (or a column, for an internal tracker), so extra work is visible when it is agreed.
- **Words written for the other side.** A proposed default is a suggestion they can accept or change ("Suggested: Choice as one seller. Kindly confirm."), never "we assume". Type values stay neutral ("Information needed", not "Info we need"), and a heading says what to do in its column ("Latest update / reply"), so nobody needs instructions. A seeded Latest update says where the question stands for whoever must answer it (what happens today, the suggestion, what it blocks), never the owner's working note ("drafted, not yet sent"): whose turn it is already sits in Status. The tab and title name what the team will call the sheet (a decisions tracker is not "Asks"), not the example's defaults. On one client tracker, rows worded from the agency's side drew "be respectful this world doesnt revolve around [the agency]".
- **No tutorial tab.** Counts go across the top of the main tab instead (With Acme · With Studio · Waiting on third party · Overdue). Status chips are coloured by whose turn it is. Columns run in reading order, and the record columns (Updated, History, Raised by, Raised, Closed) sit at the right in dark grey. If a column needs explaining, rename it or drop it.
- **Red for past Needed by, amber for "please check" left too long.** Closed rows fade to mid-grey, still readable.
- **No passwords, keys or tokens in the sheet, ever.** Anyone with the link can read them.
- **New asks go in a new row at the bottom.** The numbering, dates and starting status fill themselves in. A Google Form for intake is possible, but its answers land in their own tab and need folding in, so use one only when the people raising asks should not see the list.

## Build it

`scripts/build_tracker.py` builds the whole sheet from one JSON config: a minimal Table with a grey heading row, dropdowns that reject other values, coloured status chips, the counts strip, a saved filter view per count (so "With Acme: 6" is one click away from those six rows, soonest Needed by first), the red and amber rules, frozen headings, warning-only protection and any extra tabs. It also writes a matching Apps Script, `onEdit-<tab>.gs`. It checks the config before touching Google. If a request fails, it removes a half-built tab (with `--into`) or prints the link of the half-built spreadsheet to delete. `examples/client-asks.json` is a worked config for an agency and its client; copy it and change the parties, statuses, types and columns to suit the context. Every column has a `role` (`no`, `ask`, `type`, `status`, `next`, `needed`, `latest`, `updated`, `history`, `raised_by`, `raised`, `closed`), or none for a plain extra column. The formulas and the script find columns by role, so headers can be in any words and any order. `no`, `ask` and `status` are required, and so are `statuses`, `columns` and `closed_status` (one status name or a list). The overdue count and the red rule need `needed`, and `stale_rule` needs `updated`; the script refuses a config that asks for one without the other. Other options: `new_status` (filled in when someone types a new ask), `stale_rule` (a list of status and days), `history_date_pattern`, `unknown_editor_label` and `status_change_line` (the History wording, for non-English sheets), and `domain_names` (an email domain to the name History shows, such as `{"agency.com": "Agency"}`). Never fold or hide a column, the record columns included: a reader looking for History doesn't find the "+" and asks where it went. A count with `"span": 2` takes two columns when its label would clip. A key the script doesn't know draws a warning and is otherwise ignored, so anything it names has to be built by hand.

The script needs Python 3.9 or later and nothing outside the standard library. Copy the example config into the user's project (never edit it inside the plugin folder, which updates replace), and run the script by its full path so it works from any folder:

```bash
python3 -I "${CLAUDE_SKILL_DIR}/scripts/build_tracker.py" my-tracker.json
python3 -I "${CLAUDE_SKILL_DIR}/scripts/build_tracker.py" my-tracker.json --into <spreadsheetId>   # add as a new tab
python3 -I "${CLAUDE_SKILL_DIR}/scripts/build_tracker.py" my-tracker.json --into <spreadsheetId> --replace   # rebuild that tab, same link
```

**The script signs in with the plugin's `gsheets-mcp` sign-in** (`~/.config/syafiqkit/google`, or `GSHEETS_CONFIG_DIR`): it turns the stored refresh token into an access token itself, so no token passes through the transcript. The sheet then lands in that sign-in's account. Check that one exists before building (`gsheets-mcp check`, in the plugin's `tools/gsheets-mcp/bin/`, or the two files `client.json` and `refresh.json`). Without it, a first sign-in needs `bun` and the user's own Google OAuth client of the Desktop-app type: `gsheets-mcp auth --client <path to client.json>`, once (`tools/gsheets-mcp/README.md`). The connection does not need to be switched on in this repo, since the script reads the files directly. Say which Google account the sign-in is before building, because the sheet lands there. Otherwise set `SHEETS_TOKEN` to an OAuth access token with the `https://www.googleapis.com/auth/spreadsheets` scope (it lasts about an hour, and wins when set), for example from the OAuth 2.0 Playground (pick the Sheets API v4 scope, sign in, exchange the code, copy the access token). Skip `gcloud auth application-default login`: Google answers it with "This app is blocked" for the Sheets scope unless you pass your own `--client-id-file`. With no sign-in at all, hand over the finished config and build the sheet by hand from it.

`--replace` builds the new tab beside the old one, then deletes the old tab and gives the new one its name and table name, so the link stays the same. It rebuilds from the config and drops anything typed in the sheet, so on a sheet others already use, get the owner's go-ahead first and copy what was typed back into `sample_rows`.

Use made-up sample rows that cover every status, so the colours and counts can be checked, then build the real one with `--no-samples` (or delete the sample rows) before anyone else sees it. A client who opens a sheet full of strangers' names and fake bugs stops trusting it. `--no-samples` drops every seeded row, so when the real tracker starts with genuine rows (questions the client already answered, kept closed for the record, plus the one open ask), put those in `sample_rows` and build without the flag. Once others type in it, the live sheet is the record and the config only seeded it: a rebuild drops their rows. The file lands in the My Drive of the account that owns the token. A spreadsheets-only token cannot share it, so the owner shares it. With `--into`, the target sheet's own time zone is used, and extra tabs are skipped (with a warning).

It wraps the rows in a minimal Google Sheets Table, for its filter button on every heading and its dropdown chips: light grey header with dark bold text, plain white rows, and a spacer row so the table's name label doesn't cover the counts. The same reader first found the default Table style distracting, then asked for it back in this minimal form ("quite nice also right can filter ... but minimal design"); `"table": false` builds a plain sheet instead. 📖 `references/sheets-api-gotchas.md` before changing the script or building by hand; it lists the traps that silently produce a wrong-looking sheet, and why converting to a Table and back loses the rows.

## Check it

Read the sheet back: the heading row, two data rows, the counts strip (do the numbers match the sample rows?) and the date format. Then look at it rendered. More than one browser may be connected to the browser tools, each signed in to its own Google account, and the default one may get "You need access". Open the sheet in each and read the signed-in account from the page (the `[aria-label*="Google Account"]` element) before acting; when none is the owner's, ask the user for a screenshot rather than calling it done. Never request access from the wrong account. Labels truncated by narrow columns, text too faint to read and overlapping chips only show up there.

Before reporting it done, read the live sheet's rows from the first data row down and confirm no made-up sample rows are left on a sheet someone else will open. Sharing the sheet is the owner's step, so hand them the message that goes out with the link: what is waiting on the reader, how to answer, and, without `onEdit.gs`, that History stays frozen (`casual-message` for a named person, `gchat-format` for a thread). Rows seeded as the answerer's turn read as asks nobody has sent until that message goes.

## Make it run itself (the owner adds these; `onEdit.gs` is required for History and Updated, and a sheet whose owner declines it is built without them)

- **`onEdit.gs`:** the build prints where it wrote `onEdit-<tab>.gs`. The owner opens the sheet, goes to Extensions > Apps Script, replaces the editor's contents with that file, saves, and approves the permission prompt on the first run. With the owner's browser connected and their go-ahead, the agent can install it: open Extensions > Apps Script, set the code with `monaco.editor.getModels()[0].setValue(code)`, press cmd+s, read `getValue()` back, and rename the project. Test it with an edit typed in the sheet (a throwaway row, cleared afterwards), because writes through the Sheets API never fire the trigger.
  - Typing or pasting asks fills in No, Raised and the starting status.
  - A status change is logged in History. A closing status stamps the Closed date; reopening clears it.
  - A new Latest update goes to the top of History as "Name dd/mm/yy: text" and sets Updated.

  It is a simple trigger, so it cannot send email. It sees the editor's email only for people in the owner's own Workspace; everyone outside arrives blank, so listing outsiders in `NAMES` does nothing. On a two-party tracker, set `domain_names` to the owner's domain (shown as the team) and `unknown_editor_label` to the other party's name, so every blank editor reads as them. An insider editing from a personal account then shows as the other party.
- **Email when it's someone's turn:** Tools > Conditional notifications, for example "Status is With Acme, notify the client". Only some work or school accounts can create these, and recipients must be Google accounts.
- **Internal alerts:** a Google Chat webhook from an installable Apps Script trigger. This needs a Workspace Business plan or above, and posts into one space.

Three behaviours Google doesn't document, which need a test with an outside Google account before you promise them to a client: whether an installable trigger fires on an outsider's edit, whether a comment assigned to a personal Gmail address sends an email, and whether the script's document lock (it stops two people getting the same No) is allowed in a simple trigger. If the lock is refused, the script carries on without it.

## Across projects, and the internal copy

Build every project tracker from the same config, so the statuses match and one roll-up can read them all. The team's master sheet gives each project its own block, for example:

```
=QUERY(IMPORTRANGE("<project A url>", "'Asks'!A4:L"), "select 'Project A', Col1, Col2, Col4, Col5, Col6 where Col2 is not null and Col4 <> 'Closed' label 'Project A' ''", 0)
```

Stack the blocks one under another, or join them with `{block1; block2}`. Add "days open" as `=TODAY()-<Raised>` beside the imported rows. Each source has to be granted once. Imports refresh about hourly while the master is open and are capped at 10 MB per pull. Changes that arrive through IMPORTRANGE don't trigger notifications, so turn rules stay on each project sheet.

Internal facts about an ask (the build-card link, effort, internal notes) stay out of the client's sheet. Keep them in a small table in the master, keyed by Project and No, and look them up beside the imported rows. Never use hidden columns in the client sheet for this: the client can unhide them.

## Moving a live tracker over

Restructuring a sheet a client is using mid-milestone is the owner's decision, so ask before touching it. Build the new layout as a separate file, map the old statuses to the new ones, carry each row's history across, and never copy pasted secrets into the new sheet.
