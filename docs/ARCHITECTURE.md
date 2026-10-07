# syafiqkit — Architecture {#architecture}

Frame: arc42 sections, with a C4-style context diagram. Written by adoption on 2026-10-07. Tags: `[SOURCED]` traces to a recorded statement, `[INFERRED]` is derived, `[TBD]` is undecided. Tags are content; do not strip them. The rules most easily broken in one line are in `ARCHITECTURE-ESSENTIALS.md`.

## 1. Introduction & goals {#goals}

A Claude Code plugin made of markdown. No build step, no runtime code beyond one `cat` hook: [SOURCED] "markdown files are interpreted directly". Its product is instructions a model reads, so the architecture is about *when* each instruction reaches the reader.

Quality goals, ranked [INFERRED]:

1. **A rule reaches the reader at the moment it applies.** Most of the repo's decision history is about this.
2. **Safe for readers who are not the author.** Skills ship to colleagues' machines and repos.
3. **A fact has one home.** Duplication drifts silently.
4. **Cheap to change.** No build, one version bump per change.

## 2. Constraints {#constraints}

- [SOURCED] Skills and agents are plain files the harness loads. [INFERRED] The plugin therefore runs no code of its own except through its hook.
- [SOURCED] After a compaction only the first 5,000 tokens of each skill are re-attached (25,000 shared).
- [SOURCED] A mid-session reload registers a new skill's name but not its description.
- [SOURCED] Claude Code is a native binary with no bundled Node; a hook cannot assume an interpreter.
- [SOURCED] Consumers install without repo access and run in their own repos, OSes and shells.
- [SOURCED] No CI, no staging; push to `master` is the release.

## 3. Context & scope {#context}

```
 author / colleague
        │  types /skill or a phrase
        ▼
 ┌───────────────── Claude Code (harness) ─────────────────┐
 │  loads CLAUDE.md hierarchy ◄── project + global + local │
 │  SessionStart hook ──► cat hooks/RULESET.md ──► context │
 │  skill match ──► SKILL.md body ──► references/ (📖)     │
 │  Agent tool ──► .claude/agents/*.md (project agents)    │
 └───────────┬─────────────────────────────┬───────────────┘
             │ installed from              │ acts on
             ▼                             ▼
   GitHub: syafiq555/syafiqkit      consumer repo: tasks/**, CLAUDE.md,
   (marketplace add + plugin update)   docs/, git, remote servers, Chat, PDFs
```

External partners: GitHub (distribution); optional plugins `code-simplifier`, `feature-dev`, `claude-md-management` (each has a manual fallback); the user's project agents; `remote` CLI, Docker MySQL, Google Chat and Chrome tooling used by individual skills.

## 4. Solution strategy {#strategy}

- **Instructions are placed by when they must fire, not by topic.** [SOURCED] Hook for every turn, `RULESET.md` or root CLAUDE.md for every session, path-scoped rules for matching files, skill body for a named task, a `📖` reference only if the reader chooses to look.
- **Skills orchestrate; agents execute.** [SOURCED] Bootstrap pattern: agents read the project's CLAUDE.md at runtime and keep only essential rules inline.
- **Judgement over prescription, facts kept.** [SOURCED] Rigid rules are folded into reasoning unless the exact command or flag is the knowledge.
- **Verify the artifact, not the report.** [SOURCED] A delegated agent's summary describes its method; diffs, greps and re-runs are ground truth.
- **Task docs carry memory between sessions.** [SOURCED] Decision records (MADR) in `tasks/<domain>/<feature>/current.md` plus `decisions/*.md`.

## 5. Building block view {#building-blocks}

| Block | Path | Owns |
|---|---|---|
| Manifests | `.claude-plugin/plugin.json`, `marketplace.json` | Identity and version (must match) |
| Skills | `skills/<name>/SKILL.md` and `references/` | Task procedures |
| Shared references | `skills/_shared/references/` | Rules cited by three or more skills |
| Commands | `commands/*.md` | Invocation prompts (journal read/update) |
| Hook | `hooks/hooks.json`, `hooks/RULESET.md` | Output-style injection |
| Agent templates | `skills/agent-setup/templates/*.template.md` | Source for generated project agents |
| Generated agents | `.claude/agents/*.md` | This repo's own agents; must stay in parity with templates |
| Task docs | `tasks/plugin-maintenance/<feature>/` | The plugin's own decision history; not shipped |
| Release gate | `.githooks/pre-commit` | Version-drift check; armed per clone |
| Release log | `CHANGELOG.md` | One entry per version, written with the bump |

Skill families and which skills spawn which are in `CLAUDE.md` (invocation-pattern tables and Sub-skills). `ls skills` is the authoritative list.

## 6. Runtime view {#runtime}

**Session start.** Harness fires `SessionStart` on `startup|resume|clear|compact` → `cat hooks/RULESET.md` → stdout becomes context. `fork` is unwired. A missing file is expected to degrade rather than block; [TBD] never observed end-to-end.

**Wrap-up and release.** `/done` fans out simplifier, reviewer and product-reviewer agents, cleans temp code, captures knowledge via `update-claude-docs`, updates task docs via `task-summary`, and gates a plugin-learnings pass via `update-plugin`. `/ship` includes its own commit, then changelog, push, CI verify and release note. Consumers pick the release up with `claude plugin update syafiqkit@syafiqkit`.

**A long session compacts.** Anything past each skill's re-attach ceiling silently stops existing while the skill still reports as invoked. Hook output re-fires on `compact`, but a long session that never fills its window never re-fires it.

**A skill spawns agents.** Results return as ordinary tool results; passing `name:` changes that (see essentials: a named agent's report never returns).

## 7. Deployment view {#deployment}

[SOURCED] GitHub remote `git@github-personal:syafiq555/syafiqkit.git`; marketplace source `./`. Consumers: `claude plugin marketplace add https://github.com/syafiq555/syafiqkit`, then `claude plugin install syafiqkit@syafiqkit`. No servers, no CI.

## 8. Crosscutting concepts {#crosscutting}

- **Portable instructions.** State what to establish; give a literal command only where the invocation is the knowledge.
- **Self-contained, bump-per-change, two-place registry, pointer depth.** Stated once, in `ARCHITECTURE-ESSENTIALS.md`.
- **Place a rule by when it must fire.** [SOURCED] Every turn is a hook; every session is `RULESET.md` or a root CLAUDE.md; a named task is a skill body. A rule that has failed twice is not fixed by rewording; change which of those it lives in. `CLAUDE.md` §Where a rule goes, by when it must fire.
- **A mid-session reload cannot test a trigger.** [SOURCED] It registers a skill's name but not its description, so auto-fire is testable only in a session started after the file was written. `CLAUDE.md` §Skill and Command Structure.
- **Renumbering steps breaks citations.** [SOURCED] After changing a step label, grep for citation syntax (`Step N`, `rule N`) rather than the retired label, and read every hit including your own. `CLAUDE.md` §Authoring Checklist.
- **Doc set shape** for this repo's own docs: this `docs/` set plus `tasks/`.

## 9. Architecture decisions {#decisions}

[SOURCED] Held as MADR logs in `tasks/plugin-maintenance/`: `agent-architecture` (agent definitions, delegation, parity), `doc-condensation` (one fact, one home; size policy), `external-guidance` (grading outside advice against local measurement), `madr-structure`, `output-style-hook`, `skill-authoring`. Read the matching Quick Start before changing that subsystem.

## 10. Quality requirements {#quality}

| Goal | How verified today |
|---|---|
| Rule reaches the reader | Ruleset adherence hand-measured across transcripts; skill ceiling measured with a tokenizer. [TBD] no routine |
| Safe for non-authors | Review against the portability references; consumer issues |
| One home per fact | Greps for the mechanism's own words; `sweep-doc-overlaps` |
| Version integrity | `.githooks/pre-commit`, if armed |

## 11. Risks & technical debt {#risks}

- Several skills exceeded the re-attach ceiling when last measured (2026-09-29; `uiux` since fixed). Re-measure rather than trust a recorded list.
- Ruleset adherence was measured at 70% (ten transcripts, 2026-09-14) and 84% (one long transcript, 2026-09-15), before the fifth and sixth wording passes; later passes are unmeasured. Wording may not be the lever.
- `agent-architecture` task docs are structurally over the 300-line budget by decision.
- The version gate and agent/template parity depend on per-clone setup and per-hunk judgement, not on enforcement.

## 12. Glossary {#glossary}

| Term | Meaning here |
|---|---|
| Ruleset | `hooks/RULESET.md`, the output-style payload injected at session start |
| Re-attach ceiling | 5,000 tokens of a skill kept after a compaction |
| Bootstrap pattern | Agents read CLAUDE.md at runtime instead of inlining rules |
| Task doc | `tasks/<domain>/<feature>/current.md`, a session-to-session memory file |
| MADR | Decision-record format used in task docs (`D-<slug>` entries) |
| 📖 pointer | A reference the reader may choose to open; defers a rule, never delivers it |
| Parity | A generated agent and its template agree; says nothing about either being right |
| Consumer | Anyone running the plugin outside this checkout |
| Doc set | Index file plus its `decisions/*.md` siblings, treated as one document |
