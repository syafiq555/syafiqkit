---
name: weekly-report
description: >
  Gather and send the user's part of a recurring weekly report that a lead compiles for a boss across several
  projects: what was done, what is stuck, what needs the boss, pending issues and counts, under the headings the
  boss set. Each project is checked against its chat space, git history, task docs and shared trackers by its own
  agent, last week's report is carried forward and closed or kept item by item, and the result is drafted in Chat
  format and sent to the lead. Fires on "weekly report", "weekly update for KL", "what do we report to HL",
  "what do I feed KL this week", "run the weekly report", "find what to report", "report everywhere here and
  there", or a boss's ask for a summary report of all projects. NOT for a release note or one project's progress
  post to its own space (`gchat-format` or `ship`), NOT for a personal huddle or timesheet row, and NOT for
  watching a tracker for replies (`watch-sheets`).
---

# Weekly report

A boss's weekly report is a count of what the team owns, not a diary. It is read for three things: what the boss must act on, whether any project is in trouble, and whether anything was dropped since last week. Everything here serves those three.

## Sources live outside the skill

Read `~/.claude/references/weekly-report/sources.md` first. It names the projects, each one's repos, chat spaces and trackers, the boss's headings in his own words, who the report goes to, and what the user said to leave out. If it is missing, build it with the user before gathering anything: the headings come from the boss's message (quote it), and the sources come from the project docs and `spaces_list`. Previous reports sit beside it as `<yyyy-mm-dd>.md`.

## Gathering

**Start from last week's report, not from a blank page.** Every pending item it listed is either closed (with the source that closed it), still open, or explicitly dropped by the user; none disappears silently, which is how a weekly log quietly fails (Sentra's WBR guide: "actions get raised in the room, recorded in someone's notes, and never come back"). On the first run there is no baseline, so say so.

**One `haiku` agent per project, in parallel** (📖 `../haiku/SKILL.md`). Each brief: run `read-summary` on the project's current state; read its chat spaces and the last 7 days of commits on every branch; count its tracker rows by status from the sheet itself; check last week's items for that project; then mark each line of a draft you give it CONFIRMED, WRONG or UNVERIFIED with a source (file:line, commit, chat time and author, sheet row), and list what is MISSING under each heading. Give the draft, because verifying a claim catches more than asking an open question. Ban writes and sends in the brief.

**Verify what comes back before using it.** Open two or three cited sources per project, prioritising any figure that changes a count or a "needs the boss" line. Three corrections the 26/11/2026 run needed are the usual kinds: a date the client tracker had since moved, tracker rows already closed and still listed as open in a task doc, and work credited to the wrong person. An agent's "superseded" claim needs reading too: a total is not an unanswered count.

## What goes in

- **Done**: outcomes per project, credited to whoever did them (commit authors, not the doc's narrator). A project with no code shipped says so in one line and names what moved instead.
- **Status**: on track, at risk, or waiting on someone, one word per project with its reason. At risk means a date is exposed while work can still move; waiting means nothing moves until a named person acts (Atlassian's and Linear's updates use On track / At risk / Off track; neither defines them, so the definition above is ours).
- **Pending issues**: every open item has one owner, the person who acts next, and the count is per project and summed. A cause nobody has confirmed is written as "not yet confirmed" with who will confirm it, never a guess (same WBR guide).
- **Client items carry no dates**, only "may need a follow-up" and with whom: client dates move week to week, and the line stays true until the input arrives (Syafiq, 26/11/2026).
- **Needs the boss** holds only what the boss alone can settle. A business question the client must answer goes on the client tracker, not to the boss.

Leave out what `sources.md` lists as left out. Proposals stay proposals: "suggested", never "decided".

## Sending

Draft through `gchat-format` (the user asked for its document shape, not `casual-message`, on 26/11/2026): `**bold**` heading per section, `- ` items, each message under 1,000 characters, split at headings. Open the first message with the user's own line in their voice; ask for it if this week's mood differs. Preview every part, show them all in one reply, then send in order to the recipient `sources.md` names. A denied part stops the parts after it.

After sending, save the sent text as `~/.claude/references/weekly-report/<yyyy-mm-dd>.md`, with each pending item on its own line and its owner, so next week starts from it.
