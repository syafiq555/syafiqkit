<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/agent-architecture/reader-behaviour-and-method
Gotchas (critical — full list in each ADR's Consequences): none carried over from the parent header; see each ADR's Consequences.
Related: ../current.md (feature index), ../../doc-condensation/current.md, ../../madr-structure/current.md, verification-checklists.md and drift-gates-and-modes.md (sibling theme files split out of verification-rigor.md)
Last updated: 2026-10-12 · split out of verification-rigor.md; D-emission-shape-reanchor, D-decision-first-output, D-non-git-projects-error-they-dont-return-empty, D-verify-by-definition-not-by-string moved word for word
-->

# Agent Architecture: How Readers Behave, Edge Cases, and Verification Method

How rules placed in a doc get acted on, how non-git and empty-state contexts change a check, and when to verify a rule by its definition rather than by its output string.

---

## How Readers Behave, and Where Rules Live

### D-emission-shape-reanchor — Reordering a Rule Earlier in a Doc Fixes the Cold Read, Not the Behavioral Miss — committed — v1.139.10

**Problem**
Reported upstream as [issue #18](https://github.com/syafiq555/syafiqkit/issues/18). `/done` Step 1's "Ownership" section (file-partitioning guard) sat ~45 lines before the "emission-shape" rule (all `Agent` calls in one message). A session doing non-trivial ownership reasoning (contested files) lost track of emission-shape by the time it drafted the `Agent` calls, and split the batch across two messages. The first fix reordered Step 1 so "Emission shape" is read *before* "Ownership." The product reviewer then asked the harder question: does reading the rule earlier in a cold pass actually prevent the reporter's failure, which happened *after* a full read, once attention was absorbed by the ownership partitioning itself?

**Decision**
Chosen: reordering stays (it helps the cold-start case) AND a one-line re-anchor is added at the end of Ownership, immediately before "Agents to run" — the exact point where partitioning reasoning ends and `Agent`-call drafting begins: "Once the partition is decided, emit every agent from it in the single message described above." This is the reporter's own suggested fix ("closer to, or immediately after, the ownership-guard section") — document position alone doesn't survive a reasoning-heavy section in between; the constraint needs to re-trigger at the moment of action, not just appear earlier in a linear read.

**Rejected**
- Reordering alone (ship the first fix as sufficient). Why not: fixes the failure mode for a reader who acts immediately after reading Emission-shape, but the original reporter's miss happened with the OLD order too — after fully processing Ownership, not before it. A rule read once, then followed by several paragraphs of unrelated reasoning, needs a second trigger at the point where that reasoning ends, not just an earlier read.

**Consequences**
- Same shape as D52/D53 (a branch/rule dead wherever no step re-checks its own condition at the moment it's needed) — this is the "salience," not "reachability," face of the same underlying pattern: a true statement earlier in a document is not the same as a statement present at the point of action.
- Caught by the product reviewer against the two GitHub issues' original text, not by the code reviewer (which correctly verified the reorder was internally consistent) or by the author re-reading their own fix — 3rd consecutive session where the product-reviewer lens found the load-bearing defect a file-scoped/self lens couldn't (D52, D53, this).

**Status**: committed · **Reversible**: yes

---

### D-decision-first-output — A Rule About How Every Turn Reads Cannot Live in a Wrap-Up Skill — committed — 2026-08-12

**Problem**
A colleague using the plugin (English is his second language) reported that output buries the one question needing his answer. His words: "kdg2 dia sembang giberish apa yang dia dah siap je. Aku nak baca apa yang nak go next" — sometimes it just rambles about what it finished, I want to read what to do next; and "Kau nak apa dari aku. just make it as a question la kot" — what do you want from me, just make it a question. The triggering output ran ~18 lines of prose and reached "Want me to build it now?" on the last line. He had to type "i dont want to know whats done, i want to know what you tell me" to get a usable 3-line reply. Two defects: `/done`'s prescribed table was not used at all that session, AND the table itself rendered a product gap as a cell (`[🔴/🟠 gaps surfaced to user + decision]`) — mid-document, inside a grid, phrased as a finding.

**Decision**
Chosen: `_shared/references/decision-first-output.md` owns the shape — exactly one open question uses `AskUserQuestion`, two or more use a `## Decisions` block with keycap numerals rendered first, zero omits it. The count picks the mechanism, so it must be counted before writing rather than discovered mid-draft. The `Product` cell collapses to a pointer so the gap is stated once.

The host matters more than the wording. A wrap-up skill only reaches sessions that invoke it, and the complaint came from an ordinary mid-implementation turn — so the rule sits in `read-summary`, which runs at the start of most sessions and ships to consumers. The user made this call; the session had proposed the private global `CLAUDE.md`, which reaches further but ships to nobody.

**Rejected**
- Rule in `done`/`quick-done`/`ship` only. Why not: the reported failure was not a wrap-up. Four invocation boundaries would have left the shape that produced the complaint untouched.
- Global `~/.claude/CLAUDE.md` as the session-wide host. Why not: reaches every turn of the author's own sessions and none of a colleague's. The audience needing this most is the one it cannot reach.
- Numbered text for every count, including one. Why not: the single-gap case IS the reported case, and a picker cannot be scrolled past. The four-question cap cannot bite at N=1.
- A hard sentence cap on summary cells. Why not: the user chose judgement prose. Front-loading the question makes length largely moot, since a satisfied reader stops there.

**Consequences**
- **Only `done`'s exit gate enforces anything.** Everywhere else this is a standing rule read once at session start, which is the furthest a skill file reaches without a hook — a long session drifting back to question-last output is the expected failure, and the reference says so rather than letting `{#decision-first}` read as a guarantee.
- Moving the gap out of the `Product` cell created a path where a triaged gap lands nowhere (cell reads `✅`, block never written). The gate's Product row now requires every surviving gap to be asked above, which the old design got for free because the gap text lived in the cell being verified.
- Same salience face as D-emission-shape-reanchor: a rule stated where the reader is not yet acting doesn't fire. Here the axis is which FILE gets read at all, not position within one.
- `merge-task-docs` was flagged as a peer candidate and rejected on inspection — its three `AskUserQuestion` forks already fire at the point each decision arises, which is the rule working. `update-plugin` took the pointer, since "signals found but skipped and why" is a judgement call the user can overrule.
- Product review found the load-bearing defect again (the host being wrong), against a code review that returned zero findings — 4th consecutive session, extending the D52/D53/D-emission-shape-reanchor run.

**Status**: committed · **Reversible**: yes

---

## Edge Cases: Non-Git and Empty-State Contexts

### D-non-git-projects-error-they-dont-return-empty — An Erroring Git Command Is a Fourth State With No Branch — committed — 2026-08-11

**Problem**
Upstream issue #20, second half: running `/done` in a project that was never `git init`ed. Every step establishing what changed, who owns it, or whether a write landed reaches for git, and in a non-git project those commands **error** (`fatal: not a git repository`) rather than returning empty. `/done`'s mode-selection carefully disambiguates three meanings of an *empty* `git status --short` — all three presuppose the command ran. The reporter improvised every substitute (mtime listing, re-reading files to verify writes) and noted the Exit gate's rule, "a row you cannot substantiate is a step you skipped," is hard to honour when the substantiating command can't run. `git log -S "not a git repository" -- skills/done/SKILL.md` returns empty against a control returning 3 commits: no branch ever existed.

**Decision**
Chosen: host the substitution table in `_shared/references/verifying-a-write-landed.md` and point the three git-reaching sites at it. That file already carried the exact fix one level too narrow — its "untracked/gitignored → no git invocation can ever show it, grep instead" row is per-*file*, and its own detection commands (`git ls-files`, `git check-ignore`) error in a non-git repo. Added a repo-level case above the table, then every file is permanently in that row. `/done` additionally gets its own mode-selection paragraph, because pointing at the reference doesn't stop a session picking the wrong mode before it reads anything.

**Detection takes two probes, not one** — corrected during this session's own review. `git rev-parse --git-dir` asks whether a repo exists; `git rev-parse HEAD` asks whether there is a commit to diff against. A repo initialised but never committed passes the first and fails every `git diff HEAD` (reproduced: `--git-dir` exit 0 and `git status --short` exit 0, `git diff HEAD --stat` exit 128). That state is the more dangerous of the two precisely because it looks handled — a session probing only for a repo proceeds believing git works and hits the failure at the Exit gate rather than at mode selection.

**Rejected**
- Inline branches at each site. Why not: three sites restating the same substitutions, past the plugin's extraction threshold, and they'd drift.
- Reference only, no `/done` paragraph. Why not: mode selection happens before any pointer is followed, and the wrong mode is the actual harm.

**Consequences**
- **Ops-only was the trap, and it fails silently.** It's the closest-fitting existing mode ("no repo diff and no session commit") and it skips all three review agents on the grounds there's no repo code to review. An unversioned project has code. A session landing there reviews nothing and reports a clean `/done` — named explicitly in the new paragraph for that reason.
- **Ownership guidance gets stronger without git, not weaker** — the reporter's own observation, worth keeping: no stash, no `checkout --`, no reflog, so anything an agent overwrites is unrecoverable. The usual "it's recoverable" reassurance behind loose agent partitioning is absent exactly where it's most assumed.
- Sole-by-construction ownership holds only where no peer session is on the tree, and git is normally what tests that. `ListAgents` is the only remaining check, and an empty listing isn't proof (D-cross-session-messaging).
- **The first pass fixed the write-verification primitive and missed the ownership one beside it.** `diff-ownership.md` is a separate reference that `/done`, `task-summary` and `update-claude-docs` all cite for "whose file is this", and its whole mechanism is `git diff HEAD -- <file>`; it errors identically and had no branch. Both reviewers found it independently. The tell was structural rather than clever: the fix traced forward from the value it introduced and never asked which *sibling* primitives answer a related question off the same command. When generalising a shared reference, grep for the others cited from the same steps.
- Not runtime-verifiable for the no-repo half here — this repo IS a git repo, so that branch rests on reading it against the reporter's list of erroring commands. The zero-commit half WAS reproduced live in a scratch dir, which is what caught the single-probe defect.

**Status**: committed · **Reversible**: yes

---

## Verification Method: When to Check the Rule, Not Just the Output

### D-verify-by-definition-not-by-string — Unhobbling the Templates Made Every String-Match Check Meaningless — committed — 2026-08-18

**Problem**
A `**Do NOT:**` bullet in `task-builder.template.md` opened "Write inline comments by default", so its own text instructed the opposite of its heading. Three generated copies in other repos had independently stacked more restriction on top of it — a `⚠️`, an explicit "1 line" cap, a "no multi-line budget" clause — each edit landing *after* the clause that had already granted permission, and none of the three authors reading the opener. Compensating guardrails accumulating around a rule that reads backwards is the signal that the rule, not its enforcement, is the defect.

Fixing the bullet fixed one instance. Unhobbling all eight templates fixed the shape: a constraint fires only on cases its author enumerated, while the reasoning behind it fires on cases nobody listed. An agent told *the task doc holds the rationale, so a comment repeating it is a second copy that goes stale* needs no line cap.

**Decision**
Chosen: rewrite all eight templates as judgement prose (1012 → ~940 lines), then rewrite `agent-setup`'s verification method to match. The second half is forced by the first: generation restates each rule in the project's own vocabulary, so template and generated agent are now *deliberately* dissimilar. Every check that matched wording became wrong in both directions — reporting healthy agents as drifted, and passing an agent that kept a heading and lost its content. `agent-setup-verification.md` went from 227 lines with 12 bash blocks to 111 with none, reorganised around what must be TRUE of a correct agent. `SKILL.md`'s trigger changed from "out of date against templates" (now true of every healthy agent) to a missing *capability*.

**Rejected**
- Fixing the bullet and stopping. Why not: the list shape was the generator, and the next verb-initial bullet someone adds inverts the same way.
- Moving the lists into `❌ Never / ✅ Always` tables, which put polarity inside each row. Why not: it preserves every constraint and changes only the packaging — reorganisation wearing an unhobbling's face. The skill is explicit that meaning is conserved and form is free.
- Keeping the fixed-value checks (colour, model tier, `disallowedTools`) as commands while converting the rest. Why not: those name exact greppable tokens and the file tells the reader to check them however they like, so a portable prose statement loses nothing; a prescribed command bakes in an environment for colleagues on other platforms.

**Consequences**
- **Three of the eight passes deleted facts and every report described the deletion as a cleanup.** `code-simplifier` dropped its "Don't Simplify" table — which `agent-setup` greps for by name when generating — so the result would have been agents shipping with no project guardrails past a verification step that still passed. `browser-verifier` dropped "never attribute a claim the user did not type", reasoning it belonged in a re-delegation reference. `product-reviewer` dropped its per-project audience table as "scaffolding". A fourth and fifth surfaced only under review: `task-builder` lost its destructive-command ban (it holds the full tool set including `Bash`, so nothing but that sentence stops it) and `code-simplifier` lost both project-pattern tables. All restored.
- **The verification rewrite kept the diagnosis and dropped the repair**, caught by the product reviewer. Both "Update whatever any check flags" and the reference's whole `## Interpretation` section went, leaving a skill that reaches an excellent verdict and never writes it back — the doc's own "compression keeps the rule, drops the mechanism" trap, instantiated by the pass that was fixing a different instance of it.
- **A live false pass demonstrated why the string checks had to go**: `grep "3-tier\|blocking\|expected-missing\|polish\|Don't Flag"` on `product-reviewer` returned 2 and passed — both hits from an output-format printf line. The alternation means one hit satisfies all five terms, so an agent with the printf and no severity model passes clean.
- **This repo's own `product-reviewer` was live with Write and Edit** despite a `# NOTE: read-only by design` comment, because `disallowedTools` was absent and omitting a tool from `tools:` doesn't block it. A whole-frontmatter diff had flagged it identically to six harmless wording differences.
- Two reviewer claims were wrong and worth the check: one said `condense-task-doc` still had a bash block (it has none), another that the registry-sync block was duplicated in `agent-setup/SKILL.md` (it isn't).

**Status**: committed · **Reversible**: yes
