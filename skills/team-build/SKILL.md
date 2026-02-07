---
name: team-build
description: Spawn a coordinated team of agents to implement a module/feature. Use when user describes multi-workstream work like "build X with audit, CAPA, reports" or says "use a team", "swarm this", "parallel agents". Produces a plan, creates team, spawns teammates, coordinates to completion.
---

# Team Build Workflow

Coordinate a team of specialized agents to implement a module or feature in parallel.

## Phase 1: Understand Scope

### 1.1 Load Context
```
/syafiqkit:read-summary [domain if known]
```
Read project CLAUDE.md files for conventions, patterns, gotchas.

### 1.2 Explore Existing Code

Spawn Explore agents in parallel to understand:

| Agent | Goal |
|-------|------|
| Backend explorer | Existing models, controllers, migrations, routes for this domain |
| Frontend/mobile explorer | Existing stores, services, screens, components |
| Auth/infra explorer | Auth middleware, route groups, shared traits/services |

### 1.3 Clarify with User (if needed)

Use AskUserQuestion for ambiguous design decisions. Common questions:

| Topic | Example |
|-------|---------|
| Platform scope | Web only? Mobile only? Both? |
| Auth flow | Who can access what? Role-based? |
| Offline support | Need offline drafts? Sync strategy? |
| Data shape | Normalize or JSON blobs? |

## Phase 2: Plan

Enter plan mode. Write a plan covering:

### Plan Structure

```markdown
# {Feature Name} — Team Implementation Plan

## Context
- What exists (DO NOT recreate)
- What's missing
- Critical bugs to fix first (P1)

## Team Structure
| # | Role | Agent Type | Scope |
|---|------|-----------|-------|
| Lead | Coordinator | N/A | Delegates, doesn't code |
| 1 | {Primary builder} | general-purpose | {scope} |
| 2 | {Secondary builder} | general-purpose | {scope} |
| 3 | {Support/infra} | general-purpose | {scope} |
| 4 | Documentation | general-purpose | /done workflows |
| 5 | Bug resolver | general-purpose | Standby, fixes on demand |

## Teammate N — {Role Name}
### Task N.1: {Title}
**File(s)**: {exact paths}
{Specific instructions — schema, methods, patterns to follow}

### Task N.2: ...

## Dependency Graph
{Which tasks block which — determines spawn order}

## Verification
{How to verify each task + integration tests}
```

### Plan Principles

| Principle | Why |
|-----------|-----|
| P1 bugs first | Fix broken patterns before building on them |
| Quick wins early | Register routes, wire up existing code |
| Explicit file paths | Teammates need exact targets, not vague guidance |
| Code examples in plan | Show the pattern, not just describe it |
| Dependency graph | Prevents race conditions on shared files |

### Exit plan mode for user approval.

## Phase 3: Execute

### 3.1 Create Team
```
TeamCreate: team_name={feature-slug}
```

### 3.2 Create Tasks
Create all tasks from the plan using TaskCreate. Set up dependencies:
```
TaskUpdate: taskId=X, addBlockedBy=[Y, Z]
```

### 3.3 Spawn Teammates

**Teammate prompt template:**
```
You are Teammate N — {Role} for the {Feature} integration team.

## Your Identity
- Name: {kebab-name} (use this in all communications)
- Team: {team-name}

## Context
Read `tasks/{domain}/{feature}/current.md` for project context.
Read `{sub-project}/CLAUDE.md` for conventions.

## Your Tasks
{List task IDs and summaries}

## Workflow
1. Run TaskGet for your first task ID to get full instructions
2. Mark task in_progress with TaskUpdate before starting
3. Do the work (create files, edit code, run artisan commands)
4. Verify with IDE diagnostics (getDiagnostics) — zero errors required
5. Mark task completed with TaskUpdate
6. Check TaskList for next available task
7. Send progress to team-lead via SendMessage after each task

## Rules
- Use `php artisan make:*` for Laravel files (never create manually)
- Match existing patterns in the codebase
- {Project-specific rules from CLAUDE.md}
```

**Spawn order** — respect dependency graph:
1. Bug resolver (P1 fixes, no blockers)
2. Builders with unblocked tasks
3. Docs manager (monitors, updates after completions)
4. Code simplifier (idle, activated when needed)

### 3.4 Coordinate

**Lead responsibilities** (delegate mode — don't code yourself):

| Event | Action |
|-------|--------|
| Teammate completes task | Check if downstream tasks are unblocked, notify blocked teammates |
| Teammate reports bug | Route to bug-resolver |
| Teammate idle, no tasks | Assign new work or send shutdown_request |
| Shared file conflict | Warn teammates to use separate sections/comment blocks |
| User requests change | Create new task, assign to appropriate teammate |
| All tasks done | Trigger Phase 4 |

**Communication patterns:**
```
# Unblock notification
SendMessage → teammate: "Task #X is now unblocked. You can start on it."

# Route bug
SendMessage → bug-resolver: "Bug found in {file}: {description}. Please fix."

# User interrupt → new task
TaskCreate → assign to appropriate teammate via TaskUpdate
SendMessage → teammate: "New task #{id} assigned. {brief description}"
```

### 3.5 Code Quality (on demand)

Keep a code-simplifier teammate idle. Activate when:
- User spots duplicate patterns
- Multiple teammates produce similar auth/scoping logic
- Files exceed complexity threshold

```
SendMessage → code-simplifier: "Review {files} for {pattern}. DRY it up."
```

## Phase 4: Wrap Up

### 4.1 Final Docs
```
SendMessage → docs-manager: "All tasks complete. Run final doc update + /syafiqkit:update-claude-docs"
```

### 4.2 Shutdown Teammates
Shutdown in reverse spawn order (wait for each approval):
```
SendMessage type=shutdown_request → {each teammate}
```

### 4.3 Clean Up
```
TeamDelete  # Removes team + task directories
```

### 4.4 Summary
Output final scorecard to user:

```markdown
## {Feature} — Complete

**{N} tasks completed** across {M} teammates.

### What was built
| Category | Deliverables |
|----------|-------------|
| Tables | ... |
| Controllers | ... |
| Services | ... |
| Routes | ... |
| Mobile | ... |

### Bug fixes
- ...

### Architecture decisions
- ...
```

## Anti-Patterns

| Don't | Do Instead |
|-------|-----------|
| Lead writes code | Delegate to teammates |
| Teammate guesses file paths | Plan provides exact paths |
| Spawn all teammates at once | Respect dependency graph |
| Retry failing teammate 5 times | Route to bug-resolver |
| Ignore user interrupts | Create task, assign, continue |
| Leave idle teammates running | Shutdown when all tasks done |
| Duplicate work across teammates | Shared files get one owner |
| Skip IDE diagnostics | Every file must pass getDiagnostics |
