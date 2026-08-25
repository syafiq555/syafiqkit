# Infra-only and ops-only modes

The two modes that fire rarely. Read whichever one the session matches; if neither does, the session is full mode (or docs-only, which stays inline in `SKILL.md` because it is common).

## Infra-only mode

Fires when the diff is **entirely code that configures or operates an environment**, with no application code. CI workflows, `docker-compose*.yml`/`Dockerfile`, build config and nginx/env config are the common shapes, but the boundary is a mechanism rather than that list: infra is code whose failures are SILENT and whose blast radius is an environment rather than a user journey — nothing in the test suite would fail if the file were wrong.

That test also admits the provisioning, promotion and guard scripts that sit beside the config. An ops script or a safety-gate check is infra by this reasoning even though no enumeration of config formats would name it, and those files are where the reviewer earns its place, since they carry real logic that nothing else exercises.

**Step 1**: reviewer ONLY, in the usual case. Skip the product reviewer — no user journey. Size-independent; the trigger is file KIND, not count. Prompt the reviewer adversarially: give it the change's PURPOSE, what it must not break, and ask for empirical verification. Two call sites of the same command can need opposite treatments.

**Add the simplifier when the infra is imperative rather than declarative.** Skipping it is right for compose/nginx/YAML, where there is no logic to DRY. A shell or ops script is different: a promote/rollback pair, a setup/teardown pair, any two lists that must stay in step are exactly the duplication a simplifier catches, and a reviewer only finds that drift if you happened to prompt it about that risk.

Steps 2-5 as normal.

**Output**: mark Product as ➖ "infra-only", and Simplify the same way unless the imperative-infra case above brought it in.

⚠️ **Exception — a compose/env change that FLIPS A FEATURE FLAG on is NOT infra-only.** It exposes a user-facing capability, so run the product reviewer.

## Ops-only mode

Fires when the session changed a **running system rather than the repo** — provisioning/seeding an environment, a data migration or backfill, a deploy or config flip applied out-of-band — and produced **no repo diff and no session commit** in any repo.

**Step 1**: skip all three code agents; there is no repo code to review. Do NOT substitute the docs-only integrity check either — nothing was edited yet at that point.

**The state you changed is the deliverable, so verification is a READ-BACK, not an agent.** Query the live system for each value the session claimed to set and report what it returned. An action's own return value is not evidence. This replaces Step 1's Output row.

Steps 2-5 as normal, and **Step 4 is the whole point**: a live-system change leaves no trace in `git log`, so the task doc is the only place it exists. Record what changed, in which environment, and anything synthetic or temporary that a later reader must not mistake for real.

**Output**: mark Simplify/Review/Product as ➖ "ops-only, no repo diff"; report the read-back on the Review row.
