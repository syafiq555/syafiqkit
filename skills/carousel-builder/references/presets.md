# Presets {#presets}

Each preset is a canvas size, the bands the platform's own UI covers, and the smallest readable capital-letter height. Text touching a band, or a `data-message` image in one, fails.

| Preset | Canvas | Bands that fail | Min cap height | Source |
|---|---|---|---|---|
| `tiktok` | 1080x1920 | top 150 px; bottom 350 px; right 120 px from y 700 to 1570 | 28 px | The rubric of the Autorentic week 2 score loop (Nov 2026, checks 4a and 5a to 5c), written for TikTok's video UI and applied to photo posts too; not re-measured on the photo-mode screen |
| `instagram-reels` | 1080x1920 | top 14% (269 px); bottom 35% (672 px); 6% (65 px) each side | 28 px | Meta's Reels and Stories ad guides: "Consider leaving at least 14% of the top, 35% of the bottom, and 6% on each side of your asset free from text, logos, or other important creative elements" ([Reels](https://www.facebook.com/business/ads-guide/update/video/instagram-reels?locale=en_US), [Stories](https://www.facebook.com/business/ads-guide/update/image/instagram-story?locale=en_US), both read 27/11/2026) |
| `instagram-carousel` | 1080x1350 | left and right 60 px (the body also keeps 80 px off the bottom edge) | 28 px | The profile grid shows 3:4 tiles, trimming about 34 px from each side of a 4:5 slide (third-party: postd.ai, fyslide.com; Meta publishes no organic carousel safe zone). 60 px = the crop plus a margin |

Limits worth knowing:
- Meta's figures are written for ads, whose CTA bar is taller than an organic post's caption; they are the strictest published numbers, so an organic post that passes them is safe.
- No platform publishes a minimum text size. 28 px cap height comes from TikTok viewing on a phone at 1080 wide, and Instagram's canvases are the same width, so it carries over as judgement, not a cited rule.
- Instagram's grid crop matters for the cover slide only; later slides show whole in the post.
