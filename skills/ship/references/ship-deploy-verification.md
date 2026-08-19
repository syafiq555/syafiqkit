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

Ask the destination's database directly, in whatever way that stack allows: its migration tool's own status output, or a description of the table whose shape should have changed. What you are looking for is the new migration reported as run, or the new column present on the table — not a green pipeline.

Confirm the specific migrations from this push appear as "Ran". Code expecting a column that doesn't exist usually breaks on first use, not at boot, so missing migrations surface as production errors hours after deploy.

### Seeded Reference Data

A migration creates the table; something else has to fill it. Where the seeder is wired into neither the app's seed entry point nor the deploy pipeline, the table arrives empty and stays that way — and this is the failure mode migrations verification does not catch, because the migration genuinely did run.

Nothing errors. A guard testing that the table EXISTS passes on a migrated-but-empty table, so the code takes its normal path over an empty set and degrades quietly: the artifact renders with the seeded content missing rather than throwing. For a document assembled from reference rows, that is a document with no content in it.

```bash
# Count rows for the identifier the app actually uses, read from source
grep -rn "CURRENT_.*_VERSION\|const VERSION" <app-dir>   # find the constant first
# then, at the destination:
SELECT COUNT(*) FROM <table> WHERE <version_col> = '<that value>';
```

Three traps, in the order they bite:

- **Guessing the identifier returns zero too**, which reads as confirmation of the bug you suspected. Read the constant from the source before querying: version strings are rarely the tidy `v1`/`v2` you would guess, and a wrong guess produces the same empty result for an entirely different reason.
- **Existing records predate the feature** and carry a null/legacy version, so they render through the old path and look healthy. Spot-checking live data therefore shows everything fine while every FUTURE record is broken. Resolve against the current version, not against what is already stored.
- **Counting the seeder file's entries disagrees with the database.** Loop-generated rows mean the file's literal count and the table's row count are different numbers; and one logical row can carry variants selected at render time, so a correct render legitimately returns fewer items than the table holds. Read both from the DB and expect the render to be ≤ the row count.

Seeding by hand closes the exposure and not the defect: the seeder is still unwired, so the next environment — or a rebuilt database — lands empty again. Record it as still open.

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
