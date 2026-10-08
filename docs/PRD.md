# syafiqkit — Product Requirements {#prd}

Frame: Shape Up pitch (problem, appetite, no-gos) plus the sections a reader expects in a `PRD.md`. Written by adoption on 2026-10-07 from the README, `CLAUDE.md`, `CLAUDE.local.md`, `CHANGELOG.md` and `tasks/plugin-maintenance/`. Tags: `[SOURCED]` traces to a recorded statement, `[INFERRED]` is derived from behaviour, `[TBD]` is undecided. Tags are content; do not strip them.

## Problem & positioning {#problem}

[SOURCED] A Claude Code plugin of personal workflow automation: commits, task docs, release shipping, invoicing, PDF export, Google Chat formatting, remote DB sync, doc maintenance, UI/UX judgement. It began as one engineer's toolkit and now has friends and colleagues installing it.

[INFERRED] The product is a set of working habits made reusable. The recurring pain it removes is a fresh session repeating mistakes the last one already paid for: task context lost between sessions, docs drifting, releases shipped half-done. Its distinctive bet is that instructions fail from where they sit and how they are worded as much as from what they say, so much of the repo's effort goes into instruction design, not features.

Why now: [TBD — no statement of why the plugin was opened to colleagues beyond the fact that it was].

## Personas {#personas}

| Persona | Goals and pains | Status |
|---|---|---|
| **Author-maintainer** (Syafiq, senior engineer, Malaysia) | Wants every session to start with context, end with docs updated, and ship without ritual. Pain: sessions re-deciding settled questions; skills that misfire silently. | [SOURCED] `CLAUDE.md`, `CLAUDE.local.md` |
| **Colleague / friend installer** | Wants daily tools to get better and to know only whether action is needed. Pain: internal narrative, skill names and issue numbers in release notes; behaviour that changes without a way to opt out. | [SOURCED] `CLAUDE.local.md` §Users |
| **The loading session** (a Claude session reading the skills, agents and ruleset) | Wants the right instruction in front of it when the decision is made. Pain: a rule past the re-attach ceiling, a pointer it never opens, a description that never matches. | [INFERRED] `ARCHITECTURE.md` already treats it as the reader |
| **Consumer in an unversioned or unfamiliar repo** | Runs skills in a project with no git history, a different OS or no sibling docs. Pain: skills that assume the author's machine. | [INFERRED] from the portability rules in `CLAUDE.md` and consumer issues cited in task docs |

## Success metrics {#metrics}

[TBD — no target recorded]. Candidates a decision-maker could pick from, none of them agreed:

- Output-style adherence. [SOURCED] already measured by hand, 70% (ten transcripts) and 84% (one long transcript) of turns still opened with the banned shape, both before the later wording passes (`tasks/plugin-maintenance/output-style-hook/current.md`). No target.
- Skill auto-fire rate on the phrasings in each description. [TBD] Never measured; a trigger test is only valid in a session started after the file was written.
- Release-note readership or colleague-reported friction. [TBD]

## Scope — what it does today {#scope}

[SOURCED] Skills and commands are listed in `README.md` and grouped by invocation pattern in `CLAUDE.md`. By job:

| Job | What exists | Status |
|---|---|---|
| Capture and recall | Task docs (`task-summary` family), `read-summary`, `tackle`, `continue-session`, session journals | Live |
| Wrap up and release | `done`, `quick-done`, `commit`, `ship` | Live |
| Maintain docs and instructions | `update-claude-docs`, `condense-*`, `unhobble-instructions`, `refresh-instructions`, `merge-task-docs`, `sweep-doc-overlaps`, `setup-project-docs` | Live |
| Maintain the plugin | `skill-creator`, `update-plugin`, `agent-setup` and its agent templates | Live |
| Communicate | `casual-message`, `gchat-format`, `md-to-pdf`, `excalidraw-board`, `user-manual` | Live |
| Design and build judgement | `uiux`, `design-handoff`, `brainstorming`, `judgement`, `plan-worklist`, `setup-playwright`, `extract-shared-package`, `function-parameter-limits` | Live |
| Operations and billing | `pull-db`, `ci-ssh-deploy-timeout`, `commit-invoice-generator` | Live |
| Delegation | `haiku` | Live |
| Output style | `SessionStart` hook injecting `hooks/RULESET.md` | Live; delivered only as a 2,000-char preview from 2026-09-17 until the 2026-10-08 cut ships; adherence unverified from outside a session |

Re-derive the list with `ls skills commands`; exact counts are deliberately not recorded here.

## User stories and acceptance criteria {#stories}

[INFERRED] from skill descriptions; none were written as stories. Starting set, to be confirmed:

1. **As the author, I run `/done` after a change and get review, docs and task doc updated.** Accepted when the task doc's Status line matches the tree and every touched `current.md` is updated.
2. **As the author, I run `/ship` and a release goes out.** Accepted when both manifests agree, the CHANGELOG entry exists, the push landed on `master`, and a release note is produced for multiple readers.
3. **As a colleague, I install once and update with one command.** Accepted when `claude plugin update syafiqkit@syafiqkit` picks up the change and the release note says whether regeneration is needed.
4. **As any user, I type a natural phrase and the right skill fires.** Accepted when the phrasing in the description routes to that skill in a session started after the file was written. [TBD] — no routine exists to run this check.
5. **As a consumer in a repo with no commit yet, skills degrade rather than error.** Accepted when git-reading steps name what happens on error, not only on empty output.

## Out of scope {#out-of-scope}

- **Self-contained plugin, no reliance on the author's global instructions.** [SOURCED] Skills never reference `~/.claude/CLAUDE.md`, because colleagues do not have it.
- **No off-switch for the output-style ruleset.** [SOURCED] A deliberate decision: a `cat` hook cannot read an env var, and a guard means adding a script back. A request to make it optional reopens the design.
- **No script in the hook.** [SOURCED] Interpreter availability inside a hook is not guaranteed.
- **No CI and no deploy chain.** [SOURCED] The push to `master` is the ship.
- **No `fork` matcher on the hook.** [SOURCED] Unverified behaviour; a bounded, nameable gap was chosen over an unverified matcher.
- **No `disable-model-invocation` unless the user asks.** [SOURCED] It kills auto-suggestion.
- **Windows without Git Bash.** [SOURCED] The hook silently does nothing there. [TBD] Whether skills work there is untested.

## Roadmap {#roadmap}

[TBD — no roadmap recorded]. Open work lives in task-doc Quick Starts, for example the over-ceiling skills and unresolved 2026-09-29 review findings in `tasks/plugin-maintenance/doc-condensation/current.md`. Nothing is dated.

## Open questions {#open-questions}

| Question | Who decides | Blocks |
|---|---|---|
| Revisit the no-off-switch decision only if colleague feedback arrives; it stands until then | Syafiq | Any hook change |
| What is the success target for ruleset adherence and skill auto-fire? | Syafiq | Knowing whether a wording pass worked |
| Do `docs/` files ship to marketplace consumers? `tasks/**` is recorded as not shipping. | Syafiq, after listing a git-sourced install | Whether consumers can read these docs |
