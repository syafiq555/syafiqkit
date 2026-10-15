import { existsSync, readFileSync } from "fs";
import type { Defaults, ServerConfig, Secrets, ConnectionInfo } from "../types.ts";
import { parseSSHConfig } from "./parser.ts";
import { expandPath, validatePath } from "../utils/index.ts";
import { SSHAliasNotFoundError, AuthenticationError, ConfigError } from "../errors.ts";

/**
 * Try to load SSH private key from path
 * @returns Buffer containing the key, or undefined if file doesn't exist
 */
function loadPrivateKey(keyPath: string | undefined): Buffer | undefined {
  if (!keyPath) return undefined;
  const expanded = expandPath(keyPath);
  return existsSync(expanded) ? readFileSync(expanded) : undefined;
}

/**
 * Build SSH connection info from server config
 * Resolves SSH alias or direct connection settings
 *
 * @throws SSHAliasNotFoundError if sshAlias is specified but not found
 * @throws AuthenticationError if no auth method is available
 * @throws ConfigError if server has neither sshAlias nor host
 * @throws PathValidationError if appPath contains unsafe characters
 */
export function buildConnection(
  serverId: string,
  server: ServerConfig,
  defaults: Defaults,
  secrets: Secrets
): ConnectionInfo {
  const password = secrets[serverId] || server.password;

  // Validate appPath early to prevent command injection
  validatePath(server.appPath, "appPath");

  let host: string;
  let port: number;
  let username: string;
  let keyPath: string | undefined;
  let displayHost: string;

  if (server.sshAlias) {
    const alias = parseSSHConfig(server.sshAlias);
    if (!alias) {
      throw new SSHAliasNotFoundError(server.sshAlias);
    }
    host = alias.host;
    port = alias.port || defaults.port;
    username = alias.user || defaults.user;
    keyPath = alias.keyPath || defaults.sshKey;
    displayHost = `${server.sshAlias} → ${alias.host}`;
  } else if (server.host) {
    host = server.host;
    port = server.port || defaults.port;
    username = server.user || defaults.user;
    keyPath = server.sshKey || defaults.sshKey;
    displayHost = server.host;
  } else {
    throw new ConfigError(
      "Server needs either 'sshAlias' or 'host'",
      "Check your servers.json configuration"
    );
  }

  const resolvedKeyPath = keyPath ? expandPath(keyPath) : undefined;
  const privateKey = loadPrivateKey(keyPath);

  if (!privateKey && !password) {
    throw new AuthenticationError();
  }

  return {
    config: { host, port, username, privateKey, password },
    displayHost,
    appPath: server.appPath,
    keyPath: resolvedKeyPath,
  };
}
