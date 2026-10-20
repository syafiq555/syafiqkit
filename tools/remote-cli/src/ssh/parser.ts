import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { SSHAliasConfig } from "../types.ts";
import { expandPath } from "../utils/index.ts";

/**
 * Parse ~/.ssh/config to extract a specific host alias configuration
 *
 * @param alias - The SSH alias to look up (e.g., "myserver")
 * @returns The parsed config or null if not found
 */
export function parseSSHConfig(alias: string): SSHAliasConfig | null {
  const sshConfigPath = join(homedir(), ".ssh", "config");
  if (!existsSync(sshConfigPath)) return null;

  const content = readFileSync(sshConfigPath, "utf8");
  const lines = content.split("\n");

  let currentHost: string | null = null;
  let config: Partial<SSHAliasConfig> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("Host ")) {
      // Save previous if we were building one and it matches
      if (currentHost === alias) {
        return { ...config, host: config.host ?? alias } as SSHAliasConfig;
      }
      // Handle "Host alias1 alias2" - take first alias
      currentHost = trimmed.substring(5).trim().split(/\s+/)[0] ?? null;
      if (currentHost === alias) {
        config = {};
      }
    } else if (currentHost === alias && trimmed && !trimmed.startsWith("#")) {
      const match = trimmed.match(/^(\w+)\s+(.+)$/);
      if (match) {
        const [, key, value] = match;
        switch (key) {
          case "HostName":
            config.host = value;
            break;
          case "User":
            config.user = value;
            break;
          case "Port":
            config.port = parseInt(value ?? "22", 10);
            break;
          case "IdentityFile":
            config.keyPath = expandPath(value ?? "");
            break;
          case "ProxyJump":
            config.proxyJump = value?.toLowerCase() === "none" ? undefined : value;
            break;
        }
      }
    }
  }

  // Check last entry in file
  if (currentHost === alias) {
    return { ...config, host: config.host ?? alias } as SSHAliasConfig;
  }

  return null;
}
