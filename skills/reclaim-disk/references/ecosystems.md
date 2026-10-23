# Clearing each ecosystem

What to run per tool, and the trap each carries. The npm, pnpm, Yarn, Gradle, Playwright, Flutter, Docker, Downloads and Logs rows were run on macOS on 23/10/2026; the rest are from documentation and not yet run.

| Tool | Where it grows | Clear with | Trap |
|---|---|---|---|
| npm | `~/.npm/_cacache`, `~/.npm/_npx` | `npm cache clean --force`; delete `~/.npm/_npx` | `_npx` is not covered by `cache clean` and is often the larger half |
| pnpm | `pnpm store path` | `pnpm store prune`; delete the store folder when prune reports nothing | Projects keep working: their `node_modules` hard-link to the store, so space only returns once they are cleaned too. A broken Corepack shim can shadow pnpm; check `pnpm --version` prints a pnpm version |
| Yarn 1 | `~/Library/Caches/Yarn` | `yarn cache clean`, or delete the folder if `yarn` is no longer installed | |
| Gradle | `~/.gradle/caches` (`transforms`, `modules-2`) | Stop daemons (`pgrep -f GradleDaemon`), then delete `caches` | Keep `~/.gradle/wrapper` while a project pins that Gradle version |
| Playwright / Puppeteer | `~/Library/Caches/ms-playwright`, `~/.cache/puppeteer` | Delete the folder | The next e2e run needs `npx playwright install` |
| Flutter | each repo's `build/`, `.dart_tool/` | `flutter clean` per repo | Often the largest per-repo item (10 GB+ with iOS builds). The binary may not be on PATH: look under the SDK folder |
| Node repos | `node_modules`, `.next`, `dist` | Delete on repos not touched recently (`git log -1 --format=%ad`) | The repo needs an install before it runs again |
| Rust | `target/`, `~/.cargo/registry` | `cargo clean` per repo | |
| Composer | `composer config cache-dir` | `composer clear-cache` | |
| CocoaPods, Dart pub | `~/Library/Caches/CocoaPods`, `~/.pub-cache` | `pod cache clean --all`; leave the pub cache unless large | `flutter pub cache clean` empties it entirely: every Flutter repo re-downloads, and globally activated tools (`dart pub global activate`) are gone until activated again |
| Python | `~/Library/Caches/pip`, `uv cache dir`, conda `pkgs` | `pip cache purge`, `uv cache clean`, `conda clean -a -y` (without `-y` it waits for input and hangs) | Virtualenvs (`venv/`, `.venv/`) are not caches: recreating one needs its requirements file |
| Maven, Go | `~/.m2/repository`, `go env GOMODCACHE` | Delete `~/.m2/repository`; `go clean -modcache` | `~/.m2/repository` also holds artifacts from `mvn install` of local projects and private-registry artifacts that need credentials: ask first |
| Time Machine | local snapshots | `tmutil listlocalsnapshots /`, then `tmutil thinlocalsnapshots / <bytes>` | Snapshots are the only local backup until the next one runs; ask first |
| Docker | `~/Library/Containers/com.docker.docker/.../Docker.raw` | `docker system df`, then `docker builder prune -a -f` and `docker image prune -a -f` | Never `--volumes`: local MySQL, MariaDB and Redis data live there. A stopped container keeps its image. Daemon must be running |
| Xcode | `~/Library/Developer/Xcode/DerivedData`, `iOS DeviceSupport`, `Archives` | Delete DerivedData; delete DeviceSupport versions older than the device's current iOS | Keep Archives of any build that shipped (crash symbolication) |
| iOS simulators | `~/Library/Developer/CoreSimulator/Devices` | `xcrun simctl delete <udid>` for unused devices | `simctl delete unavailable` removes stale entries only, not runtimes. Devices hold test logins |
| Android | `~/.android/avd`, `~/Library/Android/sdk/system-images`, `ndk` | Delete unused AVDs in Device Manager, then their system images | Keep the NDK version a project pins |
| Homebrew | `brew --cache`, old kegs | `brew cleanup -n` to preview, then `brew cleanup` | Usually under 1 GB; rarely worth the time |
| Chrome | `~/Library/Application Support/Google/Chrome/OptGuideOnDeviceModel` | Delete, or turn off on-device AI in Chrome | About 4 GB; comes back unless the feature is off |
| Claude Desktop | `~/Library/Application Support/Claude/vm_bundles` | Leave unless desperate | About 11 GB sandbox image, re-downloaded on next use (not measured) |
| Language-server indexes | `.serena/cache`, similar per-repo index caches | Delete | Rebuilt on next open; can be several GB on an old repo |
| Downloads | `.dmg`/`.pkg` installers | Delete installers for apps already installed | Ask before DB dumps, archives and project zips |
| Logs | `storage/logs/*.log`, `wp-content/debug.log` | Empty with `: > file` rather than delete | Emptying keeps the file and its permissions for the running app |
