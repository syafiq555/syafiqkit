# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working on this plugin — the syafiqkit Claude Code plugin providing personal workflow automation.

## Quick Start

Invoke skills directly by name: `/syafiqkit:<name>`. Skills are organized by invocation pattern below.

## Skills by Invocation Pattern

### Direct user invocation

These skills accept explicit user command:

| Skill | When to invoke |
|-------|----------------|
| `commit` | Create git commits from staged changes |
| `write-summary` | Create a task summary document |
| `update-summary` | Update an existing task summary |
| `task-summary` | Create/update task summaries with full machinery |
| `ship` | End-to-end release: commit → changelog → push → CI verify → release note |
| `plan-worklist` | A pre-scoped list of items (findings, backlog, ClickUp paste) → dispatch `product-reviewer` to size/sequence each against product intent → present the plan and stop, don't build |
| `done` | Post-task cleanup orchestrator |
| `quick-done` | Fast cleanup for sessions known to be small and low-risk |
| `read-summary` | Discover and read task docs or project CLAUDE.md before answering, investigating, or implementing; Plan-Mode-aware (judges Explore/Plan subagent delegation vs continuing inline) |
| `tackle` | Vague multi-item doc continuation ("let's continue") → `read-summary`, judge what's buildable vs blocked, build, `done`. A specific ask is `read-summary`'s job, not this |
| `judgement` | Something came up mid-task that may not be yours to decide (adjacent defect, fix that refuses what currently succeeds, scope question) → measure who it newly affects, then decide or escalate. Shaping a question you've already decided to ask is `decision-first-output.md` |
| `brainstorming` | Design exploration before creative or architectural work |
| `commit-invoice-generator` | Generate invoice line items from git commits |
| `md-to-pdf` | Convert Markdown to PDF with rendered Mermaid diagrams |
| `excalidraw-board` | Turn a task doc or worklist into a black-and-white Excalidraw discussion board (now / gated on our build / waiting on others, GATE cards, PARKED table with revive triggers, decisions-questions-actions strip); generated from a spec, pasted into the user's excalidraw.com tab, verified by screenshot. Charts are `dataviz`; deciding what to build is `plan-worklist` |
| `user-manual` | Write/extend an END-USER manual — scope from what users do, Diátaxis shape, screenshots from a dedicated E2E capture spec, `.docx`/`.pdf` editions. Distinct from `md-to-pdf`, which only converts a document whose content is already settled |
| `design-handoff` | Write a brief for someone ELSE to design a screen (external designer, Claude Design, contractor) — ship purpose, audience, business/legal rules and measured failures; withhold layout, component and step-count decisions. Designing it YOURSELF is `uiux` |
| `gchat-format` | Convert Markdown to Google Chat message format — a document posted to a thread. A message in the sender's own voice to a named person is `casual-message` |
| `casual-message` | Write a casual 1:1 message in the sender's own voice — a WhatsApp reply, a colleague DM, "tell X that…". Register is inferred, not asked; no fence, no headers. A document being converted for Chat is `gchat-format` |
| `continue-session` | Produce the copy-paste prompt that starts a fresh session where this one stopped — task doc path, one next task, blocker, uncommitted state |
| `pull-db` | Transfer MySQL/MariaDB database from remote server to local dev |
| `notes-summary` | Create/update/read a personal session journal outside the repo (`~/.claude/notes/`) for boss/team/career/strategy conversations — powers the `read-notes`/`update-notes` commands |
| `skill-creator` | Create a new skill — judges whether it should be one, drafts SKILL.md, registers it |
| `update-plugin` | Capture plugin learnings and patch SKILL.md files after authoring work |
| `setup-project-docs` | Establish a project's core doc set — PRD, ARCHITECTURE.md, ARCHITECTURE-ESSENTIALS.md, CLAUDE.md/AGENTS.md — greenfield by derivation, or by archaeology when adopting an existing codebase |
| `extract-shared-package` | Pull a module two or more apps need into a shared Composer or npm package — boundary first, then shape (one package, an entry per capability), hosting read off how each consumer installs at deploy, exact pins, multi-version proof, strangler rollout |
| `update-claude-docs` | Create, rewrite, or condense CLAUDE.md files |
| `condense-task-doc` | Aggressively condense a bloated task doc; splits >300 lines into index + decisions |
| `condense-claude-md` | Aggressively condense a bloated CLAUDE.md (removes excess — not the analog that adds content) |
| `agent-setup` | Create or update project-local agents using Bootstrap pattern |
| `haiku` | Run a task or a named skill on one or more haiku agents instead of this session, then verify the result before reporting — snapshot, identifier/number survival, and the reworded-claim check a grep can't catch |
| `unhobble-instructions` | Audit + rewrite a SKILL.md/agent/CLAUDE.md/command for overconstraint (rigid imperatives, "Tell:" trip-wires, mechanical thresholds) vs. genuine fact. Narrower and stricter than a plain density pass — the lens is judgement-vs-constraint, not byte count |
| `refresh-instructions` | Full three-pass refresh on any living doc — a CLAUDE.md, a task doc, a `docs/` set file, a README or runbook: restructure → condense → unhobble, each dispatched on `haiku` and verified before the next starts. For one pass alone, invoke that skill directly instead; a SKILL.md or agent file wants `unhobble-instructions` alone |
| `self-organize-agent-memory` | A project agent's own `.md` definition has a bloated inline reference table crowding out its procedural steps — dispatch THAT SAME agent onto its own file to decide what stays inline vs. what moves to `.claude/agent-memory/<agent>/`. Verify with an identifier sweep afterward, never trust the migration summary alone |

### Proactive invocation (model auto-fires on symptom match)

| Skill | Trigger |
|-------|---------|
| `read-summary` | Before answering architectural/investigative/project-context questions |
| `brainstorming` | Before creative or architectural design work |
| `judgement` | About to send an unmeasured either/or ("should I fold this in", "is this in scope"), or about to stay silent on a real finding found mid-task |
| `pull-db` | When session involves remote database work |
| `hobby-review` | After user reports finishing a book, game, show, or hobby item |
| `function-parameter-limits` | On "too many parameters" or parameter count concerns |
| `merge-task-docs` | Find related task docs in a domain, classify by subsystem boundary (not keyword), merge into fewer docs, delete sources, reconcile all back-references |
| `sweep-doc-overlaps` | Fleet-wide parallel scan across ALL `tasks/` domains for CROSS-domain merge candidates a single-domain `merge-task-docs` call would never see; hands confirmed groups to `merge-task-docs` for execution |
| `ci-ssh-deploy-timeout` | On "deploy keeps timing out" or SSH intermittency in CI |
| `setup-playwright` | On "e2e tests are flaky", "specs pass alone but fail together" |
| `uiux` | Design judgement for UI work at any scope — polish, rethink, redesign, greenfield or existing app. Mobile-first by default; judges whether an existing design language, library or framework is dated; designs for people who scan. Also fires when a screenshot arrives or someone reports what they *saw* without naming UI |
| `design-handoff` | About to volunteer a layout, component list or step breakdown for a screen someone else is designing, or asked for "the prompt" / "business side only" for another designer |
| `gchat-format` | Asked to send, post or format anything for Google Chat — a release note, a status update, an announcement going to a thread |
| `casual-message` | Asked to reply to, text, or tell a NAMED person something — before drafting, so register isn't inherited from a document-shaped default |
| `continue-session` | A session is ending with work deferred rather than finished, or the user says they're running low on context / starting fresh |

### Sub-skills (spawned from other skills)

| Skill | Spawned by |
|-------|-----------|
| `task-summary` | `/write-summary`, `/update-summary`, `/done` |
| `read-summary` | `/tackle`, `/done` Step 1 |
| `brainstorming` | `/done` (on architectural decisions) |

### Commands

| Command | Purpose |
|---------|---------|
| `read-notes` | Read a personal session journal |
| `update-notes` | Create/update a personal session journal |

## Typical Workflow Sequences

These skills compose but are invoked as separate commands, not chained:

1. **Commit + release**: `/commit` + `/ship` — usually given as one instruction; `/ship` includes its own commit step.
2. **Post-ship documentation**: `/update-summary` (delegates to `task-summary`), then `/update-claude-docs` — separate invocations.
3. **Plugin maintenance**: `/update-plugin` invoked standalone, sometimes much later. Mid-skill "extend this too" instructions widen the CURRENT run's scope, not a cue to re-invoke.
4. **Small sessions**: `/quick-done` is an alternative to `/done`, never both — for sessions already known to be low-risk. `/done` is the default.

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
name: skill-name                        # Optional — defaults to the directory name
description: Description for matching and invocation
when_to_use: extra trigger phrases      # Appended to description; the two share a 1,536-char cap
allowed-tools: Bash(git:*), Read, Grep  # Pre-approves these for one turn — see below
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

- **The body enters context once and is never re-read.** Guidance meant to hold for a whole task has to be written as a standing instruction, because there is no later turn where the file gets consulted again.
- **A mid-session reload registers a new skill's NAME but not its `description`, so it is invocable and cannot auto-fire.** `/reload-skills` (or `/reload-plugins`) makes a skill written this session resolve by name — the `Unknown skill` error goes away and the body loads in full — while the listing shows it with an empty description, and the description is what the model matches a request against. So the skill is reachable only by someone typing its name, which is exactly the half a proactive skill doesn't need. Measured 2026-09-17 on two skills created in-session, against four others (`excalidraw-board`, `sweep-doc-overlaps`, `user-manual`, `self-organize-agent-memory`) showing the same blank with full descriptions on disk, while `hobby-review` went blank→populated across the same reload. The trap is that the reload output *reads* like confirmation: the skill is in the count and the file parses identically to a working sibling, so a trigger test done now measures the registry rather than the description. **A trigger test is only meaningful in a session started after the file was written.**
- **After a compaction, only the first 5,000 tokens of each skill are re-attached** (25,000 shared across skills, most-recently-invoked first). Everything past that boundary silently stops existing, and the skill still reports as invoked. Measure a SKILL.md against that ceiling rather than against how long it looks — **in tokens, with a tokenizer, never by dividing bytes.** This corpus averages 4.46 bytes per token, so `bytes ÷ 4` over-reports by ~12% and by 17% on a dense file; measured with `cl100k_base`, all 38 skills sit under the ceiling while the divisor flags three. The error runs one way only, which is what makes it costly: an inflated count presents as a breach to fix rather than as a ruler to doubt, so it buys a real extraction pass against an imaginary overage and the pass reports success either way. 📖 `skills/update-plugin/references/harness-constraints.md` holds the one-line count command and the measured figures.

⚠️ **That divisor is a RECURRENCE, and the first fix is why — it corrected the figures and left the file prescribing the method.** 1.261.0 diagnosed this exact bug, quantified it ("a `bytes/4` proxy that overstates English prose by 15–20%"), and named four of six files as never having been over the ceiling. It patched those figures. `harness-constraints.md` went on prescribing `bytes ÷ 4` for another ten versions until a session re-derived the whole thing from scratch on 2026-09-12. Correcting a number never corrects the rule that produced it, and a corrected number reads as a closed case — so **after disproving a figure, find what computed it and fix that, or you have bought one clean number and left the generator running.** This is the same shape as "correcting a premise does not correct the rules citing it", pointed the other way: there, the premise moved and its dependents went stale; here, the dependents were fixed and the premise survived. **Tell: your changelog entry lists corrected values and names no method.**

### Where a rule goes, by when it must fire {#rule-placement}

Every mechanism here loads at a *moment*, and a rule placed in the wrong one is correct, present and silently inert. Choose by asking when the rule has to be in front of the reader, not by which file the topic belongs to — the topic question is what produces a well-written rule nobody reads at the decision.

| Must fire | Put it in | Loads |
|---|---|---|
| Every turn, no exceptions | A `UserPromptSubmit` hook's stdout | Once per turn; the harness injects it |
| Every session, surviving compaction | `hooks/RULESET.md` via the SessionStart hook, or a project-root `CLAUDE.md` | Session start + re-fires on `compact` — which is context pressure, not turn count, so a long session that never fills its window never re-fires |
| When a matching file is touched | `.claude/rules/*.md` with `paths:` frontmatter | On read of a matching path |
| When a named task starts | A skill body, first 5,000 tokens | On invoke |
| Only if the reader chooses to look | A `📖` reference | Never, unless opened |

⚠️ **A rule whose failure happens many turns after its file was read cannot be fixed by rewording it, and the rewrite feels like the fix every time.** Skill bodies and CLAUDE.md are read once; a verdict reached after a background agent returns, or a question asked forty turns in, is answered from recall — and recall returns the parts that matched the situation while dropping the one that applied. Measured 2026-09-10 and at least eight times before it (`grep -i "never reached\|re-attach" CHANGELOG.md`): each fix restated a rule better or moved it nearer the act, and the next session failed the same way through a different door. So when a rule has failed twice, stop editing its wording and change *which row of the table above it lives in*. Moving a rule within a file that is equally unread at decision time changes nothing.

Two consequences worth stating plainly. A `📖` pointer defers a rule and never delivers one, so the sentence telling a reader they *have* a problem stays inline and only the fix procedure moves. And a rule that genuinely must hold on every turn has exactly one home — a hook — because that is the only mechanism the harness executes rather than the model choosing to consult. **Tell: you are about to reword a rule for the second time.**

⚠️ **`allowed-tools:` pre-approves; it never restricts.** Every tool stays callable whether or not it is listed — the field only waives the permission prompt for what it names, and the grant expires when the user sends their next message. So a skill that spawns agents needs no `Agent` entry, and omitting the line costs that skill nothing (`done`, `ship`, `agent-setup` omit it). The field that actually removes a tool is `disallowed-tools:`, which is a different field with a different job. Reading the grant as a whitelist is the trap: it makes an unlisted tool look blocked when it isn't, so a skill can appear sandboxed while holding the full set. Note the spelling differs by surface — skills use hyphenated `disallowed-tools:`, subagents use camelCase `disallowedTools:`, and each is inert in the other's file. *(Verified against `code.claude.com/docs/en/skills.md`, 2026-08-20.)*

**Agent templates** (`skills/agent-setup/templates/*.template.md`) define project-local agents that read CLAUDE.md at runtime:
```yaml
---
name: agent-name
description: When to invoke
tools: Read, Grep, Glob, Edit           # An allowlist. Omit the line to inherit every tool
disallowedTools: [Write, Edit]          # camelCase here; resolved BEFORE tools
model: sonnet
color: red
memory: project                         # user | project | local — its own MEMORY.md, not the session's
skills: [api-conventions]               # Preloads the skill's FULL text at spawn
permissionMode: default                 # Ignored for plugin subagents
maxTurns: 20
isolation: worktree                     # Run in a throwaway git worktree
---
```

Agent frontmatter is a **different namespace from skill frontmatter**, and the overlap is where mistakes live. `disallowedTools:` is camelCase for an agent and hyphenated `disallowed-tools:` for a skill; each is inert in the other's file, and a misspelling fails silently rather than erroring — which is why a read-only agent is verified by whether the enforcing line exists, never by whether the file "looks read-only". When both fields are set, `disallowedTools` resolves first and `tools` is then narrowed against what remains.

A subagent inherits the whole CLAUDE.md hierarchy and a git-status snapshot, but never the parent's conversation, output style, or auto memory — a `fork` is the one exception that inherits everything. Built-in `Explore` and `Plan` skip the CLAUDE.md inheritance entirely, which is why the Bootstrap pattern has them read it at runtime.

Subagents **can** spawn subagents, up to three layers deep. The plugin's no-redelegation rule is therefore a policy choice rather than a capability limit, and the only mechanical enforcement is omitting `Agent` from `tools:`. *(Verified against `code.claude.com/docs/en/sub-agents.md`, 2026-08-20.)*

⚠️ **Passing `name:` to `Agent` changes how the result comes back: the agent becomes an addressable teammate whose plain-text final output never reaches the caller.** What arrives is a completion notification carrying the fact that it finished and none of what it found, so a prompt that doesn't ask for `SendMessage` produces a run where every agent completes, every notification lands, and the reports are simply absent — indistinguishable from a fan-out that worked. It is also non-deterministic, so a run whose reports did arrive is no evidence the clause is unnecessary: six identically-spawned agents split one-reporting against five-not (#27). Either tell every named agent to report via `SendMessage`, or omit `name:` and let results return as ordinary tool results — naming is worth keeping only when mid-flight addressability is (correcting an agent, or claiming a file back before editing it).

### The SessionStart Hook

`hooks/hooks.json` `cat`s `hooks/RULESET.md` into a session at startup, on matchers `startup|resume|clear|compact`. It is auto-discovered by well-known path — neither manifest declares a `hooks` field, and adding one is not required.

**`fork` is the fifth documented matcher and is deliberately absent**, so a session forked via `--fork-session`, `/fork` or `/branch` gets no ruleset. Its behaviour was never verified, and shipping an unverified matcher was the worse trade against a bounded, nameable gap. Adding it is a one-token change once someone confirms what a forked session does with hook output — at which point the "every session" wording in `README.md` and the changelog can lose its carve-out.

**There is no script, deliberately.** A hook's contract is that stdout becomes context, which `cat` satisfies alone. An intermediate script would reintroduce two problems that don't otherwise exist: `${CLAUDE_PLUGIN_ROOT}` expands in `hooks.json` but not inside a script body, so the script would have to resolve the ruleset from `$0`; and a ruleset with frontmatter would need strip logic, whose edge cases (a closing `---` with trailing whitespace, an unterminated fence) are the bugs the upstream reference implementation's test suite exists to catch. No script, no frontmatter, neither problem.

**`cat` rather than `node`, because Claude Code no longer guarantees Node.** The CLI ships as a native binary, so installing it brings no Node, and a version-managed `node` (nvm, Herd) is present only via the shell profile — which an exec-form hook never sources. Verify with `env -i PATH="/usr/bin:/bin" sh -c 'command -v node'` before assuming any interpreter is reachable; `/bin/cat` passes that check and is a POSIX guarantee on macOS and Linux. The consequence is that bare Windows without Git Bash gets a silent no-op.

**A missing ruleset is expected to degrade rather than block, but that has not been observed end-to-end.** `cat` exits 1 on ENOENT (verified), and the hook docs say only exit 2 blocks a session while leaving ENOENT handling itself undocumented — so the conclusion rests on a documented table rather than a session started with the file absent. The no-guard design leans on this, so anyone who moves `RULESET.md` behind a wrapper, or sees a session fail to start, should treat it as the first suspect and run the real test: rename the file, start a fresh session, see whether it comes up.

**There is no off-switch, and that was a decision rather than an oversight.** `cat` cannot read an env var, and adding a guard means adding a script back. Any future request to make it optional is a request to reopen the shape, not a small patch.

### Agent Definition Parity

Generated `.claude/agents/<name>.md` files must stay in sync with their source `skills/agent-setup/templates/<name>.template.md`. Editing an agent file requires patching its template in the same change; otherwise the next `/agent-setup` run regenerates the old behavior. When fixing an agent, grep both locations and update every hit. Drift is silent — a spawn failure with `effort 'xhigh'/'max' not supported` is worth diffing against the template before treating it as an environment fault.

**Parity proves the two files agree, never that either is right.** An edit that touches both — which is what the rule above asks for — leaves them matching whatever it did, so a regression introduced in one pass is invisible to every subsequent parity check. What catches it instead is the frontmatter's own claims: an agent's `description:` calling itself read-only while `tools:` grants `Write`/`Edit`, or a `disallowedTools` block a skill's checklist demands and no template produces. Read the tool grants against what the agent says it is, and treat a checklist item that no generated file can satisfy as a defect in one of them rather than an accepted deviation. A reviewing agent's verdict that a pair matches is not the diff either — a review reporting the pairs "word-for-word identical" was contradicted by a three-line comparison that found two whose constraint text had been adapted to each file's own structure. Run the comparison rather than accepting the finding, since a clean parity verdict is exactly what a silent drift produces.

A safety-relevant grant is worth stating twice — once in frontmatter, once in the body prose that scopes it — because a density or `unhobble-instructions` pass reads a YAML guard as prohibition-shaped machinery and can strip it along with the sentence explaining it. Where only body text scopes a grant, say so at the point the checklist verifies it, so the sentence is a checked artifact rather than incidental prose.

**A YAML comment beside the grant is not that second statement.** `- Agent  # lets this agent spawn Explore agents` reads as a scoped grant to whoever edits the file and reaches the agent as nothing — the tool arrives with its own generic description, so at runtime the grant is whatever the tool allows. The gap is invisible from the file, since the comment is the thing a reviewer sees and finds reassuring. Checking it means reading the body for what the agent is told to spawn, and grepping the tools block answers a different question: every template's comment looks compliant, and an agent that omits `tools:` altogether to receive the full set (`task-builder`) has no line for `grep '^  - Agent'` to match at all, so a sweep built on that pattern reports it as unaffected. 📖 `skills/_shared/references/agent-may-not-redelegate.md` — the constraint every Agent-holding template states in body prose because of this.

**Drift is not always one file being behind.** Each side gets edited by different passes — an unhobbling run rewrites the template's prose while a session fixing live agent behaviour moves a guard in the generated file — so both can be ahead of each other on different axes at once. "Patch its template in the same change" then produces the wrong repair, because a wholesale copy in either direction discards whichever improvement the other side was carrying, and the copy *toward* the template also ships repo-specific text ("this repo has no backend/frontend split") upstream into a file meant to be generic. Read the diff and decide per hunk which side is right before moving anything: a `diff <template> <agent>` where the changes cluster into distinct topics rather than one contiguous block is the signal that both were edited independently.

## Authoring Skills and Commands

### Conventions

Skills and commands follow these principles:

- **Autonomous over interactive** — complete without asking; use smart defaults.
- **Auto-create over abort** — missing docs become templates; don't block workflow.
- **Explicit criteria** — "2+ files OR business logic" not "significant changes."
- **Graceful degradation** — PRIMARY missing → auto-create; SECONDARY missing → skip + suggest.
- **Bootstrap pattern** — agents read CLAUDE.md at runtime; only essential rules inline.
- **Self-contained plugin** — never reference `~/.claude/CLAUDE.md` — other users won't have it.
- **User preferences in skills, not shared memory** — plugin `memory/` is version-controlled; personal prefs go in project-local memory or skill defaults.

### Authoring Checklist

When modifying or creating skills and commands:

- **Skill registry sync**: The registry lives in two places — this file's Skills table and `README.md`. Both drift independently, so check each against what's actually on disk rather than against the other.
- **Plugin-internal paths**: `tasks/**` is not shipped in marketplace. Route writes through `update-plugin` (the only skill with an ownership gate).
- **Git probes**: `git -C <plugin-dir>` walks up to an enclosing repo and can answer about the wrong one. Use `git rev-parse --show-toplevel` instead to query the CWD. A skill step that reads state from git needs to say what happens when git *errors* rather than returns empty — consumers run these skills in unversioned projects and in repos whose first commit doesn't exist yet, where `git status` succeeds and every `git diff HEAD` fails. Those are two states, not one: `rev-parse --git-dir` asks whether a repo exists, `rev-parse HEAD` whether there's a commit to diff against, and a branch written for the first still breaks on the second. `skills/_shared/references/verifying-a-write-landed.md` owns the substitutes; cite it rather than restating them.
- **Scope and naming**: When a name stops matching scope, rename in the same change — a stale name under-fires forever. When a command's body becomes "run skill X", migrate it to a skill.
- **Shared rules**: When a rule appears in 3+ skills, extract it to `skills/_shared/references/` — reference files use literal relative paths resolved against the citing file's directory: `../` from `skills/<name>/SKILL.md`, `../../` from `skills/<name>/references/*.md`. The depth is the whole trap, and reading a pointer never catches it: `../_shared/...` is correct in a SKILL.md and broken one directory down, while both look identical in review and neither 404s at authoring time. Resolve it as a path rather than by eye — `ls` the pointer's target from the citing file's own directory, which is the only check that fails when the depth is wrong.
- **Extracting to a reference defers a rule; it does not deliver one.** Nothing forces a `📖` target to load, so every hop past the skill body is the reading model's judgement and lands well under half the time. This decides what may be extracted at all, not merely how to word the pointer: the sentence a reader needs in order to know they *have* a problem stays inline at the moment it applies, and only the procedure for fixing it goes behind the citation. "Cite the owning file rather than duplicating it" is therefore right about duplication and wrong about delivery — a correctly-routed rule still never fires if its trigger left with it. `skills/_shared/references/editing-skills-checklist.md` §"Pointer citations" owns the wording that raises follow-through and the two-hop shape to avoid.
- **State what to establish, not which command establishes it.** A skill that says "read each file's modification time" works everywhere; one that says `stat -f '%Sm'` works on macOS and fails on Linux, and enumerating the variants is the same defect multiplied — five commands to maintain, each rotting on its own, and the list still incomplete for whoever runs this on Windows or under PowerShell. This plugin ships to colleagues on their own setups, so an environment baked into an instruction is an environment imposed on them. The failures are quiet rather than loud: a flag that means something else on BSD, an unmatched glob that reports `0`, a search keyed to wording that has since changed — each returns a clean-looking result that stops the reader looking further. A session that isn't told the command can work one out; it cannot recover from a confident wrong answer. Reserve a literal invocation for where the exact invocation IS the knowledge — a `mysqldump` flag set that took debugging to find, an SSH retry loop scoped to exit code 255 — and keep facts about how a tool behaves (`git diff` without `HEAD` misses the staged plane), since those are what a reader can't derive.
- **Prompting style**: Constitutional constraints (`❌ Never / ✅ Always` tables) for routing decisions. Validation loops (numbered checks) for file writes. A skill writing formatted output should re-read its own output against its style rule.
- **Model invocation**: Never add `disable-model-invocation` without user request — it kills auto-suggestion. Default to proactive invocation.
- **Internal cross-references**: Cite a named heading or bullet ("the every-invocation-vs-twice-a-year test"), never a raw line number ("line 28's trigger") — an edit above the citation shifts every number below it silently, and nothing re-checks the reference after that edit lands. **A citation that resolves can still misdescribe what it points at**, and that failure survives every check aimed at broken links: "X is already the rule" is a claim about the target's *scope*, so a rule sitting under one heading — or inside one template's fenced block — reads as general once cited generally, and the pointer resolving is what makes the claim look checked. Open the target and find the heading the sentence actually lives under before writing that it already covers your case; where it turns out narrower than you need, widening it at the source is the honest repair, since editing your own citation to match leaves the next reader deriving the same wrong scope.
- **Renumbering a file's own steps breaks every citation to them, and a named citation is no protection when the name is the number.** Citing a heading rather than a line survives edits above it, which is why the rule above prefers it — but `Step 3a` *is* a heading, and a restructure that flattens `3, 3a, 4, 4a` into `0–6` retires that label while leaving every pointer to it resolving against nothing. The breakage is silent in both directions: the renumbered file reads as a clean sequence, and the citing files still name a step that sounds real. It reaches further than the file too, since a step label is the natural way for a sibling skill or a task doc to cite a procedure — one such renumber here stranded citations in two `_shared/references/` files and a task doc's live routing table. After changing any step's number or letter, grep the repo for the old label before moving on, and treat a decision record's mention as history to leave alone while a live routing table or an instruction pointer is a citation to fix. ⚠️ **The sweep's own trap is that a renumber usually leaves the old label gone, so grepping for it returns clean while the live breakage is a citation carrying a number that still exists and now means something else.** Measured 2026-09-15 on `hooks/RULESET.md`: a `condense-claude-md` pass moved rule 10 to position 1 and renumbered the rest; `grep "rule 10"` returned zero, reading as a clean sweep, while two surviving `rule N` citations both pointed at the wrong rule — one of them a cross-reference I had just rewritten myself and therefore skimmed as known-good. So sweep for the *citation syntax* (`rule [0-9]+`, `Step [0-9]`) rather than for the retired label, and read every hit against what the number now names, including the ones you wrote this session — a grep returning N hits is unverified until all N are read, and your own edit is the one you will trust without checking. **Tell: your renumber check grepped for the old number and found nothing.**
- **A rewrite that absorbs a reference inline breaks the citation graph at both ends, and no ordinary check looks at either.** Pull a fact up into the skill and the pointer usually goes with it, which strands the file it pointed at: nothing 404s, every surviving pointer still resolves, and the orphan sits there collecting the next author's edits. Drop a citation to shared machinery and the loss is quieter still, because the inlined prose reads complete — a reader told to "state the decision" but never routed to the file holding the one-versus-several shapes will improvise and feel finished. Neither shows up in a resolve-check, a diff, or a self-report; what finds them is asking, after any inlining, which files this one no longer cites and which of the absorbed facts had machinery behind them. A reference that ends up cited by nothing is either content to fold in and delete or a pointer to restore — leaving it is how the same severed citation gets restored twice by two different sessions.
- **A shell snippet in a SKILL.md is executable code that no test suite covers, so run it before landing it.** Nothing in this repo executes these commands until a live session does, and the failure mode is a wrong number rather than an error — a miscounted section or a budget verdict reads as authoritative either way. Run any snippet you write or change against a real doc and check the output against a manual read, especially when restoring one from a bug report or an older commit: a faithfully-transcribed command carries whatever bug it already had, and the report that sent you looking is evidence the snippet ran, never evidence it was right. A control has to be able to fail in the direction you're worried about, which a presence/absence check often can't: `grep -Ll` silently means `-l` on BSD grep (the later flag wins), so a coverage sweep listed every compliant file as non-compliant, and the control passed anyway because a file matching neither pattern is missing from a match-list and from a non-match list alike. Where a flag inverts a result, the control needs a file on each side. Issue #22 restored a size check that had been correct-looking for its whole life and undercounted every doc whose `## Next Steps` wasn't the last section.

  **Run the control in both directions, because a check that can never pass is as broken as one that can never fail — and it announces itself as a crisis rather than a bug.** A pointer sweep that keeps the `📖` inside the path tests a string starting with an emoji, which cannot exist, so every pointer reports broken and the run reads as a catastrophic finding about the corpus. Stripping the variable out of a `${CLAUDE_SKILL_DIR}/...` pointer does the same thing from the other end, turning a valid absolute path into a bogus relative one. Both happened here in a single day, to three separate agents and to the session reviewing them; one reported 38 of 127 pointers broken when the real number was two. The tell is a failure rate too high to be plausible — a defect that common in a maintained corpus would have surfaced long ago, so the number is evidence about the checker. Before believing any sweep, resolve one case you *know* is good and one you know is bad; if the good one comes back failing, the output is about the tool. ⚠️ **Both controls passing does not clear the sweep, because they test the predicate and the bug is usually in what feeds it.** A hand-rolled extractor is the part that breaks — a regex capturing the `📖` into the path, a `${CLAUDE_SKILL_DIR}` stripped, an `awk` counting a `###` heading after a table as prose splitting the table — and a known-good and known-bad case both route through the *same* broken extractor, so the pair agrees and the result still describes nothing. Print the extracted values, not just the verdicts, and read a few against the file: an extractor is falsified by looking at what it produced, never by the pass/fail column it produced them into.

  **A passing control also does not mean every hit is a defect, because `📖` marks citations of several kinds and only some are paths.** The syntax is shared by a relative path, a repo-root-relative path, a bare skill name (`syafiqkit:update-plugin`), and prose in the CHANGELOG *about* pointers — so a sweep testing `[ -e ]` against each extracted string reports the last three as broken while the extractor is working perfectly. Measured 2026-09-11: seven hits across the changed files, one real. At that ratio the verdict column is noise and the classification is the whole job, so read each hit and say which kind it is before believing any of them. The tell that you are looking at this rather than at real breakage is a "broken" target that is not path-shaped at all.

  **Where the thing being measured is what a session has in context, a control in both directions is not enough — asking the session cannot measure it at all.** A model that receives a rule and judges it irrelevant answers "there is no such rule" in the same words as one that never received it, so the probe reads willingness rather than membership. Improving the payload makes it worse: a planted passphrase draws an injection refusal, and rewriting it as plausible project content draws a reasoned dismissal instead, so a better bait buys a better-argued negative. The positive control passes in both cases, which is precisely why it doesn't rescue you — proving the payload *can* load says the channel works, not that this negative means absence. Take load-state from outside the model, the harness's own `Loaded <path>` report or `/context`, and treat an absence established by asking as unmeasured. This cost four agreeing probes and a nearly-shipped wrong finding about `.claude/rules/` loading, on a claim that had already been graded twice before.
- **A guard belongs at the step that acts, and the sweep for its siblings keys on the destructive act rather than on how the actor is reached.** A condition settled early in a skill is not state a later step consults: the preamble check and the step that spawns, writes or deletes sit far apart, so only the nearer one gets read at the moment of acting, and the fix is to re-derive the condition where the action happens. Sweeping for other instances is where the shape misleads — a search for `subagent_type` finds every skill that *dispatches an agent* and none that reaches the same destructive operation by a direct `Skill()` call or by telling the reader to delete a file themselves, so a clean sweep certifies coverage the search could never have measured. Ask what the dangerous operation is (a whole-file rewrite, an `rm -rf`, an `Edit` by anything) and grep for skills that perform it, then check each for the guard. A caller-side gate also does not extend to what it hands off to: the callee has its own entry points and needs its own check, since the peer who starts editing between the two writes is invisible to both. Issue #24 was one such gate, and both siblings found afterwards — an ungated folder delete and an unguarded whole-file condense — were invisible to the dispatch-shaped grep that had just reported the fix complete.

- **Retracting a rule reaches every file that prescribed it, which is always more than the entry naming the fix.** Adding a rule is bounded by where you put it; *removing* one leaves every other site still telling a reader to do the withdrawn thing, and those sites read as correct because they were correct until the retraction. The CHANGELOG entry then certifies the wrong scope — it names the files the fix touched, which a later session reads as the files that needed touching. Measured 2026-09-03: 1.225.0 removed the token-diff verification step and patched the four files it named, while `unhobble-instructions/references/target-types.md` still said "verify by diffing every backtick-quoted identifier" and `_shared/references/editing-skills-checklist.md` still carried it as numbered step 2 of its verification list — both in the delegated-rewrite path the removal was written about. A reviewing agent swept the four named files and reported nothing elsewhere prescribed it. So after retracting a rule, grep the corpus for the *practice* in its own vocabulary rather than for the files the entry lists, and treat a surviving prescription as in scope even where it predates the fix. **Tell: your changelog entry says a step was removed and enumerates the files it was removed from.**
- **A rule governing how a session behaves needs a host that's read early, not one whose topic matches.** A wrap-up skill only reaches sessions that invoke it, so a rule about how every turn should read lands nowhere if it sits in `done`. `read-summary` runs at the start of most sessions and ships to consumers, which makes it the furthest-reaching host a skill file offers; the user's own global `CLAUDE.md` reaches further still but doesn't ship, so it can't carry anything colleagues need. Nothing re-injects a standing rule mid-session — say plainly that it's best-effort where it's stated, so a later reader doesn't mistake the section heading for a gate.

- **"Already stated elsewhere" is only a reason to delete if *elsewhere* is reachable from where the reader will be standing, and this repo's own `CLAUDE.md` is the trap.** A rewrite pass that finds a rule duplicated between a SKILL.md and this file will offer the file as the surviving copy, which is true for anyone working here and false for everyone else — a consumer running the skill in their own project loads *their* `CLAUDE.md`, never ours. The skill is the artifact that travels, so the skill is where a rule a consumer needs has to live, and a deletion justified by this file is a deletion of the only copy they would ever see. Measured 2026-09-11: an `unhobble-instructions` pass removed the rule that house style applies to any CLAUDE.md the skill touches, reporting it redundant with the file's own opening (it was not — that is a one-line summary and a mode table), and the surviving statement here would have reached nobody outside this checkout.

- **Before accepting a deletion as deduplication, grep the whole tree for the mechanism — and then say out loud what the surviving copy now is.** A fact with two homes is a dedup and a fact with one is a loss, and the diff looks identical either way, so the check is a repo-wide search for the mechanism's own words rather than a re-read of the file that lost it. Clearing it has a consequence worth writing down: the survivor is now a sole copy, and the next pass over *that* file has to be told so by name, with the cost attached. Measured 2026-09-11: `setup-playwright` shed its dead-server/stale-bundle warning, which was correct because `uiux` states the same mechanism in full — and the following pass over `uiux` cut 24% while keeping it intact only because its prompt named that callout as the last one standing.

📖 `skills/_shared/references/editing-skills-checklist.md` — tool validation, reachability analysis, registry sync, path portability, and failure modes per edit class. Read it before writing a shell snippet into a skill body: a skill invoked with an argument has bare dollar-zero rewritten in its own instructions, which the file's audit command catches and no review would.

## Publishing and Versioning

### Version Bumping

**Run `git config core.hooksPath .githooks` once per checkout.** It arms `.githooks/pre-commit`, which blocks a commit where the two manifests disagree — the drift below recurred ten times and a reader caught it every time, never a gate. Git will not adopt a hooks directory on its own and the setting is local config rather than a tracked file, so a fresh clone starts unprotected with nothing to say so; an unset `core.hooksPath` and a passing hook are indistinguishable from the commit's side. `ship`'s print-every-version step is the second layer, but it only covers the ship path — a bare `/commit` on an unconfigured clone has neither defence.

Version lives in two files and must match:

| File | Field |
|------|-------|
| `.claude-plugin/plugin.json` | `"version"` |
| `.claude-plugin/marketplace.json` | `plugins[0].version` |

Before editing, re-read both files — working copies may disagree from an uncommitted bump. Take the highest value claimed. Bump and CHANGELOG entry are one atomic change; if the entry isn't ready, leave the version at baseline and let whoever writes the entry take the number, avoiding collision in concurrent sessions. When multiple agents edit in parallel, each re-reads before bumping. Run `claude plugin update syafiqkit@syafiqkit` once after all changes land, not mid-batch.

### Release Notes

Release notes state the reader's action — consumers install without repo access. Include: (1) the CLI command to update, (2) what prior output becomes invalid (regenerate? re-run?), (3) edge cases the reader would wonder about. Skill- or hook-only changes need no regeneration; only mention it if agents or templates changed.

### Testing Changes

After modifying commands or skills:
```bash
claude plugin update syafiqkit@syafiqkit
```

No build step — markdown files are interpreted directly.

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
- **House style is enforced on every CLAUDE.md the skills touch, consumer repos included**: the opinion about how a CLAUDE.md should be built is what installing this plugin buys, so a pass that finds a file written another way and defers to it delivers nothing. `update-claude-docs` (Rewrite, Create, and the Capture write step) and `condense-claude-md` all apply `references/structure.md` regardless of whose repo they're in. The load-bearing sentence is that **consistency proves a pass was uniform, never that it was right** — an existing file's uniform shape is what one pass left behind, not evidence anyone chose it, so don't weigh it. What still binds is content: the rule inventory and its diff, with the capture filter as the only thing licensed to delete. ⚠️ **Task docs are the exception** and keep the opposite rule (`tasks/**`, `task-summary`): drift is a section going missing, not a shape that differs.
