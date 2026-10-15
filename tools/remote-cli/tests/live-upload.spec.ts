import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";
import { runCliLive, writeLiveFixtureConfig, REPO_ROOT, type CliResult } from "./helpers.ts";
import { startLiveSshd, stopLiveSshd, sshdAvailable, type LiveServer } from "./live-sshd.ts";

const LIVE_TIMEOUT_MS = 20000;
const SERVER_ID = "livebox";
const WORK = join(tmpdir(), "remote-cli-live");
const FILE = join(WORK, "payload.txt");
const TREE = join(WORK, "bundle");

let server: LiveServer | undefined;
let skipReason = "";

beforeAll(() => {
  mkdirSync(join(TREE, "sub"), { recursive: true });
  writeFileSync(FILE, "live-payload\n");
  writeFileSync(join(TREE, "a.txt"), "a\n");
  writeFileSync(join(TREE, "sub", "b.txt"), "b\n");

  const result = startLiveSshd();
  if (!result.ok) {
    skipReason = result.reason;
    console.log(`live upload tests skipped: ${result.reason}`);
    return;
  }

  server = result.server;
  writeLiveFixtureConfig(SERVER_ID, server);
});

afterAll(() => {
  stopLiveSshd();
  rmSync(WORK, { recursive: true, force: true });
});

/** Reports as skipped, not passed, where no sshd is available. */
function live(name: string, body: (s: LiveServer, run: (...args: string[]) => CliResult) => void): void {
  const register = sshdAvailable() ? test : test.skip;

  register(name, () => {
    const s = server;
    if (!s) throw new Error(`live sshd unavailable: ${skipReason}`);
    body(s, (...args) => runCliLive(s.knownHostsPath, LIVE_TIMEOUT_MS, ...args));
  });
}

describe("live transfer", () => {
  live("a real single-file upload reports Sent and exits 0", (s, run) => {
    const { output, code } = run("--scp", SERVER_ID, "./package.json", "--to", "sent/package.json");

    expect(output).toContain("Sent ");
    expect(output).toContain(`${s.user}@127.0.0.1:${s.remoteRoot}/sent/package.json`);
    expect(code).toBe(0);
  });

  live("the uploaded bytes land at the resolved remote path", (s, run) => {
    run("--scp", SERVER_ID, FILE, "--to", "landed/payload.txt");

    const landed = join(s.remoteRoot, "landed", "payload.txt");
    expect(existsSync(landed)).toBe(true);
    expect(readFileSync(landed, "utf-8")).toBe("live-payload\n");
  });

  live("a not-yet-existent nested destination directory is created", (s, run) => {
    const { code } = run("--scp", SERVER_ID, FILE, "--to", "deep/deeper/deepest/payload.txt");

    expect(code).toBe(0);
    expect(existsSync(join(s.remoteRoot, "deep", "deeper", "deepest", "payload.txt"))).toBe(true);
  });

  live("--scp reports the byte count for a single file", (_s, run) => {
    const { output, code } = run("--scp", SERVER_ID, FILE, "--to", "sized/payload.txt");

    expect(code).toBe(0);
    expect(output).toMatch(/Sent .*\(13 B\)/);
  });

  live("--scp uploads a directory, its contents and nested children", (s, run) => {
    const { code } = run("--scp", SERVER_ID, TREE, "--to", "scpdir/bundle");

    expect(code).toBe(0);
    expect(readFileSync(join(s.remoteRoot, "scpdir", "bundle", "a.txt"), "utf-8")).toBe("a\n");
    expect(readFileSync(join(s.remoteRoot, "scpdir", "bundle", "sub", "b.txt"), "utf-8")).toBe("b\n");
  });

  live("a directory upload omits the byte count, which would be the inode size", (_s, run) => {
    const { output } = run("--scp", SERVER_ID, TREE, "--to", "nosize/bundle");

    expect(output).toContain("Sent");
    expect(output).not.toMatch(/Sent .*\([0-9.]+ [KMG]?B\)/);
  });

  live("--sync uploads a directory for real", (s, run) => {
    const { output, code } = run("--sync", SERVER_ID, TREE, "--to", "synced");

    expect(code).toBe(0);
    expect(output).toContain("Sent");
    expect(readFileSync(join(s.remoteRoot, "synced", "a.txt"), "utf-8")).toBe("a\n");
  });

  live("the real known_hosts is never written", (s, run) => {
    run("--scp", SERVER_ID, FILE, "--to", "kh/payload.txt");

    expect(readFileSync(s.knownHostsPath, "utf-8")).toContain(`:${s.port}`);
  });
});

/**
 * Captures raw bytes, bypassing runCliLive's ANSI stripping — the escape bytes
 * are the thing under test, so a decoloured view would hide the defect.
 */
function capture(s: LiveServer, command: string) {
  return spawnSync("bun", ["run", "index.ts", SERVER_ID, command], {
    cwd: REPO_ROOT,
    encoding: "buffer",
    env: {
      ...process.env,
      REMOTE_CLI_CONFIG_DIR: join(REPO_ROOT, "tests", "fixtures"),
      REMOTE_CLI_KNOWN_HOSTS: s.knownHostsPath,
    },
    timeout: LIVE_TIMEOUT_MS,
  });
}

// What `$(remote ...)` actually gets. The offline stream-separation cases prove
// the banner is on stderr; these prove a caller can capture and decode stdout.
describe("live stdout is a clean data channel", () => {
  live("captured stdout carries no ESC byte and equals the payload", (s) => {
    const { stdout, stderr } = capture(s, "echo PAYLOAD");

    expect(stdout.includes(0x1b)).toBe(false);
    expect(stdout.toString().trim()).toBe("PAYLOAD");
    // ...while the banner still reaches a human on stderr
    expect(stderr.toString()).toContain("Live Box");
  });

  live("a gzip round-trip through the pipe survives", (s) => {
    const { stdout } = capture(s, "printf hello-binary | gzip -c");
    const gunzipped = spawnSync("gunzip", { input: stdout, encoding: "buffer" });

    expect(gunzipped.status).toBe(0);
    expect(gunzipped.stdout.toString()).toBe("hello-binary");
  });
});

describe("live failure reporting", () => {
  live("an unwritable destination fails loudly instead of hanging", (s, run) => {
    const locked = join(s.remoteRoot, "locked");
    mkdirSync(locked, { recursive: true });
    chmodSync(locked, 0o500);

    const { output, code, timedOut } = run("--scp", SERVER_ID, FILE, "--to", "locked/sub/payload.txt");

    chmodSync(locked, 0o700);

    expect(timedOut).toBe(false);
    expect(code).not.toBe(0);
    expect(output).toMatch(/Permission denied|Failed to create remote directory/);
  });
});
