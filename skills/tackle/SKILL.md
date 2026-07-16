---
name: tackle
description: Take a unit of work from wherever it stands to done — existing task doc or brand-new idea. Reads or writes the doc, triages what's actually buildable, builds it via delegated agents, wraps up. Use when the user names a task doc plus any vague continuation ("lets continue", "lets do this", "do the next steps", "delegate to sonnet"), pastes a task-doc path with a line range, asks to work through a doc's Next Steps — OR describes new work that has no doc yet ("add CSV export to invoices", "build X", "improve onboarding"). Triggers even when they don't name this skill: a task-doc path plus an unspecific "let's go" IS its signature, and so is a feature request with no existing doc. Do NOT use for a one-line bug fix (just do it) or a pure question (use read-summary).
---

# Tackle

Take work from wherever it stands to done: **context → triage → explore → build → wrap**.

Two entry paths, one flow:
- **Doc exists** → read it, triage its open items.
- **No doc** → establish the shape, write the doc, then triage it like any other.

This exists because the manual version has a reliable failure: the session reads the doc, hits a list of open items, asks *"which of these do you want?"*, gets **"all of them"**, and only then discovers half can't be done — one needs a lawyer to reply, one needs a deployed box, one only makes sense after another lands. **The split was always the work. The question never was.**

## The one rule

⚠️ **Triage. Never enumerate.**

A menu of open items is not a decision — it's the decision deferred, handed to someone who can't see which items are blocked. Asking "which do you want?" reliably returns "all", because from the outside they all look equally buildable. **You are the one who can tell they aren't.**

| ❌ Never | ✅ Always |
|----------|----------|
| List the doc's open items and ask which to do | Classify each by blocker, recommend a sequence, state what you're NOT doing and why |
| Offer an option you can't actually execute | Name it as human-blocked and hand it back explicitly |
| Treat "user picked everything" as scope | Treat it as the triage having been skipped — do it now |
| Ask because the doc is ambiguous | Read the code the doc points at; most "ambiguity" is unread context |

`AskUserQuestion` fires **only** on a genuine tie between two equally-good sequences, or an item you cannot classify after reading. Not for scope. Not for permission. (Same default-recommend inversion as `merge-task-docs` — D28.)

---

## Step 1 — Context

Invoke the `read-summary` skill with the doc path (or the user's description if no path). It owns discovery, the `decisions/*.md` descent, and the CLAUDE.md tree walk — **do not reimplement any of it here** (D4).

If the user gave a line range (`current.md#L134-140`), those lines are a **pointer to where they were looking**, not a scope boundary. Read the whole doc; the items usually span more.

**Doc found → Step 2.** No doc → Step 1b.

⚠️ **"No doc" is a claim about your search, not the tree.** `read-summary` requires a must-hit control before accepting an empty result (`grep -rl "current.md" tasks/ | head -1`). A gitignored `tasks/`, a typo, or a wrong flag all return a clean, confident, empty set. Never open Step 1b on an unverified absence — writing a fresh doc for a feature that already has one is how a doc gets forked.

## Step 1b — No doc yet (greenfield)

**Is the shape clear?** Judgment call, same as triage — not a question you ask.

| Signal | Read | Do |
|--------|------|-----|
| Names a concrete change with an obvious surface — "add CSV export to the invoices table", "the login button 404s on mobile" | **Clear** | Straight to writing the doc |
| Names an outcome with many possible shapes — "improve onboarding", "make search better", "we need reporting" | **Unclear** | `brainstorming` skill first, then write the doc |
| Names a change to a system you haven't read | **Unknown, not unclear** | Step 3's `Explore` sweep first, then re-judge — don't brainstorm your way around unread code |

⚠️ **Unclear ≠ unfamiliar.** A request that's precise but touches code you don't know needs *reading*, not a design dialogue. Brainstorming is for genuine ambiguity about **what to build** — never a substitute for going and looking.

Then invoke the **`task-summary`** skill (Create mode). It owns path resolution, domain inference, templates, and cross-refs — **don't hand-write a doc here** (D4).

The doc you write becomes Step 2's input. A new doc's items are usually all "actionable now" — but not always: a feature needing a vendor key or a deployed box is **born** human/env-blocked, and triage must catch that before you build against a blocker.

⚠️ **Write the doc before building, not after.** It's the artifact that makes the next session cheap, and it's where triage reads from. Building first and documenting after produces a doc that describes what you happened to write rather than what was decided.

## Step 2 — Triage ⚠️ THE POINT OF THIS SKILL

**Stays inline, on your own model. Never delegate this.** Retrieval is cheap to farm out; judgment isn't, and a wrong triage verdict costs more than every token it saves (D30).

Enumerate every open item (`## Next Steps`, "Immediate next actions", inline `- [ ]`, anything the user's line range covered). Classify each:

| Class | Meaning | Your move |
|-------|---------|-----------|
| **Actionable now** | Code you can write against this repo today | Build it (Step 3+) |
| **Human-blocked** | Needs a person to act outside the repo — send a draft to a vendor, get counsel's reply, sign a contract, pay for a plan | ⚠️ **Say plainly you cannot do it.** Never leave it looking scheduled |
| **Env-blocked** | Needs a deployed box, prod data, a live key, a load-test target | Name what's missing; sequence after, or hand back |
| **Dependent** | Only coherent *after* another item lands (polish passes, design passes over surfaces that are about to change) | Sequence explicitly behind its blocker |

⚠️ **Classify from the code, not the doc's phrasing.** A doc says "wire up X" for something already wired and dormant; it says "waiting on vendor" for a draft still sitting unsent in the repo. The doc is authoritative for *decisions and gotchas*, never for *current state* — go look.

⚠️ **A "drafts already written" item is human-blocked, not actionable.** The artifact existing in the repo is what makes it *look* buildable. The blocker is the sending, and you can't send.

**Output** — prose, not a menu:

> Of the 7 items: **3 are buildable now** (L134 generate-agreement button, L135 email confirmation, L136 tenant empty-state) — I'll do these, in that order, since L136 shares the surface L134 changes.
> **2 need you**: L138's eKYC draft goes to Pos Digicert, L139's disclosure goes to counsel. Both drafts are written and sitting in the repo — I can't send either.
> **1 is its own phase**: L140 e-stamping is a multi-day build with its own decision doc — separate session.
> **1 sequences after**: L137's polish pass only makes sense once L134/L136 have changed the surfaces it would polish.
>
> Starting on the three now.

Then start. Don't ask permission to follow your own recommendation.

## Step 3 — Explore (mechanical only)

Spawn parallel `Explore` agents (`model: "haiku"`) for blast radius and file discovery on the actionable items only.

Delegation contract — raw-not-ranked, the `rg` prohibition, `run_in_background: false`: **`_shared/references/explore-delegation.md`**. Follow it; don't restate it.

Haiku is safe **here and nowhere else in this skill** — this is pure retrieval. The moment a step needs ranking, staleness, or a root-cause call, it stays on your model (D30).

## Step 4 — Build

**4a — Approach** (skip for a change whose shape is obvious): `Plan` agent, one per genuinely distinct item. Read-only; returns the approach.

**4b — Implement**: `task-builder` agent (sonnet), **partitioned by FILE, never by task**. Two agents writing one file clobber each other and neither notices. Where one agent's code must call another's, pin the exact signature verbatim in **both** prompts.

Each agent's prompt names the task doc path first (Bootstrap: agents read CLAUDE.md and the doc at runtime, no injection — D1).

Verify the seam yourself afterward. `git status --short` for the real picture — `git diff --name-only` hides untracked and already-staged files, so a fresh file reads as "nothing happened".

## Step 5 — Wrap

Invoke the `done` skill. It owns simplify/review/docs/capture — don't inline its steps (D4).

Then report, in this order:
1. **What shipped** — plain terms, layperson-readable.
2. ⚠️ **What you did NOT do, and why** — the human-blocked and env-blocked items, restated. This is the payload. An item that silently vanishes between triage and summary reads as done, and that's the failure this skill exists to prevent.
3. Any item whose classification changed once you saw the code.

⚠️ **Report your own deviations** (D24). If you skipped a step, asked when you should have triaged, or found the triage wrong mid-build — say so. A self-caught deviation is a reportable signal, not a silent win.

---

## Model tiers

| Step | Runs on | Why |
|------|---------|-----|
| 1 Context | session | Delegated to `read-summary`'s own logic |
| 1b Greenfield | session | Delegated to `brainstorming` / `task-summary`; the clear-vs-unclear call is judgment |
| **2 Triage** | **session** | **Pure judgment — the one thing this skill exists to get right** |
| 3 Explore | **haiku** | Mechanical retrieval only |
| 4a Approach | sonnet (`Plan` frontmatter) | Read-only design |
| 4b Build | sonnet (`task-builder` frontmatter) | Code-writing |
| 5 Wrap | session | Delegated to `done` |

⚠️ Never override a registered agent's frontmatter `model:` at spawn time. Only bare `general-purpose` calls need an explicit `model:` — they inherit the session's otherwise.

## What this skill will not do

- **Won't ask you to pick from a list.** If you catch it enumerating, it's broken.
- **Won't build the whole doc.** Half of a typical doc's open items aren't code.
- **Won't pretend a human-blocked item is scheduled.** It hands those back by name.
- **Won't brainstorm a clear request.** A concrete ask goes straight to the doc and the build.
- **Won't build greenfield work undocumented.** The doc comes first — it's what makes the next session cheap.
