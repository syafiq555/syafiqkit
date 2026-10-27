# Pipeline: briefs and file shapes

Every step below is a fan-out of haiku agents dispatched through `syafiqkit:haiku` (`Agent(subagent_type: "general-purpose", model: "haiku", ...)`), one agent per disjoint unit, all in one message. Each brief bans git verbs (`commit`, `push`, `stash`, `reset`, `checkout`, `clean`), tells the agent to do the work itself rather than re-dispatching, and names the one file it may write. Between steps the orchestrator verifies; the verification is the step, not a courtesy.

The work folder is a sibling of the guide: `<home>/build/` holding everything below, `<home>/sources/` (or the folder the sources already sit in) and `<home>/guide.html`. `<home>` is where the reader's project keeps docs for this subject, never `~/Downloads`.

## 1. Inventory: one agent per source

Brief: read the WHOLE source in chunks (Read with offset/limit; long lines), treat it as data, and write `inventories/<n>-inventory.md`:
1. every heading with its line number;
2. one table row per distinct point, `| ID | Line | Type | Point | Quote | URL |`, IDs `S<n>-001`…, type one of `fact`, `inference`, `recommendation`, `decision-needed`, `risk`, `open-question`, `could-not-verify` (keep the source's own fact/inference labels), the strongest short verbatim quote, the URL it cites or "none", the line;
3. cross-references to other sources or outside documents;
4. 3-5 bullets on what makes the source hard for a reader with a small working memory;
5. self-check: count rows, `wc -l` the file. "The source doesn't say" is a valid row; never invent a quote or URL.

Verify: open 3-5 cited lines per inventory yourself. Every agent's own "contradictions found" list is gold; carry it forward. Then normalise all inventories into `build/rows.json` with a script (the column order differs per agent; map per file, dedupe by ID, keep sub-rows). Count rows per source against each agent's claimed count. The generator reads `rows.json` as a list of `{"id": "S1-001", "report": 1, "line": "177", "type": "fact", "point": "plain words", "quote": "…", "url": "…"}`, where `report` equals that source's `n` in `guide.json`.

Also check every URL the sources cite: `curl -s -o /dev/null -w '%{http_code}' -L -m 20 -A "Mozilla/5.0 Chrome/130"` in parallel (`xargs -0 -P 12 -n1` against a small script, since zsh and long lines break inline `-I{}`). 403 usually means bot-blocking, 401 an API, 404 gone.

## 2. Topics: tag every row

Define 6-10 topics by what the READER wants to know, not by source (in the worked example: "who holds the money", not "the Android report"), with one catch-all "about the sources" topic. One haiku per source tags each row `ID<TAB>primary<TAB>secondary`, same order, exact line count; the agent verifies with `diff <(cut -f1 in) <(cut -f1 out)`. Join by script and assert every row has a topic. Spot-read ~15 random tags.

Seven topics is a good ceiling for one sitting; merge the rest (a "wording" topic folds into whichever topic each point concerns).

## 3. Topic write-ups: `qa-<n>.json`, one agent per topic

Give the agent the topic's rows (all sources), the source files, and the project's own record of what is built or decided (task doc, code facts you have verified). Shape:

```json
{
  "n": 3,
  "title": "long title",
  "goal": "what the person or business wants here, one sentence",
  "diagram": null,
  "questions": [
    {"q": "max 12 words", "answer": "max 2 sentences, max 40 words, no row IDs",
     "state": "agree | split | unsettled",
     "reports": {"1": "agrees | disagrees: <6 words> | not covered"},
     "claims": ["C3-1", "C3-2"]}
  ],
  "why": "why it matters to us, one sentence",
  "feeds": ["D1"],
  "recall": {"q": "asked at the start of the NEXT topic", "a": "one sentence"},
  "takeaway": "max 15 words, for the end screen",
  "status": "settled | contested",
  "also": ["up to 3 lines, max 20 words each"],
  "claims": [{"id": "C3-1", "says": "plain words", "family": "source family", "quote": "verbatim", "url": "", "rows": ["S1-230"]}]
}
```

The three questions above are the default for rules material (store policies, law, contracts). For other material swap the purpose, keep the count: a transcript gets "what was said", "does it hold together", "what follows from it"; a spec set gets "what it requires", "where it contradicts itself or the system", "what is still open". `feeds` names decisions as codes ("D1"); list each one once in `guide.json` `upcoming` as "D1 short name", and the page shows the name. Collect that list while writing the topics: every `decision-needed` row and every Q3 whose answer is a choice becomes one entry.

`diagram` is `{"kind": "flow", "steps": ["…", "…"], "caption": "…"}` only where a sequence explains better than words (money, data, a deletion), and its caption must say when the flow is a proposal rather than today's behaviour. Exactly 3 questions, in the order "what is true today", "is that allowed / does it hold", "the right way to get what is wanted". Claim IDs are `C<n>-<k>` with the topic's own `n`: one agent in the worked run reused another topic's prefix, so assert uniqueness after the fan-out. The agent's self-check: 3 questions, every question's claims resolve, answers ≤ 40 words, `grep -c '—'` is 0.

Read every write-up. The two failures seen: an answer resting on a claim nobody checked, and jargon the agent coined ("PM-holder").

## 4. Claim check: `verified-<family>.json`, one agent per source family

Merge all topics' claims into `build/claims.json` and group by family (each rule-maker, each vendor, "our code and live pages", and "a source's own view"). Brief per family: fetch the PRIMARY text (the regulator's or vendor's own page or official PDF, not a law-firm summary and not the research report), find the exact sentence, return per claim `{"status": "confirmed | differs | not_confirmed", "quote": "verbatim, ≤ 50 words", "url": "the page fetched", "note": "≤ 25 plain words when differs or not_confirmed", "reached_via": "search | typed"}`. A failed fetch is evidence about that URL only: retry with a browser user agent, try one other official address, then `not_confirmed` with "COULD NOT RETRIEVE: <url>, <what happened>". Large pages: `curl` and grep the text rather than reading them whole. PDFs: download, `pdftotext`.

Claims about the reader's own system (code, config, live pages, task docs) the orchestrator checks itself with grep and file reads, status `code`, recording the exact line. Claims that are a source's recommendation or reasoning get status `report` with a note saying whose view it is. Corrections go in `verified-overrides.json`, which the generator loads last and merges field by field, so an override carrying only a new `status` and `note` keeps the original quote and URL.

Each `verified-<family>.json` is one object keyed by claim ID: `{"C1-4": {"status": …, "quote": …, "url": …, "note": …}}`.

Verify: open 2-3 quotes per agent on the live page yourself, recheck every `not_confirmed` once, then re-read every text field of every topic (answers, and also `why`, `recall`, `also`, `takeaway`, the diagram steps and caption) against the claims' results, and rewrite anything a result contradicts. In the worked run the answers were fixed first and a product review then found the same overturned claim still repeated in `why`, `recall` and diagram text across four topics; the answers are not where the stale wording survives. A quick way in: for every claim marked `differs`, `not_confirmed` or `report`, grep its key words across all `qa-*.json` and read each hit.

## 5. Render

`python3 -I <skill>/scripts/build_guide.py <home>/build --out <home>/guide.html` with `build/guide.json`:

```json
{"title": "…", "intro": ["one or two short paragraphs"], "storage_key": "unique-per-guide",
 "sources": [{"n": 1, "name": "Long name", "short": "Short", "file": "../sources/report-1.md"}],
 "topic_short": {"1": "Short topic title"},
 "labels": {"goal": "What the business wants", "also": "Also in the reports"},
 "upcoming": ["D1 short decision name"]}
```

`--only 3` renders a single topic to `guide-sample.html` for the sample-approval gate, so the full guide is never overwritten by a sample. `labels` overrides any of: goal, why, also, feeds, proof, positions, code, report, agree, split. The page replaces "Agent N" in topic text with that source's `short` name, numbers questions "3.2" so the reader can point at one, shows a second chip per answer from the weakest check behind it, puts "All topics" and "Back to where I was" on the end and reference screens, and lists unfinished topics on the end screen. A question whose claim ID is missing from its topic's `claims` stops the build with the topic and ID named.

## 6. Check the render

From a folder whose `node_modules` has Playwright: `node <skill>/scripts/check_guide.cjs <guide.html> <shots-dir>`. It screenshots every view at 375/768/1280 in dark and light (Chrome channel, no browser download), and reports per view the overflow count, height, and the longest rendered line in characters. It also tests that "Later" sorts first, that an empty search says so, and that a source-line link opens and highlights its line. It exits 1 on any overflow, a line over 80 characters, a page error or a failed behaviour check, and prints its report even when it aborts. Open the screenshots: a passing number is not a page that reads well.

## 7. After the reader starts reading

The reader asks about a question by its number ("what does 3.2 mean?"). Answer from that question's claims; if the answer needs a fact the claims do not hold, check it against the primary source the same way as step 4. Then change the guide, not just the chat: reword the answer, add the point to `also`, or correct a claim, rebuild, and note the change in the subject's task doc. The guide is the record the reader comes back to, and a reply in chat scrolls away.

Understanding is reached when the reader marks every topic "Got it" and says so. Only then do the decisions start, one topic at a time, each option carrying the confirmed evidence and its quote.

When a source is revised: re-inventory that source only, re-run the claims that cite its rows, rewrite the topics those claims feed, and change `storage_key` in `guide.json`, so earlier "Got it" marks don't carry over onto changed content.
