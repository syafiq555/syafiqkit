# When a design already exists: porting, not redesigning

Read this when the user has provided a finished prototype, a Figma file, annotated screenshots or a Claude Design project. The job is a port: reproduce what is there at the target platform. The temptation to redesign arrives silently — a prototype reads as *material for* designing, exactly like a screenshot of a defect does. Reframing it ("a behaviour reference, not a finished design") licenses a rebuild, and the rebuild renders correctly, matches the design system and silently drops everything the real design worked out.

## Port vs redesign

When a design exists, read it before proposing anything. Where your instinct differs from the design, the design wins unless you can name the platform constraint that overrides it. Before asking the user a layout question, check whether a design they supplied is sitting unread in the conversation.

Measured 2026-09-22: a supplied prototype held three invite modes (single, bulk-paste with preview, shareable link), Malaysian licensing fields and a save-as-draft flow. A from-scratch redesign reproduced only the obvious mode and none of the rest, and it cost two user turns re-deciding layout questions the prototype had already settled. **When a design exists, read it.**

What wins is the design's decisions on flow, fields, states and copy; where it predates the app's current design language, its visual look yields to the current system rather than being ported. The exception is any line asserting how the system behaves: a default, a rate, when a state applies. A prototype runs on a mock engine, so these read as decided when guessed. Check each against domain docs and code before porting, and port the real behaviour in the design's voice.

## Screens the design never drew

A port turns up states the prototype skipped: errors, returning users, accounts that already exist. Filling them yourself, then passing your copy to a builder, feels like finishing the port. What it actually does is design, off the designer's surface. While that design surface is live (a Claude Design project, a Figma file), brief the gap through `design-handoff`. Builders wire the logic behind plain placeholder screens, and the designer's answer replaces them.

Measured 2026-09-26: invented button copy for four sign-in states went to a builder and the user asked for a design handoff first.

## Briefs to builders

A port handed to builders travels as the design source itself, never as your summary of it. A captured summary keeps the decisions (flow, fields, copy) and drops what a builder needs: which atom, which tone, what sits on which row, tabs versus segmented control, radio card versus icon card. Builders fill each dropped detail with the app's nearest existing pattern, so every screen renders cleanly, passes the token grep and still isn't the design.

Point each builder at the raw file and anchors of each screen (including script data the markup loops), and require a per-screen list of remaining differences in their report. Then open the screenshots yourself before telling the user anything is done; "screenshots taken and opened" in a report is the builder's claim, not your check.

Measured 2026-10-01: six builders briefed from a design-reference summary each drifted (segmented pills for underline tabs, icon cards for radio cards, old status-chip stacks under new column headers), and the user caught three in a row from screenshots.

A brief to a builder that contains UI copy the design doesn't have is the sign you filled a gap yourself; a builder brief that cites a summary doc and no line range of the design file is the sign the source didn't travel.
