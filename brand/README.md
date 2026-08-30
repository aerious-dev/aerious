# ÆRIOUS — brand assets

Everything here is generated. Do not hand-edit a file in this directory — edit
[`generate.py`](generate.py) and run it:

```bash
python3 brand/generate.py
```

It rebuilds every asset here **and** the icons the site serves out of `public/`,
so the two can never drift apart.

## The mark

Æ, the ligature the name is built on: from *aer*, Latin for air. Two letters
sharing one stroke.

Set in **Cormorant Garamond** at **weight 475**, tracking **0.01em**. Those three
values are the identity; everything else follows from them.

Weight rises as the art gets smaller. Cormorant is a high-contrast face and its
hairlines vanish below about 32px, so small sizes are drawn heavier — 600 for
icons, 700 at 16px. This is optical sizing, not inconsistency: the mark is meant
to *look* the same weight, which means being drawn at different ones.

## Colours

| | Hex | Where |
|---|---|---|
| Ink | `#0B0B0B` | backgrounds |
| Paper | `#FAFAFA` | the mark on dark |
| Mark ink | `#121212` | the mark on light |

**The identity is monochrome.** That is a decision, not a gap. Black and white
cover every background there is, and a two-colour identity is what makes the
restraint read as deliberate rather than unfinished.

If you ever need another colour, the SVGs carry a single `fill` value — change
that one string and the whole file recolours. Do not add a second colour to the
mark itself.

## Files

### `svg/` — the masters

Vector, fixed colour, no font file needed. Use these for print, signage, large
formats, and anywhere you can hand over an SVG.

| | |
|---|---|
| `aerious-wordmark-black.svg` · `-white.svg` | ÆRIOUS. The primary logo |
| `aerious-mark-black.svg` · `-white.svg` | Æ alone |
| `aerious-mark-*-square.svg` | Æ centred in a square frame, for avatars |

### `png/` — transparent raster

For places that will not accept an SVG. Wordmark at 2400px wide, mark at 1200px,
both in black and white on transparency.

### `icons/`

Favicons at 16/32/48, `apple-touch-icon` at 180, PWA icons at 192 and 512. All
opaque — iOS paints black behind a transparent touch icon, and a favicon with no
background is invisible against half the browser themes out there.

### `social/`

| | Size | For |
|---|---|---|
| `profile-dark-1000.png` | 1000×1000 | **the default profile picture** |
| `profile-light-1000.png` | 1000×1000 | when the platform sits on dark |
| `og-1200x630.png` | 1200×630 | link previews |
| `x-header-1500x500.png` | 1500×500 | X header |
| `linkedin-cover-1128x191.png` | 1128×191 | LinkedIn cover |

Profile images are framed so the mark survives a circular crop — most platforms
apply one, and none of them warn you first.

## Rules

**Give it room.** Clear space on every side is at least the height of the Æ's
crossbar. The mark is mostly white space by design; crowding it undoes the point.

**Do not** stretch it, add a shadow or outline, rotate it, put it on a busy
photograph, recolour it to something other than ink or paper, retype the wordmark
in another font, or change the tracking. If you need it bigger, use the SVG.

**Do not use `public/favicon.svg` anywhere but the site.** It follows the
viewer's light/dark setting, which is right for a browser tab and wrong
everywhere else — profile pictures, print, and other people's platforms ignore
the media query, so the colour becomes a coin toss. Use a fixed-colour file from
`svg/` instead.

## Licence

Cormorant Garamond by Catharsis Fonts, under the
[SIL Open Font License 1.1](https://scripts.sil.org/OFL). The licence permits
using the font to make a logo and using that logo commercially. Every file here
is outlines rather than embedded font software, so nothing in this directory
carries a redistribution condition.
