# Browser verification (opt-in)

`browser-verifier` drives the running app and asserts the feature works for a real user — the one lens that reads the running system instead of source. It catches what the three static agents structurally cannot: a control that renders but can't be tapped at 390px, a submit that fires a success toast while writing nothing to the DB.

**Spawn it only when the user explicitly asked for runtime verification** — in words, this turn. A UI diff is a reason to *offer* it ("would you like me to verify this in the browser?"), never a reason to spawn it; proposing and waiting for a yes is the cost-control that makes this tool usable at scale. This applies mid-build as much as at `/done`.

Require `.claude/agents/browser-verifier.md` to exist — it holds the project's URL, test accounts and viewport recipe. Skip silently if absent; no generic fallback exists.

**Prompt it with**: the feature name, its task-doc path, the exact route/flow to drive, and the concrete assertions that must hold (including the DB row to check). It is never partitioned by file slice.

**Its findings are evidence, not fixes** — it is read-only by design. Verification is expensive, so re-running on a softer assertion to make a BLOCKED go green would hide whether the feature actually works, which is the whole point of this read-only design. If it reports a bug, confirm it against the code before fixing. If it is blocked, surface that as-is.

📖 See `browser-verifier-blocked.md` when it reports BLOCKED — covers difficulty diagnosis (friction signals doc gaps), verifying "known bug" claims (docs drift), and checking user-approval assertions (agent autonomy vs. steering).
