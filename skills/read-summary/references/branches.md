# Read-Summary Branches

Opened at the moment the pointer in SKILL.md names. The text below was moved out of SKILL.md. Each rule it belongs to, and that rule's **Tell**, stays in SKILL.md.

## Scanned and image-only copies {#scanned-copies}

A document the work rests on that exists only as a PDF, scan, photo or screenshot (a contract, spec, invoice, signed form) gets that copy made first with `doc-to-md`, which reads scanned and image-only pages through OCR and keeps each scanned page as a picture for its diagrams, before any claim is quoted from it: a `pdftotext` copy of a scan comes back blank with no error, and a page you only looked at leaves nothing to grep or diff. A bug screenshot or a single page you only glance at needs no copy.

## Investigation details {#investigation}

Video soundtrack, the parenthetical after "extract and transcribe the audio before diagnosing": (reuse an installed speech-to-text model, such as the `mlx_whisper` that `motion-clip`'s setup installs, before installing another).

Where-do-I-get-X answer, the story after "a fee-breakdown answer named one export": (25/11/2026: a fee-breakdown answer named one export, and the user asked "are u sure this is the only way?" before a monthly summary screen in the same menu turned up).

Status list built from chat or tracker text, the story after "had 4 of 9 rows wrong": (28/11/2026: a stuck-rows list drafted from each tracker cell's last lines had 4 of 9 rows wrong, one a "list all products" row whose products had been live for 11 days; the user stopped the send with "when reading chat always verify via task docs").

Screenshot saying something was shared, the story after "sat on the tracker row": (26/11/2026: a turn closed asking the user to paste a link that sat on the tracker row, and the user answered "u didnt check i think this got inside the tracker").

Live-system check, the clause after "before it is listed": where a per-item status names live data, the live system is checked too. The `unblock` hand-off reads every open item whole, checks each against live sources and names what it did not check.

## Study a tool or feature {#study-a-tool}

A prior decision to wait on X is input, not the answer: when its blocker turns out gone, ask what that unlocks. A vendor's docs page can lag its own release notes, so read both (for Claude Code, its CHANGELOG; 22/11/2026 the Code Mode page still listed a refusal two releases after the changelog dropped it).

## Meeting record {#meeting-record}

Dated figure after "written into a plan is a question nobody asked": (24/11/2026: a plan marked six of thirteen deck questions "not discussed" and came back with "ask me all not discussed one").

Auto-summary story, after "checked against the code before it becomes a build item": one asked to remove a download button from two screens that had none. The meeting's decision list may be a deck, a board or an agenda; the transcript is walked block by block.

## Build-plan research brief {#build-plan-research}

The rest of the brief for each item's haiku agent, after "the governing decision records and spec rows": the code it would touch with file:line, and how strong products handle it, with a URL per claim. Spot-check the claims against the files, fold what holds into the plan, then build. A plan drafted from the task docs alone reads as researched because it cites them. The user asked for this pass on every build.

Open decisions that research surfaces get their own pass on how others handle each choice (📖 `../../_shared/references/decision-first-output.md` § Earning the decision).

## Plan mode {#plan-mode}

Research passes that run in plan mode: A `uiux` research pass, a `design-handoff` read or a `haiku` research agent is read-only and runs in plan mode; skipping it there is the same miss (27/11/2026: fresh judges flip-flopped for four rounds).

Settled-list rule, after "never re-run by hand from the task doc's rubric": a loop run by hand skips the skill's own rules, such as the settled list that stops a later judge reversing an earlier one.

## Spec rows and product behaviour {#spec-rows}

Spec-silent cases, the parenthetical after "the spec often settles it": (21/11/2026: dashboard access asked bare, answered by the BRS row "Permissions are independently configurable by function and data scope"; 22/11/2026: a returns line, order-list rows and status colours were each asked bare mid-build and sent back as "Check brs", "Research rbs", "Research", then settled by BRS M12.16, BRS M9.20 and three design systems).

Points-back case, the parenthetical after "not ask again": (24/11/2026: four of five questions called the spec silent after reading only each item's row came back "follow rbs", and maker-checker, seller-portal, downstream-reconcile and least-privilege rows in other modules decided all four).

A build feels researched because its items were, while each decision it surfaces is asked from the codebase's current state, and the spec often settles it (the 21/11 and 22/11 cases above).

Researched-default case, the story after "a researched default is the easiest one to send": (25/11/2026: a split link window was recommended from a competitor's help page, built, then reverted over the signed quotation's "within the same attribution window as product links".)

## Unused item: why before what {#unused-item}

Examples of what nothing uses: a template with no sender, a notification with no dispatch site, a job no schedule runs. Before offering to build or redesign any of them, find what last used it with `git log -S '<its name>'`, and check live data for whether the moment it would fire ever happens. Put the answer in the question.

## Doc audit {#doc-audit}

Sweep the fields written once and checked least (`Quick Start`, `Status:`, `Immediate next actions`), since those carry the costliest staleness. An offer parked on the user's reply isn't routing: the finding dies with the conversation.

## Skill routing {#skill-routing}

A reply drafted for the user to send goes through `casual-message` even when nobody asked for one (26/11/2026: two inline WhatsApp drafts came back as "use casual-message").

Trigger to skill, for a request that names a second job: UI research → `uiux`; designer brief → `design-handoff`; "I can't read all of this" → `understanding-guide`; a screenshot test that fails with no code change → `setup-playwright`; stopping or changing alerts that arrive with Claude closed → `headless-watch`.

A tool or skill a doc researched gets the same check before it runs: read its source or inputs first. A skill's name states its subject, not the input it needs, so a skill you are about to recommend is checked this way too.

## Project doc set {#docs-set}

`PRD.md` earns its read before you report something as missing, since a "gap" is often a documented exclusion. `ARCHITECTURE.md` is read when the work spans subsystems. A date or status line in these files can lag the task doc; name any lag in your reply.

## Config-value blocker {#config-value}

A superseded integration's section needs a dead label at its heading, or the next reader debugging a live payment lands in the wrong adapter. The adapter, client and credential paths all still read as healthy while the config value is wrong, so each one passes a code read.

## Stash {#stash}

Reserve `git stash` for a merge that needs one path parked. `--keep-index` still takes every *unstaged* file, which on a shared checkout is a peer's in-flight work.

The full ban on stash is in `../../_shared/references/diff-ownership.md`, which only wrap-up and doc skills load. A session that reads docs and then builds meets the command with nothing else loaded, so this line is the only warning it gets. What a file used to contain, whether a failure predates your edits, and which session wrote a line are answered by `git show HEAD:<path>`, `git diff HEAD -- <path>`, `git log -S`, or a second worktree at HEAD, none of which move a byte.

## Upstream check {#upstream}

A checkout can sit behind its remote, so a doc's file that seems missing may exist upstream. Run `git fetch`, then `git log --oneline HEAD..@{u}` and `git ls-tree -r --name-only @{u} -- <dir>` to see what the remote holds under that folder.
