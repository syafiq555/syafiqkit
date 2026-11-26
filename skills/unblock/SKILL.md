---
name: unblock
description: >
  Answer "what can I do now, what's blocked, and what would unblock it" for a project, however large and stale its
  task docs are: every open item across tasks/**/current.md AND decisions/*.md read whole (big docs split across
  haiku agents), each checked against git, the tracker and team chat newer than the doc, sorted into for you, can
  build, waiting on someone and needs your decision, with every doc or source not checked named. Fires on "what's
  unblocking", "what can we do now unblocking", "what's unblocking for me to do", "what's blocked, what would
  unblock them", "is there any development I can do", "so only these are unblocked?", "what else left for this
  project", "what's next?", "is X still blocking", "let's finish all unblocking", typed
  bare or as `/read-summary` arguments. After the answer it builds the "I can build" items in the same session once
  the user says go; reads production only when asked. NOT for a handoff prompt for a fresh session (`continue-session`); NOT for the weekly report to a lead
  (`weekly-report`); NOT for a specific question about one feature (`read-summary`).
---

# Unblock

The failure is always the same shape: a confident list built from the part of the docs that was easy to read. Measured across 60 days of sessions (26/11/2026), the corrections were "So all done ?" (the decisions file held two confirmed, unbuilt items the Quick Start never mentioned), "recheck" three times in one session (the answer came from a doc, not the live system), a tenant app struck off as done while its own repo's doc still said store review, and "production now also not important, i meant development for now". Each answer read as complete and none said what it had not opened.

So the deliverable is a list whose every line says where it came from and when that source was last true, plus an account of what was not checked.

## Scope first {#scope}

Development work, plus the user's own actions that unblock it (a message to a client, a login to hand over), is the default scope. Production releases, ops and client-side work enter only when the request names them; the headline says the scope ("Dev only"), so a wrong guess costs one word to correct. Scope bounds what you read as well as what you list: production (an SSH session, a database query, a live server's logs or `.env`) stays unread unless named, and an item only production could confirm goes under not checked as "production not read". A production fix found anyway is the user's decision, never an "I can build" line. A follow-up like "i mean regarding the md just now" narrows scope to that doc.

Size the run to the question. A bare "what's next?" or "so your part done?" asked mid-session, with a plan and a diff in front of you, is answered from them and one look at chat, not a project audit. A project-wide ask ("what can we do now", "what's blocked", "what else left") gets the full pass below. A repeat ask ("recheck", the same question an hour later) redoes § live-check; earlier rows are not reused.

## Find every open item {#inventory}

Read the project's root CLAUDE.md, `docs/ARCHITECTURE-ESSENTIALS.md` and the folder `CLAUDE.md`s yourself, or continue from them if this session already read them (the usual case when `read-summary` routed here). Do not invoke `read-summary` from here: its routing would send the question straight back. Its architecture essentials and root CLAUDE.md carry constraints that change what counts as buildable, and they name the sibling repos.

A multi-repo product (an app beside its backend, a mobile repo beside a web repo) is one scope. List the siblings from those reads, the docs' `Related:` lines and any folder outside this repo a task doc points at (a bot or script folder kept out of git counts), and take each one's inventory too, or put it under not-checked. A sibling's own doc is what catches an item the main board shows as done.

Then measure the doc set rather than assume it: every `tasks/**/current.md` and `decisions/*.md`, with its size, its last commit date (`git log -1 --format=%cs -- <path>`), and `git status` for docs edited but not committed. Grep the whole set for open-item shapes, body and decisions files included, not only Quick Start: unchecked boxes, 🔴 🟠 ⏸️ markers, a Quick Start "Blocked" line, "Blocked on", "Blocking", "Waiting on", "open question", "confirmed" items with no built counterpart. Headings vary per doc ("Blocking release to colleagues", "Blocked on a decision from Syafiq"), so match by meaning. **The grep picks which docs to read; it never answers.** A line pulled out of its section loses the status note under it, which is how a done item gets reported as open.

A repo with no `tasks/` folder answers from git, the tracker and chat, and says so.

## Read each candidate doc whole {#read-whole}

A doc read in part gets reported as if whole. In the measured sessions, 29 task-doc reads came back cut to a 2 KB preview ("Output too large") and the session carried on from `head -200` or a grep.

**Proof of a whole read is the last line read against `wc -l`.** Anything short of it goes in the not-checked list as "read to line N of M".

- Three or so candidate docs under about 30 KB each: read them inline, no agents. A truncated read is continued by line range to the end.
- A doc over about 30 KB, or more candidates than that: one `haiku` agent per doc in one parallel batch (📖 `../haiku/SKILL.md`). Each returns rows in one shape: item · state (`can build` / `waiting on <who>` / `blocks <what>` / `needs a decision`) · verbatim quote with file:line · tracker card id or link where the doc names one · plus, once per doc, its last line read and its `wc -l`. `none written down` is an allowed answer for every field, so an agent with nothing to report does not invent a blocker. Open two or three quoted lines yourself before relying on the batch, and treat any agent whose last line falls short of `wc -l` as a partial read. A doc an agent read is not read again by you in full: agents or you, never both, or the run costs double and the user waits for it.

## Check each item against what happened since {#live-check}

A task doc is a record of what was true when it was written. The item's real state is in what changed after that date:

- **Git:** `git fetch`, then commits since the doc's date that name the item, on the current branch and upstream.
- **Tracker:** the card's status where the project has one (ClickUp, a shared sheet), read now, not from the doc's mention of it. Keep the card id on the row; the build step needs it.
- **Team chat:** the project's space since the doc's date. Handovers, client replies and "already done" land there first.
- **Sibling repo:** for a cross-repo item, that repo's own doc and git.
- **Peer sessions:** `ListAgents` for live sessions in the same checkout whose names touch the item, and `git log --since=<the doc's date> -- tasks/<that domain>` for their commits. An item a peer is working on is reported as "a peer session is on this" with its name, never answered from the doc or a stale source: on 26/11/2026 a sales file was reported as holding nothing while a peer session was loading those sales and committing docs about it.
- **Config-shaped blockers** ("can't until the key is set"): resolve the value in the dev or staging environment (production only when it is in scope); reading the adapter code confirms the blocker instead of testing it (📖 `../read-summary/SKILL.md` § What Task Docs Are and Aren't).

Each row ends as `still open`, `looks done, doc still says open`, or `not checked` with the reason (no tracker access, chat tool not connected, repo not on this machine). An unreachable source is a gap to name, never a pass. Age alone proves nothing: the suspect row is one whose doc is older than the latest commit, card move or chat message about the same item.

## The answer {#answer}

The first line is the headline: the scope, a count for every group, and the stamp. "Dev only: 2 for you, 4 I can build, 3 waiting, 1 needs you (checked git, deploys, chat at 14:20)." Then one line per item, never a table anywhere in the answer (groups and tails alike), each line, a "later" one included, ending in its source as a short tag (`storefront/current.md:41`, `card 86ex…`, `chat 24/11`, `git a1b2c3`):

1. **For you.** Actions only the user can take: a message to send, a login to hand over, a check on their own phone. Asked "what's unblocking for me", these are often what moves everything else, so they come first.
2. **I can build.** Ranked by what it unblocks for others, then by size.
3. **Waiting on someone.** Who, since when, and what would end the wait. Where the wait is a client answer that blocks a build, say whether it could ship as a setting whose default keeps today's behaviour, so the work moves while the answer is pending; a setting that changes who can see or do something is still the user's call first.
4. **Needs your decision.** Asked straight after the reply through `AskUserQuestion`, each option carrying the spec, quotation or doc line that governs it, quoted. Where that tool is not available (a headless run), write the options out the same way, each with its quoted source and a recommendation (📖 `../read-summary/SKILL.md` § Decision-First on Every Turn After). Before asking, grep the item's `Related:` docs: a question one doc lists as open is often answered in another. A decision whose answer turns on a fact outside the repo (a tax or regulatory rule, a threshold, a vendor's terms) gets that fact researched first and quoted in the option, since a doc line alone puts the research back on the user (26/11/2026: "is SST on the platform fee live?" went out with only the task doc's claim and came back "can research ?").

After the groups, two short tails, each headed with its count:

- **Doc lines that look stale (N):** the line, its file:line, and what the live source says instead. **Report them; do not edit the docs.** The user decides when docs change.
- **Checked and not checked:** first the proof line, always with both halves: "read whole: 9 docs, each to its last line" and "siblings: `<name>` inventoried" (or "not checked", or "none named in CLAUDE.md or essentials"). Then every doc not read whole by its path, grouped by folder when there are many ("tasks/registration/: current.md, decisions/kpp01.md"), with "to line N of M" for a partial read; "a few decision files" hides exactly the file the user will ask about. Then every source not reached, by kind ("no tracker in this repo", "team chat: no chat tool connected", "production not read"). A source left out reads as checked, so "nothing I checked is blocked" is the answer unless this list is empty.

## After the answer {#handoff}

Ask the open decisions first: one `AskUserQuestion` with the four that hold up the most can-do items, and the rest named in the reply as next round. Then offer to build the "I can build" list, through `AskUserQuestion`. "Let's finish all unblocking" is that yes given up front: skip the offer, but still ask the decisions.

On yes, build it here: run `read-summary`'s per-item research pass first (one `haiku` agent per item, 📖 `../read-summary/SKILL.md` § After Reading Docs, Task description), fold the decisions in, build, then wrap up with `done`. A stale line the build itself touches is fixed by that wrap-up like any doc the work changed; the others stay as reported.

For each built item that carries a card id, set the card's status and leave a one-line comment on what changed, then close with "cards updated:" and the list (or "none had cards"); the closing line makes a missed update visible.
