# Enhance button: evidence, decisions and measurements

Theme file for row 29 of `../current.md`. Built 2026-10-16 across 1.400.0 to 1.405.1 (one consolidated CHANGELOG entry, 1.405.1, unshipped).

## What it is {#what}

`Enhance` (`e`) on the band. It reads the prompt box, runs a headless `claude -p --model haiku --permission-mode auto --disallowedTools Edit,Write,NotebookEdit --output-format stream-json --verbose` in the session folder that executes the real `/syafiqkit:read-summary`, then replaces the box with: the ask in plain words, `Context from <docs>:` with 3 to 6 facts, `Use /<skill>: why` lines, Scope / Out of scope / Check against / Done when, and up to 3 `[bracketed]` open choices. Nothing is sent. Undo restores the original while the box still holds the filled text. If the headless run cannot start or fails, a quick path runs: one `$.model.complete` haiku call over a catalogue (one line per task doc: path, title, status, "Where we are") plus the skill list, then a second call that digests the picked docs and their `decisions/` files. The done row then reads `quick read · …`.

## Why it exists {#why}

The user's friend showed a mod with `[Enhance] [Send]` above the prompt. The user's idea: let haiku do the read-summary work in the background before the prompt goes, so the main agent starts informed without typing `/read-summary`.

## Evidence used {#evidence}

Researched 2026-10-16 with haiku agents; the key sources were opened and quoted.

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

## User decisions {#decisions}

| Date | Decision |
|---|---|
| 2026-10-16 | Full rewrite (goal, skills, scope, questions), not only a doc pointer; asked to study past sessions with 10 haikus first |
| 2026-10-16 | The rewriter must run the real read-summary skill "like the main agent does", not an imitation (replaced the two-call version, which stays as the fallback) |
| 2026-10-16 | Show what the haiku run is doing live, not static text |
| 2026-10-16 | Tool reach: chose "Everything", then "maybe auto mode better" → `--permission-mode auto`. After review, Edit/Write/NotebookEdit are disallowed (read-summary never needs them); Bash and Explore agents stay |
| 2026-10-16 | Short prompts such as `what to do now ?` must work (minimum lowered from 20 to 8 characters) |
| 2026-10-16 | A run must not stop when another message arrives (only sending the draft itself ends it) |

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

## Open {#open}

- Cancel and the 3-minute stop race each pull against a 300 ms watcher and then call `child.return()`; whether that kills a silent child on the host is unverified (`ps` after Cancel during a long sub-agent step).
- Whether the host emits `prompt.edit` for the mod's own `$.prompt.fill` (would drop Undo at once) is unverified; the kit never fires it.
- Product reviewer's deferred ideas: a per-press outcome line in `mod.log` (kept, edited, undone, cancelled; path; seconds), an Enhance-only off switch, a spend cap if `claude -p` offers one, a re-measured cost on a large repo.
