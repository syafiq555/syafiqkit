# Marketing pages

Read this only for landing pages, portfolios and client brochure sites. Any look change to one (build, redesign, polish, improve) is `taste`'s job (dealt directions, real pictures, a browser inspector); this file is the yardstick when `uiux` critiques such a page or judges one `taste` built. Business tools (dashboards, tables, multi-step forms, admin) inherit the app's language and do not use this file: their job is getting work done, and these choices spend distinctiveness a tool does not need.

In a critique (`critique-mode.md`), this file is only the yardstick for the sections below the dials: structure, proof, type and colour. The design read, dials and approval steps belong to building.

A marketing page has one job: persuade one visitor to take one action, usually in under a minute. Everything below serves that.

## Read the brief before choosing a look

Write the design read first (audience, subject, job, how bold vs restrained). Most generic marketing output comes from jumping to the default look instead of reading who is visiting and what they doubt. Name the one doubt the page must remove.

## Three dials, set from the brief

State each as low, middle or high before designing:

- **Variance:** how far the layout departs from a conventional centred stack.
- **Motion:** how much moves. A calm professional-services page sits low; a product launch can go higher. Motion needs a purpose either way (telling the eye where to go), and respects reduced-motion.
- **Density:** how much shows per screen. Phones push this down regardless.

Brief words map to dials: "clean", "calm" and "trustworthy" lower all three; "bold", "playful" and "launch" raise variance and motion. If the brief gives no signal, ask one question through `AskUserQuestion` with the dial settings as options, not five questions. A redesign of an existing marketing page still waits for approval like any page redesign.

## Structure and rhythm

- One primary action, repeated, not several competing ones.
- Sections differ in shape. Identical section after section reads as a template; vary the layout where the content differs, not for variety's sake.
- The first screen on a phone shows what this is, who it is for and the action. Check it at 375px before the desktop hero.
- Proof (real names, numbers, logos) beats adjectives. A real logo goes where logos go; never an invented mark.

## Material

Finding and placing the material is build work, so it is `taste`'s (its picture and `--video` search); this section is the check on what it found. A bold, cinematic or "wow" direction is carried by real material: photography, footage, or a rendered asset. Shapes drawn in CSS (a gradient sky, a strip of road, a box for a sign) read as clip art however hard they are animated, so when the user calls a bold page cheap after a motion round, the next round changes the material, not the motion. Measured 2026-10-19: four rounds of scroll motion on a drawn night road were called "cheap cinematic"; real dashcam footage behind the same layout ended the complaint.

Source it under a licence that covers a client's commercial site; a licence that owes a credit (CC BY, CC BY-SA) is fine when the credit line goes in the footer, and 📖 `../../taste/references/imagery.md` owns the credit rules. Read the licence per item, not per site: Pexels qualifies; Mixkit marks each clip Free or Restricted (personal use only), and the download button's `data-license` is the truth when the page metadata disagrees; Uppbeat's free plan excludes client and commercial use. Footage that will be scrubbed by scroll is re-encoded all-keyframe, and the host must answer HTTP Range requests or the seek silently stays on frame 0.

## Type and colour

One typeface family, two weights, a clear size scale. A second face needs a stated job. Colour: one accent used for the action, neutrals for everything else, checked at 4.5:1 for body text.

Dials and brief-reading adapted from taste-skill (MIT, `github.com/Leonxlnx/taste-skill`), without its landing-page-only bans.
