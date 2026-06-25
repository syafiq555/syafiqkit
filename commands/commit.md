---
description: Create git commits from staged changes. Works for single repos and multi-repo projects.
---

# Git Commit Command

Create conventional commits from staged changes.

## Workflow

1. **Find repos to commit** — check working directory for staged changes, then check subdirs for nested `.git` repos with staged changes. Skip any repo with nothing staged.

2. **Changelog gate** (per-repo): If staged changes include user-visible fixes/features/improvements, check if `CHANGELOG.md` is also staged. If NOT → **auto-update it**: read the current `CHANGELOG.md`, prepend a new dated entry under the correct heading (`### Fixed` / `### Added` / `### Changed`) matching today's date, stage it with `git add CHANGELOG.md`, then continue to commit. Do NOT ask the user — just do it.

3. **For each repo with staged changes**:
   - `git diff --staged --stat` + `git diff --staged`
   - Determine type: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf`
   - Determine scope from file paths (e.g., `app/Services/Workshop/*` → `workshop`)
   - Commit: `<type>(<scope>): <description>` — lowercase, no period, imperative, max 72 chars
   - Verify: `git status && git log -1 --oneline`

4. **GitNexus re-index** (background, per-repo): For each repo where commit type is NOT `docs`, if `.gitnexus/` exists, run in background:
   ```bash
   [ -d ".gitnexus" ] && npx gitnexus analyze --skip-agents-md
   ```

5. **Validate**: No secrets committed, type matches changes

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
