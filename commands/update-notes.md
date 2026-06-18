---
description: Create or update a personal session journal (non-code conversation log). Use to record a boss/team/career/strategy conversation, decision, or dynamic — append a dated entry to an existing thread or start a new one. Stores privately under ~/.claude/notes/.
argument-hint: "[domain/about or full path, or just describe what to log]"
---

**Storage convention**: `~/.claude/notes/<domain-slug>/<thread-slug>.md` (private, never committed; descriptive segments, no constant `summary.md` leaf)
- Examples: `~/.claude/notes/boss-hong-liang-ng/feedback-and-expectations.md`, `~/.claude/notes/career/salary-review-2026.md`

## What this does

Captures a non-code conversation into a living journal: appends a dated entry, refreshes the Quick Start, distils any durable rule into Standing Takeaways, and updates the Open Threads checklist. New thread → creates the file from the template. Existing thread → edits in place (entries accumulate, summary blocks stay current).

## Before writing

1. **Resolve the path** — full path / `domain-slug/thread-slug` → expand directly. Fuzzy description / empty → `Glob ~/.claude/notes/**/*.md` + `Grep` for the thread's vocabulary to find an existing log before creating a new one (avoid duplicate threads for the same topic).
2. **No match → create.** Propose a descriptive `<domain-slug>/<thread-slug>.md` (self-explaining, kebab-case, no `summary.md` leaf) and confirm if ambiguous — it's how the user finds it again.

## Privacy

⚠️ This is personal/sensitive content. NEVER write it into the repo, a `tasks/` doc, or auto-memory. The canonical home is `~/.claude/notes/` only.

## Execute

Invoke the `notes-summary` skill with this input:

$ARGUMENTS
