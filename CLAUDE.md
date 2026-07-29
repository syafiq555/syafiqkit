# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Claude Code plugin providing personal workflow automation: commit messages, task summaries, documentation capture, invoice generation, PDF export, Google Chat formatting, remote DB sync, and end-to-end ship workflow.

## Plugin Structure

| Type | Location | Trigger |
|------|----------|---------|
| Command | `commands/*.md` | `/syafiqkit:<name>` |
| Skill | `skills/<name>/SKILL.md` | `/syafiqkit:<name>` or proactive |

## Commands & Skills

### Commands

| Command | Purpose |
|---------|---------|
| `read-notes` | Read a personal session journal |
| `update-notes` | Create/update a personal session journal |

### Skills

| Skill | Purpose | Used By |
|-------|---------|---------|
| `agent-setup` | Create/update project agents using Bootstrap pattern | `/agent-setup` or `/update-claude-docs` |
| `commit` | Create git commits from staged changes; single-repo and multi-repo | User invokes directly |
| `read-summary` | Discover + read task docs/CLAUDE.md before answering, investigating, or implementing; Plan-Mode-aware (judges Explore/Plan subagent delegation vs continuing inline) | User invokes, or model-invoked proactively before project-context-dependent work |
| `tackle` | Vague multi-item doc continuation ("let's continue") → `read-summary`, judge what's buildable vs blocked, build, `done`. A specific ask is `read-summary`'s job, not this | User invokes only for genuinely vague "let's continue" on a doc |
| `done` | Post-task cleanup orchestrator | User invokes directly |
| `task-summary` | Create/update task summary docs with path resolution, templates, cross-refs | `write-summary` skill, `update-summary` skill, `done` skill |
| `write-summary` | Create task summary (thin pointer → `task-summary` skill) | User invokes directly |
| `update-summary` | Update task summary (thin pointer → `task-summary` skill) | User invokes directly |
| `brainstorming` | Design exploration before creative/architectural work | User invokes or proactive |
| `commit-invoice-generator` | Generate invoice line items from git commits | User invokes directly |
| `md-to-pdf` | Convert Markdown to PDF with rendered Mermaid diagrams | User invokes directly |
| `gchat-format` | Convert Markdown to Google Chat syntax | User invokes or `/gchat-format` |
| `ship` | End-to-end ship: commit → changelog → push → CI verify → release note | User invokes directly |
| `pull-db` | Transfer MySQL/MariaDB DB from remote server to local dev (dump, scp, import, password reset) | User invokes or proactive |
| `hobby-review` | Socratic debrief of a hobby item (anime, book, game, etc.) against the taste rubric in the matching current.md | User invokes or proactive after "I watched/finished X" |
| `function-parameter-limits` | Advise + enforce the 0/2/3+ function-param rule (parameter-object/DTO refactors; ESLint/PHPMD/Pylint setup with DI-constructor carve-outs) | User invokes or proactive on "too many params" |
| `merge-task-docs` | Find related task docs in a domain, classify by subsystem boundary (not keyword), merge into fewer docs, delete sources, reconcile all back-references | User invokes or proactive when docs overlap |
| `sweep-doc-overlaps` | Fleet-wide parallel scan across ALL `tasks/` domains for CROSS-domain merge candidates a single-domain `merge-task-docs` call would never see; hands confirmed groups to `merge-task-docs` for execution | User invokes when no domain/keyword is named |
| `audit-instructions` | Fleet-wide prompt-engineering audit across BOTH instruction families — every `skills/*/SKILL.md` and every `CLAUDE.md`/`CLAUDE.local.md`/companion. Measures each corpus (emphasis, arrival ratio + trajectory, and density/`references` for skills only), grades on the four-verdict external-guidance method, routes flagged files to their owner (`update-plugin` · `update-claude-docs` · `condense-claude-md`). Owns no threshold; density is deliberately not a CLAUDE.md axis | User invokes when no single file is named |
| `update-plugin` | Scan the session for plugin learnings (misfired triggers, missing rules, wrong workflow steps, new skills), then patch the actual SKILL.md files. The plugin equivalent of update-claude-docs | User invokes explicitly after skill-creator work |
| `update-claude-docs` | Create / rewrite-to-best-practice / condense / capture-into CLAUDE.md files. The CLAUDE.md analog of `task-summary` (SKILL.md workflow + `references/structure.md` canonical template). Capture mode is `/done` Step 3's single CLAUDE.md writer | `done` skill Step 3, or user directly |
| `notes-summary` | Create, update, or read a personal session journal outside the repo (non-code conversations: boss/team/career/strategy) | User invokes directly |
| `condense-task-doc` | Aggressively condense a bloated task doc; SPLITS a whole-doc MADR >300 lines into index + `decisions/<theme>.md` | User invokes, or `task-summary` when a doc is >300 lines |
| `condense-claude-md` | Aggressively condense a bloated CLAUDE.md (removes excess — not the analog that adds content) | User invokes, or `update-claude-docs` Condense mode |
| `ci-ssh-deploy-timeout` | Diagnose CI/CD deploys that intermittently can't SSH the target; convert to a connect-retry pattern instead of allowlisting runner IPs | User invokes or proactive on "deploy keeps timing out" |

### Typical invocation sequence

These skills compose but are usually invoked as SEPARATE commands in sequence, not one chained instruction:

1. `/commit` + `/ship` — usually given together as one instruction; `ship`'s own commit step already covers it.
2. `/update-summary` (task-summary) then `/update-claude-docs` — run back-to-back as individual invocations after a ship, not combined.
3. `/update-plugin` — invoked standalone afterward, sometimes much later in the session. Frequently followed by mid-skill "improvise/extend this too" instructions — treat those as widening the CURRENT run's scope (e.g. patch sibling skills sharing the same mechanism, per its own Step 2 rule), not as a cue to re-invoke.
4. `/audit-instructions` → then, per flagged file, its owning skill as a SEPARATE follow-up (`update-plugin` for a SKILL.md · `update-claude-docs` for a CLAUDE.md · `condense-claude-md` only when a declared budget was crossed). The audit grades and routes; it never patches. Both owners have a graded-handoff branch that skips their session scan — a handoff arriving without one dies silently as "no signal."

## Project-Specific Agents

`/agent-setup` creates project-local agents in `.claude/agents/` using the **Bootstrap pattern** — agents read CLAUDE.md at runtime instead of having content injected. See `skills/agent-setup/templates/` for agent templates. `/done` uses these project agents (with fallback to external plugins).

⚠️ **MANDATORY — a fix to any agent file is a fix to BOTH copies AND every sibling sharing that line.** Two directions, one grep:

1. **Parity**: editing a generated `.claude/agents/<name>.md` requires patching its source `skills/agent-setup/templates/<name>.template.md` in the same change (and vice versa) — otherwise the next `/agent-setup` regenerates the old behavior. Recurred 4+ times.
2. **Blast radius**: agent files are written by copy-paste, so a wrong line is almost never in one file. Before fixing, `grep -rn` the literal line across `.claude/agents/` **and** `templates/`; fix every hit. A single `Agent`-tool comment claiming its host was `Explore` sat in **11 files** — found only by grepping past the one file the typo was noticed in.

## Command/Skill Anatomy

**Commands** (`commands/*.md`):
```yaml
---
description: Short description for skill list
argument-hint: "[optional hint]"        # Shows in autocomplete
---
```

**Skills** (`skills/<name>/SKILL.md`):
```yaml
---
name: skill-name
description: Description for matching
allowed-tools: Bash(git:*), Read, Grep  # Tool restrictions
user-invocable: false                   # Default is true; set false to hide from /menu
context: fork                           # Optional: run in isolated subagent
model: sonnet                           # Optional: override model
---
```

⚠️ **`allowed-tools:`/`tools:` is a fixed enum, not an appendable allowlist — there is no way to add `Agent` to an existing list.** A skill that needs to spawn agents (background Haiku drafts, sub-delegation) omits the `tools:`/`allowed-tools:` line entirely instead — see `done`, `ship`, `agent-setup`, none of which declare it. Appending `Agent` to an existing list silently fails to grant it.

**Agent templates** (`skills/agent-setup/templates/*.template.md`):
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

## Dependencies

`/done` skill uses project agents if available, otherwise falls back to external plugins:
```bash
claude plugin install code-simplifier@claude-plugins-official
claude plugin install feature-dev@claude-plugins-official
```

`/update-claude-docs` optionally uses (falls back to manual if unavailable):
```bash
claude plugin install claude-md-management@claude-plugins-official
```

## Testing Changes

After modifying commands/skills:
```bash
claude plugin update syafiqkit@syafiqkit
```

No build step — markdown files are interpreted directly.

## Conventions

| Rule | Rationale |
|------|-----------|
| Keep commands focused (single workflow) | Easier to compose, debug |
| Include examples in markdown | Helps Claude execute correctly |
| Use tables for structured guidance | More scannable than prose |
| Agents use Bootstrap pattern | Agents read CLAUDE.md at runtime; only ~15 critical rules kept inline for zero-latency access |
| Plugin must be self-contained | Never reference user's global `~/.claude/CLAUDE.md` - other users won't have it |
| User preferences → skill/command changes, not memory | Plugin `memory/` dir is shared repo — personal prefs go in user's project memory or baked into skill defaults |
| Commands/skills that need agents → instruct Claude to spawn, not "spawn" directly | Commands are prompts — Claude (the executor) reads and makes Agent tool calls. Same pattern as `/done` |
| A skill's SCOPE outgrows its NAME → rename it in the same change that widens it | A name that misdescribes scope is a trigger bug, not cosmetics: the description drives model invocation, so a skill named for half its job fires for half its cases. `continue-task` gained a greenfield path and became `tackle` immediately. Renaming is cheap (`git mv` + grep every reference); a stale name silently under-fires forever |
| Command outgrows "single workflow"? → Migrate to skill; if it's a pure alias into another skill, convert the wrapper itself to a skill (not a command) | A command can only invoke, never reference/point — once its whole body is "go run skill X," it belongs in `skills/`, registering `/name` via its own `name:` frontmatter. Precedent: `write-summary`/`update-summary` → `skills/write-summary`, `skills/update-summary` (thin pointers to `task-summary`); `read-summary`, `update-claude-docs` converted outright when their name matched the target skill (see `tasks/plugin-maintenance/madr-structure/decisions/core.md` D10) |
| Same rule/table duplicated verbatim across 3+ SKILL.md files → extract to `skills/_shared/references/<topic>.md`, replace each copy with a one-line pointer | One-place edits; e.g. `writing-style.md` (no-filler-words, one-idea-per-sentence) is referenced by `task-summary`, `notes-summary`, `update-claude-docs`, `condense-task-doc`, `condense-claude-md`. For a rule that's canonical in ONE skill but referenced elsewhere (not truly shared), point to that skill directly instead (e.g. `task-summary`'s merge rules point to `merge-task-docs`) — don't create a `_shared/` file for a single owner. ⚠️ **Count the owners by grepping the MANDATE, before deciding placement — "single owner" is a measurement, not an impression.** Grep the behaviour the rule governs (`"Overwrite in place"`, `"Rewrite on every update"`), not the rule's own wording, which by definition exists in only the one file you're editing. Issue #13 read as single-owner and shipped as such; the sweep afterwards found the identical mandate in `condense-task-doc` and `merge-task-docs`, making it 3 and reversing the call. **Tell: you concluded "only this skill needs it" without a grep whose pattern came from the OTHER skills' vocabulary** |
| Never add `disable-model-invocation` unless user explicitly asks | User dislikes it — it drops the skill/command from Claude's context, killing auto-suggestion. Default to proactive invocation |
| **Shrinking a file routes to the condense skill for that artifact — no skill or agent carries its own size policy** | CLAUDE.md → `condense-claude-md`; task doc → `condense-task-doc`. They own thresholds, budgets a file declares for itself (`_shared/references/declared-budget.md`), and every split decision. Callers may name a number as a *trigger to delegate* (`task-summary` L20/L52 is the pattern: "delegate rather than hand-rolling"), never as a policy they enforce. `claude-md-pruner` was the outlier — it ran a second implementation until its step 0 was collapsed; an agent earns its existence through `memory:`/background spawning, not by owning a threshold. **Tell: you're about to write a line count into a file that isn't one of the two condense skills** |
| ⚠️ **`claude-md-pruner`'s name is DELIBERATELY legacy — it prunes task docs too. Do not "fix" it** | Its scope is intentionally wider than its name, which is a knowing exception to the rename-on-scope-change row above. Renaming breaks two things silently: `update-claude-docs` Step 4 Globs the literal filename and spawns by literal `subagent_type`, and a Glob miss falls through to "skip pruning" with **no error**; and `agent-setup`'s missing-agent check runs templates→agents only, so every existing project would keep the old file alongside the new one. The name is inert for the spawn path — the `description:` carries the real trigger surface, and it names both artifacts. 📖 D43, `tasks/plugin-maintenance/agent-architecture/decisions/injection-and-delegation.md` |
| **Every change = version bump** | Bump both version files (see [Version Bumping](#version-bumping)) |
| **A release note for this plugin states the reader's ACTIONS, not just the diagnosis** | Consumers install via the marketplace and cannot see the repo, so a note explaining only what broke leaves them with nothing to do. Required: (1) `claude plugin update syafiqkit@syafiqkit`; (2) **what prior output is now invalid** — a fix to a *measurement* (a ranking, a count, a gate's threshold) silently invalidates every earlier run, so say re-run it; (3) any genuine non-action, but only where a reader would independently wonder. Skills are re-read on every invocation, so a skill-only release needs no regeneration step — say that only if agents/templates were plausibly in scope. **Tell: your note's last section explains a root cause and the reader still doesn't know whether to re-run anything** |

## Maintenance {#maintenance}

### When Modifying Commands/Skills

1. **Run code-simplifier**: Target <100 lines per command; 47%+ reduction signals bloat
2. **Review checklist**:
   - Missing `path` param on Glob/Grep instructions
   - Inconsistent behavior vs related commands/skills
   - Ambiguous criteria (define what "related" or "connection" means)
   - Missing edge cases (archived docs, Status: Done)
   - Skill references a non-existent terminal skill (e.g. `writing-plans`) — always verify referenced skills exist in `skills/*/SKILL.md` before shipping
   - Same flow described in 4 places (checklist + diagram + prose + after-section) — one `## Steps` section is enough; redundancy causes section drift
   - Judging bloat by line count alone — a dense one-row-per-item table can sit at target line count while individual cells run 800+ characters; use `wc -c` alongside `wc -l` before ranking files by size. Compute the bytes/line ratio with a tool (`echo "scale=1; $(wc -c < f)/$(wc -l < f)" | bc`), never mentally — an eyeballed ratio that lands the wrong side of the ~80-90 threshold inverts the diagnosis (extract vs tighten) and reads as measured
   - **A clean code review of the changed lines does not clear a rule whose defect is REACHABILITY** — the two review lenses fail differently, and only one can see this class. A file-scoped reviewer reads the diff and correctly reports three new branches as mutually consistent; whether any code path evaluates their condition lives *between* sections and is invisible to it. That is the product reviewer's question ("can a real session actually get here?"), so on a rule change treat its verdict as load-bearing rather than advisory — issue #13's 🔴 came from it after the code review came back accurate and clean. **Tell: you're about to ship a conditional on the strength of a review that only read the lines you changed**
   - A skill "feels bloated" → run `syafiqkit:update-plugin`'s Step 3a density-pass checklist (stacked warnings, worked anecdotes, cold-path extraction) rather than a from-scratch audit — see `tasks/plugin-maintenance/doc-condensation/decisions/structural-splits.md` D23, D50
   - A skill that was condensed BEFORE is an arrival-rate problem, not a density one — re-condensing it regressed both times it was tried. Extract cold paths to `references/` and apply Step 3a's replace-or-route gate; a B/L ratio that barely moves after extraction means the rules are irreducible, not that you cut too little (D50)
   - **A skill that ROUTES to N owners needs a receiving branch in all N — wiring one and not the rest fails silently.** The target's entry step scans the session for a signal, but a handoff arrives with the verdict already decided and no narrative to scan, so it reads as "no signal, nothing to do" and the finding dies. Retrofitting the first owner makes the gap invisible: that path demonstrably works, so the unwired siblings look equally wired. Enumerate every owner the routing table names and open each one's entry step. **Tell: your new skill's hand-off table has more rows than the number of target skills you edited**
   - **A gate is only real if some step computes its inputs — name the measurement at the deciding step, not a later one.** A new condition ("skip when under the floor", "only if over budget") reads as enforced while nothing instructs the executor to take the number, and an unmeasured condition resolves to its permissive default, so the gate passes by doing nothing. A sibling step that *does* measure is not cover: `update-claude-docs` Step 5 owns `wc -lc` but runs after Step 4 and per-entry, so Step 4's floor needed its own measure line. 4th recurrence of this shape (D50's arrival-rate gate stated in Step 3a and unchecked in Step 4; the floor; issue #13's contested-doc branch). **Tell: your new row names a threshold and no step above it runs a command**
   - **The same defect wears a second face: a BRANCH whose condition only one code path evaluates.** A conditional added to a rule ("X fired → do Y instead") is dead on every invocation that never reaches the step setting X — and the untaken path is usually the common one. Issue #13's fix keyed three branches off a guard whose own text read "before **scanning**", while the reporter's repro passed an explicit path; the branches were unreachable exactly where the bug was filed. State the condition run-wide, and trace it from *each* entry point in the caller's table, not just the one you were editing. **Tell: your branch names a condition set in a step a reader can skip**
   - **Establish tree state BEFORE measuring anything** — `git status --short` first. A ratio table computed against a dirty tree describes files that already carry another session's unshipped edits, and the numbers read as a clean baseline. A dirty target also invalidates `git diff HEAD` as the condense-verify baseline (the other writer's lines appear as `-` and "restoring" them destroys their work) — commit or snapshot first
   - ⚠️ **Running `git status` is not the rule — TAKING THE BASELINE FROM `git show HEAD:<path>` is.** On a dirty file the working copy is someone else's starting point plus yours, so a `wc -c` of it reports their bytes as your growth; noting the tree is dirty and then measuring the file anyway satisfies the letter of the row above and none of its purpose. Quote every before/after figure from `git show HEAD:<path> | wc -lc`. **Tell: a size delta you're about to publish came from a file `git status` listed as modified**
   - Touching ANY skill: the registry lives in **two** hand-maintained places — this file's `## Skills` table and `README.md`'s. Adding to one is the common miss; the worse failure is silent rot in tables nobody edited (3 skills were absent from this file's table for months while present in README). Never trust them by eye — diff against disk, which is the only source of truth:
     ```bash
     sed -n '/^### Skills/,/^### Typical/p' CLAUDE.md | grep -oE '^\| `[a-z-]+`' | tr -d '|` ' | sort > /tmp/c.txt
     ls -d skills/*/ | grep -v _shared | sed 's|skills/||;s|/||' | sort > /tmp/d.txt
     comm -13 /tmp/c.txt /tmp/d.txt   # any output = rows missing from CLAUDE.md
     ```
   - ⚠️ **A skill step naming a plugin-internal path (`tasks/**`) as something to READ or WRITE — there is NO path that reaches it from an install, so state the step as source-checkout-only instead of hunting for one.** `tasks/` is not shipped (verify: `ls ~/.claude/plugins/cache/syafiqkit/syafiqkit/<ver>/`), a marketplace install is version-scoped so any literal path goes stale on the user's next update, `~` does not resolve on native Windows (`%USERPROFILE%`), a `~/.claude` shared with WSL stores paths broken on the other side ([#36575](https://github.com/anthropics/claude-code/issues/36575)), and `${CLAUDE_PLUGIN_ROOT}` does not expand in markdown ([#9354](https://github.com/anthropics/claude-code/issues/9354)). A read-target degrades quietly; a **write**-target has no safe default, so the session stops and asks the user mid-skill. Route the write through `update-plugin`, the only skill with an ownership gate. **Tell: you're picking between an absolute and a relative path, when the answer is that the file is unreachable**
   - ⚠️ **`git -C <dir>` WALKS UP to an enclosing repo — an ownership/identity probe pointed at a plugin dir can answer about `~/.claude` itself and report a confident, wrong remote.** Under dotfiles management the parent is a real repo with a real origin, so the probe succeeds and misattributes rather than erroring; a grep that happens to miss then yields the right verdict for the wrong reason, and inverts the moment someone forks the settings repo. Ask the question of the CWD (`git rev-parse --show-toplevel`), which is the tree you would actually edit and has no path to go stale. **Tell: your probe names a directory instead of asking where you already are**
   - ⚠️ **A `git log --since` growth measurement counts a file CREATED in the window as having grown by its whole length** — so a brand-new file ranks #1 on its first audit and routes into an action queue as a finding, crowding out real signal. Disqualify in-window creations (`git log --diff-filter=A`) before ranking; a file with no baseline has no arrival reading. **Tell: your top grower's reported growth equals its total line count**
   - Inconsistent edits — when changing a concept (e.g., model name), verify all references (headings, body, comments) match
   - Inserting a new warning/callout between two existing table rows — a blank line + prose between `|`-rows splits one Markdown table into two; the second half loses its header separator and can fail to render. Move the callout to a table boundary (before the first row or after the last) instead
   - Inserting a step into a numbered list — a `6b.`-style marker is not valid GFM and renders as a paragraph, *terminating* the list so every following item restarts at 1. Renumber the tail instead, then re-check any `item N`/`step N` cross-reference at or below the insertion point
   - Adding an ADR: **`D<n>` numbers are global across ALL `decisions/*.md` theme files AND every `current.md`, not per-file** — scope the scan to `tasks/`, not one feature dir, and note the command returns the **highest TAKEN, so the next free id is that +1**; using its output verbatim mints a collision. Take it from `grep -rhoE "^### D[0-9]+" tasks/ | grep -oE "[0-9]+" | sort -n | tail -1`, never from the file you're editing. A duplicate is silent (both render fine) until a citation resolves to the wrong decision, so **the `uniq -d` confirmation runs AFTER writing, not before** — `grep -rhoE "^### D[0-9]+" tasks/ | sort | uniq -d` must return empty. Add the number to the index's routing row or the ADR is unreachable. **Tell: your "next free id" equals a number that already appears in `tasks/`**
3. **Reference**: `tasks/plugin-maintenance/{agent-architecture,doc-condensation,external-guidance,madr-structure}/current.md` for plugin patterns and research

### Design Principles

| Principle | Application |
|-----------|-------------|
| Autonomous over interactive | Skills should complete without asking; use smart defaults |
| Auto-create over abort | Missing docs → create minimal template, don't block workflow |
| Explicit criteria | "2+ files OR business logic" not "significant changes" |
| Graceful degradation | PRIMARY missing → auto-create; SECONDARY missing → skip + suggest |

### Prompting Techniques for Commands {#prompting-techniques}

Commands/skills are prompts — apply these patterns when authoring or refactoring them:

| Technique | When to use | How |
|-----------|-------------|-----|
| **Constitutional (❌ constraints)** | Commands that make routing/write decisions | Add `❌ Never / ✅ Always` table before the action step |
| **Validation Loop** | Commands that write or modify files | Add numbered self-check after write step: addresses all points? no deletions? format correct? revise if fails |

⚠️ **Don't prescribe visible `<thinking>` blocks in a skill.** Retired 2026-07-16 after zero uptake across 18 skills — reasoning scaffolds belong to the harness/output-style layer, not to skill files, and a skill that hardcodes one fights whatever style is active. See D33 (`tasks/plugin-maintenance/doc-condensation/decisions/structural-splits.md`).

**Skip for**: Simple commands (<3 decision branches), read-only commands (no files written). Adding these to trivial commands adds noise without benefit.

### Version Bumping {#version-bumping}

⚠️ **Read both versions from `git show HEAD:<path>` before calling either one drifted.** A prior session's uncommitted bump makes the working copies disagree, so the working-copy comparison reports drift that the committed state does not have — and names the wrong file as stale. Compare committed-to-committed, then bump from there. **Tell: you're about to write "X had drifted to N" from a value `git status` lists as modified.**

**⚠️ Update BOTH files** — missing one causes silent version mismatch:

| File | Field |
|------|-------|
| `.claude-plugin/plugin.json` | `"version"` |
| `.claude-plugin/marketplace.json` | `plugins[0].version` |

Then run:
```bash
claude plugin update syafiqkit@syafiqkit
```
