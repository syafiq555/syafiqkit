import { spawnSync } from "child_process";
import { mkdirSync, writeFileSync, chmodSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(TESTS_DIR, "..");
const FIXTURE_DIR = join(TESTS_DIR, "fixtures");
const KEY_PATH = join(FIXTURE_DIR, "test_key");

/** Write the fixture config (hosts are unroutable RFC 5737 TEST-NET-1). */
export function writeFixtureConfig(): void {
  mkdirSync(FIXTURE_DIR, { recursive: true });

  writeFileSync(
    KEY_PATH,
    "-----BEGIN OPENSSH PRIVATE KEY-----\nFIXTURE ONLY - NEVER USED TO AUTHENTICATE\n-----END OPENSSH PRIVATE KEY-----\n"
  );
  chmodSync(KEY_PATH, 0o600);

  writeFileSync(
    join(FIXTURE_DIR, "servers.json"),
    JSON.stringify(
      {
        servers: {
          testbox: {
            name: "Test Box",
            host: "192.0.2.1",
            user: "deploy",
            appPath: "/var/www/app",
            tags: ["test", "fixture"],
          },
          altbox: {
            name: "Alt Box",
            host: "192.0.2.2",
            user: "root",
            port: 2222,
            appPath: "/srv/alt",
            tags: ["test", "alt"],
          },
        },
        defaults: { user: "root", port: 22, sshKey: KEY_PATH },
      },
      null,
      2
    )
  );
}

/**
 * Add a server pointing at the live sshd, leaving the offline entries intact.
 *
 * @param id Server id the live cases address
 * @param server Live sshd details from startLiveSshd()
 */
export function writeLiveFixtureConfig(
  id: string,
  server: { port: number; keyPath: string; remoteRoot: string; user: string }
): void {
  writeFixtureConfig();

  const configPath = join(FIXTURE_DIR, "servers.json");
  const config = JSON.parse(readFileSync(configPath, "utf-8"));

  config.servers[id] = {
    name: "Live Box",
    host: "127.0.0.1",
    user: server.user,
    port: server.port,
    sshKey: server.keyPath,
    appPath: server.remoteRoot,
    tags: ["live"],
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export interface CliResult {
  /** stdout + stderr merged — what most cases assert on. */
  output: string;
  /** stdout alone: the data channel a caller captures with `$(remote ...)`. */
  stdout: string;
  /** stderr alone: banners, progress, errors and hints. */
  stderr: string;
  code: number;
  timedOut: boolean;
}

const ANSI = /\x1b\[[0-9;]*m/g;
// Never invalidated: a case whose result depends on state changing mid-suite
// must not reuse another case's argv.
const cache = new Map<string, CliResult>();

function spawnCli(
  args: string[],
  env: Record<string, string | undefined>,
  timeoutMs: number
): CliResult {
  const proc = spawnSync("bun", ["run", "index.ts", ...args], {
    cwd: REPO_ROOT,
    encoding: "utf-8",
    env: { ...process.env, ...env },
    timeout: timeoutMs,
    killSignal: "SIGKILL",
  });

  const stdout = (proc.stdout ?? "").replace(ANSI, "");
  const stderr = (proc.stderr ?? "").replace(ANSI, "");

  return {
    output: stdout + stderr,
    stdout,
    stderr,
    code: proc.status ?? -1,
    timedOut: proc.signal === "SIGKILL",
  };
}

/**
 * Run the CLI against the fixture config, returning decoloured output.
 * Cached by argv; a `--sync` case may hit the 4s timeout, which is a
 * normal outcome, not a failure — see `CliCase.fails`.
 *
 * @param args Arguments after the binary name
 */
export function runCli(...args: string[]): CliResult {
  const key = JSON.stringify(args);
  const hit = cache.get(key);
  if (hit) return hit;

  const result = spawnCli(args, { REMOTE_CLI_CONFIG_DIR: FIXTURE_DIR, NO_COLOR: "1" }, 4000);

  cache.set(key, result);
  return result;
}

/**
 * Run the CLI for a live-transfer case: uncached, caller-set timeout.
 *
 * Never cached — a real transfer has side effects, unlike a --dry-run echo.
 *
 * @param knownHostsPath Throwaway known_hosts; the real one must never be written
 * @param timeoutMs Wall-clock budget for the whole run
 * @param args Arguments after the binary name
 */
export function runCliLive(
  knownHostsPath: string,
  timeoutMs: number,
  ...args: string[]
): CliResult {
  return spawnCli(
    args,
    { REMOTE_CLI_CONFIG_DIR: FIXTURE_DIR, REMOTE_CLI_KNOWN_HOSTS: knownHostsPath, NO_COLOR: "1" },
    timeoutMs
  );
}

export interface CliCase {
  /** What the case proves, used as the test name. */
  name: string;
  args: string[];
  /** Substrings that must appear in the output. */
  expect?: string[];
  /** Substrings that must NOT appear. */
  reject?: string[];
  /** Require a non-zero exit. Omit for cases a network stall may interrupt. */
  fails?: true;
}
