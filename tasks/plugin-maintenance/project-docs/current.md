<!--LLM-CONTEXT
Status: ✅ Doc set shipped as 1.363.0 on 2026-10-07 (84fc1b3 on origin/master); only the git-sourced install check remains
Domain: plugin-maintenance/project-docs
Gotchas: `[SOURCED]`/`[INFERRED]`/`[TBD]` tags and `[TBD]` headings in the set are content, not scaffolding — pruners must not strip them
Related:
  - ../doc-condensation/current.md (sibling — one-fact-one-home; this set must not restate CLAUDE.md rules it already owns)
  - ../agent-architecture/current.md (sibling — Bootstrap tables in generated agents)
  - ../mod/current.md (sibling — the ESSENTIALS entry `{#mod-one-file}` and ARCHITECTURE §8 host-API traps extract the mod)
Last updated: 2026-10-07
-->

# Plugin Maintenance — Project Docs

## Quick Start (read this first in next session)

**Next action**: 1.363.0 is shipped. List a git-sourced install to settle whether `docs/` ships.**Current state**: All Next Steps from the first pass are done, at 1.363.0 in both manifests. The seven generated agents carry a Bootstrap row to the docs; `claude-md-pruner` also covers `docs/` and protects the tags. `product-reviewer`'s row cites the PRD only, on purpose (completeness reviewer, not a silent-rule checker). Essentials holds 20 entries, each tagged with the `CLAUDE.md` section it extracts. `plugins/vue-lsp/` is removed. Nothing was measured against a git-sourced install.
**Success looks like**: A session opening this repo reads `docs/ARCHITECTURE-ESSENTIALS.md` whole before its first edit, and agents bootstrap from the same files.

## Overview

The plugin's core doc set: `docs/PRD.md` (Shape Up pitch plus standard PRD sections), `docs/ARCHITECTURE.md` (arc42 with an ASCII context diagram, runtime views and glossary), `docs/ARCHITECTURE-ESSENTIALS.md` (rules that break silently in one line), `AGENTS.md` (pointer to `CLAUDE.md`), and a "Project Docs" table in `CLAUDE.md`. Derived from `README.md`, `CLAUDE.md`, `CLAUDE.local.md`, the manifests, the hook and the six task docs under `tasks/plugin-maintenance/`. Precedence when they disagree: task doc over derived view, files themselves over both.

## Key Technical Decisions

| Decision | Reasoning |
|---|---|
| ARCHITECTURE uses arc42 | Serves several audiences; the plugin's real subject is when an instruction reaches a reader, which sections 4 and 6 carry |
| PRD keeps metrics and roadmap as `[TBD]` headings | Repo records no targets or dates; silent omission would hide the gap |
| Essentials cites rules by heading name, never number or count | Insertions would silently stale numeric citations |
| Tags `[SOURCED]`/`[INFERRED]`/`[TBD]` are protected from pruners | They are the only record of what is derived; `condense-*` and `claude-md-pruner` read them as unverified markers |
| Exact skill counts omitted | Decay on the next commit; `ls skills` re-derives |
| Essentials is a set of extracts of `CLAUDE.md` rules; `CLAUDE.md` wins | Two homes for a rule will drift. Accepted because essentials must be readable whole by an agent about to edit; mitigated by a header line in essentials and a clause in the `CLAUDE.md` index saying a changed rule changes its extract |
| Placing a rule is a §8 judgement; renumbering and reload-trigger-test stay in essentials | They pass essentials' own admission test (one line, silent) and §8 is not read before an edit; restored after product review, reversible |
| Bump 1.363.0 with CHANGELOG | User's call: agent rows ship in the repo, and "every change is a bump" holds |
| `plugins/vue-lsp/` removed | No manifest, setting or doc wired it up; owner unknown, user chose removal |
| `docs/` shipping stays unverified | The local marketplace is a `directory` source, so its cache is a working-tree copy and proves nothing; check a git-sourced install |

## Gotchas

| Issue | Rule |
|---|---|
| A pruning or condense pass strips the tags | Name them as protected when invoking any pass on `docs/` |
| Hand-run cleanup obeys no pruner guard | State the tag convention in the invocation |

## Next Steps

### Blocking handoff
- [x] 1.363.0 pushed 2026-10-07: `git ls-remote origin master` returned 84fc1b3 matching local HEAD; GitHub's `docs/` listing shows the three files and `plugin.json` reads 1.363.0
- [ ] 🟡 Agents' task-doc rows enumerate feature folders and omit `skill-authoring` and `project-docs`; this predates the set and was left alone (`update-plugin`'s routing row was fixed)

### Blocked on a decision from Syafiq
- [ ] 🟠 Do `docs/` files ship to marketplace consumers? The local marketplace is a `directory` source, so its cache copies the working tree (it held `docs/` and `tasks/`) and proves nothing. List a git-sourced install after the release. `tasks/**` stays recorded as not shipped until then
- [ ] 🟡 Success targets for ruleset adherence and skill auto-fire (PRD metrics): kept `[TBD]`

### Deferred / accepted
- [ ] 🟡 Roadmap left `[TBD]`; open work currently lives in task-doc Quick Starts only
