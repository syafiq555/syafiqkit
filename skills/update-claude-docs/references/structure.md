# CLAUDE.md Structure Reference

The canonical structure + best-practice rules for creating, rewriting, or auditing a CLAUDE.md. SKILL.md's `create` and `rewrite` modes read this file; `capture` mode uses only the Routing and Capture-filter sections.

## Table of contents

1. The hierarchy (which file loads when)
2. The capture filter (what belongs in CLAUDE.md at all)
3. Section taxonomy (what sections, in what order)
4. Formatting conventions (the house style)
5. Template family (structure by file type)
6. Routing over-budget content (three structural levers)

---

## 1. The hierarchy — which file loads when {#hierarchy}

CLAUDE.md files are **concatenated additively**, filesystem-root → cwd. For *conflicts*, most-specific wins. Subdir files load **lazily** — only when Claude reads a file in that subdir — so a rule pushed down a level is scoped, not hidden.

| Scope | Path | Loads | Persist after `/compact`? |
|-------|------|-------|---------------------------|
| Managed policy | `/Library/…/ClaudeCode/CLAUDE.md` (macOS) | Always, can't exclude | N/A |
| **User (global)** | `~/.claude/CLAUDE.md` | Every session, ALL projects | Always |
| **User rules** | `~/.claude/rules/*.md` | Every session; loaded before project rules | Always |
| **Project root** | `./CLAUDE.md` **or** `./.claude/CLAUDE.md` | Every session in project | ✅ YES |
| **Project rules** | `./.claude/rules/*.md` (no `paths:`) | Every session, same priority as `./.claude/CLAUDE.md` | ✅ YES |
| **Path-scoped rules** | `./.claude/rules/*.md` with `paths:` frontmatter | ⚠️ Every session, in full — the glob does **not** gate loading (see below) | ✅ YES (loads like any rule file) |
| **Layer** | `./app/CLAUDE.md`, `./react/CLAUDE.md` | Lazily, when touching file under it | ❌ NO (reloads) |
| **Subdir / domain** | `./app/Domain/X/CLAUDE.md` | Lazily, when touching file under it | ❌ NO (reloads) |
| **Local** | `./CLAUDE.local.md` | Every session, appended *after* `CLAUDE.md` at each level | Always |
| **Companion** | `./.claude-companions/<shared\|local>/CLAUDE-*.md` | Never (manual pointer only) | Always, but hidden |
| **Auto memory** | `~/.claude/projects/<project>/memory/MEMORY.md` | Every session, first 200 lines / 25KB | Written by Claude, not you |

⚠️ **A `paths:` glob does not keep a `.claude/rules/` file out of context — the file loads in full every session, and the glob only influences whether the model acts on it.** Re-confirmed interactively on CLI 2.1.235: the session's own UI printed `Loaded .claude/rules/_probe-convention.md` and the reply quoted the rule's contents back by full path, while *declining to apply* the convention because the file looked like a probe rather than real project guidance. Loading and obeying are two different things, and only the first is what a context budget cares about — the tokens are spent whatever the glob says, and the scoping a reader thinks they bought isn't there. Route file-type-scoped rules to a **real subdirectory `CLAUDE.md`**, which does genuinely scope. Reach for `.claude/rules/` where you want content loaded every session regardless, its value being organisation rather than savings — the same standing as an `@path` import. `claudeMdExcludes` and rule symlinking are separate features, unaffected.

⚠️ **Measuring this by asking a session what it knows does not work, and the failure is silent.** Four headless probes here concluded the file had not loaded; an interactive run showed it loading every time. A model that judges the payload non-credible — a planted passphrase, a convention contradicting the repo — answers "no such rule" exactly as a model that never received it, and rewriting the payload to look innocuous only produces a better-reasoned refusal. Trust the harness's own load report (the `Loaded <path>` line, or `/context`) over the model's answer, and treat any negative obtained by self-report as unmeasured.

**Verify what actually loaded with `/context`.** Reasoning about which file *should* have loaded is how a rule ends up written into a file the session never read. The `InstructionsLoaded` hook logs the same thing for a path-scoped rule that isn't firing.

⚠️ **Block-level HTML comments are stripped before the file enters context**, so an `<!--LLM-CONTEXT-->` header costs nothing at runtime and is invisible to the reader it's addressed to — it is a note for humans and for anything opening the file with `Read`, never a way to brief a session. *(Hierarchy verified against `code.claude.com/docs/en/memory.md`, 2026-08-20.)*

**Routing principle**: Put a rule at the narrowest layer where it's ALWAYS LOADED when needed. Test with: "Must this rule load automatically for code to run correctly?"

- **Cross-cutting** (used in siblings under same layer) → stays at the **layer** level
- **Subdir-only** (seam-test: this symbol/term used 10+ times here, 0-3 elsewhere) → down to **subdir**
- **Feature-specific, large block** (debuggable gotchas, not startup rules) → `.claude-companions/` file + pointer in parent

**Auto-load survivors**: Only project-root re-persists after `/compact` — rules in layers/subdirs reload. A must-survive rule lives at root or global, never in a subdir.

**The seam-test** (verify subdir placement): A rule belongs at subdir level only when its core concepts are heavily concentrated in one directory and appear rarely or not at all elsewhere. The directory where the concepts appear frequently (while others show few or no hits) is the seam — not which dir "sounds right." A concept spread evenly across siblings has no seam and stays at the layer level.

Example: A section titled "Multi-Agency" might feel domain-owned, but if the code actually clusters authorization logic in `Http/Controllers` + `Middleware` + `Policies`, not in `Domain/*`, then the rule stays at the layer level because the concepts span multiple directories. Let the actual distribution decide, not the title.

## 2. The capture filter — does this belong in CLAUDE.md at all? {#capture-filter}

The one test, from Anthropic's own docs: **"Would removing this line cause Claude to make a mistake? If not, cut it."** Bloated files cause Claude to ignore the rules that matter — every dead line dilutes the live ones.

| ✅ Belongs in CLAUDE.md | ❌ Does NOT — route elsewhere |
|------------------------|-------------------------------|
| Commands Claude can't guess (test/build/seed) | Anything readable from the code itself → *delete* |
| Non-obvious gotchas, silent failures | Standard language/framework conventions Claude knows → *delete* |
| Project-specific decisions & constraints | File-by-file descriptions of the tree → *delete* (discoverable) |
| Style rules a linter CAN'T enforce | Rules ESLint/Pint already enforce → *hook or linter, not here* |
| Boundaries (legacy/off-limits/deprecated) | A multi-step procedure → *a skill* |
| Env quirks, credentials-by-name | A rule that only matters for one file-type → *a real subdirectory CLAUDE.md* (NOT `.claude/rules/` `paths:`/`globs:` frontmatter — empirically confirmed via negative-control test that it always loads in full regardless of frontmatter; it does not scope) |
| | Feature-specific patterns → *`tasks/**/current.md`, not CLAUDE.md* |
| | Secrets/tokens/passwords → *`CLAUDE.local.md`, key NAMES only, never values* |

## 3. Section taxonomy — what sections, in what order {#taxonomy}

Ordered by urgency: commands and boundaries first (a cold-start needs them immediately), gotchas last (debugging-time reads). Not every file needs every section — a domain file may be just Critical Rules + a schema table.

| Section | Purpose | Include by default? |
|---------|---------|---------------------|
| `<!--LLM-CONTEXT-->` header | Stack + domain + key-file pointers in comment | Always |
| `## Commands {#commands}` | Exact commands Claude can't guess (highest-ROI) | ✅ If any non-obvious commands exist |
| `## Architecture {#architecture}` | 3-5 key dirs w/ ✅/⚠️ markers in a code block | ✅ If the tree is non-trivial |
| `## Critical Rules {#critical}` | Mistakes that recur: prose reasoning + consequence | ✅ Every file |
| Domain sections (e.g. `## Auth`, `## Billing`) | Per-subsystem rules + schema tables | Per domain |
| `## Gotchas {#gotchas}` | Debugging-time reference: Symptom \| Cause \| Fix rows or prose + pointer | ✅ After a gotcha is confirmed (don't invent) |
| Cross-refs (`> 📖 See parent …`) | Pointer to layer that owns a shared concept | Only where a pointer saves repeating prose |

## 4. Formatting conventions — the house style {#conventions}

| Convention | Usage |
|-----------|-------|
| **Prose** | For a constraint requiring judgment ("reason through it, it depends"). State the mechanism + cost, stop, and let readers recognize their symptom. |
| **`❌ NEVER / ✅ INSTEAD` tables** | For a bare do/don't with no reasoning. Pair prohibition with alternative. |
| **`Symptom \| Cause \| Fix` tables** | For a gotcha whose FIX is a lookup (exact error string, command, id). Lead with the error string for greppability. |
| **Prose + `📖 pointer` combo** | Gotcha mixing judgment + lookup: explain the mechanism in prose, pointer to companion for exact values. |
| **`{#anchor}` on every `##` heading** | Mandatory. Enables cross-references. Every section heading gets one. |
| **File path + symbol** | `Invoice.php scopeOverdue()`, never line numbers (they drift). |
| **Emphasis** | `⚠️` + `IMPORTANT` only for facts whose miss-cost is HIGH, and only while rare. Imperative restating prior reasoning flattens signal; state the consequence instead. |
| **Code block for structure** | Directory trees and exact commands go in ` ``` ` blocks, not tables or prose. |
| **`@path/import`** | Loads a file at launch (path relative to the importer, not the cwd). Use only for genuinely-always-needed content; no token savings, just DRY. Imports nest to a maximum of **four hops**. Wrap a path in backticks to mention it without importing it. An import resolving outside the project prompts for approval once. |
| **No war stories** | State the rule, never its history ("this bit us twice"). The constraint is the deliverable. |

**Gotcha decision tree**: 
- Fix is a lookup value (error string, command, exact id) → `Symptom | Cause | Fix` table
- Fix is judgment (reasoning, context-dependent) → prose only
- Mix of both → prose explaining mechanism, `📖 pointer` to companion for exact values

## 5. Template family {#templates}

All share LLM-CONTEXT header + `{#anchor}` on sections + ❌/✅ formatting. They differ in structure and weight.

### Root-router (multi-repo project root)

**Job**: Route to sub-repos, hold only cross-cutting facts (shared data model, roles, deployment).

```markdown
# CLAUDE.md

## Repos {#repos}
| Repo | Purpose | Read When |
|------|---------|-----------|
| `api/` | [what it does] | [when to read] |

## Critical Rules {#critical}
[Shared constraints: payment rules, roles, deploy chain]

## <Sections: Data Model, Roles, Deployment, Billing>
> Sub-project-specific rules live in each repo's own CLAUDE.md
```

### Domain-or-layer (a sub-repo, `app/`, or `react/`)

The workhorse file. Order: LLM-CONTEXT → Commands → Architecture → Critical Rules → per-subsystem sections → Gotchas. Cross-reference the root for shared concepts via `> See parent CLAUDE.md #{anchor}`.

```markdown
# CLAUDE.md

<!--LLM-CONTEXT
Stack: [framework + versions]
Domain: [what this repo/layer does]
Key files: [3-5 entry points]
-->

## Commands {#commands}
​```bash
[exact commands]
​```

## Architecture {#architecture}
​```
[3-5 key dirs with ✅/⚠️ markers]
​```

## Critical Rules {#critical}
[Prose: state mechanism + consequence. `❌ NEVER | ✅ INSTEAD` tables only for bare do/don't (no reasoning).]

## <Domain sections> {#anchor}
[Per-subsystem rules + schema tables]

## Gotchas {#gotchas}
[Use the decision tree from §4 — prose for judgment, Symptom|Cause|Fix table for lookups, prose + pointer for mixed.]
```

### Subdir (`./app/Domain/X/CLAUDE.md`)

Only the sections that BOTH are needed here AND fail the seam-test elsewhere. No LLM-CONTEXT header (inherits from layer). Usually one focused table or a short schema.

### Global (`~/.claude/CLAUDE.md`)

Cross-project rules only: environment, tools, working style, personal conventions. **Never** project-specific facts. Self-contained — no plugin or other project depends on a line here.

## 6. Routing over-budget content — the three structural levers {#budget}

A file exceeding its budget (200 soft, 350 hard) needs **structural fix, not deletion**. Three levers exist; apply in order.

**Prerequisite**: Check whether the file declares its own budget in its header. A declared budget overrides the default and is the authority — measure against it.

### Lever 1: Push to subdir (if seam-test passes)

**Gate**: Do the core terms from this block appear 10+ times in ONE real subdirectory, 0-3 everywhere else?

→ YES: Create/extend `<subdir>/CLAUDE.md`, move block, update pointer in parent.

→ NO: Go to Lever 2.

**Example**: Authorization logic concentrated in `Http/Controllers` + `Http/Middleware` + `Http/Policies` (not `Domain/*`). Move block to `app/Http/CLAUDE.md`.

### Lever 2: Point to task doc (if the block is feature-scoped)

**Gate**: Is this block about a DOCUMENTED feature/flow with its own `tasks/<domain>/<feature>/current.md`?

→ YES: Move block to task doc's `## Gotchas` section, leave one-line pointer `📖 See tasks/domain/feature/current.md #{anchor}` in parent.

→ NO: Go to Lever 3.

**Why it works**: `Explore`/`Plan` agents run `/read-summary` unconditionally — feature-named requests reliably find the task doc and its pointers.

### Lever 3: Move to companion file (if cross-cutting)

**Gate**: Block is large (100+ rows), cross-layer (no subdir seam), and non-urgent (debugging-time reference, not startup rule).

→ YES: Create `.claude-companions/<shared|local>/CLAUDE-<topic>.md`, move block, replace with **indexed pointer** (not bare `see file`).

**Pointer anatomy** (example):
```markdown
📖 See `.claude-companions/shared/CLAUDE-gotcha-index.md` for detailed reference:
- `error 1054: column not found` → SQL queries
- `timeout: resource limit` → N+1 queries, bulk insert rows
- `empty result set` → soft deletes, nullable FK reads
```

Each line is a **symptom** (greppable, not the file name). Reader matches their bug to a line, opens the file.

**Companion location**: Nearest git-repo root, `shared/` (tracked) or `local/` (gitignored). For global `~/.claude/CLAUDE.md`, confirm `~/.claude` is a repo; if yes, nest at `~/.claude/.claude-companions/shared/` (backed-up); if no, use sibling. ⚠️ Never assume — ask the VCS where that directory's repo root actually is, since `~/.claude` being a repo is a per-machine arrangement rather than a given.

**When to add rows later**: If a new row fits the indexed categories, add its symptom to the matching index line in the parent. If it's a new category, add a new index line + create the section in the companion.

**Detection**: All three levers exist to avoid over-budget creep — reach for them BEFORE deciding a block "just has to stay inline."
