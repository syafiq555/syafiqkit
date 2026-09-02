# Derivability Gate Examples

## What to cut (reader can reconstruct)

- Directory/file layouts (structure is discoverable)
- Tech stack and dependency lists (declared in manifests) — but see the divergence case below: this holds only while the manifest and the running app agree
- Standard build/test commands (tool defaults are documented)
- API signatures and types (source code is canonical)
- Architecture tours that read like a README (codebase is self-describing)
- Generic best practices (the model already follows them)
- Rules enforced by hooks/lint/CI (the config is canonical, not this file)

## What to keep (reader cannot derive)

- **Gotchas** — code can't explain what makes it dangerous
- **Design rationale** — source doesn't say *why* it's this way
- **Non-standard conventions** — exceptions to language/tool defaults need naming
- **A declared dependency that isn't actually wired** — the inverse of the cut-rule above, and it fails in the direction the gate can't see. Reading a manifest is what makes a stack "derivable", so a package declared and never loaded derives *wrongly*: `vite`, `tailwindcss` and `alpinejs` in a `package.json` whose app ships Bootstrap and jQuery off static files, with no `@vite` directive anywhere and no build output (measured 2026-09-01). Nothing errors — a Tailwind class or an `x-data` directive simply does nothing — so the reader has no symptom to search on, which is exactly the bar for keeping a line. Write which tools are inert and what actually loads them; the manifest cannot say it and the absence of a build output is not something a reader thinks to check
- **Agent directives and safety prohibitions** — must be resident, never lazy-load
- **Workflow etiquette** — branch naming, PR titles, commit process aren't in the code
- **Domain glossaries** — terminology meanings need explicit definition
- **Non-guessable invocations** — where the exact form IS the knowledge and no amount of reasoning recovers it: a project's test script that isn't the tool's default name, a flag set that took debugging to find, a retry scoped to one exit code. The bar is that a reader who knows the tool would still get it wrong, not that you happened to type it this session
- **Routing information** — "`@path/to/import` for this type", "guidance at X"
