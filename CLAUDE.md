# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working on this plugin — the syafiqkit Claude Code plugin providing personal workflow automation.

## Quick Start

Invoke skills directly by name: `/syafiqkit:<name>`. Skills are organized by invocation pattern below.

## Project Docs {#project-docs}

| File | Read when |
|---|---|
| `docs/ARCHITECTURE-ESSENTIALS.md` | Before any edit: the rules that break silently |
| `docs/ARCHITECTURE.md` | Designing or changing a subsystem |
| `docs/PRD.md` | Scoping, or arguing whether something is in scope |
| `hooks/CLAUDE.md` | Editing the mod under `hooks/`: its rules, host-API traps and permissions |
| `tasks/plugin-maintenance/*/current.md` | Decision history per subsystem |

Where two disagree, the task doc wins over a derived view, and the files themselves win over both. `ARCHITECTURE-ESSENTIALS.md` is a set of extracts of rules stated in this file: when a rule here changes, change its extract too. `AGENTS.md` points here.

## Skills by Invocation Pattern {#skills-by-pattern}

### Direct user invocation

These skills accept explicit user command:

| Skill | When to invoke |
|-------|----------------|
| `commit` | Create git commits from staged changes; `/commit push` also pushes |
| `write-summary` | Create a task summary document |
| `update-summary` | Update an existing task summary |
| `task-summary` | Create/update task summaries with full machinery |
| `ship` | End-to-end release: commit → changelog → push → CI verify → release note |
| `plan-worklist` | Pre-scoped list (findings, backlog, ClickUp paste) → `product-reviewer` sizes and sequences each → present the plan, don't build |
| `score-loop` | "Score it out of 20 and keep improving": frozen rubric, fresh judge per round (a retained judge on the user's yes when scores stall), stops on the user's own stop rule or a need for the user. A single review is `done`/`uiux`/`impeccable` |
| `done` | Post-task cleanup orchestrator |
| `quick-done` | Fast cleanup for sessions known to be small and low-risk |
| `read-summary` | Read task docs or project CLAUDE.md before answering, investigating or implementing |
| `tackle` | Vague multi-item continuation ("let's continue"): `read-summary`, build what's buildable, `done`. A specific ask is `read-summary`'s |
| `judgement` | Mid-task finding not yet yours to decide: measure who it affects, then decide or escalate. Shaping a decided question is `decision-first-output.md` |
| `brainstorming` | Design exploration before creative or architectural work |
| `commit-invoice-generator` | Invoice line items from git commits |
| `md-to-pdf` | Markdown to PDF with rendered Mermaid diagrams |
| `doc-to-md` | `.docx`, `.pdf` or `.xlsx` to Markdown, so each version is a readable diff |
| `excalidraw-board` | Task doc or worklist → black-and-white Excalidraw discussion board, verified by screenshot. Charts are `dataviz`; deciding what to build is `plan-worklist` |
| `motion-clip` | Designed launch, promo or explainer video as code: real captured screens, storyboard and sound approved before the full render, automatic and contact-sheet checks, 9:16/1:1/16:9 plus store presets, music bed, optional voice-over. Test-run recordings are `setup-playwright` |
| `product-still` | Designed still image from real captured screens (how-it-works steps, feature and hero composites): floating cropped cards, numbered steps, badge, rendered from HTML to PNG with phone and transparent variants. Video is `motion-clip` |
| `understanding-guide` | Large text the user must understand → offline question-and-answer page, every claim checked against its source; decisions wait until the reader understands |
| `reverse-engineer` | Rebuild a web app's mechanism that the client already uses, read through REA, into a task doc a sonnet reviewer verifies before design |
| `user-manual` | End-user manual from user tasks, Diátaxis shape, screenshots from an E2E capture spec. Distinct from `md-to-pdf` |
| `design-handoff` | Brief for someone ELSE to design a screen, layout decisions withheld. Designing it yourself is `uiux` |
| `taste` | Build, redesign or polish a public-facing page, any verb, with art direction and a browser-inspected look-and-fix loop. Vendored tasteskill v2 (MIT), source in `skills/taste/SOURCE.md`; needs Node 22+ and Chrome |
| `impeccable` | Only when the user names it (`/impeccable polish`, `audit`, `critique`…): design-director toolkit vendored from impeccable 4.7.0 (Apache-2.0). A bare "polish" or "critique" is `uiux`'s |
| `gchat-format` | Document posted to a Chat thread. A message to a named person is `casual-message` |
| `casual-message` | Casual 1:1 message in the sender's own voice. A document for Chat is `gchat-format` |
| `continue-session` | Copy-paste prompt that starts a fresh session: task doc path, next goal, uncommitted state |
| `pull-db` | MySQL/MariaDB transfer from a remote server to local dev |
| `reclaim-disk` | Free disk on a developer's Mac: measure, one plan, confirmed caches cleared; data asked item by item |
| `notes-summary` | Personal session journal in `~/.claude/notes/`; powers `read-notes`/`update-notes` |
| `skill-creator` | New skill: judges whether it should be one, drafts SKILL.md, registers it |
| `update-plugin` | Capture plugin learnings and patch SKILL.md files |
| `setup-project-docs` | Core doc set (PRD, ARCHITECTURE, ARCHITECTURE-ESSENTIALS, CLAUDE/AGENTS), greenfield or by archaeology |
| `extract-shared-package` | Module two or more apps need → shared Composer or npm package, strangler rollout |
| `update-claude-docs` | Create, rewrite or condense CLAUDE.md files |
| `condense-task-doc` | Condense a bloated task doc; splits over 300 lines or a decisions file over 40 KB |
| `condense-claude-md` | Condense a bloated CLAUDE.md; removes excess |
| `agent-setup` | Project-local agents, Bootstrap pattern |
| `haiku` | Run a task or skill on haiku agents, then verify the result |
| `unhobble-instructions` | Audit and rewrite a SKILL.md, agent or CLAUDE.md for overconstraint. The lens is judgement vs constraint, not length |
| `refresh-instructions` | Three-pass refresh (restructure → condense → unhobble) on haiku. One pass alone: invoke that skill directly; a SKILL.md or agent wants `unhobble-instructions` alone |
| `self-organize-agent-memory` | Bloated inline table in a project agent moves to `.claude/agent-memory/<agent>/`; verify with an identifier sweep |

### Proactive invocation (model auto-fires on symptom match)

| Skill | Trigger |
|-------|---------|
| `read-summary` | Before answering architectural, investigative or project-context questions |
| `brainstorming` | Before creative or architectural design work |
| `judgement` | About to send an unmeasured either/or ("should I fold this in", "is this in scope"), or about to stay silent on a real finding |
| `pull-db` | Session involves remote database work |
| `reclaim-disk` | Laptop storage low or full, "free up space", "what's eating my disk", Docker or System Data too large |
| `hobby-review` | User reports finishing a book, game, show or hobby item |
| `motion-clip` | Asked for a launch clip, promo, explainer or reel, or to add music to one, without naming the skill |
| `product-still` | Website or marketing images built from the product's screens are outdated or wanted ("update the images on our site", "feature image", "transparent version", "phone version"), without naming the skill |
| `understanding-guide` | User faces more text than one sitting holds, or asks how it should be presented |
| `reverse-engineer` | "The same as <app> my client uses" built in our app, or "reverse engineer" / "utilize REA" about a web app someone is logged into |
| `function-parameter-limits` | "Too many parameters" or parameter count concerns |
| `merge-task-docs` | Related task docs in a domain: classify by subsystem boundary, merge, delete sources, reconcile back-references |
| `sweep-doc-overlaps` | Fleet-wide scan of all `tasks/` domains for cross-domain merge candidates; hands groups to `merge-task-docs` |
| `ci-ssh-deploy-timeout` | "Deploy keeps timing out" or SSH intermittency in CI |
| `setup-playwright` | "E2E tests are flaky", "specs pass alone but fail together" |
| `uiux` | Design judgement for UI work at any scope: polish, rethink, redesign, critique a screen (no edits), research. Public-facing page looks go to `taste`, whatever the verb. Also fires on a screenshot or a report of what someone saw |
| `taste` | Asked to build, redesign or polish a public-facing page, or told one looks generic, cheap or "AI-made" |
| `design-handoff` | About to volunteer a layout or component list for a screen someone else designs, or asked for "the prompt" for another designer |
| `gchat-format` | Asked to send, post or format anything for Google Chat |
| `casual-message` | Asked to reply to, text or tell a NAMED person something; runs before drafting |
| `continue-session` | Session ending with work deferred, or the user is low on context or starting fresh |

### Sub-skills (spawned from other skills)

| Skill | Spawned by |
|-------|-----------|
| `task-summary` | `/write-summary`, `/update-summary`, `/done` |
| `read-summary` | `/tackle` (`/done` no longer reads task docs itself) |
| `brainstorming` | Invoked directly; `skills/done/SKILL.md` does not call it |

### Commands

| Command | Purpose |
|---------|---------|
| `read-notes` | Read a personal session journal |
| `update-notes` | Create/update a personal session journal |

## Typical Workflow Sequences

Invoked as separate commands, not chained:

1. **Commit + release**: `/commit` + `/ship`, usually one instruction; `/ship` has its own commit step.
2. **Post-ship docs**: `/update-summary` (delegates to `task-summary`), then `/update-claude-docs`.
3. **Plugin maintenance**: `/update-plugin` standalone, sometimes much later. "Extend this too" mid-skill widens the current run, not a cue to re-invoke.
4. **Small sessions**: `/quick-done` or `/done`, never both. `/done` is the default.

## Plugin Architecture

### Skill and Command Structure

**Commands** (`commands/*.md`) take `description:` (skill list) and `argument-hint:` (autocomplete) frontmatter.

**Skills** (`skills/<name>/SKILL.md`) are prompted executions. Plugin-relevant frontmatter:
```yaml
---
name: skill-name                        # Optional, defaults to the directory name
description: Description for matching and invocation
when_to_use: extra trigger phrases      # Appended to description; the two share a 1,536-char cap
allowed-tools: Bash(git:*), Read        # Pre-approves for one turn; never restricts
disallowed-tools: WebFetch              # Removes tools while the skill is active
disable-model-invocation: true          # Only the user may invoke; never add without a request
---
```

Only `description` is meaningfully required. Three facts about how a skill is *read* and *registered*, none derivable from the file:

- **The body enters context once and is never re-read**, so guidance meant to hold for a whole task must be a standing instruction.
- **A mid-session reload registers a new skill's name but not its `description`**, so it is invocable but cannot auto-fire: after `/reload-skills` its listing shows an empty description, and the description is what a request is matched against. The reload output reads like confirmation (measured 2026-09-17 on two skills created in-session). **A trigger test is only meaningful in a session started after the file was written.**
- **After compaction only each skill's first 5,000 tokens re-attach** (25,000 shared, most recently invoked first); the rest silently stops existing. Count in tokens with a tokenizer, never `bytes ÷ 4`: this corpus runs 4.46 bytes per token, so the divisor over-reports by ~12% (17% on dense files), and an inflated count buys an extraction pass against an imaginary overage. Count command and figures: `skills/update-plugin/references/harness-constraints.md`.

**That divisor is a RECURRENCE: the first fix corrected the figures and left the method.** 1.261.0 patched the numbers while `harness-constraints.md` kept prescribing `bytes ÷ 4` for ten more versions. After disproving a figure, fix the method that computed it. **Tell: your changelog entry lists corrected values and names no method.**

### Where a rule goes, by when it must fire {#rule-placement}

Every mechanism loads at a *moment*, and a rule in the wrong one is correct, present and silently inert. Choose by when the rule must be in front of the reader, not by which file the topic belongs to.

| Must fire | Put it in | Loads |
|---|---|---|
| Every turn, no exceptions | A `UserPromptSubmit` hook's stdout | Once per turn, injected by the harness |
| Every session, surviving compaction | `hooks/RULESET.md` via the SessionStart hook, or a project-root `CLAUDE.md` | Session start and `compact` (context pressure, not turn count, so a session that never fills its window never re-fires) |
| When a matching file is touched | `.claude/rules/*.md` with `paths:` frontmatter | On read of a matching path |
| When a named task starts | A skill body, first 5,000 tokens | On invoke |
| Only if the reader chooses to look | A `📖` reference | Never, unless opened |

**A rule that failed twice cannot be fixed by rewording it; move it to another row.** Skill bodies and CLAUDE.md are read once, so a verdict reached many turns later is answered from recall, which keeps the parts that matched the situation and drops the one that applied. Failed at least eight times before 2026-09-10 (`grep -i "never reached\|re-attach" CHANGELOG.md`): each reword restated the rule or moved it nearer the act, and the next session failed through another door. Moving it within an equally unread file changes nothing.

Two consequences. A `📖` pointer defers a rule and never delivers one, so the sentence telling a reader they *have* a problem stays inline and only the fix procedure moves. A rule that must hold every turn has one home, a hook, the only mechanism the harness executes rather than the model choosing to consult. **Tell: you are about to reword a rule for the second time.**

**`allowed-tools:` pre-approves; it never restricts.** Unlisted tools stay callable. The grant only waives the prompt for what it names, until the user's next message. Use `disallowed-tools:` to remove a tool. A skill that spawns agents needs no `Agent` entry (`done`, `ship`, `agent-setup` omit the line). Read as a whitelist, the grant makes an unlisted tool look blocked when it isn't. Skills use hyphenated `disallowed-tools:`, subagents camelCase `disallowedTools:`, and each is inert in the other's file. *(Verified against `code.claude.com/docs/en/skills.md`, 2026-08-20.)*

**Agent templates** (`skills/agent-setup/templates/*.template.md`) define project-local agents that read CLAUDE.md at runtime. Plugin-relevant frontmatter:
```yaml
---
name: agent-name
description: When to invoke
tools: Read, Grep, Glob, Edit           # Allowlist; omit the line to inherit every tool
disallowedTools: [Write, Edit]          # camelCase; resolved BEFORE tools
memory: project                         # user | project | local; its own MEMORY.md
skills: [api-conventions]               # Preloads the skill's FULL text at spawn
permissionMode: default                 # Ignored for plugin subagents
---
```
Agent frontmatter is a **different namespace from skill frontmatter**: `disallowedTools:` for agents, `disallowed-tools:` for skills, and a misspelling fails silently. So verify a read-only agent by whether the enforcing line exists, never by how the file looks. When both are set, `disallowedTools` resolves first and `tools` narrows what remains. Other fields (model, color, maxTurns, isolation): `code.claude.com/docs/en/sub-agents.md`.

A subagent inherits the CLAUDE.md hierarchy and a git-status snapshot, never the parent's conversation, output style or auto memory; a `fork` inherits everything. Built-in `Explore` and `Plan` skip CLAUDE.md inheritance, which is why the Bootstrap pattern has them read it at runtime.

Subagents **can** spawn subagents, three layers deep; the no-redelegation rule is policy, and the only mechanical enforcement is omitting `Agent` from `tools:`. *(Verified against `sub-agents.md`, 2026-08-20.)*

**Passing `name:` to `Agent` makes the agent an addressable teammate whose plain-text final output never reaches the caller.** A prompt without a `SendMessage` instruction yields completions with no reports, indistinguishable from a fan-out that worked, and non-deterministically (six identical spawns, one reporting, five not: #27), so a run whose reports arrived proves nothing. Either tell every named agent to report via `SendMessage`, or omit `name:`. Keep naming only when mid-flight addressability matters, such as correcting an agent or reclaiming a file before editing it.

### The SessionStart Hook

`hooks/hooks.json` `cat`s `hooks/RULESET.md` into a session on matchers `startup|resume|clear|compact`, auto-discovered by well-known path; neither manifest declares `hooks`.

**`fork`, the fifth documented matcher, is deliberately absent**, so a session forked via `--fork-session`, `/fork` or `/branch` gets no ruleset. Its behaviour was never verified, and an unverified matcher was the worse trade against a bounded gap. Adding it is a one-token change once someone confirms what a forked session does with hook output; then drop the "every session" carve-out from `README.md` and the changelog.

**No script, deliberately.** `${CLAUDE_PLUGIN_ROOT}` expands in `hooks.json` but not in a script body, and a frontmatter-bearing ruleset would need strip logic. `cat` needs neither.

**Hook stdout is capped at 10,000 characters**; past it the session gets a file path and a 2,000-character preview, and the hook still reports success. The only trace is "Output too large" in the start banner. `RULESET.md` sat over the cap from 2026-09-17 to 2026-10-08, so every rule past the first was missing for three weeks. Measure with `wc -m` (UTF-8 locale) before any pass lands. `.githooks/pre-commit` blocks a commit at the cap where `core.hooksPath` is set.

**`cat` rather than `node`**: Claude Code is a native binary with no guaranteed Node, and a version-managed `node` lives in the shell profile, which an exec-form hook never sources. Check with `env -i PATH="/usr/bin:/bin" sh -c 'command -v node'`; `/bin/cat` passes. Bare Windows without Git Bash gets a silent no-op.

**A missing ruleset is expected to degrade rather than block, but that is untested end-to-end.** `cat` exits 1 on ENOENT (verified), and the docs say only exit 2 blocks. So the conclusion rests on a table, not on a session started without the file. If a session fails to start, or `RULESET.md` moves behind a wrapper, suspect this first: rename the file, start a fresh session, see whether it comes up.

**A second `startup` entry runs `hooks/prune-caches.sh`** (silent; takes `${CLAUDE_PLUGIN_ROOT}` as its argument). It deletes this plugin's cached versions whose `.orphaned_at` marker is over 7 days old, never the running version even with a stale marker, plus stale mod cache files (`hooks/CLAUDE.md#what-it-runs`). Claude Code's own orphan sweep left versions 14 days old in place on 2026-10-23: 79 copies, 2.9 GB, each carrying the gitignored `tools/remote-cli/node_modules`, because a `directory` marketplace copies the working tree regardless of `.gitignore`. The 7 days keep a version a long-running session still has loaded, since deleting it breaks that session's hooks, skills and Typst templates until restart; 3 days was rejected as too short for a session left open over a weekend. The 7-day window and the lack of an off-switch are both the owner's call (2026-10-23), and the script runs for colleagues too. A typeset `.png` or `.json` is deleted only once no `<key>.ok` remains, because `typeset.js` writes pages before the marker and a blanket age cut could leave a fresh marker over deleted pages. The version-folder delete runs only when the plugin root's parent ends in `plugins/cache/syafiqkit/syafiqkit`, so a source-checkout root deletes nothing. It calls `/usr/bin/find` and `/bin/rm` by absolute path, since a hook gets no shell profile.

**No off-switch, by decision.** `cat` cannot read an env var, and a guard means adding a script back. A request to make it optional reopens the shape rather than making a small patch.

### The Mod

`hooks/src/mod.js` is a Claude Code mod: the band above the prompt, the `/sk` menu, the `/task-docs` reader, the `/changes` view, the image gallery and pictures under Claude's terminal answers. Its rules, host-API traps, permissions and debugging (`~/.claude/doc-pane-cache/mod.log`) live in `hooks/CLAUDE.md`.

📖 `hooks/CLAUDE.md`: read before planning, editing or debugging the mod, including from a task doc or log. Its automatic load on reading a `hooks/` file is not yet verified.

### Agent Definition Parity

Generated `.claude/agents/<name>.md` must match `skills/agent-setup/templates/<name>.template.md`. Patch the template in the same change, or the next `/agent-setup` regenerates the old behaviour. When fixing an agent, grep both locations. Drift is silent: a spawn error `effort 'xhigh'/'max' not supported` is worth diffing against the template before blaming the environment.

**Parity proves the two files agree, never that either is right.** An edit touching both leaves them matching whatever it did, so a regression in one pass is invisible to every later parity check. Check the frontmatter's own claims: a `description:` saying read-only beside a `Write`/`Edit` grant, or a `disallowedTools` block a checklist demands and no template produces, is a defect. A reviewer's "word-for-word identical" verdict was once contradicted by a three-line comparison, so run the comparison yourself.

A safety-relevant grant is stated twice, in frontmatter and in the body prose that scopes it. A density or `unhobble-instructions` pass reads a YAML guard as prohibition-shaped and strips it with the sentence explaining it. Where only body text scopes a grant, say so where the checklist verifies it.

**A YAML comment beside a grant is not the second statement**: `- Agent  # lets this agent spawn Explore agents` reaches the agent as nothing. Read the body for what it is told to spawn. `grep '^  - Agent'` also misses `task-builder`, which omits `tools:` to receive the full set. 📖 `skills/_shared/references/agent-may-not-redelegate.md`: the constraint every Agent-holding template states in body prose.

**Drift is not always one file being behind.** Each side can lead on different axes (an unhobbling run rewrites the template's prose while a live fix moves a guard in the generated file), so a wholesale copy either way discards the other's improvement and can ship repo-specific text upstream. Decide per hunk; a diff whose changes cluster into distinct topics signals independent edits.

## Authoring Skills and Commands

### Conventions

Skills and commands follow these principles:

- **Autonomous over interactive**: complete without asking; use smart defaults.
- **Auto-create over abort**: missing docs become templates; don't block workflow.
- **Explicit criteria**: "2+ files OR business logic" not "significant changes."
- **Graceful degradation**: PRIMARY missing → auto-create; SECONDARY missing → skip + suggest.
- **Bootstrap pattern**: agents read CLAUDE.md at runtime; only essential rules inline.
- **Self-contained plugin**: never reference `~/.claude/CLAUDE.md`; other users won't have it.
- **User preferences in skills, not shared memory**: plugin `memory/` is version-controlled; personal prefs go in project-local memory or skill defaults.

### Authoring Checklist

Find the group for the moment you are in:

#### Writing a skill's procedure {#checklist-writing}

- **Git probes**: `git -C <plugin-dir>` walks up to an enclosing repo and can answer about the wrong one; use `git rev-parse --show-toplevel`. A git-reading step must say what happens when git *errors*: unversioned projects and repos with no first commit make `git status` succeed while every `git diff HEAD` fails. `rev-parse --git-dir` asks whether a repo exists; `rev-parse HEAD` asks whether a commit does. Substitutes: `skills/_shared/references/verifying-a-write-landed.md`.
- **State what to establish, not which command establishes it.** `stat -f '%Sm'` works on macOS and fails on Linux, and colleagues run these skills on their own setups. The failures are quiet (a BSD flag meaning something else, an unmatched glob reporting `0`), and a confident wrong answer cannot be recovered from. Keep a literal invocation only where the exact invocation is the knowledge (a `mysqldump` flag set that took debugging, an SSH retry scoped to exit 255), and keep facts about how a tool behaves (`git diff` without `HEAD` misses the staged plane).
- **Prompting style**: constitutional constraints (`❌ Never / ✅ Always` tables) for routing decisions; numbered validation loops for file writes. A skill writing formatted output re-reads its own output against its style rule.
- **A guard belongs at the step that acts.** A condition settled early is not consulted by a later step, so re-derive it where the write, spawn or delete happens. Sibling sweeps key on the destructive act: grep for `rm -rf`, whole-file rewrites or `Edit`, not `subagent_type`, which misses direct `Skill()` calls and prose telling the reader to delete a file. A caller-side gate does not cover its callee, since a peer can edit between the two writes. Issue #24 had two siblings (an ungated folder delete, an unguarded whole-file condense) that the dispatch-shaped grep reported clean.
- **A shell snippet in a SKILL.md is untested code**, and its failure is a wrong number, not an error. Run it on a real doc and check against a manual read. A control must be able to fail in the direction you worry about: `grep -Ll` means `-l` on BSD (the later flag wins), so a coverage sweep listed every compliant file as non-compliant, while a file matching neither pattern vanished from both lists. Where a flag inverts a result, check one file on each side. Issue #22 restored a size check that undercounted every doc whose `## Next Steps` wasn't last.

#### Placing a rule or extracting shared machinery {#checklist-placement}

- **Shared rules**: a rule in 3+ skills moves to `skills/_shared/references/`. Paths resolve against the citing file (`../` from `skills/<name>/SKILL.md`, `../../` from `skills/<name>/references/*.md`), and a wrong depth never 404s at authoring time, so `ls` the target from the citing file's own directory.
- **Extracting defers a rule; it does not deliver one.** Nothing forces a `📖` target to load, and a hop past the skill body lands well under half the time. The sentence telling a reader they *have* the problem stays inline; only the fix procedure goes behind the citation. "Cite the owner rather than duplicating" is right about duplication and wrong about delivery. Two-hop shape to avoid: `skills/_shared/references/editing-skills-checklist.md` §"Pointer citations".
- **A rule governing every turn needs a host read early.** A wrap-up skill reaches only sessions that invoke it. `read-summary` runs at the start of most sessions and ships to consumers, the furthest-reaching host; this repo's `CLAUDE.md` never loads in a consumer's session. Nothing re-injects a standing rule mid-session, so say where it is best-effort.

#### Registering and publishing a skill {#checklist-registry}

- **Skill registry sync**: the registry lives in this file's Skills tables and `README.md`. Both drift independently, so check each against what is on disk, not against the other.
- **Plugin-internal paths**: `tasks/**` is not shipped in the marketplace. Verify against a git-sourced install, since a `directory` cache shows uncommitted files. Route writes through `update-plugin`, the only skill with an ownership gate. A colleague's GitHub install keeps a shallow clone at `~/.claude/plugins/marketplaces/syafiqkit`, refreshed on update (measured on `superpowers-marketplace`: `.git` updated 15/10), beside the per-version cache. Anything outside a skill (`tools/`) that a colleague links to points at the clone, never the cache. The official Anthropic marketplace is re-downloaded from GCS, not cloned. The folder name comes from `marketplace.json`'s `name`, unconfirmed while name and repo match.
- **Scope and naming**: when a name stops matching scope, rename in the same change; a stale name under-fires forever. When a command's body becomes "run skill X", migrate it to a skill.
- **Model invocation**: never add `disable-model-invocation` without a user request; it kills auto-suggestion. Default to proactive invocation.

#### Editing steps, citations or a restructure {#checklist-citations}

- **Internal cross-references**: cite a named heading or bullet, never a raw line number. **A citation that resolves can still misdescribe its target.** "X is already the rule" claims the target's *scope*: a rule under one heading, or inside one template's fenced block, reads as general once cited generally. Open the target, find the heading the sentence lives under, and if it is narrower than needed, widen it at the source rather than editing the citation to match.
- **Renumbering a file's own steps breaks every citation to them.** Flattening `3, 3a, 4, 4a` into `0–6` retires the labels while every pointer still resolves, so the file reads as a clean sequence. One such renumber stranded citations in two `_shared/references/` files and a live routing table. After changing a number or letter, sweep the citation syntax (`rule [0-9]+`, `Step [0-9]`) and read every hit against what the number names now, including your own edits. A decision record's mention is history; a live routing table or pointer is a citation to fix. The old label is usually gone, so a clean grep for it proves nothing. Measured 2026-09-15 on `hooks/RULESET.md`: rule 10 moved to position 1, `grep "rule 10"` returned zero, and two `rule N` citations pointed at the wrong rule, one a cross-reference the pass had just rewritten. **Tell: your renumber check grepped for the old number and found nothing.**
- **Inlining a reference breaks the citation graph at both ends.** Pulling a fact up strands the file it pointed at, which keeps collecting edits; dropping a citation to shared machinery leaves prose that reads complete while the reader is never routed to the machinery. Neither shows in a resolve-check, a diff or a self-report. After any inlining, ask which files this one no longer cites and which absorbed facts had machinery behind them. An uncited reference is either content to fold in and delete, or a pointer to restore.

#### Retracting or deleting a rule {#checklist-retraction}

- **Retracting a rule reaches every file that prescribed it, which is always more than the entry naming the fix.** Removing one leaves other sites still telling a reader to do the withdrawn thing, and they read as correct until the retraction. Measured 2026-09-03: 1.225.0 removed a token-diff step and patched the four files it named, while `unhobble-instructions/references/target-types.md` and `_shared/references/editing-skills-checklist.md` still prescribed it, and a reviewer swept the four named files and found nothing else: the changelog entry certified the wrong scope because it named the files the fix touched. So after a retraction, grep the corpus for the *practice* in its own vocabulary, and treat a surviving prescription as in scope even where it predates the fix. **Tell: your changelog entry enumerates the files a step was removed from.**
- **"Already stated elsewhere" justifies deletion only if *elsewhere* is reachable from where the reader stands.** This repo's `CLAUDE.md` is the trap: a consumer loads their own, never ours, so a rule deleted as duplicated here may be the only copy they would see. The skill is what travels, so a rule a consumer needs lives there. Measured 2026-09-11: an `unhobble-instructions` pass removed the house-style rule as redundant with this file's opening, a one-line summary and a mode table, not the rule.
- **Before accepting a deletion as dedup, grep the whole tree for the mechanism and name the survivor.** A fact with two homes is a dedup and one with a single home is a loss; the diff looks identical. A dedup leaves a sole copy, so the next pass over that file must be told by name, with the cost. Measured 2026-09-11: `setup-playwright` shed its stale-bundle warning correctly, since `uiux` states the mechanism in full; the next `uiux` pass cut 24% and kept the warning only because its prompt named it as the last callout standing.

#### Verifying a sweep or a probe {#checklist-verification}

**Run the control in both directions.** A check that can never pass is as broken as one that can never fail, and it looks like a crisis rather than a bug. A pointer sweep that keeps the `📖` inside the path tests a string that cannot exist, so every pointer reports broken; stripping `${CLAUDE_SKILL_DIR}` turns a valid absolute path into a bogus relative one. One sweep reported 38 of 127 pointers broken when the real number was two, so a failure rate too high to be plausible is evidence about the checker. Resolve one known-good and one known-bad case first. Both passing still does not clear the sweep, since a hand-rolled extractor feeds both cases through the same flaw: print the extracted values and read a few against the file.

**A passing control does not make every hit a defect.** `📖` marks several kinds of citation: a repo-root path, a bare skill name (`syafiqkit:update-plugin`), CHANGELOG prose about pointers. `[ -e ]` reports those as broken (measured 2026-09-11: seven hits, one real). Classify each hit first; a "broken" target that is not path-shaped means you are reading the classifier, not the corpus.

**Where the measured thing is what a session has in context, asking the session cannot measure it.** A model that judges a rule irrelevant answers "there is no such rule" just as one that never received it, and a better bait buys a better-argued negative. Take load-state from outside the model (the harness's `Loaded <path>` report or `/context`); an absence established by asking is unmeasured. This cost four agreeing probes and a near-shipped wrong finding about `.claude/rules/` loading.

📖 `skills/_shared/references/editing-skills-checklist.md`: tool validation, reachability, registry sync, path portability and failure modes per edit class. Read it before writing a shell snippet into a skill body: a skill invoked with an argument has bare dollar-zero rewritten in its own instructions, which its audit command catches and no review would.

## Publishing and Versioning

### Version Bumping

**Run `git config core.hooksPath .githooks` once per checkout.** It arms `.githooks/pre-commit`, which blocks a commit where the two manifests disagree; that drift recurred ten times, caught by a reader every time. The setting is local config, so a fresh clone is unprotected with nothing to say so, and an unset `core.hooksPath` looks identical to a passing hook. `ship`'s version print covers only the ship path; a bare `/commit` on an unconfigured clone has no defence.

Version lives in two files and must match:

| File | Field |
|------|-------|
| `.claude-plugin/plugin.json` | `"version"` |
| `.claude-plugin/marketplace.json` | `plugins[0].version` |

Re-read both before editing, since working copies may disagree from an uncommitted bump. Take the highest value claimed, and re-number an uncommitted entry that a later commit overtook: `ship` scopes its release note from the last shipped version, so an entry below it never reaches colleagues (2026-10-20: a 1.406.3 holding two new skills sat under a pushed 1.406.4). Bump and CHANGELOG entry are one atomic change; if the entry isn't ready, leave the version at baseline so its writer takes the number. Parallel agents each re-read before bumping. Run `claude plugin update syafiqkit@syafiqkit` once after all changes land, not mid-batch.

### Release Notes

Release notes state the reader's action, since consumers install without repo access: (1) the CLI command to update, (2) which prior output becomes invalid, (3) edge cases a reader would wonder about. Mention regeneration only when agents or templates changed.

### Testing Changes

After modifying commands or skills, run the update above. No build step: markdown is interpreted directly.

## Dependencies

Optional external plugins:

| Plugin | Used by | Fallback |
|--------|---------|----------|
| `code-simplifier@claude-plugins-official` | `/done` | Manual cleanup if unavailable |
| `feature-dev@claude-plugins-official` | `/done` | Manual cleanup if unavailable |
| `claude-md-management@claude-plugins-official` | `/update-claude-docs` | Manual edits if unavailable |

## Plugin Mechanics

### Design Constraints

The following design constraints exist and should not be "fixed":

- **`claude-md-pruner` scope is wider than its name**: it prunes task docs too. Renaming breaks silent gates in `update-claude-docs` and `agent-setup`. The name is inert for spawn; `description:` carries the trigger surface.
- **Size policy lives in condense skills only**: CLAUDE.md thresholds → `condense-claude-md`; task doc thresholds → `condense-task-doc`. Callers may name a number as a trigger; never enforce size as policy.
- **Every change = version bump**: a fan-out of parallel edits means re-read before writing, and expect to bump again if it moved.
- **House style applies to every CLAUDE.md the skills touch, consumer repos included**: `update-claude-docs` (Rewrite, Create, Capture write) and `condense-claude-md` apply `references/structure.md` whoever's repo it is, so a pass that defers to a file written another way delivers nothing. Consistency proves a pass was uniform, not that it was right; what binds is content: the rule inventory and its diff, with the capture filter as the only licensed deletion. **Task docs are the exception** (`tasks/**`, `task-summary`): there, drift is a section going missing, not a shape that differs.
