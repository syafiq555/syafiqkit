import { existsSync, readFileSync } from "fs";
import { z } from "zod";
import { ConfigSchema, SecretsSchema, type Config, type Secrets } from "../types.ts";
import { ConfigNotFoundError, ConfigValidationError } from "../errors.ts";
import { ensureSecurePermissions } from "../utils/index.ts";
import { CONFIG_PATH, SECRETS_PATH } from "./paths.ts";

/**
 * Format Zod validation errors into readable messages
 */
function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `  - ${path}${issue.message}`;
  });
}

/**
 * Load and validate servers.json
 * @throws ConfigNotFoundError if file doesn't exist
 * @throws ConfigValidationError if validation fails
 */
export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) {
    throw new ConfigNotFoundError(CONFIG_PATH);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch (err) {
    throw new ConfigValidationError("Failed to parse servers.json", [
      `  - ${(err as Error).message}`,
    ]);
  }

  const result = ConfigSchema.safeParse(raw);

  if (!result.success) {
    throw new ConfigValidationError(
      "Invalid configuration in servers.json",
      formatZodErrors(result.error)
    );
  }

  return result.data;
}

/**
 * Load and validate secrets.json
 * Returns empty object if file doesn't exist
 * @throws ConfigValidationError if file exists but validation fails
 */
export function loadSecrets(): Secrets {
  if (!existsSync(SECRETS_PATH)) {
    return {};
  }

  ensureSecurePermissions(SECRETS_PATH);

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(SECRETS_PATH, "utf-8"));
  } catch (err) {
    throw new ConfigValidationError("Failed to parse secrets.json", [
      `  - ${(err as Error).message}`,
    ]);
  }

  const result = SecretsSchema.safeParse(raw);

  if (!result.success) {
    throw new ConfigValidationError(
      "Invalid secrets.json - all values must be strings",
      formatZodErrors(result.error)
    );
  }

  return result.data;
}
