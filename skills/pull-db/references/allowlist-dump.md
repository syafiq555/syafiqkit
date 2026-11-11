# Allowlist dump: copying a client database without its personal data {#allowlist-dump}

Use when the project forbids client personal data on this machine. The goal is a local copy that behaves like the server (settings, catalogue, pages, configuration) while nothing person-shaped ever crosses the wire.

## Why an allowlist, not a denylist {#why-allowlist}

A denylist ("skip `users`, `orders`") silently passes every table a plugin adds next month, and personal data leaks through the gap with nothing failing. An allowlist inverts the default: a table you did not name arrives empty. So:

1. Dump the **structure** of every table (`--no-data`), so the app still boots locally.
2. Dump **data** only for tables you named as non-personal (taxonomy, configuration, catalogue lookups, shipping zones, tax rates).
3. Dump the mixed tables (`posts`, `postmeta`, `options` in WordPress; their equivalents elsewhere) with a `--where` filter.

## The mixed tables {#mixed-tables}

| Table | Keep | Drop |
|---|---|---|
| posts | an allowlist of content types (pages, products, menu items, the app's own content types) | orders and refunds, revisions, privacy requests, form entries, anything carrying an email as its title |
| postmeta | meta of kept posts | keys that hold a person: coupon `_used_by` and `customer_email`, `_billing_*`, `_customer_user`, review-photo markers |
| options | everything else | transients, cron, and any name matching `secret\|token\|oauth\|licen[sc]e\|password\|_pass$\|api_?key\|private` |

Copied images and files are personal data too when customers uploaded them (review photos). A file path found inside content must `realpath` inside the uploads root, skip private, log and download folders, and skip uploads flagged as customer photos, including WordPress's unrecorded originals (a `photo-scaled.jpg` attachment keeps `photo.jpg` beside it).

## Proving the dump finished {#prove-finished}

`sh` on Debian and Alpine images is `dash`, which has no `pipefail`, so in `{ dump1; dump2; } | gzip` a failed dump ends the left side and the pipeline reports gzip's success: an empty-tabled copy imports cleanly. Write the dump to a file, append a marker line (`-- dump complete`), then gzip, and refuse to import unless the last line is the marker.

## After import {#after-import}

Before anyone uses the copy, grep it for what should not be there: email addresses outside the company's own domains, IC or national-ID and phone patterns, review-photo files. Fix the filter and re-run rather than deleting rows by hand, so the next pull stays clean. Report what was kept and what was left empty, not just a table count.

Writes on the server stay inside one temporary directory that a `trap` removes on exit, including when the download fails.
