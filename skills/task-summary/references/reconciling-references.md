# Reconciling Back-References

When creating, `Glob: tasks/**/current.md` and add bidirectional `Related:` refs for any connected domains.

## When Updating: Reconcile Back-References

The multi-domain scan (§1, `resolving-path.md`) finds docs to update from code changes, inputs, and verbal requests — docs that *own* work. Some docs own no work; they only mirror a feature's status: roadmaps, index/hub docs, anything listing the feature in a row or `Related:` link. Nothing in a git diff points at them, so a work-driven scan never reaches them and their mirrored status can drift silently — a roadmap row still saying "uncommitted" weeks after ship.

After updating a feature doc, close the loop on what refers back to it:

1. `Grep tasks/**/*.md` for the updated doc's path and its feature name/vocabulary — in every repo the feature spans, not just the one you edited. A cross-repo feature's loudest mirrors often live in the *other* repo's tree, where a same-repo grep can't reach them.
2. For each doc that mentions it — roadmap rows, hub tables, `Related:` lists — check whether the status it mirrors still matches reality; flip stale "uncommitted/pending/not pushed" hedges to match.
3. Status-sync, not a rewrite — touch only the row/line referencing the feature, leave the rest of the index doc alone.

Signal you've found a mirror needing sync: the referencing doc describes the feature in the past tense of an older state than the doc you just updated.

## Three Other Reconciliation Cases

The feature-name grep above misses three other reconciliation cases, each needing its own vocabulary to search for rather than the feature's name:

### A Changed Project Fact in a Derived View

A project doc set (`docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE-ESSENTIALS.md`, or whatever the project's CLAUDE.md calls a derived view of its task docs) restates the task docs' dates, status and decisions, but never links back to them and sits outside `tasks/`, so the grep above can't reach it. When an update changes a date, a status (unbuilt to built, unsigned to signed) or a decision, grep the whole set for the **old value** (`1 January`, `not yet confirmed`, `unbuilt`), not for the feature's name. A derived view states the fact in its own words. Fix each hit to the new value, keeping the sentence's claim, and leave the rest of the view alone. Where the new value is a deploy state (built to live, staging to prod), check it by ancestry against the deploy branch before writing it into the view: the task doc you are updating may itself be the stale side. A hit that records history rather than the present (a dated decision row, a planned-versus-built table, a quote) stays as it is. So does every file outside the named views: versioned client documents, verbatim captures and archives deliberately hold old values, and "fixing" them rewrites what was sent or said. No derived views in the project means nothing to do. In the output, name the old values searched and the hits fixed, so an empty diff reads as checked, not skipped. A rewrite beyond those hits is `refresh-instructions`, not this step. Nothing else in the workflow opens these files: `update-claude-docs` routes only rules breakable in one line into essentials and never opens the PRD or architecture doc, and `/done` re-checks the set only when its own diff touched it (16/11/2026: an architecture doc said "1 January" in six places and "client has not confirmed the project" three days after the task doc moved the date and recorded the signing).

### A Fixed Bug

A doc describing it may never mention the feature at all, only the defect — grep the symptom/flag/command the gotcha names (`RELOAD_NGINX`, the error string) plus its hedges ("still", "until they're fixed", "can never"). Every hit asserting the bug is live needs to flip to fixed, with the reason it's now safe. Run the command that actually settles this before flipping anything, and be willing to flip in the other direction too — a doc claim that contradicts your session's experience is as often right as it is stale, and an unverified "correction" discredits a source that was correct while reading as settled to whoever reads it next. A stale status is merely out of date; a stale gotcha actively misleads — the next session re-fixes a solved bug or routes around a problem that no longer exists.

### A Moved Fact

If the session split a doc, extracted a section, or renamed an anchor, grep the file/anchor name instead of any claim — a move leaves every claim true and only the routing wrong, so a claim-based grep finds nothing to fix. Nothing 404s; the emptied file still resolves as a router, and every `📖 <file>` that promised a fact now lands the reader where the fact isn't. `grep -rn "escrow-engine.md" tasks/` and repoint each hit at the leaf that now owns the fact, prioritizing `Gotchas:` teasers and `Next Steps` items (their contract is "one-line fact + the file with detail," so a reader may act on the teaser alone) — then mark the emptied file a router in the index.
