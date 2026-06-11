---
name: ci-ssh-deploy-timeout
description: >-
  Diagnose and fix CI/CD deploys that intermittently fail when the runner can't
  SSH into the target server — errors like `dial tcp ***:22: i/o timeout`,
  `ssh: connect to host ... port 22: Connection timed out`, `Connection
  refused`, or a deploy step that "usually passes on the 2nd or 3rd re-run."
  Use this WHENEVER a GitHub Actions / GitLab CI / generic SSH deploy step times
  out reaching a server, ESPECIALLY before adding a firewall rule or IP
  allowlist — those are usually the wrong fix. The skill rules out firewall /
  fail2ban / sshd throttling systematically, then converts the deploy to a
  connect-retry pattern that self-heals transient drops without re-running
  genuine failures. Triggers on "deploy keeps timing out", "ssh i/o timeout in
  CI", "runner can't connect to my server", "flaky deploy", "should I allowlist
  the runner IPs", "deploy fails intermittently then works on retry".
---

# CI SSH Deploy Timeout — Diagnose & Fix

A CI job that SSHes into a server to deploy (GitHub Actions `appleboy/ssh-action`,
a raw `ssh user@host` in a script, rsync-over-ssh, etc.) intermittently fails at
the **connect** step — the runner's SYN never gets a SYN-ACK back in time, so the
step dies with `dial tcp ***:22: i/o timeout` or `Connection timed out`. It passes
when re-run by hand. The instinct is "the server's firewall is blocking the
runner — let me allowlist GitHub's IPs." **That instinct is almost always wrong**,
and chasing it burns a deploy cycle. This skill exists to stop that.

## The core insight

There are three distinct causes that all look identical in the CI log, and they
need opposite fixes:

| Cause | What you'd see | Right fix |
|-------|----------------|-----------|
| **Transient packet loss** (most common) | Server reachable from your own machine; firewall inactive; fails ~1-in-N runs | **Retry the connect** — the subject of this skill |
| **Real firewall / allowlist** | Port 22 unreachable from *everywhere except* whitelisted IPs; consistent, not flaky | Allowlist — but verify it's actually this first |
| **sshd connection throttling** | Fails in *bursts* (parallel/queued deploys), `MaxStartups` drops | Raise `MaxStartups`, or serialize deploys |

The whole point is: **diagnose which one before fixing.** An IP allowlist is both
unnecessary for the common case *and* impractical against GitHub-hosted runners —
their IP pool is huge and rotates constantly, so a static allowlist is a
maintenance trap that still won't reliably help.

## Step 1 — Reproduce / confirm it's the connect, not the script

Read the failing CI log and find the timestamp delta. A connect timeout fires
fast (the action's connect timeout, often 30s) — *before* any remote command
runs. If the log shows remote commands executing and *then* failing, this is NOT
a connect timeout — it's a real deploy failure (bad migration, failed build), and
this skill does not apply. Stop and debug the actual remote failure instead.

Signature of a genuine connect timeout (nothing ran remotely):
```
2026/06/05 03:52:01 dial tcp ***:22: i/o timeout
##[error]Process completed with exit code 1.
```

## Step 2 — Rule out the firewall (don't assume it)

Run these read-only checks. **Prefer the user's `remote <alias>` CLI** if the
project has one configured (`~/.config/remote-cli/servers.json` lists aliases);
fall back to plain `ssh <user>@<host>` when there's no alias. The goal is to
*disprove* the firewall theory with evidence, not to act on a hunch.

```bash
# 1. Is the port reachable from YOUR machine right now? (transient ≈ open here)
nc -z -w 5 <host> 22 && echo "port 22 OPEN from here" || echo "BLOCKED from here"

# 2. Host firewall active? (inactive ufw ⇒ firewall is NOT the cause)
remote <alias> "sudo ufw status verbose 2>/dev/null || echo 'ufw inactive/absent'"
#   no alias:  ssh <user>@<host> "sudo ufw status verbose"

# 3. fail2ban banning the runner? (not installed ⇒ not the cause)
remote <alias> "which fail2ban-client >/dev/null 2>&1 && sudo fail2ban-client status sshd || echo 'fail2ban not installed'"

# 4. sshd connection throttling? (defaults 10:30:100 are generous)
remote <alias> "grep -iE 'maxstartups|maxsessions|logingracetime' /etc/ssh/sshd_config | grep -v '^#' || echo 'defaults'"
```

**Interpretation:**
- Port open from your machine **+** ufw inactive **+** no fail2ban **+** default
  sshd → **transient packet loss.** Go to Step 3 (the retry fix).
- Port unreachable from your machine too, *and* ufw/cloud-firewall shows a deny →
  genuine firewall. The allowlist conversation is now legitimate (but for a
  *self-hosted* runner with a stable IP, not GitHub-hosted).
- Fails in bursts + non-default `MaxStartups` → throttling. Raise it or serialize
  (GitHub Actions: a `concurrency:` group already serializes — check it's set).

⚠️ A host-level `ufw` being inactive does **not** rule out a *cloud-provider*
network firewall (DigitalOcean Cloud Firewall, AWS security group). If `ufw` is
inactive but the port is unreachable from everywhere, check the provider console.
In practice, if the port is reachable from your machine, there is no blocking
firewall at any layer — that single check is the strongest signal.

## Step 3 — Fix: retry the connect, but only the connect

Once confirmed transient, make the deploy self-heal. The key design choice that
keeps this safe: **retry only on a connection failure, never on a genuine remote
failure.** SSH exits **255** when it can't establish the connection; any other
non-zero exit is the remote command's own failure. If you retry indiscriminately,
a bad migration or failed build re-runs the entire destructive deploy 3× before
finally surfacing — slower to fail and potentially harmful. Scoping retries to
exit 255 means transient drops self-heal while real failures fail fast on the
first attempt.

Pick the variant that matches the deploy:

- **GitHub Actions** → read `references/github-actions.md`
- **Generic SSH in a shell script** (any CI, or local) → read `references/generic-ssh.md`

Both converge on the same idea: a connect-scoped retry wrapper, a longer connect
timeout, and a couple of robustness touches (CR-stripping the key, keyscanning
known_hosts).

## Step 4 — Update the project's deploy docs

After applying the fix, leave a trail so the next person (or session) doesn't
re-chase the firewall theory:
- If the project keeps deploy notes (a `CLAUDE.local.md`, a `tasks/**/deploy*.md`,
  a runbook), record: the symptom, that the firewall was *ruled out* (with the
  evidence), and the retry fix. State plainly that the IP-allowlist path is a dead
  end for hosted runners — that's the single most valuable thing to capture,
  because it's the wrong turn everyone takes.
- Note the change is unverifiable until the next real deploy — the only true test
  is the next push that triggers the pipeline.

## What NOT to do

- **Don't add an IP allowlist for GitHub-hosted runners.** The pool is enormous
  and rotates; you'll maintain it forever and still get timeouts. (Self-hosted
  runners with a fixed IP are the exception — there an allowlist is reasonable.)
- **Don't just bump the timeout and call it fixed.** A longer single connect
  attempt lowers the failure rate but doesn't self-heal — you still get manual
  re-runs, just fewer. Retry is what removes the human from the loop.
- **Don't wrap the whole step in blind retries.** Without the exit-255 scope, you
  turn a fast, clear remote failure into a slow, 3×-repeated one.
- **Don't "fix" it by switching the deploy to polling/manual.** That's a
  regression dressed as a fix.
