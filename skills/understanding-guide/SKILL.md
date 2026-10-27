---
name: understanding-guide
description: Turn a large body of text the user must understand (several research reports, a spec set, legal drafts, a long transcript, agent reports in ~/Downloads) into an offline question-and-answer page they can actually read, before any decision is asked. Fires on "help me understand these", "I need to read all of this without missing anything", "how would you present these to me", "too long to read", "I can't read all that", "make it easier for me to read", "study these reports", "explain these documents topic by topic", and when the user says they are a slow reader or have ADHD and is facing more text than one sitting holds. Each topic gets three plain questions with short answers always visible, every claim checked against its primary source, and proof one tap away. NOT for writing a task doc from a source (that is `task-summary`), converting a .docx or .pdf to Markdown (`doc-to-md`), an end-user product manual (`user-manual`), or a quick summary of one short document, which needs no page at all.
---

# Understanding guide

The reader has to understand the material, not the agent. Everything here (inventories, topic tags, claim checks) exists to put a correct, short answer in front of someone who reads slowly and holds little in working memory, and it is wasted if the page they get is another wall of text. So two rules sit above the pipeline:

- **No decision questions until the reader says they understand.** A decision asked before then gets answered on an incomplete picture, and the reader knows it, so they push back instead of choosing. Collect the decisions the material implies and show them on the end screen as a read-only list. Ask them later, one topic at a time, with the confirmed evidence inside each option.
- **The answer must be true of the world, not of the sources.** Research reports paraphrase each other, overstate what a rule says, and describe the reader's own system from a client's say-so. Check each claim an answer rests on against its primary source (the rule-maker's page, the official text) and against the reader's own code, config and live pages. Expect this to change several answers, and fix them. Where a source has an addendum or later section that overrides its own summary, the later text is the current answer.

## How the work runs

The steps, their briefs and the file shapes are in 📖 `references/pipeline.md`; open it before dispatching the first agent. Every fan-out goes through `syafiqkit:haiku` with `model: "haiku"`, one agent per source, topic or source family, and you verify each step before the next one starts. The order:

1. **Inventory** every source into rows (each point with its type, quote, URL and line), and check the cited URLs resolve.
2. **Tag** every row to one of six to ten reader-facing topics, then prove by script that every row landed once.
3. **Design the page with the reader** before building it. This is a reading surface for one person, so run `uiux` properly: write the design read, research how evidence-heavy material is presented (live products plus reading research; the reader may find those products hard too, so ask), and run `impeccable`'s critique on the proposed direction before it goes for approval. Offer the reader the format as rendered options (questions and answers, slides, talk it through, narrated video). The questions-and-answers shape the generator renders is the one a slow reader chose, and why each part of it exists is in 📖 `references/reading-evidence.md`.
4. **Write each topic** as three questions (for rules material: what is true today, is it allowed, the right way to get what is wanted; other material swaps the purpose, see the pipeline), each with an answer of at most 40 words and a tag saying whether the sources agree. Collect the decisions the topics imply as you go; they become the read-only list on the end screen.
5. **Check the claims** per source family against primary text. The orchestrator checks the reader's own system itself, then re-reads every text field of every topic against the results, not only the answers: an overturned claim survives longest in the "why", recall and diagram lines.
6. **Render one topic as a sample** (`scripts/build_guide.py <build> --only <n>`), show it with screenshots, and get the reader's yes before finishing the rest. Then render everything and run `scripts/check_guide.cjs`. Open the screenshots rather than trusting its numbers.
7. **Answer the reader's questions in the guide.** They point at a question by its number; the answer is checked like any claim and then written into the guide, which is rebuilt. When every topic is "Got it" and the reader says they understand, the decisions start.

Keep the guide beside the project's docs for that subject, with its build folder and copies of the sources, so it survives the Downloads folder being cleared. Point the subject's task doc at it, and record there any finding the checks overturned.

## Writing for this reader

Plain words, sentences of 15 to 20 words, no coined shorthand (the worked run had to rename "PM-holder"), and a few-word gloss the first time a clause or section number appears. No em dashes. One topic per screen, with a stop point at the end ("Got it", "Later") so the reader is never holding two topics at once. If a diagram shows a proposal rather than today's behaviour, its caption says so. Mark every claim with what was actually checked: confirmed, worded differently, could not confirm, checked in our code, or a source's view rather than a rule. The reader decides more confidently when they can see which answers rest on a rule and which on someone's opinion.

📖 `references/worked-example.md`: the run this was distilled from (five compliance reports, 1,626 findings, seven topics), including what the reader said at each correction.
