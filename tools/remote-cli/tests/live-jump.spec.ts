import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { runCliLiveWithHome, writeLiveFixtureConfig, REPO_ROOT, type CliResult } from "./helpers.ts";
import { startLiveSshd, stopLiveSshd, sshdAvailable, type LiveServer } from "./live-sshd.ts";

const LIVE_TIMEOUT_MS = 20000;
const WORK = join(tmpdir(), "remote-cli-live-jump");
const HOME = join(WORK, "home");
const FILE = join(WORK, "payload.txt");
const DEAD_PORT = 9;

let server: LiveServer | undefined;
let skipReason = "";

function writeSshConfig(s: LiveServer): void {
  mkdirSync(join(HOME, ".ssh"), { recursive: true });
  writeFileSync(
    join(HOME, ".ssh", "config"),
    [
      "Host livejump",
      "  HostName 127.0.0.1",
      `  Port ${s.port}`,
      `  User ${s.user}`,
      `  IdentityFile ${s.keyPath}`,
      "",
      "Host livetarget",
      "  HostName 127.0.0.1",
      `  Port ${s.port}`,
      `  User ${s.user}`,
      `  IdentityFile ${s.keyPath}`,
      "  ProxyJump livejump",
      "",
      "Host localhost",
      `  Port ${s.port}`,
      `  User ${s.user}`,
      `  IdentityFile ${s.keyPath}`,
      "",
      "Host baretarget",
      "  HostName 127.0.0.1",
      `  Port ${s.port}`,
      `  User ${s.user}`,
      `  IdentityFile ${s.keyPath}`,
      "  ProxyJump localhost",
      "",
      "Host deadjump",
      "  HostName 127.0.0.1",
      `  Port ${DEAD_PORT}`,
      `  User ${s.user}`,
      `  IdentityFile ${s.keyPath}`,
      "",
      "Host deadtarget",
      "  HostName 127.0.0.1",
      `  Port ${s.port}`,
      `  User ${s.user}`,
      `  IdentityFile ${s.keyPath}`,
      "  ProxyJump deadjump",
      "",
    ].join("\n")
  );
}

function addAliasServers(s: LiveServer): void {
  const configPath = join(REPO_ROOT, "tests", "fixtures", "servers.json");
  const config = JSON.parse(readFileSync(configPath, "utf-8"));
  config.servers.jumpbox = { name: "Jump Box", sshAlias: "livetarget", appPath: s.remoteRoot, tags: ["live"] };
  config.servers.barejumpbox = { name: "Bare Jump Box", sshAlias: "baretarget", appPath: s.remoteRoot, tags: ["live"] };
  config.servers.deadjumpbox ={ name: "Dead Jump Box", sshAlias: "deadtarget", appPath: s.remoteRoot, tags: ["live"] };
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

beforeAll(() => {
  mkdirSync(WORK, { recursive: true });
  writeFileSync(FILE, "jump-payload\n");

  const result = startLiveSshd();
  if (!result.ok) {
    skipReason = result.reason;
    console.log(`live jump tests skipped: ${result.reason}`);
    return;
  }

  server = result.server;
  writeLiveFixtureConfig("livebox", server);
  addAliasServers(server);
  writeSshConfig(server);
});

afterAll(() => {
  stopLiveSshd();
  rmSync(WORK, { recursive: true, force: true });
});

function live(name: string, body: (s: LiveServer, run: (...args: string[]) => CliResult) => void): void {
  const register = sshdAvailable() ? test : test.skip;

  register(name, () => {
    const s = server;
    if (!s) throw new Error(`live sshd unavailable: ${skipReason}`);
    body(s, (...args) => runCliLiveWithHome(HOME, s.knownHostsPath, LIVE_TIMEOUT_MS, ...args));
  });
}

describe("live ProxyJump", () => {
  live("a command runs on the target through the jump host", (_s, run) => {
    const { stdout, stderr, code } = run("jumpbox", "echo through-the-hop");

    expect(stdout.trim()).toBe("through-the-hop");
    expect(stderr).toContain("livetarget → livejump → 127.0.0.1");
    expect(code).toBe(0);
  });

  live("--get downloads through the jump host", (s, run) => {
    writeFileSync(join(s.remoteRoot, "fetch-me.txt"), "fetched\n");
    const target = join(WORK, "fetched.txt");

    const { code } = run("--get", "jumpbox", "fetch-me.txt", "--to", target);

    expect(code).toBe(0);
    expect(readFileSync(target, "utf-8")).toBe("fetched\n");
  });

  live("--scp uploads through the jump host", (s, run) => {
    const { code } = run("--scp", "jumpbox", FILE, "--to", "hopped/payload.txt");

    const landed = join(s.remoteRoot, "hopped", "payload.txt");
    expect(code).toBe(0);
    expect(existsSync(landed)).toBe(true);
    expect(readFileSync(landed, "utf-8")).toBe("jump-payload\n");
  });

  live("a dead jump host fails the command although the target itself is reachable", (_s, run) => {
    const { stdout, stderr, code } = run("deadjumpbox", "echo should-not-run");

    expect(stderr).toContain("Jump host 127.0.0.1");
    expect(stdout).not.toContain("should-not-run");
    expect(code).not.toBe(0);
  });

  live("a dead jump host fails a download too", (s, run) => {
    writeFileSync(join(s.remoteRoot, "unreached.txt"), "x\n");
    const target = join(WORK, "unreached.txt");

    const { stderr, code } = run("--get", "deadjumpbox", "unreached.txt", "--to", target);

    expect(code).not.toBe(0);
    expect(stderr).toContain("Jump host 127.0.0.1");
    expect(existsSync(target)).toBe(false);
  });

  live("a jump alias without HostName keeps its own user and key", (_s, run) => {
    const { stdout, code } = run("barejumpbox", "echo bare-hop");

    expect(stdout.trim()).toBe("bare-hop");
    expect(code).toBe(0);
  });

  live("a dead jump host fails an upload too", (_s, run) => {
    const { output, code } = run("--scp", "deadjumpbox", FILE, "--to", "never/payload.txt");

    expect(code).not.toBe(0);
    expect(output).toContain("Connection refused");
    expect(existsSync(join(_s.remoteRoot, "never", "payload.txt"))).toBe(false);
  });
});
