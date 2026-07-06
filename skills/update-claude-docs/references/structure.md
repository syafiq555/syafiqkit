# CLAUDE.md Structure Reference

The canonical structure + best-practice rules for creating, rewriting, or auditing a CLAUDE.md. SKILL.md's `create` and `rewrite` modes read this file; `capture` mode uses only the Routing and Capture-filter sections.

## Table of contents

1. The hierarchy (which file loads when)
2. The capture filter (what belongs in CLAUDE.md at all)
3. Section taxonomy (what sections, in what order)
4. Formatting conventions (the house style)
5. Template family (global / root-router / domain-or-layer / subdir)
6. The 200-line budget

---

## 1. The hierarchy — which file loads when

CLAUDE.md files are **concatenated additively**, filesystem-root → cwd. For *conflicts*, most-specific wins. Subdir files load **lazily** — only when Claude reads a file in that subdir — so a rule pushed down a level is scoped, not hidden. This is the single most important fact for routing a rule: put it at the narrowest layer where it's still always loaded when needed.

| Scope | Path | Who writes | Loads |
|-------|------|-----------|-------|
| Managed policy | `/Library/…/ClaudeCode/CLAUDE.md` (macOS) | Org admin | Always, can't exclude |
| **User (global)** | `~/.claude/CLAUDE.md` | You | Every session, ALL projects |
| **Project root** | `./CLAUDE.md` | Team (git) | Every session in project — survives `/compact` |
| **Layer** | `./app/CLAUDE.md`, `./react/CLAUDE.md` | Team (git) | Lazily, when Claude touches a file under it |
| **Subdir / domain** | `./app/Domain/X/CLAUDE.md`, `./resources/js/routes/CLAUDE.md` | Team (git) | Lazily, when Claude touches a file under it |
| **Local** | `./CLAUDE.local.md` | You | Every session, gitignored — secrets/env/test-accounts only |

Two consequences the routing step depends on:
- **Nested files do NOT survive `/compact`** — only project-root re-injects. A rule that must always be present belongs at root or global, not in a subdir.
- **A rule pushed into one subdir is invisible to sibling subdirs.** A cross-cutting token/util/type used across siblings stays at the layer level; only a rule that is both needed there AND useless elsewhere (the seam-test) goes down a level.

## 2. The capture filter — does this belong in CLAUDE.md at all?

The one test, from Anthropic's own docs: **"Would removing this line cause Claude to make a mistake? If not, cut it."** Bloated files cause Claude to ignore the rules that matter — every dead line dilutes the live ones.

| ✅ Belongs in CLAUDE.md | ❌ Does NOT — route elsewhere |
|------------------------|-------------------------------|
| Commands Claude can't guess (test/build/seed) | Anything readable from the code itself → *delete* |
| Non-obvious gotchas, silent failures | Standard language/framework conventions Claude knows → *delete* |
| Project-specific decisions & constraints | File-by-file descriptions of the tree → *delete* (discoverable) |
| Style rules a linter CAN'T enforce | Rules ESLint/Pint already enforce → *hook or linter, not here* |
| Boundaries (legacy/off-limits/deprecated) | A multi-step procedure → *a skill* |
| Env quirks, credentials-by-name | A rule that only matters for one file-type → *path-scoped rule* |
| | Feature-specific patterns → *`tasks/**/current.md`, not CLAUDE.md* |
| | Secrets/tokens/passwords → *`CLAUDE.local.md`, key NAMES only, never values* |

## 3. Section taxonomy — what sections, in what order

Ordered by how load-bearing each is at the top of a session. Commands and boundaries first because they're what a cold-start agent needs before touching anything; deep reference last. Not every file needs every section — a domain file may be just Critical Rules + a schema table.

| # | Section | Purpose | Skip when |
|---|---------|---------|-----------|
| 1 | `<!--LLM-CONTEXT-->` header | Stack + domain + key-file pointers in a comment block | Never (cheap, high-signal) |
| 2 | `## Commands {#commands}` | Exact commands Claude can't guess — highest-ROI lines | No non-obvious commands |
| 3 | `## Architecture {#architecture}` | 3-5 key dirs w/ ✅/⚠️ markers — a code block, not prose | Trivial/flat structure |
| 4 | `## Critical Rules {#critical}` | `❌ NEVER / ✅ INSTEAD` — the mistakes that actually recur | No hard constraints yet |
| 5 | Domain sections (`## Auth`, `## Audit`, …) | Per-subsystem rules + schema tables | — |
| 6 | `## Gotchas {#gotchas}` | `Symptom | Cause | Fix` — searchable by error string | No debugged surprises |
| 7 | Cross-refs (`> 📖 See parent …`) | Point to the layer that owns a shared concept | Standalone file |

## 4. Formatting conventions — the house style

These are what make the existing files scannable; a created/rewritten file must match them.

| Convention | Rule |
|-----------|------|
| `❌ NEVER / ✅ INSTEAD` tables | The default form for a constraint — most compressible, most scannable. Pair every prohibition with its alternative. |
| `Symptom \| Cause \| Fix` tables | The default form for a gotcha. Lead with the literal error string so it's greppable. |
| `{#anchor}` on every `##` | Enables `#{anchor}` cross-references between layers. Every section heading gets one. |
| File path + symbol, never line numbers | `Invoice.php scopeOverdue()`, never `Invoice.php:112` — line numbers drift on every edit above them. |
| Emphasis sparingly | `⚠️`, `IMPORTANT`, `YOU MUST` raise adherence — but only on the few rules that truly need it; overuse flattens the signal. |
| Code block for structure/commands | Directory trees and command lists go in ``` blocks, not tables or prose. |
| `@path/import` for launch-time includes | `@README` pulls a file in at launch; path is relative to the importing file. Use for genuinely-always-needed external content only. |
| No session storytelling | State the constraint, never its history ("this bit us twice", "a reviewer caught it"). The rule is the deliverable, not the war story. |

## 5. Template family

Pick by which file you're creating. All share the LLM-CONTEXT header + anchors + ❌/✅ style; they differ in which sections carry weight.

### Root-router (a multi-repo/monorepo project root)

Its job is to **route**, not to hold every rule — it points at the layer/domain files and holds only cross-cutting facts (shared data model, roles, money, deploy).

```markdown
# CLAUDE.md

## Repos {#repos}
| Repo | Purpose | Read When |
|------|---------|-----------|
| `api/` | … | … |

## Critical Rules {#critical}
| ❌ NEVER | ✅ INSTEAD |
|----------|-----------|

## Data Model {#data-model}
[shared hierarchy + key tables — the facts every sub-repo needs]

## <cross-cutting sections: roles, deployment, plans…>
> Sub-project-specific rules live in each sub-repo's CLAUDE.md
```

### Domain-or-layer (a sub-repo, `app/`, or `react/`)

The workhorse file. LLM-CONTEXT (stack + entry points) → Commands → Architecture → Critical Rules → per-subsystem sections → Gotchas. Cross-reference the root for shared concepts (`> Schema: parent CLAUDE.md #{plans}`).

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
| ❌ NEVER | ✅ INSTEAD |
|----------|-----------|

## <Domain sections> {#anchor}
[per-subsystem rules + schema tables]

## Gotchas {#gotchas}
| Symptom | Cause | Fix |
|---------|-------|-----|
```

### Subdir (a section split down a level)

Only the sections that are BOTH needed in this subdir AND useless to its siblings (seam-test). No LLM-CONTEXT header — it inherits the layer's. Usually just one focused table.

### Global (`~/.claude/CLAUDE.md`)

Cross-project rules only — environment, tool usage, working style, personal conventions. **Never** project-specific facts. Self-contained: a plugin or another project must not depend on a line here.

## 6. The 200-line budget

Official guidance targets **under ~200 lines** per file — adherence measurably drops past it because live rules get lost among dead ones. Treat 200 as the soft cap, 350 as the hard "must act now" line.

When a create/rewrite would land a file over budget, the fix is **structural, not deletion**: push a coherent block down to a subdir/domain file (Section 1's seam-test), or hand the whole file to `condense-claude-md` for a density pass. Do NOT cram — a file over budget that "needs everything" is a file whose rules want to live at different layers.
