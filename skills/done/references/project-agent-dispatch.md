# Project Agent Dispatch

When a project-local agent exists on disk, verify it's dispatchable before attempting to use it.

**The timing gap:** Project agents register at session start, so an agent written this session exists in the git checkout but is absent from the harness's registry. Attempting `Agent(subagent_type: "code-reviewer")` then fails with *"Agent type not found"* — both the project type and the plugin fallbacks are unavailable (the project that just generated its agents has no plugin-supplied agents either).

**Workaround:** Dispatch `Agent(subagent_type: "general-purpose")` instead, and hand it the agent file as its brief: "read `.claude/agents/<name>.md` and adopt it as your brief, then …" This preserves the agent's own role, process, and false-positive tables. Explain in the `/done` Output that the agent ran via general-purpose dispatch due to the timing gap.

**Reload plugins?** No — `/reload-plugins` doesn't help. Project agents aren't plugins.
