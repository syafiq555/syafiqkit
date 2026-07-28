---
name: audit-instructions
description: >
  Fleet-wide prompt-engineering audit across the instruction files a session actually loads — every `skills/*/SKILL.md` AND every `CLAUDE.md` / `CLAUDE.local.md` / companion file. Measures each corpus, grades it against the four-verdict external-guidance method, and pinpoints which files need attention instead of guessing. Use when the user says "audit the skills", "audit our CLAUDE.md", "grade our instructions", "which skill needs attention", "is our CLAUDE.md too big", "are our instructions well written", "prompt engineering audit", "check instruction quality", "is the plugin bloated", or asks whether the setup follows outside best-practice advice. Also fires when external guidance (a vendor article, a tool's audit report) needs grading against these files. Hands flagged files to their owning skill — `update-plugin` for skills, `update-claude-docs` / `condense-claude-md` for CLAUDE.md — and never edits either itself. Do NOT use for a single named file (that's the owning skill directly), or to shrink one file (that's the condense skills).
---

# Audit Instructions

Parallel fleet grade of the instruction files a session loads, against the method in the plugin's own `tasks/plugin-maintenance/external-guidance/current.md` (D55/D56) — **source-checkout only; `tasks/` is not shipped to installs, so off the checkout this method is restated below and the doc is unreachable, not merely elsewhere.** Two artifact families, one method:

| Family | Files | Why it needs a fleet view |
|---|---|---|
| **Skills** | `skills/*/SKILL.md` | `update-plugin` Step 3a grades ONE file when a session touches it; nobody knows which of the 20+ has drifted |
| **CLAUDE.md** | `~/.claude/CLAUDE.md`, project `CLAUDE.md`/`CLAUDE.local.md`, `.claude-companions/**` | The global file **auto-loads on every turn of every project** — the highest-leverage hot path in the setup, and nothing watches its growth |

**This skill owns no threshold.** The ~90 B/L gate and the density checklist belong to `update-plugin` Step 3a; CLAUDE.md size policy belongs to `condense-claude-md`. Cite them, never restate them — a second copy is the defect D50 exists to stop.

📖 **`_shared/references/consumer-portability.md`** — this skill runs on installs, not just the checkout: `tasks/` is not shipped, install paths are version-scoped, and the commands below assume a POSIX shell. Read it before adding any step that writes to a path or embeds a command.

⚠️ **Density is NOT an axis for CLAUDE.md.** Both artifacts independently reached the same conclusion — the plugin's D50 for skills, and `~/.claude/CLAUDE.md`'s own maintenance note for itself: *"re-bloats by ARRIVAL RATE, not density — repeated condenses cannot hold it."* Grade CLAUDE.md on emphasis, arrival rate, and hot-vs-cold routing only.

## When to use this vs the owning skill directly

| Situation | Skill |
|---|---|
| User names one skill ("is `done` too dense?") | `update-plugin` Step 3a directly — no fleet scan |
| User names one CLAUDE.md and wants it smaller | `condense-claude-md` directly — it owns the size policy |
| A session hand-edited a skill file | `/done` Gate B → `update-plugin` — already scoped |
| User wants a whole corpus graded, no file named | This skill, then the owning skill per flagged file |
| External guidance arrived and needs grading | This skill — Step 2 is the four-verdict method |

## Workflow

### Step 1 — Measure the corpus BEFORE grading

D55 step 2: measurement precedes judgment, because the decisive rebuttals are numbers. Run all four from `HEAD`, never the working copy — on a dirty tree another writer's uncommitted bytes report as your growth.

```bash
# per-file density (bytes/line) — the hot-path signal
for f in $(git ls-tree -r HEAD --name-only | grep -E '^skills/.*SKILL\.md$'); do
  c=$(git show HEAD:$f | wc -c); l=$(git show HEAD:$f | wc -l)
  printf "%s %s\n" "$(echo "scale=1;$c/$l"|bc)" "$f"
done | sort -rn
# emphasis dilution, per file and corpus-wide
grep -rc '⚠️' --include='*.md' skills/ | awk -F: '{s+=$2} END {print s}'
# progressive-disclosure coverage
git ls-tree -r HEAD --name-only | grep -E '^skills/[^/]+/references/' | cut -d/ -f2 | sort -u | wc -l
# FLEET arrival rate — this skill's own measurement
git log --since="7 days ago" --numstat --format='' -- 'skills/**/*.md' \
  | grep -E '^[0-9]+\s+[0-9]+' | awk '{a+=$1; d+=$2} END {printf "added %d removed %d net %+d ratio %.2f\n", a, d, a-d, a/d}'
# per-file growth, DISQUALIFYING files created inside the window
since="7 days ago"
for f in $(git ls-tree -r HEAD --name-only | grep -E '^skills/.*SKILL\.md$'); do
  [ -n "$(git log --since="$since" --diff-filter=A --format=%H -- "$f")" ] \
    && { echo "NEW($(git log --diff-filter=A --format='%ad' --date=short -- "$f" | tail -1)) $f — no baseline, not a growth reading"; continue; }
  git log --since="$since" --numstat --format='' -- "$f" \
    | awk -v f="$f" '{a+=$1;d+=$2} END {if(a||d) printf "%d %s\n", a-d, f}'
done | sort -rn   # bare int, not %+d — a leading '+' breaks numeric sort
```

The fleet ratio is why this skill exists as a sweep. Gate B measures the files ONE session touched, so a corpus trending above 1:1 across dozens of commits is invisible to it by construction. Report the ratio every run; sustained above 1:1 means naming which files drove the growth (per-file command above). ⚠️ **A file created inside the window has no baseline to have arrived against — report it `NEW`, never as a growth figure**, or it ranks #1 on its first audit and crowds out real signal. **Tell: your top grower's growth equals its total length.**

**A file the ratio flags enters Step 4's table on that basis alone, with axis `arrival-rate` and no grading verdict** — growth is a finding in its own right, and the file the graders liked is exactly where an unretired rule hides. Otherwise a grader's silence would delete the measurement this skill exists to make. The emphasis command above counts `skills/` only; a corpus-wide figure additionally spans `.claude/agents/` and `CLAUDE.md`, so state which scope any number you report came from.

#### The CLAUDE.md family

Run this instead when the audit covers CLAUDE.md files. `~/.claude` is a git repo, so arrival rate is measurable there too — that is the number nothing currently watches.

```bash
# size + emphasis, auto-loading files first, then the cold companions
for f in ~/.claude/CLAUDE.md ./CLAUDE.md ./CLAUDE.local.md ~/.claude/.claude-companions/shared/*.md; do
  [ -f "$f" ] && echo "$(wc -l <$f|tr -d ' ')L $(wc -c <$f|tr -d ' ')B warn=$(grep -c '⚠️' $f) $f"
done
# arrival rate over the file that loads every turn — run BOTH windows, label each
for w in 7 30; do printf "%sd: " $w; git -C ~/.claude log --since="$w days ago" --numstat --format='' -- 'CLAUDE.md' '.claude-companions/**/*.md' \
  | grep -E '^[0-9]+\s+[0-9]+' | awk '{a+=$1; d+=$2} END {printf "added %d removed %d net %+d ratio %.2f\n", a, d, a-d, a/d}'; done
# trajectory — a ratio near 1:1 still compounds; size is what the reader pays
for d in 30 14 7; do s=$(git -C ~/.claude log --until="$d days ago" -1 --format=%H -- CLAUDE.md); \
  [ -n "$s" ] && echo "$d days ago: $(git -C ~/.claude show $s:CLAUDE.md | wc -c | tr -d ' ') bytes"; done
```

**Report the trajectory and label every ratio with its window.** A ratio under 2:1 reads healthy while the file still doubles — measured 2026-07-27, the global CLAUDE.md sat at **1.34:1 (7d) / 1.46:1 (30d)** while growing **16.8KB → 40.1KB over those 30 days**. The ratio says retirement is happening; the trajectory says it is not keeping pace, and only one of those numbers is what a reader pays on every turn. An unlabelled ratio is unreproducible — the two windows disagree, so a figure without its window cannot be checked against the command that produced it.

⚠️ **A companion file is cold-path and a `CLAUDE.md` is hot-path, so the same finding has opposite weight in each.** An auto-loading file costs its bytes on every turn of every project; a companion costs nothing until a `📖` pointer is followed. Before flagging anything, establish which the file is — then the routing axis below asks whether its contents are on the right side of that line.

### Step 2 — Fan out graders, partitioned BY FILE

Split the file list into batches of ~8 and dispatch one agent per batch. **All batch agents go in ONE message** — one call per message serialises them. Never mix the two families in one batch: the axes differ, and an agent holding both applies the wrong one.

⚠️ **Partition by FILE, never by axis.** Giving agent 1 "all the emphasis grading" and agent 2 "all the redundancy grading" means no agent ever holds a whole file, so every finding that lives *between* two axes in one file is invisible. File partitions have no seam here — the sweep is read-only.

Each agent's prompt must:
1. `Read` every assigned file **in full**, and `ls` its `references/` dir (skills) or resolve its `📖` companion pointers (CLAUDE.md).
2. Grade on the axes for its family, each with one of D55's four verdicts — **adopt · already-adopted · reject · unverified**.

**Skill axes** (`skills/*/SKILL.md`):
   - **Progressive disclosure** — cold-path content (rare branches, worked examples, per-platform detail) sitting in the hot path. A pointer must name the SYMPTOM, not a generic phrase.
   - **Emphasis dilution** — ⚠️ count and count-per-100-lines; which markers are not genuinely trap-shaped.
   - **Judgment over prescription** — rigid procedure a capable model would do anyway, vs a non-obvious trap. Only the second earns bytes.
   - **Redundancy** — a rule stated 2+ times, or duplicating `_shared/references/*.md`. A shared FORMAT is not duplication; only a duplicated RULE counts.

**CLAUDE.md axes** (`CLAUDE.md`, `CLAUDE.local.md`, companions) — three, not four. **Density is deliberately absent**; see the warning at the top.
   - **Hot-vs-cold routing** — is each rule on the right side of the auto-load line? A rule the file loads every turn but that fires for one narrow symptom belongs in a companion; a rule a companion owns but that governs a decision made constantly belongs inline. This axis replaces progressive disclosure: the mechanism exists (`📖` companions), so the question is placement, not extraction. Flag any `📖` pointer whose text does not name the SYMPTOM that should send a reader to it.
   - **Emphasis dilution** — same measurement as skills. This axis has a proven track record on this artifact: a prior pass took the global file from 53 ⚠️ to 12.
   - **Retirement candidates** — a rule whose trap can no longer fire (the tool is gone, the branch was deleted, the format changed). ⚠️ **Report these as candidates with the command that would settle each, never as confirmed dead** — a pass on 2026-07-26 found 0 of ~7 candidates actually dead, and the rule that looks retired is usually a reintroduction ban or a still-live guardrail. Verify before cutting; absence of uptake is not absence of need.

3. **Cite a line number or command output for every grade.** No citation → the verdict is `unverified`, never a guess.
4. Return a per-file table plus a ranked list of its batch.

Point agents at the canonical owner for whichever family they hold — `update-plugin/SKILL.md` Step 3a for skills, `condense-claude-md/SKILL.md` for CLAUDE.md size policy — and don't let them restate either from memory.

### Step 3 — Verify inline before reporting

⚠️ **An agent's finding is a hypothesis with a line number attached, and the line numbers are usually right even when the claim is wrong** — which is exactly what makes them convincing. Re-read the cited lines yourself for every finding you intend to act on. Two failure shapes recur:

| Symptom | What actually happened | Settle it by |
|---|---|---|
| "This section duplicates a shared reference" | The file already points at that reference, and its own rows are distinct | Read the pointer line and diff the RULES, not the topic |
| "Extract this cold-path section to `references/`" | The section is read on every invocation — mode selection, routing, a decision table | Ask which invocations skip it; if none, it is hot path and extraction is the D50 treadmill |
| "This heading is empty / this structure is broken" | The grep that found it could not see fenced code blocks | Read the range with the Read tool, never conclude structure from `grep '^## '` |
| "This reference has no inbound pointers" | The grep's own filter excluded the pointers | Run a must-hit control before any absence claim |

A finding that fails verification is recorded as **disproved**, not silently dropped — a wrong finding costs more than a missing one, and the next run will re-derive it otherwise.

### Step 4 — Compile and present

Keep only files with surviving findings. Do not dump the clean files back — one line ("N of M graded clean") is the correct summary. Present as one table:

```
| File | Family | Axis | Verdict | Evidence | Action |
|------|--------|------|---------|----------|--------|
| gchat-format | skill | progressive disclosure | adopt | 26-line worked example, L150+ | extract to references/ |
| done | skill | progressive disclosure | reject (D50) | mode selection read every invocation | hot path, leave it |
| task-summary | skill | arrival-rate | adopt | +180 lines / −12 over the window | Step 3a: name the replace, route, or declared growth |
| ~/.claude/CLAUDE.md | claude-md | arrival-rate | adopt | 16.8KB → 40.1KB in 30d; 1.34:1 (7d) / 1.46:1 (30d) | route narrow rules to companions |
| CLAUDE-agent-bootstrap.md | claude-md | emphasis | adopt | 23 ⚠️ in 71 lines | downgrade non-trap markers |
```

Every **reject** names the ADR or the command that decided it. An impression is not a verdict — D55.

### Step 5 — Hand off

Don't patch inline. Route each flagged file to the skill that owns its family:

| Family | Hand off to | It owns |
|---|---|---|
| `skills/*/SKILL.md` | `update-plugin` | Step 3a's density pass, the replace/route/declare accounting, version bump, CHANGELOG |
| `CLAUDE.md` / `CLAUDE.local.md` | `update-claude-docs` | writing and routing entries, the capture filter, companion placement |
| A CLAUDE.md whose **trajectory** crossed the budget the file declares for itself | `condense-claude-md` | the size policy and every split decision — this skill never states a byte target |

**The `condense-claude-md` row is reachable only from the arrival-rate axis, never from a density verdict** — no grading pass here emits "over budget", because density is not an axis. Route here when the trajectory measurement shows the file has crossed a budget *it declares for itself* (`_shared/references/declared-budget.md`); otherwise an over-large CLAUDE.md routes to `update-claude-docs` for companion placement, which is the lever that actually holds.

Running any of that logic here would duplicate it and drift.

Then hand the run's verdicts to `update-plugin` alongside the flagged files — the same handoff as the table above, never a separate write of your own. It owns the destination because its Step 0 owns the OWNER/CONSUMER probe that decides where a verdict may land. ⚠️ **Never write verdicts into the running project's `tasks/`** — that tree is the user's work, and a bare relative path resolves there, not into the plugin. D55 exists so a rejected claim costs one lookup instead of one re-evaluation; an unrecorded audit is one the next session repeats from impressions.

⚠️ **"Everything graded clean" is a claim about the sweep, not about the corpus.** A batch that mis-scoped its file list, read the wrong paths, or returned an empty table contributes zeroes that compile into a confident all-clear. Before terminating clean, confirm all three:

1. **Every file in Step 1's measurement appears in some batch's report** — a file silently absent is a failed batch, not a clean one.
2. **At least one batch returned a substantive `already-adopted` verdict with a stated reason** — a batch whose every row is bare "looks fine" never read the files.
3. **Spot-check one clean file yourself** — batch verdicts are provisional, and this is the only path where zero findings still forces you to open a file.

## Rules

| ❌ Never | ✅ Always |
|---|---|
| Edit a `SKILL.md` or a `CLAUDE.md` from this skill | Discovery + grading only — hand each flagged file to its family's owner (Step 5) |
| State a B/L threshold, a size budget, or a density rule here | Cite the owner: `update-plugin` Step 3a for skills, `condense-claude-md` for CLAUDE.md |
| Grade a CLAUDE.md on density | Emphasis, arrival rate, and hot-vs-cold routing only — the file's own note and D50 both rule density out |
| Measure from the working copy | Measure from `HEAD` — a dirty tree reports someone else's bytes as growth |
| Mix both families in one agent's batch | One family per batch; the axes differ and the wrong one gets applied |
| Partition agents by axis | Partition by file; no agent should hold half a file |
| Act on an agent finding as reported | Re-read its cited lines first; record disproved findings explicitly |
| Report a retirement candidate as confirmed dead | Name the command that settles it — a prior pass found 0 of ~7 actually dead |
| Read a healthy arrival ratio as a healthy file, or quote a ratio without its window | Report the size trajectory beside it and label the window — 1.34:1 (7d) still doubled the global CLAUDE.md over 30 days, and the 7d and 30d figures disagree |
| Rank a file created inside the window as a grower | Disqualify in-window creations (`--diff-filter=A`) and report them `NEW` — a file with no baseline has no arrival reading |
| Apply the B/L ratio to a `references/*.md` file | References are cold-path lookups, out of scope by D54 — judge them on single-topic + symptom-naming pointer + ~6KB prose ceiling |
| Recommend condensing a file that was condensed before | That is D50's treadmill — route cold content out or accept declared growth |
| Report a clean sweep without the three-part proof | Reconcile the file count, require one substantive verdict, spot-check one file |
