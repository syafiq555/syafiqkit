---
description: Create a git commit by analyzing ONLY staged changes. Keep the commit message short and concise (1-2 sentences max).
disable-model-invocation: true
---

# Git Commit Command

Create a well-formatted conventional commit from staged changes.

## Workflow

### 1. Analyze Staged Changes
```bash
git diff --staged --stat
git diff --staged
```

**CRITICAL**: Only analyze staged changes - ignore unstaged and recent commits.

### 2. Determine Commit Type

| Type | When to Use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructure (no behavior change) |
| `chore` | Build, deps, config changes |
| `docs` | Documentation only |
| `perf` | Performance improvement |
| `test` | Test additions/updates |
| `style` | Formatting, whitespace |

### 3. Determine Scope

Extract from file paths:
- `app/Services/Workshop/*` → `workshop`
- `app/Services/Inventory/*` → `inventory`
- `resources/views/*` → `ui`
- `routes/*` → `routes`
- Multiple areas → most significant one

### 4. Draft Message

**Format**:
```
<type>(<scope>): <description>

[optional body for complex changes]
```

**Rules**:
- Description: lowercase, no period, imperative mood
- Focus on "why" not "what"
- Max 72 characters for first line
- Body for complex changes only

### 5. Validate Before Commit

| Check | Action |
|-------|--------|
| No secrets in diff | Abort if found, warn user |
| Type matches changes | `feat` = new, `fix` = bug, etc. |
| Scope is accurate | Reflects primary area changed |

### 6. Commit

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <message>
EOF
)"
```

### 7. Verify

```bash
git status
git log -1 --oneline
```

## Examples

| Changes | Commit Message |
|---------|----------------|
| New API endpoint | `feat(api): add customer search endpoint` |
| Fix null pointer | `fix(orders): handle missing customer gracefully` |
| Update deps | `chore(deps): upgrade Laravel to 10.x` |
| Rename method | `refactor(inventory): rename getQty to getAvailableQuantity` |

## Anti-Patterns

| ❌ Avoid | ✅ Instead |
|----------|-----------|
| `fix: fixed stuff` | `fix(auth): resolve token expiry race condition` |
| `update code` | `refactor(orders): extract validation to service` |
| `wip` | Don't commit WIP, or use `chore: wip - <context>` |
| `Fix typo` | `docs: fix typo in README` (with scope) |
