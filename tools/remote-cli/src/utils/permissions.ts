import { statSync, chmodSync } from "fs";
import { colors } from "./colors.ts";

/**
 * Check and fix file permissions for sensitive files (Unix only)
 * Ensures file has 0600 permissions (owner read/write only)
 */
export function ensureSecurePermissions(filePath: string): void {
  if (process.platform === "win32") return;

  try {
    const stats = statSync(filePath);
    const mode = stats.mode & 0o777;
    if (mode !== 0o600) {
      console.warn(
        `${colors.yellow}Warning:${colors.reset} ${filePath} has insecure permissions ` +
          `(${mode.toString(8)}). Fixing to 0600...`
      );
      chmodSync(filePath, 0o600);
    }
  } catch {
    // File might not exist yet
  }
}
