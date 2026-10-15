import type { Config } from "../types.ts";
import { colors } from "../utils/index.ts";
import { findServerMatch } from "../server/index.ts";
import { ServerNotFoundError } from "../errors.ts";

/**
 * Read a line of input from stdin
 */
export function readLine(prompt: string): Promise<string> {
  process.stdout.write(prompt);
  return new Promise((resolve) => {
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (chunk) => resolve(chunk.toString().trim()));
  });
}

/**
 * Interactive server selection with numbered list
 *
 * @throws ServerNotFoundError if user input doesn't match any server
 */
export async function selectServer(config: Config): Promise<string> {
  const serverIds = Object.keys(config.servers);

  console.log(`\n${colors.cyan}${colors.bold}Select a server:${colors.reset}\n`);

  for (const [idx, id] of serverIds.entries()) {
    const server = config.servers[id];
    if (!server) continue;

    const tags =
      server.tags?.map((t) => `${colors.dim}#${t}${colors.reset}`).join(" ") ||
      "";
    const connType = server.sshAlias
      ? `${colors.blue}ssh:${server.sshAlias}${colors.reset}`
      : `${colors.yellow}${server.host}${colors.reset}`;

    console.log(
      `  ${colors.bold}${idx + 1}.${colors.reset} ${server.name} ${colors.dim}(${id})${colors.reset}`
    );
    console.log(
      `     ${connType} -> ${colors.dim}${server.appPath}${colors.reset} ${tags}`
    );
  }

  console.log(`\n  ${colors.dim}Enter number or server ID:${colors.reset}`);
  const input = await readLine(`  ${colors.green}>${colors.reset} `);

  const match = findServerMatch(input, config.servers);
  if (match) return match;

  throw new ServerNotFoundError(input);
}

/**
 * Prompt user for command input
 */
export async function promptCommand(serverId?: string): Promise<string> {
  const prompt = serverId
    ? `\n  ${colors.dim}Enter command for ${serverId}:${colors.reset}`
    : `\n  ${colors.dim}Enter command:${colors.reset}`;

  console.log(prompt);
  return readLine(`  ${colors.green}>${colors.reset} `);
}
