<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/external-guidance/reattach-ceiling
Related: ../current.md (feature index — which file holds which decisions), applying-verdicts.md (sibling theme — verdict and source-grading decisions, including the D-source-6 mechanism grading that opened this ceiling work), agent-and-edit-traps.md (sibling theme — agent and scripted-edit traps from the same passes), ../../doc-condensation/decisions/unhobble-rule-writing.md (D63, the measured prose-vs-value boundary)
Last updated: 2026-10-10 — split by topic out of applying-verdicts.md; decision blocks moved verbatim, none reworded
-->

# External Guidance — The Re-Attach Ceiling

What the 5,000-token post-compaction ceiling does to a skill, and how the corpus was brought back under it.

---

### D-ceiling-found-not-yet-cleared — Four Skills Exceed the Re-Attach Ceiling and Only One Was Reduced — committed — 2026-08-20

**Problem**
The 5,000-token post-compaction ceiling (D-source-6-harness-drift) was adopted as a fact, and the same pass that adopted it added content to five skills. Measured after: `done` ~9.9k, `update-claude-docs` ~8.2k, `task-summary` ~6.2k, `unhobble-instructions` ~5.9k, `agent-setup` ~5.4k — the last of which this pass pushed over the line itself, from ~4.9k.

Only `update-claude-docs` was reduced, by relocating `## 6. Agent Sync` to `references/agent-sync.md` (1,724 bytes, destination written before the cut). That took it from ~8.35k to ~8.16k: real, and nowhere near enough for a file 63% over.

**Decision**
Chosen: state the overage as an open finding rather than clear it here. The remaining reductions are condense work — `update-claude-docs`'s largest section is its residency gate, which every capture pass reads, so extracting it is the hot-path treadmill this corpus has already rejected twice. A skill that is over the ceiling is not broken; its tail is unreliable after a compaction, which is a real cost and a bounded one.

**Rejected**
- Extracting the residency gate to get under the number. Why not: hot path, read on every invocation. Shrinking a file by moving the part everyone reads is how a metric improves while the artifact gets worse.
- Leaving the ceiling undocumented until someone could act on it. Why not: the fact is what makes the overage visible at all, and a session that knows the boundary can put the load-bearing half above it even without condensing.

**Consequences**
- **`done` was reduced and is still over.** Its blindness-pattern catalogue (~6.6KB) moved to `references/agent-blind-spots.md`, taking it 9,880 → 8,281 tokens and moving the boundary from ~line 134 to ~line 146. The exit gate sits at line 195, so it remains past the cut — the relocation helped and did not solve it.
- **The boundary's position matters more than the overage.** `done`'s cut fell mid-Step-1, so Steps 2-5, the exit gate and the output template were all in the vanishing half. A file 60% over whose guards sit early is in better shape than one 20% over whose verification sits late.
- **A pass that adopts a ceiling and then adds content owes the measurement.** `agent-setup` crossed the line in this pass; saying so is the accounting, and quietly shaving prose to get back under would have been gaming it.
- **Position now matters independently of length.** Until these files come down, what sits in the first 5,000 tokens is a real editorial decision — the guards and mode selection belong above the boundary, the reference tables below it.
- `done` at ~9.9k is the worst case and the most exposed, since it runs at session end when a compaction is likeliest to have already happened.

**Status**: committed · **Reversible**: yes · Open: four skills remain over · **Superseded by D-ceiling-cleared** (kept: records what the interim state was and why the staged approach was taken)
---

### D-pointers-are-suggestions — Progressive Disclosure Has No Loader, and the Only Levers Are Path and Phrasing — committed — 2026-08-20

**Problem**
The corpus routes content behind `📖` pointers on the strength of D55's progressive-disclosure verdict, and D-deferral-is-not-delivery already found the follow-through rate poor. What neither established is the *mechanism*, which turns out to decide everything: there is no loader. Verified against `code.claude.com/docs/en/skills.md` — a SKILL.md has no `@path` import, no frontmatter field, no naming convention that pulls a companion file in. Anthropic's entire recommendation is a markdown link stating what the file holds and when to read it. A subagent's `skills:` field preloads whole SKILL.md bodies and still does not reach their reference files.

So a pointer is a suggestion the reading model may decline, every time, with no retry — the skill body enters context once and is never re-read.

**Decision**
Chosen: treat extraction as a trade of certainty for tokens rather than a free win, and pull both levers that exist.

**Lever 1 — absolute paths.** `${CLAUDE_SKILL_DIR}` and `${CLAUDE_PLUGIN_ROOT}` **do** expand in skill markdown, reversing what `consumer-portability.md` asserted. [#9354](https://github.com/anthropics/claude-code/issues/9354) closed as completed 2026-08-17; a probe skill confirmed it live, both variables rendering as real absolute paths in a SKILL.md body. A relative pointer asks the reader to resolve a path against an uncertain working directory; `${CLAUDE_SKILL_DIR}/references/foo.md` is unambiguous on any machine at any install version. This does not reach `tasks/`, which still never ships.

**Lever 2 — conditional phrasing at the decision point**, which D-deferral-is-not-delivery already measured: name the trigger, not the topic.

**Rejected**
- Duplicating critical lines inline and in the reference. Why not: two copies drift, and this corpus has repeatedly found the unedited one going stale while reading as authoritative.
- Treating "no loader" as an argument against extraction generally. Why not: the ceiling is real and a skill's tail is lost anyway after compaction. An unread pointer and a truncated section fail the same way; the pointer at least survives for a reader who follows it.
- Waiting for an official auto-load mechanism. Why not: the docs are explicit that on-demand reading is the intended design, not a gap.

**Consequences**
- **The order of operations follows from the mechanism.** Reordering is strictly better than extraction where both are available: content moved above the ceiling is *certain* to be re-attached, while content moved behind a pointer is only *probably* read. Reorder first; extract only what genuinely belongs in a reference.
- **`consumer-portability.md`'s expansion row was wrong and is corrected.** A false negative about a mechanism is worse than silence — it argues against the one thing that makes a bundled pointer reliable.
- **An issue closed as completed is a real event that no local check watches.** This one had been cited in a decision as settled fact for months and was fixed three days before anyone looked.

**Status**: committed · **Reversible**: yes · Verified live 2026-08-20
---

### D-reorder-beats-extract — Where a Cut Falls Decides More Than How Far Over You Are — committed — 2026-08-20

**Problem**
Five skills sit over the 5,000-token ceiling and the obvious response is to extract until each fits. Measured, the overage turned out not to be the thing that hurts. `unhobble-instructions` is 880 over and loses three trailing scope notes; `done` was 3,281 over and lost its exit gate, its output template and Step 5 — the verification *and* the deliverable. Same units, incomparable damage.

D-pointers-are-suggestions then settled why extraction cannot be the primary lever: there is no loader, so extracted content is read only if the model chooses to. Content moved *above* the cut is certain to survive; content moved *behind a pointer* is probable at best.

**Decision**
Chosen: reorder first, extract second, and measure by what falls past the cut rather than by the overage.

For `done`, that meant stating the contract — the six Output rows, that each row is a claim a step actually ran, that invoking is not updating — in a block at line 14, above everything. The file grew ~280 tokens doing this and is *better off*, which is the whole argument: a smaller file whose guard sits at line 195 is worse than a larger one whose guard sits at line 14.

**Rejected**
- Extracting until every skill fits under 5,000. Why not: it trades a certain loss for a probable one and, on the evidence of the pointer audit, the probability is poor. Also risks the over-condensing failure D-a-floor-is-not-a-ceiling already records.
- Splitting `done` and `update-claude-docs` into separate skills. Why not: changes invocation and every caller, to solve a problem that ordering solves without moving anything.
- Treating the overage number as the priority ranking. Why not: it ranked `unhobble-instructions` (loses scope notes) above `agent-setup` while saying nothing about which loses a guard.

**Consequences**
- **The diagnostic is "what is past the cut", not "how many tokens over".** Roughly, the boundary is 20,000 bytes into the file; print the headings after it and read what would vanish.
- **A skill whose tail cannot be reordered away should say so at the top.** `done` now tells its reader that a missing exit gate *is* the compaction, and to re-read the skill — turning a silent loss into a detectable one.
- **The pointer audit found both levers unused**: of 125 `📖` pointers, 11 carried a trigger condition and none used an absolute path. Fixing phrasing and path form is cheaper than any restructure and raises the odds on every pointer already written.
- Four skills remain over. Their cuts now fall past reference material rather than past guards, which is the state to hold until a real condense pass.

**Status**: committed · **Reversible**: yes · Open: four skills still over, none losing a guard
---

### D-ceiling-pass-two — Every Over-Ceiling Skill Now Loses Procedure Instead of a Guard — committed — 2026-08-20

**Problem**
D-reorder-beats-extract established the method on `done` and left four skills untreated, each losing something different: `update-claude-docs` lost Steps 3-6 *and* all three alternate modes (a six-step skill keeping two), while `agent-setup` lost a descriptive Output section that costs nothing.

**Decision**
Chosen: apply the diagnostic per file and let it pick the treatment, rather than driving every file toward the number.

- **`update-claude-docs`** — extracted the prune delegation (3.4KB → `references/prune-delegation.md`, guards left inline), then stated the six-step shape plus the two rules that hold across all of them ("writing nothing is legitimate", "sharpen rather than add") in an opening block. 8,187 → 7,968 tokens; more importantly the back half is now recoverable from the front.
- **`unhobble-instructions`** — moved `## What This Is Not` above the cut. It is 392 bytes and is the scope boundary that stops the skill firing on a condense job. Moving it exposed a duplicate paragraph restating the same three boundaries, now collapsed.
- **`task-summary`** — the lost section holds a real trap (back-references no git-driven scan reaches). The trigger moved into the step-5 line already above the cut; the method stays in §6.
- **`agent-setup`** — left alone. Its lost section describes output shape, derivable from the templates.

**Rejected**
- Extracting `update-claude-docs`'s residency gate, its largest section at 5.7KB. Why not: every capture pass reads it, so it is hot path and extraction is D50's treadmill.
- Driving all five under 5,000. Why not: two of the five lose nothing that matters, and the remaining reductions are condense work rather than reordering.

**Consequences**
- **All five now lose procedure rather than a guard**, which is the state worth holding. `done` and `update-claude-docs` also tell their reader that a missing back half *is* the compaction, converting a silent loss into a detectable one.
- **Set totals rose in every case** (`update-claude-docs` 32,651 → 37,155 across its set), so every relocation has a named destination.
- **The extraction introduced a depth error in the file it created** — a `../_shared/` pointer correct in a SKILL.md and wrong one directory down — written by a session that had just documented that exact trap two hours earlier. Caught by resolving rather than reading. This is the third instance of the shape in this corpus and the argument for the mechanical check over the rule.

**Status**: committed · **Reversible**: yes · Open: five skills over, none losing a guard · **Superseded by D-ceiling-cleared** (kept: records what the interim state was and why the staged approach was taken)
---

### D-ceiling-cleared — All 32 Skills Under the Re-Attach Ceiling — committed — 2026-08-20

**Problem**
Five skills remained over 5,000 tokens after the reordering pass, which had fixed *what* they lost without changing *that* they lost it. Getting under required real relocation, which is where `condense-task-doc`'s over-cutting incident happened.

**Decision**
Chosen: dispatch `unhobble-instructions` per file on haiku — the right instrument, since these are SKILL.md files and its lens (collapse enumerations, route cold material out) is the operation needed. Snapshot first, then verify against the snapshot rather than against the agents' reports.

Handled inline instead where the gap was small: `agent-setup` (−431) and `unhobble-instructions` (−813) were cheaper to edit directly than to brief.

| Skill | Before | After |
|---|---|---|
| `done` | 8,559 | 4,232 |
| `update-claude-docs` | 7,968 | 2,976 |
| `task-summary` | 6,229 | 2,642 |
| `unhobble-instructions` | 5,813 | 4,998 |
| `agent-setup` | 5,431 | 4,989 |

**Rejected**
- Extracting `update-claude-docs`'s residency gate or `agent-setup`'s agent roster. Why not: both read on every invocation. Hot-path extraction is the treadmill, and shrinking a file by moving what everyone reads improves the metric while degrading the artifact.
- Trusting the agents' reports. Why not: two contradicted themselves — one claimed it "comes under the 20 KB target" while reporting 16,617 bytes, another reported a 66% cut without noting its set total had fallen.

**Consequences**
- **Set accounting held everywhere**: `done` +3%, `task-summary` +3%, `unhobble-instructions` −1%, `agent-setup` −4%, `update-claude-docs` −10%. All well inside the ~35% deletion threshold; the two that grew are relocations landing in siblings.
- **One real loss, restored.** `done` dropped a stated limitation — `ListAgents` confirms a peer is live but *cannot* say which checkout, so the diff read stays the only check. Exactly D-limitation-reads-as-hedging: text saying what a tool can't do reads as hedging to a pass hunting over-caution, and cutting it leaves the diff read looking optional.
- **The identifier-diff produced false positives twice**, both from comparing exact strings: a pointer correctly re-prefixed `../../` on moving into `references/` reads as a deleted identifier, as does a command relocated to a companion. Compare by concept across the whole set, never by literal string against one file.
- **`${CLAUDE_SKILL_DIR}` pointers went 0 → 14.** Every new pointer this pass created uses the absolute form and conditional phrasing.
- Four single-row `❌/✅` tables were found and converted while the user read along — a table that shrinks to one row is scaffold outliving its justification, now named in `entry-style.md`.

**Status**: committed · **Reversible**: yes · Closes the ceiling work opened by D-source-6-harness-drift
---

