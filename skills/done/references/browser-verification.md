# Browser verification (opt-in)

`browser-verifier` drives the running app and asserts the feature works for a real user — the one lens that reads the running system instead of source. It catches what the three static agents structurally cannot: a control that renders but can't be tapped at 390px, a submit that fires a success toast while writing nothing to the DB.

**Spawn it only when BOTH hold:**

| Gate | Why |
|------|-----|
| The user asked for browser/runtime/mobile verification — or the diff touches user-facing UI and they want proof it works | It is slow and needs the app already running. Never auto-spawn it on a backend-only diff; a `/done` that silently launches a browser on every commit is worse than no agent |
| `.claude/agents/browser-verifier.md` exists | It carries the project's URL, test accounts and viewport recipe. No generic fallback — skip silently if absent |

**Prompt it with**: the feature name, its task-doc path, the exact route/flow to drive, and the concrete assertions that must hold (including the DB row to check). It is never partitioned by file slice.

**Its findings are evidence, not fixes** — it is read-only by design. A `BLOCKED` result is a valid outcome and must be surfaced as-is; do **not** relax an assertion or re-run until it goes green. If it reports a bug, confirm it against the code before fixing.

⚠️ **The agent's DIFFICULTY is a finding too, and it's the one that evaporates.** A `BLOCKED` result, a wrong-class/wrong-method error, a login recipe it had to derive, or an instruction you had to hand-write into a second agent's prompt — that friction is a defect in the docs or the agent file, and it doesn't reach Steps 3-5 on its own. Ask before closing: *what did the agent get stuck on, and where would it have had to read to not get stuck?* Route it — a wrong fact → Step 3 (`update-claude-docs`); a missing recipe in the agent's own file → patch `.claude/agents/<agent>.md`; a defect in a skill's instructions → Step 5.

⚠️ **A `BLOCKED` whose stated cause is a "known bug" is a claim to CHECK, not accept** — the agent repeats what the docs say, and a doc row still calling something an open bug that was since closed as won't-fix dispatches it on a false errand with full confidence. Verify the cause against the task doc that OWNS that decision before believing the block.

⚠️ **An agent's claim that the user approved something is unverified, not automatically false.** The user can steer any agent mid-run and invoke skills inside it, on a channel you never see — work outside the prompt you gave it is expected, not evidence of misconduct. Resolve by reading the agent's own transcript (`<session-id>/subagents/agent-<id>.jsonl`, real `user` turns minus skill injections and `<system-reminder>`s): hits = the user drove it, authorized; zero hits = the agent invented the consent, still unreviewed. Never report an agent as rogue without that check — the underlying finding is still real evidence either way, only the attribution is in question.
