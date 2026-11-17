# Running the suite on its own database beside a local dev server

For a project whose local dev server reads one env file and so serves one database (Laravel on Herd or Valet, an app container with a mounted `.env`). Measured on a Laravel + Inertia app, 17/11/2026: local e2e runs had left about 20 undeletable rows in the dev database, because the tables they wrote to refuse `DELETE` by design.

## Why a second process, not a second site

A second virtual host or a header that switches databases still needs one app process per database, and the dev server reads one env file. A second process started by the runner, with the database set in its own environment, is the smallest change: the dev server keeps serving the developer's data, and the runner's process serves the test database.

Laravel's dotenv does not overwrite variables already in the process environment, so values exported to the child beat `.env`. Check this for the framework at hand before relying on it.

## The runner's shape

A small script the package manager runs (`npm run e2e:isolated`), so the plain `e2e` command keeps pointing at the dev server:

1. Load the CI job's env file (the one CI copies to `.env`) into the child environment, then take only what the CI file lacks from the local `.env` (an app key). Reusing the CI file keeps local and CI on one definition of the test environment.
2. Blank any connection URL variable (`DB_URL`). A URL overrides the separate host and database variables in many frameworks, so a URL in the shell or `.env` would point the run at the dev database whatever `DB_DATABASE` says.
3. Refuse to start unless the database name matches the test pattern (ends in `_e2e`). This is the one check that stops a typo from migrating and seeding the developer's data.
4. Create the database if missing and run migrations against it.
5. Start the app server on its own port, without the auto-reloader if workers are wanted (`php artisan serve --no-reload`, worker count from `PHP_CLI_SERVER_WORKERS`). Start it **in its own process group** and kill the whole group on exit: killing only the parent leaves its `php -S` workers holding the port, and the next run fails with "port already in use".
6. A server-rendering process usually listens on a port fixed in its bundle. Start one only when nothing listens there, otherwise reuse the dev one and print that it did.
7. Run the browser suite with `BASE_URL` pointing at the new port, passing extra arguments through so one spec can be run.
8. Keep login state in a folder per base URL (an env var the state-path helper reads), so a state file issued by one database is never replayed against the other.
9. Stop everything it started on normal exit, Ctrl-C, SIGTERM and SIGHUP, including the browser runner child.

Verify isolation, not just a green run: count a few dev-database tables before and after a run and confirm they did not move, while the same tables in the test database did.

## Traps a first run hits

| Symptom | Cause | Fix |
|---|---|---|
| Second run refused: port already in use | The server's worker processes outlived the parent the runner killed | Start servers in their own process group and kill the group |
| A form spec fails on a field the server now requires | The browser loaded the last frontend build, not the source; the CI gate that runs lint and unit tests never builds | Build the frontend before e2e after any frontend change |
| Specs that look a fixture up in a paged list stop finding it after many local runs | Another spec creates a row on every run, so on a reused local test database the fixtures drift past page 1; CI's fresh database each run hides it | Drop and recreate the isolated database (the runner rebuilds it), or make that spec reuse a fixed fixture |
| Long multi-person journeys pass locally and time out on CI | The run is slower on shared CI machines and the journey was already near the 30 s test limit | Open the CI trace and confirm steps were still progressing (not hung) at the limit, then raise that journey's own `test.setTimeout`; never the global limit, and never before reading the trace |
