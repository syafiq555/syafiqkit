import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { dirname } from "path";
import type { Config } from "../types.ts";
import { colors } from "../utils/index.ts";
import { CONFIG_PATH } from "../config/index.ts";

/**
 * Display help message
 */
export function showHelp(): void {
  console.log(`
${colors.cyan}${colors.bold}remote${colors.reset} - Run commands on remote servers

${colors.bold}USAGE:${colors.reset}
  remote                          # Interactive server selection
  remote <server> "command"       # Direct execution
  remote --sync <server> <path>   # Upload files or directories via rsync
  remote --scp <server> <path>    # Alias of --sync; reports the file's size
  remote --get <server> <path>    # Download one file via SFTP
  remote --list                   # List all servers
  remote --edit                   # Open config in editor

${colors.bold}UPLOAD OPTIONS:${colors.reset} (rsync; --sync and --scp are the same path)
  --sync <server> <local-path>    Upload local path to server's appPath
  --scp <server> <local-path>     Same, plus a byte count for a single file
  --to <remote-path>              Destination: relative to appPath, or absolute
                                  (required when <local-path> is absolute)
                                  Missing remote directories are created
  --dry-run, -n                   Print the command line without connecting
  --exclude <pattern>             Additional exclude pattern (repeatable)
  --flags "<rsync-flags>"         Override default flags (-avz --progress)

${colors.bold}DOWNLOAD OPTIONS:${colors.reset} (SFTP over the same login; no rsync or sshpass)
  --get <server> <remote-path>    Path relative to appPath, ~/..., or absolute
  --to <local-path>               Local file or directory (default: ./<name>)
  --dry-run, -n                   Print source and target without connecting
                                  Prints the local path on stdout; fails if the
                                  byte count differs from the remote file

${colors.bold}EXAMPLES:${colors.reset}
  remote staging "php artisan migrate:status"
  remote 1 "php artisan tinker"   # Use number from list
  remote staging "git pull"       # Fuzzy match by tag/name
  remote --sync staging ./src     # Upload ./src to server
  remote --sync 1 ./dist -n       # Dry run preview
  remote --scp staging ./src/fix.php   # Upload one file, reporting its size
  remote --scp staging /tmp/app.tar.gz --to releases/app.tar.gz
  remote --get staging storage/logs/laravel.log --to /tmp/

${colors.bold}CONFIG:${colors.reset}
  ${CONFIG_PATH}
`);
}

/**
 * Display list of configured servers
 */
export function showList(config: Config): void {
  console.log(`\n${colors.cyan}${colors.bold}Configured Servers:${colors.reset}\n`);

  for (const [id, server] of Object.entries(config.servers)) {
    const connType = server.sshAlias ? `ssh:${server.sshAlias}` : server.host;
    const tags = server.tags?.length
      ? `\n    ${colors.blue}${server.tags.map((t) => `#${t}`).join(" ")}${colors.reset}`
      : "";

    console.log(`  ${colors.bold}${id}${colors.reset} - ${server.name}`);
    console.log(
      `    ${colors.dim}${connType} -> ${server.appPath}${colors.reset}${tags}\n`
    );
  }
}

/**
 * Open config file in editor
 */
export function openEditor(): void {
  const editor = process.env.VISUAL || process.env.EDITOR || "vi";
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  spawn(`${editor} "$REMOTE_CLI_CONFIG_PATH"`, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, REMOTE_CLI_CONFIG_PATH: CONFIG_PATH },
  });
}
