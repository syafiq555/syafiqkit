# Ship step details

Read the section SKILL.md points to, at the moment it names. Each section is the detail behind a one-line rule in SKILL.md; the rule stays in SKILL.md. The incidents behind these details are in `ship-incidents.md`.

## Step 4b: Provider switched from test to live

Where you hold live access, show the user the exact endpoint, events and settings, create them on their yes, and check each where it lives: the endpoint listed and enabled in the live dashboard, its secret and keys on production, and the provider's test event answered with a 2xx where it offers one. Without access, those settings go in the Output's Decisions for the user to create. Spot the switch in the diff, env or task doc: a live key replacing a test one (`sk_test_` to `sk_live_`), a mode flag set to live, or a stated go-live. Providers keep webhook endpoints, secrets and keys per mode, so nothing from test mode exists in live.

## Step 4b: Side-domain for a side project

A personal side project with no real address yet (its first deploy, or still on an sslip.io host or a raw IP) gets one in this ship, once Prod Verify passes: run `side-domain`, which routes `<name>.<umbrella>`, 301s any old host and moves uploads to R2 only when the app stores any. Whether the project is a side project and which umbrella domain it uses come from the global `CLAUDE.md` `#side-domain` (check `git remote -v` against it); a client or employer app keeps its own deploy docs. Leave search hiding as it is unless the owner chose to open it.

## Step 4b: Server-side fixes after a CI failure

A fix on the server itself (an extension, a secret, a firewall rule) goes through `remote` only where the project's docs grant that host; otherwise give the user the exact command and report the deploy failed.

## Step 5: Release-note scope

When the user names the last version they posted ("last posted 1.488.0"), the note starts there however many pushes followed, and a later ship in the same session rebuilds that one note to include its own version rather than replacing the earlier note on the clipboard, unless the user says the earlier one went out. Find the last-deployed version with `git log --oneline <pre-push-SHA>..<pushed-SHA> -- <version-file>`. A note scoped back past this push covers commits already pushed: any that no `/done` Output covered (marked as in `../../done/references/git-variants-by-state.md` § Work Already Committed) go through the Prerequisites review gate before the note is written, since announcing them is releasing them to readers.

## Step 5 item 6: formats the project names

A written format that names bold sections or lists still gets the call, which supplies the syntax while the project's words set the shape. The doc's words outrank the space's latest posts, which teammates may have typed plain. A user who names `gchat-format` still gets its formatting.

## Step 5 item 8: Chat space discovery

Docs naming no space is not evidence there is none: list the Chat spaces, open the one named after the project, and record it in the project's local instructions.

## Step 5 item 9: tracker MCP scope

If the tracker's MCP server is project-scoped (a repo's `.mcp.json`), start a session in that repo and hand it the post rather than reporting the tracker unreachable. Multi-repo ships need one entry per repo. No tracker documented: skip silently.

## Step 5 item 11: sheet reply rules

The reply cell, signature, colour and next status come from the project's own rule for that sheet: a tracker usually hands the row to whoever acts next, a test workbook usually puts the check back to runnable, and a fix that touches a test script's source owes that sync too. The line says what they can now see or do, never that the fix was a setting flipped or something already built (`casual-message` § Replying to their message). Append the reply with `cell_append_line` so other people's colours survive; the status cell takes a plain value write. When the row was only context, the fix is partial, someone wrote after the fix, the line would promise something the user did not choose, or the sheet has no documented rule, write nothing: put the draft in the Output's Decisions block and mark the row "not written" in Client rows.

## Step 5 item 12: work log wording

The release card and the team post feel like the whole record, and the user's personal log is the one place nobody else updates. Today's row for the project gets the shipped outcome, ticked, in the log's own conventions, and a plan row the deploy just made true (a later "X to production" row) is rewritten or ticked. Read the instruction's own location and conventions before writing, whether it is a daily huddle sheet, a standup doc or a timesheet.

## Step 5: Release-note scope, the rest

A docs-only range can hide a live release made outside git (the 2026-10-23 incident in `ship-incidents.md`), so the version comes from the commit range. A defect the review finds in pushed code is fixed in a new version, pushed, and the note then covers that version too.

## Step 5: Docs-only post

"No screen changed" is a reason for no release note, not for no post: the post then explains the situation and what was done, per `gchat-format` § Work not shipped. Examples of what the team acts on: a proposal, a plan, a decision record, a tracker row someone owns. A typo or private working notes never needs a post.

## Step 5 item 8: Held note

For a provider switched to live, the note stays in the fenced block until the check passes. The Release Note, Cards, Client rows and Work log rows read "held: provider not verified", and everything goes out once the user confirms the live settings exist and the check passes on a re-run.

## Step 3: sync-push exit codes

`sync-push.sh` (run from the repo root instead of pulling when the branch is behind or the push is rejected as non-fast-forward) replays your commits on the remote tip and moves the local branch without touching peers' files. Exit 1: a real conflict. Exit 2: a peer's edit blocks the local move after the push succeeded.

## Step 2: Version heading order

A heading this push adds sits above the last shipped one (re-number an uncommitted entry a peer's push has overtaken). A value behind the others is ordinary; take the highest only once its CHANGELOG entry exists.

## Step 3: Backlog and authorship

`git log origin/<deploy-branch>..HEAD` lists unpushed commits. Surface their count in the Ship Summary and check authorship with `git log --format='%an' <deploy-branch>..HEAD | sort | uniq -c`: one name can hide several sessions. Another author's work that rides along gets its touched surface named for the user to decide, then the Prerequisites review gate.

## Step 3: GitHub account

Check `gh auth status` first. The active account is shared with other sessions, so a `gh` call that needs the other account takes `GH_TOKEN=$(gh auth token --user <user>)` rather than a switch. When the push is rejected or the branch is behind, `sync-push.sh` replays your commits on the remote tip instead of a pull.

## Step 5: No-changelog repos

A repo with no `CHANGELOG.md` skips the changelog gate and the release note, except an internal repo (plugin, script, tooling), which still gets a release note: it ships too.
