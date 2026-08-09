# Knowing a Peer Session Exists Before You Write

Referenced by skills that write files another session might be writing too (read-summary, task-summary, update-claude-docs, condense-task-doc, merge-task-docs, update-plugin, done, quick-done). Apply at the start of a session, not when a collision surfaces.

Two Claude sessions on one project overwrite each other silently. `diff-ownership.md` and `contested-doc-sections.md` handle this after the fact — they read the peer's bytes out of `git status` and invert the overwrite mandates. That detection is disk-bound, so a peer who is mid-edit, or holding changes in memory, does not exist yet as far as those rules can tell.

[Cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging) (Claude Code 2.1.224+, macOS/Linux) closes that specific gap and nothing wider. `ListAgents` lists the sessions reachable from here; `SendMessage` delivers plain text to one by name.

**Rule:** treat a peer's existence as information and a peer's reply as a courtesy. Neither one gates a write — the diff-content check still decides.

## The check

`ListAgents`, once, early. Local **interactive** peers are the ones that matter: they can be messaged in both directions, and one of them is what a concurrent writer looks like. Rows marked `Remote Control` are reply-only — you cannot open a conversation with them, so they are noise for this purpose.

**Expect that noise to dominate, and don't read the total as a concurrency count.** A `Remote Control` row is a resumable session reachable through Anthropic's servers — your other machines and Claude Code on the web — so the listing accumulates history rather than showing what is running now. One call here returned 81 rows of which exactly **one** was a live local session; the rest were past conversations, recognisable because their names are first-message titles (`Fix login button on mobile`, `Session interrupted by user`) where a live local session gets a folder-derived name like `dourr-a2`. Filter to local interactive first and the number stops mattering.

When an addressable peer exists, say so rather than acting on it silently, and send a one-line heads-up naming the exact path before anything destructive: a `## Quick Start` rewrite, a `## Last Session` overwrite, a restructure of a file this session did not create. Then proceed per `contested-doc-sections.md` and `diff-ownership.md` whatever comes back.

⚠️ **An empty listing is not evidence that nobody else is writing.** The session that authored this file watched three files in its own checkout change mtime within the preceding minute while the only local interactive peer sat idle in an unrelated project — the writer never appeared as an addressable row. So a quiet listing lowers the odds and settles nothing; it is never grounds to skip the diff-content check, and where a listing and `git status` disagree, `git status` is the one that observed a write.

⚠️ **Discovery is weaker than it looks, and the failure is a confident wrong answer.** The two surfaces differ: the `/list-agents` command prints each local session's working directory (`dourr-a2 · /Users/…/Herd/dourr`), while the `ListAgents` **tool** returns name, kind, status and ref with no directory at all. So a session driving this itself sees less than a user running the command does, and cannot answer "who else is in this project" from the tool alone. The cwd it does add is also thin cover — it appears only for local rows, whose names usually identify them anyway (names default to the folder; `/rename` makes it explicit), and never for the Remote Control majority. Where a name doesn't identify a peer you know only that *someone* is live, which is still worth knowing and is the whole of what you know. Do not infer a peer is safe to ignore because you cannot see where it is working.

## Why a reply cannot be a gate

Delivery is best-effort in ways that are invisible from the sending side:

| | |
|---|---|
| Receiver is **busy** | Reads it only when its current tool call ends |
| Receiver is on `bypassPermissions` and you are not | Message is **held** behind a dialog that expires (default 5 min), then **dropped**; the held queue is separate and caps at 100, dropping oldest |
| Receiver set `crossSessionInbound: refuse` | Dropped, and a refusal on arrival produces no sender-side notice at all |
| Repeats | Rate-limited per sender; identical repeats within a short window deduped |
| Receiver is just slow to read | Accepted-but-unread messages cap at 50 per session — a different queue from the held one above |

So silence is ambiguous between "no objection", "never read it", and "never arrived", and those are indistinguishable from here. Waiting on a reply converts a cheap courtesy into a stall. Messages carry plain text only — never files, never conversation history — so nothing about the peer's actual working state comes back either.

Two further limits worth knowing before building on this: a message cannot approve anything on the receiver's behalf or change its configuration, and asking a peer to run what your own permissions forbid is off-limits — route that back to the user instead.

## What this does not fix

Subagents spawned inside one session — a fan-out of build agents, `/done`'s simultaneous simplifier and reviewer, parallel version bumps — are not a cross-session problem, and messaging is the wrong tool reached for by name similarity. Those races are handled where they occur: disjoint file partitions, and re-reading a value immediately before writing it rather than trusting a read from the start of the turn.

It also does not give a project's **source files** the protection its docs get. `diff-ownership.md` and `contested-doc-sections.md` govern task docs and CLAUDE.md, and nothing equivalent watches arbitrary application code — so on a source file a peer's existence is the whole of the warning, and what follows is ordinary care: read before you rewrite, keep edits small, and prefer a second question to an assumption about who owns what.

This file is about a *peer session* you did not spawn. `diff-ownership.md` decides whose a change is once it is on disk, and `contested-doc-sections.md` says what to write once a doc comes back contested; this one is only about learning a peer is there first. All three can apply in the same run, and none implies the others.
