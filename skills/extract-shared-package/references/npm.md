# npm shapes

The reasoning in `SKILL.md` carries over unchanged; only the mechanics differ. Verify any figure below against the current npm and GitHub docs before relying on it — this file records the standard shapes, not a measurement.

## One package, one entry per capability

`package.json` `exports` gives the `laravel/framework` shape without a split:

```json
"name": "@<org>/platform",
"exports": {
  "./tenancy": "./dist/tenancy/index.js",
  "./property": "./dist/property/index.js"
},
"peerDependencies": {"react": "^18 || ^19"}
```

Consumers import `@<org>/platform/tenancy` and bundle only what they touch. Framework and runtime dependencies the host already has go in `peerDependencies` with the union of the consumers' ranges, never in `dependencies` (two copies of React or an ORM is the npm equivalent of reaching into host tables).

## Hosting and auth

- **GitHub Packages** (private, same org): consumer `.npmrc` at the app root, gitignored:
  ```
  @<org>:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=<token with read:packages>
  ```
  Where `npm ci` runs inside a container at start, that file must be on the box; an env var through a systemd `EnvironmentFile` keeps its quotes.
- **Git dependency** (`"@<org>/platform": "github:<org>/<repo>#v1.0.0"`) works with no registry but needs a `prepare` build step on install and SSH or token access from wherever install runs; slower and less cacheable.
- **Workspaces** only apply when both consumers live in the same repository (`"workspaces": ["packages/*"]`); across repos they do not help.

Pin exact: `"@<org>/platform": "1.0.0"`, and commit the lockfile.

## Local iteration

`npm link` (or `pnpm link --global`) symlinks the package into the consumer without touching `package.json`; `"file:../platform"` does touch it and must not be committed. Watch for duplicate peer copies under a symlink — a hooks-rules or "invalid hook call" error is usually two Reacts, fixed with the bundler's `resolve.dedupe`/alias for the peer.

## Multi-version proof

A CI matrix over Node majors (`20`, `22`) and, where it matters, the peer's majors, installing the consumer-shaped set and running the package suite. Before tagging, install the candidate commit into each consumer and run its suite; record both consumer SHAs in the tag.

## Traps

- `npm ci` fails on a lockfile whose registry URL differs from `.npmrc` — after switching registries, regenerate the lockfile in the consumer.
- The Actions `GITHUB_TOKEN` reads packages from its own repo, or from any repo the package has been granted Actions access to under the package's settings; anything else needs a PAT with `read:packages` or a GitHub App token.
- A `prepare` build that runs during the consumer's install (git dependency) needs the dev toolchain present there; a registry-published `dist/` does not.
