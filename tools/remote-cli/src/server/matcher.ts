import type { ServerConfig } from "../types.ts";

/**
 * Find server by exact ID, partial match, name, or tag
 *
 * Matching priority:
 * 1. Exact ID match
 * 2. Numeric index (1-indexed from server list)
 * 3. Fuzzy match: partial ID, name (case-insensitive), or tag
 *
 * @param query - User input to match against servers
 * @param servers - Record of server ID to ServerConfig
 * @returns Matched server ID or null if not found
 */
export function findServerMatch(
  query: string,
  servers: Record<string, ServerConfig>
): string | null {
  const serverIds = Object.keys(servers);

  // 1. Exact match first
  if (serverIds.includes(query)) {
    return query;
  }

  // 2. Number lookup (1-indexed)
  const num = parseInt(query, 10);
  if (!isNaN(num) && num >= 1 && num <= serverIds.length) {
    return serverIds[num - 1] ?? null;
  }

  // 3. Fuzzy match: partial ID, name (case-insensitive), or tag
  const match = serverIds.find((id) => {
    const server = servers[id];
    if (!server) return false;

    return (
      id.includes(query) ||
      server.name.toLowerCase().includes(query.toLowerCase()) ||
      server.tags?.includes(query)
    );
  });

  return match ?? null;
}
