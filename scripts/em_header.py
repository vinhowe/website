"""Draw the emergent misalignment post header: rings of robot heads around the bottom-left
corner, friendly near it and turning evil outward, already in the three tones the other headers use.

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


def header(width: int, rows: int, seed: int = 3, reach: float = 8, spread: float = 5) -> Image.Image:
    """Robots sit on concentric rings around the bottom-left corner, friendly near it and turning
    evil ring by ring toward the outside; rows sets the robot size as height / rows."""
    height = round(width / RATIO)
    im = Image.new("L", (width, height), PAPER)
    d = ImageDraw.Draw(im)
    pitch = height / rows
    s = pitch * 0.82
    rng = np.random.default_rng(seed)
    # The rings' centre sits off the canvas past the bottom-left corner, so no gap shows there.
    origin = np.array([-1.5 * pitch, height + 1.5 * pitch])
    ring = 1
    # Rings sit further apart than robots along a ring, so the arcs read as separate bands.
    far = np.hypot(width - origin[0], origin[1])  # distance to the top-right corner
    while (radius := (ring + 0.2) * pitch * 1.2) < far + pitch:
        # Evenly spaced around the quarter circle, skipping robots that fall off the canvas.
        n = max(1, int(radius * np.pi / 2 / pitch))
        for theta in (np.arange(n) + 0.5) / n * np.pi / 2:
            cx, cy = origin + radius * np.array([np.cos(theta), -np.sin(theta)])
            if not (-s / 2 < cx < width + s / 2 and -s / 2 < cy < height + s / 2):
                continue
            evil = rng.random() < np.clip((ring - reach) / spread + 0.5, 0, 1)
            robot(d, cx - s / 2, cy - s / 2, s, evil)
        ring += 1
    return im


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "src/routes/blog/emergent-misalignment-pareto/header.png"
    header(1800, rows=6).save(out)
