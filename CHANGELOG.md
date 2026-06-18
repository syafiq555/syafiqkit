# Changelog

## 1.42.0

- **notes-summary** (new skill) + **read-notes** / **update-notes** (command aliases): A personal session-journal counterpart to `task-summary`, for the conversations that don't belong in the repo — boss/teammate/client feedback, career and relationship dynamics, strategy chats. Borrows task-summary's living-doc discipline (LLM-CONTEXT header, Quick Start, density rules) but inverts the storage model: private, machine-local, under `~/.claude/notes/<domain-slug>/<thread-slug>.md` (never committed, never auto-memory — a personal log in the repo can't be un-tracked by `.gitignore` once committed, so it stays out of any repo entirely). Entries accumulate chronologically (not overwritten like Last Session); the lean blocks that stay current are Quick Start + Standing Takeaways + Open Threads.
- **notes-summary naming + research-driven refinements** (informed by parallel research into PKM/Zettelkasten, ADRs, and decision-journal practice): Path segments must be descriptive and evergreen — full `<domain-slug>/<thread-slug>.md` (e.g. `boss-hong-liang-ng/feedback-and-expectations.md`), never a one-word slug or a constant `summary.md` leaf (a constant filename carries zero information). Added **§4b supersede-never-rewrite** for decisions: a durable *rule* (Standing Takeaway) is edited as it evolves, but a *decision made at a point in time* is frozen — a reversal appends a new entry that supersedes the old, leaving the original verbatim, because hindsight bias silently overwrites what you believed before the outcome. Added **§4c review loop** + optional `Review:` header field surfaced on `/read-notes` when due — the cross-source consensus is that logs die from never being re-read ("documentation without a read path is performance art"), not from bad writing; the affordance is deliberately one field, not heavy process (heaviness kills the habit just as surely).

## 1.39.0

- **read-summary**: Added two guardrails against the failure where a vocabulary match loads the right *folder* but the wrong *bug*, and a confident conclusion answers a nearby question instead of the one asked. Discovery now warns that lexical match ≠ semantic match and to re-run discovery when the request's central claim mutates mid-investigation (chat transcripts reveal the real claim across several messages; "fixed before, came back" is a regression lead — find the prior fix, don't re-derive). The Investigation/diagnostic intent gained an **exit gate**: before concluding, state the question asked next to the question answered — if they differ it's *attribute substitution* (Kahneman); the conclusion must reconcile every clause and number the user gave, not just one. Both are worked `<example>` blocks rather than more ⚠️ prose. Captured from a combo-stock "set tak sync" report where the first diagnosis closed on the wrong field and missed the regression.
- **Suite convention pass** (informed by research into Anthropic's official skills): skills lean on worked examples + primacy ordering, not ALL-CAPS/NEVER escalation. Added one high-leverage `<example>` each to **done** (Glob-then-dispatch decision for project vs fallback agent), **agent-setup** (the inline-vs-skip threshold for critical rules), and **ship** (multi-account `gh auth switch` before push, genericized — no hardcoded username, since this repo is shared). **task-summary** gained a "Workflow at a glance" block at the top so the 5 steps are visible before the density rules (primacy fix; the workflow was previously buried under ~30 lines of formatting rules).

## 1.38.1

- **condense-task-doc** (new skill): Aggressively condenses bloated living-doc task files (`current.md`) — collapses investigation narratives into Bugs Fixed rows, strips verification numbers and commit SHAs from prose, deduplicates facts across sections, trims Quick Start to ≤15 lines, and rewrites in place using `Write`. Auto-triggers when updating a task doc already >300 lines. Complements `condense-claude-md` (which handles CLAUDE.md); this skill targets task docs.

## 1.38.0

- **condense-claude-md** (new skill): Aggressively condenses and restructures bloated CLAUDE.md files — strips verbose WHY columns, discoverable content, redundant tables, and overly long rows, then rewrites the file shorter and clearer using `Write` (not incremental `Edit`). Complements `claude-md-improver` (which adds missing content); this skill removes excess. Core heuristic: a rule stays if removing it would cause Claude to repeat a real past mistake. Preserves GitNexus `<!-- gitnexus:start/end -->` blocks verbatim and all `{#anchor}` IDs. Targets ≤200 lines for project root CLAUDE.md; reports before/after line count.

## 1.37.2

- **task-summary**: Added a `⚠️ MANDATORY` gap-check at the top of "When Updating" — an in-place update inherits whatever sections the doc already has, so a planning stub that just shipped silently keeps MISSING `## Key Technical Decisions` / `## Critical Gotchas` / `## Bugs Fixed` / `## Next Steps`. The step now requires listing the doc's `## ` headers, comparing to the template's required set, and adding any missing section before editing. Also names the root failure: a decision/gotcha/bug captured only in `## Last Session` is a bug (that section is overwritten every run), so durable facts must live in their typed table. Caught when a `/done`-driven update flipped a deposit-settlement doc from planning to built but left every decision and both bug fixes trapped in Last Session.

## 1.37.1

- **agent-setup**: Reviewer and simplifier templates gained TypeScript type-discipline examples, added as `[TypeScript]`-tagged commented rows inside the existing placeholder blocks so `agent-setup` surfaces them only when scaffolding a TS project (never on PHP-only repos). Reviewer gets a Bugs-category entry for type-drift silent bugs (union-keyed map typed `Record<string, X>`, or a non-exhaustive `switch` on a discriminated union with no `const _:never` guard — the consumer misses new cases with no compile error) plus a High-Frequency Mistakes row for hand-listed types that duplicate an existing source instead of deriving. Simplifier gets matching High-Impact and Tech-Stack rows steering toward `keyof typeof` / `typeof arr[number]` / `ReturnType` / mapped types, `as const`, `satisfies`, and `unknown` over `any`.
- **md-to-pdf**: Documented the xychart-beta default-palette gotcha — pass `plotColorPalette` via `mmdc -c` since the default palette renders poorly.

## 1.37.0

- **task-summary**: Added the missing sentence-level density layer (Layer 2) — short declarative sentences, ≤1 parenthetical, commit hashes only in Last Session, no inline verification metrics, plus a capture filter ("would a future session act differently knowing this?"). Fixed two self-contradictions that structurally forced doc bloat: the "put the why in → see Last Session" pointer targeted a section that gets overwritten every session (so rationale migrated into permanent rows as 10-sentence paragraphs), and "never delete historical rows" conflicted with pruning (a 37-row Task Status table with 34 dead rows). Now: rationale gets condensed in place (no archive files — pairs with `read-summary` loading the full doc each session), finished work streams collapse to one summary row, Files is a living map not a per-phase changelog, Last Session is ONE session ≤5 bullets, and >300 lines triggers a mandatory condense pass. Templates gained bad-vs-good sentence examples. Exemplar: the Dourr ads doc went 333→189 lines with zero in-force decisions/gotchas lost.
- **done**: Auto **light mode** — sessions touching <5 files in a single domain (no new feature/architecture, no external inputs) get a single reviewer agent, a path-scoped `task-summary` call (skips the multi-domain scan), and a compact one-table output. Full pipeline stays the default. Output template collapsed from four sections to one table that details only what was written/fixed.
- **update-claude-docs**: Entry style rules (≤2 sentences, no session storytelling, one example max, capture filter) and a rewritten Violations rule — escalate by **position + sharpness, not length**: REPLACE the old text, never append a second warning; callouts cap at 3 lines; rules already bloated from past escalations get condensed while hardening the core constraint. Validate step scans for narrative markers and flags >350-line target files for the pruner. Root cause: "clear but violated = not prominent enough" was implemented as "write more words", which compounded the same rule into 15-line war-story paragraphs.

## 1.36.0

- **ci-ssh-deploy-timeout** (new skill): Diagnose + fix CI/CD deploys that intermittently fail when the runner can't SSH into the target server (`dial tcp ***:22: i/o timeout`, "works on the 2nd re-run"). The skill's spine is *diagnose before fix*: it names the three causes that look identical in a CI log (transient packet loss / real firewall / sshd throttling) and runs a read-only rule-out checklist (`nc` port reach, `ufw`, `fail2ban`, `MaxStartups` — via `remote <alias>` if configured, else plain `ssh`) BEFORE touching anything, specifically to kill the "just allowlist the GitHub runner IPs" reflex (a dead end — hosted-runner pools rotate). The fix is the connect-only retry pattern (`retry_on_exit_code: 255` so genuine remote failures still fail fast on attempt 1), with `references/github-actions.md` (nick-fields/retry + direct ssh, incl. the YAML-literal-block heredoc false-alarm note) and `references/generic-ssh.md` (portable bash retry loop for GitLab/CircleCI/Jenkins/Makefile). Captured from a Dourr prod-deploy session where the firewall theory was chased before being ruled out by evidence.

## 1.35.1

- **ship**: Added a **version-bump gate** to Step 2 (Commit) — plugin/package repos must bump EVERY file carrying the version, not just the primary. `grep -rn '"version"' <manifest-dir>` discovers secondary fields (`marketplace.json` `plugins[0].version`, monorepo sub-manifests) that drift silently when only one is bumped. The bump rule lived in `CLAUDE.md#version-bumping` but the ship workflow that triggers a bump never referenced it, so it relied on memory — and a ship in this very session bumped only `plugin.json`, leaving `marketplace.json` stale at 1.34.3 until the user caught it. Fix moves the rule into the workflow that bypassed it.

## 1.35.0

- **agent-setup**: Templates and skill now seed two previously-missing high-value sections. The reviewer template gains a **"Known False Positives"** table (patterns that look wrong but are intentional — a reviewer needs them inline at zero-latency to *not* flag them) and the simplifier template gains **"Don't Simplify (Preserve These)"** (without it, a simplifier eventually collapses a deliberate guard). Also added multi-repo guidance for the sibling-repo case — when one session drives two repos whose agents don't both fire, the active agent carries a `⚠️ Two-repo session` banner, diffs both repos, and gets a second Bootstrap table + tagged sibling rules. Fixed a stale LSP step (`findReferences`/`goToDefinition` are often broken → use `hover` + `documentSymbol`). Steps 2/4/5 of the skill updated to cover all three. Caught while merging skill-depth into a project's agents and finding the templates couldn't express the false-positive list or the two-repo workflow.
- **update-claude-docs**: Step 6 (Agent Sync) rewritten from "agents read CLAUDE.md dynamically, no sync needed" to a **signal→agent routing table**. Default stays do-nothing (ordinary gotchas are picked up via Bootstrap — re-deriving agent tables would re-introduce the duplication the architecture avoids), but five agent-specific signals now route to a surgical agent edit: recurring false positive → reviewer's "Known False Positives"; wrongly-collapsed guard → "Don't Simplify"; new top-15 mistake → inline rules table; agent misbehavior → Process/Constraints; new sibling repo → two-repo banner. Structural changes still defer to `agent-setup`. Closes the gap where a false positive the reviewer kept flagging had no home but the agent file, which the skill never touched.

## 1.34.5

- **done**: Collapsed 5 steps to 4 (164→111 lines) — deleted the inline conversation-analysis procedure (old Step 3, sub-steps 3a–3d) that fully duplicated the `update-claude-docs` skill. Capture is now a single delegated Skill call, removing the "don't double-write" hedge that only existed to reconcile the two copies. `done` is now a pure orchestrator. Also wired the Output's User Instructions table to an explicit producer in the preamble (the slot previously had no step writing it). Caught when the workflow was flagged as bloated and an audit found the same capture logic written twice.
- **task-summary**: Added a top-level Density rules section to stop the #1 doc-bloat failure — the same fact restated across LLM-CONTEXT, Quick Start, Key Decisions, Gotchas, and Last Session. Rules: one-fact-one-home (sections point, don't restate), Gotcha/Decision rows ≤2 sentences, LLM-CONTEXT is a pointer index, Quick Start ≤15 lines. Strengthened `## Last Session` to enforce EXACTLY ONE such heading (it was being appended, producing duplicate dated copies). Fixes the generator so future docs stay dense rather than hand-trimming each one.

## 1.34.4

- **task-summary**: Read `references/templates.md` on every run, not just creation — the template (canonical section structure + gold-standard format) was only linked from the Create branch in §2/§3, so the Update path never loaded it and edits could drift from the template's conventions. §2 now reads both the resolved path and the template before the Create/Update fork. Caught when a "condense existing doc" request skipped the reference entirely because Update mode had no instruction to open it.

## 1.34.3

- **task-summary**: Reconcile back-references on update — index/roadmap/hub docs only *mirror* a feature's status and own no code, so the work-driven §1 scan never reaches them and their status drifts silently (a roadmap row reading "uncommitted" weeks after ship). New §6 step greps for docs that link back to the one just updated and status-syncs the mirrored row; §5 validation gains a check for it. Caught when a roadmap row still said "Implemented (uncommitted)" after the feature shipped to prod and only a manual "check all related" surfaced it.

## 1.34.2

- **read-summary**: Strengthen enforcement — add mandatory-first-action warning that blocks any query/edit/answer before the full Read Order completes; add explicit "Investigation / diagnostic" intent type (read-only questions like "is X paid by card?" or "why did Y fail?") to prevent premature answers

## 1.34.1

- **read-summary / update-claude-docs / task-summary**: Discover task docs by content, not folder name — folder slugs are engineer-domain-named and rarely match the request (`upload-redesign` owns "QC", `payout` owns "refund"). All three now `Glob`+`Grep` for the concept's vocabulary + synonyms across doc body + header, follow `Merged into`/`Supersedes` redirects, and verify a pointer's target exists before writing it. Prevents wrong-doc reads and duplicate docs.

## 1.34.0

- **pull-db**: New skill — transfer a MySQL/MariaDB database from a remote server to local dev environment; handles mysqldump on server, binary-safe scp transfer, MariaDB→MySQL FK compatibility fixes, password reset, and cleanup

## 1.33.0

- **done**: Enforce multi-domain task doc scan — removes single-path shortcut; task-summary always scans full conversation to avoid missed updates to related docs

## 1.32.0

- **done**: Multi-domain task doc updates — now scans all domains touched in session, not just the primary one; catches bug reports and feature requests mentioned across chat/email/WhatsApp
- **task-summary**: Multi-domain scan — when no explicit path given, scans full conversation (code changes, external inputs, verbal requests) and creates/updates a task doc per domain
- **gitnexus skills**: Add 6 new GitNexus skills — `gitnexus-cli`, `gitnexus-debugging`, `gitnexus-exploring`, `gitnexus-guide`, `gitnexus-impact-analysis`, `gitnexus-refactoring`

## 1.31.0

- **read-summary**: Auto-detect argument type — doc paths trigger read-and-wait, task descriptions trigger read-and-implement

## 1.30.0

- **read-summary**: Fix GitNexus queries for indexed repos
- **update-claude-docs**: Strengthen anti-memory rules — enforce CLAUDE.md/task docs over auto-memory for session learnings

## 1.29.0

- **commit**: Add GitNexus re-index step — automatically re-indexes knowledge graph in background after non-docs commits

## 1.28.0

- **commit**: Changelog gate is now fully autonomous — auto-updates and stages CHANGELOG.md instead of blocking and asking
- **update-claude-docs**: Add CLAUDE.local.md checklist — actively scans session for credentials, API headers, CLI one-liners, service URLs, and account mappings that belong in local (non-team) context

## 1.27.0

- **gchat-format**: New skill — convert Markdown content to Google Chat syntax (bold, code, bullets)
- **md-to-pdf**: New skill — convert Markdown documents to professional PDFs with rendered Mermaid diagrams
- **ship**: New skill — end-to-end shipping workflow: commit → changelog → push → verify CI/CD → GitNexus re-index → release note

## 1.26.0

- **read-summary**: Add domain CLAUDE.md loading — infers domain from task path, reads domain-scoped gotchas/patterns alongside task docs

## 1.25.0

- **task-summary**: Add mandatory Quick Start section — 5-question cold-start framework, rewritten on every update, added to both templates
- **write-summary/update-summary**: Clarify descriptions as aliases for task-summary skill

## 1.24.0

- **consolidate-docs**: Rewrite as conversational workflow — staleness audit, AskUserQuestion options, archive mode via `git mv` to flat `_archive/`, pattern migration to CLAUDE.md before archiving

## 1.23.1

- **read-summary**: Add mandatory GitNexus integration — queries execution flows and symbol context in indexed repos alongside file reads

## 1.23.0

- **agent-setup**: Add GitNexus tool guidance to agent templates

## 1.22.0

- Bump version

## 1.21.0

- **update-claude-docs**: Enforce CLAUDE.md over memory, require inline facts with pointers

## 1.20.0

- **code-simplifier**: Add component-vs-utility guidance

## 1.19.0

- **plugin**: Add claude-md-pruner agent, changelog gate
