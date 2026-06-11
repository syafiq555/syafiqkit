# GitHub Actions — connect-retry SSH deploy

The common starting point is `appleboy/ssh-action`. It has **no native
connect-retry** (only `timeout` for the connect and `command_timeout` for the
script), and it's a *composite* action — so `nick-fields/retry` cannot `uses:` it.
The clean fix is to drive `ssh` directly inside a retry wrapper.

## Pattern: direct ssh wrapped in nick-fields/retry

Split into two steps: write the key once, then deploy with retry.

```yaml
    steps:
      # The runner→server SSH connect occasionally times out (transient packet
      # loss — NOT a firewall: ufw inactive, no fail2ban, port 22 reachable).
      # appleboy/ssh-action has no native connect-retry and is composite (so
      # nick-fields/retry can't `uses:` it), so we drive ssh directly inside a
      # retry wrapper that retries ONLY on connect failure (exit 255).
      - name: Write SSH key
        run: |
          mkdir -p ~/.ssh
          # printf + strip CR: a secret stored with Windows \r\n line endings
          # makes OpenSSH reject the key as malformed on every connect.
          printf '%s\n' "${{ secrets.SSH_PRIVATE_KEY }}" | tr -d '\r' > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H "${{ secrets.SERVER_HOST }}" >> ~/.ssh/known_hosts 2>/dev/null

      - name: Deploy via SSH
        uses: nick-fields/retry@v3
        with:
          timeout_minutes: 35          # per-attempt cap (≥ your slowest deploy)
          max_attempts: 3
          retry_wait_seconds: 30
          # Retry ONLY on ssh connect failure (exit 255). A genuine remote
          # failure (bad migration, failed build via `set -e`) surfaces on the
          # first attempt instead of re-running the whole deploy 3×.
          retry_on_exit_code: 255
          command: |
            ssh -i ~/.ssh/deploy_key \
              -o ConnectTimeout=60 \
              -o ServerAliveInterval=30 \
              -o BatchMode=yes \
              "${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }}" 'bash -s' <<'EOF'
            set -e
            # ... your existing deploy script, byte-for-byte ...
            EOF
```

## Why each piece

| Piece | Reason |
|-------|--------|
| `retry_on_exit_code: 255` | The crux. `ssh` returns 255 only on connect failure; the remote script's own exit code passes through otherwise. Scopes retries to the transient case. |
| `ConnectTimeout=60` | A slow-but-alive handshake completes instead of being cut at the default; reduces false timeouts. |
| `ServerAliveInterval=30` | Drops a *stalled* established connection rather than hanging the whole step (defaults to 3 missed probes ≈ 90s). |
| `BatchMode=yes` | No interactive password prompt — a failed auth exits immediately instead of hanging the runner. |
| `printf … \| tr -d '\r'` | A key pasted with CRLF line endings is silently rejected by OpenSSH; stripping CR removes a whole class of "works locally, fails on the runner" bugs. |
| `ssh-keyscan` into `known_hosts` | Pins the host key. Preferred over `StrictHostKeyChecking=accept-new` on a prod deploy path (accept-on-first-contact is weaker). |
| `<<'EOF'` (quoted) | The heredoc is quoted so `$VAR`s evaluate **server-side**, which is what a deploy script wants. |

## ⚠️ Heredoc terminator inside a YAML literal block — NOT a bug

You may worry the indented `EOF` won't close the heredoc. It does. A YAML
`command: |` literal block strips the **common leading indentation** before the
string reaches the shell, so an `EOF` indented to match the script body lands at
column 0 — exactly where the shell needs it. Verify rather than guess:

```bash
python3 -c "import yaml; \
  c=yaml.safe_load(open('.github/workflows/deploy.yml'))['jobs']['deploy']['steps'][1]['with']['command']; \
  print(repr(c.split(chr(10))[-1]))"   # → 'EOF'  (bare, column 0)
```

## Lighter-touch alternative (if you must keep appleboy)

If rewriting to direct `ssh` is too invasive, at minimum bump appleboy's connect
timeout — but understand this only *reduces* the failure rate, it does not make
the deploy self-heal. You'll still get occasional manual re-runs.

```yaml
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          timeout: 60s            # connect timeout (was 30s default)
          command_timeout: 30m
          script: |
            # ...
```

To get real retries while keeping appleboy, wrap the *whole job* with a re-run —
but that re-runs genuine failures too, so the direct-ssh + `retry_on_exit_code`
approach above is strictly better. Prefer it.

## Verify after

- `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"`
  → confirms the YAML still parses.
- The change is only truly testable on the next push that triggers the pipeline —
  there's no local dry-run for runner→server connectivity.
