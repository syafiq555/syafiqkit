# Agent Sync — When a CLAUDE.md Change Needs an Agent Edit

Read when a capture pass has landed and you are deciding whether any `.claude/agents/*.md` file needs touching. The default answer is no.

**Default: skip this section.** Agents read CLAUDE.md dynamically via Bootstrap, so most additions need no agent changes. Re-deriving agent tables from CLAUDE.md re-introduces the duplication the architecture exists to avoid.

**Apply this section only if one of these signals fired in this session:**

| Signal | Action |
|--------|--------|
| Reviewer flagged something you verified as intentional/correct (recurring false positive) | Add one row to `code-reviewer.md` → "Known False Positives" (pattern + why correct) |
| Simplifier collapsed a guard/workaround you want preserved | Add one row to `code-simplifier.md` → "Don't Simplify (Preserve These)" |
| A new high-frequency mistake class emerged that belongs in an agent's zero-latency table (not just any gotcha, but top-~15 rank) | Add row to reviewer/simplifier → "High-Frequency Mistakes" / "High-Impact Simplifications" |
| Agent misbehaved (audited wrong scope, checked wrong source, ignored a Bootstrap step) | Fix the agent's Process/Constraints section (behavioral correction) |
| A sibling repo entered the session | Add `⚠️ Two-repo session` banner + second Bootstrap table to both agents + tag sibling rules |

For any match: use `Edit` tool for surgical additions (one row, one banner) — never rewrite whole tables. Inline the row even if CLAUDE.md also has the fact (agent table = zero-latency guard; CLAUDE.md = full explanation). Structural changes (new section, new repo ruleset) require `syafiqkit:agent-setup`, not hand-edits.

---

