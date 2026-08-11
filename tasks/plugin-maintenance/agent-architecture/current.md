<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log split by theme into decisions/*.md
Domain: plugin-maintenance/agent-architecture
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../doc-condensation/current.md (sibling feature — fighting duplication/bloat across docs, CLAUDE.md, skills)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
Last updated: 2026-08-11 (later same day) — upstream issue #20 fixed and shipped at 1.144.0, two ADRs added: `Explore` keeps its `Write`/`Edit` grant with body text (not `disallowedTools`) as the only scope, partially superseding D60's mechanism; and git commands ERROR rather than returning empty in a non-git or zero-commit project, which `/done` had no branch for. Both defects came from a consumer install. The session's own review pass then found two defects in its own fix — a missed sibling primitive (`diff-ownership.md`) and a single detection probe that misses zero-commit repos. `condense-task-doc` ran: the SET's 890-line overage is structural (35 ADRs at their ~20-line floor), not bloat. Prior 2026-08-11 — D25's must-hit-control rule was itself generalised away by a later `unhobble-instructions` pass over `explore-delegation.md` and had to be restored; same change added the non-empty-inventory half D49 doesn't cover — a short, real-looking agent-returned list (2 files where 9 exist) reads settled and gets none of the scrutiny an empty result does (verification-rigor.md D25, updated). Prior 2026-08-09: cross-session messaging (`ListAgents`/`SendMessage`, Claude Code 2.1.224+) judged against the four documented concurrency problems: two are intra-session and out of scope, and the peer check is hosted at `read-summary`'s re-trigger block rather than the write sites, since a write-site check fires after a session has been editing for an hour (D-cross-session-messaging). Found while surveying: `update-claude-docs` and `condense-task-doc` carried no ownership guard at all. Prior 2026-08-07: `quick-done` reshaped docs-only: `update-claude-docs` + `task-summary` + the plugin gate, no reviewer, 53.6KB vs `/done`'s 76.6KB (D-quick-done-docs-only, superseding D-quick-done's step composition). Same day: mtime cannot separate a concurrently-editing session, so both ownership gates now require a diff read (D-mtime-cannot-see-concurrent-writers). Prior: new `quick-done` skill as a separate skill rather than the mode D39 removed (D-quick-done); 2026-08-06, `code-simplifier` project agent had silently drifted to `model: opus` against its already-correct `sonnet` template, discovered via a spawn 400 rather than an edit (D31, 4th recurrence); same-day, two upstream issues fixed (#16, #18) — `/commit`'s staleness gate carve-out (D-commit-staleness-same-session-carveout) and `/done` Step 1's point-of-action re-anchor (D-emission-shape-reanchor).
-->

# Plugin Maintenance — Agent Architecture

## Quick Start (read this first in next session)

**Where we are**: How generated project agents (`.claude/agents/*.md`) inherit CLAUDE.md conventions, delegate to sibling skills, reliably invoke them, and how the plugin delegates work to cheaper/parallel agents — plus how a session learns a *peer session* is writing the same files. 33 decisions (32 live, D35 superseded; D-quick-done superseded in its step composition only) across 3 themed sub-files (counted, not incremented — `grep -h '^### D' decisions/*.md | wc -l`).

**State**: this feature's own work last shipped at v1.140.6 (later versions on `origin/master` belong to sibling features) — the cross-session-messaging work shipped together with the concurrent session's `haiku`/`two-tier-condense` changes, whose CHANGELOG entries (1.140.4–1.140.6) that session had already written. The contest over `CHANGELOG.md` resolved by shipping both sessions' work in one push; don't read the `haiku` or `two-tier-condense` diffs as this feature's own. This repo has no CI and no deploy chain, so the push IS the ship; consumers pick it up via `claude plugin update syafiqkit@syafiqkit`. The version files reached the push at 1.140.3 while the changelog already carried headings through 1.140.6 — the entries had been written without their bump, which `/ship`'s version gate caught and reconciled to 1.140.6.

**Immediate next actions (in order)**:
1. This repo's own `.claude/agents/` is still missing `task-builder.md` and `browser-verifier.md` (templates exist, never generated) — run `/agent-setup` to backfill; exercises the Missing-agent check (D38) end-to-end.
2. Add the post-write ADR-id uniqueness gate to the plugin CLAUDE.md — the D40/D44 collisions are renumbered (→ D48/D49), but the allocator that minted them is unchanged (see Next Steps).

**Gotchas that will trip you**:
- Agents don't inherit CLAUDE.md — see D1 (decisions/injection-and-delegation.md)
- Orchestrator skills must delegate to sibling skills, never inline their procedure — see D4 (decisions/injection-and-delegation.md)
- A Step-N "verify" checklist is not satisfied by having read the files earlier in-session — each item needs its own command run against current content — see D21 (decisions/verification-rigor.md)
- A self-caught deviation from a skill's own instructions is a reportable signal, not a silent win — see D24 (decisions/verification-rigor.md)
- Delegating a skill's heavy step to a cheaper agent only works when the mechanical (retrieval) half is split from the judgment half first — the judgment half stays on the calling session's own model — see D30 (decisions/concurrency-and-delegation.md)
- A scan's "zero results = done" exit condition needs a must-hit control, not just a correct command — see D25 (decisions/verification-rigor.md)
- `merge-task-docs` Step 2 defaults to executing the recommended scope/structure/naming inline, asking only on genuine ambiguity — see D28 (decisions/verification-rigor.md)
- Every generated agent template now carries `Skill` in `tools:` — see D14/D29 (decisions/injection-and-delegation.md)
- A verification step whose input is empty emits the same output as a genuine pass — an empty diff, a single polled run id — see D49 (decisions/verification-rigor.md)
- An audit agent handed a defect definition manufactures matches; its *clean* verdicts are the reliable half — see D47 (decisions/verification-rigor.md)
- ⚠️ **That reliability is prompt-dependent, not fixed — a review of the session's OWN fresh fixes inverts it** (all three agents' findings held, and the product reviewer caught what neither file-scoped lens nor the author could see). An author cannot see whether anything computes their new rule's inputs — the intent is in their head — see D52 (decisions/verification-rigor.md), then D53 for the 2nd instance
- A new rule's branch is dead wherever no step computes its condition — an unreachable branch and an unmeasured threshold are one defect with two faces — see D53 (decisions/concurrency-and-delegation.md)
- A doc another session is writing inverts `task-summary`'s Quick Start/Last Session overwrite mandates; "single owner" is a grep of the MANDATE's vocabulary, not an impression — see D53 (decisions/concurrency-and-delegation.md)
- An ownership marker must be a string the peer had no reason to type, which a **version number never is** — a peer bumping in the same window writes it into their own changelog heading, so grepping it classifies their file as yours. An empty `ListAgents` is likewise not evidence nobody is writing; where it and `git status` disagree, `git status` observed a write — see D-cross-session-messaging (decisions/concurrency-and-delegation.md)
- `claude-md-pruner` prunes task docs too and its name is deliberately legacy — renaming silently breaks `update-claude-docs` Step 4's literal Glob/`subagent_type` and orphans the old file in every existing project — see D43 (decisions/injection-and-delegation.md)
- Editing a generated `.claude/agents/*.md` requires porting the same edit into its source `skills/agent-setup/templates/*.template.md` in the same change — now a root CLAUDE.md `⚠️ MANDATORY` callout, 4th recurrence. Drift also happens silently with no edit trigger — a `code-simplifier` spawn 400ing on `effort 'xhigh'` traced to the generated file alone having drifted to `model: opus` while its template already read `sonnet` — see D31 (decisions/concurrency-and-delegation.md)
- A `disallowedTools` guard blocks an agent's *call*, never its *intent* — redirect by stating the agent's ROLE, and keep the redirect anchored to a named target category; de-priming to pure abstraction trades a loud rare failure for a silent universal one — see D60 (decisions/injection-and-delegation.md)
- Widening a threshold table (agent-count tiers, byte budgets) needs every downstream decision point checked, not just the table itself — see D39 (decisions/verification-rigor.md)
- A skill pair that both scan the same conversation for the same signal class and route dependently must dispatch sequentially — D32's parallel-batch default assumes disjoint state, which this pair doesn't have — see D42 (decisions/concurrency-and-delegation.md)
- A caller's `description:` can't tell you whether its body hardcodes `invoke <skill>`, so adding a cheaper sibling leaves every such caller silently locked to the original — grep the old name across `skills/*/SKILL.md` bodies and open each hit — see D-quick-done (decisions/concurrency-and-delegation.md)
- An agent's declared ROLE is not evidence of its tool grants — every agent this plugin spawns holds `Bash`, and `Explore` (described as read-only) holds `Bash Write Edit`; read the frontmatter before trusting a role — see D-agent-verb-ban-shared (decisions/concurrency-and-delegation.md)
- `Explore`'s `Write`/`Edit` grant is deliberate (scratchpad), and body text — not `disallowedTools` — is the only thing keeping it off the lead's plan file; a density pass stripping that sentence is a real regression with no YAML backstop — see D-explore-write-is-granted-scoped-by-role (decisions/injection-and-delegation.md), which partially supersedes D60's mechanism
- Parity between a template and its generated agent proves agreement, never correctness — a regression edited into both passes the check — see the same ADR
- Git commands in a non-git project **error**, they don't return empty, so a branch written for "empty" never fires; `/done`'s closest-looking mode (ops-only) silently skips all three review agents. Detection needs two probes — `rev-parse --git-dir` (repo exists) and `rev-parse HEAD` (a commit exists to diff against) — since a zero-commit repo passes the first and fails every `git diff HEAD` — see D-non-git-projects-error-they-dont-return-empty (decisions/verification-rigor.md)
- `unhobble-instructions`' own Process didn't wire its row-decoration check into the numbered steps that actually drive execution, so running the skill on its own logic still mis-stripped a genuine `**Tell:**` alongside hollow ones — checking content is not the same test as checking decoration, and a step that isn't referenced by the linear Process doesn't get applied even when it exists elsewhere in the file — see D63–D66 (../doc-condensation/decisions/verification-rigor.md, not this feature's own decisions/ — unhobbling's ADR history lives in doc-condensation)
- Two skills disagreeing about the same run-time state (`/commit`'s absolutist staleness gate vs. `/done` Step 4's scoped-invoke principle) needs the later skill's carve-out named explicitly in the earlier gate, not left as an implicit contradiction — see D-commit-staleness-same-session-carveout (decisions/concurrency-and-delegation.md)
- Reordering a rule earlier in a doc fixes the cold-start read, not a behavioral miss that happens mid-reasoning — the constraint needs to re-trigger at the point of action, not just appear earlier in a linear read — see D-emission-shape-reanchor (decisions/verification-rigor.md)

---

## Overview

Decisions about how generated project agents (`.claude/agents/*.md`) inherit conventions, delegate to sibling skills, reliably invoke them, and how the plugin delegates work to cheaper/parallel agents. Split out of the plugin-maintenance whole-doc MADR (2026-07-24) as its own feature, one level up from the prior `decisions/agent-architecture.md` router. Sibling features: [doc-condensation](../doc-condensation/current.md), [madr-structure](../madr-structure/current.md).

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Prompt-injection agent architecture (D1) | ✅ |
| 2 | Orchestrator delegation pattern (D4, D14, D29, D43) | ✅ |
| 3 | Verification rigor across skill checklists (D21, D24, D25, D28, D38, D39, D47, D48, D49, D52, D58, D-emission-shape-reanchor) | ✅ |
| 4 | Concurrency/cheap-model delegation (D30, D31, D32, D42, D53, D-commit-staleness-same-session-carveout, D-quick-done, D-agent-verb-ban-shared); transcript-scan tried + removed (D34→D36) | ✅ |
| 5 | Agent tool-guard vs. intent; role-correction over prohibition (D60) | ✅ |
| 6 | Backfill `task-builder`/`browser-verifier` agents in this repo | ⏳ Pending |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/injection-and-delegation.md](decisions/injection-and-delegation.md) | *How do generated agents inherit CLAUDE.md conventions and call sibling skills instead of reimplementing them?* (D1, D4, D14, D29, D43, D15) |
| [decisions/verification-rigor.md](decisions/verification-rigor.md) | *How do skills verify their own checklists actually ran, and catch self-caught deviations or silent-pass exit conditions? When is an agent's finding trustworthy vs its clean verdict? When does `/done` run agents on an all-doc diff? Does reordering a rule earlier in a doc actually fix a salience miss?* (D21, D24, D25, D28, D38, D39, D47, D48, D49, D52, D58, D-emission-shape-reanchor) |
| [decisions/concurrency-and-delegation.md](decisions/concurrency-and-delegation.md) | *How does the plugin delegate to cheaper/parallel agents, what does `run_in_background` actually guarantee, what happened to the transcript-scan mechanism, how do skills write a doc another session owns, how do two skills reconcile disagreeing about the same run-time state, where does cost relief for an expensive skill live, what must a spawned agent be told not to run, and how does a session learn a peer is editing the same files before their bytes land?* (D30, D31, D32, D34, D35, D36, D42, D53, D-commit-staleness-same-session-carveout, D-quick-done, D-agent-verb-ban-shared, D-mtime-cannot-see-concurrent-writers, D-cross-session-messaging) |

---

## Next Steps

**Backfill**
- [ ] This repo's own `.claude/agents/` is missing `task-builder.md` and `browser-verifier.md` (templates exist, never generated) — run `/agent-setup` to backfill; would also exercise the Missing-agent check (D38) end-to-end.

**Doc integrity**
- [ ] **Add the post-write ADR-id gate — the numbers are fixed, the allocator is not.** This was the 2nd collision round and the 1st caused it: `doc-condensation`'s D40 was renumbered off a duplicate D32 on 2026-07-20 into an id this feature then took. **2026-08-02: round 3 happened exactly as predicted** — `doc-condensation`'s own D66 was independently minted twice (a `/done` review caught it, renumbered to D67), because the allocator step CLAUDE.md's ADR row already prescribes (`grep -rhoE "^### D[0-9]+" tasks/ | ...`) wasn't run against the global corpus before writing. The manual fix works; the gate to make it automatic is still open. ⚠️ Never reuse a numbering gap — D2/D5/D7/D11/D41 are demoted/retired ids still cited in prose. Highest id is now 67.

- [x] **The shipped v1.140.0 CHANGELOG advertised `/quick-done` at 31.9KB vs 75.8KB; both halves were wrong.** Corrected in the v1.140.2 entry and carried into that release note as its own line (53.6KB vs `/done`'s 76.6KB — a ~30% saving, not ~58%), so a consumer who sized the skill on the old figure sees the retraction rather than only the new number.

**Doc size**
- [ ] **The SET is 890 lines / 109.9KB against a 300-line budget, and `condense-task-doc` has now been run on it — the overage is structural, not bloat.** Measured 2026-08-11: all three theme files sit at 20–23 lines per ADR against the skill's own ~20-line MADR floor, so 35 ADRs cost ~750 lines at minimum shape. The pass cut 1.2KB (a dead transcript-scan mechanism spec, D34 — its verdict kept, its operating detail dropped as unusable since `transcript-scan.md` is deleted) and found nothing else failing the keep-test. The index is healthy at 118 lines. **Further compression would delete decisions, not compress prose** — so the real lever is a multi-domain fan-out (promoting a theme to its own `tasks/plugin-maintenance/<feature>/`), which is a scope call, not a condense. Don't re-route this to `condense-task-doc` expecting a different answer.

**Deferred**
- [ ] `hobby-review` Step 5 emits its verdict template after "the conversation naturally reaches the 3 gates" with nothing verifying it did — D49's shape, judged not worth fixing (soft guidance, writes nothing to disk). Revisit only if a verdict ever lands on an unfinished arc.

---

## Last Session (2026-08-11)

- Fixed both halves of upstream issue #20, filed by a consumer at v1.140.11 against surfaces nothing had touched since. Shipped at 1.144.0.
- **Defect 2 was a regression, not the open question the issue framed it as.** `85104d8` (an unhobble pass over 23 files) deleted `Explore`'s `disallowedTools: [Write, Edit]` in the same hunk that stripped the ⚠️ Bootstrap paragraph naming it — the guard read as more prohibition-shaped machinery. `CHANGELOG.md:1425` had advertised the guard as landed since 2026-07-28 and was untrue for the whole 1.140.x–1.143.1 range.
- **Resolved against D60 rather than restoring it**: the grant is deliberate (scratchpad on large sweeps), and no tool-level block can separate a scratchpad from the lead's plan file. Scoping moved entirely to body text, matching what `Plan` already does. D60's *finding* stands; its mechanism is half-superseded.
- The initial plan proposed restoring the guard; the user corrected it mid-implementation, which was right — the plan had read D60's rejection as covering the scratchpad case, and it doesn't.
- **Parity hid the regression rather than catching it** — template and generated agent were edited together, so the check compared two equally-wrong files and passed.
- Defect 1 was a gap that never existed (`git log -S "not a git repository" -- skills/done/SKILL.md` empty against a control returning 3 commits). Fixed by generalising `verifying-a-write-landed.md`'s per-file "ungitted" row to a repo-level case — the file already had the right substitution one level too narrow, and its own detection commands error in a non-git repo.
- **`/done`'s own review pass then found two defects in that fix**, both worth more than the original: `diff-ownership.md` (the sibling primitive answering "whose file is this", cited from the same three skills) had no non-git branch and was missed by tracing forward from the value introduced rather than sideways to siblings; and the prescribed single detection probe (`rev-parse --git-dir`) returns 0 in a zero-commit repo where every `git diff HEAD` still errors — reproduced live, now two probes. Both reviewers found the first independently.
- A `CHANGELOG.md:1425` line citation written into this session's own ADR pointed at an unrelated entry — the real text is under `## 1.60.1`, and this release's 8 added lines had already moved it. Cite CHANGELOG by version heading; line numbers drift on every release.

## Prior Session (2026-08-09)

- Judged cross-session messaging against the four documented concurrency problems rather than adopting it wholesale (D-cross-session-messaging). Two were intra-session subagent races with no session boundary to cross; the user's own correction reframed the remaining case as "same project, same files, any two sessions" — which moved the check from the write sites to `read-summary`, the entry point ~9/10 sessions start from.
- The feature demonstrated its own limits mid-implementation: three files in this checkout changed mtime within a minute while `ListAgents` showed one idle peer in an unrelated project. The first draft said an empty listing means "proceed normally" and was corrected before landing.
- Ownership classification by version-number marker misfired — `1.140.6` matched the peer's own changelog heading, classifying their file as owned. Rather than mint a number above the peer's claimed 1.140.4–1.140.6, the bump was dropped entirely and left for whoever wrote the entry; both sessions' work then shipped together at 1.140.6.
- Running `/list-agents` beside the `ListAgents` tool showed the two surfaces differ: the command prints each local session's cwd, the tool does not.
- All three review agents were scoped to this session's 12 files with the peer's 3 named off-limits; the code reviewer caught a genuine factual error (two distinct message caps, 100 held vs 50 unread, collapsed into one figure).
