---
name: team-build
description: Spawn a coordinated team of agents to implement a module/feature. Use when user describes multi-workstream work like "build X with audit, CAPA, reports" or says "use a team", "swarm this", "parallel agents". Produces a plan, creates team, spawns teammates, coordinates to completion.
---

# Team Build Workflow

Coordinate a team of autonomous agents to implement a module or feature in parallel.

## Lead Constraints (absolute — no exceptions)

1. **Lead NEVER reads project files** — not "just a quick check", not "to verify". Lead only reads CLAUDE.md/task docs for context. Teammates explore and read their own files.
2. **Lead NEVER writes code** — delegate everything to teammates.
3. **Lead NEVER spawns Task/Explore subagents for research** — no pre-team exploration. Teammates investigate themselves.
4. **Do NOT send parallel tool calls that might fail** — if the first file might not exist, call it alone. Sibling error cascades waste turns.

## Phase 1: Quick Plan (~1 min)

The lead writes the plan **itself** — no Explore subagents, no Plan subagents. Use only what's in the user's prompt + CLAUDE.md files.

### 1.1 Load Context (30s max)

```
/syafiqkit:read-summary [domain if known]
```
Read project CLAUDE.md files for conventions. That's it — move on.

### 1.2 Clarify with User (only if truly ambiguous)

Use AskUserQuestion only for decisions teammates can't make on their own (e.g., "web only or mobile too?"). Skip if the prompt is clear enough.

### 1.3 Write Plan

Enter plan mode. The lead writes this plan directly from the user's prompt — **no research needed**.

**Plan defines scope boundaries and goals, NOT step-by-step instructions.** Teammates are autonomous — they investigate, diagnose, and implement. The plan prevents collisions, not hand-holds.

```markdown
# {Feature Name} — Team Plan

## Goals
{What the user asked for — restate in clear bullets}

## Team
| # | Name | Scope | Goal |
|---|------|-------|------|
| 1 | {kebab-name} | {domain/area they own} | {what they achieve, not how} |
| 2 | {kebab-name} | {domain/area they own} | {what they achieve, not how} |
| N | {kebab-name} | {domain/area they own} | {what they achieve, not how} |

## File Ownership
{Which teammate owns which files/directories — prevents merge conflicts}

## Dependencies
{Which goals block which — determines spawn order}
{If none, say "All independent — spawn all at once"}

## Known Context
{Any hints from the user's prompt: file paths, line numbers, API endpoints, patterns}
{Teammates use this as starting points, not as final answers}
```

**Plan principles:**

| Principle | Why |
|-----------|-----|
| Goals over instructions | Teammates investigate and decide how to implement |
| Scope boundaries over task lists | Prevent collisions without micromanaging |
| Known context as hints | User-provided paths/lines are starting points for investigation |
| Fewer teammates > more | 2-3 focused teammates beat 5 narrow ones |
| Multiple tasks per teammate | 3-5 tasks each — teammates self-claim from TaskList after completing one |

### Exit plan mode for user approval.

## Phase 2: Execute

### 2.1 Create Team + Tasks

```
TeamCreate: team_name={feature-slug}
```

Create tasks using TaskCreate — **multiple tasks per teammate** (3-5 each) so they can self-claim from TaskList after completing one. Always include `activeForm` (present continuous, e.g., "Fixing notification bug").

Task descriptions include:
- The goal (what to achieve)
- Their scope boundary (what files/areas they own)
- Known context from the user's prompt (file paths, line numbers, hints)

Set up dependencies if needed:
```
TaskUpdate: taskId=X, addBlockedBy=[Y, Z]
```

### 2.2 Spawn Teammates

**Model selection:**

| Teammate role | Model | Why |
|--------------|-------|-----|
| Implementation (write/edit code) | `opus` | Needs reasoning for complex code changes |
| Research / exploration / docs | `sonnet` | Cheaper, fast enough for reading + searching |

**Teammate prompt template:**
```
You are {Name} on the {team-name} team.

## Your Identity
- Name: {kebab-name} (use this in all communications)
- Team: {team-name}

## Your Goal
{Goal from the plan — what to achieve, not how}

## Your Scope
You own: {files/directories/domain area}
Do NOT modify files outside your scope — message team-lead if you need changes elsewhere.

## Starting Context
{Any known context from user's prompt: file paths, line numbers, API endpoints}

## How to Work
You are autonomous. Investigate the codebase, understand the problem, decide on the approach, implement, and verify. CLAUDE.md is auto-loaded — you already have project conventions.

1. Read your task via TaskGet
2. Mark task in_progress with TaskUpdate
3. Investigate — read files, search code, understand patterns
4. Implement — write/edit code, run commands
5. Verify — run IDE diagnostics (getDiagnostics), tests if applicable
6. Mark task completed with TaskUpdate
7. Message team-lead with a summary of what you did and any issues found
8. Check TaskList for next available task

## Rules
- Match existing patterns in the codebase
- If blocked or unsure, message team-lead — don't guess
- If you discover work outside your scope, message team-lead to route it
```

**Spawn order** — respect dependency graph. If no dependencies, spawn all at once.

### 2.3 Coordinate

**Lead role: traffic controller, not architect.** Teammates think for themselves. Lead handles:

| Event | Action |
|-------|--------|
| Teammate completes task | Unblock downstream tasks, notify waiting teammates |
| Teammate finds issue outside scope | Route to the right teammate or create new task |
| Teammate is stuck | Help unblock — suggest approach, not exact code |
| Shared file conflict | Assign ownership, tell one teammate to wait |
| User requests change | Create task, assign to appropriate teammate |
| All tasks done | Trigger Phase 3 |

### 2.4 Code Quality (on demand)

If the user asked for review or if multiple teammates touched similar patterns:
```
SendMessage → appropriate teammate: "Review {files} for consistency before we wrap up."
```

## Phase 3: Wrap Up

### 3.1 Shutdown Teammates
```
SendMessage type=shutdown_request → {each teammate}
```

### 3.2 Clean Up
```
TeamDelete  # Removes team + task directories
```

### 3.3 Summary
Output final scorecard to user:

```markdown
## {Feature} — Complete

**{N} tasks completed** across {M} teammates.

### What was done
| Teammate | Deliverables |
|----------|-------------|
| {name} | {what they built/fixed} |
| {name} | {what they built/fixed} |

### Issues found during investigation
- {anything teammates discovered that wasn't in the original prompt}
```

## Anti-Patterns

| Don't | Do Instead |
|-------|-----------|
| Lead reads project files | Teammates read their own files |
| Lead writes code | Delegate to teammates |
| Lead spawns Explore/Plan subagents before team | Teammates investigate themselves |
| Spend 5+ min planning before any real work | Plan in ~1 min, let teammates figure out details |
| Write step-by-step instructions for teammates | Give goals and scope — teammates are autonomous |
| Spoon-feed exact file paths in task descriptions | Share known context as hints, teammates verify themselves |
| Spawn all teammates when there are dependencies | Respect dependency graph |
| Retry failing teammate 5 times | Route to another teammate or help unblock |
| Leave idle teammates running | Shutdown when all tasks done |
| Duplicate scope across teammates | Each file/area has one owner |
| Lead does "quick checks" or "verifications" | If lead wants to know something, ask a teammate |
| Broadcast routine messages | Use direct `message` to specific teammate — broadcast = N messages |
| Use teams for simple sequential work | Teams cost 3-4x vs single session — only for genuinely parallel work |
