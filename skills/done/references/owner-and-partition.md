# Ownership and Partition Logic

Before running any agents, establish which files belong to this session by **diff content**, not by git status plane. When work is genuinely yours, partition every agent to your files only and name contested paths off-limits.

## Detecting Ownership

A clean "no" (files aren't yours) is straightforward. What's missed is "partly" — a background agent still running from the prior step, git status showing files never touched (parallel session), a tree that already carried work before this session, or two sessions editing the same file so the content is mixed.

**How to settle it:** Read `${CLAUDE_SKILL_DIR}/../_shared/references/diff-ownership.md` for the full logic and edge cases. The short version: compare file modification times against your session start for any file on the boundary, then `git diff HEAD -- <file>` on anything you don't remember editing, since a foreign edit is recognisable on sight.

## When You Don't Own the Whole Diff

- Scope every agent to **your** files only and name contested paths off-limits
- A reviewer handed another session's uncommitted file will "fix" it — guard against that
- For skills in Steps 3-4, pass a scoped read-only verification arg instead of invoking bare
- On commit, use an explicit pathspec when the split is file-level; when the same file carries both sessions' work, stop and let the user decide

## Protecting the Tree

Ban these verbs in every agent prompt: `stash`, `checkout -- .`, `reset`, `clean`, `restore`, `commit`, `push`. A review agent with edit tools runs any of them, and the first five destroy unrecoverable work.

A file partition doesn't scope repo-wide commands — the protection is the verb ban in the prompt itself.

## After Partition Decision

Once the partition is decided, move to Emission shape and emit every agent from the partition in a single message.

**Mismatch between role and subagent_type goes undetected** — match the prompt's content to the subagent_type you're calling.
