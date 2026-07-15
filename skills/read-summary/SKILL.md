---
name: read-summary
description: Read, find and understand task summary context before answering a question, investigating a bug, planning a deploy, or starting work in a project that uses tasks/**/current.md docs. Use at session start whenever the user references existing feature work, asks an investigative question about current system behavior ("why does X fail", "is Y still broken", "what's the status of Z"), asks what it takes to ship/deploy/release/go live ("if we deploy staging to production what do we need to do", "what's left before go-live", "is this ready to ship"), pastes a bug report or ClickUp ticket, or names a domain/feature that might have a task doc. Deploy and go-live questions are a PRIME trigger, not an edge case — the prerequisites, blockers, and env state live in task docs, never in the code. Trigger even when the user doesn't say "read summary" explicitly, and even when they name no feature — any request that could be answered wrong by skipping existing project context should go through this skill first.
---

# Read Summary

Read, find and understand task summary context. Run this **before** answering, investigating, or implementing anything in a project that keeps living docs at `tasks/<domain>/<feature>/current.md` — those docs carry decisions, gotchas, and vocabulary that isn't derivable from the code alone, and skipping them is how confident-but-wrong answers happen.

**Path Convention**: `tasks/<domain>/<feature>/current.md`
- Examples: `tasks/payment/gateway/current.md`, `tasks/tenant/rebate/current.md`

## Finding the Right Doc (when no path given)

⚠️ The request is usually a fuzzy task description, not a path. Folder names are engineer-domain-named and rarely match how you'd phrase the request (`upload-redesign` owns "QC delete child question"; `payout` owns "refund"). So **discover by content, not by folder name**:

1. **Search by content, in one tool block.** List the candidate docs **and** grep them for the *concept's vocabulary* from the request — include synonyms ("child"→"sub-question", "QC"→"review/screening", "refund"→"payout"), searching doc **body + header**, never the folder name alone. Include `_archive/` and flat `tasks/<domain>/<feature>.md` — whole features live there, not just `current.md`.

   ```bash
   grep -rli "payout\|disbursement\|settlement" tasks/    # which docs mention it
   grep -rn  "payout" tasks/payment/                      # where, with line numbers
   ```

   ⚠️ **Use `grep`. Never `rg` for this.** `Grep`/`Glob` are *tools* in some agent contexts (e.g. an `Explore` subagent) — use them when they exist. **The main loop usually has neither**, so discovery lands in Bash, and that is exactly where the footgun sits: `rg` has **no recursive flag** (it always recurses), so `-r` is `--replace`. Typing `rg -ril "payout"` — intending *recursive, case-insensitive, list-files* — prints every match with "payout" **replaced by the next flag character** and **exits 0**. No error, no stderr, and no config or strict mode can disable it. `grep`'s `-r` genuinely means recursive, so `grep -rli` is safe by construction. **The tell you already fell into it: your search term is absent from its own output, or an unrelated token sits where it should be.**

2. **Rank + disambiguate**: read the top 2-3 candidates' header block (`<!--LLM-CONTEXT...-->` if present — tolerate missing/varied headers) + `# Title` + `## Overview`. Follow any `Merged into`/`Supersedes`/`> 📖` redirect to the live doc. Treat index/hub docs (roadmap, `shared/`, `*-architecture`, parent `current.md`) as routers, not targets.

⚠️ **An empty result is a claim about your search, not about the tree.** Before concluding "no doc covers this", run a control that MUST hit (`grep -rl "current.md" tasks/ | head -1`). A wrong flag, a typo, or a gitignored `tasks/` dir all return a clean, confident, empty set.

A keyword match lands you in the right *folder*, not necessarily the right *bug* — so after the doc loads, restate the user's claim in your own words and confirm the doc addresses *that symptom*, not a nearby topic it happens to mention. And requests that arrive as chat transcripts often reveal their real claim only across several messages: if the central claim shifts (new symptom, a screenshot, or "this was fixed before and came back"), re-run discovery from step 1 rather than extending your first answer. A regression is its own investigation — find the prior fix and check what reverted, don't re-derive from scratch.

### Doc-staleness handoff (don't just narrate it)

⚠️ Reading a doc is also **auditing** it. While loading context you will often catch the doc contradicting the code you just examined — a `Status:` that says "not done" for a feature that's built, a `Provider:`/dependency named that the code has since swapped, a `Key files` path that moved, a date-conditioned caveat now past. **Do NOT just mention the drift in passing and move on** — that drops the fix on the floor, the exact failure this skill exists to prevent. When you spot staleness:

1. **Name it explicitly** as a stale-doc finding (which doc, which line/field, what the code actually shows), separate from answering the user's question.
2. **Route it, don't fix it inline** — this skill is read-only. Hand off: project facts (status, provider, moved files, expired caveats) → tell the user to run the `task-summary` skill (update mode); a skill/command defect → the `update-plugin` skill. Confirm scope before writing.

Staleness you surface and route is closed; staleness you narrate and abandon is a silent regression waiting for the user to catch it re-reading later.

⚠️ **The costliest stale row is a live "OPEN BUG" / "known issue" whose diagnosis another doc has RETRACTED.** The four shapes above are passive — a wrong `Status:` or a moved path leaves you *less* informed, and the code contradicting it is your cue. A retracted bug row is **active**: it hands you a causal story that *explains* the symptom you're hitting, so it reads as understanding, not confusion — and you (or an agent you spawned) will confidently report a blocker, citing it. **Confidence is the symptom.** Two tells: the row prescribes a fix ("don't diagnose it as a route bug") — a decided issue doesn't need one; and the behaviour it calls broken has an accepted *workflow* around it (a UI step, a role/agency switch) documented in the task doc that OWNS the decision. Before accepting any "known bug" as a blocker, read that owning doc — a claim in a `CLAUDE.md`/`CLAUDE.local.md` gotcha table is downstream of it and rots first.

⚠️ **A doc's stated ROOT CAUSE for a still-open bug is a hypothesis, not a finding — and it is usually written from the symptom, not the code.** The retracted-diagnosis trap above needs a *second* doc to contradict it; this one needs nothing — the row is current, uncontradicted, and simply wrong, so there is no cue at all. It reads as a completed investigation and hands you a fix to implement ("branch the dialog on `error_code`"), which is why you start coding instead of diagnosing. Two tells: the doc **prescribes a fix for a bug it still lists as open** (a decided fix implies a decided diagnosis — so why is it open?), and its own `Last Session` cops to writing it early ("mischaracterized the symptom before reading the code"). **Read the code path the doc blames before you change it.** Expect the real cause to be *adjacent but different in kind* — a doc blaming a dialog's error copy turned out to be a wrong gate predicate in another component, whose shared fix component already existed. You are implementing the fix; the doc only guessed at it.

### What the doc is authoritative FOR (and what it isn't)

⚠️ **A task doc is authoritative for DECISIONS and GOTCHAS. It is NOT a live-state oracle.** Those decay the moment anyone touches a server:

| The doc IS authoritative for | The doc is NOT authoritative for |
|------------------------------|----------------------------------|
| Why it's built this way (ADRs, rejected options) | What's in prod's DB / `.env` / a bucket **right now** |
| What will bite you (gotchas, traps, invariants) | Whether a flag is on, a table exists, a row is populated |
| Vocabulary, ownership, blast radius | Whether a bug it calls "open" is still open |
| Why we picked/evaluated a third-party tool | **What that tool actually DOES** — its delete/write scope lives in its source, never in our summary of it |

The trap is that a well-read doc makes you feel *fully grounded* — so you answer a live-state question from a snapshot that may be weeks stale, with total confidence. **If the answer depends on the current state of a running system, go MEASURE it** (query the DB, read the server's config, call the API), then reconcile with the doc. A doc's claim about prod is a **hypothesis to test**, not evidence — and when the doc and the live system disagree, the live system wins and the doc gets routed for update.

⚠️ **A doc that RESEARCHED a tool does not license you to RUN it.** When the task shifts from "what did we learn about X" to "let's use X" — and X writes, deletes, or migrates — the doc's summary bullets (stack, license, install command) are not grounding, they are a description of the box. Go read the tool's actual source (the delete paths, the protection carve-outs) and its issue tracker for data-loss reports, *before* the first destructive command. Measuring the live system does NOT substitute here: you can profile every byte on the disk and still not know what the tool will remove. The tell that you skipped this: you cannot name, from code you read, the exact paths the command touches.

⚠️ **Never infer a REMOTE system's state from a LOCAL file's absence.** "Prod's `.env` has no `AWS_*`" means *this machine isn't wired to S3* — it says nothing about whether the bucket exists. A missing config key describes wiring, not the remote world. Ask the remote system directly, with a call that **discriminates** (`HeadBucket`: 403 = exists-but-denied vs 404 = absent; a bare "it errored" collapses the two).

⚠️ **"It's the staging/sandbox/test one" is a live-state CLAIM, not a property of the name — measure it before you RECOMMEND acting there.** The rule above guards the answers you give; this guards the environment you send work to. A doc saying "staging exists for e2e, the flag is already on" tells you what that env was SET UP to be, never what it IS now — and it is the *reassuring* framing that suppresses the check. Test-ness lives in exactly one value: an API-key prefix, a bucket name, a DB name, a `mode` field. **Name that value and read it from the running process** (`printenv KEY` + a control that must resolve) before proposing anything irreversible there — a staging box on a live payment key looks identical to a sandbox until you read the key. The tell: you are about to recommend *where* to run something destructive, and your confidence in that place came from a sentence rather than a value you read.

## Read Order

⚠️ **Reading the task doc is the MANDATORY FIRST ACTION whenever this skill applies** — even for a "quick check." Not done until you've read the matching `current.md` (+ `decisions/*.md` if split), every CLAUDE.md on the path to the files in play (step 5), and the sibling repo's CLAUDE.md/CLAUDE.local.md if the question touches it at all (step 6). First tool call = discovery or direct Read, never a query/edit/answer.

1. Read the resolved `current.md` (via discovery above, or the given path)
2. ⚠️ **MADR index check**: a thin index (`## Decisions Index` routing table → `decisions/*.md`) holds NO ADR content itself — reading only the index reads zero decisions. Open the specific `decisions/<theme>.md` file(s) matching what you're investigating; multiple themes → read all. These are part of THIS doc, not the generic `Related:` cross-domain list — don't conflate them.
   - ⚠️ **Routers NEST — a theme file can itself be a router, and the parent index usually doesn't say so.** A busy theme splits again (`decisions/<theme>.md` → `decisions/<theme>/<sub>.md` → `<theme>/<engine>/<leaf>.md`), but the pointers ABOVE it are not updated by that split (nothing 404s, so nothing signals), so the index keeps describing a router as if it held the content. Landing on the file the index named and finding only a Quick Start + a `## Sub-Files` table is not "this theme is thin" — it is a **router, and the ADRs are one level down**. Never conclude a decision area is undocumented from a file that has no `Problem`/`Decision`/`Rejected` blocks in it. **`ls` the decisions tree once** (`grep -rl "" --include='*.md' tasks/<domain>/<feature>/decisions/`) rather than trusting the index's file list, and descend until you hit real ADRs. Same for a `📖 <file>` in an LLM-CONTEXT `Gotchas:` teaser or a `Next Steps` item — those rot in exactly the same way, and pointing at a router is how a fact gets *recorded* yet never *read*.
3. ⚠️ **Read EVERY doc in `Related:`** (cross-domain), not just on-topic-sounding titles. Two docs split by *audience* (e.g. admin-QC vs student-runtime) can still describe *one* subsystem — a tangential-looking title can be the most load-bearing related doc. Only conclude "not relevant" after reading it, never from the title.
4. If Related mentions `tasks/shared/*.md`, read those too
5. **CLAUDE.md tree walk** — read every CLAUDE.md on the path to the files this task touches (root → layer → subdir → domain), auto-loaded additively by directory:
   - **Layer**: `app/CLAUDE.md` (backend) / `resources/js/CLAUDE.md` (frontend)
   - **Subdir**: e.g. `resources/js/routes/CLAUDE.md` — exists where a section split down a level; don't assume layer is deepest
   - **Domain**: `app/Domain/<Domain>/CLAUDE.md` (capitalized), inferred from task path
   - **Companion**: a `📖`/`> 📖` pointer inside a loaded CLAUDE.md to a sibling `CLAUDE-<topic>.md` (e.g. `resources/js/CLAUDE-gotchas.md`) — these do NOT auto-load, so the tree-walk misses them. Follow the pointer when your task matches its named symptoms; the companion holds real facts the main file moved out to stay lean.
   - Plus any CLAUDE.md named in `Related:`
   - Discovery: `rg --files -g '**/CLAUDE.md'` scoped to the dirs in play
   - ⚠️ Scope to dirs actually in play (match blast radius, not repo size) — but this token-scoping is within-repo only, not licence to skip step 6.
6. ⚠️ **SIBLING REPO** — if the question touches a second repo at all, Read its `CLAUDE.md` + `CLAUDE.local.md` FIRST. Gated on the **question's scope, not which files you'll edit** — a read-only planning question edits nothing, so step 5's tree-walk never fires and this is the one most often skipped. The harness only walks the tree from the working dir, so a sibling's CLAUDE.md is invisible while the current repo's *did* auto-load — context feels complete when it isn't. Read root `CLAUDE.md` + `CLAUDE.local.md` (per-env state/credentials) + any relevant subdir CLAUDE.md before any claim about the sibling's env keys, buckets, containers, credentials, deploy mechanics, or server state. Its task docs live in its own `tasks/**` tree.

**Shared docs**: Check `Glob: tasks/shared/*.md` for cross-domain references if they exist.

---

## Intent Detection

Determine the type of the user's request. **Reading the doc (full Read Order) is unconditional and comes first for every intent.** The intent only decides what you do *after* the read — it never excuses skipping it:

- **Doc path** — matches `tasks/*/current.md`, a `domain/feature` slug, or a file path → Read the doc using the Read Order above, then **wait for the user's next instruction**. ⚠️ A path handed to you *alongside an action* ("here's the doc, now let's do X") is a doc path **plus** a task — the doc is the starting context, not the finish line. If X means running a third-party tool the doc merely researched, read that tool's source before the first destructive command (see the authoritative-for warning above).
- **Investigation / diagnostic** — a read-only question about current state: "is X paid by card?", "why did Y fail?", "check on production", "what's the status of Z?" (often with a screenshot). This is the easiest intent to mishandle: the question feels self-contained, so the temptation is to answer or query immediately. Don't. Infer the domain, run the full Read Order first, THEN investigate and answer.
  - **Multi-image / multi-message requests carry MORE claims, not fewer.** A request bundling several screenshots ("[Image #1]...[Image #4]") is rarely one symptom — each image is typically evidence for a distinct clause (a test result, a UI state, a data-linkage gap). Before answering, enumerate what each image is evidence *of*, not just what the text says: a request like "on our last E2E we did this [screenshot], but [screenshot] the account isn't even linked?" has at least two claims to reconcile (E2E outcome + the linkage gap), and the doc/code must address both, not just whichever is easier to confirm from the task doc alone.
  - **Exit gate.** The Read Order guards the *front* of an investigation; this guards the *exit*. Before sending a conclusion, state side-by-side the question the user asked and the question you actually answered. If they differ — you confirmed an easy adjacent fact instead of the hard thing asked — that's *attribute substitution* (e.g. confirming a field's *value* when the real question was *which field is authoritative*); re-open and answer the one asked. Your conclusion must reconcile **every** clause and number the user gave, not just one.
- **Task description** — contains a bug report, feature request, ClickUp paste, chat transcript, or any actionable work description (not a path) → Read relevant context (infer domain from keywords, find matching `tasks/**/current.md`, load domain CLAUDE.md), then **proceed to implement the task**.

## After the Read: Plan Mode vs Normal Mode

The Read Order above is unconditional in both modes — what changes is what happens once the doc is loaded:

- **Normal mode**: once the doc(s) are read and the intent's follow-up action is clear, continue straight into it (answer, investigate, or implement) — no extra hand-off step.
- **Plan Mode**: after the read, judge whether the request still needs deeper exploration before a plan can be written. A narrow, well-covered question (the doc plus a quick code check fully answers it) can go straight to drafting the plan. A request that spans unfamiliar code, multiple domains, or where the task doc's `Key files` don't obviously cover the blast radius, should delegate to the `Explore` or `Plan` subagent for that deeper pass — reading one doc is not a substitute for exploring code you're about to plan changes against. Use judgment on which one: `Explore` for "where does X live / what calls Y", `Plan` for "design the implementation approach." Don't reflexively spawn a subagent for every Plan Mode request — only when the doc read leaves a real gap the plan can't be written without closing.
