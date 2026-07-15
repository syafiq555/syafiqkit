---
name: gchat-format
description: >
  Convert Markdown or plain text into Google Chat-compatible formatting. Use this
  skill whenever the user wants to send a message in Google Chat, format a
  changelog/release note for Google Chat, convert a Markdown document for posting
  in Google Chat, or says anything like "format this for Google Chat", "convert to
  Google Chat", "post this in Chat", "gchat format", or "make this Chat-friendly".
  Google Chat has a limited, non-standard subset of Markdown -- this skill ensures
  correct output every time.
---

# Google Chat Formatter

Convert Markdown or plain text into Google Chat's formatting syntax.

## Release notes: shape the content BEFORE formatting

When the input is a **release note / deployment announcement** (not already-final prose the user just wants reformatted), the Chat version is a short user-facing announcement, not a work log. Get to the point:

| ❌ NEVER include | ✅ Keep only |
|------------------|-------------|
| HOW it works (mechanics, counts, prefixes, backfill numbers, verification steps) | WHAT changed, in one line, and why it matters to a user |
| Deployment/ops steps ("Deployed to staging", "applied policy", "ran backfill") | A single status line IF relevant (e.g. "On staging for testing") |
| "Still to come" / "outstanding" / caveats / data-integrity notes | — |
| Multiple sections for one shipped thing | One outcome = 1-3 lines total |

A staging-only change is at most a one-line "on staging for testing" note — it is not a full release announcement. Lead with the outcome a non-engineer reads; delete everything explaining the underlying implementation. When unsure how terse, err shorter and offer a one-liner variant.

⚠️ **Completeness check before delivering**: count the distinct shipped items in the source (each `###`-level bullet under Added/Changed/Fixed, per repo if multi-repo) and count the bullets in your condensed output. If the output has fewer, that's expected only if you deliberately merged near-duplicates or cut a caveat/ops-step per the table above — if a genuine shipped item is simply missing, you condensed too aggressively and silently dropped real content. Re-scan the source once before sending.

## Key Rules

Google Chat does NOT support standard Markdown fully. Apply these transformations:

### Headers -> Bold text
All `#` headers become `*bold*`. Remove the `#` symbols entirely.

```
# Title        ->  *Title*
## Section     ->  *Section*
### Sub        ->  *Sub*
```

### Bold
```
**text**   ->  *text*
__text__   ->  *text*
```

### Italic
```
*text*     ->  _text_    (only if it was italic, not bold)
_text_     ->  _text_    (unchanged)
```

> After converting bold, remaining `*text*` that was italic should become `_text_`.

### Strikethrough
```
~~text~~   ->  ~text~
```

### Bullet lists
```
- item     ->  * item
* item     ->  * item
+ item     ->  * item
```

Numbered lists (`1.`, `2.`) stay as-is.

### Inline code & code blocks
Stay unchanged -- Google Chat supports both `` `inline` `` and ` ```blocks``` `.

### Links
```
[text](url)              ->  <url|text>
https://bare-url.com     ->  unchanged (auto-linked by Chat)
```

### Block quotes
```
> text     ->  > text    (unchanged, Chat supports this)
```

### Tables -> Bullet list with bold labels
Tables are not supported in Google Chat. Convert each row to a bullet, with the first column always as `*bold*`.

**Narrow tables (≤3 columns):** keep each row as a single inline bullet.
```
| Field     | Required | Notes       |
|-----------|----------|-------------|
| First Name | Yes     | Tenant name |

->

* *First Name*: Yes, Tenant name
```

**Wide tables (4+ columns):** do NOT cram all column values into one comma-separated line -- it becomes unreadable. Instead, make the first column a **bold LABEL LINE with NO bullet marker**, and give each remaining column its own sub-line prefixed with a `-` dash as `column header: value`.
```
| Agency | Platform fee | Gateway fee | Net now | Impact |
|--------|-------------:|------------:|--------:|-------:|
| Acme   | 771.45       | 75.00       | 673.45  | -RM 10 |

->

*Acme*
- Platform fee: 771.45
- Gateway fee: 75.00
- Net now: 673.45
- Impact: -RM 10
```
⚠️ **NEVER indent a `*` bullet to fake nesting** (`* *Acme*` parent + indented `   * Platform fee` children). Google Chat bullet-izes a `*` ONLY when it is the first character of the line — a `*` with any leading whitespace is NOT rendered as a bullet, it leaks as a **literal asterisk** on a flat line, producing ragged "• Acme / * Platform fee" output. Chat has no nested-bullet support to degrade into. The label-line + `-` sub-line shape above is the ONLY reliable multi-value row. (Same applies to grouping ANY parent-with-sub-values, e.g. a feature-comparison row with two values: bold the parent as a plain line, dash the values under it.) If the wide table has many rows, offer a trimmed version too (e.g. totals only, or top N rows).

> Label columns (first column of a table row, and each sub-bullet's column header) must ALWAYS use `*bold*`, not `_italic_`.
> Italic (`_text_`) is only for prose text that was explicitly italic in the source -- never for labels, field names, or headings.

### Em dashes
⚠️ **NEVER output an em dash (`—`) in the converted result.** This applies to both Claude-generated prose and converted source content.

Strip all em dashes from the source — both the Unicode `—` (U+2014) and ASCII `--` forms:

```
*Label* — description     ->  *Label*: description
*Label* -- description    ->  *Label*: description
sentence — continuation   ->  sentence - continuation
sentence -- continuation  ->  sentence - continuation
```

After a bold label: replace with `:`. In flowing prose: replace with `-`. Never leave an em dash in the output.

### Unsupported -- remove or simplify
- `---` horizontal rules -> remove entirely
- HTML tags -> strip or convert to plain text
- Nested bold-italic combinations -> use just `*bold*` or `_italic_`

## Output Format

- Wrap the entire output in a single ` ``` ` code block by default -- this is the default regardless of copy method (`/copy` or manual select-from-screen). A prior version of this skill defaulted to no fence reasoning that `/copy` reads raw source, but the user reverted that -- always fence unless told otherwise.
- ⚠️ When fencing the whole output, STRIP inner inline backticks (`` `staging.dourr.com` `` -> `staging.dourr.com`) -- Chat does not nest inline code inside a code block, so they render as literal `` ` `` characters.
- Only omit the fence if the user explicitly asks for no fence.
- Preserve blank lines between sections
- Keep emojis as-is

## Example

**Input:**
```markdown
**Release — 2026-03-27**

### Added
- **Platform fee invoices** — auto-generated when tenants pay rent
- Batch generation command (`platform-fees:generate`)

### Changed
- Statements sidebar replaced by Finances group
```

**Output** (fenced by default -- see Output Format):

```
*Release - 2026-03-27*

*Added*
* *Platform fee invoices*: auto-generated when tenants pay rent
* Batch generation command (platform-fees:generate)

*Changed*
* Statements sidebar replaced by Finances group
```
