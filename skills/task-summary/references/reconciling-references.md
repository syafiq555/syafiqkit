# Reconciling Back-References

When creating, `Glob: tasks/**/current.md` and add bidirectional `Related:` refs for any connected domains.

## When Updating: Reconcile Back-References

The multi-domain scan (§1, `resolving-path.md`) finds docs to update from code changes, inputs, and verbal requests — docs that *own* work. Some docs own no work; they only mirror a feature's status: roadmaps, index/hub docs, anything listing the feature in a row or `Related:` link. Nothing in a git diff points at them, so a work-driven scan never reaches them and their mirrored status can drift silently — a roadmap row still saying "uncommitted" weeks after ship.

After updating a feature doc, close the loop on what refers back to it:

1. `Grep tasks/**/*.md` for the updated doc's path and its feature name/vocabulary — in every repo the feature spans, not just the one you edited. A cross-repo feature's loudest mirrors often live in the *other* repo's tree, where a same-repo grep can't reach them.
2. For each doc that mentions it — roadmap rows, hub tables, `Related:` lists — check whether the status it mirrors still matches reality; flip stale "uncommitted/pending/not pushed" hedges to match.
3. Status-sync, not a rewrite — touch only the row/line referencing the feature, leave the rest of the index doc alone.

Signal you've found a mirror needing sync: the referencing doc describes the feature in the past tense of an older state than the doc you just updated.

## Two Other Reconciliation Cases

The feature-name grep above misses two other reconciliation cases, each needing its own vocabulary to search for rather than the feature's name:

### A Fixed Bug

A doc describing it may never mention the feature at all, only the defect — grep the symptom/flag/command the gotcha names (`RELOAD_NGINX`, the error string) plus its hedges ("still", "until they're fixed", "can never"). Every hit asserting the bug is live needs to flip to fixed, with the reason it's now safe. Run the command that actually settles this before flipping anything, and be willing to flip in the other direction too — a doc claim that contradicts your session's experience is as often right as it is stale, and an unverified "correction" discredits a source that was correct while reading as settled to whoever reads it next. A stale status is merely out of date; a stale gotcha actively misleads — the next session re-fixes a solved bug or routes around a problem that no longer exists.

### A Moved Fact

If the session split a doc, extracted a section, or renamed an anchor, grep the file/anchor name instead of any claim — a move leaves every claim true and only the routing wrong, so a claim-based grep finds nothing to fix. Nothing 404s; the emptied file still resolves as a router, and every `📖 <file>` that promised a fact now lands the reader where the fact isn't. `grep -rn "escrow-engine.md" tasks/` and repoint each hit at the leaf that now owns the fact, prioritizing `Gotchas:` teasers and `Next Steps` items (their contract is "one-line fact + the file with detail," so a reader may act on the teaser alone) — then mark the emptied file a router in the index.
