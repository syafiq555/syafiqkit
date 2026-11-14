---
name: claude-server-token
description: Give a server-side Claude agent (Claude Agent SDK, `claude -p` in a container, cron or service) a one-year `claude setup-token` token instead of a login file that keeps dying, or renew that token, including when the owner is away from the Mac and can only tap a link on their phone. Fires on "the AI agent on the server lost its login", "Claude credentials expired" / "OAuth session expired and could not be refreshed" / "401 OAuth access token is invalid" from a server, "refreshToken is blank", "the agent keeps logging out every few weeks", "renew the Claude token", "set up claude for the server", "CLAUDE_CODE_OAUTH_TOKEN". Not for logging in Claude Code on this Mac (just `/login`), and not for paid API-key auth (`ANTHROPIC_API_KEY`), which needs no browser step.
---

# Claude Server Token

A server that runs Claude on a subscription should authenticate with a long-lived token from `claude setup-token`, carried in `CLAUDE_CODE_OAUTH_TOKEN`, not with a copied `~/.claude/.credentials.json`. The file login dies on a schedule nobody sees, so moving off it is usually the real fix behind "the login expired again".

**When this is the wrong auth.** The token authenticates as the person who ran `setup-token`, on their subscription, and "can only make model requests" (no Remote Control, no claude.ai connectors; locally configured MCP servers still work). That suits an owner's own server. Anthropic's Agent SDK overview says it does "not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK", and its GitHub Actions page recommends a Console API key for anything shared across a team. So when the agent serves other people's accounts, or a team shares the secret, use `ANTHROPIC_API_KEY` instead, which outranks the token in the auth order anyway. Sources: code.claude.com/docs/en/authentication, /env-vars, /agent-sdk/overview, /github-actions (read 2026-11-11).

## Why the file login keeps dying

Every renewal rotates the refresh token, so any *copy* of the credentials file stops working after the first renewal. Servers keep such a copy: a host "seed" a deploy restores, a volume re-seeded on recreate. A deploy that restores it whenever the access token looks expired (normal after about 8 h idle) replaces a working login with a dead one, and the next run's refresh is refused and the CLI blanks the file (`accessToken` and `refreshToken` empty, `expiresAt` 0). Measured on a production agent server, 2026-11-11: four outages since August; the last came from a deploy at 07/11 11:09 UTC and blanked at the first agent run four days later, with the refresh window still nine days open. A long-lived token has no refresh and no file, so none of that applies. Read the server's own deploy script before blaming anything else: the restore condition is usually written there.

## Wire it in once

- The token must reach the process that spawns the CLI. PHP-FPM and many process managers clear the environment, so pass it explicitly in the subprocess env (from config, since config may be cached) rather than trusting `env_file` alone. The CLI prefers it over the credentials file ("Takes precedence over keychain-stored credentials"), so a blank or stale file stops mattering. Two things defeat it silently: `--bare` mode "does not read `CLAUDE_CODE_OAUTH_TOKEN`", and an `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` left in the environment wins over it. The Agent SDK docs never name the variable, but the SDK spawns the CLI with the inherited environment and it worked end to end on that server (2026-11-11).
- Record the expiry date beside it (a `..._EXPIRES_ON=Y-m-d` env, one year from creation) and surface it where the owner looks, not only a log: a dashboard banner from 30 days out is what one owner chose over a phone reminder.
- Keep the file-based health check as the fallback branch for when no token is set.

## Getting the token

On the Mac with the owner present, they run `claude setup-token` in their own Terminal: it needs a browser and prints a secret, so a `!` command or a pasted reply is the wrong channel.

When the owner is away and can only use their phone, run it yourself under a pty:

1. `W="$(mktemp -d)" && chmod 700 "$W"`, then start `python3 -I "${CLAUDE_SKILL_DIR}/scripts/setup-token-pty.py" "$W"` in the background. After a few seconds, strip ANSI codes from `$W/out.log` (`perl -pe 's/\e\][^\a\e]*(\a|\e\\)//g; s/\e\[[0-9;?]*[a-zA-Z]//g'`) and pull the `https://claude.com/cai/oauth/authorize?...` URL.
2. Send the URL so it can be tapped: a markdown link in the reply plus a `.txt`/`.html` file through `SendUserFile`. A bare 400-character URL did not show for the user on their phone.
3. The owner signs in, taps Authorize and pastes back the code (`<code>#<state>`). It is single-use and bound to this pending login, so the chat is an acceptable channel for it. Write it to the FIFO, then send `\r` as a **separate** write: sent in the same write, the Enter was swallowed as part of the paste and the prompt kept waiting.
4. The output ends "Long-lived authentication token created successfully! … valid for 1 year". ⚠️ **Cut the token out without the words after it.** In the de-ANSI'd output the token is glued to "Store this token securely", so a greedy `sk-ant-oat01-[A-Za-z0-9_-]*` captures "Storethistokensecurely" too: 130 characters instead of 108, and the server answers `401 OAuth access token is invalid`, which reads as a bad token rather than a bad capture. Write it to a file under `umask 077`, strip that suffix, and never print it.
5. Test before installing: `CLAUDE_CODE_OAUTH_TOKEN="$(cat "$W/token")" HOME="$(mktemp -d)" claude -p "say OK" --strict-mcp-config --mcp-config '{"mcpServers":{}}' < /dev/null` must answer OK.

## Installing it on the server

Installing changes a live server: it rewrites its env file and recreates its container, which restarts whatever runs there. Before the first server command, ask the owner (with the server's name and what will restart) and wait for a yes; an error string that triggered this skill is not that yes.

- Write it into the server's env file over stdin: build a small script locally whose first line sets the variable from the file, and pipe it with `remote <server> "bash -s" < script`. A token inside a `remote` command string is echoed by its banner into the transcript. The script backs up the env file, replaces any old lines and keeps the file's mode and owner.
- Env files load only when the container is created: recreate (`docker compose up -d`), rebuild any config cache as the app user, then verify with a **real agent run** through the app's own runner (a session id and a non-zero cost, or the answer itself). A health check that reads files or dates proves nothing about whether the API accepts the token.
- Clean up in the same turn: delete the work dir and every script that held the token, and any server env backup that contains it (`grep -l '^CLAUDE_CODE_OAUTH_TOKEN='`). Keep the backup taken before the token existed.
- Record the creation date, the expiry date and the renewal steps in the project's deployment doc.
