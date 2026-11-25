# Worked run: Simply Rozie, 25/11/2026

A Laravel 13 shop with Filament admin and spatie medialibrary photos, already live at `simply-rozie.72.62.194.9.sslip.io` on the Hostinger VPS, hidden from search engines.

| Step | What happened |
|---|---|
| Domain | Owner bought `auraa.stream` on Cloudflare Registrar (renews at US$5.18 a year) as the umbrella for every side project. DNS `A simplyrozie` and `A *` → `72.62.194.9`, DNS only. `dig` resolved both within a minute |
| R2 | Bucket `simply-rozie` (APAC, Standard), custom domain `simplyrozie-photos.auraa.stream`, token `simply-rozie-app` (Object Read & Write, this bucket only). Keys came in at 32 and 64 characters |
| Server | `.env.production`: `APP_URL`, five `R2_*` keys, then `MEDIA_DISK=r2` after a test write and read passed. Backups `*.bak-20261125-141258` |
| Photos | 3 media rows, 9 files (each original plus a `card` and a `large` WebP), copied with sizes compared; rows set to `r2` |
| Redirect | Added after the owner asked whether SEO was fine: the old host was still serving pages with itself as canonical. Old home and `/en/koleksi?x=1` then returned 301 with path and query |
| Checks | New host 200 with a valid certificate; photo URLs 200 from the photo host; `robots.txt` still `Disallow: /`; canonical and sitemap on the new host; plain http on both hosts upgraded first |

What the run got wrong first, and the skill now does up front: the redirect came only after the question about SEO, and the move script was run as `tinker <file>`, which ran nothing.

The project's own record: simply-rozie's `tasks/infrastructure/deployment/current.md`.
