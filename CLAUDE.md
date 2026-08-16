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
| `brainstorming` | Design exploration before creative or architectural work |
| `commit-invoice-generator` | Generate invoice line items from git commits |
| `md-to-pdf` | Convert Markdown to PDF with rendered Mermaid diagrams |
| `gchat-format` | Convert Markdown to Google Chat message format |
| `pull-db` | Transfer MySQL/MariaDB database from remote server to local dev |
| `notes-summary` | Create/update/read a personal session journal outside the repo (`~/.claude/notes/`) for boss/team/career/strategy conversations — powers the `read-notes`/`update-notes` commands |
| `skill-creator` | Create a new skill — judges whether it should be one, drafts SKILL.md, registers it |
| `update-plugin` | Capture plugin learnings and patch SKILL.md files after authoring work |
| `update-claude-docs` | Create, rewrite, or condense CLAUDE.md files |
| `condense-task-doc` | Aggressively condense a bloated task doc; splits >300 lines into index + decisions |
| `condense-claude-md` | Aggressively condense a bloated CLAUDE.md (removes excess — not the analog that adds content) |
| `agent-setup` | Create or update project-local agents using Bootstrap pattern |
| `haiku` | Run a task or a named skill on one or more haiku agents instead of this session, then verify the result before reporting — snapshot, identifier/number survival, and the reworded-claim check a grep can't catch |
| `unhobble-instructions` | Audit + rewrite a SKILL.md/agent/CLAUDE.md/command for overconstraint (rigid imperatives, "Tell:" trip-wires, mechanical thresholds) vs. genuine fact. Narrower and stricter than a plain density pass — the lens is judgement-vs-constraint, not byte count |
| `self-organize-agent-memory` | A project agent's own `.md` definition has a bloated inline reference table crowding out its procedural steps — dispatch THAT SAME agent onto its own file to decide what stays inline vs. what moves to `.claude/agent-memory/<agent>/`. Verify with an identifier sweep afterward, never trust the migration summary alone |

### Proactive invocation (model auto-fires on symptom match)

| Skill | Trigger |
|-------|---------|
| `read-summary` | Before answering architectural/investigative/project-context questions |
| `brainstorming` | Before creative or architectural design work |
| `pull-db` | When session involves remote database work |
| `hobby-review` | After user reports finishing a book, game, show, or hobby item |
| `function-parameter-limits` | On "too many parameters" or parameter count concerns |
| `merge-task-docs` | Find related task docs in a domain, classify by subsystem boundary (not keyword), merge into fewer docs, delete sources, reconcile all back-references |
| `sweep-doc-overlaps` | Fleet-wide parallel scan across ALL `tasks/` domains for CROSS-domain merge candidates a single-domain `merge-task-docs` call would never see; hands confirmed groups to `merge-task-docs` for execution |
| `ci-ssh-deploy-timeout` | On "deploy keeps timing out" or SSH intermittency in CI |
| `setup-playwright` | On "e2e tests are flaky", "specs pass alone but fail together" |
| `uiux` | Design judgement for UI work at any scope — polish, rethink, redesign. Also fires when a screenshot arrives or someone reports what they *saw* without naming UI |

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
name: skill-name
description: Description for matching and invocation
allowed-tools: Bash(git:*), Read, Grep  # Tool restrictions
user-invocable: false                   # Default is true; set false to hide from /menu
context: fork                           # Optional: run in isolated subagent
model: sonnet                           # Optional: override model
---
```

⚠️ **Tool permission trap**: The `allowed-tools:` field is a fixed enum, not appendable. Adding `Agent` to the list silently fails. Skills that spawn agents omit the `allowed-tools:` line entirely — see `done`, `ship`, `agent-setup`.

**Agent templates** (`skills/agent-setup/templates/*.template.md`) define project-local agents that read CLAUDE.md at runtime:
```yaml
---
name: agent-name
description: When to invoke
tools: Read, Grep, Glob, Edit
model: sonnet
color: red
memory: project                         # Persistent memory scoped to project
---
```

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

- **Skill registry sync**: The registry lives in two places — this file's Skills table and `README.md`. Diff against disk to verify (`ls -d skills/*/`).
- **Plugin-internal paths**: `tasks/**` is not shipped in marketplace. Route writes through `update-plugin` (the only skill with an ownership gate).
- **Git probes**: `git -C <plugin-dir>` walks up to an enclosing repo and can answer about the wrong one. Use `git rev-parse --show-toplevel` instead to query the CWD. A skill step that reads state from git needs to say what happens when git *errors* rather than returns empty — consumers run these skills in unversioned projects and in repos whose first commit doesn't exist yet, where `git status` succeeds and every `git diff HEAD` fails. Those are two states, not one: `rev-parse --git-dir` asks whether a repo exists, `rev-parse HEAD` whether there's a commit to diff against, and a branch written for the first still breaks on the second. `skills/_shared/references/verifying-a-write-landed.md` owns the substitutes; cite it rather than restating them.
- **Scope and naming**: When a name stops matching scope, rename in the same change — a stale name under-fires forever. When a command's body becomes "run skill X", migrate it to a skill.
- **Shared rules**: When a rule appears in 3+ skills, extract it to `skills/_shared/references/` — reference files use literal relative paths resolved against the citing file's directory: `../` from `skills/<name>/SKILL.md`, `../../` from `skills/<name>/references/*.md`. Verify a new pointer resolves before landing it.
- **Prompting style**: Constitutional constraints (`❌ Never / ✅ Always` tables) for routing decisions. Validation loops (numbered checks) for file writes. A skill writing formatted output should re-read its own output against its style rule.
- **Model invocation**: Never add `disable-model-invocation` without user request — it kills auto-suggestion. Default to proactive invocation.
- **Internal cross-references**: Cite a named heading or bullet ("the every-invocation-vs-twice-a-year test"), never a raw line number ("line 28's trigger") — an edit above the citation shifts every number below it silently, and nothing re-checks the reference after that edit lands.
- **A rewrite that absorbs a reference inline breaks the citation graph at both ends, and no ordinary check looks at either.** Pull a fact up into the skill and the pointer usually goes with it, which strands the file it pointed at: nothing 404s, every surviving pointer still resolves, and the orphan sits there collecting the next author's edits. Drop a citation to shared machinery and the loss is quieter still, because the inlined prose reads complete — a reader told to "state the decision" but never routed to the file holding the one-versus-several shapes will improvise and feel finished. Neither shows up in a resolve-check, a diff, or a self-report; what finds them is asking, after any inlining, which files this one no longer cites and which of the absorbed facts had machinery behind them. A reference that ends up cited by nothing is either content to fold in and delete or a pointer to restore — leaving it is how the same severed citation gets restored twice by two different sessions.
- **A shell snippet in a SKILL.md is executable code that no test suite covers, so run it before landing it.** Nothing in this repo executes these commands until a live session does, and the failure mode is a wrong number rather than an error — a miscounted section or a budget verdict reads as authoritative either way. Run any snippet you write or change against a real doc and check the output against a manual read, especially when restoring one from a bug report or an older commit: a faithfully-transcribed command carries whatever bug it already had, and the report that sent you looking is evidence the snippet ran, never evidence it was right. A control has to be able to fail in the direction you're worried about, which a presence/absence check often can't: `grep -Ll` silently means `-l` on BSD grep (the later flag wins), so a coverage sweep listed every compliant file as non-compliant, and the control passed anyway because a file matching neither pattern is missing from a match-list and from a non-match list alike. Where a flag inverts a result, the control needs a file on each side. Issue #22 restored a size check that had been correct-looking for its whole life and undercounted every doc whose `## Next Steps` wasn't the last section.
- **A rule governing how a session behaves needs a host that's read early, not one whose topic matches.** A wrap-up skill only reaches sessions that invoke it, so a rule about how every turn should read lands nowhere if it sits in `done`. `read-summary` runs at the start of most sessions and ships to consumers, which makes it the furthest-reaching host a skill file offers; the user's own global `CLAUDE.md` reaches further still but doesn't ship, so it can't carry anything colleagues need. Nothing re-injects a standing rule mid-session — say plainly that it's best-effort where it's stated, so a later reader doesn't mistake the section heading for a gate.

📖 `skills/_shared/references/editing-skills-checklist.md` — tool validation, reachability analysis, registry sync, path portability, and failure modes per edit class. Read it before writing a shell snippet into a skill body: a skill invoked with an argument has bare dollar-zero rewritten in its own instructions, which the file's audit command catches and no review would.

## Publishing and Versioning

### Version Bumping

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
