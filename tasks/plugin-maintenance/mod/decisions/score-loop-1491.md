<!--LLM-CONTEXT
Status: ✅ Stopped at round 2: retained 19/20 and fresh 19/20 (9b Desktop unassessed), meeting the owner's 18/20 rule, 27/11/2026
Domain: plugin-maintenance (mod)
Related: `../current.md` (row 46)
Last updated: 2026-11-27
-->

# Score loop: task docs from parent folders (#39, 1.491.0)

## Brief {#brief}

GitHub issue #39 (Munajaf, v1.479.0): `/task-docs` looked only in `<session folder>/tasks`, so once the agent `cd`'d into a code repo or `tasks/x/v2` inside a workspace, the Task docs section vanished with no message. Owner's calls, 27/11/2026: look upward for `tasks/`, stopping at home ("Look upward (Recommended)"); when the session folder and a parent both have `tasks/`, show both, nearest first, the parent folded ("Both, parent folded (Recommended)"), chosen against "both open" and "nearest only plus a show line". Research behind it: Claude Code loads CLAUDE.md "from your current working directory and every directory above it" (code.claude.com/docs/en/memory, read 27/11/2026); Google Drive keeps others' items in their own labelled section; Linear keeps out-of-scope teams in a separate "Exploring" group.

Owner's calls at the /done question round, 27/11/2026: also look one folder down ("Yes, one level down (Recommended)", against the nested CLAUDE.md scan's 4 levels and against leaving it out); show the session folder only when the docs come from a parent ("Only when docs come from a parent (Recommended)"); keep Rules and Project docs nearest-only ("Keep nearest only (Recommended)"); move the "plan names the score-loop pass" rule into `read-summary`'s build-plan step ("Move into read-summary", chosen over a reminder hook).

## Stop rule {#stop-rule}

The owner's: 18/20 or 4 rounds, whichever first. From round 2, the round 1 judge is kept beside a fresh one; both must reach 18 in the same round. Judges on Sonnet, report-only, with a code reviewer on the round's diff in the same batch.

## Rubric (frozen) {#rubric}

Ten criteria, two yes/no checks each (N/20):

1. Subfolder with `tasks/` only above: (a) the section shows, (b) with every doc.
2. Both levels: (a) two sections, nearest first; (b) the parent folded by default, unfolding on press and remembered.
3. Source labels: (a) the parent heading names the folder; (b) Changed-lately rows from a parent carry `parent: <name>`.
4. Session folder's own `tasks/`: (a) heading and rows identical to before; (b) no regression in existing behaviour (keys, fold keys, filter).
5. No `tasks/` anywhere: (a) the empty-state line shows; (b) it names the folder and says "or above".
6. Rules and Project docs: (a) found from a parent, (b) labelled.
7. The walk stops (a) at home and (b) at 12 levels; home's `tasks/` is never scanned from below.
8. (a) Fold and element keys don't collide across roots with the same folder name; (b) hover scopes stay at 64 characters or fewer.
9. Live screenshots correct in (a) the terminal and (b) a Desktop **New** session.
10. (a) Kit tests cover cases 1, 2, 5 and 6; (b) no new `$.` host call, and discover adds no file reads (folder lists only).

## Conventions {#conventions}

- `tasks/` folders deeper than one folder below the session folder are out of scope, not a defect. The one-level-down scope arrived after round 1, so round 2 is a new baseline and adds it under criterion 1 (a child repo's `tasks/` shows, labelled `nested: <name>`).
- Desktop is judged only from a screenshot the owner supplies.
- A `claude plugin test` timeout under machine load is re-run before it counts.
- A session in home itself still reads home's own `tasks/` (the behaviour before the change); only folders above home are never read.
- A session outside home (`/tmp/x`) still walks up, like the CLAUDE.md chain (main session's call, 27/11/2026).
- `check-render` cannot run: the pane is not a web page.

## Rounds {#rounds}

| Round | Score | Judge | What it found | Fixed |
|---|---|---|---|---|
| 1 | 18/20, 9a and 9b cannot assess | fresh (Sonnet) | No point lost. Nits: same-named parents merge into one section; no 12-level test; no Desktop assertion for the parent label on recent rows | Grouping by root; a Desktop label test added |
| 1, code review | (not scored) | Sonnet | cwd === home walked above home; an image-only `docs/` hid the parent's markdown; grouping by label merged roots; fold-by-default counted every root; the empty line could wrap | All fixed, two tests added |
| /done reviews | (not scored) | Sonnet | Fold default applied to every section from the nearest section's count; a Desktop test passed only because an earlier press carried over; CHANGELOG "never your home folder" was wrong for a session in home; a `HOME` ending in `/` skipped the stop | All fixed (fold default per section, test reordered, wording, trailing slash stripped); 151 kit tests pass |

| post-/done review | (not scored) | Sonnet | Symlinked child repos skipped; the session-folder note inside the wrapping top row could add an uncounted line; home scanned its children | All fixed (links accepted, note on its own counted row, no child scan in home with its own wording); 152 kit tests pass |
| 2 | retained 19/20 · fresh 19/20, 9b cannot assess | retained (round 1 judge, rescored every check) + fresh (Sonnet) | Evidence: owner's five iTerm2 screenshots of `/tmp/k39` (ws/fe folded and opened, ws/tasks/billing/v2 with the session line, mono with two nested sections, solo/sub empty line). Retained closed its same-name and Desktop-label items; no closed item found again by the fresh judge. Both asked about `▾ nested: fe` open in the mono shot: the kit test asserts it starts folded and passes, so it reads as a press. Nits: a 12-level test (added, 153 pass); retained asked to stop following symlinked repos, a reversal of the post-/done fix, not built | Stop rule met |

| second /done | (not scored) | Sonnet | The folder lines read `state.cwd`, which `discover` sets even when a stale load's docs are dropped; the 12-level test pinned only the upper side; CHANGELOG said "the nearest folder above" though every parent up to 12 levels shows | Fixed (`state.docsFrom` set with `state.docs`, an 11th-folder test, wording); 154 kit tests pass. Not changed: a top-level doc grouped under a `tasks` folder row and alphabetical child order (behaviour from before this change) |

Not run: a Desktop **New** session screenshot (9b).
