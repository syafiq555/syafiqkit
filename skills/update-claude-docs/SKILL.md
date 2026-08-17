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

## The Three Routing Gates (every entry answers these)

Every signal has to pass three gates before routing:

1. **Is it derivable?** Can the reader reconstruct it with `ls`, `grep`, reading source, running `--help`, or looking at the manifest? If yes, cut it — the tool or codebase says it already.
2. **Is it safety-critical or routine?** Does the rule need to fire before the reader acts (resident in CLAUDE.md), or only when something breaks (lazy-load into a skill/companion)?
3. **What scope owns it?** Is it global, project-wide, layer-specific (app/resources/js/tests), or subdir-specific?

Pass all three and the fact routes to CLAUDE.md. Fail the first and cut. Fail the second and move to a skill or companion. The order matters: derivability is the cheapest gate (fastest to check), so always run it first.

📖 `references/pointer-discipline.md` — read when a `> 📖` line is in play: following a pointer, a companion left stale because grep "found" it, a pointer's own `Covers:` summary going stale, writing a bare pointer with no inlined facts, or picking a target by folder name.

---

# CAPTURE MODE (default)

Extract reusable patterns from this session into CLAUDE.md files.

A caller-supplied arg is additive context, not a scope limiter — scan the whole conversation for every signal in the Step-1 table below, since the arg usually hints at only one of them (an arg naming a code fact still needs a separate pass for corrections/wrong-sources).

**When the conversation has no scannable session** (invoked right after `/clear`, or on a topic never touched this session) but the user still names a subject ("make CLAUDE.md aware of X"), the Signal scan doesn't apply — there's nothing to scan. Read the actual source for that subject instead (the relevant directory/files) and diff it against what CLAUDE.md currently claims; a stale worker count, an undocumented code path, or a description that no longer matches the source is the same "Undocumented" or "Violation" signal a scan would have produced. Say so explicitly ("no session content — reading the codebase directly") rather than silently switching modes.

## 1. Scan — What happened?

Scan the conversation for four classes of signals — the first three ask what the session added, the fourth what it broke:

- **Undocumented facts** the session revealed: a gotcha, an environment surprise, a debugging discovery, a non-standard convention the code doesn't teach. Anything code can't explain.
- **Violated rules**: a moment when Claude ignored an existing CLAUDE.md rule, or this skill itself skipped a step it's supposed to follow. Classify as "Violation" (see refinement steps below).
- **Repeating patterns**: the same approach used 2+ times in one session, or the same mistake corrected twice. Separate from one-off gotchas.
- **Rules the session made FALSE**: work that changes something the docs describe leaves rules about it stale without anyone editing them. The other three classes cannot find these, because all three grep for what you're *adding* — and a rule describing the old state is written in the old state's vocabulary, so every search keyed on the new one misses it. Ask what the docs previously said about whatever you just changed, then search using the words that were true before, not after. This is the class most likely to be skipped: nothing about building the new thing prompts you to go looking for what it broke, and the miss is invisible because the docs still read as coherent. A stale instruction costs more than a missing one, since it reads as settled and sends the next reader confidently at the wrong target.

Also scan for working-style preferences stated by the user (e.g., "communicate like this instead"), personal machine context, credentials/tokens, and CLI patterns reused 3+ times — these route to `CLAUDE.local.md` instead.

A signal is a candidate, not a verdict. Most sessions produce several and most of those shouldn't become entries — the file's health depends on what arrives, not on how well each arrival is worded, and a table of thirteen signals with no rejecting row will otherwise turn every session into net growth. Before grepping, ask what the reader gains: a fact they couldn't derive is worth a line, and a restatement of something the surrounding rules already imply costs a line and dilutes them. Prefer sharpening or replacing an existing rule to adding a neighbour, and where a session produced many signals, take the one or two that would actually change a future decision. Writing nothing is a legitimate outcome, and saying "no capture: the corrections this session were applications of rules already stated" is a real report rather than a skipped step.

**Special case: Structural gaps** (a domain/layer file with no `## Architecture {#architecture}` section, but 3+ sibling classes or multiple adapters/contracts) route to `references/structure.md` §3/§5 for addition, not to the session capture flow.

For each signal that clears that, extract 2-3 keywords and grep all CLAUDE.md files:

| Grep result | Classification |
|-------------|---------------|
| No match | **New** — add entry, but first check whether it belongs in a companion file |
| Match only inside a `> 📖` pointer line | **Not a match.** Read the pointed-to file and re-classify against its text, since the pointer itself isn't the rule |
| Match in correct file | **Violation** — refinement steps below. Read the matched rule before treating it as inadequate; it may have been correct and simply outweighed by its surroundings |
| Match in wrong file | **Misplaced** — move to correct scope |
| Match, but this session's work made the rule FALSE | **Invalidated** — rewrite it to what now holds, or delete it. A stale convention reads as settled and sends the next reader down the path you just fixed, so it costs more than no rule at all. |

When a grep matches a pointer line rather than the companion's own text, descend into the companion before classifying. A rule you're adding may belong in a companion, not the index. See `references/pointer-discipline.md` §1-2 for when a match inside a pointer line counts as no match.

A change to a globally-installed tool (a CLI on PATH, a shared script, a plugin skill) invalidates docs outside the repo you edited, because every project that uses it carries the now-stale instructions in the global corpus. Scope the routing pass to the tool's blast radius — the projects that actually invoke it — not just the checkout you edited.

## 2. Route — Where does it go?

**Ask what the fact is ABOUT before asking where it was found.** A fact about this codebase — its schema, its helpers, its own conventions — routes down the ladder below. A fact about a tool, framework or the harness is true in every project that uses them, so it belongs at the level it holds at, which is usually global: the ladder will otherwise bury it in whichever project happened to surface it, and the next project rediscovers it from scratch. Subject matter tells you where a fact came from, never where it is true. **Tell: the fact would still be true if this codebase didn't exist.**

### 2a. Derivability gate — Should it even be in CLAUDE.md?

Ask: Can the reader reconstruct this with `ls`, `grep`, reading source code, running `--help`, or checking a manifest?

**If yes, cut outright:**
- Directory/file layouts (`ls`, `find` show structure)
- Tech stack and dependency lists (`composer.json`, `package.json` declare them)
- Standard build/test commands (`npm test` means tests, tool defaults are documented)
- API signatures and types (source code is canonical)
- Architecture tours that read like a README (codebase is self-describing)
- Generic best practices (the model already follows them)
- Rules enforced by hooks/lint/CI (the config is canonical, not this file)

**If no, keep it:**
- **Gotchas** — code can't explain what makes it dangerous
- **Design rationale** — source doesn't say *why* it's this way
- **Non-standard conventions** — exceptions to language/tool defaults need naming
- **Agent directives and safety prohibitions** — must be resident, never lazy-load
- **Workflow etiquette** — branch naming, PR titles, commit process aren't in the code
- **Domain glossaries** — terminology meanings need explicit definition
- **Non-guessable commands** — "run `npm run integration`, not `npm test`" can't be discovered
- **Routing information** — "`@path/to/import` for this type", "guidance at X"

### 2b. Residency gate — Does it belong inline or in lazy-load?

A fact that passed the derivability gate still faces a second choice: **resident in CLAUDE.md (every session) or lazy-loaded (on-demand)**. Route on **when the rule needs to fire**, not subject matter:

| Resident (inline) | Lazy-load (skill or companion) |
|-------------------|--------------------------------|
| **Universal constraints** — apply to *every* decision in the repo (e.g., "never push to main") | **Task-specific workflows** — only needed when doing that particular work (e.g., "agent bootstrapping steps") |
| **Code style and judgment principles** — used constantly and cross-cutting (e.g., "prefer clean separation over minimal-diff") | **Consultation-on-demand** — read only when diagnosing a specific failure (e.g., "Docker Compose quirks", "macOS memory pressure signals") |
| **Safety-critical prohibitions** — must fire even when ignored by a prior session (e.g., "never edit generated files") | **Implementation detail and environment-specific setup** — needed once per machine/project setup (e.g., "Herd PHP memory_limit lives here") |
| **Routing rules** — "go to skill X for Y" — need to be resident so they're read before a session acts | **Reference tables and lookup rows** — best behind a `📖` pointer and indexed by symptom |

**Signal: "I'm reading this before any action"** → resident. **Signal: "I'm reading this because something broke"** → lazy-load.

If a rule doesn't fire unless the reader already knew to look for it, move it to a skill (invoked by name) or a companion (invoked by symptom) — the resident cost is too high for content that only helps a reader mid-failure. Root CLAUDE.md after trimming should feel like "the things you need to know before you act," not "everything about everything."

**Which files are private is a `.gitignore` fact, not a filename convention — read it before routing anything personal.** The ladder below names `CLAUDE.local.md` as the private rung because that is the usual arrangement, but a repo decides its own: a companions tree commonly splits `shared/` (tracked) from `local/` (ignored), and a global `~/.claude` may itself be a repo with a remote. Inferring from the filename puts a machine-specific fact — a container name, a server alias, a personal tool's behaviour — into a file the whole team pulls, and nothing about the write looks wrong afterward because the content is accurate; only its audience is. Settle it with `git check-ignore -q <path> && echo IGNORED || echo tracked` against each candidate, and note that `git ls-files` answers a different question (whether a file is *currently* tracked, which reports "untracked" for a brand-new file that is not ignored at all).

A fact whose value only holds on this machine belongs on the ignored rung even when its subject is the shared system: the topology both teammates share is team knowledge, while the container names and aliases used to reach it are yours. **Tell: the entry names something only you could type and have it work.**

Find the **most specific** CLAUDE.md for what's left (`Glob: **/CLAUDE.md` + check `CLAUDE.local.md`). This ladder is the same hierarchy `references/structure.md` §1 documents in full — read it if a routing call is unclear:

1. Personal, per-machine context (never team-wide facts) → `./CLAUDE.local.md` (project root)
2. Same domain as modified files → that domain's CLAUDE.md
3. **Subdir-level** (`resources/js/routes/CLAUDE.md`, `app/Domain/X/CLAUDE.md`) — when a rule only matters inside one subdirectory
4. Layer-level (`app/CLAUDE.md`, `resources/js/CLAUDE.md`)
5. Project root `CLAUDE.md`
6. Global `~/.claude/CLAUDE.md`

A subdir `CLAUDE.md` auto-loads *additively* on top of its parents (editing `resources/js/routes/X` loads root + `resources/js/` + `routes/`), so routing a rule down a level doesn't hide it — it scopes it. Prefer the subdir file when the rule is both needed in that subdir AND useless elsewhere (seam-test); if it's cross-cutting (a shared token/util/type used across sibling dirs), keep it at the layer level instead — pushing a cross-cutting rule into one subdir means the sibling dirs never load it. Creating the subdir `CLAUDE.md` if it doesn't exist yet is fine; that's the `app/Domain/*` pattern.

Run the seam-test against every real sibling subdirectory, not just the one the rule's subject matter suggests — `grep -rl` the rule's core symbols against each candidate and let usage counts decide (`references/structure.md` §1).

**Settling the scope leaves a second choice: the auto-loading file at that scope, or a `.claude-companions/` companion hanging off it.** These are not two places for the same rule. A companion is demand-loaded and indexed by symptom, so it's read by someone who already has a failure in hand and a phrase to search; the auto-loading file is read every session by someone about to act. Route on **when the rule needs to arrive**, not on what it's about — a rule that governs a routine choice (which tool to reach for, how to shape a command) has to be in the auto-loading file or it never fires, because nobody consults a symptom index before doing something that hasn't broken yet. The companion earns rules whose trigger is a specific observed failure the reader can name. **Tell: you picked the companion because its topic matched the rule's subject** — subject matter is how the fact got filed, never how the reader will come looking for it.

**Read target first** — check structure, existing entries, where new entry fits.

### CLAUDE.local.md checklist

These belong in `CLAUDE.local.md` because they carry env-specific context (server passwords, account names, API tokens) that shouldn't be in team-visible `CLAUDE.md` — and they're the ones a session forgets to save because each feels too small on its own:

- **Credentials/tokens** read from config files (`secrets.json`, `.env`, DB) — save the extraction pattern (e.g., `jq -r '.["key"]' path`)
- **API headers** that required trial-and-error (auth headers, required headers that caused 401/403)
- **CLI one-liners** used 3+ times (curl templates, scp with password, remote + mysql combos)
- **External service URLs** discovered during the session (settings pages, portal URLs, API endpoints)
- **Account mappings** (which token → which account → which subdomain)
- **Names and handles for reaching infrastructure** — container names, server aliases, hostnames, the behaviour of a tool only you have installed. These read as team facts because their subject is the shared system, and they are the category most often misrouted: the architecture is the team's, while the strings you type to reach it are yours.

| ❌ NEVER | ✅ ALWAYS |
|----------|----------|
| Skip writing because "task doc has it" | CLAUDE.md must be self-sufficient for fresh sessions |

## 3. Write — Hard rules

### Entry style (every entry you write)

Before writing, absorb the three judgment-shaped rules from 📖 `../_shared/references/writing-style.md` (capture filter, prose-vs-value, mechanism-not-trip-wire — these decide what shape an entry should take before you write it). Then apply these as you draft:

- **Rows ≤2 sentences**: State the constraint + the single reason it exists. ≤1 parenthetical per sentence.
- **No session storytelling**: Never state how the mistake happened or how many times. The rule is the constraint, not its history.
- **One concrete example max**: One symptom string or code snippet — multiple instances of the same failure add length, not clarity.
- **Corrections need verification**: An entry asserting a doc, an agent, or a prior session got something wrong lands in a team-visible file and is read as settled forever. Verify before writing: if a single command settles it (run it); if not, state the observation, not a verdict.

### New signals → Add entry

A new entry's shape follows from the kind of answer it's recording. If the answer is "it depends, reason about it," write that reasoning as prose — 2-4 sentences stating the mechanism so the reader recognises their own situation. If the answer is a specific string (command, IP, id, credential), use a table row instead; prose would just pad around a lookup value. A signal mixing both (judgement plus one value) gets prose ending in a `📖 <companion> {#anchor}` pointer, with the value at that anchor (`condense-claude-md/references/prose-vs-value-split.md`).

On first capture, default to plain statement-of-fact prose — no `⚠️` callout, no trigger phrases, no prescribed sequences. Reserve the imperative shape (`**Never X**`) for the "Violations → Escalate" path, after a rule has already been violated. An entry that came out as `**Never X**` plus a parenthetical carve-out is the imperative shape reasserting itself where prose was cleaner; that shape signals a repeat violation, not a first discovery.

- Gotchas / Guidance: apply the test above.
- Behavioral corrections: the same test applies — if the correction is "you reached for the wrong thing, here's why", that's reasoning and belongs in prose. `❌ NEVER | ✅ ALWAYS` earns its place when the correction is a bare swap with no reasoning worth stating (this command, not that one). Either way, compare against specific past actions rather than general principles.
- Patterns: Prose + code (reusable only).
- Pair every prohibition with an alternative ("don't X" needs "do Y instead").

### Violations → Escalate by position + sharpness, NOT length

A violated rule always needs an update — "the rule is clear" isn't a valid reason to skip. Escalation means making the rule harder and better-placed, not longer. Replace the old text rather than appending a second warning below the first; a repeat violation that grows the rule into a paragraph makes it less likely to be followed.

Before sharpening, ask whether the rule was actually the problem. A rule can be correct, well-placed and still get walked past because the section around it teaches a different reflex — twenty instrumental rows beside one judgement sentence will produce a reader who reaches for the instrument, and adding a twenty-first is the wrong repair. When a violation happens in a section whose bulk points the other way, the fix is the section's proportion, not this rule's wording. That finding is `unhobble-instructions`'s territory; name it and hand it over rather than escalating into it.

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

Measure the pruning floor before consulting the table, since the gate's decision depends on data only you can compute at this step: the file's current line count (`wc -l <target>`) and this session's net delta to it (`git diff --stat HEAD -- <target>`, or `--stat <base>..HEAD` if already committed; in a non-git project that errors — the line count still measures, and the delta comes from what you wrote this session, see `../_shared/references/verifying-a-write-landed.md`). If you defer this to Step 5, a floor you never measured defaults to "not under the floor," and the gate spawns the pruner on a stale premise.

Ownership needs the same treatment at the same moment. The preamble's check ran once, at write-time in Steps 1–3, and a finding computed three steps upstream is not state this table consults — nor is it necessarily still true, since a peer can start editing mid-run. Re-run the diff-content check (`../_shared/references/diff-ownership.md`) against the file you are about to hand the pruner.

| Agent found? | Action |
|-------------|--------|
| Yes, but the file is **contested** (re-checked here, not carried from Steps 1–3) | **Skip the spawn** — pruning is a restructure, which the preamble already forbids on a contested file. Report the size against budget, and land the deferral somewhere durable per `diff-ownership.md`'s contested-file table rather than only in this transcript |
| Yes, no pruning decision declared, not contested, and the file is not under the floor | Launch `subagent_type: "claude-md-pruner"` with file paths to scan |
| Yes, but pruning/splitting is recorded as **decided**, OR the file is under the floor | **Skip the spawn** — report current size against the file's own budget instead |
| No | Skip pruning — do not inline a pruning prompt |

Detection rules for both size-based skip cases: `../_shared/references/declared-budget.md`; for the contested case, `../_shared/references/diff-ownership.md`. A spawn against any of them can only return a no-op at best, and against a contested file it destroys a peer's uncommitted work.

**Agent prompt**: `Prune these CLAUDE.md files: [list paths]. Run in background.` — plus the sections you wrote in Steps 1–3, named explicitly, since the agent re-checks ownership itself and your uncommitted writes are what it will find. Without that list it cannot tell your edits from a third session's and must either refuse a legitimate dispatch or prune a peer's work. Plus the repo-wide verb ban, written into the prompt verbatim: `stash · checkout -- . · reset · clean · restore · commit · push`. This agent holds `Bash` and `Edit`, so a file slice scopes what it *reads* and never what a `git` command it runs *touches*. 📖 `../_shared/references/agent-prompt-verb-ban.md` for why each verb is on the list and how to check any agent's real tool grants.

The agent owns its own classification rules, litmus tests, and never-delete safeguards — delegate to it, don't second-guess its instructions from here.

Background-prune only files that are finished being edited this session. The pruner reads the file when it starts, not when it finishes, so an entry you add mid-edit can get deleted on a premise your later edits invalidated. Finish all edits before naming a file for pruning, or hold the pruning pass until your own changes are done.

## 5. Validate

After writing each entry (in Step 3):
1. Re-grep the keyword to confirm no duplicate was created. (This grep also proves a write landed when the target is `CLAUDE.local.md`, which is gitignored.)
2. Ask: "Would removing this let Claude repeat the mistake?" If no, delete. Then ask the same of the section: if a reader absorbed the whole section, what would they default to? A row passing on its own can still be the twentieth mechanical row beside one line of judgment, training the opposite of what it says.
3. Scan for narrative markers ("happened", "repeatedly", "caught", "twice") — rewrite to state the constraint, not its history.
4. Check "Fix" columns — must name a specific, verifiable action (file, method, config, exact guard). Not vague ("investigate", "handle better").
5. If the file is now over budget, flag it (Step 4's pruner handles the shrink). Default: 350 lines; check `../_shared/references/declared-budget.md` if the file states its own figure.
6. Re-read the entry against the "New signals → Add entry" shape rule: does prose violate its intended form? An entry landing as `**Never X**` instead of reasoning prose may pass the checks above and still be the wrong shape.

**Task docs vs. CLAUDE.md**: Feature-specific patterns stay in `tasks/**/current.md`. Only broadly-applicable patterns go in CLAUDE.md.

## 6. Agent Sync

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

# CREATE / REWRITE / CONDENSE MODES

Cold-path. Create and Rewrite have a process worth reading before starting: `references/other-modes.md`. Condense has none here because it delegates outright. All three depend on `references/structure.md` for the hierarchy rules, section taxonomy, formatting conventions and 200-line budget. One-line summary of each:

- **Create**: scaffold a new CLAUDE.md from codebase analysis, house style, target <200 lines.
- **Rewrite**: restructure an existing file to canonical section order + formatting, inventory-then-diff to guarantee zero rules dropped.
- **Condense**: delegate to `syafiqkit:condense-claude-md` — don't reimplement. Run Rewrite first if the file also needs re-sectioning.
