import { existsSync, readFileSync } from "fs";
import type {
  Defaults,
  ServerConfig,
  Secrets,
  ConnectionInfo,
  JumpHost,
  SSHAliasConfig,
} from "../types.ts";
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

function applyAliasDefaults(alias: SSHAliasConfig, defaults: Defaults) {
  return {
    host: alias.host,
    port: alias.port || defaults.port,
    username: alias.user || defaults.user,
    keyPath: alias.keyPath || defaults.sshKey,
  };
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
  let jump: JumpHost | undefined;

  if (server.sshAlias) {
    const alias = parseSSHConfig(server.sshAlias);
    if (!alias) {
      throw new SSHAliasNotFoundError(server.sshAlias);
    }
    ({ host, port, username, keyPath } = applyAliasDefaults(alias, defaults));
    displayHost = `${server.sshAlias} → ${alias.host}`;
    if (alias.proxyJump) {
      jump = resolveJumpHost(alias.proxyJump, defaults);
      displayHost = `${server.sshAlias} → ${alias.proxyJump} → ${alias.host}`;
    }
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
    jump,
  };
}

/**
 * Resolve a ProxyJump value: an alias from ~/.ssh/config, or [user@]host[:port]
 *
 * @throws ConfigError for a multi-hop chain or a jump host with no key
 */
export function resolveJumpHost(spec: string, defaults: Defaults): JumpHost {
  if (spec.includes(",")) {
    throw new ConfigError(
      `ProxyJump '${spec}' chains several hops`,
      "remote supports one jump host; point ProxyJump at a single alias"
    );
  }

  const alias = parseSSHConfig(spec);
  let endpoint: ReturnType<typeof applyAliasDefaults>;

  if (alias) {
    if (alias.proxyJump) {
      throw new ConfigError(
        `Jump host '${spec}' has its own ProxyJump`,
        "remote supports one jump host; nested jumps are not followed"
      );
    }
    endpoint = applyAliasDefaults(alias, defaults);
  } else {
    const match = spec.match(/^(?:([^@]+)@)?([^:@]+)(?::(\d+))?$/);
    if (!match) {
      throw new ConfigError(`ProxyJump '${spec}' is not [user@]host[:port]`, "Check ~/.ssh/config");
    }
    endpoint = {
      host: match[2]!,
      port: match[3] ? parseInt(match[3], 10) : defaults.port,
      username: match[1] || defaults.user,
      keyPath: defaults.sshKey,
    };
  }

  const { host, port, username, keyPath } = endpoint;
  const privateKey = loadPrivateKey(keyPath);
  if (!privateKey) {
    throw new ConfigError(
      `Jump host '${spec}' has no readable IdentityFile`,
      "Give the jump host an IdentityFile in ~/.ssh/config"
    );
  }

  return {
    config: { host, port, username, privateKey },
    keyPath: keyPath ? expandPath(keyPath) : undefined,
  };
}
