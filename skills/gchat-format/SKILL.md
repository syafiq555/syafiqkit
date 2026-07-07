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

**Wide tables (4+ columns):** do NOT cram all column values into one comma-separated line -- it becomes unreadable. Instead, make the first column a bold top-level bullet, and give each remaining column its own indented sub-bullet as `column header: value`.
```
| Agency | Platform fee | Gateway fee | Net now | Impact |
|--------|-------------:|------------:|--------:|-------:|
| Acme   | 771.45       | 75.00       | 673.45  | -RM 10 |

->

* *Acme*
   * Platform fee: 771.45
   * Gateway fee: 75.00
   * Net now: 673.45
   * Impact: -RM 10
```
Note: Google Chat does not render true nested indentation -- indented sub-bullets display as flat bullets with a small leading space, which is still far more scannable than one long comma-separated line. If the wide table has many rows, offer a trimmed version too (e.g. totals only, or top N rows).

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

- Wrap the entire output in a single code block (` ``` `) so the user can copy raw markdown syntax -- not rendered text
- This is critical: if output is not in a code block, Claude's UI renders `*text*` as italic, and copy-pasting into Google Chat will lose the asterisks
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

**Output:**
````
```
*Release - 2026-03-27*

*Added*
* *Platform fee invoices*: auto-generated when tenants pay rent
* Batch generation command (`platform-fees:generate`)

*Changed*
* Statements sidebar replaced by Finances group
```
````
