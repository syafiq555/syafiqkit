# Validation Checks

After writing each entry (in Step 3):

1. Re-grep the keyword to confirm no duplicate was created. (This grep also proves a write landed when the target is `CLAUDE.local.md`, which is gitignored.) ⚠️ That grep tests your own phrasing, not the file — an existing rule saying the same thing in other words returns zero hits and reads as clearance to add a second copy. Where you have not read the whole target file, the grep is the only thing standing between you and a duplicate, and it is measuring the wrong thing; read the section you are writing into end to end, or search the concept from a second angle whose vocabulary you did not choose.

2. Ask: "Would removing this let Claude repeat the mistake?" If no, delete. Then ask the same of the section: if a reader absorbed the whole section, what would they default to? A row passing on its own can still be the twentieth mechanical row beside one line of judgment, training the opposite of what it says.

3. Scan for narrative markers ("happened", "repeatedly", "caught", "twice") — rewrite to state the constraint, not its history.

4. Check "Fix" columns — must name a specific, verifiable action (file, method, config, exact guard). Not vague ("investigate", "handle better").

5. If the file is now over budget, flag it (Step 4's pruner handles the shrink). Default: 350 lines; check `../../_shared/references/declared-budget.md` if the file states its own figure.

6. Re-read the entry against the "New signals → Add entry" shape rule: does prose violate its intended form? An entry landing as `**Never X**` instead of reasoning prose may pass the checks above and still be the wrong shape.

7. If the entry names a command, does it clear the non-guessable bar, or is it a routine act you happened to perform this way? Rewrite the second kind to the thing to establish. This check is worth running last because a session writes the command it just ran without noticing — the entry reads as helpfully concrete right up until someone runs it on a different platform.
