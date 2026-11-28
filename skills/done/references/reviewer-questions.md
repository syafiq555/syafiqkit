# Reviewer Questions: Research Before Asking

Read this when Step 1's agents return with questions for the user, before building the one `AskUserQuestion` call. The rule that every reviewer question goes through that single call before Step 4 stays in SKILL.md.

## Behaviour questions: research first

A question about how the product should behave is researched before it is asked:

- **Who can do or see something**: which role ships, who sets a status, what exits a stuck state.
- **What a user sees or what happens to their data**: whether a value moves on its own, what a switch keeps or clears, which fields a form offers.

One `haiku` agent per question goes to the governing spec rows (searched across the whole spec by the behaviour's nouns, not only the item's own row), live products and design guidance, with quotes inside the options. Open the code each premise rests on first.

Asked bare, the user answers "research" and the question comes back twice. (21/11/2026: three reviewer questions were asked with code evidence only; once researched, two of the three recommendations reversed.) (25/11/2026: a follow-up cancel question went out bare and came back "/haiku research", then its "second approver" default came back "Did the brs got say need 2nd approver?"; it was the user's 18/11 call, and BRS M2.6 says only "where configured".)

## Every reviewer question reaches the batch

The product reviewer's list counts, and so does any code reviewer line saying "a decision to confirm" or "the user's call", however low it ranks. (21/11/2026: a refund-timing decision sat under a code reviewer's LOW notes and missed the question batch.)

## Sibling-feature defaults

An option that carries a design over from a sibling feature ("same as the direct route: a second approver") says where that design came from: the spec row or the user's own dated call. A carried-over default reads as the spec's.

## Screen-state questions are not asked

A question about how a screen handles one of its states for the person using it (block or warn, what an error says, what happens after an action) is a design call the Design step's `uiux` pass makes and builds, unless the answer changes who can do or see something or what a customer is promised. (25/11/2026: a block, warn or leave choice for a failed photo upload came back "improve use uiux skill".)

## Later rounds

Every later round in the run follows the same rule: a finding that arrives after the user answered the first batch is asked the same way.
