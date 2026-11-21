"""Generates the campus-scene hero illustrations in src/imports/heroes/ (run: python3 scripts/make-heroes.py)."""
import random, os

W, H = 1200, 520
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "imports", "heroes")

SCENES = {
    # name: (sky top, sky bottom, sun, far hills, buildings, windows, trees, ground, seed, sun position)
    "profile":      ("#0f3a5c", "#f2a65a", "#ffd58a", "#3d5f7a", "#c98b5a", "#ffe2a8", "#24402f", "#2f4a33", 3, (0.78, 0.62)),
    "tasks":        ("#1b4f72", "#8fc9e8", "#fff3c4", "#4f7d96", "#d9a273", "#fff4d6", "#2c5236", "#3b5f3a", 7, (0.2, 0.35)),
    "learnings":    ("#2a2f5a", "#7d8fd1", "#e8ecff", "#45507d", "#a68a6d", "#ffe9b0", "#263a3a", "#2e4040", 11, (0.85, 0.3)),
    "appointments": ("#0e5a73", "#9fe0e6", "#fffbe0", "#3e7f8a", "#e0b080", "#fff7dc", "#2a5a3c", "#3c6a44", 5, (0.5, 0.28)),
    "messages":     ("#3b1f4f", "#e07a7a", "#ffd2a0", "#5d3d63", "#b97a62", "#ffd9a0", "#2d2a3a", "#3a3044", 13, (0.3, 0.6)),
    "inquiries":    ("#114b5f", "#f4c27a", "#fff0c2", "#3f6b78", "#cf9666", "#ffe6b3", "#2b4a35", "#36573d", 17, (0.65, 0.55)),
    "settings":     ("#23395b", "#a3c4dc", "#f7fbff", "#4a6481", "#b8916f", "#fff0cc", "#2c4436", "#384f3f", 19, (0.12, 0.42)),
}


def hills(rng, base, amp, color, opacity):
    pts = [(0, H)]
    x = 0
    while x <= W:
        pts.append((x, base + rng.uniform(-amp, amp)))
        x += rng.randint(120, 220)
    pts.append((W, base + rng.uniform(-amp, amp)))
    pts.append((W, H))
    d = "M" + " L".join(f"{px:.0f},{py:.0f}" for px, py in pts) + " Z"
    return f'<path d="{d}" fill="{color}" opacity="{opacity}"/>'


def building(rng, x, w, h, ground, body, win):
    top = ground - h
    parts = [f'<rect x="{x}" y="{top}" width="{w}" height="{h}" fill="{body}"/>']
    # roof line
    parts.append(f'<rect x="{x-4}" y="{top-6}" width="{w+8}" height="8" fill="{body}" opacity="0.85"/>')
    cols = max(2, w // 34)
    rows = max(2, h // 42)
    gw = w / cols
    gh = (h - 20) / rows
    for r in range(rows):
        for c in range(cols):
            if rng.random() < 0.82:
                op = rng.choice([0.35, 0.55, 0.8, 0.95])
                parts.append(
                    f'<rect x="{x + c*gw + gw*0.25:.0f}" y="{top + 14 + r*gh:.0f}" width="{gw*0.5:.0f}" height="{gh*0.55:.0f}" rx="2" fill="{win}" opacity="{op}"/>'
                )
    return "".join(parts)


def tower(x, ground, body, win):
    w, h = 54, 230
    top = ground - h
    return (
        f'<rect x="{x}" y="{top}" width="{w}" height="{h}" fill="{body}"/>'
        f'<polygon points="{x-6},{top} {x+w/2},{top-58} {x+w+6},{top}" fill="{body}"/>'
        f'<circle cx="{x+w/2}" cy="{top+38}" r="16" fill="{win}" opacity="0.9"/>'
        f'<line x1="{x+w/2}" y1="{top+38}" x2="{x+w/2}" y2="{top+28}" stroke="{body}" stroke-width="3"/>'
        f'<line x1="{x+w/2}" y1="{top+38}" x2="{x+w/2+8}" y2="{top+40}" stroke="{body}" stroke-width="3"/>'
    )


def dome(x, ground, body, win):
    w, h = 190, 110
    top = ground - h
    return (
        f'<rect x="{x}" y="{top}" width="{w}" height="{h}" fill="{body}"/>'
        f'<path d="M{x+30},{top} A{w/2-30},{w/2-30} 0 0 1 {x+w-30},{top} Z" fill="{body}"/>'
        + "".join(
            f'<rect x="{x+18+i*34}" y="{top+22}" width="12" height="{h-22}" fill="{win}" opacity="0.5"/>'
            for i in range(5)
        )
    )


def tree(rng, x, ground, color, scale):
    trunk_h = 90 * scale
    parts = [
        f'<path d="M{x},{ground} C{x-4},{ground-trunk_h*0.5} {x+10},{ground-trunk_h*0.8} {x+4},{ground-trunk_h}" stroke="{color}" stroke-width="{7*scale:.1f}" fill="none" stroke-linecap="round"/>'
    ]
    cx, cy = x + 4, ground - trunk_h - 20 * scale
    for _ in range(7):
        parts.append(
            f'<ellipse cx="{cx + rng.uniform(-48, 48)*scale:.0f}" cy="{cy + rng.uniform(-30, 18)*scale:.0f}" rx="{rng.uniform(26, 44)*scale:.0f}" ry="{rng.uniform(16, 26)*scale:.0f}" fill="{color}"/>'
        )
    return "".join(parts)


def scene(name, sky1, sky2, sun, far, body, win, treec, ground, seed, sunpos):
    rng = random.Random(seed)
    g = H - 70
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">',
        f'<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{sky1}"/><stop offset="1" stop-color="{sky2}"/></linearGradient>'
        f'<radialGradient id="g"><stop offset="0" stop-color="{sun}" stop-opacity="0.9"/><stop offset="1" stop-color="{sun}" stop-opacity="0"/></radialGradient></defs>',
        f'<rect width="{W}" height="{H}" fill="url(#s)"/>',
        f'<circle cx="{W*sunpos[0]:.0f}" cy="{H*sunpos[1]:.0f}" r="190" fill="url(#g)"/>',
        f'<circle cx="{W*sunpos[0]:.0f}" cy="{H*sunpos[1]:.0f}" r="46" fill="{sun}"/>',
        hills(rng, g - 150, 30, far, 0.55),
        hills(rng, g - 90, 24, far, 0.85),
    ]
    # campus skyline
    x = rng.randint(-40, 20)
    specials = {rng.randint(1, 3): "tower", rng.randint(4, 6): "dome"}
    i = 0
    while x < W:
        kind = specials.get(i)
        if kind == "tower":
            out.append(tower(x, g, body, win)); x += 54 + rng.randint(14, 30)
        elif kind == "dome":
            out.append(dome(x, g, body, win)); x += 190 + rng.randint(14, 30)
        else:
            w = rng.randint(110, 200); h = rng.randint(90, 170)
            out.append(building(rng, x, w, h, g, body, win)); x += w + rng.randint(10, 40)
        i += 1
    out.append(f'<rect x="0" y="{g}" width="{W}" height="{H-g}" fill="{ground}"/>')
    for _ in range(9):
        out.append(tree(rng, rng.randint(0, W), g + rng.randint(10, 40), treec, rng.uniform(0.8, 1.4)))
    out.append("</svg>")
    return "".join(out)


os.makedirs(OUT, exist_ok=True)
for n, args in SCENES.items():
    with open(os.path.join(OUT, f"{n}.svg"), "w") as f:
        f.write(scene(n, *args))
print("written", len(SCENES))
