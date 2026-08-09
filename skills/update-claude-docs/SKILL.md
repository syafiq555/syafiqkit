---
name: update-claude-docs
description: Create, rewrite, condense, or capture-into CLAUDE.md files following best-practice structure. Use after implementing features or fixing bugs to capture reusable patterns/gotchas (the /done Step 3 default), OR when the user wants to scaffold a new CLAUDE.md for a repo/subdir, restructure an existing one to the canonical section layout, or shrink a bloated file. The CLAUDE.md analog of task-summary. Triggers on "update claude docs", "capture this into CLAUDE.md", "create/write a CLAUDE.md", "rewrite/restructure CLAUDE.md", "make CLAUDE.md follow best practice", "add this gotcha to the docs".
---

# Update CLAUDE.md

The single manager for CLAUDE.md files — the analog of `task-summary` for `current.md`. Four modes; pick the one matching how it was invoked.

Route everything this skill produces to CLAUDE.md — not to `~/.claude/projects/*/memory/`, which is invisible to team members and other agents and would isolate the learning from everyone who needs it. The exception is if a memory file was already touched this session; leave it alone.

Settle who owns the target file before writing it — this applies in every mode. A CLAUDE.md can carry another session's uncommitted work, and `/done` invokes this skill one step before `task-summary`, so two concurrent sessions meet here first. Judge by diff *content*, not by `git status` plane (the harness auto-stages your own writes into the same shape as a peer's). For contested files, stick to additive, scoped edits; don't delete or restructure sections whose lines you didn't write. In Rewrite or Condense mode, say so and stop rather than restructuring around a peer's in-flight changes. See `../_shared/references/diff-ownership.md` and `../_shared/references/cross-session-messaging.md` for the mechanics of a multi-session file.

## Mode selection (decide first)

| Invocation | Mode | What it does |
|-----------|------|--------------|
| Bare (no args), or after a coding session, or from `/done` Step 3 | **Capture** (default) | Scan the session → route learnings to the right CLAUDE.md layer. The rest of this file. |
| `create <dir>` / "write a CLAUDE.md for X" / target file is missing | **Create** | Scaffold a new CLAUDE.md in house style from codebase analysis. |
| `rewrite <file>` / "restructure to best practice" | **Rewrite** | Restructure an existing file to the canonical section layout + formatting. |
| `condense <file>` / "shrink this CLAUDE.md" | **Condense** | Delegate to `condense-claude-md` (don't reimplement). |

When in doubt which mode, it's Capture — that's the one `/done` depends on, and its own steps are inlined below. The other three read `references/structure.md` first; their rules live with them at the bottom of this file.

What controls density is what gets admitted to this plugin and whether it's hot-path (inline) or cold-path (`references/`), not restyling prose that already reads fine. A wholesale clarity pass measurably regressed two skills to denser than their starting point (`tasks/plugin-maintenance/external-guidance/current.md` D55/D59). Leave a rule's wording alone unless it fails the capture filter or its position is wrong. This governs every mode, Capture included.

---

# CAPTURE MODE (default)

Extract reusable patterns from this session into CLAUDE.md files.

A caller-supplied arg is additive context, not a scope limiter — scan the whole conversation for every signal in the Step-1 table below, since the arg usually hints at only one of them (an arg naming a code fact still needs a separate pass for corrections/wrong-sources).

📖 **`references/pointer-discipline.md`** — read when a `> 📖` line is in play: following a pointer, a companion left stale because grep "found" it, a pointer's own `Covers:` summary going stale, writing a bare pointer with no inlined facts, or picking a target by folder name.

## 1. Scan — What happened?

Look for these signals in the conversation:

| Signal | Category |
|--------|----------|
| User correction ("not X, it's Y") | Gotcha or Convention |
| Claude struggled / repeated attempts | Gotcha |
| Claude ignored existing rule | **Violation** — see refinement steps below |
| Claude concluded wrong (checked wrong source, premature narrative, user had to correct) | **Behavioral rule** |
| Same pattern used 2+ times | Pattern |
| Environment surprise | Gotcha |
| Convention preference | Convention |
| Debugging root cause discovered | Gotcha |
| User states a durable preference for HOW Claude should communicate/behave (e.g. pastes a preferred summary format saying "give it like this instead") | Working-style rule → global `~/.claude/CLAUDE.md` |
| The arg asserts a standard the CODEBASE should meet ("X is not needed to be long", "we always do Y") | Codebase standard → measure violation before writing |
| Team/strategy context | Context → `CLAUDE.local.md` |
| Credentials/tokens/API headers used from config files | Env pattern → `CLAUDE.local.md` |
| CLI pattern reused 3+ times (curl, scp, remote) | Env pattern → `CLAUDE.local.md` |
| External API auth that required trial-and-error | Env pattern → `CLAUDE.local.md` |
| A domain/layer file read this session is all Gotchas with **no `## Architecture {#architecture}` section**, and the domain has non-trivial structure (3+ sibling classes, multiple adapters/contracts) | Structural gap → add Architecture section per `references/structure.md` §3/§5 |

For each signal, extract 2-3 keywords and grep all CLAUDE.md files:

| Grep result | Classification |
|-------------|---------------|
| No match | **New** — add entry, but first check whether it belongs in a companion file |
| Match only inside a `> 📖` pointer line | **Not a match.** Read the pointed-to file and re-classify against its text, since the pointer itself isn't the rule |
| Match in correct file | **Violation** — refinement steps below |
| Match in wrong file | **Misplaced** — move to correct scope |

When a grep matches a pointer line rather than the companion's own text, descend into the companion before classifying. A rule you're adding may belong in a companion, not the index. See `references/pointer-discipline.md` §1-2 for when a match inside a pointer line counts as no match.

A change to a globally-installed tool (a CLI on PATH, a shared script, a plugin skill) invalidates docs outside the repo you edited, because every project that uses it carries the now-stale instructions in the global corpus. Scope the routing pass to the tool's blast radius — the projects that actually invoke it — not just the checkout you edited.

## 2. Route — Where does it go?

Find the **most specific** CLAUDE.md (`Glob: **/CLAUDE.md` + check `CLAUDE.local.md`). This ladder is the same hierarchy `references/structure.md` §1 documents in full — read it if a routing call is unclear:

1. Personal/team context → `./CLAUDE.local.md` (project root)
2. Same domain as modified files → that domain's CLAUDE.md
3. **Subdir-level** (`resources/js/routes/CLAUDE.md`, `app/Domain/X/CLAUDE.md`) — when a rule only matters inside one subdirectory
4. Layer-level (`app/CLAUDE.md`, `resources/js/CLAUDE.md`)
5. Project root `CLAUDE.md`
6. Global `~/.claude/CLAUDE.md`

A subdir `CLAUDE.md` auto-loads *additively* on top of its parents (editing `resources/js/routes/X` loads root + `resources/js/` + `routes/`), so routing a rule down a level doesn't hide it — it scopes it. Prefer the subdir file when the rule is both needed in that subdir AND useless elsewhere (seam-test); if it's cross-cutting (a shared token/util/type used across sibling dirs), keep it at the layer level instead — pushing a cross-cutting rule into one subdir means the sibling dirs never load it. Creating the subdir `CLAUDE.md` if it doesn't exist yet is fine; that's the `app/Domain/*` pattern.

Run the seam-test against every real sibling subdirectory, not just the one the rule's subject matter suggests — `grep -rl` the rule's core symbols against each candidate and let usage counts decide (`references/structure.md` §1).

**Read target first** — check structure, existing entries, where new entry fits.

### CLAUDE.local.md checklist

These belong in `CLAUDE.local.md` because they carry env-specific context (server passwords, account names, API tokens) that shouldn't be in team-visible `CLAUDE.md` — and they're the ones a session forgets to save because each feels too small on its own:

- **Credentials/tokens** read from config files (`secrets.json`, `.env`, DB) — save the extraction pattern (e.g., `jq -r '.["key"]' path`)
- **API headers** that required trial-and-error (auth headers, required headers that caused 401/403)
- **CLI one-liners** used 3+ times (curl templates, scp with password, remote + mysql combos)
- **External service URLs** discovered during the session (settings pages, portal URLs, API endpoints)
- **Account mappings** (which token → which account → which subdomain)

| ❌ NEVER | ✅ ALWAYS |
|----------|----------|
| Skip writing because "task doc has it" | CLAUDE.md must be self-sufficient for fresh sessions |

## 3. Write — Hard rules

### Entry style (every entry you write)

Base writing-style rules (no filler words, one idea per sentence): `../_shared/references/writing-style.md`.

| Rule | Detail |
|------|--------|
| **Rows ≤2 sentences** | State the constraint + the single reason it exists. ≤1 parenthetical per sentence. |
| **No session storytelling** | Never write how the mistake happened ("this happened twice", "a reviewer caught it", "#1/#2/#3 trigger" lists). The rule states the constraint, not its history. |
| **One concrete example max** | One symptom string or code snippet. Multiple examples of the same failure add length, not signal. |
| A correction is costlier when mistaken | An entry asserting a doc, an agent, or a prior session got something wrong lands in a team-visible or global file and is read as settled by future sessions. Verify it before writing: if a single command settles it (a count, a version, a flag, a path), run the command first; if no command can, write the observation, not a verdict. |

### New signals → Add entry

A new entry's shape follows from the kind of answer it's recording. If the answer is "it depends, reason about it," write that reasoning as prose — 2-4 sentences stating the mechanism so the reader recognises their own situation. If the answer is a specific string (command, IP, id, credential), use a table row instead; prose would just pad around a lookup value. A signal mixing both (judgement plus one value) gets prose ending in a `📖 <companion> {#anchor}` pointer, with the value at that anchor (`condense-claude-md/references/prose-vs-value-split.md`).

On first capture, default to plain statement-of-fact prose — no `⚠️` callout, no trigger phrases, no prescribed sequences. Reserve the imperative shape (`**Never X**`) for the "Violations → Escalate" path, after a rule has already been violated. An entry that came out as `**Never X**` plus a parenthetical carve-out is the imperative shape reasserting itself where prose was cleaner; that shape signals a repeat violation, not a first discovery.

- Gotchas / Guidance: apply the test above.
- Behavioral corrections: use `❌ NEVER | ✅ ALWAYS` when Claude concluded incorrectly, checked wrong source first, or the user had to push back. Compare against specific past actions, not general principles.
- Patterns: Prose + code (reusable only).
- Pair every prohibition with an alternative ("don't X" needs "do Y instead").

### Violations → Escalate by position + sharpness, NOT length

A violated rule always needs an update — "the rule is clear" isn't a valid reason to skip. Escalation means making the rule harder and better-placed, not longer. Replace the old text rather than appending a second warning below the first; a repeat violation that grows the rule into a paragraph makes it less likely to be followed.

When refining a violated rule, consider:

| Check | Approach |
|-------|----------|
| Buried in a table | Promote to a callout above the table (≤3 lines) |
| Not in active workflow | Add as a numbered step in the workflow sequence |
| Too vague or too long | Rewrite to one hard constraint instead of five soft guidelines |
| Already grown from past escalations | Condense while sharpening the core constraint — strip war stories, keep trigger + action |
| Missing "do Y" alternative | Add what to do instead of the prohibited action |

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

Measure the pruning floor before consulting the table, since the gate's decision depends on data only you can compute at this step: the file's current line count (`wc -l <target>`) and this session's net delta to it (`git diff --stat HEAD -- <target>`, or `--stat <base>..HEAD` if already committed). If you defer this to Step 5, a floor you never measured defaults to "not under the floor," and the gate spawns the pruner on a stale premise.

| Agent found? | Action |
|-------------|--------|
| Yes, no pruning decision declared, and the file is not under the floor | Launch `subagent_type: "claude-md-pruner"` with file paths to scan |
| Yes, but pruning/splitting is recorded as **decided**, OR the file is under the floor | **Skip the spawn** — report current size against the file's own budget instead |
| No | Skip pruning — do not inline a pruning prompt |

Detection rules for both skip cases: `../_shared/references/declared-budget.md`. A spawn against either can only return a no-op.

**Agent prompt**: `Prune these CLAUDE.md files: [list paths]. Run in background.` — plus the repo-wide verb ban (`../_shared/references/agent-prompt-verb-ban.md`); this agent holds `Bash` and `Edit`.

The agent owns its own classification rules, litmus tests, and never-delete safeguards — delegate to it, don't second-guess its instructions from here.

Background-prune only files that are finished being edited this session. The pruner reads the file when it starts, not when it finishes, so an entry you add mid-edit can get deleted on a premise your later edits invalidated. Finish all edits before naming a file for pruning, or hold the pruning pass until your own changes are done.

## 5. Validate

After writing each entry (in Step 3):
1. Re-grep the keyword to confirm no duplicate was created. This grep also proves a write landed when the target is `CLAUDE.local.md` (which is gitignored, so `git diff` can't show it).
2. Count `|` separators — must match the table header.
3. Ask: "Would removing this let Claude repeat the mistake?" If no, delete the entry.
4. Scan for narrative markers ("happened", "repeatedly", "caught", "twice", numbered lists) — rewrite to state the constraint, not its history.
5. Any "Fix" column must name a specific, verifiable action — a file, method, config, or exact guard to add. Not a vague verb like "investigate" or "handle better."
6. If the file is now over budget, flag it in your output (the Step-4 pruner handles the shrink). Default budget is 350 lines; check `../_shared/references/declared-budget.md` if the file states its own figure.
7. Re-read the entry against the "New signals → Add entry" shape rule: does your prose violate the shape it's supposed to follow? An entry that landed as `**Never X**` instead of reasoning prose may pass the checks above and still be the wrong shape.

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

# CREATE / REWRITE / CONDENSE MODES

Cold-path — read `references/other-modes.md` for the full process, and `references/structure.md` for the hierarchy rules, section taxonomy, formatting conventions and 200-line budget these three modes all depend on. One-line summary of each:

- **Create**: scaffold a new CLAUDE.md from codebase analysis, house style, target <200 lines.
- **Rewrite**: restructure an existing file to canonical section order + formatting, inventory-then-diff to guarantee zero rules dropped.
- **Condense**: delegate to `syafiqkit:condense-claude-md` — don't reimplement. Run Rewrite first if the file also needs re-sectioning.
