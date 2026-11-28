# Send-Tool Route

Open this before posting a multi-point message through a Chat send tool, where line breaks render differently from the composer, or before writing one as an email. The route rules themselves stay in SKILL.md under Key Rules.

## Line breaks on the send-tool route {#line-breaks}

17/11/2026: a release post's "Before:" and "Now:" lines arrived as one paragraph, and an edit with the same single break didn't fix it.

22/11/2026: a release post written that way came back as "must we have alot of white spaces in the middle?", and the same text edited into bullets under each heading was accepted.

## Asterisk headings and bullets on the send-tool route {#asterisk-headings}

14/11/2026: a release note sent through the API with `*Heading*` and `•` items arrived with italic headings and every bullet merged into one line. Edited through the API as `**Heading**` and `- ` items, it rendered bold with a real list.

## Email destination {#email}

Outlook and most mail clients show `*bold*` and `_italic_` as literal symbols, so for an email: headings become plain lines, lists keep `-` or `1.`, and links stay bare URLs.
