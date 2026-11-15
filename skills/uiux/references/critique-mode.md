# Critique mode: one review

Read this when asked to review, audit, critique or grade a screen ("what's wrong with this", "is this good", `done`'s Design row, an approval gate before a redesign). A critique judges; it does not edit. Fixing starts only after the reader has the findings and picks what to change.

A design review is one review with one report and one score. It carries every check this skill and its modules own (`impeccable`'s heuristics, detector and two isolated reviewers; `taste`'s inspector, lint and critique questions; `taste-web`'s checker; this skill's own checks), run as one procedure rather than as separate reviews merged afterwards. A named critique or audit runs this same review. Module procedures are read from their files, never through a `Skill` call (no module is a skill). In a review this file overrides the module files on scoring, the reviewers' isolation order and the report's shape; a module file still supplies its checks, passes, questions and caps.

## Steps

1. **Capture once.** Screenshots at 375, 768 and 1280px saved as files on disk (a browser tool, a Playwright spec or the project's run skill), plus a short height where a stage is pinned to the screen. A subagent cannot see an image pasted into your conversation. An email or other fixed-width surface is captured at the widths it ships at (375 and its full width); a PDF, deck or document from its rendered pages.
2. **Run the machine checks that fit the surface.** They are evidence for the review, not the review, and a check that does not apply is listed as "not run: <reason>":
   - `impeccable`'s detector: `<this skill>/modules/impeccable/scripts/impeccable detect --json <target>` (setup in `../modules/impeccable/MODULE.md`; web markup only).
   - `taste`'s inspector: `node <this skill>/modules/taste/scripts/inspect.mjs <url>` (measures 1440, 768 and 390px itself); `--app` on an app screen so page floors (real pictures, no mono, no thin rules) do not fire on a dashboard; a reading page (docs, guides, articles) defends each page-floor exception in one line, as `taste` says; not run on email, PDF, decks or documents.
   - `taste`'s lint: `lint.mjs` on the source, or on the rendered HTML when the template language is one it cannot read (Blade, Twig, email layouts).
   - On a public page, `taste-web`'s checker (`../modules/taste-web/MODULE.md`, § 4 step 6, Check and look).
3. **Review with two isolated reviewers**, as `impeccable`'s critique sets them up (`../modules/impeccable/reference/critique.md`), and they never see each other's output. A judges the screenshots against the rubric below and gets no machine output. B judges the evidence: the step 2 outputs are handed to it in place of running the detector itself (it reruns one only when an output is missing), plus its browser evidence. Each brief carries its own paths, the absolute launcher path, the note that `.agent/skills/impeccable/` in `critique.md` means the module folder, a one-line audience and job (labelled inferred when it is), and the rubric. Run them as `general-purpose` agents without `name:` (a named agent's report never reaches you). Where no machine check applies (native app, email, PDF, deck, document), A runs alone with lint as its only evidence, and the report's method line says so. Without agents, the report opens with `impeccable`'s `⚠️ DEGRADED: single-context (<reason>)` banner, as its critique requires.
4. **Merge into one report.** De-duplicate, rank, and give the one score.

## The rubric

One score: `impeccable`'s ten Nielsen heuristics, each 0 to 4, over the applicable maximum (heuristics 7 and 10 may be n/a on a landing page; "not observable" is its own state). The other checks are read into the heuristic they bear on rather than scored apart:
- `taste`'s critique (`../modules/taste/references/critique.md`) and house rules, through aesthetic and minimalist design, consistency and recognition: its 14 passes (§ 1) are how those heuristics are looked at, and its caps (§ 3) hold as ceilings on the one score at the same fraction of the maximum (an open inspector FAIL holds it to 60%, as 6.0 of 10 does there; a page that could belong to anyone holds the aesthetic heuristic to the same share). Its fix-first order (§ 5) ranks the findings, and its three-round stop rule (§ 6) bounds any fix rounds that follow.
- This skill's checks: consistency with the app's own language and the sibling screens beside this one; mobile-first behaviour; the states beyond the happy path; the five questions in `core-principles.md#tension` (Swap, Squint, Signature, Token, Exclude); render evidence at 375, 768 and 1280px against `verification-checklist.md` (overflow, truncation, targets, contrast, states).
- For a landing page, portfolio or brochure site, `marketing-pages.md` is the yardstick for structure, proof, type and colour, skipping its dials and design-read steps.
- Where `taste`'s and `taste-web`'s house rules disagree (gradients, effects, dark heroes), the lead module for that page's kind (`../SKILL.md` § Route the job) decides, and the other's finding is a note, not a fault.

If the widths cannot be captured, or all you have is a pasted image, score what can be seen, mark each evidence check "not measured: no render at 375/768/1280", and say what would complete it: a URL plus a browser tool, or screenshots saved as files. The checks that read source (the detector, `lint.mjs`) still run on whatever source they can reach, and say what they could not measure.

## What the report holds

- One score line: the heuristic score over the applicable maximum (and any `taste` cap that held it), the method line (`impeccable`'s `Method:` header: dual-agent, design review only, or the degraded banner), and which machine checks ran (each "not run: <reason>" where one did not), so a skipped check shows.
- Findings de-duplicated and ranked by what the reader loses, not by how easy the fix is. Lead with the one that most blocks the screen's job. Each: what is seen, which heuristic, rule or check it breaks, who is affected, and the smallest change that would answer it.
- What works, in one or two lines, so a later fix pass does not break it.
- What the captures cannot show (dark mode, real mail clients, motion).
- The report is also saved under `.impeccable/critique/` in the project, as `impeccable`'s critique does; that is what a later polish and a score trend read. Claim a trend only from an earlier number on record there, in a task doc, or from the user.
- The decision the user needs to make is the last thing in the reply, asked once through `AskUserQuestion` (which findings to fix first). The suggested next step is "ask `uiux` to polish", since `/impeccable` is no longer a command.
