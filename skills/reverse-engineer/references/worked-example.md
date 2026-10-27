# Worked example: a driving school's accounting app (26/10/2026)

The client, a driving instructor, billed students in a Malaysian accounting web app (a jQuery app with one script per module, posting `pageaction` form fields). The ask was "do accounting like my friend's app, inside our system". The app had no public API.

| Step | What it surfaced |
|---|---|
| REA `inspect_web_page` with script sources | 59 module scripts; the receipt rule "amount received must be at least the ticked invoices' total", and the full list of invoice, receipt, credit-note and overpayment operations |
| REA scenario clicks | Timed out on the collapsed sidebar; switched to the CDP script |
| Reading real records | 111 invoices, 429 receipts; one invoice per student with one line per licence; receipts backdated (number order differed from date order); every payment retyped into the invoice's remarks with its bank reference |
| Opening a customer's receipt link without login | It never showed what the student still owed, and listed every invoice line above one part payment |
| Asking what the client writes by hand | A WhatsApp statement per student splitting each payment between two licences, which the tool could not record. This became the main new requirement |
| Sonnet reviewer, 4 rounds (5, 7, 8, 9 of 10) | Caught a wrong price range taken from too small a sample, an invoice number series that did not match its dates, two proposals filed as the user's decisions, and an existing bot tool the plan had to change |
