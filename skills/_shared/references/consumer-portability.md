# Consumer Portability — What a Skill May Assume About Where It Runs

Cold path. Read before writing a skill step that names a path, probes the plugin's identity, or embeds a shell command a consumer will run.

The plugin's author works in a git checkout on macOS. Most people running these skills do neither. Every assumption below has already produced a defect.

## Paths: the plugin's own tree is unreachable from an install

| Assumption | Reality |
|---|---|
| "The whole repo ships" | **`tasks/` does not ship.** Verify by listing an install, never by reading `marketplace.json`'s `source` field |
| `~/.claude/plugins/<name>/` | Installs are **version-scoped**: `plugins/cache/<marketplace>/<plugin>/<version>/`. Any literal path is stale on the user's next update |
| `~` resolves | Not on native Windows (`%USERPROFILE%`). A `~/.claude` shared with WSL stores paths broken on the other side ([#36575](https://github.com/anthropics/claude-code/issues/36575), closed as not-planned) |

**`${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_SKILL_DIR}` now DO expand in skill markdown**, which reverses what this file said until 2026-08-20. [#9354](https://github.com/anthropics/claude-code/issues/9354) was closed as completed on 2026-08-17, and a probe skill confirmed it directly: both resolved to real absolute paths in a rendered SKILL.md body. They also expand in `allowed-tools` Bash rules, so a skill can invoke a bundled script without a permission prompt.

That gives a skill a portable, unambiguous way to name **its own bundled files** — `${CLAUDE_SKILL_DIR}/references/foo.md` is correct on any machine, at any install version, and needs no guess about the working directory. Prefer it over a relative path for any pointer a reader must actually open, since a relative path silently depends on where the session happens to be.

It does not reach anything that was never shipped. `tasks/` is still absent from an install, so a variable in front of that path resolves to a directory that isn't there — the failure just moves from ambiguous to definite. For non-shipped content, state the step as source-checkout-only, or route the write through the skill owning the ownership gate (`update-plugin`). A read-target degrades quietly; a **write**-target has no safe default, so the session stops and asks the user mid-skill.

⚠️ Anything asserting these variables don't work in markdown is pre-2026-08-17 and wrong. The reverse belief is expensive: it argues against the one mechanism that makes a bundled pointer reliable.

## Identity: ask the plugin dir, anchored against walk-up

⚠️ **`git -C <dir>` walks UP to an enclosing repo.** Pointed at a plugin dir under a dotfiles-managed `~/.claude`, it answers about *that* repo and reports a confident, wrong remote — succeeding rather than erroring. Fix: require the resolved toplevel to EQUAL the probed dir. Never substitute the CWD — that's the calling project, and it answers CONSUMER for the owner.

```bash
D=<plugin-dir>
[ "$(git -C "$D" rev-parse --show-toplevel 2>/dev/null)" = "$(cd "$D" && pwd -P)" ] \
  && git -C "$D" remote get-url origin 2>/dev/null | grep -q '<owner>/<repo>' && echo OWNER || echo CONSUMER
```

Negative control before trusting it: a subdir of an enclosing repo whose remote matches must still print `CONSUMER`.

## Shell: POSIX is an assumption, not a guarantee

Consumers run macOS, Linux, native Windows, and WSL. A skill's embedded `grep -rn`/`sort -rn`/`wc -c`/`$(...)` one-liner assumes a POSIX shell with GNU-ish tools — available via Git Bash or WSL, absent in native PowerShell. Claude Code auto-detects and may route to PowerShell, which a skill cannot override.

Published skills across the ecosystem simply assume bash; there is no official Anthropic guidance on Windows compatibility for skill-embedded commands. So:

- **A command whose output the model interprets** — state the INTENT alongside it ("count the skills"), so a non-POSIX session can reach the same answer differently.
- **A command that must run verbatim** (a measurement whose exact form matters) — fine to embed, but it belongs to a maintainer workflow, not a consumer path. Say which.
- **Never** make a consumer-facing step's success depend on a tool you never verified is present.

## Examples: a rule illustrated with a tool only the author has

A session measures a trap in whatever environment it happens to be standing in, so the example that reaches the draft is the one from that environment — a personal wrapper CLI, a company-internal command, a project-specific alias. When the underlying mechanism is general, an example nobody else can run is worse than no example: a consumer reads an unfamiliar command, finds nothing matching it on their machine, and concludes the rule is about that tool rather than about them. The rule ships, is read, and is correctly reasoned past.

Generalise the example to the layer the mechanism actually lives at, not the layer you met it at — an SSH-wrapper trap is a property of `ssh`, not of whatever wraps it, so `ssh host "..."` reaches every reader while the wrapper reaches one. When the personal tool genuinely is the point of the step, name it beside its generic equivalent the way `pull-db` does (`remote` CLI *or* a plain SSH alias from `~/.ssh/config`), so a reader without it still has a path. The author's own environment-specific wording keeps its home in their private CLAUDE.md companions, which never ship.

## Tell

You are writing a skill step and about to pick between an absolute and a relative path — when the answer is that the file is unreachable, and the step needs a different shape. Or: the command in your example is one you ran this session, and you have not asked whether a stranger has it.
