# syafiqkit — Architecture Essentials {#essentials}

Read this whole before your first edit. Admission test: **can this be violated in a single line, silently?** Everything else is in `ARCHITECTURE.md`. Rules are cited by name, never by number. These are extracts of rules stated in `CLAUDE.md`; where they differ, `CLAUDE.md` wins and the extract is fixed.

Each entry names the `CLAUDE.md` section it extracts. Placing a rule by when it must fire is a design judgement and lives in `ARCHITECTURE.md` §8.

## Every change is a bump, and two manifests carry one version {#two-manifests}
*Extracts: Publishing and Versioning; Plugin Mechanics, Design Constraints.* `plugin.json` and `marketplace.json` must carry the same version; re-read both first and take the highest. No bump means consumers' `claude plugin update` sees nothing. Write the bump and its entry as one change; if the entry isn't ready, leave the version alone. Run `git config core.hooksPath .githooks` once per clone; unset, the gate is silently absent.

## The plugin is self-contained {#self-contained}
*Extracts: Authoring Skills and Commands, Conventions.* Never cite `~/.claude/CLAUDE.md` or any author-only path inside a skill, agent or reference. Colleagues do not have it.

## "Already stated elsewhere" must be reachable {#reachable-elsewhere}
*Extracts: Authoring Checklist.* Deleting a rule because this repo's `CLAUDE.md` states it removes the only copy a consumer would see. Grep the tree for the mechanism's words first.

## `allowed-tools` pre-approves, never restricts {#allowed-tools}
*Extracts: Skill and Command Structure.* Only `disallowed-tools` (skills) or `disallowedTools` (agents, camelCase) removes a tool. Each spelling is inert in the other's file and a misspelling fails silently.

## Do not add `disable-model-invocation` {#no-disable-invocation}
*Extracts: Authoring Checklist.* Not without a user request. It kills auto-suggestion.

## A skill past 5,000 tokens loses its tail after compaction {#reattach-ceiling}
*Extracts: Skill and Command Structure.* Measure with a tokenizer, never bytes÷4 (overstates by about 12%). The skill still reports as invoked.

## A pointer defers a rule, it does not deliver one {#pointer-defers}
*Extracts: Authoring Checklist.* Keep the sentence that tells the reader they have a problem inline; only the fix procedure goes behind a `📖`.

## Pointer paths resolve from the citing file {#pointer-depth}
*Extracts: Authoring Checklist, Shared rules.* `../` from `skills/<name>/SKILL.md`, `../../` from `skills/<name>/references/*.md`. A wrong depth reads correctly and 404s nowhere. `ls` the target from the citing directory.

## Renumbering steps breaks citations {#renumber-citations}
*Extracts: Authoring Checklist.* After changing a step label, grep for citation syntax (`Step N`, `rule N`), not for the retired label, and read every hit.

## A mid-session reload cannot test a trigger {#reload-no-trigger-test}
*Extracts: Skill and Command Structure.* It registers the skill's name but not its description. Test auto-fire only in a session started after the file was written.

## The hook is `cat`, with no off-switch {#hook-shape}
*Extracts: The SessionStart Hook.* No script, no `node`, no guard. Adding any of them reopens the design. `fork` is deliberately unwired. Hook stdout over 10,000 characters is silently replaced by a file path and a 2,000-character preview, so `RULESET.md` must stay under it; measure with `wc -m` before landing any pass on it.

## The mod loads as one file, built from `hooks/src/` {#mod-one-file}
*Extracts: The Mod.* `hooks/register.js` is the only module path `hooks.json` lists, and a hook cannot hand `$` to a function in another file, so the source lives in `hooks/src/` (folders core, docs, handoff, views) and `hooks/build.sh` joins it into `register.js`. `$` is never put in an object. A save that leaves a call to a function not yet written fails the reload and the old version keeps running, so rebuild the bundle whole. Run `claude plugin validate .` and `claude plugin test .` after any edit.

## A named agent's report never returns {#named-agent-reports}
*Extracts: Skill and Command Structure, agent templates.* Passing `name:` to `Agent` turns it into a teammate whose final text does not reach you. Tell it to `SendMessage`, or omit `name:`.

## Agent and template move together {#agent-template-parity}
*Extracts: Agent Definition Parity.* Patch `.claude/agents/<n>.md` and `skills/agent-setup/templates/<n>.template.md` in the same change, deciding per hunk which side is right. Parity proves agreement, not correctness. A read-only agent is verified by its enforcing `disallowedTools` line.

## Git probes use `rev-parse --show-toplevel` {#git-probes}
*Extracts: Authoring Checklist.* `git -C <plugin-dir>` walks up to an enclosing repo. State what a step does when git errors, not only when it returns empty.

## `tasks/**` writes go through `update-plugin` {#tasks-not-shipped}
*Extracts: Authoring Checklist.* `tasks/**` is recorded as not shipped to consumers, so nothing a consumer needs may live only there.

## `claude-md-pruner` keeps its name {#pruner-name}
*Extracts: Plugin Mechanics, Design Constraints.* It prunes task docs too, and renaming it breaks silent gates in `update-claude-docs` and `agent-setup`. Its `description:` carries the real trigger surface.

## Size policy lives in the condense skills only {#size-policy-home}
*Extracts: Plugin Mechanics, Design Constraints.* `condense-claude-md` and `condense-task-doc` own thresholds. A caller may name a number as a trigger and never enforces it as policy.

## `description` plus `when_to_use` share a 1,536-character cap {#description-cap}
*Extracts: Skill and Command Structure.* The two share one cap, so a long `when_to_use` eats the description's budget.

## `.githooks/pre-commit` must be executable {#hook-executable}
*Extracts: CLAUDE.local.md, Git hooks.* Without `chmod +x` git skips it in silence, the same way an unset `core.hooksPath` does.

## Registry lives in two places {#registry}
*Extracts: Authoring Checklist.* Add or rename a skill in `CLAUDE.md`'s table and `README.md`; check each against `ls skills`, not against the other.
