---
name: weekly-report
description: >
  Gather and send the user's part of a recurring weekly report that a lead compiles for a boss across several
  projects: what was done, what is stuck, what needs the boss, pending issues and counts, under the headings the
  boss set. Each project is checked against its chat space, git history, task docs and shared trackers by its own
  agent, last week's report is carried forward and closed or kept item by item, and the result is drafted in Chat
  format and sent to the lead. Fires on "weekly report", "weekly update for KL", "what do we report to HL",
  "what do I feed KL this week", "update for my lead", "run the weekly report", "find what to report", or a
  boss's ask for a summary report of all projects. NOT for a release note or one project's progress post to its
  own space (`gchat-format` or `ship`), NOT for a personal huddle or timesheet row (a week's summary rows
  there borrow only this skill's every-repo gathering; see the body), and NOT for watching a
  tracker for replies (`watch-sheets`).
---

# Weekly report

A boss's weekly report is a count of what the team owns, not a diary. It is read for three things: what the boss must act on, whether any project is in trouble, and whether anything was dropped since last week.

**Invoked for the weekly summary rows of the user's own huddle or timesheet instead**, this skill's sending and pending-item steps don't apply: the rows follow the user's own huddle instructions. What does carry over is the gathering. Take the week from every repo's commits since Monday, not from the daily rows already in the sheet, and carry or drop by name every daily row still unticked. Daily rows show only what the user logged each day, so a summary built from them inherits every gap (27/11/2026: one made that way missed an app-store approval that sat only in the mobile repo, and dropped a certificate renewal due the next week; the user replied "seems like not really summary ?").

## Sources live outside the skill

Read `~/.claude/references/weekly-report/sources.md` first. It names the projects, each one's repos, chat spaces and trackers, the boss's headings in his own words, who the report goes to, where the boss's answers land, and what the user said to leave out. If it is missing, build it with the user before gathering anything: the headings come from the boss's message (quote it), and the sources come from the project docs and `spaces_list`. Previous runs sit beside it as `<yyyy-mm-dd>.md`.

**Ask the user once, at the start, in one `AskUserQuestion`:** their opening line for this week, any task they feel is too much and should be reassigned (when the boss allows it), and any idea they want in. No chat or doc holds those.

## Gathering

**Start from last week's file (the newest `<yyyy-mm-dd>.md` beside `sources.md`), not a blank page.** Every pending item it lists is closed (with the source that closed it), still open, or dropped by the user; none disappears silently (Sentra's weekly business review guide: "actions get raised in the room, recorded in someone's notes, and never come back"). Items the boss owns close mostly in the spaces `sources.md` names as where his answers land: you read those yourself, never an agent, since the last run and only to mark items answered, and never quote them, since they hold private remarks. On the first run there is no baseline, so say so.

**Facts first, then the draft, then the check.** One `haiku` agent per project, in parallel (📖 `../haiku/SKILL.md` for the brief's rules), gathers that project's week blind: what shipped and by whom (commits since the last run's date, after a fetch, by the commands in `sources.md`), what moved in its chat spaces, its tracker rows counted by status from the sheet itself, and last week's items for that project with what closed each. Each brief carries the `sources.md` leave-out list verbatim and says client data is read as counts only, with no chat sends or file writes. You draft from those facts and the baseline, then one more `haiku` agent per project, handed that project's draft lines and their sources but not your reasoning, marks each line CONFIRMED, WRONG or UNVERIFIED with a source (file:line, commit, chat time and author, sheet row). Verifying a stated claim catches what an open question misses; a draft written before any fact-gathering anchors the checker on last week instead.

**Open two or three cited sources per project yourself**, starting with any figure that changes a count or a "needs the boss" line. The 26/11/2026 run needed: client tracker dates that had moved, tracker rows closed but still open in a task doc, and work credited to the wrong person. An agent's claim that a figure was superseded needs the message read: a later "136 inquiries" was a total, not the unanswered count it was said to replace.

## What goes in

The report's sections are the boss's headings, in his order and words; each line carries its project tag. The rules each heading follows:

- **Needs the boss** and **mechanisms needing his input** hold only what he alone can settle; the pending items he owns feed them. A business question the client must answer goes on the client tracker, not to him.
- **Ideas** are the user's answers plus what the team proposed in the spaces this week; a proposal stays "suggested", never "decided".
- **Done** names outcomes per project and who did them (commit authors, matched by email per `sources.md`, not the doc's narrator). This is an account to the lead, not a celebration post, so per-person credit is right here. A project with no code shipped says so and names what moved instead.
- **Status** is one word per project with its reason. On track; at risk, meaning a date is exposed while work can still move; waiting, meaning nothing moves until a named person acts; off track, meaning a date was missed. "Stuck" in the boss's count is waiting plus off track.
- **Pending issues** count one decision or one tracker row as one item, each with one owner (the person who acts next) and its source. A client tracker's open total and a list of open client questions are reported as their own counts, not added in. Give per-project totals, the sum, and how many carried, closed and new since last week. A cause nobody has confirmed is written "not yet confirmed" with who will confirm it.
- **Client items carry no dates**, only "may need a follow-up" and with whom: client dates move week to week, and the line stays true until the input arrives (the user, 26/11/2026).
- A heading with nothing this week prints "None this week" rather than vanishing.

Leave out what `sources.md` lists. Before the preview, scan the draft for what slips through: RM figures, quotation or invoice words, an IC or phone number, a dated client deadline.

## Sending

Draft through `gchat-format`'s send-tool route in its document shape (the user chose it over `casual-message` on 26/11/2026), opening with the user's line. Split it at headings into messages under 1,000 characters, preview every part, show them all in one reply, then send them in order to the recipient `sources.md` names; a denied part stops the parts after it.

Then save `~/.claude/references/weekly-report/<yyyy-mm-dd>.md` (the run's date): each pending item as `item | owner | source | first seen` with per-project totals, the status line, the ideas, and the text as sent. A denied part is saved as not sent, so next week carries it. The file is an internal baseline and may keep exact client dates in the source column; never copy them into the next report.
