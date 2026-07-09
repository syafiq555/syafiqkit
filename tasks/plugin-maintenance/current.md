<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance
Purpose: Best practices for maintaining syafiqkit plugin commands/skills
Key files: commands/commit.md, skills/ship/SKILL.md, skills/task-summary/SKILL.md, skills/update-claude-docs/SKILL.md, CLAUDE.md, .claude-plugin/plugin.json
Related: None
Last updated: 2026-07-08
-->

# Plugin Maintenance

**Status**: Reference (ongoing)

## Design Principles

| Principle | Application |
|-----------|-------------|
| Autonomous over interactive | Skills complete without asking; use smart defaults |
| Auto-create over abort | Missing docs → create minimal template, don't block workflow |
| Graceful degradation | Use better external tool if available, fallback to self-contained |
| Explicit criteria | "2+ files OR business logic" not "significant changes" |
| Self-contained | Never reference user's global CLAUDE.md - other users won't have it |

## Skill Architecture (2026)

| Concept | Description |
|---------|-------------|
| Progressive disclosure | Descriptions load (~100 tokens), full content only on invoke (~5k tokens) |
| Reference vs Task | Reference = inline context; Task = `disable-model-invocation: true` |
| Skill composition | Skills don't call each other programmatically; orchestrate via instructions |
| Skill + commands pattern | Skill provides guidance/discovery, commands invoke skill then execute action |

### Current Skills

⚠️ **Registry drift**: this table lists 7 of 18 skill directories that actually exist under `skills/` — it predates several skills (`task-summary`, `condense-task-doc`, `condense-claude-md`, `brainstorming`, `ci-ssh-deploy-timeout`, `function-parameter-limits`, `gchat-format`, `hobby-review`, `md-to-pdf`, `notes-summary`, `pull-db`, `ship`) and still names a `consolidate-docs` skill that no longer exists (superseded by `merge-task-docs`). Needs a full re-sync pass — out of scope for this session's edit, flagging so it isn't lost.

| Skill | Purpose | Invoked By |
|-------|---------|------------|
| `agent-setup` | Create/update project agents with CLAUDE.md rules | `update-claude-docs` skill |
| `task-summary` | Create/update task doc `current.md` — path resolution, templates, cross-references | `done` skill Step 4, or user directly |
| `condense-task-doc` | Aggressively condense a bloated task doc — row-existence pruning + sentence compression | User directly, or `task-summary` when a doc is >300 lines |
| `update-claude-docs` | Create/rewrite/condense/capture-into CLAUDE.md (4 modes); SKILL.md workflow + `references/structure.md` template. CLAUDE.md analog of `task-summary` | `done` skill Step 3, or user directly |
| `condense-claude-md` | Aggressively condense a bloated CLAUDE.md file | User directly, or `update-claude-docs` Condense mode |
| `done` | Post-task cleanup orchestrator + task doc templates | User directly |
| `commit-invoice-generator` | Generate invoice from git commits | User directly |
| `merge-task-docs` | Find + merge payment/domain task docs by subsystem boundary; delete sources; reconcile back-refs | User directly |
| `update-plugin` | Scan session → patch SKILL.md files with learned rules/triggers/gotchas | User directly after skill work |
| `read-summary` | Discover + read task docs before investigating/implementing; Plan-Mode-aware subagent delegation | User directly, or model-invoked before any project-context-dependent task |

### Invocation Control

| Scenario | Frontmatter |
|----------|-------------|
| Both user & Claude invoke | (default — `user-invocable` is `true` since 2.1.0) |
| Only user invokes | `disable-model-invocation: true` |
| Only Claude invokes | `user-invocable: false` |

### Frontmatter Fields (2026)

| Field | Where | Description |
|-------|-------|-------------|
| `context: fork` | Skills | Run in isolated subagent context |
| `agent` | Skills | Subagent type when `context: fork` |
| `model` | Skills, Agents | Override model (`sonnet`, `opus`, `haiku`, `inherit`) |
| `memory` | Agents | Persistent memory scope: `user`, `project`, `local` |
| `permissionMode` | Agents | `default`, `acceptEdits`, `plan` |
| `hooks` | Skills, Agents | Scoped hooks (PreToolUse, PostToolUse, Stop) |
| `skills` | Agents | Preload skill content into agent context |
| `disallowedTools` | Agents | Deny specific tools from inherited list |

### Composition Patterns

1. **Via subagent**: `context: fork` runs in isolated subagent
2. **Dynamic context**: `` !`command` `` injects output before Claude sees skill
3. **Explicit instructions**: Tell Claude to invoke `/other-skill` by name

## External Plugin Integration

| Plugin | Used by | Required? |
|--------|---------|-----------|
| `code-simplifier@claude-plugins-official` | `/done` Step 1 | Fallback only |
| `feature-dev@claude-plugins-official` | `/done` Step 2 | Fallback only |
| `claude-md-management@claude-plugins-official` | `/update-claude-docs` | Optional (fallback exists) |

**Pattern**: Check for project agent first → use if exists → fallback to external plugin.

## Project-Specific Agents (2026-02)

**Problem**: Agents don't inherit CLAUDE.md, so project conventions aren't applied.

**Solution**: Bake conventions into agent system prompts via injection markers.

```
/update-claude-docs
    ├─► Updates CLAUDE.md
    └─► Invokes agent-setup skill
          └─► Creates/updates .claude/agents/
                ├─► code-reviewer.md (with injected rules)
                └─► code-simplifier.md (with injected rules)

/done
    ├─► Check .claude/agents/code-simplifier.md
    │     └─► Use project agent OR fallback to external
    └─► Check .claude/agents/code-reviewer.md
          └─► Use project agent OR fallback to external
```

**Injection markers** in agent templates:
```markdown
<!-- INJECTED FROM CLAUDE.md -->
[Project-specific rules extracted from CLAUDE.md]
<!-- END INJECTED -->
```

**Benefits**:
- No runtime CLAUDE.md parsing
- Agents become project-aware
- Cumulative learning as gotchas accumulate
- Portable with the repo

## Completed (2026-02-21) — Prompting Techniques Applied

Applied 3 LLM prompting best practices to command files to improve reliability:

| Command | Constitutional (❌ constraints) | Chain-of-Thought (`<thinking>`) | Validation Loop |
|---------|-------------------------------|-------------------------------|-----------------|
| `write-summary` | ✅ Steps 3 + 4 | ✅ Step 0 pre-flight | ✅ Step 5 |
| `update-summary` | ✅ Step 2 | ➖ | ✅ Step 3 |
| `update-claude-docs` | ✅ Step 3c | ✅ Step 0 pre-flight | ✅ Step 3f |

**Commands left unchanged**: `commit`, `consolidate-docs` (too simple / already has safety check). ⚠️ `read-summary` was later converted from a command to a skill (2026-07) — see `Current Skills` table.

**Version bumped**: 1.6.3 → 1.6.4

**Pattern captured in CLAUDE.md**: New `### Prompting Techniques for Commands {#prompting-techniques}` section added under Maintenance.

## Completed (2026-06-09) — De-bloat: `done` 5→4 steps, `task-summary` density rules

Cut duplicated capture logic and added anti-bloat governance after the user flagged the workflow as "bloated."

- **`done` 164→111 lines**: deleted the inline conversation-analysis procedure (old Step 3, sub-steps 3a–3d) that fully duplicated the `update-claude-docs` skill. Capture is now a single delegated Skill call. Removed the "don't double-write" hedge that only existed to reconcile the two copies. `done` is now a pure orchestrator (Steps 1–2 sequential, 3+4 parallel).
- **`task-summary` +density rules**: new top section (one-fact-one-home, rows-≤2-sentences, LLM-CONTEXT-is-pointer-index, Quick-Start-≤15-lines→pointer) + a litmus grep. Strengthened `## Last Session` to enforce EXACTLY ONE such heading (was being appended → duplicate dated copies, e.g. point-system doc had two).
- **CLAUDE.md cleanup** (user's global + skormy project): removed lines that duplicated/contradicted the skills — the stale `/update-summary` row (contradicted `done`'s "no args" rule) and the changelog-gate "STOP and ask" row (contradicted `/commit`'s auto-update). Reworded skormy Workflow step 8 to match.

## Gotchas

| Issue | Cause | Fix |
|-------|-------|-----|
| Agent ignores project conventions | Agents don't inherit CLAUDE.md | Use `agent-setup` skill to inject rules into agent prompts |
| `/done` blocks on missing docs | `update-summary` aborted on missing PRIMARY | Auto-create minimal template instead |
| Plugin breaks for other users | References to `~/.claude/CLAUDE.md` | Keep plugin self-contained |
| Agent template missing tools for git | `code-reviewer` needs `git diff` | Add `Bash(git:*)` to tools list |

## Guidelines

| Guideline | Rationale |
|-----------|-----------|
| Keep SKILL.md <500 lines | Move detailed reference to supporting files |
| Description quality matters | Action verbs, specific file types, clear use cases |
| Use `allowed-tools` for restrictions | Scope permissions per-skill |
| CLAUDE.md <150 lines | Domain knowledge → skills, not CLAUDE.md |

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Apply prompting techniques selectively, not universally | Simple commands (`read-summary`, `commit`) don't benefit — overhead reduces clarity. Only commands with multi-branch inference or file writes gain reliability improvements. |
| `<thinking>` block as Step 0 (pre-flight), not inline | Externalizing routing decisions before action prevents silent errors mid-step and is easier to review/debug. |
| Validation loop re-reads the file after writing | Write + verify pattern catches silent truncation bugs that Edit confirmation alone doesn't surface. |
| Orchestrator skills delegate, never inline a sibling skill's procedure | `done` Step 3 used to contain a full copy of `update-claude-docs`' signal-scan. Two copies drift + force "don't double-write" hedges. An orchestrator should name the sub-skill, not reproduce it. |
| Fix doc bloat at the generator (skill rules), not by hand-trimming docs | Repeated facts come from each template section "wanting" to mention the critical thing. A cross-section dedup rule in `task-summary` shrinks every future doc; trimming one doc just re-bloats next session. |
| A CLAUDE.md line is dead weight if a skill enforces it at action-time | CLAUDE.md is read at session start (ambient); a skill is read at the moment of action. When both state a rule, the skill wins and the CLAUDE.md copy only risks drifting out of sync (seen with `/commit`'s changelog gate). |
| A skill's "happy path" step must defer to a project's documented alternative before assuming it's universal | `ship`'s CI-verify step assumed `gh run list` polling always applies; some projects define a faster non-CI deploy path (rsync hotfix) in their own `CLAUDE.local.md` for a subset of changes. The skill now checks for that convention first rather than hardcoding one project's specifics into the plugin. |
| A read-only reading command must still ROUTE what it notices, not just narrate it | `read-summary` reads/audits docs constantly and is uniquely placed to catch a doc contradicting the code (stale `Status:`, swapped provider, moved files, expired caveat). Narrating the drift in passing drops the fix — added a "doc-staleness handoff" rule: name it as a finding, then route to `/update-summary` (project fact) or `/update-plugin` (skill defect). Read-only stays read-only; the handoff is the deliverable. |
| A knowledge-capture skill gains create/rewrite modes → split canonical structure into `references/`, mirroring `task-summary` | `update-claude-docs` grew from pure session-capture into the CLAUDE.md analog of `task-summary` (create / rewrite-to-best-practice / condense / capture). The workflow lives in SKILL.md; the canonical CLAUDE.md template + hierarchy + capture-filter + 200-line budget live in `references/structure.md` — so create/rewrite conform to one source of truth and capture mode inlines only the routing + filter it needs. Same split `task-summary`/`templates.md` already uses. |
| A skill/command with an identical-named skill needs no wrapper command | `update-claude-docs` was a command; converting it to a skill of the SAME name made the wrapper redundant — a skill's `name:` frontmatter already registers `/update-claude-docs`, and direct invocation forwards the user's trailing text as args, so mode-detection works without a `$ARGUMENTS`-forwarding wrapper. A wrapper only earns its place when the command and skill names differ. |
| Default pruner target is ~200 lines, and splitting (seam-test) beats lossy cuts as the DEFAULT strategy, not just when a user names a number | `claude-md-pruner` template originally only had the ambient "<350 lines" ceiling, and an earlier draft of this fix gated the seam-test preference on the user explicitly naming a target. User corrected: don't gate it — ~200 is the default target and split-over-cut is the default behavior any time pruning alone leaves a file over target, regardless of whether the user says a number. Prevents force-deleting real distinct gotchas from an already-clean file just because no split was considered. |
| Extract only true verbatim cross-skill duplication to `skills/_shared/references/`, don't chase pointer-extraction broadly | Research during a condensation session found conflicting guidance: generic LLM-instruction research says inline repetition is more reliable than pointers (indirection risks non-compliance), while Anthropic's own Skills docs recommend `references/*.md` extraction specifically because Skills load references on demand (a documented mechanism, not a bare in-prompt pointer). Reconciled by scoping extraction narrowly: pulled the one byte-identical "no filler words" table repeated across 5 skills (`task-summary`, `notes-summary`, `update-claude-docs`, `condense-task-doc`, `condense-claude-md`) into `skills/_shared/references/writing-style.md`; left skill-specific rules, rationale, and edge cases inline everywhere else. `merge-task-docs` mentions "no filler words" only as a one-word inline nod, not the duplicated table, so it was left as-is rather than pointed at the shared file. |
| A second condensation pass fixed 2 remaining near-duplication cases, checked but skipped a 3rd, and left the rest alone | Full survey of all 6 commands + 18 skills for the user's "everything feels condensable" ask. Fixed: (1) `ship`'s Step 2 staleness-gate bullets, which paraphrased `commit.md`'s Step 3 gate almost word-for-word, collapsed to a one-line pointer at `commit.md` as sole canonical source. (2) `task-summary`'s §2a merge rules table, redundant with `merge-task-docs`' fuller version despite already delegating the merge workflow to it, trimmed to just the rename-only row (not delegated) plus a pointer for the rest. Checked and left alone: `update-claude-docs` vs `update-plugin` share a Scan→Route→Write→Validate skeleton but apply it to disjoint content (CLAUDE.md sections vs SKILL.md files) — shared shape, not duplicated text. Also left alone: thin command aliases (`write-summary`/`update-summary`, intentional dual triggers), and the `task-summary`/`condense-task-doc`/`merge-task-docs` three-way split (already properly decomposed by operation, not overlapping). |
| A command converts to a skill outright (delete the command) once its body is genuinely substantial, not aliased | `read-summary` (71-line command, real workflow: discovery algorithm, staleness-audit handoff, exit-gate) differs from `write-summary`/`update-summary` (thin aliases pointing at `task-summary`) — those stay commands, `read-summary` became a skill because it had no sibling skill to alias into. Command deleted outright per user choice, no backward-compat pointer left behind. |
| A doc-format upgrade (MADR-style blocks) needs its condensation rule shipped in the SAME change, not as a follow-up | Prototyping an MADR-style `Key Technical Decisions` block for `task-summary` surfaced that `condense-task-doc`'s only applicable rule ("one row, WHY in ≤1 sentence") would silently flatten a MADR block back to a table row on its first condensation pass — destroying the "why we rejected X" content the block exists to hold. A structured multi-field block is a genuinely different content shape than a table row; any skill that adds one must also teach every skill that edits/compresses that section how to handle the new shape, not just the skill that creates it. Fixed in the same session: `templates.md` (block format + 20-line size ceiling + demotion rule), `task-summary/SKILL.md` (edit-in-place-vs-append classification as the decision evolves), `condense-task-doc/SKILL.md` (field-priority compression order, Rejected never touched). |

## Sources

- [Skills Documentation](https://code.claude.com/docs/en/skills.md)
- [Best Practices Guide](https://code.claude.com/docs/en/best-practices.md)
- [Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents.md)

## Next Steps

- Commit the in-flight 1.52.10 condensation batch (currently uncommitted — see `git status`)
- Monitor whether `<thinking>` blocks reduce domain inference errors in practice
