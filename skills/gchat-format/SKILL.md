---
name: gchat-format
description: >
  Convert Markdown or plain text into Google Chat-compatible formatting. Use this
  skill whenever the user wants to send a message in Google Chat, format a
  changelog/release note for Google Chat, convert a Markdown document for posting
  in Google Chat, or says anything like "format this for Google Chat", "convert to
  Google Chat", "post this in Chat", "gchat format", or "make this Chat-friendly".
  Google Chat has a limited, non-standard subset of Markdown -- this skill ensures
  correct output every time. NOT for composing a message in the sender's own voice
  to a named person or small group -- a WhatsApp reply, a quick DM, "tell X that..."
  -- even when the destination is Google Chat: that's `casual-message`.
---

# Google Chat Formatter

Convert Markdown or plain text into Google Chat's formatting syntax.

## Whose thread is this? Settle standing before drafting

A Chat message lands in a thread with an existing power structure, and the draft encodes an assumption about where the sender sits in it. Getting that wrong produces text that is well-formed, on-topic, and still wrong to send: it assigns work to people who don't report to the sender, @-mentions one of them with an action item, or closes out a discussion that isn't the sender's to close.

The common case is a vendor or support engineer answering into a **customer's** internal thread. There, the participants are coordinating among themselves and the sender is a guest: state what the product does and what was found, then leave the decision with them, and where a fix touches their data or their tenant, offer rather than direct. Reverse the posture and it reads as the vendor running their operations.

Ask who the participants are to the sender before drafting, not after a rejected draft. A draft that tells a named person on the other side what to do, or ends with a summary block closing out their conversation, has the standing wrong.

## Is this a document, or a message in your own voice?

Settling standing answers who receives this. It does not answer how dressed-up it should be, and those are different axes — conflating them is why this section exists. A correct "client" audience answer still produced a fenced, headed, formally-closed draft for a one-line reply to a single named colleague, and the shape was the thing that was wrong.

If the ask is "reply to X", "tell Y that…", or a message in the sender's own words to a named person, that's `casual-message`, not this skill. Hand off **before** drafting rather than after producing a document that gets rejected. This skill's shape — fence, bold headers, structured bullets, formal close — is for something that exists independently of who reads it.

## Release notes: shape the content BEFORE formatting

When the input is a **release note / deployment announcement** (not already-final prose the user just wants reformatted), the Chat version is a short user-facing announcement, not a work log. Get to the point:

| ❌ NEVER include | ✅ Keep only |
|------------------|-------------|
| HOW it works (mechanics, counts, prefixes, backfill numbers, verification steps) | WHAT changed, in one line, and why it matters to a user |
| Deployment/ops steps ("Deployed to staging", "applied policy", "ran backfill") | A single status line IF relevant (e.g. "On staging for testing") |
| "Still to come" / "outstanding" / caveats / data-integrity notes | — |
| Multiple sections for one shipped thing | One outcome = 1-3 lines total |

A staging-only change is at most a one-line "on staging for testing" note — it is not a full release announcement. Lead with the outcome a non-engineer reads; delete everything explaining the underlying implementation. When unsure how terse, err shorter and offer a one-liner variant.

Regroup by feature instead of inheriting the source's `Added`/`Fixed` split. Those headings sort by what the change did to the code, so one feature lands in multiple sections while unrelated items sit as equals — the reader gets a flat list with no way to see what the release actually IS. Restructure to lead with a short prose sentence about what a user can now do and what they couldn't before, then group the main feature's items together (whichever heading they came from), then demote everything unrelated under a catch-all. A bug that reads as "this feature now works" goes under the feature, not beside it.

If the source gives no before-state (a changelog rarely does), ask for it or pull it from the task doc — that contrast is what makes the rest legible. A note that opens with a bullet instead of a sentence, with every item at the same level, signals that the regroup didn't happen.

Before delivering a condensed release note, count the distinct shipped items in the source (each `###`-level bullet under Added/Changed/Fixed, per repo if multi-repo) and count the bullets in the condensed output. A lower count is expected only if items were deliberately merged as near-duplicates or cut as a caveat/ops-step per the table above — if a genuine shipped item is simply missing, the condense went too far. Re-scan the source once before sending.

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

**Wide tables (4+ columns):** do NOT cram all column values into one comma-separated line -- it becomes unreadable. Make the first column a **bold label line with no bullet marker**, and give each remaining column its own sub-line prefixed with a dash:
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

Google Chat renders a `*` as a bullet **only when it is the first character of the line** — any leading whitespace converts it to a literal asterisk. Do not indent bullets to create nesting (`   * Platform fee` renders as literal text, not a nested bullet). The label-line + dash-sub-line pattern above is the only reliable way to show multiple values under a parent. If the wide table has many rows, offer a trimmed version (e.g. totals only, or top N rows).

This same pattern applies to any parent-with-sub-values structure, such as a feature-comparison row: bold the parent as a plain line, then dash each sub-value under it.

Use `*bold*` for labels and column headers, never `_italic_`. Italic is only for prose text that was explicitly italic in the source.

### Em dashes
⚠️ **NEVER output an em dash (`—`) in the converted result.** This applies to both Claude-generated prose and converted source content.

Strip all em dashes from the source, both the Unicode `—` (U+2014) and ASCII `--` forms:

```
*Label* — description     ->  *Label*: description
*Label* -- description     ->  *Label*: description
sentence — continuation   ->  sentence, continuation
sentence -- continuation   ->  sentence. Continuation
```

After a bold label: replace with `:`. In flowing prose: use a comma, full stop, or colon, whichever the sentence actually wants.

⚠️ **Substituting a single ASCII hyphen for an em dash does not satisfy this.** What reads as an em dash to the person reviewing the draft is the *clause break*, not the character, so `sentence - continuation` is the same output with a narrower glyph and gets rejected the same way. A hyphen is only correct inside a compound modifier (`14-day`, `send-date`), where it isn't punctuating a clause. **Tell: the dash has a space on both sides** — that's a clause break needing a comma or a full stop, not a shorter dash.

### Unsupported -- remove or simplify
- `---` horizontal rules -> remove entirely
- HTML tags -> strip or convert to plain text
- Nested bold-italic combinations -> use just `*bold*` or `_italic_`
- Em dashes (`—` or `--`) -> see Em dashes section above

## Output Format

Wrap the entire output in a triple-backtick code fence by default, regardless of copy method — this is the default state; only omit it if the user explicitly asks for no fence. A prior version of this skill defaulted to no fence, reasoning that `/copy` reads raw source, but the user reverted that — don't reintroduce it. The fence is your final output container — anything you want to say to the user (caveats, "I trimmed the wide table", offers to reformat) goes above it, and nothing follows the closing backticks. Text after the fence reads as part of the message to paste, because the fenced content often ends on its own `Note:` line and the boundary is invisible to the reader. Label the fence so its extent is explicit ("copy everything inside the fence below, nothing outside it").

Within the fence:
- Strip inner inline backticks (`` `staging.dourr.com` `` becomes plain text) — Chat does not nest inline code inside a code block, so backticks render as literal characters.
- Preserve blank lines between sections
- Keep emojis as-is

## See Also

📖 `references/example-release-note.md` — a full changelog-to-Chat transformation showing the regroup-by-feature restructure, syntax conversion, and fencing applied together.
