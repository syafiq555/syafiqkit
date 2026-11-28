# Make it run itself

Owner add-ons for a built tracker: the `onEdit.gs` script (required for History and Updated), email when it's someone's turn, and internal Chat alerts. Read this when the owner asks for one of them, or when you install `onEdit.gs` in their browser.

- **`onEdit.gs`:** the build prints where it wrote `onEdit-<tab>.gs`. The owner opens the sheet, goes to Extensions > Apps Script, replaces the editor's contents with that file, saves, and approves the permission prompt on the first run. With the owner's browser connected and their go-ahead, the agent can install it: open Extensions > Apps Script, set the code with `monaco.editor.getModels()[0].setValue(code)`, press cmd+s, read `getValue()` back, and rename the project. Test with an edit typed in the sheet (a throwaway row, cleared afterwards), since writes through the Sheets API never fire the trigger. Type a reply, then a second line under it in the same cell: History should gain only the new line, because clients answer under earlier text. A first-line-only test passed a script that re-logged the whole cell (13/11/2026). To land on the cell, open the sheet URL with `#gid=<tab id>&range=<cell>`, since the toolbar can hide the Name box.
  - Typing or pasting asks fills in No, Raised and the starting status.
  - A status change is logged in History. A closing status stamps the Closed date; reopening clears it.
  - A new Latest update goes to the top of History as "Name dd/mm/yy: text" and sets Updated.

  It sees the editor's email only for people in the owner's own Workspace; everyone outside arrives blank, so listing outsiders in `NAMES` does nothing. On a two-party tracker, set `domain_names` to the owner's domain (shown as the team) and `unknown_editor_label` to the other party's name, so every blank editor reads as them. An insider editing from a personal account then shows as the other party.
- **Email when it's someone's turn:** Tools > Conditional notifications, for example "Status is With Acme, notify the client". Account and recipient limits are in `references/sheets-api-gotchas.md`.
- **Internal alerts:** a Google Chat webhook from an installable Apps Script trigger. This needs a Workspace Business plan or above, and posts into one space.

Three behaviours Google doesn't document, which need a test with an outside Google account before you promise them to a client: whether an installable trigger fires on an outsider's edit, whether a comment assigned to a personal Gmail address sends an email, and whether the script's document lock (it stops two people getting the same No) is allowed in a simple trigger. If the lock is refused, the script carries on without it.
