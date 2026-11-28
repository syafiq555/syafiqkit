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
  a UAT test script (test cases with steps and expected results: uat-script), NOT for a project plan or Gantt chart, NOT
  for moving work into ClickUp, Jira or Linear boards (configure that tool directly).
---

# Set up a tracker

A shared tracker works when anyone who opens it can answer "what is waiting on me?" in one glance, without a guide. Readers are often non-technical (a client, an operations lead), so the sheet explains itself through its words, colours and layout.

## Read the context first

The shape comes from the project, not from a default. Before designing, find out:

- **Who reads it and who writes in it.** A client's view drops anything internal (build-card links, effort figures, internal names). Keep those in the team's master sheet, or in the team's chat, task board or a conversation when both sides type in one sheet.
- **The parties whose turn it can be.** Usually us, them and a third party (a bank, a host, a supplier). Name each party in its status ("With Studio", "With Acme"). "Your reply needed" and "With us" read right only on a sheet one side opens. Once both sides edit it, "you" and "we" point at different people depending on who is reading, and "the client" talks about the reader in the third person.
- **Whose Google account owns it.** A side-work or personal-client sheet may belong in a personal account, not the work one the sign-in uses, so ask before building. A wrong owner means a rebuild, since a spreadsheets-only token cannot move or share the file.
- **What actually arrives.** Read the existing tracker, the client's messages or the project's task docs, and make the Type list from what really comes in (bugs, change requests, questions, content the client owes). Don't use a generic list.
- **Milestones.** UAT, go-live and handover give "Needed by" its meaning. Without them the date column stays empty.
- **Where the build work lives.** If cards live in ClickUp, Jira or Linear, the tracker links to them rather than copying them. Re-typing one update in three places is the commonest reason trackers go stale.
- **Locale.** The date format, time zone and language of the people reading it.
- **Whether the owner will install `onEdit.gs`.** Without it, History and Updated go (see Replies below), and No, Raised and Closed become typed by hand, since the script is what fills them.

When an existing tracker is in front of you, read it (read only) and list its problems with row evidence before proposing anything (a cell grown into a chat log, a status meaning two things, a column holding two meanings, values outside the dropdown, secrets pasted in). The findings are what the new layout must fix, and they make the proposal convincing to its owner.

**When the people who will answer already work in another tracker with the same team, its layout outranks the defaults below.** 📖 `references/shared-log-layout.md` when the answerers already use another tracker, or the owner runs one on a running-log shape (column names, status words, colours and font to copy). Keep a Needed by column even when that layout has none: a deadline written into a log cell sinks under later replies and nothing turns it red (two rows were already past due unseen in one rebuild).

## The shape that works

Published issue-log and change-log templates (sources in `references/research.md`) agree on ID, description, raised by, owner, priority, status and raised/target/closed dates. **None says whose turn it is**, and that is the column a shared tracker lives or dies on. This skill adds:

- **Status is whose turn, in plain words**, e.g. With Studio · With Acme · Studio done, please check · Waiting on third party · Closed. With two parties, "Pending Studio · Pending Acme · Closed" is enough if the owner prefers it. Keep "the other side must answer" apart from "done, please verify": merged, they make half the list look stuck on the client. When the answerers open the sheet, it is how the asks reach them: seed each unsent ask as its answerer's turn and share the sheet with the message that carries it. Seeded as the owner's turn ("With Syafiq", "To raise with client"), the counts show the owner's to-do list and every row reads stuck on the person sending it. "To raise" suits only a sheet the answerers never open. A second closing status such as "Not proceeding" keeps a declined ask from reading as done. A duplicate closes with "Duplicate of #12" as its latest update; an ask that turns out to be two becomes two rows, each saying "Split from #12".
- **Raised by and Next action by are separate columns.** One "Owner" column ends up meaning both. For an internal team, make Next action by a dropdown of people so each can filter to their rows. Where most rows sit with one person, add a row of counts per person above the status counts: a status strip reading "Waiting on client: 1" hid that 24 of 28 rows were one person's turn.
- **Dates: Raised, Needed by, Closed, plus Updated.** Updated drives the "waiting too long" colour.
- **Replies: a one-line Latest update, plus a History cell with dated replies, newest first.** The current state sits at the top and the record stays in the row where people already type; a separate updates tab gets skipped by non-technical readers. History and Updated need `onEdit.gs` below, so ask before building whether the owner will install it (or let you install it in their browser), and say when handing over that History stays frozen until it is in: a sheet handed over with the script called optional drew "so how the history updated?". An owner who won't install it gets columns nobody keeps up ("abit hassle later need to keep updating"), so drop both, and the amber rule goes with Updated. The record then lives in the Latest update cell: every reply is its own line starting with who and the date ("Syafiq 07/11: ..."), added under the earlier lines with an append call, never by rewriting the cell. Google's edit history is not a record a client reads, and an update written over the cell erased the earlier reply until the owner asked to "keep the trail".
- **Decisions get their own tab.** Any answer that settles how something works goes there with a date and who decided it, so it isn't buried in History.
- **Change requests carry the scope answer.** Whether it is in the quote goes in the latest update (or a column, for an internal tracker), so extra work is visible when it is agreed.
- **Words written for the other side.** A proposed default is a suggestion they can accept or change ("Suggested: Choice as one seller. Kindly confirm."), never "we assume". A question is spoken as courtesy, not as an order: "Will you be able to …?" for something they must do, a suggestion they can answer "ok" to for the rest, wording varied across rows (`casual-message` § Speaking for the sender has the reasoning). A third-person "Will Acme submit …?" reads as a command. Type values stay neutral ("Information needed", not "Info we need"), and a heading says what to do in its column ("Latest update / reply"). A seeded Latest update says where the question stands for whoever must answer it (what happens today, the suggestion, what it blocks), never the owner's working note ("drafted, not yet sent"); whose turn it is already sits in Status. The tab and title name what the team calls the sheet (a decisions tracker is not "Asks"), not the example's defaults. On one client tracker, rows worded from the agency's side drew "be respectful this world doesnt revolve around [the agency]".
- **No tutorial tab.** Counts go across the top of the main tab instead (With Acme · With Studio · Waiting on third party · Overdue). Status chips are coloured by whose turn it is. Columns run in reading order, and the record columns (Updated, History, Raised by, Raised, Closed) sit at the right in dark grey. If a column needs explaining, rename it or drop it.
- **Red for past Needed by, amber for "please check" left too long.** Closed rows fade to mid-grey, still readable.
- **No passwords, keys or tokens in the sheet, ever.** Anyone with the link can read them.
- **New asks go in a new row at the bottom.** The numbering, dates and starting status fill themselves in. A Google Form for intake is possible, but its answers land in their own tab and need folding in, so use one only when the people raising asks should not see the list.

## Build it

`scripts/build_tracker.py` builds the whole sheet from one JSON config: a minimal Table with a grey heading row, dropdowns that reject other values, coloured status chips, a counts strip, a saved filter view per count (so "With Acme: 6" is one click from those rows, soonest Needed by first), red and amber rules, frozen headings, warning-only protection and any extra tabs. With an `updated` or `history` column in the config it also writes `onEdit-<tab>.gs`; without either, none. It checks the config before touching Google, and on a failed request removes a half-built tab (with `--into`) or prints the half-built spreadsheet's link to delete. `examples/client-asks.json` is a worked config for an agency and its client: copy it and change the parties, statuses, types and columns. Never fold or hide a column, the record columns included: a reader looking for History doesn't find the "+" and asks where it went. 📖 `references/build-details.md` for column roles, config options, the summary tab and the pivot re-pointing on `--replace`, when writing or changing a config.

The script needs Python 3.9 or later and nothing outside the standard library. Copy the example config into the user's project (never edit it inside the plugin folder, which updates replace), and run the script by its full path so it works from any folder:

```bash
python3 -I "${CLAUDE_SKILL_DIR}/scripts/build_tracker.py" my-tracker.json
python3 -I "${CLAUDE_SKILL_DIR}/scripts/build_tracker.py" my-tracker.json --into <spreadsheetId>   # add as a new tab
python3 -I "${CLAUDE_SKILL_DIR}/scripts/build_tracker.py" my-tracker.json --into <spreadsheetId> --replace   # rebuild that tab, same link
```

The build signs in with the plugin's `gsheets-mcp` sign-in, so the sheet lands in that sign-in's account: confirm which account with the user before building. 📖 `references/sign-in.md` for the sign-in check, the fallbacks (`SHEETS_TOKEN`, `GSHEETS_CONFIG_DIR`) and the Workspace `org_internal` refusal, when no sign-in exists or the sheet belongs in another account.

`--replace` builds the new tab beside the old one, then deletes the old tab and gives the new one its name and table name, so the link stays the same. It rebuilds from the config and drops anything typed in the sheet, so on a sheet others already use, get the owner's go-ahead first and copy what was typed back into the config (`pull_tracker.py my-tracker.json <spreadsheetId>`, after any session that edits the live sheet; 📖 `references/build-details.md` for its command, what it reads back, and why formatting belongs in the config).

Use made-up sample rows that cover every status, so the colours and counts can be checked, then build the real one with `--no-samples` (or delete the sample rows) before anyone else sees it. A client who opens a sheet full of strangers' names and fake bugs stops trusting it. `--no-samples` drops every seeded row, so when the real tracker starts with genuine rows (questions the client already answered, kept closed for the record, plus the one open ask), put those in `sample_rows` and build without the flag. Once others type in it, the live sheet is the record and the config only seeded it: a rebuild drops their rows. Where the file lands and who shares it: 📖 `references/sign-in.md`. `--into` behaviour: 📖 `references/build-details.md`.

`"table": false` builds a plain sheet instead of a Table (📖 `references/build-details.md`). 📖 `references/sheets-api-gotchas.md` before changing the script or building by hand: it lists the traps that silently produce a wrong-looking sheet, and why converting to a Table and back loses rows.

## Check it

Read the sheet back: the heading row, two data rows, the counts strip (do the numbers match the sample rows?) and the date format. Then look at it rendered, since truncated labels, faint text and overlapping chips only show there. More than one connected browser may be signed in to a different Google account, and the default may get "You need access". In each, read the signed-in account from the page (the `[aria-label*="Google Account"]` element) before acting; if none is the owner's, ask the user for a screenshot rather than calling it done. Never request access from the wrong account.

Before reporting done, read the live rows from the first data row down and confirm no made-up sample rows remain on a sheet someone else will open. Sharing is the owner's step: a sheet still set to Restricted gives its reader "You need access", so before the message goes the owner sets General access to "Anyone with the link: Editor" or adds the reader's Google address as an editor (the first suits a client reached on WhatsApp, who may not be signed in on their phone). Check from outside the owner's sign-in: an anonymous `curl -s -o /dev/null -w '%{http_code} %{redirect_url}' '<sheet>/export?format=csv'` that redirects to `googleusercontent.com` means the link opens without signing in. Then hand the owner the message that goes out with the link: what is waiting on the reader, how to answer, and, without `onEdit.gs`, that History stays frozen (`casual-message` for a named person, `gchat-format` for a thread). Rows seeded as the answerer's turn read as asks nobody has sent until that message goes.

## Make it run itself (the owner adds these; `onEdit.gs` is required for History and Updated, and a sheet whose owner declines it is built without them)

The build prints where it wrote `onEdit-<tab>.gs`; the owner installs it in Apps Script, or the agent does with the owner's browser and go-ahead. 📖 `references/make-it-run-itself.md` for the install steps, the typed-edit test (Sheets API writes never fire the trigger), what the script fills in and logs, and the email and Chat alerts, when installing or when the owner asks for one.

## Across projects, and the internal copy

Build every project tracker from the same config, so the statuses match and one roll-up can read them all. The master sheet's per-project IMPORTRANGE and QUERY block, the days-open column and the refresh limits: 📖 `references/master-rollup.md`, when building or changing the master sheet.

Internal facts about an ask (the build-card link, effort, internal notes) stay out of the client's sheet. Keep them in a small table in the master, keyed by Project and No, and look them up beside the imported rows. Never use hidden columns or filter views in the client sheet for this: the client can unhide or clear them.

## Moving a live tracker over

Restructuring a sheet a client is using mid-milestone is the owner's decision, so ask before touching it. Build the new layout as a separate file, map the old statuses to the new ones, and carry each row's history across.
