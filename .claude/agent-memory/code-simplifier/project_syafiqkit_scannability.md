---
name: project-syafiqkit-scannability
description: syafiqkit plugin — a deleted ❌Never/✅Always recap table or a flattened numbered checklist is a structural regression, not prose tightening, even when every fact survives in body text
metadata:
  type: project
---

In the syafiqkit plugin repo (`~/.claude/plugins/syafiqkit`), this project's CLAUDE.md Prompting Techniques table prescribes a `❌ Never / ✅ Always` table specifically for "commands that make routing/write decisions" — `merge-task-docs`, `condense-task-doc`, and similar multi-step write skills. When reviewing a rewrite of these files, a wholesale deletion of that recap table (replaced by folding its content into step-by-step prose above) is a scannability regression even when every individual fact is still present in body text — the table served as an at-a-glance summary distinct from the linear Workflow steps, and losing it means a reader must re-read the whole file to reconstruct "what are the N things not to do."

Same principle for numbered checklists inside a single paragraph/bullet: when 3+ items are independently substantial (each with its own multi-sentence explanation) rather than short parallel clauses, collapsing them into one run-on sentence with semicolons ("work out: X (...); Y (...); and Z. For the last one, ...") loses the ability to check items off individually mid-task, even though nothing was cut content-wise.

**Why:** Found during a post-unhobble cleanup pass (2026-08-01) — an `unhobble-instructions` rewrite of 8 sibling SKILL.md files deleted `merge-task-docs`'s 10-row Rules table entirely (replaced with only a 2-sentence "Renaming a folder" section covering 1 of the 10 rows) and flattened `ship/SKILL.md` Step 3's "1. which branch / 2. is there a gate / 3. what rides along" pre-push checklist into one dense paragraph. Verified via `git show HEAD:<path>` that every fact from the deleted table was still present somewhere in body prose — so this wasn't a content-loss bug, it was a structure-loss one that a naive "does every fact survive" check would miss.

**How to apply:** When reviewing any rewrite of a syafiqkit skill (or diffing an unhobble/condense/simplify pass against `git show HEAD:<path>`), don't stop at "is every fact still present somewhere" — also check whether a `❌/✅` table or numbered checklist that existed at HEAD was deleted/flattened, and if so, restore an equivalent structure matching this repo's own established shape (see `[[project-syafiqkit-madr-conventions]]` for the sibling MADR/D-N conventions this repo also treats as load-bearing structure, not prose).
