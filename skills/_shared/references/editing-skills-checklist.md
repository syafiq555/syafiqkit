# Editing Skills Checklist

This guide covers the specific checks and failure modes to watch for when modifying skills, commands, or SKILL.md files. Read this when you're actively editing, not as standing reference — it's organized by edit type rather than daily concerns.

> Read this when modifying commands/skills. See CLAUDE.md for everyday conventions and structural facts.

## Before You Edit: Tree State

Run `git status --short` before measuring anything. A ratio computed against a dirty tree describes files carrying another session's unshipped edits; the baseline appears clean when it isn't. A dirty target also invalidates `git diff HEAD` as a verification baseline — the other writer's lines appear as `-`, and "restoring" them destroys their work. Commit or snapshot first.

Quote every before/after figure from `git show HEAD:<path> | wc -lc`, not from working-copy measurements. On a dirty file the working copy is someone else's starting point plus yours, so a byte count reports their bytes as your growth.

## When Running Code Simplifier

Code-simplifier targets <100 lines per command; 47%+ reduction signals genuine bloat. When evaluating results:

- Dense tables can exceed target line count while individual cells run 800+ characters. Use `wc -c` alongside `wc -l` before ranking files by size. Compute bytes/line ratio (`echo "scale=1; $(wc -c < f)/$(wc -l < f)" | bc`) with a tool, never by estimation.
- Any size figure that reaches a reader (a CHANGELOG note, a release statement) gets `wc` run on it first, not just condense-trigger decisions. A comparative figure like "~76KB vs ~28KB" disguises estimation if only one side is verified. A skill's real cost is the sum of what it loads, not derivable from the SKILL.md you have open.

## Review Checklist for Skill Edits

When modifying a skill, before landing the change, verify:

- **Tool parameters**: Missing `path` param on Glob/Grep instructions
- **Consistency**: Behavior vs related commands/skills; define vague terms ("related", "connection")
- **Edge cases**: Archived docs, Status: Done records, any boundary condition
- **Skill references**: Non-existent terminal skills (verify they exist in `skills/*/SKILL.md`)
- **Redundancy**: Same flow described in 4+ places (checklist + diagram + prose + after-section) — one `## Steps` section is enough
- **Reachability analysis**: A clean code review of changed lines doesn't clear rules whose defect is reachability — whether any code path evaluates their condition lives between sections, invisible to file-scoped review. Product reviewer finds this; code reviewer doesn't.
- **Pointer citations**: for every `📖 <file>` line added or touched, apply `unhobble-instructions`' fact-vs-constraint test to the cited file's content — does it hold a fact with a checkable, silent-failure consequence at a specific moment in THIS skill's own workflow (not just background depth)? If yes, that fact must be restated in this skill's own prose at the point it applies, with the pointer left for mechanics/depth only. A pointer whose surrounding prose only describes what the companion *contains*, never what it *requires*, is a bibliographic citation, not an instruction — the reader never descends into it until after already having violated it once. Model: `read-summary`/`merge-task-docs`/`haiku`/`task-summary`/`sweep-doc-overlaps`'s citations of `explore-delegation.md` state the constraint inline first, then point for depth.

## Specific Edit Types

### Skill Feels Bloated

Run `update-plugin`'s Step 3a density checklist before a from-scratch audit. Look for stacked warnings, worked anecdotes, cold-path extraction. If a skill was condensed before, check whether this is an arrival-rate problem rather than raw density — re-condensing has regressed both times it was tried. Extract cold paths to `references/` and apply Step 3a's replace-or-route gate; a B/L ratio barely moving after extraction means rules are irreducible, not under-cut.

### Adding a New Skill with Routing

A skill that routes to N owners needs a receiving branch in every one of them. The target's entry step scans for a session signal, but a handoff arrives with verdict already decided and no narrative to scan — it reads as "no signal, nothing to do" and the finding dies. Enumerate every owner the routing table names and open each one's entry step. A new skill with an unfinished routing table has more hand-off rows than actual targets edited.

Conversely, a new skill needs its existing callers re-pointed. A caller's `description:` cannot tell you whether it invokes something. A skill body ends in hardcoded `invoke <name>`, so the decision was made at authoring and never re-evaluates — adding a cheaper sibling leaves every caller locked to the original. Grep the old skill's name across `skills/*/SKILL.md` bodies and open each hit.

### Adding a Conditional Step or Branch

A gate is only real if some step computes its inputs. A new condition ("skip when under the floor", "only if over budget") reads as enforced while nothing instructs the executor to compute it; an unmeasured condition resolves to default (usually permissive), so the gate passes by doing nothing. A sibling step that does measure is not cover — if Step 5 owns measurement but Step 4 needs it, Step 4's measurement line was missing.

A branch whose condition only one code path evaluates is dead on every invocation skipping that step. Example: a rule keyed off a guard ("before scanning") while the reporter's repro passed an explicit path — the branches are unreachable exactly where the bug was filed. State the condition run-wide and trace it from every entry point, not just the one you were editing.

### Editing Agent Files

Agent template/generated file parity is non-negotiable: editing `.claude/agents/<name>.md` requires patching `skills/agent-setup/templates/<name>.template.md` in the same change. Otherwise the next `/agent-setup` regenerates the old behavior. Before fixing, grep the literal line across both `.claude/agents/` and `templates/`; fix every hit. Drift happens silently — a spawn 400ing with `effort` not supported might be a template mismatch, not an environment fault.

### Touching Any Skill: Registry Sync

The skill registry lives in two hand-maintained places: `CLAUDE.md`'s Skills table(s) and `README.md`'s. Adding to one without the other is the common miss, and the worse failure is silent rot in tables nobody edited — three skills were absent from CLAUDE.md's table for months while present in README. Never trust them by eye; diff against disk, which is the only source of truth:

```bash
sed -n '/^## Skills by Invocation Pattern/,/^## Typical Workflow Sequences/p' CLAUDE.md | grep -oE '^\| `[a-z-]+`' | tr -d '|` ' | sort > /tmp/c.txt
ls -d skills/*/ | grep -v _shared | sed 's|skills/||;s|/||' | sort > /tmp/d.txt
comm -13 /tmp/c.txt /tmp/d.txt   # any output = rows missing from CLAUDE.md
```

The `sed` range is hardcoded to CLAUDE.md's current section headers, so a session that restructures CLAUDE.md's skill tables (splitting one table into several, renaming a header) silently breaks this command — the range matches nothing, `comm` compares empty against disk, and it reports zero rows missing even when rows genuinely are. This already happened once. Before trusting a clean result, confirm `/tmp/c.txt` actually has entries in it (`wc -l /tmp/c.txt` — near-zero on a ~30-skill plugin means the range broke, not that the registry is clean), and if CLAUDE.md's headers changed this session, update the range in the same edit.

### Naming Plugin-Internal Paths

A skill step naming `tasks/**` as something to READ or WRITE is unreachable from an install. `tasks/` is not shipped (verify: `ls ~/.claude/plugins/cache/syafiqkit/syafiqkit/<ver>/`); marketplace installs are version-scoped so literal paths go stale on update; `~` doesn't resolve on native Windows; WSL-shared `~/.claude` stores paths broken on the other side. A read-target degrades quietly; a write-target stops and asks mid-skill. Route writes through `update-plugin` (the only skill with an ownership gate). State non-shipped paths as "source-checkout-only" rather than hunting for a safe default.

### Inserting into Markdown Structure

Inserting a new warning/callout between existing table rows splits one Markdown table into two; the second half loses its header separator and fails to render. Move the callout to a table boundary (before the first row or after the last).

Inserting a step into a numbered list with markers like `6b.` is invalid GFM and renders as a paragraph, terminating the list so following items restart at 1. Renumber the tail instead, then re-check any cross-references at or below insertion.

### Adding an ADR

New decisions get a topic slug (`D-<kebab-slug>`), not the next chronological integer. See `skills/task-summary/references/templates.md`'s MADR section for the convention and collision-check. Existing `D-N` blocks stay as-is; don't renumber retroactively.

## Self-Diagnosis: Git Probes

`git -C <dir>` walks up to an enclosing repo. An ownership/identity probe pointed at a plugin directory can answer about `~/.claude` itself and report a confident, wrong remote. Under dotfiles management, the parent is a real repo with real origin, so the probe succeeds and misattributes rather than erroring. A grep that happens to miss then yields the right verdict for the wrong reason and inverts the moment someone forks the settings repo. Ask the question of CWD (`git rev-parse --show-toplevel`), which is the tree you'd edit and has no path to go stale.

## Growth Measurement

`git log --since` growth measurements count files CREATED in the window as having grown by their entire length, so a brand-new file ranks #1 on its first audit and routes into the action queue, crowding out real signal. Disqualify in-window creations (`git log --diff-filter=A`) before ranking; a file with no baseline has no arrival reading.

## Writing Prose Under a Style Rule

A skill step writing prose under a stated formatting/style rule is a candidate to violate that same rule in its own wording. A fix for "don't write flat imperatives" can itself land as bolded imperatives, and nothing else catches it because every other check reviews target file content, not text you just wrote. When you write formatted output under a style rule, re-read your new text against the rule it's applying.

## Thinking Blocks (Retired)

The `<thinking>` block pattern was retired 2026-07-16 after zero uptake across 18 skills. Reasoning scaffolds belong to the harness/output-style layer, not skill files — a skill that hardcodes one fights whatever output style is active. Don't add them.

## Prompting Techniques: When to Skip

The Constitutional (`❌ Never / ✅ Always`) and Validation-Loop patterns earn their place on skills that make routing/write decisions. Skip them for simple commands (<3 decision branches) and read-only commands that write no files — on a trivial command they add noise without benefit.

## Verifying Edits After Writing

After rewriting a skill or command:

1. **Grep for facts**: Extract every critical fact identified before editing. Grep for each one and confirm it survived somewhere in the rewrite. A survival that's unverified by re-reading is unverified.

2. **Identifier sweep**: Extract every backtick-quoted identifier and bare number from the pre-edit original. Grep each one against the rewritten file (or wherever it moved in a larger restructure). Every miss is a finding to inspect.

3. **Verify factual claims**: Any claim the rewrite states in new words (relabeling keys, reframing a relationship) is unverified. Settle it against the source it describes. A claim you can't settle is one you should have left alone.

4. **Check line-prefix characters**: Restructuring drops markdown delimiters easily — a lost `>` detaches blockquote lead lines, or a corrupted `{{#` still contains the intact ID so an anchor grep passes while the anchor doesn't resolve. Match delimiters exactly (`grep -c '{{#'`) or read the raw span.

5. **Reconcile inbound references**: A `grep -rn "<basename>"` across the docs tree finds pointers to the file. Check each against what it now says. A merged section leaves old anchors landing nowhere, and nothing 404s — the reader arrives at something plausible and concludes the fact isn't there.

6. **Re-read your own new prose**: A rewrite arguing against rigid imperatives while opening with bolded ALL-CAPS has undercut its own point. Apply the same test you ran on the target.
