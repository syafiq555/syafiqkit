# uiux scripts

Deterministic instruments for the defects a screenshot read misses. Node 22+, no npm install. Chrome, Edge or a Playwright Chromium must be installed.

## check-render.mjs

```
node check-render.mjs <url | file.html> [--out DIR] [--widths 375,768,1280] [--scheme light|dark|both]
                      [--storage-state auth.json] [--selector css] [--allow id,id] [--json]
```

Renders the page at each width (default 320, 375, 768, 1280) in each colour scheme (default both when the page has a dark theme, else light), writes a top-of-page and a full-page PNG per run plus `report.json` to `--out` (default `uiux-check/<timestamp>/` in the OS temp folder, so nothing lands in the repo), prints a table, the screenshot paths and a closing PASS/FAIL line that also counts WARNs not in `--allow` and names their ids. Exit 1 when a FAIL is not in `--allow` (a WARN never fails), 2 on a usage or load error, or when any width/scheme run errored partway (the verdict then says the check was incomplete). An HTTP 4xx/5xx response prints a warning, since an error page would otherwise pass. `--json` prints the full report instead of the table.

`--storage-state` signs in from a Playwright storage-state file (the login an e2e suite saves). `--selector` limits the element checks to that subtree; document-level checks still run. Herd's "Edit with Herd" pill is hidden before measuring.

| id | level | what it means |
|---|---|---|
| `contrast` | FAIL / WARN | text under WCAG AA (4.5:1, 3:1 large) against the painted backdrop; WARN when a gradient or picture sits behind and it cannot be measured |
| `clipped-text` | FAIL | text cut by an ancestor's `overflow:hidden` or a fixed height, with no ellipsis |
| `truncated` | WARN | ellipsis or line-clamp with no `title` / `aria-label` to read the full text |
| `overlap` | FAIL / WARN | a control intersects another control (FAIL) or text (WARN) by more than 4px |
| `covered` | FAIL / WARN | something sits over the centre of a control at the top or bottom of the page; a fixed or sticky cover is FAIL |
| `tap-target` | FAIL / WARN | widths up to 430px: under 24x24 FAIL, under 44x44 WARN |
| `cursor` | FAIL / WARN | clickable element without a pointer cursor (FAIL for `button` and `a[href]`) |
| `sibling-size`, `sibling-align`, `uneven-gap` | WARN | three or more consecutive look-alike siblings with uneven heights, off-grid edges or unequal gaps; the odd one is named |
| `card-in-card` | WARN | a bordered or shadowed rounded box inside another within two levels, both over 120px wide |
| `h-overflow` | FAIL | the page scrolls sideways, or text runs past the edge under a hidden `overflow-x` |
| `em-dash` | FAIL | an em dash in visible text, a placeholder or a pseudo-element |
| `modal-open` | WARN | a dialog is open at load, so the screenshots show it and the page behind is only partly checked |
| `viewport-meta` | WARN | no viewport meta, so phones shrink the page |

Known limits: click listeners are seen only when attached directly (delegated React or jQuery handlers are invisible, so a clickable `div` there is caught only by `role`, `onclick` or framework attributes); a gradient or picture backdrop is reported as "cannot measure" and never as a pass; a bottom-of-page cover check needs a page that actually scrolls.

## probe-design-system.mjs

```
node probe-design-system.mjs [repo-root=.] [--json]
```

Read-only. Reports the stack, token sources (Tailwind config keys, `@theme` blocks, CSS custom properties by prefix, theme files), shared component directories with import sites for the top 20, raw-value counts per file (colour literals, Tailwind arbitrary values, inline styles, `!important`, px in style props, literal component props) outside token files, whether a token lint exists (`tokenLint: present|absent` with evidence), and the repo's CLAUDE.md files. Email templates, static exports and fixtures are not counted as leaks.
