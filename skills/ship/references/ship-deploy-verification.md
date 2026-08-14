# Deploy Verification by Artifact Type

After CI passes (or a manual deploy completes), verify the user-facing change is live. A green pipeline run only proves the pipeline executed, not that the artifact was deployed or is running.

## Key Principle

Verify at the **destination**, not by reading the tool's exit code. A backgrounded or wrapper-mediated upload can hand back control before the transfer finishes, and the failure then surfaces later as a confusing error about something else.

## By Artifact Type

### Container Image in Registry

```bash
docker pull <registry>/<image>:<tag>
docker inspect <image>:<tag> | jq '.Created'
```

Verify the image exists and has the expected creation timestamp.

### File on Server (rsync, CI sync, SCP)

```bash
remote <server> "ls -l <path>/<file>"
remote <server> "grep 'expected-string' <path>/<file>"
```

Never trust the upload command's exit code. Verify the file exists on the destination and contains what you deployed.

### Git Repository

```bash
remote <server> "cd <deploy-path> && git log --oneline -1"
remote <server> "cd <deploy-path> && grep 'expected-change' <file>"
```

The deployed checkout may not be a git repo (rsync deploys land plain files), so verify the actual file content and behavior, not just the commit history.

### Database Schema (Migrations)

Migrations are often run by a system separate from the deploy pipeline (container entrypoint, release phase, separate job, or manual trigger). A green CI run doesn't prove migrations ran.

```bash
# Laravel
php artisan migrate:status

# General SQL
SHOW MIGRATIONS;  # or equivalent for your DB
\d <table>        # for PostgreSQL; DESCRIBE <table> for MySQL
```

Confirm the specific migrations from this push appear as "Ran". Code expecting a column that doesn't exist usually breaks on first use, not at boot, so missing migrations surface as production errors hours after deploy.

### User-Visible Behavior

For any artifact type, verify the user-facing change:

- A new UI element renders correctly
- A config setting is actually applied (query the app's own bootstrap, not the config file)
- An endpoint returns the expected response
- A notification/email format matches what you deployed
- A feature flag is active for the target audience

A health check passes with or without the deployed change, so a green health probe is not verification.

## Negative Controls

Any verification returning "not found" needs a positive control before it's trusted. A grep returning 0 reads identically whether:
- The deploy broke
- The search string was never going to match (a closure-dispatched job doesn't print its class name; a bundler hoists a shared string out of the file you searched)

Chain probes with `;`, never `&&`:

```bash
grep -c 'my-string' file && echo "CONTROL" file  # ← stops short if first grep hits 0
grep -c 'my-string' file ; echo "CONTROL"        # ← both run, both print
```

Run unfiltered first to rule out a bad search pattern, then confirm with a control.
