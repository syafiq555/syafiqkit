---
name: side-domain
description: Put a personal side project on its own subdomain of the owner's umbrella domain (a Docker app behind Traefik on their VPS), redirect the temporary address it used before, and, only when the app stores uploads, move its files to Cloudflare R2 behind a photo subdomain. Fires on "put it on auraa.stream", "give this app a domain", "custom domain", "subdomain for this project", "move it off sslip.io", "redirect the old url", "go live on a real address", "connect it in Cloudflare", "set up R2", "move the photos to R2", "connect a domain to the new project", and from `ship` when a side project's go-live still runs on a temporary address. Not for a client or employer app with its own domain and deploy docs (follow that project's docs), Laravel Cloud (`deploying-to-cloud`), a CI deploy that fails or times out (`ship`, `ci-ssh-deploy-timeout`), or picking a domain name (suggest names, never registry-check them).
---

# Side Domain

Gives a side project a real address: `<name>.<umbrella>` served by the VPS, the old temporary host redirected to it, and, where the app keeps uploaded files, those files on R2 at `<name>-photos.<umbrella>`. The owner clicks in Cloudflare; you do the server, the app config and every check.

## Settle first

Read the owner's global `CLAUDE.md` `#side-domain` for the umbrella domain, the server alias, its IP, the apps folder and what counts as a side project, and the project's `CLAUDE.local.md` for its app folder and container. Where `#side-domain` is missing, ask once and write the answers there. Then settle, by reading rather than asking where you can:

- **Is the app already running on the server?** If not, its first deploy comes first: 📖 `references/first-deploy.md`.
- **The subdomain.** Default to the project's name without punctuation (`simplyrozie`). It is what buyers and users type, so ask when the name is not obvious.
- **Does it store uploads?** Grep the app for its upload disk (`FILESYSTEM_DISK`, `MEDIA_DISK`, `Storage::disk`, medialibrary `useDisk`). No uploads, or uploads nobody needs to survive the server: skip R2 entirely. Server volumes are not backed up, so user photos and documents do need it.
- **Is there an old host** (sslip.io, a raw IP, a previous domain) that people already have links to?

## 1. DNS

The umbrella zone normally carries `A *` to the VPS, DNS only, so a new subdomain already resolves: check with `dig +short <name>.<umbrella> @1.1.1.1` and skip to step 2 when it returns the server's IP. When it does not, walk the owner through it one click at a time:

1. **Cloudflare → Domains → the umbrella domain → DNS → Records → Add record.**
2. Type `A`, Name `<name>`, IPv4 the server's IP, Proxy status **off** (grey cloud, "DNS only"), Save.
3. Send a screenshot of the Records list. Check it, then `dig` again.

If the whole zone is gone from the account, stop and ask what changed. Grey lets Traefik's Let's Encrypt issue the certificate itself; orange (proxied) is untried here and needs SSL mode Full (strict), since Flexible loops redirects.

The bare umbrella domain and `www` are reserved for a future landing page listing the projects (Syafiq, 25/11/2026), never a project; the `*` record does not cover the bare name. Building that page is a separate job.

## 2. Route the new host, redirect the old one

The routing lives in the app's `docker-compose.yml` on the server, outside the repo. Back it up and `.env.production` first (`cp -p x x.bak-$(date +%Y%m%d-%H%M%S)`).

- Main router rule becomes `Host(`<name>.<umbrella>`)` only.
- The old host, if there is one, gets its own router on the same service with a permanent `redirectregex` middleware: 📖 `references/redirect-labels.md` for the exact labels, their YAML quoting, and how to edit server files safely.
- Set `APP_URL` to the new address in `.env.production`.
- `docker compose config --quiet`, then `docker compose up -d`, then wait for healthy: `for i in $(seq 30); do [ "$(docker inspect -f '{{.State.Health.Status}}' <container>)" = healthy ] && break; sleep 2; done`. Then the app's cache rebuild (Laravel: `php artisan optimize` as the app user), since a recreate drops caches built into the image.

Serving pages on two hosts is the trap. Many apps build canonical, hreflang and sitemap URLs from the request host, so the old host names itself canonical and Google sees two sites. One host serves, the rest 301. A new project avoids it altogether by deploying on its final subdomain from the start (Syafiq, 25/11/2026).

## 3. Verify from outside

Check each claim with `curl` from this Mac, never from the server: `curl -s -o /dev/null -w '%{http_code} %{ssl_verify_result} %{redirect_url}\n' <url>` for status, certificate and redirect target, and `curl -s <url> | grep -o '<link rel="canonical"[^>]*>'` for the canonical.

- the new host returns 200 over https, and the certificate verifies (`%{ssl_verify_result}` is 0)
- the old host over https returns 301 to the new host with path and query kept; over http, follow it through (`curl -sIL -o /dev/null -w '%{url_effective}\n' http://<old>/x?y=1`) and the final URL is the new host's
- the page's `rel="canonical"` and the sitemap use the new host
- search hiding is unchanged (`robots.txt`, `noindex`) unless the owner chose to open it
- the login page loads, and anyone with an open admin session knows to sign in again: cookies are per host

## 4. R2, only when the app stores uploads

📖 `references/r2.md` for the click path, collecting the keys (never through the chat), the write proof, the file copy and the disk switch.

## 5. Record it

Update the project's deployment task doc (live address, photo host, where the routing lives, backups) and its `CLAUDE.local.md` (live URL, env keys by name, bucket and token names). If the umbrella domain, server or zone changed, update `#side-domain` in the global `CLAUDE.md`. A worked run with real figures: 📖 `references/example-simply-rozie.md`.

## Later in a project's life

- **A dedicated domain for one project:** add it as its own zone in the same Cloudflare account (R2 needs that for a custom photo domain), give it the main router, and keep `<name>.<umbrella>` as a 301 like any old host.
- **Retiring a project:** 📖 `references/retire.md`.
