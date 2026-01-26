---
description: Create a git commit by analyzing ONLY staged changes. Keep the commit message short and concise (1-2 sentences max).
disable-model-invocation: true
---

# Git Commit Command

Create conventional commit from staged changes.

## Workflow

1. **Analyze staged changes only**
   ```bash
   git diff --staged --stat
   git diff --staged
   ```

2. **Determine type**

   | Type | Use |
   |------|-----|
   | `feat` | New feature |
   | `fix` | Bug fix |
   | `refactor` | Restructure (no behavior change) |
   | `chore` | Build, deps, config |
   | `docs` | Documentation |
   | `perf` | Performance |

3. **Determine scope** from file paths (e.g., `app/Services/Workshop/*` → `workshop`)

4. **Draft message**
   ```
   <type>(<scope>): <description>
   ```
   - Lowercase, no period, imperative mood
   - Max 72 chars, focus on "why"

5. **Validate**: No secrets, type matches changes

6. **Commit**
   ```bash
   git commit -m "$(cat <<'EOF'
   <type>(<scope>): <message>
   EOF
   )"
   ```

7. **Verify**: `git status && git log -1 --oneline`

## Examples

| Changes | Message |
|---------|---------|
| New endpoint | `feat(api): add customer search endpoint` |
| Null pointer | `fix(orders): handle missing customer gracefully` |
| Deps update | `chore(deps): upgrade Laravel to 10.x` |

## Anti-Patterns

| Avoid | Instead |
|-------|---------|
| `fix: fixed stuff` | `fix(auth): resolve token expiry race condition` |
| `update code` | `refactor(orders): extract validation to service` |
| `wip` | `chore: wip - <context>` or don't commit |
