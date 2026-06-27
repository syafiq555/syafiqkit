# Enforcing parameter limits in Python

Tool: **Pylint `too-many-arguments` (R0913)**. Usually already available if the project uses Pylint; otherwise `pip install pylint` (dev dependency).

## Key facts

- Pylint's default for `max-args` is **5** (flags the 6th argument). Looser than the TS "3", similar to the PHP recommendation.
- Configure in `pyproject.toml`, `setup.cfg`, or `.pylintrc`:
  ```toml
  [tool.pylint.design]
  max-args = 5
  ```
- `self` / `cls` are counted by older Pylint versions but ignored by recent ones — verify against your version with a known 6-arg method.
- Python's first-class **keyword-only arguments** (PEP 3102, the `*` separator) and **defaults** mean many "parameters" don't hurt call-site readability the way positional ones do. A function with 3 positional + 4 keyword-only-with-defaults is far more readable than 7 positional. Weigh that before flagging — the count alone is a blunt instrument here.
- Dataclasses / `attrs` / Pydantic models with many fields are the Python equivalent of the DI-constructor false positive. Their `__init__` is generated, so Pylint usually doesn't flag it — but a hand-written `__init__` with many params will trip R0913. Exclude via an inline `# pylint: disable=too-many-arguments` on the class, or raise the limit, rather than contorting the model.

## Procedure

1. **Measure blast radius with the tool** (not grep — Python signatures wrap across lines too):
   ```bash
   pylint <package>/ --disable=all --enable=too-many-arguments 2>/dev/null | grep -c 'R0913'
   ```

2. **Set the limit** in `pyproject.toml` under `[tool.pylint.design]` (`max-args`). Start at the default 5 unless the team wants stricter.

3. **Verify + boundary check:** re-run the count; temporarily set `max-args = 4`, confirm it rises, restore.

4. Prefer **keyword-only arguments** (put a bare `*` before the optional ones) and **dataclasses** as the refactor for flagged functions — they reduce positional-argument-order risk without fighting the count.

## Refactor patterns

- **Dataclass / Pydantic model** for cohesive args that travel together — the Pythonic parameter object.
- **Keyword-only with defaults** (`def f(a, b, *, timeout=30, retries=3)`) — callers pass only what they need, order-independent.
- Avoid 2+ boolean positionals — same argument-order hazard as every other language.
