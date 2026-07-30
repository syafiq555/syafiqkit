# Verifying a Write Actually Landed

Referenced by skills whose steps must prove an edit reached disk (done's exit gate, update-claude-docs' Validate, two-tier-condense's Diff step). Distinct from `diff-ownership.md`, which decides *whose* a change is, not *whether* it exists.

**Rule:** an empty `git diff` is inconclusive about a write, never proof it is missing. Three separate causes return empty with exit 0, and they need different fixes:

| Cause | Settle it with | Fix |
|-------|----------------|-----|
| Target was staged (harness auto-stages) | `git diff --cached -- <path>` | Compare against `HEAD`, not the unstaged plane |
| Pathspec resolved against CWD, not the repo root | run from the toplevel | `git -C "$(git rev-parse --show-toplevel)" diff HEAD -- <repo-relative-path>` |
| **Target is untracked / gitignored** | `git ls-files --error-unmatch <path>` (errors → untracked) · `git check-ignore -v <path>` (prints the ignoring rule) | **No git invocation can ever show it** — grep the file for the text you wrote. This is the only verification, not a fallback |

The first two are incidental: a different invocation fixes them. The third is permanent, so escalating to a better git command loops forever on a file git will never report.

⚠️ **A gitignored target is the COMMON case for local-scoped docs, not an edge one** — `CLAUDE.local.md` and `.claude-companions/local/*` are gitignored by convention in every project set up this way, and both are routine write targets. **Tell: you are about to report a doc write as missing, or re-run the writing skill, on the strength of an empty diff.**

⚠️ **A `respectGitIgnore: false` setting does NOT change any of this.** That governs Claude Code's own search/discovery tools (Glob/Grep surfacing ignored files); it has no effect on git's plumbing, so `git diff` still cannot show an untracked file. Conflating the two is the likely mistake, because the setting genuinely does make the file readable — which is why the grep confirmation works.
