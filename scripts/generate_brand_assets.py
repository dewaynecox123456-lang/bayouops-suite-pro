#!/usr/bin/env python3
"""Generate BayouOps brand SVG masters and raster exports."""

from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "brand"
LOGO = BRAND / "logo"
ICONS = BRAND / "icons"
SOCIAL = BRAND / "social"
GUIDES = BRAND / "guidelines"

DATE = "2026-05-28"
DATE_STAMP = "20260528"
RECS = Path("/tmp") / f"BayouOps_Brand_Recommendations_{DATE_STAMP}"

COLORS = {
    "midnight": "#0B1220",
    "navy": "#142033",
    "steel": "#334155",
    "slate": "#64748B",
    "mist": "#E5EDF5",
    "white": "#F8FAFC",
    "teal": "#1FB6A6",
    "cyan": "#38BDF8",
    "copper": "#C47A3A",
    "moss": "#4D7C59",
    "line": "#8FB7C8",
}


def ensure_dirs() -> None:
    for path in (LOGO, ICONS, SOCIAL, GUIDES, RECS):
        path.mkdir(parents=True, exist_ok=True)


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")


def convert(svg: Path, png: Path, size: int | None = None) -> None:
    args = ["magick", "-background", "none"]
    if size:
        args.extend(["-density", "384"])
    args.append(str(svg))
    if size:
        args.extend(["-resize", f"{size}x{size}"])
    args.append(str(png))
    subprocess.run(args, check=True)


def emblem_symbol(
    *,
    stroke: str,
    fill: str = "none",
    accent: str = COLORS["teal"],
    secondary: str = COLORS["cyan"],
    heritage: str = COLORS["copper"],
    include_bg: bool = False,
    bg: str = COLORS["midnight"],
) -> str:
    bg_rect = f'<rect width="512" height="512" rx="72" fill="{bg}"/>' if include_bg else ""
    return f"""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
  <title id="title">BayouOps emblem</title>
  <desc id="desc">Hexagonal operational readiness emblem with radar, telemetry nodes, and a subtle bayou navigation line.</desc>
  {bg_rect}
  <g fill="{fill}" stroke="{stroke}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M256 44 420 139v190L256 468 92 329V139L256 44Z" stroke-width="18"/>
    <path d="M256 83 384 157v149L256 414 128 306V157L256 83Z" stroke-width="8" opacity=".52"/>
    <circle cx="256" cy="256" r="77" stroke-width="12"/>
    <path d="M184 256a72 72 0 0 1 144 0" stroke="{secondary}" stroke-width="10"/>
    <path d="M152 256a104 104 0 0 1 208 0" stroke="{secondary}" stroke-width="7" opacity=".68"/>
    <path d="M120 256a136 136 0 0 1 272 0" stroke="{secondary}" stroke-width="5" opacity=".42"/>
    <path d="M154 315c42-51 82-47 122-7 25 25 54 24 85-4" stroke="{heritage}" stroke-width="12"/>
    <path d="M213 258h86" stroke="{accent}" stroke-width="14"/>
    <path d="M256 215v86" stroke="{accent}" stroke-width="14"/>
    <circle cx="256" cy="256" r="20" fill="{accent}" stroke="none"/>
    <circle cx="154" cy="315" r="11" fill="{heritage}" stroke="none"/>
    <circle cx="361" cy="304" r="11" fill="{heritage}" stroke="none"/>
    <circle cx="159" cy="176" r="9" fill="{stroke}" stroke="none" opacity=".75"/>
    <circle cx="353" cy="176" r="9" fill="{stroke}" stroke="none" opacity=".75"/>
    <path d="M168 176h59M285 176h59M256 110v57M256 345v57" stroke-width="6" opacity=".55"/>
  </g>
</svg>
"""


def logo_lockup(title: str, subtitle: str, *, dark: bool) -> str:
    bg = COLORS["midnight"] if dark else "transparent"
    text = COLORS["white"] if dark else COLORS["midnight"]
    muted = COLORS["line"] if dark else COLORS["steel"]
    emblem = emblem_symbol(stroke=text, accent=COLORS["teal"], secondary=COLORS["cyan"], heritage=COLORS["copper"])
    symbol_inner = emblem.split("<svg", 1)[1].split(">", 1)[1].rsplit("</svg>", 1)[0]
    bg_rect = f'<rect width="1200" height="360" fill="{bg}"/>' if dark else ""
    return f"""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 360" role="img" aria-labelledby="title desc">
  <title id="title">{title}</title>
  <desc id="desc">BayouOps platform lockup for operational infrastructure tooling.</desc>
  {bg_rect}
  <g transform="translate(56 48) scale(.515)">{symbol_inner}</g>
  <g font-family="Inter, Segoe UI, Arial, sans-serif">
    <text x="350" y="158" fill="{text}" font-size="78" font-weight="760" letter-spacing="0">BayouOps</text>
    <text x="354" y="220" fill="{muted}" font-size="32" font-weight="520" letter-spacing="2">{subtitle}</text>
    <path d="M354 248h430" stroke="{COLORS['teal']}" stroke-width="8" stroke-linecap="round"/>
    <path d="M798 248h82" stroke="{COLORS['copper']}" stroke-width="8" stroke-linecap="round"/>
  </g>
</svg>
"""


def recommendation(label: str, number: int, body: str, accent: str, shape: str) -> str:
    mark = emblem_symbol(stroke=COLORS["white"], accent=accent, secondary=COLORS["cyan"], heritage=COLORS["copper"])
    inner = mark.split("<svg", 1)[1].split(">", 1)[1].rsplit("</svg>", 1)[0]
    return f"""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200" role="img" aria-labelledby="title desc">
  <title id="title">BayouOps recommendation {number}</title>
  <desc id="desc">{label} emblem recommendation for BayouOps.</desc>
  <rect width="1600" height="1200" fill="{COLORS['midnight']}"/>
  <path d="M0 880C260 780 402 978 650 858c190-92 302-260 570-196 158 38 262 2 380-74v612H0Z" fill="#101C2D"/>
  <path d="M0 934c280-96 414 72 646-28 222-96 330-266 592-188 135 40 231 10 362-54" fill="none" stroke="{COLORS['copper']}" stroke-width="8" opacity=".65"/>
  <text x="92" y="122" fill="{COLORS['white']}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="58" font-weight="760">BayouOps</text>
  <text x="94" y="176" fill="{COLORS['line']}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="26" font-weight="560" letter-spacing="2">{DATE} / Recommendation {number}</text>
  <text x="94" y="230" fill="{accent}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="34" font-weight="700">{label}</text>
  <g transform="translate(500 236) scale(1.18)">{inner}</g>
  <rect x="92" y="918" width="1416" height="1" fill="{COLORS['steel']}"/>
  <text x="92" y="1000" fill="{COLORS['mist']}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="35" font-weight="650">{shape}</text>
  <text x="92" y="1060" fill="{COLORS['line']}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="27">{body}</text>
</svg>
"""


def docs() -> None:
    write(
        BRAND / "README_branding.md",
        """
# BayouOps Brand Identity

BayouOps uses an industrial modern operational identity built around a hexagonal readiness emblem, telemetry arcs, infrastructure nodes, and a subtle bayou navigation line. The result is technical and field-ready without becoming militarized, tourist-themed, or overdecorated.

## Asset Map

- `logo/`: primary emblem, light and dark lockups, square icon, transparent PNG exports, and product-family subtitle lockups.
- `icons/`: favicon assets and launcher icon concept.
- `social/`: GitHub social banner concept.
- `guidelines/`: color palette, typography recommendations, and recommendation notes.
- `recommendations/`: the three strongest emblem recommendation images.

## Primary Direction

Use `logo/bayouops-emblem-primary.svg` for the core mark and `logo/bayouops-lockup-dark.svg` or `logo/bayouops-lockup-light.svg` when the name needs to travel with the emblem. The emblem is designed to remain recognizable at favicon, launcher, social, documentation, and product-cover sizes.
""",
    )
    write(
        GUIDES / "brand-palette.md",
        f"""
# BayouOps Color Palette

| Token | Hex | Use |
| --- | --- | --- |
| Midnight Ops | `{COLORS['midnight']}` | Dark UI backgrounds, launcher surfaces, social banners |
| Command Navy | `{COLORS['navy']}` | Secondary dark panels and documentation headers |
| Field Steel | `{COLORS['steel']}` | Borders, dividers, secondary UI |
| Signal Teal | `{COLORS['teal']}` | Primary accent, active telemetry, calls to action |
| Readiness Cyan | `{COLORS['cyan']}` | Radar arcs, highlights, links |
| Bayou Copper | `{COLORS['copper']}` | Subtle Southern heritage, navigation path, restrained warmth |
| Live Oak Moss | `{COLORS['moss']}` | Secondary heritage accent, status context |
| Delta Mist | `{COLORS['mist']}` | Light text on dark backgrounds |
| Whitewater | `{COLORS['white']}` | High-contrast text and icon detail |

Use teal and cyan for operational clarity. Use copper sparingly so the Bayou identity is present but quiet.
""",
    )
    write(
        GUIDES / "typography.md",
        """
# Typography Recommendations

Primary UI and brand text: Inter, Segoe UI, or IBM Plex Sans.

Technical labels and export/reporting contexts: IBM Plex Mono, JetBrains Mono, or Cascadia Code.

Recommended usage:

- `BayouOps`: Inter or IBM Plex Sans, 700-800 weight.
- Product subtitles: uppercase Inter, 500-650 weight, generous tracking.
- Reports and tables: IBM Plex Sans for labels, IBM Plex Mono for file paths, command names, and export values.

Avoid novelty display fonts, distressed industrial lettering, military stencil styles, and decorative Southern scripts.
""",
    )
    write(
        GUIDES / "brand-recommendation-notes.md",
        """
# Brand Recommendation Notes

## 1. Readiness Hex

Chosen as the strongest primary system because the hex silhouette feels infrastructure-oriented, scalable, and credible for GitHub, Windows launchers, docs, and paid software listings. The radar arcs communicate operational visibility, while the copper path adds Bayou heritage without tourist styling.

## 2. Field Signal

Chosen for product-family flexibility. It emphasizes telemetry, local-first workflow, and field operations. This direction works well for BayouOps FieldOps, reporting views, and social banners where the brand needs motion and signal without clutter.

## 3. Delta Shield

Chosen as the most trust-forward option. The shield-like geometry helps Windows/Linux readiness, cleanup, audit, and small business IT use cases feel safe and professional without leaning into military aesthetics.
""",
    )


def generate() -> None:
    ensure_dirs()

    write(LOGO / "bayouops-emblem-primary.svg", emblem_symbol(stroke=COLORS["midnight"]))
    write(LOGO / "bayouops-emblem-dark.svg", emblem_symbol(stroke=COLORS["white"]))
    write(LOGO / "bayouops-square-icon.svg", emblem_symbol(stroke=COLORS["white"], include_bg=True))
    write(LOGO / "bayouops-lockup-light.svg", logo_lockup("BayouOps light lockup", "OPERATIONAL READINESS PLATFORM", dark=False))
    write(LOGO / "bayouops-lockup-dark.svg", logo_lockup("BayouOps dark lockup", "OPERATIONAL READINESS PLATFORM", dark=True))

    for product in ("Suite Pro", "Cleanup", "FieldOps", "Audit"):
        slug = product.lower().replace(" ", "-")
        write(LOGO / f"bayouops-{slug}-lockup.svg", logo_lockup(f"BayouOps {product}", product.upper(), dark=False))

    write(ICONS / "favicon.svg", emblem_symbol(stroke=COLORS["white"], include_bg=True))
    write(ICONS / "launcher-icon-concept.svg", emblem_symbol(stroke=COLORS["white"], include_bg=True, bg=COLORS["navy"]))

    write(
        SOCIAL / "github-social-banner.svg",
        f"""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 640" role="img" aria-labelledby="title desc">
  <title id="title">BayouOps GitHub social banner</title>
  <desc id="desc">Dark operational platform banner for BayouOps.</desc>
  <rect width="1280" height="640" fill="{COLORS['midnight']}"/>
  <path d="M0 470c190-62 302 58 474-2 184-64 268-218 488-158 126 34 205 8 318-56v386H0Z" fill="#101C2D"/>
  <path d="M0 508c208-58 322 48 484-14 184-70 272-218 492-150 112 35 195 8 304-54" fill="none" stroke="{COLORS['copper']}" stroke-width="6" opacity=".65"/>
  <g transform="translate(72 116) scale(.62)">
    {emblem_symbol(stroke=COLORS['white'], accent=COLORS['teal'], secondary=COLORS['cyan'], heritage=COLORS['copper']).split('<svg', 1)[1].split('>', 1)[1].rsplit('</svg>', 1)[0]}
  </g>
  <text x="420" y="252" fill="{COLORS['white']}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="86" font-weight="780">BayouOps</text>
  <text x="424" y="310" fill="{COLORS['line']}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="29" font-weight="560">Local-first operational readiness for Windows and Linux.</text>
  <text x="424" y="354" fill="{COLORS['line']}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="25" font-weight="520">Infrastructure exports, field workflows, cleanup, audit, and packaging.</text>
  <text x="424" y="414" fill="{COLORS['teal']}" font-family="IBM Plex Mono, Cascadia Code, Consolas, monospace" font-size="23">exports / field ops / cleanup / audit / packaging</text>
</svg>
""",
    )

    recs = [
        ("Readiness Hex", 1, "Primary system mark for infrastructure readiness, exports, packaging, and paid listings.", COLORS["teal"], "Hex + radar + local navigation line"),
        ("Field Signal", 2, "Best for field operations, telemetry views, and local-first reporting workflows.", COLORS["cyan"], "Circular signal emphasis with operator-ready geometry"),
        ("Delta Shield", 3, "Trust-forward direction for audit, cleanup, Windows readiness, and small business IT users.", COLORS["moss"], "Shield-like resilience with subtle Bayou heritage"),
    ]
    for label, number, body, accent, shape in recs:
        svg = RECS / f"bayouops-recommendation-{number:02d}-{label.lower().replace(' ', '-')}.svg"
        png = RECS / f"bayouops-recommendation-{number:02d}-{label.lower().replace(' ', '-')}.png"
        write(svg, recommendation(label, number, body, accent, shape))
        convert(svg, png)

    docs()

    raster_sources = [
        (LOGO / "bayouops-emblem-primary.svg", LOGO / "bayouops-emblem-primary.png", 1024),
        (LOGO / "bayouops-emblem-dark.svg", LOGO / "bayouops-emblem-dark.png", 1024),
        (LOGO / "bayouops-square-icon.svg", LOGO / "bayouops-square-icon.png", 1024),
        (LOGO / "bayouops-lockup-light.svg", LOGO / "bayouops-lockup-light.png", None),
        (LOGO / "bayouops-lockup-dark.svg", LOGO / "bayouops-lockup-dark.png", None),
        (ICONS / "launcher-icon-concept.svg", ICONS / "launcher-icon-concept.png", 1024),
        (SOCIAL / "github-social-banner.svg", SOCIAL / "github-social-banner.png", None),
    ]

    for svg, png, size in raster_sources:
        convert(svg, png, size)

    for size in (16, 32, 48, 64, 180, 256, 512):
        convert(ICONS / "favicon.svg", ICONS / f"favicon-{size}.png", size)

    subprocess.run(
        [
            "magick",
            str(ICONS / "favicon-16.png"),
            str(ICONS / "favicon-32.png"),
            str(ICONS / "favicon-48.png"),
            str(ICONS / "favicon.ico"),
        ],
        check=True,
    )
    subprocess.run(
        [
            "magick",
            str(ICONS / "favicon-32.png"),
            str(ICONS / "favicon-48.png"),
            str(ICONS / "favicon-256.png"),
            str(ICONS / "launcher-icon-concept.ico"),
        ],
        check=True,
    )


if __name__ == "__main__":
    generate()
