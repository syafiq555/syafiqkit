# Sheets API gotchas for tracker builds

Each of these produced a sheet that the API reported as built successfully but that looked wrong when opened. All were measured on 05/11/2026 while building the first example tracker. `scripts/build_tracker.py` already handles each one; this file is for anyone changing the script or building by hand.

| Symptom | Cause | Fix |
|---|---|---|
| Rows and colour rules vanish after removing a Table | `deleteTable` deletes the cell contents and the conditional formats inside the Table's range, not just the Table styling | Don't convert a filled sheet to a Table and back. To drop a Table, copy the values out first, or rebuild the tab |
| Counts read as "Waiting fo… 4" | Label and number were in separate cells, and the label sat in a narrow column | One formula per count, `="Label:  "&COUNTIF(...)`, in a wide or merged cell |
| Dropdowns show arrows, not chips, and option colours can't be set | `DataValidationRule` has no display-style or option-colour field; `displayStyle` is rejected as an unknown field | Chips and their colours are a manual step in the sheet (Data > Data validation > Advanced options > Display style: Chip); give the owner the steps |
| Record columns hard to read | Light grey (`#777`, `#AAA`) at size 9 | Dark grey `#444` at normal size; mid-grey `#6B6B6B` for closed rows |
| A `Tab!A1` range fails with "Unable to parse range" | Someone renamed the tab | Address writes by `sheetId` (`updateCells`, `repeatCell`), and re-list tab titles before building A1 ranges |
| `addFilterView` returns 400 "Unknown name visibleValues" | `FilterCriteria` has no `visibleValues` field | List the statuses to hide in `hiddenValues`, plus `""` to hide blank rows |
| Rendered check shows "You need access" | The browser the tools picked is signed in to a different Google account; another connected browser may hold the owner's | List the connected browsers, open the sheet in each and read the account from the page. If none is the owner's, ask the user for a screenshot. Never request access from the wrong account |
| Changing a status list fails with "This operation is not allowed on cells in typed columns" | Inside a Table, a dropdown is the column's own type (`columnProperties[].dataValidationRule`), so `setDataValidation` on it is refused, and in a batch the refusal undoes every other request | `updateTable` with `fields: "columnProperties"` and the FULL column list (a partial list drops the others' types), then `findReplace` the old values and update the conditional formats and header counts that name them. Mirror it in the tracker config, or a rebuild restores the old list |
| Script test changes nothing | Edits through the Sheets API don't fire `onEdit` | Test with an edit typed in the sheet through the browser |
| Wide columns come out at 300 px after a build | Converting the range to a Table can override column widths set before it | Set the widths again after `addTable` (the builder does) |
| A count moved one column to the right now counts the wrong column | `copyPaste` shifts relative references (`D4:D` becomes `E4:E`) | Move formula cells with `cutPaste`, which keeps references |
| Filter views cover rows the Table doesn't | Views made with an open-ended range run to row 1001 while the Table stops at its row cap | Give each view the Table's range (the builder does) |

Facts that limit what can be automated (Google help pages, checked 05/11/2026):

- A token with only the spreadsheets scope can create a spreadsheet and edit any sheet the account can reach. It cannot share, move or delete files; that needs a Drive scope. The gsheets MCP's sign-in carries `drive.file`, so its `drive_file_share` can share a sheet that same sign-in created, once the user has said who should see it.
- Conditional notifications are available only to some work or school accounts. Recipients must be Google accounts (no Outlook or Yahoo), and changes arriving through IMPORTRANGE do not trigger them (support.google.com/docs/answer/14099459).
- A simple `onEdit` trigger cannot use services that need authorisation (so no email), runs for at most 30 seconds, and doesn't fire for edits made by scripts. An installable trigger runs as its creator (developers.google.com/apps-script/guides/triggers). Apps Script email quota: 100 recipients a day on a consumer account, 1,500 on Workspace.
- Google Form responses land in their own tab, not an existing tracker tab, so a form intake needs a script or a `QUERY` to fold the responses in (support.google.com/docs/answer/2917686).

**The builder's Table is styled minimal** (Google Sheets "Convert to table"): the first tracker's reader found the default style (type icons, coloured header bar, floating name chip) distracting, then on 05/11/2026 asked for a Table back for its heading filters and chips "but minimal design". The builder adds it after the rows are written, with white bands, a light grey header and the heading text set dark explicitly (the header style alone draws it pale), and keeps the spacer row at 34 px after any auto-resize. A Table has traps of its own: a `DATE` column type forces `M/d/yyyy` whatever the locale (type date columns `COLUMN_TYPE_UNSPECIFIED`); `addTable` below row 1 wrote its headings two columns to the right (rewrite them after); and a filter view on a Table must match the Table's range exactly.
