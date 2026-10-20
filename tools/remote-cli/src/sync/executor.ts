import { spawn } from "child_process";
import { existsSync, statSync } from "fs";
import { dirname, isAbsolute, resolve } from "path";
import type { ConnectionInfo, JumpHost } from "../types.ts";
import {
  colors,
  validatePath,
  hasUnsafeShellChars,
  toPosixPath,
  resolveDestination,
  sentSize,
  SSH_KEEPALIVE_INTERVAL_SEC,
  SSH_KEEPALIVE_COUNT_MAX,
  hostKeyOptionsString,
} from "../utils/index.ts";
import { RsyncError, LocalPathError, PathValidationError } from "../errors.ts";

const DEFAULT_RSYNC_FLAGS = "-avzR --progress";
const DEFAULT_EXCLUDES = [".git", "node_modules", "vendor", ".env", ".DS_Store"];

export interface SyncOptions {
  localPath: string;
  dryRun: boolean;
  excludes: string[];
  rsyncFlags?: string;
  to?: string;
  /** Set by the --scp route: report the byte count on success. */
  singleFile?: boolean;
}

export async function executeSync(
  connInfo: ConnectionInfo,
  options: SyncOptions,
  serverName: string
): Promise<number> {
  // Defense-in-depth: validate all paths at point of use
  validatePath(connInfo.appPath, "appPath");
  validateKeyPath(connInfo.keyPath);
  validateLocalPath(options.localPath);

  const remotePath = resolveDestination(options.localPath, options.to, connInfo.appPath);
  const absLocalPath = resolve(process.cwd(), options.localPath);
  const dirSource = isDirectory(absLocalPath);
  const sshCommand = buildSSHCommand(connInfo);
  const rsyncArgs = buildRsyncArgs(connInfo, options, sshCommand, { remotePath, absLocalPath, dirSource });

  const action = options.dryRun ? "DRY RUN" : "Syncing";
  // Decoration to stderr, keeping stdout clean for piping. The `Would run:`
  // line below is the deliberate exception — it is this command's primary
  // output and the offline tests' assertion target.
  console.error(
    `\n${colors.cyan}[${serverName}]${colors.reset} ${action}: ${options.localPath} -> ${remotePath}`
  );
  console.error(`${colors.dim}${"─".repeat(60)}${colors.reset}`);

  const cmd = connInfo.config.password ? "sshpass -e rsync" : "rsync";

  if (options.dryRun) {
    console.log(`${colors.dim}Would run: ${cmd} ${rsyncArgs.join(" ")}${colors.reset}\n`);
    return 0;
  }

  const exitCode = connInfo.config.password
    ? await spawnRsync("sshpass", ["-e", "rsync", ...rsyncArgs], connInfo.config.password)
    : await spawnRsync("rsync", rsyncArgs);

  if (exitCode === 0) {
    const dest = `${connInfo.config.username}@${connInfo.config.host}:${remotePath}`;
    const size = options.singleFile && !dirSource ? ` (${sentSize(absLocalPath)})` : "";
    console.error(`${colors.green}Sent${colors.reset} ${options.localPath}${size} -> ${dest}`);
  }

  return exitCode;
}

function validateKeyPath(keyPath: string | undefined): void {
  if (keyPath && hasUnsafeShellChars(keyPath)) {
    throw new RsyncError(
      "SSH key path contains unsafe characters",
      "Key path cannot contain quotes or shell expansion characters"
    );
  }
}

function validateLocalPath(localPath: string): void {
  if (hasUnsafeShellChars(localPath)) {
    throw new LocalPathError(localPath, "Path cannot contain quotes or shell expansion characters");
  }

  const resolved = resolve(process.cwd(), localPath);
  if (!existsSync(resolved)) {
    throw new LocalPathError(localPath, "Path does not exist");
  }
}

function sshBaseParts(keyPath: string | undefined, port: number): string[] {
  const parts = ["ssh"];

  if (keyPath) {
    parts.push(`-i "${toPosixPath(keyPath)}"`);
  }
  if (port !== 22) {
    parts.push(`-p ${port}`);
  }
  parts.push(hostKeyOptionsString());
  return parts;
}

function buildSSHCommand(connInfo: ConnectionInfo): string {
  const parts = sshBaseParts(connInfo.keyPath, connInfo.config.port);
  parts.push(`-o ServerAliveInterval=${SSH_KEEPALIVE_INTERVAL_SEC}`);
  parts.push(`-o ServerAliveCountMax=${SSH_KEEPALIVE_COUNT_MAX}`);
  if (connInfo.jump) {
    parts.push(`-o 'ProxyCommand=${buildJumpCommand(connInfo.jump)}'`);
  }

  return parts.join(" ");
}

function buildJumpCommand(jump: JumpHost): string {
  for (const field of [jump.keyPath ?? "", jump.config.host, jump.config.username]) {
    if (hasUnsafeShellChars(field)) throw new PathValidationError(field, "Jump host setting");
  }
  for (const field of [jump.config.host, jump.config.username]) {
    if (!/^[\w.@:\[\]-]+$/.test(field) || field.startsWith("-")) {
      throw new PathValidationError(field, "Jump host or user");
    }
  }

  const parts = sshBaseParts(jump.keyPath, jump.config.port);
  parts.push("-o IdentitiesOnly=yes");
  parts.push("-W %h:%p");
  parts.push(`${jump.config.username}@${jump.config.host}`);
  return parts.join(" ");
}

interface Destination {
  remotePath: string;
  absLocalPath: string;
  dirSource: boolean;
}

function buildRsyncArgs(
  connInfo: ConnectionInfo,
  options: SyncOptions,
  sshCommand: string,
  destination: Destination
): string[] {
  const { remotePath, dirSource } = destination;
  const explicitDest = isAbsolute(options.localPath) || options.to !== undefined;
  const flags = options.rsyncFlags || DEFAULT_RSYNC_FLAGS;
  const args = flags
    .split(/\s+/)
    .filter(Boolean)
    .map((flag) => (explicitDest ? stripRelativeFlag(flag) : flag))
    .filter(Boolean);

  if (options.dryRun) {
    args.push("-n");
  }

  if (explicitDest) {
    args.push(buildMkdirChain(dirSource ? remotePath : dirname(remotePath)));
  }

  args.push("-e", sshCommand);

  for (const exclude of DEFAULT_EXCLUDES) {
    args.push("--exclude", exclude);
  }
  for (const exclude of options.excludes) {
    args.push("--exclude", exclude);
  }

  const { source, dest } = explicitDest
    ? buildExplicitPaths(connInfo, destination)
    : buildRelativePaths(connInfo, options);

  args.push(source, dest);

  return args;
}

/**
 * rsync's own remote command, prefixed with the mkdir that scp needed a
 * second connection for. macOS openrsync has no --mkpath.
 *
 * @param remoteDir Directory to create; the destination itself for a directory source
 */
function buildMkdirChain(remoteDir: string): string {
  if (hasUnsafeShellChars(remoteDir)) {
    throw new PathValidationError(remoteDir, "remote directory");
  }

  const expanded = remoteDir.replace(/^~(?=\/|$)/, "$HOME");
  return `--rsync-path=mkdir -p "${expanded}" && rsync`;
}

/** Drop --relative from a flag token (fused or standalone). */
function stripRelativeFlag(flag: string): string {
  if (flag === "--relative" || flag === "-R") return "";
  if (/^-[a-zA-Z]+$/.test(flag)) {
    const stripped = flag.replace(/R/g, "");
    return stripped === "-" ? "" : stripped;
  }
  return flag;
}

function isDirectory(absLocalPath: string): boolean {
  try {
    return statSync(absLocalPath).isDirectory();
  } catch {
    throw new LocalPathError(absLocalPath, "Path disappeared before the transfer started");
  }
}

function buildExplicitPaths(
  connInfo: ConnectionInfo,
  destination: Destination
): { source: string; dest: string } {
  const { remotePath, absLocalPath, dirSource } = destination;
  // Trailing slash: copies directory contents, not the directory itself.
  const suffix = dirSource ? "/" : "";

  return {
    source: `${toPosixPath(absLocalPath)}${suffix}`,
    dest: `${connInfo.config.username}@${connInfo.config.host}:${remotePath}`,
  };
}

function buildRelativePaths(
  connInfo: ConnectionInfo,
  options: SyncOptions
): { source: string; dest: string } {
  // rsync "." marker for --relative: /absolute/base/./relative/path
  const relativePart = options.localPath.replace(/^\.\.?\//, "");

  return {
    source: `${toPosixPath(process.cwd())}/./${relativePart}`,
    dest: `${connInfo.config.username}@${connInfo.config.host}:${connInfo.appPath}`,
  };
}

function spawnRsync(cmd: string, args: string[], password?: string): Promise<number> {
  return new Promise((resolve, reject) => {
    console.error(`${colors.dim}${cmd} ${args.join(" ")}${colors.reset}\n`);

    const proc = spawn(cmd, args, {
      stdio: "inherit",
      env: password ? { ...process.env, SSHPASS: password } : process.env,
    });

    proc.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code !== "ENOENT") {
        reject(new RsyncError(`${cmd} failed: ${err.message}`));
        return;
      }

      const hint = cmd === "sshpass"
        ? "Install sshpass: apt install sshpass (Linux) or brew install sshpass (macOS)"
        : "Install rsync or ensure it's in your PATH";
      reject(new RsyncError(`${cmd} command not found`, hint));
    });

    proc.on("close", (code: number | null, signal: NodeJS.Signals | null) => {
      if (code === null) {
        reject(new RsyncError(`rsync terminated by signal ${signal ?? "unknown"}`, "The transfer did not complete"));
        return;
      }
      resolve(code);
    });
  });
}
