#!/usr/bin/env bun
import { RemoteCliError, ServerNotFoundError } from "./src/errors.ts";
import { colors } from "./src/utils/index.ts";
import { loadConfig, loadSecrets } from "./src/config/index.ts";
import { buildConnection, executeCommand } from "./src/ssh/index.ts";
import { findServerMatch } from "./src/server/index.ts";
import { executeSync } from "./src/sync/index.ts";
import { executeGet } from "./src/get/index.ts";
import {
  parseArgs,
  showHelp,
  showList,
  openEditor,
  selectServer,
  promptCommand,
} from "./src/cli/index.ts";

function resolveServer(query: string, servers: Record<string, unknown>): string {
  const match = findServerMatch(query, servers as Parameters<typeof findServerMatch>[1]);
  if (!match) throw new ServerNotFoundError(query);
  return match;
}

function handleError(error: unknown): never {
  if (error instanceof RemoteCliError) {
    console.error(`${colors.red}Error:${colors.reset} ${error.message}`);
    if (error.hint) {
      // Same stream as the error it explains — a hint alone on stdout is both
      // orphaned under `2>/dev/null` and pollution under `1>capture`.
      console.error(`${colors.dim}${error.hint}${colors.reset}`);
    }
    process.exit(1);
  }

  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const command = parseArgs(args);

  if (command.type === "help") {
    showHelp();
    process.exit(0);
  }

  if (command.type === "edit") {
    openEditor();
    process.exit(0);
  }

  const config = loadConfig();

  if (command.type === "list") {
    showList(config);
    process.exit(0);
  }

  const secrets = loadSecrets();

  if (command.type === "sync") {
    const serverId = resolveServer(command.server, config.servers);
    const server = config.servers[serverId]!;
    const connInfo = buildConnection(serverId, server, config.defaults, secrets);
    const exitCode = await executeSync(connInfo, {
      localPath: command.localPath,
      dryRun: command.dryRun,
      excludes: command.excludes,
      rsyncFlags: command.rsyncFlags,
      to: command.to,
      singleFile: command.singleFile,
    }, server.name);
    process.exit(exitCode);
  }

  if (command.type === "get") {
    const serverId = resolveServer(command.server, config.servers);
    const server = config.servers[serverId]!;
    const connInfo = buildConnection(serverId, server, config.defaults, secrets);
    const exitCode = await executeGet(connInfo, {
      remotePath: command.remotePath,
      to: command.to,
      dryRun: command.dryRun,
    }, server.name);
    process.exit(exitCode);
  }

  let serverId: string;
  let cmdToRun: string;

  switch (command.type) {
    case "interactive":
      serverId = await selectServer(config);
      cmdToRun = await promptCommand();
      break;

    case "server-only":
      serverId = resolveServer(command.server, config.servers);
      cmdToRun = await promptCommand(serverId);
      break;

    case "execute":
      serverId = resolveServer(command.server, config.servers);
      cmdToRun = command.command;
      break;
  }

  const server = config.servers[serverId]!;
  const connInfo = buildConnection(serverId, server, config.defaults, secrets);
  const exitCode = await executeCommand(connInfo, cmdToRun, server.name);
  process.exit(exitCode);
}

main().catch(handleError);
