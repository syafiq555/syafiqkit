---
name: update-claude-docs
description: Create, rewrite, condense, or capture-into CLAUDE.md files following best-practice structure. Use after implementing features or fixing bugs to capture reusable patterns/gotchas (the /done Step 3 default), OR when the user wants to scaffold a new CLAUDE.md for a repo/subdir, restructure an existing one to the canonical section layout, or shrink a bloated file. The CLAUDE.md analog of task-summary. Triggers on "update claude docs", "capture this into CLAUDE.md", "create/write a CLAUDE.md", "rewrite/restructure CLAUDE.md", "make CLAUDE.md follow best practice", "add this gotcha to the docs".
---

# Update CLAUDE.md

The single manager for CLAUDE.md files — the analog of `task-summary` for `current.md`. Four modes; pick the one matching how it was invoked.

Route everything this skill produces to CLAUDE.md — not to `~/.claude/projects/*/memory/`. The reason is audience, not mechanism: auto memory is machine-local and unshared, so a rule landing there reaches one person on one machine while every teammate and every fresh checkout carries on without it. That holds even though auto memory is enabled by default and genuinely loads each session, which is what makes it a tempting destination. The exception is if a memory file was already touched this session; leave it alone.

The two are complements rather than rivals — Claude writes auto memory from its own corrections, you write CLAUDE.md for what the team must share — so finding a fact already in auto memory is a reason to promote it here, not a reason to skip it.

Settle who owns the target file before writing it — this applies in every mode. A CLAUDE.md can carry another session's uncommitted work, and `/done` invokes this skill one step before `task-summary`, so two concurrent sessions meet here first. Judge by diff *content*, not by `git status` plane (the harness auto-stages your own writes into the same shape as a peer's). For contested files, stick to additive, scoped edits; don't delete or restructure sections whose lines you didn't write. In Rewrite or Condense mode, say so and stop rather than restructuring around a peer's in-flight changes. See `../_shared/references/diff-ownership.md` and `../_shared/references/cross-session-messaging.md` for the mechanics of a multi-session file.

**The shape of a Capture run, stated here because the later steps may not survive.** This skill is long enough that a compacted session keeps roughly its first half, so the six steps are named once, up front: **scan** the session for signals, **route** each through the three gates, **write** the survivors, **prune** if the project has an agent for it, **validate** what you wrote, and **sync agents** only if one of five specific signals fired. Steps 3 onward carry their own rules and you should read them; if they aren't in your context when you get there, that's the compaction, so re-read this skill rather than improvising the back half.

Two things hold across every step and are the ones worth carrying if nothing else does. **Writing nothing is a legitimate outcome** — most sessions produce signals that shouldn't become entries, and "no capture: the corrections were applications of rules already stated" is a real report. And **a rule you'd add is usually a rule to sharpen**: prefer replacing or tightening an existing line over adding a neighbour, because the file's health depends on what arrives, not on how well each arrival is worded.

## Mode selection (decide first)

| Invocation | Mode | What it does |
|-----------|------|--------------|
| Bare (no args), or after a coding session, or from `/done` Step 3 | **Capture** (default) | Scan the session → route learnings to the right CLAUDE.md layer. The rest of this file. |
| `create <dir>` / "write a CLAUDE.md for X" / target file is missing | **Create** | Scaffold a new CLAUDE.md in house style from codebase analysis. |
| `rewrite <file>` / "restructure to best practice" | **Rewrite** | Restructure an existing file to the canonical section layout + formatting. |
| `condense <file>` / "shrink this CLAUDE.md" | **Condense** | Delegate to `condense-claude-md` (don't reimplement). |

When in doubt which mode, it's Capture — that's the one `/done` depends on. Its scan and routing gates are inline below; its write, validate and agent-sync steps carry their triggers inline and their procedures in `references/`. The other three modes read `references/structure.md` first.

What controls density is what gets admitted to a file and whether it's hot-path (inline) or cold-path (`references/`), not restyling prose that already reads fine. This was measured rather than assumed: two skills hand-condensed for clarity came out *denser* than they started two weeks later, because the pass squeezed wording while the arrival of new rules went unchanged. Leave a rule's wording alone unless it fails the capture filter or its position is wrong. This governs every mode, Capture included.

## The Three Routing Gates (every entry answers these)

Every signal has to pass three gates before routing:

1. **Is it derivable?** Can the reader reconstruct it by listing a directory, searching the tree, reading source, asking the tool for its own help, or looking at the manifest? If yes, cut it — the tool or codebase says it already.
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

## 2. Route — Where does it go?

Ask what the fact is ABOUT, not where it was found. A codebase fact routes down the hierarchy; a tool/framework fact belongs at the level it's true everywhere.

**2a. Derivability gate** — Can the reader reconstruct this by inspecting the codebase? 📖 `${CLAUDE_SKILL_DIR}/references/derivability-examples.md`.

**2b. Residency gate** (HOT PATH)

| Resident | Lazy-load |
|----------|-----------|
| **Every decision** (e.g., "never push to main") | **Task-specific** (e.g., "agent bootstrapping") |
| **Code style** (used constantly) | **On-demand** (diagnosed when broken) |
| **Safety-critical** (must fire always) | **Reference tables** (indexed by symptom) |

**Rule: "I read this before acting"** → resident. **"I read this because something broke"** → lazy-load.

📖 `${CLAUDE_SKILL_DIR}/references/routing-scope.md` — hierarchy ladder, seam test, file privacy check.

**Read target file first** — check structure, existing entries, where new entry fits.

### CLAUDE.local.md Routing

📖 `${CLAUDE_SKILL_DIR}/references/local-md-checklist.md` — credentials, tokens, CLI patterns, infrastructure handles.

## 3. Write — Hard Rules

Two shape rules carry most of the weight. Keep an entry to the rule plus its single strongest reason — session storytelling belongs in git history, not the file. And let the answer pick the form: a constraint the reader reasons through becomes prose stating the mechanism, while an answer that is one exact string (a command, an error, an id) stays a table row, because prose has nowhere to put a literal value without becoming a table again.

📖 `${CLAUDE_SKILL_DIR}/references/entry-style.md` — the non-guessable-command bar, the one-row-table trap, and how each signal type shapes its entry.

### Violations → Escalate by position, not length

Replace old text rather than appending a second warning. 📖 `${CLAUDE_SKILL_DIR}/references/violations-refinement.md` — escalation checklist.

**Shape the entry to match the file you're writing into.** Inside the syafiqkit repo, that means `references/structure.md` §4 — the house style is authoritative here and a differing shape in a plugin-owned file is drift, not a decision. In any other repo, match the shape the target file already uses for entries of that kind, whatever it is. Capture is additive, so this is about the entry you add, never a licence to restructure what's around it; a file whose whole convention looks wrong is a Rewrite-mode job with its own ownership gate, not something to fix one entry at a time.

### Constraints

- No duplicates across CLAUDE.md files
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

**Rewrite settles ownership before the first structural edit** (Create always writes house style — there's no existing convention to weigh). A CLAUDE.md inside the syafiqkit repo is plugin-owned: the house style in `references/structure.md` is authoritative, a differing shape is drift rather than a decision, and this skill enforces it. A CLAUDE.md in any other repo belongs to whoever maintains it — there the file's own consistent convention wins and the house style is not yours to impose. Decide by where the file sits, not by how deliberate its shape reads; consistency proves a single pass was uniform, never that it was right. Establish which repo actually contains the target by asking from the target file's own directory rather than from wherever you happen to be invoked — a probe anchored to the plugin's directory walks up to whatever encloses it and will answer about the wrong repo, which fails silently in the direction of claiming a consumer's file as plugin-owned. State which reading you took in one line before writing. 📖 `../_shared/references/adopt-vs-impose.md` — the full judgement, worked examples, and the three always-fix repairs.
