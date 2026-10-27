# Worked example: a storefront scored against a client brief

The first run of this loop (2026-10-27), on a WooCommerce storefront built from a client's brief and a reference prototype. The user set it up with `/goal` ("run product reviewer agent and give score N/20, stop at 80–90%").

**Rubric.** Ten criteria, 0/1/2 each, taken from the brief: home page matches the brief; category pages put the banner first; product page has every requested part in the requested order; brand fonts and colours; the phone buying path; pricing truthfulness for each account type; accessibility; empty, error and missing-content states; whether staff can run it without a developer; SEO and performance basics.

**Round 1: 12/20.** The judge docked points for the footer's missing social icons and for sample testimonials. Both were inputs the client hadn't supplied yet, which no fix could move. The scoring conventions (judge the handling of missing client input, not its absence; recorded decisions and test data are not defects) were added for round 2, so round 1's number is not strictly comparable. Write them before round 1.

**A stale judge claim.** Round 1 said the footer column titles were still `h2`. One grep showed they had been changed to `<p>` an hour earlier; the judge had repeated an earlier audit instead of reading the template. It came off the list without a re-fix.

**The user's calls.** Two gaps changed what customers are told: the product page's guest price line, and whether to publish a placeholder privacy page so the footer could link it. Both went through one `AskUserQuestion` before the build round.

**Round 2: 16/20.** One builder fixed the add-to-cart feedback, tap targets, a default category banner, product states, the setup checklist and fallback meta descriptions. 16/20 is inside the 80–90% band, so the loop stopped. The report listed the four remaining one-point gaps (a phone-sized category banner, checklist links, two unlabelled gallery links, and a signed-in member seeing no price confirmation, which was the user's call), so the user could decide on a third round.
