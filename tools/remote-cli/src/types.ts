import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Server Config Schema
// ─────────────────────────────────────────────────────────────

/**
 * Server configuration with XOR constraint:
 * Must have either `sshAlias` (reads from ~/.ssh/config)
 * OR `host` (direct connection), but not both
 */
export const ServerConfigSchema = z
  .object({
    name: z.string().min(1, "Server name is required"),
    appPath: z.string().min(1, "App path is required"),
    // SSH Alias method (reads from ~/.ssh/config)
    sshAlias: z.string().optional(),
    // Direct connection method
    host: z.string().optional(),
    user: z.string().optional(),
    port: z.number().int().positive().optional(),
    sshKey: z.string().optional(),
    password: z.string().optional(),
    // Tags for fuzzy matching
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => !!data.sshAlias !== !!data.host, {
    message: "Must have either 'sshAlias' OR 'host', not both or neither",
    path: ["sshAlias", "host"],
  });

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// ─────────────────────────────────────────────────────────────
// Defaults Schema
// ─────────────────────────────────────────────────────────────

export const DefaultsSchema = z.object({
  user: z.string().default("root"),
  port: z.number().int().positive().default(22),
  sshKey: z.string().default("~/.ssh/id_rsa"),
});

export type Defaults = z.infer<typeof DefaultsSchema>;

// ─────────────────────────────────────────────────────────────
// Config Schema (servers.json)
// ─────────────────────────────────────────────────────────────

export const ConfigSchema = z.object({
  servers: z.record(z.string(), ServerConfigSchema),
  defaults: DefaultsSchema,
});

export type Config = z.infer<typeof ConfigSchema>;

// ─────────────────────────────────────────────────────────────
// Secrets Schema (secrets.json)
// ─────────────────────────────────────────────────────────────

export const SecretsSchema = z.record(z.string(), z.string());

export type Secrets = z.infer<typeof SecretsSchema>;

// ─────────────────────────────────────────────────────────────
// SSH Types (not validated with Zod, internal types)
// ─────────────────────────────────────────────────────────────

/**
 * Parsed SSH config entry from ~/.ssh/config
 */
export interface SSHAliasConfig {
  host: string;
  user?: string;
  port?: number;
  keyPath?: string;
}

/**
 * Resolved connection info ready for SSH client
 */
export interface ConnectionInfo {
  config: {
    host: string;
    port: number;
    username: string;
    privateKey?: Buffer;
    password?: string;
  };
  displayHost: string;
  appPath: string;
  keyPath?: string; // Original key path for rsync -i flag
}

// ─────────────────────────────────────────────────────────────
// CLI Command Types
// ─────────────────────────────────────────────────────────────

export type CLICommand =
  | { type: "help" }
  | { type: "list" }
  | { type: "edit" }
  | { type: "interactive" }
  | { type: "server-only"; server: string }
  | { type: "execute"; server: string; command: string }
  | {
      type: "sync";
      server: string;
      localPath: string;
      dryRun: boolean;
      excludes: string[];
      rsyncFlags?: string;
      to?: string;
      singleFile?: boolean;
    }
  | { type: "get"; server: string; remotePath: string; to?: string; dryRun: boolean };
