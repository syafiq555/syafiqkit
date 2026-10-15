import { spawn, spawnSync, type ChildProcess } from "child_process";
import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const LIVE_DIR = join(TESTS_DIR, "fixtures", "live");
const SSHD_BIN = "/usr/sbin/sshd";
const CANDIDATE_PORTS = [22122, 22123, 22124];
const READY_TRIES = 20;
const READY_INTERVAL_MS = 100;

export interface LiveServer {
  /** Port the throwaway sshd listens on, loopback only. */
  port: number;
  /** Private key authorized for this sshd. */
  keyPath: string;
  /** Directory acting as the server's appPath. */
  remoteRoot: string;
  /** Local user the fixture authenticates as. */
  user: string;
  /** Throwaway known_hosts, so the real one is never written. */
  knownHostsPath: string;
}

export type LiveResult =
  | { ok: true; server: LiveServer }
  | { ok: false; reason: string };

let running: ChildProcess | undefined;

/** Decided at test-registration time, before beforeAll can boot anything. */
export function sshdAvailable(): boolean {
  return Boolean(process.env.USER) && existsSync(SSHD_BIN);
}

/**
 * Boot an unprivileged sshd on loopback for real-transfer tests.
 *
 * @returns The server's connection details, or why it is unavailable
 */
export function startLiveSshd(): LiveResult {
  const user = process.env.USER;
  if (!user) return { ok: false, reason: "USER is unset" };

  // spawn's ENOENT arrives async and cannot reach the sync poll loop below.
  if (!existsSync(SSHD_BIN)) return { ok: false, reason: `${SSHD_BIN} not present` };

  if (spawnSync(SSHD_BIN, ["-t", "-f", "/dev/null"], { stdio: "ignore" }).status === null) {
    return { ok: false, reason: `${SSHD_BIN} could not be executed` };
  }

  const keygen = prepareKeys();
  if (!keygen.ok) return keygen;

  const remoteRoot = join(LIVE_DIR, "remote");
  mkdirSync(remoteRoot, { recursive: true });

  for (const port of CANDIDATE_PORTS) {
    if (tryPort(port)) {
      return {
        ok: true,
        server: {
          port,
          keyPath: join(LIVE_DIR, "client_key"),
          remoteRoot,
          user,
          knownHostsPath: join(LIVE_DIR, "known_hosts"),
        },
      };
    }
  }

  return { ok: false, reason: `sshd did not accept connections on ${CANDIDATE_PORTS.join(", ")}` };
}

export function stopLiveSshd(): void {
  running?.kill("SIGTERM");
  running = undefined;
  rmSync(LIVE_DIR, { recursive: true, force: true });
}

/** Absolute path of a file inside the fixture server's appPath. */
export function remotePath(server: LiveServer, ...segments: string[]): string {
  return join(server.remoteRoot, ...segments);
}

export function readRemoteFile(server: LiveServer, ...segments: string[]): string {
  return readFileSync(remotePath(server, ...segments), "utf-8");
}

function prepareKeys(): LiveResult | { ok: true } {
  rmSync(LIVE_DIR, { recursive: true, force: true });
  mkdirSync(LIVE_DIR, { recursive: true });

  for (const name of ["host_key", "client_key"]) {
    const result = spawnSync("ssh-keygen", ["-t", "ed25519", "-N", "", "-q", "-f", join(LIVE_DIR, name)], {
      encoding: "utf-8",
    });
    if (result.error || result.status !== 0) {
      return { ok: false, reason: `ssh-keygen failed for ${name}: ${result.stderr ?? result.error?.message}` };
    }
  }

  const authorized = join(LIVE_DIR, "authorized_keys");
  writeFileSync(authorized, readFileSync(join(LIVE_DIR, "client_key.pub"), "utf-8"));
  chmodSync(authorized, 0o600);
  chmodSync(join(LIVE_DIR, "client_key"), 0o600);

  return { ok: true };
}

/**
 * StrictModes no is required: sshd otherwise refuses keys under a temp layout.
 */
function writeSshdConfig(port: number): string {
  const configPath = join(LIVE_DIR, "sshd_config");
  writeFileSync(
    configPath,
    [
      `Port ${port}`,
      "ListenAddress 127.0.0.1",
      `HostKey ${join(LIVE_DIR, "host_key")}`,
      `AuthorizedKeysFile ${join(LIVE_DIR, "authorized_keys")}`,
      `PidFile ${join(LIVE_DIR, "sshd.pid")}`,
      "PubkeyAuthentication yes",
      "PasswordAuthentication no",
      "UsePAM no",
      "StrictModes no",
      "LogLevel ERROR",
      "Subsystem sftp /usr/libexec/sftp-server",
      "",
    ].join("\n")
  );
  return configPath;
}

function tryPort(port: number): boolean {
  const configPath = writeSshdConfig(port);
  const proc = spawn(SSHD_BIN, ["-D", "-f", configPath, "-E", join(LIVE_DIR, "sshd.log")], {
    stdio: "ignore",
  });

  let failed = false;
  proc.on("error", () => {
    failed = true;
  });

  const ready = waitForPort(port, () => failed || proc.exitCode !== null);
  if (!ready) {
    proc.kill("SIGTERM");
    return false;
  }

  running = proc;
  return true;
}

function waitForPort(port: number, aborted: () => boolean): boolean {
  for (let attempt = 0; attempt < READY_TRIES; attempt++) {
    if (aborted()) return false;
    if (canConnect(port)) return true;
    sleepSync(READY_INTERVAL_MS);
  }
  return false;
}

function canConnect(port: number): boolean {
  const probe = spawnSync(
    process.execPath,
    [
      "-e",
      `const s=require("net").connect(${port},"127.0.0.1");s.on("connect",()=>{s.destroy();process.exit(0)});s.on("error",()=>process.exit(1));setTimeout(()=>process.exit(1),500);`,
    ],
    { stdio: "ignore" }
  );
  return probe.status === 0;
}

function sleepSync(ms: number): void {
  spawnSync(process.execPath, ["-e", `setTimeout(()=>{}, ${ms})`], { stdio: "ignore" });
}
