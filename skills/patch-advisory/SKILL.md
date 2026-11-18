---
name: patch-advisory
description: Answer a security advisory across the servers you can reach. Read the CVE into facts, find every host and container running the affected software, judge which are actually exposed (version AND the precondition AND reachability), patch or mitigate the ones the user owns, verify the running process, record it and report back where it was asked. Use when the user pastes a CVE id, a CVSS 9 headline, an NVD or GitHub advisory link, a vendor or researcher write-up (Wiz, oss-security, a vendor security release), or a colleague's "patch if got any nginx", "cve 9+ again", "are we affected by", "check our servers for", "any server running X", "PHP/nginx/OpenSSL/OpenSSH/Node/kernel security release", "is this CVE on our box". Not for dependency advisories inside a repo (npm audit, composer audit, Dependabot: a code change shipped through the normal review and `ship`, which also carries a base-image bump), not for deploying an app (`ship`), not for a Mac's own disk (`reclaim-disk`) or its tool setup (`setup-tools`).
---

# Patch Advisory

An advisory names a version range; what decides the work is which of your hosts can actually be reached by the bug. Most of a sweep is ruling hosts out with evidence, and the few that remain get patched, mitigated, or handed to whoever owns them.

## 1. Turn the advisory into facts

From the write-up and the vendor's own notice, capture: each CVE id with its score, the first affected and the fixed version **per release branch** (stable and mainline differ), the precondition (a protocol on, a module loaded, a config directive), the vendor's interim mitigation, and the distro trackers' status (Ubuntu, Debian, Alpine). Write them into the infrastructure task doc now, since the link may be the only copy.

A distro package carries its own revision string (`1.24.0-2ubuntu7.19`), and fixes get backported into it, so comparing it with upstream's fixed version says nothing. Read the distro tracker for that release instead; "Vulnerable" with no fixed package is common in the first days, and then mitigation is the only move.

## 2. Inventory every host, then probe it

List every server alias the `remote` CLI knows (or the user's inventory), and dedupe by IP, since several aliases often share one box. `remote` follows an SSH `ProxyJump`, so a host reached through a jump box needs nothing special. Then ask once which hosts aren't in that list (a colleague's box, a Windows server, a managed database, a panel-only host): each gets a row marked "not probeable" with the vendor's own status page as its evidence, never a silent gap.

Run the read-only probe on each reachable host, at most four at a time:

```bash
P=<this skill's base directory>/scripts/probe.sh; mkdir -p /tmp/adv
for s in <alias> ...; do echo "$s"; done | xargs -P 4 -I{} sh -c \
  "perl -e 'alarm 90; exec @ARGV' \"$(command -v remote)\" {} 'SW=nginx bash -s' < $P > /tmp/adv/{}.out 2>/tmp/adv/{}.err"
```

Change `SW=nginx` in the quoted remote command for other software (`SW=php CFG=`, `SW=node CFG=`; add `VER=--version` where the flag differs). `CFG` is a command whose output shows the precondition; for nginx it defaults to the effective `listen`/`http2` lines, falling back to the config files (marked `FILES-NOT-EFFECTIVE`) when `nginx -T` can't run. macOS has no `timeout`, hence the `perl alarm`. The probe reports host binaries (including `/usr/sbin` off a non-root PATH), packages, processes, every Podman and Docker container's copy (plain and through `sudo -n`), and what listens on 80 and 443. It writes nothing and restarts nothing.

A host that printed nothing is not clean. Read its `.err`: an SSH timeout or a login without container access looks like "not installed", and the probe says `cannot list containers` or `cfg: unreadable` where it could tell. List each unreachable host by name in the report.

**A library advisory (OpenSSL, glibc, zlib) is about what running processes load, not a binary's name.** `openssl version` says nothing about the copy nginx or PHP links. Check the loaded file per process (`grep -l libssl /proc/*/maps`, or `needrestart -b` where installed, which also lists processes still on a replaced library), and for images you build, read the base image in the repo's Containerfile: an image that isn't running is invisible to any host probe.

## 3. Judge exposure, host by host

For each copy found, three questions in order: is the version in range (by the distro tracker for distro packages), is the precondition actually on in the **effective** config (`nginx -T`, `php -i`, not a file that may not be included), and can an attacker reach it. A copy listening on plain HTTP inside a container, behind a proxy that terminates TLS, is not reachable over a protocol the proxy doesn't speak. A CDN in front protects nothing if the origin IP answers directly, so test the origin with `curl --resolve <host>:443:<origin-ip>`. A copy whose exposure you could not establish counts as exposed: CERT/CC's SSVC guidance says to assume the open case when you can't tell (https://certcc.github.io/SSVC/howto/bootstrap/collect).

One shared listener carries the most specific trap: a protocol flag on one virtual host's `listen` line can turn it on for every site sharing that address and port.

## 4. Settle whose each host is

Patching a box someone else runs is not yours to decide, even when you have root. Read each exposed host's owning repo docs first (`read-summary`; a sweep host is a scope change), then ask once, in one batch, about the exposed hosts only: each option names the host, the evidence of who runs it (docs, who deploys), the proposed action and the blip it costs, so the user answers ownership and timing together. Platform-managed hosts (Cloudways and similar) without sudo are the platform's to patch: record the version and a recheck date in the task doc, offer to draft the platform ticket with the CVE ids and the exposure evidence, and offer a local `/loop` for the recheck (a cloud scheduled agent can't reach SSH hosts). Record the user's answer about ownership where the next sweep will read it.

## 5. Patch or mitigate

Before a restart that blips shared sites, tell any live peer session working against that box. Then, by how the software was installed:

- **Container on a floating tag:** keep a rollback copy (`podman tag <image> localhost/<name>:pre-<id>`), pull, test the live config on the new image in a throwaway container, then restart the unit, since a reload never loads a new image.
- **Distro package:** `apt-get install --only-upgrade <pkg>` once the tracker lists a fix, then restart the service. With no fix yet, apply the vendor's mitigation (turn the feature off), test the config, reload, and say it is interim: NIST SP 800-40r4 §3.5.3 says to plan to replace emergency mitigations with permanent fixes once a patch exists (https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-40r4.pdf).
- **Image you build:** bump the base image digest in that repo and ship it through its own deploy.

A host that isn't exposed can still be bumped as defence in depth; offer it, with the blip it costs.

## 6. Verify the running copy

The installed package proves nothing about the running process: a container keeps its old image until recreated, a service its old binary until restarted. Read the version from the running copy (`podman exec <c> nginx -v`, `readlink /proc/<pid>/exe`), check every site on the box answers, and re-run the precondition check at the origin. Report what each command returned, not that it was done.

## 7. Record and report

Write the outcome into the infrastructure task doc: CVE ids, the sweep result per host (patched, mitigated, not exposed with the reason, not ours, unreachable), the rollback copy, and the probe command for the next advisory.

Then answer the ask where it was posted and add any product-space note, per `ship` Step 5 items 7 and 8. Cover what was patched, what was not exposed and why, and what waits on someone else, and always carry one coverage line ("checked 12 of 15: 3 run by others, 2 waiting on the platform, recheck 26/11") so silence about a host never reads as covered. Hosts the user said aren't theirs are counted in that line, not named, unless they ask.
