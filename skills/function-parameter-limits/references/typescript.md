# Enforcing parameter limits in TypeScript / JavaScript

Tool: **ESLint `max-params`** (built in — no new dependency). `typescript-eslint` inherits it.

## Key facts

- The rule is **off by default** in ESLint and even in most strict configs (Airbnb, Google TS) — you must enable it explicitly. `typescript-eslint`'s own documented default *limit* is 3 (flags the 4th param), which matches the "wrap at 3" rule exactly.
- It counts every parameter including a trailing options object, but an options object is *one* param — so `fn(a, b, { ...opts })` is 3, not 3+N. That's the point: wrapping collapses the count.
- It does **not** distinguish constructors. In TS/JS that's usually fine (class constructors with 4+ positional params are themselves a smell — prefer an options object or DI container), so unlike PHP you rarely need a constructor carve-out. If a framework (Angular, NestJS) injects many constructor deps, either accept the warnings or raise the limit.

## Procedure

1. **Find the config.** `.eslintrc.cjs` / `.eslintrc.json` (ESLint 8) or `eslint.config.js` (flat config, ESLint 9+).

2. **Measure blast radius before committing to a limit.** Run the rule via the project's real config so plugins/parser match:
   ```bash
   npx eslint <src-dir> --ext .ts,.tsx -f json 2>/dev/null \
     | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const r=JSON.parse(d);let n=0;for(const f of r)for(const m of f.messages)if(m.ruleId==="max-params")n++;console.log("max-params violations:",n)})'
   ```
   This uses the AST — trustworthy, unlike a grep.

3. **Add the rule.** Match the existing severity idiom in the config (if neighbors use `warn`, use `warn`):
   ```js
   "max-params": ["warn", { "max": 3 }],
   ```
   Use `warn` (not `error`) when there are pre-existing violations — `error` + lint-staged/CI would block commits until every one is refactored. `max-params` is not auto-fixable (no safe transform for "wrap these args"), so `warn` is correctly advisory.

4. **Verify** through the project config (no `--no-eslintrc`), confirming warnings not errors and the count matches step 2:
   ```bash
   npx eslint <src-dir> --ext .ts,.tsx -f json 2>/dev/null \
     | node -e '...count + severity...'   # warnings: N | errors: 0
   ```

5. **Boundary check** (proves the rule reads `max`): temporarily set `max: 2`, confirm the count rises, restore to 3.

## Refactor patterns for the flagged sites

- **Options object** (idiomatic, Google TS endorses it): `createUser(name, email, { role, isActive, notify })`. Define the shape as an `interface` with optional fields.
- **Parameter object** for cohesive args: `{ start, end }: DateRange`.
- **Discriminated config** when behavior branches: pass `{ mode: 'a' | 'b'; ... }` instead of multiple booleans.
- Avoid 2+ boolean positionals — they're the worst offender for argument-order bugs even below the limit.
