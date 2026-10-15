import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { runCli, writeFixtureConfig } from "./helpers.ts";
import { resolveSource, resolveTarget } from "../src/get/index.ts";

const WORK = join(tmpdir(), "remote-cli-get-tests");

beforeAll(() => {
  writeFixtureConfig();
  mkdirSync(WORK, { recursive: true });
});

afterAll(() => rmSync(WORK, { recursive: true, force: true }));

describe("remote source resolution", () => {
  test("relative path lands under appPath", () => {
    expect(resolveSource("storage/logs/laravel.log", "/var/www/app")).toBe("/var/www/app/storage/logs/laravel.log");
  });

  test("absolute path passes through", () => {
    expect(resolveSource("/tmp/dump.sql.gz", "/var/www/app")).toBe("/tmp/dump.sql.gz");
  });

  test("home path becomes SFTP home-relative", () => {
    expect(resolveSource("~/public_html/db.sql.gz", "/var/www/app")).toBe("public_html/db.sql.gz");
  });

  test("relative path under a ~ appPath becomes home-relative", () => {
    expect(resolveSource("db.sql.gz", "~/public_html")).toBe("public_html/db.sql.gz");
  });

  test("traversal is refused", () => {
    expect(() => resolveSource("../etc/passwd", "/var/www/app")).toThrow();
  });
});

describe("local target resolution", () => {
  test("defaults to the remote name in the current directory", () => {
    expect(resolveTarget("/tmp/dump.sql.gz", undefined)).toBe(join(process.cwd(), "dump.sql.gz"));
  });

  test("an existing directory receives the remote name", () => {
    expect(resolveTarget("/tmp/dump.sql.gz", WORK)).toBe(join(WORK, "dump.sql.gz"));
  });

  test("a file path is used as given", () => {
    expect(resolveTarget("/tmp/dump.sql.gz", join(WORK, "copy.gz"))).toBe(join(WORK, "copy.gz"));
  });
});

describe("--get command line", () => {
  test("dry run prints source and target without connecting", () => {
    const { output, code } = runCli("--get", "testbox", "storage/app.log", "--to", WORK, "--dry-run");
    expect(code).toBe(0);
    expect(output).toContain("deploy@192.0.2.1:/var/www/app/storage/app.log");
    expect(output).toContain(join(WORK, "app.log"));
  });

  test("unknown flag is rejected", () => {
    const { code, output } = runCli("--get", "testbox", "a.log", "--exclude", "x");
    expect(code).not.toBe(0);
    expect(output).toContain("--exclude");
  });

  test("missing remote path shows help", () => {
    const { output } = runCli("--get", "testbox");
    expect(output).toContain("USAGE");
  });
});
