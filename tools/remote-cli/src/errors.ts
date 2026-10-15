/**
 * Base error class for all remote-cli errors
 * Provides structured error handling with codes and hints
 */
export class RemoteCliError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly hint?: string
  ) {
    super(message);
    this.name = "RemoteCliError";
  }
}

// ─────────────────────────────────────────────────────────────
// Config Errors
// ─────────────────────────────────────────────────────────────

export class ConfigError extends RemoteCliError {
  constructor(message: string, hint?: string) {
    super(message, "CONFIG_ERROR", hint);
    this.name = "ConfigError";
  }
}

export class ConfigNotFoundError extends ConfigError {
  constructor(path: string) {
    super(`Config not found at ${path}`, "Run 'remote --edit' to create it");
    this.name = "ConfigNotFoundError";
  }
}

export class ConfigValidationError extends ConfigError {
  constructor(
    message: string,
    public readonly issues: string[]
  ) {
    super(message, issues.join("\n"));
    this.name = "ConfigValidationError";
  }
}

// ─────────────────────────────────────────────────────────────
// SSH Errors
// ─────────────────────────────────────────────────────────────

export class SSHError extends RemoteCliError {
  constructor(message: string, hint?: string) {
    super(message, "SSH_ERROR", hint);
    this.name = "SSHError";
  }
}

export class SSHAliasNotFoundError extends SSHError {
  constructor(alias: string) {
    super(
      `SSH alias '${alias}' not found in ~/.ssh/config`,
      "Check your SSH config or use host/user directly"
    );
    this.name = "SSHAliasNotFoundError";
  }
}

export class SSHConnectionError extends SSHError {
  constructor(message: string) {
    super(message, "Check network connection and SSH credentials");
    this.name = "SSHConnectionError";
  }
}

export class AuthenticationError extends SSHError {
  constructor() {
    super(
      "No authentication method available",
      "Add sshKey, password, or configure SSH alias with key"
    );
    this.name = "AuthenticationError";
  }
}

// ─────────────────────────────────────────────────────────────
// Server Errors
// ─────────────────────────────────────────────────────────────

export class ServerNotFoundError extends RemoteCliError {
  constructor(query: string) {
    super(
      `Server not found: ${query}`,
      "SERVER_NOT_FOUND",
      "Run 'remote --list' to see available servers"
    );
    this.name = "ServerNotFoundError";
  }
}

// ─────────────────────────────────────────────────────────────
// Path Errors
// ─────────────────────────────────────────────────────────────

export class PathValidationError extends RemoteCliError {
  constructor(path: string, fieldName: string) {
    super(
      `${fieldName} contains unsafe characters: ${path}`,
      "PATH_VALIDATION_ERROR",
      "Only alphanumeric, /, _, -, ., ~ are allowed"
    );
    this.name = "PathValidationError";
  }
}

// ─────────────────────────────────────────────────────────────
// Rsync Errors
// ─────────────────────────────────────────────────────────────

export class RsyncError extends RemoteCliError {
  constructor(message: string, hint?: string) {
    super(message, "RSYNC_ERROR", hint);
    this.name = "RsyncError";
  }
}

export class LocalPathError extends RsyncError {
  constructor(path: string, reason: string) {
    super(`Invalid local path: ${path}`, reason);
    this.name = "LocalPathError";
  }
}

// ─────────────────────────────────────────────────────────────
// SCP Errors
// ─────────────────────────────────────────────────────────────

export class ScpError extends RemoteCliError {
  constructor(message: string, hint?: string) {
    super(message, "SCP_ERROR", hint);
    this.name = "ScpError";
  }
}

// ─────────────────────────────────────────────────────────────
// CLI Errors
// ─────────────────────────────────────────────────────────────

export class UnknownFlagError extends RemoteCliError {
  constructor(flag: string) {
    super(`Unknown flag: ${flag}`, "UNKNOWN_FLAG", "Run remote --help to see available options");
    this.name = "UnknownFlagError";
  }
}

export class MissingFlagValueError extends RemoteCliError {
  constructor(flag: string, example: string) {
    super(`${flag} requires a value`, "MISSING_FLAG_VALUE", `Example: ${flag} ${example}`);
    this.name = "MissingFlagValueError";
  }
}
