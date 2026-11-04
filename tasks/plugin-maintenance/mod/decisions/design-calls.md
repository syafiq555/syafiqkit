<!--LLM-CONTEXT
Status: decision record for the mod; current state lives in `../current.md`
Domain: plugin-maintenance (mod, design-calls)
Gotchas (critical): Desktop refuses a repeated key or a long hover scope with a blank pane and no error (see D-tree-check)
Related: `../current.md` (index); sibling themes `builds.md`, `enhance.md`, `live-checks.md`, `pictures.md`, `session-history.md`
Last updated: 2026-11-04
-->

# The Mod: Design calls

Decisions with their reasoning, most of them the user's calls. Routed from `../current.md` § Key Technical Decisions.

## Key Technical Decisions {#decisions}

### D-mod-in-main-plugin: Mod lives in the main plugin
- Who decided: the user, over the recommendation of a separate opt-in plugin.
- Also: mitigations are `SYAFIQKIT_MOD=0` and a changelog line naming the version floor.
### D-hub-marker: Main doc is marked by hand with `(hub` in the `Domain:` line; no skill writes it · 2026-10-12
- Who decided: the user, over making `task-summary` write the marker when it splits a domain.
- Why: the bare word "hub" is not enough, because autorentic names a screen "detail hub".
- Also: split domains elsewhere (insighter, autorentic) show no main doc until someone adds the marker. Pressing a folder name still only folds it (no "open main" button, also the user's call).
### D-handoff-file-location: Handoff is a file per project under `~/.claude`, not `$.store` or the repo [removed in 1.414.0]
- Why: `$.store` gets and sets are not atomic across sessions; `.claude/handoffs` was not gitignored in the repo checked.

### D-handoff-claim: A claim writes `claimed:<nonce>` to `<id>.state` and reads it back [removed in 1.414.0]
- Who decided: the user; a Windows-off alternative was built and reversed.
- Why: the host's `$.fs` has no move or delete, so the atomic `mv -n` was dropped for Windows support.
- Also: two sessions pressing Resume at the same instant can both win; a failed send writes `open` back.

### D-handoff-supersede: A session saving a second handoff supersedes its first; its own handoff is hidden until `/clear` [removed in 1.414.0]
- Why: otherwise old test handoffs resurface; `/clear` is the case the handoff exists for, and module state survives it.
### D-summary-haiku: Summary comes from haiku over a trimmed transcript, not `$.model.fork`
- Why: fork always runs the session's own model, and a cache belongs to one model.
- Also: the transcript is messages only, 60,000 characters, 1,500 per turn.

### D-resume-read-summary: Resume always begins `/syafiqkit:read-summary`, with the topic when no doc exists [removed in 1.414.0]
- Who decided: the user; that line is mandatory.
- Also: the paste is rebuilt at press time with live git state, and the confirm shows the same text.

### D-one-press-actions: Commit, Done, Refresh, Shrink, Condense and Split are one press; Commit and push, Push, Ship and Merge ask first · 2026-10-27
- Who decided: the user, on the Done confirm: "why need this unnecessary confirm".
- Why: only what publishes (push, ship) or deletes source docs (merge) keeps a confirm, since the rest publishes nothing and the doc passes snapshot first.
- Also: a dirty or untracked doc has no git copy; product review (2026-10-27) recommended no confirm for that case either. The confirm on Done earlier followed a wrong click on Wrap up. Changed in 1.414.0, where Hand off and its confirm add-on were removed.
### D-list-current-only: Only `current.md` is listed; decisions open on their own page with Prev and Next
- Who decided: the user.
- Why: decisions are not needed in the list, and inline was crowded.

### D-doc-appears-once: A doc appears once in the list; a recent doc leaves its folder, an over-limit doc stays in its folder with a yellow `⚠`
- Who decided: judgement, so folders start open. The user answered neither option; one constant flips it.
- Why: the user found the list cluttered and repeated (one doc up to three times, folder name on every row).
- Also: four research rounds found no source on a rule for an item in two sections, a collapse default or a row threshold. Verified only: Linear and MUI sticky group headers, Notion's per-group toggle, GitHub Projects' one-group-per-item.

### D-scope-column: Scope column kept on recent rows, filter matches, the over-limit view and CLAUDE.md rows; dropped where a folder header or group name already says it
- Why: those rows have no header above them.
- Also: warning text comes first in a row's tail, so a narrow pane clips the status, not the warning.
### D-tables-to-bullets: Tables become bullets in the reader
- Why: `Markdown` draws wide tables badly in a narrow pane.

### D-es-modules-folders: One source tree of ES modules in folders by concern, loaded from `mod.js` with no build step · 2026-10-19
- Why: until 2026-10-19 the fragments were joined by `build.sh` into `register.js`, on the belief that `$` cannot cross files. cc-intelligent-ui showed the host follows imports and only requires `$` to go into function declarations (`pictures.md`).
- Also: the user disliked numeric file prefixes. Folders follow haiku research: small projects stay flat until a concern has three or more files.

### D-resume-keyword-check: Resume keeps the keyword check (ship, push, merge, delete, deploy, drop, reset) before previewing [removed in 1.414.0]
- Who decided: the user, over always previewing.
- Why: generated text with no such word goes out in one press.

### D-merge-asks-first: Merge docs stays a button that asks first
- Why: the merge skill picks the files, so the effect line cannot name them.
- Also: accepted.
### D-model-per-action: Shrink runs `condense-*` through the `haiku` skill; Refresh already runs on haiku; Commit stays on the main model
- Why: condense is mechanical; commit judges which staged files are the session's.

### D-changes-toolbar: `/changes` tree rows carry no buttons; one toolbar acts on the selected file or folder
- Who decided: the user asked for the buttons to sit somewhere fixed.
- Why: the user found a button on every row cluttered.
- Also: `s` stages or unstages, `d` discards, and each diff header on the right keeps `+`/`−`/`↶`. Selecting a folder (press its name; the `▾` collapses) brought folder staging back after the first toolbar dropped it.

### D-tree-order: Tree order is Staged first, diff column order is Changes first; the right side opens on Changes only when anything is unstaged
- Who decided: the user asked for both orders.
- Why: the harness stages every write, so Changes is usually empty, and an empty `Changes only` would read as a blank pane.

### D-discard-working-side: Discard is offered for the working-tree side only; a staged file is unstaged first and the toolbar says so
- Who decided: the user chose that over a single Discard that removes staged and working edits.
- Also: Discard always asks, naming the file, and on an `MM` file leaves the staged half.
### D-no-commit-button: No Commit button inside the pane
- Who decided: the user, who found it not needed.
- Also: the band's Commit (which asks Claude to write the message) stays.

### D-gallery-keep: The gallery keeps its images until Clear (not reset on `/clear`), and the pane never opens by itself on a `show_image` call
- Who decided: the user chose both.
- Also: cap is 12 images, newest kept.

### D-gallery-stack: The gallery is one scrollable stack, newest first, not Prev/Next
- Who decided: the user, after pressing Prev and Next on 8 images and nothing changing ("also nothing happens").
- Why: show all in one pane and scroll. Newest first because the freshest screenshot is what the user opens the pane for.
- Also: the dead buttons were not reproduced. The header text moved ("7 of 8") while the picture seemed to stay, and the picture's `key` was the same for every image, which is the likely reason; each picture's key now carries its path. Clear has no confirm yet.
### D-sips-shrink: A picture too big for Desktop's `Svg` is drawn from a smaller JPEG copy made with macOS `sips`, in a Desktop session only · 2026-10-11
- Prompted by: the user, who saw big pictures fail in Desktop and asked "can we have image shrink or something for the big one only" (2026-10-11).
- Why: reverses the earlier "not shrunk" call.
- Also: the cost the first call weighed is real and goes in the changelog: a new command (`sips`) and new writes under `~/.claude/doc-pane-cache`. Off macOS, `sips` is missing and the picture falls back to the viewer button. Copies accumulate per path and are not pruned.

### D-windowed-pages: Long pages are windowed, not budgeted: every file open and read, only about two screens drawn (`windowedRows`)
- Who decided: the user rejected budgets and collapse ("every file's diff is reachable").
- Why: budgets and collapse hid diffs behind "N files collapsed to save room", and they still froze Desktop.
- Also: research (verified): GitHub cut "eight components per diff line to two" and keeps "only about 100 rows real at once"; VS Code's multi-diff editor virtualises; the native Desktop Changes panel virtualises its file list and fetches patches only for expanded files. Desktop does send `ui.scroll` (seen in a trace; an earlier read of zero events came from an old module).

### D-diff-reads-focused: Diffs are read only for the focused, open files (no count cap since windowing) and cached per file by status plus `numstat` line counts
- Why: user screenshot, 238 files. 100 diffs were read up front whatever was focused, and each 2 s refresh that saw a change cancelled the load and discarded finished batches, so only file names ever drew.
- Also: a file with no line counts (untracked, no HEAD) is always re-read, and pressing a section, folder or file forces a re-read. Research: GitHub Desktop reads one selected file's diff; VS Code throttles refresh to one running plus one queued. Not built: one `git diff` for many paths, poll back-off.
### D-doc-button-any-path: `Doc` opens the reader for any doc-type path, with no docs-list membership required
- Who decided: the user. Doc-type files (CLAUDE.md, project docs, task docs and their decisions) open in the task-docs reader, and Back must return to where they were. Non-doc markdown such as agent files gets no button.
- Why: both reviewers found the first build (list lookup, cached once) gave a button that toasted `Not in the docs list` for new files and nested repos. A button gated by one rule and acting by another is a dead end.
- Also: every press re-runs `discover`. A doc it does not list (nested repo, file created this session) gets a doc record built from the path and a `decisions/` listing. A decisions file opens on its decisions page under its `current.md`.

### D-narrow-view-button: On a narrow pane, a separate `view` button opens a group's diffs; the section or folder name still folds · 2026-10-11
- Who decided: the user chose a button beside the name.
- Why: research found no product that opens a group's diffs from a name press or splits chevron from title (lazygit, VS Code, Zed and Gitea fold on a folder press and open diffs from a file press; Azure's tree root and Sourcetree's folder are the only group-level views, Sourcetree's buggy), and none with a narrow-width branch. So this is judgement.
- Also: pages keep `autoFocus` on their first button in Desktop too, because without it the first click after a page change is lost.

### D-desktop-diff-hex: Desktop diff colours are fixed dark hex (`DESKTOP_DIFF`), and diffs are tinted rows, not the host's `Code format:'diff'` drawer
- Why: the theme colours drew solid bright blocks the user found hard to read.
- Also: the `Code` drawer was the first plan, but the user found it hard to distinguish next to the native Changes panel ("native changes much more easier to see"). Fixed hex is unchecked on a light-theme Desktop.

### D-own-tokenizer: Code is coloured by the mod's own tokenizer, not the host's `Code` highlighter; Blade stays plain, markdown is lightly coloured, PHP `$variables` stay white · 2026-10-12
- Who decided: the user asked for "proper syntax color rather than white only", pointing at the native Changes panel. Blade, variables and markdown were the user's calls after the product review.
- Why: three `Code` builds were seen in Desktop on 2026-10-12, and all failed. (1) One `Code` per line drew a bordered box with a copy button on every line. (2) One `format:'diff'` block per hunk drew plain red/green text with the raw `@@` line and no keyword colours or line numbers. (3) One `Code` per run of same-kind lines drew ragged boxes that cover the row tint. The user then showed the native panel ("the green/red background have to also be there, like this").
- Also: Blade plain rather than mis-coloured (HTML tags, `{{ }}` and apostrophes in text go wrong as PHP); variables white to match native; markdown lightly coloured.

### D-desktop-design: Desktop design: native buttons, tinted strips, chips, a change map, gauges; the terminal untouched
- Who decided: the user asked for a Desktop that "looks very nice and easy to use, compact while retaining context, can also get wild", and chose "Go wild", `view ›` and all five surfaces.
- Why: a probe settled what Desktop accepts. Text inside a Button loses colour, so clickable map blocks are coloured Boxes around plain Buttons.
- Also: every hex value lives in `DESKTOP_TONE`/`DESKTOP_DIFF`, and the parts in `views/ui.js` read them.

### D-tree-check: A Desktop tree is checked before it is drawn; a repeated key or a long hover scope draws an explanation page, and size is only logged
- Why: Desktop refuses these silently (blank pane), and the kit accepts them.
- Also: size is logged, not refused, because the docs say only that text past 100,000 characters is cut, and a 108k page drew while a 103k one didn't.
### D-several-repos: Several repos: stacked headers with counts, one repo's tree open at a time (accordion), hand-added repos last for the session only
- Who decided: the user chose stacked-per-repo and session-only.
- Why: VS Code scans one folder level by default (`git.repositoryScanMaxDepth` 1), opens nested repos independently, and stage-all is per repo. Fork refuses to scan inside repos for speed. GitKraken, Fork, Sublime Merge and lazygit show one repo at a time.
- Also: stage and discard act in the active repo. `✕` only forgets (hides) a repo. No source states what removal does to files, so the button says it only forgets.

### D-claude-md-chain: The CLAUDE.md chain covers walk-up files, nested files and companion folders, in four foldable sections with one 200-line limit (1.394.0)
- Prompted by: the user saw three rows (196/200, 128/200, global 250/200) and asked "this claude.md not enough, where the other claude.md, companions, or nested claude.md?"
- Why: the global file overflows into `~/.claude/.claude-companions/shared`, which the panel never listed.
- Also: chosen design is the companions folder plus nested files, with the same 200 limit for companions. Nested scan is capped (4 levels, 400 folders, vendored folders skipped) so a big tree cannot stall the pane. Companions reached only through a `📖` pointer elsewhere are not followed.
### D-doc-list-rows: Doc list rows show only what needs attention · 2026-10-19
- Prompted by: the user found the 53-row chain list "a bit hard to read" (screenshot: a bar and `24 d ago` on every row, names cut at 26 characters) and could not see the local companions at all.
- What changed:
  - Companion names drop `CLAUDE-` and `.md`; long names cut in the middle.
  - The line figure is right-aligned and dim unless at 80% of its limit or over.
  - A bar only at 80% or over (also over on bytes alone).
  - Age only within 7 days, except in Changed lately, search and over-limit lists.
  - Companion sections sort over-limit then near-limit first.
  - `.claude-companions/local/` (project and global) listed as two "this machine only" sections.
  - Scopes are `project companion`, `local companion` and `local project companion`, which fit the 23-character scope column.
  - A `companion: true` flag replaces scope-prefix checks.
- Why: research found dust colours only its largest folders (github.com/bootandy/dust, checked); a bullet bar is for one reading, not 55; truncation goes where text is least distinctive (Maersk design system, agent-fetched).
- Also: review found the old `companion (this project) · local` scope clipped to `companion (this projec…` in flat lists, so a local file read as shared. Not built: a near-limit count in section headers, full age on hover.

### D-wrap-up-chips: Wrap-up chips replace the band's Commit and Done buttons · 2026-10-22
- Who decided: the user's mockup offered three chips, a pipeline or one summary chip; they picked the pipeline, then chose chips-as-buttons over a strip beside the buttons, every-step amber over latest-only, and blue running over yellow (yellow is "edited since").
- What it does: one joined strip `○ done ○ commit ○ push`; a press runs the step; an edit turns every finished step amber; running is blue `◌`. The model · folder · branch · ctx line stays in the user's own status line script.
- Why: research (haiku, URLs fetched and spot-checked). GitHub Desktop's button reads "Push origin" only when something waits, the one product that merges state and action. starship, Powerlevel10k, VS Code and lazygit keep status apart from actions. Graphite's "needs restack" flags every branch above a changed one. Powerlevel10k greys its last-known git status while recomputing. Atlassian Lozenge: "Don't use color alone to signify an important attribute", hence the marks beside the colours.
- Also: no source covered a completed-then-invalidated step; that call is judgement.

### D-quiet-tools: Ship chip, then a band revamp: "quiet tools, loud progress" · 2026-10-23
- Layout: `▤  e: enhance  d: docs  g: changes N  │  w: ○ done › c: ○ commit › p: ○ push › s: ○ ship`.
- Prompted by: the user asked for ship beside push (a push is not a release where a pipeline and release note follow), then said Menu and Hand off are rarely used and asked for a revamp.
- Who decided: the user chose this over "two groups, progress right-aligned" (wraps badly when narrow) and "progress only, tools behind one key" (an extra press for Enhance and Docs).
- What changed: Menu and Hand off buttons removed; tools are dim `plain` buttons so each shows its key; the chips lose their terminal background and gain ` › `.
- Why: the screenshot showed the hierarchy upside down, with bold bracketed tools and dim status.

### D-band-under-prompt: The band stays hidden under a long prompt; the answer is ctrl+g (edit in VS Code), not a mod fallback · 2026-10-29
- Prompted by: the user reported the band gone with a pasted ~18-row prompt.
- What happened: four builds moved the band under the prompt.
- Who decided: the user. Offered a status text on the host's footer line instead, the user chose to undo everything and use ctrl+g.
- Why: a forced draw showed rows under the prompt are cut too, so no mod row survives (mechanism in `hooks/CLAUDE.md` § Drawing). Research: no product or design system checked keeps a full toolbar while an input grows; lazygit hides its options line but still shows a loader for a running action, and Brad Frost's priority+ argues for a visible trace of hidden items.
