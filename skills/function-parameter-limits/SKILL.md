---
name: function-parameter-limits
description: >-
  Apply and enforce the function/method parameter-count best practice — 0 params
  is ideal, 1-2 is fine, 3 is the signal to stop and wrap arguments into an
  object/DTO, and 4+ almost always means the function is doing too much. Use this
  WHENEVER you are writing or reviewing a function with a growing argument list,
  when someone asks "how many parameters is too many", "should I wrap these into
  an object", "is this signature too long", or "add a lint rule for parameter
  count", and ESPECIALLY before adding a 4th positional argument (or a 2nd
  boolean/same-typed one) to any function. Also use it to set up an enforceable
  linter rule — ESLint `max-params` for TS/JS, PHPMD `ExcessiveParameterList`
  for PHP, Pylint for Python — with the right limit and the right carve-outs.
  Triggers on "too many parameters", "long parameter list", "parameter object",
  "introduce a DTO", "max-params", "this function takes too many args", "wrap
  these arguments", "lint rule for function arguments".
---

# Function Parameter Limits

A function's parameter count is one of the cheapest, highest-signal smells in code review. This skill states the rule, the reasoning, and the procedure to enforce it with a linter — avoiding the two traps that make naive enforcement backfire.

## The rule (and why)

| Count | Verdict | Why |
|-------|---------|-----|
| **0** | Ideal | Nothing to misorder; the function operates on already-bound state. Usually a sign of a well-focused method. |
| **1** | Fine | One input, one job. |
| **2** | Acceptable — but watch order | Two same-typed args (two IDs, two booleans, two dates) can be silently swapped at the call site. Readable, but the first place argument-order bugs appear. |
| **3** | Stop and wrap | The real cliff. Three args exceed what a reader holds in their head; comprehension cost more than doubles. Wrap related args into an object/DTO. |
| **4+** | Almost never positional | Treat as "the function is doing too much" OR "these args are really one concept." Extract a parameter object, split the function, or both. |

This isn't arbitrary — it's the consensus of the field:
- **Robert C. Martin, *Clean Code*** — names the counts niladic (0) / monadic (1) / dyadic (2) / triadic (3, "avoid") / polyadic (4+, "needs special justification, and then shouldn't be used anyway").
- **Martin Fowler, *Refactoring*** — "Long Parameter List" code smell → **Introduce Parameter Object**.
- **Steve McConnell, *Code Complete*** — the lenient ceiling at ~7, grounded in the brain holding ~7 chunks (Miller's Law).

The strict end (Martin/Fowler) gives you "wrap at 3"; the lenient end (McConnell) gives "~7 is the absolute max." Pick a limit between them based on the language (see below) — but the *guidance* you give while writing or reviewing code is always "3+ → consider a parameter object."

## When advising (writing or reviewing code)

When you hit a function with 3+ params, don't just flag the count — diagnose *why* and recommend the fitting fix:

- **Args that travel together** (`startDate, endDate` everywhere) → **Introduce Parameter Object** (`DateRange`). Bonus: behavior can later hang off the object (`range.contains(d)`).
- **Many optional settings** (common in TS/JS) → **options object**: `fn(required, { ...optionals })`. Order-independent, self-documenting, extensible without breaking callers.
- **Many required fields + immutability/validation** → **Builder** (Bloch, *Effective Java* Item 2) — kills the telescoping-constructor explosion.
- **2+ booleans or same-typed positionals** → loudest smell. A bare `book(customer, true, false)` is unreadable (Fowler's **Flag Argument** anti-pattern). Split into named methods (`premiumBook()`) or wrap so each value is labeled (`{ isPremium: true }`).

**Don't over-correct.** For a genuine 2-arg helper, an options object is pure ceremony. The threshold exists precisely so you wrap at 3, not at 2. Three similar lines beat a premature abstraction.

## When enforcing (adding a lint rule)

Same shape in every language; the tool and limit differ. Read the reference file for the project's stack:

| Stack | Tool | Reference |
|-------|------|-----------|
| TypeScript / JavaScript | ESLint `max-params` (already present in most projects) | `references/typescript.md` |
| PHP | PHPMD `ExcessiveParameterList` (usually a **new** dev dependency) | `references/php.md` |
| Python | Pylint `too-many-arguments` (R0913) | `references/python.md` |

High-level workflow (details + exact commands per stack in the reference):

1. **Pick the limit.** Match the language's ergonomics, not a single magic number. TS/JS call sites are unforgiving → flag at 4 (limit 3, mirroring the rule). PHP method signatures and DI tolerate more → flag at 6 (limit 5). When unsure, start lenient and tighten — a rule that flags 150 things on day one gets disabled.
2. **Measure the blast radius FIRST** with the real tool, before committing to a limit (see the two gotchas below). Choose `warn`/advisory over `error` when there are pre-existing violations, so you don't break the build on day one.
3. **Carve out what legitimately has many params** — chiefly DI constructors (next section).
4. **Verify**: run the linter, confirm the count matches your blast-radius measurement, do a boundary check (lower the limit by one → count must rise → restore), and confirm the carve-out actually excluded what it should.
5. **Wire it in advisory-first** — a manual script or a `warn`-level rule, not a blocking CI gate, unless the user asks for hard enforcement.

## Two gotchas that make or break enforcement

### 1. DI constructors legitimately have many params

In DI-heavy codebases (Laravel DDD Services/Actions, Spring, NestJS, Angular), a constructor taking 6+ injected collaborators is *idiomatic*, not a smell — same for data-carrier constructors (Mailables, Events, DTOs with many fields). A flat limit flags all of them as false positives and the rule gets ignored.

**Fix:** exclude constructors. If the linter can't (PHPMD's `ExcessiveParameterList` has no exclude-by-name), filter them out in the runner script (`grep -v` the constructor token) or pick a limit high enough that no constructor trips it. Per-stack references show the exact mechanism.

### 2. Verify blast radius with the real tool, never a line-oriented grep

A line-oriented `grep`/`rg` can't span newlines, so any signature written one-param-per-line returns a false zero — and DI constructors are almost always multi-line, so this undercounts by an order of magnitude.

**Fix:** measure with the actual linter (`eslint`, `phpmd`, `pylint`) — it parses an AST. If you must grep, use a multiline-aware flag and prove the count against the tool before trusting it.

## Output when invoked

- **Advisory request** ("is this too many?", "should I wrap these?"): state the count's verdict, name the *why*, and recommend the specific refactor (parameter object / options object / builder / split). One recommendation, not a survey.
- **Enforcement request** ("add a lint rule"): read the stack's reference file, measure the real blast radius, propose the limit + carve-out + severity, then implement and verify. Surface the blast-radius number and the boundary-check result so the user can trust the rule fires correctly.
