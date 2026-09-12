# How the Harness Actually Reads Skills

Four facts about the Claude Code harness decide whether a patch reaches a session. None is derivable from the file itself, and each has a silent failure mode.

## The body enters context once, never re-read

Invoking a skill drops its rendered text into the session as a single message that persists for the duration; Claude Code does not re-open the file on later turns. A rule meant to hold across multiple steps must read as a standing instruction — "check X before each write" carries across; "now check X" fires once and is gone after the first action.

Corollary: sharpening wording on an existing rule is worth more than adding a sibling rule, since a re-read never happens to catch what a session skimmed on the first pass.

## After compaction, only the first 5,000 tokens survive

Once a skill is invoked, Claude re-attaches only its first 5,000 tokens on subsequent turns in the same session — anything past that boundary silently stops existing while the skill still reports as invoked.

⚠️ **Count tokens with a tokenizer; `bytes ÷ 4` is not a token count and on this corpus it manufactures breaches.** That divisor was prescribed here until 2026-09-12. This corpus averages **4.46 bytes per token** (`cl100k_base`), so the divisor over-reports by about **12%** — and more on denser files, which is the trap: `unhobble-instructions` runs 4.70 bytes/token and over-reported by 17%, so a ratio derived from one file generalises badly to the next. Measured across all 38 skills: **none exceed 5,000 real tokens**, while the estimate flags three — `haiku` at 5,566 against 4,837 real, `agent-setup` at 5,283 against 4,655, and `agent-setup` sat recorded as "marginally over" in a task doc on that basis. The error runs one way only, which is what makes it expensive: an inflated figure presents as a breach to fix rather than as a ruler to doubt, so the response is a real extraction pass against an imaginary overage, and the pass reports success either way.

```
python3 -c "import tiktoken,sys; print(len(tiktoken.get_encoding('cl100k_base').encode(open(sys.argv[1]).read())))" <file>
```

Bytes remain the right unit for prose density and for before/after deltas within one file. They are not the unit the ceiling is stated in, and converting between them is where the wrong number enters.

Two consequences follow:

**Position matters as much as size.** A guard, mode selection, or verification step that sits at the tail vanishes exactly when a session has run long enough to need it. Place structural checks, forks, and verify steps above the boundary; reference tables and catalogs below.

**An oversized skill costs its neighbours.** Re-attached skills share a 25,000-token budget filled most-recently-invoked first. Once that budget exhausts, older skills drop *entirely*. A session invoking five skills has room for roughly one at ceiling; trimming an oversized skill restores context for every neighbour, which justifies the edit even when that skill's own tail seems expendable.

## `allowed-tools` pre-approves, never restricts

The `allowed-tools` field waives permission prompts but does not prevent tool use — every tool stays callable whether listed or absent. Only `disallowed-tools` removes a tool. An unlisted tool appears blocked but isn't.

## The description is the complete trigger surface

The frontmatter `description:` field (capped at 1,536 characters including `when_to_use`) is matched against what users actually say — it is the entire routing surface. It should name the words users employ, the artifacts they mention, and edge cases that distinguish this skill from neighbours.

The description carries routing vocabulary, not enforcement logic: a boundary clause belongs here as the one phrase that routes a near-miss to another skill, while the reasoning behind that boundary lives in the body (which is not read until AFTER the skill has already fired). A description accumulating multiple negations (`Do NOT use for…`) usually stopped triggering better and merely grew longer — the body's constraint already expresses what those clauses try to enforce.

## Match constraint shape to operation fragility

Where several approaches are valid and context decides the right one, prose stating the mechanism lets a reader handle cases the session didn't anticipate. Where an operation is fragile or has to produce identical results every time, an exact command, path, or literal value is the deliverable — dissolving it into prose destroys precision, since a paragraph has nowhere to place a port number without becoming a table again.

The failure runs both ways. Converting a mechanism to judgment produces readers who handle new cases; converting a procedure to judgment produces readers who guess and fail silently.
