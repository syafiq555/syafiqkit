# Probe Isolation — When a Measurement Reports Its Own Side Effects

Referenced when a runtime question is settled by running something, and especially when two agents disagree about runtime behaviour. Distinct from `verifying-a-write-landed.md`, which asks whether an edit reached disk; this asks whether a measurement reflects reality or the measuring.

**Rule:** a probe sharing a process with its subject can report state its own execution created. "Who ran code" is therefore not a tie-breaker on its own — what decides is whose probe was *isolated* from the thing under test.

The failure is symmetric, which is what makes it hard to spot: the same confound produces a false pass for one observer and a false failure for another, and both come with a real command and real output behind them. An agent reporting a confident runtime finding, and your own confident rebuttal of it, can both be measuring the pollution rather than the system.

Instances of the class — anything whose value is *established during* the run you are observing:

- an auth guard a bootstrapped request switches (`shouldUse()`), so reading the config afterwards reports what your own request set
- per-request singletons persisting across several calls in one bootstrapped process
- a static/in-memory cache warmed by an earlier assertion in the same script
- a test harness that pre-authenticates or pre-binds something no real request does

**The escalation is out-of-process, not a third opinion.** A real HTTP request over the wire, or a separate interpreter invocation per measurement, breaks the shared state; another in-process check inherits the same confound however carefully it is written. Where a value must be read at a specific moment, capture it *at* that moment from inside the code under test rather than inferring it from the environment afterwards.

⚠️ **Publishing a "correction" of another agent on the strength of a polluted probe discredits a source that was right, in a file later sessions read as settled.** The asymmetry hides it: rebutting feels like diligence and the rebuttal's own evidence looks solid. Before contradicting a runtime claim, confirm your probe does not share a process with the subject. **Tell:** you are about to overturn a finding using a measurement taken after the thing you are measuring already ran.
