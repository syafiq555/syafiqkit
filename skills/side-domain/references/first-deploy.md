# First deploy of a new app on the VPS

Read the shared server's own record first: it lives in the repo that first set the server up, named in the global `CLAUDE.md` `#side-domain` (for Syafiq's Hostinger VPS, `syafiq555/lhdn-management`'s `tasks/infrastructure/deployment/current.md`, § Adding Another App and § Critical Gotchas; look for a checkout beside the project, else clone it under `~/herd/`). What a new app on that box needs, as the existing apps do it:

| Part | What it is |
|---|---|
| App folder | `/opt/apps/<app>/` holding `docker-compose.yml`, `deploy.sh` and `.env.production` (mode 600), none of them in the repo |
| Compose | one service, `container_name: <app>-app`, image from GHCR, `env_file: .env.production`, a named volume over the app's storage, external networks `web` (Traefik) and `database` (shared MySQL), Traefik labels for the router, `mem_limit` sized to the box |
| Database | its own database and user in the shared MySQL container |
| Image | CI builds and pushes `ghcr.io/<owner>/<app>`; the deploy job SSHes in and runs `deploy.sh` (pull, `up -d`, wait healthy, migrate, cache rebuild) |
| php-fpm (PHP apps) | a `php:*-fpm` image listens on 9000 on every interface, so any container on the shared networks could run code in it: bind it to `127.0.0.1:9000` with a `php-fpm.d` override, as every app on that box does |
| Health | a health route Traefik and Docker can poll (Laravel's `/up`; any stack needs one that returns 200 without a login) |

Start the app on its temporary sslip.io host (`<app>.<ip>.sslip.io`) only if the real subdomain is not ready; otherwise give it `<name>.<umbrella>` from the first deploy and skip the redirect step.

Simply Rozie's server files are a worked set: 📖 `example-simply-rozie.md`.
