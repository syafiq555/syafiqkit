# Verifying a Write Actually Landed

Referenced by skills whose steps must prove an edit reached disk (done's exit gate, update-claude-docs' Validate, two-tier-condense's Diff step). Distinct from `diff-ownership.md`, which decides *whose* a change is, not *whether* it exists.

**You're here because a write didn't appear where you expected it.** Start by asking whether git can even see the file at all.

## Can Git Answer At All?

Everything below assumes git is available. Two separate failure modes exist, and they need different probes because each answers a different question:

| Probe | Answers | Fails when |
|-------|---------|-----------|
| `git rev-parse --git-dir` | is there a repo? | never `git init`ed — a small tool, a scratch prototype, a vendored directory. Everything errors `fatal: not a git repository` |
| `git rev-parse HEAD` | is there a commit to diff against? | repo exists, no first commit yet. `--git-dir` and `git status` both succeed, so this state passes a repo check and *then* errors `fatal: ambiguous argument 'HEAD'` on every `git diff HEAD` |

The second is the one that catches readers off guard: a session that probed only for a repo proceeds believing git works, and hits the failure at the exit gate instead of during setup. Run both probes once per session and carry the answers forward; don't re-probe per file.

## When Git Cannot Answer

If either probe fails, every file is in the third row's state below, and these substitutions are the only verification available:

| Need | Substitute |
|------|-----------|
| Did this write land? | Re-read the file, or grep it for the text you wrote. No diff exists to consult |
| What changed this session? | Use mtime: `find . -newermt "<session start>" -type f -not -path './node_modules/*' -not -path './vendor/*'` |
| Whose change is this? | Sole by construction, *if* no peer session is on the tree — an assumption git would normally let you test and here you cannot. `ListAgents` is the only remaining check, and an empty listing isn't proof (see `cross-session-messaging.md`) |

⚠️ **Ownership caution gets stronger without git, not weaker.** The usual reassurance — a bad edit is recoverable — is gone: no stash, no `checkout --`, no reflog. Anything an agent overwrites or deletes is gone for good, so scope agent file-partitions tightly and prefer additive edits over rewrites.

## When Git Can Answer

**An empty `git diff` is inconclusive, never proof a write is missing.** Git has a limited perspective: it only sees tracked files and committed history. Three separate causes return empty diff with exit 0, and they need different fixes:

| Cause | Diagnose | Fix |
|-------|----------|-----|
| Target was staged (harness auto-stages) | `git diff --cached -- <path>` | Compare against `HEAD`, not the working tree |
| Pathspec resolved against CWD, not the repo root | run from repo toplevel | `git -C "$(git rev-parse --show-toplevel)" diff HEAD -- <repo-relative-path>` |
| **Target is untracked / gitignored** | `git ls-files --error-unmatch <path>` (errors → untracked) · `git check-ignore -v <path>` (prints rule) | Grep the file for the text you wrote — **no git command can see it, so grep is the only verification** |

The first two are recoverable with a different invocation. The third is permanent: git will never report an untracked file, so escalating to a better git command loops forever.

**The untracked case is common for local-scoped docs, not an edge case.** `CLAUDE.local.md` and `.claude-companions/local/*` are gitignored by convention and routine write targets. If you're about to report a local doc write as missing or re-run the writing skill on the strength of an empty diff, check whether git can see the target at all first.

**A `respectGitIgnore: false` setting governs Claude Code's search tools (Glob/Grep surfacing ignored files), not git's plumbing.** `git diff` still cannot show an untracked file, so don't conflate the two. The setting does make the file readable — which is why the grep confirmation works when a diff doesn't.

## Trust the Bytes, Not the Report

**An empty diff is authoritative once the three causes above are ruled out — it outranks a delegated agent's own closing report.** A subagent can return a detailed account of what it changed (sections moved, callouts merged, line-count delta) against a target that never left its pre-edit bytes. Nothing about the report's plausibility proves the edit occurred. Before trusting downstream verification (an identifier sweep, a fact-survival grep, a "confirmed intact" summary), check `git diff --stat`/`git status -s` on the target path itself — or its mtime for ungitted files. All downstream checks pass trivially on a file that was never touched.

**A non-empty diff proves bytes moved, never that *your* step produced it.** This file settles whether bytes moved; `diff-ownership.md` settles whose they are. A peer session running the same skill against the same work can produce a diff whose *content* corroborates yours perfectly, and reading that confirmation looks complete — but the step still needs running. The peer's judgment (which docs to capture, whether anything is worth writing) went unexamined. Before crediting a step, verify the diff's authorship: check mtimes against session start, or trace content to your own writes. Where authorship doesn't trace to you, the step still needs running, and the peer's diff is context to write alongside, not in place of.
