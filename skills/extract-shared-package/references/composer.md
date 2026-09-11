# Composer shapes (checked 2026-09-08 where a source is named; the rest is observed behaviour)

## Consumer `composer.json`

```json
"repositories": [
  {"type": "vcs", "url": "https://github.com/<org>/<repo>.git"}
],
"require": {
  "<vendor>/<package>": "1.0.0"
}
```

Exact pin, never `^`. The `vcs` type reads `composer.json` at the repo root only — a monorepo of several packages cannot be consumed this way without a subtree split, which is why one package with a namespace per capability is the default shape.

## Auth where the install really runs

`auth.json` at the app root (Laravel's default `.gitignore` lists it; confirm on the BOX with `git check-ignore auth.json` rather than by reading `.gitignore` — an ignore rule does nothing for a file that was committed before it, and a consumer can be carrying a tracked `auth.json` of dead credentials from a past licence. Untracking it means the deploy that lands that commit deletes the box copy, so place the real file after that deploy, not before):

```json
{"github-oauth": {"github.com": "<fine-grained PAT, contents:read on that repo>"}}
```

`git reset --hard` leaves untracked files alone; `git clean -fdx` would remove it. The `COMPOSER_AUTH` environment variable takes the same JSON, but a value carried through a systemd `EnvironmentFile` keeps its quotes and breaks — prefer the file. The Actions job `GITHUB_TOKEN` cannot read a sibling private repo; a PAT or GitHub App token can.

## Local iteration without committing a path repo

```bash
composer config repositories.local path ~/path/to/package   # symlinks into vendor/
composer require "<vendor>/<package>:@dev"                  # @dev is required when the app's minimum-stability is stable
# ... work ...
git checkout HEAD -- composer.json composer.lock            # before committing the app
```

`HEAD --`, not `--`: under a harness that auto-stages writes, `git checkout -- <file>` restores from the index, which already holds the `path` entry, and reports success while changing nothing. A `path` entry that reaches `master` fails the next deploy: the box cannot resolve it. Then re-pin over the real repository:

```bash
composer config repositories.<name> vcs https://github.com/<org>/<repo>.git
composer require "<vendor>/<package>:<tag>"
```

Resolving a private `vcs` repo locally needs the same token the box has — `composer config -g github-oauth.github.com <pat>` plus `composer config -g github-protocols https` — and the lock then records the `dist` as the GitHub API zipball, which is what the box installs; the `source` line still reads as an `ssh` URL and is not what deploy uses.

## Package `composer.json` shape (one package, provider per capability)

```json
"name": "<vendor>/platform",
"require": {
  "php": "^8.3",
  "illuminate/contracts": "^10.0|^11.0|^12.0",
  "illuminate/database": "^10.0|^11.0|^12.0",
  "illuminate/support": "^10.0|^11.0|^12.0"
},
"require-dev": {"orchestra/testbench": "^8.0|^9.0|^10.0", "phpunit/phpunit": "^10.5|^11.0"},
"autoload": {"psr-4": {"<Vendor>\\": "src/"}}
```

No `extra.laravel.providers`: hosts register `Vendor\Capability\CapabilityServiceProvider` themselves, so a capability's code can sit in `vendor/` unregistered. Each provider does `mergeConfigFrom`, `loadMigrationsFrom(__DIR__.'/../../database/migrations/<capability>')`, `loadViewsFrom`, and `publishes` config/views. Migrations are loaded, not published — two hosts editing published copies is the drift the package exists to prevent — and every `create`/`addColumn` is guarded with `Schema::hasTable`/`hasColumn` so a host that already carries the tables adopts them in place.

Testbench majors map to Laravel majors: 8 → 10, 9 → 11, 10 → 12.

## CI matrix

```yaml
strategy:
  matrix:
    php: ['8.3', '8.4']
    laravel: ['10', '11', '12']
    include:
      - {laravel: '10', testbench: '^8.0'}
      - {laravel: '11', testbench: '^9.0'}
      - {laravel: '12', testbench: '^10.0'}
    exclude:
      - {laravel: '10', php: '8.4'}     # Laravel 10 never supported 8.4
steps:
  - run: composer require "illuminate/contracts:^${{ matrix.laravel }}.0" "orchestra/testbench:${{ matrix.testbench }}" --no-update
  - run: composer update --prefer-stable --no-interaction
    env:
      COMPOSER_NO_SECURITY_BLOCKING: ${{ matrix.laravel != '12' && '1' || '' }}
  - run: vendor/bin/phpunit
```

Release: tag only when every consumer's suite is green against the same package commit, and write each consumer's SHA into the tag message, since consumer suites usually run locally rather than in Actions.

## Resolver traps

- **Composer 2.9+ blocks resolution of any release carrying an open advisory** (2.9 as `audit.block-insecure`, 2.10 as `policy.advisories.block`; the portable off-switch is `COMPOSER_NO_SECURITY_BLOCKING=1`, since the CLI flag was renamed between them). Against Laravel that is every 10.x AND every 11.x release (one CRLF advisory spans 9.0 to 12.59), so `composer update` prints a wall of "not loaded, because they are affected by security advisories" and reads as a version conflict. `composer install` from an existing lock is unaffected. Relax it for those legs only, and record that the consumer's framework carries unpatchable advisories as its own task.
- **Shared transitive majors** (e.g. `spatie/laravel-medialibrary` v10 in one consumer, v11 in the other): check the newer major's own constraints on Packagist (`https://repo.packagist.org/p2/<vendor>/<package>.json`) — it often accepts the older framework, so the lagging consumer bumps first and the package pins one major.
- **Repo creation** (observed 2026-09-08, not from a doc): `gh repo create` fails with "does not have the correct permissions to execute CreateRepository" when the org restricts creation to owners, not when the token is wrong; and a name may already belong to an unrelated app in the org — `gh repo view <org>/<name>` before assuming.
