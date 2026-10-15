import { homedir } from "os";
import { PathValidationError } from "../errors.ts";

const IS_WINDOWS = process.platform === "win32";

/**
 * Expand ~ to home directory in paths
 */
export function expandPath(path: string): string {
  return path.replace(/^~/, homedir());
}

/**
 * Validate path contains only safe characters (prevents command injection)
 * Also rejects path traversal sequences (..)
 * @throws PathValidationError if path contains unsafe characters or traversal
 */
export function validatePath(path: string, fieldName: string): string {
  // Reject path traversal sequences
  if (path.includes("..")) {
    throw new PathValidationError(path, fieldName);
  }
  // Allow ~ for home directory expansion on remote servers
  if (!/^[a-zA-Z0-9\/_\-\.~]+$/.test(path)) {
    throw new PathValidationError(path, fieldName);
  }
  return path;
}

/**
 * Check if path contains shell-unsafe characters
 */
export function hasUnsafeShellChars(path: string): boolean {
  return /["'`$]/.test(path);
}

/**
 * Convert Windows path to POSIX style for MSYS2/Git Bash tools (rsync, scp)
 * Example: C:\Users\foo -> /c/Users/foo
 */
export function toPosixPath(windowsPath: string): string {
  if (!IS_WINDOWS) return windowsPath;
  return windowsPath
    .replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`)
    .replace(/\\/g, "/");
}
