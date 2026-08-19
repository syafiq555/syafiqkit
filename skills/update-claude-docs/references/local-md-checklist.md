# CLAUDE.local.md Checklist

These belong in `CLAUDE.local.md` because they carry env-specific context (server passwords, account names, API tokens) that shouldn't be in team-visible `CLAUDE.md` — and they're the ones a session forgets to save because each feels too small on its own:

- **Credentials/tokens** read from config files (`secrets.json`, `.env`, DB) — save the extraction pattern (e.g., `jq -r '.["key"]' path`)
- **API headers** that required trial-and-error (auth headers, required headers that caused 401/403)
- **CLI one-liners** used 3+ times (curl templates, scp with password, remote + mysql combos)
- **External service URLs** discovered during the session (settings pages, portal URLs, API endpoints)
- **Account mappings** (which token → which account → which subdomain)
- **Names and handles for reaching infrastructure** — container names, server aliases, hostnames, the behaviour of a tool only you have installed. These read as team facts because their subject is the shared system, and they are the category most often misrouted: the architecture is the team's, while the strings you type to reach it are yours.

## Principle

A CLAUDE.md has to stand on its own for a session that starts cold, because that session has no task doc loaded and no way to know one exists. So "the task doc already covers it" is not a reason to leave a fact out — the two files have different readers arriving at different moments.
