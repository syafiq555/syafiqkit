# Agent Setup Verification Checklist

**Read this file when verifying agent files against the four concerns in Step 5.** Each concern lists the specific checks to run and how to interpret results. A comprehensive verification requires checking all four.

⚠️ **Every check below is a token-presence test, and an agent file's worst defects are shape-correct — the right words in the wrong place.** A grep answers "does this file contain X", never "does X sit where the agent will act on it" or "does X contradict Y three lines up", so the checks pass cleanly on a genuinely broken file and the clean result is what stops you reading further. The three shapes that survive every check here: a **contradiction**, where a banner mandates the correct command and the numbered step executes the wrong one (both tokens present, so presence and absence checks both pass); **misordering**, where a guard against destructive edits sits after the step that applies them (present, never reached); and a **wrong argument inside a right command**, where the command name greps fine and its glob silently returns 0. So treat the checks as a first pass that narrows where to look, then **read each agent's Process section top-to-bottom as the agent would execute it**, asking at each numbered step whether the command is the one the file's own warnings demand and whether anything it depends on is stated later than the step that needs it. Budget for that read; it is where the findings are, and no combination of greps substitutes for it.

---

## 1. Content Validity

**This concern is a READ, not a grep.** The checks below narrow where to look; they cannot settle it. Open each agent and walk its Process as the agent would execute it:

- [ ] **Every path the file cites resolves on disk.** Extract them and test each — a consolidation commit that deletes or merges layer files leaves agents citing paths that no longer exist, and a bare `CLAUDE.md` with no directory prefix still resolves to *a* real file, just the wrong one. Both read as ordinary rows.
  ```bash
  grep -ho '`[a-zA-Z0-9_./-]*CLAUDE\(\.local\)\?\.md`' .claude/agents/*.md | tr -d '`' \
    | grep -v '^\$\|^~/' | sort -u | while read p; do [ -f "$p" ] || echo "DEAD $p"; done
  ```
- [ ] **Each numbered step's command matches what the file's own banners demand.** Where a banner and a step disagree, the step is what runs — fix the step. Both tokens are present, so no presence or absence check detects this.
- [ ] **Nothing a step depends on is stated after the step that needs it.** A never-remove list, a scope guard, a precondition: each is inert below the step that deletes or writes. Check position, not presence.
- [ ] **Commands are correct in their arguments, not just their names.** A glob that matches nothing, a flag that means something else — the command name greps clean while the command reports 0 and the 0 reads as a healthy result.
- [ ] No duplicated CLAUDE.md content — grep the inline rules table to confirm it holds only facts that prevent crashes/corruption at runtime, not derivable facts, one-time setup, or symptom-indexed gotchas (those belong in CLAUDE.md, discovered at runtime).
  ```bash
  grep -A 30 "High-Frequency\|Mistakes\|Simplifications" .claude/agents/*.md | grep -i "docker\|env\|install\|token" | head -5
  # Should return few/zero hits on setup/config facts
  ```

- [ ] Bootstrap section references correct CLAUDE.md paths — spot-check one agent's Bootstrap table against the actual files.
  ```bash
  head -1 CLAUDE.md  # confirm root exists
  ls app/CLAUDE.md resources/js/CLAUDE.md tests/CLAUDE.md 2>/dev/null | wc -l  # how many layer files exist
  ```

- [ ] Path layout matches Bootstrap description (single root, root + layers, root + sub-projects, or multi-repo).

---

## 2. Frontmatter Invariants

- [ ] All agents have `memory: project` in frontmatter AND read it back (critical — the grant is useless without the read).
  ```bash
  for agent in .claude/agents/*.md; do
    grep -q "memory: project" "$agent" || echo "Missing memory grant: $agent"
    grep -q "agent-memory" "$agent" || echo "Missing memory read: $agent"
  done
  ```
  Expected exception: `task-builder` is by design the only agent that doesn't read memory (it doesn't inherit prior session context).

- [ ] Run the same check against `templates/*.template.md` — a template that ships without the memory-read line bakes the gap into every project regenerated from it.
  ```bash
  for tmpl in templates/*.template.md; do
    grep -q "agent-memory" "$tmpl" || echo "Template gap: $tmpl"
  done
  ```

- [ ] All agents have `color:` in frontmatter, matching fixed per-agent-name values:
  ```bash
  grep "^name:\|^  color:" .claude/agents/*.md | paste - - | sed 's/.*name: //' | sed 's/.*color: /  → /'
  # Verify: Explore→green, Plan→blue, task-builder→pink, code-reviewer→red, code-simplifier→cyan, claude-md-pruner→yellow, product-reviewer→purple, browser-verifier→orange
  ```

- [ ] Model tiers correct for role:
  ```bash
  grep "^name:\|^  model:" .claude/agents/*.md | paste - - | grep -v "Explore.*haiku\|Plan.*sonnet\|task-builder.*sonnet\|code-reviewer.*sonnet\|code-simplifier.*sonnet"
  # Should return nothing for violations; exceptions only if justified by inline comment
  ```

- [ ] Tools grants match role:
  ```bash
  grep "code-reviewer\|code-simplifier" .claude/agents/*.md -l | xargs grep "mcp__ide__getDiagnostics"
  # Must hit both code-reviewer and code-simplifier; absence is a gap
  
  grep "product-reviewer\|browser-verifier" .claude/agents/*.md -l | xargs grep -L "mcp__ide__getDiagnostics"
  # Must return both; presence is a gap
  
  grep "^name: task-builder" .claude/agents/*.md -A 3 | grep "^  tools:"
  # Should return nothing (task-builder has NO tools: line, intentionally granting all)
  ```

---

## 3. Agent-Specific Behavior

Run these checks for the agents mentioned:

**code-reviewer & code-simplifier:**
```bash
grep "Known False Positives\|Don't Simplify" .claude/agents/code-*.md
# Each should have its own table; presence confirms section exists
```

**Both (LSP usage):**
```bash
grep "hover\|documentSymbol" .claude/agents/code-*.md | wc -l
# Should be ≥ 4 (mentions in both agents); absence suggests revert to goToDefinition (broken)
grep "goToDefinition\|findReferences" .claude/agents/code-*.md
# Should return nothing (known to be broken); any hit is regression
```

**product-reviewer:**
```bash
grep -c "disallowedTools:.*Write, Edit" .claude/agents/product-reviewer.md
# Must be 1. Absence is a REAL gap even though tools: omits Write/Edit — the harness
# grants a tool left off the tools: line, so omission alone does not enforce read-only.
grep "3-tier\|blocking\|expected-missing\|polish\|Don't Flag" .claude/agents/product-reviewer.md
# All of these should be present
```

**browser-verifier:**
```bash
grep "disallowedTools:" .claude/agents/browser-verifier.md | grep -c "Write, Edit"
# Must be 1; absence means reads can "fix" bugs instead of reporting them
grep "assert-the-effect\|never-fabricate\|USER-TRIGGERED" .claude/agents/browser-verifier.md
# All three load-bearing rules must be present
grep "matchMedia" .claude/agents/browser-verifier.md
# Mobile recipe should gate on matchMedia(...).matches, not width alone
grep -n "<[a-z][a-z_]*>" .claude/agents/browser-verifier.md
# Should return nothing; any hit is an unfilled slot
```

**Explore & Plan (shadowing, writes scoping):**
```bash
grep "^name:" .claude/agents/Explore.md .claude/agents/Plan.md
# Must be exactly "Explore" and "Plan" (capitalized, no hyphens)
grep "scratchpad\|~temp\|findings" .claude/agents/Explore.md
# Should mention that Explore's findings ARE its text output, scratchpad never touches caller's plan
grep "~/.claude/plans/" .claude/agents/Plan.md
# Should restrict Write to plans directory
```

**claude-md-pruner:**
```bash
grep "Size policy\|Target length\|outer ceiling\|condense-claude-md" .claude/agents/claude-md-pruner.md
# Should delegate sizing to condense-claude-md, not own a threshold; any hardcoded number is drift
grep "0.5 Detect the artifact" .claude/agents/claude-md-pruner.md
# Presence confirms artifact-branch migration is done (CLAUDE.md + task-doc handling)
```

**Task-doc-consuming agents** (Explore, Plan, task-builder, code-reviewer, code-simplifier, product-reviewer, claude-md-pruner):
```bash
for agent in Explore Plan task-builder code-reviewer code-simplifier product-reviewer claude-md-pruner; do
  grep -q "^  Skill" .claude/agents/${agent}.md || echo "Missing Skill: $agent"
  grep -q "/read-summary" .claude/agents/${agent}.md || echo "Missing /read-summary: $agent"
done
# All should have both
```

**Multi-repo agents** (if applicable):
```bash
grep "⚠️ Two-repo session" .claude/agents/*.md | wc -l
# Should be 8 (all agents); absence = multi-repo session not recognized
grep -E "~/[A-Za-z]|/home/|/Users/" .claude/agents/*.md
# Should return only generic harness paths (e.g., ~/.claude/plans/); any repo-specific path is hardcoded (wrong)
grep "\$SIBLING" .claude/agents/*.md
# Multi-repo sessions should use placeholder variables, not literal paths
```

---

## 4. Drift Detection

**Template drift** — compare each generated agent against its template. Drift includes:
- Missing tool grants
- Missing process steps or sections
- Missing or truncated tables (especially table row labels)
- Model tier changes without justification comment

**Check frontmatter entirely** (don't grep individual fields):
```bash
for agent in .claude/agents/*.md; do
  name=$(grep "^name:" "$agent" | head -1 | sed 's/.*: //')
  tmpl="templates/${name}.template.md"
  if [ -f "$tmpl" ]; then
    awk 'NR==1,/^---$/{print}' "$agent" | tail -1 > /tmp/fm-agent.txt
    awk 'NR==1,/^---$/{print}' "$tmpl" | tail -1 > /tmp/fm-tmpl.txt
    diff /tmp/fm-agent.txt /tmp/fm-tmpl.txt && echo "OK: $name" || echo "DRIFT: $name frontmatter"
  fi
done
```

**Check table rows** (the most-missed drift type):
```bash
for agent in .claude/agents/*.md; do
  name=$(grep "^name:" "$agent" | head -1 | sed 's/.*: //')
  tmpl="templates/${name}.template.md"
  if [ -f "$tmpl" ]; then
    comm -23 \
      <(grep "^| " "$tmpl" | sed 's/|.*//' | sed 's/^ *//;s/ *$//' | sort) \
      <(grep "^| " "$agent" | sed 's/|.*//' | sed 's/^ *//;s/ *$//' | sort) \
    | while read row; do [ -n "$row" ] && echo "Missing row in $name: $row"; done
  fi
done
```

**Missing agents** — check for templates with no generated copy:
```bash
comm -23 \
  <(basename -a templates/*.template.md | sed 's/\.template//' | sort) \
  <(basename -a .claude/agents/*.md | sort) \
| while read missing; do
  echo "Missing agent: $missing"
done
```

**Run these yourself rather than delegating them.** A delegated "diff all N files" summary reports whole missing sections and silently drops everything finer, which is the opposite of what these checks are for — table rows are the most-missed drift and the first thing a summary loses. A clean report is the one most likely to go unchecked, precisely because nothing in it looks worth double-checking: a real session reported a full 8-file sweep clean on three parallel agents' word, and only found two genuinely missing rows after being asked "are you sure?" and re-reading the highest-risk pair by hand. Treat a delegated pass as a first draft to spot-check — at minimum re-open the file carrying the least redundancy (the shortest generated copy relative to its template) before repeating its conclusion as your own.

**Pruner migrations** (pre-task-doc pruners or hardcoded size thresholds):
```bash
grep -n "Target length\|outer ceiling" .claude/agents/claude-md-pruner.md && echo "MIGRATE: pruner has hardcoded size threshold (drift)"
grep -c "0.5 Detect the artifact" .claude/agents/claude-md-pruner.md | grep -q "^0$" && echo "MIGRATE: pruner lacks artifact-branch detection (drift)"
```

---

## Interpretation

**Content Validity**: If checks fail, the agent won't fire correctly or will duplicate CLAUDE.md. Fix by re-reading CLAUDE.md and extracting only runtime-critical rules.

**Frontmatter Invariants**: Violations here silently degrade agent capability — missing memory reads accumulate notes nobody ever sees, wrong models send agents to the wrong reasoning tier, missing tools block the agent silently.

**Agent-Specific Behavior**: Each agent has 1-3 load-bearing constraints (reviewer's false-positive table, browser-verifier's read-only + disallowedTools combo, Explore/Plan's shadowing + scoped writes). Absence = the agent will misbehave or bypass its own guards.

**Drift Detection**: Template features added *after* this project's agents were generated never get backported unless caught by explicit diff. A generated file can pass every behavioral check while still being stale (new tool grant, new section). Row-level diffs catch this better than heading-level checks.

