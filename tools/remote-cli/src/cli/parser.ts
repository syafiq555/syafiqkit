import type { CLICommand } from "../types.ts";
import { UnknownFlagError, MissingFlagValueError } from "../errors.ts";

const VALUE_FLAGS = new Map([
  ["--to", "releases/app.tar.gz"],
  ["--exclude", "*.log"],
  ["--flags", '"-avz --progress"'],
]);
const SYNC_FLAGS = new Set(["--dry-run", "-n", "--to", "--exclude", "--flags"]);
const GET_FLAGS = new Set(["--dry-run", "-n", "--to"]);
const ALL_FLAGS = new Set(SYNC_FLAGS);

/**
 * True when a value slot is absent or holds a known flag.
 *
 * `--to --exclude` is a forgotten value, not a destination named "--exclude".
 */
function isMissingValue(value: string | undefined): boolean {
  return value === undefined || ALL_FLAGS.has(value);
}

/**
 * Read a value flag's argument.
 *
 * @throws MissingFlagValueError when the flag is last or followed by another flag
 */
function readFlagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;

  const value = args[index + 1];
  if (isMissingValue(value)) {
    throw new MissingFlagValueError(flag, VALUE_FLAGS.get(flag)!);
  }

  return value;
}

/**
 * Reject any flag outside the command's known set.
 *
 * @param args Full argv slice
 * @param startIndex Index of the command flag itself (--scp/--sync)
 * @param known Flag tokens this command accepts
 * @throws UnknownFlagError on the first unrecognised flag
 */
function rejectUnknownFlags(args: string[], startIndex: number, known: Set<string>): void {
  const masked = new Set<number>([startIndex, startIndex + 1, startIndex + 2]);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (!known.has(arg)) continue;
    masked.add(i);
    if (VALUE_FLAGS.has(arg) && !isMissingValue(args[i + 1])) masked.add(i + 1);
  }

  for (let i = 0; i < args.length; i++) {
    if (!masked.has(i) && args[i]!.startsWith("-")) {
      throw new UnknownFlagError(args[i]!);
    }
  }
}

export function parseArgs(args: string[]): CLICommand {
  if (args.includes("--help") || args.includes("-h")) {
    return { type: "help" };
  }

  if (args.includes("--list") || args.includes("-l")) {
    return { type: "list" };
  }

  if (args.includes("--edit") || args.includes("-e")) {
    return { type: "edit" };
  }

  const syncIndex = args.indexOf("--sync");
  if (syncIndex !== -1) {
    return parseSyncArgs(args, syncIndex);
  }

  const scpIndex = args.indexOf("--scp");
  if (scpIndex !== -1) {
    return parseSyncArgs(args, scpIndex, true);
  }

  const getIndex = args.indexOf("--get");
  if (getIndex !== -1) {
    return parseGetArgs(args, getIndex);
  }

  if (args.length === 0) {
    return { type: "interactive" };
  }

  const firstArg = args[0];
  if (!firstArg || firstArg.startsWith("-")) {
    return { type: "help" };
  }

  if (args.length === 1) {
    return { type: "server-only", server: firstArg };
  }

  return {
    type: "execute",
    server: firstArg,
    command: args.slice(1).join(" "),
  };
}

/**
 * Parse the shared upload command. `--scp` is an alias differing only in
 * reporting the byte count on success.
 *
 * @param syncIndex Index of the command flag itself (--sync/--scp)
 * @param singleFile True for the --scp spelling
 */
function parseSyncArgs(args: string[], syncIndex: number, singleFile = false): CLICommand {
  const server = args[syncIndex + 1];
  const localPath = args[syncIndex + 2];

  if (!server || !localPath || server.startsWith("-") || localPath.startsWith("-")) {
    return { type: "help" };
  }

  const to = readFlagValue(args, "--to");
  const rsyncFlags = readFlagValue(args, "--flags");
  rejectUnknownFlags(args, syncIndex, SYNC_FLAGS);

  const dryRun = args.includes("--dry-run") || args.includes("-n");

  const excludes: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== "--exclude") continue;
    const value = args[i + 1];
    if (isMissingValue(value)) {
      throw new MissingFlagValueError("--exclude", VALUE_FLAGS.get("--exclude")!);
    }
    excludes.push(value!);
  }

  return { type: "sync", server, localPath, dryRun, excludes, rsyncFlags, to, singleFile };
}

/**
 * Parse the download command: `--get <server> <remote-path> [--to <local-path>]`.
 *
 * @param getIndex Index of the --get flag itself
 */
function parseGetArgs(args: string[], getIndex: number): CLICommand {
  const server = args[getIndex + 1];
  const remotePath = args[getIndex + 2];

  if (!server || !remotePath || server.startsWith("-") || remotePath.startsWith("-")) {
    return { type: "help" };
  }

  const to = readFlagValue(args, "--to");
  rejectUnknownFlags(args, getIndex, GET_FLAGS);
  const dryRun = args.includes("--dry-run") || args.includes("-n");

  return { type: "get", server, remotePath, to, dryRun };
}
