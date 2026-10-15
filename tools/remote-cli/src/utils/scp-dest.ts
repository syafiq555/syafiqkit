import { statSync } from "fs";
import { isAbsolute } from "path";
import { LocalPathError } from "../errors.ts";
import { validatePath } from "./path.ts";

/**
 * Resolve the remote destination path for an upload.
 *
 * @param localPath Local source path, absolute or cwd-relative
 * @param to Explicit remote destination: relative to appPath, or absolute
 * @param appPath Server's configured application path
 * @returns Absolute remote path
 * @throws LocalPathError when an absolute localPath is given without `to`
 */
export function resolveDestination(
  localPath: string,
  to: string | undefined,
  appPath: string
): string {
  if (to !== undefined) {
    validatePath(to, "to");
    return isAbsolute(to) ? to : `${appPath}/${to}`;
  }

  if (isAbsolute(localPath)) {
    throw new LocalPathError(
      localPath,
      "Absolute local path needs --to (e.g. --to releases/app.tar.gz)"
    );
  }

  const relativePath = localPath.replace(/^\.\.?\//, "");
  validatePath(relativePath, "localPath");
  return `${appPath}/${relativePath}`;
}

const UNITS = ["B", "KB", "MB", "GB", "TB"];

/**
 * Format a byte count for display.
 */
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }

  const rounded = unit === 0 ? value.toString() : value.toFixed(1);
  return `${rounded} ${UNITS[unit]}`;
}

/** Local file size for the completion line; falls back on an unreadable source. */
export function sentSize(absLocalPath: string): string {
  try {
    return formatBytes(statSync(absLocalPath).size);
  } catch {
    return "file";
  }
}
