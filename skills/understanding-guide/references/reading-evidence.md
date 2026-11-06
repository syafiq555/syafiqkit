# Why the page is shaped this way (sources opened 23/10/2026)

| Choice | Evidence |
|---|---|
| Recall question before each topic, unscored; "Later" topics come back first | Dunlosky et al. (2013) rate practice testing and distributed practice the most effective of ten techniques: "We rated two strategies—practice testing and distributed practice—as the most effective" (American Educator summary, https://www.aft.org/sites/default/files/dunlosky_0.pdf). The recall sits at the START of the next topic, because asking right after reading tests short-term memory only |
| No highlight layers, no "read it again", no speed modes | Same source rates highlighting and rereading low. Rayner et al. (2016): "there is no quick and easy way to improve reading speed while avoiding costs to comprehension" (https://www.psychologicalscience.org/publications/speed_reading.html). Time is saved by choosing what to read |
| Questions first, three per topic | Adler and Van Doren's inspectional reading (survey before reading); adjunct questions help comprehension of the material they target, not the rest, hence the "Also in the sources" lines |
| Per-question "what each source says" | Adler and Van Doren's syntopical reading: comparing several sources on one subject is the step a reader cannot do alone across hundreds of pages |
| Answers always visible, only proof behind a tap | GOV.UK Design System, accordion: "Do not use an accordion for content that all users need to see. Test your content without an accordion first" (https://design-system.service.gov.uk/components/accordion/) |
| 60-70 characters per line, left aligned, 1.5 spacing | WCAG 1.4.8: "Width is no more than 80 characters" (https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html); the British Dyslexia Association style guide gives 60-70 |
| One open proof at a time, one main action, few controls | Impeccable critique of the first proposal: 14+ tappable things per topic breaks the "no more than 4 visible options" rule |
| Optional Listen | Text-to-speech helps readers with ADHD-related reading difficulty in small studies; offered, never the default |

SQ3R/PQ4R as a named method has "very little empirical support" (The Learning Scientists, https://www.learningscientists.org/blog/2021/3/4-1); only its survey and question steps survive here. Live products (GOV.UK step-by-step, Google Play's Policy Summary / Full Policy split, Apple's "Intentionally omitted" for retired rules) informed the shape, but the reader in the worked run found those pages hard too, which is why the page goes further than they do.

## Comparing two documents {#comparing-two-documents}

Measured 05/11/2026 on a client requirement spec against a vendor quotation. The three-card topic (what the spec asks, what the quotation promises, what is open) was rejected by the same reader: "too many repetition ... it didn't flow with my mind, have to read multiple times go back and forth especially if the source is in multiple places". The figures repeated across the intro, diagram and two answers, and each comparison was split across two cards.

| Choice | Evidence |
|---|---|
| Verdict first, then one row per point with both documents side by side, grouped "needs an answer", "left out", "these match"; each fact once per topic | Sweller, redundancy principle: "redundant material interferes with rather than facilitates learning" (https://www.cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/redundancy-principle-in-multimedia-learning/1CB52515DB655365BDBEBD85FEFD680A). Ayres and Sweller, split attention: materials should be "physically and temporally integrated" (https://cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/splitattention-principle-in-multimedia-learning/497A2FCB9737E3009B3CF0E4D97F7B99). NN/g: "The story should start with the main point" (https://www.nngroup.com/articles/inverted-pyramid/) |
| Each open point says who answers and what changes if the answer differs | Where the vendor document has its own assumptions table, use its "until then" and "if different" columns rather than writing new ones |
| Clicking a side opens the source text with the quoted lines highlighted, beside the row on wide screens; no expand and collapse | The reader asked for it ("instead of collapse/uncollapse, straight away open the source where applicable, highlighted"). legislation.gov.uk keeps changes in place with annotations (https://www.legislation.gov.uk/ukpga/2010/15/section/1) |
| Anchor each point on its quoted string and find its lines at build time, failing the build when the string is gone | Line numbers of a text copy shift with every new document version, and the highlight then lands on the wrong sentence without an error |

A derived claim is still a claim: a row saying a 3.5% fee was "not on top of" a 10% fee survived the quote check because both quotes were real, and only the critique, reading the worked example, caught that the example charged both.
