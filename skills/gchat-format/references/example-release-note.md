# Worked Example — Changelog → Google Chat Release Note

Open this when you have a changelog block in hand and want to see the whole transformation end-to-end: the regroup-by-feature restructure, the syntax conversion, and the fencing, applied together on one input.

## Input (a typical CHANGELOG section)

```markdown
**Release — 2026-03-27**

### Added
- **Platform fee invoices** — auto-generated when tenants pay rent
- Batch generation command (`platform-fees:generate`)

### Changed
- Statements sidebar replaced by Finances group

### Fixed
- Platform fee invoice total ignored partial payments
```

## Output

```
*Release - 2026-03-27*

Landlords now get platform fee invoices generated automatically when a tenant pays rent - previously these were raised by hand at month end.

* Invoices are created automatically on each rent payment
* Totals now account for partial payments correctly
* Batch generation available for back-filling (platform-fees:generate)

*Also in this release*
* Statements sidebar replaced by the Finances group
```

## What this example demonstrates

| Move | Why the output looks like this |
|---|---|
| The `Added`/`Changed`/`Fixed` headings are gone | Those sort by what the change did to the CODE. The reader wants to know what the release IS. |
| The `Fixed` row moved UP under the feature | "Totals ignored partial payments" reads as "this feature now works properly" — it belongs with the feature, not beside it. |
| A prose lead opens the note | It names what a user can now do and what they couldn't before. Without it, every bullet is a peer and the note has no shape. |
| The unrelated sidebar change is demoted | A catch-all keeps it present without competing with the headline. |
| Backticks are stripped inside the fence | Chat renders nested inline code as literal `` ` `` characters. |

⚠️ **The before-state sentence is the one a changelog never gives you.** "Previously these were raised by hand at month end" came from the task doc, not the source. Ask for it or pull it from the doc — it is what makes the rest legible.
