# Tells of a generic AI-built UI

Read this when a design feels competent and forgettable, or when reviewing a screen for "does this look defaulted". These are examples of the pattern, not an exhaustive ban list: lists like this date within months, and the real test is the five questions in `SKILL.md` (Swap, Squint, Signature, Token, Exclude). A tell that survives the test because the surface's audience and job asked for it is not a defect.

Each tell is common because it is the statistically safest answer to "make this look designed". That is also why a reader recognises it at a glance and stops trusting the page.

| Tell | Why it reads as default | Ask instead |
|---|---|---|
| Thick coloured stripe down one edge of a card | The cheapest way to mark a card as "important"; appears on every generated dashboard | What is this card's status, and can the status be a label, an icon or its position? |
| Purple or violet gradients, cyan on dark | The training-data default for "modern tech" | What colour does this product's audience already associate with it? |
| Gradient text on a headline | Emphasis borrowed from decoration | Can weight or size carry the emphasis? |
| Cards inside cards | Nesting to create grouping the layout could create with spacing | Would spacing and one heading group these just as well? |
| Bounce or elastic easing | Motion added "for delight" by reflex | A short deceleration curve; does the motion tell the reader where something went? |
| A small tracked uppercase label above every section heading | Template rhythm: every section announces itself the same way | Delete it; does the heading still work alone? Keep one only where it adds information |
| Three identical cards: icon, heading, two lines | The default answer to "list the features" | Do these items differ in importance? Show that |
| A hero stat template (big number, small label, supporting line) repeated | Looks like data, says nothing next to it | Which one figure does the reader act on? |
| Glow shadows, radial halos, glass on every surface | Depth used as decoration | One elevated layer, with a reason |
| Browser defaults left in place: focus ring, text selection colour, scrollbars | The parts no mockup shows, so nobody chose them | Theme them from the same tokens as everything else |
| Overused display faces (Inter as the only voice, or the current fashionable serif) | The model's first choice for a brief | Why this face for this audience, in one sentence? |

## Using the list

In a critique (`critique-mode.md`) a hit is a prompt to ask the right-hand question, not a finding by itself. In a build, check your own diff for the tells before showing it, the way you check it for raw colour values. Two or three together on one screen is the signal that nothing on it was shaped by the audience.

Adapted from the anti-pattern lists in impeccable (Apache-2.0, `github.com/pbakaus/impeccable`) and taste-skill (MIT, `github.com/Leonxlnx/taste-skill`), restated in our own terms and reframed as questions.
