---
name: excalidraw-board
description: Turn a task doc, backlog or worklist into a black-and-white Excalidraw discussion board the team can read cold and doodle on later — columns for now / gated on our own build / waiting on someone else, thick-bordered GATE cards with arrows to what they unblock, a PARKED table with a revive trigger per row, and a right-hand strip for decisions, open questions and actions filled in live. Use when the user says "excalidraw", "whiteboard", "let's draw the plan", "board for the meeting", "something to discuss with KL/HL", "what's on hand, what's deferred", or asks how best to lay out tasks for a discussion. Not for charts or dashboards (that is `dataviz`), not for architecture or sequence diagrams (draw those directly with the Excalidraw MCP), and not for deciding what to build (that is `plan-worklist`; this skill draws a worklist that already exists).
---

# Excalidraw discussion board

A board exists to run a conversation, not to store the plan. The task doc stays the source of truth; the board is the thing three people look at while they argue about it, and then scribble on. That sets every design choice below.

## What goes on it

Read the task doc first (`read-summary`), then sort every item by what it is waiting for, since that is the question a planning conversation actually answers:

- **Can start now.** No dependency on us or anyone else.
- **After we build X.** Gated on our own work. Draw X once as a GATE card (thick border) at the top of the column and let the column header say "after X". One gate unblocking four items is the single most useful fact on the board; a lane called "blocked" hides it.
- **Waiting on someone else.** Each card names who, in the card. A lawyer, a partner's API team, a regulator.
- **Parked.** A table, not a lane: what, why parked, what brings it back, owner. A parked item with no revive trigger is the one that silently dies, so the empty cell is the finding.
- **Done.** Dashed border, at the bottom of the first column. It shows movement without taking space.

The right-hand strip holds three boxes filled during the meeting: already decided (pre-filled from the doc so nobody re-litigates), open questions, and actions as what / owner / date with blank lines left. Strip lines are not wrapped by the script, so each stays under about 58 characters; a longer thought is two lines or a shorter one. If the session ends with a question nobody owns, the board should make that visible.

These lanes are confidence horizons rather than dates, which is the Now/Next/Later idea; the gate-and-fan-out is a precedence diagram in its plainest form; the revive-trigger rule is Shape Up's "important ideas come back" made checkable. That is the research behind the shape, and it is why the columns are named by what they wait for rather than by sprint.

## How it should read

**One point per box.** A card with a title plus a "waits on" plus a size is three facts in one rectangle and nobody reads the second one. The main box holds a short noun phrase; each further fact is its own small box branching to the right. When a card wants three lines, that is two boxes.

**Black and white.** Meaning is carried by border weight (thick = gate, dashed = done) and by position. Colour was the first thing the user asked to remove; it costs a legend and buys nothing a column header does not already say.

**Self-contained.** Spell things out as the reader would say them: "letter of demand" not LOD, "super admin" not SA, "registering with MyDigital ID" not RP registration. A briefing's section numbers or area letters mean nothing to someone who has not read the briefing; describe the area in words and put the letter mapping in the task doc instead. The subtitle names the attendees and what any tag like `#n` means.

**Room to doodle.** The user will draw on it in the meeting. Generous gaps, no background zones, nothing decorative.

## Building it

Generate raw Excalidraw JSON with `scripts/build_board.py` from a small spec; `assets/example-sprint-board.json` is a full worked example. The script sizes every box to its text, lays out branches, draws gate arrows, the parked table and the right-hand strips, writes the `.excalidraw`, and with `--clipboard` puts a paste-ready scene on the clipboard.

```bash
python3 ~/.claude/plugins/syafiqkit/skills/excalidraw-board/scripts/build_board.py spec.json \
  <repo>/tasks/<domain>/<feature>/discussion-board.excalidraw --clipboard
```

Save the file beside the task doc it draws, and add one Quick Start line in that doc saying the board exists, how to open it, and that it is the conversation aid rather than the record.

Then put it in front of the user and look at it yourself: open excalidraw.com in the Chrome MCP, click the canvas, `cmd+a`, `Delete`, `cmd+v`, `Escape`, click empty canvas, `shift+1`, screenshot. Send the screenshot and the file with `SendUserFile`. The Excalidraw MCP's `create_view` paints nothing in Claude Code, so a screenshot is the only proof the board renders, and the first render usually finds one overlap or one clipped heading. Iterate from the spec, not by hand-editing JSON.

Do not upload to excalidraw.com's share link unless asked. The board carries partner names and unshipped decisions, and a share link is publication. 📖 `references/loading-and-traps.md` for the four loading routes, and the traps indexed by symptom (the renderer freeze from a page-side fetch, clipped headings, the MCP that renders nowhere, the JSON you should not `cat`).

## Handing over

Tell the user three things: the tab already has the board, `Cmd+O` opens the file anywhere else, and Excalidraw does not save back to disk, so `Cmd+S` over the same file after the meeting is what keeps the repo copy honest. Live collaboration in the menu gives a temporary shared session with nothing stored afterwards, which is the right way to bring KL and HL in remotely.
