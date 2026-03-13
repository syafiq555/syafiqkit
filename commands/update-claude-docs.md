---
description: Capture patterns/gotchas from coding sessions into CLAUDE.md files. Use after implementing features, fixing bugs, or when session revealed reusable knowledge.
argument-hint: "[optional: focus area]"
---

# Capture Session Knowledge

Extract reusable patterns from this session into CLAUDE.md files.

## 1. Scan — What happened?

Look for these signals in the conversation:

| Signal | Category |
|--------|----------|
| User correction ("not X, it's Y") | Gotcha or Convention |
| Claude struggled / repeated attempts | Gotcha |
| Claude ignored existing rule | **Violation** |
| Same pattern used 2+ times | Pattern |
| Environment surprise | Gotcha |
| Convention preference | Convention |
| Debugging root cause discovered | Gotcha |
| Team/strategy context | Context → `CLAUDE.local.md` |

For each signal, extract 2-3 keywords and **grep all CLAUDE.md files**:

| Grep result | Classification |
|-------------|---------------|
| No match | **New** — add entry |
| Match in correct file | **Violation** — must refine (see Step 3) |
| Match in wrong file | **Misplaced** — move to correct scope + refine |

## 2. Route — Where does it go?

Find the **most specific** CLAUDE.md (`Glob: **/CLAUDE.md` + check `CLAUDE.local.md`):

1. Personal/team context → `./CLAUDE.local.md` (project root)
2. Same domain as modified files → that domain's CLAUDE.md
3. Layer-level (`app/CLAUDE.md`, `resources/js/CLAUDE.md`)
4. Project root `CLAUDE.md`
5. Global `~/.claude/CLAUDE.md`

**Read target first** — check structure, existing entries, where new entry fits.

## 3. Write — Hard rules

### New signals → Add entry

- Gotchas: `Symptom | Cause | Fix` table row
- Guidance: `❌ NEVER | ✅ ALWAYS` table row
- Patterns: Prose + code (reusable only)
- Pair every prohibition with an alternative ("don't X" needs "do Y instead")

### Violations → Step back and rethink the rule

The rule was violated — something about it didn't work. Before touching it, ask:

> **"If someone with zero context read this rule, would they follow it correctly?"**

If no — figure out why. Too long? Too vague? Too many rows saying the same thing? Missing the "do Y" half? Covers edge cases nobody hits but misses the common case?

Rewrite for **concise but precise**. One hard constraint beats five soft guidelines. A number beats a paragraph. Then decide: edit, condense, or leave as-is (with a one-line justification why the rule is actually clear and the violation was a one-off).

### Constraints

- No duplicates across CLAUDE.md files
- Route to narrowest scope
- One refinement round per signal, then move on
- Use `Edit` tool (not `Write`)

## 4. Prune — Delegate to Haiku agent

After Steps 1–3, launch a **Haiku agent** (`model: haiku`) to prune all CLAUDE.md files touched during this session. Include the file paths in the prompt.

**Agent prompt**:

> Scan these CLAUDE.md files for staleness and bloat. For each file:
> 1. Read the file
> 2. Read the project root CLAUDE.md (authoritative source for conventions)
> 3. Apply the smell table below — edit or delete stale content
> 4. After pruning, run `wc -l` — flag if >350 lines
>
> | Smell | Action |
> |-------|--------|
> | One-time fix commands (e.g., `fix-february-sst`) | Move to task doc or delete |
> | Historical SQL fix blocks | Move to task doc |
> | Implementation snippets showing "how code works" | Delete — CLAUDE.md is constraints, not docs |
> | "Works correctly, verified" notes | Delete — not a constraint |
> | Contradictions with root/global CLAUDE.md | Fix to match authoritative source |
> | Validation backlog / TODO items | Move to task doc or issue tracker |
> | File/directory listings inferrable by LSP/Glob | Delete |
> | Completed migration / resolved incident refs | Delete unless still a live risk |
>
> Files to scan: [list paths here]

## 5. Validate

After writing each entry (in Step 3):
1. Re-grep keyword — confirm no duplicate created
2. Count `|` separators — must match table header
3. "Would removing this cause Claude to repeat the mistake?" — if no, delete it

**Task docs ≠ CLAUDE.md**: Feature-specific patterns stay in `tasks/**/current.md`. Only patterns that apply broadly go in CLAUDE.md.

## 6. Agent Sync

Agents read CLAUDE.md dynamically — no sync needed for gotchas. Only run `syafiqkit:agent-setup` if agent behavioral instructions change.
