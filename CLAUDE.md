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
| `plan-worklist` | A pre-scoped list (findings, backlog, ClickUp paste) → `product-reviewer` sizes and sequences each against product intent → present the plan and stop, don't build |
| `done` | Post-task cleanup orchestrator |
| `quick-done` | Fast cleanup for sessions known to be small and low-risk |
| `read-summary` | Read task docs or project CLAUDE.md before answering, investigating, or implementing; judges Explore/Plan delegation vs continuing inline |
| `tackle` | Vague multi-item doc continuation ("let's continue") → `read-summary`, judge what's buildable vs blocked, build, `done`. A specific ask is `read-summary`'s job, not this |
| `judgement` | Mid-task finding that may not be yours to decide (adjacent defect, scope question) → measure who it newly affects, then decide or escalate. Shaping a decided question is `decision-first-output.md` |
| `brainstorming` | Design exploration before creative or architectural work |
| `commit-invoice-generator` | Generate invoice line items from git commits |
| `md-to-pdf` | Convert Markdown to PDF with rendered Mermaid diagrams |
| `doc-to-md` | Convert .docx, .pdf or .xlsx into Markdown so each version is a readable git diff |
| `excalidraw-board` | Task doc or worklist → black-and-white Excalidraw discussion board (now / gated / waiting, GATE cards, PARKED table, decisions strip), verified by screenshot. Charts are `dataviz`; deciding what to build is `plan-worklist` |
| `motion-clip` | Short designed video for a product or brand (launch clip, promo, explainer) as code: brief, real captured screens, photos and logo in a phone, browser or frameless layout, engine driven by `story.js`, contact-sheet self-review, 9:16/1:1/16:9 renders, numpy music bed at -14 LUFS. Test-run recordings are `setup-playwright` |
| `user-manual` | END-USER manual: scope from user tasks, Diátaxis shape, screenshots from an E2E capture spec, `.docx`/`.pdf` editions. Distinct from `md-to-pdf`, which converts settled content |
| `design-handoff` | Brief for someone ELSE to design a screen (external designer, Claude Design, contractor): purpose, audience, business rules, measured failures; layout decisions withheld. Designing it yourself is `uiux` |
| `gchat-format` | Convert Markdown to Google Chat message format: a document posted to a thread. A message in the sender's own voice to a named person is `casual-message` |
| `casual-message` | Write a casual 1:1 message in the sender's own voice: a WhatsApp reply, a colleague DM, "tell X that…". Register is inferred, not asked; no fence, no headers. A document being converted for Chat is `gchat-format` |
| `continue-session` | Copy-paste prompt that starts a fresh session where this one stopped: task doc path, next goal, uncommitted state |
| `pull-db` | Transfer MySQL/MariaDB database from remote server to local dev |
| `notes-summary` | Create/update/read a personal session journal outside the repo (`~/.claude/notes/`) for boss/team/career/strategy conversations; powers the `read-notes`/`update-notes` commands |
| `skill-creator` | Create a new skill: judges whether it should be one, drafts SKILL.md, registers it |
| `update-plugin` | Capture plugin learnings and patch SKILL.md files after authoring work |
| `setup-project-docs` | Establish a project's core doc set (PRD, ARCHITECTURE.md, ARCHITECTURE-ESSENTIALS.md, CLAUDE.md/AGENTS.md): greenfield by derivation, or by archaeology on an existing codebase |
| `extract-shared-package` | Pull a module two or more apps need into a shared Composer or npm package: boundary first, then shape, hosting read off how consumers install, exact pins, multi-version proof, strangler rollout |
| `update-claude-docs` | Create, rewrite, or condense CLAUDE.md files |
| `condense-task-doc` | Aggressively condense a bloated task doc; splits >300 lines, or a decisions file >40 KB, into a routing index + decisions |
| `condense-claude-md` | Aggressively condense a bloated CLAUDE.md (removes excess, not the analog that adds content) |
| `agent-setup` | Create or update project-local agents using Bootstrap pattern |
| `haiku` | Run a task or named skill on haiku agents instead of this session, then verify the result: snapshot, identifier/number survival, reworded-claim check |
| `unhobble-instructions` | Audit + rewrite a SKILL.md/agent/CLAUDE.md/command for overconstraint (rigid imperatives, "Tell:" trip-wires, mechanical thresholds). The lens is judgement vs constraint, not byte count |
| `refresh-instructions` | Three-pass refresh of any living doc (restructure → condense → unhobble), each on `haiku` and verified before the next. One pass alone: invoke that skill directly; a SKILL.md or agent file wants `unhobble-instructions` alone |
| `self-organize-agent-memory` | A project agent's bloated inline reference table crowds out its procedural steps: dispatch that same agent onto its own file to decide what moves to `.claude/agent-memory/<agent>/`. Verify with an identifier sweep, not the migration summary |

### Proactive invocation (model auto-fires on symptom match)

| Skill | Trigger |
|-------|---------|
| `read-summary` | Before answering architectural/investigative/project-context questions |
| `brainstorming` | Before creative or architectural design work |
| `judgement` | About to send an unmeasured either/or ("should I fold this in", "is this in scope"), or about to stay silent on a real finding found mid-task |
| `pull-db` | When session involves remote database work |
| `hobby-review` | After user reports finishing a book, game, show, or hobby item |
| `motion-clip` | Asked for a launch clip, promo or demo video, explainer or reel for a product, app, website or brand, or to add music to one, without naming the skill |
| `function-parameter-limits` | On "too many parameters" or parameter count concerns |
| `merge-task-docs` | Find related task docs in a domain, classify by subsystem boundary (not keyword), merge into fewer docs, delete sources, reconcile all back-references |
| `sweep-doc-overlaps` | Fleet-wide scan across ALL `tasks/` domains for CROSS-domain merge candidates a single-domain call would miss; hands confirmed groups to `merge-task-docs` |
| `ci-ssh-deploy-timeout` | On "deploy keeps timing out" or SSH intermittency in CI |
| `setup-playwright` | On "e2e tests are flaky", "specs pass alone but fail together" |
| `uiux` | Design judgement for UI work at any scope: polish, rethink, redesign, greenfield or existing app; mobile-first; scored critique of a screen (no edits); landing pages. Also fires on a screenshot, on what someone *saw* without naming UI, or on how real products solve a pattern (case studies through `haiku`) |
| `design-handoff` | About to volunteer a layout, component list or step breakdown for a screen someone else is designing, or asked for "the prompt" / "business side only" for another designer |
| `gchat-format` | Asked to send, post or format anything for Google Chat: a release note, a status update, an announcement going to a thread |
| `casual-message` | Asked to reply to, text, or tell a NAMED person something; runs before drafting, so register isn't inherited from a document-shaped default |
| `continue-session` | A session is ending with work deferred rather than finished, or the user says they're running low on context / starting fresh |

### Sub-skills (spawned from other skills)

| Skill | Spawned by |
|-------|-----------|
| `task-summary` | `/write-summary`, `/update-summary`, `/done` |
| `read-summary` | `/tackle` (`/done` no longer reads task docs itself; its steps are review agents, cleanup, `update-claude-docs`, `task-summary`, `update-plugin`) |
| `brainstorming` | Invoked directly; `skills/done/SKILL.md` does not call it |

### Commands

| Command | Purpose |
|---------|---------|
| `read-notes` | Read a personal session journal |
| `update-notes` | Create/update a personal session journal |

## Typical Workflow Sequences

These skills compose but are invoked as separate commands, not chained:

1. **Commit + release**: `/commit` + `/ship`, usually given as one instruction; `/ship` includes its own commit step.
2. **Post-ship documentation**: `/update-summary` (delegates to `task-summary`), then `/update-claude-docs`, as separate invocations.
3. **Plugin maintenance**: `/update-plugin` invoked standalone, sometimes much later. Mid-skill "extend this too" instructions widen the CURRENT run's scope, not a cue to re-invoke.
4. **Small sessions**: `/quick-done` is an alternative to `/done`, never both, for sessions already known to be low-risk. `/done` is the default.

## Plugin Architecture

### Skill and Command Structure

**Commands** (`commands/*.md`) are invocation prompts with metadata:
```yaml
---
description: Short description for skill list
argument-hint: "[optional hint]"        # Shows in autocomplete
---
```

**Skills** (`skills/<name>/SKILL.md`) are prompted executions:
```yaml
---
name: skill-name                        # Optional, defaults to the directory name
description: Description for matching and invocation
when_to_use: extra trigger phrases      # Appended to description; the two share a 1,536-char cap
allowed-tools: Bash(git:*), Read, Grep  # Pre-approves these for one turn, see below
disallowed-tools: WebFetch              # Removes tools while the skill is active
user-invocable: false                   # Default is true; set false to hide from /menu
disable-model-invocation: true          # Only the user may invoke; never add without a request
context: fork                           # Optional: run in isolated subagent
agent: Explore                          # Which subagent type, when context: fork
background: false                       # With context: fork, wait for the result in this turn
model: sonnet                           # Optional: override model
effort: high                            # low | medium | high | xhigh | max
paths: ["src/**/*.ts"]                  # Auto-activate only when touching matching files
---
```

The full set is 20 fields (also `arguments`, `argument-hint`, `hooks`, `shell`, `metadata`, `license`, `compatibility`). Only `description` is meaningfully required. Three facts about how a skill is *read* and *registered*, none derivable from the file:

- **The body enters context once and is never re-read**, so guidance meant to hold for a whole task must be written as a standing instruction.
- **A mid-session reload registers a new skill's NAME but not its `description`, so it is invocable and cannot auto-fire.** `/reload-skills` makes a skill written this session resolve by name, while its listing shows an empty description, and the description is what the model matches a request against. Measured 2026-09-17 on two skills created in-session; four others on disk showed the same blank, and `hobby-review` went blank→populated across the same reload. The reload output reads like confirmation, so a trigger test done then measures the registry, not the description. **A trigger test is only meaningful in a session started after the file was written.**
- **After a compaction, only the first 5,000 tokens of each skill are re-attached** (25,000 shared, most-recently-invoked first). The rest silently stops existing while the skill still reports as invoked. Count in tokens with a tokenizer, never `bytes ÷ 4`: this corpus runs 4.46 bytes per token, so the divisor over-reports by ~12% (17% on dense files). On 2026-09-12 `cl100k_base` put all 38 skills under the ceiling while the divisor flagged three. Five skills were over by 2026-09-29 (`haiku`, `done`, `refresh-instructions`, `condense-task-doc`, `uiux`), so re-measure rather than trust a recorded count. An inflated count reads as a breach to fix, so it buys an extraction pass against an imaginary overage. 📖 `skills/update-plugin/references/harness-constraints.md` holds the count command and measured figures.

**That divisor is a RECURRENCE: the first fix corrected the figures and left the method.** 1.261.0 quantified the bug and patched the figures, but `harness-constraints.md` kept prescribing `bytes ÷ 4` for ten more versions, until a re-derivation on 2026-09-12. A corrected number reads as a closed case, so **after disproving a figure, fix the method that computed it.** **Tell: your changelog entry lists corrected values and names no method.**

### Where a rule goes, by when it must fire {#rule-placement}

Every mechanism loads at a *moment*, and a rule in the wrong one is correct, present and silently inert. Choose by when the rule must be in front of the reader, not by which file the topic belongs to.

| Must fire | Put it in | Loads |
|---|---|---|
| Every turn, no exceptions | A `UserPromptSubmit` hook's stdout | Once per turn; the harness injects it |
| Every session, surviving compaction | `hooks/RULESET.md` via the SessionStart hook, or a project-root `CLAUDE.md` | Session start and `compact` (context pressure, not turn count, so a session that never fills its window never re-fires) |
| When a matching file is touched | `.claude/rules/*.md` with `paths:` frontmatter | On read of a matching path |
| When a named task starts | A skill body, first 5,000 tokens | On invoke |
| Only if the reader chooses to look | A `📖` reference | Never, unless opened |

**A rule that failed twice cannot be fixed by rewording it; move it to another row of the table above.** Skill bodies and CLAUDE.md are read once, so a verdict reached many turns later is answered from recall, which keeps the parts that matched the situation and drops the one that applied. Measured 2026-09-10 and at least eight times before it (`grep -i "never reached\|re-attach" CHANGELOG.md`): each reword restated the rule or moved it nearer the act, and the next session failed through another door. Moving it within an equally unread file changes nothing.

Two consequences. A `📖` pointer defers a rule and never delivers one, so the sentence telling a reader they *have* a problem stays inline and only the fix procedure moves. A rule that must hold on every turn has one home, a hook, because it is the only mechanism the harness executes rather than the model choosing to consult. **Tell: you are about to reword a rule for the second time.**

**`allowed-tools:` pre-approves; it never restricts.** Unlisted tools stay callable. The field only waives the prompt for what it names, until the user's next message. `disallowed-tools:` is the field that removes a tool. A skill that spawns agents needs no `Agent` entry (`done`, `ship`, `agent-setup` omit the line). Reading the grant as a whitelist makes an unlisted tool look blocked when it isn't. Skills use hyphenated `disallowed-tools:`, subagents camelCase `disallowedTools:`, and each is inert in the other's file. *(Verified against `code.claude.com/docs/en/skills.md`, 2026-08-20.)*

**Agent templates** (`skills/agent-setup/templates/*.template.md`) define project-local agents that read CLAUDE.md at runtime:
```yaml
---
name: agent-name
description: When to invoke
tools: Read, Grep, Glob, Edit           # An allowlist. Omit the line to inherit every tool
disallowedTools: [Write, Edit]          # camelCase here; resolved BEFORE tools
model: sonnet
color: red
memory: project                         # user | project | local; its own MEMORY.md, not the session's
skills: [api-conventions]               # Preloads the skill's FULL text at spawn
permissionMode: default                 # Ignored for plugin subagents
maxTurns: 20
isolation: worktree                     # Run in a throwaway git worktree
---
```

Agent frontmatter is a **different namespace from skill frontmatter**. `disallowedTools:` is camelCase for an agent, `disallowed-tools:` hyphenated for a skill, and a misspelling fails silently. So verify a read-only agent by whether the enforcing line exists, never by whether the file looks read-only. When both fields are set, `disallowedTools` resolves first and `tools` narrows against what remains.

A subagent inherits the CLAUDE.md hierarchy and a git-status snapshot, never the parent's conversation, output style or auto memory; a `fork` inherits everything. Built-in `Explore` and `Plan` skip CLAUDE.md inheritance, which is why the Bootstrap pattern has them read it at runtime.

Subagents **can** spawn subagents, three layers deep. The no-redelegation rule is a policy choice, and the only mechanical enforcement is omitting `Agent` from `tools:`. *(Verified against `code.claude.com/docs/en/sub-agents.md`, 2026-08-20.)*

**Passing `name:` to `Agent` makes the agent an addressable teammate whose plain-text final output never reaches the caller.** The caller gets a completion notification with no findings, so a prompt that doesn't ask for `SendMessage` yields a run where every agent completes and the reports are simply absent, indistinguishable from a fan-out that worked. It is non-deterministic: six identically spawned agents split one reporting against five not (#27), so a run whose reports arrived proves nothing. Either tell every named agent to report via `SendMessage`, or omit `name:`. Keep naming only when mid-flight addressability matters (correcting an agent, claiming a file back before editing it).

### The SessionStart Hook

`hooks/hooks.json` `cat`s `hooks/RULESET.md` into a session at startup, on matchers `startup|resume|clear|compact`. It is auto-discovered by well-known path; neither manifest declares a `hooks` field.

**`fork` is the fifth documented matcher and is deliberately absent.** A session forked via `--fork-session`, `/fork` or `/branch` gets no ruleset. Its behaviour was never verified, and an unverified matcher was the worse trade against a bounded gap. Adding it is a one-token change once someone confirms what a forked session does with hook output; then the "every session" wording in `README.md` and the changelog can drop its carve-out.

**There is no script, deliberately.** `${CLAUDE_PLUGIN_ROOT}` expands in `hooks.json` but not in a script body, so a script would have to find the ruleset from `$0`. A frontmatter-bearing ruleset would also need strip logic, whose edge cases are what the upstream reference suite exists to catch. `cat` needs neither.

**Hook stdout is capped at 10,000 characters; past it the session gets a file path and a 2,000-character preview.** Nothing fails: the hook reports success and the preview opens with rule 1. The only trace is "Output too large" in the start banner. `RULESET.md` sat over the cap from 2026-09-17 to 2026-10-08, so every rule past the first was missing for three weeks. Measure with `wc -m` (UTF-8 locale) before any pass lands. `.githooks/pre-commit` blocks a commit at the cap where `core.hooksPath` is set.

**`cat` rather than `node`, because Claude Code no longer guarantees Node.** The CLI is a native binary, and a version-managed `node` lives only in the shell profile, which an exec-form hook never sources. Check reachability with `env -i PATH="/usr/bin:/bin" sh -c 'command -v node'`; `/bin/cat` passes. Bare Windows without Git Bash gets a silent no-op.

**A missing ruleset is expected to degrade rather than block, but that is untested end-to-end.** `cat` exits 1 on ENOENT (verified); the hook docs say only exit 2 blocks and leave ENOENT undocumented. So the conclusion rests on a table, not a session started without the file. If a session fails to start, or `RULESET.md` moves behind a wrapper, suspect this first: rename the file, start a fresh session, see whether it comes up.

**There is no off-switch, and that was a decision rather than an oversight.** `cat` cannot read an env var, and adding a guard means adding a script back. Any future request to make it optional is a request to reopen the shape, not a small patch.

### The Mod

`hooks/src/mod.js` is a Claude Code mod: the band above the prompt, the `/sk` menu, the `/task-docs` reader, the `/changes` source-control view, the image gallery, session handoffs and pictures under Claude's terminal answers. Its rules, host-API traps, permissions and debugging steps (`~/.claude/doc-pane-cache/mod.log`) live in `hooks/CLAUDE.md`. Read it before planning, editing or debugging the mod, including from a task doc or a log; its automatic load on reading a `hooks/` file is not yet verified.

📖 `hooks/CLAUDE.md`

### Agent Definition Parity

Generated `.claude/agents/<name>.md` files must stay in sync with their source `skills/agent-setup/templates/<name>.template.md`. Patch the template in the same change, or the next `/agent-setup` run regenerates the old behavior. When fixing an agent, grep both locations and update every hit. Drift is silent: a spawn failure with `effort 'xhigh'/'max' not supported` is worth diffing against the template before treating it as an environment fault.

**Parity proves the two files agree, never that either is right.** An edit touching both leaves them matching whatever it did, so a regression in one pass is invisible to every later parity check. The frontmatter's own claims catch it: an agent whose `description:` says read-only while `tools:` grants `Write`/`Edit`, or a `disallowedTools` block a checklist demands and no template produces. Treat a checklist item no generated file can satisfy as a defect. A reviewer's "word-for-word identical" verdict was once contradicted by a three-line comparison that found two adapted constraint texts, so run the comparison yourself.

A safety-relevant grant is stated twice: once in frontmatter, once in the body prose that scopes it. A density or `unhobble-instructions` pass reads a YAML guard as prohibition-shaped and can strip it with the sentence explaining it. Where only body text scopes a grant, say so where the checklist verifies it.

**A YAML comment beside the grant is not that second statement.** `- Agent  # lets this agent spawn Explore agents` reads as a scoped grant but reaches the agent as nothing: the tool arrives with its generic description. Checking means reading the body for what the agent is told to spawn. `grep '^  - Agent'` also misses `task-builder`, which omits `tools:` to receive the full set. 📖 `skills/_shared/references/agent-may-not-redelegate.md`: the constraint every Agent-holding template states in body prose because of this.

**Drift is not always one file being behind.** Different passes edit each side (an unhobbling run rewrites the template's prose while a live fix moves a guard in the generated file), so each can lead on different axes. A wholesale copy in either direction discards the other side's improvement, and copying toward the template ships repo-specific text upstream. Decide per hunk. A `diff` whose changes cluster into distinct topics signals independent edits.

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

- **Git probes**: `git -C <plugin-dir>` walks up to an enclosing repo and can answer about the wrong one; use `git rev-parse --show-toplevel`. A git-reading step must say what happens when git *errors*: unversioned projects and repos with no first commit make `git status` succeed while every `git diff HEAD` fails. `rev-parse --git-dir` asks whether a repo exists; `rev-parse HEAD` asks whether a commit exists. `skills/_shared/references/verifying-a-write-landed.md` owns the substitutes; cite it.
- **State what to establish, not which command establishes it.** `stat -f '%Sm'` works on macOS and fails on Linux, and each variant is one more command to rot. Colleagues run this on their own setups, so a baked-in environment is imposed on them. The failures are quiet (a BSD flag meaning something else, an unmatched glob reporting `0`), and a confident wrong answer cannot be recovered from. Keep a literal invocation only where the exact invocation is the knowledge (a `mysqldump` flag set that took debugging, an SSH retry scoped to exit 255), and keep facts about how a tool behaves (`git diff` without `HEAD` misses the staged plane).
- **Prompting style**: Constitutional constraints (`❌ Never / ✅ Always` tables) for routing decisions. Validation loops (numbered checks) for file writes. A skill writing formatted output should re-read its own output against its style rule.
- **A guard belongs at the step that acts, and sibling sweeps key on the destructive act, not on how the actor is reached.** A condition settled early is not consulted by a later step, so re-derive it where the write, spawn or delete happens. A search for `subagent_type` finds skills that dispatch an agent and misses those that reach the same operation by a direct `Skill()` call or by telling the reader to delete a file. Grep for the dangerous operation (a whole-file rewrite, an `rm -rf`, an `Edit`) and check each hit for the guard. A caller-side gate does not cover its callee, which needs its own check, since a peer can start editing between the two writes. Issue #24 had two siblings (an ungated folder delete, an unguarded whole-file condense) that the dispatch-shaped grep reported clean.
- **A shell snippet in a SKILL.md is untested code, so run it before landing it.** Its failure is a wrong number, not an error. Run it against a real doc and check the output against a manual read, especially when restoring one from a bug report. A control must be able to fail in the direction you worry about: `grep -Ll` means `-l` on BSD (the later flag wins), so a coverage sweep listed every compliant file as non-compliant, while a file matching neither pattern vanished from both lists. Where a flag inverts a result, check one file on each side. Issue #22 restored a size check that undercounted every doc whose `## Next Steps` wasn't the last section.

#### Placing a rule or extracting shared machinery {#checklist-placement}

- **Shared rules**: a rule in 3+ skills moves to `skills/_shared/references/`. Paths resolve against the citing file: `../` from `skills/<name>/SKILL.md`, `../../` from `skills/<name>/references/*.md`. A wrong depth reads correctly in review and never 404s at authoring time, so `ls` the target from the citing file's own directory.
- **Extracting to a reference defers a rule; it does not deliver one.** Nothing forces a `📖` target to load, so a hop past the skill body lands well under half the time. The sentence that tells a reader they *have* the problem stays inline where it applies; only the fix procedure goes behind the citation. "Cite the owner rather than duplicating" is right about duplication and wrong about delivery. `skills/_shared/references/editing-skills-checklist.md` §"Pointer citations" owns the wording and the two-hop shape to avoid.
- **A rule governing every turn needs a host read early, not one whose topic matches.** A wrap-up skill reaches only sessions that invoke it. `read-summary` runs at the start of most sessions and ships to consumers, so it is the furthest-reaching skill host; this repo's own `CLAUDE.md` never loads in a consumer's session. Nothing re-injects a standing rule mid-session, so say plainly that it is best-effort where stated.

#### Registering and publishing a skill {#checklist-registry}

- **Skill registry sync**: The registry lives in two places: this file's Skills table and `README.md`. Both drift independently, so check each against what's actually on disk rather than against the other.
- **Plugin-internal paths**: `tasks/**` is not shipped in the marketplace. Verify against a git-sourced install, since a `directory` cache shows uncommitted files. Route writes through `update-plugin`, the only skill with an ownership gate. A colleague's GitHub install keeps a shallow clone at `~/.claude/plugins/marketplaces/syafiqkit`, refreshed on update (measured on `superpowers-marketplace`: `.git` updated 15/10), beside the per-version cache. Anything outside a skill (`tools/`) that a colleague links to or installs into points at the clone, never the cache. The official Anthropic marketplace is the exception (re-downloaded from GCS, not cloned). The folder name comes from `marketplace.json`'s `name`, unconfirmed while name and repo match.
- **Scope and naming**: When a name stops matching scope, rename in the same change, since a stale name under-fires forever. When a command's body becomes "run skill X", migrate it to a skill.
- **Model invocation**: Never add `disable-model-invocation` without user request, since it kills auto-suggestion. Default to proactive invocation.

#### Editing steps, citations or a restructure {#checklist-citations}

- **Internal cross-references**: cite a named heading or bullet, never a raw line number, which goes stale on any edit above it. **A citation that resolves can still misdescribe its target.** "X is already the rule" is a claim about the target's *scope*: a rule under one heading, or inside one template's fenced block, reads as general once cited generally. Open the target and find the heading the sentence lives under. If it is narrower than you need, widen it at the source; editing your citation to match leaves the next reader the same wrong scope.
- **Renumbering a file's own steps breaks every citation to them.** `Step 3a` is itself a heading, so flattening `3, 3a, 4, 4a` into `0–6` retires the label while every pointer still resolves, and the file reads as a clean sequence. Sibling skills and task docs cite steps by label, so one renumber stranded citations in two `_shared/references/` files and a live routing table. After changing a step's number or letter, grep the repo for the old label: a decision record's mention is history, but a live routing table or pointer is a citation to fix. **The old label is usually gone, so a clean grep proves nothing.** Sweep for the citation syntax (`rule [0-9]+`, `Step [0-9]`) and read every hit against what the number now names, including your own edits. Measured 2026-09-15 on `hooks/RULESET.md`: rule 10 moved to position 1, `grep "rule 10"` returned zero, and two `rule N` citations pointed at the wrong rule, one a cross-reference the pass had just rewritten. **Tell: your renumber check grepped for the old number and found nothing.**
- **A rewrite that absorbs a reference inline breaks the citation graph at both ends.** Pulling a fact up strands the file it pointed at: nothing 404s, and the orphan keeps collecting edits. Dropping a citation to shared machinery leaves inlined prose that reads complete while the reader is never routed to the machinery behind it. Neither shows in a resolve-check, a diff or a self-report. After any inlining, ask which files this one no longer cites and which absorbed facts had machinery behind them. An uncited reference is either content to fold in and delete, or a pointer to restore.

#### Retracting or deleting a rule {#checklist-retraction}

- **Retracting a rule reaches every file that prescribed it, which is always more than the entry naming the fix.** Adding a rule is bounded by where you put it; removing one leaves every other site still telling a reader to do the withdrawn thing, and those sites read as correct until the retraction. The changelog entry then certifies the wrong scope, since it names the files the fix touched. Measured 2026-09-03: 1.225.0 removed a token-diff verification step and patched the four files it named, while `unhobble-instructions/references/target-types.md` and `_shared/references/editing-skills-checklist.md` still prescribed it. A reviewer swept the four named files and found nothing else. So after a retraction, grep the corpus for the *practice* in its own vocabulary, and treat a surviving prescription as in scope even where it predates the fix. **Tell: your changelog entry says a step was removed and enumerates the files it was removed from.**
- **"Already stated elsewhere" justifies deletion only if *elsewhere* is reachable from where the reader stands, and this repo's `CLAUDE.md` is the trap.** A consumer loads their own `CLAUDE.md`, never ours, so a rule deleted as duplicated here may be the only copy they would ever see. The skill is what travels, so a rule a consumer needs lives there. Measured 2026-09-11: an `unhobble-instructions` pass removed the house-style rule as redundant with this file's opening, which is a one-line summary and a mode table, not the rule.
- **Before accepting a deletion as dedup, grep the whole tree for the mechanism, then name the survivor.** A fact with two homes is a dedup and one with a single home is a loss, and the diff looks identical either way. A dedup leaves a sole copy, so the next pass over that file must be told by name, with the cost. Measured 2026-09-11: `setup-playwright` shed its stale-bundle warning, correctly, because `uiux` states the mechanism in full. The next pass over `uiux` cut 24% and kept the warning only because its prompt named it as the last callout standing.

#### Verifying a sweep or a probe {#checklist-verification}

**Run the control in both directions.** A check that can never pass is as broken as one that can never fail, and it looks like a crisis rather than a bug. A pointer sweep that keeps the `📖` inside the path tests a string that cannot exist, so every pointer reports broken; stripping `${CLAUDE_SKILL_DIR}` turns a valid absolute path into a bogus relative one. One sweep reported 38 of 127 pointers broken when the real number was two. A failure rate too high to be plausible is evidence about the checker. Resolve one known-good and one known-bad case first. Both controls passing still does not clear the sweep, because a hand-rolled extractor feeds both cases through the same flaw. Print the extracted values and read a few against the file.

**A passing control does not make every hit a defect: `📖` marks several kinds of citation, and only some are paths.** The syntax also covers a repo-root path, a bare skill name (`syafiqkit:update-plugin`), and CHANGELOG prose about pointers, so `[ -e ]` reports those as broken. Measured 2026-09-11: seven hits across the changed files, one real. Classify each hit before believing any of them. A "broken" target that is not path-shaped at all means you are reading the classifier, not the corpus.

**Where the measured thing is what a session has in context, asking the session cannot measure it.** A model that judges a rule irrelevant answers "there is no such rule" just as one that never received it. A better bait buys a better-argued negative, and a positive control proves only that the channel works. Take load-state from outside the model (the harness's `Loaded <path>` report or `/context`); an absence established by asking is unmeasured. This cost four agreeing probes and a near-shipped wrong finding about `.claude/rules/` loading.

📖 `skills/_shared/references/editing-skills-checklist.md`: tool validation, reachability, registry sync, path portability and failure modes per edit class. Read it before writing a shell snippet into a skill body: a skill invoked with an argument has bare dollar-zero rewritten in its own instructions, which its audit command catches and no review would.

## Publishing and Versioning

### Version Bumping

**Run `git config core.hooksPath .githooks` once per checkout.** It arms `.githooks/pre-commit`, which blocks a commit where the two manifests disagree; that drift recurred ten times, caught by a reader every time. The setting is local config, so a fresh clone is unprotected with nothing to say so, and an unset `core.hooksPath` looks identical to a passing hook. `ship`'s version print covers only the ship path; a bare `/commit` on an unconfigured clone has no defence.

Version lives in two files and must match:

| File | Field |
|------|-------|
| `.claude-plugin/plugin.json` | `"version"` |
| `.claude-plugin/marketplace.json` | `plugins[0].version` |

Before editing, re-read both files, since working copies may disagree from an uncommitted bump. Take the highest value claimed. Bump and CHANGELOG entry are one atomic change; if the entry isn't ready, leave the version at baseline so its writer takes the number. Parallel agents each re-read before bumping. Run `claude plugin update syafiqkit@syafiqkit` once after all changes land, not mid-batch.

### Release Notes

Release notes state the reader's action, since consumers install without repo access: (1) the CLI command to update, (2) which prior output becomes invalid, (3) edge cases a reader would wonder about. Skill- or hook-only changes need no regeneration; mention it only when agents or templates changed.

### Testing Changes

After modifying commands or skills:
```bash
claude plugin update syafiqkit@syafiqkit
```

No build step: markdown files are interpreted directly.

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

- **`claude-md-pruner` scope is wider than its name**: It prunes task docs too. Renaming breaks silent gates in `update-claude-docs` and `agent-setup`. The name is inert for spawn; `description:` carries the real trigger surface.
- **Size policy lives in condense skills only**: CLAUDE.md thresholds → `condense-claude-md`; task doc thresholds → `condense-task-doc`. Callers may name a number as a trigger; never enforce size as policy.
- **Every change = version bump**: A fan-out of parallel edits means re-read before writing and expect to bump again if it moved.
- **House style is enforced on every CLAUDE.md the skills touch, consumer repos included**: installing this plugin buys an opinion about how a CLAUDE.md should be built, so a pass that finds a file written another way and defers to it delivers nothing. `update-claude-docs` (Rewrite, Create, and the Capture write step) and `condense-claude-md` apply `references/structure.md` regardless of whose repo they're in. **Consistency proves a pass was uniform, never that it was right**: an existing file's shape is what one pass left behind, not evidence anyone chose it. What still binds is content: the rule inventory and its diff, with the capture filter as the only licensed deletion. **Task docs are the exception** (`tasks/**`, `task-summary`): there, drift is a section going missing, not a shape that differs.
