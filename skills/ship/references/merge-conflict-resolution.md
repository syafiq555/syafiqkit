# Resolving conflicts during a ship's forward-merge

Read when `git merge` onto the deploy branch stops with conflicts. The failure mode here is not a broken merge — it is a *clean-looking* merge that silently drops someone else's work, because the resolution ran on the assumption that one side had to win.

## The default is keep both, not pick one

A ship's merge conflicts are overwhelmingly **additive collisions**: two people appended to the same file in the same window. Code conflicts usually represent genuinely competing logic where one side is correct; conflicts in living documents almost never do. Both sides are true, and taking one discards a colleague's real content while producing a diff that reviews clean.

Before resolving any hunk, ask what kind of collision it is:

| Shape | Resolution |
|---|---|
| Both sides appended distinct entries under a shared heading | Keep both, merged into one section — never two identical headings |
| Both sides edited the same sentence to say different things | Genuine conflict; the newer/more-measured claim wins, and say so in the commit |
| One side supersedes the other (a count re-measured, a list extended) | Keep the superseding version, keep any *neighbouring* additions the other side made |

## The changelog is the one that bites

Two developers shipping the same day both write under `## [YYYY-MM-DD]`, so the conflict lands *inside* one heading with each side's `### Added` / `### Fixed` subsections. The tempting resolution — accept both hunks verbatim — yields a file with the date heading twice and two `### Added` blocks, which reads as a formatting error and invites someone to "tidy" one away.

Merge by **section**, not by hunk: one dated heading, one `### Added`, one `### Fixed`, with both sides' bullets inside each. Restructuring conflict hunks by section is one of the few places a script genuinely beats hand-editing — it is a uniform transformation over several blocks, not a single-occurrence change.

**Count the bullets on both sides before resolving and against the result afterwards.** A dropped entry is invisible in the merged file: the prose reads fine, the sections are well-formed, and only the person whose bullet vanished will ever notice. The count is the only thing that catches it.

## Billing and log documents

Any doc that accumulates dated records (invoice logs, decision logs, audit trails) carries the same risk with a worse consequence — a dropped entry is unbilled work or a lost decision. Resolve by keeping every record from both sides in date order, then verify each side's record count survived. Where the two sides disagree about a *header* or summary line, the newer measurement usually wins, but re-add any facts the older line carried that the newer one simply omitted rather than contradicted (a recovery pointer, a caveat about authorship).

## After resolving

Sweep for markers before committing — a stray `<<<<<<<` inside a fenced block or a long doc survives a visual skim:

```bash
grep -rn '<<<<<<<\|>>>>>>>\|^=======$' --include='*.md' --include='*.php' . | grep -v node_modules
```

Then re-run the test suite. A doc-only conflict cannot break tests, but a ship's merge usually pulls in the deploy branch's *code* alongside it, and that code may interact with what you just built — which is the thing worth knowing before you push, not after.
