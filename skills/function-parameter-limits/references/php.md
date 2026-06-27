# Enforcing parameter limits in PHP

Tool: **PHPMD `ExcessiveParameterList`**. Usually a **new dev dependency** — most Laravel projects ship only Pint (a formatter, no metrics rule) and sometimes PHPStan (which can't do this cleanly and is often banned for false-positiving on Eloquent statics).

## Key facts

- `composer require --dev "phpmd/phpmd:^2.15"`. Vendors `vendor/bin/phpmd`. PHP `^8.1` is compatible. A `phpmd/phpmd` line in `composer.lock` is often transitive metadata of another package — confirm with `test -f vendor/bin/phpmd`, don't assume it's installed.
- `ExcessiveParameterList` fires when param count **≥ `minimum`**. So `minimum=6` flags methods with 6+ params (an acceptable "limit 5").
- **It cannot exclude by method name** — there's no `exclude-method` property. This matters because DI constructors will dominate the hits (see below).
- Pull in **only** this one rule, not PHPMD's full `codesize.xml`/`cleancode.xml` rulesets — those flood the project with unrelated findings.
- Recommended PHP limit: flag at **6** (`minimum=6`), looser than the TS "3". PHP method signatures and DI tolerate more args, and a stricter limit fights idiomatic controller/Action code.

## The constructor problem (the whole reason PHP is different)

In Laravel DDD, Services/Actions constructor-inject 4+ collaborators, and Mailables/Events/report-DTOs carry many promoted properties — all idiomatic, all flagged by `ExcessiveParameterList`. On a real codebase this can be ~half the hits. You must exclude constructors, and since the ruleset can't, do it in the runner script.

## Procedure

1. **Install:** `composer require --dev "phpmd/phpmd:^2.15"`, then `test -f vendor/bin/phpmd`.

2. **Measure blast radius with the real tool** (NOT a grep — multi-line constructor signatures defeat single-line regex):
   ```bash
   ./vendor/bin/phpmd app/ text <ruleset.xml> 2>/dev/null | grep -c 'ExcessiveParameterList'
   # split constructors vs methods:
   ./vendor/bin/phpmd app/ text <ruleset.xml> 2>/dev/null | grep 'ExcessiveParameterList' | grep -c '__construct'
   ```

3. **Create a minimal ruleset** `phpmd.xml` at repo root:
   ```xml
   <?xml version="1.0"?>
   <ruleset name="Project PHP rules"
            xmlns="http://pmd.sf.net/ruleset/1.0.0">
       <description>Parameter-count guard. Flags methods with 6+ params. Constructors excluded in the lint script.</description>
       <rule ref="rulesets/codesize.xml/ExcessiveParameterList">
           <properties>
               <property name="minimum" value="6"/>
           </properties>
       </rule>
   </ruleset>
   ```

4. **Add a composer script** that excludes constructors and strips PHP 8.4 vendor deprecation noise. **Composer scripts run under `/bin/sh`, not bash** — use POSIX pipes only (no process substitution `>(...)`, no `[[ ]]`, or you get `syntax error near unexpected token`):
   ```json
   "lint:php": "phpmd app/ text phpmd.xml 2>&1 | grep -v 'Deprecated:' | grep 'ExcessiveParameterList' | grep -vE 'method __construct ' || echo 'lint:php — no method param-count violations'"
   ```
   - `2>&1 | grep -v 'Deprecated:'` — strips the known PHP 8.4 "implicitly nullable" notices coming from inside pdepend/phpmd vendor code, while letting real phpmd errors through (better than `2>/dev/null`, which masks a broken ruleset and produces a false "clean").
   - `grep -vE 'method __construct '` — the constructor carve-out, anchored to the method-name token (the trailing space prevents matching `__constructProxy`). A bare `grep -v '__construct'` is a loose substring match.
   - `|| echo` — reports success on a clean run and avoids a non-zero exit from `grep` finding nothing (this is advisory, not a blocking gate).

5. **Verify:** `composer lint:php` — confirm the method count matches step 2's "total minus constructors", and that zero `__construct` lines survive. Boundary-check by running phpmd against a temp ruleset with `minimum=5` (count must rise), then leave `phpmd.xml` at 6.

6. **Document** the rule in the project's `app/CLAUDE.md` (or equivalent): what it flags, that constructors are excluded and *where* (the script, not the ruleset), and that a "no violations" echo doesn't by itself prove phpmd ran — re-run `./vendor/bin/phpmd app/ text phpmd.xml` directly if a clean result is surprising.

## Refactor patterns for the flagged methods

- A 6+ param method that recurs (e.g. the same `calculateTax(Property, ?Room, float, array, ?bool, ?float)` in two services) is the prime **Introduce Parameter Object / DTO** candidate — a single context DTO clears the violation *and* the duplication.
- Prefer typed DTOs/value objects over associative arrays for the wrapper — keeps static analysis and IDE help working.
