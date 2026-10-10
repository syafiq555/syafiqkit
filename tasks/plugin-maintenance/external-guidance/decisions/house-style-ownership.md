<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/external-guidance/house-style-ownership
Related: ../current.md (feature index — which file holds which decisions), applying-verdicts.md (sibling theme — verdict and source-grading decisions), ../../doc-condensation/decisions/unhobble-rule-writing.md (D63, the measured prose-vs-value boundary)
Last updated: 2026-10-10 — split by topic out of applying-verdicts.md; decision blocks moved verbatim, none reworded
-->

# External Guidance — House Style Ownership

Whose CLAUDE.md shape the skills enforce: this plugin's house style on every file they touch, and why an ownership branch was tried and reversed.

---

### D-rewrite-skills-branch-on-file-ownership — House Style Is Enforced On Our Files and Never Imposed On a Consumer's — committed — 2026-08-20

**Problem**
A gate added earlier the same day told `update-claude-docs` Rewrite mode to adopt any *consistent* convention it found in a target CLAUDE.md, on the reasoning that consistency is evidence a person decided it. That is right for a consumer's repo and wrong for this one: inside syafiqkit, a uniformly-applied wrong shape is what a single bad pass produces, so the gate preserved drift and reported it as respect for authorial intent. The user's report — *"theirs one could be wrong or following outdated one the previous session do it wrong"* — is that failure from the owner's side.

**Decision**
Chosen: branch on **where the file sits**, which is checkable, rather than on how deliberate its shape reads, which is not. Plugin-owned → `references/structure.md` is authoritative and the skill normalizes. Consumer-owned → the file's own convention wins. Applied to Rewrite's gate, Capture's write step (the mode `/done` runs on nearly every session, and the one the original complaint most likely came through), and `condense-claude-md`'s compress-in-place conversions, which reshape convention despite being framed as a shrink.

Task docs are carved out explicitly: `tasks/**` never ships, so there is no consumer side and no branch to take.

**Rejected**
- Collapsing back to adopt-always. Why not: it is the defect the user reported.
- Collapsing to enforce-always. Why not: it reintroduces the defect the morning's gate was added to fix — reshaping a consumer's maintained file under cover of a tidy-up.
- Leaving Capture alone as "additive, so out of scope." Why not: Capture is the highest-traffic path, and an entry written in the wrong shape is how a file's convention drifts one entry at a time. Scoped instead to the entry being added, never a licence to restructure around it.

**Consequences**
- **Consistency proves a pass was uniform, never that it was right.** This is the sentence the whole branch rests on, and it is why a clean-looking convention in a file we own is drift rather than intent.
- **The deciding fact has to be checkable or the gate is decoration.** "Where the file sits" needs asking from the target file's own directory — a probe anchored to the plugin's directory walks up to whatever encloses it and fails silently toward claiming a consumer's file as plugin-owned.
- **A same-day reversal is a shape to expect, not an anomaly.** Both gates were correct about the case in front of them and wrong as universals; the repair was a branch, not picking a winner.

**Status**: superseded by `D-house-style-applies-everywhere` (v1.187.0) · **Reversible**: yes
---

### D-house-style-applies-everywhere — The Ownership Branch Was an Answer to a Question Nobody Asked — committed — 2026-08-20

**Problem**
The user asked for `update-claude-docs` to "enforce this plugin docs convention," and two consecutive sessions read "this plugin" as *files inside this repo* rather than *the convention this plugin holds*. The result was an ownership branch: enforce inside syafiqkit, defer to the file's own convention everywhere else. Shipped in v1.186.0. The user's correction was immediate — *"i dont want their claude.md keep their convention, it should enforce this plugin style"* — and confirmed against three options, choosing enforcement in every mode.

The branch was elaborate, internally consistent, reviewed by three agents, and answered a question about *authorial intent* that had never been in scope. Nothing in the reviews caught it, because each judged the branch's coherence rather than whether the branch should exist.

**Decision**
Chosen: house style applies to every CLAUDE.md the skills touch, consumer repos included, in Rewrite, Create, the Capture write step and `condense-claude-md`. Installing an opinionated plugin is installing the opinion; a pass that defers to what it found delivers nothing on exactly the files worth restructuring.

The content guarantee is what carries the safety the branch was reaching for: the rule inventory and its diff, with the capture filter as the only deletion authority. Form is enforced, content is preserved, and the pass states what it restructured.

**Rejected**
- Keeping the branch with better wording. Why not: the axis was wrong, not the phrasing. Every sentence explaining *when* to defer was machinery for a decision the user doesn't want made.
- Enforcing only in explicitly-invoked modes (Rewrite/Create), leaving Capture to match the file. Why not: offered and declined — a house-style entry written into a foreign-shaped file is the first step of the restructure, not a violation of it.

**Consequences**
- **"Consistency proves a pass was uniform, never that it was right" survived the reversal and changed sides.** It was the argument for enforcing inside this repo; it is now the argument for not weighing an existing file's shape anywhere. A sentence that works equally well for both branches of a decision is a sign the branch is doing no work.
- **A shipped version can be superseded within the hour, and the changelog has to carry it.** v1.186.0 announced the ownership branch to colleagues; v1.187.0 says plainly that it shipped and was reversed, rather than quietly describing new behaviour.
- **Task docs keep the opposite rule and now say so at both ends** — `task-summary`'s citation of the shared reference previously claimed it stated "the same judgement," which became false the moment the CLAUDE.md rule flipped.

**Status**: committed · **Reversible**: yes
---

