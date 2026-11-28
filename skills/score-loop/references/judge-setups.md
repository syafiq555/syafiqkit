# Judge setups

Method, evidence and incident detail behind score-loop step 1 (`../SKILL.md`), which states the rules. Open the section a pointer names when you set up that arrangement.

## Retained judge

Each fresh judge docks a different handful of points, so near the top the score wobbles ±1 and never settles (`worked-example.md`, second run). The alternative is one judge kept across rounds (resume it by agent ID with `SendMessage`, and spawn it without `name:` so its report still comes back), told to re-check its own previous list against freshly gathered evidence and to add only what it newly finds. If the judge can't be resumed, give a new one its predecessor's last findings list with the same re-check instruction, and still call it retained.

The trade-off, for the one line that goes to the user: a retained judge is less independent and can grow lenient toward fixes it asked for, but it converges.

## The pair

The retained one measures progress against its own list; the fresh one finds what nobody looked at yet. The pair earns its place through two separate contexts, not two models. The jury result often quoted for judge panels (Verga et al., arxiv.org/abs/2404.18796) drew its judges from "three disparate model families". No source tests a panel of Claude tiers, so extra judges on other tiers should not be expected to add the same gain. On the 12-round design run (21/11/2026, `worked-example.md`), the retained judge kept climbing while fresh-only judges had stalled.

## Reporting

The retained and fresh scores are reported separately, never as a mean: on that run the mean understated both. "New" means on neither the retained list nor an earlier fresh list, and you dedupe.

Why a one-point move prints as `(no change)` (step 5): the same judge run three times gave the same verdict on only 61.3% of cases (arxiv.org/html/2510.27106), and verdicts flip on about 40% of close calls (arxiv.org/abs/2609.33044).

## Blind

Judges hold a verdict on a neutral re-check but can be argued out of it when challenged ("substantially reversible under targeted post-decision challenge", arxiv.org/abs/2606.05384), and a fix list is that kind of challenge.

## Drift

Once both reports are in, and before the round line, you (not a judge) read the fresh judge's findings against the items the retained judge closed.
Drift also hides where this check cannot see it, in the checks the retained judge never listed, since re-checking its own list only re-reads what it once failed. So brief it to score every check from scratch each round, then say which earlier items closed. On a 24/11/2026 deck run a retained judge working from its list reached 30/30 while the fresh judge gave 23, and the same judge told to rescore everything gave 25.

This check is our own inference, not a published method; the research shows only that a judge's earlier conversation measurably shifts its later verdicts (arxiv.org/abs/2605.22714), which is why it needs a check at all.

## Settled list

The fields follow Nygard's short format for recording decisions (cognitect.com/blog/2011/11/15/documenting-architecture-decisions). A fix the retained judge accepted stays open to fresh judges, which is how the drift check works.

An ask naming no criterion is a `Nit`, as in Google's review guide, where the reviewer "accept[s] the preference of the author" between equally valid approaches (google.github.io/eng-practices/review/reviewer/standard.html). The judge tags an ask that reverses a settled entry as a `reversal`.

## Critique as they go

Tell each judge to load `SendMessage` through `ToolSearch` and message `main` with each concrete improvement the moment it finds it (screen or section, element, change, why), so building starts while the judge finishes. That needs the judges dispatched with `run_in_background: true`: a foreground judge blocks this session, and its messages only arrive once it returns.

Only an agent type that holds `ToolSearch` and `SendMessage` can do this: a project `product-reviewer` generated before 1.464.3 lacks them and reports at the end, so check the agent's tool list first and either re-run `agent-setup` or use a general-purpose judge for mid-run messages.

## Click-through

A screen people operate (tick boxes, steppers, toggles, a drawer, a form) is judged from `uiux`'s `scripts/record-clickthrough.mjs` on the real page at a phone and a desktop width, with the frame sheets handed to the judge and an interaction criterion in the rubric. A still shows the state before and after, never the control that greyed, the label that flashed or the card that jumped in between (24/11/2026: a cart passed at 19/20 from stills, then the user's own screen recording showed every tick greying with an "Updating" flicker).

Grade the live page, not only a component preview, which can leave out what the page pins (that cart's preview never showed its phone pay bar, whose button later clipped at 320px).

## Shared test suite

Judges that each ran the suite at once deleted each other's fixtures (a shared test database or fake-storage folder), the failing set changed between runs, and a judge docked a check for a failure no fix could move (25/11/2026).

## Shared machine

In a later round judges timed runs at a load average of 12 to 17 and docked a speed claim from those numbers (26/11/2026).
