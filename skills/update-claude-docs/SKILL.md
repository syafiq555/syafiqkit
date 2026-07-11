---
name: update-claude-docs
description: Create, rewrite, condense, or capture-into CLAUDE.md files following best-practice structure. Use after implementing features or fixing bugs to capture reusable patterns/gotchas (the /done Step 3 default), OR when the user wants to scaffold a new CLAUDE.md for a repo/subdir, restructure an existing one to the canonical section layout, or shrink a bloated file. The CLAUDE.md analog of task-summary. Triggers on "update claude docs", "capture this into CLAUDE.md", "create/write a CLAUDE.md", "rewrite/restructure CLAUDE.md", "make CLAUDE.md follow best practice", "add this gotcha to the docs".
---

# Update CLAUDE.md

The single manager for CLAUDE.md files — the analog of `task-summary` for `current.md`. It has four modes; pick the one that matches how it was invoked.

⚠️ **CLAUDE.md only — NEVER auto-memory**: All knowledge from this skill goes to CLAUDE.md, CLAUDE.local.md, or task docs. Do NOT write to auto-memory files (`~/.claude/projects/*/memory/`) — not for feedback, not for project context, not for investigation lessons. Memory is invisible to team members and agents; CLAUDE.md is the single source of truth.

⚠️ **Auto-memory's own "feedback" persona instructions can pre-empt this rule — reflexively AND by reasoned justification.** A mid-session correction reads as a feedback-memory trigger to the standing auto-memory system before you've consciously routed to this skill — you can catch yourself writing/editing a file under `~/.claude/projects/*/memory/` reflexively, even having just read this rule. Worse: once a memory file is already written, you will rationalize *keeping* it ("it's a cross-project preference, memory is the right home") — that reasoning is itself the violation this rule forbids, not an exception to it. A cross-project working-style/feedback rule belongs in **global `~/.claude/CLAUDE.md`** (loaded every session, steers behavior); a project rule belongs in that project's CLAUDE.md/CLAUDE.local.md. Auto-memory is never the answer, no matter how the signal is framed. If a memory file was touched this session, revert it before writing the CLAUDE.md/global-CLAUDE entry — never leave both, and never argue to keep the memory copy.

## Mode selection (decide first)

| Invocation | Mode | What it does |
|-----------|------|--------------|
| Bare (no args), or after a coding session, or from `/done` Step 3 | **Capture** (default) | Scan the session → route learnings to the right CLAUDE.md layer. The rest of this file. |
| `create <dir>` / "write a CLAUDE.md for X" / target file is missing | **Create** | Scaffold a new CLAUDE.md in house style from codebase analysis. |
| `rewrite <file>` / "restructure to best practice" | **Rewrite** | Restructure an existing file to the canonical section layout + formatting. |
| `condense <file>` / "shrink this CLAUDE.md" | **Condense** | Delegate to `condense-claude-md` (don't reimplement). |

**Create and Rewrite read `references/structure.md` first** — it holds the hierarchy rules, capture filter, section taxonomy, formatting conventions, template family, and the 200-line budget. Capture mode uses only its Routing (§1) and Capture-filter (§2) sections, inlined below. When in doubt which mode, it's Capture — that's the one `/done` depends on.

---

# CAPTURE MODE (default)

Extract reusable patterns from this session into CLAUDE.md files.

⚠️ **A caller-supplied arg is ADDITIVE context, never a scope limiter.** When invoked with an arg (e.g. from `/done` Step 3, or a user pointer like "capture the X thing"), still scan the WHOLE conversation for every signal in the Step-1 table — the arg is a hint about ONE signal, not the boundary of the scan. The most-missed class is an *early-session* behavioral miss (Claude concluded wrong / user corrected) that a code-focused arg silently excludes: a `/done` arg listing this session's technical facts will not mention the wrong-turn from three messages in, yet that wrong-turn is exactly the "user had to correct" signal Step 1 exists to catch. If the arg names only code facts, treat the conversation's corrections/wrong-sources as UNCOVERED and scan for them anyway.

⚠️ **Inline critical facts**: When adding a `> 📖 See task doc` pointer FROM A CLAUDE.md FILE, also inline the 1-2 most critical facts. A top-level session reading CLAUDE.md directly won't follow a bare pointer unprompted — the CLAUDE.md entry itself must contain enough to avoid repeating mistakes.

This does NOT apply to a task doc's OWN `## Gotchas` table pointing to a separate reference file (`📖 See .../gotcha-name.md`) — that pattern is confirmed to work bare, no inline duplication needed, because `Explore`/`Plan` run `/read-summary` discovery unconditionally and reliably follow the doc's own pointer rows (see `agent-setup` D18; §6 "second structural lever" in `references/structure.md`). Reserve full inlining for CLAUDE.md-level pointers only — duplicating a task doc's pointer target back into the doc itself defeats the point of moving it out.

⚠️ **Find the pointer's target by content, not folder name**: Before writing `> 📖 See tasks/.../current.md`, confirm the path exists and is the *right* doc — folder names are engineer-domain-named and rarely match the topic (`upload-redesign` owns "QC", `payout` owns "refund"). `Glob tasks/**/*.md` + `Grep` for the concept's vocabulary + synonyms across doc body + header; never guess the folder slug. A pointer to a non-existent or wrong doc is worse than no pointer.

## 1. Scan — What happened?

Look for these signals in the conversation:

| Signal | Category |
|--------|----------|
| User correction ("not X, it's Y") | Gotcha or Convention |
| Claude struggled / repeated attempts | Gotcha |
| Claude ignored existing rule | **Violation** |
| Claude concluded wrong (checked wrong source, premature narrative, user had to correct) | **Behavioral rule** — add `❌/✅` row capturing what Claude should have done differently |
| Same pattern used 2+ times | Pattern |
| Environment surprise | Gotcha |
| Convention preference | Convention |
| Debugging root cause discovered | Gotcha |
| User states a durable preference for HOW Claude should communicate/behave (e.g. pastes a preferred summary format saying "give it like this instead") | Working-style rule → **global `~/.claude/CLAUDE.md`** Working Style bullet — the arg IS the capture target, don't treat it as content-to-summarize or answer inline |
| Team/strategy context | Context → `CLAUDE.local.md` |
| Credentials/tokens/API headers used from config files | Env pattern → `CLAUDE.local.md` |
| CLI pattern reused 3+ times (curl, scp, remote) | Env pattern → `CLAUDE.local.md` |
| External API auth that required trial-and-error | Env pattern → `CLAUDE.local.md` |
| A domain/layer file read this session is all Gotchas with **no `## Architecture {#architecture}` section**, and the domain has non-trivial structure (3+ sibling classes, multiple adapters/contracts) | **Structural gap** — add an Architecture section per `references/structure.md` §3/§5, sourced from the actual files (contracts, sibling-action tables), not invented |

For each signal, extract 2-3 keywords and **grep all CLAUDE.md files**:

| Grep result | Classification |
|-------------|---------------|
| No match | **New** — add entry |
| Match in correct file | **Violation** — must refine (see Step 3) |
| Match in wrong file | **Misplaced** — move to correct scope + refine |

## 2. Route — Where does it go?

Find the **most specific** CLAUDE.md (`Glob: **/CLAUDE.md` + check `CLAUDE.local.md`). This ladder is the same hierarchy `references/structure.md` §1 documents in full — read it if a routing call is unclear:

1. Personal/team context → `./CLAUDE.local.md` (project root)
2. Same domain as modified files → that domain's CLAUDE.md
3. **Subdir-level** (`resources/js/routes/CLAUDE.md`, `app/Domain/X/CLAUDE.md`) — when a rule only matters inside one subdirectory
4. Layer-level (`app/CLAUDE.md`, `resources/js/CLAUDE.md`)
5. Project root `CLAUDE.md`
6. Global `~/.claude/CLAUDE.md`

A subdir `CLAUDE.md` auto-loads *additively* on top of its parents (editing `resources/js/routes/X` loads root + `resources/js/` + `routes/`), so routing a rule down a level doesn't hide it — it scopes it. Prefer the subdir file when the rule is both needed in that subdir AND useless elsewhere (seam-test); if it's cross-cutting (a shared token/util/type used across sibling dirs), keep it at the layer level instead — pushing a cross-cutting rule into one subdir means the sibling dirs never load it. Creating the subdir `CLAUDE.md` if it doesn't exist yet is fine; that's the `app/Domain/*` pattern.

⚠️ Run the seam-test against EVERY real sibling subdirectory, not just the one the rule's subject matter suggests — `rg -l` the rule's core symbols against each plausible candidate and let usage counts decide (`references/structure.md` §1). A rule that fails the seam-test against the obvious guess can still pass it against a directory nobody thought to check.

**Read target first** — check structure, existing entries, where new entry fits.

### CLAUDE.local.md checklist

Before finishing, actively scan the session for these — they're easy to miss because they feel "obvious" in the moment:

- [ ] **Credentials/tokens** read from config files (`secrets.json`, `.env`, DB) — save the extraction pattern (e.g., `jq -r '.["key"]' path`)
- [ ] **API headers** that required trial-and-error (auth headers, required headers that caused 401/403)
- [ ] **CLI one-liners** used 3+ times (curl templates, scp with password, remote + mysql combos)
- [ ] **External service URLs** discovered during the session (settings pages, portal URLs, API endpoints)
- [ ] **Account mappings** (which token → which account → which subdomain)

These belong in `CLAUDE.local.md` because they contain env-specific context (server passwords, account names, API tokens) that shouldn't be in team-visible `CLAUDE.md`.

| ❌ NEVER | ✅ ALWAYS |
|----------|----------|
| Save ANY knowledge to auto-memory files | Write to CLAUDE.md, CLAUDE.local.md, or task doc — memory is invisible to team and agents |
| Write feedback memory for investigation lessons | Add as `⚠️ MANDATORY` workflow section in CLAUDE.md — memory won't prevent next session's mistake |
| `> 📖 See X` pointer without inline summary | Pointer + inline 1-2 critical facts |
| Skip writing because "task doc has it" | CLAUDE.md must be self-sufficient for fresh sessions |
| Skip CLAUDE.local.md because "it's just env stuff" | Save reusable env patterns — next session will waste 10 min rediscovering them |
| Conclude from one data source without cross-checking | Add `❌/✅` behavioral rule to the relevant CLAUDE.md section |

## 3. Write — Hard rules

### Entry style (every entry you write)

Base writing-style rules (no filler words, one idea per sentence): `_shared/references/writing-style.md`.

| Rule | Detail |
|------|--------|
| **Rows ≤2 sentences** | State the constraint + the single reason it exists. ≤1 parenthetical per sentence. |
| **No session storytelling** | Never write how the mistake happened ("this happened twice", "a reviewer caught it", "#1/#2/#3 trigger" lists). The rule states the constraint, not its history. |
| **One concrete example max** | One symptom string or code snippet. Multiple examples of the same failure add length, not signal. |
| **Capture filter** | Before writing: "would Claude act differently without this?" If no, don't write it. |

### New signals → Add entry

- Gotchas: `Symptom | Cause | Fix` table row
- Guidance: `❌ NEVER | ✅ ALWAYS` table row
- Behavioral corrections: `❌ NEVER | ✅ ALWAYS` row capturing what Claude did wrong and what it should do instead. Use when Claude concluded incorrectly, checked wrong source first, or user had to push back ("are you sure?")
- Patterns: Prose + code (reusable only)
- Pair every prohibition with an alternative ("don't X" needs "do Y instead")

### Violations → Escalate by position + sharpness, NOT length

A violated rule **always** needs an update — "the rule is clear" is not a valid reason to skip. But escalation means making the rule HARDER and BETTER-PLACED, never longer. **REPLACE the old text — never append a second warning below the first.** A repeat violation that grows the rule into a paragraph makes it less likely to be followed, not more.

| Check | Action |
|-------|--------|
| Buried in a table? | Promote to a `⚠️ MANDATORY` callout above the table — **callout ≤3 lines** |
| Not in active workflow? | Add as a numbered step in the workflow sequence |
| Too vague / too long? | Rewrite: one hard constraint beats five soft guidelines |
| Already a long paragraph from past escalations? | **Condense it** while sharpening the core constraint — strip the war stories, keep the trigger condition + the action |
| Missing the "do Y" half? | Add the alternative action |

**Never** conclude "rule is clear, no update needed" for a violation.

### Constraints

- No duplicates across CLAUDE.md files
- Route to narrowest scope
- One refinement round per signal, then move on
- Use `Edit` tool (not `Write`)

## 4. Prune — Delegate to project agent

After Steps 1–3, check for a project-level pruning agent and delegate:

```
Glob: .claude/agents/claude-md-pruner.md
```

| Agent found? | Action |
|-------------|--------|
| Yes | Launch `subagent_type: "claude-md-pruner"` with file paths to scan |
| No | Skip pruning — do not inline a pruning prompt |

**Agent prompt**: `Prune these CLAUDE.md files: [list paths]. Run in background.`

The agent has its own classification rules, litmus tests, and NEVER-delete safeguards. Do not override its instructions.

⚠️ **Only background-prune files that are SETTLED.** The pruner reads the file when it starts, not when it finishes — if you're still editing a file (or about to, e.g. mid-split), it judges a stale snapshot and may delete an entry you just added by reasoning about a state that no longer exists ("this rule is aspirational, no subdir uses it" — right when you're creating that subdir). Finish all edits to a file before listing it, or hold the prune until the session's file changes are done. When the pruner reports a deletion, diff it against the entries you wrote THIS session: if it removed one of yours on a premise your later edits invalidated, restore it — your fresh write beats the agent's stale read.

## 5. Validate

After writing each entry (in Step 3):
1. Re-grep keyword — confirm no duplicate created
2. Count `|` separators — must match table header
3. "Would removing this cause Claude to repeat the mistake?" — if no, delete it
4. Scan your entry for narrative markers ("happened", "repeatedly", "caught", "twice", numbered trigger lists) — rewrite to constraint-only
5. **Fix column must be a specific, verifiable action, not a vague verb** ("investigate", "check", "handle better", "fix properly") — if the Fix reads as an open-ended task rather than a concrete change, name the actual file/method/config to touch or the exact guard to add
6. If the target file is now >350 lines, flag it in your output — the Step-4 pruner pass handles the shrink

**Task docs ≠ CLAUDE.md**: Feature-specific patterns stay in `tasks/**/current.md`. Only patterns that apply broadly go in CLAUDE.md.

## 6. Agent Sync

**Default: do nothing.** Agents read CLAUDE.md dynamically, so a normal gotcha/convention/pattern added in Steps 1–3 needs NO agent change — the Bootstrap pattern picks it up next run. Re-deriving agent tables from CLAUDE.md would re-introduce the duplication the architecture exists to avoid.

**Exception — some signals are agent-specific and CLAUDE.md alone won't fix them.** A reviewer needs a false-positive inline to *not* flag it (zero-latency); a simplifier needs a preserve-rule inline to *not* collapse it. For these, route to the agent file directly. Check the signal against this table:

| Session signal | Route to | Where in the agent |
|----------------|----------|--------------------|
| Reviewer flagged something that was actually **intentional/correct** (recurring false positive) | `code-reviewer.md` | "Known False Positives" table (add row: pattern + why correct) |
| Simplifier **collapsed an intentional guard/workaround** (or would have) | `code-simplifier.md` | "Don't Simplify (Preserve These)" table |
| A **new high-frequency mistake** class that the agent's inline table should catch at zero-latency (not just any gotcha — one worth the top-~15 slot) | reviewer and/or simplifier | "High-Frequency Mistakes" / "High-Impact Simplifications" table |
| Agent itself **misbehaved** — audited whole codebase vs session scope, checked wrong source first, wrong confidence call, ignored a Bootstrap step | the offending agent | Process / Constraints section (behavioral fix) |
| A **sibling repo** entered the session (driven from this working dir, its own agents don't fire) | both agents | Add `⚠️ Two-repo session` banner + second Bootstrap table + tagged sibling rules |

**How to apply** (only when a row above matches):
- Edit the agent file directly with the `Edit` tool — these are small, surgical additions (one table row, one banner). Do NOT rewrite whole tables.
- Group per repo in multi-repo sessions (Autorentic rows vs sibling rows).
- Inline a row even if you also added the underlying fact to CLAUDE.md — the agent table and CLAUDE.md serve different latencies (the table is "don't even consider flagging this"; CLAUDE.md is the full explanation).
- For a **structural** change (new section, new repo's full rule set, changed agent responsibilities/tools), don't hand-edit — run `syafiqkit:agent-setup`, which owns the template + verification checklist.

If no row matches, leave the agents alone and note "Agents: no sync needed (gotcha read dynamically via Bootstrap)" in the output.

---

# CREATE MODE

Scaffold a new CLAUDE.md for a repo, layer, or subdir that has none. The goal is a lean, house-style file — not an exhaustive dump.

1. **Read `references/structure.md` in full first** — it holds the hierarchy, capture filter, section taxonomy, formatting conventions, and the template family. Pick the template that matches the target (root-router / domain-or-layer / subdir / global).
2. **Determine placement + template.** A project root with sub-repos → root-router (routes, doesn't hold every rule). A sub-repo or `app/`/`react/` layer → domain-or-layer. A single split-off directory → subdir (one focused table, no LLM-CONTEXT header). `~/.claude/` → global.
3. **Analyze the codebase for real content — don't invent.** Every line must pass the capture filter (§2). Gather:
   - **Commands**: the actual test/build/seed/dev commands (read `package.json` scripts, `composer.json`, Makefile, README). Only the non-obvious ones.
   - **Architecture**: the 3-5 dirs a newcomer must know, with ✅/⚠️ markers for canonical-vs-legacy. Not the whole tree.
   - **Stack + entry points** for the LLM-CONTEXT header (framework versions from lockfiles; entry files).
   - **Critical rules / gotchas**: only ones you can actually justify from the code (a broken legacy model, a schema quirk, a route-placement constraint). If you can't justify a rule from the code, leave it out — an empty section is better than a guessed one.
4. **Write in house style** — LLM-CONTEXT header, `{#anchor}` on every `##`, `❌ NEVER / ✅ INSTEAD` and `Symptom | Cause | Fix` tables, file+symbol references (never line numbers), sections in taxonomy order. Cross-reference the parent layer for shared concepts (`> Schema: parent CLAUDE.md #{plans}`).
5. **Stay under budget** — target <200 lines (§6). A fresh scaffold that's already near the cap means you're including too much; keep the highest-signal rules. Before dropping the rest outright, check whether a block is feature-specific enough to route to that feature's task doc instead (§6 "second structural lever") — only truly cross-cutting or low-signal content should be cut.
6. **Validate** (§5 checks apply): anchors present + unique, tables well-formed, no invented rules, no secrets (those go to `CLAUDE.local.md` by name only), cross-refs resolve.

# REWRITE MODE

Restructure an existing CLAUDE.md to the canonical layout + formatting without losing any load-bearing rule. This is a *structural* rewrite, not a capture pass and not primarily a shrink (that's Condense).

1. **Read the target file AND `references/structure.md` in full.**
2. **Inventory every rule in the current file** before touching anything — list each constraint/gotcha/command so you can prove none is dropped in the rewrite. This is the safety gate: a rewrite that silently loses a hard-won gotcha is worse than no rewrite.
3. **Re-section to taxonomy order** (§3): LLM-CONTEXT header → Commands → Architecture → Critical Rules → domain sections → Gotchas → cross-refs. Move each existing rule into its correct section. If the file has no Architecture section at all (common in a gotchas-only file that grew incident-by-incident), that's a gap to fill, not just a reorder — derive it from the real contracts/sibling classes (e.g. a "4 mutually-exclusive-precondition sibling Actions" table), never invent structure that isn't in the code.
4. **Normalize formatting to house style** (§4): free-form bullets restating a constraint → `❌/✅` rows; debugging notes → `Symptom | Cause | Fix` rows; add missing `{#anchor}`s; strip line numbers down to file+symbol; delete session storytelling.
5. **Apply the capture filter** (§2) as you go: a rule that's discoverable-from-code, linter-enforced, or feature-specific gets *removed* (feature-specific → note it belongs in a task doc), not reformatted. This is the one place Rewrite deletes — for the wrong-layer/discoverable class only, never for "seems long".
6. **Route mis-placed rules** (§1): a rule that belongs one layer down goes to (or creates) the subdir/domain file, using the seam-test. A cross-cutting rule wrongly buried in a subdir moves up to the layer. If a block fails the seam-test (no real subdirectory owns it) but is feature-specific, route to that feature's task doc instead (`references/structure.md` §6 "second structural lever") — leave a bare `📖 See <file>` pointer row, no inline duplication needed.
7. **If still over budget after restructure** → hand off to `condense-claude-md` for a density pass; don't force-shrink by dropping rules yourself.
8. **Validate**: diff your rule-inventory (step 2) against the rewritten file — every load-bearing rule still present (possibly relocated), zero dropped. Then §5 checks.

# CONDENSE MODE

The user wants a bloated CLAUDE.md shrunk. **Delegate to the sibling skill — do not reimplement:**

```
Skill: syafiqkit:condense-claude-md
```

Pass the target file. That skill owns the density rules (strip WHY columns, collapse 3-col→2-col tables, remove discoverable content, tighten multi-sentence rows). If the file also needs *structural* re-sectioning (wrong section order, missing anchors), run Rewrite mode first, then Condense — structure before density.
