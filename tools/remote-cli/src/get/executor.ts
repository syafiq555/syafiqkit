import { Client, type SFTPWrapper } from "ssh2";
import { existsSync, renameSync, rmSync, statSync } from "fs";
import { basename, isAbsolute, join, resolve } from "path";
import type { ConnectionInfo } from "../types.ts";
import { colors, formatBytes, validatePath } from "../utils/index.ts";
import { SSHConnectionError } from "../errors.ts";
import { dial } from "../ssh/dial.ts";

export interface GetOptions {
  remotePath: string;
  to?: string;
  dryRun: boolean;
}

/**
 * Resolve the remote source to the path the SFTP server expects.
 *
 * Absolute paths pass through; `~/x` and paths relative to an appPath under
 * `~` become home-relative, which is how SFTP resolves a path without a
 * leading slash.
 *
 * @throws PathValidationError on unsafe characters or traversal
 */
export function resolveSource(remotePath: string, appPath: string): string {
  validatePath(remotePath, "remotePath");
  const joined = isAbsolute(remotePath) || remotePath.startsWith("~")
    ? remotePath
    : `${appPath}/${remotePath}`;
  return joined.replace(/^~\/?/, "") || ".";
}

/**
 * Resolve the local target: `to` when given (a directory receives the remote
 * file's name), else the remote file's name in the current directory.
 */
export function resolveTarget(remotePath: string, to: string | undefined): string {
  const name = basename(remotePath);
  if (to === undefined) return resolve(process.cwd(), name);

  const target = resolve(process.cwd(), to);
  return existsSync(target) && statSync(target).isDirectory() ? join(target, name) : target;
}

function openSftp(connInfo: ConnectionInfo): Promise<{ conn: Client; sftp: SFTPWrapper }> {
  return new Promise((resolvePromise, reject) => {
    const conn = new Client();
    conn.on("ready", () => {
      conn.sftp((err, sftp) => (err ? reject(err) : resolvePromise({ conn, sftp })));
    });
    conn.on("error", reject);
    conn.on("timeout", () => reject(new SSHConnectionError("Connection timed out")));
    dial(conn, connInfo);
  });
}

function remoteSize(sftp: SFTPWrapper, path: string): Promise<number> {
  return new Promise((resolvePromise, reject) => {
    sftp.stat(path, (err, stats) => {
      if (err) return reject(err);
      if (!stats.isFile()) return reject(new Error(`${path} is not a regular file`));
      resolvePromise(stats.size);
    });
  });
}

function fastGet(sftp: SFTPWrapper, from: string, to: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    sftp.fastGet(from, to, (err) => (err ? reject(err) : resolvePromise()));
  });
}

/**
 * Download one file over SFTP, writing to `<target>.part` and renaming only
 * once the byte count matches the remote file.
 *
 * Decoration goes to stderr; stdout carries only the local path written.
 *
 * @returns Exit code (0 = success)
 */
export async function executeGet(
  connInfo: ConnectionInfo,
  options: GetOptions,
  serverName: string
): Promise<number> {
  const source = resolveSource(options.remotePath, connInfo.appPath);
  const target = resolveTarget(options.remotePath, options.to);

  console.error(
    `\n${colors.cyan}[${serverName}]${colors.reset} ${options.dryRun ? "DRY RUN" : "Downloading"}: ${source} -> ${target}`
  );
  console.error(`${colors.dim}${"─".repeat(60)}${colors.reset}`);

  if (options.dryRun) {
    console.log(`${colors.dim}Would fetch: sftp ${connInfo.config.username}@${connInfo.config.host}:${source} -> ${target}${colors.reset}`);
    return 0;
  }

  const partial = `${target}.part`;
  let conn: Client | undefined;

  try {
    const opened = await openSftp(connInfo);
    conn = opened.conn;
    const expected = await remoteSize(opened.sftp, source);
    await fastGet(opened.sftp, source, partial);

    const received = statSync(partial).size;
    if (received !== expected) {
      rmSync(partial, { force: true });
      console.error(`${colors.red}Error:${colors.reset} received ${received} bytes, remote file is ${expected}`);
      return 1;
    }

    renameSync(partial, target);
    console.error(`${colors.green}Done:${colors.reset} ${formatBytes(received)}`);
    console.log(target);
    return 0;
  } catch (err) {
    rmSync(partial, { force: true });
    console.error(`${colors.red}Error:${colors.reset} ${(err as Error).message}`);
    return 1;
  } finally {
    conn?.end();
  }
}
