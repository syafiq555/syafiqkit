# Editing Skills Checklist

This guide covers the specific checks and failure modes to watch for when modifying skills, commands, or SKILL.md files. Read this when you're actively editing, not as standing reference — it's organized by edit type rather than daily concerns.

> Read this when modifying commands/skills. See CLAUDE.md for everyday conventions and structural facts.

## Before You Edit: Use the Editing Tool

Change these files with `Edit`, not with a `sed` or `python` rewrite. The reason is a guarantee rather than a preference: `Edit` refuses an anchor that is absent *or* non-unique, so it cannot silently hit the wrong occurrence. A script can, and does — `.index()` on a heading or phrase that appears twice finds the first, so a "replacement" inserts a second copy of a section rather than replacing anything. The file grows instead of shrinking, which no did-the-diff-land check looks for, and every section still reads correct on its own because what's wrong is the *set*. Later edits then anchor into whichever copy they reach first and compound it.

A structural inventory is what catches it — list every `## ` heading and confirm each appears exactly once. Content greps will not: they come back healthy when a fact is present twice.

The escape hatch ("a pass too repetitive to anchor by hand") is narrower than it reads, because *awkward* and *uniform* feel the same mid-flow and the second is the only one that qualifies. Where a script is genuinely right, assert the anchor appears exactly once before slicing, and take any baseline snapshot **before** the first suspect write — a snapshot taken afterwards reproduces the corruption on restore, turning a recoverable mistake into an unrecoverable one.

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
- **Pointer citations**: for every `📖 <file>` line added or touched, apply `unhobble-instructions`' fact-vs-constraint test to the cited file's content — does it hold a fact with a checkable, silent-failure consequence at a specific moment in THIS skill's own workflow (not just background depth)? If yes, that fact must be restated in this skill's own prose at the point it applies, with the pointer left for mechanics/depth only. A pointer whose surrounding prose only describes what the companion *contains*, never what it *requires*, is a bibliographic citation, not an instruction — the reader never descends into it until after already having violated it once. Model: `read-summary`/`merge-task-docs`/`haiku`/`task-summary`/`sweep-doc-overlaps`'s citations of `explore-delegation.md` state the constraint inline first, then point for depth. The reason this is a rule and not a preference: nothing makes a cited file load. `allowed-tools` governs permissions rather than loading and a SKILL.md has no `@import`, so every hop past the body is the reading model's judgement and lands well under half the time — a pointer defers a rule, it never delivers one. What raises follow-through is naming the trigger and the consequence where the citation sits (*when a pass moves content out of a file, read X, because both phases above are blind to what a move breaks*); a bare `📖 X for <topic>` does not, stating a penalty for skipping does not, and a pointer trailing at a section's end does worse than one at the moment of decision. **A reference file citing another reference file is the shape to check** — reaching the second costs two hops and is unreachable in practice, while reading as ordinary citation hygiene at both ends.

  **Write the path as `${CLAUDE_SKILL_DIR}/references/<file>.md` when the target is bundled with the skill.** That variable substitutes in skill markdown — verified live 2026-08-20, after [#9354](https://github.com/anthropics/claude-code/issues/9354) closed — so the reader gets an absolute path that is correct on any machine at any install version, instead of a relative one they must resolve against a working directory nobody stated. `${CLAUDE_PLUGIN_ROOT}` reaches anything else that ships. Neither reaches `tasks/`, which doesn't ship at all. Measured before this rule existed: of 125 pointers in this corpus, 11 named a trigger condition and **none** used an absolute path — the two cheapest levers on follow-through, both unused.

  ⚠️ **Auditing pointers needs a positive control, because the `📖` is inside the backticks and is not part of the path.** An extraction that keeps it tests a path starting with an emoji, which cannot exist, so *every* pointer reports broken and the run reads as a catastrophic finding rather than a broken checker. This has now happened to three separate agents on this corpus, one of which reported 38 of 127 broken when the real number was 2. Strip a leading `📖`, `> ` and `See `, exclude glob patterns and illustrative examples, and resolve one pointer you know is good first — if the checker can't confirm that one, its output is about itself. A universal failure is as suspicious as a universal miss.
- **Pointer depth**: resolve every `📖` path as a path — `ls` its target from the citing file's own directory — rather than reading it for plausibility. Depth is the failure that reading cannot catch, because the correct prefix differs by where the citing file sits (`../_shared/…` from a `SKILL.md`, `../../_shared/…` one level down in `references/*.md`) and the two are the same string. A wrong-depth pointer is dead on arrival while every other check passes: the target file genuinely exists, the citing prose is complete, nothing is orphaned, and no resolve-check keyed on the citation graph looks at the path. It also survives indefinitely once landed, so sweep the pattern rather than fixing only the instance in your diff.

## Specific Edit Types

### Skill Feels Bloated

Run `update-plugin`'s Step 3a density checklist before a from-scratch audit. Look for stacked warnings, worked anecdotes, cold-path extraction. If a skill was condensed before, check whether this is an arrival-rate problem rather than raw density — re-condensing has regressed both times it was tried. Extract cold paths to `references/` and apply Step 3a's replace-or-route gate; a B/L ratio barely moving after extraction means rules are irreducible, not under-cut.

### Adding a New Skill with Routing

A skill that routes to N owners needs a receiving branch in every one of them. The target's entry step scans for a session signal, but a handoff arrives with verdict already decided and no narrative to scan — it reads as "no signal, nothing to do" and the finding dies. Enumerate every owner the routing table names and open each one's entry step. A new skill with an unfinished routing table has more hand-off rows than actual targets edited.

Conversely, a new skill needs its existing callers re-pointed. A caller's `description:` cannot tell you whether it invokes something. A skill body ends in hardcoded `invoke <name>`, so the decision was made at authoring and never re-evaluates — adding a cheaper sibling leaves every caller locked to the original. Grep the old skill's name across `skills/*/SKILL.md` bodies and open each hit.

### Adding a Conditional Step or Branch

A gate is only real if some step computes its inputs. A new condition ("skip when under the floor", "only if over budget") reads as enforced while nothing instructs the executor to compute it; an unmeasured condition resolves to default (usually permissive), so the gate passes by doing nothing. A sibling step that does measure is not cover — if Step 5 owns measurement but Step 4 needs it, Step 4's measurement line was missing.

A branch whose condition only one code path evaluates is dead on every invocation skipping that step. Example: a rule keyed off a guard ("before scanning") while the reporter's repro passed an explicit path — the branches are unreachable exactly where the bug was filed. State the condition run-wide and trace it from every entry point, not just the one you were editing.

### Changing What a Skill Prints

A skill with an `## Output` template has two places its shape can live, and only one of them gets copied. A rule added as prose ("ask it above this table", "put X before the summary") tells the reader where something goes and leaves them nothing to reproduce, while the template beside it still shows the old shape — so the template wins, because that's what gets followed. Worse, prose describing a position can contradict its own location: a sentence inside the operator-commentary slot saying "above this table" sits below the table it names.

Render the change in the template. Where several skills share the shape, each one's template carries it and a single reference owns the reasoning, so the rendered blocks stay identical while the argument for them is stated once. Check by reading only the fenced template of each skill you touched: if the new element isn't visible there, a session copying the template won't produce it.

### Editing Agent Files

Agent template/generated file parity is non-negotiable: editing `.claude/agents/<name>.md` requires patching `skills/agent-setup/templates/<name>.template.md` in the same change. Otherwise the next `/agent-setup` regenerates the old behavior. Before fixing, grep the literal line across both `.claude/agents/` and `templates/`; fix every hit. Drift happens silently — a spawn 400ing with `effort` not supported might be a template mismatch, not an environment fault.

**When they have already diverged, which side is stale is a finding rather than a given.** The template is the regeneration source, which makes "the template is canonical" sound like it settles the question, and it doesn't: the two files are edited by different passes — a prose or unhobbling sweep rewrites the template, a session fixing live agent behaviour edits the generated copy — so each can be ahead of the other on a different axis at the same time. Restoring wholesale in either direction then discards a real improvement, and copying *toward* the template additionally ships project-specific text upstream into a file meant to stay generic. Read the diff and decide per hunk; changes that cluster into distinct topics rather than one contiguous block are the tell that both sides were edited independently.

### Touching Any Skill: Registry Sync

The skill registry lives in two hand-maintained places: `CLAUDE.md`'s Skills table(s) and `README.md`'s. Adding to one without the other is the common miss, and the worse failure is silent rot in tables nobody edited — three skills were absent from CLAUDE.md's table for months while present in README. Never trust them by eye. The directories under `skills/` are the only source of truth, so build the list from disk and check each name appears in both tables, ignoring `_shared` which is a reference folder rather than a skill.

Whatever way you extract the registered names, **confirm the extraction found roughly the number of skills this plugin has** before believing a clean result. Any approach that keys on CLAUDE.md's section headings or table shape stops matching the moment someone splits a table or renames a heading, and what it then reports is zero rows missing — indistinguishable from a healthy registry. That has already happened here once. A near-empty extraction on a thirty-skill plugin means the extraction broke, not that the registry is clean.

### Naming Plugin-Internal Paths

Two different things get written as `tasks/…` and only one of them travels. A **generic** path (`tasks/<domain>/<feature>/current.md`) describes the convention this plugin teaches a project to adopt, and resolves in whatever repo the skill is running in — that is fine anywhere. A path naming **this plugin's own docs** (`tasks/plugin-maintenance/…`) resolves only on this checkout, and the commonest way it appears is not as a step but as a *citation* — a decision id offered as provenance for a rule. Those are the ones that survive review, because a citation looks like scholarship rather than an instruction and nobody asks whether the reader can open it. A consumer gets a rule whose stated evidence is a file they do not have. Carry the finding in the sentence instead: *this was measured — two skills hand-condensed for clarity came out denser two weeks later* teaches what the decision id was standing in for, and costs one clause. Keep the id only where the audience is this checkout.

A skill step naming `tasks/**` as something to READ or WRITE is unreachable from an install. `tasks/` is not shipped (verify: `ls ~/.claude/plugins/cache/syafiqkit/syafiqkit/<ver>/`); marketplace installs are version-scoped so literal paths go stale on update; `~` doesn't resolve on native Windows; WSL-shared `~/.claude` stores paths broken on the other side. A read-target degrades quietly; a write-target stops and asks mid-skill. Route writes through `update-plugin` (the only skill with an ownership gate). State non-shipped paths as "source-checkout-only" rather than hunting for a safe default.

### Inserting into Markdown Structure

Inserting a new warning/callout between existing table rows splits one Markdown table into two; the second half loses its header separator and fails to render. Move the callout to a table boundary (before the first row or after the last).

Inserting a step into a numbered list with markers like `6b.` is invalid GFM and renders as a paragraph, terminating the list so following items restart at 1. Renumber the tail instead, then re-check any cross-references at or below insertion.

### Writing a Shell Snippet Into a Skill Body

Invoking a skill with an argument (`/syafiqkit:foo some/path`) makes the harness replace every bare dollar-zero token in that skill's body with the argument text, before the agent reads it. Fenced blocks and inline code spans get no protection, and it reaches a sentence *describing* the token as readily as a command using it. Only dollar-zero is affected; `$1`, `$2`, `$9` and friends pass through intact (verified 2026-08-14 against issue #22, which hit it in `condense-task-doc`).

It fails silently: an `awk` whole-line capture becomes `awk '{s=some/path}'`, which awk accepts as a bare regex, so a size or line-count verdict comes back plausible and wrong rather than erroring. Capture a whole line through a shell variable instead — `grep -n` for line numbers, then `sed -n "${var}p"` to read the text back.

Audit with `grep -rn '[$][0]' skills/ commands/` before landing a new snippet; it should stay at zero hits (that bracketed form matches the same thing without putting a literal token in this file). `references/` files are read on demand rather than rendered as a skill body, so they aren't exposed, but write them the same way anyway.

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
