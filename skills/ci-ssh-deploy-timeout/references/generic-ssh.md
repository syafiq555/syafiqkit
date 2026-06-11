# Generic SSH deploy — connect-retry in a shell script

For any deploy that runs `ssh user@host '<deploy commands>'` from a shell script
(GitLab CI `script:`, CircleCI, Jenkins, a Makefile, a bare `deploy.sh`), wrap the
connect in a bash retry loop scoped to **connect failures only**.

## The portable retry loop

The discipline that makes this safe: `ssh` exits **255** when it cannot connect;
any other non-zero exit is the *remote command's* own failure. Retry on 255,
pass everything else straight through. That way a transient drop self-heals while
a real deploy failure (bad migration, failed build) fails fast on attempt 1.

```bash
#!/usr/bin/env bash
set -euo pipefail

SSH_HOST="${SSH_HOST:?set SSH_HOST}"
SSH_USER="${SSH_USER:?set SSH_USER}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/deploy_key}"
MAX_ATTEMPTS=3
RETRY_WAIT=30

ssh_deploy() {
  ssh -i "$SSH_KEY" \
    -o ConnectTimeout=60 \
    -o ServerAliveInterval=30 \
    -o BatchMode=yes \
    "$SSH_USER@$SSH_HOST" 'bash -s' <<'REMOTE'
set -e
# ---- your existing deploy commands, byte-for-byte ----
cd /var/www/app
git fetch origin production && git reset --hard origin/production
docker compose -f docker-compose.prod.yml up -d --build
# ------------------------------------------------------
REMOTE
}

attempt=1
while true; do
  if ssh_deploy; then
    echo "[deploy] succeeded on attempt $attempt"
    exit 0
  fi
  code=$?
  # 255 = ssh could not connect → transient, retry.
  # anything else = the remote script failed → DON'T retry, surface it now.
  if [ "$code" -ne 255 ]; then
    echo "[deploy] remote failure (exit $code) — not a connect timeout, not retrying" >&2
    exit "$code"
  fi
  if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
    echo "[deploy] connect failed after $MAX_ATTEMPTS attempts" >&2
    exit "$code"
  fi
  echo "[deploy] connect timeout (attempt $attempt) — retrying in ${RETRY_WAIT}s" >&2
  attempt=$((attempt + 1))
  sleep "$RETRY_WAIT"
done
```

## Key-handling robustness (do this once, before the loop)

```bash
mkdir -p ~/.ssh
# CRLF in a stored key secret makes OpenSSH reject it as malformed on every
# connect — strip CR defensively.
printf '%s\n' "$SSH_PRIVATE_KEY" | tr -d '\r' > "$SSH_KEY"
chmod 600 "$SSH_KEY"
ssh-keyscan -H "$SSH_HOST" >> ~/.ssh/known_hosts 2>/dev/null
```

## Why these ssh flags

| Flag | Reason |
|------|--------|
| `ConnectTimeout=60` | Let a slow-but-alive handshake finish instead of being cut short; fewer false timeouts. |
| `ServerAliveInterval=30` | Drop a *stalled* established connection (≈90s of silence) rather than hanging the job. |
| `BatchMode=yes` | Never prompt for a password — a failed auth exits immediately rather than hanging. |
| `<<'REMOTE'` (quoted) | `$VAR`s evaluate **server-side**, which is what a deploy script wants. |

## A note on `set -e` + retry interaction

If your remote script uses `set -e` (it should), a failed command makes the
remote `bash -s` exit non-zero, and `ssh` relays that exact code — **not** 255.
So the `[ "$code" -ne 255 ]` guard correctly classifies it as a real failure and
stops. This is exactly the behavior you want: transient connect drops retry, real
failures don't.

## Verify after

Shell-lint the script: `bash -n deploy.sh` (syntax) and `shellcheck deploy.sh`
if available. The connect-retry behavior itself is only truly testable against a
flaky network — the real validation is the next deploy run.
