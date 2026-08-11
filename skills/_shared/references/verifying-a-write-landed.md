# Verifying a Write Actually Landed

Referenced by skills whose steps must prove an edit reached disk (done's exit gate, update-claude-docs' Validate, two-tier-condense's Diff step). Distinct from `diff-ownership.md`, which decides *whose* a change is, not *whether* it exists.

**First, can git answer at all?** Everything below assumes it can. Two states break that, and they need separate probes because each command answers a different question:

| Probe | Answers | Fails when |
|-------|---------|-----------|
| `git rev-parse --git-dir` | is there a repo? | never `git init`ed — a small tool, a scratch prototype, a vendored directory. Everything errors `fatal: not a git repository` |
| `git rev-parse HEAD` | is there a commit to diff against? | repo exists, no first commit yet. `--git-dir` and `git status` both succeed, so this state passes a repo check and *then* errors `fatal: ambiguous argument 'HEAD'` on every `git diff HEAD` |

The second is the one that bites, because it looks handled: a session that probed only for a repo proceeds believing git works, and hits the failure at the Exit gate instead of at mode selection. Settle both once per session and carry the answers; don't re-probe per file.

Either way every file is permanently in the third row's state below, so these substitutions are the whole verification rather than a fallback:

| Need | Substitute |
|------|-----------|
| Did this write land? | Re-read the file, or grep it for the text you wrote. There is no diff to consult |
| What changed this session? | mtime against session start — `find . -newermt "<session start>" -type f -not -path './node_modules/*' -not -path './vendor/*'` |
| Whose change is this? | Sole by construction, *if* no peer session is on the tree — an assumption git would normally let you test and here you cannot. `ListAgents` is the only remaining check, and an empty listing isn't proof (see `cross-session-messaging.md`) |

⚠️ **Ownership caution gets stronger without git, not weaker.** The usual reassurance — a bad edit is recoverable — is gone: no stash, no `checkout --`, no reflog. Anything an agent overwrites or deletes is gone for good, so scope agent file-partitions tightly and prefer additive edits over rewrites.

**Rule:** an empty `git diff` is inconclusive about a write, never proof it is missing. Three separate causes return empty with exit 0, and they need different fixes:

| Cause | Settle it with | Fix |
|-------|----------------|-----|
| Target was staged (harness auto-stages) | `git diff --cached -- <path>` | Compare against `HEAD`, not the unstaged plane |
| Pathspec resolved against CWD, not the repo root | run from the toplevel | `git -C "$(git rev-parse --show-toplevel)" diff HEAD -- <repo-relative-path>` |
| **Target is untracked / gitignored** | `git ls-files --error-unmatch <path>` (errors → untracked) · `git check-ignore -v <path>` (prints the ignoring rule) | **No git invocation can ever show it** — grep the file for the text you wrote. This is the only verification, not a fallback |

The first two are incidental: a different invocation fixes them. The third is permanent, so escalating to a better git command loops forever on a file git will never report.

⚠️ **A gitignored target is the COMMON case for local-scoped docs, not an edge one** — `CLAUDE.local.md` and `.claude-companions/local/*` are gitignored by convention in every project set up this way, and both are routine write targets. **Tell: you are about to report a doc write as missing, or re-run the writing skill, on the strength of an empty diff.**

⚠️ **A `respectGitIgnore: false` setting does NOT change any of this.** That governs Claude Code's own search/discovery tools (Glob/Grep surfacing ignored files); it has no effect on git's plumbing, so `git diff` still cannot show an untracked file. Conflating the two is the likely mistake, because the setting genuinely does make the file readable — which is why the grep confirmation works.

**The mirror direction: once the three causes above are ruled out, an empty diff is authoritative, and it outranks a delegated agent's own closing report.** A subagent dispatched to edit a file can return a detailed, specific-sounding account of what it changed — sections moved, callouts merged, a line-count delta — against a target that never left its pre-edit bytes; nothing about the report's plausibility or specificity is evidence the edit occurred. This surfaces anywhere a skill delegates an edit and then asks the delegate (or a later step) to confirm it landed: check `git diff --stat`/`git status -s` on the *target path itself* (or its mtime against session start, for an ungitted file) before trusting any downstream verification — an identifier sweep, a fact-survival grep, a "confirmed intact" summary — since all of those pass trivially on a file that was never touched. **Tell: you're about to accept a subagent's own account of what it edited without independently confirming the target's bytes moved.**
