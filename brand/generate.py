#!/usr/bin/env python3
"""Regenerate every ÆRIOUS brand asset from the font.

    python3 brand/generate.py

Needs fonttools and Pillow, and the Cormorant Garamond variable font. It
downloads the font if it is not already cached in the system temp directory.

Everything here is derived, never hand-edited: the SVGs, the PNGs, the icons
and the social images all come out of the same two numbers — weight and
tracking — so they cannot drift apart. Change a constant, run the script, and
the whole kit moves together.

Weight rises as the art gets smaller. Cormorant is a high-contrast face and its
thin strokes disappear below about 32px, so the small sizes are drawn heavier
to keep the Æ readable. That is optical sizing, the same principle a type
family applies across its own optical size axis.
"""
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont
from fontTools.misc.transform import Transform
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONT_URL = ("https://raw.githubusercontent.com/google/fonts/main/ofl/"
            "cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf")
FONT_CACHE = "/tmp/CormorantGaramond-var.ttf"

# The brand, in four numbers and three colours.
BRAND_WEIGHT = 475        # wordmark and logomark
TRACKING = 0.01           # em, between letters of the wordmark
INK = "#0B0B0B"           # backgrounds
PAPER = "#FAFAFA"         # art on dark
MARK_INK = "#121212"      # art on light

HERE = os.path.dirname(os.path.abspath(__file__))
_instances: dict[int, TTFont] = {}
_pil_fonts: dict[int, str] = {}


def variable_font() -> str:
    # curl, not urllib: a python.org install on macOS ships without a CA bundle
    # and fails to verify raw.githubusercontent.com.
    if not os.path.exists(FONT_CACHE):
        subprocess.run(["curl", "-sSfL", "-o", FONT_CACHE, FONT_URL], check=True)
    return FONT_CACHE


def instance(weight: int) -> TTFont:
    if weight not in _instances:
        _instances[weight] = instancer.instantiateVariableFont(
            TTFont(variable_font()), {"wght": weight})
    return _instances[weight]


def pil_font_path(weight: int) -> str:
    """Pillow needs a real file, so write each instance out once."""
    if weight not in _pil_fonts:
        path = f"/tmp/cormorant-{weight}.ttf"
        instance(weight).save(path)
        _pil_fonts[weight] = path
    return _pil_fonts[weight]


# ---------------------------------------------------------------- vector ----

def outlines(weight: int, text: str, tracking: float, size: int = 1000):
    """The text as one SVG path, plus its tight bounding box."""
    f = instance(weight)
    glyphs, cmap = f.getGlyphSet(), f.getBestCmap()
    upm = f["head"].unitsPerEm
    hmtx = f["hmtx"]
    scale = size / upm
    x, parts, boxes = 0.0, [], []
    for ch in text:
        name = cmap[ord(ch)]
        # the y axis flips: fonts count up from the baseline, SVG counts down
        tf = Transform(scale, 0, 0, -scale, x, 0)
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(TransformPen(pen, tf))
        if pen.getCommands().strip():
            parts.append(pen.getCommands())
        bounds = BoundsPen(glyphs)
        glyphs[name].draw(TransformPen(bounds, tf))
        if bounds.bounds:
            boxes.append(bounds.bounds)
        x += (hmtx[name][0] + tracking * upm) * scale
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes),
           max(b[2] for b in boxes), max(b[3] for b in boxes))
    return " ".join(parts), box


def write_svg(path, weight, text, tracking, fill, note, square=False, pad=0.07):
    d, (x0, y0, x1, y1) = outlines(weight, text, tracking)
    w, h = x1 - x0, y1 - y0
    if square:
        side = max(w, h) * 1.16
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        view = f"{cx - side / 2:.1f} {cy - side / 2:.1f} {side:.1f} {side:.1f}"
    else:
        p = h * pad
        view = f"{x0 - p:.1f} {y0 - p:.1f} {w + 2 * p:.1f} {h + 2 * p:.1f}"
    track = f", tracking {tracking}em" if tracking else ""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}">\n'
        f"  <!-- ÆRIOUS · {note}\n"
        f"       Cormorant Garamond (Catharsis Fonts), SIL Open Font License 1.1\n"
        f"       — wght {weight}{track}. Outlines, so no font file is needed.\n"
        f"       One fill value: recolour by changing it. -->\n"
        f'  <path d="{d}" fill="{fill}"/>\n</svg>\n')


def write_svg_auto(path, weight, text, tracking, note, square=False):
    """Site-only variant that follows the viewer's light/dark setting.

    Never use this off the site — profile pictures, print and other people's
    platforms do not honour the media query, and the colour becomes a coin toss.
    """
    write_svg(path, weight, text, tracking, MARK_INK, note, square=square)
    s = open(path).read().replace(
        "</svg>",
        "  <style>@media (prefers-color-scheme: dark) "
        "{ path { fill: #fafafa } }</style>\n</svg>")
    open(path, "w").write(s)


# ---------------------------------------------------------------- raster ----

def art(text, weight, tracking, color, px=300):
    """Text as a tightly cropped RGBA image."""
    font = ImageFont.truetype(pil_font_path(weight), px)
    advances = [font.getlength(c) for c in text]
    extra = tracking * px
    width = int(sum(advances) + extra * (len(text) - 1)) + px
    im = Image.new("RGBA", (width, px * 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    x = px * 0.25
    for ch, adv in zip(text, advances):
        draw.text((x, px * 0.35), ch, font=font, fill=color)
        x += adv + extra
    return im.crop(im.getbbox())


def write_png(path, cw, ch, bg, text, weight, tracking, color, scale):
    """Draw at 3x and downsample — Pillow's own scaling beats its rasteriser."""
    SS = 3
    a = art(text, weight, tracking, color)
    ratio = a.width / a.height
    W = cw * SS
    aw = int(W * scale)
    ah = max(1, int(aw / ratio))
    H = ch * SS if ch else ah
    a = a.resize((aw, ah), Image.LANCZOS)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0) if bg is None else bg)
    canvas.alpha_composite(a, ((W - aw) // 2, (H - ah) // 2))
    canvas = canvas.resize((cw, ch if ch else H // SS), Image.LANCZOS)
    if bg is not None:
        canvas = canvas.convert("RGB")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    canvas.save(path)
    return canvas.size


# ------------------------------------------------------------------ build ---

def main():
    out = lambda *p: os.path.join(HERE, *p)

    # Vector, fixed colour. These are the masters.
    for tone, fill in (("black", MARK_INK), ("white", PAPER)):
        write_svg(out("svg", f"aerious-wordmark-{tone}.svg"),
                  BRAND_WEIGHT, "ÆRIOUS", TRACKING, fill, f"Wordmark, {tone}.")
        write_svg(out("svg", f"aerious-mark-{tone}.svg"),
                  BRAND_WEIGHT, "Æ", 0, fill, f"Logomark, {tone}.")
        write_svg(out("svg", f"aerious-mark-{tone}-square.svg"),
                  600, "Æ", 0, fill,
                  f"Logomark in a square frame, {tone}. For avatars and icons.",
                  square=True)

    # The site's own favicon, which may follow the viewer's theme.
    write_svg_auto(os.path.join(HERE, "..", "public", "favicon.svg"),
                   650, "Æ", 0,
                   "Favicon. Heavier than the brand weight so the thin strokes "
                   "survive a 16px render.", square=True)

    # Icons. Weight climbs as the canvas shrinks.
    for px, weight, scale in ((16, 700, 0.88), (32, 650, 0.80), (48, 600, 0.76)):
        write_png(out("icons", f"favicon-{px}.png"), px, px, INK,
                  "Æ", weight, 0, PAPER, scale)
    # Opaque on purpose: iOS paints black behind a transparent touch icon.
    for name, px in (("apple-touch-icon", 180), ("icon-192", 192), ("icon-512", 512)):
        write_png(out("icons", f"{name}.png"), px, px, INK,
                  "Æ", 600, 0, PAPER, 0.60)

    # Social and profile. Always opaque — these get uploaded, not composited.
    write_png(out("social", "profile-dark-1000.png"), 1000, 1000, INK,
              "Æ", BRAND_WEIGHT, 0, PAPER, 0.52)
    write_png(out("social", "profile-light-1000.png"), 1000, 1000, PAPER,
              "Æ", BRAND_WEIGHT, 0, MARK_INK, 0.52)
    write_png(out("social", "og-1200x630.png"), 1200, 630, INK,
              "ÆRIOUS", BRAND_WEIGHT, TRACKING, PAPER, 0.56)
    write_png(out("social", "x-header-1500x500.png"), 1500, 500, INK,
              "ÆRIOUS", BRAND_WEIGHT, TRACKING, PAPER, 0.42)
    write_png(out("social", "linkedin-cover-1128x191.png"), 1128, 191, INK,
              "ÆRIOUS", BRAND_WEIGHT, TRACKING, PAPER, 0.34)

    # Google Workspace wants exactly 320x132 (Admin console > Account settings
    # > Customization). It shows at the top of Gmail, Calendar and Drive.
    #
    # That box is 2.42:1 and the wordmark is 5.93:1, so the wordmark is limited
    # by width and can only reach about 40% of the height — which is thin once
    # Gmail scales the image down into its header. The Æ is 1.33:1 and fills the
    # height instead. Both are here; the mark reads better small, the wordmark
    # says the name.
    #
    # Transparent, because the Workspace header is light by default and dark
    # under a dark theme. Ship the ink one unless the header is dark.
    for tone, color in (("ink", MARK_INK), ("white", PAPER)):
        write_png(out("workspace", f"workspace-wordmark-{tone}-320x132.png"),
                  320, 132, None, "ÆRIOUS", BRAND_WEIGHT, TRACKING, color, 0.94)
        write_png(out("workspace", f"workspace-mark-{tone}-320x132.png"),
                  320, 132, None, "Æ", BRAND_WEIGHT, 0, color, 0.42)

    # Transparent PNGs, for places that will not take an SVG.
    for tone, color in (("white", PAPER), ("black", MARK_INK)):
        write_png(out("png", f"aerious-wordmark-{tone}-2400.png"), 2400, 0, None,
                  "ÆRIOUS", BRAND_WEIGHT, TRACKING, color, 1.0)
        write_png(out("png", f"aerious-mark-{tone}-1200.png"), 1200, 0, None,
                  "Æ", BRAND_WEIGHT, 0, color, 1.0)

    # What the site itself serves. Written here rather than copied, so the
    # site and the kit cannot drift apart.
    site = lambda *p: os.path.join(HERE, "..", "public", *p)
    write_png(site("favicon-32.png"), 32, 32, INK, "Æ", 650, 0, PAPER, 0.80)
    write_png(site("apple-touch-icon.png"), 180, 180, INK, "Æ", 600, 0, PAPER, 0.60)
    write_png(site("icon-192.png"), 192, 192, INK, "Æ", 600, 0, PAPER, 0.60)
    write_png(site("icon-512.png"), 512, 512, INK, "Æ", 600, 0, PAPER, 0.60)
    write_png(site("og.png"), 1200, 630, INK, "ÆRIOUS", BRAND_WEIGHT, TRACKING,
              PAPER, 0.56)
    open(site("site.webmanifest"), "w").write(
        '{\n  "name": "ÆRIOUS",\n  "short_name": "ÆRIOUS",\n'
        '  "icons": [\n'
        '    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },\n'
        '    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }\n'
        '  ],\n'
        f'  "theme_color": "{INK}",\n  "background_color": "{INK}",\n'
        '  "display": "standalone"\n}\n')

    for root, _, files in sorted(os.walk(HERE)):
        for f in sorted(files):
            if f.endswith((".svg", ".png")):
                p = os.path.join(root, f)
                print(f"  {os.path.relpath(p, os.path.dirname(HERE))}")


if __name__ == "__main__":
    main()
