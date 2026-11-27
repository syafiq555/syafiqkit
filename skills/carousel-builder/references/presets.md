# Presets {#presets}

Each preset is a canvas size, the bands the platform's own UI covers, and the smallest readable capital-letter height. Text touching a band, or a `data-message` image in one, fails.

| Preset | Canvas | Bands that fail | Min cap height | Source |
|---|---|---|---|---|
| `tiktok` | 1080x1920 | top 240 px; bottom 660 px; 120 px each side; the action-button column x 780 to 960 from y 840. The body keeps 300 px off the right so it clears the column; the top bar keeps 120 | 28 px | TikTok's own safe zone template for In-Feed ads, "In-Feed-Standard Version LTR.zip" (a 2880x5120 PNG dated April 2025), linked from TikTok Ads Help "Auction In-Feed Ads" ([page](https://ads.tiktok.com/resources/help/article/tiktok-auction-in-feed-ads?lang=en-GB), read 27/11/2026: "The safe zone size is determined by the dimension (vertical, horizontal or square), ad caption length and any additional formats used"). Measured from its transparent area and scaled by 1.5 from its 720x1280 labels (80, 160, 440, 720) |
| `youtube-shorts` | 1080x1920 | top 288 px; bottom 672 px; left 48 px; right 192 px | 28 px | Google's "Universal Video Ad Safe Zones", vertical example on mobile, read from the diagram ([PDF](https://services.google.com/fh/files/misc/universalsafezones-youtube.pdf), [help page](https://support.google.com/google-ads/answer/13547298?hl=en), read 27/11/2026) |
| `instagram-reels` | 1080x1920 | top 14% (269 px); bottom 35% (672 px); 6% (65 px) each side | 28 px | Meta's Reels and Stories ad guides: "Consider leaving at least 14% of the top, 35% of the bottom, and 6% on each side of your asset free from text, logos, or other important creative elements" ([Reels](https://www.facebook.com/business/ads-guide/update/video/instagram-reels?locale=en_US), [Stories](https://www.facebook.com/business/ads-guide/update/image/instagram-story?locale=en_US), both read 27/11/2026) |
| `instagram-carousel` | 1080x1350 | left and right 60 px (the body also keeps 80 px off the bottom edge) | 28 px | The profile grid shows 3:4 tiles, trimming about 34 px from each side of a 4:5 slide (third-party: postd.ai, fyslide.com; Meta publishes no organic carousel safe zone). 60 px = the crop plus a margin |

Limits worth knowing:
- All three platforms publish their figures for ads, whose call-to-action bar is taller than an organic post's caption. They are the only first-party numbers, and an organic post that passes them is safe. TikTok's page ties the safe zone's size to the ad caption's length, so a long caption covers more than the template shows.
- Before 27/11/2026 the `tiktok` preset was top 150, bottom 350, right 120 from y 700 to 1570, taken from a score-loop rubric. Third-party repos disagree too (ghost-editor 160/480/150, iart motion-skills 120/320/120). Slides laid out for those bands fail the TikTok template: move text in from the left edge and up out of the bottom 660 px rather than loosening the preset.
- `motion-clip`'s `check` uses the same bands under `PRESET=tiktok`, `instagram-reels` or `youtube-shorts`; a change here changes both files.
- No platform publishes a minimum text size. 28 px cap height comes from TikTok viewing on a phone at 1080 wide, and Instagram's canvases are the same width, so it carries over as judgement, not a cited rule.
- Instagram's grid crop matters for the cover slide only; later slides show whole in the post.
