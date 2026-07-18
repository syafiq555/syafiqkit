# Scanning the Session Transcript for a Complete Record

Referenced by skills whose scan must not miss a signal from earlier in the session — the "what happened this session" step of `update-plugin`, `update-claude-docs`, `done`, `task-summary`. Apply when the failure mode is **recency bias**: reconstructing the session from the caller's own (compaction-prone, freshest-first) context silently drops an early correction, decision, or subagent finding. This reads the actual `.jsonl` on disk instead.

## Two modes — pick by what the caller consumes

| Mode | Output | Use when |
|------|--------|----------|
| **A — User anchor** (raw) | Numbered list of every genuine USER message, verbatim, in order. No other party. Un-interpreted by design. | The caller only needs the human's corrections/asks as an anti-recency anchor (e.g. re-deriving "what did the user actually tell me"). |
| **B — Full record** (grounded, default for doc-updates) | A timeline of **all parties**: every user message (verbatim) + every assistant DECISION/commit/fix + every subagent's key FINDINGS — each concrete claim tied to a transcript line. | Doc-update steps (`update-claude-docs`, `task-summary`) that must capture everything memory dropped, from any side — the default for `/done` Steps 3/4. |

**Both modes** delegate the mechanical retrieval (locate file → filter → produce the list) to an `Explore` agent and return **in order, never ranked**. The judgment — which lines are a signal to act on — stays inline on the CALLING session. The agent hands back the record; it does not decide what matters.

⚠️ **Mode B is grounded, NOT summarized.** It reports what each party did/found in compressed form, but every concrete claim (a file path, a decision, a finding, a value) must cite a transcript line — it must NEVER paraphrase a quote or invent a specific. A user message is reproduced VERBATIM (rewording loses meaning — one session's "deploy to STAGING" got rendered as "...to production" and misled the doc update). See the confabulation guards under "Mode B" below.

## Path resolution — the PARENT resolves it, never the subagent

The calling skill runs in the top-level session, which has `$CLAUDE_CODE_SESSION_ID` in its own Bash env (it matches its own transcript filename). Resolve the absolute path in the parent and pass it as literal text into the agent prompt:

```bash
TRANSCRIPT=$(ls -t ~/.claude/projects/*/"$CLAUDE_CODE_SESSION_ID".jsonl | head -1)
```

The session id is a globally-unique UUID, so the glob matches exactly one file across all project dirs — **this sidesteps the cwd-encoding entirely.** Do NOT re-derive the encoded directory name with `sed`: the `~/.claude/projects/<encoded-cwd>/` encoding (`/`→`-`, `.`→`-`, no collapsing) is **lossy, collision-prone, and version-unstable** — two different real paths can collide on one encoded name ([#7009](https://github.com/anthropics/claude-code/issues/7009), [#21085](https://github.com/anthropics/claude-code/issues/21085) — a user lost 93MB of history to exactly this), and the docs warn the format "changes between versions." Resolving by session-id UUID avoids needing the encoding to be invertible.

- **Agent-side cross-check (cheap assert, not a lookup):** the spawned agent inherits `$CLAUDE_CODE_SESSION_ID` (verbatim, the parent's), so it can confirm the id in the handed filename matches its own env — catches a stale/mis-resolved path before it reads the wrong session.
- **Fallback only if the glob is empty:** newest top-level `*.jsonl` by mtime in the encoded cwd dir (`ls -t <dir>/*.jsonl | head -1`). ⚠️ Unsafe when a second terminal tab runs a parallel session in the same cwd — it can win the "newest" slot. Never recurse into `<session-id>/subagents/` (a non-recursive top-level `*.jsonl` glob already excludes per-subagent transcripts).

## Pass 1 — jq mechanical filter (drop the bulk)

The raw `.jsonl` carries every tool_result payload — multi-MB. Keep only human text + assistant tool-call *names*:

```bash
jq -c '
  select(.type=="user" or .type=="assistant") |
  if .type=="user" then
    (.message.content) as $c |
    if ($c|type)=="string" then {type:"user", text:$c}
    elif ($c|type)=="array" then
      ($c | map(select(.type=="text")) | .[0].text) as $t |
      if $t then {type:"user", text:$t} else empty end
    else empty end
  else
    (.message.content // [] | map(select(.type=="tool_use")) | map(.name)) as $tools |
    if ($tools|length)>0 then {type:"assistant_tools", tools:$tools} else empty end
  end
' "$TRANSCRIPT" | jq -c 'select(.text != null)'   # drop array-content turns with no text block
```

Array-shaped `user` content is almost always a `tool_result` block (the harness represents tool results as synthetic user turns) — the `select(.type=="text")` requirement already excludes those, and the trailing `select(.text != null)` drops the residual nulls.

## Pass 2 — strip contaminants (the load-bearing step)

⚠️ **`type=="user"` is NOT "the human typed this."** Three harness-injected shapes pass Pass 1 and would corrupt the count — the exact recency-contamination this scan exists to prevent, resurfacing on the input side:

| Contaminant | What it is | Do |
|-------------|-----------|-----|
| Text starting `Base directory for this skill:` | A whole `SKILL.md` body injected as a synthetic user turn when a skill fires | **DROP** — the plugin's own instructions, not the user |
| Text containing `<task-notification>` (and its `<task-id>`/`<result>`/`<status>` children) | A spawned agent's result posted back as a synthetic user turn | **DROP** — this is agent output, not the human. The single biggest miss: a long session has many, each carrying an entire agent report |
| Text containing `<local-command-caveat>` | Harness wrapper around local-command output | **DROP** the wrapper turn |
| Text starting `[Request interrupted by user]` | Harness marker when the user interrupts a turn | **DROP** the marker line; the human's actual follow-up is the NEXT turn (keep that) |
| A genuine human message wrapped inside a `<system-reminder>` (e.g. a mid-turn message the user sent while a turn was running) | The harness sometimes folds a real user message into a reminder block on another turn instead of its own `type:user` turn | **KEEP the inner human text** — this is the inverse leak: a real message SILENTLY DROPPED. Scan `<system-reminder>` bodies for a line in the user's voice (a request/correction), extract it as its own numbered entry. Drop only the reminder scaffolding around it |
| `<command-name>` / `<command-message>` / `<command-args>` | Slash-command scaffolding, often split across several short turns | **UNWRAP** to the inner `<command-args>` text (the human's real input); drop the surrounding tags. Any turn that is ONLY `<command-name>` and/or `<command-message>` with no `<command-args>` payload → DROP |
| `null` / empty text | Array-content turn with no `text` block (already filtered in Pass 1's `select(.text != null)`) | Already gone |

What survives Pass 2 ≈ the human's genuine messages.

⚠️ **The single highest-frequency MISS is a mid-turn message folded into a `<system-reminder>`.** When the user sends a message while a turn is running, the harness does NOT give it its own `type:user` turn — it injects it into a `<system-reminder>` block on the NEXT assistant turn (marked "The user sent a new message while you were working"). Pass 2's contaminant strip is tuned to DROP `<system-reminder>` scaffolding, so these real messages get dropped WITH the scaffolding unless you extract them first. This is the opposite of every other Pass-2 row (which removes non-human text) and it is the one that fails silently — an absence cannot be eyeballed. **Before dropping any `<system-reminder>` block, scan its body for a line in the user's voice** (a request/correction/question, often short — "why didnt u just rsync?", "we wont be using this template anymore") and extract it as its own numbered entry at its chronological position. A session with many mid-turn messages loses many of them here; grep the raw transcript for `sent a new message while you were working` and confirm every hit produced a list entry.

⚠️ **The blocklist above is necessarily leaky — do NOT trust the jq/awk output as final.** New harness/skill shapes appear over versions, and an injected `SKILL.md` body is a *multi-line* turn whose marker (`Base directory for this skill:`) may not sit on line 1 after any line-splitting — a first-line-only match misses it and the whole skill body sails through as "user text." Verified against a real transcript: even after dropping `<task-notification>` / `<local-command-caveat>` / `[Request interrupted by user]`, a full `read-summary` skill body still leaked through. So:

- **Match markers anywhere in the turn, not just its first line** — a turn is a skill-body injection if `Base directory for this skill:` appears *anywhere* in it; drop the whole turn.
- **The authoritative completeness check is the human-eye skim, not the pattern list.** After filtering, read the surviving numbered list top to bottom and confirm every entry reads like something a person actually typed. Any block of `<...>` tags, any agent report, any run of skill instructions still present = a shape slipped through; add it to the blocklist and re-run. The count is only trustworthy once the list is human turns end to end.
- **A genuine human turn in this harness is a `string`-content `user` turn that does not begin with (or wholly consist of) a harness/skill marker.** When in doubt whether a turn is human, the tell is voice: a person's correction/question vs. structured instructions or a tagged report.

## Mode A — Output contract (user anchor)

A **complete numbered list of every genuine user message, in order from message 1** — an actual enumerated list, not a summary. RAW: the agent does not mark, rank, or judge which lines are signals — the caller does that inline. If the transcript is unavailable (glob empty and fallback ambiguous, or context was compacted with no file access), say so explicitly rather than silently scanning what's left in context.

⚠️ **The list is frozen at the moment the agent ran — it excludes every later message, including the invocation acting on it.** When surfacing it to the USER (not just consuming it internally), say "captured through message N" — else a partial list reads as a complete session record.

⚠️ **Mode A is a your-messages-only, unsummarized ANCHOR — that is the design, not a shortcoming.** Its value is being un-interpreted; a caller must not "improve" it into a narrative. When the caller needs all parties (assistant decisions, subagent findings), that is Mode B below — not a loosening of Mode A.

## Mode B — Full record (all parties, grounded)

The default for doc-update consumption (`update-claude-docs`, `task-summary`, `/done` Steps 3/4). Same Pass-1/Pass-2 file handling, but the record includes **three streams interleaved in chronological order**, each entry tagged by party:

| Party | jq source | What to extract |
|-------|-----------|-----------------|
| **User** | `type:user` string turns surviving Pass 2 (incl. the mid-turn `<system-reminder>` extraction) | The message, VERBATIM. Never reword. |
| **Assistant** | `type:assistant` turns — the text blocks, not just tool names | Each DECISION, fix, or commit the assistant made or stated (one compressed line each), citing what it did. Skip narration/thinking; keep outcomes. |
| **Subagent** | `<task-notification>` / agent-result turns (the ones Pass 2 drops for Mode A) | Each subagent's KEY findings/verdict (one line each), attributed to which agent. The report body is the source — cite it, don't invent. |

Output = a numbered, party-tagged timeline: `1. [user] "<verbatim>"` · `2. [assistant] committed X / decided Y` · `3. [subagent:code-reviewer] 0 findings, confirmed Z`. In order, not grouped by party — chronology is what memory loses.

⚠️ **Mode B is grounded, not summarized.** The same confabulation risk and its two guards (prompt forbids inventing; parent fact-checks against the real artifact) apply exactly as in "When the user wants a session SUMMARY" below — plus one guard unique to Mode B:
- **The CONSUMING skill MUST reconcile against it, not just read it.** Before finishing a doc update, the caller walks the Mode B record and asks *"did I capture every user correction, every decision, every subagent finding here — or did memory drop one?"* An absence cannot be eyeballed from context alone; the record is what makes the gap visible. Mode B that is produced but not cross-checked against memory has done nothing — this reconciliation is the whole point.

When the user wants a **readable session recap to learn from** (a different, human-facing deliverable), that's the SUMMARY job below — not Mode B.

## When the user wants a session SUMMARY (not the raw anchor)

A human asking "summarize what happened this session" is a different job from the raw anchor above. It may still use an `Explore` agent over `$TRANSCRIPT`, but:

⚠️ **A transcript-summary agent CONFABULATES specifics — filenames, enum values, exact findings — while sounding authoritative.** A fluent recap of a long transcript routinely invents a third of its concrete details (wrong path, invented review findings, non-existent enum members). Two mandatory guards:
- **The prompt must forbid inventing** and require grounding every concrete claim (file path, value, list of findings) in a transcript line, flagging anything uncertain rather than guessing.
- **The PARENT must fact-check the returned summary against real artifacts** (the diff, the task doc, the actual files) before relaying it, and correct the errors in its own voice. Never pass an agent's session summary to the user as authoritative without this pass — relay the corrected version, naming what was wrong.

## Delegation guardrails (shared with `explore-delegation.md`)

⚠️ **Spawning it? The `Agent` call goes in its own assistant message; `run_in_background: false` does NOT guarantee a blocking call.** Since Claude Code v2.1.198 [subagents run in the background by default](https://code.claude.com/docs/en/sub-agents); `false` is a hint Claude may honour "when it needs the result before continuing", and [#69691](https://github.com/anthropics/claude-code/issues/69691) reports it is ignored in top-level interactive sessions. Write the step so an async return is fine — results arrive as a `<task-notification>` and are never lost. **Never poll** (`sleep`/`ScheduleWakeup`/`TaskOutput`), and never Read an agent's `.output` file (it's the full subagent JSONL — it overflows context).

**Fallback:** no `Agent`-capable context? The parent runs the Pass-1 jq + Pass-2 strip directly in Bash against `$TRANSCRIPT` and walks the result itself.

## Spawn snippet

```
# Parent resolves the path first, then:

# Mode A — user anchor:
Agent({
  subagent_type: "Explore",
  prompt: `Read the session transcript at ${TRANSCRIPT}.
    Cross-check: the session-id in that filename must equal your own $CLAUDE_CODE_SESSION_ID — if not, STOP and report the mismatch.
    Run the Pass-1 jq filter and Pass-2 contaminant strip from _shared/references/transcript-scan.md.
    ⚠️ Extract mid-turn user messages folded into <system-reminder> blocks ("sent a new message while you were working") — these are the most-dropped and must appear as their own entries.
    Return a COMPLETE numbered list of every genuine user message, VERBATIM, in order from message 1. Do NOT rank, mark, judge, or reword — return raw.`
})

# Mode B — full record (default for doc-updates):
Agent({
  subagent_type: "Explore",
  prompt: `Read the session transcript at ${TRANSCRIPT}.
    Cross-check: the session-id in that filename must equal your own $CLAUDE_CODE_SESSION_ID — if not, STOP and report the mismatch.
    Follow Mode B in _shared/references/transcript-scan.md: produce a numbered, party-tagged, chronological timeline of ALL parties — [user] verbatim, [assistant] each decision/commit, [subagent:<name>] each key finding.
    ⚠️ Extract mid-turn user messages folded into <system-reminder> blocks. GROUND every concrete claim (path/value/decision/finding) in a transcript line — NEVER invent or paraphrase; flag anything uncertain. Do NOT rank which are signals — the caller does that.`
})
```
