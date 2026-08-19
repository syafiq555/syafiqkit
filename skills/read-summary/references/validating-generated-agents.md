# Validating Generated Agents

A project's `.claude/agents/*.md` files were generated from templates at some point in the past, and they only carry what those templates held that day. When a template later gains a safety constraint, agents generated earlier never receive it — and nothing about dispatching a stale one looks wrong, because it returns a normally-shaped report. The gap is worth one cheap look the first time a session dispatches a project agent.

**What you cannot do is search for the template's wording.** Generation restates each rule in the project's own vocabulary, so an agent carrying a constraint perfectly may share no phrase with the file it came from. A search for the template's words reports every correctly-generated agent as missing the rule, and reports an agent that kept the phrase and lost the meaning as fine. Open the files and read for the property instead; there are only a handful, and you are reading one section of each.

## The two constraints worth the look

**Can this agent hand your task to a copy of itself?** Every agent except `Explore` should say, somewhere in its body, that it may spawn only retrieval-shaped helpers — never one of its own kind, and never its own assignment. An agent missing this will delegate your brief to an identical copy, which returns a correctly-shaped report built on a paraphrase of your prompt, and manufactures corroboration in the process: a premise you supplied, restated by a child and relayed by a parent, reads as two agents independently agreeing. `Explore` is the deliberate exception — nested `Explore` is its designed behaviour, so an enumeration that flags it just trains you to ignore the result.

A constraint stated only in a YAML comment beside the tool grant does not count. That comment reaches whoever edits the file and reaches the agent as nothing; at runtime the tool arrives with its own generic description and nothing narrowing it. It has to be in the body, where the agent reads.

**Does an agent that edits files check whether it owns them?** Anything that rewrites a file in place — a pruner, a condenser, a simplifier — should establish that no peer session has uncommitted work there first. Without it, the agent silently destroys someone else's changes and reports success. This is the destructive half of staleness; a missing re-delegation rule only wastes a dispatch.

Ask both questions of each agent separately. They are independent — an agent can carry one and lack the other — and any check that folds them into a single pass will tell you an agent is fine when it holds only one of the two.

## What the answers mean

An agent missing either constraint should be regenerated through `/agent-setup` before you dispatch it. An agent missing the ownership check specifically should not be pointed at a file anyone else might be editing until it is.

Reading all of them and finding both constraints present is a real result, not a formality — but it is a result about the agents you actually opened. If you spot-checked two of eight, you know about two.

## When to do this

Once per session, the first time you dispatch a project agent, and not again after that. Skip it entirely in a project with no `.claude/agents/` directory. After a regeneration, the agents are current by construction and need no re-check in that session.

The same question is worth asking of any skill that rewrites a whole file in place rather than appending to it. Those reach their destructive step by direct invocation, so they never appear in a sweep of agent dispatch sites, and a clean sweep of the agents certifies nothing about them.

## Why this is a companion

The principle — generated agents carry only what their template held on generation day — is general. Which constraints matter is project-specific: this project cares about re-delegation and file ownership because both have caused real damage here. Another project's agents will have their own safety bar, and the shape transfers even when the specifics don't.
