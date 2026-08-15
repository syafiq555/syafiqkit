# What a Dispatched Agent May Spawn

Referenced by every agent template that grants the `Agent` tool. Apply when writing or reviewing an agent that can itself dispatch.

An agent granted `Agent` can spawn anything — including a fresh copy of itself carrying its own assignment. That is the failure this file exists to prevent, and it does not look like one from either side.

## The rule

**Spawn agents to gather, never to do your job.** A child is for a slice of retrieval you don't want in your context: find every caller of X, read these nine files, sweep the sibling repo. It is not for the judgment you were dispatched to perform. If the child's task description could be mistaken for your own — same verb, same object, same scope — you are relaying rather than reviewing, and no one downstream can tell.

For most agents that means `Explore` and nothing else. `Explore` itself is the deliberate exception: nesting is its designed behaviour, since a multi-target sweep genuinely partitions into independent searches.

## Why the YAML comment doesn't carry it

The tools block on these templates reads:

```yaml
  - Agent  # lets this agent spawn Explore agents for multi-target sweeps (depth-5 cap applies)
```

That comment states the intent correctly and constrains nothing. It is documentation for whoever edits the file, not an instruction the agent follows — the agent gets the `Agent` tool with its full generic description, which says nothing about what this particular role should spawn. A grant with the restriction living only in a comment reads as restricted to a human reviewing the file and is unrestricted at runtime. **State the constraint in the body prose, where the agent will actually read it.**

## Why it survives review

Re-delegation produces a real report through a plausible path, so every signal a dispatcher checks comes back healthy:

- **The output arrives, correctly shaped.** Findings, sizes, a build-or-skip verdict — the parent reformats the child's work into its own contract, so the deliverable passes inspection on shape.
- **The dispatcher's own instructions are the first casualty.** A prompt clause like *verify each premise against the code and name file:line* binds the agent you dispatched. What reaches the child is that agent's paraphrase, and the paraphrase is where a verification requirement quietly becomes a topic. You get file:line citations gathered under a brief you never wrote.
- **It manufactures false corroboration.** A premise you supplied, restated by a child and relayed by a parent, arrives looking like an independent finding that two agents agree on. Convergence is evidence only about what neither of them got from you.

**Tell:** the child's task description restates the parent's, rather than naming a slice of it. In a rendered agent tree that reads as one nested line — `product-reviewer (Scope worklist) └── product-reviewer (Scope Next Steps worklist)` — and is easy to walk past as ordinary fan-out.

## Writing the constraint

One line in the body, near where the agent is told what it may delegate:

> **Spawn only `Explore`, and only for retrieval.** Never dispatch another <role>, and never hand a child your own assignment — the judgment in this brief is yours to perform, not to relay. Depth-5 cap applies; at depth 5 the `Agent` tool is absent, so fall back to serial `Read`/`Grep`.

Name the role explicitly rather than writing "another agent of this type" — the specific noun is what makes it fire when the agent is deciding what to spawn.

## Checking an existing agent

Whether a template carries this is a body-prose question, so grepping the tools block answers the wrong one — every template's comment looks compliant. Read the body and ask what it tells the agent to spawn. Where the answer is nothing, the grant is unconstrained regardless of what the comment says.
