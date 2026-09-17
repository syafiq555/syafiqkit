---
name: casual-message
description: >
  Write a message in the sender's own voice to a specific person or small group —
  a WhatsApp reply, a Google Chat DM to a colleague, texting someone back, telling
  a named person something. Casual by default: short, no fence, no section headers,
  closes the way the sender actually talks. Fires on "reply to X", "tell Y that...",
  "make it sound like me", "my usual WhatsApp message", "just a quick text", "reply
  casually", or naming a recipient by name or relationship rather than by audience
  category. NOT for a document being posted or converted — a changelog, release
  note, status update, or already-drafted prose someone wants reformatted for Chat's
  markdown is `gchat-format`, even when the destination is a 1:1 DM.
---

# Casual Message

Write what the sender would have typed themselves, only faster.

## What separates this from `gchat-format`

`gchat-format` converts a **document that exists independently of who reads it** — a release note, a status update, an announcement. This skill writes a **message to a person**. The destination is not the axis: a Google Chat DM to a colleague belongs here, and a WhatsApp broadcast to a client group may not.

The ask itself usually settles it. "Reply to Syazwan", "tell the team that…", "text him back" name a recipient and a speech act; "format this release note", "convert this for Chat" name an artifact. When both are somehow true — a status update going to one person — ask what the recipient will do with it. Something they read and reply to is a message; something they forward or refer back to is a document.

## Register is inferred, not asked

Do not add a formality question. This skill exists because asking *who receives this* was answered correctly and still produced a formal document for a one-line reply to a colleague — a second gate would move that failure one question later, not remove it.

Read the register off how the request was phrased. Someone who writes "reply to syazwan" is already talking casually about a casual message; matching that is usually right. The judgement left to you is degree, not category — a colleague you message daily differs from a senior manager, and both are casual next to a client announcement. Ask when the relationship isn't established — a first message to someone new — and ask about the relationship rather than about formality.

One case does not infer safely: a named **client** contact. The trigger fires on "tell X that…" whoever X is, so a client lands here by phrasing alone and inherits the casual default, which is the original bug pointing the other way. A client relationship carries a register the sender didn't state and you can't read off a one-line request, so ask there even when the relationship is well established.

Where the user supplied their own draft or the thread's prior messages, that is the register. Match it rather than improving it.

## What this produces

Short. Usually a few lines, often one. No fence, no bold section headers, no bullet structure, no closing sign-off unless the sender uses one.

**No fence by default** — the inverse of `gchat-format`. That skill fences because a document is pasted whole and the boundary matters; a two-line text has no boundary problem, and a fenced casual message reads as exactly the over-formal artifact this skill exists to avoid. Reach for a fence only when length makes the copy boundary genuinely ambiguous.

The things `gchat-format` does that must not leak in: the code fence, bold section headers, table-to-bullet conversion, regroup-by-feature, the formal close. The failure that created this skill was a session defaulting to that shape because it is the one written down at length.

## Language

Match the language already in use — the user's draft, the thread, or how they phrased the request. Ask only if nothing establishes it.

Casual Malay has its own register, and it is not formal Malay made shorter: particles (`lah`, `kot`, `je`, `eh`), shortened forms (`x` for `tak`, `dgn`, `tu`/`ni`), and English loanwords mid-sentence are what make it read as a person texting. A grammatically correct formal Malay sentence, trimmed, still reads like a letter. The same holds for Manglish — if the user's own messages code-switch, the reply should.

**Pronouns carry more register than any of those, and `saya` is the one that slips through.** First and second person (`aku`/`saya`, `kau`/`awak`/`you`) track the sender's relationship with the recipient rather than the formality of the sentence, so `saya` to a peer reads as distance even in a message that is casual everywhere else — and because it is grammatically neutral, nothing about the draft looks wrong. Many senders use `aku` with colleagues and `saya` only with clients. Take it from the thread or the sender's own draft where either exists; where neither does, it is a per-sender preference you cannot infer, so ask — alongside the client-contact question above, not as a second round.

## Syntax

`*bold*`, `_italic_`, `~strike~`, bullets and links are the same characters on WhatsApp as in Google Chat — WhatsApp renders this markdown natively, which is why one skill covers both destinations.

`gchat-format`'s `## Key Rules` section holds the details, but read it knowing what it is: a table for converting a *document* into Chat's dialect, written before WhatsApp was in scope, so it never names WhatsApp and much of it is about structures a casual message shouldn't contain. Take the inline syntax above from it; ignore the header, table and fence conversions.

Two facts worth carrying here, since a casual message is where they bite:

- **No em dashes.** A hyphen with a space on either side is the same clause break with a narrower glyph and does not satisfy this — use a comma or a full stop. Casual writing rarely wants the dash at all.
- Most of `gchat-format`'s conversion table is about structures a casual message shouldn't contain. If you find yourself converting a table, the message is a document and belongs to that skill.

WhatsApp and Google Chat differ slightly on link rendering and strikethrough support across clients. Where it matters for a specific message, prefer the plainest form that works in both — a bare URL rather than a labelled link.
