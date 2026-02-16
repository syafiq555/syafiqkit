---
name: team-build
description: Spawn a coordinated team of agents to implement a module/feature. Use when user describes multi-workstream work like "build X with audit, CAPA, reports" or says "use a team", "swarm this", "parallel agents".
---

# Team Build Workflow

Spawn teammates, assign tasks, coordinate to completion.

## Lead Constraints

1. **Lead NEVER reads project files or writes code** — delegate everything to teammates.
2. **Lead NEVER spawns Task/Explore subagents** — teammates investigate themselves.
3. **Do NOT send parallel tool calls that might fail** — call potentially missing files one at a time.

## Step 1: Plan

Enter plan mode. Write a quick plan from the user's prompt — no research, no skill calls, no context loading. CLAUDE.md and task docs are already in context if they exist.

```markdown
# {Feature Name} — Team Plan

## Goals
{What the user asked for}

## Team
| # | Name | Scope | Goal |
|---|------|-------|------|
| 1 | {kebab-name} | {files/area they own} | {what they achieve} |
| 2 | {kebab-name} | {files/area they own} | {what they achieve} |

## Dependencies
{Which goals block which, or "All independent — spawn all at once"}
```

Exit plan mode for user approval.

## Step 2: Create Team + Tasks

```
TeamCreate: team_name={feature-slug}
```

Create tasks with TaskCreate (3-5 per teammate, always include `activeForm`). Set dependencies with TaskUpdate if needed.

## Step 3: Spawn Teammates

| Teammate role | Model |
|--------------|-------|
| Implementation (write/edit code) | `opus` |
| Research / exploration / docs | `sonnet` |

**Prompt template:**
```
You are {Name} on the {team-name} team.

- Name: {kebab-name}
- Team: {team-name}
- Goal: {what to achieve}
- Scope: {files/areas you own — don't modify outside this}
- Context: {any hints from user's prompt}

## Workflow
1. TaskGet → read your task
2. TaskUpdate → mark in_progress
3. Investigate, implement, verify (getDiagnostics)
4. TaskUpdate → mark completed
5. Message team-lead with summary
6. TaskList → claim next available task

If blocked or find work outside your scope, message team-lead.
```

Respect dependency graph for spawn order. If no dependencies, spawn all at once.

## Step 4: Coordinate

| Event | Action |
|-------|--------|
| Teammate completes task | Unblock downstream, notify waiting teammates |
| Issue outside scope | Route to right teammate or create new task |
| Teammate stuck | Help unblock |
| Shared file conflict | Assign ownership, tell one to wait |
| All tasks done | Wrap up |

## Step 5: Wrap Up

1. `SendMessage type=shutdown_request` → each teammate
2. `TeamDelete`
3. Output summary:

```markdown
## {Feature} — Complete

| Teammate | Deliverables |
|----------|-------------|
| {name} | {what they did} |
```

## Anti-Patterns

| Don't | Do Instead |
|-------|-----------|
| Lead reads files or writes code | Teammates do all implementation |
| Load context / call skills before spawning | Context is already loaded; teammates discover what they need |
| Write step-by-step instructions | Give goals and scope — teammates are autonomous |
| Spawn all when there are dependencies | Respect dependency graph |
| Broadcast routine messages | Direct message to specific teammate |
| Use teams for simple sequential work | Teams are for genuinely parallel work |
