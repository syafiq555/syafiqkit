import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { runCli, writeFixtureConfig, REPO_ROOT, type CliCase } from "./helpers.ts";

const WORK = join(tmpdir(), "remote-cli-tests");
const FILE = join(WORK, "payload.txt");
const DIR = join(WORK, "bundle");

beforeAll(() => {
  writeFixtureConfig();
  mkdirSync(join(DIR, "sub"), { recursive: true });
  writeFileSync(FILE, "payload\n");
  writeFileSync(join(DIR, "a.txt"), "a\n");
});

afterAll(() => rmSync(WORK, { recursive: true, force: true }));

/** Register a table of cases as individual tests. */
function runCases(cases: CliCase[]): void {
  for (const c of cases) {
    test(c.name, () => {
      const { output, code } = runCli(...c.args);

      for (const needle of c.expect ?? []) expect(output).toContain(needle);
      for (const needle of c.reject ?? []) expect(output).not.toContain(needle);
      if (c.fails) expect(code).not.toBe(0);
    });
  }
}

describe("destination resolution", () => {
  runCases([
    {
      name: "relative path mirrors its structure under appPath",
      args: ["--scp", "testbox", "./package.json", "--dry-run"],
      expect: ["deploy@192.0.2.1:/var/www/app", "-> /var/www/app/package.json"],
    },
    {
      name: "relative path with --to overrides the mirrored path",
      args: ["--scp", "testbox", "./package.json", "--to", "dist/p.json", "--dry-run"],
      expect: ["-> /var/www/app/dist/p.json"],
      reject: ["/var/www/app/package.json"],
    },
    {
      name: "absolute --to is used verbatim, ignoring appPath",
      args: ["--scp", "testbox", "./package.json", "--to", "/opt/drop/p.json", "--dry-run"],
      expect: ["-> /opt/drop/p.json"],
    },
    {
      name: "absolute local path with relative --to lands under appPath",
      args: ["--scp", "testbox", FILE, "--to", "releases/payload.txt", "--dry-run"],
      expect: ["-> /var/www/app/releases/payload.txt"],
    },
    {
      name: "absolute local path without --to is rejected, naming the flag",
      args: ["--scp", "testbox", FILE, "--dry-run"],
      expect: ["Absolute local path needs --to"],
      fails: true,
    },
    {
      name: "--to rejects path traversal",
      args: ["--scp", "testbox", "./package.json", "--to", "/opt/../etc/passwd", "--dry-run"],
      expect: ["unsafe characters"],
      fails: true,
    },
  ]);
});

describe("flag validation", () => {
  runCases([
    {
      name: "an unknown long flag is rejected by name",
      args: ["--scp", "testbox", "./package.json", "--bogus", "--dry-run"],
      expect: ["Unknown flag: --bogus"],
      fails: true,
    },
    {
      name: "an unknown short flag is rejected by name",
      args: ["--scp", "testbox", "./package.json", "-x", "--dry-run"],
      expect: ["Unknown flag: -x"],
      fails: true,
    },
    {
      name: "--to with no value errors instead of consuming the next flag",
      args: ["--scp", "testbox", "./package.json", "--to", "--dry-run"],
      expect: ["--to requires a value"],
      fails: true,
    },
    {
      name: "--to does not swallow a flag belonging to another command",
      args: ["--scp", "testbox", "./package.json", "--to", "--exclude", "--dry-run"],
      expect: ["--to requires a value"],
      fails: true,
    },
    {
      name: "--exclude with no value errors",
      args: ["--sync", "testbox", "./src", "--exclude", "--dry-run"],
      expect: ["--exclude requires a value"],
      fails: true,
    },
    {
      name: "--flags accepts a dash-leading value",
      args: ["--sync", "testbox", "./src", "--flags", "-avz --progress", "--dry-run"],
      expect: ["rsync -avz --progress"],
      reject: ["requires a value"],
    },
    {
      name: "--exclude is repeatable",
      args: ["--sync", "testbox", "./src", "--exclude", "*.log", "--exclude", "*.tmp", "--dry-run"],
      expect: ["--exclude *.log", "--exclude *.tmp"],
    },
  ]);
});

describe("--scp construction", () => {
  runCases([
    {
      name: "passes keepalive, connect-timeout and host-key options",
      args: ["--scp", "testbox", "./package.json", "--dry-run"],
      expect: [
        "-o StrictHostKeyChecking=accept-new",
        "-o ConnectTimeout=30",
        "-o ServerAliveInterval=15",
        "-o ServerAliveCountMax=4",
      ],
    },
    {
      name: "adds -p for a non-default port",
      args: ["--scp", "altbox", "./package.json", "--dry-run"],
      expect: ["-p 2222"],
    },
    {
      // -P is scp's spelling and can never appear: rsync carries the port as -p.
      name: "omits the port option for the default port",
      args: ["--scp", "testbox", "./package.json", "--dry-run"],
      expect: ["-o StrictHostKeyChecking"],
      reject: ["-p 2222", "-p 22 "],
    },
    {
      name: "a directory is accepted and its contents sent, not nested",
      args: ["--scp", "testbox", DIR, "--to", "releases/bundle", "--dry-run"],
      expect: [`${DIR}/ `, "@192.0.2.1:/var/www/app/releases/bundle"],
    },
    {
      name: "a missing file is refused",
      args: ["--scp", "testbox", "./no-such-file.txt", "--dry-run"],
      expect: ["does not exist"],
      fails: true,
    },
    {
      name: "dry-run reports no transfer",
      args: ["--scp", "testbox", "./package.json", "--dry-run"],
      expect: ["DRY RUN"],
      reject: ["Sent "],
    },
    {
      name: "an explicit destination creates the remote parent via --rsync-path",
      args: ["--scp", "testbox", "./package.json", "--to", "deep/nest/p.json", "--dry-run"],
      expect: ['--rsync-path=mkdir -p "/var/www/app/deep/nest" && rsync'],
    },
    {
      name: "a directory destination creates the destination itself, not its parent",
      args: ["--scp", "testbox", DIR, "--to", "releases/bundle", "--dry-run"],
      expect: ['--rsync-path=mkdir -p "/var/www/app/releases/bundle" && rsync'],
    },
    {
      name: "a mirrored destination adds no mkdir chain",
      args: ["--scp", "testbox", "./package.json", "--dry-run"],
      reject: ["--rsync-path"],
    },
  ]);
});

describe("rsync command construction", () => {
  runCases([
    {
      name: "a relative source keeps --relative and the '.' marker",
      args: ["--sync", "testbox", "./src", "--dry-run"],
      expect: ["rsync -avzR", `${REPO_ROOT}/./src`, "@192.0.2.1:/var/www/app"],
    },
    {
      name: "an explicit destination drops the fused R from -avzR",
      args: ["--sync", "testbox", DIR, "--to", "releases/bundle", "--dry-run"],
      expect: ["rsync -avz "],
      reject: ["-avzR"],
    },
    {
      name: "a directory source gets a trailing slash so contents are not nested",
      args: ["--sync", "testbox", DIR, "--to", "releases/bundle", "--dry-run"],
      expect: [`${DIR}/ `, "@192.0.2.1:/var/www/app/releases/bundle"],
    },
    {
      name: "a file source gets no trailing slash",
      args: ["--sync", "testbox", FILE, "--to", "releases/payload.txt", "--dry-run"],
      expect: [`${FILE} `],
      reject: [`${FILE}/`],
    },
    {
      name: "absolute source without --to is rejected",
      args: ["--sync", "testbox", DIR, "--dry-run"],
      expect: ["Absolute local path needs --to"],
      fails: true,
    },
  ]);
});

describe("failure reporting", () => {
  runCases([
    {
      name: "a real transfer never reports a stack trace or the deleted mkdir stage",
      args: ["--scp", "testbox", "./package.json", "--to", "/tmp/x.txt"],
      reject: [
        "Unexpected error",
        "at loadAndEvaluateModule",
        "Failed to create remote directory",
        "Sent ",
      ],
    },
    {
      name: "a spawned ssh is given a connect deadline, so an unreachable host cannot stall forever",
      args: ["--scp", "testbox", "./package.json", "--to", "/tmp/x.txt"],
      expect: ["-o ConnectTimeout=30"],
    },
  ]);
});

// Asserts on stdout/stderr separately. The merged `output` field cannot tell
// these apart, so a case written against it passes whichever stream the banner
// uses — which is how the banner sat on stdout undetected.
describe("stream separation", () => {
  test("the banner goes to stderr, never stdout", () => {
    const { stdout, stderr } = runCli("--scp", "testbox", "./package.json", "--dry-run");

    expect(stderr).toContain("[Test Box]");
    expect(stderr).toContain("DRY RUN");
    expect(stdout).not.toContain("[Test Box]");
    expect(stdout).not.toContain("DRY RUN");
  });

  test("--dry-run keeps `Would run:` on stdout as its primary output", () => {
    const { stdout } = runCli("--scp", "testbox", "./package.json", "--dry-run");

    expect(stdout).toContain("Would run:");
    expect(stdout).toContain("rsync");
  });

  test("an error and its hint share stderr, leaving stdout empty", () => {
    const { stdout, stderr, code } = runCli(
      "--scp",
      "nope-no-such-server",
      "./package.json",
      "--dry-run"
    );

    expect(stderr).toContain("not found");
    expect(stdout.trim()).toBe("");
    expect(code).not.toBe(0);
  });

  test("--list stays on stdout: it is the command's own output, not decoration", () => {
    const { stdout } = runCli("--list");

    expect(stdout).toContain("testbox");
  });
});

describe("server matching", () => {
  runCases([
    {
      name: "matches by tag",
      args: ["--scp", "alt", "./package.json", "--dry-run"],
      expect: ["/srv/alt"],
    },
    {
      name: "an unmatched server is refused",
      args: ["--scp", "nope-no-such-server", "./package.json", "--dry-run"],
      expect: ["not found"],
      fails: true,
    },
  ]);
});
