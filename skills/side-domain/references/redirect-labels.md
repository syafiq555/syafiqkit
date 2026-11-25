# Redirect labels for the old host

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
      - "traefik.http.services.<app>.loadbalancer.server.port=80"
```

Why each part is the way it is:

- **Single quotes** around the regex and replacement lines: YAML keeps the backslashes literal there, while a double-quoted string would need them doubled.
- **`$${1}`**: Compose reads `$` as a variable, so `$$` passes one literal `$` to Traefik (Traefik's docs: "all dollar signs need to be doubled for escaping").
- **`permanent=true`** returns 301 for GET and 308 for other methods (Traefik's `redirect.go`), so a form POST to the old host is redirected as a POST. A logged-in admin still signs in again on the new host, because cookies are per host.
- **`.service=<app>`**: a router with a middleware still needs a service; naming it avoids depending on Traefik's single-service default.
- **`websecure` only** is enough when the server's Traefik already upgrades `web` (port 80) to https globally: check with `curl -sI http://<old>/` (301 to `https://<old>/`, then the middleware's 301). If it returns 404, add the same router on `web` too.
- Validate before recreating: `docker compose config --quiet` fails on a quoting slip instead of leaving the app unrouted.

Moving to yet another domain later: give the newest host the main router, and add the previous one to a redirect router the same way (one router per old host, or `Host(a) || Host(b)` in the old router's rule with a regex matching both).
