---
name: docs-adoption-agent-rows-vs-template-drift
description: After setup-project-docs adoption, "agent-setup ran" may mean only a Bootstrap row was added while the generated agent still lacks template capabilities (claude-md-pruner docs/ branch)
metadata:
  type: project
---

2026-10-07 review of the adopted docs/ set: the task doc said `/agent-setup` ran, but diffing `.claude/agents/claude-md-pruner.md` against its template showed the template already carried the docs/-set branch, the `[TBD]`-tag never-remove item and a docs/ description clause that the agent file lacked. A row alone does not close agent-setup Step 5's "missing capability = repair".

**How to apply:** when a doc-set adoption claims agents were re-bootstrapped, grep the generated agent for the capability the new row promises (not just the row), and diff against the template.
Also: essentials restating CLAUDE.md had its "CLAUDE.md wins" precedence only in the task doc, not in the essentials file or the CLAUDE.md index.
