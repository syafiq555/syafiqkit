# Derivability Gate Examples

## What to cut (reader can reconstruct)

- Directory/file layouts (structure is discoverable)
- Tech stack and dependency lists (declared in manifests)
- Standard build/test commands (tool defaults are documented)
- API signatures and types (source code is canonical)
- Architecture tours that read like a README (codebase is self-describing)
- Generic best practices (the model already follows them)
- Rules enforced by hooks/lint/CI (the config is canonical, not this file)

## What to keep (reader cannot derive)

- **Gotchas** — code can't explain what makes it dangerous
- **Design rationale** — source doesn't say *why* it's this way
- **Non-standard conventions** — exceptions to language/tool defaults need naming
- **Agent directives and safety prohibitions** — must be resident, never lazy-load
- **Workflow etiquette** — branch naming, PR titles, commit process aren't in the code
- **Domain glossaries** — terminology meanings need explicit definition
- **Non-guessable invocations** — where the exact form IS the knowledge and no amount of reasoning recovers it: a project's test script that isn't the tool's default name, a flag set that took debugging to find, a retry scoped to one exit code. The bar is that a reader who knows the tool would still get it wrong, not that you happened to type it this session
- **Routing information** — "`@path/to/import` for this type", "guidance at X"
