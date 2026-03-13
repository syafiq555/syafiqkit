---
description: Create git commits from staged changes. Works for single repos and multi-repo projects.
disable-model-invocation: true
---

# Git Commit Command

Create conventional commits from staged changes.

## Workflow

1. **Find repos to commit** — check working directory for staged changes, then check subdirs for nested `.git` repos with staged changes. Skip any repo with nothing staged.

2. **For each repo with staged changes**:
   - `git diff --staged --stat` + `git diff --staged`
   - Determine type: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf`
   - Determine scope from file paths (e.g., `app/Services/Workshop/*` → `workshop`)
   - Commit: `<type>(<scope>): <description>` — lowercase, no period, imperative, max 72 chars
   - Verify: `git status && git log -1 --oneline`

3. **Validate**: No secrets committed, type matches changes

## Commit Format

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <message>
EOF
)"
```

## Anti-Patterns

| Avoid | Instead |
|-------|---------|
| `fix: fixed stuff` | `fix(auth): resolve token expiry race condition` |
| `update code` | `refactor(orders): extract validation to service` |
| `wip` | `chore: wip - <context>` or don't commit |
