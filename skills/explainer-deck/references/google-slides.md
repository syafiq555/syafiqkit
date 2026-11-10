# Publishing to Google Slides and checking the render

## Before you start

- syafiqkit's `gsheets` MCP switched on in this project (its README's `bin/enable`). Without it, every step below is by hand.
- The right Google account: the server signs in as one account per config folder, so ask the user which account should own the deck (a work client's deck in the work account) before the first upload.
- `pdftoppm` (Poppler) and `magick` (ImageMagick) on PATH for the contact sheet.

## Upload and update

With syafiqkit's `gsheets` MCP:

1. First time: `drive_file_upload` with `convertTo: "slides"`. Keep the returned id with the spec (a task doc or the spec's folder).
2. Every rebuild: `drive_file_update` with that id and the new .pptx. The link stays the same and the file stays Google Slides, so a link already shared keeps working. A new upload would make a second file.
3. The sign-in writes only through `drive.file` (its `drive.readonly` scope can read others' files, not change them), so it can update only files it created. A deck someone else made can't be updated this way; upload a new one.

Without the MCP, upload the .pptx by hand and open it with Google Slides. Check the render the same way.

## Checking what Google drew

- `drive_file_export` (format `pdf`) saves the deck as Google lays it out. Turn the pages into images and look at them: `pdftoppm -r 60 -png deck.pdf p`, then `magick montage p-*.png -tile 3x -geometry +6+6 sheet.png` for a contact sheet. Open single pages at a higher `-r` where text is small.
- `slides_thumbnails` saves one PNG per slide straight from Google, and `slides` limits it to the ones you changed. It needs the Google Slides API enabled in the sign-in's Cloud project (a 403 "has not been used in project" names the link), and Google allows about 60 a minute per user. The PDF export covers the same check without either.
- Keynote's AppleScript export can hang, and LibreOffice renders differently from Google, so neither stands in for Google's own render.

## What breaks on Google's side

| Symptom on screen | Cause | Fix in the spec or script |
|---|---|---|
| Text runs out of its box | Google ignores PowerPoint's shrink-to-fit; pptxgenjs only sets a flag that PowerPoint acts on when it opens the file | The script sizes text with `fit()`; shorten the text, or lower the kind's max font in `kinds.js` |
| Words broken mid-way in a row of boxes | Too many boxes for the width | Flows are capped at 5 steps; split the mechanism into two slides |
| A note squeezed into a vertical strip | A computed width reached near zero | Clamp the width in the kind, and give the note its own row |
| Labels overlap on a timeline | 6 points with long labels | Shorter `when` and `what`, or fewer points |
| Line breaks differ from the local file | Font substitution | Keep `font` to one Google has (Arial is the default) |
| Speaker notes missing | Notes not written by the spec | Notes come from each slide's `notes`; check one slide in Google's presenter view |
