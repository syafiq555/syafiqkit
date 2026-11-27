<!--LLM-CONTEXT
Status: ✅ built and shipped to master 2026-10-16; two unmeasured checks and the deferred ideas remain (see Open)
Domain: plugin-maintenance/mod (enhance)
Gotchas (critical):
  - `prompt.submit` also fires for the mod's own prompts, which once cancelled a run mid-way (fixed 1.405.1; see Measured)
  - Whether the host fires `prompt.edit` for the mod's own fill, which decides if Undo survives, is unmeasured (see Open)
  - `claude -p` replays load the repo's CLAUDE.md, so a fact can come from there rather than the docs passed in (see Measured)
Related: `../current.md` (index)
Last updated: 2026-11-27
-->

# The Mod: Enhance button

Theme file for row 29 of `../current.md`. Built 2026-10-16 across 1.400.0 to 1.405.1 (one consolidated CHANGELOG entry, 1.405.2, shipped to master 2026-10-16 in 1.405.3).

## What it is {#what}

`Enhance` (`e`) on the band. It reads the prompt box, runs a headless `claude -p --model haiku --permission-mode auto --disallowedTools Edit,Write,NotebookEdit --output-format stream-json --verbose --resume <session id> --fork-session --no-session-persistence` in the session folder that executes the real `/syafiqkit:read-summary` with the whole conversation in view (1.490.0; without a session id, or after a failed forked run, the same run without the fork flags), then replaces the box with: the ask in plain words, `Context from <docs>:` with 3 to 6 facts, `Use /<skill>: why` lines, Scope / Out of scope / Check against / Done when, and up to 3 `[bracketed]` open choices. Nothing is sent. Undo restores the original while the box still holds the filled text. If the headless run cannot start or fails, a quick path runs: one `$.model.complete` haiku call over a catalogue (one line per task doc: path, title, status, "Where we are") plus the skill list, then a second call that digests the picked docs and their `decisions/` files. The done row then reads `quick read · …`.

## Why it exists {#why}

The user's friend showed a mod with `[Enhance] [Send]` above the prompt. The user's idea: let haiku do the read-summary work in the background before the prompt goes, so the main agent starts informed without typing `/read-summary`.

## Evidence used {#evidence}

Researched 2026-10-16 with haiku agents; key sources opened and quoted.

| Source | What it showed |
|---|---|
| Augment (docs.augmentcode.com/cli/interactive/prompt-enhancer) | ✨ button / Ctrl+P rewrites the draft in place, adds file references from the codebase index, Esc cancels and restores |
| Kiro (kiro.dev/docs/crew/chat/prompt-optimizer/) | ✨ / Cmd+Shift+Enter, "Optimizing prompt…" overlay, no auto-send, silent restore on error or unchanged, 30 s timeout, 2 to 5 s typical; rules "Never change your intent", cap `min(3 × original length, 250 words)` |
| Kilo Code PR #6527 | ✨ replaces in place, Ctrl+Z restores; its review found undo restoring stale text after the draft changed another way |
| v0 (github.com/vercel/v0-sdk/issues/7, 2026-04-29) | "we no longer support prompt enhancement on v0.app" |
| Bolt users, Taku, Prompt Architects | Main complaint: enhancers invent requirements and bloat; useful on a vague first prompt, waste on a one-line change |
| ShapeofAI prompt-enhancer pattern | Keep intent, highlight material expansions, "Keep the raw prompt accessible" |
| memhook (Claude Code hook) | Haiku picks 0 to 5 memory files from a catalogue; closest prior art for doc picking |

Agreed rules across sources: never auto-send; original one press away; fail open but say so; skip near-empty prompts and slash commands.

## Study of the user's own prompts {#prompt-study}

3,908 typed prompts extracted from `~/.claude/projects/*/*.jsonl` (all projects, 2026-09-15 to 2026-10-16), split into 10 session-bounded parts, each read by a haiku agent with the same six questions; sampled quotes verified against the parts.

| Finding | Example (quoted) | What the rewrite does |
|---|---|---|
| Commonest correction: the owning skill was not used | "u didnt use the uiux skill for research ?"; "isnt the skill got say about this ?" (gchat em dashes); task-summary writing to `docs/` | Names 0 to 3 skills that exist |
| Vague scope | "i meant all"; "why only current.md ? this is supposed to be the whole set" | Scope line in the draft's own terms |
| No source to check against | "read the pdf"; "check againts curlec real"; "use exa i think" | Check against, only when the draft points at one |
| No proof | "i dont see the proof ?"; "show me the e2e" | Done when |
| Doing more than asked | "i told u u dont design them"; "no need the wave, the blocker, any kiv" | Never adds features, plans, waves or design |
| Too many questions, and too few | "why u keep asking"; "use ask question tool" | At most 3 bracketed choices; most prompts get none |
| A pasted live API key in one prompt | (not quoted) | Never copies a secret into goal or facts |
| First-time successes named a skill, an exact target and an end state | "/syafiqkit:ship all unpushed changes" | The shape the rewrite aims for |

Language: mostly lowercase typo'd English ("u", "ure", "ya"); Malay rare; misreads came from ambiguous intent, never spelling.

## Key Technical Decisions {#decisions}

| Date | Decision |
|---|---|
| 2026-10-16 | Full rewrite (goal, skills, scope, questions), not only a doc pointer; asked to study past sessions with 10 haikus first |
| 2026-10-16 | The rewriter runs the real read-summary skill "like the main agent does", not an imitation (replaced the two-call version as the primary path, which stays as the fallback) |
| 2026-10-16 | Show what the haiku run is doing live, not static text |
| 2026-10-16 | Tool reach: chose "Everything", then "maybe auto mode better" → `--permission-mode auto`. Edit, Write and NotebookEdit disallowed after review (read-summary never needs them); Bash and Explore agents stay |
| 2026-10-16 | Short prompts such as `what to do now ?` must work (minimum lowered from 20 to 8 characters) |
| 2026-10-16 | A run must not stop when another message arrives (only sending the draft itself ends it) |
| 2026-11-27 | The child forks the live session (`--resume <id> --fork-session --no-session-persistence`), still on haiku. Syafiq picked the whole fork over handing the run the last turns of the transcript: "as long as we use haiku still fine". Why: a fresh child never saw the conversation, so a draft pointing back at it ("the one above", "mine", "week 2") came out generic. A failed forked run is retried without the fork, then the quick read |
| 2026-11-27 | After the score loop (rounds 1 to 4 below), Syafiq kept **haiku** over Sonnet (Sonnet passed 14 of 15 quality checks against haiku's 11, at about five times the cost and twice the time) and dropped the round 3 "say what the draft answers" rule, which narrowed "check latest reply" to one topic. Kept: reword not summarise, hedges kept, ambiguous pronouns asked, no comment in the goal, news drafts get the action as an open choice, facts only repeat what is written |
| 2026-11-27 | The forked run is read-only (1.492.0): `dontAsk` with a read-only `--allowedTools` list instead of auto mode. Why: a peer session's code review found the fork sees the whole history, so a half-finished commit, push or migration there could be continued in the user's folder, with only a prompt line against it. Also from that review: one shared 180 s deadline for both attempts, and a failed fork is not retried for the rest of the session. A `dontAsk` fork run by hand on 27/11 still ran read-summary (6 turns) and gave a good rewrite |
| 2026-11-27 | A second peer review, measured in a scratch repo, found `Bash(git branch *)` could create a branch and git `--output` could write a file, and that allowing `Skill` let any skill load (scoping it to `Skill(syafiqkit:read-summary)` did not stop `syafiqkit:commit`). Now: no `git branch`, `--output` denied, `Skill` and `Agent` denied, and the fork Reads the read-summary `SKILL.md` path from `findSkills`. Only a hard failure (error result or crash) marks the fork failed for the session; an unreadable reply retries without the mark. Live on the three score-loop drafts: US$0.12 to 0.24, 16 to 22 s, and the 2C2P draft now asks which party "they" is |
| 2026-11-27 | `/done` review (1.493.0): a passing error (overload, network) no longer switches the fork off for the session, only a lasting one (`isLastingForkFailure`); the retry is skipped once the shared deadline has passed; facts from the chat are credited `Context from this chat`, and the done-row chip reads `read this chat` (the product reviewer found `this session` read like a doc name); a draft that names its own subject keeps the session to that subject. A redirect, pipe, `;` or `$(...)` on an allowed Bash prefix was probed in a scratch repo and denied |

## Measured facts {#measured}

| Fact | Measured |
|---|---|
| Headless run with the real skill on this repo: 66 s, US$0.07, found `live-checks.md` item 000 and `state.js:99` | 2026-10-16 by hand, before stream mode |
| `--disallowedTools` holds in the child's sub-agents: "Bash is disabled for this session, in subagents as well as here." | stream-json transcript, 2026-10-16 |
| `--permission-mode auto` works under `-p`; `git status` ran | 2026-10-16 |
| stream-json `--verbose`: `assistant` events carry `tool_use` blocks (`Skill` input `{skill: "syafiqkit:read-summary"}`), sub-agent events carry `parent_tool_use_id`; two `result` events can appear (keep the last) | 2026-10-16 |
| A `claude -p` replay run inside this repo loads its CLAUDE.md, so a fact can come from there rather than the docs passed in; `$.model.complete` loads none | 2026-10-16 |
| `/reload-plugins` reporting "re-read from its folder" swapped the mod on every rebuild this session | 2026-10-16, see hooks/CLAUDE.md § The Mod |
| `prompt.submit` fires for plugin-submitted prompts (the mod's own Done message) too; an Enhance that cancelled on any submit stopped mid-run | user report 2026-10-16, fixed 1.405.1 |
| Quick-path catalogue for autorentic: 106 task docs, about 24 KB as one line each; an earlier 12 KB cap had hidden about 60 of them | 2026-10-16 |
| `claude -p --model haiku --resume <live id> --fork-session --no-session-persistence` on a running session: 7 s, 211k input tokens written to cache, US$0.21; the child quoted the session's first and latest user messages and saw a file the session had read; the live transcript stayed the newest file and no new one appeared | by hand in autorentic, 2026-11-27 |
| A forked run's `total_cost_usd` and `modelUsage` include the parent session's saved `cost-state` (a fork of a 2.06-dollar Opus session reported US$2.29 for a one-word "OK" reply). The press itself cost US$0.06 to 0.27 on haiku; subtract the parent's `totalCostUSD` before judging cost | by hand, 2026-11-27 |
| On a session that had just discussed the same draft, the fork copied the reply it saw in the transcript (1 turn, no read-summary). On the TikTok parent session the same draft got a point-by-point rewording, 5 session facts and one open question naming both threads | 2026-11-27, after the goal-reword rule |

## Score loop: session fork (1.490.0) {#score-loop-fork}

Frozen 2026-11-27 before round 1. **Stop rule (Syafiq):** every check passes on all 3 drafts, or 3 rounds of fixes, whichever first.

**Harness.** Each case is a real `/read-summary` draft typed mid-session, with its session cut just before that prompt: the transcript lines before it are copied into a new session file, which the run forks (`--resume <copy> --fork-session --no-session-persistence`), so the answer that followed is not in view. The prompt is built from the current `enhance.js` (`headlessPromptOf(draft, true)`). Cases: (A) autorentic `a448326f` line 139, "for our daily standup today, then mine one i think is focussing on week 2"; (B) beacon-mart `7464b657` line 470, "properly yesterday 2c2p said they don't hv direct selling license"; (C) beacon-mart `19ffc019` line 680, "check latest reply".

**Checks, yes/no per draft (6 × 3 = 18):**
1. Reword: the goal keeps every point the draft makes, in its order, as whole sentences; nothing dropped or replaced by a summary. Fail: "Research first with haiku" for a two-clause draft.
2. Subject: what the draft acts on ("mine one", "latest reply", "this") is named from the session, or, when the session has more than one candidate, asked as one open choice naming them.
3. Facts: every fact is stated in the cut transcript or a repo doc (the judge checks each), and bears on the ask.
4. No repeat: no `Use /skill` line for a skill the draft already names.
5. Open placement: bracketed choices appear only in `open`, not in goal or scope.
6. Cost: the run's `total_cost_usd` minus the cut session's carried `cost-state` is US$0.50 or less.

**Conventions (not defects).** An empty optional field (scope, checkAgainst, doneWhen) is fine when the draft implies none. Skills picked beyond the draft's own are judged only for check 4. A fact that is true but comes from CLAUDE.md rather than a task doc counts as real. "Cannot assess" scores the check as a fail and is named.

| Round | Score | Judge |
|---|---|---|
| 1 | 16/18 (A 6, B 5, C 5). B check 1: a news draft got an invented "record it in the doc" task and "confirmed missing", which no doc says. C check 3: a fact claimed a thread-level read that was a space read, phrased as advice. Fixed: news drafts keep the news and put the action in open; facts only repeat what is written, never advice or conclusions | fresh (sonnet) |
| 2 | 16/18, no change (A 6, B 4, C 6). B: the hedge "properly" (probably) dropped, "they" resolved to the wrong party, a comment ("this is news only") added to the goal, and the link to the user's previous question (did 2C2P run the audit) missed. Fixed: keep hedges, keep an ambiguous pronoun and ask, no comment in the goal, read the draft as the user's next turn | fresh (sonnet) |
| 3 | 14/18, cap reached (A 6, B 4, C 4). B: the hedge returned, but a comment ("stated as news for the record") stayed in the goal, "they" was left reading as 2C2P, and the audit question it answered was still missed. C regressed: the goal narrowed "check latest reply" to one topic (likely the new "say what it answers" rule), and a fact credited build-cards.md with a line from the session's own closing remark. Loop stopped at the user's 3-round cap; remaining gaps go to the user | fresh (sonnet) |
| 4 (extra, user's pick) | 14/18 with the child on **Sonnet**, same prompt (A 4, B 5, C 5). Content checks 14 of 15 against haiku's 11 of 15 in round 3: B's hedge, "they" = Radiant Code and no comment all held, C kept the ask unnarrowed. Cost failed on all three: US$0.86 to 1.12 a press, 40 to 53 s (haiku US$0.10 to 0.24, about 20 s). A's one fact miss: a `ListAgents` peer-session fact the judge could not find in the cut transcript | fresh (sonnet) |

## Open {#open}

- Cancel and the 3-minute stop race each pull against a 300 ms watcher and then call `child.return()`; whether that kills a silent child on the host is unverified (`ps` after Cancel during a long sub-agent step).
- Whether the host emits `prompt.edit` for the mod's own `$.prompt.fill` (would drop Undo at once) is unverified; the kit never fires it.
- Syafiq pressed the forked run live from the band on 27/11 (two presses, 11:42 and 11:44, both `this session`), which led to the reword rules. Still unmeasured: what haiku does when a session is larger than its context (the fallback is tested only in the kit), and the cost on 400k to 1M token sessions.
- Product review 27/11 asked for a per-press cost on the done row, a spend cap, or an Enhance-only off switch for the session read (each press sends the whole conversation to a second model call). Syafiq chose to leave it as is (27/11); revisit if press costs on long sessions turn out higher than US$0.27.
- Product reviewer's deferred ideas: a per-press outcome line in `mod.log` (kept, edited, undone, cancelled; path; seconds), an Enhance-only off switch, a spend cap if `claude -p` offers one, a re-measured cost on a large repo.
