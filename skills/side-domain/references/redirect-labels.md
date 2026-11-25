# Redirect labels for the old host

**Editing server files:** write a small script locally (the `Write` tool; Python `str.replace` with an `assert` that the old line exists, and a timestamped copy first), send it with `remote --scp <server> /tmp/x.py --to /tmp/x.py`, run it with `remote <server> "python3 /tmp/x.py" </dev/null`, then delete it on both sides. A long quoted one-liner breaks on nested quotes and `$` escapes, and the harness may refuse to run it.

Change the main router's rule and add the old-host lines; leave every other label as it is (`traefik.docker.network`, the service port the app really uses, health checks). `<app>` is the router and service name already in the file; `<old>` is the old host, `<new>` the new one. The block below shows the relevant lines in place, not a file to paste over.

```yaml
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.<app>.rule=Host(`<new>`)"
      - "traefik.http.routers.<app>.entrypoints=websecure"
      - "traefik.http.routers.<app>.tls.certresolver=letsencrypt"
      - "traefik.http.routers.<app>-old.rule=Host(`<old>`)"
      - "traefik.http.routers.<app>-old.entrypoints=websecure"
      - "traefik.http.routers.<app>-old.tls.certresolver=letsencrypt"
      - "traefik.http.routers.<app>-old.service=<app>"
      - "traefik.http.routers.<app>-old.middlewares=<app>-to-new"
      - 'traefik.http.middlewares.<app>-to-new.redirectregex.regex=^https://<old with every . as \.>/(.*)'
      - 'traefik.http.middlewares.<app>-to-new.redirectregex.replacement=https://<new>/$${1}'
      - "traefik.http.middlewares.<app>-to-new.redirectregex.permanent=true"
      - "traefik.http.services.<app>.loadbalancer.server.port=<port>"
```

Why each part is the way it is:

- **Single quotes** around the regex and replacement lines: YAML keeps the backslashes literal there, while a double-quoted string would need them doubled.
- **`$${1}`**: Compose reads `$` as a variable, so `$$` passes one literal `$` to Traefik (Traefik's docs: "all dollar signs need to be doubled for escaping").
- **`permanent=true`** returns 301 for GET and 308 for other methods (Traefik's `redirect.go`), so a form POST to the old host is redirected as a POST.
- **`.service=<app>`**: a router with a middleware still needs a service; naming it avoids depending on Traefik's single-service default.
- **`websecure` only** is enough when the server's Traefik already upgrades `web` (port 80) to https globally: check with `curl -sI http://<old>/` (301 to `https://<old>/`, then the middleware's 301). If it returns 404, add the same router on `web` too.
- Validate before recreating: `docker compose config --quiet` fails on a quoting slip instead of leaving the app unrouted.

Moving to yet another domain later: give the newest host the main router, and add the previous one to a redirect router the same way (one router per old host, or `Host(a) || Host(b)` in the old router's rule with a regex matching both).
