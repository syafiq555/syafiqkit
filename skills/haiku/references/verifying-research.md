# Verifying a Research Dispatch

A research run leaves no artifact, so the file-based checks all no-op and the report's prose is the only thing to grade. That prose is exactly where a fabrication is cheapest: inventing a source costs nothing while retrieving one can fail, so the invented finding runs toward being *more* polished than the real one.

## Spot-check the claims, and grade the number rather than the page

Open two or three cited URLs yourself before relaying anything, especially any claim that decides something, and confirm which host or environment actually answered.

**A resolving URL grades the page, not the figure.** A real page about the subject routinely carries a *different* number from the one attributed to it, and that passes a URL check clean. For any figure or threshold, find the number on the page rather than confirming the page exists.

Ask the report to separate what was retrieved from what was not. An agent that must file `COULD NOT RETRIEVE` has somewhere to put a gap other than a guess.

## An honest wall of failures still needs checking

The dangerous failure is not a claim invented in place of a retrieval — it is a conclusion drawn *from* the retrieval failures. The discipline works exactly as designed, and then the agent reasons from its own empty result: "these sources 404, therefore the literature has moved offline." That arrives as a genuine-looking finding about the world, sourced to nothing, and reads as *more* trustworthy than a normal answer because it is visibly self-critical.

Measured 2026-09-01: a research agent filed eleven dead URLs and concluded that no major company publishes guidance on a mainstream practice. Three of the four load-bearing ones returned 200 on retest — the agent had guessed URLs rather than searched.

A negative finding is the one kind of claim whose evidence *is* the absence itself, so retest before relaying. Retry a couple of the named failures with a browser `User-Agent`, since vendor and marketing pages routinely 403 a bare agent while serving a browser:

```bash
curl -sL -o /dev/null -w '%{http_code}' -H 'User-Agent: Mozilla/5.0 …' '<url>'
```

A guessed URL 404s for reasons that say nothing about whether the page exists.

**Tell: the report concludes something does not exist, and your evidence for that is the report's own failed fetches.**
