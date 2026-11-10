# Deck spec

One JSON file. Paths inside it are relative to the spec. Word limits are enforced because the text sits in fixed boxes; going over means rewording, not resizing.

## Top level

| Field | Meaning |
|---|---|
| `title`, `author` | File metadata |
| `slides` | The slides in order (types below) |
| `parties` | Who acts or pays: a list of names (colours assigned) or `{"Name": ["fillHex", "inkHex"]}`. Every `actor`, `by` and `who` must be one of them |
| `tracker` | Optional section names (max 2 words each) drawn as a progress strip; a slide's `section` (1-based) lights one up |
| `sources` | Files quotes are checked against (the spec, contract, quotation as text) |
| `facts` | Files holding the running example's fixed facts (order lines, totals): figures a `quoted` example may use |
| `workings` | Files holding figures we calculated from the sources: figures a `worked` example may use |
| `currency` | Prefix for amounts, default `RM` |
| `figure_pattern` | Regex for what counts as a figure to check; default is currency amounts (whole or two decimals), percentages and durations (`3 days`, `24 hours`). Matching is by whole number, so `0%` never matches inside `80%` |
| `example_labels` | Badge text per example kind: `{"quoted": "From the quotation", "worked": "Worked from quotation rates", "made_up": "Made-up numbers"}` |
| `strip_label`, `waits_label` | Bottom-strip labels on mechanism and journey slides, default "In the source" and "Waiting on" |
| `theme` | Colour token overrides: `ground surface sunk ink soft accent onAccent ours oursInk open openBg font` (hex without `#`) |

## Slide types

Every slide may carry `notes` (1 to 5 lines, the presenter's prompts), `id` and `section`.

- `title`: `title` (max 12 words), `subtitle`.
- `text`: `heading` (max 5 words), `sub`, `bullets` (1 to 6, max 18 words each). Use sparingly: the running example's set-up, a close.
- `table`: `heading`, `sub`, `columns` (3 to 5), `rows` (2 to 7, cells max 8 words), optional `total` row.
- `mechanism`: the core slide. Fields:
  - `heading` (max 5 words) and `sub` (the claim, max 100 characters)
  - `visual`: one of the kinds below
  - `example`: `{"kind": "quoted" | "worked" | "made_up", "lines": [2 to 6 lines, max 16 words]}`
  - `rule`: optional, the source's own rule, max 30 words
  - `waits_on`: open points, each max 3 words ("Row 8")
  - `src`: `[{"file", "line", "quote"}]`, required when `sources` is set. The quote is copied character for character, is at least 20 characters, and must sit within 12 lines of `line`
  - `kicker`: overrides "How it works"

- `journey`: one person's path through a mechanism, drawn as pictured moments with everyone else's work beneath. Put it right before the mechanism slide it belongs to. Fields:
  - `person` (max 3 words, how the slide names them: "Aina", "The roaster") and `actor` (their colour, one of `parties`); the heading defaults to "Aina's journey", override with `heading` (max 5 words) and the "User journey" kicker with `kicker` (e.g. "Only if the client picks B")
  - `goal` (max 14 words): what the person is trying to get done, in the running example's terms
  - `moments`: 2 to 6 main moments in time order, at most 8 in all, each `{icon, label ≤6 words, where, screen?, tool?, eg? ≤7 words, when?, under?}`. `icon` is a [lucide](https://lucide.dev/icons) name (`credit-card`, `mail`, `truck`, `package`). `where`: `outside` (no screen for it: a phone call, a delivery, a bank transfer), `email`, `screen` plus `screen` (its name, max 4 words), `tool` plus `tool` (a named outside system, max 3 words). A moment is something the person does or sees, never `auto`
  - An alternative path: a moment with `under` (the main moment number it replaces) and `when` drops to a dashed second row numbered `3b`. `when` reads as the condition itself, starting If, Once, After, Until or When. One alternative per main moment
  - `behind`: up to 8 cards for what others do out of the person's sight, `{at (main moment number), actor, label ≤6 words, where, screen?, tool?}` (`auto` allowed here), at most 2 under one moment. This is where hand-offs show
  - `numbers`: `quoted` (default), `worked` or `made_up`, checked like a mechanism example; `made_up` adds the badge; `quoted` and `worked` journeys carry no badge, so a journey's figures come from the mechanism slide's example that follows it
  - `rule`, `waits_on`, `src` as on a mechanism slide. With `sources` set, every `screen` and `tool` name must sit within 3 lines of a cited line, matched as whole words (a cited "SoftPOS Application" does not license "SoftPOS App"), so a screen the source never names is refused. A system the audience already owns and the source never names (the client's own POS beside a vendor's docs) goes in a short running-example file listed in `sources`, which the moment then cites, rather than borrowing the vendor's nearest phrase
  - Needs `lucide-static` and `@resvg/resvg-js` beside pptxgenjs; icons are rendered once into `icons/` beside the output file

Figure check on a mechanism slide: every figure in the visual, example, sub and rule must be near its cited lines, or in the files its example kind allows (`quoted`: `facts`; `worked`: `sources`, `facts`, `workings`; `made_up`: unchecked). Waterfall and share amounts are checked as numbers. Figures on `text` and `table` slides (sub, bullets, rows, total) must appear in the sources, facts or workings files.

## Picture kinds (`visual.kind`)

| Kind | Shows | Shape and limits |
|---|---|---|
| `flow` | Steps where the order is the point, with an optional "if" branch | `steps` 3 to 5 `{label ≤6 words, actor, note? ≤12}`; `branch {from_step (0-based), when ≤6, steps 1 to 3}` |
| `split` | One thing becoming several | `from {label, items 1 to 6}`, `to` 2 to 4 `{label, tag? ≤4, items}`; item `{name ≤4, cls? dry/chilled/frozen, sub?}` |
| `compare` | Two options or cases side by side | `left`/`right {heading ≤6, tone, lines 2 to 5 ≤12 words}` |
| `panels` | Two states, each made of groups | `panels` exactly 2 `{heading, tone, groups 1 to 4 {label, tag?, items 1 to 4}}` |
| `waterfall` | An amount stepping down or up | `start {label, amount}`, `steps` 2 to 6 `{label ≤7, delta, by}`, `end {label, amount}`; numbers, must add up |
| `share` | One amount cut into parts | `total {label, amount}`, `parts` 2 to 5 `{label ≤5, amount, who}`; must add up |
| `timeline` | Dated or timed points | `points` 3 to 6 `{when ≤4, what ≤10}` |
| `clocks` | Several timers starting from one event | `start {when ≤4, what ≤10}`, `bars` 2 to 4 `{label ≤5, end ≤4 or null, note ≤12}`; `null` draws a dashed "length not set yet" bar |
| `ladder` | A fallback order, first match wins | `tiers` 2 to 4 `{if ≤8, then ≤10}` |
| `ledger` | Entries in a table | `columns` 3 to 5, `rows` 2 to 7, `total?`; strings |

`tone`: `now` (what gets built), `other` (the alternative), `warn` (a risk), `same` (both are real: two cases of one rule, shown without a caption). Two options that are both built are `same`, not `now` vs `other`.
