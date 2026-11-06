# Worked example: a storefront scored against a client brief

The first run of this loop (2026-10-27), on a WooCommerce storefront built from a client's brief and a reference prototype. The user set it up with `/goal` ("run product reviewer agent and give score N/20, stop at 80–90%").

**Rubric.** Ten criteria, 0/1/2 each, taken from the brief: home page matches the brief; category pages put the banner first; product page has every requested part in the requested order; brand fonts and colours; the phone buying path; pricing truthfulness for each account type; accessibility; empty, error and missing-content states; whether staff can run it without a developer; SEO and performance basics.

**Round 1: 12/20.** The judge docked points for the footer's missing social icons and for sample testimonials. Both were inputs the client hadn't supplied yet, which no fix could move. The scoring conventions (judge the handling of missing client input, not its absence; recorded decisions and test data are not defects) were added for round 2, so round 1's number is not strictly comparable. Write them before round 1.

**A stale judge claim.** Round 1 said the footer column titles were still `h2`. One grep showed they had been changed to `<p>` an hour earlier; the judge had repeated an earlier audit instead of reading the template. It came off the list without a re-fix.

**The user's calls.** Two gaps changed what customers are told: the product page's guest price line, and whether to publish a placeholder privacy page so the footer could link it. Both went through one `AskUserQuestion` before the build round.

**Round 2: 16/20.** One builder fixed the add-to-cart feedback, tap targets, a default category banner, product states, the setup checklist and fallback meta descriptions. 16/20 is inside the 80–90% band, so the loop stopped. The report listed the four remaining one-point gaps (a phone-sized category banner, checklist links, two unlabelled gallery links, and a signed-in member seeing no price confirmation, which was the user's call), so the user could decide on a third round.

# Worked example: a user manual taken from 4.5 to 10

A colleague's run (reported 05/11/2026) on a 40-page user manual PDF. Judge persona: a new user who knows nothing about the app. Ten criteria, 0/1/2 each, reported out of 10.

**The stop rule was the user's, not the session's.** The user wanted "stop at 10". The session added its own plateau stop, which the user did not want, and the user extended the round cap twice, from 5 to 10 to 15. Ask for the stop rule and use it as given.

**A phantom finding from an eyeballed threshold.** One criterion docked pages "more than 25% blank". The judge reported a page as 45% blank; measured between the margins it was 20%. Writing into the rubric how blank space is measured removed the finding.

**Fresh judges plateaued.** Rounds 5 to 10 sat at 8 to 9 out of 10: each new judge docked a different handful of points on the same PDF, so the score moved by one point either way without converging. Switching to one retained judge, resumed each round and told to re-check its own previous list, reached 10 in five more rounds. The cost is independence, so the switch is the user's call and the report names which judge produced each score.

**Claims checked against the source.** Before acting, the session caught a judge's wrong UI direction (it described a "side dot" where the app has a bottom handle), a warning from the screen capture tool read as a real app error, and a builder's claim about autosave that nothing had shown.

**One builder across rounds.** Reusing the same builder kept its file context from round to round; its report was still checked against the rendered PDF before each new score.
