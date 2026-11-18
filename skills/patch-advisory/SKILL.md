---
name: patch-advisory
description: Answer a security advisory across the servers you can reach. Read the CVE into facts, find every host and container running the affected software, judge which are actually exposed (version AND the precondition AND reachability), patch or mitigate the ones the user owns, verify the running process, record it and report back where it was asked. Use when the user pastes a CVE, a vendor or researcher write-up (Wiz, oss-security, a vendor security release), or a colleague's "patch if got any nginx", "cve 9+ again", "are we affected by", "check our servers for", "PHP/nginx/OpenSSL/Node security release", "is this CVE on our box". Not for dependency advisories inside a repo (npm audit, composer audit, Dependabot: that is a code change shipped through the normal review and `ship`), not for deploying an app (`ship`), and not for a Mac's own disk or tooling.
---

# Patch Advisory

An advisory names a version range; what decides the work is which of your hosts can actually be reached by the bug. Most of a sweep is ruling hosts out with evidence, and the few that remain get patched, mitigated, or handed to whoever owns them.

## 1. Turn the advisory into facts

From the write-up and the vendor's own notice, capture: each CVE id with its score, the first affected and the fixed version **per release branch** (stable and mainline differ), the precondition (a protocol on, a module loaded, a config directive), the vendor's interim mitigation, and the distro trackers' status (Ubuntu, Debian, Alpine). Write them into the infrastructure task doc now, since the link may be the only copy.

A distro package carries its own revision string (`1.24.0-2ubuntu7.19`), and fixes get backported into it, so comparing it with upstream's fixed version says nothing. Read the distro tracker for that release instead; "Vulnerable" with no fixed package is common in the first days, and then mitigation is the only move.

## 2. Inventory every host, then probe it

List every server alias the `remote` CLI knows (or the user's inventory), and dedupe by IP, since several aliases often share one box. Then run the read-only probe on each, at most four at a time:

```bash
P=<this skill's base directory>/scripts/probe.sh
for s in <alias> ...; do echo "$s"; done | xargs -P 4 -I{} sh -c \
  "perl -e 'alarm 90; exec @ARGV' \"$(command -v remote)\" {} 'bash -s' < $P > /tmp/adv/{}.out 2>/tmp/adv/{}.err"
```

`SW=php CFG= bash -s` (or `SW=node`, `SW=openssl`, with `VER=version` where the flag differs) probes other software. `CFG` is a command whose output shows the precondition; for nginx it defaults to the effective `listen`/`http2` lines. macOS has no `timeout`, hence the `perl alarm`. The probe reports host binaries, packages, processes, every Podman and Docker container's copy (with `sudo -n` when not root), and what listens on 80 and 443.

A host that printed nothing is not clean. Read its `.err`: an SSH timeout, a login without container access, or a platform-managed host where the binary sits off a non-root PATH all look like "not installed". List each unreachable host by name in the report.

## 3. Judge exposure, host by host

For each copy found, three questions in order: is the version in range (by the distro tracker for distro packages), is the precondition actually on in the **effective** config (`nginx -T`, `php -i`, not a file that may not be included), and can an attacker reach it. A copy listening on plain HTTP inside a container, behind a proxy that terminates TLS, is not reachable over a protocol the proxy doesn't speak. A CDN in front protects nothing if the origin IP answers directly, so test the origin with `curl --resolve <host>:443:<origin-ip>`. A copy whose exposure you could not establish counts as exposed: CERT/CC's SSVC guidance says to assume the open case when you can't tell (https://certcc.github.io/SSVC/howto/bootstrap/collect).

One shared listener carries the most specific trap: a protocol flag on one virtual host's `listen` line can turn it on for every site sharing that address and port.

## 4. Settle whose each host is

Patching a box someone else runs is not yours to decide, even when you have root. For each exposed host, read the docs of the repo that owns it (`read-summary` for that project) before asking anything about it, and ask the user which hosts are theirs to patch. Platform-managed hosts (Cloudways and similar) without sudo are the platform's to patch: note the version and recheck later. Record the user's answer about ownership where the next sweep will read it.

## 5. Patch or mitigate

Before a restart that blips shared sites, tell any live peer session working against that box. Then, by how the software was installed:

- **Container on a floating tag:** keep a rollback copy (`podman tag <image> localhost/<name>:pre-<id>`), pull, test the live config on the new image in a throwaway container, then restart the unit. A reload never loads a new image, and a unit with no pull policy reuses the local image until you pull.
- **Distro package:** `apt-get install --only-upgrade <pkg>` once the tracker lists a fix, then restart the service. With no fix yet, apply the vendor's mitigation (turn the feature off), test the config, reload, and say it is interim: NIST SP 800-40r4 §3.5.3 says to plan to replace emergency mitigations with permanent fixes once a patch exists (https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-40r4.pdf).
- **Image you build:** bump the base image digest in that repo and ship it through its own deploy.

A host that isn't exposed can still be bumped as defence in depth; offer it, with the blip it costs.

## 6. Verify the running copy

The installed package proves nothing about the running process: a container keeps its old image until recreated, a service its old binary until restarted. Read the version from the running copy (`podman exec <c> nginx -v`, `readlink /proc/<pid>/exe`), check every site on the box answers, and re-run the precondition check at the origin. Report what each command returned, not that it was done.

## 7. Record and report

Write the outcome into the infrastructure task doc: CVE ids, the sweep result per host (patched, mitigated, not exposed with the reason, not ours, unreachable), the rollback copy, and the probe command for the next advisory.

Then reply where the advisory was asked, usually a colleague's message in a team space, in the user's voice through `casual-message`. Cover what was patched, what was not exposed and why, and what waits on someone else. A short update in each affected product's space follows when the user wants one (`gchat-format` for the shape). Leave out hosts the user said aren't theirs unless they ask to flag them.
