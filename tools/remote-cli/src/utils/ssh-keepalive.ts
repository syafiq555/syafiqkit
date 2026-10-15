import { PathValidationError } from "../errors.ts";
import { hasUnsafeShellChars } from "./path.ts";

export const SSH_KEEPALIVE_INTERVAL_MS = 15000;
export const SSH_KEEPALIVE_COUNT_MAX = 4;
export const SSH_KEEPALIVE_INTERVAL_SEC = SSH_KEEPALIVE_INTERVAL_MS / 1000;

/** Hard deadline for a single ssh2 step, so no promise can stay pending. */
export const SSH_STAGE_TIMEOUT_MS = 30000;

/**
 * ConnectTimeout for a spawned ssh. Keepalive bounds an ESTABLISHED session
 * only; without this an unreachable host stalls in TCP retry with no output.
 */
export const SSH_CONNECT_TIMEOUT_SEC = SSH_STAGE_TIMEOUT_MS / 1000;

/**
 * Throwaway known_hosts path, when one is configured.
 *
 * OpenSSH resolves `~` via getpwuid(), so redirecting HOME cannot move
 * known_hosts — only UserKnownHostsFile can.
 *
 * @returns The configured path, or undefined
 * @throws PathValidationError when the path holds shell metacharacters
 */
function knownHostsPath(): string | undefined {
  const knownHosts = process.env.REMOTE_CLI_KNOWN_HOSTS;
  if (!knownHosts) return undefined;

  if (hasUnsafeShellChars(knownHosts)) {
    throw new PathValidationError(knownHosts, "REMOTE_CLI_KNOWN_HOSTS");
  }

  return knownHosts;
}

/**
 * Host-key options as one string for rsync's `-e`, which word-splits it.
 *
 * @returns Space-joined `-o` options, path quoted
 */
export function hostKeyOptionsString(): string {
  const parts = [
    "-o StrictHostKeyChecking=accept-new",
    `-o ConnectTimeout=${SSH_CONNECT_TIMEOUT_SEC}`,
  ];

  const knownHosts = knownHostsPath();
  if (knownHosts) {
    parts.push(`-o UserKnownHostsFile="${knownHosts}"`);
  }

  return parts.join(" ");
}
