# Validation Checklist

Re-read the whole doc end-to-end. Does every section still say something true, complete, and stated exactly once?

A write's validation scope usually ends at the diff — which is where staleness lives. A doc goes stale because the session that broke a fact and the session that could fix it are different. You rename a thing and update the doc about the rename, while a sibling paragraph mentioning the old name isn't in your diff and so never gets read. It stays wrong until someone opens the file for a different reason. You are that someone now, holding the file open with edit intent — which makes this the cheapest moment to catch the staleness. Sweep the fields written once and read least (`Quick Start`, `Status:`, `Immediate next actions`, and opening prose describing what the system is), and in a split doc set read the `decisions/*.md` headers too — the index gets attention while siblings inherit drift. Fix what you can verify; where the doc contradicts what you observed this session, check before flipping — a doc claim is as often right as it is stale, and an unverified "correction" leaves a source that was correct now discredited.

## Fact Checks — Structure and Integrity

1. **LLM-CONTEXT.** Has Status, Domain, Related, Last updated, with today's date. Every section matches the template — correct table columns, correct field names, no free-form bullets where the template specifies a table.

2. **No accidental row loss.** Deliberate pruning is expected. Count the table rows, the warning markers and the bytes BEFORE rewriting, so you have something to compare against afterwards — the comparison is worthless if you take it after the fact. A restructured-only doc that drops more than roughly a tenth of its bytes lost content, since restructuring moves text rather than removing it. A doc set each shedding a third of its bytes is deletion wearing a rewrite's face.

3. **Derivable state.** If your write touched git state or environment status, run these doc-wide greps: `committed`/`uncommitted`/`pushed` (delete any outside an MADR `**Status**: committed` lifecycle field) and `deployed`/`staging`/`prod` (collapse multiple sections into Quick Start's state line). Both leak into Task Status and Last Session in ways section-by-section editing misses.

4. **No wrapper artifacts.** Last line is real content, not a `</content>` tag from a Read result. Run `tail -c 40 <file>` to check.

## Judgment Checks — Logical Completeness

- **Cross-section duplication.** Grep the doc for 2–3 critical phrases. A phrase in more than two sections or the same fact across two bullets means collapsing to one. A doc-wide grep after all edits lands; section-by-section reading misses duplicates introduced within one section.
- **Back-references reconciled (§6).** No roadmap/index/`Related:` doc still mirrors an outdated status for the feature you updated.
- **MADR compliance.** Every row in `## Key Technical Decisions` is either an MADR block or legitimately escaped it (no real alternative existed). If whole-doc MADR exceeds 300 lines, split into index + `decisions/<theme>.md`.
- **Doc-stated counts.** If the doc names a count ("N decisions", "5 critical gotchas"), re-derive it by running the command that produces it, never adjust by hand. A doc carrying both the count and the command drifts silently on every increment.
