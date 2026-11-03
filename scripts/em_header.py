"""Draw the emergent misalignment post header: a brick grid of robot heads, friendly on the
left and turning evil toward the right, already in the three tones the other headers use.

    uv run --with pillow --with numpy python scripts/em_header.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

INK, GRAY, PAPER = 0, round(0.78 * 255), 255
RATIO = 1576 / 602


def robot(d: ImageDraw.ImageDraw, x0: float, y0: float, s: float, evil: bool) -> None:
    """Draw one robot head in a square cell of side s at (x0, y0), on the source's proportions."""
    lw = max(2, round(0.045 * s))

    def p(x, y):
        return (x0 + x * s, y0 + y * s)

    def box(x1, y1, x2, y2):
        return [p(x1, y1), p(x2, y2)]

    d.rounded_rectangle(box(0.44, 0.03, 0.56, 0.2), radius=0.06 * s, fill=PAPER, outline=INK, width=lw)
    for ex in (0.02, 0.84):
        d.ellipse(box(ex, 0.30, ex + 0.14, 0.55), fill=PAPER, outline=INK, width=lw)
    d.line([p(0.32, 0.68), p(0.32, 0.78)], fill=INK, width=lw)
    d.line([p(0.68, 0.68), p(0.68, 0.78)], fill=INK, width=lw)
    d.rounded_rectangle(box(0.09, 0.76, 0.91, 0.98), radius=0.08 * s, fill=PAPER, outline=INK, width=lw)
    d.rounded_rectangle(
        box(0.09, 0.15, 0.91, 0.71), radius=0.09 * s, fill=GRAY if evil else PAPER, outline=INK, width=lw
    )
    if evil:
        # Each eye is a half-ellipse hanging below a slanted brow, from the outer corner down to the inner.
        a, b = np.array([0.21, 0.25]), np.array([0.45, 0.38])
        mid, half = (a + b) / 2, (b - a) / 2
        down = np.array([-half[1], half[0]]) / np.linalg.norm(half) * 0.09
        t = np.linspace(0, np.pi, 48)
        pts = mid + np.outer(np.cos(t), half) + np.outer(np.sin(t), down)
        for flip in (False, True):
            d.polygon([p(1 - x if flip else x, y) for x, y in pts], fill=INK)
        d.rounded_rectangle(box(0.31, 0.50, 0.69, 0.62), radius=0.04 * s, fill=PAPER, outline=INK, width=lw)
        for tx in (0.437, 0.563):
            d.line([p(tx, 0.50), p(tx, 0.62)], fill=INK, width=lw)
    else:
        for ex in (0.33, 0.67):
            r = 0.055
            d.ellipse(box(ex - r, 0.37 - r, ex + r, 0.37 + r), fill=INK)
        d.arc(box(0.38, 0.44, 0.62, 0.60), start=20, end=160, fill=INK, width=lw)


def header(
    width: int, rows: int, seed: int = 3, wavelength: float = 4.5, band: float = 2, reach: float = 20, spread: float = 10
) -> Image.Image:
    height = round(width / RATIO)
    im = Image.new("L", (width, height), PAPER)
    d = ImageDraw.Draw(im)
    pitch = height / rows
    s = pitch * 0.82
    rng = np.random.default_rng(seed)
    for r in range(rows):
        offset = (pitch / 2) * (r % 2)
        c = -1
        while (x := c * pitch + offset) < width:
            # Misalignment ripples out in rings from the bottom-left corner, thinning as it spreads.
            dist = np.hypot(x + pitch / 2, height - (r + 0.5) * pitch) / pitch
            in_ring = (dist % wavelength) < band
            evil = in_ring and rng.random() < np.clip((reach - dist) / spread, 0, 1)
            robot(d, x + (pitch - s) / 2, r * pitch + (pitch - s) / 2, s, evil)
            c += 1
    return im


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "src/routes/blog/emergent-misalignment-pareto/header.png"
    header(1800, rows=7).save(out)
