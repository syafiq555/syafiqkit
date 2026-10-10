<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/external-guidance/agent-and-edit-traps
Related: ../current.md (feature index — which file holds which decisions), applying-verdicts.md (sibling theme — verdict and source-grading decisions), reattach-ceiling.md (sibling theme — the ceiling passes these traps were found during), ../../doc-condensation/decisions/unhobble-rule-writing.md (D63, the measured prose-vs-value boundary)
Last updated: 2026-10-10 — split by topic out of applying-verdicts.md; decision blocks moved verbatim, none reworded
-->

# External Guidance — Agent and Edit Traps

Failures in how a check, an agent report or a scripted edit is trusted, found while applying verdicts to this plugin.

---

### D-agent-broke-its-own-pointer-check — Three Agents Reported the Same Reference Missing Because Their Extraction Kept the Emoji — committed — 2026-08-20

**Problem**
A pointer audit reported 38 of 127 pointers broken, 30% of the corpus, with six named as actionable depth errors. Resolving all six by hand from their citing directories: every one existed. The agent had extracted paths from `` `📖 ../foo.md` `` without stripping the `📖`, then tested a path beginning with an emoji and a space — which cannot exist — and reported the miss as a defect of the file. Its stated reason ("emoji in path breaks resolution") reads as a real finding.

The first correction attempt had the identical bug, and `agent-setup/SKILL.md:157` already recorded that **two earlier subagents independently reported this same file missing when it exists**. Three separate agents, one cause, and the file was already carrying a note saying not to trust the report.

**Decision**
Chosen: a broken-pointer sweep needs a positive control before its output is read — resolve one pointer known to be good and confirm the checker says so. A checker that reports everything broken is measuring itself, which is `{#zero-hit-measures-the-pattern}` inverted: a *universal* hit is as suspect as a universal miss.

Second: a `📖` is decoration inside the backticks, not part of the path, so any extraction has to strip a leading emoji, a `> ` blockquote marker and a `See `. Glob patterns and illustrative examples (`tasks/**/current.md`, `📖 See .../gotcha-name.md`) are not paths and belong on an exclusion list.

**Consequences**
- **Real count: 2 broken, not 38.** One of those two is a false positive on inspection — `agent-setup:157` quotes a `../../` path as an example of what a *template* contains, where that depth is correct, and the surrounding sentence says a copied pointer is dead on arrival by design. One genuine defect: a missing `../` prefix in `update-claude-docs`, now fixed.
- **A 30% failure rate should have been the tell.** A defect that common in a corpus with a standing resolve-check would have surfaced long before; the number was evidence about the checker.
- **The file's own warning did not prevent the third recurrence**, because a reader reaches the finding through the agent's report rather than through the file. Where a known-good artifact keeps getting reported broken, the note belongs with whoever runs the check, not only with the file being checked.

**Status**: committed · **Reversible**: yes
---

### D-scripted-anchor-matched-the-wrong-occurrence — A Python Edit Duplicated Half a Doc and Every Section Still Read Correct — committed — 2026-08-20

**Problem**
Updating this doc's Quick Start, a `python3` heredoc sliced on `s.index('**Gotchas that will trip you**:')`. That string appears twice — once in Quick Start, once in the body — so the "replacement" inserted a second copy of the front half instead of replacing anything. The file went 174 → 309 lines with `## Overview`, `## Critical Gotchas`, `## Bugs Fixed` and `## Last Session` each appearing twice, and a mangled `## Next Steps\`.` heading where two fragments met.

Nothing caught it for three further edits. Every individual section read correctly; only the *set* was wrong, and each subsequent edit anchored into whichever copy it found first, compounding the damage. Recovery from `/tmp` backups failed twice because the backups had been taken after the corruption.

**Decision**
Chosen: for an anchored edit, use `Edit` — it refuses a non-unique anchor, which is precisely the failure here. Where a script is genuinely right, assert uniqueness before slicing (`s.count(anchor) == 1`) rather than trusting `.index()` to find the intended one.

Structural repair is bounded by section inventory, not by reading: list every `^## ` heading and confirm each appears exactly once. That check found the damage in one command after three edits had walked past it.

**Rejected**
- Reverting to the committed version. Why not: it predates this session's split, so recovery would have destroyed correct work to undo a formatting fault.
- Trusting a `/tmp` snapshot taken mid-session. Why not: two of the three had been written after the corruption, so restoring from them reproduced it. A snapshot is only a baseline if it predates the first suspect write.

**Consequences**
- **`.index()` on a phrase that recurs is the scripted-write trap in its quiet form.** It doesn't no-op and it doesn't error; it edits the wrong place and leaves output that reads correct section by section.
- **A duplicated section is invisible to every content check.** Fact-survival greps came back healthy — the facts were all present, some of them twice. Only heading inventory and the line count showed it.
- Confirms the plugin's own `{#shell-finds-tools-write}` rule from the failure side: the shell is for finding, `Edit` for changing.

**Status**: committed · **Reversible**: yes
---

### D-a-model-that-declines-a-rule-reports-it-as-absent — Four Probes Concluded a File Never Loaded While the Harness Was Printing "Loaded" — committed — 2026-08-20

**Problem**
Asked whether D17's five-week-old finding had since been fixed upstream, this session re-tested it and concluded the mechanism had changed for the worse: a `paths:`-scoped rule appeared to load *never*, even when a matching file was read in the same turn. Four headless (`claude -p`) probes agreed, each with a positive control showing a frontmatter-less rule loading normally. The conclusion was wrong, and it was about to be written into three skill files and a changelog correction sent to colleagues.

An interactive run settled it in one shot: the session UI printed `Loaded .claude/rules/_probe-convention.md`, and the reply quoted the rule's contents back by full path — then answered "NONE STATED" anyway, having judged the planted file a probe rather than a genuine project convention ("isn't referenced by CHANGELOG.md, CLAUDE.md, or any skill, and this repo is a markdown plugin that emits no logs at all"). The rule had loaded every time. What varied was whether the model *acted* on it.

**Decision**
Chosen: keep D17's finding — a `paths:` glob does not keep the file out of context — and record the measurement trap as the more durable result. Read load-state from the harness (the `Loaded <path>` line, `/context`) rather than from the model's answer.

**Rejected**
- Trusting the headless probes because they carried a positive control. Why not: the control proved the payload *could* load, not that a negative answer meant it hadn't. Both arms share the confound — a model that dismisses the content answers identically to one that never received it.
- Rewriting the payload to be more credible and re-probing. Why not: this was already the second payload. The first (a planted passphrase) drew an explicit prompt-injection refusal; the neutral rewrite (a fake log-timestamp convention) drew a reasoned dismissal instead. Making the bait better produces a better refusal, not a cleaner measurement.

**Consequences**
- **Self-report cannot measure context membership.** "The model didn't mention it" is evidence about the model's judgement, not about what was in its window — and the two are indistinguishable from outside. Any absence-based finding about loading needs an out-of-band witness.
- **A planted canary invites the exact judgement that breaks the test.** Content designed to be distinguishable is content that looks planted, and a model that notices reports it as absent. This is the flaw in D17's own method too, though its conclusion survived.
- **Headless and interactive differ in what they let you see, not only in what they do.** The UI's load report existed the whole time and no headless probe could reach it.
- Confirms `{#absence-needs-a-live-writer}` on a surface it wasn't written for: the witness whose health went unestablished here was the model's willingness to answer.

**Status**: committed · **Reversible**: yes
---

