---
name: gchat-format
description: >
  Convert Markdown or plain text into Google Chat-compatible formatting. Use this
  skill whenever the user wants to send a message in Google Chat ("send this to the
  team", "post it in <space>", even a document already drafted), format a
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

The draft encodes where the sender sits in the thread's power structure. Wrong standing gives text that is well-formed and on-topic but still wrong to send: it assigns work to people who don't report to the sender, @-mentions one with an action item, or closes a discussion that isn't theirs to close.

Common case: a vendor or support engineer answering into a **customer's** internal thread, where the sender is a guest. State what the product does and what was found, leave the decision with them, and offer rather than direct where a fix touches their data or tenant. Reversed, it reads as the vendor running their operations.

When the readers are the client, `casual-message` § Speaking for the sender and § Replying to their message hold in a document too: each question carries the sender's suggestion so "ok" answers it, with wording varied across questions ("Will you be able to …?" only for what they must do). The team's build state stays out: work they paid for is described by when it applies, never as built or "switched on". An internal release note to the sender's own team keeps its build detail.

Ask who the participants are before drafting, not after a rejected draft. A draft that tells a named person on the other side what to do, or closes out their conversation, has the standing wrong.

Inside the sender's own team, an `@` tag asking a colleague to act (check billing, approve, decide) goes in only when the user's request named that ask; an ask you inferred goes above the fence as an offer. An edit removes the line but not the notification it sent (23/11/2026, a billing tag on a guessed cause; read references/incidents.md#guessed-billing-tag before tagging anyone the request did not name). **Tell: the draft tags someone with a request that appears nowhere in the user's words.**

## Is this a document, or a message in your own voice?

Standing says who receives the text; this section asks how dressed-up it should be. Those are separate axes, and a correct "client" answer still produced a fenced, headed draft for a one-line reply.

A "reply to X", "tell Y that…", or a message in the sender's own words to a named person is `casual-message`, not this skill: hand off **before** drafting. This shape (fence, bold headers, bullets, formal close) fits something that exists independently of who reads it, such as a client-group post that answers findings and asks several questions, numbered questions included, in the sender's voice. A findings reply into a team thread takes this shape too: several messages, each under a `**heading**`, every bullet a full sentence on what the figure means (26/11/2026: casual prose and short bullets were refused, references/incidents.md#findings-reply-shape). `casual-message` carries the same boundary.

⚠️ **When the user invokes this skill by name for a colleague's reply, it supplies the syntax and the fence; `casual-message` still supplies the content.** Read a typed `/gchat-format` as a request for the syntax, not the shape, or the reply comes out as a document: a reason under every point, the question restated, a closing plan. Load `casual-message` and write to its rules (the answer and the sender's lean, one line a point, nothing the recipient already said), then convert here. A point still says what it means for the reader: it states what the draft says against what the system does, or what the choice changes for the user, inside the one line. A bare label ("3.1 Advanced") is as unreadable as a padded reason. Measured 2026-10-14 and 2026-10-21, in both directions: read references/incidents.md#shape-calibration before settling the shape of a colleague reply. Figures per case keep a bold label per case and a `- ` line per figure (`casual-message/references/structured-messages.md#figures-per-case`). **Tell: the slash command was this skill and the recipient is one named person or a small group, and the draft answers one point.**

A bare invocation on your own last answer (steps, an explanation) is a message too, since the sender will post it to colleagues: take the voice from their messages in the session and the shape from `casual-message`.

**An "update group" or "update the team" ask is a document, not that reply.** It names the group, not a person whose message is being answered: a new top-level post with a bold title line, bold section labels and `- ` items, shaped like the sender's earlier update posts there, even when the topic grew from an older thread. Post inside the thread only when the user says reply (20/11/2026: a lowercase thread reply was refused at send, references/incidents.md#update-group-in-thread). **Tell: the ask names the group, and your draft is lowercase prose aimed at a thread.**

**Any post, edit or reply that names a file (a deck, doc, sheet or recording) carries its link, when its readers are meant to open it.** "Shared with the company" does not make a file findable. Take the id from the task doc, the upload result or the owner's link; failing those, search Drive and match on the id, or ask the sender, never build a URL by hand. Check it opens for the readers the way `casual-message` § Speaking for the sender does, and ask before widening sharing. In a client post, internal files (a costing, a build reference, a task doc) are not linked: link a client copy or say it is available on request (26/11/2026: a checkpoint post named a deck with no link, references/incidents.md#file-link-client-post). **Tell: the draft mentions a file and holds no URL.**

## Release notes: shape the content BEFORE formatting

⚠️ **Where the note is going has usually answered the shape question already.** A destination that has carried release notes before (a tracker list, a Chat space, a wiki page) holds prior entries that set length, structure and voice, and they override every default here, including the bias toward brevity. **Open the latest entry at the destination before drafting, and match what it does**, latest by date, not title, since names drift. A format the project's own instructions write down for that destination outranks both the entries and these defaults when `ship` or another skill sends you here. Entries set length, structure and voice, never whether to format: when the user invoked this skill by name and the space's earlier posts are plain text, the user is asking for the formatting those posts lack, so bold the headings and make the lists real. Measured 2026-09-21: a condensed note was rejected beside 68 verbatim entries (references/incidents.md#destination-entries). **Tell: you are about to draft for a destination whose existing entries you have not opened.**

**A release note about a changed screen goes out with captures of the built screen**, phone and desktop, each opened first, attached to the post or sent as a reply in its thread, also when drafted outside `ship` and sent through a Chat send tool (`ship`'s `references/ship-deploy-verification.md` § Release Captures). **Tell: the note names a screen and your send call carries no files.**

A **release note or deployment announcement** (not final prose the user only wants reformatted) becomes a short user-facing announcement, not a work log:

| ❌ NEVER include | ✅ Keep only |
|------------------|-------------|
| HOW it works (mechanics, counts, prefixes, backfill numbers, verification steps) | WHAT changed, in one line, and why it matters to a user |
| Deployment/ops steps ("Deployed to staging", "applied policy", "ran backfill") | A single status line IF relevant (e.g. "On staging for testing") |
| "Still to come" / "outstanding" / caveats / data-integrity notes | - |
| Multiple sections for one shipped thing | One outcome = 1-3 lines total |

Lead with the outcome a non-engineer reads; delete everything explaining the underlying implementation.

**Length follows what shipped, never which environment it shipped to.** A staging deploy of one fix is a one-line note; a staging deploy of ten days' work is not. Size the note from the source: a handful of items compresses to a few lines, sixty items does not compress to sixteen. Where the deploy is large, the environment is one clause at the top ("now on staging"), not a reason to summarise the body away.

⚠️ **Terseness is the instruction this section can't help over-applying.** The first specifics cut are the ones that made each item land (the figure, the affected count, the before-state), since they look like the "mechanics" the table bans. A count of who was affected is *what changed*, not *how it works*. Measured 2026-09-21: sixty items cut to forty-six bullets, 3,507 words to 1,210, was rejected (references/incidents.md#terseness-sixty-items). **When the source is long, draft at the source's own level of detail and cut only what the ❌ column names.** **Tell: your draft's word count is under half the source's and you reached that by trimming detail rather than by merging duplicates.**

Regroup by feature, not the source's `Added`/`Fixed` split, which scatters one feature across sections. Lead with a prose sentence on what a user can now do that they couldn't before, group the feature's items together (whichever heading they came from), and demote unrelated items under a catch-all. A bug that reads as "this feature now works" goes under the feature. A changelog rarely gives the before-state: ask for it or pull it from the task doc. A note opening with a bullet, every item at one level, means the regroup didn't happen (worked example: references/example-release-note.md).

Before delivering a condensed release note, count the distinct shipped items in the source (each `###`-level bullet under Added/Changed/Fixed, per repo if multi-repo) and the bullets in the output. A lower count is expected only for items deliberately merged as near-duplicates or cut as a caveat or ops step per the table above; a genuine shipped item missing means the condense went too far. Re-scan the source once before sending.

### Progress and milestone posts to a team

**A progress or celebration post to a team is the team's news, so it credits the team, never "my cards".** Lead with what the team reached, group by area of the product rather than owner, and keep any ask neutral, naming nobody to chase it. A post listing only the sender's work with a thank-you tacked on reads as self-promotion however accurate it is (19/11/2026: a "my cards" post was refused; the same facts grouped by area went out, references/incidents.md#my-cards-post).

**Credit is per item, and a tool is never the maker.** A post can thank a teammate in its opening line and still claim their piece further down, by naming the tool that touched it ("films are made with motion-clip") rather than the person who made it. The general thank-you reads as the credit done, so nothing stops the item line. For each item, ask who made its source material and name them; the sender's part is the polish or assembly. A how-to for the same team also skips setup its readers already run, such as a tool or plugin everyone has installed. Measured 28/11/2026: a TikTok how-to credited a film to motion-clip while a teammate had made it in Higgsfield ("i just polish here and there"), and walked through installing a plugin the team already used ("they already knew them"). **Tell: an item line names a tool or skill as its subject and no person.**

### Work not shipped: research, a plan, a proposal

**A post about work nothing shipped explains the situation and what was done; it never reads as decided.** Say what was found (quoting the spec or requirement lines that ask for it), what was done (research, a plan, where it lives), and list every row or card written under a teammate's name in full so they can change it. Open with "nothing confirmed yet" where true, and keep the sender's caveats in their words. A `Decided` heading over a proposal commits the team (19/11/2026: a plan post drafted as `Decided` was turned back four times, references/incidents.md#plan-post-decided).

## Key Rules

⚠️ **Where the text goes decides the syntax, and the two Chat routes disagree on `*`.** The rules below are for text **pasted into the Chat app's composer** (the clipboard route), where `*text*` is bold. Text **posted through an API or MCP send tool** (`message_send`, `message_edit`) is read as Markdown: `**text**` is bold, `*text*` renders *italic*, each list item is its own line starting `- `, and a typed `•` runs its lines together. Two plain lines separated only by a line break also join into one paragraph (17/11/2026, references/send-tool-route.md#line-breaks). So on that route a multi-point post puts its points as `- ` items under each `**heading**`, with a blank line only between sections (list items and code blocks keep their own lines); a blank line after every plain line leaves white space (22/11/2026, same reference). Prose stays prose, and lines that must read as a pair (Before / Now) or a numbered list keep a blank line between them. Keep each message within the send tool's limit (about 1,000 characters), split at section boundaries and shown before approval. Write headings and labels as `**bold**`, bullets as `- `, links as bare URLs, and pass the text without the code fence § Output Format asks for, since the fence posts literal backticks. The other conversions (tables to label lines, no em dashes) still apply on this route. Measured 14/11/2026, references/send-tool-route.md#asterisk-headings. **Tell: your next step after formatting is a send tool call, and the text holds a single-asterisk heading.**

The clipboard route needs these conversions:

### Headers -> Bold text
All `#` headers become `*bold*`, with the `#` removed.

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
_text_     ->  _text_    (unchanged)
*text*     ->  _text_    (only if it was italic, not bold)
```

After converting bold, any remaining single-asterisk italic becomes `_text_`. Italic is only for prose that was explicitly italic in the source.

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

WhatsApp takes `- item` instead, and every other conversion here holds there (`casual-message` § Syntax). Numbered lists (`1.`, `2.`) stay as-is.

### Inline code & code blocks
Stay unchanged: Chat supports `` `inline` `` and ` ```blocks``` `.

### Links
```
[text](url)              ->  <url|text>
https://bare-url.com     ->  unchanged (auto-linked by Chat)
```

### Block quotes
`> text` stays unchanged, since Chat supports it.

### Tables -> Bullet list with bold labels
Tables are not supported in Google Chat. Each row becomes a bullet with its first column as `*bold*`.

**Narrow tables (≤3 columns):** each row stays one inline bullet.
```
| Field      | Required | Notes       |
|------------|----------|-------------|
| First Name | Yes      | Tenant name |

->

* *First Name*: Yes, Tenant name
```

**Wide tables (4+ columns):** never comma-join the values, since that is unreadable. Make the first column a **bold label line with no bullet marker**, and each remaining column a dash sub-line:
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

Chat renders `*` as a bullet **only as the line's first character**, so never indent bullets to nest. The label line plus dash sub-lines is the only reliable way to show several values under a parent, so it also serves any parent-with-values row. Many rows: offer a trimmed version (totals, or top N). Labels and column headers are `*bold*`, never `_italic_`.

### Em dashes
⚠️ **NEVER output an em dash (`—`) in converted output**, from the source or from your own prose. Strip the Unicode `—` and the ASCII `--` alike:

```
*Label* — description     ->  *Label*: description
*Label* -- description    ->  *Label*: description
sentence — continuation   ->  sentence, continuation
sentence -- continuation  ->  sentence. Continuation
```

After a bold label, use `:`. In prose, use a comma, full stop or colon, whichever the sentence wants.

⚠️ **A single hyphen with spaces on both sides is the same clause break, so it is not a fix.** What reads as an em dash is the clause break, not the glyph, so `sentence - continuation` gets rejected the same way. A hyphen belongs only in a compound modifier (`14-day`, `send-date`). **Tell: the dash has a space on both sides**: that is a clause break needing a comma or a full stop, not a shorter dash.

### Unsupported -- remove or simplify
`---` rules, HTML tags and nested bold-italic (use `*bold*` or `_italic_`) are removed or simplified; em dashes follow the section above.

## Output Format

**When the destination is an email, not Chat, write plain text** (the conversions are in references/send-tool-route.md#email). The fence, em-dash ban and shape rules still apply: say in one line above the fence that it is plain text for email (2026-10-27, a client review email).

Wrap the entire output in a triple-backtick code fence by default, whatever the copy method. Omit it only when the user explicitly asks for no fence; a prior default of no fence was reverted by the user, so don't reintroduce it. The fence is the final output container: caveats and offers go above it, and nothing follows the closing backticks, since text after the fence reads as part of the message to paste. Label it so its extent is explicit ("copy everything inside the fence below, nothing outside it").

Within the fence: strip inner inline backticks (Chat renders them literally inside a code block), keep blank lines between sections, keep emojis.

## See Also

📖 `references/example-release-note.md`: a changelog-to-Chat transformation showing the regroup, syntax conversion and fencing together.
📖 `references/incidents.md`: the dated case behind each rule that names one; open the anchor the rule gives.
📖 `references/send-tool-route.md`: line breaks on the send-tool route, for a multi-point post sent through `message_send`.
