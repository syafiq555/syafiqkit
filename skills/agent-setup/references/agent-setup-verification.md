# Verifying Agent Files

**Read this when checking agent files, whether you just generated them or are auditing a project someone set up months ago.**

The thing to understand before anything else: **a generated agent and its template are not supposed to match.** Templates are written as judgement prose, and generation restates each rule in the project's own vocabulary — one project's `Explore` talks about backend/frontend and DDD, another's about SKILL.md and command markdown. Textual difference is the designed outcome. So a comparison that measures wording answers a question nobody asked, and answers it wrongly in both directions: it flags every healthy agent as drifted, and it passes an agent that kept the heading and lost the content.

What you are actually establishing is that each agent **can still do its job in this project**. That is a property you judge by reading, not a string you match. Where a fact below is genuinely a fixed value — a colour, a model tier, a line whose presence is itself the enforcement — say so and check it however you like; the point is the fact, not the command.

However you choose to check something, **make sure it can fail in the direction you care about**, and satisfy yourself of that against a file you already know is broken. A clean result is the one nobody re-examines, which is exactly why a check that cannot report a defect survives for years. This file previously carried a frontmatter comparison that reported every agent healthy for its entire existence, because what it actually compared was the same literal `---` extracted from both files; the sweep was clean because it was blind. Elsewhere a flag that silently cancelled another one inverted a whole coverage sweep, and it still passed, because a file that matches neither side of the question is missing from both answers. Automating any of this is fine — the failure isn't automation, it's trusting a green result you never made go red.

---

## Read the agent as the agent will execute it

This is where the findings are, and nothing substitutes for it. Open each file and walk its process in order, as the agent would.

**Run `diff` against the template before this read, not instead of it.** A prose read-through, done carefully, still misses missing capability — a redelegation ban stated as a standalone sentence in the template can be absent from the generated file while a nearby, softer sentence reads close enough that a careful pass calls it present. One verification session read all eight agents this way, judged four clean, and only found real gaps in three of those four after running `diff` on each — the same missing-redelegation-rule shape recurred across five of the eight files and a careful read had passed every one of them. `diff` surfaces every line that differs; the reading skill from here on is triaging that output into "reworded, ignore" versus "capability absent, real finding" — but do the diff first, because the reworded lines are exactly what a read-through anchors on and stops looking past.

**Does every step's command match what the file's own warnings demand?** A banner mandating one command above a step that runs a different one is a contradiction in which the step wins. Both are present, so no presence check and no absence check will ever see it.

**Is anything a step depends on stated after the step that needs it?** A never-remove list below the step that deletes, a scope guard below the step that writes — present, and unreachable. Position, not presence.

**Are commands right in their arguments, not just their names?** The command name reads fine while its glob matches nothing and the zero reads as a clean result.

**Does every path the file cites actually resolve?** A consolidation commit that merges or deletes layer files leaves agents pointing at paths that no longer exist. The subtle case: a bare `CLAUDE.md` with its directory prefix stripped still resolves to a real file — the wrong one. Both read as ordinary rows.

**Do the inline rules earn their place?** They should be the facts that cause crashes or corruption at runtime if missed — a column name that differs from its accessor, a base class that must be extended. Anything derivable, any one-time setup, any symptom-indexed gotcha belongs in CLAUDE.md, which the agent reads at runtime anyway.

---

## Fixed values

These are the things that genuinely are exact strings, where a difference is always a defect. Nothing about the prose rewrite touches them.

**Colour, per agent name, the same in every project:** Explore green, Plan blue, task-builder pink, code-reviewer red, code-simplifier cyan, claude-md-pruner yellow, product-reviewer purple, browser-verifier orange.

**Model tier:** Explore runs haiku; every other agent runs sonnet. An in-file override survives only if a comment justifies it — an unjustified deviation is drift. The mirror image is invisible to any file check, because it happens at dispatch: passing `model:` to a registered `subagent_type` silently overrides that agent's own tier with no error, so supply it only for `general-purpose` or when the tier was asked for explicitly.

**`name:` on Explore and Plan** must be exactly that — capitalised, no hyphen. It is what shadows the built-in agents, so a typo silently un-shadows them.

**`memory: project`, plus a line that actually reads it back.** The grant does nothing on its own; an agent that never globs `.claude/agent-memory/<name>/` accumulates notes no session will ever see. All eight agents need both halves. Check the templates for the same thing — a template shipping without the read-back bakes the gap into every project generated from it afterwards.

**Diagnostics:** `code-reviewer` and `code-simplifier` hold `mcp__ide__getDiagnostics`; `product-reviewer` and `browser-verifier` must not, since they judge completeness and behaviour rather than correctness.

**`task-builder` has no `tools:` line at all.** That is deliberate and load-bearing: the enum cannot be appended to, so omitting it is the only way to grant `Agent` alongside everything else, and adding a list back silently revokes it. This also means any sweep that enumerates tool grants by looking for a `tools:` block cannot see task-builder's at all and will report it unaffected.

**`disallowedTools: [Write, Edit]` on `product-reviewer` and `browser-verifier`.** This line *is* the read-only enforcement. Leaving Write and Edit off the `tools:` list does not block them — the harness grants a tool omitted from that line, the same partial-shadow quirk that affects Explore and Plan. This repo's own `product-reviewer` shipped without it, guarded only by a `# NOTE: read-only by design` comment that reaches whoever edits the file and reaches the agent as nothing. Verify a read-only agent by whether the enforcing line exists, never by whether its frontmatter matches a template.

**Known-broken API names must appear nowhere:** `goToDefinition` and `findReferences` are broken in this harness, so any agent recommending them has regressed to something that will not work.

**No machine-specific absolute path in any committed agent file.** A literal `/Users/<someone>/...` collides for every colleague on a different setup. Multi-repo agents resolve the sibling at runtime through a placeholder instead.

**The `📖 ../../_shared/references/agent-may-not-redelegate.md` pointer must NOT survive into a generated agent.** That relative path resolves only inside the templates tree, and a project checkout need not have the plugin installed at all. Its absence is correct, not a defect to repair — the rule it points at travels as prose instead.

---

## What each agent must still be able to do

Each of these replaces a phrase-match. Ask the question, read for the answer, and accept whatever words the project used.

**code-reviewer** — does it carry patterns *from this project* that look like defects but are deliberate, each with the reason it stays? An empty table under a correct heading is the failure this catches; the heading was never the point.

**code-simplifier** — does it name code in this project that looks redundant or single-use and must survive anyway, with why? Same shape: the rows are the content, the heading is packaging.

**product-reviewer** — does it sort findings by whether a user is actually blocked, distinguishing must-fix-now from known-and-accepted from optional polish, so a reader can tell which class any finding lands in? And does it name who this software is actually for? The tier *names* are project vocabulary; the three-way distinction is the property.

**browser-verifier** — three separate questions, none of which a single search answers. Does it require an observed effect rather than a tool's success report? Does it refuse to treat approval as given unless the user gave it? Will it decline to run unless the user explicitly asked? Its mobile recipe also has to gate on the media query actually matching rather than on window width, since resizing a window is not the same as being a phone.

**claude-md-pruner** — does it contain no size threshold of its own, handing that decision to `condense-claude-md` or `condense-task-doc` instead? The absence of a hardcoded number is the property; naming the delegate is evidence for it, not a substitute. And does it branch on which artifact it is pruning — a CLAUDE.md and a task doc have different never-remove content — before it starts deleting?

**Explore and Plan** — is Explore's answer its reply text rather than a file the caller has to open, and does anything it writes go somewhere that cannot disturb the caller's work? Is Plan's writing confined to its plan file, never application source or task docs? Both agents' write scoping is instructional rather than harness-enforced, which is exactly why the body text has to say it.

**Every task-doc-consuming agent** — does it discover the task doc through the shared discovery skill rather than describing its own search procedure, and does it hold the tool grant that lets it? Reimplementing discovery per agent is how eight copies drift apart.

**Any Agent-holding agent** — does its body say, in its own words, that it may spawn only retrieval-shaped children, never one of its own kind, and never hand off its own assignment? A YAML comment beside the grant does not do this. Explore is the deliberate exception: nested Explore is its designed behaviour.

---

## Placeholders and real content

A freshly generated agent has every heading, every table, and no project content — the rows are still the template's `<!-- e.g. ... -->` examples. Almost any phrase-match passes on that file, because the strings being matched are template boilerplate. Frontmatter passes best of all, since it is the part legitimately copied verbatim.

So the question for every fill-in table is whether it names something that exists in **this** project. A browser-verifier whose target slots still read `<app-url>` cannot run at all. A code-reviewer whose false-positive table holds only the template's examples is carrying a section that will never fire.

---

## Missing agents, and which side is stale

**A template with no generated counterpart is a missing agent, not drift** — enumerate both sides by name and create what's absent in the same pass. This is the one comparison that survives any rewrite, because names are names.

For agents that do exist, **which side is stale is a finding, not an assumption.** The two files are edited by different passes: a prose or density sweep rewrites the template, while a session fixing live agent behaviour edits the generated copy. Both can be ahead of each other on different axes at once, so "restore from the template" discards whatever real fix the generated side was carrying. Decide per topic rather than per file. Differences clustering into distinct subjects, rather than one contiguous block, is the signal that both were edited independently.

Copying toward the template needs its own read, because a generated file legitimately holds project-specific text — "this repo is markdown-only, no code symbols to navigate" is correct locally and wrong upstream in a file meant to be generic.

What you are hunting is a **missing capability**: a step, a grant, a guard, or a table subject that the template's agent has and this one lacks. That is what "out of date" means now. Reworded prose is not it.

---

## Do this yourself

A delegated "check all these files" summary reports whole missing sections and silently drops everything finer — which is the opposite of what this is for, since the finest details are where the drift is. A clean report is the one most likely to go unchecked, precisely because nothing in it looks worth a second look: a real session accepted a clean eight-file sweep from three parallel agents, and found two genuine gaps only after being asked "are you sure?" and re-reading one pair by hand.

Treat any delegated pass as a first draft to spot-check. At minimum, re-open the agent carrying the least redundancy — the shortest generated file relative to its template — before repeating someone else's conclusion as your own.

---

## What a failure means

A **fixed value** that's wrong degrades the agent silently: a missing memory read-back accumulates notes nobody sees, a wrong model sends the agent to the wrong reasoning tier, a missing `disallowedTools` line lets a read-only reviewer edit the code it was meant to report on.

A **missing capability** means the agent will misbehave in exactly the situation the capability existed for, which is rare enough that nobody notices until it matters.

A **placeholder left unfilled** means the section is inert. The agent carries it, reads it, and learns nothing, and every check that looks for the heading says it is fine.
