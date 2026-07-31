---
name: update-claude-docs
description: Create, rewrite, condense, or capture-into CLAUDE.md files following best-practice structure. Use after implementing features or fixing bugs to capture reusable patterns/gotchas (the /done Step 3 default), OR when the user wants to scaffold a new CLAUDE.md for a repo/subdir, restructure an existing one to the canonical section layout, or shrink a bloated file. The CLAUDE.md analog of task-summary. Triggers on "update claude docs", "capture this into CLAUDE.md", "create/write a CLAUDE.md", "rewrite/restructure CLAUDE.md", "make CLAUDE.md follow best practice", "add this gotcha to the docs".
---

# Update CLAUDE.md

The single manager for CLAUDE.md files — the analog of `task-summary` for `current.md`. Four modes; pick the one matching how it was invoked.

⚠️ **This skill's output goes to CLAUDE.md only — never write NEW knowledge to `~/.claude/projects/*/memory/`, not for feedback, project context, or investigation lessons.** Memory is invisible to team members and other agents; CLAUDE.md is team-visible and agent-readable. Route a cross-project rule to global `~/.claude/CLAUDE.md`, a project rule to that project's CLAUDE.md/CLAUDE.local.md. If a memory file was already touched this session, leave it as-is — this skill does not own memory-file cleanup.

## Mode selection (decide first)

| Invocation | Mode | What it does |
|-----------|------|--------------|
| Bare (no args), or after a coding session, or from `/done` Step 3 | **Capture** (default) | Scan the session → route learnings to the right CLAUDE.md layer. The rest of this file. |
| `create <dir>` / "write a CLAUDE.md for X" / target file is missing | **Create** | Scaffold a new CLAUDE.md in house style from codebase analysis. |
| `rewrite <file>` / "restructure to best practice" | **Rewrite** | Restructure an existing file to the canonical section layout + formatting. |
| `condense <file>` / "shrink this CLAUDE.md" | **Condense** | Delegate to `condense-claude-md` (don't reimplement). |

**Create and Rewrite read `references/structure.md` first** — it holds the hierarchy rules, capture filter, section taxonomy, formatting conventions, template family, and the 200-line budget. Capture mode uses only its Routing (§1) and Capture-filter (§2) sections, inlined below. When in doubt which mode, it's Capture — that's the one `/done` depends on.

⚠️ **MANDATORY on every Create/Rewrite: fix arrival rate, never rewrite existing rules for "clarity."** Measured here (D55/D59, `tasks/plugin-maintenance/external-guidance/current.md`) — a wholesale clarity rewrite regressed two skills to denser than before within two weeks (D23→D50); this plugin is an incident-driven accumulator, not a rarely-edited prompt, so the lever is arrival rate and hot/cold routing, not restyling existing prose. Concretely: don't touch a rule's wording unless it fails the capture filter or its position/table shape is wrong; do check `⚠️`/`MANDATORY` density (target: rare enough to still signal) and whether a rule is hot-path (read every invocation) vs cold-path (belongs in `references/`).

---

# CAPTURE MODE (default)

Extract reusable patterns from this session into CLAUDE.md files.

⚠️ **A caller-supplied arg is ADDITIVE context, never a scope limiter.** Scan the WHOLE conversation for every signal in the Step-1 table — the arg is a hint about ONE signal, not the boundary of the scan. Most-missed: an arg naming only code facts still needs a scan for corrections/wrong-sources.

📖 **`references/pointer-discipline.md`** — read when a `> 📖` line is in play: a topic whose only grep hit IS the pointer line, a companion left stale because grep "found" it, a pointer's `Covers:` summary going stale, writing a bare pointer with no inlined facts, or picking a target by folder name.

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
| The arg asserts a standard the CODEBASE should meet ("X is not needed to be long", "we always do Y") | **Two outputs, not one** — write the rule to its CLAUDE.md layer AND measure whether the tree currently violates it (count, ratio, longest instance). **Tell: your entry ships with the violation unmentioned** |
| Team/strategy context | Context → `CLAUDE.local.md` |
| Credentials/tokens/API headers used from config files | Env pattern → `CLAUDE.local.md` |
| CLI pattern reused 3+ times (curl, scp, remote) | Env pattern → `CLAUDE.local.md` |
| External API auth that required trial-and-error | Env pattern → `CLAUDE.local.md` |
| A domain/layer file read this session is all Gotchas with **no `## Architecture {#architecture}` section**, and the domain has non-trivial structure (3+ sibling classes, multiple adapters/contracts) | **Structural gap** — add an Architecture section per `references/structure.md` §3/§5, sourced from the actual files (contracts, sibling-action tables), not invented |

For each signal, extract 2-3 keywords and **grep all CLAUDE.md files**:

| Grep result | Classification |
|-------------|---------------|
| No match | **New** — add entry, but clear the companion check below first |
| Match only inside a `> 📖` pointer line | **Not a match — descend.** `Read` the pointed-to file and re-classify against ITS text |
| Match in correct file | **Violation** — must refine (see Step 3) |
| Match in wrong file | **Misplaced** — move to correct scope + refine |

⚠️ **`ls` and Read every `> 📖` target before classifying — a match inside a pointer line is not a match** (`references/pointer-discipline.md` §1-2). A rule you're ADDING may likewise belong in a companion, not the index.

⚠️ **A change to a GLOBALLY-INSTALLED tool invalidates docs outside the repo you edited — scope the routing pass to the tool's blast radius, not the checkout's.** When the session changed something every project invokes (a CLI on `PATH`, a shared script, a plugin skill), the stale instructions live in the global corpus and its companions, where no amount of in-repo grepping reaches them; the project doc you did fix reads as complete. **Tell: the artifact you changed is invoked from projects other than the one you were working in.**

## 2. Route — Where does it go?

Find the **most specific** CLAUDE.md (`Glob: **/CLAUDE.md` + check `CLAUDE.local.md`). This ladder is the same hierarchy `references/structure.md` §1 documents in full — read it if a routing call is unclear:

1. Personal/team context → `./CLAUDE.local.md` (project root)
2. Same domain as modified files → that domain's CLAUDE.md
3. **Subdir-level** (`resources/js/routes/CLAUDE.md`, `app/Domain/X/CLAUDE.md`) — when a rule only matters inside one subdirectory
4. Layer-level (`app/CLAUDE.md`, `resources/js/CLAUDE.md`)
5. Project root `CLAUDE.md`
6. Global `~/.claude/CLAUDE.md`

A subdir `CLAUDE.md` auto-loads *additively* on top of its parents (editing `resources/js/routes/X` loads root + `resources/js/` + `routes/`), so routing a rule down a level doesn't hide it — it scopes it. Prefer the subdir file when the rule is both needed in that subdir AND useless elsewhere (seam-test); if it's cross-cutting (a shared token/util/type used across sibling dirs), keep it at the layer level instead — pushing a cross-cutting rule into one subdir means the sibling dirs never load it. Creating the subdir `CLAUDE.md` if it doesn't exist yet is fine; that's the `app/Domain/*` pattern.

⚠️ Run the seam-test against EVERY real sibling subdirectory, not just the one the rule's subject matter suggests — `grep -rl` the rule's core symbols against each candidate and let usage counts decide (`references/structure.md` §1).

**Read target first** — check structure, existing entries, where new entry fits.

### CLAUDE.local.md checklist

Scan the session for these before finishing — easy to miss because they feel "obvious" in the moment:

- [ ] **Credentials/tokens** read from config files (`secrets.json`, `.env`, DB) — save the extraction pattern (e.g., `jq -r '.["key"]' path`)
- [ ] **API headers** that required trial-and-error (auth headers, required headers that caused 401/403)
- [ ] **CLI one-liners** used 3+ times (curl templates, scp with password, remote + mysql combos)
- [ ] **External service URLs** discovered during the session (settings pages, portal URLs, API endpoints)
- [ ] **Account mappings** (which token → which account → which subdomain)

These belong in `CLAUDE.local.md` because they contain env-specific context (server passwords, account names, API tokens) that shouldn't be in team-visible `CLAUDE.md`.

| ❌ NEVER | ✅ ALWAYS |
|----------|----------|
| Revert/delete a memory file this skill finds already written | Leave it — this skill doesn't own memory cleanup, and reverting only the newest file leaves older ones inconsistent |
| Skip writing because "task doc has it" | CLAUDE.md must be self-sufficient for fresh sessions |
| Skip CLAUDE.local.md because "it's just env stuff" | Save reusable env patterns — next session will waste 10 min rediscovering them |
| Conclude from one data source without cross-checking | Add `❌/✅` behavioral rule to the relevant CLAUDE.md section |

## 3. Write — Hard rules

### Entry style (every entry you write)

Base writing-style rules (no filler words, one idea per sentence): `../_shared/references/writing-style.md`.

| Rule | Detail |
|------|--------|
| **Rows ≤2 sentences** | State the constraint + the single reason it exists. ≤1 parenthetical per sentence. |
| **No session storytelling** | Never write how the mistake happened ("this happened twice", "a reviewer caught it", "#1/#2/#3 trigger" lists). The rule states the constraint, not its history. |
| **One concrete example max** | One symptom string or code snippet. Multiple examples of the same failure add length, not signal. |
| ⚠️ **A correction is a claim — run the command that settles it BEFORE writing** | An entry asserting a doc, an agent, or a prior session got something wrong is the one kind of entry that is costlier when mistaken: it lands in a team-visible or global file that later sessions read as settled, and it discredits a source that was right. The asymmetry hides it — writing "that figure is stale" feels like diligence and costs nothing visible. If a single command decides it (a count, a version, a flag, a path), run it first; if none can, write the entry as the observation, not the verdict. |

### New signals → Add entry

A new entry's shape follows from what kind of answer it's recording. If the honest answer to "should I do X here" is "it depends, reason about it," write that reasoning as prose — 2-4 sentences, ending in a `**Tell:**` naming the concrete signal that triggers the exception. If the answer is a specific string (an exact command, IP, id, credential), a table row is the right shape, since prose would just be padding around a lookup value. A signal that mixes both — some judgement plus one exact value — gets prose ending in a `📖 <companion> {#anchor}` pointer, with the value living at that anchor (`condense-claude-md/references/prose-vs-value-split.md`). **Tell:** the entry you just drafted reads as `**Never X**` followed by a parenthetical carve-out — that's the imperative shape reasserting itself, and the carve-out belongs inside the `**Tell:**` sentence instead.

- Gotchas / Guidance: apply the test above.
- Behavioral corrections: always `❌ NEVER | ✅ ALWAYS` — compared against a specific past action, not a general principle. Use when Claude concluded incorrectly, checked wrong source first, or user had to push back ("are you sure?")
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

**Measure before consulting the table** — the floor's two inputs are yours to compute here, not Step 5's: `wc -l <target>` and this session's net delta to it (`git diff --stat HEAD -- <target>`, or `--stat <base>..HEAD` if already committed). Step 5's own `wc -lc` runs later and per-entry, so it cannot answer this. ⚠️ **A floor you never measured resolves to "not under the floor" and spawns — the gate then reads as satisfied while doing nothing.**

| Agent found? | Action |
|-------------|--------|
| Yes, no pruning decision declared, and the file is not under the floor | Launch `subagent_type: "claude-md-pruner"` with file paths to scan |
| Yes, but pruning/splitting is recorded as **decided**, OR the file is under the floor | **Skip the spawn** — report current size against the file's own budget instead |
| No | Skip pruning — do not inline a pruning prompt |

Detection rules for both skip cases: `../_shared/references/declared-budget.md`. A spawn against either can only return a no-op.

**Agent prompt**: `Prune these CLAUDE.md files: [list paths]. Run in background.`

The agent has its own classification rules, litmus tests, and NEVER-delete safeguards. Do not override its instructions.

⚠️ **Only background-prune files that are SETTLED — this is about TIMING WITHIN THIS SESSION, and does not cover the table row above** (a project having closed the pruning question permanently). Both read as "settled"; they gate different things, and treating this caveat as covering both is what lets the closed-decision case slip through. The pruner reads the file when it starts, not when it finishes — an entry added mid-edit can get deleted on a premise your later edits already invalidated. Finish all edits before listing a file, or hold the prune until the session's changes are done. If the pruner's report removed one of your fresh entries on a stale premise, restore it — your fresh write beats its stale read.

## 5. Validate

After writing each entry (in Step 3):
1. Re-grep keyword — confirm no duplicate created. This grep is also how you prove the write LANDED when the target is `CLAUDE.local.md`: it is gitignored, so no `git diff` can ever show it (`../_shared/references/verifying-a-write-landed.md`)
2. Count `|` separators — must match table header
3. "Would removing this cause Claude to repeat the mistake?" — if no, delete it
4. Scan your entry for narrative markers ("happened", "repeatedly", "caught", "twice", numbered trigger lists) — rewrite to constraint-only
5. **Fix column must be a specific, verifiable action, not a vague verb** ("investigate", "check", "handle better", "fix properly") — if the Fix reads as an open-ended task rather than a concrete change, name the actual file/method/config to touch or the exact guard to add
6. If the target file is now over budget, flag it in your output — the Step-4 pruner pass handles the shrink. **Budget = the file's own declared figure when it states one, 350 otherwise** (`../_shared/references/declared-budget.md`). A fixed 350 against a file declaring ~460 reports a false overage every run and trains the reader to ignore the flag
7. Re-read the entry against Step 3's own shape rule ("New signals → Add entry") — does the prose you just wrote violate the test it's applying? A judgement-shaped entry that landed as a flat `**Never X**` imperative (rather than reasoning ending in `**Tell:**`) is a shape violation the checks above won't catch, since none of them look at shape-vs-the-rule-that-governs-shape

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

Cold-path — read `references/other-modes.md` for the full process. One-line summary of each:

- **Create**: scaffold a new CLAUDE.md from codebase analysis, house style, target <200 lines.
- **Rewrite**: restructure an existing file to canonical section order + formatting, inventory-then-diff to guarantee zero rules dropped.
- **Condense**: delegate to `syafiqkit:condense-claude-md` — don't reimplement. Run Rewrite first if the file also needs re-sectioning.
