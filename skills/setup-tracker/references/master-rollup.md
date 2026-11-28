# Across projects: the master roll-up

Roll several project trackers into the team's master sheet with IMPORTRANGE and QUERY. Read this when building or changing the master sheet.

The team's master sheet gives each project its own block, for example:

```
=QUERY(IMPORTRANGE("<project A url>", "'Asks'!A4:L"), "select 'Project A', Col1, Col2, Col4, Col5, Col6 where Col2 is not null and Col4 <> 'Closed' label 'Project A' ''", 0)
```

Stack the blocks one under another, or join them with `{block1; block2}`. Add "days open" as `=TODAY()-<Raised>` beside the imported rows. Each source has to be granted once. Imports refresh about hourly while the master is open and are capped at 10 MB per pull. Changes that arrive through IMPORTRANGE don't trigger notifications, so turn rules stay on each project sheet.
