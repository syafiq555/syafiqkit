# Ownership and Partition Logic

Before running any agents, establish which files belong to this session by **diff content**, not by git status plane. When work is genuinely yours, partition every agent to your files only and name contested paths off-limits.

## Detecting Ownership

A clean "no" (files aren't yours) is straightforward. What's missed is "partly": a background agent still running from the prior step, git status showing files never touched (parallel session), a tree that already carried work before this session, or two sessions editing the same file so the content is mixed. The harness auto-stages your own writes like a peer's, so an untracked file has no `git diff HEAD`, and after a compaction "files I remember editing" is the summary's list, not the tree's.

**How to settle it:** Read `${CLAUDE_SKILL_DIR}/../_shared/references/diff-ownership.md` for the full logic and edge cases. The short version: compare file modification times against your session start for any file on the boundary, then `git diff HEAD -- <file>` on anything you don't remember editing, since a foreign edit is recognisable on sight.

⚠️ **Classifying by FILENAME rather than by diff content inverts the answer on exactly the work most likely to need partitioning.** Grepping the changed-file list for your feature's vocabulary is fast and reads as content-aware, but it is wrong whenever your session touched files that predate the feature — a permission tier threaded through nine existing policies, a rename propagated across callers, a signature change rippling outward. Those filenames carry no trace of what you built, so they land in the "peer" bucket while the peer's genuinely unrelated files sit unnoticed among them, and the output looks plausible either way: a tidy split with a believable count. Measured 2026-09-22: a filename grep filed ~20 of the session's own policy and controller edits as another session's, caught only because the list was eyeballed and recognised. The instruments above answer a question about a file's **history** (when it changed, what the change looks like); a filename answers a question about its **subject**, which is a different question. **Tell: you are deciding ownership from a pattern matched against paths rather than against `git diff` output or mtimes.**

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

## Edits Against a Partitioned File

Measured 2026-09-15: a restored figure landed beside a paragraph the simplifier had refolded, and only the harness's "modified on disk" notice showed it, after the write. Your own edits count as well: a partition reads as a rule about *them*, but an `Edit` against remembered text still applies cleanly to a string that survived a rewrite while its paragraph moved. Hold your edits to a granted file until the agent returns, or re-read before each one. Two writers on one file race even when reads overlap freely: the post-fan-out re-read cannot see transient diagnostics, so a shared write list is the failure, not a shared read list.

**Mismatch between role and subagent_type goes undetected** — match the prompt's content to the subagent_type you're calling.

## Ownership Incidents

- 09/11/2026: a simplifier rewrote two untracked files a peer had restructured that morning. A summary's file list is a claim about the past, not ownership now.
- 12/11/2026: a file this session had handed to a peer ("it's free now") still sat in the session's commit list, so it slipped into a partition and an agent edited the peer's work (a one-line revert). Strike released files before partitioning.
- 12/11/2026: two CRP45 files rode into a marketplace commit because the commit list came from `git status` minus the folders the session took to be a peer's. An exclusion filter passes every peer file it did not anticipate, so build the list from the paths you wrote.

## Partition Paths on a Shared Tree

A partition listing paths reads as advisory once an agent notices a sibling file, so name the other repo's paths as out of bounds in the brief, not only in the partition.
