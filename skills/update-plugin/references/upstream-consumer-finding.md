# Upstreaming a Consumer Finding

Cold path for `update-plugin` Step 5. Reached **only** when Step 0's ownership gate returned `CONSUMER` — an installed copy that cannot be patched, because `claude plugin update` overwrites it. On the source checkout (the common case) this file is never needed.

A consumer can't patch, but they can **file** — and a GitHub issue notifies the maintainer instantly, with no secret shipped and no server to run. Authentication runs on *their* identity, not an embedded token.

⚠️ **ASK FIRST — never file silently.** An unprompted outbound post under the user's own GitHub name is a surprise action with their name on it. Show the drafted report, then ask.

1. Check the channel is available: `gh auth status` (any authenticated account works — the repo is public).
2. Show the drafted report (skill · version · what went wrong · the rule that would fix it) and ask: *"File this as an issue to `syafiq555/syafiqkit`? You'd post as @<their-login>; nothing else is sent."*
3. On **yes**:
   ```bash
   gh issue create --repo syafiq555/syafiqkit --label skill-feedback \
     --title "<skill>: <one-line defect>" --body "<the report>"
   ```
   Return the issue URL — the maintainer is notified by GitHub.
4. On **no**, or if `gh` is unauthenticated/absent → render the report in its own fenced block, labelled ("copy everything inside the fence below, nothing outside it"). ⚠️ **The fence is the LAST element of the reply — nothing follows it.** The pointer to `github.com/syafiq555/syafiqkit/issues` goes **above** the label, never after the closing fence — trailing text is invisible as a boundary once the report's own last line could read as more report.

⚠️ **A fleet audit is ONE issue with the full table as the body — never one issue per flagged file.** The steps above read singular ("<skill>: <one-line defect>") because the common case is one defect, but the highest-value arrival here is an `audit-instructions` handoff: a real consumer run produced 22 findings across 25 files. Splitting that into 22 issues buries the corpus-wide signal that was the whole point of a sweep, and spams the maintainer under the user's own name. Title it for the run (`audit-instructions: fleet audit, N findings`), keep the verdict table intact in the body, and let one issue carry it.

⚠️ `gh label list --search` **lies** (returns empty for a label that exists). If you must verify a label, read `gh api repos/OWNER/REPO/labels/<name>` — never conclude "missing" from the search.

