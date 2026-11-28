---
name: casual-message
description: >
  Write a message in the sender's own voice to a specific person or small group —
  a WhatsApp reply, a Google Chat DM to a colleague, texting someone back, telling
  a named person something, including a reply the session offers unasked while
  investigating a chat screenshot or wrapping up work. Casual by default: short, in a copyable fence, no section headers,
  closes the way the sender actually talks. Fires on "reply to X", "tell Y that...",
  "make it sound like me", "my usual WhatsApp message", "just a quick text", "reply
  casually", "what should we reply", "what do I say if they ask", "what should I
  tell them", or naming a recipient by name or relationship rather than by audience
  category. Includes preparing the sender's answer to a question colleagues are
  expected to ask about something just posted. Includes a reply on a team thread or task card
  (ClickUp, Chat) that speaks for the sender, even a long one such as a timeline.
  NOT for a document being posted or converted — a changelog, release note, status
  update, or already-drafted prose someone wants reformatted for Chat's markdown is
  `gchat-format`, even when the destination is a 1:1 DM.
---

# Casual Message

Write what the sender would have typed themselves, only faster.

## What separates this from `gchat-format`

`gchat-format` converts a **document that exists independently of who reads it** (a release note, a status update). This skill writes a **message to a person**. The destination is not the axis: a Google Chat DM to a colleague belongs here, and a WhatsApp broadcast to a client group may not.

The ask usually settles it: "Reply to Syazwan" or "tell the team that…" names a recipient and a speech act; "format this release note" names an artifact. When both are somehow true, a status update going to one person included, ask what the recipient will do with it: read and reply is a message; forward or refer back is a document. The session's own explanation re-dressed for colleagues is a message, even via a bare `/gchat-format`. "Update group" or "update the team" is the exception: a status update to the whole space is a document, posted as a new top-level message (`gchat-format` § Is this a document).

## Register is inferred, not asked

Do not add a formality question: a second gate only moves the failure of a formal document one question later.

Read the register off the phrasing: "reply to syazwan" is already casual. The judgement left is degree (a daily colleague differs from a senior manager; both are casual next to a client announcement). When the relationship isn't established, ask about the relationship, not formality.

One case does not infer safely: a named **client** contact, or in Malay anyone senior (a boss, a director), where `saya`-with-title and casual differ most. The trigger fires on "tell X that…" whoever X is, so a client lands here by phrasing alone and inherits the casual default. A client relationship carries a register the sender didn't state and you can't read off a one-line request, so ask even when the relationship is well established, unless the user's own instructions record how they write to that person or role; then draft in it and name the register assumed in one line outside the fence.

Where the user supplied their own draft or the thread's prior messages, that is the register. Match it rather than improving it.

## Language

Match the language already in use: the user's draft, the thread, or how they phrased the request. Ask only if nothing establishes it.

**If the user's own instructions (their global CLAUDE.md or a companion it points to) have a section on how they write messages, read it before this one; it overrides every default below.** Read it even when the thread shows the register: that section carries rules no thread shows, such as how an ask to a client is worded. A personal section never opened loses to shared examples.

Casual Malay is its own register, not formal Malay made shorter: particles (`lah`, `je`, `pun`, `eh`), shortened forms (`tak`, `nak`, `tu`/`ni`) and mid-sentence English loanwords make it read as a person texting; a trimmed formal sentence still reads like a letter. Manglish follows the same rule: code-switch if the user does.

**The sender's own sent messages are the style guide; read them before drafting.** Where they are in the session, the thread or memory, copy their spelling, pronouns and bubble shape. Without any, draft from the defaults below and say outside the draft that a couple of their sent messages would let you match them (`references/incidents.md#sent-messages-style`).

The defaults suit a short conversational reply to a peer, and the sender's own messages beat them. A decision-maker question, a dates-or-estimates reply and a client-group post keep their structure, carrying over only spelling and particles. Pronouns and the recipient's name follow the pronouns rule below.

- **A short reply is one bubble; a longer one gets a bubble per topic** (blank line between, so each pastes alone), each point answer first ("memang issue", "tak jadi issue"), the reason after `sebab`. A later bubble can carry a follow-up.
- **No greeting beyond answering theirs** (`wsalam` to their salam, plus the name they call the recipient), no closing line, and no numbered offers or time estimate unless the peer asked; those read as AI.
- **Lowercase, almost no punctuation, no emoji.** English mixes in freely: tech nouns and verbs stay English and lowercase (issue, dashboard, check, fix), and a word kept in Malay is the plainest spoken one. Test each word: would the sender say it aloud? Proof goes in brackets as names ("(db1, db2, db3)"), not links or tables.

📖 `references/casual-malay.md`: one colleague's spelling and particle habits, a fallback when the sender's own are unknown, plus code-switching, formal-to-spoken word swaps and a register table. Read it before drafting any Malay message.

**Pronouns carry more register than any other word, and `saya` slips through.** `aku`/`saya` and `kau`/`awak`/`you` track the relationship, not the sentence's formality: `saya` to a peer reads as distance, and nothing about the draft looks wrong. Many senders use `aku` with colleagues and `saya` only with clients. Take them from the thread or the sender's draft; where neither shows them, it is a per-sender preference you cannot infer, so ask, alongside the client-contact question. The greeting name is the same kind of fact: docs and CRMs file someone under a name the sender doesn't text ("Ahmad" against "mad"), so take it from the thread, or from how the sender refers to the recipient when talking to you, and ask alongside the pronoun when neither shows it.

## What this produces

Short: usually a few lines, often one. A bubble is a topic, not a sentence: points on the same topic share one bubble joined with a comma or full stop, and a command or link sits in the bubble that explains it. Up to about three sentences is one paragraph, even when it acknowledges one thing and asks another; a second bubble, after a blank line, is for a longer reply whose next topic stands apart (12/11/2026, `references/incidents.md#splitting-bubbles`). No bold headers, no bullets organising the sender's points, no closing line the sender doesn't use, including a line telling the recipient how to answer or a parting emoji (2026-10-26, `references/incidents.md#closing-line`).

**Three or more alternatives the recipient picks from or answers one by one keep `- ` bullets under their question, even to a peer** (`* ` in Chat's composer, § Syntax; a client group numbers its questions, below). Two options stay inline ("pdf ke excel?"), and so does any list the recipient doesn't reply to item by item: what the sender did, steps to follow, facts, or things the sender offers to do. A run-on line of options can't be answered point by point; the rest of the message stays prose (23/11/2026, `references/incidents.md#alternatives-bullets`). **Tell: three or more alternatives sit inline, joined by commas and "atau"/"or" or strung as back-to-back "... ke?" questions.**

**An opener about the message is the same slip at the top.** A line about how to use the text ("can paste as is") goes (18/11/2026, `references/incidents.md#opener`). **Tell: the first or last line of the draft is about the message rather than part of it.** An opener narrating the sender's checking ("just checked") is the same slip about the work: open on the finding.

**A question to a colleague carries the question and the sender's lean, not the analysis behind it.** A preamble on why they're asked, or a closing line narrating the next step, is trade-off work leaking in, and makes a two-line question read formal. Keep the lean to one clause ("leaning own table so WC emails don't fire"); the recipient asks for the rest. **Tell: the draft argues for an option before the recipient has answered.**

Before a team post that asks a question only an outside party can answer, open `references/structured-messages.md#outside-party-question`; before a question to a decision-maker outside the day-to-day work, `references/structured-messages.md#decision-maker-not-in-the-work`; before a post into a client group or a findings reply into a team space, `references/structured-messages.md#client-group-post`; before a reply whose body is figures per case, `references/structured-messages.md#figures-per-case`; before a heartfelt message to a partner or family, `references/structured-messages.md#heartfelt-partner-family`.

**Names the session coined don't travel.** Option letters, slugs, tier numbers and doc anchors are plain words only to the sender. Say what each thing *is* ("designers key in the BOQ themselves", not "option A") unless the recipient used the label; name a meeting by what happened in it, and a tracker row by what it asks (23/11/2026, `references/incidents.md#coined-names`). A closing "full breakdown is in the doc" points at the sender's private workspace, so put in the message what the recipient needs to act or answer: what stays manual, what to cut, assumptions, open questions. **Tell: a word in the draft first appeared in this conversation rather than in the thread, or the draft points at a file.**

Keep `gchat-format`'s shapes out: bold section headers, table-to-bullet conversion, regroup-by-feature, the formal close.

## Replying to their message

When there is a message being replied to, answer it rather than summarising it back. Find it first: it may be pasted, screenshotted, or have arrived turns earlier as the user's prompt to a different skill. Relayed text in someone else's first person reads as the user's own words, so check before treating it as context.

Before replying, open `references/structured-messages.md#reply-to-their-message`: restating their point or answering past their doubt reads as not listening, and a question about their own draft gets the shortest answer that settles it.

**A reply to a client about something the team fixed, or to a colleague who asked for a task, reports the result, not how the system works.** For a colleague's request (an admin forwarding a customer ask) that means what is now true for the customer: no cleanup the session did along the way, and no line telling a third party what to do next, since the colleague runs their own side (`references/incidents.md#client-reply-internals`). The session has just learned why the fix was needed and what it leaves uncovered, and that context leaks into the draft as an explanation of internals and a caveat for the client to manage. A caveat the team can close is closed before the reply (§ Speaking for the sender, work this session can do now), and the reply says only what they can now see or do. The team's build state stays out the same way: work the client is paying for that was ready ahead of time is described by when it applies, never as "switched on" or "already built", which tells them the price bought a setting. That is about framing, never concealment: when they ask about effort, price or scope, answer truly, and a limitation, risk or dependency still goes in. **Tell: the client draft explains why something works the way it does.**

**Their word for the mechanism stands when the answer is the same either way.** A non-technical recipient who says "cache" for a cookie, or "the system" for one screen, asked a real question in loose words; a reply that opens by correcting the term answers a question they didn't ask and reads as a lecture. Answer in their vocabulary, and correct a term only when the wrong one would change what they do. Measured 16/11/2026: a reply to a client's "can it be don't bound by cache?" opened by explaining it was a 30-day cookie, and came back "drop the technical correction ... as long as the mechanism is the same no issue". **Tell: the draft's first line explains what their word really means.**

## Speaking for the sender

A reply under the sender's name commits them to what it says. When the reply carries dates, estimates or a split of work, length follows the content rather than the short default, and these defaults hold until the sender overrides them:

- **Work this session can do now is done before the draft, not promised in it.** "I will mark these in the next version" commits the sender to a second round the recipient waits for, when the edit takes minutes. Do it, then report it. Promise only what needs the recipient's answer or someone else's input (2026-10-14, `references/incidents.md#done-before-promise`). **Tell: the draft says "I will" about something no reply is needed for.**
- **A question to a client carries the sender's suggestion, so "ok" answers it, and reads as courtesy and care, never as an order or a quiz of their own document.** Open with the fact from their sheet or message, then ask. "Will you be able to …?" belongs only on something they must do themselves: asking someone to predict their own action nudges them to follow through, though the effect is small (Wood et al. 2015, 116 tests, d = 0.24, https://pmc.ncbi.nlm.nih.gov/articles/PMC4931712). A suggestion varies its wording ("We suggest X. Ok with you?", "Shall we keep …?", "Is it ok if we …?", "Happy for … to stay as today?"), since one formula on every line reads as a template; the varied questions still sit in the numbered list a client-group post asks for (§ What this produces). A suggestion needs a basis the sender holds (the client's own sheet, today's behaviour, their earlier answer); a fact only the client holds (their bank details, a legal or tax identity, a business decision with nothing to go on) gets an open "Could you let us know …?", since an invented default gets rubber-stamped. No line about the reply itself ("to keep this quick"). (`references/incidents.md#suggestion-wording`). **Tell: three or more questions in the draft open with the same words.**
- **A client ask written as a statement is still an ask, so it becomes a question.** "Once your team fixes these, we'll update" carries no question mark, so the rule above reads as not applying. Any courteous form fits ("Will your team be able to …?", "Could you …?"); the rule is the question, not the wording. It does not apply when the client already said they will do it (then our next step stays a statement: "thanks, we'll update once they're in"), nor to a colleague's task (`references/incidents.md#statement-ask`). **Tell: the draft needs the client to do something they have not offered, and has no question mark.**
- **A question the sender can answer never goes to the recipient.** Open items from research often concern the recipient's own identity or history, which the sender, as family or a long-time contact, already knows; put them to the sender first and keep only what the recipient alone can answer (25/11/2026, `references/incidents.md#sender-answers-first`).

- **Estimates, a colleague's earlier version and a work split** follow the rules in `references/structured-messages.md#estimates-and-split`: name the assumptions, diff against the baseline, and estimate only the sender's share.
- **"It does X now" is checked against the live system, not the build.** Deployed, tested code can still do nothing until the data it acts on arrives. Before the line goes in, read the state on the environment the message names; where the precondition is missing, say what it waits on ("once the import runs") (2026-10-22, `references/incidents.md#live-system`). **Tell: a present-tense line about production that you verified only with unit tests or a deploy log.**
- **A fact the draft states about what a user did, or a figure it quotes, comes from the record, not from someone's reading of it.** Paraphrases, AI summaries and first looks compress events, and a count someone else took covers only their slice. Before the line goes in, read the session's own events (`posthog-replay-frames` § 1 for a recording) and re-measure over the whole population (22/11/2026, `references/incidents.md#record-not-reading`). The same holds for the recipient's own account, such as whose bank a payout reaches, what role they hold, which screens they have: read their records, never off a name. So does an item's status (a tracker row's, a card's): its last line is someone's reading, so check it per `read-summary`'s Investigation rule. **Tell: a line in the draft says what a user did, gives a count or states an item's status, and the only source you opened was another person's message or a tracker cell.** A how-to answer names every route the product offers, per `read-summary`'s Investigation rule.
- **A link in the draft is checked the way the recipient will open it.** A file the session made or uploaded is often private to the sender, so the link works for them and nobody else, and a note under the draft saying "share it first" is read after the message has gone. Open it signed out (or read its sharing) before drafting; where it isn't viewable, ask who should get access and set it, then hand over the draft (09/11/2026, `references/incidents.md#link-check`). The reverse miss is naming a file with no link, as if "shared with the company" let readers find it: the URL goes in (`gchat-format` § Is this a document). **Tell: the draft carries a link and a footnote about sharing it.**
- **What a third party said travels as their words.** When the message relays a client's or vendor's answer, quote the line it rests on (a `>` quote in Chat) above your one-line reading, so colleagues can check it. A paraphrase alone reads as your interpretation. A reply arguing the recipient already said or decided something quotes the line too (`references/incidents.md#third-party-words`).

## Syntax

`*bold*`, `_italic_`, `~strike~` and links are the same on WhatsApp and in Chat's composer, so one skill covers both. A draft headed for a Chat send tool follows its Markdown instead: open `references/structured-messages.md#chat-send-markdown` first. Bullets are the exception: on WhatsApp start each with `- `, not `* `, since a line opening with `*` reads as Chat syntax (03/11/2026, `references/incidents.md#whatsapp-bullets`).

**Anything the recipient must copy or type exactly (a URL, an event or setting name, a key prefix, a command) goes in code formatting**: single ticks inline, triple ticks on their own lines for a list. WhatsApp and Chat both render it monospace. The draft sits in a fence, so make that outer fence four ticks to keep the inner triple ticks (17/11/2026, `references/incidents.md#code-formatting`). **Tell: the draft asks someone to enter a string in a dashboard and the string is plain text.**

`gchat-format`'s `## Key Rules` was written for converting a *document*, before WhatsApp was in scope: take only its inline syntax; ignore its header, table and fence conversions.

- **No em dashes.** A hyphen with a space on either side is the same clause break and does not satisfy this: use a comma or a full stop. A `- ` at a line's start is a bullet. Casual writing rarely wants the dash at all. That holds when the hyphen is doing arithmetic, too: `720.49 - 96.55` reads as a dash to the sender, and some editors turn it into one. Write money sums in words ("720.49 minus 96.55 plus 231.71 = RM 855.65"), and never use a Unicode minus `−`.
- If you find yourself converting a table, the message is a document and belongs to `gchat-format`.

WhatsApp and Google Chat differ on link rendering and strikethrough across clients. Where it matters, prefer the plainest form that works in both: a bare URL rather than a labelled link.

**The draft goes in one triple-backtick fence, so the sender gets a copy button.** The fence is the container, not the register: what read as over-formal when this skill was created was the document inside it (headers, a reason per point, a formal close), and casual text in a fence still pastes as a text. Anything said to the sender (a caveat, what stays unchanged) goes above or below the fence, never inside it. The same reversal `gchat-format` records for its own no-fence default happened on a WhatsApp draft sent unfenced (`references/incidents.md#fence-unfenced`). Leave it unfenced only when the sender asks.

**The draft ends the turn.** When another skill or tool call is queued after it (a `/done`, a commit, the rest of a wrap-up), the draft gets buried under that skill's load and output, so the sender scrolls back for words they still have to paste. End the turn on the draft and start the next step when they reply. If the chain must continue, restate the draft word for word as the last thing in the final reply (`references/incidents.md#ends-the-turn`). **Tell: your draft is followed by a `Skill` or `Agent` call in the same message.**
