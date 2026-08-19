# Resolving Path — Multi-Domain Scan

When input is empty or a task description (not a full path or domain/feature), run a multi-domain scan to find every domain needing a task doc.

## Sources for Domains

**Code domains:** Use `git status --short` to infer domains from file paths. If output is empty because work is already committed, use `git diff --name-only <base>..HEAD` where `<base>` is the session's starting HEAD. In a non-git project, infer domains from mtime listing off session start (see `../../_shared/references/verifying-a-write-landed.md`). A sibling repo has its own `tasks/` tree this scan doesn't reach on its own — whenever the session touched a second repo, re-run the scan from its root and update its own `tasks/**/current.md` in the same pass; otherwise one side gets documented exhaustively while the other is never opened.

**Decision domains:** A session whose product is a decision rather than code change still needs routing. What does this session know that only exists in the conversation? A scope call carries its reason with it (defer, decline, block-on-X) — the item is unactionable next session without why. Work parked pending someone else's answer is the most often lost and most expensive to lose: it looks finished from inside the session and abandoned from outside.

**Map existing docs:** Match by content, not folder name — a file path `src/modules/qc-review/` doesn't match doc folder `setup/upload-redesign/` on the name. Delegate candidate-gathering to the `Explore` agent: `Glob tasks/**/*.md` plus `Grep` for the concept's vocabulary and synonyms. The mapping judgment stays inline against the returned data. Once dispatched, don't re-Glob or re-grep the same tree inline while it runs — wait for the completion notification; mechanics are in `../../_shared/references/explore-delegation.md`. Follow any `Merged into`/`Supersedes` redirect to the live doc (prevents duplicate doc creation).

## Domain Table

Build a table of all domains before writing:

```
| Domain/Feature | Source | Task Doc | Action |
|---|----------|--------|--------|
| webhook phone fix | code changes | tasks/notifications/webhook/current.md | Update |
| freemium tab | WhatsApp msg | tasks/student/freemium/current.md | Create |
```

Then create/update each task doc. Every issue mentioned gets one — even if just a 📋 Planning stub. If a session reverse-mapped a whole module because no task doc existed, that mapping work is the argument for creating it now; don't file "no task doc exists for X" without creating it, as that guarantees the next session repeats the same study.
