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
| Remote access | plain `ssh <host>` (or the `remote` CLI, from `~/.config/remote-cli/servers.json`, if set up) | User can specify SSH alias directly |
| Local MySQL | Docker container named `mysql`, root user, no password | Adapt if native MySQL or different container |
| Transfer method | scp via SSH alias | Always binary-safe (never pipe a decorating wrapper's stdout to a local file) |
| Post-import | Reset all passwords + clean up dump files | User can skip with "just the data" |

## Workflow

### Step 1: Gather Parameters

Determine from context or ask the user:

1. **Source server** — which remote alias or SSH host (check `~/.config/remote-cli/servers.json` or `~/.ssh/config`)
2. **Database name** — list the databases on the remote server, or infer it from server config
3. **Credentials** — from CLAUDE.local.md, server config, or ask user
4. **Local database name** — from project `.env` (`DB_DATABASE=`)
5. **Local MySQL access** — the name of the running MySQL container, or a native install

### Step 2: Dump on Server, Transfer via scp

Dump and compress on the server itself, then move the resulting file with `scp` — never pipe a mysqldump through the SSH command's stdout into a local file. Any wrapper that decorates its output (the `remote` CLI injects ANSI colour codes, and plain `ssh` can allocate a TTY) corrupts a binary stream silently, while text passes through looking fine:

```bash
ssh <host> "mysqldump -u USER -pPASS DBNAME --single-transaction --routines --triggers --no-tablespaces 2>/dev/null | gzip > ~/public_html/db_dump.sql.gz && ls -lh ~/public_html/db_dump.sql.gz"
```

Cloudways-style hosts often can't write to `~/` directly, so if the dump command fails, retry against `~/public_html/` (the app directory is usually writable), then `/tmp/` as a last resort before asking the user for a writable path.

Download and verify immediately:

```bash
scp <ssh-alias>:~/public_html/db_dump.sql.gz /tmp/db_dump.sql.gz
gunzip -t /tmp/db_dump.sql.gz
```

If `gunzip -t` fails, the dump likely sits somewhere scp can't reach (a chroot jail) rather than being genuinely corrupt — retry against whichever app-directory path the dump command's `ls -lh` output actually showed.

### Step 3: Import Locally

MariaDB dumps commonly fail importing into MySQL 8.x with error 6125 (non-unique column referenced by FK) — a real cross-version incompatibility, not a data problem. Drop and recreate the local database, then strip the offending FK before importing:

```bash
docker exec -i <container> mysql -u root -e "DROP DATABASE IF EXISTS <dbname>; CREATE DATABASE <dbname> CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

gunzip -c /tmp/db_dump.sql.gz | sed '/<problematic_fk_name>/d' | (echo "SET FOREIGN_KEY_CHECKS=0;" && cat) | docker exec -i <container> mysql -u root <dbname> --default-character-set=utf8mb4 --force
```

If error 6125 names a different FK than the one already stripped, add that name to the sed filter and repeat (recreate the database first — a partial `--force` import can leave stale rows behind). Then count the tables in the imported database and confirm the number is what the source had; `--force` finishes and reports success on an import that dropped tables along the way.

### Step 4: Post-Import Safety

Reset passwords through Laravel tinker rather than raw SQL — bcrypt hashes contain `$` characters that the shell interprets when passed through a raw `mysql -e` command, so tinker (or the ORM) sidesteps that entirely:

```bash
php <project-path>/artisan tinker --execute="\App\Models\User::query()->update(['password' => bcrypt('secret')]); echo \App\Models\User::count() . ' users updated';"
```

If the project isn't Laravel, use a direct SQL update with a bcrypt hash generated fresh for that call (still avoids the escaping issue).

If the user wants sensitive data truncated, the usual candidates are `personal_access_tokens` (API tokens), `oauth_access_tokens`/`oauth_refresh_tokens`, and `password_resets`/`password_reset_tokens`.

### Step 5: Cleanup and Report

Remove the dump file from both the server and `/tmp/` locally, then tell the user what happened: table count imported, any FKs that had to be stripped and why, password reset confirmation, and — this is the one that actually matters — that the local app now holds production data, so write operations there carry real consequences.
