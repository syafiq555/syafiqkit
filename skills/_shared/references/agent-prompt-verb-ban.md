# Banning repo-wide verbs in a spawned agent's prompt

Every agent this plugin spawns holds `Bash`, including the ones whose role reads as read-only — `Explore` carries `Bash Write Edit`, `claude-md-pruner` carries `Bash Edit`, and the reviewers carry `Bash`. Verify with:

```bash
awk '/^tools:/{f=1;next} f&&/^[a-z]/{exit} f&&/^  - /{printf "%s ", $2}' .claude/agents/<name>.md
```

So name these as off-limits in the prompt of any agent you dispatch:

```
stash · checkout -- . · reset · clean · restore · commit · push
```

The first five are repo-wide and destroy uncommitted work that no partition protects — a file slice scopes what an agent *reads*, never what a `git` command it runs *touches*. The last two are outside any review or doc agent's mandate and rewrite shared state.

A one-agent dispatch is not safer than a fan-out; the exposure is per-agent, not per-batch. An agent that runs one of these leaves every other check green, because the work it destroyed is exactly the work nothing else was tracking.

This is a **delegation** rule — what you put in a prompt. The superficially similar rule in `diff-ownership.md` and `contested-doc-sections.md` is self-directed (don't run these yourself to clear contested work); both can apply at once and neither implies the other.
