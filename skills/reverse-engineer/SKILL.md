---
name: reverse-engineer
description: >
  Study a third-party web app that the client or user already works in (their accounting, booking, POS or CRM system, logged in as them) and rebuild its mechanism inside our own app. Fires on "reverse engineer X", "how does <app> do it, build similar in ours", "my friend/client uses <app>, we want the same", "study <client's tool>", "clone the mechanism of", "utilize REA" against a web app someone is logged into. Reads the client's real records read-only through REA and the browser's DevTools protocol, learns how they actually use the tool, and lands findings in a task doc verified by a separate reviewer before any design. Not for decompiling a binary, APK or Electron bundle with no rebuild goal (REA's own `reverse-engineer-anything` skill), not for researching how public products solve a UI pattern (`uiux` research), not for designing screens once findings exist (`uiux`).
---

# Reverse engineer a client's tool

The goal is not a feature list of the other app. Its marketing page gives you that. The goal is the client's **working method**: what they record, in what shape, what they work around, and what their own customers end up holding. Those workarounds are where our version wins, and they are visible only in real records, never in a product tour.

## The target is someone's live business

The account you open is the client's real records. Many such apps send things onward by themselves (an e-invoice to a tax authority, a WhatsApp to a customer, a stock order), so one "test" record can leave the building. Read only: call the app's own list and view functions, never add, update, cancel, delete, save or submit, and never press a share or send button. To watch a create flow, use a separate trial account. This holds for every agent you dispatch, so restate it in their brief with the exact functions they may call.

The client logs in themselves. Never type their password, and never fetch with their cookies from a shell.

## Getting eyes on the app

1. **Open a separate browser profile with remote debugging**, because current Chrome-family browsers refuse debugging on the default profile: `open -na "<Browser>" --args --remote-debugging-port=9222 --user-data-dir="$HOME/.<target>-profile" "<login URL>"`. Ask the user to log in in *that* window; their everyday window is invisible to the tools. The profile keeps its login cookie, so on a later visit open it yourself and check the page for a password field before asking: a user told to log in to an app that is already logged in asks why you couldn't.
2. **REA** (github.com/morluto/rea) needs a one-time `npx rea-agents setup --client claude_code` (preview it with `--dry-run`), then a session restart or `/reload-plugins` for its `mcp__rea__*` tools. `list_browser_targets` finds the page; `inspect_web_page` with `include_script_sources` pulls the app's own scripts. Its output is large, so it lands in a file: extract with `jq`/python, never read it whole.
3. **Read the scripts for the mechanism**: endpoint names, operation names (`pageaction`, GraphQL operation, route), and the validation rules in the submit functions (e.g. "amount received must cover the ticked invoices"). Server-rendered apps keep the business rules server-side, so the scripts give you the verbs and the client checks, not the data model.
4. **Navigate by calling the app's own read functions.** REA's scenario clicks time out on hidden or collapsed menus, and its request step only sends JSON, which form-posting apps ignore. So fall back to a small CDP script that evaluates one whitelisted call and reads the content area's `innerText`: 📖 `references/cdp-read-only.md`. Keep the whitelist to `list*`/`view*`-style functions, so the script itself enforces the read-only rule. Paging and filters are the app's own controls too (a page switcher, a year dropdown changed with a `change` event); typing into a date box often changes nothing, so confirm a filter by reading the first row afterwards. A record that opens as an edit form (a customer profile) holds its data in the inputs' `value`, not in `innerText`: read the values and never press save.

## What to learn

- **Volume and shape**: how many records, numbering format and whether it resets yearly, whether number order matches date order (backdating), the line items people actually use and their prices. ⚠️ A list's record count is the count under its default filter, usually the current year, so it can match the screen and still miss history. Check it by joining: every reference one record makes to another (a receipt's invoice number) must land in what you captured. Measured 2026-10-26: a list read as 111 invoices; 76 receipts pointed at invoices it did not show, and the account held 150. If the app's catalogue (products, items) is empty, the items exist only in the typed lines, so derive them from those.
- **Habits around the tool**: free-text fields used as a second ledger, fields always left blank, features present but never used. Each is a requirement in disguise. Read a notes field in full before calling it a copy of another field: its structure can hold facts recorded nowhere else. Measured 2026-10-26: invoice remarks first dismissed as retyped payment references turned out to be the only record of how each payment split between two licences.
- **What the client's customers receive**: shared links, PDFs, WhatsApp messages. Open one as a customer would (no login) and note what it omits. Ask the user how the client sends it.
- **What the client writes by hand outside the tool**: a statement, a spreadsheet, a chat message. Ask for one. This is usually the biggest requirement, because it is the job the tool fails at.

## Landing it

**What goes to the user is what the evidence cannot settle, after you have tried all of it.** A first matching pass (by reference, say) leaves a residue, and that residue reads like a review list for the user. It usually isn't: dates, tick marks, totals that must balance, and "only one way this adds up" settle most of it. Measured 2026-10-26: 37 receipts were handed over as a sheet to fill in; the user asked "why can't you deduce?", and dates, the client's ✅ ticks and the remaining licence balances left one genuinely open. **Tell: the list you are about to hand over came from a single matching rule.**

Write a task doc (`task-summary`) with three things kept apart: **observed** (each fact with the date read and a quote), **decided** (by whom, when), and **proposed** (yours, awaiting an answer). A proposal filed as a decision is the easy mistake here, because both read as settled.

Before any design, map each finding to what our app already has versus new work, by opening the code it would touch.

Then dispatch a separate reviewer (`sonnet`, read-only, same whitelist) to re-check every claim against the live app and our code and score the doc 1-10 for a reader new to it. Verify what it reports, apply it, and repeat until it scores 9 or more. Its corrections are usually the facts you generalised from one page of data.

Design comes after, through `uiux`, with the before-state of our own screens captured first.

📖 `references/worked-example.md` for one full run (a driving school's accounting app), including what each step surfaced.
