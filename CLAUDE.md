# CLAUDE.md

<!--LLM-CONTEXT
Stack: Claude Code plugin (Markdown skills and agents, shell hooks, Node mod)
Domain: syafiqkit, the plugin providing personal workflow automation
Key files: .claude-plugin/plugin.json, .claude-plugin/marketplace.json, hooks/RULESET.md, hooks/src/mod.js, skills/_shared/references/
-->

This file provides guidance to Claude Code (claude.ai/code) when working on this plugin: the syafiqkit Claude Code plugin providing personal workflow automation.

## Quick Start {#quick-start}

Invoke skills directly by name: `/syafiqkit:<name>`. Skills are organized by invocation pattern below.

## Commands {#commands}

```bash
git config core.hooksPath .githooks        # once per checkout; reasons in Version Bumping
claude plugin update syafiqkit@syafiqkit   # once after all changes land; reasons in Version Bumping
```

## Project Docs {#project-docs}

| File | Read when |
|---|---|
| `docs/ARCHITECTURE-ESSENTIALS.md` | Before any edit: the rules that break silently |
| `docs/ARCHITECTURE.md` | Designing or changing a subsystem |
| `docs/PRD.md` | Scoping, or arguing whether something is in scope |
| `hooks/CLAUDE.md` | Editing the mod under `hooks/`: its rules, host-API traps and permissions |
| `tasks/plugin-maintenance/*/current.md` | Decision history per subsystem |

Where two disagree, the task doc wins over a derived view, and the files themselves win over both. `ARCHITECTURE-ESSENTIALS.md` is a set of extracts of rules stated in this file: when a rule here changes, change its extract too. `AGENTS.md` points here.

## Plugin Mechanics {#plugin-mechanics}

### Design Constraints {#design-constraints}

The following design constraints exist and should not be "fixed":

- **`claude-md-pruner` scope is wider than its name**: it prunes task docs too. Renaming breaks silent gates in `update-claude-docs` and `agent-setup`; `description:` carries the trigger surface.
- **Size policy lives in condense skills only**: CLAUDE.md thresholds → `condense-claude-md`; task doc thresholds → `condense-task-doc`. Callers may name a number as a trigger; never enforce size as policy.
- **A plugin tool that acts outward (sends, posts, pays) is marked `_meta["anthropic/requiresUserInteraction"]: true`, never gated by a code in its own result.** The model reads and can replay anything a tool returns, so a "preview, then call again with this code" gate binds the text, not a human. The flag makes Claude Code show the permission prompt on every call, even in bypass mode; headless modes deny it (code.claude.com/docs/en/mcp.md). Pair it with a read-only preview the reply shows, with no `AskUserQuestion` before the prompt. Keep arguments unambiguous, free text phone-readable (gchat: 1000 characters), every network call on a timeout, and an idempotency key from the approved values so an UNSURE retry cannot act twice. 📖 `docs/ARCHITECTURE.md` § Design Constraints before reverting to elicitation.
- **Every change = version bump**: a fan-out of parallel edits means re-read before writing, and expect to bump again if it moved.
- **House style applies to every CLAUDE.md the skills touch, consumer repos included**: `update-claude-docs` and `condense-claude-md` apply `references/structure.md` whoever's repo it is. Consistency proves a pass was uniform, not that it was right; what binds is content: the rule inventory and its diff, with the capture filter as the only licensed deletion. **Task docs are the exception** (`tasks/**`, `task-summary`): there, drift is a section going missing, not a shape that differs.

## Skills by Invocation Pattern {#skills-by-pattern}

### Direct user invocation {#direct-invocation}

These skills accept explicit user command:

| Skill | When to invoke |
|-------|----------------|
| `commit` | Git commits from staged changes; `/commit push` also pushes |
| `claude-server-token` | One-year `claude setup-token` for a server-side Claude agent, or its renewal, even from the owner's phone |
| `setup-tools` | Set up the gsheets, gchat, gmail and `remote` tools for whoever runs it, until a real read works |
| `write-summary` | Create a task summary document |
| `update-summary` | Update an existing task summary |
| `task-summary` | Create/update task summaries with full machinery |
| `ship` | End-to-end release: commit → changelog → push → CI verify → release note |
| `side-domain` | Put a side project on `<name>.<umbrella>` on the VPS, 301 its temporary host, and move uploads to R2 only when it stores any |
| `score-loop` | "Score it out of 20 and keep improving": frozen rubric, fresh judge per round (or a kept judge beside a fresh one, scored separately). A single review is `done`/`uiux`/`impeccable` |
| `posthog-replay-frames` | "What did this user see", "check the replay": one person's PostHog events, then screenshots of the shared replay at the moments they point to |
| `done` | Post-task cleanup orchestrator |
| `quick-done` | Fast cleanup for sessions known to be small and low-risk |
| `read-summary` | Read task docs or project CLAUDE.md before answering, investigating or implementing |
| `unblock` | "What can I do now / what's blocked / what's left" across a project: every open item read whole (haiku per big doc), checked against git, tracker and chat, sorted into can-do, waiting and decisions, with what wasn't checked named; stale doc lines reported, not edited. Then builds the can-do list here on a go |
| `judgement` | Mid-task finding not yet yours to decide: measure who it affects, then decide or escalate. Shaping a decided question is `decision-first-output.md` |
| `brainstorming` | Design exploration before creative or architectural work |
| `commit-invoice-generator` | Invoice line items from git commits |
| `md-to-pdf` | Markdown to PDF with rendered Mermaid diagrams |
| `doc-to-md` | `.docx`, `.pdf` or `.xlsx` to Markdown, so each version is a readable diff |
| `docx-red-edits` | Edit someone else's Word file with red changes, their formatting untouched (Word Track Changes is `docx`) |
| `sign-pdf` | Sign and date a PDF form with the user's own signature image, after they confirm it; writes a copy, never sends. Certificate signing and form filling are not it |
| `excalidraw-board` | Task doc or worklist → black-and-white Excalidraw board. Charts are `dataviz` |
| `motion-clip` | Designed launch, promo or explainer video as code, storyboard and sound approved first. Test-run recordings are `setup-playwright` |
| `product-still` | Designed still from real captured screens, rendered to PNG with phone and transparent variants. Video is `motion-clip` |
| `setup-tracker` | Shared tracker sheet for a project or master, built from a JSON config. UAT scripts and huddles are out of scope |
| `watch-sheets` | One check of shared sheets on a repeating loop; `AskUserQuestion` only when it is our turn. Building a tracker is `setup-tracker` |
| `weekly-report` | The user's feed for a lead's weekly report to the boss: one haiku per project verifies a draft, last week's items carried forward, sent in Chat format. Sources in `~/.claude/references/weekly-report/` |
| `headless-watch` | Scheduled check with Claude closed: launchd runs `claude -p`, alerts by Telegram `sendMessage` or ntfy (never `--channels`, which steals the bot's poller). A session-only repeat is `/loop`; a cloud agent is `schedule` |
| `help-centre` | A user manual is called too big or hard to find things in, or guides are wanted inside the app ("put the guide in the system", "help for this screen"), without naming the skill |
| `understanding-guide` | Large text the user must understand → offline question-and-answer page, every claim checked. Decisions wait until the reader understands |
| `explainer-deck` | Deck explaining a system to a live audience, each mechanism beside a worked example. A page read alone is `understanding-guide` |
| `reverse-engineer` | Rebuild a web app's mechanism the client uses, read through REA, into a task doc a sonnet reviewer verifies |
| `user-manual` | End-user manual for a small system from user tasks, Diátaxis shape; Word/PDF editions. Distinct from `md-to-pdf`; in-app help for a big system is `help-centre` |
| `help-centre` | In-app help centre for a big system, or a manual converted into one: book per role, search, "Help for this screen" map, upkeep rule. Writing the pages is `user-manual` |
| `uat-script` | Client UAT script rendered to a workbook, each check quoting the screen it proves. Trackers are `setup-tracker`, watching testers is `watch-sheets` |
| `design-handoff` | Brief for someone ELSE to design a screen, layout decisions withheld. Designing it yourself is `uiux` |
| `taste` | Build, redesign or polish a public-facing page, any verb, with a browser-inspected look-and-fix loop. Needs Node 22+ and Chrome |
| `impeccable` | Only when the user names it (`/impeccable polish`, `audit`…). A bare "polish" or "critique" is `uiux`'s |
| `emil-design-eng` · `emil-animate` · `emil-choreograph` · `emil-gestures` · `emil-mobile-native` · `emil-remove-animations` · `emil-review-animations` | Emil Kowalski's motion and interaction skills (MIT, vendored): what should move and how, building one animation, several moving together, drag and sheets, phone feel, cutting motion, a strict motion review. `uiux` calls them for motion inside a polish; `done` runs the reviewer when a diff adds motion. `emil-pick-ui-library` is support only (read by path, not invoked) |
| `gchat-format` | Document posted to a Chat thread. A message to a named person is `casual-message` |
| `casual-message` | Casual 1:1 message in the sender's own voice. A document for Chat is `gchat-format` |
| `continue-session` | Copy-paste prompt that starts a fresh session: task doc path, next goal, uncommitted state |
| `pull-db` | MySQL/MariaDB transfer from a remote server to local dev |
| `reclaim-disk` | Free disk on a developer's Mac: measure, one plan, confirmed caches cleared |
| `patch-advisory` | Security advisory across servers: probe every host, judge real exposure, patch what the user owns, verify, report where asked. Repo dependency advisories are a code change through `ship` |
| `notes-summary` | Personal session journal in `~/.claude/notes/`; powers `read-notes`/`update-notes` |
| `skill-creator` | New skill: judges whether it should be one, drafts SKILL.md, registers it |
| `update-plugin` | Capture plugin learnings and patch SKILL.md files |
| `setup-project-docs` | Core doc set (PRD, ARCHITECTURE, ARCHITECTURE-ESSENTIALS, CLAUDE/AGENTS), greenfield or by archaeology |
| `extract-shared-package` | Module two or more apps need → shared package, strangler rollout |
| `update-claude-docs` | Create, rewrite or condense CLAUDE.md files |
| `condense-task-doc` | Condense a bloated task doc; splits over 300 lines or a decisions file over 40 KB |
| `condense-claude-md` | Condense a bloated CLAUDE.md; removes excess |
| `agent-setup` | Project-local agents, Bootstrap pattern |
| `haiku` | Run a task or skill on haiku agents, then verify the result |
| `unhobble-instructions` | Audit and rewrite a SKILL.md, agent or CLAUDE.md for overconstraint. The lens is judgement vs constraint, not length |
| `refresh-instructions` | Three-pass refresh (restructure → condense → unhobble) on haiku. One pass alone: invoke that skill directly |
| `self-organize-agent-memory` | Bloated inline table in a project agent moves to `.claude/agent-memory/<agent>/`; verify with an identifier sweep |

### Proactive invocation (model auto-fires on symptom match) {#proactive-invocation}

| Skill | Trigger |
|-------|---------|
| `read-summary` | Before answering architectural, investigative or project-context questions |
| `unblock` | "What's unblocking", "what can we do now", "what's blocked", "any development I can do", "what else left", typed bare or as `/read-summary` args |
| `brainstorming` | Before creative or architectural design work |
| `judgement` | About to send an unmeasured either/or ("should I fold this in", "is this in scope"), or about to stay silent on a real finding |
| `haiku` | Brute-force work over more items than one context reads well (every case of a script against the code, every commit since a date, every row of a register), unnamed: split across parallel haiku agents |
| `pull-db` | Session involves remote database work |
| `reclaim-disk` | Laptop storage low or full, "free up space", "what's eating my disk", Docker or System Data too large |
| `patch-advisory` | A CVE, a vendor or researcher write-up, or a colleague's "patch if got any nginx" / "are we affected by" arrives |
| `hobby-review` | User reports finishing a book, game, show or hobby item |
| `motion-clip` | Asked for a launch clip, promo, explainer or reel, or to add music to one, without naming the skill |
| `product-still` | Website or marketing images built from the product's screens are outdated or wanted ("update the images on our site", "feature image", "transparent version", "phone version"), without naming the skill |
| `setup-tracker` | A tracker sheet is asked for or complained about ("set up a tracker", "issue log", "the remarks column is too long", "client can't tell what's waiting on them"), or a tracker screenshot arrives. Not a per-person weekly huddle or timesheet |
| `watch-sheets` | Asked to keep checking or monitor a tracker or UAT sheet ("check the tracker every 10m", "alert me when the client replies"), or a `/loop` prompt that checks one |
| `weekly-report` | Asked what to report or feed the lead this week ("weekly update for KL", "what do we report to HL"), or a boss's message asking for a summary report of all projects |
| `headless-watch` | A check should run on a schedule with Claude closed ("every 10 minutes during work hours", "alert me on Telegram, otherwise stay quiet"), or a pasted crontab line calling `claude -p` |
| `uat-script` | Test scenarios for a client's acceptance testing are asked for or out of date ("prepare UAT", "test cases for sign-off", "the UAT sheet is out of date"), or a contract promises a test scenario per module |
| `understanding-guide` | User faces more text than one sitting holds, or asks how it should be presented |
| `explainer-deck` | Asked for slides or a deck to explain how something works to a meeting, without naming the skill |
| `reverse-engineer` | "The same as <app> my client uses" built in our app, or "reverse engineer" / "utilize REA" about a web app someone is logged into |
| `function-parameter-limits` | "Too many parameters" or parameter count concerns |
| `merge-task-docs` | Related task docs in a domain: classify by subsystem boundary, merge, delete sources, reconcile back-references |
| `sweep-doc-overlaps` | Fleet-wide scan of all `tasks/` domains for cross-domain merge candidates; hands groups to `merge-task-docs` |
| `ci-ssh-deploy-timeout` | "Deploy keeps timing out" or SSH intermittency in CI |
| `side-domain` | A side project is asked onto a real address or R2 ("put it on auraa.stream", "move it off sslip.io", "move the photos to R2"), or `ship` verifies a side project still on a temporary host |
| `setup-tools` | Someone asks how to get or set up the Sheets, Chat or `remote` tools, or one won't connect on their machine |
| `claude-server-token` | A server's Claude agent reports "credentials expired", "OAuth session expired", a blank `refreshToken` or a 401, or keeps losing its login every few weeks |
| `setup-playwright` | "E2E tests are flaky", "specs pass alone but fail together" |
| `uiux` | Design judgement for UI work at any scope: polish, rethink, redesign, critique a screen (no edits), research. Public-facing page looks go to `taste`. Also fires on a screenshot or a report of what someone saw. A pass fixes what it finds, measures with `scripts/check-render.mjs` (Node 22+, Chrome) and shows before and after |
| `taste` | Asked to build, redesign or polish a public-facing page, or told one looks generic, cheap or "AI-made" |
| `design-handoff` | About to volunteer a layout or component list for a screen someone else designs, or asked for "the prompt" for another designer |
| `gchat-format` | Asked to send, post or format anything for Google Chat |
| `casual-message` | Asked to reply to, text or tell a NAMED person something; runs before drafting |
| `continue-session` | Session ending with work deferred, or the user is low on context or starting fresh |
| `docx-red-edits` | About to change a Word file a colleague or client owns, where they mark their own revisions in red |
| `posthog-replay-frames` | A PostHog AI session summary, a shared replay link or a "this user got stuck" report arrives: check it against the raw events and replay frames before relaying it |
| `sign-pdf` | A form the user is preparing to send has an empty signature box and they've asked for it to be signed |

### Sub-skills (spawned from other skills) {#sub-skills}

| Skill | Spawned by |
|-------|-----------|
| `task-summary` | `/write-summary`, `/update-summary`, `/done` |
| `read-summary` | Invoked directly; it routes project-wide "what's blocked" asks to `unblock`, which never calls it back (`/done` no longer reads task docs itself) |
| `brainstorming` | Invoked directly; `skills/done/SKILL.md` does not call it |

### Commands {#slash-commands}

| Command | Purpose |
|---------|---------|
| `read-notes` | Read a personal session journal |
| `update-notes` | Create/update a personal session journal |

## Typical Workflow Sequences {#workflow-sequences}

Invoked as separate commands, not chained:

1. **Commit + release**: `/commit` + `/ship`, usually one instruction; `/ship` has its own commit step.
2. **Post-ship docs**: `/update-summary` (delegates to `task-summary`), then `/update-claude-docs`.
3. **Plugin maintenance**: `/update-plugin` standalone, sometimes much later. "Extend this too" mid-skill widens the current run, not a cue to re-invoke.
4. **Small sessions**: `/quick-done` or `/done`, never both. `/done` is the default.

## Plugin Architecture {#plugin-architecture}

### Skill and Command Structure {#skill-structure}

**Commands** (`commands/*.md`) take `description:` (skill list) and `argument-hint:` (autocomplete) frontmatter.

**Skills** (`skills/<name>/SKILL.md`) are prompted executions. Frontmatter: `description` (the only required field; matching uses it), `name` (defaults to the directory), `when_to_use` (extra triggers; shares description's 1,536-char cap), `allowed-tools` (pre-approves for one turn), `disallowed-tools` (removes tools while active), `disable-model-invocation` (never add without a request).

Facts about how a skill is *read* and *registered*, none derivable from the file:

- **The body enters context once and is never re-read**, so guidance meant to hold for a whole task must be a standing instruction.
- **A mid-session reload registers a new skill's name but not its `description`**, so it is invocable but cannot auto-fire, and the reload output reads like confirmation. **A trigger test is only meaningful in a session started after the file was written** (measured 2026-09-17). 📖 `docs/ARCHITECTURE.md` § Skill and Command Structure.
- **After compaction only each skill's first 5,000 tokens re-attach** (25,000 shared, most recently invoked first). Count in tokens with a tokenizer, never `bytes ÷ 4`: this corpus runs 4.46 bytes per token, so the divisor over-reports by ~12%. Count command: `skills/update-plugin/references/harness-constraints.md`. **A recurrence: after disproving a figure, fix the method that computed it.** **Tell: your changelog entry lists corrected values and names no method.**

### Where a rule goes, by when it must fire {#rule-placement}

Every mechanism loads at a *moment*, and a rule in the wrong one is correct, present and silently inert. Choose by when the rule must be in front of the reader, not by which file the topic belongs to.

| Must fire | Put it in | Loads |
|---|---|---|
| Every turn, no exceptions | A `UserPromptSubmit` hook's stdout | Once per turn, injected by the harness |
| Every session, surviving compaction | `hooks/RULESET.md` via the SessionStart hook, or a project-root `CLAUDE.md` | Session start and `compact` (context pressure, not turn count) |
| When a matching file is touched | `.claude/rules/*.md` with `paths:` frontmatter | On read of a matching path |
| When a named task starts | A skill body, first 5,000 tokens | On invoke |
| Only if the reader chooses to look | A `📖` reference | Never, unless opened |

**A rule that failed twice cannot be fixed by rewording it; move it to another row.** Skill bodies and CLAUDE.md are read once, so a verdict reached many turns later is answered from recall, which keeps the parts that matched the situation and drops the one that applied. Failed at least eight times before 2026-09-10. 📖 `docs/ARCHITECTURE.md` § Where a rule goes, by when it must fire.

A `📖` pointer defers a rule and never delivers one, so the sentence telling a reader they *have* a problem stays inline and only the fix procedure moves. A rule that must hold every turn has one home, a hook, the only mechanism the harness executes rather than the model choosing to consult. **Tell: you are about to reword a rule for the second time.**

**`allowed-tools:` pre-approves; it never restricts.** Unlisted tools stay callable, and the grant waives the prompt only for what it names, until the user's next message. Use `disallowed-tools:` to remove a tool. Skills use hyphenated `disallowed-tools:`, subagents camelCase `disallowedTools:`, and each is inert in the other's file: a misspelling fails silently. A skill that spawns agents needs no `Agent` entry (`done`, `ship`, `agent-setup` omit the line); read as a whitelist, the grant makes an unlisted tool look blocked when it isn't. *(Verified against `code.claude.com/docs/en/skills.md`, 2026-08-20.)*

**Agent templates** (`skills/agent-setup/templates/*.template.md`) define project-local agents that read CLAUDE.md at runtime. Frontmatter: `tools:` (allowlist; omit to inherit every tool), `disallowedTools:` (resolved before `tools`), `memory`, `skills` (preloads full text at spawn), `permissionMode` (ignored for plugin subagents). So verify a read-only agent by whether the enforcing line exists, never by how the file looks. Other fields: `code.claude.com/docs/en/sub-agents.md`.

A subagent inherits the CLAUDE.md hierarchy, never the parent's conversation (a `fork` inherits everything); built-in `Explore` and `Plan` skip CLAUDE.md, which is why the Bootstrap pattern has them read it at runtime. Subagents can spawn subagents three layers deep; the only mechanical stop is omitting `Agent` from `tools:` (verified 2026-08-20).

**`name:` on `Agent` makes the agent an addressable teammate whose plain-text final output never reaches the caller.** Tell every named agent to report via `SendMessage`, or omit `name:`; keep naming only for mid-flight addressability (correcting an agent, reclaiming a file). A run whose reports arrived proves nothing (six identical spawns, five silent: #27). 📖 `docs/ARCHITECTURE.md` § Skill and Command Structure.

### The SessionStart Hook {#session-start-hook}

`hooks/hooks.json` prints `hooks/RULESET.md` into a session on matchers `startup|resume|clear|compact`, auto-discovered by well-known path; neither manifest declares `hooks`.

**`fork`, the fifth documented matcher, is deliberately absent**, so a session forked via `--fork-session`, `/fork` or `/branch` gets no ruleset. Its behaviour was never verified, and an unverified matcher was the worse trade against a bounded gap. 📖 `docs/ARCHITECTURE.md` § The SessionStart Hook for what adding it would change.

**No script file, no `node`, deliberately.** The hook is one inline `/bin/sh -c` line that `cat`s the file, or, when the file is gone, prints a line telling the model to ask the user to restart (24/11/2026). A session still open after `prune-caches.sh` deleted its version folder otherwise lost its rules on `/clear` or `compact` with no sign why. `/bin/sh` and `/bin/cat` need no shell profile, and Claude Code is a native binary with no guaranteed Node; a version-managed `node` lives in the profile, which an exec-form hook never sources. The fallback is the only branch: a script file, an env-var off-switch or any other guard reopens the design, not a patch. Check with `env -i PATH="/usr/bin:/bin" sh -c 'command -v node'`; `/bin/sh` and `/bin/cat` pass.

**Hook stdout is capped at 10,000 characters**: past it the session gets a file path and a 2,000-character preview, and the hook still reports success, leaving only "Output too large" in the start banner. Measure `RULESET.md` with `wc -m` (UTF-8 locale) before any pass lands; `.githooks/pre-commit` blocks a commit at the cap where `core.hooksPath` is set. 📖 `docs/ARCHITECTURE.md` § The SessionStart Hook (three weeks of missing rules, 2026-09-17 to 2026-10-08).

**A missing ruleset prints the restart line and exits 0**, so it cannot block a session (tested from a clean environment, 24/11/2026; not yet seen in a live session).

**A second `startup` entry runs `hooks/prune-caches.sh`**, which deletes this plugin's cached versions (never the running one) once their `.orphaned_at` marker is over 7 days old, or over 24 hours old and outside the 10 newest markers, plus stale mod cache files (`hooks/CLAUDE.md#what-it-runs`). The count cap exists because an age-only window grows with release rate. Both limits and the lack of an off-switch are the owner's call (2026-10-23, count cap 24/11/2026): a long-running session still needs its loaded version, and one open more than a day across 10+ releases loses it until restart. A typeset `.png` or `.json` goes only once no `<key>.ok` remains. The version-folder delete runs only when the plugin root's parent ends in `plugins/cache/syafiqkit/syafiqkit`, so a source checkout deletes nothing; keep that guard in any edit of the script. It calls `/usr/bin/find` and `/bin/rm` by absolute path, since a hook gets no shell profile. 📖 `docs/ARCHITECTURE.md` § The SessionStart Hook for the orphan-sweep measurements.

### The Mod {#mod}

`hooks/src/mod.js` is a Claude Code mod (the band, `/sk`, `/task-docs`, `/changes`, the image gallery). 📖 `hooks/CLAUDE.md`: read before planning, editing or debugging it, including from a task doc or log; its rules, host-API traps and `~/.claude/doc-pane-cache/mod.log` live there. Its automatic load on reading a `hooks/` file is not yet verified.

### Agent Definition Parity {#agent-parity}

Generated `.claude/agents/<name>.md` must match `skills/agent-setup/templates/<name>.template.md`. Patch the template in the same change, or the next `/agent-setup` regenerates the old behaviour. When fixing an agent, grep both locations. Drift is silent: a spawn error `effort 'xhigh'/'max' not supported` is worth diffing against the template before blaming the environment.

**Parity proves the two files agree, never that either is right.** An edit touching both leaves them matching whatever it did. Check the frontmatter's own claims: a `description:` saying read-only beside a `Write`/`Edit` grant, or a `disallowedTools` block a checklist demands and no template produces, is a defect. Run any comparison yourself.

A safety-relevant grant is stated twice, in frontmatter and in the body prose that scopes it. A YAML comment beside a grant is not the second statement; read the body for what the agent is told to spawn. 📖 `skills/_shared/references/agent-may-not-redelegate.md`: the constraint every Agent-holding template states in body prose.

**Drift is not always one file being behind.** Each side can lead on different axes, so a wholesale copy either way discards the other's improvement. Decide per hunk. 📖 `docs/ARCHITECTURE.md` § Agent Definition Parity for the incidents behind these checks.

## Authoring Skills and Commands {#authoring}

### Conventions {#conventions}

Skills and commands follow these principles:

- **Autonomous over interactive**: complete without asking; use smart defaults.
- **Auto-create over abort**: missing docs become templates; don't block workflow.
- **Explicit criteria**: "2+ files OR business logic" not "significant changes."
- **Graceful degradation**: PRIMARY missing → auto-create; SECONDARY missing → skip + suggest.
- **Bootstrap pattern**: agents read CLAUDE.md at runtime; only essential rules inline.
- **Self-contained plugin**: never reference `~/.claude/CLAUDE.md`; other users won't have it.
- **User preferences in skills, not shared memory**: plugin `memory/` is version-controlled; personal prefs go in project-local memory or skill defaults.

### Authoring Checklist {#authoring-checklist}

Find the group for the moment you are in:

#### Writing a skill's procedure {#checklist-writing}

- **Git probes**: `git -C <plugin-dir>` walks up to an enclosing repo and can answer about the wrong one; use `git rev-parse --show-toplevel`. A git step must say what happens when git *errors*: `rev-parse --git-dir` asks whether a repo exists, `rev-parse HEAD` whether a commit does. 📖 `skills/_shared/references/editing-skills-checklist.md` § Self-Diagnosis: Git Probes.
- **State what to establish, not which command establishes it**: colleagues run these skills on their own setups.
- **The exception is a step that hands work to a sibling skill: name a command it runs, not a Skill call to make.** Measured 22/11/2026 in headless runs of `uiux`: its script commands ran every time, while "also invoke `impeccable` and `taste`" was skipped twice even with the rule in the procedure, as `taste` had been five times before (`tasks/plugin-maintenance/external-guidance/decisions/source-13-ui-handling.md`).
- **Prompting style**: constitutional constraints (`❌ Never / ✅ Always` tables) for routing decisions; numbered validation loops for file writes. A skill writing formatted output re-reads its own output against its style rule.
- **A guard belongs at the step that acts.** Re-derive it where the write, spawn or delete happens; a caller-side gate does not cover its callee. Sibling sweeps key on the destructive act (`rm -rf`, whole-file rewrites, `Edit`), not `subagent_type`, which misses direct `Skill()` calls.
- **A shell snippet in a SKILL.md is untested code**: its failure is a wrong number, not an error. Where a flag inverts a result, check one file on each side.
- 📖 `skills/_shared/references/editing-skills-checklist.md` § Writing a skill's procedure: the incidents behind these.

#### Placing a rule or extracting shared machinery {#checklist-placement}

- **Shared rules**: a rule in 3+ skills moves to `skills/_shared/references/`. Paths resolve against the citing file (`../` from `skills/<name>/SKILL.md`, `../../` from `skills/<name>/references/*.md`), and a wrong depth never 404s at authoring time, so `ls` the target from the citing file's own directory.
- **Extracting defers a rule; it does not deliver one.** The sentence telling a reader they *have* the problem stays inline; only the fix goes behind the citation.
- **A rule governing every turn needs a host read early.** `read-summary` reaches most sessions; nothing re-injects a standing rule mid-session, so say where it is best-effort.
- 📖 `skills/_shared/references/editing-skills-checklist.md` § Placing a rule or extracting shared machinery: read when a rule moves.

#### Registering and publishing a skill {#checklist-registry}

- **Skill registry sync**: the registry is this file's Skills tables plus `README.md`; both drift independently, so check each against disk.
- **Plugin-internal paths**: `tasks/**` is not shipped; verify against a git-sourced install, since a `directory` cache shows uncommitted files. Route writes there through `update-plugin`, the only skill with an ownership gate. A colleague's `tools/` link resolves to their marketplace clone, never the cache.
- **Scope and naming**: a name that stops matching scope is renamed in the same change; a stale name under-fires forever. A command whose body becomes "run skill X" migrates to a skill.
- **Model invocation**: never add `disable-model-invocation` without a user request; it kills auto-suggestion.
- 📖 `skills/_shared/references/editing-skills-checklist.md` § Registering and publishing a skill: read for `tools/` paths.

#### Editing steps, citations or a restructure {#checklist-citations}

- **Internal cross-references**: cite a named heading or bullet, since a line number goes stale on the next edit. **A citation that resolves can still misdescribe its target**: widen the cited heading at the source.
- **Renumbering a file's own steps breaks every citation to them.** Sweep the citation syntax (`rule [0-9]+`, `Step [0-9]`), not the retired label, and read each hit against what its number now names. A decision record's mention is history; a live pointer is a fix. **Tell: your renumber check grepped for the old number and found nothing.** (2026-09-15)
- **Inlining breaks the citation graph at both ends.** Ask which files this one stopped citing and which absorbed facts had machinery behind them; fold the uncited reference in or re-point it.
- 📖 `skills/_shared/references/editing-skills-checklist.md` § Editing steps, citations or a restructure: read before a renumber or an inline.

#### Retracting or deleting a rule {#checklist-retraction}

- **Retracting a rule reaches every file that prescribed it.** Grep the corpus for the *practice* in its own vocabulary; a surviving prescription is in scope even if it predates the fix. **Tell: your changelog entry enumerates the files a step was removed from.** (2026-09-03)
- **"Already stated elsewhere" justifies deletion only if *elsewhere* is reachable from the reader.** This repo's `CLAUDE.md` is the trap: consumers load their own, so the skill is what travels. (2026-09-11)
- **Before accepting a deletion as dedup, grep the whole tree for the mechanism and name the survivor.** A fact with one home is a loss, and the diff looks the same; name the sole copy to the next pass, with its cost. (2026-09-11)
- 📖 `skills/_shared/references/editing-skills-checklist.md` § Retracting or deleting a rule: read before any deletion.

#### Verifying a sweep or a probe {#checklist-verification}

**Run the control in both directions.** A check that cannot pass is as broken as one that cannot fail. Resolve a known-good and a known-bad case first; a failure rate too high to be plausible is evidence about the checker.

**A passing control does not make every hit a defect.** Classify each hit first; a "broken" target that is not path-shaped means you are reading the classifier. (2026-09-11)

**Asking the session cannot measure what it has in context.** A model that judges a rule irrelevant answers "there is no such rule" just as one that never received it. Take load-state from outside the model: the harness `Loaded <path>` report or `/context`.

- 📖 `skills/_shared/references/editing-skills-checklist.md` § Verifying a sweep or a probe: read before trusting a sweep.

📖 `skills/_shared/references/editing-skills-checklist.md`: checks per edit class. Read it before writing a shell snippet into a skill body: a skill invoked with an argument has bare dollar-zero rewritten in its own instructions.

## Publishing and Versioning {#publishing}

### Version Bumping {#version-bumping}

**Run the `core.hooksPath` command from `## Commands` (`{#commands}`) once per checkout.** It arms `.githooks/pre-commit`, which blocks a commit where the two manifests disagree (the drift recurred ten times). The setting is local config, so an unset `core.hooksPath` looks identical to a passing hook; a bare `/commit` on an unconfigured clone has no defence.

Version lives in two files and must match:

| File | Field |
|------|-------|
| `.claude-plugin/plugin.json` | `"version"` |
| `.claude-plugin/marketplace.json` | `plugins[0].version` |

Re-read both before editing: working copies may disagree from an uncommitted bump. Take the highest value claimed, and re-number an uncommitted entry that a later commit overtook, since `ship` scopes its release note from the last shipped version (2026-10-20: a 1.406.3 entry sat under a pushed 1.406.4). Bump and CHANGELOG entry are one atomic change; if the entry isn't ready, leave the version at baseline. Parallel agents each re-read before bumping. Run the plugin update from Commands once after all changes land, not mid-batch.

### Release Notes {#release-notes}

Release notes state the reader's action, since consumers install without repo access: (1) the CLI command to update, (2) which prior output becomes invalid, (3) edge cases a reader would wonder about. Mention regeneration only when agents or templates changed. A release that continues a feature from an earlier one repeats how to use it (the switch, its values, what still fails), since a colleague reads only the newest entry (25/11/2026: two fresh judges docked a fix-only entry that pointed back to an older one).

### Testing Changes {#testing-changes}

After modifying commands or skills, run the plugin update from Commands. No build step: markdown is interpreted directly.

**A plan that adds or changes what a skill does includes a `score-loop` pass before it ships** (Syafiq, 21/11/2026: "Always for skill upgrades"): a rubric frozen from the brief, fresh judges, and at least one check that is a fresh headless session given the user's own words, read from its tool calls (📖 `skills/_shared/references/editing-skills-checklist.md` § Verifying Edits After Writing, item 7). Ask the stop rule when planning. A wording fix with no behaviour change does not need one. **Tell: your plan for a skill change ends at "code-reviewer + product-reviewer".**

## Dependencies {#dependencies}

Optional external plugins:

| Plugin | Used by | Fallback |
|--------|---------|----------|
| `code-simplifier@claude-plugins-official` | `/done` | Manual cleanup if unavailable |
| `feature-dev@claude-plugins-official` | `/done` | Manual cleanup if unavailable |
| `claude-md-management@claude-plugins-official` | `/update-claude-docs` | Manual edits if unavailable |
