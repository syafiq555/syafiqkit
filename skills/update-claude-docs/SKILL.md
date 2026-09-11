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

Every signal routes by asking three questions in order:

1. **Derivable?** Can the reader reconstruct it by listing a directory, searching the tree, reading source, or looking at the manifest? If yes, cut it.
2. **Safety-critical?** Must the rule fire before action, or only during failure? (Prohibitions always resident; details of-use-only stay lazy-load.)
3. **Scope?** Is it global, project-wide, layer-specific (app/resources/js/tests), or subdir-specific? Settle *which repo* owns it before *where in a repo* it goes — content describing something installed per-machine rather than per-project (a user-scope MCP server, a CLI, a shared credential store) belongs beside the global `CLAUDE.md`, cited by absolute path from each repo. Writing it into the repo you happen to be in reads as correct and leaves the sibling repo's session to write a second copy. **Tell: you can name another repo whose sessions would need this.**

All three → CLAUDE.md. Fail derivability → cut. Fail safety → move to a skill or companion. Check derivability first (fastest); it's the gating question. When a call is close, 📖 `${CLAUDE_SKILL_DIR}/references/derivability-examples.md` lists what to cut and what survives the gate despite looking derivable.

A `> 📖` pointer in a CLAUDE.md is a load-bearing instruction rather than a citation, and writing one against a folder name lands the reader somewhere plausible and wrong — find the target by content first. 📖 `${CLAUDE_SKILL_DIR}/references/pointer-discipline.md`

📖 `${CLAUDE_SKILL_DIR}/references/routing-scope.md` — hierarchy ladder, seam test, file privacy check.

---

# CAPTURE MODE (default)

Extract reusable patterns from this session into CLAUDE.md files. A caller-supplied arg is additive context, not a scope limiter — scan the whole conversation for every signal in the table below, since the arg usually hints at only one of them (an arg naming a code fact still needs a separate pass for corrections/wrong-sources).

**When the conversation has no scannable session** (invoked right after `/clear`, or on a topic never touched this session) but the user still names a subject ("make CLAUDE.md aware of X"), the Signal scan doesn't apply — there's nothing to scan. Read the actual source for that subject instead (the relevant directory/files) and diff it against what CLAUDE.md currently claims; a stale worker count, an undocumented code path, or a description that no longer matches the source is the same "Undocumented" or "Violation" signal a scan would have produced. Say so explicitly ("no session content — reading the codebase directly") rather than silently switching modes.

## 1. Scan — What happened?

Scan for five signal classes:

- **Undocumented facts** — gotchas, environment surprises, discoveries code can't explain.
- **Violated rules** — moments when this session ignored an existing CLAUDE.md rule.
- **Repeating patterns** — same approach 2+ times, or same mistake corrected twice.
- **Rules made FALSE** — work that stales existing instructions. Ask what the docs previously said before the change, then search using those old terms.
- **Machine-local context** — credentials, CLI patterns (3+ reuse), infrastructure handles, routing to `CLAUDE.local.md` rather than CLAUDE.md. Ask **what did I have to know to reach a system this session, that a fresh session would not know?** and answer it by walking the session's actual commands — every host connected to, database queried, container entered, token or path read — since a recipe that worked first time leaves no narrative trace and reads as common knowledge. 📖 `${CLAUDE_SKILL_DIR}/references/local-md-checklist.md` for the item-by-item list and the extraction patterns worth saving verbatim.

⚠️ **The four classes above all ask what went WRONG, so working them to exhaustion feels like a finished scan and the fifth never runs.** It is the odd one out by construction — a credential is something that went *right* — and it sits last, after the point where the list reads as closable, with "writing nothing is a legitimate outcome" arriving immediately below to license the omission. This has now failed twice: once by being absent, and once (2026-09-03) with the question present and answered for the code half only, on a session that had pasted a live OAuth client secret into `.env` and written three task-doc sections about the provider. The user asked twice before it was captured. So report the fifth class explicitly even when empty — "no new machine context: nothing was reached this session that a fresh one couldn't" is a real answer and an unstated one is indistinguishable from a skipped step. **Tell: you are about to report a capture pass naming only code facts, on a session where you ran a command against a live system.**

When a signal arrives from outside the session (article, vendor guide), search the project's decision records first — a team that met it before will have graded it.

**A finding from your own research is an Undocumented fact too, and belongs captured, not cited.** A WebFetch, WebSearch, or research-agent result that turned out load-bearing this session — a vendor's rate limit, a library's real default, a config flag's actual behavior — gets written into CLAUDE.md as the fact itself, the same as a fact the user handed you. Writing `See <url>` or `Per the vendor docs` instead is the citation-shaped version of skipping the scan: it reads as captured because a reference sits where the fact should be, and the next session hits a paywall, a dead link, or a page that's since changed, with nothing usable underneath it. You went and found this on purpose because it mattered — that's the signal to write it down now, keeping the URL only as a pointer beside the captured fact, never in place of it.

Most signals shouldn't become entries. Before grepping, ask what the reader gains: a fact they couldn't derive is worth a line; restating what surrounding rules imply dilutes them. Prefer sharpening an existing rule to adding a neighbor. Writing nothing is a legitimate outcome.

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

The three gates are the same ones above. The order stays: derivability (fastest, gates everything), then safety-critical (resident vs. lazy-load), then scope (hierarchy). Before writing, read the target file to check structure, existing entries, and where new content fits.

## 3. Write — Match Form to Content

Keep an entry to the rule plus its single strongest reason — session storytelling belongs in git history. Let the answer pick the form: a mechanism becomes prose; an exact string (command, error, id) stays a table row. 📖 `${CLAUDE_SKILL_DIR}/references/entry-style.md`.

When replacing an existing rule, replace old text rather than appending — a second warning dilutes what came first. 📖 `${CLAUDE_SKILL_DIR}/references/violations-refinement.md` for escalation guidance.

Write in house style (`references/structure.md` §4). A gotcha whose fix is a lookup becomes a `Symptom | Cause | Fix` row; a bare do/don't becomes `❌/✅`; a rule needing reasoning becomes prose. Capture is additive — add new entries without restructuring what surrounds them; a file whose whole shape is off is a Rewrite-mode job.

**Before writing:** Check for duplicates across CLAUDE.md files using vocabulary from the mechanism, symptom, and neighbouring section—not your own phrasing. A concept already covered elsewhere should shrink to just the new instance and point at the existing rule. Use `Edit` for the write, never `Write` — `Edit` guards against absent or non-unique anchors.

## 4. Prune — Delegate to project agent

Check whether the project has a `claude-md-pruner` agent. Before spawning: measure the file's line count and net delta (floor premise), and re-check ownership (peer edits may have started). Skip if contested, already decided, or under floor. 📖 `${CLAUDE_SKILL_DIR}/references/prune-delegation.md`.

## 5. Validate

Ask whether removing the entry would let Claude repeat the mistake — if not, delete it. Re-read it against the section you wrote into, not just your own keyword search: a grep tests your phrasing, so an existing rule worded differently appears empty and reads as clearance to add a second copy. 📖 `${CLAUDE_SKILL_DIR}/references/validation-checks.md` for the other five checks.

Feature-specific patterns stay in `tasks/**/current.md`; only broadly-applicable patterns go in CLAUDE.md.

## 6. Agent Sync

Default: skip. Agents read CLAUDE.md at runtime via Bootstrap. Only edit an agent when a false-positive repeats, a guard collapses repeatedly, a mistake happens at zero latency, the agent misbehaves, or a sibling repo entry applies. 📖 `${CLAUDE_SKILL_DIR}/references/agent-sync.md`.

---

# CREATE / REWRITE / CONDENSE

Cold-path modes. All three read `references/structure.md` (hierarchy, taxonomy, 200-line budget). Create/Rewrite also read `references/other-modes.md`.

- **Create**: scaffold from codebase, <200 lines.
- **Rewrite**: restructure to canonical order, inventory-then-diff for zero rules dropped.
- **Condense**: delegate to `syafiqkit:condense-claude-md`.

House style in `references/structure.md` applies to any CLAUDE.md this skill touches — a restructure asked for one, and a pass that defers delivers nothing. An existing file's uniformity is not evidence: it's what one pass produces. Rules only disappear via the capture filter (derivable, linter-enforced, feature-specific), never because they didn't fit the shape. Inventory before touching and diff after; say in one line what you restructured. 📖 `../_shared/references/adopt-vs-impose.md`

## Rewrite mode: Delegation safety

When a Rewrite is delegated, the inventory claim is the only claim its self-assessment cannot be trusted for. A delegated pass returning "zero rules deleted" describes intent, not outcome; it can drop a rule with a documented incident and report it clean, because correct and lossy passes read identically in summary form. Take your own `cp` BEFORE dispatch and diff after — an inventory existing only inside the agent's context is unfalsifiable once the agent returns.

A rewrite legitimately rewords, so a rule can survive carrying none of its original tokens. A keyword miss is not a loss. But the codebase "already having" a value is not the capture filter: the codebase holds the value, the rule holds why it matters (a script exists; the fact that it silently skips untracked files and still reports clean is the bite). Before deleting, ask: is my justification that something else in the repo already contains the string? If yes, stop.
