---
name: md-to-pdf
description: Convert Markdown documents to professional PDFs with rendered Mermaid diagrams and charts (bar/line trend charts via xychart-beta). Use when user asks to "export to PDF", "generate PDF", "make a PDF", needs a shareable document from markdown files, or asks for a "chart"/"graph"/"diagram" in a report or document.
---

# Markdown to PDF

Convert Markdown files to clean PDFs with rendered Mermaid diagrams **and charts**.

⚠️ **Mermaid does quantitative charts, not just diagrams — never tell the user a chart isn't possible here.** `xychart-beta` renders bars and lines with real axes and gridlines, so a trend or comparison in a table can become a chart in the same pipeline.

| Want | Use |
|------|-----|
| Trend over time, comparison across categories | `xychart-beta` (bar/line, real axes) — pass `-c theme.json`, see Gotchas |
| Flow, hierarchy, funnel, state | `flowchart` / `sequenceDiagram` |
| Part-to-whole, top slice under ~85% | `pie showData` |
| Part-to-whole where one slice dominates | **Neither — keep the table.** Small slices collide into unreadable overlapping labels; a chart less legible than the table it duplicates is worse than no chart |

## Prerequisites

| Tool | Install | Purpose |
|------|---------|---------|
| `md-to-pdf` | `npx --yes md-to-pdf` (no install needed) | Markdown → PDF via Chromium |
| `mmdc` | `npx --yes @mermaid-js/mermaid-cli` (no install needed) | Mermaid → PNG rendering |

Both run via `npx` — no global install required.

## Workflow

### 1. Check for Mermaid diagrams

```bash
grep -c '```mermaid' <input.md>
```

If count > 0 → proceed to Step 2. If 0 → skip to Step 4.

### 2. Extract and render Mermaid diagrams

For each mermaid code block:

```bash
# Create diagrams directory next to the source file
mkdir -p <source-dir>/diagrams

# Write each mermaid block to a .mmd file
# Name descriptively: current-workflow.mmd, architecture.mmd, etc.

# Render to PNG
npx --yes @mermaid-js/mermaid-cli -i <name>.mmd -o <name>.png -w 1200 -b white
```

**Width guidelines**:
- Sequence diagrams with 4+ participants: `-w 1200`
- Simple flowcharts: `-w 900`
- Small diagrams (2-3 nodes): `-w 600`

### 3. Create PDF-ready copy

Copy the source markdown to `<name>-pdf.md`. Replace each mermaid code block with its rendered image:

```markdown
<!-- Replace this: -->
` ` `mermaid
sequenceDiagram
    ...
` ` `

<!-- With this: -->
![Diagram Title](diagrams/<name>.png)
```

Keep the original `.md` as the editable source (with mermaid code blocks intact).

### 4. Generate PDF

```bash
cd <source-dir> && npx --yes md-to-pdf <name>-pdf.md
```

Output: `<name>-pdf.pdf` in the same directory.

If no mermaid diagrams (skipped step 2-3), convert directly:

```bash
cd <source-dir> && npx --yes md-to-pdf <name>.md
```

### 5. Rename output (optional)

```bash
mv <name>-pdf.pdf <desired-name>.pdf
```

### 6. Verify

Read the PDF to confirm diagrams rendered and tables are formatted correctly.

## File Convention

| File | Purpose |
|------|---------|
| `<name>.md` | Editable source (mermaid code blocks) |
| `<name>-pdf.md` | PDF-ready copy (image embeds) — regenerate from source |
| `<name>.pdf` | Final output |
| `diagrams/*.mmd` | Mermaid source files |
| `diagrams/*.png` | Rendered diagram images |

## Gotchas

| Issue | Fix |
|-------|-----|
| `md-to-pdf` doesn't render Mermaid | Pre-render to PNG (Step 2-3) — this is by design |
| Diagram text too small in PDF | Increase `-w` width param in mmdc |
| Mermaid `<br/>` in participant names | Works in mmdc but renders as literal text in md-to-pdf code blocks |
| `--dest` flag not supported | `md-to-pdf` outputs to same dir as input — use `mv` to relocate |
| PDF page breaks mid-table | Add `<div style="page-break-before: always"></div>` before sections |
| Emoji rendering (🔴 ✅ 🟡) | Works in md-to-pdf (Chromium-based) — no issues |
| `xychart-beta` line series near-invisible (pale lavender) on default theme | Pass `-c theme.json` to mmdc with `{"themeVariables": {"xyChart": {"plotColorPalette": "#2563eb, #dc2626"}}}` — one color per series, then verify the PNG visually |
| A rendered PNG exists, so the diagram is assumed correct | `mmdc` exits 0 on charts that are unreadable (colliding labels, invisible series). Read every PNG before embedding — a file that rendered is not a file that communicates |
