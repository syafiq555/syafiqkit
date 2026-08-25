---
name: update-claude-docs
description: Create, rewrite, condense, or capture-into CLAUDE.md files following best-practice structure. Use after implementing features or fixing bugs to capture reusable patterns/gotchas (the /done Step 3 default), OR when the user wants to scaffold a new CLAUDE.md for a repo/subdir, restructure an existing one to the canonical section layout, or shrink a bloated file. The CLAUDE.md analog of task-summary. Triggers on "update claude docs", "capture this into CLAUDE.md", "create/write a CLAUDE.md", "rewrite/restructure CLAUDE.md", "make CLAUDE.md follow best practice", "add this gotcha to the docs".
---

# Update CLAUDE.md

The single manager for CLAUDE.md files — the analog of `task-summary` for `current.md`. Four modes; pick the one matching how it was invoked.

## Mode selection (decide first)

| Invocation | Mode | What it does |
|-----------|------|--------------|
| Bare (no args), or after a coding session, or from `/done` Step 3 | **Capture** (default) | Scan the session → route learnings to the right CLAUDE.md layer. The rest of this file. |
| `create <dir>` / "write a CLAUDE.md for X" / target file is missing | **Create** | Scaffold a new CLAUDE.md in house style from codebase analysis. |
| `rewrite <file>` / "restructure to best practice" | **Rewrite** | Restructure an existing file to the canonical section layout + formatting. |
| `condense <file>` / "shrink this CLAUDE.md" | **Condense** | Delegate to `condense-claude-md` (don't reimplement). |

When in doubt which mode, it's Capture — that's the one `/done` depends on. Its scan and routing gates are inline below; its write, validate and agent-sync steps carry their triggers inline and their procedures in `references/`. The other three modes read `references/structure.md` first.

What controls density is what gets admitted to a file and whether it's hot-path (inline) or cold-path (`references/`), not restyling prose that already reads fine. This was measured rather than assumed: two skills hand-condensed for clarity came out *denser* than they started two weeks later, because the pass squeezed wording while the arrival of new rules went unchanged. Leave a rule's wording alone unless it fails the capture filter or its position is wrong. This governs every mode, Capture included.

## Policy: CLAUDE.md vs Auto Memory and File Ownership

Route everything this skill produces to CLAUDE.md — not to `~/.claude/projects/*/memory/`. The reason is audience, not mechanism: auto memory is machine-local and unshared, so a rule landing there reaches one person on one machine while every teammate and every fresh checkout carries on without it. That holds even though auto memory is enabled by default and genuinely loads each session, which is what makes it a tempting destination. The exception is if a memory file was already touched this session; leave it alone.

The two are complements rather than rivals — Claude writes auto memory from its own corrections, you write CLAUDE.md for what the team must share — so finding a fact already in auto memory is a reason to promote it here, not a reason to skip it.

Settle who owns the target file before writing it — this applies in every mode. A CLAUDE.md can carry another session's uncommitted work, and `/done` invokes this skill one step before `task-summary`, so two concurrent sessions meet here first. Judge by diff *content*, not by `git status` plane (the harness auto-stages your own writes into the same shape as a peer's). For contested files, stick to additive, scoped edits; don't delete or restructure sections whose lines you didn't write. In Rewrite or Condense mode, say so and stop rather than restructuring around a peer's in-flight changes. See `../_shared/references/diff-ownership.md` and `../_shared/references/cross-session-messaging.md` for the mechanics of a multi-session file.

**Note on compaction:** This skill is long; a compacted session keeps roughly its first half. The six Capture steps (scan, route, write, prune, validate, sync) are named once, up front, so if they aren't in your context when you reach Step 3, re-read this skill rather than improvising. Two things carry through compaction: **writing nothing is a legitimate outcome** — most signals shouldn't become entries, and "no capture: corrections were applications of existing rules" is a real report. And **a rule you'd add is usually a rule to sharpen**: prefer tightening an existing line over adding a neighbour, because the file's health depends on what arrives, not on how well each arrival is worded.

## The Three Routing Gates {#routing-gates}

Every signal that survives the scan passes three gates before routing:

1. **Is it derivable?** Can the reader reconstruct it by listing a directory, searching the tree, reading source, asking the tool for its own help, or looking at the manifest? If yes, cut it — the tool or codebase says it already.
2. **Is it safety-critical or routine?** Does the rule need to fire before the reader acts (resident in CLAUDE.md), or only when something breaks (lazy-load into a skill/companion)?
3. **What scope owns it?** Is it global, project-wide, layer-specific (app/resources/js/tests), or subdir-specific?

Pass all three and the fact routes to CLAUDE.md. Fail the first and cut. Fail the second and move to a skill or companion. The order matters: derivability is the cheapest gate (fastest to check), so always run it first.

📖 `${CLAUDE_SKILL_DIR}/references/pointer-discipline.md` — read when a `> 📖` line is in play: following a pointer, a companion left stale because grep "found" it, a pointer's own `Covers:` summary going stale, writing a bare pointer with no inlined facts, or picking a target by folder name.

---

# CAPTURE MODE (default)

Extract reusable patterns from this session into CLAUDE.md files. A caller-supplied arg is additive context, not a scope limiter — scan the whole conversation for every signal in the table below, since the arg usually hints at only one of them (an arg naming a code fact still needs a separate pass for corrections/wrong-sources).

**When the conversation has no scannable session** (invoked right after `/clear`, or on a topic never touched this session) but the user still names a subject ("make CLAUDE.md aware of X"), the Signal scan doesn't apply — there's nothing to scan. Read the actual source for that subject instead (the relevant directory/files) and diff it against what CLAUDE.md currently claims; a stale worker count, an undocumented code path, or a description that no longer matches the source is the same "Undocumented" or "Violation" signal a scan would have produced. Say so explicitly ("no session content — reading the codebase directly") rather than silently switching modes.

## 1. Scan — What happened?

Scan for four signal classes:

- **Undocumented facts** — gotchas, environment surprises, discoveries code can't explain.
- **Violated rules** — moments when this session ignored an existing CLAUDE.md rule.
- **Repeating patterns** — same approach 2+ times, or same mistake corrected twice.
- **Rules made FALSE** — work that stales existing instructions. *This class is easiest to miss.* Ask what the docs previously said before the change, then search using those old terms.

Also scan for user prefs (e.g., "communicate like this"), machine context, credentials, and 3+ reuse of a CLI pattern — these route to `CLAUDE.local.md`.

When a signal arrives from outside the session (article, vendor guide, audit report), search the project's decision records first — a team that met it before will have graded it.

A signal is a candidate, not a verdict. Most shouldn't become entries. Before grepping, ask what the reader gains: a fact they couldn't derive is worth a line; restating what surrounding rules imply dilutes them. Prefer sharpening an existing rule to adding a neighbor. Writing nothing is a legitimate outcome.

**Special case: Structural gaps** route to `references/structure.md` §3/§5, not the session capture flow.

For each signal that clears that, classify whether the rule exists:

| What you find | Classification |
|-------------|---------------|
| Doesn't exist | **New** — add entry, check whether it belongs in a companion |
| Only in a `> 📖` pointer | **Not a match** — read the companion, re-classify against its actual text |
| Exists, correct scope/file | **Violation** — refinement steps below |
| Exists, wrong scope/file | **Misplaced** — move to correct scope |
| Exists, now FALSE | **Invalidated** — rewrite or delete; stale is worse than absent |

## 2. Route — Apply the three gates

Ask what the fact is ABOUT, not where it was found. A codebase fact routes down the hierarchy; a tool/framework fact belongs at the level it's true everywhere.

For **Derivability gate**: Can the reader reconstruct this by inspecting the codebase? 📖 `${CLAUDE_SKILL_DIR}/references/derivability-examples.md`.

For **Residency gate** (gate 2):

| Resident | Lazy-load |
|----------|-----------|
| **Every decision** (e.g., "never push to main") | **Task-specific** (e.g., "agent bootstrapping") |
| **Code style** (used constantly) | **On-demand** (diagnosed when broken) |
| **Safety-critical** (must fire always) | **Reference tables** (indexed by symptom) |

**Rule: "I read this before acting"** → resident. **"I read this because something broke"** → lazy-load.

For **Scope** (gate 3): 📖 `${CLAUDE_SKILL_DIR}/references/routing-scope.md` — hierarchy ladder, seam test, file privacy check.

Before writing, read the target file to check structure, existing entries, and where new content fits.

### CLAUDE.local.md Routing

Credentials, tokens, CLI patterns, and infrastructure handles route here. 📖 `${CLAUDE_SKILL_DIR}/references/local-md-checklist.md`.

## 3. Write — Hard Rules

Two shape rules carry most of the weight. Keep an entry to the rule plus its single strongest reason — session storytelling belongs in git history, not the file. And let the answer pick the form: a constraint the reader reasons through becomes prose stating the mechanism, while an answer that is one exact string (a command, an error, an id) stays a table row, because prose has nowhere to put a literal value without becoming a table again.

📖 `${CLAUDE_SKILL_DIR}/references/entry-style.md` — the non-guessable-command bar, the one-row-table trap, and how each signal type shapes its entry.

### Violations → Escalate by position, not length

Replace old text rather than appending a second warning. 📖 `${CLAUDE_SKILL_DIR}/references/violations-refinement.md` — escalation checklist.

**Write the entry in house style** — `references/structure.md` §4, in whatever repo you're in. A gotcha whose fix is a lookup becomes a `Symptom | Cause | Fix` row, a bare do/don't becomes an `❌/✅` pair, a rule needing reasoning becomes prose, and the heading it lands under gets an `{#anchor}`. Capture is additive, so this shapes the entry you add rather than licensing a restructure of what surrounds it; a file whose whole shape is off is a Rewrite-mode job, not something to fix one entry at a time.

### Constraints

- No duplicates across CLAUDE.md files — and the search that settles it runs **before** the write, not at Step 5. A concept already covered in other words returns nothing to a grep of your own phrasing, so the sole evidence you have is a search whose vocabulary you did not pick: the mechanism's terms, the symptom's, the neighbouring section's. What this catches is rarely a verbatim copy — it is a general rule already stated elsewhere that your entry re-derives while adding one genuinely new instance. That entry should shrink to the instance and point at the section owning the mechanism, which is a decision about what to write and therefore has to happen before writing it
- Route to narrowest scope
- One refinement round per signal, then move on
- Write with `Edit` — not `Write`, and not a `sed`/`python` rewrite. Both alternatives replace an anchor check with your own care: `Edit` refuses an anchor that is absent *or* non-unique, which is what stops an edit landing on the wrong occurrence of a repeated heading

## 4. Prune — Delegate to project agent

Check whether the project has a `claude-md-pruner` agent. Before spawning: **measure the file's line count and net delta** (floor premise), and **re-check ownership** (peer edits may have started). Skip if contested, already decided, or under floor. 📖 `${CLAUDE_SKILL_DIR}/references/prune-delegation.md`.

## 5. Validate

Two checks are worth running even if you read nothing else. **Ask whether removing the entry would let Claude repeat the mistake** — if not, delete it. And **re-read it against the section you wrote into, not just against your own keyword**: a grep tests your phrasing, so an existing rule worded differently comes back empty and reads as clearance to add a second copy.

📖 `${CLAUDE_SKILL_DIR}/references/validation-checks.md` — the other five, including the narrative-marker scan and the Fix-column specificity test.

**Task docs vs. CLAUDE.md**: Feature-specific patterns stay in `tasks/**/current.md`. Only broadly-applicable patterns go in CLAUDE.md.

## 6. Agent Sync

**Default: skip.** Agents read CLAUDE.md at runtime via Bootstrap.

Only five signals require an agent edit: false-positive, guard repeatedly collapsed, zero-latency mistake class, agent misbehavior, or sibling repo entry. 📖 `${CLAUDE_SKILL_DIR}/references/agent-sync.md`.

---

# CREATE / REWRITE / CONDENSE

Cold-path modes. All three read `references/structure.md` (hierarchy, taxonomy, 200-line budget). Create/Rewrite also read `references/other-modes.md`.

- **Create**: scaffold from codebase, <200 lines.
- **Rewrite**: restructure to canonical order, inventory-then-diff for zero rules dropped.
- **Condense**: delegate to `syafiqkit:condense-claude-md`.

**House style is the standard in every repo, and this skill enforces it.** The canonical shape in `references/structure.md` applies to any CLAUDE.md this skill touches, whether it sits in this plugin or in a consumer's project — someone invoking a restructure asked for one, and a pass that defers to whatever it found delivers nothing. An existing file's consistency is not evidence to weigh: a shape applied uniformly is what one pass produces, so uniformity says a pass was uniform and nothing about whether it was right.

What that does *not* license is losing content. Inventory every rule before touching anything and diff it against the result; rules only disappear via the capture filter (derivable, linter-enforced, feature-specific), never because they didn't fit the shape you were converting into. Say in one line what you restructured. 📖 `../_shared/references/adopt-vs-impose.md`

## Rewrite mode: Delegation safety

⚠️ **When a Rewrite is DELEGATED, the inventory claim in its report is the one claim its self-assessment cannot be trusted for.** A delegated pass returning "zero rules deleted" is describing its intent; the same run can drop a rule with a documented incident behind it and report it clean, because the correct pass and a lossy one read identically in summary form. The dispatching session must take its own `cp` of the file BEFORE dispatch and diff against that afterwards — an inventory existing only inside the agent's context is unfalsifiable the moment the agent returns.

Two failure modes recur in opposite directions, so name which one you are guarding against. A rewrite legitimately rewords, so a rule can survive carrying none of its original tokens — a keyword miss is a place to open and read, never a loss to report. But `package.json`, a config file or the codebase "already having" a value is not the capture filter: those hold the value while the rule holds why it bites (a script exists, but not that it silently skips untracked files and still reports clean). **Tell: your justification for a deletion is that something else in the repo already contains the string.**
