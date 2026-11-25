# Retiring a side project

Take a project down so nothing half-alive is left on the server or in Cloudflare.

1. **Container:** in `/opt/apps/<app>/`, `docker compose down` (add `-v` only once its volume is confirmed backed up or worthless), then move the folder to `/opt/apps/_retired/<app>-<date>/` rather than deleting it.
2. **Routing:** the labels go with the container. The `*` record still resolves the name, so Traefik now answers it with a 404, which is the expected end state. An old host that redirected to this project needs nothing; it 404s the same way.
3. **Database:** dump it (`mysqldump` from the shared MySQL container) into the retired folder, then drop the database and its user.
4. **R2:** keep the bucket and ask the owner each time before deleting it (Syafiq, 25/11/2026): photos cannot be recovered once gone. Revoke the project's API token now either way (**R2 → Manage API Tokens**), and remove the bucket's custom domain if the project's pages are gone.
5. **CI:** disable the repo's deploy workflow or archive the repo, so a stray push cannot redeploy it.
6. **Record:** mark the project's deployment task doc retired with the date and where the dumps sit.
