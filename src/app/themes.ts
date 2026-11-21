/**
 * Themes - Harbourline Applicant Portal
 * ──────────────────────────
 * Each theme defines a brand colour, page background, background gradient and nav-bar gradient.
 * The top header (navy + Harbourline University mark) doesn't change between themes.
 */

export interface Theme {
  id: string;
  name: string;
  /** Dark surfaces (dark cards, light text) */
  dark: boolean;
  /** Brand colour - buttons, links, icons */
  brand: string;
  /** Brand hue on hover */
  brandHover: string;
  /** "R,G,B" of the brand colour - for computing transparency tints */
  brandRgb: string;
  /** Page background under the gradient */
  pageBg: string;
  /** The two blob colours in the background */
  blobA: string;
  blobB: string;
  /** Blob intensity - dark themes need more */
  blobOpacity: number;
  /** Nav-bar gradient (the strip under the header) */
  navGradient: string;
  /** Swatch colour in the theme picker */
  swatch: string;
  /**
   * Card colour - when set, the surfaces are dark while the page stays light
   * (the "App" theme). Ink inside the card inverts automatically.
   */
  surface?: string;
  /** Secondary surface inside a dark card (ghost button, inner panel) */
  surfaceInset?: string;
  /**
   * Colourful theme: a different accent hue per page (see accentFor).
   * The keys are the app's page ids.
   */
  accents?: Record<string, PageAccent>;
  /** "Playful" style - rounder corners and coloured shadows */
  playful?: boolean;
}

/** Accent hue for a single page - replaces the brand and background colours */
export interface PageAccent {
  brand: string;
  brandHover: string;
  brandRgb: string;
  blobA: string;
  /** The page's secondary colour - background blobs, heading dot and gradients */
  blobB: string;
  navGradient: string;
  /** Page background in a pastel tint of the accent */
  pageBg?: string;
}

export const THEMES: Theme[] = [
  {
    id: "light",
    name: "Light",
    dark: false,
    // Darker blue - AA contrast with white text and on a white background
    brand: "#006bbf",
    brandHover: "#005ca5",
    brandRgb: "0,107,191",
    pageBg: "#f5f5f7",
    blobA: "#008ff0",
    blobB: "#69c600",
    blobOpacity: 1,
    navGradient:
      "linear-gradient(-11.751deg, rgb(36,83,119) 6%, rgb(19,131,208) 48%, rgb(0,143,240) 102%, rgb(93,184,245) 113%)",
    swatch: "#008ff0",
  },
  // {
  //   // Like the light theme, but cards in the header's navy - like the app
  //   id: "app",
  //   name: "App",
  //   dark: false,
  //   brand: "#008ff0",
  //   brandHover: "#0080d6",
  //   brandRgb: "0,143,240",
  //   pageBg: "#f5f5f7",
  //   blobA: "#008ff0",
  //   blobB: "#69c600",
  //   blobOpacity: 1,
  //   navGradient:
  //     "linear-gradient(-11.751deg, rgb(36,83,119) 6%, rgb(19,131,208) 48%, rgb(0,143,240) 102%, rgb(93,184,245) 113%)",
  //   swatch: "#122736",
  //   surface: "#122736",
  //   surfaceInset: "#1c3346",
  // },
  {
    id: "dark",
    name: "Dark",
    dark: true,
    brand: "#4db4f5",
    brandHover: "#6ec4f8",
    brandRgb: "77,180,245",
    pageBg: "#0c1720",
    blobA: "#1e7fc4",
    blobB: "#2f9c6a",
    blobOpacity: 1.7,
    navGradient:
      "linear-gradient(-11.751deg, rgb(16,34,48) 6%, rgb(20,66,102) 48%, rgb(24,104,158) 102%, rgb(45,138,196) 113%)",
    swatch: "#16242f",
  },
  {
    id: "purple",
    name: "Purple",
    dark: false,
    brand: "#7a5cf0",
    brandHover: "#6a4ce0",
    brandRgb: "122,92,240",
    pageBg: "#f6f4fb",
    blobA: "#7a5cf0",
    blobB: "#d46bd8",
    blobOpacity: 1,
    navGradient:
      "linear-gradient(-11.751deg, rgb(52,40,102) 6%, rgb(88,62,178) 48%, rgb(122,92,240) 102%, rgb(168,140,250) 113%)",
    swatch: "#7a5cf0",
  },
  {
    id: "teal",
    name: "Teal",
    dark: false,
    brand: "#0aa2a2",
    brandHover: "#08908f",
    brandRgb: "10,162,162",
    pageBg: "#f2f8f8",
    blobA: "#0aa2a2",
    blobB: "#69c600",
    blobOpacity: 1,
    navGradient:
      "linear-gradient(-11.751deg, rgb(22,72,74) 6%, rgb(12,124,124) 48%, rgb(10,162,162) 102%, rgb(80,206,198) 113%)",
    swatch: "#0aa2a2",
  },
  {
    id: "sunset",
    name: "Sunset",
    dark: false,
    brand: "#e2622c",
    brandHover: "#cc5623",
    brandRgb: "226,98,44",
    pageBg: "#fcf6f2",
    blobA: "#e2622c",
    blobB: "#f0a92c",
    blobOpacity: 1,
    navGradient:
      "linear-gradient(-11.751deg, rgb(94,45,28) 6%, rgb(178,74,36) 48%, rgb(226,98,44) 102%, rgb(244,158,86) 113%)",
    swatch: "#e2622c",
  },
  {
    id: "rose",
    name: "Pink",
    dark: false,
    brand: "#d63b73",
    brandHover: "#c02f64",
    brandRgb: "214,59,115",
    pageBg: "#fcf3f7",
    blobA: "#d63b73",
    blobB: "#8d5cf0",
    blobOpacity: 1,
    navGradient:
      "linear-gradient(-11.751deg, rgb(92,32,58) 6%, rgb(166,44,88) 48%, rgb(214,59,115) 102%, rgb(240,124,166) 113%)",
    swatch: "#d63b73",
  },
  {
    // A colourful, relaxed theme - each page has its own hue
    id: "playful",
    name: "Colourful",
    dark: false,
    playful: true,
    brand: "#7c5cf5",
    brandHover: "#6a49e8",
    brandRgb: "124,92,245",
    pageBg: "#f6f2ff",
    blobA: "#7c5cf5",
    blobB: "#ffb02e",
    blobOpacity: 3.2,
    navGradient: navGradient("#7c5cf5"),
    swatch: "#7c5cf5",
    accents: {
      profile: accent(
        "#7c5cf5",
        "#6a49e8",
        "124,92,245",
        "#ff8fc7",
        "#f3edff",
      ),
      appointments: accent(
        "#ff7a1a",
        "#ec6a0c",
        "255,122,26",
        "#ffcf3f",
        "#fff3e6",
      ),
      tasks: accent(
        "#00b3c7",
        "#009cad",
        "0,179,199",
        "#69c600",
        "#e8fafd",
      ),
      interestsForm: accent(
        "#00b3c7",
        "#009cad",
        "0,179,199",
        "#69c600",
        "#e8fafd",
      ),
      learnings: accent(
        "#2eb872",
        "#25a463",
        "46,184,114",
        "#ffcf3f",
        "#eafaf1",
      ),
      inquiries: accent(
        "#e6398b",
        "#d02c7c",
        "230,57,139",
        "#8b5cf6",
        "#fdedf5",
      ),
      messages: accent(
        "#2f80ed",
        "#2570d4",
        "47,128,237",
        "#00d0c0",
        "#eaf2ff",
      ),
      settings: accent(
        "#8b5cf6",
        "#7a4bea",
        "139,92,246",
        "#ff8fc7",
        "#f5f0ff",
      ),
    },
  },
];

/** Nav-bar gradient in a given hue - in the same language as the other themes */
function navGradient(color: string) {
  return `linear-gradient(-11.751deg, ${mix(color, 0.45)} 6%, ${mix(color, 0.8)} 48%, ${color} 102%, ${mix(color, 1.35)} 113%)`;
}

/** Darkens/lightens a hex colour by a given ratio (1 = unchanged) */
function mix(hex: string, ratio: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) =>
    Math.max(0, Math.min(255, Math.round(c * ratio))),
  );
  return `rgb(${ch.join(",")})`;
}

function accent(
  brand: string,
  brandHover: string,
  brandRgb: string,
  blobB: string,
  pageBg: string,
): PageAccent {
  return {
    brand,
    brandHover,
    brandRgb,
    blobA: brand,
    blobB,
    pageBg,
    navGradient: navGradient(brand),
  };
}

export const DEFAULT_THEME = THEMES[0];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}

/**
 * The current page's hue - in the colourful theme each page has its own hue,
 * and in the other themes the theme's own colours are returned.
 */
export function accentFor(theme: Theme, page: string): PageAccent {
  return (
    theme.accents?.[page] ?? {
      brand: theme.brand,
      brandHover: theme.brandHover,
      brandRgb: theme.brandRgb,
      blobA: theme.blobA,
      blobB: theme.blobB,
      navGradient: theme.navGradient,
    }
  );
}

/** The page background gradient - blurred blobs in the theme colours */
function heroGradientSvg(
  theme: Theme,
  blueOffsetX: number,
  blobScale: number,
  blobOpacityScale: number,
  accent?: PageAccent,
  /** The white rings and bottom blob - hidden in the details check chat, where the reply area sits at the bottom */
  rings = true,
) {
  const o = blobOpacityScale * theme.blobOpacity;
  const blobA = accent?.blobA ?? theme.blobA;
  const blobB = accent?.blobB ?? theme.blobB;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <defs>
    <filter id="blob-blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
    <linearGradient id="line-fade-bottom" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${theme.dark ? 0.03 : 0.35}" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="line-fade-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${theme.dark ? 0.018 : 0.18}" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
  </defs>
  <g filter="url(#blob-blur)">
    <ellipse cx="380" cy="530" rx="${250 * blobScale}" ry="${200 * blobScale}" fill="${blobA}" opacity="${0.16 * o}" />
    <ellipse cx="${1180 + blueOffsetX}" cy="340" rx="${340 * blobScale}" ry="${270 * blobScale}" fill="${blobA}" opacity="${0.18 * o}" />
    ${rings ? `<ellipse cx="600" cy="750" rx="${150 * blobScale}" ry="${120 * blobScale}" fill="${blobB}" opacity="${0.2 * o}" />` : ""}
  </g>
  ${
    rings
      ? `<g stroke-width="140" fill="none">
    <circle cx="130" cy="520" r="260" stroke="url(#line-fade-bottom)" />
    <circle cx="${1260 + blueOffsetX}" cy="380" r="260" stroke="url(#line-fade-top)" />
  </g>`
      : ""
  }
</svg>`.trim();
}

export function heroGradientBg(
  theme: Theme,
  blueOffsetX: number,
  blobScale: number,
  blobOpacityScale: number,
  accent?: PageAccent,
  /** The white rings and bottom blob - hidden in the details check chat, where the reply area sits at the bottom */
  rings = true,
) {
  return `url("data:image/svg+xml,${encodeURIComponent(
    heroGradientSvg(
      theme,
      blueOffsetX,
      blobScale,
      blobOpacityScale,
      accent,
      rings,
    ),
  )}")`;
}

/** The CSS variables the theme injects at the root */
export function themeVars(
  theme: Theme,
  accent?: PageAccent,
): React.CSSProperties {
  return {
    "--brand": accent?.brand ?? theme.brand,
    "--brand-hover": accent?.brandHover ?? theme.brandHover,
    "--brand-rgb": accent?.brandRgb ?? theme.brandRgb,
    // The secondary colour - used by the colourful theme only
    "--accent-2": accent?.blobB ?? theme.blobB,
    ...(theme.surface ? { "--surface": theme.surface } : {}),
    ...(theme.surfaceInset
      ? { "--surface-inset": theme.surfaceInset }
      : {}),
  } as React.CSSProperties;
}
