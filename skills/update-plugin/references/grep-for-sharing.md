# Grep Before Writing — Finding Shared Mechanisms

When routing a patch to a skill file, check whether other skills already handle the mechanism before deciding the fix is local-only.

**Core rule:** `grep -rn` the mechanism's **nouns** across `skills/`, not the rule's own wording. Read each hit to understand whether it handles the same concern. Mechanics that work in opposite directions on one artifact are the pairing that matters most and the one a same-direction search misses — a rule about where content should land has a counterpart deciding what gets evicted, so fixing one while leaving the other intact is undone on that skill's next run.

**Blind spot in vocabulary search:** Searching the mechanism's terminology finds skills that *talk about* a thing, but not sibling primitives that answer a neighbouring question off the same underlying command. A reference generalised to handle one failing command can sit beside another whose whole mechanism is that same command, and a search for the first's nouns never surfaces the second. When you find a match, also ask which *other* primitives the same steps cite — if two references are named a few lines apart in the skills you're patching, they likely share the assumption you just fixed. Verify by running the broken condition against each, not by reading their descriptions alone.

**Shared mechanism patterns:**
- Several skills all need the same fact at different depths → core rule in `_shared/references/` + pointer from each (hot-path line in each skill, full statement they point at)
- Two skills decide opposite directions → each gets the pointer, not one fixed and one left intact
- Generic fact with rare exception → the exception can move to a reference if keeping the common path lean matters

If the mechanism truly lives nowhere else, it's local — patch just that skill.
