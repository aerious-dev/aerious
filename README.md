# ÆRIOUS

The site for **aerious.co**.

From *aer*, Latin for air. The bet is that good software should sit beside you
the way air sits in a room — necessary, and unnoticed.

ÆRIOUS is a direction, not a company yet: AI office automation first, everyday
software later. **Copy on this site must not imply it is operating** — no "we
build", no "our clients", no "our platform". Saying plainly that it does not
exist yet is both the honest framing and the stronger one.

## Running it

```bash
npm install
npm run dev
```

| | |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | typecheck, then build to `dist/` |
| `npm run test` | vitest |
| `npm run preview` | serve the built site |

Vite + React + TypeScript. No router, no animation library, no UI kit — the
whole page is one component and one stylesheet.

## How the page works

Four movements: an opening (one video, three statements handed off one at a
time), five stages, the diagram, the footer.

**Scrolling.** `.ae` is its own scroller — `position: fixed; overflow-y: auto` —
so the document itself never moves. The five stages are `position: sticky`
siblings that stack: each pins at the top and the next rides up over it. The
browser does the whole transition; there is no scroll maths driving it.

**The mark.** Æ is two letters sharing one stroke, so the mark is two circles
sharing one overlap, held inside a ring. It has two states from the same
drawing:

- `logo` — ring plus the two circles. Header and footer. Nothing moves.
- `meter` / `map` — the logo plus five ticks, a drawn arc, and a travelling dot.

Ticks rather than dots for the five stages: five evenly spaced dots on a circle
is the shape of a loading spinner, and reads as chrome instead of as a mark.

The arc closes only on the diagram — the last stage sits at 4/5 of the way
round, and the final fifth is drawn as the diagram scrolls into view.

**Type.** Two families, and every size is one of 12 / 15 / 18 / 22 plus a
clamped display size. Newsreader 300 for display: low contrast and humanist,
which survives being set large in caps. One easing curve
(`cubic-bezier(.42, 0, .58, 1)`) and two durations (0.2s, 0.4s) for the whole
page.

## Footage

Six clips in `public/media/`, all from Pexels under the Pexels License —
free for commercial use, no attribution required. Sources are recorded in
[`public/media/CREDITS.txt`](public/media/CREDITS.txt) anyway.

Each was re-encoded locally: cropped to 1280×720, converted to greyscale,
darkened, and rendered forward-then-reverse so it loops without a visible cut.
Greyscale is baked in at encode time rather than applied as a CSS filter — a
full-screen `filter` costs real GPU time per frame, and greyscale compresses
better. Six clips, 5.4 MB total.

The footage is atmosphere, not evidence.

## Off-site links

There is exactly one: `mailto:admin@aerious.co`, the `MAIL` constant in
[`src/Aerious.tsx`](src/Aerious.tsx). This is a company site and carries no
personal identity — no founder name, no personal domain, no personal address.
A test in [`src/Aerious.test.tsx`](src/Aerious.test.tsx) fails if any other
outbound link appears.

## Deploying

`public/CNAME` is set to `aerious.co` for GitHub Pages. Change or delete it if
this ends up hosted elsewhere.

There is no SPA fallback because there is only one route. Add one if the site
ever grows a second page.
