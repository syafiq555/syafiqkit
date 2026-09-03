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
- **Then read the commit back — `git show --name-only --format="" HEAD` — because a pre-commit hook can widen it after your last look at the staged set.** A reformatting hook (lint-staged and friends) stashes the whole tree, runs, and restores into the commit, so a correct pathspec and a clean staged column both hold right up until the commit exists. On a shared tree the file it sweeps in is the other session's half-finished work, committed under your message and looking deliberate in `git log`. `/commit` Step 3 owns the check and the recovery; what this context adds is that the cost lands on someone else's work, so the read-back matters most exactly where the tree is contested

## Protecting the Tree

Ban these verbs in every agent prompt: `stash`, `checkout -- .`, `reset`, `clean`, `restore`, `commit`, `push`. A review agent with edit tools runs any of them, and the first five destroy unrecoverable work.

A file partition doesn't scope repo-wide commands — the protection is the verb ban in the prompt itself.

## After Partition Decision

Once the partition is decided, move to Emission shape and emit every agent from the partition in a single message.

**Mismatch between role and subagent_type goes undetected** — match the prompt's content to the subagent_type you're calling.
