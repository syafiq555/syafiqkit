---
name: pull-db
description: Pull a remote server's database to the local development environment. Handles mysqldump on server, binary-safe transfer via scp, MariaDB→MySQL compatibility fixes, password reset, and cleanup. Use when the user says "pull db", "copy production database", "sync db from server", "get real data", "import prod db", "pull database locally", or wants to test with production/staging data.
---

# Pull Remote Database to Local

Transfer a MySQL/MariaDB database from a remote server to the local development environment.

## Default Configuration

These defaults match the common setup but can be overridden by user context or CLAUDE.local.md:

| Setting | Default | Override source |
|---------|---------|----------------|
| Remote access | `remote` CLI (from `~/.config/remote-cli/servers.json`) | User can specify SSH alias directly |
| Local MySQL | Docker container named `mysql`, root user, no password | Adapt if native MySQL or different container |
| Transfer method | scp via SSH alias | Always binary-safe (never pipe `remote` to local file) |
| Post-import | Reset all passwords + clean up dump files | User can skip with "just the data" |

## Workflow

### Step 1: Gather Parameters

Determine from context or ask the user:

1. **Source server** — which remote alias or SSH host (check `~/.config/remote-cli/servers.json` or `~/.ssh/config`)
2. **Database name** — check with `remote <server> "mysql -u USER -pPASS -e 'SHOW DATABASES'"` or infer from server config
3. **Credentials** — from CLAUDE.local.md, server config, or ask user
4. **Local database name** — from project `.env` (`DB_DATABASE=`)
5. **Local MySQL access** — Docker container name (`docker ps --format '{{.Names}}' | grep -i mysql`) or native

### Step 2: Dump on Server

Always dump AND compress on the server itself. Never pipe binary through `remote` CLI (ANSI codes corrupt gzip streams).

```bash
remote <server> "mysqldump -u USER -pPASS DBNAME --single-transaction --routines --triggers --no-tablespaces 2>/dev/null | gzip > ~/public_html/db_dump.sql.gz && ls -lh ~/public_html/db_dump.sql.gz"
```

**Dump location strategy** (Cloudways users can't write to `~/` directly):
1. Try `~/public_html/` (app directory — usually writable)
2. Fall back to `/tmp/` then copy to app dir
3. If both fail, ask user for writable path

### Step 3: Download via SCP

Always use `scp` for binary transfer — never pipe `remote` output to a local file.

```bash
scp <ssh-alias>:~/public_html/db_dump.sql.gz /tmp/db_dump.sql.gz
```

Verify integrity immediately:
```bash
gunzip -t /tmp/db_dump.sql.gz
```

If verification fails, the dump location may not be accessible via scp (chroot jail). Try the app directory path that `remote` showed in its output.

### Step 4: Import Locally

MariaDB → MySQL 8.x imports commonly fail on FK constraints (error 6125: non-unique column referenced by FK). The safest approach:

1. **Drop and recreate** the local database:
```bash
docker exec -i <container> mysql -u root -e "DROP DATABASE IF EXISTS <dbname>; CREATE DATABASE <dbname> CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. **Strip known-bad FKs** and import with `--force`:
```bash
gunzip -c /tmp/db_dump.sql.gz | sed '/<problematic_fk_name>/d' | (echo "SET FOREIGN_KEY_CHECKS=0;" && cat) | docker exec -i <container> mysql -u root <dbname> --default-character-set=utf8mb4 --force
```

If error 6125 appears, grep the dump for the FK name from the error, add it to the sed filter, recreate the database, and retry.

3. **Verify**:
```bash
docker exec -i <container> mysql -u root <dbname> -e "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='<dbname>';"
```

### Step 5: Post-Import Safety

**Reset passwords** — use Laravel tinker (avoids shell escaping issues with bcrypt `$` characters):
```bash
php <project-path>/artisan tinker --execute="\App\Models\User::query()->update(['password' => bcrypt('secret')]); echo \App\Models\User::count() . ' users updated';"
```

If the project doesn't use Laravel, use a direct SQL update with a pre-computed bcrypt hash (generate fresh each time to avoid escaping issues).

**Truncate sensitive data** (optional, if user requests):
- `personal_access_tokens` — API tokens
- `oauth_access_tokens` / `oauth_refresh_tokens` — OAuth tokens
- `password_resets` / `password_reset_tokens`

### Step 6: Cleanup

Remove dump files from both locations:
```bash
# Remote
remote <server> "rm -f ~/public_html/db_dump.sql.gz /tmp/db_dump.sql.gz && echo 'cleaned'"

# Local
rm -f /tmp/db_dump.sql.gz
```

### Step 7: Report

Tell the user:
- Table count imported
- Any FKs that were stripped (and why — MariaDB/MySQL incompatibility)
- Password reset confirmation
- Reminder that local app now has production data (be careful with write operations)

## Gotchas

| Issue | Solution |
|-------|----------|
| `remote` output corrupts binary pipes | Always dump on server, download via scp |
| scp can't reach `/tmp/` (Cloudways chroot) | Dump to app directory (`~/public_html/`) |
| FK error 6125 on import | Strip the specific FK with sed, import with `--force` |
| Password update via raw SQL fails | Bcrypt `$` chars get shell-interpreted; use tinker/ORM instead |
| Home dir (`~/`) not writable | Use `~/public_html/` or app path shown by `remote` |
| `gunzip -t` fails after download | ANSI codes leaked into pipe — re-download via scp (not remote) |
