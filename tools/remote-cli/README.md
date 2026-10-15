# remote

Run commands on your servers over SSH, upload files, and download one file, from one command. macOS and Linux.

```bash
remote <server> "command"          # run a command; stdout is only the remote output, safe to pipe
remote <server> "php" < script.php # send a local script over stdin, no escaping
remote --sync <server> <path>      # upload a file or folder (rsync); --to <remote-path>, --dry-run
remote --get <server> <path>       # download one file (SFTP); --to <local-path>
remote --list                      # list your servers
remote                             # pick a server interactively
```

`<server>` matches the server id, its number in `--list`, part of its name, or a tag.

## Setup

1. Install [Bun](https://bun.sh).
2. Install the dependencies and put `remote` on your PATH. On a GitHub install of syafiqkit the plugin's git clone is at `~/.claude/plugins/marketplaces/syafiqkit`, which stays at the same path across plugin updates:

   ```bash
   cd ~/.claude/plugins/marketplaces/syafiqkit/tools/remote-cli
   bun install
   mkdir -p ~/.local/bin
   ln -sfn "$PWD/bin/remote" ~/.local/bin/remote
   ```

   Make sure `~/.local/bin` is on your PATH. Run `bun install` again here if `remote` reports a missing module after an update.
3. Create `~/.config/remote-cli/servers.json`:

   ```json
   {
     "servers": {
       "prod": { "name": "Production", "sshAlias": "my-prod", "appPath": "/var/www/app", "tags": ["live"] },
       "staging": { "name": "Staging", "host": "203.0.113.10", "user": "deploy", "port": 22, "sshKey": "~/.ssh/id_ed25519", "appPath": "/var/www/app" }
     },
     "defaults": { "user": "root", "port": 22, "sshKey": "~/.ssh/id_rsa" }
   }
   ```

   Each server uses either `sshAlias` (a `Host` in `~/.ssh/config`) or `host`, never both. `appPath` is where relative paths start on that server. `defaults` must be present; `{}` is enough.
4. For a server that logs in with a password, put it in `~/.config/remote-cli/secrets.json` as `{ "staging": "the-password" }`. The file is set to mode 600 on first read.

`REMOTE_CLI_CONFIG_DIR` points `remote` at another config folder. `remote --edit` opens `servers.json` in `$VISUAL`, else `$EDITOR`, else `vi`.

## Needs

- Uploads need `rsync`. A password-only server also needs `sshpass` for uploads. Commands and downloads need neither.
- Commands and downloads (`remote <server> "cmd"`, `--get`) do not check the server's host key; only uploads check `known_hosts`. Use them on networks you trust.

## Development

```bash
bun test              # offline suites; the live suite skips where sshd is unavailable
bun run typecheck
```
