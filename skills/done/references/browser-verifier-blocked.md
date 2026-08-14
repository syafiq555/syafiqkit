# When browser-verifier reports BLOCKED

A `BLOCKED` result is valid evidence — the feature is unreachable or untestable in the current state. Treat it as a finding, not as a transient failure to work around.

**The agent's own difficulties are data.** A login recipe it had to derive, instructions you rewrote into a second-agent prompt, or an error it couldn't isolate — friction like this signals a gap in `.claude/agents/browser-verifier.md` or the docs it reads from. Before closing, ask: what did it get stuck on, and where would it have found that instead of needing a hand-written workaround? Route the answer: wrong task-doc fact → update there; missing recipe or account detail → patch `.claude/agents/browser-verifier.md`; missing skill instruction → fix the skill's own docs. This friction doesn't surface on its own; surface it yourself when you see it.

**Verify a "known bug" claim.** The agent repeats what the docs say, so if the task doc still lists a feature as an open bug but the code later closed it as won't-fix, the agent will dispatch with full confidence on a false errand. Check the task doc that owns the decision before accepting the block at face value.

**Verify a user-approval claim.** An agent can invoke skills and receive steered mid-run, and that work doesn't appear in your own conversation. Resolve by reading the agent's transcript at `<session-id>/subagents/agent-<id>.jsonl`, counting real `user` turns (excluding skill injections and system reminders): if hits > 0, the user drove it; if zero, the agent invented the consent. The underlying finding is still real evidence either way; only the attribution changes. Never report an agent as untrustworthy without this check.
