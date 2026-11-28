# Build details

Config columns, roles and options for `scripts/build_tracker.py`, the pull-back command, and the table style. Read this when writing or changing a config, or pulling typed rows back from a live sheet.

Every column has a `role` (`no`, `ask`, `type`, `status`, `next`, `needed`, `latest`, `updated`, `history`, `raised_by`, `raised`, `closed`), or none for a plain extra column. The formulas and the script find columns by role, so headers can be in any words and any order. `no`, `ask` and `status` are required, and so are `statuses`, `columns` and `closed_status` (one status name or a list). The overdue count and the red rule need `needed`, and `stale_rule` needs `updated`; the script refuses a config that asks for one without the other.

Other options: `new_status` (filled in when someone types a new ask), `stale_rule` (a list of status and days), `history_date_pattern`, `unknown_editor_label` and `status_change_line` (the History wording, for non-English sheets), and `domain_names` (an email domain to the name History shows, such as `{"agency.com": "Agency"}`).

A count with `"span": 2` takes two columns when its label would clip. `"summary": true` (or `{"title": "..."}`, needing a `type` column) adds a Summary tab: a pivot with Type down the side and Status across, counting asks, the at-a-glance check owners keep beside a tracker. A status column appears only once a row has that status. A `--replace` rebuild re-points every pivot that read the old tab, whoever made it, since a pivot reads its source by sheet id and would otherwise break. A key the script doesn't know draws a warning and is otherwise ignored, so anything it names has to be built by hand.

`python3 -I "${CLAUDE_SKILL_DIR}/scripts/pull_tracker.py" my-tracker.json <spreadsheetId>` reads the main tab and every extra tab as displayed (formula cells such as a `=HYPERLINK` link keep their formula) into `sample_rows` and `extra_tabs[].sample_rows`, keeps the file's own indent, and warns about rows with no number (`--dry-run` reports counts only). Run it after any session that edits the live sheet too, so the config in the repo matches what the client reads. A rebuild writes plain text, so formatting set by hand inside a cell is lost; put it in the config instead (`person_colours`, `font`), which the build applies every time.

With `--into`, the target sheet's own time zone is used, and extra tabs are skipped (with a warning).

It wraps the rows in a minimal Google Sheets Table (filter buttons on every heading, dropdown chips; its styling is in `sheets-api-gotchas.md`), with a spacer row so the table's name label doesn't cover the counts. `"table": false` builds a plain sheet instead.
