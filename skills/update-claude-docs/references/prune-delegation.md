# Delegating a CLAUDE.md Prune

Read at Step 4 of `update-claude-docs`, once you've decided a prune should happen. Holds the spawn decision table, the agent prompt, and the mid-session timing rule.


After Steps 1–3, check whether the project has a `claude-md-pruner` agent of its own and delegate to it if so.

Measure the pruning floor before consulting the table, since the gate's decision depends on data only you can compute at this step: the file's current line count and this session's net delta to it. (See `../../_shared/references/verifying-a-write-landed.md` for how to measure both — the reference owns the procedure since it varies by VCS and project setup.) If you defer this to Step 5, a floor you never measured defaults to "not under the floor," and the gate spawns the pruner on a stale premise.

Ownership needs the same treatment at the same moment. The preamble's check ran once, at write-time in Steps 1–3, and a finding computed three steps upstream is not state this table consults — nor is it necessarily still true, since a peer can start editing mid-run. Re-run the diff-content check (`../../_shared/references/diff-ownership.md`) against the file you are about to hand the pruner.

| Agent found? | Action |
|-------------|--------|
| Yes, but the file is **contested** (re-checked here, not carried from Steps 1–3) | **Skip the spawn** — pruning is a restructure, which the preamble already forbids on a contested file. Report the size against budget, and land the deferral somewhere durable per `diff-ownership.md`'s contested-file table rather than only in this transcript |
| Yes, no pruning decision declared, not contested, and the file is not under the floor | Launch `subagent_type: "claude-md-pruner"` with file paths to scan |
| Yes, but pruning/splitting is recorded as **decided**, OR the file is under the floor | **Skip the spawn** — report current size against the file's own budget instead |
| No | Skip pruning — do not inline a pruning prompt |

Detection rules for both size-based skip cases: `../../_shared/references/declared-budget.md`; for the contested case, `../../_shared/references/diff-ownership.md`. A spawn against any of them can only return a no-op at best, and against a contested file it destroys a peer's uncommitted work.

**Agent prompt**: `Prune these CLAUDE.md files: [list paths]. Run in background.` — plus the sections you wrote in Steps 1–3, named explicitly, since the agent re-checks ownership itself and your uncommitted writes are what it will find. Without that list it cannot tell your edits from a third session's and must either refuse a legitimate dispatch or prune a peer's work. Plus the repo-wide verb ban, written into the prompt verbatim: `stash · checkout -- . · reset · clean · restore · commit · push`. This agent holds `Bash` and `Edit`, so a file slice scopes what it *reads* and never what a `git` command it runs *touches*. 📖 `../../_shared/references/agent-prompt-verb-ban.md` for why each verb is on the list and how to check any agent's real tool grants.

The agent owns its own classification rules, litmus tests, and never-delete safeguards — delegate to it, don't second-guess its instructions from here.

Background-prune only files that are finished being edited this session. The pruner reads the file when it starts, not when it finishes, so an entry you add mid-edit can get deleted on a premise your later edits invalidated. Finish all edits before naming a file for pruning, or hold the pruning pass until your own changes are done.

