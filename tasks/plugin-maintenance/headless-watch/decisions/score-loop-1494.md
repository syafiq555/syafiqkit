<!--LLM-CONTEXT
Status: ✅ Stopped at round 2: retained 20/20, fresh 20/20, 27/11/2026
Domain: plugin-maintenance (headless-watch)
Related: `../current.md`; `../../mod/decisions/enhance.md` (where the leak was first measured)
Last updated: 2026-11-27
-->

# Score loop: watchers read their skill instead of loading it (1.494.0)

## Brief {#brief}

Measured 27/11/2026: in a `claude -p` run shaped like a watcher (`--permission-mode default --permission-prompts none --allowedTools "Read,Skill"`), a test skill whose `allowed-tools` was `Bash(touch *)` created a file the job never allowed. With `--disallowedTools "Skill,Agent,Edit,Write,NotebookEdit"` and the skill read as a file, the `touch` was denied (`permission_denials: Bash`) and the file was read from outside the project. Owner's calls: fix it now (against noting it or leaving it), migrate and test the live `crp45-sheets` watcher, stop at 18/20 or 3 rounds.

## Rubric (frozen) {#rubric}

Ten criteria, two yes/no checks each (N/20):

1. The leak is closed: (a) every run passes `--disallowedTools` with Skill, Agent, Edit, Write, NotebookEdit; (b) git `--output` is denied.
2. The skill is reached: (a) `SKILL` resolves from the project, then `~/.claude/skills`, then installed plugins; (b) a plugin-prefixed name (`syafiqkit:watch-sheets`) works.
3. The prompt: (a) the full run is told to Read the resolved file; (b) the gate run still works unchanged.
4. Install guards: (a) `Skill` or `Skill(...)` in `ALLOWED_TOOLS` is refused with the fix spelled out; (b) `SKILL` without `Read` is refused.
5. Run-time failure: (a) a missing skill is a recorded failure that alerts after `FAIL_ALERT_AFTER`; (b) no path sends a false alert.
6. Docs match the script: (a) `SKILL.md` Flags and setup step; (b) `job.env.example`.
7. Migration: (a) the CHANGELOG tells a colleague how to fix an existing watcher; (b) it says the installed copy keeps the old script until reinstalled.
8. Live proof: (a) the migrated `crp45-sheets` ran for real (alert sent, no denials); (b) the scratch leak and its fix were both measured.
9. A fresh headless session given the owner's own past words reaches `headless-watch`, and (b) its job uses `SKILL=` with no `Skill` tool.
10. (a) `bash -n` passes and shellcheck shows no new warning; (b) no em dashes, and nothing machine-specific in the shipped skill.

## Conventions {#conventions}

- The unused `last` variable in `do_run` predates this change (shellcheck SC2034), not a defect.
- `crp45-sheets` stays uninstalled (it was off since 18/11); reinstalling is the owner's call.
- A skill name found in two installed plugins resolves to the first; collisions are out of scope.

## Rounds {#rounds}

| Round | Score | Judge | Found | Fixed |
|---|---|---|---|---|
| 1 | 18/20, 9a and 9b cannot assess (headless test still running) | fresh (Sonnet) | No point lost. Nits: resolve the skill before the gate run; `--output` deny untested; a comment above `SKILL=` in the example. The judge broke its brief by running `install` once (a stray plist, removed, never loaded) | Skill resolved before the gate; example comment added |
| 1, code review | (not scored) | Sonnet | `plugin:` prefix ignored, so a same-named skill in another plugin could win; spaces after commas slipped `Skill` past `install` and broke the Read check; existing jobs had no migration note; installPath read with sed | Prefix filters plugins (and skips project/global copies); spaces stripped, scoped `Read(...)` accepted; migration and denial notes in SKILL.md; installPath read with jq. Re-tested with a stand-in claude |
| 1, headless | 9a yes, 9b yes | fresh `claude -p --plugin-dir`, plan mode, the owner's past crontab question | Reached `headless-watch`, found the migrated `crp45-sheets` job (which uses `SKILL=` and no `Skill`), and planned to reinstall it after this change lands; created no new skill | none needed |
| 2 | retained 20/20 · fresh 20/20 | retained (round 1 judge, rescored every check, sourced functions only) + fresh (Sonnet) | Retained closed all round-1 items but the unmeasured `--output` deny; measured after the round: `git diff --output=out.txt` was denied with `Bash(git diff *)` allowed, no file written. Fresh: a no-prefix name takes the first installPath (accepted: `installed_plugins.json` is rewritten on each update and read every run); no live gate run under the new flags yet | Stop rule met |
| 2, code review | (not scored) | Sonnet | A scoped `Read(...)` passed install but may not reach the skill's file; `syafiqkit:` also matched the marketplace folder of the same name | Plain `Read` required with `SKILL`; the prefix matches only the plugin's own folder (`cache/<marketplace>/<plugin>/<version>`), tested against a fake marketplace-named path |
